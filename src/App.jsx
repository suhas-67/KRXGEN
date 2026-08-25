import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'

// 3D Visualizer Component
import SolarPanel from './components/SolarPanel'

// HelioSense Diagnostics & Intelligence Services
import { getSolarWeather } from './services/weatherService'
import { calculatePhysicsBaseline } from './services/physicsEngine'
import { SoilingKalmanFilter } from './services/kalmanFilter'
import { diagnoseArrayHealth } from './services/faultFingerprint'
import { calculateEconomicDispatch } from './services/economicDispatcher'
import { calculateThermalRisk } from './services/thermalEstimator'
import { generateSoilingForecast } from './services/soilingForecaster'

// UI Components
import Header from './components/Header'
import KpiMetrics from './components/KpiMetrics'
import TelemetryChart from './components/TelemetryChart'
import StringHeatmap from './components/StringHeatmap'
import ScenarioDrawer from './components/ScenarioDrawer'
import SdgModal from './components/SdgModal'
import WorkOrderModal from './components/WorkOrderModal'

import './App.css'

/* =========================================================
   NATURAL MULTI-WEEK PARTICULATE ACCRETION MODEL
   ========================================================= */
export function calculateDustLossFromDays(day) {
  if (day <= 1) return 0;
  // Particulate deposition accretion rate (~1.35% / day):
  // Day 1: 0% (Pristine clean)
  // Day 7 (Week 1): ~8%
  // Day 14 (Week 2): ~18%
  // Day 21 (Week 3): ~27% (Exceeds cleaning cost threshold -> Wash order triggered)
  // Day 28 (Week 4): ~37%
  return Math.min(48, Math.round((day - 1) * 1.35));
}

export default function App() {
  /* =====================================================
     SIMULATION STATE & CONTROLS
     ===================================================== */
  const [simulationDay, setSimulationDay] = useState(14) // Day 1 to 28 (Multi-week timeline)
  const [soilingLossPct, setSoilingLossPct] = useState(18) // Automatically computed from simulationDay
  const [hasDiodeFault, setHasDiodeFault] = useState(false)
  const [hasRainEvent, setHasRainEvent] = useState(false)
  const [tariffRate, setTariffRate] = useState(7.5)
  const [cleaningCost, setCleaningCost] = useState(200.0)

  const [activePreset, setActivePreset] = useState('soiling')
  const [viewMode, setViewMode] = useState('split') // 'split' | '3d' | 'analytics'
  const [selectedPanel, setSelectedPanel] = useState(null)
  const [selectedHour, setSelectedHour] = useState(12)
  const [isSdgOpen, setIsSdgOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(true)
  const [washToast, setWashToast] = useState(null)
  const [isCleaning, setIsCleaning] = useState(false)
  const [isWorkOrderOpen, setIsWorkOrderOpen] = useState(false)
  const [isWaitingForTechReply, setIsWaitingForTechReply] = useState(false)
  const [diagnosis, setDiagnosis] = useState({ status: 'HEALTHY', severity: 'healthy', title: 'System Initializing', message: 'Loading telemetry...', badge: 'STANDBY' })
  
  // Toggle to include live weather rain forecast in dispatch decisions
  const [useLiveWeather, setUseLiveWeather] = useState(false)

  // Weather data container
  const [weatherState, setWeatherState] = useState({
    isLive: false,
    records: [],
  })

  /* =====================================================
     FETCH WEATHER (OPEN-METEO OR FALLBACK)
     ===================================================== */
  useEffect(() => {
    let isMounted = true

    async function loadWeather() {
      const data = await getSolarWeather(10.7905, 78.7047)
      if (isMounted) {
        setWeatherState(data)
      }
    }

    loadWeather()
    return () => {
      isMounted = false
    }
  }, [])

  /* =====================================================
     TELEGRAM POLLING ENGINE
     ===================================================== */
  useEffect(() => {
    let intervalId;
    if (isWaitingForTechReply) {
      const botToken = "8820953577:AAGOl8xF0tzaucTszeqOSVcjRtLHGdlQlXU"
      const chatId = "8361047625"
      let lastProcessedUpdateId = null;

      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);
          const data = await res.json();
          if (data.ok && data.result.length > 0) {
            if (lastProcessedUpdateId === null) {
              // Ignore historical messages on first poll
              lastProcessedUpdateId = data.result[data.result.length - 1].update_id;
              return;
            }

            for (const update of data.result) {
              if (update.update_id > lastProcessedUpdateId && update.message?.text) {
                lastProcessedUpdateId = update.update_id;
                const text = update.message.text.trim().toLowerCase();
                
                if (text === 'yes' || text.includes('yes')) {
                  setIsWaitingForTechReply(false);
                  setIsCleaning(true);
                  setSimulationDay(1);
                  setSoilingLossPct(0);
                  setHasDiodeFault(false);
                  setActivePreset('clean');
                  setWashToast("✅ Technician accepted dispatch! Initiating autonomous wash sequence...");
                  setTimeout(() => setWashToast(null), 5000);
                  
                  // Send confirmation back to Telegram
                  fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: chatId,
                      text: "✅ Wash command received! Executing autonomous panel wash..."
                    })
                  });
                  break;
                }
              }
            }
          }
        } catch (e) {
          console.error("Telegram polling error", e);
        }
      }, 3000); // Poll every 3 seconds
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    }
  }, [isWaitingForTechReply]);

  /* =====================================================
     3D SOLAR ARRAY PANEL LAYOUT (15 PANELS: 3x5 GRID)
     ===================================================== */
  const panelPositions = useMemo(() => {
    return Array.from({ length: 15 }, (_, index) => [
      (index % 3 - 1) * 4.5, // 3 columns
      0.8,                    // Height
      (Math.floor(index / 3) - 2) * 3.3, // 5 rows
    ])
  }, [])

  // Panels affected by soiling
  const soiledPanels = useMemo(() => {
    if (soilingLossPct === 0) return new Set()
    // When soiling is active, distribute dust across array
    const set = new Set()
    const count = Math.min(15, Math.ceil((soilingLossPct / 50) * 15))
    for (let i = 0; i < count; i++) {
      set.add(i)
    }
    return set
  }, [soilingLossPct])

  const soilingLevels = useMemo(() => {
    const levels = {}
    soiledPanels.forEach((index) => {
      levels[index] = Math.min(100, Math.round(soilingLossPct * (1.1 + 0.2 * Math.sin(index))))
    })
    return levels
  }, [soiledPanels, soilingLossPct])

  /* =====================================================
     PHYSICS ENGINE & SIMULATION PIPELINE
     ===================================================== */
  const { simRecords, currentHourData, soilingIndex, economicDispatch, soilingForecast } = useMemo(() => {
    if (!weatherState.records || weatherState.records.length === 0) {
      return {
        simRecords: [],
        currentHourData: null,
        soilingIndex: 1.0,
        economicDispatch: { dailyEnergyLossKwh: 0, dailyRevenueLost: 0, weeklyRevenueLost: 0, weeklyNetProfit: 0, decision: 'HOLD', decisionBadge: 'STANDBY', decisionClass: 'healthy', explanation: '', dailyCarbonDebtKg: 0, totalCleaningExpense: 250 },
        soilingForecast: []
      }
    }

    // 1. Calculate theoretical clean baseline using pvlib / 1-diode model
    const physicsBaseline = calculatePhysicsBaseline(weatherState.records, {
      arrayCapacityKw: 5.0,
    })

    // 2. Synthesize actual telemetry incorporating soiling attenuation & diode faults
    const soilingFactor = Math.max(0, 1.0 - soilingLossPct / 100.0)
    const kf = new SoilingKalmanFilter({ initialSi: 1.0 })
    let computedSi = 1.0

    const processedRecords = physicsBaseline.map((record) => {
      // Allow live weather rain probability to suppress wash if enabled
      const rainProb = hasRainEvent ? 90 : (useLiveWeather ? record.rain_prob : 0);
      const rainMm = hasRainEvent ? 6.5 : (useLiveWeather ? record.rain_mm : 0);

      // 2a. PIML Corrected Clean Baseline:
      // The naive physics model (record.p_modeled_kw) doesn't fully account for wind cooling or Incidence Angle Modifier (IAM) losses.
      // The ML model corrects this to predict the TRUE clean theoretical output.
      // We simulate naive physics overpredicting by ~3.5% at solar noon.
      const hour = record.hour ?? 12;
      const mlCorrectionFactor = 1.0 - (0.035 * Math.max(0, Math.sin(Math.PI * (hour - 6) / 12)));
      const pPimlKw = record.p_modeled_kw * mlCorrectionFactor;
      const iTrueClean = record.i_modeled * mlCorrectionFactor;

      // 2b. Synthesize actual telemetry from the TRUE PIML CLEAN state (not naive physics)
      // Current derate due to dust
      const iActual = iTrueClean * soilingFactor

      // Voltage derate: String 2 drops by 33.3% if bypass diode fault active
      const voltageFactor = hasDiodeFault ? 0.667 : 1.0
      const vActual = record.v_modeled * voltageFactor

      // Inverter AC output kW
      const pActualKw = (vActual * iActual) / 1000.0

      // Update Kalman Filter
      const diffuseRatio = record.ghi > 0 ? record.dhi / record.ghi : 0.2
      const stepSi = kf.update(pActualKw, record.p_modeled_kw, diffuseRatio)

      // Use mid-day solar hour (12:00) as primary representative SI
      if (record.hour === 12 || (record.hour >= 11 && record.hour <= 14 && record.p_modeled_kw > 1.0)) {
        computedSi = stepSi
      }

      return {
        ...record,
        rain_prob: rainProb,
        rain_mm: rainMm,
        i_actual: Math.round(iActual * 100) / 100,
        v_actual: Math.round(vActual * 10) / 10,
        p_actual_kw: Math.round(pActualKw * 100) / 100,
        p_piml_kw: Math.round(pPimlKw * 100) / 100,
        soiling_index: Math.round(stepSi * 1000) / 1000,
      }
    })

    // If night or unassigned, compute final SI
    if (computedSi === 1.0 && soilingLossPct > 0) {
      computedSi = Math.max(0.0, 1.0 - soilingLossPct / 100.0)
    }

    // 3. Find representative midday hour or user-selected hour
    const currHour = processedRecords.find((r) => r.hour === selectedHour) || processedRecords[12] || processedRecords[0]

    // 4. Run Opportunity-Aware Economic Dispatch Solver
    const dispatch = calculateEconomicDispatch(processedRecords, {
      tariffRatePerKwh: tariffRate,
      cleaningCost,
      waterCost: 50.0,
    })
    
    // 5. Soiling Forecast
    const forecast = generateSoilingForecast(computedSi, 48)

    return {
      simRecords: processedRecords,
      currentHourData: currHour,
      soilingIndex: computedSi,
      economicDispatch: dispatch,
      soilingForecast: forecast
    }
  }, [weatherState, soilingLossPct, hasDiodeFault, hasRainEvent, tariffRate, cleaningCost, selectedHour])

  /* =====================================================
     ASYNC DIAGNOSIS INFERENCE (RENDER ML BACKEND)
     ===================================================== */
  useEffect(() => {
    if (!currentHourData) return;

    let isSubscribed = true;

    async function fetchDiagnosis() {
      const diag = await diagnoseArrayHealth(
        {
          vActual: currentHourData.v_actual,
          iActual: currentHourData.i_actual,
          pActual: currentHourData.p_actual_kw,
          hasDiodeFault,
        },
        {
          vModeled: currentHourData.v_modeled,
          iModeled: currentHourData.i_modeled,
          pModeled: currentHourData.p_modeled_kw,
        },
        soilingIndex,
        {
          poa: currentHourData.poa_global ?? currentHourData.ghi ?? 750,
          tempCell: currentHourData.temp_cell ?? 40,
        }
      );
      if (isSubscribed) {
        setDiagnosis(diag);
      }
    }

    fetchDiagnosis();

    return () => {
      isSubscribed = false;
    };
  }, [currentHourData, hasDiodeFault, soilingIndex]);

  /* =====================================================
     SIMULATION DAY & DUST ACCRETION HANDLER
     ===================================================== */
  const handleSetSimulationDay = useCallback((day) => {
    const clampedDay = Math.max(1, Math.min(28, day));
    setSimulationDay(clampedDay);
    const computedLoss = calculateDustLossFromDays(clampedDay);
    setSoilingLossPct(computedLoss);
  }, []);

  /* =====================================================
     PRESET APPLIERS
     ===================================================== */
  const handleApplyPreset = useCallback((preset) => {
    setActivePreset(preset)
    if (preset === 'clean') {
      handleSetSimulationDay(1)
      setHasDiodeFault(false)
      setHasRainEvent(false)
    } else if (preset === 'soiling') {
      handleSetSimulationDay(21) // 3 weeks accumulated dust
      setHasDiodeFault(false)
      setHasRainEvent(false)
    } else if (preset === 'diode') {
      handleSetSimulationDay(4)
      setHasDiodeFault(true)
      setHasRainEvent(false)
    } else if (preset === 'rain') {
      handleSetSimulationDay(16)
      setHasDiodeFault(false)
      setHasRainEvent(true)
    }
  }, [handleSetSimulationDay])

  /* =====================================================
     SIMULATE WASH PANELS ACTION
     ===================================================== */
  const handleWashPanels = useCallback(() => {
    if (isCleaning || soilingLossPct === 0) return;
    
    setIsCleaning(true);
    const startPct = soilingLossPct;
    const duration = 2000; // 2 seconds for a nice visual wash effect
    const startTime = performance.now();
    const savedAmount = (economicDispatch.weeklyRevenueLost || 180.0).toFixed(2);

    const animateCleaning = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentPct = startPct * (1 - easeOut);
      
      setSoilingLossPct(currentPct);

      if (progress < 1) {
        requestAnimationFrame(animateCleaning);
      } else {
        setSimulationDay(1);
        setSoilingLossPct(0);
        setActivePreset('clean');
        setIsCleaning(false);
        setWashToast(`✨ Panels Washed! Array restored to Day 1 Clean Baseline (SI = 1.00, Recovering ~₹${savedAmount}/wk)`);
        setTimeout(() => setWashToast(null), 5000);
      }
    };

    requestAnimationFrame(animateCleaning);
  }, [soilingLossPct, economicDispatch, isCleaning]);

  // 4. Compute Thermal Risk for the current hour
  const thermalState = useMemo(() => {
    if (!currentHourData) return null;
    
    // String 2 panels are at index 5-9. If bypass diode fault is active, they are faulted.
    return calculateThermalRisk(
      currentHourData.i_actual, 
      currentHourData.temp_amb || 35.0, 
      hasDiodeFault
    );
  }, [currentHourData, hasDiodeFault]);

  // 5. Dynamic 3D Sun Elevation Angle & Atmospheric Lighting based on selectedHour (6 AM to 6 PM)
  const sunLighting = useMemo(() => {
    const hr = Math.max(6, Math.min(18, selectedHour));
    const solarFraction = (hr - 6) / 12; // 0 (6 AM) -> 0.5 (12 PM Noon) -> 1.0 (6 PM)
    const solarElevationRad = Math.sin(solarFraction * Math.PI);
    const solarAzimuthRad = solarFraction * Math.PI;

    const x = -16 * Math.cos(solarAzimuthRad); // -16 (East) -> 0 (South) -> 16 (West)
    const y = Math.max(1.8, 16 * solarElevationRad); // 1.8 (Horizon) -> 16 (Zenith) -> 1.8
    const z = 8 - 4 * Math.sin(solarAzimuthRad);

    const isNoon = Math.abs(hr - 12) <= 2;
    const isLowSun = hr <= 8 || hr >= 16;
    
    let lightColor = '#ffffff';
    let lightIntensity = 2.8 * Math.max(0.25, solarElevationRad);
    let ambientIntensity = 0.35 + 0.25 * solarElevationRad;

    if (isLowSun) {
      lightColor = hr < 12 ? '#fed7aa' : '#fdba74'; // warm golden dawn / dusk
    } else if (isNoon) {
      lightColor = '#f0f9ff'; // bright noon daylight
    }

    return {
      position: [x, y, z],
      color: lightColor,
      intensity: lightIntensity,
      ambientIntensity: ambientIntensity,
      elevationDeg: Math.round(solarElevationRad * 75), // 0° to 75° altitude angle
      azimuthStr: hr < 12 ? 'East (Dawn)' : hr === 12 ? 'Zenith (Solar Noon)' : 'West (Dusk)',
      timeStr: hr === 12 ? '12:00 PM (Noon)' : hr < 12 ? `${hr}:00 AM` : `${hr - 12}:00 PM`
    };
  }, [selectedHour]);

  // 5. Download Scope-2 ESG Verifiable Audit Report
  const handleDownloadEsgAudit = useCallback(() => {
    const data = JSON.stringify({
      auditStandard: "GHG Protocol Scope 2 Guidance (Market & Location-based)",
      reportingEntity: "HelioSense Enterprise PV Surveillance",
      facilityId: "SOLAR-ARRAY-001 (Tamil Nadu, India)",
      timestamp: new Date().toISOString(),
      gridEmissionFactor: "0.72 kg CO2e / kWh (CEA India v19 Standard)",
      energyMetrics: {
        arrayCapacityKw: 5.0,
        currentHour: currentHourData?.hour ?? 12,
        dailyEnergyLossKwh: economicDispatch?.dailyEnergyLossKwh || 0,
        weeklyEnergyLossKwh: (economicDispatch?.dailyEnergyLossKwh || 0) * 7,
        soilingIndex: soilingIndex,
        soilingLossPercentage: soilingLossPct,
      },
      carbonDebtMetrics: {
        dailyAvoidableCarbonDebtKg: economicDispatch?.dailyCarbonDebtKg || 0,
        weeklyProjectedCarbonDebtKg: (economicDispatch?.dailyCarbonDebtKg || 0) * 7,
        annualizedCarbonImpactTonnes: ((economicDispatch?.dailyCarbonDebtKg || 0) * 365 / 1000).toFixed(2),
        remediationStatus: economicDispatch?.decision === 'DISPATCH' ? 'REMEDIATION_REQUIRED' : 'COMPLIANT'
      },
      diagnosticAudit: {
        primaryDiagnosis: diagnosis?.status || 'HEALTHY',
        confidenceScore: `${diagnosis?.confidence || 100}%`,
        featureAttributions: diagnosis?.featureAttributions || 'Nominal irradiance tracking',
      }
    }, null, 2);

    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Scope2-ESG-Carbon-Audit-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [economicDispatch, soilingIndex, soilingLossPct, currentHourData, diagnosis]);

  return (
    <div className="heliosense-app">
      {/* Top HUD Header */}
      <Header
        isLiveWeather={weatherState.isLive}
        currentWeather={currentHourData}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenSdg={() => setIsSdgOpen(true)}
        onDownloadEsgAudit={handleDownloadEsgAudit}
        useLiveWeather={useLiveWeather}
        setUseLiveWeather={setUseLiveWeather}
      />

      {/* Main Workspace Layout */}
      <div className="main-layout">
        {/* Left/Collapsible Live Scenario Toolbar */}
        <ScenarioDrawer
          simulationDay={simulationDay}
          setSimulationDay={handleSetSimulationDay}
          soilingLossPct={soilingLossPct}
          setSoilingLossPct={(val) => {
            setSoilingLossPct(val)
            setActivePreset('custom')
          }}
          hasDiodeFault={hasDiodeFault}
          setHasDiodeFault={(val) => {
            setHasDiodeFault(val)
            setActivePreset('custom')
          }}
          hasRainEvent={hasRainEvent}
          setHasRainEvent={(val) => {
            setHasRainEvent(val)
            setActivePreset('custom')
          }}
          tariffRate={tariffRate}
          setTariffRate={setTariffRate}
          cleaningCost={cleaningCost}
          setCleaningCost={setCleaningCost}
          onWashPanels={handleWashPanels}
          activePreset={activePreset}
          onApplyPreset={handleApplyPreset}
          isOpen={isDrawerOpen}
          setIsOpen={setIsDrawerOpen}
          diagnosis={diagnosis}
          isCleaning={isCleaning}
          economicDispatch={economicDispatch}
        />

        {/* Central Operations Stage */}
        <main className={`operations-stage ${!isDrawerOpen ? 'drawer-closed' : ''} ${economicDispatch.decision === 'DISPATCH' ? 'system-dispatch-active' : ''}`}>
          {/* Unmissable High-Priority Dispatch Banner */}
          {economicDispatch.decision === 'DISPATCH' && (
            <div className="dispatch-alert-banner">
              <div className="dispatch-banner-left">
                <span className="dispatch-siren-pulse">🚨</span>
                <div className="dispatch-banner-text">
                  <div className="dispatch-banner-heading">
                    CRITICAL ECONOMIC DISPATCH: WASH ORDER TRIGGERED
                  </div>
                  <div className="dispatch-banner-sub">
                    Weekly dust loss (<strong>₹{(economicDispatch.weeklyRevenueLost || 0).toFixed(2)}</strong>) has exceeded cleaning cost (<strong>₹{(economicDispatch.totalCleaningExpense || 250).toFixed(2)}</strong>). Immediate wash recommended (ROI: <strong>+₹{Math.max(0, economicDispatch.weeklyNetProfit || 0).toFixed(2)}/wk</strong>).
                  </div>
                </div>
              </div>
              <button 
                className="dispatch-banner-action-btn"
                onClick={handleWashPanels}
                disabled={isCleaning}
              >
                {isCleaning ? '⏳ Washing Array...' : '🧼 Execute Panel Wash'}
              </button>
            </div>
          )}
          {/* Top KPI Summary Banner */}
          <KpiMetrics
            soilingIndex={soilingIndex}
            diagnosis={diagnosis}
            economicDispatch={economicDispatch}
            soilingLossPct={soilingLossPct}
            currentHourData={currentHourData}
            onOpenDispatchModal={() => setIsWorkOrderOpen(true)}
            onDownloadEsgAudit={handleDownloadEsgAudit}
          />

          {/* Dynamic View Mode Content */}
          <div className={`view-container mode-${viewMode}`}>
            {/* 3D Digital Twin View */}
            {(viewMode === 'split' || viewMode === '3d') && (
              <div className="digital-twin-panel">
                <div className="twin-badge-overlay">
                  <span className="twin-tag">3D DIGITAL TWIN • 15 PANELS (3 STRINGS)</span>
                  <span className="twin-hint">☀️ Sun: {sunLighting.elevationDeg}° Alt • {sunLighting.azimuthStr}</span>
                </div>

                <div className="canvas-wrapper">
                  <Canvas
                    shadows
                    dpr={[1, 1.5]}
                    camera={{ position: [10, 11, 13], fov: 46 }}
                  >
                    <Environment preset="sunset" />
                    <directionalLight
                      castShadow
                      position={sunLighting.position}
                      intensity={sunLighting.intensity}
                      color={sunLighting.color}
                      shadow-mapSize-width={1024}
                      shadow-mapSize-height={1024}
                    />
                    <ambientLight intensity={sunLighting.ambientIntensity} />

                    {/* 15 Solar Panels with Live Soiling & Fault Highlights */}
                    {panelPositions.map((position, index) => {
                      const isSoiled = soiledPanels.has(index)
                      const isString2 = index >= 5 && index <= 9
                      const isPanelFaulted = hasDiodeFault && isString2
                      const isSelected = selectedPanel === index

                      return (
                        <SolarPanel
                          key={index}
                          position={position}
                          covered={isSoiled}
                          soilingLevel={soilingLevels[index] || (isSoiled ? soilingLossPct : 0)}
                          isFaulty={isPanelFaulted}
                          isSelected={isSelected}
                          panelId={index}
                          thermalState={isPanelFaulted ? thermalState : null}
                          onClick={(id) => setSelectedPanel(selectedPanel === id ? null : id)}
                        />
                      )
                    })}

                    {/* Cyberpunk Dark Ground & Shadow */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.32, 0]} receiveShadow>
                      <planeGeometry args={[32, 32]} />
                      <meshStandardMaterial color="#0b111a" roughness={0.9} />
                    </mesh>

                    <ContactShadows
                      frames={1}
                      position={[0, -1.30, 0]}
                      opacity={0.7}
                      scale={22}
                      blur={2.5}
                      far={12}
                    />

                    <gridHelper args={[32, 32, '#1e2e42', '#0d1824']} position={[0, -1.30, 0]} />
                    <OrbitControls
                      enableDamping
                      dampingFactor={0.08}
                      minDistance={6}
                      maxDistance={30}
                      maxPolarAngle={Math.PI / 2.05}
                    />
                  </Canvas>
                </div>
              </div>
            )}

            {/* Analytics & Telemetry Charts */}
            {(viewMode === 'split' || viewMode === 'analytics') && (
              <div className="analytics-panel">
                <TelemetryChart
                  simRecords={simRecords}
                  selectedHour={selectedHour}
                  setSelectedHour={setSelectedHour}
                  simulationDay={simulationDay}
                  setSimulationDay={handleSetSimulationDay}
                  diagnosis={diagnosis}
                  soilingIndex={soilingIndex}
                  soilingLossPct={soilingLossPct}
                  soilingForecast={soilingForecast}
                />
                <StringHeatmap
                  soiledPanels={soiledPanels}
                  soilingLevels={soilingLevels}
                  hasDiodeFault={hasDiodeFault}
                  selectedPanel={selectedPanel}
                  setSelectedPanel={setSelectedPanel}
                  diagnosis={diagnosis}
                  soilingIndex={soilingIndex}
                  currentHourData={currentHourData}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Floating Panel Wash Toast */}
      {washToast && (
        <div className="floating-toast">
          <span>{washToast}</span>
          <button onClick={() => setWashToast(null)}>✕</button>
        </div>
      )}

      {/* Waiting for Tech Toast Notification */}
      {isWaitingForTechReply && !washToast && (
        <div className="floating-toast" style={{ backgroundColor: '#2563eb', border: '1px solid #3b82f6', color: 'white' }}>
          <span>⏳ Waiting for technician to reply "yes" on Telegram...</span>
          <button onClick={() => setIsWaitingForTechReply(false)}>✕</button>
        </div>
      )}

      {/* UN SDGs Presentation & Modals */}
      <SdgModal isOpen={isSdgOpen} onClose={() => setIsSdgOpen(false)} />
      
      <WorkOrderModal 
        isOpen={isWorkOrderOpen}
        onClose={() => setIsWorkOrderOpen(false)}
        economicDispatch={economicDispatch}
        diagnosis={diagnosis}
        thermalState={thermalState}
        soilingLossPct={soilingLossPct}
        onDispatchSuccess={() => setIsWaitingForTechReply(true)}
      />
    </div>
  )
}
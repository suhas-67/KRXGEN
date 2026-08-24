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

// UI Components
import Header from './components/Header'
import KpiMetrics from './components/KpiMetrics'
import TelemetryChart from './components/TelemetryChart'
import StringHeatmap from './components/StringHeatmap'
import ScenarioDrawer from './components/ScenarioDrawer'
import SdgModal from './components/SdgModal'

import './App.css'

export default function App() {
  /* =====================================================
     SIMULATION STATE & CONTROLS
     ===================================================== */
  const [soilingLossPct, setSoilingLossPct] = useState(20)
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
  const { simRecords, currentHourData, soilingIndex, diagnosis, economicDispatch } = useMemo(() => {
    if (!weatherState.records || weatherState.records.length === 0) {
      return {
        simRecords: [],
        currentHourData: null,
        soilingIndex: 1.0,
        diagnosis: { status: 'HEALTHY', severity: 'healthy', title: 'System Initializing', message: 'Loading telemetry...', badge: 'STANDBY' },
        economicDispatch: { dailyEnergyLossKwh: 0, dailyRevenueLost: 0, weeklyRevenueLost: 0, weeklyNetProfit: 0, decision: 'HOLD', decisionBadge: 'STANDBY', decisionClass: 'healthy', explanation: '' },
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
      // If rain event preset is active, inject 80% rain prob
      const rainProb = hasRainEvent ? 85 : record.rain_prob
      const rainMm = hasRainEvent ? 6.5 : record.rain_mm

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

    // 4. Run Fault Fingerprinting Matrix & PIML Inference
    const diag = diagnoseArrayHealth(
      {
        vActual: currHour.v_actual,
        iActual: currHour.i_actual,
        pActual: currHour.p_actual_kw,
        hasDiodeFault,
      },
      {
        vModeled: currHour.v_modeled,
        iModeled: currHour.i_modeled,
        pModeled: currHour.p_modeled_kw,
      },
      computedSi,
      {
        poa: currHour.poa_global ?? currHour.ghi ?? 750,
        tempCell: currHour.temp_cell ?? 40,
      }
    )

    // 5. Run Opportunity-Aware Economic Dispatch Solver
    const dispatch = calculateEconomicDispatch(processedRecords, {
      tariffRatePerKwh: tariffRate,
      cleaningCost,
      waterCost: 50.0,
    })

    return {
      simRecords: processedRecords,
      currentHourData: currHour,
      soilingIndex: computedSi,
      diagnosis: diag,
      economicDispatch: dispatch,
    }
  }, [weatherState, soilingLossPct, hasDiodeFault, hasRainEvent, tariffRate, cleaningCost, selectedHour])

  /* =====================================================
     PRESET APPLIERS
     ===================================================== */
  const handleApplyPreset = useCallback((preset) => {
    setActivePreset(preset)
    if (preset === 'clean') {
      setSoilingLossPct(0)
      setHasDiodeFault(false)
      setHasRainEvent(false)
    } else if (preset === 'soiling') {
      setSoilingLossPct(25)
      setHasDiodeFault(false)
      setHasRainEvent(false)
    } else if (preset === 'diode') {
      setSoilingLossPct(5)
      setHasDiodeFault(true)
      setHasRainEvent(false)
    } else if (preset === 'rain') {
      setSoilingLossPct(20)
      setHasDiodeFault(false)
      setHasRainEvent(true)
    }
  }, [])

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
        setSoilingLossPct(0);
        setActivePreset('clean');
        setIsCleaning(false);
        setWashToast(`✨ Panels Washed! Soiling Index restored to 1.00 (Recovering ~₹${savedAmount}/wk)`);
        setTimeout(() => setWashToast(null), 5000);
      }
    };

    requestAnimationFrame(animateCleaning);
  }, [soilingLossPct, economicDispatch, isCleaning]);

  return (
    <div className="heliosense-app">
      {/* Top HUD Header */}
      <Header
        isLiveWeather={weatherState.isLive}
        currentWeather={currentHourData}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenSdg={() => setIsSdgOpen(true)}
        economicDispatch={economicDispatch}
      />

      {/* Main Workspace Layout */}
      <div className="main-layout">
        {/* Left/Collapsible Live Scenario Toolbar */}
        <ScenarioDrawer
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
                    Weekly dust loss (<strong>₹{economicDispatch.weeklyRevenueLost.toFixed(2)}</strong>) has exceeded cleaning cost (<strong>₹{economicDispatch.totalCleaningExpense.toFixed(2)}</strong>). Immediate wash recommended (ROI: <strong>+₹{Math.max(0, economicDispatch.weeklyNetProfit).toFixed(2)}/wk</strong>).
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
          />

          {/* Dynamic View Mode Content */}
          <div className={`view-container mode-${viewMode}`}>
            {/* 3D Digital Twin View */}
            {(viewMode === 'split' || viewMode === '3d') && (
              <div className="digital-twin-panel">
                <div className="twin-badge-overlay">
                  <span className="twin-tag">3D DIGITAL TWIN • 15 PANELS (3 STRINGS)</span>
                  <span className="twin-hint">🖱️ Left click: Rotate • Right click: Pan • Scroll: Zoom</span>
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
                      position={[5, 10, 5]}
                      intensity={2.8}
                      shadow-mapSize-width={1024}
                      shadow-mapSize-height={1024}
                    />
                    <ambientLight intensity={0.4} />

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
                  diagnosis={diagnosis}
                  soilingIndex={soilingIndex}
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

      {/* UN SDGs Presentation Modal */}
      <SdgModal isOpen={isSdgOpen} onClose={() => setIsSdgOpen(false)} />
    </div>
  )
}
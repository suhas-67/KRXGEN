import React from 'react'

export default function ScenarioDrawer({
  simulationDay = 14,
  setSimulationDay,
  soilingLossPct,
  setSoilingLossPct,
  hasDiodeFault,
  setHasDiodeFault,
  hasRainEvent,
  setHasRainEvent,
  tariffRate,
  setTariffRate,
  cleaningCost,
  setCleaningCost,
  onWashPanels,
  activePreset,
  onApplyPreset,
  isOpen,
  setIsOpen,
  diagnosis,
  isCleaning,
  economicDispatch,
}) {
  const isDispatchAlert = economicDispatch?.decision === 'DISPATCH'
  const fv = {
    vRatio: typeof diagnosis?.featureVector?.vRatio === 'number' ? diagnosis.featureVector.vRatio : 1.0,
    iRatio: typeof diagnosis?.featureVector?.iRatio === 'number' ? diagnosis.featureVector.iRatio : 1.0,
    pRatio: typeof diagnosis?.featureVector?.pRatio === 'number' ? diagnosis.featureVector.pRatio : 1.0,
    pResidualKw: typeof diagnosis?.featureVector?.pResidualKw === 'number' ? diagnosis.featureVector.pResidualKw : 0.0,
  }
  const [showAiDetails, setShowAiDetails] = React.useState(true)

  return (
    <aside className={`scenario-drawer ${isOpen ? 'open' : 'closed'}`}>
      <div className="drawer-header">
        <div className="drawer-title-row">
          <span className="drawer-icon">🎛️</span>
          <h2 className="drawer-title">Scenario & Fault Injector</h2>
        </div>
        <button
          className="drawer-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? 'Collapse Panel' : 'Expand Simulation Controls'}
        >
          {isOpen ? '◀ Hide' : '▶ Controls'}
        </button>
      </div>

      {isOpen && (
        <div className="drawer-content">
          {/* Quick Preset Buttons */}
          <div className="drawer-section">
            <label className="section-label">⚡ JUDGE DEMO PRESETS</label>
            <div className="preset-grid">
              <button
                className={`preset-card ${activePreset === 'clean' ? 'active' : ''}`}
                onClick={() => onApplyPreset('clean')}
              >
                <span className="preset-icon">🌿</span>
                <strong>Clean Baseline</strong>
                <small>Day 1: SI = 1.00 (Clean)</small>
              </button>
              <button
                className={`preset-card ${activePreset === 'soiling' ? 'active' : ''}`}
                onClick={() => onApplyPreset('soiling')}
              >
                <span className="preset-icon">💨</span>
                <strong>3 Weeks Dust</strong>
                <small>Day 21: 27% Soiling Loss</small>
              </button>
              <button
                className={`preset-card ${activePreset === 'diode' ? 'active' : ''}`}
                onClick={() => onApplyPreset('diode')}
              >
                <span className="preset-icon">⚡</span>
                <strong>Diode Blown</strong>
                <small>33% Drop on Str 2</small>
              </button>
              <button
                className={`preset-card ${activePreset === 'rain' ? 'active' : ''}`}
                onClick={() => onApplyPreset('rain')}
              >
                <span className="preset-icon">🌧️</span>
                <strong>Rain Override</strong>
                <small>Auto Free Wash</small>
              </button>
            </div>
          </div>

          {/* Primary Action: Wash Panels */}
          <div className="drawer-section">
            <button 
              className={`wash-panels-btn ${isCleaning ? 'cleaning' : ''}`} 
              onClick={onWashPanels}
              disabled={isCleaning || soilingLossPct === 0}
            >
              <span className="wash-btn-icon">{isCleaning ? '⏳' : '🧼'}</span>
              <div>
                <strong>{isCleaning ? 'Washing Panels...' : 'Wash Panels (Simulate Cleaning)'}</strong>
                <small>{isCleaning ? 'Applying high-pressure wash' : 'Resets SI to 1.0 & restores full generation'}</small>
              </div>
            </button>
          </div>

          {/* AI Feature Vector & Attribution Card */}
          <div className="drawer-section">
            <div
              className="slider-header"
              style={{ cursor: 'pointer' }}
              onClick={() => setShowAiDetails(!showAiDetails)}
            >
              <label className="section-label">🤖 AI FEATURE VECTOR (z_t) & ATTRIBUTION</label>
              <span className="slider-val-badge" style={{ color: '#00d2ff', fontSize: '10px' }}>
                {showAiDetails ? '▼ Hide' : '▲ View'}
              </span>
            </div>

            {showAiDetails && (
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(0, 210, 255, 0.25)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '11px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '4px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Active Model:</span>
                  <strong style={{ color: '#38bdf8' }}>PIML Ensemble (100 Trees)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Voltage Ratio (V_act / V_mod):</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: fv.vRatio < 0.8 ? '#ff4d6d' : 'var(--text-main)' }}>
                    {fv.vRatio.toFixed(3)}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Current Ratio (I_act / I_mod):</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: fv.iRatio < 0.9 ? '#fbbf24' : 'var(--text-main)' }}>
                    {fv.iRatio.toFixed(3)}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Residual Loss (P_mod - P_act):</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: '#f59e0b' }}>
                    {fv.pResidualKw.toFixed(3)} kW
                  </strong>
                </div>
                <div style={{ marginTop: '2px', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontSize: '10px' }}>
                  💡 <strong>Attribution:</strong> {diagnosis?.featureAttributions || 'Nominal tracking within physics limits'}
                </div>
              </div>
            )}
          </div>

          {/* Autonomous Multi-Week Accretion Slider */}
          <div className="drawer-section">
            <div className="slider-header">
              <label className="section-label">AUTONOMOUS DUST ACCRETION</label>
              <span className="slider-val-badge">Day {simulationDay} ({soilingLossPct}% Loss)</span>
            </div>
            <input
              type="range"
              min="1"
              max="28"
              step="1"
              value={simulationDay}
              onChange={(e) => setSimulationDay(Number(e.target.value))}
              className="range-slider"
            />
            <div className="slider-ticks">
              <span>Day 1 (Clean)</span>
              <span>Day 14 (Wk 2)</span>
              <span>Day 21 (Wk 3)</span>
              <span>Day 28 (Wk 4)</span>
            </div>
          </div>

          {/* Hardware & Weather Toggles */}
          <div className="drawer-section">
            <label className="section-label">ANOMALY & ATMOSPHERIC TOGGLES</label>
            
            <label className="toggle-row">
              <div className="toggle-text">
                <strong>Inject Bypass Diode Failure (Str 2)</strong>
                <small>Forces 33.3% voltage step-drop</small>
              </div>
              <input
                type="checkbox"
                checked={hasDiodeFault}
                onChange={(e) => setHasDiodeFault(e.target.checked)}
                className="custom-checkbox"
              />
            </label>

            <label className="toggle-row">
              <div className="toggle-text">
                <strong>Simulate 72h Rain Event (&gt;5mm)</strong>
                <small>Triggers natural cleaning override</small>
              </div>
              <input
                type="checkbox"
                checked={hasRainEvent}
                onChange={(e) => setHasRainEvent(e.target.checked)}
                className="custom-checkbox"
              />
            </label>
          </div>

          {/* Economic Parameters */}
          <div className="drawer-section">
            <label className="section-label">ECONOMIC DISPATCH PARAMETERS</label>

            <div className="input-row">
              <label>Grid Tariff (₹/kWh):</label>
              <input
                type="number"
                step="0.5"
                min="2.0"
                max="20.0"
                value={tariffRate}
                onChange={(e) => setTariffRate(Number(e.target.value))}
                className="num-input"
              />
            </div>

            <div className="input-row">
              <label>Cleaning Service Fee (₹):</label>
              <input
                type="number"
                step="50"
                min="100"
                max="3000"
                value={cleaningCost}
                onChange={(e) => setCleaningCost(Number(e.target.value))}
                className="num-input"
              />
            </div>
          </div>

          {/* System Specs Footer */}
          <div className="drawer-footer-specs">
            <div className="spec-item">
              <span>Array Size:</span>
              <strong>15 Panels (5.0 kW DC)</strong>
            </div>
            <div className="spec-item">
              <span>Strings:</span>
              <strong>3 Parallel Strings</strong>
            </div>
            <div className="spec-item">
              <span>Physics Engine:</span>
              <strong>pvlib 1-Diode + Sandia</strong>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

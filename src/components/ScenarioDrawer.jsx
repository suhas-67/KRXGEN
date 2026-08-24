import React from 'react'

export default function ScenarioDrawer({
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
}) {
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
                <small>SI = 0.99 (Healthy)</small>
              </button>
              <button
                className={`preset-card ${activePreset === 'soiling' ? 'active' : ''}`}
                onClick={() => onApplyPreset('soiling')}
              >
                <span className="preset-icon">💨</span>
                <strong>Severe Dust</strong>
                <small>25% Soiling Loss</small>
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
            <button className="wash-panels-btn" onClick={onWashPanels}>
              <span className="wash-btn-icon">🧼</span>
              <div>
                <strong>Wash Panels (Simulate Cleaning)</strong>
                <small>Resets SI to 1.0 & restores full generation</small>
              </div>
            </button>
          </div>

          {/* Soiling Slider */}
          <div className="drawer-section">
            <div className="slider-header">
              <label className="section-label">SURFACE DUST ACCUMULATION</label>
              <span className="slider-val-badge">{soilingLossPct}% Loss</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={soilingLossPct}
              onChange={(e) => setSoilingLossPct(Number(e.target.value))}
              className="range-slider"
            />
            <div className="slider-ticks">
              <span>0% (Clean)</span>
              <span>25% (Dusty)</span>
              <span>50% (Heavy)</span>
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
              <label>Grid Tariff ($/kWh):</label>
              <input
                type="number"
                step="0.01"
                min="0.05"
                max="0.60"
                value={tariffRate}
                onChange={(e) => setTariffRate(Number(e.target.value))}
                className="num-input"
              />
            </div>

            <div className="input-row">
              <label>Cleaning Service Fee ($):</label>
              <input
                type="number"
                step="5"
                min="10"
                max="200"
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

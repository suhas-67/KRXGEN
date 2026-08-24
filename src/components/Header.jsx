import React from 'react'

export default function Header({
  isLiveWeather,
  currentWeather,
  viewMode,
  setViewMode,
  onOpenSdg,
  economicDispatch,
}) {
  const isDispatchAlert = economicDispatch?.decision === 'DISPATCH'

  return (
    <header className={`heliosense-header ${isDispatchAlert ? 'header-dispatch-blink' : ''}`}>
      <div className="header-left">
        <div className="brand-badge">
          <span className="brand-icon">☀️</span>
          <div className="brand-text">
            <div className="brand-title-row">
              <h1 className="brand-title">HELIOSENSE</h1>
              <span className="badge-chip zero-capex">₹0 CAPEX</span>
              <span className="badge-chip ai-virtual">PIML VIRTUAL SENSOR</span>
              {isDispatchAlert && (
                <span className="badge-chip dispatch-alert-chip">
                  🚨 WASH DISPATCH ACTIVE
                </span>
              )}
            </div>
            <p className="brand-subtitle">
              Physics-Informed Solar PV Soiling & Fault Diagnostic Platform • <span className="team-highlight">Team LOCALHOST</span>
            </p>
          </div>
        </div>
      </div>

      <div className="header-right">
        {/* Live Dispatch Pill if active */}
        {isDispatchAlert && (
          <div className="header-dispatch-pill">
            <span className="pulse-dot-red"></span>
            <strong>DISPATCH CLEANING: LOSS &gt; COST</strong>
          </div>
        )}

        {/* Live Weather Status Pill */}
        <div className="weather-status-pill">
          <span className={`live-dot ${isLiveWeather ? 'live' : 'fallback'}`}></span>
          <div className="weather-meta">
            <span className="weather-title">
              {isLiveWeather ? 'LIVE SATELLITE (Open-Meteo / NASA)' : 'OFFLINE CLEAR-SKY'}
            </span>
            <span className="weather-values">
              {currentWeather ? `${Math.round(currentWeather.ghi)} W/m² • ${Math.round(currentWeather.temp_amb)}°C` : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="view-mode-toggle">
          <button
            className={`view-toggle-btn ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => setViewMode('split')}
            title="Split 3D Digital Twin and Analytics"
          >
            🪟 Split
          </button>
          <button
            className={`view-toggle-btn ${viewMode === '3d' ? 'active' : ''}`}
            onClick={() => setViewMode('3d')}
            title="Full 3D Solar Twin"
          >
            🌐 3D Twin
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'analytics' ? 'active' : ''}`}
            onClick={() => setViewMode('analytics')}
            title="Telemetry Analytics Dashboard"
          >
            📊 Analytics
          </button>
        </div>

        {/* SDG Modal Button */}
        <button className="sdg-btn" onClick={onOpenSdg}>
          🌍 UN SDGs
        </button>
      </div>
    </header>
  )
}

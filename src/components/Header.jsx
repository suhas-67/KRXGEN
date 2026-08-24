import React from 'react'

export default function Header({
  isLiveWeather,
  currentWeather,
  viewMode,
  setViewMode,
  onOpenSdg,
  onApplyPreset,
  activePreset,
}) {
  return (
    <header className="heliosense-header">
      <div className="header-left">
        <div className="brand-badge">
          <span className="brand-icon">☀️</span>
          <div className="brand-text">
            <div className="brand-title-row">
              <h1 className="brand-title">HELIOSENSE</h1>
              <span className="badge-chip zero-capex">$0 CAPEX</span>
              <span className="badge-chip ai-virtual">AI VIRTUAL SENSOR</span>
            </div>
            <p className="brand-subtitle">
              Physics-Informed Solar PV Soiling & Fault Diagnostic Platform • <span className="team-highlight">Team LOCALHOST</span>
            </p>
          </div>
        </div>
      </div>

      <div className="header-center">
        <div className="presets-bar">
          <span className="preset-label">SCENARIO:</span>
          <button
            className={`preset-btn ${activePreset === 'clean' ? 'active' : ''}`}
            onClick={() => onApplyPreset('clean')}
          >
            🌿 Clean (1.00)
          </button>
          <button
            className={`preset-btn ${activePreset === 'soiling' ? 'active' : ''}`}
            onClick={() => onApplyPreset('soiling')}
          >
            💨 25% Dust
          </button>
          <button
            className={`preset-btn ${activePreset === 'diode' ? 'active' : ''}`}
            onClick={() => onApplyPreset('diode')}
          >
            ⚡ Diode Fault (Str 2)
          </button>
          <button
            className={`preset-btn ${activePreset === 'rain' ? 'active' : ''}`}
            onClick={() => onApplyPreset('rain')}
          >
            🌧️ Rain Override
          </button>
        </div>
      </div>

      <div className="header-right">
        {/* Live Weather Status Pill */}
        <div className="weather-status-pill">
          <span className={`live-dot ${isLiveWeather ? 'live' : 'fallback'}`}></span>
          <div className="weather-meta">
            <span className="weather-title">
              {isLiveWeather ? 'LIVE SATELLITE (Open-Meteo)' : 'OFFLINE CLEAR-SKY'}
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
            🪟 Split View
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

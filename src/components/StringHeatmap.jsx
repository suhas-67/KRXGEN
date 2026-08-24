import React from 'react'

export default function StringHeatmap({
  soiledPanels,
  soilingLevels,
  hasDiodeFault,
  selectedPanel,
  setSelectedPanel,
  diagnosis,
  soilingIndex,
  currentHourData,
}) {
  // Organize 15 panels into 3 strings of 5 panels each
  const strings = [
    { id: 1, name: 'String 1 (East Array)', panels: [0, 1, 2, 3, 4] },
    { id: 2, name: 'String 2 (Center Array)', panels: [5, 6, 7, 8, 9] },
    { id: 3, name: 'String 3 (West Array)', panels: [10, 11, 12, 13, 14] },
  ]

  const vModeled = currentHourData?.v_modeled ?? 480
  const iModeled = currentHourData?.i_modeled ?? 10.4

  return (
    <div className="string-heatmap-card">
      <div className="heatmap-header">
        <div>
          <h3 className="heatmap-title">String-Level Health Matrix & Anomaly Heatmap</h3>
          <span className="heatmap-subtitle">Real-time multi-string electrical balancing and localized bypass diode tracking</span>
        </div>
        <div className="legend-pills">
          <span className="legend-pill clean">● Clean</span>
          <span className="legend-pill soiled">● Soiled</span>
          <span className="legend-pill faulted">● Diode Fault</span>
        </div>
      </div>

      <div className="strings-grid">
        {strings.map((str) => {
          const isFaultyString = str.id === 2 && hasDiodeFault
          const strVoltage = isFaultyString ? vModeled * 0.667 : vModeled
          const strCurrent = iModeled * soilingIndex
          const strPower = (strVoltage * strCurrent) / 1000

          return (
            <div key={str.id} className={`string-box ${isFaultyString ? 'faulty-string-box' : ''}`}>
              <div className="string-box-header">
                <div className="string-title-row">
                  <span className="string-name">{str.name}</span>
                  {isFaultyString ? (
                    <span className="string-badge fault-badge">🚨 BYPASS DIODE SHORT (-33% V)</span>
                  ) : soilingIndex < 0.85 ? (
                    <span className="string-badge dust-badge">💨 SOILING ATTENUATION</span>
                  ) : (
                    <span className="string-badge ok-badge">✅ BALANCED</span>
                  )}
                </div>

                <div className="string-telemetry-row">
                  <div className="tel-item">
                    <span className="tel-label">Voltage (Vmp)</span>
                    <strong className={`tel-val ${isFaultyString ? 'red-text' : ''}`}>{strVoltage.toFixed(1)} V</strong>
                  </div>
                  <div className="tel-item">
                    <span className="tel-label">Current (Imp)</span>
                    <strong className="tel-val">{strCurrent.toFixed(2)} A</strong>
                  </div>
                  <div className="tel-item">
                    <span className="tel-label">Yield (Pac)</span>
                    <strong className="tel-val">{strPower.toFixed(2)} kW</strong>
                  </div>
                </div>
              </div>

              {/* 5 Panels in this string */}
              <div className="panels-row">
                {str.panels.map((pIndex) => {
                  const isSoiled = soiledPanels.has(pIndex)
                  const isPanelFaulted = isFaultyString
                  const isSelected = selectedPanel === pIndex
                  const dustLvl = soilingLevels[pIndex] || 0

                  let statusClass = 'panel-clean'
                  if (isPanelFaulted) statusClass = 'panel-faulted'
                  else if (isSoiled) statusClass = 'panel-soiled'

                  return (
                    <button
                      key={pIndex}
                      className={`panel-chip ${statusClass} ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedPanel(isSelected ? null : pIndex)}
                      title={`Panel #${pIndex + 1} - ${isPanelFaulted ? 'Bypass Diode Fault' : isSoiled ? `${dustLvl}% Dust` : 'Clean'}`}
                    >
                      <span className="panel-num">P-{pIndex + 1}</span>
                      <span className="panel-status-icon">
                        {isPanelFaulted ? '⚡' : isSoiled ? '💨' : '✨'}
                      </span>
                      <span className="panel-dust-val">
                        {isPanelFaulted ? '-33% V' : isSoiled ? `${dustLvl}%` : '100%'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected Panel Inspector Tray */}
      {selectedPanel !== null && (
        <div className="panel-inspector-tray">
          <div className="tray-left">
            <span className="tray-icon">🔍</span>
            <div>
              <strong>Panel #{selectedPanel + 1} Diagnostic Telemetry</strong>
              <span className="tray-details">
                {selectedPanel >= 5 && selectedPanel <= 9 && hasDiodeFault
                  ? 'Hardware Anomaly: Sub-string 2 bypass diode active. Voltage suppressed to 66.7% of nominal.'
                  : soiledPanels.has(selectedPanel)
                  ? `Soiling Transmission Loss: Estimated dust film density at ${soilingLevels[selectedPanel] || 0}%.`
                  : 'Nominal Condition: Clean surface transmittance, 0 bypass activations.'}
              </span>
            </div>
          </div>
          <button className="tray-close-btn" onClick={() => setSelectedPanel(null)}>✕ Close</button>
        </div>
      )}
    </div>
  )
}

import React, { useState, useMemo } from 'react'

export default function TelemetryChart({ simRecords, selectedHour, setSelectedHour, diagnosis, soilingIndex }) {
  const [metricTab, setMetricTab] = useState('power') // 'power' | 'voltage' | 'current' | 'weather'
  const [hoveredIndex, setHoveredIndex] = useState(null)

  // Chart dimensions
  const width = 800
  const height = 280
  const padding = { top: 30, right: 30, bottom: 40, left: 55 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  // Prepare series data based on selected tab
  const chartData = useMemo(() => {
    if (!simRecords || simRecords.length === 0) return { series: [], maxVal: 1, unit: 'kW' }

    let maxVal = 0.1
    let unit = 'kW'
    let labelActual = 'Actual DC Power'
    let labelModeled = 'Clean Physics Baseline'

    const series = simRecords.map((r, i) => {
      let act = 0
      let mod = 0
      let piml = null

      if (metricTab === 'power') {
        act = r.p_actual_kw ?? 0
        mod = r.p_modeled_kw ?? 0
        
        // PIML Virtual Sensor: AI predicts the TRUE CLEAN output by correcting 
        // the naive physics model's unmodeled thermal and angular (IAM) losses.
        piml = r.p_piml_kw ?? (mod * 0.98); // Fallback to 2% drop if missing
        
        unit = 'kW'
        labelActual = 'Actual Measured Output (Pac)'
        labelModeled = 'Naive Physics Baseline (Theoretical)'
      } else if (metricTab === 'voltage') {
        act = r.v_actual ?? 0
        mod = r.v_modeled ?? 0
        unit = 'V'
        labelActual = 'Actual MPPT Voltage (Vmp)'
        labelModeled = 'Modeled Voltage (Vmod)'
      } else if (metricTab === 'current') {
        act = r.i_actual ?? 0
        mod = r.i_modeled ?? 0
        unit = 'A'
        labelActual = 'Actual String Current (Imp)'
        labelModeled = 'Modeled Current (Imod)'
      } else if (metricTab === 'residual') {
        act = Math.max(0, (r.p_modeled_kw ?? 0) - (r.p_actual_kw ?? 0))
        mod = r.p_modeled_kw ?? 0
        unit = 'kW'
        labelActual = 'PIML Residual Loss (ΔP)'
        labelModeled = 'Clean Baseline (Pmod)'
      } else {
        act = r.poa_global ?? r.ghi ?? 0
        mod = r.temp_cell ?? 25
        unit = 'W/m² & °C'
        labelActual = 'POA Irradiance (W/m²)'
        labelModeled = 'Cell Temp (°C)'
      }

      if (act > maxVal) maxVal = act
      if (mod > maxVal) maxVal = mod
      if (piml !== null && piml > maxVal) maxVal = piml

      return {
        hour: r.hour ?? i,
        timeStr: `${r.hour ?? i}:00`,
        actual: act,
        modeled: mod,
        piml: piml,
        record: r,
      }
    })

    // Add 10% ceiling
    maxVal = Math.ceil(maxVal * 1.15 * 10) / 10
    if (maxVal === 0) maxVal = 1

    return { series, maxVal, unit, labelActual, labelModeled }
  }, [simRecords, metricTab, diagnosis, soilingIndex])

  // Coordinate mapping functions
  const getX = (index) => padding.left + (index / Math.max(1, chartData.series.length - 1)) * chartW
  const getY = (val) => padding.top + chartH - (val / chartData.maxVal) * chartH

  // Build SVG Path strings
  const actualPath = useMemo(() => {
    if (!chartData.series.length) return ''
    return chartData.series.reduce((path, pt, i) => {
      const x = getX(i)
      const y = getY(pt.actual)
      return i === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`
    }, '')
  }, [chartData])

  const actualAreaPath = useMemo(() => {
    if (!chartData.series.length) return ''
    const basePath = actualPath
    const firstX = getX(0)
    const lastX = getX(chartData.series.length - 1)
    const bottomY = padding.top + chartH
    return `${basePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`
  }, [chartData, actualPath])

  const modeledPath = useMemo(() => {
    if (!chartData.series.length) return ''
    return chartData.series.reduce((path, pt, i) => {
      const x = getX(i)
      const y = getY(pt.modeled)
      return i === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`
    }, '')
  }, [chartData])

  const pimlPath = useMemo(() => {
    if (!chartData.series.length || metricTab !== 'power') return ''
    return chartData.series.reduce((path, pt, i) => {
      const x = getX(i)
      const y = getY(pt.piml)
      return i === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`
    }, '')
  }, [chartData, metricTab])

  const activeHover = hoveredIndex !== null ? chartData.series[hoveredIndex] : null

  return (
    <div className="telemetry-chart-container">
      {/* Chart Header & Tab Bar */}
      <div className="chart-header">
        <div className="chart-title-wrap">
          <h3 className="chart-title">24-Hour Telemetry vs. Physics Theoretical Baseline</h3>
          <span className="chart-subtitle">Real-time comparison of measured inverter telemetry against Sandia & 1-diode physics expectations</span>
        </div>

        <div className="chart-tabs">
          <button
            className={`chart-tab ${metricTab === 'power' ? 'active' : ''}`}
            onClick={() => setMetricTab('power')}
          >
            ⚡ Power (kW)
          </button>
          <button
            className={`chart-tab ${metricTab === 'residual' ? 'active' : ''}`}
            onClick={() => setMetricTab('residual')}
          >
            📉 PIML Residual (kW)
          </button>
          <button
            className={`chart-tab ${metricTab === 'voltage' ? 'active' : ''}`}
            onClick={() => setMetricTab('voltage')}
          >
            🔋 Voltage (V)
          </button>
          <button
            className={`chart-tab ${metricTab === 'current' ? 'active' : ''}`}
            onClick={() => setMetricTab('current')}
          >
            🔌 Current (A)
          </button>
          <button
            className={`chart-tab ${metricTab === 'weather' ? 'active' : ''}`}
            onClick={() => setMetricTab('weather')}
          >
            ☀️ Irradiance & Temp
          </button>
        </div>
      </div>

      {/* Main SVG Visualization */}
      <div className="svg-wrapper">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="telemetry-svg"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            {/* Blue Gradient for Actual Power Area */}
            <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00c8ff" stopOpacity="0.45" />
              <stop offset="75%" stopColor="#0055ff" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#0055ff" stopOpacity="0.0" />
            </linearGradient>

            {/* Grid Line Pattern */}
            <pattern id="gridLines" width="40" height="40" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="40" y2="0" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              <line x1="0" y1="0" x2="0" y2="40" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Grid Background */}
          <rect
            x={padding.left}
            y={padding.top}
            width={chartW}
            height={chartH}
            fill="url(#gridLines)"
          />

          {/* Horizontal Axis Ticks */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const val = chartData.maxVal * (1 - pct)
            const y = padding.top + chartH * pct
            return (
              <g key={idx} className="axis-grid-row">
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartW}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="#78889b"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  {val >= 10 ? val.toFixed(0) : val.toFixed(1)} {chartData.unit}
                </text>
              </g>
            )
          })}

          {/* Time Labels on X-Axis */}
          {chartData.series.map((pt, i) => {
            if (i % 3 !== 0 && i !== chartData.series.length - 1) return null
            const x = getX(i)
            return (
              <g key={`xlabel-${i}`}>
                <line
                  x1={x}
                  y1={padding.top + chartH}
                  x2={x}
                  y2={padding.top + chartH + 6}
                  stroke="#405065"
                />
                <text
                  x={x}
                  y={padding.top + chartH + 20}
                  textAnchor="middle"
                  fill="#78889b"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  {pt.timeStr}
                </text>
              </g>
            )
          })}

          {/* Area Fill for Actual Generation */}
          <path d={actualAreaPath} fill="url(#actualGradient)" />

          {/* Theoretical Modeled Baseline Line (Emerald Dashed) */}
          <path
            d={modeledPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            strokeLinecap="round"
          />

          {/* Actual Power Line (Cyan/Blue Solid) */}
          <path
            d={actualPath}
            fill="none"
            stroke="#00c8ff"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* AI ML Corrected Prediction (PIML) */}
          {metricTab === 'power' && pimlPath && (
            <path
              d={pimlPath}
              fill="none"
              stroke="#d946ef"
              strokeWidth="2.5"
              strokeDasharray="5 3"
              strokeLinecap="round"
            />
          )}

          {/* Interactive Mouse Hover Overlay Columns */}
          {chartData.series.map((pt, i) => {
            const x = getX(i)
            const colWidth = chartW / chartData.series.length
            return (
              <rect
                key={`hovercol-${i}`}
                x={x - colWidth / 2}
                y={padding.top}
                width={colWidth}
                height={chartH}
                fill="transparent"
                style={{ cursor: 'crosshair' }}
                onMouseEnter={() => {
                  setHoveredIndex(i)
                  if (setSelectedHour) setSelectedHour(pt.hour)
                }}
              />
            )
          })}

          {/* Active Hover Crosshair and Markers */}
          {hoveredIndex !== null && activeHover && (
            <g>
              <line
                x1={getX(hoveredIndex)}
                y1={padding.top}
                x2={getX(hoveredIndex)}
                y2={padding.top + chartH}
                stroke="rgba(255,255,255,0.4)"
                strokeDasharray="2 2"
              />
              {/* Point on Modeled Line */}
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(activeHover.modeled)}
                r="5"
                fill="#10b981"
                stroke="#fff"
                strokeWidth="2"
              />
              {/* Point on Actual Line */}
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(activeHover.actual)}
                r="6"
                fill="#00c8ff"
                stroke="#fff"
                strokeWidth="2"
              />
              {/* Point on PIML Line */}
              {metricTab === 'power' && activeHover.piml !== null && (
                <circle
                  cx={getX(hoveredIndex)}
                  cy={getY(activeHover.piml)}
                  r="5"
                  fill="#d946ef"
                  stroke="#fff"
                  strokeWidth="2"
                />
              )}
            </g>
          )}
        </svg>

        {/* Floating Tooltip Box */}
        {activeHover && hoveredIndex !== null && (
          <div
            className="chart-tooltip"
            style={{
              left: `${Math.min(85, Math.max(15, (getX(hoveredIndex) / width) * 100))}%`,
              top: '15px',
            }}
          >
            <div className="tooltip-header">
              <span className="tooltip-time">🕒 Hour {activeHover.timeStr} (UTC)</span>
              <span className="tooltip-irrad">GHI: {Math.round(activeHover.record?.ghi ?? 0)} W/m²</span>
            </div>
            <div className="tooltip-row emerald-text">
              <span>● {chartData.labelModeled}:</span>
              <strong>{activeHover.modeled.toFixed(2)} {chartData.unit}</strong>
            </div>
            <div className="tooltip-row cyan-text">
              <span>● {chartData.labelActual}:</span>
              <strong>{activeHover.actual.toFixed(2)} {chartData.unit}</strong>
            </div>
            {metricTab === 'power' && activeHover.piml !== null && (
              <div className="tooltip-row" style={{ color: '#d946ef' }}>
                <span>● AI ML True Clean Baseline:</span>
                <strong>{activeHover.piml.toFixed(2)} {chartData.unit}</strong>
              </div>
            )}
            {activeHover.modeled > 0.05 && (
              <div className="tooltip-delta">
                Yield Gap: <span className="delta-neg">-{Math.max(0, Math.round((1 - activeHover.actual / activeHover.modeled) * 100))}%</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart Footer Legend */}
      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-line solid-cyan"></span>
          <span>Actual Telemetry Output (Measured)</span>
        </div>
        {metricTab === 'power' && (
          <div className="legend-item">
            <span className="legend-line" style={{ borderBottom: '2.5px dashed #d946ef', width: '16px', display: 'inline-block' }}></span>
            <span style={{ color: '#d946ef', fontWeight: 'bold' }}>AI ML True Clean Baseline</span>
          </div>
        )}
        <div className="legend-item">
          <span className="legend-line dashed-emerald"></span>
          <span>Physics Clean Baseline (1-Diode pvlib Model)</span>
        </div>
        <div className="legend-item legend-info">
          <span>ℹ️ Click/hover any hour to inspect point-in-time metrics</span>
        </div>
      </div>
    </div>
  )
}

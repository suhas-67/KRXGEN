import React from 'react'

export default function KpiMetrics({
  soilingIndex,
  diagnosis,
  economicDispatch,
  soilingLossPct,
  currentHourData,
  onOpenDispatchModal,
  onDownloadEsgAudit,
}) {
  // Format SI color
  let siColorClass = 'emerald'
  if (soilingIndex < 0.80) siColorClass = 'red'
  else if (soilingIndex < 0.90) siColorClass = 'amber'

  const isDispatchOrder = economicDispatch?.decision === 'DISPATCH'
  const isRainSuppressed = economicDispatch?.decision === 'SUPPRESS_RAIN' || economicDispatch?.isRainComing

  // Array activity status check
  const isArrayIdle = (currentHourData?.p_modeled_kw ?? 0) < 0.05 || 
                      (currentHourData?.poa_global ?? 750) < 20 || 
                      diagnosis?.status === 'IDLE_NIGHT' || 
                      diagnosis?.severity === 'neutral'

  // Card 3 PIML badge and styling logic
  let pimlCardGlow = ''
  let pimlBadgeClass = 'neutral'
  let pimlBadgeText = 'STANDBY'

  if (isArrayIdle) {
    pimlCardGlow = ''
    pimlBadgeClass = 'neutral'
    pimlBadgeText = 'STANDBY (IDLE)'
  } else if (diagnosis?.severity === 'critical') {
    pimlCardGlow = 'red-glow'
    pimlBadgeClass = 'red'
    pimlBadgeText = typeof diagnosis?.confidence === 'number' ? `PIML AI: ${diagnosis.confidence.toFixed(1)}%` : 'CRITICAL FAULT'
  } else if (diagnosis?.severity === 'warning') {
    pimlCardGlow = 'amber-glow'
    pimlBadgeClass = 'amber'
    pimlBadgeText = typeof diagnosis?.confidence === 'number' ? `PIML AI: ${diagnosis.confidence.toFixed(1)}%` : 'ANOMALY DETECTED'
  } else {
    pimlCardGlow = 'emerald-glow'
    pimlBadgeClass = 'emerald'
    pimlBadgeText = typeof diagnosis?.confidence === 'number' ? `PIML AI: ${diagnosis.confidence.toFixed(1)}%` : 'OPTIMAL YIELD'
  }

  return (
    <section className="kpi-grid">
      {/* Card 1: Soiling Health Index */}
      <div className={`kpi-card ${siColorClass}-glow`}>
        <div className="kpi-top">
          <span className="kpi-label">SOILING HEALTH INDEX (SI)</span>
          <span className={`kpi-badge ${siColorClass}`}>
            {soilingIndex >= 0.95 ? 'OPTICAL CLEAN' : `${soilingLossPct}% DUST`}
          </span>
        </div>
        <div className="kpi-value-row">
          <span className="kpi-number">{(soilingIndex ?? 1.0).toFixed(2)}</span>
          <span className="kpi-unit">/ 1.00</span>
        </div>
        <div className="kpi-sub-row">
          <span className="kpi-sub-badge red-sub">
            {soilingLossPct > 0 ? `-${soilingLossPct}% Transmission` : '100% Transmittance'}
          </span>
          <span className="kpi-footnote">Kalman State Filtered</span>
        </div>
      </div>

      {/* Card 2: Energy & Revenue Loss + Scope-2 ESG Ledger */}
      <div className="kpi-card amber-glow">
        <div className="kpi-top">
          <span className="kpi-label">YIELD LOSS & REVENUE DRAIN</span>
          <span className="kpi-badge neutral">
            {(economicDispatch?.dailyRevenueLost || 0) > 0 ? 'FINANCIAL IMPACT' : 'OPTIMAL'}
          </span>
        </div>
        <div className="kpi-value-row">
          <span className="kpi-number">₹{(economicDispatch?.dailyRevenueLost || 0).toFixed(2)}</span>
          <span className="kpi-unit">/ Day</span>
        </div>
        <div className="kpi-sub-row">
          <span className="kpi-sub-badge amber-sub">
            {(economicDispatch?.dailyEnergyLossKwh || 0).toFixed(1)} kWh/day gap
          </span>
          <span className="kpi-footnote">₹{(economicDispatch?.weeklyRevenueLost || 0).toFixed(1)}/week loss</span>
        </div>
        {/* Scope-2 Real-Time Carbon Ledger with clean breathing room */}
        <div className="esg-ledger-container">
          <div className="esg-badge">
            <span className="esg-icon">🍃</span>
            <span>Avoidable Carbon Deficit: <strong>{(economicDispatch?.dailyCarbonDebtKg || 0).toFixed(1)} kg CO₂e/day</strong></span>
          </div>
        </div>
      </div>

      {/* Card 3: PIML Electrical Diagnostic Status */}
      <div className={`kpi-card ${pimlCardGlow}`}>
        <div className="kpi-top">
          <span className="kpi-label">PIML ENSEMBLE CLASSIFIER</span>
          <span className={`kpi-badge ${pimlBadgeClass}`}>
            {pimlBadgeText}
          </span>
        </div>
        <div className="kpi-diagnosis-title">
          {isArrayIdle ? 'Array Inactive (Night / Low Irradiance)' : (diagnosis?.title || 'Nominal Operations')}
        </div>
        <div className="kpi-diagnosis-message">
          {isArrayIdle 
            ? 'Solar irradiance below active MPPT threshold. Systems in nominal standby.' 
            : (diagnosis?.message || 'Array electrical parameters match Sandia & 1-diode physics.')}
        </div>
        {!isArrayIdle && diagnosis?.featureAttributions && (
          <div className="kpi-sub-row" style={{ marginTop: '4px' }}>
            <span className="kpi-footnote" style={{ color: 'var(--text-muted)', fontSize: '9.5px', fontFamily: 'var(--font-mono)' }}>
              🎯 {diagnosis.featureAttributions}
            </span>
          </div>
        )}
      </div>

      {/* Card 4: Dedicated Field Dispatch & Work Order */}
      <div className={`kpi-card ${isDispatchOrder ? 'dispatch-blinking-card red-glow' : isRainSuppressed ? 'blue-glow' : 'emerald-glow'}`}>
        <div className="kpi-top">
          <span className="kpi-label">FIELD WORK-ORDER DISPATCH</span>
          <span className={`kpi-badge ${isDispatchOrder ? 'red blink-badge' : isRainSuppressed ? 'blue' : 'neutral'}`}>
            {isDispatchOrder ? 'ACTION REQUIRED' : isRainSuppressed ? 'RAIN OVERRIDE' : 'STANDBY'}
          </span>
        </div>
        <div className="kpi-dispatch-title">
          {isRainSuppressed 
            ? '🌧️ Rain Forecast Suppresses Dispatch' 
            : isDispatchOrder 
            ? `🚨 Wash Dispatch Recommended (+₹${Math.max(0, economicDispatch.weeklyNetProfit).toFixed(0)}/wk)`
            : '✅ System Operating Within Threshold'}
        </div>
        <div className="kpi-dispatch-explanation">
          {isRainSuppressed
            ? `Precipitation (${Math.round(economicDispatch?.maxRainProb || 0)}% chance) forecast within 72h. Wash paused to conserve water.`
            : isDispatchOrder
            ? `Weekly revenue loss (₹${(economicDispatch?.weeklyRevenueLost || 0).toFixed(0)}) exceeds cleaning expense. Technician ready.`
            : 'No maintenance action needed. Real-time telemetry monitoring active.'}
        </div>
        {/* Dedicated Telegram Field Dispatch Button */}
        <button 
          className={`dispatch-work-order-btn ${isDispatchOrder ? 'active-dispatch-btn' : 'standby-dispatch-btn'}`}
          onClick={onOpenDispatchModal}
        >
          📱 {isDispatchOrder ? 'Dispatch Work Order to Field Tech' : 'Preview Field Dispatch Ticket'}
        </button>
      </div>
    </section>
  )
}

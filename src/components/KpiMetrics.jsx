import React from 'react'

export default function KpiMetrics({
  soilingIndex,
  diagnosis,
  economicDispatch,
  soilingLossPct,
  currentHourData,
}) {
  // Format SI color
  let siColorClass = 'emerald'
  if (soilingIndex < 0.80) siColorClass = 'red'
  else if (soilingIndex < 0.90) siColorClass = 'amber'

  const actualPower = currentHourData?.p_actual_kw ?? 0
  const modeledPower = currentHourData?.p_modeled_kw ?? 0
  const generationEfficiency = modeledPower > 0.05 ? Math.min(100, Math.round((actualPower / modeledPower) * 100)) : 100

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
          <span className="kpi-number">{soilingIndex.toFixed(2)}</span>
          <span className="kpi-unit">/ 1.00</span>
        </div>
        <div className="kpi-sub-row">
          <span className="kpi-sub-badge red-sub">
            {soilingLossPct > 0 ? `-${soilingLossPct}% Transmission` : '100% Transmittance'}
          </span>
          <span className="kpi-footnote">Kalman State Filtered</span>
        </div>
      </div>

      {/* Card 2: Energy & Revenue Loss */}
      <div className="kpi-card amber-glow">
        <div className="kpi-top">
          <span className="kpi-label">YIELD LOSS & REVENUE DRAIN</span>
          <span className="kpi-badge neutral">
            {economicDispatch.dailyRevenueLost > 0 ? 'FINANCIAL IMPACT' : 'OPTIMAL'}
          </span>
        </div>
        <div className="kpi-value-row">
          <span className="kpi-number">${economicDispatch.dailyRevenueLost.toFixed(2)}</span>
          <span className="kpi-unit">/ Day</span>
        </div>
        <div className="kpi-sub-row">
          <span className="kpi-sub-badge amber-sub">
            {economicDispatch.dailyEnergyLossKwh.toFixed(1)} kWh/day gap
          </span>
          <span className="kpi-footnote">${economicDispatch.weeklyRevenueLost.toFixed(1)}/week loss</span>
        </div>
      </div>

      {/* Card 3: Electrical Diagnostic Status */}
      <div className={`kpi-card ${diagnosis.severity === 'critical' ? 'red-glow' : diagnosis.severity === 'warning' ? 'amber-glow' : 'emerald-glow'}`}>
        <div className="kpi-top">
          <span className="kpi-label">ELECTRICAL FAULT MATRIX</span>
          <span className={`kpi-badge ${diagnosis.severity}`}>
            {diagnosis.badge}
          </span>
        </div>
        <div className="kpi-diagnosis-title">
          {diagnosis.title}
        </div>
        <div className="kpi-diagnosis-message">
          {diagnosis.message}
        </div>
      </div>

      {/* Card 4: Opportunity-Aware Economic Dispatch */}
      <div className={`kpi-card ${economicDispatch.decisionClass === 'warning' ? 'amber-glow' : economicDispatch.decisionClass === 'info' ? 'blue-glow' : 'emerald-glow'}`}>
        <div className="kpi-top">
          <span className="kpi-label">ECONOMIC DISPATCH (72H RAIN AWARE)</span>
          <span className={`kpi-badge ${economicDispatch.decisionClass}`}>
            {economicDispatch.decisionBadge}
          </span>
        </div>
        <div className="kpi-dispatch-title">
          {economicDispatch.isRainComing ? '🌧️ Rain Forecast Suppressing Wash' : economicDispatch.weeklyNetProfit > 0 ? `💰 Wash ROI: +$${economicDispatch.weeklyNetProfit.toFixed(2)}/wk` : '✅ Generation Within Cost Margin'}
        </div>
        <div className="kpi-dispatch-explanation">
          {economicDispatch.explanation}
        </div>
      </div>
    </section>
  )
}

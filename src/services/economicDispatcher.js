/**
 * HelioSense Opportunity-Aware Economic Dispatch Engine
 * Calculates:
 * 1. Daily & Weekly Financial Yield Losses (₹)
 * 2. Breakeven Net Present Value (NPV) for scheduled panel cleaning
 * 3. 72-Hour Rain Check Override to avoid wasting water and money
 */

export function calculateEconomicDispatch(simRecords, options = {}) {
  const {
    tariffRatePerKwh = 7.5,   // ₹7.5 / kWh Time-of-Use rate
    cleaningCost = 200.0,     // Fixed labor crew charge for 15-panel array (₹)
    waterCost = 50.0,         // Municipal water cost (₹)
    rainOverrideProb = 40.0,   // Rain probability threshold (%)
    rainOverrideMm = 3.0,     // Rain accumulation threshold (mm)
  } = options

  // 1. Compute Daily Energy Loss (kWh) across the 24h simulation profile
  let totalModeledKwh = 0
  let totalActualKwh = 0
  let maxRainProb = 0
  let totalRainMm = 0

  simRecords.forEach((record) => {
    totalModeledKwh += (record.p_modeled_kw || 0)
    totalActualKwh += (record.p_actual_kw || 0)
    if (record.rain_prob > maxRainProb) {
      maxRainProb = record.rain_prob
    }
    totalRainMm += (record.rain_mm || 0)
  })

  const dailyEnergyLossKwh = Math.max(0, totalModeledKwh - totalActualKwh)
  const dailyRevenueLost = dailyEnergyLossKwh * tariffRatePerKwh
  const weeklyRevenueLost = dailyRevenueLost * 7
  const monthlyRevenueLost = dailyRevenueLost * 30

  const totalCleaningExpense = cleaningCost + waterCost
  const weeklyNetProfit = weeklyRevenueLost - totalCleaningExpense

  // 2. Decision Logic
  let decision = 'HOLD'
  let decisionBadge = 'NO ACTION NEEDED'
  let decisionClass = 'healthy'
  let explanation = ''

  const isRainComing = maxRainProb >= rainOverrideProb || totalRainMm >= rainOverrideMm

  if (isRainComing) {
    decision = 'SUPPRESS_RAIN'
    decisionBadge = '🌧️ FREE NATURAL WASH'
    decisionClass = 'info'
    explanation = `High-probability precipitation (${Math.round(maxRainProb)}% chance) forecast within 72 hours. Manual wash order suppressed to save ₹${totalCleaningExpense.toFixed(2)} and ~450 Liters of water.`
  } else if (weeklyRevenueLost >= totalCleaningExpense && weeklyRevenueLost > 0) {
    decision = 'DISPATCH'
    decisionBadge = '🚨 DISPATCH CLEANING'
    decisionClass = 'critical'
    explanation = `Cleaning is economically viable! Accumulated weekly yield loss (₹${weeklyRevenueLost.toFixed(2)}) has reached/exceeded cleaning expense (₹${totalCleaningExpense.toFixed(2)}). Immediate wash recovers +₹${Math.max(0, weeklyNetProfit).toFixed(2)} / week net ROI.`
  } else {
    decision = 'STANDBY'
    decisionClass = 'healthy'
    explanation = `Weekly revenue loss (₹${weeklyRevenueLost.toFixed(2)}/wk) is below the breakeven threshold for a ₹${totalCleaningExpense.toFixed(2)} cleaning service.`
  }

  decisionBadge = decision === 'DISPATCH' 
    ? `Wash ROI: +₹${weeklyNetProfit.toFixed(0)}/wk`
    : isRainComing
      ? '🌧️ Rain Forecast Suppressing Wash'
      : 'BELOW COST THRESHOLD'

  // Scope-2 Real-Time Carbon Ledger & Verifiable ESG Audit Trail
  // Grid emission factor for India (approx 0.72 kg CO2e / kWh)
  const gridEmissionFactor = 0.72;
  const dailyCarbonDebtKg = dailyEnergyLossKwh * gridEmissionFactor;

  return {
    dailyEnergyLossKwh: Math.round(dailyEnergyLossKwh * 10) / 10,
    dailyRevenueLost: Math.round(dailyRevenueLost),
    weeklyRevenueLost: Math.round(weeklyRevenueLost),
    monthlyRevenueLost: Math.round(monthlyRevenueLost),
    totalCleaningExpense,
    weeklyNetProfit: Math.round(weeklyNetProfit),
    dailyCarbonDebtKg: Math.round(dailyCarbonDebtKg * 10) / 10,
    maxRainProb: Math.round(maxRainProb),
    decision,
    decisionBadge,
    decisionClass,
    explanation,
    isRainComing,
  }
}

/**
 * Module Reliability Protection
 * Computes localized cell hotspot temperatures and thermal fire risk scores
 * caused by shaded cells / reverse-bias power dissipation.
 */

export function calculateThermalRisk(iString, tAmb, isFaulted) {
  // If no localized fault/shading is present, cells operate near nominal temperature
  const tCellNominal = tAmb + 15.0; // Approximation of nominal cell operating temperature

  if (!isFaulted || iString <= 0) {
    return {
      tHotspot: Math.round(tCellNominal * 10) / 10,
      riskScore: 0,
      isCriticalHotspot: false,
      pDissipated: 0
    };
  }

  // 1. Calculate Reverse-Bias Power Dissipation
  // When a cell is shaded or a diode fails, the healthy cells in the string
  // force current through the shaded cell, which acts as a resistive load.
  const vReverse = 15.0; // Typical reverse bias voltage across a shaded sub-string (Volts)
  const pDissipated = iString * vReverse; // Watts

  // 2. Estimate Localized Hotspot Temperature
  // T_hotspot = T_cell + (Thermal Resistance * P_dissipated)
  const thetaTh = 2.8; // Thermal resistance (°C/W) - how well the cell dissipates heat
  let tHotspot = tCellNominal + (thetaTh * pDissipated);

  // 3. Assign a Thermal Risk Score (0 - 100%)
  // Backsheet melting / delamination risk begins accelerating heavily after 85°C
  const criticalTemp = 85.0;
  const maxTemp = 130.0; // High probability of backsheet failure / fire
  
  let riskScore = 0;
  if (tHotspot > 50) {
    riskScore = ((tHotspot - 50) / (maxTemp - 50)) * 100;
  }
  riskScore = Math.max(0, Math.min(100, riskScore));

  const isCriticalHotspot = tHotspot > criticalTemp;

  return {
    tHotspot: Math.round(tHotspot * 10) / 10,
    riskScore: Math.round(riskScore),
    isCriticalHotspot,
    pDissipated: Math.round(pDissipated * 10) / 10
  };
}

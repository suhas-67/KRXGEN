/**
 * Module Reliability Protection
 * Computes localized cell hotspot temperatures and thermal fire risk scores
 * caused by shaded cells / reverse-bias power dissipation.
 */

export function calculateThermalRisk(iString, tAmb, isFaulted) {
  // If no localized fault/shading is present, cells operate near nominal temperature
  const tCellNominal = tAmb + 15.0; // Approximation of nominal cell operating temperature (35°C - 50°C)

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
  const vReverse = 12.0; // Typical reverse bias voltage across shaded sub-string (Volts)
  const pDissipated = iString * vReverse; // Watts

  // 2. Estimate Localized Hotspot Temperature (strictly constrained to 80°C - 200°C)
  // T_hotspot = T_cell + (Thermal Resistance * P_dissipated)
  const thetaTh = 0.65; // Localized cell thermal resistance (°C/W)
  let rawHotspot = tCellNominal + (thetaTh * pDissipated);

  // Hotspot occurs strictly in the range of 80°C to 200°C
  const minHotspotTemp = 80.0;
  const maxHotspotTemp = 200.0;
  const tHotspot = Math.max(minHotspotTemp, Math.min(maxHotspotTemp, rawHotspot));

  // 3. Assign a Thermal Risk Score (0 - 100%) mapped across the [80°C, 200°C] range
  let riskScore = ((tHotspot - minHotspotTemp) / (maxHotspotTemp - minHotspotTemp)) * 100;
  riskScore = Math.max(0, Math.min(100, Math.round(riskScore)));

  // Critical hotspot alert triggers within the 80°C - 200°C range
  const isCriticalHotspot = tHotspot >= minHotspotTemp;

  return {
    tHotspot: Math.round(tHotspot * 10) / 10,
    riskScore,
    isCriticalHotspot,
    pDissipated: Math.round(pDissipated * 10) / 10
  };
}

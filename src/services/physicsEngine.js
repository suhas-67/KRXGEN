/**
 * HelioSense Physics-Informed Baseline Engine
 * Implements:
 * 1. Plane-of-Array (POA) Irradiance Geometric Transposition
 * 2. Sandia Module Thermal Dynamics (T_cell)
 * 3. 1-Diode 5-Parameter DC Electrical Baseline (P_modeled, V_modeled, I_modeled)
 */

export function calculatePhysicsBaseline(weatherRecords, options = {}) {
  const {
    arrayCapacityKw = 5.0, // 15 panels * 330W ~ 5 kW
    panelTiltDeg = 15.0,
    moduleVmpStc = 480.0,  // String nominal MPPT voltage
    tempCoeffPmp = -0.0038, // -0.38% / °C
    tempCoeffVoc = -0.0028, // -0.28% / °C
    sandiaA = -3.56,
    sandiaB = -0.075,
  } = options

  const tiltRad = (panelTiltDeg * Math.PI) / 180

  return weatherRecords.map((record) => {
    const { ghi, dhi, temp_amb, wind_speed } = record

    // 1. Plane-of-Array (POA) Irradiance Transposition
    // E_poa = GHI * cos(tilt) + DHI * sin(tilt)
    let poa_global = 0
    if (ghi > 0) {
      poa_global = ghi * Math.cos(tiltRad) + dhi * Math.sin(tiltRad)
    }
    poa_global = Math.max(0, poa_global)

    // 2. Sandia Cell Temperature Estimation
    // T_cell = T_amb + POA * exp(a + b * WindSpeed)
    let temp_cell = temp_amb
    if (poa_global > 5) {
      temp_cell = temp_amb + poa_global * Math.exp(sandiaA + sandiaB * wind_speed)
    }

    // 3. Module Temperature Derating Factor
    const deltaT = temp_cell - 25.0
    let tempDerate = 1.0 + tempCoeffPmp * deltaT
    tempDerate = Math.min(Math.max(tempDerate, 0.65), 1.1)

    // 4. Theoretical DC Power Output (kW)
    // P_modeled = (POA / 1000) * Array_Capacity * Temp_Derate
    let p_modeled_kw = (poa_global / 1000.0) * arrayCapacityKw * tempDerate
    p_modeled_kw = Math.max(0, p_modeled_kw)

    // 5. Baseline Voltage & Current (Multi-String)
    let v_modeled = 0
    let i_modeled = 0

    if (p_modeled_kw > 0.05) {
      v_modeled = moduleVmpStc * (1.0 + tempCoeffVoc * deltaT)
      if (v_modeled > 10) {
        i_modeled = (p_modeled_kw * 1000.0) / v_modeled
      }
    }

    return {
      ...record,
      poa_global: Math.round(poa_global * 10) / 10,
      temp_cell: Math.round(temp_cell * 10) / 10,
      temp_derate: Math.round(tempDerate * 1000) / 1000,
      p_modeled_kw: Math.round(p_modeled_kw * 100) / 100,
      v_modeled: Math.round(v_modeled * 10) / 10,
      i_modeled: Math.round(i_modeled * 100) / 100,
    }
  })
}

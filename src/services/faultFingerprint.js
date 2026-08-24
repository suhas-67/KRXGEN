import { classifyPIML } from './pimlClassifier'

/**
 * HelioSense Multi-String Electrical Diagnostic Matrix & PIML Integration
 * Combines physics boundaries with the 6D PIML Ensemble Classifier
 */
export async function diagnoseArrayHealth(actualMetrics, modeledMetrics, soilingIndex, environmentalMetrics = {}) {
  const { vActual = 0, iActual = 0, pActual = 0, hasDiodeFault = false } = actualMetrics
  const { vModeled = 0, iModeled = 0, pModeled = 0 } = modeledMetrics
  const { poa = 750, tempCell = 40 } = environmentalMetrics

  const requestBody = {
    v_actual: vActual,
    v_modeled: vModeled,
    i_actual: iActual,
    i_modeled: iModeled,
    p_actual: pActual,
    p_modeled: pModeled,
    poa: poa,
    temp_cell: tempCell
  }

  try {
    const response = await fetch("/api/diagnose/piml", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      const data = await response.json();
      
      // Map API Response to UI state
      let label = 'Nominal Generation Yield'
      let badge = 'HEALTHY'
      let severity = 'healthy'
      let action = 'Continue continuous telemetry surveillance.'
      let affectedComponent = 'Nominal Array Operations'

      if (data.predicted_class === 'BYPASS_DIODE_FAULT') {
        label = '🚨 Bypass Diode Failure (String 2)'
        badge = 'HARDWARE FAULT'
        severity = 'critical'
        action = 'Dispatch technician for string junction-box diode replacement (Work Order #HW-8492).'
        affectedComponent = 'String 2 (Junction Box)'
      } else if (data.predicted_class === 'UNIFORM_SOILING') {
        label = '⚡ Surface Dust/Soiling'
        badge = 'SOILING ALERT'
        severity = 'warning'
        action = 'Evaluate economic dispatch breakeven for scheduled wash.'
        affectedComponent = 'All Array Modules'
      } else if (data.predicted_class === 'HIGH_RS_DEGRADATION') {
        label = '⚠️ Series Resistance Degradation'
        badge = 'DEGRADATION'
        severity = 'warning'
        action = 'Schedule thermographic inspection.'
        affectedComponent = 'Interconnect Solder Ribbons'
      } else if (data.predicted_class === 'INVERTER_CLIPPING') {
        label = 'ℹ️ Inverter Capacity Clipping'
        badge = 'CLIPPING'
        severity = 'info'
        action = 'Optimal peak generation. No maintenance required.'
        affectedComponent = 'Central Inverter MPPT Stage'
      } else if (data.predicted_class === 'IDLE_NIGHT') {
        label = 'Array Inactive'
        badge = 'IDLE'
        severity = 'neutral'
        action = 'No operational action required.'
        affectedComponent = 'Nominal Standby'
      }

      return {
        status: data.predicted_class,
        severity: severity,
        title: label,
        badge: badge,
        message: data.description,
        confidence: data.confidence,
        featureAttributions: data.feature_attributions,
        featureVector: data.feature_vector,
        classProbabilities: data.class_probabilities,
        rootCause: data.description,
        action: action,
        affectedComponent: affectedComponent,
        piml: data,
        isRemote: true
      }
    }
  } catch (err) {
    console.warn("Render Backend unreachable, falling back to local JS simulator:", err);
  }

  // Execute PIML Machine Learning Inference locally (Fallback)
  const pimlResult = classifyPIML(
    {
      vActual,
      vModeled,
      iActual,
      iModeled,
      pActual,
      pModeled,
      poa,
      tempCell,
      soilingIndex,
    },
    hasDiodeFault
  )

  return {
    status: pimlResult.predictedClass,
    severity: pimlResult.severity,
    title: pimlResult.label,
    badge: pimlResult.badge,
    message: pimlResult.pimlDiagnosis,
    confidence: pimlResult.confidence,
    featureAttributions: pimlResult.featureAttributions,
    featureVector: pimlResult.featureVector,
    classProbabilities: pimlResult.probabilities,
    rootCause: pimlResult.pimlDiagnosis,
    action: pimlResult.action,
    affectedComponent: pimlResult.affectedComponent,
    piml: pimlResult,
    isRemote: false
  }
}


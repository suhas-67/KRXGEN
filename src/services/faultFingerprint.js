import { classifyPIML } from './pimlClassifier'

/**
 * HelioSense Multi-String Electrical Diagnostic Matrix & PIML Integration
 * Combines physics boundaries with the 6D PIML Ensemble Classifier
 */
export function diagnoseArrayHealth(actualMetrics, modeledMetrics, soilingIndex, environmentalMetrics = {}) {
  const { vActual = 0, iActual = 0, pActual = 0, hasDiodeFault = false } = actualMetrics
  const { vModeled = 0, iModeled = 0, pModeled = 0 } = modeledMetrics
  const { poa = 750, tempCell = 40 } = environmentalMetrics

  // Execute PIML Machine Learning Inference
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
  }
}


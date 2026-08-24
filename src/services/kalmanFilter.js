/**
 * HelioSense Decoupled Soiling State Estimator
 * Implements a 2-State Discrete-Time Kalman Filter tracking:
 * State vector: [ SI (Soiling Index), d(SI)/dt (Deposition Rate) ]^T
 * Decouples fast atmospheric cloud noise from monotonic particulate accumulation.
 */

export class SoilingKalmanFilter {
  constructor(options = {}) {
    const {
      initialSi = 1.0,
      initialRate = 0.0,
      processNoiseSi = 1e-6,
      processNoiseRate = 1e-8,
      baseMeasurementNoise = 1e-2,
    } = options

    // State vector [SI, dSI/dt]
    this.x = [initialSi, initialRate]

    // State Covariance Matrix 2x2
    this.P = [
      [0.01, 0.0],
      [0.0, 0.001],
    ]

    // Process Noise Covariance Matrix Q
    this.Q = [
      [processNoiseSi, 0.0],
      [0.0, processNoiseRate],
    ]

    this.baseR = baseMeasurementNoise
  }

  /**
   * Updates state with new telemetry observation
   * @param {number} pActual - Actual measured power (kW)
   * @param {number} pModeled - Physics-modeled clean power (kW)
   * @param {number} diffuseRatio - DHI / GHI (cloud instability metric)
   * @param {number} dt - Time step in hours (default 1.0)
   * @returns {number} Decoupled Soiling Index SI in [0.0, 1.0]
   */
  update(pActual, pModeled, diffuseRatio = 0.2, dt = 1.0) {
    // Skip low irradiance periods (night / sun elevation < 5°)
    if (pModeled < 0.1 || pActual < 0.02) {
      return Math.min(Math.max(this.x[0], 0.0), 1.0)
    }

    // Raw performance ratio measurement
    const z = Math.min(Math.max(pActual / pModeled, 0.0), 1.1)

    // Dynamically inflate measurement noise R if atmospheric instability (clouds) is high
    let R = this.baseR
    if (diffuseRatio > 0.5) {
      R = this.baseR * (1 + 10 * (diffuseRatio - 0.5))
    }

    // 1. State Prediction: x_pred = F * x
    const x0_pred = this.x[0] + this.x[1] * dt
    const x1_pred = this.x[1]

    // 2. Covariance Prediction: P_pred = F * P * F^T + Q
    const p00_pred = this.P[0][0] + dt * (this.P[1][0] + this.P[0][1]) + dt * dt * this.P[1][1] + this.Q[0][0]
    const p01_pred = this.P[0][1] + dt * this.P[1][1] + this.Q[0][1]
    const p10_pred = this.P[1][0] + dt * this.P[1][1] + this.Q[1][0]
    const p11_pred = this.P[1][1] + this.Q[1][1]

    // 3. Innovation & Kalman Gain: H = [1, 0]
    const y_tilde = z - x0_pred
    const S = p00_pred + R

    const K0 = p00_pred / S
    const K1 = p10_pred / S

    // 4. State Update: x = x_pred + K * y_tilde
    this.x[0] = x0_pred + K0 * y_tilde
    this.x[1] = x1_pred + K1 * y_tilde

    // 5. Covariance Update: P = (I - K * H) * P_pred
    this.P[0][0] = (1 - K0) * p00_pred
    this.P[0][1] = (1 - K0) * p01_pred
    this.P[1][0] = p10_pred - K1 * p00_pred
    this.P[1][1] = p11_pred - K1 * p01_pred

    // Clamp SI to physically meaningful bounds [0.0, 1.0]
    this.x[0] = Math.min(Math.max(this.x[0], 0.0), 1.0)
    return this.x[0]
  }

  getSoilingIndex() {
    return this.x[0]
  }

  getDepositionRate() {
    return this.x[1]
  }

  reset(newSi = 1.0) {
    this.x = [newSi, 0.0]
    this.P = [
      [0.01, 0.0],
      [0.0, 0.001],
    ]
  }
}

import numpy as np

class SoilingKalmanFilter:
    """
    1D/2D Discrete Kalman Filter to track Soiling Index (SI) and isolate
    monotonic particulate degradation from high-frequency cloud noise.
    """
    def __init__(self, initial_si=1.0, process_noise=1e-5, measurement_noise=1e-2):
        self.x = initial_si         # State estimate (SI)
        self.P = 1.0                # Error covariance
        self.Q = process_noise      # Process noise covariance
        self.R = measurement_noise  # Measurement noise covariance

    def update(self, p_actual, p_modeled):
        if p_modeled < 0.1 or p_actual < 0.02:
            return self.x  # Skip low irradiance / night intervals

        z = np.clip(p_actual / p_modeled, 0.0, 1.1)

        # 1. Prediction step
        self.P = self.P + self.Q

        # 2. Kalman Gain update
        K = self.P / (self.P + self.R)
        self.x = self.x + K * (z - self.x)
        self.P = (1 - K) * self.P

        return float(np.clip(self.x, 0.0, 1.0))

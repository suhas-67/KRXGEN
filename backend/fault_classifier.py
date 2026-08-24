"""
HelioSense: Physics-Informed Machine Learning (PIML) Fault Classifier
Integrates physics-based normalization with an ensemble Random Forest model
to accurately diagnose solar PV array anomalies.
"""

import numpy as np
from sklearn.ensemble import RandomForestClassifier

CLASS_NAMES = [
    "HEALTHY",
    "UNIFORM_SOILING",
    "BYPASS_DIODE_FAULT",
    "HIGH_RS_DEGRADATION",
    "INVERTER_CLIPPING",
]

CLASS_DESCRIPTIONS = {
    "HEALTHY": "Nominal generation yield within theoretical physics tolerances.",
    "UNIFORM_SOILING": "Uniform photon attenuation: Imp suppressed with constant Vmp.",
    "BYPASS_DIODE_FAULT": "Bypass diode short or discrete sub-string isolation (33% Vmp drop).",
    "HIGH_RS_DEGRADATION": "High series resistance / degradation under high irradiance.",
    "INVERTER_CLIPPING": "Inverter capacity saturation: AC clipping under peak solar irradiance.",
}


class PhysicsInformedFaultClassifier:
    def __init__(self, random_state: int = 42):
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=8,
            random_state=random_state,
        )
        self.class_names = CLASS_NAMES
        self.is_trained = False
        self._train_synthetic_baseline()

    def _generate_synthetic_data(self, n_samples_per_class: int = 300):
        np.random.seed(42)
        X_list = []
        y_list = []

        for class_idx, class_name in enumerate(self.class_names):
            n = n_samples_per_class
            poa = np.random.uniform(200.0, 1000.0, n)
            temp_cell = 25.0 + (poa / 1000.0) * 30.0 + np.random.normal(0, 2, n)
            p_mod = (poa / 1000.0) * 5.0 * (1.0 - 0.0038 * (temp_cell - 25.0))
            p_mod = np.clip(p_mod, 0.1, 6.0)

            if class_name == "HEALTHY":
                v_ratio = np.random.normal(1.0, 0.02, n)
                i_ratio = np.random.normal(1.0, 0.02, n)
                p_ratio = v_ratio * i_ratio
                p_res = p_mod * (1.0 - p_ratio)

            elif class_name == "UNIFORM_SOILING":
                v_ratio = np.random.normal(0.99, 0.015, n)
                i_ratio = np.random.uniform(0.50, 0.88, n)
                p_ratio = v_ratio * i_ratio
                p_res = p_mod * (1.0 - p_ratio)

            elif class_name == "BYPASS_DIODE_FAULT":
                v_ratio = np.random.normal(0.67, 0.03, n)
                i_ratio = np.random.normal(0.99, 0.02, n)
                p_ratio = v_ratio * i_ratio
                p_res = p_mod * (1.0 - p_ratio)

            elif class_name == "HIGH_RS_DEGRADATION":
                v_ratio = np.random.uniform(0.76, 0.88, n)
                i_ratio = np.random.normal(0.93, 0.03, n)
                p_ratio = v_ratio * i_ratio
                p_res = p_mod * (1.0 - p_ratio)

            elif class_name == "INVERTER_CLIPPING":
                poa = np.random.uniform(850.0, 1100.0, n)
                temp_cell = 45.0 + np.random.normal(0, 3, n)
                p_mod = np.random.uniform(5.2, 6.2, n)
                p_act = np.full(n, 5.0) + np.random.normal(0, 0.02, n)
                p_ratio = p_act / p_mod
                v_ratio = np.random.normal(1.0, 0.02, n)
                i_ratio = p_ratio / v_ratio
                p_res = p_mod - p_act

            # Feature vector: [v_ratio, i_ratio, p_ratio, p_res, poa, temp_cell]
            features = np.column_stack([v_ratio, i_ratio, p_ratio, p_res, poa, temp_cell])
            labels = np.full(n, class_idx)

            X_list.append(features)
            y_list.append(labels)

        X = np.vstack(X_list)
        y = np.concatenate(y_list)
        return X, y

    def _train_synthetic_baseline(self):
        X, y = self._generate_synthetic_data()
        self.model.fit(X, y)
        self.is_trained = True

    def extract_features(
        self,
        v_actual: float,
        v_modeled: float,
        i_actual: float,
        i_modeled: float,
        p_actual: float,
        p_modeled: float,
        poa: float,
        temp_cell: float,
    ) -> np.ndarray:
        v_mod = max(v_modeled, 1e-3)
        i_mod = max(i_modeled, 1e-3)
        p_mod = max(p_modeled, 1e-3)

        v_ratio = v_actual / v_mod
        i_ratio = i_actual / i_mod
        p_ratio = p_actual / p_mod
        p_res = max(0.0, p_modeled - p_actual)

        return np.array([[v_ratio, i_ratio, p_ratio, p_res, poa, temp_cell]])

    def predict(
        self,
        v_actual: float,
        v_modeled: float,
        i_actual: float,
        i_modeled: float,
        p_actual: float,
        p_modeled: float,
        poa: float = 750.0,
        temp_cell: float = 40.0,
    ) -> dict:
        if p_modeled < 0.05 or poa < 20.0:
            return {
                "predicted_class": "IDLE_NIGHT",
                "confidence": 100.0,
                "class_probabilities": {c: 0.0 for c in self.class_names},
                "feature_attributions": "Solar irradiance below active activation threshold.",
                "feature_vector": {
                    "v_ratio": 0.0,
                    "i_ratio": 0.0,
                    "p_ratio": 0.0,
                    "p_residual_kw": 0.0,
                    "poa_wm2": poa,
                    "temp_cell_c": temp_cell,
                },
                "description": "System standing by for sunrise.",
            }

        features = self.extract_features(
            v_actual, v_modeled, i_actual, i_modeled, p_actual, p_modeled, poa, temp_cell
        )

        probs = self.model.predict_proba(features)[0]
        class_idx = int(np.argmax(probs))
        predicted_class = self.class_names[class_idx]
        confidence = float(probs[class_idx] * 100.0)

        v_ratio = float(features[0, 0])
        i_ratio = float(features[0, 1])
        p_ratio = float(features[0, 2])
        p_res = float(features[0, 3])

        # Formulate physics attribution
        if predicted_class == "BYPASS_DIODE_FAULT":
            attribution = f"Voltage Ratio: {v_ratio:.2f} (-{round((1-v_ratio)*100)}% Vmp drop on String 2) with stable current"
        elif predicted_class == "UNIFORM_SOILING":
            attribution = f"Current Ratio: {i_ratio:.2f} (-{round((1-i_ratio)*100)}% Imp transmission loss) with nominal voltage"
        elif predicted_class == "HIGH_RS_DEGRADATION":
            attribution = f"Degradation signature: V_ratio={v_ratio:.2f}, I_ratio={i_ratio:.2f} under {poa:.0f} W/m² POA"
        elif predicted_class == "INVERTER_CLIPPING":
            attribution = f"Inverter saturation: Pac capped at 5.0 kW while Pmod={p_modeled:.2f} kW"
        else:
            attribution = f"Nominal tracking: V_ratio={v_ratio:.2f}, I_ratio={i_ratio:.2f}, P_ratio={p_ratio:.2f}"

        prob_dict = {self.class_names[i]: round(float(probs[i]) * 100.0, 1) for i in range(len(self.class_names))}

        return {
            "predicted_class": predicted_class,
            "confidence": round(confidence, 1),
            "class_probabilities": prob_dict,
            "feature_attributions": attribution,
            "feature_vector": {
                "v_ratio": round(v_ratio, 3),
                "i_ratio": round(i_ratio, 3),
                "p_ratio": round(p_ratio, 3),
                "p_residual_kw": round(p_res, 3),
                "poa_wm2": round(poa, 1),
                "temp_cell_c": round(temp_cell, 1),
            },
            "description": CLASS_DESCRIPTIONS.get(predicted_class, ""),
        }


# Global singleton instance for easy import
piml_classifier = PhysicsInformedFaultClassifier()


def classify_fault(v_actual, v_modeled, i_actual, i_modeled, soiling_index, poa=750.0, temp_cell=40.0):
    p_actual = (v_actual * i_actual) / 1000.0
    p_modeled = (v_modeled * i_modeled) / 1000.0
    result = piml_classifier.predict(v_actual, v_modeled, i_actual, i_modeled, p_actual, p_modeled, poa, temp_cell)
    return result["predicted_class"]


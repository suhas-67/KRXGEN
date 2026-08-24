"""
HelioSense Multi-String Electrical Anomaly & Fault Classifier
"""

def classify_fault(v_actual, v_modeled, i_actual, i_modeled, soiling_index):
    if v_modeled <= 0 or i_modeled <= 0:
        return "INACTIVE (NIGHT / LOW LIGHT)"

    v_ratio = v_actual / v_modeled
    i_ratio = i_actual / i_modeled

    if 0.58 <= v_ratio <= 0.76 and i_ratio >= 0.85:
        return "CRITICAL FAULT: Blown Bypass Diode on String 2 (33% Vmp Drop)"
    elif soiling_index < 0.80:
        return "DIRT / SOILING DETECTED: Uniform Current Derate across Strings"
    elif soiling_index < 0.92:
        return "MODERATE SOILING: Optical Transmittance Approaching Service Threshold"
    else:
        return "SYSTEM HEALTHY: Operating Within Theoretical Physics Tolerances"

import numpy as np
import pandas as pd

def calculate_physics_baseline(weather_df, array_capacity_kw=5.0, panel_tilt=15.0):
    """
    Computes theoretical clean-panel power (P_modeled) using Plane-of-Array (POA) irradiance
    and Sandia temperature derating coefficients for a 15-panel array (5.0 kW DC).
    """
    df = weather_df.copy()

    # 1. Estimate Plane of Array (POA) irradiance
    tilt_rad = np.radians(panel_tilt)
    df['poa_global'] = df['ghi'] * np.cos(tilt_rad) + df['dhi'] * np.sin(tilt_rad)
    df['poa_global'] = np.clip(df['poa_global'], 0, None)

    # 2. Sandia cell temperature estimation: T_cell = T_amb + POA * exp(a + b * WS)
    a, b = -3.56, -0.075
    df['temp_cell'] = df['temp_amb'] + df['poa_global'] * np.exp(a + b * df['wind_speed'])

    # 3. Silicon module temperature derate: -0.38% / °C above 25°C STC
    temp_derate = 1.0 - 0.0038 * (df['temp_cell'] - 25.0)
    temp_derate = np.clip(temp_derate, 0.65, 1.10)

    # 4. Theoretical DC Power Output (kW)
    df['p_modeled_kw'] = (df['poa_global'] / 1000.0) * array_capacity_kw * temp_derate
    df['p_modeled_kw'] = np.clip(df['p_modeled_kw'], 0, None)

    # 5. Baseline voltage & current (3 parallel strings of 5 panels)
    v_stc, i_stc = 480.0, 10.4
    df['v_modeled'] = np.where(df['p_modeled_kw'] > 0.05, v_stc * (1 - 0.0028 * (df['temp_cell'] - 25.0)), 0.0)
    df['i_modeled'] = np.where(df['v_modeled'] > 0, (df['p_modeled_kw'] * 1000.0) / df['v_modeled'], 0.0)

    return df

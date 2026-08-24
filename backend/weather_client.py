import requests
import pandas as pd
import numpy as np

def get_solar_weather(lat=10.7905, lon=78.7047):
    """
    Fetches real-time & hourly solar irradiance and temperature from Open-Meteo API.
    Requires ZERO API keys. Includes synthetic clear-sky fallback.
    """
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}&"
        f"hourly=shortwave_radiation_instant,direct_normal_irradiance,"
        f"diffuse_radiation,temperature_2m,wind_speed_10m,precipitation_probability,precipitation&"
        f"timezone=auto"
    )
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            hourly = response.json()['hourly']
            df = pd.DataFrame({
                'timestamp': pd.to_datetime(hourly['time']),
                'ghi': hourly['shortwave_radiation_instant'],
                'dni': hourly['direct_normal_irradiance'],
                'dhi': hourly['diffuse_radiation'],
                'temp_amb': hourly['temperature_2m'],
                'wind_speed': hourly['wind_speed_10m'],
                'rain_prob': hourly['precipitation_probability'],
                'rain_mm': hourly['precipitation']
            })
            return df.iloc[:24].dropna().reset_index(drop=True)
    except Exception as e:
        print(f"Weather API fallback engaged: {e}")

    # Fallback clear-sky synthetic curve
    times = pd.date_range(start="2026-08-24 06:00", periods=24, freq="h")
    rad_curve = np.clip(850 * np.sin(np.linspace(0, np.pi, 24)), 0, None)
    return pd.DataFrame({
        'timestamp': times,
        'ghi': rad_curve,
        'dni': rad_curve * 0.75,
        'dhi': rad_curve * 0.25,
        'temp_amb': 28.0 + 6.0 * np.sin(np.linspace(0, np.pi, 24)),
        'wind_speed': 3.2,
        'rain_prob': 10.0,
        'rain_mm': 0.0
    })

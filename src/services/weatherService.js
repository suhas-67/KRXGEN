/**
 * Open-Meteo Solar Weather Client & Fallback Engine
 * Fetches real-time & hourly solar irradiance and meteorological data.
 * Zero API keys required. Includes high-fidelity synthetic clear-sky fallback.
 */

export async function getSolarWeather(lat = 10.7905, lon = 78.7047) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=shortwave_radiation_instant,direct_normal_irradiance,diffuse_radiation,temperature_2m,wind_speed_10m,precipitation_probability,precipitation&timezone=auto`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Weather API returned status ${response.status}`)
    }

    const data = await response.json()
    const hourly = data.hourly

    if (!hourly || !hourly.time || hourly.time.length === 0) {
      throw new Error('Invalid weather payload received')
    }

    // Extract next 24 hours
    const records = []
    const count = Math.min(24, hourly.time.length)

    for (let i = 0; i < count; i++) {
      records.push({
        timestamp: hourly.time[i],
        hour: new Date(hourly.time[i]).getHours(),
        ghi: hourly.shortwave_radiation_instant?.[i] ?? 0,
        dni: hourly.direct_normal_irradiance?.[i] ?? 0,
        dhi: hourly.diffuse_radiation?.[i] ?? 0,
        temp_amb: hourly.temperature_2m?.[i] ?? 28,
        wind_speed: hourly.wind_speed_10m?.[i] ?? 3.5,
        rain_prob: hourly.precipitation_probability?.[i] ?? 0,
        rain_mm: hourly.precipitation?.[i] ?? 0,
        is_live: true,
      })
    }

    return {
      isLive: true,
      records,
    }
  } catch (err) {
    console.warn('Weather API failed or timed out. Falling back to cached clear-sky simulation:', err.message)
    return {
      isLive: false,
      records: generateClearSkyFallback(),
    }
  }
}

/**
 * High-fidelity synthetic 24-hour clear sky solar model
 */
export function generateClearSkyFallback() {
  const records = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let hour = 0; hour < 24; hour++) {
    const time = new Date(today)
    time.setHours(hour)

    // Solar bell curve between 6 AM (hour 6) and 6 PM (hour 18)
    let ghi = 0
    if (hour >= 6 && hour <= 18) {
      const solarAngle = ((hour - 6) / 12) * Math.PI
      ghi = Math.max(0, 860 * Math.sin(solarAngle))
    }

    const dni = ghi * 0.82
    const dhi = ghi * 0.18
    const temp_amb = 26 + 7 * Math.sin(((hour - 4) / 24) * 2 * Math.PI)
    const wind_speed = 2.8 + 1.2 * Math.cos((hour / 24) * 2 * Math.PI)

    records.push({
      timestamp: time.toISOString(),
      hour,
      ghi: Math.round(ghi * 10) / 10,
      dni: Math.round(dni * 10) / 10,
      dhi: Math.round(dhi * 10) / 10,
      temp_amb: Math.round(temp_amb * 10) / 10,
      wind_speed: Math.round(wind_speed * 10) / 10,
      rain_prob: 5,
      rain_mm: 0,
      is_live: false,
    })
  }

  return records
}

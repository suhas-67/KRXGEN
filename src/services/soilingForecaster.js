/**
 * Satellite AQI & PM10/PM2.5 Predictive Soiling Forecaster
 * Models particulate matter concentration to predict dust deposition rates.
 */

export function generateSoilingForecast(currentSi, hoursToForecast = 48) {
  // Constants for the Soiling Deposition Model
  const kappa = 0.00015; // Site-specific aggregation constant
  const vd_pm10 = 0.008; // Deposition velocity for PM10 (m/s)
  const vd_pm25 = 0.002; // Deposition velocity for PM2.5 (m/s)
  const eta = 0.5; // Humidity cementation multiplier

  const forecast = [];
  let simulatedSi = currentSi;

  for (let i = 1; i <= hoursToForecast; i++) {
    // Simulate AQI Weather parameters (in reality, fetched via Open-Meteo Air Quality API)
    // PM10 (μg/m³), PM2.5 (μg/m³), Relative Humidity (%)
    const simulatedPM10 = 80 + Math.sin(i * 0.2) * 40; 
    const simulatedPM25 = 35 + Math.sin(i * 0.2) * 15;
    const simulatedRH = 60 + Math.cos(i * 0.1) * 20;

    // The Mathematical Mechanism
    // d(SI)/dt = -kappa * (vd,pm10 * PM10 + vd,pm25 * PM2.5) * (1 + eta * RH/100)
    const depositionRate = -kappa * ((vd_pm10 * simulatedPM10) + (vd_pm25 * simulatedPM25)) * (1 + eta * (simulatedRH / 100));
    
    // Decrease SI (Soiling Index drops as dust builds up, meaning more loss)
    // But SI is a ratio (1.0 = clean, 0.8 = 20% loss).
    // The prompt implies d(SI)/dt is negative, reducing the performance index.
    simulatedSi += depositionRate;
    
    // Clamp between 0.5 (50% loss) and 1.0 (Clean)
    simulatedSi = Math.max(0.5, Math.min(1.0, simulatedSi));

    forecast.push({
      hourOffset: i,
      forecast_si: Math.round(simulatedSi * 1000) / 1000,
      pm10: Math.round(simulatedPM10),
      pm25: Math.round(simulatedPM25)
    });
  }

  return forecast;
}

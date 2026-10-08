// weatherService.js — Open-Meteo Free/Open Environmental API Client
// Provides live weather, wind speed, solar irradiance, temperature, humidity, and sunrise/sunset

// Standard WMO Weather Interpretation Codes
export const WMO_WEATHER_CODES = {
  0: 'Clear Sky',
  1: 'Mainly Clear',
  2: 'Partly Cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing Rime Fog',
  51: 'Light Drizzle',
  53: 'Moderate Drizzle',
  55: 'Dense Drizzle',
  61: 'Slight Rain',
  63: 'Moderate Rain',
  65: 'Heavy Rain',
  71: 'Slight Snow Fall',
  73: 'Moderate Snow Fall',
  75: 'Heavy Snow Fall',
  80: 'Slight Rain Showers',
  81: 'Moderate Rain Showers',
  82: 'Violent Rain Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with Slight Hail',
  99: 'Thunderstorm with Heavy Hail',
};

/**
 * Fetches real environmental and atmospheric data from Open-Meteo free API
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} Formatted real environmental telemetry
 */
export async function fetchOpenMeteoData(lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    throw new Error('Valid latitude and longitude coordinates are required.');
  }

  const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,shortwave_radiation,direct_normal_irradiance&daily=sunrise,sunset&timezone=auto`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Open-Meteo responded with status ${res.status}`);
    }

    const data = await res.json();
    const curr = data.current || {};
    const daily = data.daily || {};

    // Wind speed: Open-Meteo returns km/h by default in standard endpoint, convert to m/s
    // (km/h) / 3.6 = m/s
    const windSpeedKmh = curr.wind_speed_10m ?? 0;
    const windSpeedMs = +(windSpeedKmh / 3.6).toFixed(1);

    // Solar irradiance: shortwave_radiation or direct_normal_irradiance in W/m²
    // Fallback if night time or zero
    const shortwaveRad = curr.shortwave_radiation ?? 0;
    const directNormalRad = curr.direct_normal_irradiance ?? 0;
    const solarIrradiance = Math.max(0, Math.round(shortwaveRad || directNormalRad));

    const weatherCode = curr.weather_code ?? 0;
    const weatherDesc = WMO_WEATHER_CODES[weatherCode] || 'Clear Conditions';

    const sunrise = daily.sunrise?.[0] ? daily.sunrise[0].split('T')[1] : '06:00';
    const sunset = daily.sunset?.[0] ? daily.sunset[0].split('T')[1] : '18:30';

    return {
      temperature: +(curr.temperature_2m ?? 25).toFixed(1),
      apparentTemperature: +(curr.apparent_temperature ?? curr.temperature_2m ?? 25).toFixed(1),
      humidity: Math.round(curr.relative_humidity_2m ?? 50),
      windSpeed: windSpeedMs,
      windSpeedKmh: +windSpeedKmh.toFixed(1),
      windDirection: Math.round(curr.wind_direction_10m ?? 0),
      cloudCover: Math.round(curr.cloud_cover ?? 0),
      solarIrradiance,
      isDay: Boolean(curr.is_day ?? 1),
      precipitation: +(curr.precipitation ?? 0).toFixed(1),
      weatherCode,
      weatherDesc,
      sunrise,
      sunset,
      timezone: data.timezone || 'auto',
      elevation: data.elevation || 0,
      updatedAt: new Date().toISOString(),
      dataSource: 'Open-Meteo Free Meteorological API (Live)',
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Open-Meteo API connection timed out.');
    }
    throw err;
  }
}

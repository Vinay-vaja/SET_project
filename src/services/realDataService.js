// realDataService.js — Central Real-World Environmental Telemetry Service
// Coordinates geolocation, Open-Meteo telemetry, reverse geocoding, and local caching

import { fetchOpenMeteoData } from './weatherService.js';
import { reverseGeocode, DEFAULT_LOCATION, PRESET_LOCATIONS } from './locationService.js';

const CACHE_KEY = 'greenpulse_real_telemetry_cache';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

/**
 * Reads cached real data if fresh and valid
 */
export function getCachedRealData() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const age = Date.now() - new Date(parsed.cachedAt).getTime();
    if (age < CACHE_TTL_MS) {
      return parsed;
    }
  } catch (err) {
    console.warn('Cache read notice:', err);
  }
  return null;
}

/**
 * Saves successful response to cache
 */
export function setCachedRealData(data) {
  if (typeof window === 'undefined' || !data) return;
  try {
    const payload = {
      ...data,
      cachedAt: new Date().toISOString(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('Cache write notice:', err);
  }
}

/**
 * Fetches unified real environmental state for given latitude & longitude
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {Object} [knownLocation] - Pre-known location metadata if selecting from presets
 * @returns {Promise<Object>} Clean, standard environmental conditions payload
 */
export async function getRealConditions(lat, lon, knownLocation = null) {
  // 1. Resolve Location Meta
  let locMeta = knownLocation;
  if (!locMeta) {
    locMeta = await reverseGeocode(lat, lon);
  }

  // 2. Fetch Open-Meteo Meteorological Data
  const weather = await fetchOpenMeteoData(lat, lon);

  const payload = {
    location: locMeta.name || 'Custom Location',
    region: locMeta.region || '',
    fullAddress: locMeta.fullAddress || `${locMeta.name}, ${locMeta.region}`,
    latitude: lat,
    longitude: lon,
    temperature: weather.temperature,
    apparentTemperature: weather.apparentTemperature,
    humidity: weather.humidity,
    windSpeed: weather.windSpeed,
    windSpeedKmh: weather.windSpeedKmh,
    windDirection: weather.windDirection,
    cloudCover: weather.cloudCover,
    solarIrradiance: weather.solarIrradiance,
    isDay: weather.isDay,
    precipitation: weather.precipitation,
    weatherCode: weather.weatherCode,
    weatherDesc: weather.weatherDesc,
    sunrise: weather.sunrise,
    sunset: weather.sunset,
    updatedAt: weather.updatedAt,
    dataSource: 'Open-Meteo Free Meteorological API (Live)',
    isRealData: true,
  };

  // Cache successful result
  setCachedRealData(payload);

  return payload;
}

/**
 * Fetches default location conditions (Ahmedabad) or last cached values
 */
export async function getDefaultConditions() {
  const cached = getCachedRealData();
  if (cached) return cached;

  return getRealConditions(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon, {
    name: DEFAULT_LOCATION.name,
    region: DEFAULT_LOCATION.region,
  });
}

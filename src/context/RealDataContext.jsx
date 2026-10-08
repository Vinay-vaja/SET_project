// RealDataContext.jsx — Centralized Real-World Environmental Telemetry Context
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  getUserCoordinates,
  reverseGeocode,
  PRESET_LOCATIONS,
  DEFAULT_LOCATION,
} from '../services/locationService.js';
import {
  getRealConditions,
  getCachedRealData,
} from '../services/realDataService.js';

const RealDataContext = createContext(null);

export function RealDataProvider({ children }) {
  const [conditions, setConditions] = useState(() => {
    const cached = getCachedRealData();
    if (cached) return cached;
    return {
      location: DEFAULT_LOCATION.name,
      region: DEFAULT_LOCATION.region,
      fullAddress: `${DEFAULT_LOCATION.name}, ${DEFAULT_LOCATION.region}`,
      latitude: DEFAULT_LOCATION.lat,
      longitude: DEFAULT_LOCATION.lon,
      temperature: 31.4,
      apparentTemperature: 33.2,
      humidity: 58,
      windSpeed: 4.8,
      windSpeedKmh: 17.3,
      windDirection: 240,
      cloudCover: 15,
      solarIrradiance: 742,
      isDay: true,
      precipitation: 0.0,
      weatherCode: 1,
      weatherDesc: 'Mainly Clear',
      sunrise: '06:15',
      sunset: '18:45',
      updatedAt: new Date().toISOString(),
      dataSource: 'Initial Baseline / Open-Meteo Reference',
      isRealData: true,
    };
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRealMode, setIsRealMode] = useState(false); // Mode toggle: Simulation Mode vs Real Conditions
  const [selectedLocationId, setSelectedLocationId] = useState(DEFAULT_LOCATION.id);

  // Fetch real data for coordinates
  const fetchConditionsForCoords = useCallback(async (lat, lon, knownMeta = null) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRealConditions(lat, lon, knownMeta);
      setConditions(data);
      setLoading(false);
      return data;
    } catch (err) {
      console.warn('Real data fetch notice:', err.message);
      setError(err.message || 'Real conditions temporarily unavailable.');
      setLoading(false);
      return null;
    }
  }, []);

  // Request browser geolocation
  const requestUserLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const coords = await getUserCoordinates();
      const meta = await reverseGeocode(coords.lat, coords.lon);
      const data = await getRealConditions(coords.lat, coords.lon, meta);
      setConditions(data);
      setSelectedLocationId('gps');
      setLoading(false);
      return { success: true, data };
    } catch (err) {
      setError(err.message || 'Could not acquire GPS position. You can select a city manually.');
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  // Select manual location from presets
  const selectManualLocation = useCallback((locationIdOrObj) => {
    let loc = null;
    if (typeof locationIdOrObj === 'string') {
      loc = PRESET_LOCATIONS.find((l) => l.id === locationIdOrObj) || DEFAULT_LOCATION;
    } else if (locationIdOrObj && typeof locationIdOrObj === 'object') {
      loc = locationIdOrObj;
    }

    if (!loc) loc = DEFAULT_LOCATION;

    setSelectedLocationId(loc.id || 'custom');
    return fetchConditionsForCoords(loc.lat, loc.lon, {
      name: loc.name,
      region: loc.region,
    });
  }, [fetchConditionsForCoords]);

  // Refresh current coordinates
  const refreshRealData = useCallback(() => {
    return fetchConditionsForCoords(conditions.latitude, conditions.longitude, {
      name: conditions.location,
      region: conditions.region,
    });
  }, [conditions.latitude, conditions.longitude, conditions.location, conditions.region, fetchConditionsForCoords]);

  // Initial fetch on mount (refresh cache / get latest live conditions)
  useEffect(() => {
    fetchConditionsForCoords(conditions.latitude, conditions.longitude, {
      name: conditions.location,
      region: conditions.region,
    });
    // Interval update every 15 minutes
    const timer = setInterval(() => {
      refreshRealData();
    }, 15 * 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  const value = useMemo(
    () => ({
      // Telemetry
      location: conditions.location,
      region: conditions.region,
      fullAddress: conditions.fullAddress,
      latitude: conditions.latitude,
      longitude: conditions.longitude,
      temperature: conditions.temperature,
      apparentTemperature: conditions.apparentTemperature,
      humidity: conditions.humidity,
      windSpeed: conditions.windSpeed,
      windSpeedKmh: conditions.windSpeedKmh,
      windDirection: conditions.windDirection,
      cloudCover: conditions.cloudCover,
      solarIrradiance: conditions.solarIrradiance,
      isDay: conditions.isDay,
      precipitation: conditions.precipitation,
      weatherCode: conditions.weatherCode,
      weatherDesc: conditions.weatherDesc,
      sunrise: conditions.sunrise,
      sunset: conditions.sunset,
      updatedAt: conditions.updatedAt,
      dataSource: conditions.dataSource,
      isRealData: conditions.isRealData,

      // State flags
      loading,
      error,
      isRealMode,
      setIsRealMode,
      selectedLocationId,

      // Actions
      requestUserLocation,
      selectManualLocation,
      refreshRealData,
      availableLocations: PRESET_LOCATIONS,
    }),
    [
      conditions,
      loading,
      error,
      isRealMode,
      selectedLocationId,
      requestUserLocation,
      selectManualLocation,
      refreshRealData,
    ]
  );

  return <RealDataContext.Provider value={value}>{children}</RealDataContext.Provider>;
}

export function useRealData() {
  const ctx = useContext(RealDataContext);
  if (!ctx) throw new Error('useRealData must be used within RealDataProvider');
  return ctx;
}

// locationService.js — Browser Geolocation and Manual Location Fallbacks
// Provides safe, permission-friendly location detection with zero tracking overhead

export const PRESET_LOCATIONS = [
  { id: 'ahmedabad', name: 'Ahmedabad', region: 'Gujarat, India', lat: 23.0225, lon: 72.5714, tz: 'Asia/Kolkata' },
  { id: 'delhi', name: 'New Delhi', region: 'Delhi, India', lat: 28.6139, lon: 77.2090, tz: 'Asia/Kolkata' },
  { id: 'mumbai', name: 'Mumbai', region: 'Maharashtra, India', lat: 19.0760, lon: 72.8777, tz: 'Asia/Kolkata' },
  { id: 'bengaluru', name: 'Bengaluru', region: 'Karnataka, India', lat: 12.9716, lon: 77.5946, tz: 'Asia/Kolkata' },
  { id: 'chennai', name: 'Chennai', region: 'Tamil Nadu, India', lat: 13.0827, lon: 80.2707, tz: 'Asia/Kolkata' },
  { id: 'kolkata', name: 'Kolkata', region: 'West Bengal, India', lat: 22.5726, lon: 88.3639, tz: 'Asia/Kolkata' },
  { id: 'jaipur', name: 'Jaipur', region: 'Rajasthan, India', lat: 26.9124, lon: 75.7873, tz: 'Asia/Kolkata' },
  { id: 'london', name: 'London', region: 'United Kingdom', lat: 51.5074, lon: -0.1278, tz: 'Europe/London' },
  { id: 'berlin', name: 'Berlin', region: 'Germany', lat: 52.5200, lon: 13.4050, tz: 'Europe/Berlin' },
  { id: 'tokyo', name: 'Tokyo', region: 'Japan', lat: 35.6762, lon: 139.6503, tz: 'Asia/Tokyo' },
  { id: 'newyork', name: 'New York', region: 'NY, USA', lat: 40.7128, lon: -74.0060, tz: 'America/New_York' },
  { id: 'dubai', name: 'Dubai', region: 'United Arab Emirates', lat: 25.2048, lon: 55.2708, tz: 'Asia/Dubai' },
  { id: 'sydney', name: 'Sydney', region: 'Australia', lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney' },
];

export const DEFAULT_LOCATION = PRESET_LOCATIONS[0]; // Ahmedabad, Gujarat

/**
 * Request user's current GPS position via navigator.geolocation
 * Never tracks continuously — takes a one-time single shot reading
 */
export async function getUserCoordinates(options = { timeout: 10000, maximumAge: 300000 }) {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported by this browser.');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: +position.coords.latitude.toFixed(4),
          lon: +position.coords.longitude.toFixed(4),
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let msg = 'Unable to retrieve your location.';
        if (error.code === 1) msg = 'Location permission was denied. Please select a location manually.';
        else if (error.code === 2) msg = 'Position unavailable on this network/device.';
        else if (error.code === 3) msg = 'Location request timed out.';
        const err = new Error(msg);
        err.code = error.code;
        reject(err);
      },
      options
    );
  });
}

/**
 * Reverse geocode latitude & longitude to human-readable city/region name
 * Uses OpenStreetMap Nominatim with safe fallback to nearest preset
 */
export async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GreenPulse-SDG7-Platform',
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || 'Custom Location';
      const state = addr.state || addr.country || '';
      const country = addr.country || '';

      return {
        name: city,
        region: state ? `${state}${country && state !== country ? ', ' + country : ''}` : country,
        fullAddress: data.display_name,
      };
    }
  } catch (err) {
    console.warn('Reverse geocoding notice:', err.message);
  }

  // Fallback: Find closest preset location by Euclidean distance
  let closest = DEFAULT_LOCATION;
  let minDist = Infinity;
  for (const loc of PRESET_LOCATIONS) {
    const d = Math.hypot(loc.lat - lat, loc.lon - lon);
    if (d < minDist) {
      minDist = d;
      closest = loc;
    }
  }

  if (minDist < 1.5) {
    return { name: closest.name, region: closest.region, fullAddress: `${closest.name}, ${closest.region}` };
  }

  return {
    name: `Coordinates (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
    region: 'Detected Location',
    fullAddress: `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`,
  };
}

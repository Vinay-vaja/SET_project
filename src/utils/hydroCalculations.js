// Hydro Energy Calculations
// Formula: Theoretical Power = rho × g × Q × H (Watts)
// Actual Electrical Energy = Theoretical Power × Efficiency × Operating Hours

const WATER_DENSITY = 1000; // kg/m^3
const GRAVITY = 9.81; // m/s^2

/**
 * Calculate hydro energy generation with support for hydraulic head & flow rate
 * @param {number} capacityKW - Rated capacity in kW (fallback)
 * @param {number} operatingHours - Daily operating hours
 * @param {number} efficiencyPct - Overall system efficiency % (turbine + generator)
 * @param {number} [headHeight] - Net hydraulic head in meters
 * @param {number} [flowRate] - Volumetric water flow rate in m^3/s
 * @returns {number} Energy in kWh/day
 */
export function calcHydroEnergy(capacityKW, operatingHours, efficiencyPct, headHeight = null, flowRate = null) {
  const efficiency = efficiencyPct / 100;
  if (headHeight !== null && headHeight !== undefined && flowRate !== null && flowRate !== undefined && headHeight > 0 && flowRate > 0) {
    // P = rho * g * Q * H / 1000 (kW)
    const powerKW = (WATER_DENSITY * GRAVITY * flowRate * headHeight) / 1000;
    return powerKW * operatingHours * efficiency;
  }
  return capacityKW * operatingHours * efficiency;
}

/**
 * Calculate comprehensive hydro metrics with explainable physical breakdown
 */
export function calcHydroMetrics(capacityKW, operatingHours, efficiencyPct, headHeight = 15, flowRate = 0.025) {
  const efficiency = efficiencyPct / 100;
  // Static penstock water column pressure in kPa (P = rho * g * H / 1000)
  const penstockPressureKPa = (WATER_DENSITY * GRAVITY * headHeight) / 1000;
  // Theoretical hydraulic kinetic power (kW)
  const theoreticalPowerKW = (WATER_DENSITY * GRAVITY * flowRate * headHeight) / 1000;
  const actualPowerKW = theoreticalPowerKW * efficiency;
  const energy = calcHydroEnergy(capacityKW, operatingHours, efficiencyPct, headHeight, flowRate);

  return {
    energy: +energy.toFixed(2),
    headHeight,
    flowRate,
    penstockPressureKPa: +penstockPressureKPa.toFixed(1),
    theoreticalPowerKW: +theoreticalPowerKW.toFixed(2),
    actualPowerKW: +actualPowerKW.toFixed(2),
    turbineType: headHeight > 40 ? 'Pelton Impulse Wheel' : headHeight > 10 ? 'Francis Reaction Runner' : 'Kaplan Axial Propeller',
    monthlyEnergy: +(energy * 30).toFixed(1),
    annualEnergy: +(energy * 365).toFixed(1),
    capacityFactor: +Math.min(100, (operatingHours / 24) * 100).toFixed(1),
  };
}


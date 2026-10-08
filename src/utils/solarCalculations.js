// Solar Energy Calculations
// Formula: Solar Energy = Capacity × Sunlight Hours × Efficiency

/**
 * Calculate daily solar energy generation
 * @param {number} capacityKW - Installed capacity in kW
 * @param {number} sunlightHours - Average daily sunlight hours
 * @param {number} efficiencyPct - Panel efficiency as percentage
 * @returns {number} Energy in kWh/day
 */
export function calcSolarEnergy(capacityKW, sunlightHours, efficiencyPct) {
  const efficiency = efficiencyPct / 100;
  return capacityKW * sunlightHours * efficiency;
}

/**
 * Calculate performance ratio and yield
 */
export function calcSolarMetrics(capacityKW, sunlightHours, efficiencyPct) {
  const energy = calcSolarEnergy(capacityKW, sunlightHours, efficiencyPct);
  const specificYield = energy / capacityKW; // kWh/kWp/day
  const capacityFactor = (energy / (capacityKW * 24)) * 100; // %

  return {
    energy,
    specificYield,
    capacityFactor: Math.min(capacityFactor, 100),
    monthlyEnergy: energy * 30,
    annualEnergy: energy * 365,
  };
}

// Wind Energy Calculations
// Formula: Wind Energy = Capacity × NumTurbines × Hours × CapacityFactor

/**
 * Calculate daily wind energy generation
 * @param {number} turbineCapacityKW - Capacity per turbine in kW
 * @param {number} numTurbines - Number of turbines
 * @param {number} capacityFactorPct - Capacity factor as percentage (typical 25-45%)
 * @returns {number} Energy in kWh/day
 */
export function calcWindEnergy(turbineCapacityKW, numTurbines, capacityFactorPct) {
  const capacityFactor = capacityFactorPct / 100;
  const totalCapacity = turbineCapacityKW * numTurbines;
  return totalCapacity * 24 * capacityFactor;
}

/**
 * Estimate capacity factor from wind speed using simplified model
 * Typical rated wind speed ~12 m/s, cut-in ~3 m/s, cut-out ~25 m/s
 */
export function estimateCapacityFactor(windSpeedMs) {
  if (windSpeedMs < 3) return 0;
  if (windSpeedMs >= 25) return 0; // cut-out
  if (windSpeedMs >= 12) return 45; // rated power
  // Linear approximation between cut-in and rated
  const cf = ((windSpeedMs - 3) / (12 - 3)) * 45;
  return Math.max(0, Math.min(45, cf));
}

export function calcWindMetrics(turbineCapacityKW, numTurbines, windSpeedMs, capacityFactorPct) {
  const energy = calcWindEnergy(turbineCapacityKW, numTurbines, capacityFactorPct);
  const totalCapacity = turbineCapacityKW * numTurbines;
  const estimatedCF = estimateCapacityFactor(windSpeedMs);

  return {
    energy,
    totalCapacity,
    capacityFactor: capacityFactorPct,
    estimatedCF,
    monthlyEnergy: energy * 30,
    annualEnergy: energy * 365,
  };
}

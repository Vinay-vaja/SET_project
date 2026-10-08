// Hydro Energy Calculations
// Formula: Hydro Energy = Capacity × Operating Hours × Efficiency

export function calcHydroEnergy(capacityKW, operatingHours, efficiencyPct) {
  return capacityKW * operatingHours * (efficiencyPct / 100);
}

export function calcHydroMetrics(capacityKW, operatingHours, efficiencyPct) {
  const energy = calcHydroEnergy(capacityKW, operatingHours, efficiencyPct);
  return {
    energy,
    monthlyEnergy: energy * 30,
    annualEnergy: energy * 365,
    capacityFactor: (operatingHours / 24) * 100,
  };
}

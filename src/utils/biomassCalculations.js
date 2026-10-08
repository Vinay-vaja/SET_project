// Biomass Energy Calculations
// Formula: Biomass Energy = Input × Calorific Value × Conversion Efficiency
// Biomass calorific value assumed ~4.5 kWh/kg (general mixed biomass)

const BIOMASS_CALORIFIC_VALUE = 4.5; // kWh/kg

export function calcBiomassEnergy(inputKgPerDay, conversionEfficiencyPct) {
  return inputKgPerDay * BIOMASS_CALORIFIC_VALUE * (conversionEfficiencyPct / 100);
}

export function calcBiomassMetrics(inputKgPerDay, conversionEfficiencyPct) {
  const energy = calcBiomassEnergy(inputKgPerDay, conversionEfficiencyPct);
  return {
    energy,
    monthlyEnergy: energy * 30,
    annualEnergy: energy * 365,
    calorificValue: BIOMASS_CALORIFIC_VALUE,
    theoreticalEnergy: inputKgPerDay * BIOMASS_CALORIFIC_VALUE,
  };
}

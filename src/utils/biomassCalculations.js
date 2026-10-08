// Biomass Energy Calculations
// Formula: Energy = Input Mass × Net Lower Heating Value (LHV) × Conversion Efficiency
// Supports Multi-Feedstock Types & Combined Heat & Power (CHP) Cogeneration

export const BIOMASS_FEEDSTOCKS = {
  agricultural: {
    id: 'agricultural',
    name: 'Crop Residue & Straw',
    baseCalorificValue: 4.2, // kWh/kg dry
    defaultMoisture: 14, // %
    co2NeutralityPct: 95,
    description: 'Wheat straw, rice husk, bagasse, corn stover',
  },
  wood: {
    id: 'wood',
    name: 'Wood Pellets & Forest Waste',
    baseCalorificValue: 4.8, // kWh/kg dry
    defaultMoisture: 10, // %
    co2NeutralityPct: 97,
    description: 'Timber sawmill shavings, forestry residue, dried pellets',
  },
  organic_waste: {
    id: 'organic_waste',
    name: 'Municipal Organic Waste (Biogas)',
    baseCalorificValue: 2.6, // kWh/kg
    defaultMoisture: 28, // %
    co2NeutralityPct: 92,
    description: 'Food scrap, municipal organic waste anaerobic digestion',
  },
};

const DEFAULT_CALORIFIC_VALUE = 4.5; // kWh/kg (backward compatibility)

/**
 * Calculate effective lower heating value (LHV) derated for moisture
 */
export function calcEffectiveLHV(baseCalorificValue, moisturePct) {
  const m = Math.max(0, Math.min(60, moisturePct)) / 100;
  // Latent heat of vaporization penalty (approx 0.68 kWh per kg of water vaporized)
  const effective = baseCalorificValue * (1 - m) - 0.68 * m;
  return Math.max(1.0, effective);
}

/**
 * Calculate daily electrical biomass energy generation
 * @param {number} inputKgPerDay - Daily feedstock mass in kg
 * @param {number} conversionEfficiencyPct - Electrical conversion efficiency %
 * @param {string} [feedstockKey] - 'agricultural' | 'wood' | 'organic_waste'
 * @param {number} [moisturePct] - Moisture content percentage
 * @returns {number} Electrical energy in kWh/day
 */
export function calcBiomassEnergy(inputKgPerDay, conversionEfficiencyPct, feedstockKey = 'agricultural', moisturePct = null) {
  const feedstock = BIOMASS_FEEDSTOCKS[feedstockKey];
  const baseLHV = feedstock ? feedstock.baseCalorificValue : DEFAULT_CALORIFIC_VALUE;
  const m = moisturePct !== null && moisturePct !== undefined ? moisturePct : (feedstock?.defaultMoisture ?? 14);
  const effectiveLHV = calcEffectiveLHV(baseLHV, m);

  return inputKgPerDay * effectiveLHV * (conversionEfficiencyPct / 100);
}

/**
 * Calculate comprehensive biomass & CHP metrics with explainable breakdown
 */
export function calcBiomassMetrics(inputKgPerDay, conversionEfficiencyPct, feedstockKey = 'agricultural', moisturePct = null) {
  const feedstock = BIOMASS_FEEDSTOCKS[feedstockKey] || BIOMASS_FEEDSTOCKS.agricultural;
  const m = moisturePct !== null && moisturePct !== undefined ? moisturePct : feedstock.defaultMoisture;
  const effectiveLHV = calcEffectiveLHV(feedstock.baseCalorificValue, m);

  const electricalEnergy = calcBiomassEnergy(inputKgPerDay, conversionEfficiencyPct, feedstockKey, m);
  const totalThermalInput = inputKgPerDay * effectiveLHV;
  // CHP thermal recovery: typically 45-50% recovered as district/industrial process heat
  const recoveredThermalHeatKWh = +(totalThermalInput * 0.46).toFixed(2);
  const totalUsefulEnergy = +(electricalEnergy + recoveredThermalHeatKWh).toFixed(2);
  const combinedChpEfficiencyPct = totalThermalInput > 0 ? +((totalUsefulEnergy / totalThermalInput) * 100).toFixed(1) : 0;

  return {
    energy: +electricalEnergy.toFixed(2),
    electricalEnergy: +electricalEnergy.toFixed(2),
    recoveredThermalHeatKWh,
    totalUsefulEnergy,
    combinedChpEfficiencyPct,
    feedstockName: feedstock.name,
    feedstockKey,
    effectiveLHV: +effectiveLHV.toFixed(2),
    moisturePct: m,
    monthlyEnergy: +(electricalEnergy * 30).toFixed(1),
    annualEnergy: +(electricalEnergy * 365).toFixed(1),
    calorificValue: +effectiveLHV.toFixed(2),
    theoreticalEnergy: +totalThermalInput.toFixed(2),
  };
}


// Waste-to-Energy Calculations

const CALORIFIC_VALUES = {
  municipal: 2.5, // kWh/kg average MSW
  organic: 1.8,
  plastic: 8.9,
  paper: 4.1,
};

const TECHNOLOGY_EFFICIENCIES = {
  incineration: 0.22,
  pyrolysis: 0.30,
  gasification: 0.28,
  anaerobicDigestion: 0.35,
  landfillGas: 0.30,
};

/**
 * Calculate energy recovery from waste
 */
export function calcWasteToEnergy({
  totalWasteKg,
  organicPct,
  moisturePct,
  technology,
  conversionEfficiencyPct,
}) {
  const organicFraction = organicPct / 100;
  const moistureFraction = moisturePct / 100;

  // Effective dry mass
  const dryMass = totalWasteKg * (1 - moistureFraction);

  // Theoretical energy content
  const avgCalorific = CALORIFIC_VALUES.municipal * (1 - organicFraction) + CALORIFIC_VALUES.organic * organicFraction;
  const theoreticalEnergy = dryMass * avgCalorific;

  // Actual efficiency
  const techEff = TECHNOLOGY_EFFICIENCIES[technology] || 0.25;
  const userEff = conversionEfficiencyPct / 100;
  const combinedEff = Math.min(techEff * (userEff / 0.25), techEff * 1.2); // user efficiency scales around tech baseline

  const electricityGenerated = theoreticalEnergy * combinedEff;
  const heatGenerated = theoreticalEnergy * (combinedEff * 1.5); // assuming CHP: heat is ~1.5x electricity

  // CO2 factor: waste-to-energy avoids landfill methane
  const co2AvoidedLandfill = totalWasteKg * 0.5; // kg CO2eq avoided by not landfilling
  const co2EmittedProcess = electricityGenerated * 0.35; // kg CO2 from combustion process
  const netCo2Avoided = co2AvoidedLandfill - co2EmittedProcess;

  const wasteReduction = technology === 'anaerobicDigestion' || technology === 'landfillGas'
    ? totalWasteKg * 0.4
    : totalWasteKg * 0.9;

  return {
    electricityGenerated: +electricityGenerated.toFixed(2),
    heatGenerated: +heatGenerated.toFixed(2),
    co2Avoided: +Math.max(0, netCo2Avoided).toFixed(2),
    wasteProcessed: +totalWasteKg.toFixed(1),
    wasteReduced: +wasteReduction.toFixed(1),
    remainingWaste: +(totalWasteKg - wasteReduction).toFixed(1),
    theoreticalEnergy: +theoreticalEnergy.toFixed(2),
    efficiency: +(combinedEff * 100).toFixed(1),
    dryMass: +dryMass.toFixed(1),
  };
}

/**
 * Compare all technologies for a given waste input
 */
export function compareWasteTechnologies(totalWasteKg, organicPct, moisturePct) {
  return Object.entries(TECHNOLOGY_EFFICIENCIES).map(([tech, eff]) => {
    const result = calcWasteToEnergy({
      totalWasteKg,
      organicPct,
      moisturePct,
      technology: tech,
      conversionEfficiencyPct: eff * 100,
    });
    return { technology: tech, ...result };
  });
}

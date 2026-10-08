// Green Hydrogen Calculations
// Energy pathway: Renewable → Electrolyzer → H2 → Storage → Fuel Cell → Electricity

const H2_ENERGY_DENSITY = 33.3; // kWh per kg H2 (lower heating value)

/**
 * Calculate hydrogen production from electricity
 * @param {number} electricityKWh - Input electricity (kWh/day)
 * @param {number} electrolysisEffPct - Electrolyzer efficiency %
 * @returns {number} Hydrogen produced in kg/day
 */
export function calcHydrogenProduction(electricityKWh, electrolysisEffPct) {
  const efficiencyFactor = electrolysisEffPct / 100;
  const usableEnergy = electricityKWh * efficiencyFactor;
  return usableEnergy / H2_ENERGY_DENSITY;
}

/**
 * Calculate electricity generated from hydrogen via fuel cell
 * @param {number} hydrogenKg - Hydrogen consumed in kg
 * @param {number} fuelCellEffPct - Fuel cell efficiency %
 */
export function calcFuelCellOutput(hydrogenKg, fuelCellEffPct) {
  const energy = hydrogenKg * H2_ENERGY_DENSITY;
  return energy * (fuelCellEffPct / 100);
}

/**
 * Full hydrogen pathway simulation
 */
export function calcHydrogenSystem({
  electricityInputKWh,
  electrolysisEffPct,
  storageCapacityKg,
  fuelCellEffPct,
  existingStorageKg = 0,
}) {
  const hydrogenProduced = calcHydrogenProduction(electricityInputKWh, electrolysisEffPct);
  const hydrogenStored = Math.min(hydrogenProduced + existingStorageKg, storageCapacityKg);
  const electricityGenerated = calcFuelCellOutput(hydrogenProduced, fuelCellEffPct);
  const roundTripEfficiency = (electricityGenerated / electricityInputKWh) * 100;

  // CO2 avoided: compared to SMR gray hydrogen (10 kg CO2/kg H2)
  const co2AvoidedKg = hydrogenProduced * 10;

  return {
    hydrogenProduced: +hydrogenProduced.toFixed(3),
    hydrogenStored: +hydrogenStored.toFixed(3),
    electricityGenerated: +electricityGenerated.toFixed(2),
    roundTripEfficiency: +roundTripEfficiency.toFixed(1),
    co2AvoidedKg: +co2AvoidedKg.toFixed(2),
    energyLoss: +(electricityInputKWh - electricityGenerated).toFixed(2),
  };
}

export const ELECTROLYZER_TYPES = [
  {
    id: 'alkaline',
    name: 'Alkaline (AWE)',
    efficiency: { min: 60, max: 75, typical: 67 },
    temp: '60–80°C',
    maturity: 'Commercial',
    cost: 'Low',
    stackLife: '80,000 hrs',
    pros: ['Mature technology', 'Low cost', 'No noble metals'],
    cons: ['Slow response', 'Low current density', 'Caustic electrolyte'],
  },
  {
    id: 'pem',
    name: 'PEM Electrolyzer',
    efficiency: { min: 65, max: 80, typical: 72 },
    temp: '50–80°C',
    maturity: 'Commercial',
    cost: 'Medium',
    stackLife: '60,000 hrs',
    pros: ['Fast response', 'High current density', 'Compact design'],
    cons: ['Platinum catalyst', 'Higher cost', 'Acidic membrane'],
  },
  {
    id: 'soec',
    name: 'SOEC (High Temp)',
    efficiency: { min: 75, max: 90, typical: 82 },
    temp: '700–1000°C',
    maturity: 'Research/Demo',
    cost: 'High',
    stackLife: '20,000 hrs',
    pros: ['Highest efficiency', 'Can use waste heat', 'No noble metals'],
    cons: ['High temperature', 'Slow start-up', 'Early stage'],
  },
];

export const FUEL_CELL_TYPES = [
  {
    id: 'pemfc',
    name: 'PEMFC',
    fullName: 'Proton Exchange Membrane Fuel Cell',
    efficiency: { electrical: 50, combined: 85 },
    temp: '60–80°C',
    application: 'Transport, portable power',
    pros: ['Quick startup', 'High power density', 'Compact'],
    cons: ['Platinum catalyst', 'CO sensitive'],
  },
  {
    id: 'sofc',
    name: 'SOFC',
    fullName: 'Solid Oxide Fuel Cell',
    efficiency: { electrical: 60, combined: 90 },
    temp: '700–1000°C',
    application: 'Stationary power, CHP',
    pros: ['Highest efficiency', 'Fuel flexible', 'No noble metals'],
    cons: ['Slow startup', 'High temp degradation'],
  },
  {
    id: 'afc',
    name: 'AFC',
    fullName: 'Alkaline Fuel Cell',
    efficiency: { electrical: 60, combined: 80 },
    temp: '60–90°C',
    application: 'Space, military',
    pros: ['High efficiency', 'Long heritage (NASA)'],
    cons: ['CO₂ sensitive', 'Liquid electrolyte'],
  },
  {
    id: 'pafc',
    name: 'PAFC',
    fullName: 'Phosphoric Acid Fuel Cell',
    efficiency: { electrical: 42, combined: 85 },
    temp: '150–220°C',
    application: 'Commercial CHP buildings',
    pros: ['CO tolerant', 'Proven commercial', 'Good for CHP'],
    cons: ['Phosphoric acid management', 'Large size'],
  },
];

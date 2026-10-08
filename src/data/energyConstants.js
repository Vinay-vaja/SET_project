// Energy Constants and Default Parameters
// Representative educational assumptions - not real-world engineering data

export const DEFAULT_PARAMS = {
  solar: {
    capacity: 10, // kW
    efficiency: 18, // %
    sunlightHours: 5.5, // hours/day
  },
  wind: {
    turbineCapacity: 5, // kW each
    numTurbines: 2,
    windSpeed: 7, // m/s
    capacityFactor: 30, // %
  },
  hydro: {
    capacity: 3, // kW
    operatingHours: 8, // hours/day
    efficiency: 80, // %
  },
  biomass: {
    input: 50, // kg/day
    conversionEfficiency: 25, // %
  },
  battery: {
    capacity: 20, // kWh
    initialCharge: 50, // %
    chargingEfficiency: 92, // %
    dischargingEfficiency: 92, // %
  },
  grid: {
    dailyDemand: 60, // kWh
    peakLoad: 8, // kW
    electricityCost: 7, // ₹/kWh
  },
};

export const CO2_FACTORS = {
  grid: 0.82, // kg CO2/kWh (Indian grid average)
  solar: 0.02,
  wind: 0.01,
  hydro: 0.04,
  biomass: 0.23,
  coal: 0.98,
  naturalGas: 0.49,
  nuclear: 0.012,
};

export const CALORIFIC_VALUES = {
  biomass: 4.5, // kWh/kg (general biomass)
  municipal_waste: 2.5, // kWh/kg
  organic_waste: 1.8, // kWh/kg
  syngas: 4.2, // kWh/m3
};

export const HYDROGEN_CONSTANTS = {
  energyPerKg: 33.3, // kWh/kg H2 (lower heating value)
  electrolysisKwhPerKg: 50, // kWh per kg H2 (ideal ~39, practical ~50)
  co2PerKgH2Gray: 10, // kg CO2 per kg H2 (SMR)
};

export const ENERGY_UNITS = {
  kWh: 'kWh',
  kW: 'kW',
  MWh: 'MWh',
  MW: 'MW',
};

export const SDG_WEIGHTS = {
  renewableShare: 0.30,
  gridDependency: 0.20,
  affordability: 0.20,
  efficiency: 0.15,
  renewableAdoption: 0.15,
};

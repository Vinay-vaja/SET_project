// Solar Energy Calculations
// Formula: Solar Energy = Capacity × Sunlight Hours × Efficiency × TempDerateFactor

const TEMP_COEFF_PMAX = -0.0038; // -0.38% per degree C above 25°C for standard silicon PV
const STC_TEMP = 25; // Standard Test Conditions (°C)

/**
 * Calculate daily solar energy generation with optional temperature derating
 * @param {number} capacityKW - Installed capacity in kW
 * @param {number} sunlightHours - Average daily sunlight hours
 * @param {number} efficiencyPct - Panel efficiency as percentage
 * @param {number} [ambientTempC] - Ambient cell/operating temperature in °C (default 25)
 * @returns {number} Energy in kWh/day
 */
export function calcSolarEnergy(capacityKW, sunlightHours, efficiencyPct, ambientTempC = 25) {
  const efficiency = efficiencyPct / 100;
  // Calculate thermal derating factor: P_factor = 1 + gamma * (T - 25)
  const deltaT = Math.max(0, ambientTempC - STC_TEMP);
  const tempDerate = Math.max(0.70, 1 + TEMP_COEFF_PMAX * deltaT);
  return capacityKW * sunlightHours * efficiency * tempDerate;
}

/**
 * Calculate performance ratio and explainable yield metrics
 */
export function calcSolarMetrics(capacityKW, sunlightHours, efficiencyPct, ambientTempC = 25) {
  const energy = calcSolarEnergy(capacityKW, sunlightHours, efficiencyPct, ambientTempC);
  const specificYield = capacityKW > 0 ? energy / capacityKW : 0; // kWh/kWp/day
  const capacityFactor = capacityKW > 0 ? (energy / (capacityKW * 24)) * 100 : 0; // %
  const deltaT = Math.max(0, ambientTempC - STC_TEMP);
  const thermalLossPct = +(Math.max(0, -TEMP_COEFF_PMAX * deltaT * 100)).toFixed(1);

  return {
    energy: +energy.toFixed(2),
    specificYield: +specificYield.toFixed(2),
    capacityFactor: +Math.min(capacityFactor, 100).toFixed(1),
    thermalLossPct,
    operatingTempC: ambientTempC,
    monthlyEnergy: +(energy * 30).toFixed(1),
    annualEnergy: +(energy * 365).toFixed(1),
  };
}


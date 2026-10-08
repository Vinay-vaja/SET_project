// solarDataService.js — Environmental Solar Irradiance and Physics Conversion Utilities
// Connects real-world shortwave radiation (W/m²) to PV electrical calculation engine

const STC_IRRADIANCE = 1000; // Standard Test Conditions Irradiance (1000 W/m²)
const STC_TEMP = 25; // Standard Test Conditions Cell Temp (25°C)
const TEMP_COEFF_PMAX = -0.0038; // -0.38% / °C

/**
 * Calculates estimated instantaneous PV power output based on real solar irradiance and ambient temp
 * Formula: P_pv = Capacity_kW * (G_real / 1000 W/m²) * (1 + gamma * (T_cell - 25)) * Inverter_Eff
 * @param {number} capacityKW - Nominal installed capacity in kWp
 * @param {number} irradianceWm2 - Real solar irradiance in W/m²
 * @param {number} ambientTempC - Real ambient temperature in °C
 * @param {number} efficiencyPct - Module efficiency %
 * @param {number} inverterEfficiencyPct - Inverter efficiency % (default 96%)
 * @returns {Object} Estimated electrical power and physical metrics
 */
export function estimateRealSolarPower({
  capacityKW = 25,
  irradianceWm2 = 750,
  ambientTempC = 25,
  efficiencyPct = 18,
  inverterEfficiencyPct = 96,
}) {
  const irradianceRatio = Math.max(0, irradianceWm2) / STC_IRRADIANCE;
  
  // Nominal Operating Cell Temperature (NOCT) thermal model estimate
  // T_cell = T_ambient + (NOCT - 20) * (G / 800), with NOCT ~ 45°C
  const cellTemp = ambientTempC + (45 - 20) * (Math.max(0, irradianceWm2) / 800);
  const deltaT = Math.max(0, cellTemp - STC_TEMP);
  const thermalDerate = Math.max(0.70, 1 + TEMP_COEFF_PMAX * deltaT);
  const invEff = inverterEfficiencyPct / 100;

  // Approximate active module area: A = Capacity_kW / (1 kW/m² * efficiency)
  const estimatedPanelAreaM2 = capacityKW > 0 ? (capacityKW / (efficiencyPct / 100)) : 0;

  // Instantaneous DC power (kW)
  const dcPowerKW = capacityKW * irradianceRatio * thermalDerate;
  // Instantaneous AC power (kW)
  const acPowerKW = dcPowerKW * invEff;

  // Estimate daily equivalent sunlight hours from peak irradiance (e.g. average bell curve integration)
  // Approximate equivalent full-sun hours = (irradiance / 1000) * daylight coefficient
  const estimatedDailyPeakHours = Math.max(1.0, +(irradianceRatio * 7.5).toFixed(1));

  return {
    realIrradianceWm2: Math.round(irradianceWm2),
    ambientTempC: +ambientTempC.toFixed(1),
    cellTempEstimateC: +cellTemp.toFixed(1),
    thermalLossPct: +(-TEMP_COEFF_PMAX * deltaT * 100).toFixed(1),
    estimatedPanelAreaM2: +estimatedPanelAreaM2.toFixed(1),
    dcPowerKW: +dcPowerKW.toFixed(2),
    acPowerKW: +acPowerKW.toFixed(2),
    estimatedDailyPeakHours,
    dataSource: 'Open-Meteo Real Irradiance & Ambient Temperature',
  };
}

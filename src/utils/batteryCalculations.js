// Battery Storage Calculations

/**
 * Simulate battery charge/discharge for one day
 * @param {number} capacityKWh - Battery capacity
 * @param {number} initialChargePct - Initial state of charge %
 * @param {number} generationKWh - Total renewable generation
 * @param {number} demandKWh - Total daily demand
 * @param {number} chargingEffPct - Charging efficiency %
 * @param {number} dischargingEffPct - Discharging efficiency %
 */
export function calcBatteryBalance(
  capacityKWh,
  initialChargePct,
  generationKWh,
  demandKWh,
  chargingEffPct,
  dischargingEffPct
) {
  const chargingEff = chargingEffPct / 100;
  const dischargingEff = dischargingEffPct / 100;

  let storedEnergy = capacityKWh * (initialChargePct / 100);
  let surplus = generationKWh - demandKWh;
  let gridEnergy = 0;
  let batteryCharged = 0;
  let batteryDischarged = 0;

  if (surplus > 0) {
    // Generation exceeds demand — charge battery
    const chargeAmount = Math.min(surplus * chargingEff, capacityKWh - storedEnergy);
    storedEnergy += chargeAmount;
    batteryCharged = chargeAmount;
  } else {
    // Demand exceeds generation — discharge battery
    const deficit = Math.abs(surplus);
    const availableEnergy = storedEnergy * dischargingEff;
    if (availableEnergy >= deficit) {
      const dischargeAmount = deficit / dischargingEff;
      storedEnergy -= dischargeAmount;
      batteryDischarged = deficit;
    } else {
      batteryDischarged = availableEnergy;
      storedEnergy = 0;
      gridEnergy = deficit - availableEnergy;
    }
  }

  const finalSoC = (storedEnergy / capacityKWh) * 100;

  return {
    finalSoC: Math.max(0, Math.min(100, finalSoC)),
    storedEnergy: Math.max(0, storedEnergy),
    batteryCharged,
    batteryDischarged,
    gridEnergy: Math.max(0, gridEnergy),
    surplus: Math.max(0, surplus - batteryCharged / chargingEff),
  };
}

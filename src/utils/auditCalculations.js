// Energy Audit Calculations

const CO2_PER_KWH = 0.82; // kg CO2/kWh (Indian grid factor)

/**
 * Calculate energy consumption for a single equipment
 */
export function calcEquipmentEnergy(quantity, powerKW, hoursPerDay) {
  return quantity * powerKW * hoursPerDay; // kWh/day
}

/**
 * Calculate full audit from equipment list
 */
export function calcAuditResults(equipmentList, electricityCostPerKWh = 7) {
  const results = equipmentList.map((eq) => {
    const dailyKWh = calcEquipmentEnergy(eq.quantity, eq.powerKW, eq.hoursPerDay);
    const monthlyKWh = dailyKWh * 30;
    const annualKWh = dailyKWh * 365;
    const monthlyCost = monthlyKWh * electricityCostPerKWh;
    const co2PerDay = dailyKWh * CO2_PER_KWH;

    return {
      ...eq,
      dailyKWh: +dailyKWh.toFixed(2),
      monthlyKWh: +monthlyKWh.toFixed(2),
      annualKWh: +annualKWh.toFixed(2),
      monthlyCost: +monthlyCost.toFixed(2),
      co2PerDay: +co2PerDay.toFixed(3),
    };
  });

  const totalDailyKWh = results.reduce((sum, eq) => sum + eq.dailyKWh, 0);
  const totalMonthlyKWh = results.reduce((sum, eq) => sum + eq.monthlyKWh, 0);
  const totalMonthlyCost = results.reduce((sum, eq) => sum + eq.monthlyCost, 0);
  const totalCo2PerDay = results.reduce((sum, eq) => sum + eq.co2PerDay, 0);

  // Calculate percentage contribution
  const resultsWithPct = results.map((eq) => ({
    ...eq,
    percentage: totalDailyKWh > 0 ? +((eq.dailyKWh / totalDailyKWh) * 100).toFixed(1) : 0,
  }));

  // Sort by consumption descending
  resultsWithPct.sort((a, b) => b.dailyKWh - a.dailyKWh);

  return {
    equipment: resultsWithPct,
    totals: {
      dailyKWh: +totalDailyKWh.toFixed(2),
      monthlyKWh: +totalMonthlyKWh.toFixed(2),
      annualKWh: +(totalDailyKWh * 365).toFixed(2),
      monthlyCost: +totalMonthlyCost.toFixed(2),
      annualCost: +(totalMonthlyCost * 12).toFixed(2),
      co2PerDay: +totalCo2PerDay.toFixed(3),
      co2PerMonth: +(totalCo2PerDay * 30).toFixed(2),
    },
  };
}

/**
 * Generate audit recommendations based on equipment consumption
 */
export function generateRecommendations(auditResults) {
  const recs = [];
  const { equipment, totals } = auditResults;

  if (equipment.length === 0) return recs;

  equipment.forEach((eq) => {
    if (eq.percentage > 30) {
      recs.push({
        equipment: eq.name,
        type: 'high_consumption',
        severity: 'high',
        message: `${eq.name} accounts for ${eq.percentage}% of total energy use.`,
        action: getRecommendationAction(eq.name),
        estimatedSavingPct: 15,
        estimatedSavingKWh: +(eq.monthlyKWh * 0.15).toFixed(1),
        estimatedSavingCost: +(eq.monthlyCost * 0.15).toFixed(0),
      });
    } else if (eq.percentage > 15) {
      recs.push({
        equipment: eq.name,
        type: 'moderate_consumption',
        severity: 'medium',
        message: `${eq.name} is a significant consumer at ${eq.percentage}%.`,
        action: getRecommendationAction(eq.name),
        estimatedSavingPct: 10,
        estimatedSavingKWh: +(eq.monthlyKWh * 0.10).toFixed(1),
        estimatedSavingCost: +(eq.monthlyCost * 0.10).toFixed(0),
      });
    }
    if (eq.hoursPerDay > 16 && eq.powerKW > 0.5) {
      recs.push({
        equipment: eq.name,
        type: 'long_runtime',
        severity: 'medium',
        message: `${eq.name} runs for ${eq.hoursPerDay}h/day. Consider scheduling or automation.`,
        action: 'Install timers or occupancy sensors to reduce operating hours.',
        estimatedSavingPct: 20,
        estimatedSavingKWh: +(eq.monthlyKWh * 0.20).toFixed(1),
        estimatedSavingCost: +(eq.monthlyCost * 0.20).toFixed(0),
      });
    }
  });

  // General recommendation
  if (totals.dailyKWh > 50) {
    recs.push({
      equipment: 'Overall System',
      type: 'solar_recommendation',
      severity: 'opportunity',
      message: `Total daily load of ${totals.dailyKWh} kWh could benefit from solar PV installation.`,
      action: `Consider a ${Math.ceil(totals.dailyKWh / 5)} kW solar system to offset grid consumption.`,
      estimatedSavingPct: 40,
      estimatedSavingKWh: +(totals.monthlyKWh * 0.40).toFixed(1),
      estimatedSavingCost: +(totals.monthlyCost * 0.40).toFixed(0),
    });
  }

  return recs;
}

function getRecommendationAction(equipmentName) {
  const name = equipmentName.toLowerCase();
  if (name.includes('ac') || name.includes('air')) {
    return 'Set AC to 24–26°C. Use timer settings. Ensure proper insulation and regular maintenance.';
  }
  if (name.includes('light') || name.includes('lamp') || name.includes('bulb')) {
    return 'Replace with LED lighting. Install occupancy sensors and daylight controls.';
  }
  if (name.includes('motor') || name.includes('pump')) {
    return 'Install Variable Frequency Drives (VFD). Optimize operating schedules.';
  }
  if (name.includes('computer') || name.includes('pc')) {
    return 'Enable power-saving modes. Use energy-efficient displays. Shut down when not in use.';
  }
  if (name.includes('fridge') || name.includes('refrigerator')) {
    return 'Ensure door seals are intact. Set to recommended temperature (3–5°C). Avoid overfilling.';
  }
  return 'Review operating schedule and consider energy-efficient alternatives.';
}

export const DEFAULT_EQUIPMENT = [
  { id: '1', name: 'Air Conditioner', quantity: 2, powerKW: 1.5, hoursPerDay: 8 },
  { id: '2', name: 'LED Lights', quantity: 20, powerKW: 0.01, hoursPerDay: 10 },
  { id: '3', name: 'Computer', quantity: 5, powerKW: 0.15, hoursPerDay: 8 },
  { id: '4', name: 'Refrigerator', quantity: 1, powerKW: 0.15, hoursPerDay: 24 },
  { id: '5', name: 'Electric Fan', quantity: 6, powerKW: 0.05, hoursPerDay: 10 },
];

// Wind Energy Calculations
// Formula: Wind Energy = Capacity × NumTurbines × Hours × CapacityFactor
// Real-world Aerodynamics: Power proportional to v^3 with Betz Limit (59.3% max)

/**
 * Calculate daily wind energy generation
 * @param {number} turbineCapacityKW - Capacity per turbine in kW
 * @param {number} numTurbines - Number of turbines
 * @param {number} capacityFactorPct - Capacity factor as percentage (typical 25-45%)
 * @returns {number} Energy in kWh/day
 */
export function calcWindEnergy(turbineCapacityKW, numTurbines, capacityFactorPct) {
  const capacityFactor = capacityFactorPct / 100;
  const totalCapacity = turbineCapacityKW * numTurbines;
  return totalCapacity * 24 * capacityFactor;
}

/**
 * Estimate capacity factor and operating state from wind speed using standard IEC power curve
 * Cut-in: ~3 m/s, Rated: ~12 m/s, Cut-out: ~25 m/s
 */
export function estimateCapacityFactor(windSpeedMs) {
  if (windSpeedMs < 3) return 0; // Below cut-in (rotor idle/standby)
  if (windSpeedMs >= 25) return 0; // Cut-out storm brake
  if (windSpeedMs >= 12) return 45; // Rated plateau power
  // Cubic to linear power curve between cut-in and rated
  const normalized = (windSpeedMs - 3) / (12 - 3);
  const cf = Math.pow(normalized, 2.2) * 45;
  return Math.max(0, Math.min(45, cf));
}

/**
 * Determine physical turbine operational aerodynamic state
 */
export function getTurbineOperatingState(windSpeedMs) {
  if (windSpeedMs < 3) {
    return {
      status: 'Standby / Idle',
      badgeClass: 'idle',
      desc: 'Wind speed below 3 m/s cut-in. Aerodynamic torque insufficient to overcome static friction.',
      rotorRpm: 0,
    };
  }
  if (windSpeedMs > 25) {
    return {
      status: 'Emergency Feather / Storm Brake',
      badgeClass: 'storm',
      desc: 'Wind speed exceeds 25 m/s cut-out threshold. Mechanical disk brakes engaged to protect gearbox.',
      rotorRpm: 0,
    };
  }
  if (windSpeedMs >= 12) {
    return {
      status: 'Rated Full Generation',
      badgeClass: 'rated',
      desc: 'Operating at maximum rated electrical output with pitch control feathering to prevent generator overload.',
      rotorRpm: 18,
    };
  }
  return {
    status: 'Active Aerodynamic Generation',
    badgeClass: 'active',
    desc: 'Generating variable power proportional to air velocity cube (v³). Active yaw tracking aligned with wind vector.',
    rotorRpm: +(6 + ((windSpeedMs - 3) / 9) * 11).toFixed(1),
  };
}

export function calcWindMetrics(turbineCapacityKW, numTurbines, windSpeedMs, capacityFactorPct) {
  const energy = calcWindEnergy(turbineCapacityKW, numTurbines, capacityFactorPct);
  const totalCapacity = turbineCapacityKW * numTurbines;
  const estimatedCF = estimateCapacityFactor(windSpeedMs);
  const state = getTurbineOperatingState(windSpeedMs);

  return {
    energy: +energy.toFixed(2),
    totalCapacity,
    capacityFactor: capacityFactorPct,
    estimatedCF: +estimatedCF.toFixed(1),
    state,
    monthlyEnergy: +(energy * 30).toFixed(1),
    annualEnergy: +(energy * 365).toFixed(1),
  };
}


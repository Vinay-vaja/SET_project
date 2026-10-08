// EnergyContext.jsx — Centralized simulation state shared across all pages
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { DEFAULT_PARAMS, CO2_FACTORS } from '../data/energyConstants.js';
import { calcSolarEnergy } from '../utils/solarCalculations.js';
import { calcWindEnergy } from '../utils/windCalculations.js';
import { calcHydroEnergy } from '../utils/hydroCalculations.js';
import { calcBiomassEnergy } from '../utils/biomassCalculations.js';
import { calcBatteryBalance } from '../utils/batteryCalculations.js';
import { calcSDG7Score } from '../utils/sdgScore.js';

const EnergyContext = createContext(null);

export function EnergyProvider({ children }) {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [simResults, setSimResults] = useState(null);
  const [hasSimulated, setHasSimulated] = useState(false);

  // Run full simulation from current params
  const runSimulation = useCallback((overrideParams = null) => {
    const p = overrideParams || params;

    // Energy Generation
    const solarEnergy = calcSolarEnergy(p.solar.capacity, p.solar.sunlightHours, p.solar.efficiency);
    const windEnergy = calcWindEnergy(p.wind.turbineCapacity, p.wind.numTurbines, p.wind.capacityFactor);
    const hydroEnergy = calcHydroEnergy(p.hydro.capacity, p.hydro.operatingHours, p.hydro.efficiency);
    const biomassEnergy = calcBiomassEnergy(p.biomass.input, p.biomass.conversionEfficiency);

    const totalRenewable = solarEnergy + windEnergy + hydroEnergy + biomassEnergy;
    const demand = p.grid.dailyDemand;

    // Battery simulation
    const batteryResult = calcBatteryBalance(
      p.battery.capacity,
      p.battery.initialCharge,
      totalRenewable,
      demand,
      p.battery.chargingEfficiency,
      p.battery.dischargingEfficiency
    );

    const gridEnergy = batteryResult.gridEnergy;
    const totalGeneration = totalRenewable + gridEnergy;
    const renewableSharePct = totalGeneration > 0 ? (totalRenewable / demand) * 100 : 0;
    const gridDependencyPct = demand > 0 ? (gridEnergy / demand) * 100 : 0;

    // CO₂ calculations
    const co2FromGrid = gridEnergy * CO2_FACTORS.grid;
    const co2FromRenewables =
      solarEnergy * CO2_FACTORS.solar +
      windEnergy * CO2_FACTORS.wind +
      hydroEnergy * CO2_FACTORS.hydro +
      biomassEnergy * CO2_FACTORS.biomass;
    const co2IfAllGrid = demand * CO2_FACTORS.grid;
    const co2Actual = co2FromGrid + co2FromRenewables;
    const co2AvoidedKg = co2IfAllGrid - co2Actual;

    // Cost calculations
    const gridOnlyCost = demand * p.grid.electricityCost;
    const actualCost = gridEnergy * p.grid.electricityCost;
    const dailyCostSaving = gridOnlyCost - actualCost;
    const savingPct = gridOnlyCost > 0 ? (dailyCostSaving / gridOnlyCost) * 100 : 0;

    const results = {
      // Generation breakdown (kWh/day)
      solarEnergy: +solarEnergy.toFixed(2),
      windEnergy: +windEnergy.toFixed(2),
      hydroEnergy: +hydroEnergy.toFixed(2),
      biomassEnergy: +biomassEnergy.toFixed(2),
      totalRenewable: +totalRenewable.toFixed(2),
      gridEnergy: +gridEnergy.toFixed(2),
      totalGeneration: +totalGeneration.toFixed(2),
      totalGenerationKWh: +totalGeneration.toFixed(2),

      // Demand
      totalDemandKWh: demand,

      // Key percentages
      renewableSharePct: +Math.min(100, renewableSharePct).toFixed(1),
      gridDependencyPct: +Math.max(0, Math.min(100, gridDependencyPct)).toFixed(1),

      // Battery
      batterySoC: +batteryResult.finalSoC.toFixed(1),
      batteryCharged: +batteryResult.batteryCharged.toFixed(2),
      batteryDischarged: +batteryResult.batteryDischarged.toFixed(2),
      batteryCapacity: p.battery.capacity,

      // CO₂
      co2AvoidedKg: +Math.max(0, co2AvoidedKg).toFixed(2),
      co2EmittedKg: +co2Actual.toFixed(2),

      // Cost
      gridOnlyCost: +gridOnlyCost.toFixed(2),
      actualCost: +actualCost.toFixed(2),
      dailyCostSaving: +dailyCostSaving.toFixed(2),
      savingPct: +Math.max(0, savingPct).toFixed(1),

      // Surplus/Deficit
      surplus: +(totalRenewable - demand).toFixed(2),
      deficit: +Math.max(0, demand - totalRenewable).toFixed(2),

      // Params snapshot
      params: p,
      timestamp: new Date().toISOString(),
    };

    // Calculate SDG scores from results
    const sdgScores = calcSDG7Score(results);
    results.sdgScores = sdgScores;

    setSimResults(results);
    setHasSimulated(true);
    return results;
  }, [params]);

  // Update a specific param section
  const updateParams = useCallback((section, key, value) => {
    setParams((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  }, []);

  const resetParams = useCallback(() => {
    setParams(DEFAULT_PARAMS);
    setSimResults(null);
    setHasSimulated(false);
  }, []);

  // Auto-compute "live" results (without committing to simResults)
  const liveResults = useMemo(() => {
    try {
      const p = params;
      const solarEnergy = calcSolarEnergy(p.solar.capacity, p.solar.sunlightHours, p.solar.efficiency);
      const windEnergy = calcWindEnergy(p.wind.turbineCapacity, p.wind.numTurbines, p.wind.capacityFactor);
      const hydroEnergy = calcHydroEnergy(p.hydro.capacity, p.hydro.operatingHours, p.hydro.efficiency);
      const biomassEnergy = calcBiomassEnergy(p.biomass.input, p.biomass.conversionEfficiency);
      const totalRenewable = solarEnergy + windEnergy + hydroEnergy + biomassEnergy;
      const demand = p.grid.dailyDemand;
      const batteryResult = calcBatteryBalance(
        p.battery.capacity, p.battery.initialCharge, totalRenewable, demand,
        p.battery.chargingEfficiency, p.battery.dischargingEfficiency
      );
      const gridEnergy = batteryResult.gridEnergy;
      const totalGeneration = totalRenewable + gridEnergy;
      const renewableSharePct = demand > 0 ? Math.min(100, (totalRenewable / demand) * 100) : 0;
      const gridDependencyPct = demand > 0 ? Math.max(0, Math.min(100, (gridEnergy / demand) * 100)) : 0;
      const co2IfAllGrid = demand * CO2_FACTORS.grid;
      const co2Actual = gridEnergy * CO2_FACTORS.grid + solarEnergy * CO2_FACTORS.solar + windEnergy * CO2_FACTORS.wind + hydroEnergy * CO2_FACTORS.hydro + biomassEnergy * CO2_FACTORS.biomass;
      const co2AvoidedKg = Math.max(0, co2IfAllGrid - co2Actual);
      const gridOnlyCost = demand * p.grid.electricityCost;
      const actualCost = gridEnergy * p.grid.electricityCost;
      const dailyCostSaving = gridOnlyCost - actualCost;

      const r = {
        solarEnergy: +solarEnergy.toFixed(2),
        windEnergy: +windEnergy.toFixed(2),
        hydroEnergy: +hydroEnergy.toFixed(2),
        biomassEnergy: +biomassEnergy.toFixed(2),
        totalRenewable: +totalRenewable.toFixed(2),
        gridEnergy: +gridEnergy.toFixed(2),
        totalGeneration: +totalGeneration.toFixed(2),
        totalGenerationKWh: +totalGeneration.toFixed(2),
        totalDemandKWh: demand,
        renewableSharePct: +renewableSharePct.toFixed(1),
        gridDependencyPct: +gridDependencyPct.toFixed(1),
        batterySoC: +batteryResult.finalSoC.toFixed(1),
        co2AvoidedKg: +co2AvoidedKg.toFixed(2),
        co2EmittedKg: +co2Actual.toFixed(2),
        gridOnlyCost: +gridOnlyCost.toFixed(2),
        actualCost: +actualCost.toFixed(2),
        dailyCostSaving: +Math.max(0, dailyCostSaving).toFixed(2),
        savingPct: +Math.max(0, gridOnlyCost > 0 ? (dailyCostSaving / gridOnlyCost) * 100 : 0).toFixed(1),
        batteryCapacity: p.battery.capacity,
      };
      r.sdgScores = calcSDG7Score(r);
      return r;
    } catch {
      return null;
    }
  }, [params]);

  const value = {
    params,
    setParams,
    updateParams,
    resetParams,
    runSimulation,
    simResults,
    hasSimulated,
    liveResults,
  };

  return <EnergyContext.Provider value={value}>{children}</EnergyContext.Provider>;
}

export function useEnergy() {
  const ctx = useContext(EnergyContext);
  if (!ctx) throw new Error('useEnergy must be used within EnergyProvider');
  return ctx;
}

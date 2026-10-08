// Simulator.jsx — Energy Simulator page — the main feature
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Wind, Droplets, Leaf, Battery, Grid3X3,
  Play, RotateCcw, TrendingUp, CloudOff, DollarSign, Zap, Info, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { useEnergy } from '../context/EnergyContext.jsx';
import { useRealConditions } from '../hooks/useRealConditions.js';
import SliderInput from '../components/SliderInput.jsx';
import KPICard from '../components/KPICard.jsx';
import SDGScoreRing from '../components/SDGScoreRing.jsx';
import SimulationViewport from '../components/simulation/SimulationViewport.jsx';
import { Box, Layers, Cpu, Sparkles, MapPin, RefreshCw, Navigation } from 'lucide-react';
import { calcSolarEnergy, calcSolarMetrics } from '../utils/solarCalculations.js';
import { calcWindEnergy, estimateCapacityFactor } from '../utils/windCalculations.js';
import { calcHydroEnergy } from '../utils/hydroCalculations.js';
import { calcBiomassEnergy } from '../utils/biomassCalculations.js';
import { calcBatteryBalance } from '../utils/batteryCalculations.js';
import { calcSDG7Score } from '../utils/sdgScore.js';
import { CO2_FACTORS } from '../data/energyConstants.js';

// Collapsible section
function ConfigSection({ title, icon: Icon, color, children, badge = null, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="section-block" style={{ marginBottom: '1rem' }}>
      <button
        className="section-block-header"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', cursor: 'pointer', background: 'none', border: 'none',
          fontFamily: 'inherit', textAlign: 'left',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={15} style={{ color }} />
          </div>
          <span className="card-title">{title}</span>
          {badge}
        </div>
        {open ? <ChevronUp size={16} style={{ color: 'var(--gp-gray-400)' }} /> : <ChevronDown size={16} style={{ color: 'var(--gp-gray-400)' }} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="section-block-body">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// What-if analysis
function WhatIfAnalysis({ baseResults, params }) {
  const [solarBoost, setSolarBoost] = useState(params.solar.capacity);

  const computeWhatIf = useCallback((newSolarKW) => {
    const p = { ...params, solar: { ...params.solar, capacity: newSolarKW } };
    const solarEnergy = calcSolarEnergy(p.solar.capacity, p.solar.sunlightHours, p.solar.efficiency);
    const windEnergy = calcWindEnergy(p.wind.turbineCapacity, p.wind.numTurbines, p.wind.capacityFactor);
    const hydroEnergy = calcHydroEnergy(p.hydro.capacity, p.hydro.operatingHours, p.hydro.efficiency, p.hydro.headHeight, p.hydro.flowRate);
    const biomassEnergy = calcBiomassEnergy(p.biomass.input, p.biomass.conversionEfficiency, p.biomass.feedstock, p.biomass.moisture);
    const totalRenewable = solarEnergy + windEnergy + hydroEnergy + biomassEnergy;
    const demand = p.grid.dailyDemand;
    const battResult = calcBatteryBalance(p.battery.capacity, p.battery.initialCharge, totalRenewable, demand, p.battery.chargingEfficiency, p.battery.dischargingEfficiency);
    const gridEnergy = battResult.gridEnergy;
    const totalGeneration = totalRenewable + gridEnergy;
    const renewableSharePct = demand > 0 ? Math.min(100, (totalRenewable / demand) * 100) : 0;
    const gridDependencyPct = demand > 0 ? Math.max(0, Math.min(100, (gridEnergy / demand) * 100)) : 0;
    const co2IfAllGrid = demand * CO2_FACTORS.grid;
    const co2Actual = gridEnergy * CO2_FACTORS.grid + solarEnergy * CO2_FACTORS.solar + windEnergy * CO2_FACTORS.wind + hydroEnergy * CO2_FACTORS.hydro + biomassEnergy * CO2_FACTORS.biomass;
    const co2AvoidedKg = Math.max(0, co2IfAllGrid - co2Actual);
    const gridOnlyCost = demand * p.grid.electricityCost;
    const actualCost = gridEnergy * p.grid.electricityCost;
    const dailyCostSaving = Math.max(0, gridOnlyCost - actualCost);
    const r = { renewableSharePct, gridDependencyPct, co2AvoidedKg, dailyCostSaving, gridOnlyCost, totalGenerationKWh: totalGeneration, totalDemandKWh: demand, batteryCapacity: p.battery.capacity };
    const sdg = calcSDG7Score(r);
    return { renewableSharePct, gridDependencyPct, co2AvoidedKg, dailyCostSaving, sdgScore: sdg.sdg7.total };
  }, [params]);

  const whatIfResult = computeWhatIf(solarBoost);
  const baseRenewable = baseResults?.renewableSharePct || 0;

  const delta = {
    renewable: +(whatIfResult.renewableSharePct - baseRenewable).toFixed(1),
    grid: +(whatIfResult.gridDependencyPct - (baseResults?.gridDependencyPct || 100)).toFixed(1),
    co2: +(whatIfResult.co2AvoidedKg - (baseResults?.co2AvoidedKg || 0)).toFixed(1),
    cost: +(whatIfResult.dailyCostSaving - (baseResults?.dailyCostSaving || 0)).toFixed(0),
    sdg: +(whatIfResult.sdgScore - (baseResults?.sdgScores?.sdg7?.total || 0)).toFixed(1),
  };

  return (
    <div className="section-block" style={{ marginTop: '1.5rem' }}>
      <div className="section-block-header">
        <span className="card-title">🔍 What-If Analysis</span>
        <span className="badge badge-blue">Scenario</span>
      </div>
      <div className="section-block-body">
        <p style={{ fontSize: '0.85rem', color: 'var(--gp-gray-600)', marginBottom: '1rem' }}>
          <strong>What happens if I increase solar capacity?</strong> Drag the slider to see the impact.
        </p>
        <SliderInput
          label="Solar Capacity (What-If)"
          value={solarBoost}
          min={0}
          max={100}
          step={1}
          unit="kW"
          onChange={setSolarBoost}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
          {[
            { label: 'Renewable %', value: whatIfResult.renewableSharePct.toFixed(1), unit: '%', d: delta.renewable, color: '#22c55e' },
            { label: 'Grid Dependency', value: whatIfResult.gridDependencyPct.toFixed(1), unit: '%', d: delta.grid, color: '#EF4444', reverse: true },
            { label: 'CO₂ Avoided', value: whatIfResult.co2AvoidedKg.toFixed(1), unit: 'kg', d: delta.co2, color: '#06B6D4' },
            { label: 'Cost Saving', value: `₹${whatIfResult.dailyCostSaving.toFixed(0)}`, unit: '/day', d: delta.cost, color: '#8B5CF6' },
            { label: 'SDG 7 Score', value: whatIfResult.sdgScore.toFixed(1), unit: '/100', d: delta.sdg, color: '#F59E0B' },
          ].map(({ label, value, unit, d, color, reverse }) => (
            <div key={label} style={{
              padding: '0.75rem', borderRadius: 10,
              background: `${color}0d`, border: `1px solid ${color}25`,
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--gp-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.1rem', color, marginTop: '2px' }}>
                {value}<span style={{ fontSize: '0.75rem' }}> {unit}</span>
              </div>
              {d !== 0 && (
                <div style={{
                  fontSize: '0.7rem', marginTop: '2px',
                  color: (reverse ? d < 0 : d > 0) ? '#16a34a' : '#dc2626', fontWeight: 600
                }}>
                  {d > 0 ? '▲' : '▼'} {Math.abs(d)}{typeof d === 'number' && unit !== '/day' ? unit.replace('/day', '') : ''}
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="educational-note" style={{ marginTop: '0.75rem' }}>
          ⓘ What-if results are calculated in real-time using the simulation engine. Values are representative educational estimates.
        </p>
      </div>
    </div>
  );
}

export default function Simulator() {
  const { params, updateParams, runSimulation, simResults, liveResults, resetParams, hasSimulated } = useEnergy();
  const realData = useRealConditions();
  const [simulating, setSimulating] = useState(false);
  const [showResults, setShowResults] = useState(hasSimulated);

  // Compute effective simulation parameters based on active mode
  const effectiveParams = React.useMemo(() => {
    if (!realData.isRealMode) {
      return params;
    }

    // In Real Conditions Mode:
    // Real solar irradiance (W/m²) & ambient temp feed into effective sunlight hours
    const realIrradianceRatio = Math.max(0, realData.solarIrradiance) / 1000;
    const effectiveSunlightHours = Math.max(0.5, +(realIrradianceRatio * 7.5).toFixed(1));

    // Real wind speed (m/s) feeds into effective capacity factor
    const effectiveCF = Math.round(estimateCapacityFactor(realData.windSpeed));

    return {
      ...params,
      solar: {
        ...params.solar,
        sunlightHours: effectiveSunlightHours,
      },
      wind: {
        ...params.wind,
        windSpeed: realData.windSpeed,
        capacityFactor: effectiveCF,
      },
    };
  }, [params, realData.isRealMode, realData.solarIrradiance, realData.windSpeed]);

  // Compute dynamic live results using effective parameters
  const results = React.useMemo(() => {
    if (!realData.isRealMode) {
      return liveResults;
    }
    const p = effectiveParams;
    const solarEnergy = calcSolarEnergy(p.solar.capacity, p.solar.sunlightHours, p.solar.efficiency, realData.temperature);
    const windEnergy = calcWindEnergy(p.wind.turbineCapacity, p.wind.numTurbines, p.wind.capacityFactor);
    const hydroEnergy = calcHydroEnergy(p.hydro.capacity, p.hydro.operatingHours, p.hydro.efficiency, p.hydro.headHeight, p.hydro.flowRate);
    const biomassEnergy = calcBiomassEnergy(p.biomass.input, p.biomass.conversionEfficiency, p.biomass.feedstock, p.biomass.moisture);
    const totalRenewable = solarEnergy + windEnergy + hydroEnergy + biomassEnergy;
    const demand = p.grid.dailyDemand;
    const batteryResult = calcBatteryBalance(p.battery.capacity, p.battery.initialCharge, totalRenewable, demand, p.battery.chargingEfficiency, p.battery.dischargingEfficiency);
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
  }, [realData.isRealMode, liveResults, effectiveParams, realData.temperature]);

  const handleSimulate = async () => {
    setSimulating(true);
    await new Promise(r => setTimeout(r, 600));
    runSimulation(effectiveParams);
    setShowResults(true);
    setSimulating(false);
  };

  const handleReset = () => {
    resetParams();
    setShowResults(false);
  };

  const updateParam = (section, key, value) => updateParams(section, key, value);
  const U = (section, key) => (value) => updateParams(section, key, value);

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Design Your Sustainable Energy System</h1>
        <p className="page-subtitle">Configure renewable sources, storage and demand to simulate a real energy system.</p>
      </div>

      {/* TOP CONTROL BAR: Mode Toggle & Location Awareness */}
      <div className="sim-mode-toggle-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div className="sim-mode-toggle-group">
            <button
              type="button"
              className={`sim-toggle-btn ${!realData.isRealMode ? 'active-sim' : ''}`}
              onClick={() => realData.setIsRealMode(false)}
            >
              <span>🔵 Simulation Mode</span>
            </button>
            <button
              type="button"
              className={`sim-toggle-btn ${realData.isRealMode ? 'active-real' : ''}`}
              onClick={() => realData.setIsRealMode(true)}
            >
              <span>🟢 Real Conditions</span>
            </button>
          </div>

          {realData.isRealMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge-real">● LIVE OPEN-METEO DATA</span>
              <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                📍 {realData.location} ({realData.temperature}°C, Irradiance: {realData.solarIrradiance} W/m², Wind: {realData.windSpeed} m/s)
              </span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: '0.72rem', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={realData.requestUserLocation}
            title="Detect My Location using Browser Geolocation"
          >
            <Navigation size={13} color="#22c55e" />
            <span>Use My Location</span>
          </button>

          <select
            className="real-location-dropdown"
            value={realData.selectedLocationId}
            onChange={(e) => realData.selectManualLocation(e.target.value)}
          >
            {realData.availableLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                📍 {loc.name}, {loc.region.split(',')[0]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="simulator-layout-grid">
        {/* LEFT — Configuration */}
        <div>
          <ConfigSection
            title="Solar PV"
            icon={Sun}
            color="#F59E0B"
            badge={realData.isRealMode ? <span className="badge-real">REAL IRRADIANCE</span> : <span className="badge-userinput">USER INPUT</span>}
          >
            <SliderInput label="Installed Capacity" value={params.solar.capacity} min={0} max={100} step={0.5} unit="kW" onChange={U('solar', 'capacity')} />
            <SliderInput label="Panel Efficiency" value={params.solar.efficiency} min={10} max={25} step={0.5} unit="%" onChange={U('solar', 'efficiency')} />
            
            {realData.isRealMode ? (
              <div style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '4px' }}>
                  <span style={{ color: '#94a3b8' }}>Real Solar Irradiance (G)</span>
                  <span className="badge-real">{realData.solarIrradiance} W/m²</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '4px' }}>
                  <span style={{ color: '#94a3b8' }}>Ambient Cell Temp</span>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>{realData.temperature} °C</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                  <span style={{ color: '#94a3b8' }}>Derived Sunlight Hours</span>
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>{effectiveParams.solar.sunlightHours} h/day</span>
                </div>
              </div>
            ) : (
              <SliderInput label="Avg Sunlight Hours/day" value={params.solar.sunlightHours} min={1} max={10} step={0.5} unit="h/day" onChange={U('solar', 'sunlightHours')} />
            )}

            <div className="educational-note" style={{ marginTop: '0.5rem' }}>
              <Info size={12} /> Governing: P = G × A × η × TempDerate
            </div>
          </ConfigSection>

          <ConfigSection
            title="Wind Energy"
            icon={Wind}
            color="#3B82F6"
            badge={realData.isRealMode ? <span className="badge-real">REAL WIND</span> : <span className="badge-userinput">USER INPUT</span>}
          >
            <SliderInput label="Turbine Capacity" value={params.wind.turbineCapacity} min={1} max={50} step={0.5} unit="kW" onChange={U('wind', 'turbineCapacity')} />
            <SliderInput label="Number of Turbines" value={params.wind.numTurbines} min={0} max={20} step={1} unit="" onChange={U('wind', 'numTurbines')} />
            
            {realData.isRealMode ? (
              <div style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '4px' }}>
                  <span style={{ color: '#94a3b8' }}>Real Wind Speed (v)</span>
                  <span className="badge-real">{realData.windSpeed} m/s ({realData.windSpeedKmh} km/h)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                  <span style={{ color: '#94a3b8' }}>Aerodynamic Capacity Factor (Cp)</span>
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>{effectiveParams.wind.capacityFactor}%</span>
                </div>
              </div>
            ) : (
              <>
                <SliderInput label="Avg Wind Speed" value={params.wind.windSpeed} min={1} max={20} step={0.5} unit="m/s" onChange={U('wind', 'windSpeed')} />
                <SliderInput label="Capacity Factor" value={params.wind.capacityFactor} min={10} max={50} step={1} unit="%" onChange={U('wind', 'capacityFactor')} />
              </>
            )}

            <div className="educational-note">
              <Info size={12} /> Governing: P = 0.5 × ρ × A × v³ × Cp
            </div>
          </ConfigSection>

          <ConfigSection
            title="Hydropower"
            icon={Droplets}
            color="#0EA5E9"
            badge={<span className="badge-simulated">SIMULATED</span>}
          >
            <SliderInput label="Capacity" value={params.hydro.capacity} min={0} max={50} step={0.5} unit="kW" onChange={U('hydro', 'capacity')} />
            <SliderInput label="Hydraulic Head Height" value={params.hydro.headHeight || 18} min={3} max={60} step={1} unit="m" onChange={U('hydro', 'headHeight')} />
            <SliderInput label="Water Flow Rate" value={+(((params.hydro.flowRate ?? 0.025) * 1000).toFixed(0))} min={5} max={80} step={5} unit="L/s" onChange={(v) => updateParam('hydro', 'flowRate', v / 1000)} />
            <SliderInput label="Operating Hours/day" value={params.hydro.operatingHours} min={1} max={24} step={1} unit="h" onChange={U('hydro', 'operatingHours')} />
            <SliderInput label="Efficiency" value={params.hydro.efficiency} min={50} max={95} step={1} unit="%" onChange={U('hydro', 'efficiency')} />
            <div className="educational-note">
              <Info size={12} /> Hydro Power: P = η × ρ × g × Q × H ({(params.hydro.headHeight || 18)}m head @ {+(((params.hydro.flowRate ?? 0.025) * 1000).toFixed(0))} L/s)
            </div>
          </ConfigSection>

          <ConfigSection
            title="Biomass &amp; Waste CHP"
            icon={Leaf}
            color="#10B981"
            badge={<span className="badge-simulated">SIMULATED</span>}
          >
            <SliderInput label="Feedstock Input" value={params.biomass.input} min={0} max={500} step={5} unit="kg/day" onChange={U('biomass', 'input')} />
            <SliderInput label="Feedstock Moisture" value={params.biomass.moisture ?? 14} min={5} max={45} step={1} unit="%" onChange={U('biomass', 'moisture')} />
            <SliderInput label="Conversion Efficiency" value={params.biomass.conversionEfficiency} min={10} max={50} step={1} unit="%" onChange={U('biomass', 'conversionEfficiency')} />
            <div className="educational-note">
              <Info size={12} /> Biomass CHP: Net LHV derated for moisture with ~46% recovered useful bio-heat
            </div>
          </ConfigSection>

          <ConfigSection
            title="Battery Storage"
            icon={Battery}
            color="#8B5CF6"
            badge={<span className="badge-userinput">USER INPUT</span>}
          >
            <SliderInput label="Battery Capacity" value={params.battery.capacity} min={0} max={200} step={5} unit="kWh" onChange={U('battery', 'capacity')} />
            <SliderInput label="Initial Charge" value={params.battery.initialCharge} min={0} max={100} step={5} unit="%" onChange={U('battery', 'initialCharge')} />
            <SliderInput label="Charging Efficiency" value={params.battery.chargingEfficiency} min={70} max={99} step={1} unit="%" onChange={U('battery', 'chargingEfficiency')} />
            <SliderInput label="Discharging Efficiency" value={params.battery.dischargingEfficiency} min={70} max={99} step={1} unit="%" onChange={U('battery', 'dischargingEfficiency')} />
          </ConfigSection>

          <ConfigSection
            title="Grid &amp; Load"
            icon={Grid3X3}
            color="#EF4444"
            badge={<span className="badge-reference">REFERENCE</span>}
          >
            <SliderInput label="Daily Energy Demand" value={params.grid.dailyDemand} min={5} max={500} step={5} unit="kWh" onChange={U('grid', 'dailyDemand')} />
            <SliderInput label="Peak Load" value={params.grid.peakLoad} min={1} max={100} step={1} unit="kW" onChange={U('grid', 'peakLoad')} />
            <SliderInput label="Grid Electricity Cost" value={params.grid.electricityCost} min={1} max={20} step={0.5} unit="₹/kWh" onChange={U('grid', 'electricityCost')} />
          </ConfigSection>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-primary btn-primary-lg"
              style={{ flex: 1 }}
              onClick={handleSimulate}
              disabled={simulating}
              id="simulate-btn"
            >
              {simulating ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Simulating...
                </>
              ) : (
                <><Play size={16} /> Simulate Energy System</>
              )}
            </button>
            <button className="btn btn-outline" onClick={handleReset} title="Reset to defaults">
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* RIGHT — Live simulation */}
        <div>
          {/* Interactive Simulation Viewport: Realistic Physics Process Simulator */}
          <div className="section-block" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>
            <div className="section-block-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="card-title">Interactive Energy Physics Simulator</span>
                {realData.isRealMode ? (
                  <span className="badge-real">
                    <span className="live-dot" style={{ width: 6, height: 6 }} /> Real Conditions Active
                  </span>
                ) : (
                  <span className="badge badge-green">
                    <span className="live-dot" style={{ width: 6, height: 6 }} /> Physics Engine Active
                  </span>
                )}
              </div>
            </div>

            <div style={{ padding: '0.5rem' }}>
              <SimulationViewport
                params={effectiveParams}
                results={results}
                onUpdateParam={updateParam}
              />
            </div>
          </div>

          {/* Live KPIs */}
          <div className="section-block" style={{ marginBottom: '1.5rem' }}>
            <div className="section-block-header">
              <span className="card-title">Live Results</span>
              <span className="badge badge-green">
                <span className="live-dot" style={{ width: 6, height: 6 }} /> Updating
              </span>
            </div>
            <div className="section-block-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <KPICard label="Total Generation" value={results?.totalGeneration || 0} unit="kWh/day" icon={Zap} color="#22c55e" decimals={1} />
                <KPICard label="Renewable Share" value={results?.renewableSharePct || 0} unit="%" icon={TrendingUp} color="#F59E0B" decimals={1} />
                <KPICard label="Grid Dependency" value={results?.gridDependencyPct || 0} unit="%" icon={Grid3X3} color={results?.gridDependencyPct > 40 ? '#EF4444' : '#22c55e'} decimals={1} />
                <KPICard label="CO₂ Avoided" value={results?.co2AvoidedKg || 0} unit="kg/day" icon={CloudOff} color="#06B6D4" decimals={1} />
                <KPICard label="Daily Cost" value={results?.actualCost || 0} prefix="₹" unit="/day" icon={DollarSign} color="#8B5CF6" decimals={0} />
                <KPICard label="Battery SoC" value={results?.batterySoC || 0} unit="%" icon={Battery} color="#F59E0B" decimals={0} />
              </div>
            </div>
          </div>

          {/* Generation breakdown bars */}
          <div className="section-block" style={{ marginBottom: '1.5rem' }}>
            <div className="section-block-header">
              <span className="card-title">Generation Breakdown</span>
            </div>
            <div className="section-block-body">
              {[
                { label: 'Solar', value: results?.solarEnergy || 0, color: '#F59E0B', icon: Sun },
                { label: 'Wind', value: results?.windEnergy || 0, color: '#3B82F6', icon: Wind },
                { label: 'Hydro', value: results?.hydroEnergy || 0, color: '#06B6D4', icon: Droplets },
                { label: 'Biomass', value: results?.biomassEnergy || 0, color: '#22C55E', icon: Leaf },
                { label: 'Grid (Fallback)', value: results?.gridEnergy || 0, color: '#EF4444', icon: Grid3X3 },
              ].map(({ label, value, color, icon: Icon }) => {
                const demand = results?.totalDemandKWh || 60;
                const pct = Math.min(100, (value / demand) * 100);
                return (
                  <div key={label} style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: 'var(--gp-gray-700)' }}>
                        <Icon size={13} style={{ color }} />
                        {label}
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color }}>{value.toFixed(1)} kWh</span>
                    </div>
                    <div className="progress-bar-wrap">
                      <motion.div
                        className="progress-bar-fill"
                        style={{ background: color }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SDG Score */}
          <div className="section-block" style={{ marginBottom: '1.5rem' }}>
            <div className="section-block-header">
              <span className="card-title">SDG 7 Score</span>
            </div>
            <div className="section-block-body" style={{ display: 'flex', justifyContent: 'center' }}>
              <SDGScoreRing score={results?.sdgScores?.sdg7?.total || 0} size={160} label="Current SDG 7 Score" />
            </div>
          </div>

          {/* What-if */}
          <WhatIfAnalysis baseResults={results} params={params} />
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

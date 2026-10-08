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
import SliderInput from '../components/SliderInput.jsx';
import KPICard from '../components/KPICard.jsx';
import EnergyFlowDiagram from '../components/EnergyFlowDiagram.jsx';
import SDGScoreRing from '../components/SDGScoreRing.jsx';
import DigitalTwin3D from '../components/DigitalTwin3D.jsx';
import { Box, Layers } from 'lucide-react';
import { calcSolarEnergy } from '../utils/solarCalculations.js';
import { calcWindEnergy } from '../utils/windCalculations.js';
import { calcHydroEnergy } from '../utils/hydroCalculations.js';
import { calcBiomassEnergy } from '../utils/biomassCalculations.js';
import { calcBatteryBalance } from '../utils/batteryCalculations.js';
import { calcSDG7Score } from '../utils/sdgScore.js';
import { CO2_FACTORS } from '../data/energyConstants.js';

// Collapsible section
function ConfigSection({ title, icon: Icon, color, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="section-block" style={{ marginBottom: '1rem' }}>
      <button
        className="section-block-header"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', cursor: 'pointer', background: 'none', border: 'none',
          fontFamily: 'inherit', textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={15} style={{ color }} />
          </div>
          <span className="card-title">{title}</span>
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
    const hydroEnergy = calcHydroEnergy(p.hydro.capacity, p.hydro.operatingHours, p.hydro.efficiency);
    const biomassEnergy = calcBiomassEnergy(p.biomass.input, p.biomass.conversionEfficiency);
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
  const [simulating, setSimulating] = useState(false);
  const [showResults, setShowResults] = useState(hasSimulated);
  const [visMode, setVisMode] = useState('3d');

  const results = liveResults;

  const handleSimulate = async () => {
    setSimulating(true);
    await new Promise(r => setTimeout(r, 600));
    runSimulation();
    setShowResults(true);
    setSimulating(false);
  };

  const handleReset = () => {
    resetParams();
    setShowResults(false);
  };

  const U = (section, key) => (value) => updateParams(section, key, value);

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Design Your Sustainable Energy System</h1>
        <p className="page-subtitle">Configure renewable sources, storage and demand to simulate a real energy system.</p>
      </div>

      <div className="simulator-layout-grid">
        {/* LEFT — Configuration */}
        <div>
          <ConfigSection title="Solar PV" icon={Sun} color="#F59E0B">
            <SliderInput label="Installed Capacity" value={params.solar.capacity} min={0} max={100} step={0.5} unit="kW" onChange={U('solar', 'capacity')} />
            <SliderInput label="Panel Efficiency" value={params.solar.efficiency} min={10} max={25} step={0.5} unit="%" onChange={U('solar', 'efficiency')} />
            <SliderInput label="Avg Sunlight Hours/day" value={params.solar.sunlightHours} min={1} max={10} step={0.5} unit="h/day" onChange={U('solar', 'sunlightHours')} />
            <div className="educational-note" style={{ marginTop: '0.5rem' }}>
              <Info size={12} /> Solar Energy = Capacity × Sunlight Hours × Efficiency
            </div>
          </ConfigSection>

          <ConfigSection title="Wind Energy" icon={Wind} color="#3B82F6">
            <SliderInput label="Turbine Capacity" value={params.wind.turbineCapacity} min={1} max={50} step={0.5} unit="kW" onChange={U('wind', 'turbineCapacity')} />
            <SliderInput label="Number of Turbines" value={params.wind.numTurbines} min={0} max={20} step={1} unit="" onChange={U('wind', 'numTurbines')} />
            <SliderInput label="Avg Wind Speed" value={params.wind.windSpeed} min={1} max={20} step={0.5} unit="m/s" onChange={U('wind', 'windSpeed')} />
            <SliderInput label="Capacity Factor" value={params.wind.capacityFactor} min={10} max={50} step={1} unit="%" onChange={U('wind', 'capacityFactor')} />
            <div className="educational-note">
              <Info size={12} /> Wind Energy = Capacity × Turbines × 24h × Capacity Factor
            </div>
          </ConfigSection>

          <ConfigSection title="Hydropower" icon={Droplets} color="#06B6D4">
            <SliderInput label="Capacity" value={params.hydro.capacity} min={0} max={50} step={0.5} unit="kW" onChange={U('hydro', 'capacity')} />
            <SliderInput label="Operating Hours/day" value={params.hydro.operatingHours} min={1} max={24} step={1} unit="h" onChange={U('hydro', 'operatingHours')} />
            <SliderInput label="Efficiency" value={params.hydro.efficiency} min={50} max={95} step={1} unit="%" onChange={U('hydro', 'efficiency')} />
            <div className="educational-note">
              <Info size={12} /> Hydro Energy = Capacity × Operating Hours × Efficiency
            </div>
          </ConfigSection>

          <ConfigSection title="Biomass" icon={Leaf} color="#22C55E">
            <SliderInput label="Biomass Input" value={params.biomass.input} min={0} max={500} step={5} unit="kg/day" onChange={U('biomass', 'input')} />
            <SliderInput label="Conversion Efficiency" value={params.biomass.conversionEfficiency} min={10} max={50} step={1} unit="%" onChange={U('biomass', 'conversionEfficiency')} />
            <div className="educational-note">
              <Info size={12} /> Biomass Energy = Input × 4.5 kWh/kg × Efficiency
            </div>
          </ConfigSection>

          <ConfigSection title="Battery Storage" icon={Battery} color="#8B5CF6">
            <SliderInput label="Battery Capacity" value={params.battery.capacity} min={0} max={200} step={5} unit="kWh" onChange={U('battery', 'capacity')} />
            <SliderInput label="Initial Charge" value={params.battery.initialCharge} min={0} max={100} step={5} unit="%" onChange={U('battery', 'initialCharge')} />
            <SliderInput label="Charging Efficiency" value={params.battery.chargingEfficiency} min={70} max={99} step={1} unit="%" onChange={U('battery', 'chargingEfficiency')} />
            <SliderInput label="Discharging Efficiency" value={params.battery.dischargingEfficiency} min={70} max={99} step={1} unit="%" onChange={U('battery', 'dischargingEfficiency')} />
          </ConfigSection>

          <ConfigSection title="Grid &amp; Load" icon={Grid3X3} color="#EF4444">
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
          {/* Interactive Simulation Viewport: 3D Twin or 2D Flow */}
          <div className="section-block" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>
            <div className="section-block-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="card-title">Interactive Simulation Viewport</span>
                <span className="badge badge-green">
                  <span className="live-dot" style={{ width: 6, height: 6 }} /> Real-Time 3D
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--gp-gray-100)', padding: '3px', borderRadius: '8px' }}>
                <button
                  type="button"
                  onClick={() => setVisMode('3d')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: visMode === '3d' ? '#fff' : 'transparent',
                    color: visMode === '3d' ? 'var(--gp-green-700)' : 'var(--gp-gray-500)',
                    boxShadow: visMode === '3d' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  <Box size={13} /> 3D Digital Twin
                </button>
                <button
                  type="button"
                  onClick={() => setVisMode('flow')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: visMode === 'flow' ? '#fff' : 'transparent',
                    color: visMode === 'flow' ? 'var(--gp-green-700)' : 'var(--gp-gray-500)',
                    boxShadow: visMode === 'flow' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  <Layers size={13} /> 2D Flow Schematic
                </button>
              </div>
            </div>

            <div style={{ padding: '0.75rem' }}>
              {visMode === '3d' ? (
                <DigitalTwin3D params={params} results={results} />
              ) : (
                <EnergyFlowDiagram results={results} compact />
              )}
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

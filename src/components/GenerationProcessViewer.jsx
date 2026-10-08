// GenerationProcessViewer.jsx — Interactive Multi-Source Generation Process Simulator
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Wind, Droplets, Leaf, ArrowRight, Zap, Info, ShieldCheck,
  Activity, Thermometer, Gauge, Sparkles, RefreshCw, Layers
} from 'lucide-react';
import { calcSolarMetrics } from '../utils/solarCalculations.js';
import { calcWindMetrics } from '../utils/windCalculations.js';
import { calcHydroMetrics } from '../utils/hydroCalculations.js';
import { calcBiomassMetrics, BIOMASS_FEEDSTOCKS } from '../utils/biomassCalculations.js';

export default function GenerationProcessViewer({ params, results, onUpdateParam }) {
  const [activeSource, setActiveSource] = useState('solar'); // 'solar' | 'wind' | 'hydro' | 'biomass'

  // Local physics tweak state for deep interactive exploration
  const [solarTemp, setSolarTemp] = useState(30); // °C
  const [solarIrradiance, setSolarIrradiance] = useState(900); // W/m^2

  const [windSpeedLocal, setWindSpeedLocal] = useState(params?.wind?.windSpeed || 8.5); // m/s

  const [hydroHead, setHydroHead] = useState(params?.hydro?.headHeight || 18); // meters
  const [hydroFlow, setHydroFlow] = useState(params?.hydro?.flowRate || 0.035); // m^3/s

  const [biomassFeedstock, setBiomassFeedstock] = useState('agricultural');
  const [biomassMoisture, setBiomassMoisture] = useState(14); // %

  // Calculations
  const solarMetrics = calcSolarMetrics(
    params?.solar?.capacity || 10,
    params?.solar?.sunlightHours || 5.5,
    params?.solar?.efficiency || 18,
    solarTemp
  );

  const windMetrics = calcWindMetrics(
    params?.wind?.turbineCapacity || 5,
    params?.wind?.numTurbines || 2,
    windSpeedLocal,
    params?.wind?.capacityFactor || 30
  );

  const hydroMetrics = calcHydroMetrics(
    params?.hydro?.capacity || 3,
    params?.hydro?.operatingHours || 8,
    params?.hydro?.efficiency || 82,
    hydroHead,
    hydroFlow
  );

  const biomassMetrics = calcBiomassMetrics(
    params?.biomass?.input || 60,
    params?.biomass?.conversionEfficiency || 26,
    biomassFeedstock,
    biomassMoisture
  );

  // Source-specific pipeline configurations
  const sourcesConfig = {
    solar: {
      id: 'solar',
      name: 'Solar Photovoltaic (PV)',
      icon: Sun,
      color: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.25)',
      borderColor: 'rgba(245, 158, 11, 0.45)',
      dailyOutput: solarMetrics.energy,
      unit: 'kWh/day',
      stages: [
        {
          step: 1,
          title: 'Solar Irradiance',
          subtitle: 'Atmospheric Photons',
          metric: `${solarIrradiance} W/m²`,
          detail: 'Solar flux incident on tilted silicon cells at local zenith angle.',
          status: 'Optimal Sun',
        },
        {
          step: 2,
          title: 'Photoelectric Excitation',
          subtitle: 'Electron-Hole Pairs',
          metric: `${(params?.solar?.capacity || 10).toFixed(1)} kWp DC`,
          detail: 'Photons excite valence electrons across 1.1 eV bandgap creating direct current.',
          status: 'DC Electron Flow',
        },
        {
          step: 3,
          title: 'MPPT & Temp Derating',
          subtitle: 'Thermal Regulation',
          metric: `-${solarMetrics.thermalLossPct}% loss @ ${solarTemp}°C`,
          detail: 'Maximum Power Point Tracking locks optimal V/I; derates -0.38%/°C above 25°C.',
          status: 'Active Derating',
        },
        {
          step: 4,
          title: 'AC Inverter Sync',
          subtitle: 'Grid Injection',
          metric: `${solarMetrics.energy} kWh/day AC`,
          detail: 'Pure sinusoidal inversion at 50 Hz with <3% total harmonic distortion (THD).',
          status: '50.0 Hz Synchronized',
        },
      ],
      physicsSummary:
        'Photons with energy exceeding the 1.1 eV bandgap generate electron-hole pairs collected as direct current (DC). Inverters dynamically track maximum power point (MPPT) and synchronize alternating current to the local grid.',
      governingEquation: 'P(t) = Capacity_STC × (G / 1000) × [1 - 0.0038 × (T_cell - 25)] × η_inv',
    },
    wind: {
      id: 'wind',
      name: 'Wind Aerodynamic Turbine',
      icon: Wind,
      color: '#06b6d4',
      glow: 'rgba(6, 182, 212, 0.25)',
      borderColor: 'rgba(6, 182, 212, 0.45)',
      dailyOutput: windMetrics.energy,
      unit: 'kWh/day',
      stages: [
        {
          step: 1,
          title: 'Kinetic Wind Flow',
          subtitle: 'Atmospheric Inflow',
          metric: `${windSpeedLocal.toFixed(1)} m/s`,
          detail: 'Mass flow of air carrying kinetic energy proportional to the cube of velocity (v³).',
          status: windMetrics.state.status,
        },
        {
          step: 2,
          title: 'Rotor Aerodynamics',
          subtitle: 'Betz Limit (Cp ≤ 59.3%)',
          metric: `${windMetrics.state.rotorRpm} RPM Rotor`,
          detail: 'Airfoil blade lift creates aerodynamic rotor torque while pitch yaw regulates angle of attack.',
          status: 'Active Lift & Yaw',
        },
        {
          step: 3,
          title: 'Gearbox / Alternator',
          subtitle: 'Mechanical Multiplier',
          metric: `${(windMetrics.state.rotorRpm * 80).toFixed(0)} RPM Gen`,
          detail: 'High-speed shaft drives synchronous permanent-magnet alternator generating multi-phase AC.',
          status: 'Rotor Stepped Up',
        },
        {
          step: 4,
          title: 'Frequency Converter',
          subtitle: 'Substation Bus',
          metric: `${windMetrics.energy} kWh/day AC`,
          detail: 'Back-to-back AC-DC-AC converter synchronizes variable rotor power to stable 50 Hz bus.',
          status: 'Grid Synced',
        },
      ],
      physicsSummary:
        'Moving air masses carry kinetic energy captured by airfoil blades subject to Betz\'s theoretical limit (59.3%). Low-speed rotation is multiplied to synchronous generator speeds and converted to 50 Hz grid AC.',
      governingEquation: 'P_wind = 0.5 × ρ_air × A_rotor × v³ × Cp (where Cp ≤ 0.593)',
    },
    hydro: {
      id: 'hydro',
      name: 'Hydro Hydraulic Power Station',
      icon: Droplets,
      color: '#0ea5e9',
      glow: 'rgba(14, 165, 233, 0.25)',
      borderColor: 'rgba(14, 165, 233, 0.45)',
      dailyOutput: hydroMetrics.energy,
      unit: 'kWh/day',
      stages: [
        {
          step: 1,
          title: 'Reservoir Head & Flow',
          subtitle: 'Gravitational Potential',
          metric: `${hydroHead} m Head | ${(hydroFlow * 1000).toFixed(0)} L/s`,
          detail: 'Stored reservoir elevation creates hydraulic potential energy governed by Torricelli\'s law.',
          status: 'Steady Hydraulic Head',
        },
        {
          step: 2,
          title: 'Penstock Conduit',
          subtitle: 'Hydrodynamic Pressure',
          metric: `${hydroMetrics.penstockPressureKPa} kPa Static`,
          detail: 'Pressurized steel conduit channels water down gradient, converting static head to kinetic jet velocity.',
          status: 'Laminar Fluid Stream',
        },
        {
          step: 3,
          title: 'Water Turbine Runner',
          subtitle: hydroMetrics.turbineType,
          metric: `${hydroMetrics.actualPowerKW} kW Mechanical`,
          detail: 'High-velocity water jets impact runner blades, converting fluid momentum into shaft mechanical torque.',
          status: '82% Runner Efficiency',
        },
        {
          step: 4,
          title: 'Synchronous Hydro Gen',
          subtitle: 'Continuous Dispatch',
          metric: `${hydroMetrics.energy} kWh/day AC`,
          detail: 'Synchronous generator feeds zero-carbon baseload energy into the microgrid bus with ultra-low inertia flutter.',
          status: 'Continuous Baseload',
        },
      ],
      physicsSummary:
        'Water mass elevated at height H possesses gravitational potential energy. Rushing through the penstock, fluid momentum turns a Francis reaction turbine coupled to a synchronous AC generator.',
      governingEquation: 'P_hydro = η_total × ρ_water × g × Q_flow × H_net (where ρ = 1000 kg/m³, g = 9.81 m/s²)',
    },
    biomass: {
      id: 'biomass',
      name: 'Biomass & Waste Cogeneration (CHP)',
      icon: Leaf,
      color: '#10b981',
      glow: 'rgba(16, 185, 129, 0.25)',
      borderColor: 'rgba(16, 185, 129, 0.45)',
      dailyOutput: biomassMetrics.electricalEnergy,
      unit: 'kWh/day',
      stages: [
        {
          step: 1,
          title: 'Organic Feedstock Mass',
          subtitle: biomassMetrics.feedstockName,
          metric: `${params?.biomass?.input || 60} kg/day @ ${biomassMoisture}% H₂O`,
          detail: 'Agricultural straw, wood waste, or organic food scraps dried and pulverized for gasification.',
          status: 'Feedstock Loaded',
        },
        {
          step: 2,
          title: 'Thermochemical Digestion',
          subtitle: 'Syngas / Methane Yield',
          metric: `${biomassMetrics.effectiveLHV} kWh/kg Net LHV`,
          detail: 'Controlled pyrolysis or anaerobic digestion releases rich combustible syngas (CO, H₂, CH₄).',
          status: '850°C Gasification',
        },
        {
          step: 3,
          title: 'Turbine Generator Gen',
          subtitle: 'Power Generation',
          metric: `${biomassMetrics.electricalEnergy} kWh/day Elec`,
          detail: 'Clean combustion gas expands through Rankine turbine alternator generating dispatchable power.',
          status: '26% Electrical Efficiency',
        },
        {
          step: 4,
          title: 'Thermal Heat Recovery (CHP)',
          subtitle: 'Combined Heat & Power',
          metric: `+${biomassMetrics.recoveredThermalHeatKWh} kWh Thermal`,
          detail: 'Flue-gas heat exchanger captures waste heat for community heating, lifting overall CHP efficiency to ~72%.',
          status: `${biomassMetrics.combinedChpEfficiencyPct}% Total CHP Yield`,
        },
      ],
      physicsSummary:
        'Organic biomass is gasified into syngas, driving a turbine alternator. A heat recovery exchanger captures residual flue-gas heat, achieving high Combined Heat and Power (CHP) system efficiency.',
      governingEquation: 'E_total = Mass_dry × [LHV_base × (1 - Moisture) - 0.68 × Moisture] × η_CHP',
    },
  };

  const currentConfig = sourcesConfig[activeSource];

  return (
    <div className="gen-process-viewer-root">
      {/* HEADER WITH SOURCE SELECTOR */}
      <div className="gen-process-header">
        <div>
          <div className="gen-process-title">
            <Sparkles size={16} color="#34d399" />
            <span>Generation Process Simulator &amp; Explainable Physics Engine</span>
          </div>
          <p className="gen-process-subtitle">
            Explore the exact mechanical, chemical, and electrical stages converting raw environmental flux into synchronized AC electricity.
          </p>
        </div>

        {/* Source Navigation Pills */}
        <div className="gen-source-tabs-row">
          {Object.values(sourcesConfig).map((s) => {
            const Icon = s.icon;
            const isSelected = activeSource === s.id;
            return (
              <button
                key={s.id}
                type="button"
                className={`gen-source-tab-btn ${isSelected ? 'active' : ''}`}
                style={{
                  '--accent-color': s.color,
                  '--accent-glow': s.glow,
                  borderColor: isSelected ? s.borderColor : 'rgba(255, 255, 255, 0.08)',
                }}
                onClick={() => setActiveSource(s.id)}
              >
                <Icon size={14} color={isSelected ? s.color : '#94a3b8'} />
                <span>{s.name.split(' ')[0]}</span>
                <span className="gen-source-badge-val">{s.dailyOutput} kWh</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STAGE PIPELINE FLOW CARDS */}
      <div className="gen-pipeline-container" style={{ borderColor: currentConfig.borderColor }}>
        <div className="gen-pipeline-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <currentConfig.icon size={18} color={currentConfig.color} />
            <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
              {currentConfig.name} — Real-Time Conversion Pipeline
            </span>
          </div>
          <div className="gen-pipeline-rate-badge" style={{ color: currentConfig.color, background: `${currentConfig.color}18` }}>
            <Activity size={13} />
            <span>Active Rate: {currentConfig.dailyOutput} {currentConfig.unit}</span>
          </div>
        </div>

        {/* 4 Conversion Stages */}
        <div className="gen-stages-grid">
          {currentConfig.stages.map((stg, idx) => (
            <React.Fragment key={stg.step}>
              <div className="gen-stage-card">
                <div className="gen-stage-step-tag" style={{ background: `${currentConfig.color}22`, color: currentConfig.color }}>
                  Stage 0{stg.step}
                </div>
                <div className="gen-stage-title">{stg.title}</div>
                <div className="gen-stage-sub">{stg.subtitle}</div>
                <div className="gen-stage-metric" style={{ color: currentConfig.color }}>
                  {stg.metric}
                </div>
                <p className="gen-stage-detail">{stg.detail}</p>
                <div className="gen-stage-status">
                  <span className="pulse-dot" style={{ background: currentConfig.color }} />
                  <span>{stg.status}</span>
                </div>
              </div>

              {idx < currentConfig.stages.length - 1 && (
                <div className="gen-stage-connector">
                  <ArrowRight size={16} color={currentConfig.color} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* INTERACTIVE PHYSICS MODIFIERS & EXPLAINABILITY */}
      <div className="gen-controls-and-explain-grid">
        {/* LEFT: Live Interactive Physics Controls */}
        <div className="gen-interactive-panel">
          <div className="panel-inner-header">
            <Gauge size={15} color="#38bdf8" />
            <span>Interactive Physics Controls &amp; Real-time Modulation</span>
          </div>

          {activeSource === 'solar' && (
            <div className="gen-sliders-group">
              <div className="gen-slider-row">
                <div className="gen-slider-label">
                  <span>Solar Irradiance Flux (G):</span>
                  <strong>{solarIrradiance} W/m²</strong>
                </div>
                <input
                  type="range"
                  min="200"
                  max="1200"
                  step="25"
                  value={solarIrradiance}
                  onChange={(e) => setSolarIrradiance(+e.target.value)}
                  className="clean-range-slider"
                />
              </div>

              <div className="gen-slider-row">
                <div className="gen-slider-label">
                  <span>Cell Operating Temp (T_cell):</span>
                  <strong>{solarTemp} °C (Derate: -{solarMetrics.thermalLossPct}%)</strong>
                </div>
                <input
                  type="range"
                  min="15"
                  max="60"
                  step="1"
                  value={solarTemp}
                  onChange={(e) => setSolarTemp(+e.target.value)}
                  className="clean-range-slider"
                />
              </div>
            </div>
          )}

          {activeSource === 'wind' && (
            <div className="gen-sliders-group">
              <div className="gen-slider-row">
                <div className="gen-slider-label">
                  <span>Anemometer Wind Velocity (v):</span>
                  <strong>{windSpeedLocal.toFixed(1)} m/s</strong>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="28.0"
                  step="0.5"
                  value={windSpeedLocal}
                  onChange={(e) => setWindSpeedLocal(+e.target.value)}
                  className="clean-range-slider"
                />
              </div>

              <div className="wind-status-indicator-box">
                <span className="status-label">Operational Aerodynamic State:</span>
                <span className={`status-pill ${windMetrics.state.badgeClass}`}>
                  {windMetrics.state.status}
                </span>
                <p className="status-desc">{windMetrics.state.desc}</p>
              </div>
            </div>
          )}

          {activeSource === 'hydro' && (
            <div className="gen-sliders-group">
              <div className="gen-slider-row">
                <div className="gen-slider-label">
                  <span>Hydraulic Head Elevation (H):</span>
                  <strong>{hydroHead} meters</strong>
                </div>
                <input
                  type="range"
                  min="3"
                  max="60"
                  step="1"
                  value={hydroHead}
                  onChange={(e) => setHydroHead(+e.target.value)}
                  className="clean-range-slider"
                />
              </div>

              <div className="gen-slider-row">
                <div className="gen-slider-label">
                  <span>Volumetric Penstock Flow (Q):</span>
                  <strong>{(hydroFlow * 1000).toFixed(0)} L/s ({hydroFlow} m³/s)</strong>
                </div>
                <input
                  type="range"
                  min="0.005"
                  max="0.09"
                  step="0.005"
                  value={hydroFlow}
                  onChange={(e) => setHydroFlow(+e.target.value)}
                  className="clean-range-slider"
                />
              </div>
            </div>
          )}

          {activeSource === 'biomass' && (
            <div className="gen-sliders-group">
              <div className="gen-slider-row">
                <div className="gen-slider-label">
                  <span>Feedstock Category:</span>
                  <strong>{BIOMASS_FEEDSTOCKS[biomassFeedstock]?.name}</strong>
                </div>
                <div className="feedstock-pills-row">
                  {Object.values(BIOMASS_FEEDSTOCKS).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className={`feedstock-chip ${biomassFeedstock === f.id ? 'active' : ''}`}
                      onClick={() => {
                        setBiomassFeedstock(f.id);
                        setBiomassMoisture(f.defaultMoisture);
                      }}
                    >
                      {f.name.split(' ')[0]} ({f.baseCalorificValue} kWh/kg)
                    </button>
                  ))}
                </div>
              </div>

              <div className="gen-slider-row">
                <div className="gen-slider-label">
                  <span>Feedstock Moisture Content:</span>
                  <strong>{biomassMoisture}% H₂O</strong>
                </div>
                <input
                  type="range"
                  min="5"
                  max="45"
                  step="1"
                  value={biomassMoisture}
                  onChange={(e) => setBiomassMoisture(+e.target.value)}
                  className="clean-range-slider"
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Explainable Scientific Clarity Card */}
        <div className="gen-explainable-panel">
          <div className="panel-inner-header">
            <Info size={15} color="#34d399" />
            <span>Explainable Scientific Physics &amp; Energy Balance</span>
          </div>

          <div className="explain-body">
            <p className="explain-p">{currentConfig.physicsSummary}</p>

            <div className="formula-box">
              <div className="formula-label">Governing Physical Equation:</div>
              <code className="formula-code">{currentConfig.governingEquation}</code>
            </div>

            <div className="environmental-impact-row">
              <div className="impact-stat">
                <span className="stat-num">{currentConfig.dailyOutput}</span>
                <span className="stat-label">Daily kWh Clean AC</span>
              </div>
              <div className="impact-stat">
                <span className="stat-num">{+(currentConfig.dailyOutput * 0.82).toFixed(1)}</span>
                <span className="stat-label">kg CO₂ Mitigated / Day</span>
              </div>
              <div className="impact-stat">
                <span className="stat-num">{+(currentConfig.dailyOutput * 0.82 * 0.045).toFixed(2)}</span>
                <span className="stat-label">Equiv. Trees Planted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

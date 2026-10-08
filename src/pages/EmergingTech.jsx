// EmergingTech.jsx — Green Hydrogen, Electrolyzers, Fuel Cells, Comparison
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { Zap, Droplets, FlaskConical, ArrowRight, Info } from 'lucide-react';
import { calcHydrogenSystem, ELECTROLYZER_TYPES, FUEL_CELL_TYPES } from '../utils/hydrogenCalculations.js';
import SliderInput from '../components/SliderInput.jsx';
import KPICard from '../components/KPICard.jsx';

const TABS = ['Green Hydrogen', 'Electrolyzer', 'Fuel Cell', 'Technology Comparison'];

// H2 Flow step
function H2Step({ label, sublabel, color, active = true }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', opacity: active ? 1 : 0.4 }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        border: `2.5px solid ${color}`, background: `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.25rem',
      }}>
        {label.slice(0, 1) === '⚡' || label.slice(0, 1) === '💧' || label.slice(0, 1) === '🔋' ? label.slice(0, 2) : '⚡'}
      </div>
      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--gp-gray-700)', textAlign: 'center', maxWidth: 70 }}>{sublabel}</span>
    </div>
  );
}

function H2Arrow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '1.5rem' }}>
      <div style={{ width: 32, height: 2, background: 'linear-gradient(90deg, #22c55e, #4ade80)' }} />
      <div style={{ width: 0, height: 0, borderLeft: '8px solid #22c55e', borderTop: '5px solid transparent', borderBottom: '5px solid transparent' }} />
    </div>
  );
}

function GreenHydrogenTab() {
  const [h2Params, setH2Params] = useState({
    electricityInputKWh: 100,
    electrolysisEffPct: 70,
    storageCapacityKg: 50,
    fuelCellEffPct: 55,
    existingStorageKg: 0,
  });

  const H = (key) => (value) => setH2Params(prev => ({ ...prev, [key]: value }));
  const result = calcHydrogenSystem(h2Params);

  return (
    <div>
      {/* Flow diagram */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', margin: '1.5rem 0', padding: '1.5rem', background: '#f0fdf4', borderRadius: 14, border: '1px solid #bbf7d0' }}>
        {[
          { emoji: '⚡', label: 'Renewable Electricity' },
          { emoji: '⚗️', label: 'Electrolyzer' },
          { emoji: '💧', label: 'Hydrogen H₂' },
          { emoji: '🔋', label: 'H₂ Storage' },
          { emoji: '⚙️', label: 'Fuel Cell' },
          { emoji: '🏠', label: 'Electricity' },
        ].map((step, i, arr) => (
          <React.Fragment key={step.label}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                border: '2px solid #22c55e', background: '#f0fdf4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.25rem',
              }}>
                {step.emoji}
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#166534', textAlign: 'center', maxWidth: 72 }}>{step.label}</span>
            </div>
            {i < arr.length - 1 && (
              <div style={{ color: '#22c55e', fontSize: '1rem', paddingBottom: '1.25rem' }}>→</div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Inputs */}
        <div className="card">
          <div className="card-header"><span className="card-title">H₂ System Parameters</span></div>
          <div className="card-body">
            <SliderInput label="Electricity Input" value={h2Params.electricityInputKWh} min={10} max={1000} step={10} unit="kWh/day" onChange={H('electricityInputKWh')} />
            <SliderInput label="Electrolyzer Capacity" value={Math.round(h2Params.electricityInputKWh / 24)} min={1} max={50} step={1} unit="kW (derived)" onChange={() => {}} />
            <SliderInput label="Electrolysis Efficiency" value={h2Params.electrolysisEffPct} min={50} max={90} step={1} unit="%" onChange={H('electrolysisEffPct')} />
            <SliderInput label="H₂ Storage Capacity" value={h2Params.storageCapacityKg} min={1} max={500} step={5} unit="kg" onChange={H('storageCapacityKg')} />
            <SliderInput label="Fuel Cell Efficiency" value={h2Params.fuelCellEffPct} min={30} max={80} step={1} unit="%" onChange={H('fuelCellEffPct')} />
          </div>
        </div>

        {/* Results */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <KPICard label="H₂ Produced" value={result.hydrogenProduced} unit="kg/day" icon={FlaskConical} color="#22c55e" decimals={2} />
            <KPICard label="H₂ Stored" value={result.hydrogenStored} unit="kg" icon={Droplets} color="#06B6D4" decimals={2} />
            <KPICard label="Electricity Generated" value={result.electricityGenerated} unit="kWh/day" icon={Zap} color="#8B5CF6" decimals={1} />
            <KPICard label="Round-Trip Efficiency" value={result.roundTripEfficiency} unit="%" icon={ArrowRight} color="#F59E0B" decimals={1} />
          </div>
          <div className="card">
            <div className="card-body">
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--gp-gray-600)' }}>Energy Input</span>
                  <span style={{ fontWeight: 600 }}>{h2Params.electricityInputKWh} kWh</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--gp-gray-600)' }}>Electricity Output (Fuel Cell)</span>
                  <span style={{ fontWeight: 600, color: '#22c55e' }}>{result.electricityGenerated} kWh</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--gp-gray-600)' }}>Energy Loss (conversion)</span>
                  <span style={{ fontWeight: 600, color: '#EF4444' }}>{result.energyLoss} kWh</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--gp-gray-600)' }}>CO₂ Avoided (vs SMR H₂)</span>
                  <span style={{ fontWeight: 600, color: '#06B6D4' }}>{result.co2AvoidedKg} kg</span>
                </div>
              </div>
              <div className="educational-note">
                <Info size={12} /> H₂ produced = Input × Efficiency ÷ 33.3 kWh/kg. Round-trip efficiency includes both electrolysis and fuel cell losses.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ElectrolyzerTab() {
  return (
    <div>
      <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
        <h3 style={{ fontWeight: 700, color: '#166534', marginBottom: '0.5rem' }}>How Electrolysis Works</h3>
        <p style={{ fontSize: '0.875rem', color: '#166534' }}>
          <strong>Electricity + Water → Hydrogen + Oxygen</strong><br />
          2H₂O → 2H₂ + O₂ (Electrolysis reaction)
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {ELECTROLYZER_TYPES.map((elec) => (
          <div key={elec.id} className="card" style={{ transition: 'transform 0.2s', cursor: 'default' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div className="card-header">
              <span className="card-title">{elec.name}</span>
              <span className={`badge ${elec.maturity === 'Commercial' ? 'badge-green' : 'badge-blue'}`}>{elec.maturity}</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                {[
                  { label: 'Efficiency', value: `${elec.efficiency.typical}%` },
                  { label: 'Temperature', value: elec.temp },
                  { label: 'Cost', value: elec.cost },
                  { label: 'Stack Life', value: elec.stackLife },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: '0.5rem', background: 'var(--gp-gray-50)', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--gp-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gp-gray-800)', marginTop: '2px' }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--gp-gray-500)' }}>Efficiency Range</span>
                  <span style={{ fontWeight: 600 }}>{elec.efficiency.min}–{elec.efficiency.max}%</span>
                </div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{ width: `${elec.efficiency.typical}%`, background: '#22c55e' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.5rem' }}>
                {elec.pros.map(p => <span key={p} className="badge badge-green">✓ {p}</span>)}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                {elec.cons.map(c => <span key={c} className="badge badge-red">✗ {c}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FuelCellTab() {
  return (
    <div>
      <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#ede9fe', borderRadius: 12, border: '1px solid #c4b5fd' }}>
        <h3 style={{ fontWeight: 700, color: '#6d28d9', marginBottom: '0.5rem' }}>How Fuel Cells Work</h3>
        <p style={{ fontSize: '0.875rem', color: '#6d28d9' }}>
          <strong>Hydrogen → Fuel Cell → Electricity + Heat + Water</strong><br />
          2H₂ + O₂ → 2H₂O + Electricity + Heat (electrochemical reaction)
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {FUEL_CELL_TYPES.map((fc) => (
          <div key={fc.id} className="card"
            style={{ transition: 'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div className="card-header">
              <div>
                <div className="card-title">{fc.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--gp-gray-400)' }}>{fc.fullName}</div>
              </div>
              <span className="badge badge-purple">{fc.temp}</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.5rem', background: '#f0fdf4', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--gp-gray-500)', textTransform: 'uppercase' }}>Electrical Eff.</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#22c55e' }}>{fc.efficiency.electrical}%</div>
                </div>
                <div style={{ padding: '0.5rem', background: '#fef3c7', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--gp-gray-500)', textTransform: 'uppercase' }}>Combined (CHP)</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#92400e' }}>{fc.efficiency.combined}%</div>
                </div>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gp-gray-600)', marginBottom: '0.75rem' }}>
                <strong>Application:</strong> {fc.application}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.5rem' }}>
                {fc.pros.map(p => <span key={p} className="badge badge-green" style={{ fontSize: '0.65rem' }}>✓ {p}</span>)}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                {fc.cons.map(c => <span key={c} className="badge badge-red" style={{ fontSize: '0.65rem' }}>✗ {c}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TechComparisonTab() {
  const data = [
    { tech: 'AWE', efficiency: 67, cost: 40, maturity: 85, lifespan: 80 },
    { tech: 'PEM', efficiency: 72, cost: 60, maturity: 75, lifespan: 60 },
    { tech: 'SOEC', efficiency: 82, cost: 20, maturity: 30, lifespan: 20 },
    { tech: 'PEMFC', efficiency: 50, cost: 55, maturity: 80, lifespan: 75 },
    { tech: 'SOFC', efficiency: 60, cost: 45, maturity: 65, lifespan: 65 },
  ];

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--gp-gray-800)' }}>Electrolyzer & Fuel Cell Technology Comparison</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--gp-gray-500)' }}>Representative educational estimates — not live market data.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Efficiency Comparison</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                <YAxis type="category" dataKey="tech" tick={{ fontSize: 11 }} width={50} />
                <Tooltip formatter={(v) => [`${v}%`, 'Efficiency']} />
                <Bar dataKey="efficiency" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Technology Maturity & Lifespan</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="tech" tick={{ fontSize: 11 }} width={50} />
                <Tooltip />
                <Bar dataKey="maturity" name="Maturity Score" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="lifespan" name="Stack Life Score" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="educational-note" style={{ marginTop: '1rem' }}>
        ⓘ Scores are normalized 0–100 for comparison. Actual specifications vary by manufacturer and operating conditions.
      </div>
    </div>
  );
}

export default function EmergingTech() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Emerging Energy Technologies</h1>
        <p className="page-subtitle">Unit 3 — Green Hydrogen, Electrolyzers and Fuel Cells.</p>
      </div>

      <div className="tab-bar" style={{ marginBottom: '1.5rem' }}>
        {TABS.map((tab, i) => (
          <button key={tab} className={`tab-item ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 0 && <GreenHydrogenTab />}
          {activeTab === 1 && <ElectrolyzerTab />}
          {activeTab === 2 && <FuelCellTab />}
          {activeTab === 3 && <TechComparisonTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

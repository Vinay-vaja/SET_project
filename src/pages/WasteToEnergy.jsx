// WasteToEnergy.jsx — Waste to Energy conversion page
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Trash2, Zap, CloudOff, TrendingUp, Thermometer, FlaskConical, Info } from 'lucide-react';
import { calcWasteToEnergy, compareWasteTechnologies } from '../utils/wasteCalculations.js';
import { WASTE_TECHNOLOGIES } from '../data/technologies.js';
import SliderInput from '../components/SliderInput.jsx';
import KPICard from '../components/KPICard.jsx';

const TECH_COLORS = {
  incineration: '#EF4444',
  pyrolysis: '#F97316',
  gasification: '#EAB308',
  anaerobicDigestion: '#22C55E',
  landfillGas: '#8B5CF6',
};

const TECH_LABELS = {
  incineration: 'Incineration',
  pyrolysis: 'Pyrolysis',
  gasification: 'Gasification',
  anaerobicDigestion: 'Anaerobic Digestion',
  landfillGas: 'Landfill Gas',
};

// Process diagram
function ProcessDiagram({ tech }) {
  const techData = WASTE_TECHNOLOGIES.find(t => t.id === tech);
  if (!techData) return null;
  const color = TECH_COLORS[tech] || '#22C55E';

  return (
    <div style={{ padding: '1.25rem', background: `${color}08`, borderRadius: 12, border: `1px solid ${color}25`, marginBottom: '1rem' }}>
      <h4 style={{ fontWeight: 700, color: 'var(--gp-gray-800)', marginBottom: '0.75rem' }}>{techData.name} — Process Flow</h4>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
        {techData.process.map((step, i, arr) => (
          <React.Fragment key={step}>
            <div style={{
              padding: '0.4rem 0.75rem', borderRadius: 6,
              background: i === 0 ? `${color}20` : i === arr.length - 1 ? color : `${color}12`,
              border: `1px solid ${color}40`,
              fontSize: '0.75rem', fontWeight: 600,
              color: i === arr.length - 1 ? '#fff' : 'var(--gp-gray-700)',
            }}>
              {step}
            </div>
            {i < arr.length - 1 && <span style={{ color, fontSize: '0.875rem' }}>→</span>}
          </React.Fragment>
        ))}
      </div>
      <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--gp-gray-500)', marginBottom: '4px', textTransform: 'uppercase' }}>Suitable Waste</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
            {techData.suitableWaste.map(w => <span key={w} className="badge badge-gray" style={{ fontSize: '0.65rem' }}>{w}</span>)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--gp-gray-500)', marginBottom: '4px', textTransform: 'uppercase' }}>Type</div>
          <span className={`badge ${techData.type === 'Thermal' ? 'badge-red' : 'badge-green'}`}>{techData.type}</span>
        </div>
      </div>
    </div>
  );
}

export default function WasteToEnergy() {
  const [selectedTech, setSelectedTech] = useState('anaerobicDigestion');
  const [wasteParams, setWasteParams] = useState({
    totalWasteKg: 500,
    organicPct: 45,
    moisturePct: 30,
    conversionEfficiencyPct: 35,
  });

  const W = (key) => (value) => setWasteParams(prev => ({ ...prev, [key]: value }));

  const result = calcWasteToEnergy({ ...wasteParams, technology: selectedTech });
  const comparison = compareWasteTechnologies(wasteParams.totalWasteKg, wasteParams.organicPct, wasteParams.moisturePct);

  const comparisonChartData = comparison.map(c => ({
    name: TECH_LABELS[c.technology] || c.technology,
    electricity: c.electricityGenerated,
    co2: c.co2Avoided,
    color: TECH_COLORS[c.technology] || '#22c55e',
  }));

  const wasteBreakdown = [
    { name: 'Organic', value: wasteParams.organicPct, color: '#22C55E' },
    { name: 'Other (dry)', value: 100 - wasteParams.organicPct, color: '#9CA3AF' },
  ];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Convert Waste into Useful Energy</h1>
        <p className="page-subtitle">Unit 4 — Waste-to-Energy technologies and processes.</p>
      </div>

      {/* Technology selector */}
      <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {WASTE_TECHNOLOGIES.map((tech) => {
          const color = TECH_COLORS[tech.id];
          const isSelected = selectedTech === tech.id;
          return (
            <button
              key={tech.id}
              onClick={() => setSelectedTech(tech.id)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 8,
                border: `2px solid ${isSelected ? color : 'var(--gp-gray-200)'}`,
                background: isSelected ? `${color}15` : '#fff',
                color: isSelected ? color : 'var(--gp-gray-600)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'inherit',
              }}
            >
              {tech.type === 'Thermal' ? '🔥' : '🌿'} {tech.name}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Inputs */}
        <div>
          <div className="section-block">
            <div className="section-block-header"><span className="card-title">Waste Input Parameters</span></div>
            <div className="section-block-body">
              <SliderInput label="Total Waste Input" value={wasteParams.totalWasteKg} min={50} max={5000} step={50} unit="kg/day" onChange={W('totalWasteKg')} />
              <SliderInput label="Organic Waste %" value={wasteParams.organicPct} min={10} max={90} step={5} unit="%" onChange={W('organicPct')} />
              <SliderInput label="Moisture Content" value={wasteParams.moisturePct} min={5} max={70} step={5} unit="%" onChange={W('moisturePct')} />
              <SliderInput label="Conversion Efficiency" value={wasteParams.conversionEfficiencyPct} min={10} max={50} step={1} unit="%" onChange={W('conversionEfficiencyPct')} />

              {/* Waste breakdown */}
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gp-gray-600)', marginBottom: '0.5rem' }}>Waste Composition</div>
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie data={wasteBreakdown} cx="50%" cy="50%" outerRadius={45} dataKey="value">
                      {wasteBreakdown.map(entry => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                    <Tooltip formatter={(v) => [`${v}%`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tech advantages */}
          {(() => {
            const td = WASTE_TECHNOLOGIES.find(t => t.id === selectedTech);
            return td ? (
              <div className="section-block" style={{ marginTop: '1rem' }}>
                <div className="section-block-header"><span className="card-title">Technology Details</span></div>
                <div className="section-block-body">
                  <p style={{ fontSize: '0.85rem', color: 'var(--gp-gray-600)', marginBottom: '0.75rem' }}>{td.description}</p>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Advantages</div>
                    {td.advantages.map(a => <div key={a} style={{ fontSize: '0.8rem', color: 'var(--gp-gray-700)', display: 'flex', gap: '4px', marginBottom: '2px' }}>✓ {a}</div>)}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Limitations</div>
                    {td.disadvantages.map(d => <div key={d} style={{ fontSize: '0.8rem', color: 'var(--gp-gray-700)', display: 'flex', gap: '4px', marginBottom: '2px' }}>✗ {d}</div>)}
                  </div>
                </div>
              </div>
            ) : null;
          })()}
        </div>

        {/* Results */}
        <div>
          <AnimatePresence mode="wait">
            <motion.div key={selectedTech} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <ProcessDiagram tech={selectedTech} />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard label="Electricity Generated" value={result.electricityGenerated} unit="kWh/day" icon={Zap} color="#22c55e" decimals={1} />
                <KPICard label="CO₂ Avoided" value={result.co2Avoided} unit="kg/day" icon={CloudOff} color="#06B6D4" decimals={1} />
                <KPICard label="Waste Processed" value={result.wasteProcessed} unit="kg/day" icon={Trash2} color="#F97316" decimals={0} />
                <KPICard label="Waste Reduced" value={result.wasteReduced} unit="kg/day" icon={TrendingUp} color="#22c55e" decimals={0} />
                <KPICard label="Efficiency" value={result.efficiency} unit="%" icon={Thermometer} color="#8B5CF6" decimals={1} />
                <KPICard label="Heat Generated" value={result.heatGenerated} unit="kWh/day" icon={FlaskConical} color="#F59E0B" decimals={1} />
              </div>

              {/* Comparison chart */}
              <div className="section-block">
                <div className="section-block-header">
                  <span className="card-title">Technology Comparison — Electricity Recovery</span>
                </div>
                <div className="section-block-body">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={comparisonChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10 }} unit=" kWh" />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
                      <Tooltip formatter={(v) => [`${v} kWh/day`, 'Electricity']} />
                      <Bar dataKey="electricity" fill="#22c55e" radius={[0, 4, 4, 0]}>
                        {comparisonChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} opacity={entry.name === TECH_LABELS[selectedTech] ? 1 : 0.5} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="educational-note" style={{ marginTop: '0.5rem' }}>
                    ⓘ Values calculated from your input parameters using typical technology efficiencies. Representative educational estimates.
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

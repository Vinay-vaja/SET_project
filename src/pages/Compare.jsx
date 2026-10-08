// Compare.jsx — Technology Comparison page
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
} from 'recharts';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import { TECHNOLOGIES } from '../data/technologies.js';

const COLORS = ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

// Normalize a value to 0-100 scale for radar
function normalize(value, min, max, invert = false) {
  const n = ((value - min) / (max - min)) * 100;
  return invert ? 100 - n : n;
}

// Build radar data for a technology
function buildRadarData(tech) {
  return [
    { axis: 'Efficiency', value: normalize(tech.efficiency.typical, 0, 100) },
    { axis: 'Low Emissions', value: normalize(tech.co2.lifecycle, 0, 1000, true) },
    { axis: 'Availability', value: normalize(tech.availability, 0, 100) },
    { axis: 'Scalability', value: { 'Very High': 100, 'High': 80, 'Medium': 55, 'Emerging': 35, 'Low': 20 }[tech.scalability] || 50 },
    { axis: 'Low Env Impact', value: { 'Very Low': 100, 'Low': 80, 'Low (operational)': 75, 'Medium': 50, 'High': 25, 'Very High': 5 }[tech.envImpact] || 50 },
    { axis: 'Low Capital Cost', value: normalize(tech.capex.max, 30000, 400000, true) },
  ];
}

function TechCard({ tech, selected, onToggle, color }) {
  const isRenewable = tech.type === 'Renewable';
  const isLowCarbon = tech.type === 'Low-Carbon';

  return (
    <motion.div
      className="card"
      style={{
        border: selected ? `2px solid ${color}` : '1px solid var(--gp-gray-200)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        opacity: selected ? 1 : 0.7,
      }}
      whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      onClick={onToggle}
    >
      <div className="card-body" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--gp-gray-800)' }}>{tech.name}</span>
          </div>
          {selected ? (
            <CheckCircle size={16} style={{ color }} />
          ) : (
            <div style={{ width: 16, height: 16, border: '2px solid var(--gp-gray-300)', borderRadius: 4 }} />
          )}
        </div>
        <span className={`badge ${isRenewable ? 'badge-green' : isLowCarbon ? 'badge-purple' : tech.type === 'Emerging' ? 'badge-blue' : 'badge-gray'}`} style={{ fontSize: '0.65rem' }}>
          {tech.type}
        </span>
        <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '0.72rem', color: 'var(--gp-gray-600)' }}>
          <span>⚡ {tech.efficiency.typical}% eff.</span>
          <span>🌱 {tech.co2.lifecycle} g/kWh</span>
          <span>📶 {tech.scalability}</span>
          <span>✅ {tech.availability}% avail.</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Compare() {
  const [selected, setSelected] = useState(['solar', 'wind', 'coal']);

  const toggleTech = (id) => {
    setSelected(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev;
        return prev.filter(s => s !== id);
      }
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  };

  const selectedTechs = TECHNOLOGIES.filter(t => selected.includes(t.id));

  // Radar data: merge all selected
  const radarData = ['Efficiency', 'Low Emissions', 'Availability', 'Scalability', 'Low Env Impact', 'Low Capital Cost'].map(axis => {
    const entry = { axis };
    selectedTechs.forEach(tech => {
      const d = buildRadarData(tech).find(r => r.axis === axis);
      entry[tech.id] = d?.value || 0;
    });
    return entry;
  });

  // CO2 comparison bar chart
  const co2Data = selectedTechs.map(t => ({
    name: t.name,
    co2: t.co2.lifecycle,
    color: COLORS[selected.indexOf(t.id) % COLORS.length],
  }));

  // Efficiency comparison
  const effData = selectedTechs.map(t => ({
    name: t.name,
    min: t.efficiency.min,
    typical: t.efficiency.typical,
    max: t.efficiency.max,
    color: COLORS[selected.indexOf(t.id) % COLORS.length],
  }));

  // Best for recommendations
  const bestFor = {
    'Low Emissions': selectedTechs.sort((a, b) => a.co2.lifecycle - b.co2.lifecycle)[0],
    'High Efficiency': selectedTechs.sort((a, b) => b.efficiency.typical - a.efficiency.typical)[0],
    'High Availability': selectedTechs.sort((a, b) => b.availability - a.availability)[0],
    'Low Capital Cost': selectedTechs.sort((a, b) => a.capex.max - b.capex.max)[0],
    'Most Scalable': selectedTechs.sort((a, b) => {
      const s = { 'Very High': 4, 'High': 3, 'Medium': 2, 'Emerging': 1 };
      return (s[b.scalability] || 1) - (s[a.scalability] || 1);
    })[0],
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Compare Energy Technologies</h1>
        <p className="page-subtitle">Select 2–5 technologies to compare their performance, cost, and sustainability metrics.</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--gp-gray-600)', fontWeight: 500 }}>
          {selected.length} selected
        </span>
        <span className="educational-note">
          <Info size={12} /> Values are representative educational assumptions, not live market data.
        </span>
      </div>

      {/* Technology selector grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
        {TECHNOLOGIES.map((tech, i) => (
          <TechCard
            key={tech.id}
            tech={tech}
            selected={selected.includes(tech.id)}
            onToggle={() => toggleTech(tech.id)}
            color={COLORS[selected.indexOf(tech.id) % COLORS.length] || '#9CA3AF'}
          />
        ))}
      </div>

      {selected.length >= 2 && (
        <>
          {/* Radar chart */}
          <div className="two-col" style={{ marginBottom: '1.5rem' }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Multi-Dimensional Comparison</span></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                    {selectedTechs.map((tech, i) => (
                      <Radar
                        key={tech.id}
                        name={tech.name}
                        dataKey={tech.id}
                        stroke={COLORS[i % COLORS.length]}
                        fill={COLORS[i % COLORS.length]}
                        fillOpacity={0.12}
                        strokeWidth={2}
                      />
                    ))}
                    <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CO2 comparison */}
            <div className="card">
              <div className="card-header"><span className="card-title">Lifecycle CO₂ Emissions</span></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={co2Data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} unit=" g/kWh" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip formatter={(v) => [`${v} g CO₂eq/kWh`, 'Lifecycle CO₂']} />
                    <Bar dataKey="co2" name="CO₂ (g/kWh)" radius={[0, 4, 4, 0]}>
                      {co2Data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed comparison table */}
          <div className="section-block" style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
            <div className="section-block-header"><span className="card-title">Detailed Comparison Table</span></div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: 600 }}>
                <thead>
                  <tr style={{ background: 'var(--gp-gray-50)', borderBottom: '1.5px solid var(--gp-gray-200)' }}>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--gp-gray-600)' }}>Attribute</th>
                    {selectedTechs.map((tech, i) => (
                      <th key={tech.id} style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i % COLORS.length] }} />
                          <span style={{ fontWeight: 700, color: COLORS[i % COLORS.length] }}>{tech.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Type', getValue: t => t.type },
                    { label: 'Typical Efficiency', getValue: t => `${t.efficiency.typical}%` },
                    { label: 'CO₂ (lifecycle)', getValue: t => `${t.co2.lifecycle} g/kWh` },
                    { label: 'Capital Cost', getValue: t => `₹${t.capex.min/1000}–${t.capex.max/1000}K/kW` },
                    { label: 'O&M Cost', getValue: t => `₹${t.opex.min}–${t.opex.max}/kW/yr` },
                    { label: 'Availability', getValue: t => `${t.availability}%` },
                    { label: 'Scalability', getValue: t => t.scalability },
                    { label: 'Env. Impact', getValue: t => t.envImpact },
                    { label: 'Storage Needed', getValue: t => t.storageRequired ? 'Yes' : 'No' },
                  ].map(({ label, getValue }, ri) => (
                    <tr key={label} style={{ borderBottom: '1px solid var(--gp-gray-100)', background: ri % 2 === 0 ? '#fff' : 'var(--gp-gray-50)' }}>
                      <td style={{ padding: '0.625rem 1rem', fontWeight: 600, color: 'var(--gp-gray-600)' }}>{label}</td>
                      {selectedTechs.map(tech => (
                        <td key={tech.id} style={{ padding: '0.625rem 1rem', color: 'var(--gp-gray-800)' }}>
                          {getValue(tech)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Best for recommendations */}
          <div className="card">
            <div className="card-header"><span className="card-title">Recommendations (based on selection)</span></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {Object.entries(bestFor).map(([criteria, tech], i) => {
                  if (!tech) return null;
                  const color = COLORS[selectedTechs.findIndex(t => t.id === tech.id) % COLORS.length];
                  return (
                    <div key={criteria} style={{
                      padding: '0.875rem', borderRadius: 10,
                      background: `${color}0d`, border: `1px solid ${color}25`,
                    }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--gp-gray-500)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Best for {criteria}</div>
                      <div style={{ fontWeight: 700, color, fontSize: '0.9rem' }}>{tech.name}</div>
                    </div>
                  );
                })}
              </div>
              <p className="educational-note" style={{ marginTop: '1rem' }}>
                ⓘ Recommendations based on the selected technologies only. Values are representative educational assumptions.
              </p>
            </div>
          </div>
        </>
      )}

      {selected.length < 2 && (
        <div style={{
          textAlign: 'center', padding: '3rem',
          background: 'var(--gp-gray-50)', borderRadius: 14,
          border: '1.5px dashed var(--gp-gray-300)',
          color: 'var(--gp-gray-500)',
        }}>
          <AlertCircle size={32} style={{ margin: '0 auto 0.75rem', display: 'block' }} />
          <p>Select at least 2 technologies above to see the comparison.</p>
        </div>
      )}
    </div>
  );
}

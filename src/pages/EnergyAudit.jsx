// EnergyAudit.jsx — Digital Energy Audit tool
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import {
  Plus, Trash2, ClipboardCheck, TrendingUp, DollarSign, CloudOff,
  Zap, AlertTriangle, CheckCircle, Lightbulb, Info
} from 'lucide-react';
import { calcAuditResults, generateRecommendations, DEFAULT_EQUIPMENT } from '../utils/auditCalculations.js';
import { useRealConditions } from '../hooks/useRealConditions.js';
import KPICard from '../components/KPICard.jsx';

const EQUIPMENT_COLORS = [
  '#22C55E', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444',
  '#06B6D4', '#EC4899', '#14B8A6', '#F97316', '#84CC16',
];

const EQUIPMENT_PRESETS = [
  { name: 'Air Conditioner', powerKW: 1.5, defaultHours: 8 },
  { name: 'LED Lights', powerKW: 0.01, defaultHours: 10 },
  { name: 'Computer', powerKW: 0.15, defaultHours: 8 },
  { name: 'Refrigerator', powerKW: 0.15, defaultHours: 24 },
  { name: 'Electric Fan', powerKW: 0.05, defaultHours: 10 },
  { name: 'Water Heater', powerKW: 2.0, defaultHours: 2 },
  { name: 'Washing Machine', powerKW: 0.5, defaultHours: 1 },
  { name: 'Electric Motor', powerKW: 5.0, defaultHours: 8 },
  { name: 'Water Pump', powerKW: 0.75, defaultHours: 6 },
  { name: 'Microwave', powerKW: 1.0, defaultHours: 0.5 },
];

let nextId = 10;

function SeverityBadge({ severity }) {
  const map = {
    high: { label: 'High Priority', className: 'badge-red' },
    medium: { label: 'Medium', className: 'badge-amber' },
    opportunity: { label: 'Opportunity', className: 'badge-blue' },
  };
  const { label, className } = map[severity] || { label: severity, className: 'badge-gray' };
  return <span className={`badge ${className}`}>{label}</span>;
}

export default function EnergyAudit() {
  const [equipment, setEquipment] = useState(DEFAULT_EQUIPMENT);
  const [costPerKWh, setCostPerKWh] = useState(7);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEquip, setNewEquip] = useState({ name: '', quantity: 1, powerKW: 0.1, hoursPerDay: 8 });
  const [selectedPreset, setSelectedPreset] = useState('');
  const realData = useRealConditions();

  const audit = useMemo(() => calcAuditResults(equipment, costPerKWh), [equipment, costPerKWh]);
  const recommendations = useMemo(() => generateRecommendations(audit), [audit]);

  const donutData = audit.equipment.map((eq, i) => ({
    name: eq.name,
    value: eq.dailyKWh,
    color: EQUIPMENT_COLORS[i % EQUIPMENT_COLORS.length],
  }));

  const handleDelete = (id) => {
    setEquipment(prev => prev.filter(eq => eq.id !== id));
  };

  const handleUpdate = (id, field, value) => {
    setEquipment(prev => prev.map(eq => eq.id === id ? { ...eq, [field]: parseFloat(value) || value } : eq));
  };

  const handlePresetSelect = (presetName) => {
    const preset = EQUIPMENT_PRESETS.find(p => p.name === presetName);
    if (preset) {
      setNewEquip({ name: preset.name, quantity: 1, powerKW: preset.powerKW, hoursPerDay: preset.defaultHours });
      setSelectedPreset(presetName);
    }
  };

  const handleAddEquipment = () => {
    if (!newEquip.name) return;
    setEquipment(prev => [...prev, { ...newEquip, id: String(++nextId) }]);
    setNewEquip({ name: '', quantity: 1, powerKW: 0.1, hoursPerDay: 8 });
    setSelectedPreset('');
    setShowAddForm(false);
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h1 className="page-title" style={{ margin: 0 }}>Digital Energy Audit</h1>
              <span className="badge-userinput">USER ENTERED DATA</span>
            </div>
            <p className="page-subtitle">
              Identify facility energy consumption patterns, HVAC cooling correlation with live temperature in <strong>{realData.location} ({realData.temperature}°C)</strong>, and uncover data-backed saving opportunities.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--gp-gray-600)' }}>Cost (₹/kWh):</label>
              <input
                type="number"
                value={costPerKWh}
                onChange={e => setCostPerKWh(parseFloat(e.target.value) || 7)}
                min={1} max={30} step={0.5}
                style={{ width: 64, border: '1.5px solid var(--gp-gray-200)', borderRadius: 8, padding: '0.375rem 0.5rem', fontSize: '0.875rem', outline: 'none', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600 }}
              />
            </div>
            <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
              <Plus size={16} /> Add Equipment
            </button>
          </div>
        </div>
      </div>

      {/* Add equipment modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.4)', zIndex: 100,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', width: 400, maxWidth: '90vw' }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--gp-gray-800)' }}>Add Equipment</h3>

              <div className="form-group">
                <label className="form-label">Quick Select Preset</label>
                <select
                  className="form-input"
                  value={selectedPreset}
                  onChange={e => handlePresetSelect(e.target.value)}
                >
                  <option value="">-- Select preset or enter manually --</option>
                  {EQUIPMENT_PRESETS.map(p => (
                    <option key={p.name} value={p.name}>{p.name} ({p.powerKW} kW)</option>
                  ))}
                </select>
              </div>

              {[
                { label: 'Equipment Name', field: 'name', type: 'text', placeholder: 'e.g., Air Conditioner' },
                { label: 'Quantity', field: 'quantity', type: 'number', min: 1, max: 100 },
                { label: 'Power (kW)', field: 'powerKW', type: 'number', min: 0.001, max: 100, step: 0.001 },
                { label: 'Hours/Day', field: 'hoursPerDay', type: 'number', min: 0.1, max: 24, step: 0.5 },
              ].map(({ label, field, type, ...rest }) => (
                <div className="form-group" key={field}>
                  <label className="form-label">{label}</label>
                  <input
                    type={type}
                    className="form-input"
                    value={newEquip[field]}
                    placeholder={rest.placeholder}
                    onChange={e => setNewEquip(prev => ({ ...prev, [field]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
                    {...(type === 'number' ? { min: rest.min, max: rest.max, step: rest.step } : {})}
                  />
                </div>
              ))}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddEquipment}>Add Equipment</button>
                <button className="btn btn-outline" onClick={() => setShowAddForm(false)}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Summary */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        <KPICard label="Daily Consumption" value={audit.totals.dailyKWh} unit="kWh" icon={Zap} color="#22c55e" decimals={1} />
        <KPICard label="Monthly Consumption" value={audit.totals.monthlyKWh} unit="kWh" icon={TrendingUp} color="#3B82F6" decimals={0} />
        <KPICard label="Monthly Cost" value={audit.totals.monthlyCost} prefix="₹" unit="" icon={DollarSign} color="#8B5CF6" decimals={0} />
        <KPICard label="CO₂ per Month" value={audit.totals.co2PerMonth} unit="kg" icon={CloudOff} color="#06B6D4" decimals={1} />
      </div>

      <div className="two-col" style={{ marginBottom: '1.5rem' }}>
        {/* Equipment table */}
        <div className="card" style={{ overflow: 'visible' }}>
          <div className="card-header">
            <span className="card-title">Equipment List</span>
            <span className="badge badge-green">{equipment.length} items</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: 'var(--gp-gray-50)', borderBottom: '1px solid var(--gp-gray-200)' }}>
                  {['Equipment', 'Qty', 'Power (kW)', 'Hours/day', 'kWh/day', '%', ''].map(h => (
                    <th key={h} style={{ padding: '0.625rem 0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--gp-gray-600)', fontSize: '0.75rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {audit.equipment.map((eq, i) => (
                  <motion.tr
                    key={eq.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ borderBottom: '1px solid var(--gp-gray-100)' }}
                  >
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500, color: 'var(--gp-gray-800)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: EQUIPMENT_COLORS[i % EQUIPMENT_COLORS.length] }} />
                        {eq.name}
                      </div>
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <input type="number" value={eq.quantity} min={1} max={100}
                        onChange={e => handleUpdate(eq.id, 'quantity', e.target.value)}
                        style={{ width: 50, border: '1px solid var(--gp-gray-200)', borderRadius: 6, padding: '0.25rem', fontSize: '0.8rem', textAlign: 'center', fontFamily: 'Space Grotesk, sans-serif' }}
                      />
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <input type="number" value={eq.powerKW} min={0.001} max={100} step={0.01}
                        onChange={e => handleUpdate(eq.id, 'powerKW', e.target.value)}
                        style={{ width: 64, border: '1px solid var(--gp-gray-200)', borderRadius: 6, padding: '0.25rem', fontSize: '0.8rem', textAlign: 'center', fontFamily: 'Space Grotesk, sans-serif' }}
                      />
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <input type="number" value={eq.hoursPerDay} min={0.1} max={24} step={0.5}
                        onChange={e => handleUpdate(eq.id, 'hoursPerDay', e.target.value)}
                        style={{ width: 56, border: '1px solid var(--gp-gray-200)', borderRadius: 6, padding: '0.25rem', fontSize: '0.8rem', textAlign: 'center', fontFamily: 'Space Grotesk, sans-serif' }}
                      />
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: 'var(--gp-gray-800)' }}>{eq.dailyKWh}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: 36, height: 5, background: 'var(--gp-gray-100)', borderRadius: 3 }}>
                          <div style={{ width: `${eq.percentage}%`, height: '100%', background: EQUIPMENT_COLORS[i % EQUIPMENT_COLORS.length], borderRadius: 3 }} />
                        </div>
                        <span style={{ color: 'var(--gp-gray-600)' }}>{eq.percentage}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.5rem 0.5rem' }}>
                      <button onClick={() => handleDelete(eq.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gp-gray-400)', padding: '0.25rem' }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Donut chart */}
        <div className="card">
          <div className="card-header"><span className="card-title">Consumption by Equipment</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={3} dataKey="value">
                  {donutData.map((entry, i) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v} kWh/day`, '']} />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="section-block" style={{ marginBottom: '1.5rem' }}>
        <div className="section-block-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lightbulb size={18} style={{ color: '#F59E0B' }} />
            <span className="card-title">Energy-Saving Recommendations</span>
          </div>
          <span className="badge badge-amber">{recommendations.length} recommendations</span>
        </div>
        <div className="section-block-body">
          {recommendations.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gp-gray-500)', fontSize: '0.875rem' }}>
              <CheckCircle size={16} style={{ color: '#22c55e' }} />
              Good energy use! Add more equipment to get recommendations.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {recommendations.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    padding: '1rem', borderRadius: 10,
                    background: rec.severity === 'high' ? '#fff5f5' : rec.severity === 'opportunity' ? '#eff6ff' : '#fffbeb',
                    border: `1px solid ${rec.severity === 'high' ? '#fca5a5' : rec.severity === 'opportunity' ? '#93c5fd' : '#fde68a'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {rec.severity === 'high' ? <AlertTriangle size={15} style={{ color: '#EF4444' }} /> : <Lightbulb size={15} style={{ color: '#F59E0B' }} />}
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gp-gray-800)' }}>{rec.equipment}</span>
                    </div>
                    <SeverityBadge severity={rec.severity} />
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--gp-gray-700)', marginBottom: '0.5rem' }}>{rec.message}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--gp-gray-600)', marginBottom: '0.5rem' }}>
                    <strong>Action:</strong> {rec.action}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                      💡 Save ~{rec.estimatedSavingKWh} kWh/month
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#8B5CF6', fontWeight: 600 }}>
                      ₹ Save ~₹{rec.estimatedSavingCost}/month
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Audit Summary */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardCheck size={18} style={{ color: '#22c55e' }} />
            <span className="card-title">Audit Summary</span>
          </div>
          <div title="Full PDF generation would require a backend service — marked as future feature">
            <button className="btn btn-outline" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
              📄 Download Report (Future Feature)
            </button>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'Total Daily Consumption', value: `${audit.totals.dailyKWh} kWh`, color: '#22c55e' },
              { label: 'Major Consumer', value: audit.equipment[0]?.name || 'N/A', color: '#EF4444' },
              { label: 'Potential Monthly Saving', value: `₹${recommendations.reduce((s, r) => s + r.estimatedSavingCost, 0)}`, color: '#8B5CF6' },
              { label: 'Annual CO₂ Emissions', value: `${audit.totals.co2PerMonth * 12 / 1000} t`, color: '#06B6D4' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ padding: '1rem', borderRadius: 10, background: `${color}0d`, border: `1px solid ${color}20` }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--gp-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.1rem', color }}>{value}</div>
              </div>
            ))}
          </div>
          <div className="educational-note" style={{ marginTop: '1rem' }}>
            <Info size={12} /> Energy = Quantity × Power (kW) × Hours/day. CO₂ factor: 0.82 kg/kWh (Indian grid average). Values are representative educational estimates.
          </div>
        </div>
      </div>
    </div>
  );
}

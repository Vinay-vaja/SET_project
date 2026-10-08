// Dashboard.jsx — Main overview page
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend, BarChart, Bar
} from 'recharts';
import {
  Zap, Wind, Droplets, Leaf, Sun, Battery, TrendingUp,
  ArrowRight, CloudOff, DollarSign, Activity, Target
} from 'lucide-react';
import { useEnergy } from '../context/EnergyContext.jsx';
import KPICard from '../components/KPICard.jsx';
import EnergyFlowDiagram from '../components/EnergyFlowDiagram.jsx';
import SDGScoreRing from '../components/SDGScoreRing.jsx';

const COLORS = {
  solar: '#F59E0B',
  wind: '#3B82F6',
  hydro: '#06B6D4',
  biomass: '#22C55E',
  grid: '#EF4444',
};

// Generate hourly data from daily totals for the chart
function generateHourlyData(results) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  return hours.map((h) => {
    const solarFactor = h >= 6 && h <= 18 ? Math.sin(((h - 6) / 12) * Math.PI) : 0;
    const windFactor = 0.5 + 0.5 * Math.sin((h / 24) * 2 * Math.PI + 1);
    const hydroFactor = h >= 6 && h <= 22 ? 1 : 0.3;
    const loadFactor = h >= 8 && h <= 22 ? (h >= 17 && h <= 21 ? 1.3 : 0.9) : 0.45;

    const solar = ((results.solarEnergy / 24) * solarFactor * 2.5);
    const wind = (results.windEnergy / 24) * windFactor;
    const hydro = (results.hydroEnergy / 24) * hydroFactor;
    const biomass = results.biomassEnergy / 24;
    const load = (results.totalDemandKWh / 24) * loadFactor;

    return {
      hour: `${h}:00`,
      solar: +solar.toFixed(2),
      wind: +wind.toFixed(2),
      hydro: +hydro.toFixed(2),
      biomass: +biomass.toFixed(2),
      load: +load.toFixed(2),
      total: +(solar + wind + hydro + biomass).toFixed(2),
    };
  });
}

function generate7DayData(results) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const variation = [0.95, 1.02, 0.98, 1.05, 1.01, 0.88, 0.92];
  return days.map((day, i) => ({
    day,
    generated: +(results.totalRenewable * variation[i]).toFixed(1),
    consumed: +(results.totalDemandKWh * (0.9 + Math.random() * 0.2)).toFixed(1),
    grid: +(results.gridEnergy * variation[i]).toFixed(1),
  }));
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--gp-gray-200)',
      borderRadius: 10, padding: '0.75rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      fontSize: '0.8rem',
    }}>
      <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--gp-gray-700)' }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color, display: 'flex', gap: '0.5rem' }}>
          <span>{p.name}:</span><span style={{ fontWeight: 600 }}>{p.value} kWh</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { liveResults, simResults, params } = useEnergy();
  const navigate = useNavigate();
  const [chartView, setChartView] = useState('24h');
  const [activeSlice, setActiveSlice] = useState(null);

  const results = simResults || liveResults;
  if (!results) return null;

  const sdgScore = results.sdgScores?.sdg7?.total || 0;
  const subMetrics = results.sdgScores?.sdg7?.subMetrics || {};

  const donutData = [
    { name: 'Solar', value: +results.solarEnergy.toFixed(1), color: COLORS.solar },
    { name: 'Wind', value: +results.windEnergy.toFixed(1), color: COLORS.wind },
    { name: 'Hydro', value: +results.hydroEnergy.toFixed(1), color: COLORS.hydro },
    { name: 'Biomass', value: +results.biomassEnergy.toFixed(1), color: COLORS.biomass },
    { name: 'Grid', value: +results.gridEnergy.toFixed(1), color: COLORS.grid },
  ].filter(d => d.value > 0);

  const hourlyData = generateHourlyData(results);
  const weekData = generate7DayData(results);

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">GreenPulse Dashboard</h1>
            <p className="page-subtitle">Monitor your sustainable energy system and its environmental impact.</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/simulator')}>
            <Zap size={16} /> Run New Simulation <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        <KPICard
          label="Total Energy Generated"
          value={results.totalGeneration}
          unit="kWh/day"
          icon={Zap}
          color="#22c55e"
          decimals={1}
        />
        <KPICard
          label="Renewable Share"
          value={results.renewableSharePct}
          unit="%"
          icon={Sun}
          color="#F59E0B"
          decimals={1}
        />
        <KPICard
          label="CO₂ Avoided"
          value={results.co2AvoidedKg}
          unit="kg/day"
          icon={CloudOff}
          color="#06B6D4"
          decimals={1}
        />
        <KPICard
          label="Estimated Saving"
          value={results.dailyCostSaving}
          prefix="₹"
          unit="/day"
          icon={DollarSign}
          color="#8B5CF6"
          decimals={0}
        />
        <KPICard
          label="Grid Dependency"
          value={results.gridDependencyPct}
          unit="%"
          icon={Activity}
          color={results.gridDependencyPct > 40 ? '#EF4444' : '#22c55e'}
          decimals={1}
        />
      </div>

      {/* Row 2: Donut + Flow */}
      <div className="two-col" style={{ marginBottom: '1.5rem' }}>
        {/* Energy Mix Donut */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Energy Generation Mix</span>
            <span className="badge badge-green">Live</span>
          </div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  onClick={(_, index) => setActiveSlice(activeSlice === index ? null : index)}
                >
                  {donutData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={entry.color}
                      opacity={activeSlice === null || activeSlice === index ? 1 : 0.4}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`${val} kWh`, '']}
                  contentStyle={{ borderRadius: 8, fontSize: '0.8rem' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, minWidth: 120 }}>
              {donutData.map((d, i) => (
                <div
                  key={d.name}
                  onClick={() => setActiveSlice(activeSlice === i ? null : i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.375rem 0.5rem', borderRadius: '6px', cursor: 'pointer',
                    background: activeSlice === i ? `${d.color}15` : 'transparent',
                    marginBottom: '0.25rem', transition: 'background 0.15s',
                  }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', flex: 1, color: 'var(--gp-gray-700)' }}>{d.name}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: d.color }}>{d.value} kWh</span>
                </div>
              ))}
              {activeSlice !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    marginTop: '0.5rem', padding: '0.5rem',
                    background: `${donutData[activeSlice]?.color}15`,
                    borderRadius: '8px', fontSize: '0.75rem',
                    color: 'var(--gp-gray-600)',
                  }}
                >
                  <strong>{donutData[activeSlice]?.name}</strong> contributes{' '}
                  {((donutData[activeSlice]?.value / results.totalGeneration) * 100).toFixed(1)}% of total generation
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* SDG Score */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">SDG 7 Impact</span>
            <span className="badge badge-amber">⚡ SDG 7</span>
          </div>
          <div className="card-body" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <SDGScoreRing score={sdgScore} size={150} label="SDG 7 Score" />
            <div style={{ flex: 1, minWidth: 160 }}>
              {[
                { key: 'affordable', label: 'Affordable Energy', color: '#22c55e' },
                { key: 'clean', label: 'Clean Energy', color: '#06B6D4' },
                { key: 'efficiency', label: 'Energy Efficiency', color: '#8B5CF6' },
                { key: 'renewable', label: 'Renewable Adoption', color: '#F59E0B' },
              ].map(({ key, label, color }) => {
                const val = subMetrics[key] || 0;
                return (
                  <div key={key} style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--gp-gray-600)' }}>{label}</span>
                      <span style={{ fontWeight: 700, color }}>{val.toFixed(0)}/25</span>
                    </div>
                    <div className="progress-bar-wrap">
                      <motion.div
                        className="progress-bar-fill"
                        style={{ background: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(val / 25) * 100}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Energy Flow */}
      <div className="section-block" style={{ marginBottom: '1.5rem' }}>
        <div className="section-block-header">
          <span className="card-title">Live Energy Flow</span>
          <span className="badge badge-green">
            <span className="live-dot" style={{ width: 6, height: 6 }} /> Active
          </span>
        </div>
        <EnergyFlowDiagram results={results} />
      </div>

      {/* Chart */}
      <div className="section-block" style={{ marginBottom: '1.5rem' }}>
        <div className="section-block-header">
          <span className="card-title">Energy Profile</span>
          <div className="tab-bar" style={{ padding: '0.2rem' }}>
            {['24h', '7d'].map((v) => (
              <button key={v} className={`tab-item ${chartView === v ? 'active' : ''}`} onClick={() => setChartView(v)} style={{ flex: 'none', minWidth: 48 }}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="section-block-body">
          <ResponsiveContainer width="100%" height={260}>
            {chartView === '24h' ? (
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gLoad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6b7280" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} />
                <YAxis tick={{ fontSize: 10 }} unit=" kWh" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                <Area type="monotone" dataKey="total" name="Generated" stroke="#22c55e" fill="url(#gTotal)" strokeWidth={2} />
                <Area type="monotone" dataKey="load" name="Consumed" stroke="#6b7280" fill="url(#gLoad)" strokeWidth={2} strokeDasharray="4 2" />
              </AreaChart>
            ) : (
              <BarChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} unit=" kWh" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                <Bar dataKey="generated" name="Generated" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="consumed" name="Consumed" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                <Bar dataKey="grid" name="Grid" fill="#fca5a5" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
          <p className="educational-note" style={{ marginTop: '0.5rem' }}>
            ⓘ Hourly profile is modeled from daily totals using typical load/generation curves. Values are representative educational estimates.
          </p>
        </div>
      </div>

      {/* Current Config Summary */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Current Simulation Configuration</span>
          <button className="btn btn-primary" onClick={() => navigate('/simulator')}>
            Modify &amp; Simulate <ArrowRight size={14} />
          </button>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'Solar Capacity', value: `${params.solar.capacity} kW`, color: COLORS.solar },
              { label: 'Wind Turbines', value: `${params.wind.numTurbines} × ${params.wind.turbineCapacity} kW`, color: COLORS.wind },
              { label: 'Hydro Capacity', value: `${params.hydro.capacity} kW`, color: COLORS.hydro },
              { label: 'Biomass Input', value: `${params.biomass.input} kg/day`, color: COLORS.biomass },
              { label: 'Battery Capacity', value: `${params.battery.capacity} kWh`, color: '#8B5CF6' },
              { label: 'Daily Load', value: `${params.grid.dailyDemand} kWh`, color: '#6B7280' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                padding: '0.875rem', borderRadius: '10px',
                background: `${color}0d`, border: `1.5px solid ${color}30`,
              }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--gp-gray-500)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1rem', color, marginTop: '0.25rem' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

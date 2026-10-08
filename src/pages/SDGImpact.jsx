// SDGImpact.jsx — SDG Impact page
import React from 'react';
import { motion } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { useEnergy } from '../context/EnergyContext.jsx';
import SDGScoreRing from '../components/SDGScoreRing.jsx';
import { SDG7_SUB_METRICS } from '../data/sdgData.js';
import { getScoreLabel } from '../utils/sdgScore.js';

function BeforeAfterCard({ label, before, after, unit = '', lower = false }) {
  const improved = lower ? after < before : after > before;
  const delta = after - before;
  const pct = before !== 0 ? Math.abs((delta / before) * 100).toFixed(1) : 0;

  return (
    <div style={{
      borderRadius: 12, overflow: 'hidden',
      border: '1px solid var(--gp-gray-200)',
      background: '#fff',
    }}>
      <div style={{ padding: '0.75rem 1rem', background: 'var(--gp-gray-50)', borderBottom: '1px solid var(--gp-gray-200)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--gp-gray-700)' }}>
        {label}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%' }}>
        <div style={{ padding: '1rem', borderRight: '1px solid var(--gp-gray-100)', background: '#fff5f5' }}>
          <div style={{ fontSize: '0.65rem', color: '#EF4444', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>BEFORE</div>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.3rem', color: '#dc2626' }}>
            {typeof before === 'number' ? before.toFixed(before > 100 ? 0 : 1) : before}{unit}
          </div>
        </div>
        <div style={{ padding: '1rem', background: '#f0fdf4' }}>
          <div style={{ fontSize: '0.65rem', color: '#22c55e', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>AFTER</div>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.3rem', color: '#16a34a' }}>
            {typeof after === 'number' ? after.toFixed(after > 100 ? 0 : 1) : after}{unit}
          </div>
        </div>
      </div>
      <div style={{
        padding: '0.5rem 1rem',
        background: improved ? '#f0fdf4' : '#fff5f5',
        display: 'flex', alignItems: 'center', gap: '0.375rem',
        fontSize: '0.75rem', fontWeight: 600,
        color: improved ? '#16a34a' : '#dc2626',
      }}>
        {improved ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
        {pct}% {improved ? 'improvement' : 'change'}
      </div>
    </div>
  );
}

export default function SDGImpact() {
  const { liveResults, simResults } = useEnergy();
  const navigate = useNavigate();
  const results = simResults || liveResults;

  if (!results) {
    return (
      <div className="page-wrapper">
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--gp-gray-500)' }}>
          <p>Please run a simulation first to see SDG impact.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/simulator')}>
            Go to Simulator <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  const sdgScores = results.sdgScores || {};
  const sdg7 = sdgScores.sdg7 || { total: 0, subMetrics: {} };
  const overall = sdgScores.overall || 0;

  // Before: 100% grid scenario
  const beforeScenario = {
    renewableSharePct: 0,
    gridDependencyPct: 100,
    co2AvoidedKg: 0,
    dailyCostSaving: 0,
  };

  // SDG goal scores for radar
  const goalScores = [
    { subject: 'SDG 7', score: sdg7.total, color: SDG_COLORS[7] },
    { subject: 'SDG 9', score: sdgScores.sdg9 || 0, color: SDG_COLORS[9] },
    { subject: 'SDG 11', score: sdgScores.sdg11 || 0, color: SDG_COLORS[11] },
    { subject: 'SDG 12', score: sdgScores.sdg12 || 0, color: SDG_COLORS[12] },
    { subject: 'SDG 13', score: sdgScores.sdg13 || 0, color: SDG_COLORS[13] },
  ];

  const radarData = goalScores.map(g => ({ subject: g.subject, score: g.score }));

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Your Sustainability Impact</h1>
        <p className="page-subtitle">SDG impact analysis based on your current energy system configuration.</p>
      </div>

      {/* Large score + SDG goals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2rem', marginBottom: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Main score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
          style={{ textAlign: 'center' }}
        >
          <SDGScoreRing score={sdg7.total} maxScore={100} size={220} label="SDG 7 Impact Score" />
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ ...(() => { const l = getScoreLabel(sdg7.total); return { color: l.color }; })(), fontWeight: 700, fontSize: '1rem' }}>
              {getScoreLabel(sdg7.total).label}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--gp-gray-400)', marginTop: '4px' }}>Calculated from simulation results</p>
          </div>
        </motion.div>

        {/* SDG 7 sub-metrics */}
        <div>
          <h3 style={{ fontWeight: 700, color: 'var(--gp-gray-800)', marginBottom: '1rem' }}>SDG 7 — Affordable and Clean Energy</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[
              { key: 'affordable', label: 'Affordable Energy', desc: 'Cost savings vs grid-only', color: '#22c55e', maxScore: 25 },
              { key: 'clean', label: 'Clean Energy', desc: 'CO₂ avoided vs baseline', color: '#06B6D4', maxScore: 25 },
              { key: 'efficiency', label: 'Energy Efficiency', desc: 'Grid independence level', color: '#8B5CF6', maxScore: 25 },
              { key: 'renewable', label: 'Renewable Adoption', desc: 'Share of renewable sources', color: '#F59E0B', maxScore: 25 },
            ].map(({ key, label, desc, color, maxScore }) => {
              const val = sdg7.subMetrics?.[key] || 0;
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gp-gray-800)' }}>{label}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--gp-gray-500)' }}>{desc}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.1rem', color }}>{val.toFixed(0)}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--gp-gray-400)' }}>/ {maxScore}</div>
                    </div>
                  </div>
                  <div className="progress-bar-wrap" style={{ height: 8 }}>
                    <motion.div
                      className="progress-bar-fill"
                      style={{ background: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(val / maxScore) * 100}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>



      {/* Radar + Impact metrics */}
      <div className="two-col" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Multi-SDG Impact Map</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fontWeight: 600 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar
                  dataKey="score"
                  name="SDG Score"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.18}
                  strokeWidth={2}
                />
                <Tooltip formatter={(v) => [`${v.toFixed(1)}/100`, 'Score']} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Impact Metrics</span></div>
          <div className="card-body">
            {[
              { label: 'Renewable Energy Generated', value: `${results.totalRenewable.toFixed(1)} kWh/day`, color: '#22c55e', icon: '⚡' },
              { label: 'CO₂ Avoided Daily', value: `${results.co2AvoidedKg.toFixed(2)} kg`, color: '#06B6D4', icon: '🌱' },
              { label: 'Grid Dependency', value: `${results.gridDependencyPct.toFixed(1)}%`, color: results.gridDependencyPct < 30 ? '#22c55e' : '#EF4444', icon: '📊' },
              { label: 'Estimated Daily Saving', value: `₹${results.dailyCostSaving.toFixed(0)}`, color: '#8B5CF6', icon: '💰' },
              { label: 'Annual CO₂ Avoided', value: `${(results.co2AvoidedKg * 365 / 1000).toFixed(2)} tonnes`, color: '#22c55e', icon: '🌍' },
              { label: 'Annual Cost Saving', value: `₹${(results.dailyCostSaving * 365).toFixed(0)}`, color: '#F59E0B', icon: '🏆' },
            ].map(({ label, value, color, icon }) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.625rem 0', borderBottom: '1px solid var(--gp-gray-100)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--gp-gray-600)' }}>
                  <span>{icon}</span> {label}
                </div>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color, fontSize: '0.9rem' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Before vs After */}
      <div className="section-block" style={{ marginBottom: '2rem' }}>
        <div className="section-block-header">
          <span className="card-title">Before vs After — Your Clean Energy Impact</span>
        </div>
        <div className="section-block-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <BeforeAfterCard label="Renewable Share" before={0} after={results.renewableSharePct} unit="%" />
            <BeforeAfterCard label="Grid Dependency" before={100} after={results.gridDependencyPct} unit="%" lower />
            <BeforeAfterCard label="CO₂ Avoided" before={0} after={results.co2AvoidedKg} unit=" kg/day" />
            <BeforeAfterCard label="Daily Energy Cost" before={results.gridOnlyCost} after={results.actualCost} unit="₹" lower />
          </div>
        </div>
      </div>

      {/* Final message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        style={{
          padding: '2rem', borderRadius: 14,
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          border: '1.5px solid #86efac',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🌍</div>
        <h2 style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 800, fontSize: '1.375rem',
          color: '#14532d', marginBottom: '0.75rem',
        }}>
          Small changes in energy systems can create measurable sustainability impact.
        </h2>
        <p style={{ fontSize: '0.9375rem', color: '#166534', maxWidth: 600, margin: '0 auto 1.5rem' }}>
          Your simulated system generates <strong>{results.renewableSharePct.toFixed(1)}%</strong> renewable energy,
          avoids <strong>{results.co2AvoidedKg.toFixed(1)} kg CO₂/day</strong>, and could save
          <strong> ₹{(results.dailyCostSaving * 365).toFixed(0)}/year</strong>.
        </p>
        <button className="btn btn-primary btn-primary-lg" onClick={() => navigate('/simulator')}>
          Optimize Your System <ArrowRight size={16} />
        </button>
        <p className="educational-note" style={{ marginTop: '1rem', justifyContent: 'center' }}>
          ⓘ Values are representative educational estimates for simulation purposes. Not engineering-certified data.
        </p>
      </motion.div>
    </div>
  );
}

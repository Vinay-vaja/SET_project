// About.jsx — About GreenPulse / Syllabus mapping page
import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Zap, BookOpen, Target, Users, Globe } from 'lucide-react';

const UNITS = [
  {
    unit: 1,
    title: 'Energy Sustainability & SDGs',
    topics: ['Global energy scenario', 'Fossil fuels vs renewables', 'SDG 7 targets', 'Energy transition roadmap', 'GHG emissions & climate change'],
    page: 'Dashboard + SDG Impact',
    color: '#22C55E',
  },
  {
    unit: 2,
    title: 'Renewable Energy Technologies',
    topics: ['Solar PV & thermal', 'Wind energy', 'Hydropower', 'Biomass & bioenergy', 'Conventional energy (coal, gas, nuclear)'],
    page: 'Energy Simulator + Compare Technologies',
    color: '#3B82F6',
  },
  {
    unit: 3,
    title: 'Hydrogen & Fuel Cells',
    topics: ['Green hydrogen production', 'Electrolyzer types (AWE, PEM, SOEC)', 'Fuel cell types (PEMFC, SOFC, AFC)', 'Hydrogen storage', 'Round-trip efficiency'],
    page: 'Emerging Technologies',
    color: '#8B5CF6',
  },
  {
    unit: 4,
    title: 'Waste-to-Energy',
    topics: ['Incineration', 'Pyrolysis', 'Gasification', 'Anaerobic Digestion', 'Landfill Gas Recovery'],
    page: 'Waste → Energy',
    color: '#F97316',
  },
  {
    unit: 5,
    title: 'Energy Management & Audit',
    topics: ['Energy audit methodology', 'Equipment energy consumption', 'Load analysis', 'Energy conservation measures', 'Cost-benefit analysis'],
    page: 'Energy Audit',
    color: '#06B6D4',
  },
];

const SDG_SECONDARY = [
  { id: 9, name: 'Industry, Innovation & Infrastructure', color: '#FF6D00', icon: '🏗️' },
  { id: 11, name: 'Sustainable Cities & Communities', color: '#FF8F00', icon: '🏙️' },
  { id: 12, name: 'Responsible Consumption & Production', color: '#BF8600', icon: '♻️' },
  { id: 13, name: 'Climate Action', color: '#1B5E20', icon: '🌍' },
];

export default function About() {
  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">About GreenPulse</h1>
        <p className="page-subtitle">An interactive Sustainable Energy Simulation & SDG 7 Impact Platform.</p>
      </div>

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, #0f1f16 0%, #1a3a28 100%)',
          borderRadius: 16, padding: '2rem',
          color: '#fff', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap',
        }}
      >
        <div style={{
          width: 80, height: 80, borderRadius: 20,
          background: '#ffffff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(34,197,94,0.3)',
          flexShrink: 0,
          padding: '10px',
        }}>
          <img src="/logo-icon.png" alt="GreenPulse Icon" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            GreenPulse
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9375rem', marginBottom: '0.75rem' }}>
            Simulate. Compare. Optimize. Build a Sustainable Future.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 6, padding: '0.25rem 0.625rem', fontSize: '0.75rem', fontWeight: 600 }}>
              Subject: Sustainable Energy Technology
            </span>
            <span style={{ background: 'rgba(255,193,7,0.2)', border: '1px solid rgba(255,193,7,0.3)', borderRadius: 6, padding: '0.25rem 0.625rem', fontSize: '0.75rem', fontWeight: 600, color: '#FFC107' }}>
              Primary SDG: SDG 7
            </span>
            <span style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '0.25rem 0.625rem', fontSize: '0.75rem', fontWeight: 600 }}>
              GTU Engineering PBL
            </span>
          </div>
        </div>
      </motion.div>

      {/* Purpose */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { icon: Zap, title: 'Real Simulation', desc: 'All values calculated from your inputs — no hardcoded results.', color: '#22c55e' },
          { icon: BookOpen, title: 'Educational Focus', desc: 'Covers all 5 units of Sustainable Energy Technology curriculum.', color: '#3B82F6' },
          { icon: Target, title: 'SDG Aligned', desc: 'Directly linked to SDG 7 and 4 related sustainable development goals.', color: '#FFC107' },
          { icon: Globe, title: 'Impact Aware', desc: 'CO₂, cost, and renewable metrics calculated for every scenario.', color: '#06B6D4' },
        ].map(({ icon: Icon, title, desc, color }) => (
          <div key={title} className="card" style={{ padding: '1.25rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <Icon size={20} style={{ color }} />
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--gp-gray-800)', marginBottom: '0.375rem' }}>{title}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--gp-gray-500)' }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* Syllabus mapping */}
      <div className="section-block" style={{ marginBottom: '2rem' }}>
        <div className="section-block-header">
          <span className="card-title">📚 Subject Syllabus Mapping</span>
          <span className="badge badge-green">5 Units Covered</span>
        </div>
        <div className="section-block-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {UNITS.map((u, i) => (
              <motion.div
                key={u.unit}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: 'flex', gap: '1rem', padding: '1rem', borderRadius: 10,
                  background: `${u.color}08`, border: `1px solid ${u.color}20`,
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: u.color, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1rem',
                  flexShrink: 0,
                }}>
                  {u.unit}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--gp-gray-800)', fontSize: '0.9375rem' }}>{u.title}</div>
                    <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>→ {u.page}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {u.topics.map(t => (
                      <span key={t} style={{
                        background: '#fff', border: `1px solid ${u.color}30`,
                        borderRadius: 4, padding: '0.2rem 0.5rem',
                        fontSize: '0.72rem', color: 'var(--gp-gray-600)',
                      }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* SDGs */}
      <div className="section-block" style={{ marginBottom: '2rem' }}>
        <div className="section-block-header">
          <span className="card-title">🌐 SDG Alignment</span>
        </div>
        <div className="section-block-body">
          {/* Primary SDG */}
          <div style={{
            background: 'linear-gradient(135deg, #fff8e1 0%, #fffde7 100%)',
            border: '2px solid #FFC107',
            borderRadius: 12, padding: '1.25rem',
            marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem',
          }}>
            <div style={{ fontSize: '2.5rem' }}>⚡</div>
            <div>
              <div style={{ color: '#92400e', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Primary SDG</div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#78350f' }}>SDG 7 — Affordable and Clean Energy</div>
              <div style={{ fontSize: '0.8rem', color: '#92400e', marginTop: '4px' }}>
                Ensure access to affordable, reliable, sustainable and modern energy for all.
              </div>
            </div>
          </div>
          {/* Secondary SDGs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {SDG_SECONDARY.map(sdg => (
              <div key={sdg.id} style={{
                padding: '0.875rem', borderRadius: 10,
                background: `${sdg.color}0d`, border: `1px solid ${sdg.color}30`,
                display: 'flex', alignItems: 'center', gap: '0.75rem',
              }}>
                <span style={{ fontSize: '1.5rem' }}>{sdg.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, color: sdg.color, fontSize: '0.8rem' }}>SDG {sdg.id}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gp-gray-600)' }}>{sdg.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tech stack */}
      <div className="card">
        <div className="card-header"><span className="card-title">🛠 Technology Stack</span></div>
        <div className="card-body">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {['React 19', 'Vite', 'Tailwind CSS', 'Recharts', 'Framer Motion', 'GSAP', 'Lucide React', 'React CountUp', 'React Router'].map(tech => (
              <span key={tech} className="badge badge-green">{tech}</span>
            ))}
          </div>
          <p className="educational-note" style={{ marginTop: '1rem' }}>
            ⓘ All simulation values are calculated in-browser using JavaScript. No backend required. Values are representative educational estimates for simulation and learning purposes.
          </p>
        </div>
      </div>
    </div>
  );
}

// KPICard.jsx — Animated KPI card
import React from 'react';
import { motion } from 'framer-motion';
import AnimatedNumber from './AnimatedNumber.jsx';

export default function KPICard({
  label,
  value,
  unit,
  icon: Icon,
  color = '#22c55e',
  delta,
  deltaLabel,
  prefix = '',
  decimals = 1,
}) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;

  return (
    <motion.div
      className="kpi-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="kpi-card-accent" style={{ background: color }} />
      {Icon && (
        <div className="kpi-icon-wrap" style={{ background: `${color}18` }}>
          <Icon size={18} style={{ color }} />
        </div>
      )}
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">
        <AnimatedNumber
          end={numericValue}
          duration={1.0}
          decimals={decimals}
          prefix={prefix}
        />
        {unit && <span className="kpi-unit"> {unit}</span>}
      </div>
      {delta !== undefined && (
        <div className={`kpi-delta ${delta >= 0 ? 'positive' : 'negative'}`}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% {deltaLabel || ''}
        </div>
      )}
    </motion.div>
  );
}

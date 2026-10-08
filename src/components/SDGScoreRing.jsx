// SDGScoreRing.jsx — Circular SVG score ring
import React from 'react';
import { motion } from 'framer-motion';
import AnimatedNumber from './AnimatedNumber.jsx';

export default function SDGScoreRing({ score, maxScore = 100, size = 180, label = 'SDG 7 Score', color = '#22c55e' }) {
  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score / maxScore, 1);
  const strokeDashoffset = circumference * (1 - progress);

  const getColor = (s) => {
    const pct = (s / maxScore) * 100;
    if (pct >= 80) return '#22c55e';
    if (pct >= 60) return '#84cc16';
    if (pct >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const ringColor = getColor(score);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={10}
          />
          {/* Progress ring */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        {/* Center text */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: size > 150 ? '2.25rem' : '1.5rem',
            fontWeight: 800,
            color: ringColor,
            lineHeight: 1,
          }}>
            <AnimatedNumber end={score} duration={1.2} decimals={0} />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--gp-gray-500)', marginTop: '2px' }}>
            / {maxScore}
          </div>
        </div>
      </div>
      <div style={{
        fontSize: '0.8125rem',
        fontWeight: 600,
        color: 'var(--gp-gray-700)',
        textAlign: 'center',
      }}>
        {label}
      </div>
    </div>
  );
}

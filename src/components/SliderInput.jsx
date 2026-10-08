// SliderInput.jsx — Reusable slider + number input combo
import React, { useCallback } from 'react';

export default function SliderInput({ label, value, min, max, step = 1, unit = '', onChange }) {
  const pct = ((value - min) / (max - min)) * 100;

  const handleSlider = useCallback((e) => {
    onChange(parseFloat(e.target.value));
  }, [onChange]);

  const handleInput = useCallback((e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      onChange(Math.max(min, Math.min(max, val)));
    }
  }, [onChange, min, max]);

  return (
    <div className="form-group">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
        <label className="form-label" style={{ marginBottom: 0 }}>{label}</label>
        <span style={{ fontSize: '0.7rem', color: 'var(--gp-gray-400)' }}>{unit}</span>
      </div>
      <div className="slider-row">
        <input
          type="range"
          className="form-slider"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSlider}
          style={{ '--slider-fill': `${pct}%` }}
        />
        <input
          type="number"
          className="slider-input-box"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleInput}
        />
      </div>
    </div>
  );
}

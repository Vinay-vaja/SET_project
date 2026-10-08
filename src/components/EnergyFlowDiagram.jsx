// EnergyFlowDiagram.jsx — Animated energy flow visualization using SVG + GSAP
import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { Sun, Wind, Droplets, Leaf, Battery, Grid3X3, Zap, Home } from 'lucide-react';

gsap.registerPlugin(MotionPathPlugin);

function FlowNode({ label, icon: Icon, colorClass, value, unit = 'kWh' }) {
  return (
    <div className={`flow-node ${colorClass}`}>
      <Icon size={16} />
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>
          {typeof value === 'number' ? value.toFixed(1) : value} {unit}
        </div>
      </div>
    </div>
  );
}

function FlowArrow({ active, animated = true }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 0.25rem',
    }}>
      <div style={{
        width: '32px',
        height: '2px',
        background: active ? 'linear-gradient(90deg, #22c55e, #4ade80)' : 'var(--gp-gray-200)',
        borderRadius: '1px',
        position: 'relative',
        transition: 'background 0.4s',
      }}>
        {active && animated && (
          <div style={{
            position: 'absolute',
            right: '-4px',
            top: '-3px',
            width: 0,
            height: 0,
            borderLeft: '6px solid #22c55e',
            borderTop: '4px solid transparent',
            borderBottom: '4px solid transparent',
          }} />
        )}
        {!active && (
          <div style={{
            position: 'absolute',
            right: '-4px',
            top: '-3px',
            width: 0,
            height: 0,
            borderLeft: '6px solid var(--gp-gray-300)',
            borderTop: '4px solid transparent',
            borderBottom: '4px solid transparent',
          }} />
        )}
      </div>
    </div>
  );
}

export default function EnergyFlowDiagram({ results, compact = false }) {
  if (!results) return null;

  const {
    solarEnergy = 0,
    windEnergy = 0,
    hydroEnergy = 0,
    biomassEnergy = 0,
    totalRenewable = 0,
    gridEnergy = 0,
    totalDemandKWh = 0,
    batteryCharged = 0,
    batteryDischarged = 0,
    batterySoC = 50,
    batteryCapacity = 20,
  } = results;

  const socColor = batterySoC > 60 ? '#22c55e' : batterySoC > 30 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ padding: compact ? '1rem' : '1.5rem' }}>
      {/* Sources row */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {/* Source column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 140 }}>
          <FlowNode label="Solar" icon={Sun} colorClass="flow-node-solar" value={solarEnergy} />
          <FlowNode label="Wind" icon={Wind} colorClass="flow-node-wind" value={windEnergy} />
          <FlowNode label="Hydro" icon={Droplets} colorClass="flow-node-hydro" value={hydroEnergy} />
          <FlowNode label="Biomass" icon={Leaf} colorClass="flow-node-biomass" value={biomassEnergy} />
        </div>

        {/* Arrow column */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '0.5rem' }}>
          <FlowArrow active={solarEnergy > 0} />
          <FlowArrow active={windEnergy > 0} />
          <FlowArrow active={hydroEnergy > 0} />
          <FlowArrow active={biomassEnergy > 0} />
        </div>

        {/* EMS */}
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <div className="flow-node flow-node-ems" style={{ flex: 1, flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <Zap size={20} style={{ marginBottom: '0.25rem' }} />
            <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Energy Management</div>
            <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>
              {totalRenewable.toFixed(1)} kWh renewable
            </div>
            {gridEnergy > 0 && (
              <div style={{ fontSize: '0.65rem', color: '#ef4444', marginTop: '2px' }}>
                +{gridEnergy.toFixed(1)} kWh grid
              </div>
            )}
          </div>
        </div>

        {/* Output arrows + nodes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'space-around' }}>
          <FlowArrow active={true} />
          <FlowArrow active={batteryCharged > 0 || batteryDischarged > 0} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 140 }}>
          {/* Load */}
          <FlowNode label="Load / Demand" icon={Home} colorClass="flow-node-load" value={totalDemandKWh} />
          {/* Battery */}
          <div className="flow-node flow-node-battery" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Battery size={16} />
              <span>Battery</span>
            </div>
            <div style={{ width: '100%', marginTop: '0.375rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '2px' }}>
                <span>SoC</span>
                <span style={{ color: socColor, fontWeight: 700 }}>{batterySoC.toFixed(0)}%</span>
              </div>
              <div className="progress-bar-wrap" style={{ height: '6px' }}>
                <div
                  className="progress-bar-fill"
                  style={{ width: `${batterySoC}%`, background: socColor }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid supply row */}
      {gridEnergy > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.625rem', borderRadius: '8px',
          background: '#fff5f5', border: '1px dashed #fca5a5',
          fontSize: '0.75rem', color: '#991b1b',
        }}>
          <Grid3X3 size={14} />
          <span><strong>Grid fallback:</strong> {gridEnergy.toFixed(1)} kWh supplemented from grid due to renewable deficit</span>
        </div>
      )}

      {/* Surplus row */}
      {totalRenewable > totalDemandKWh && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.625rem', borderRadius: '8px',
          background: '#f0fdf4', border: '1px dashed #86efac',
          fontSize: '0.75rem', color: '#166534', marginTop: '0.5rem',
        }}>
          <Battery size={14} />
          <span><strong>Surplus energy:</strong> {(totalRenewable - totalDemandKWh).toFixed(1)} kWh available for battery or export</span>
        </div>
      )}

      <p className="educational-note" style={{ marginTop: '0.75rem' }}>
        ⓘ Values are representative educational estimates for simulation purposes.
      </p>
    </div>
  );
}

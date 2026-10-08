// SimulationViewport.jsx — Unified Interactive Renewable Energy Physics Process Simulator Viewport
import React, { useState } from 'react';
import {
  Sun, Wind, Droplets, Leaf, Play, Pause, Box, Layers, Cpu, Maximize2, Minimize2
} from 'lucide-react';
import SolarSimulationView from './SolarSimulationView.jsx';
import WindSimulationView from './WindSimulationView.jsx';
import HydroSimulationView from './HydroSimulationView.jsx';
import BiomassSimulationView from './BiomassSimulationView.jsx';
import DigitalTwin3D from '../DigitalTwin3D.jsx';
import EnergyFlowDiagram from '../EnergyFlowDiagram.jsx';

export default function SimulationViewport({ params, results, onUpdateParam }) {
  const [visMode, setVisMode] = useState('process'); // 'process' | '3d' | 'flow'
  const [activeSource, setActiveSource] = useState('solar'); // 'solar' | 'wind' | 'hydro' | 'biomass'
  const [isPlaying, setIsPlaying] = useState(true);

  const sources = [
    { id: 'solar', label: '☀️ Solar PV', icon: Sun, color: '#f59e0b' },
    { id: 'wind', label: '💨 Wind Turbine', icon: Wind, color: '#06b6d4' },
    { id: 'hydro', label: '🌊 Hydro Station', icon: Droplets, color: '#0ea5e9' },
    { id: 'biomass', label: '🌱 Biomass CHP', icon: Leaf, color: '#10b981' },
  ];

  return (
    <div className="sim-viewport-container">
      {/* VIEWPORT CONTROLS BAR */}
      <div className="sim-viewport-toolbar">
        {/* Source Switcher Tabs (Solar, Wind, Hydro, Biomass) */}
        <div className="sim-source-tabs-group">
          {sources.map((s) => {
            const isSelected = activeSource === s.id && visMode === 'process';
            return (
              <button
                key={s.id}
                type="button"
                className={`sim-source-tab-btn ${isSelected ? 'active' : ''}`}
                style={{
                  '--accent-color': s.color,
                  borderColor: isSelected ? s.color : 'rgba(255, 255, 255, 0.08)',
                }}
                onClick={() => {
                  setActiveSource(s.id);
                  setVisMode('process');
                }}
              >
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* View Mode & Animation Controls */}
        <div className="sim-viewmode-group">
          <button
            type="button"
            className={`sim-mode-btn ${visMode === 'process' ? 'active' : ''}`}
            onClick={() => setVisMode('process')}
            title="Physical Energy Conversion Process View"
          >
            <Cpu size={13} />
            <span>Process Simulation</span>
          </button>

          <button
            type="button"
            className={`sim-mode-btn ${visMode === '3d' ? 'active' : ''}`}
            onClick={() => setVisMode('3d')}
            title="3D Campus Digital Twin"
          >
            <Box size={13} />
            <span>3D View</span>
          </button>

          <button
            type="button"
            className={`sim-mode-btn ${visMode === 'flow' ? 'active' : ''}`}
            onClick={() => setVisMode('flow')}
            title="2D Animated Microgrid Flow"
          >
            <Layers size={13} />
            <span>2D Flow</span>
          </button>

          {/* Pause / Resume */}
          <button
            type="button"
            className="sim-play-pause-btn"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause Simulation Animation' : 'Resume Simulation Animation'}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
          </button>
        </div>
      </div>

      {/* VIEWPORT CANVAS / CONTENT AREA */}
      <div className="sim-viewport-canvas-wrapper">
        {visMode === 'process' && (
          <>
            {activeSource === 'solar' && (
              <SolarSimulationView params={params} results={results} isPlaying={isPlaying} />
            )}
            {activeSource === 'wind' && (
              <WindSimulationView params={params} results={results} isPlaying={isPlaying} />
            )}
            {activeSource === 'hydro' && (
              <HydroSimulationView params={params} results={results} isPlaying={isPlaying} />
            )}
            {activeSource === 'biomass' && (
              <BiomassSimulationView params={params} results={results} isPlaying={isPlaying} />
            )}
          </>
        )}

        {visMode === '3d' && (
          <DigitalTwin3D params={params} results={results} />
        )}

        {visMode === 'flow' && (
          <EnergyFlowDiagram
            results={results}
            compact
            onSelectSource={(src) => {
              setActiveSource(src);
              setVisMode('process');
            }}
          />
        )}
      </div>
    </div>
  );
}

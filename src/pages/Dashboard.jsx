// Dashboard.jsx — Main overview page
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, ArrowRight, Target, Volume2, Square,
  MapPin, Navigation, RefreshCw, Clock
} from 'lucide-react';
import { useEnergy } from '../context/EnergyContext.jsx';
import { useVoice } from '../context/VoiceContext.jsx';
import { useRealConditions } from '../hooks/useRealConditions.js';
import InteractiveEcoSphere from '../components/InteractiveEcoSphere.jsx';

export default function Dashboard() {
  const { liveResults, simResults, params } = useEnergy();
  const { speakLiveBriefing, isSpeaking, stopSpeaking, personaInfo } = useVoice();
  const realData = useRealConditions();
  const navigate = useNavigate();

  const results = simResults || liveResults;
  if (!results) return null;

  // Time formatting for real data
  const formattedUpdateTime = realData.updatedAt
    ? new Date(realData.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Live';

  return (
    <div className="page-wrapper dashboard-page-wrapper">
      {/* FULL SCREEN HD HERO SHOWCASE */}
      <div className="landing-hero-fullscreen">
        <div className="landing-hero-bg-img" style={{ backgroundImage: 'url(/hero-landscape.jpg)' }} />
        <div className="landing-hero-overlay" />
        <div className="landing-hero-content">
          <div className="landing-hero-badge">
            <span className="live-dot" />
            <span>UN SDG 7 Clean Energy Transition Platform</span>
          </div>

          <h1 className="landing-hero-title">
            Next-Generation Renewable Energy &amp; Microgrid Simulation
          </h1>

          {/* Action CTA Buttons */}
          <div className="landing-hero-actions">
            <button className="btn btn-primary btn-hero-primary" onClick={() => navigate('/simulator')}>
              <Zap size={17} /> Launch Energy Simulator <ArrowRight size={16} />
            </button>
            <button
              className="btn btn-hero-voice"
              onClick={() => {
                if (isSpeaking) stopSpeaking();
                else speakLiveBriefing(results, params, location.pathname, realData);
              }}
              style={{ borderColor: `${personaInfo.color}80` }}
              title={`Listen to AI grid debrief by ${personaInfo.name}`}
            >
              {isSpeaking ? <Square size={16} color="#ef4444" /> : <Volume2 size={16} color={personaInfo.color} />}
              <span>{isSpeaking ? 'Stop Briefing' : `AI Voice Briefing (${personaInfo.name})`}</span>
            </button>
            <button className="btn btn-hero-outline" onClick={() => navigate('/sdg-impact')}>
              <Target size={16} /> SDG 7 Scorecard
            </button>
          </div>
        </div>
      </div>

      {/* COMPACT REAL ENVIRONMENTAL TELEMETRY SECTION */}
      <div className="real-telemetry-banner">
        <div className="real-telemetry-header">
          <div className="real-telemetry-location-info">
            <MapPin size={18} color="#22c55e" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                  {realData.location}, {realData.region}
                </span>
                <span className="badge-real">● REAL DATA</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Source: {realData.dataSource}</span>
                <span>•</span>
                <Clock size={11} />
                <span>Updated: {formattedUpdateTime}</span>
              </div>
            </div>
          </div>

          {/* Location Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: '0.72rem', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={realData.requestUserLocation}
              disabled={realData.loading}
              title="Detect your exact location with browser GPS"
            >
              <Navigation size={13} color="#22c55e" />
              <span>{realData.loading ? 'Detecting...' : 'Use My Location'}</span>
            </button>

            <select
              className="real-location-dropdown"
              value={realData.selectedLocationId}
              onChange={(e) => realData.selectManualLocation(e.target.value)}
            >
              {realData.availableLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  📍 {loc.name}, {loc.region.split(',')[0]}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: '6px 8px' }}
              onClick={realData.refreshRealData}
              title="Refresh Live Environmental Telemetry"
            >
              <RefreshCw size={13} className={realData.loading ? 'spin-slow' : ''} />
            </button>
          </div>
        </div>

        {/* Real Conditions Grid */}
        <div className="real-telemetry-grid">
          <div className="real-telemetry-stat">
            <div className="real-telemetry-stat-label">
              <span>Temperature</span>
              <span className="badge-real">REAL</span>
            </div>
            <div className="real-telemetry-stat-val" style={{ color: '#f59e0b' }}>
              {realData.temperature}°C
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Feels like {realData.apparentTemperature}°C</div>
          </div>

          <div className="real-telemetry-stat">
            <div className="real-telemetry-stat-label">
              <span>Wind Speed</span>
              <span className="badge-real">REAL</span>
            </div>
            <div className="real-telemetry-stat-val" style={{ color: '#06b6d4' }}>
              {realData.windSpeed} m/s
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{realData.windSpeedKmh} km/h • {realData.windDirection}°</div>
          </div>

          <div className="real-telemetry-stat">
            <div className="real-telemetry-stat-label">
              <span>Solar Irradiance</span>
              <span className="badge-real">REAL</span>
            </div>
            <div className="real-telemetry-stat-val" style={{ color: '#fbbf24' }}>
              {realData.solarIrradiance} W/m²
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Shortwave Direct Flux</div>
          </div>

          <div className="real-telemetry-stat">
            <div className="real-telemetry-stat-label">
              <span>Humidity</span>
              <span className="badge-real">REAL</span>
            </div>
            <div className="real-telemetry-stat-val" style={{ color: '#38bdf8' }}>
              {realData.humidity}%
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Relative Humidity</div>
          </div>

          <div className="real-telemetry-stat">
            <div className="real-telemetry-stat-label">
              <span>Cloud / Weather</span>
              <span className="badge-real">REAL</span>
            </div>
            <div className="real-telemetry-stat-val" style={{ fontSize: '0.95rem', color: '#e2e8f0' }}>
              {realData.weatherDesc}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{realData.cloudCover}% cloud cover</div>
          </div>
        </div>

        {/* Data Trust Badges Banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Data Trust Origins:</span>
          <span className="badge-real">🟢 REAL (Open-Meteo &amp; GPS)</span>
          <span className="badge-simulated">🔵 SIMULATED (Physics Engine)</span>
          <span className="badge-userinput">🟠 USER INPUT (Capacities &amp; Demand)</span>
          <span className="badge-reference">🟣 REFERENCE (CEA &amp; STC Standards)</span>
        </div>
      </div>

      {/* Interactive Living 3D Global Eco-Sphere Digital Twin */}
      <InteractiveEcoSphere results={results} realData={realData} />
    </div>
  );
}

// VoiceAssistantWidget.jsx — Interactive Dual-Persona AI Voice HUD (Mitra & Miles)
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Volume2, VolumeX, Square, Play, Pause, X,
  Sparkles, ShieldCheck, Zap, Sun, Wind, Battery, Droplets,
  ChevronUp, ChevronDown, Radio, UserCheck, RefreshCw
} from 'lucide-react';
import { useVoice, PERSONAS } from '../context/VoiceContext.jsx';
import { useEnergy } from '../context/EnergyContext.jsx';

export default function VoiceAssistantWidget() {
  const {
    activePersona,
    setActivePersona,
    personaInfo,
    isSpeaking,
    isPaused,
    audioLevel,
    currentTranscript,
    isWidgetOpen,
    setIsWidgetOpen,
    toggleWidget,
    speak,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    speakLiveBriefing,
    speakAssetReport,
  } = useVoice();

  const { liveResults, simResults, params } = useEnergy();
  const results = simResults || liveResults;

  const [activeTab, setActiveTab] = useState('briefing'); // 'briefing' | 'telemetry'

  // Dynamic equalizer bars
  const eqBars = [
    0.3 + (audioLevel * 0.7),
    0.5 + (audioLevel * 0.9),
    0.8 + (audioLevel * 0.6),
    0.4 + (audioLevel * 0.8),
    0.6 + (audioLevel * 0.7),
  ];

  return (
    <>
      {/* FLOATING MINI PILL (Always visible when widget is closed or compact) */}
      <div className="voice-floating-trigger-container">
        {!isWidgetOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`voice-floating-pill ${isSpeaking ? 'speaking-active' : ''}`}
            onClick={toggleWidget}
          >
            {/* Persona Avatar Badge */}
            <div
              className="voice-mini-avatar"
              style={{ background: personaInfo.avatarGradient }}
            >
              {isSpeaking ? (
                <Radio size={14} className="avatar-pulse-icon" />
              ) : (
                <Mic size={14} />
              )}
            </div>

            {/* Persona Name & Live Status */}
            <div className="voice-mini-info">
              <span className="voice-mini-name">{personaInfo.name}</span>
              <span className="voice-mini-status">
                {isSpeaking ? 'Speaking...' : 'Voice Ready'}
              </span>
            </div>

            {/* Equalizer Frequency Bars */}
            <div className="voice-mini-eq">
              {eqBars.map((h, i) => (
                <span
                  key={i}
                  className="voice-eq-bar"
                  style={{
                    height: isSpeaking ? `${Math.min(18, Math.max(4, h * 16))}px` : '4px',
                    backgroundColor: personaInfo.color,
                  }}
                />
              ))}
            </div>

            {/* One-Click Quick Brief Button */}
            <button
              className="voice-mini-brief-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (isSpeaking) {
                  stopSpeaking();
                } else {
                  speakLiveBriefing(results, params);
                }
              }}
              title={isSpeaking ? 'Stop speaking' : `Listen to ${personaInfo.name}'s briefing`}
            >
              {isSpeaking ? <Square size={12} /> : <Zap size={12} />}
              <span>{isSpeaking ? 'Stop' : 'Brief Me'}</span>
            </button>
          </motion.div>
        )}
      </div>

      {/* EXPANDED VOICE HUD MODAL / DECK */}
      <AnimatePresence>
        {isWidgetOpen && (
          <motion.div
            className="voice-hud-deck-overlay"
            initial={{ opacity: 0, y: 25, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.96 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
          >
            <div className="voice-hud-deck-card">
              {/* DECK HEADER */}
              <div className="voice-hud-header">
                <div className="voice-hud-title-wrap">
                  <div
                    className="voice-hud-avatar-lg"
                    style={{ background: personaInfo.avatarGradient }}
                  >
                    <Sparkles size={18} color="#fff" />
                  </div>
                  <div>
                    <div className="voice-hud-main-title">
                      AI Voice Copilot
                      <span
                        className="voice-hud-persona-tag"
                        style={{
                          backgroundColor: personaInfo.badgeColor,
                          color: personaInfo.color,
                          borderColor: `${personaInfo.color}40`,
                        }}
                      >
                        {personaInfo.name} • {personaInfo.title}
                      </span>
                    </div>
                    <div className="voice-hud-subtitle">
                      {personaInfo.role}
                    </div>
                  </div>
                </div>

                <div className="voice-hud-header-actions">
                  {/* Minimize / Close */}
                  <button
                    className="voice-hud-close-btn"
                    onClick={() => setIsWidgetOpen(false)}
                    title="Close voice deck"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* PERSONA SWITCHER SELECTOR */}
              <div className="voice-persona-selector-grid">
                {/* MITRA */}
                <button
                  type="button"
                  className={`voice-persona-card ${activePersona === 'mitra' ? 'active-mitra' : ''}`}
                  onClick={() => {
                    setActivePersona('mitra');
                    if (!isSpeaking) {
                      speak('Mitra selected. Ready for sustainability analysis.', 'mitra');
                    }
                  }}
                >
                  <div className="persona-card-header">
                    <div className="persona-avatar-chip mitra-chip">🌱 M</div>
                    <div>
                      <div className="persona-name">Mitra</div>
                      <div className="persona-badge">AI Sustainability Advisor</div>
                    </div>
                  </div>
                  <p className="persona-desc">
                    Articulate &amp; eco-focused. Highlights renewable ratio, carbon offset, and SDG 7 progress.
                  </p>
                </button>

                {/* MILES */}
                <button
                  type="button"
                  className={`voice-persona-card ${activePersona === 'miles' ? 'active-miles' : ''}`}
                  onClick={() => {
                    setActivePersona('miles');
                    if (!isSpeaking) {
                      speak('Dispatcher Miles online. Standing by for grid telemetry.', 'miles');
                    }
                  }}
                >
                  <div className="persona-card-header">
                    <div className="persona-avatar-chip miles-chip">⚡ M</div>
                    <div>
                      <div className="persona-name">Miles</div>
                      <div className="persona-badge">Grid Operations Dispatcher</div>
                    </div>
                  </div>
                  <p className="persona-desc">
                    Crisp &amp; technical. Reports generation megawatts, battery SoC reserves, and dispatch loads.
                  </p>
                </button>
              </div>

              {/* LIVE EQUALIZER & PLAYBACK CONTROLS */}
              <div className="voice-playback-bar">
                <div className="voice-eq-live-visualizer">
                  <div className="eq-frequency-bars">
                    {eqBars.map((h, i) => (
                      <span
                        key={i}
                        className="voice-bar-anim"
                        style={{
                          height: isSpeaking ? `${Math.min(24, Math.max(6, h * 24))}px` : '5px',
                          backgroundColor: personaInfo.color,
                        }}
                      />
                    ))}
                  </div>
                  <span className="voice-eq-state-text">
                    {isSpeaking
                      ? isPaused
                        ? 'Paused'
                        : `${personaInfo.name} is speaking...`
                      : 'Standing by for prompt'}
                  </span>
                </div>

                <div className="voice-controls-group">
                  {isSpeaking && (
                    <>
                      {isPaused ? (
                        <button
                          className="btn-voice-ctrl"
                          onClick={resumeSpeaking}
                          title="Resume"
                        >
                          <Play size={14} /> Resume
                        </button>
                      ) : (
                        <button
                          className="btn-voice-ctrl"
                          onClick={pauseSpeaking}
                          title="Pause"
                        >
                          <Pause size={14} /> Pause
                        </button>
                      )}
                      <button
                        className="btn-voice-ctrl stop"
                        onClick={stopSpeaking}
                        title="Stop"
                      >
                        <Square size={14} /> Stop
                      </button>
                    </>
                  )}

                  {!isSpeaking && (
                    <button
                      className="btn-voice-primary"
                      onClick={() => speakLiveBriefing(results, params)}
                      style={{
                        background: personaInfo.avatarGradient,
                      }}
                    >
                      <Volume2 size={15} />
                      <span>Speak Live Briefing</span>
                    </button>
                  )}
                </div>
              </div>

              {/* LIVE TRANSCRIPT / SUBTITLE DISPLAY */}
              <div className="voice-transcript-box">
                <div className="voice-transcript-label">
                  <Radio size={12} className={isSpeaking ? 'pulsing-text' : ''} />
                  <span>Live Captions ({personaInfo.name})</span>
                </div>
                <div className="voice-transcript-content">
                  {currentTranscript ? (
                    <p className="voice-transcript-text">"{currentTranscript}"</p>
                  ) : (
                    <p className="voice-transcript-placeholder">
                      Press "Speak Live Briefing" or select an asset below to hear real-time AI narration...
                    </p>
                  )}
                </div>
              </div>

              {/* QUICK TELEMETRY AUDIO CLIPS */}
              <div className="voice-telemetry-clips-section">
                <div className="voice-clips-title">Instant Asset Voice Insights:</div>
                <div className="voice-clips-grid">
                  <button
                    className="voice-clip-btn"
                    onClick={() => speakAssetReport('solar', results, params)}
                  >
                    <Sun size={14} color="#F59E0B" />
                    <span>Solar Field</span>
                  </button>
                  <button
                    className="voice-clip-btn"
                    onClick={() => speakAssetReport('wind', results, params)}
                  >
                    <Wind size={14} color="#3B82F6" />
                    <span>Wind Farm</span>
                  </button>
                  <button
                    className="voice-clip-btn"
                    onClick={() => speakAssetReport('battery', results, params)}
                  >
                    <Battery size={14} color="#8B5CF6" />
                    <span>BESS Battery</span>
                  </button>
                  <button
                    className="voice-clip-btn"
                    onClick={() => speakAssetReport('hydro', results, params)}
                  >
                    <Droplets size={14} color="#06B6D4" />
                    <span>Hydro &amp; Biomass</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

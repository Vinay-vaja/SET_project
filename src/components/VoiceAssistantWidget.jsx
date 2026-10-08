// VoiceAssistantWidget.jsx — Holographic AI Voice Command Center (Mitra & Miles)
// Inspired by sci-fi neural audio visualizer with flowing waveforms, circuit matrix, and scrollable studio
import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Volume2, Square, Play, Pause, X,
  Sparkles, Zap, Sun, Wind, Battery, Droplets,
  Radio, Key, Send, Check, Settings2, Sliders,
  RefreshCw, Bot, ShieldCheck, ChevronDown
} from 'lucide-react';
import { useVoice, PERSONAS } from '../context/VoiceContext.jsx';
import { useEnergy } from '../context/EnergyContext.jsx';

export default function VoiceAssistantWidget() {
  const location = useLocation();
  const {
    activePersona,
    setActivePersona,
    personaInfo,
    isSpeaking,
    isPaused,
    isThinking,
    audioLevel,
    currentTranscript,
    isWidgetOpen,
    setIsWidgetOpen,
    toggleWidget,
    speak,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    askCopilot,
    speakLiveBriefing,
    speakAssetReport,
    apiKey,
    setApiKey,
    availableVoices,
    selectedVoiceUri,
    setSelectedVoiceUri,
    speechRate,
    setSpeechRate,
  } = useVoice();

  const { liveResults, simResults, params } = useEnergy();
  const results = simResults || liveResults;

  const [customPrompt, setCustomPrompt] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey || '');
  const [keySavedToast, setKeySavedToast] = useState(false);

  // Canvas visualizer for flowing holographic ribbons & binary particle matrix
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!isWidgetOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth || 560);
    let height = (canvas.height = canvas.offsetHeight || 190);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth || 560;
      height = canvas.height = canvas.offsetHeight || 190;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes for digital circuit matrix
    const particles = Array.from({ length: 26 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 1,
      char: Math.random() > 0.5 ? '1' : '0',
      alpha: Math.random() * 0.6 + 0.2,
    }));

    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      phase += isSpeaking ? 0.05 : isThinking ? 0.08 : 0.02;
      const currentLevel = isSpeaking ? audioLevel : isThinking ? 0.6 : 0.18;

      // 1. Draw glowing circuit particles & binary characters
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = activePersona === 'mitra'
          ? `rgba(16, 185, 129, ${p.alpha * 0.5})`
          : `rgba(59, 130, 246, ${p.alpha * 0.5})`;
        ctx.font = '9px monospace';
        ctx.fillText(p.char, p.x, p.y);
      });

      // 2. Draw Holographic Waveform Ribbons (Cyan / Amber)
      const centerY = height * 0.58;
      const ribbons = [
        {
          color: activePersona === 'mitra' ? 'rgba(6, 182, 212, 0.7)' : 'rgba(59, 130, 246, 0.75)',
          freq: 0.018,
          amp: 16 + currentLevel * 30,
          speed: 1.0,
          lineWidth: 2.5,
        },
        {
          color: activePersona === 'mitra' ? 'rgba(16, 185, 129, 0.85)' : 'rgba(245, 158, 11, 0.85)',
          freq: 0.025,
          amp: 20 + currentLevel * 38,
          speed: -0.8,
          lineWidth: 3,
        },
        {
          color: 'rgba(255, 255, 255, 0.35)',
          freq: 0.035,
          amp: 10 + currentLevel * 18,
          speed: 1.4,
          lineWidth: 1.5,
        },
      ];

      ribbons.forEach((r) => {
        ctx.beginPath();
        ctx.strokeStyle = r.color;
        ctx.lineWidth = r.lineWidth;
        ctx.shadowColor = r.color;
        ctx.shadowBlur = isSpeaking ? 16 : 8;

        for (let x = 0; x <= width; x += 4) {
          const envelope = Math.sin((x / width) * Math.PI); // Pinched at borders
          const y =
            centerY +
            Math.sin(x * r.freq + phase * r.speed) *
              r.amp *
              envelope *
              (1 + Math.sin(x * 0.01 + phase) * 0.3);

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      // Reset shadow blur
      ctx.shadowBlur = 0;

      animRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isWidgetOpen, isSpeaking, isThinking, audioLevel, activePersona]);

  const handleSendPrompt = (e) => {
    e?.preventDefault();
    if (!customPrompt.trim()) return;
    askCopilot({
      prompt: customPrompt,
      results,
      params,
      activeRoute: location.pathname,
    });
    setCustomPrompt('');
  };

  const handleSaveKey = () => {
    setApiKey(tempKey.trim());
    setKeySavedToast(true);
    setTimeout(() => {
      setKeySavedToast(false);
      setShowSettings(false);
    }, 1200);
  };

  return (
    <>
      {/* FLOATING TRIGGER PILL */}
      <div className="voice-floating-trigger-container">
        {!isWidgetOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`voice-floating-pill ${isSpeaking ? 'speaking-active' : ''} ${isThinking ? 'thinking-active' : ''}`}
            onClick={toggleWidget}
          >
            <div
              className="voice-mini-avatar"
              style={{ background: personaInfo.avatarGradient }}
            >
              {isThinking ? (
                <Sparkles size={14} className="avatar-pulse-icon" />
              ) : isSpeaking ? (
                <Radio size={14} className="avatar-pulse-icon" />
              ) : (
                <Mic size={14} />
              )}
            </div>

            <div className="voice-mini-info">
              <div className="voice-mini-header-line">
                <span className="voice-mini-name">{personaInfo.name}</span>
                <span className="voice-ai-badge">AI Powered</span>
              </div>
              <span className="voice-mini-status">
                {isThinking
                  ? 'Analyzing grid...'
                  : isSpeaking
                  ? 'Speaking...'
                  : 'AI Voice Ready'}
              </span>
            </div>

            <button
              type="button"
              className="voice-mini-brief-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (isSpeaking) {
                  stopSpeaking();
                } else {
                  speakLiveBriefing(results, params, location.pathname);
                }
              }}
              title={isSpeaking ? 'Stop speaking' : `Listen to ${personaInfo.name}'s AI briefing`}
            >
              {isSpeaking ? <Square size={12} /> : <Zap size={12} />}
              <span>{isSpeaking ? 'Stop' : 'Brief Me'}</span>
            </button>
          </motion.div>
        )}
      </div>

      {/* FULL HOLOGRAPHIC VOICE AI COMMAND CENTER (PROPER SCROLLABLE STUDIO) */}
      <AnimatePresence>
        {isWidgetOpen && (
          <div className="voice-studio-modal-backdrop" onClick={() => setIsWidgetOpen(false)}>
            <motion.div
              className="voice-studio-modal-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {/* STUDIO HEADER */}
              <div className="voice-studio-header">
                <div className="voice-studio-header-left">
                  <div
                    className="voice-studio-icon-badge"
                    style={{ background: personaInfo.avatarGradient }}
                  >
                    <Bot size={22} color="#fff" />
                  </div>
                  <div>
                    <div className="voice-studio-title-row">
                      <span className="voice-studio-title">AI-Powered Voice Assistant</span>
                      <span
                        className="voice-studio-persona-pill"
                        style={{
                          backgroundColor: personaInfo.badgeColor,
                          color: personaInfo.color,
                          borderColor: `${personaInfo.color}50`,
                        }}
                      >
                        {personaInfo.name} • {personaInfo.title}
                      </span>
                    </div>
                    <div className="voice-studio-telemetry-meta">
                      Powered by <strong>AI Neural Engine</strong> (Free Browser Fallback) • Active Context: {location.pathname === '/' ? 'Dashboard' : location.pathname.replace('/', '')}
                    </div>
                  </div>
                </div>

                <div className="voice-studio-header-actions">
                  <button
                    type="button"
                    className={`voice-studio-btn-ghost ${apiKey ? 'active' : ''}`}
                    onClick={() => setShowSettings(!showSettings)}
                    title="Voice Engine & API Configuration"
                  >
                    <Settings2 size={16} />
                    <span>{showSettings ? 'Hide Settings' : 'Settings'}</span>
                  </button>
                  <button
                    type="button"
                    className="voice-studio-btn-close"
                    onClick={() => setIsWidgetOpen(false)}
                    title="Close Voice Studio (Esc)"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* HOLOGRAPHIC MICROPHONE VISUALIZER VIEWPORT (Inspired by Reference Image) */}
              <div className="voice-holo-viewport">
                <canvas ref={canvasRef} className="voice-holo-canvas" />

                {/* Central Futuristic Microphone Capsule */}
                <div className="voice-holo-mic-capsule-container">
                  <div
                    className={`voice-holo-mic-orb ${isSpeaking ? 'speaking' : ''} ${isThinking ? 'thinking' : ''}`}
                    style={{
                      borderColor: personaInfo.color,
                      boxShadow: `0 0 35px ${personaInfo.glowColor}, inset 0 0 25px ${personaInfo.glowColor}`,
                    }}
                  >
                    {/* Glowing Mic Core Icon */}
                    <div className="voice-holo-mic-core">
                      <Mic size={34} color="#fff" className="mic-core-svg" />
                    </div>

                    {/* Circuit Aura Rings */}
                    <div
                      className="voice-aura-ring ring-1"
                      style={{ borderColor: personaInfo.color }}
                    />
                    <div
                      className="voice-aura-ring ring-2"
                      style={{ borderColor: personaInfo.secondaryColor }}
                    />
                  </div>

                  {/* Real-time Status Badge */}
                  <div className="voice-holo-status-badge">
                    {isThinking ? (
                      <span className="holo-status-text thinking">
                        <Sparkles size={13} className="spin-slow" /> AI Neural Engine Reasoning...
                      </span>
                    ) : isSpeaking ? (
                      <span className="holo-status-text speaking" style={{ color: personaInfo.color }}>
                        <Radio size={13} className="pulse-fast" /> {personaInfo.name} Broadcasting
                      </span>
                    ) : (
                      <span className="holo-status-text idle">
                        🎙️ AI Voice Engine Ready
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* PROPER SCROLLABLE STUDIO CONTENT BODY */}
              <div className="voice-studio-scrollable-body">
                {/* SETTINGS DRAWER (When toggled) */}
                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      className="voice-settings-drawer"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="voice-settings-inner">
                        <div className="voice-settings-grid">
                          {/* Speech Voice Dropdown */}
                          <div className="voice-setting-field">
                            <label className="voice-setting-label">
                              Speech Synthesis Voice (Natural Engine):
                            </label>
                            <select
                              className="voice-setting-select"
                              value={selectedVoiceUri}
                              onChange={(e) => setSelectedVoiceUri(e.target.value)}
                            >
                              <option value="">Auto-Detect Optimal Natural Voice</option>
                              {availableVoices.map((v) => (
                                <option key={v.voiceURI} value={v.voiceURI}>
                                  {v.name} ({v.lang})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Speech Speed */}
                          <div className="voice-setting-field">
                            <label className="voice-setting-label">Speech Cadence Speed:</label>
                            <div className="voice-speed-buttons">
                              {[
                                { val: 0.92, label: '0.9x (Calm)' },
                                { val: 1.0, label: '1.0x (Normal)' },
                                { val: 1.1, label: '1.1x (Brisk)' },
                              ].map(({ val, label }) => (
                                <button
                                  key={val}
                                  type="button"
                                  className={`voice-speed-btn ${speechRate === val ? 'active' : ''}`}
                                  onClick={() => setSpeechRate(val)}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* AI Cloud Key Config */}
                        <div className="voice-setting-field" style={{ marginTop: '0.75rem' }}>
                          <div className="voice-key-label-row">
                            <label className="voice-setting-label">AI Cloud API Key (Optional):</label>
                            <span className="voice-key-active-badge">
                              {apiKey ? '✓ AI Cloud Engine Active' : '✓ Browser Native Engine (Free Fallback)'}
                            </span>
                          </div>
                          <div className="voice-key-input-row">
                            <input
                              type="password"
                              value={tempKey}
                              onChange={(e) => setTempKey(e.target.value)}
                              placeholder="AI Key (Reads automatically from .env)"
                              className="voice-key-input"
                            />
                            <button
                              type="button"
                              onClick={handleSaveKey}
                              className="voice-key-save-btn"
                            >
                              {keySavedToast ? <Check size={14} /> : 'Save Key'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* PERSONA SWITCHER CARDS */}
                <div className="voice-persona-cards-row">
                  {/* MITRA */}
                  <div
                    className={`voice-persona-tile ${activePersona === 'mitra' ? 'active-mitra' : ''}`}
                    onClick={() => {
                      setActivePersona('mitra');
                      if (!isSpeaking && !isThinking) {
                        speak('Mitra active. Evaluating environmental sustainability.', 'mitra');
                      }
                    }}
                  >
                    <div className="persona-tile-top">
                      <div className="persona-tile-avatar mitra-bg">🌱 M</div>
                      <div>
                        <div className="persona-tile-name">Mitra</div>
                        <div className="persona-tile-role">AI Sustainability Advisor</div>
                      </div>
                    </div>
                    <p className="persona-tile-desc">
                      Warm &amp; articulate. Highlights clean renewable ratio, CO₂ avoided, and SDG 7 alignment.
                    </p>
                  </div>

                  {/* MILES */}
                  <div
                    className={`voice-persona-tile ${activePersona === 'miles' ? 'active-miles' : ''}`}
                    onClick={() => {
                      setActivePersona('miles');
                      if (!isSpeaking && !isThinking) {
                        speak('Dispatcher Miles online. Monitoring real-time grid telemetry.', 'miles');
                      }
                    }}
                  >
                    <div className="persona-tile-top">
                      <div className="persona-tile-avatar miles-bg">⚡ M</div>
                      <div>
                        <div className="persona-tile-name">Miles</div>
                        <div className="persona-tile-role">Grid Operations Dispatcher</div>
                      </div>
                    </div>
                    <p className="persona-tile-desc">
                      Crisp &amp; commanding. Reports active megawatts, battery SoC buffer reserves, and dispatch loads.
                    </p>
                  </div>
                </div>

                {/* PLAYBACK & CONTROL BAR */}
                <div className="voice-studio-control-bar">
                  <div className="voice-studio-status-summary">
                    <span className="live-pulsing-dot" />
                    <span>
                      {isThinking
                        ? 'AI Neural Engine synthesizing situational telemetry...'
                        : isSpeaking
                        ? `${personaInfo.name} is speaking...`
                        : 'Ready for live query or telemetry briefing'}
                    </span>
                  </div>

                  <div className="voice-studio-buttons-group">
                    {isSpeaking && (
                      <>
                        {isPaused ? (
                          <button
                            type="button"
                            className="btn-voice-ctrl"
                            onClick={resumeSpeaking}
                          >
                            <Play size={14} /> Resume
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-voice-ctrl"
                            onClick={pauseSpeaking}
                          >
                            <Pause size={14} /> Pause
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-voice-ctrl stop"
                          onClick={stopSpeaking}
                        >
                          <Square size={14} /> Stop
                        </button>
                      </>
                    )}

                    {!isSpeaking && !isThinking && (
                      <button
                        type="button"
                        className="btn-voice-brief-primary"
                        onClick={() => speakLiveBriefing(results, params, location.pathname)}
                        style={{ background: personaInfo.avatarGradient }}
                      >
                        <Sparkles size={15} />
                        <span>Speak Live Grid Briefing</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* LIVE SPOKEN TELEMETRY CAPTIONS */}
                <div className="voice-studio-transcript-container">
                  <div className="voice-transcript-header-bar">
                    <div className="transcript-title-wrap">
                      <Radio size={14} className={isSpeaking ? 'pulse-fast text-emerald-400' : ''} />
                      <span>Live Spoken Telemetry ({personaInfo.name})</span>
                    </div>
                    {currentTranscript && (
                      <button
                        type="button"
                        className="transcript-replay-btn"
                        onClick={() => speak(currentTranscript)}
                        title="Replay speech"
                      >
                        <RefreshCw size={12} /> Replay
                      </button>
                    )}
                  </div>

                  <div className="voice-transcript-display">
                    {isThinking ? (
                      <div className="voice-thinking-shimmer-box">
                        <div className="shimmer-bar bar-1" />
                        <div className="shimmer-bar bar-2" />
                      </div>
                    ) : currentTranscript ? (
                      <p className="voice-transcript-text">"{currentTranscript}"</p>
                    ) : (
                      <p className="voice-transcript-idle">
                        Ask a question below or click "Speak Live Grid Briefing" to hear context-aware intelligence narrated in real time...
                      </p>
                    )}
                  </div>
                </div>

                {/* INTERACTIVE QUESTION INPUT BAR */}
                <form onSubmit={handleSendPrompt} className="voice-studio-prompt-form">
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder={`Ask ${personaInfo.name} anything (e.g. "How can we reach 100% clean power?")...`}
                    className="voice-studio-prompt-input"
                    disabled={isThinking}
                  />
                  <button
                    type="submit"
                    disabled={!customPrompt.trim() || isThinking}
                    className="voice-studio-prompt-submit"
                    style={{ backgroundColor: personaInfo.color }}
                  >
                    <Send size={15} color="#0f172a" />
                  </button>
                </form>

                {/* QUICK PROMPT PILLS */}
                <div className="voice-studio-pills-row">
                  {[
                    { label: '⚡ Eliminate Grid Dependency', q: 'How can we eliminate our fossil grid dependency and reach 100% clean energy?' },
                    { label: '🔋 Battery Storage Dispatch', q: 'Analyze our BESS Megapack battery reserve and optimize our dispatch schedule.' },
                    { label: '🌱 SDG 7 Compliance Audit', q: 'What is our current SDG 7 compliance score and carbon abatement status?' },
                    { label: '💨 Wind & Solar Synergy', q: 'How are the solar panels and wind turbines complementing each other right now?' },
                  ].map(({ label, q }) => (
                    <button
                      key={label}
                      type="button"
                      className="voice-studio-pill-btn"
                      onClick={() =>
                        askCopilot({
                          prompt: q,
                          results,
                          params,
                          activeRoute: location.pathname,
                        })
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* QUICK ASSET CLIPS */}
                <div className="voice-studio-assets-section">
                  <div className="voice-assets-title">Inspect 3D Digital Twin Assets:</div>
                  <div className="voice-assets-grid">
                    <button
                      type="button"
                      className="voice-asset-card"
                      onClick={() => speakAssetReport('solar', results, params, location.pathname)}
                    >
                      <Sun size={16} color="#f59e0b" />
                      <div className="asset-card-text">
                        <span className="asset-name">Solar PV Field</span>
                        <span className="asset-metric">{(results?.solarEnergy || 0).toFixed(1)} kWh</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="voice-asset-card"
                      onClick={() => speakAssetReport('wind', results, params, location.pathname)}
                    >
                      <Wind size={16} color="#3b82f6" />
                      <div className="asset-card-text">
                        <span className="asset-name">Wind Array</span>
                        <span className="asset-metric">{(results?.windEnergy || 0).toFixed(1)} kWh</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="voice-asset-card"
                      onClick={() => speakAssetReport('battery', results, params, location.pathname)}
                    >
                      <Battery size={16} color="#8b5cf6" />
                      <div className="asset-card-text">
                        <span className="asset-name">Megapack BESS</span>
                        <span className="asset-metric">{Math.round(results?.batterySoC || 60)}% SoC</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="voice-asset-card"
                      onClick={() => speakAssetReport('hydro', results, params, location.pathname)}
                    >
                      <Droplets size={16} color="#06b6d4" />
                      <div className="asset-card-text">
                        <span className="asset-name">Hydro &amp; Biomass</span>
                        <span className="asset-metric">{(results?.hydroEnergy || 0).toFixed(1)} kWh</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// VoiceAssistantWidget.jsx — Realistic Conversational Voice AI (Mitra & Miles)
import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Volume2, Square, Play, Pause, X,
  Sparkles, Zap, Sun, Wind, Battery, Droplets,
  Radio, Key, Send, Check, Settings2, Sliders,
  RefreshCw, Bot, ShieldCheck, ChevronDown, Leaf, Activity,
  Keyboard, MessageSquare, VolumeX, User
} from 'lucide-react';
import { useVoice, PERSONAS } from '../context/VoiceContext.jsx';
import { useEnergy } from '../context/EnergyContext.jsx';
import { useRealConditions } from '../hooks/useRealConditions.js';

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
  const realData = useRealConditions();
  const results = simResults || liveResults;

  const [isListening, setIsListening] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey || '');
  const [keySavedToast, setKeySavedToast] = useState(false);

  // Chat conversation history for realistic conversational UI
  const [conversation, setConversation] = useState([
    {
      id: 'init-1',
      sender: 'mitra',
      time: 'Live',
      text: `Hello! I'm Mitra, your AI Sustainability Advisor. I'm monitoring real-time conditions in ${realData.location || 'your area'} (${realData.temperature || 31.4}°C, ${realData.solarIrradiance || 742} W/m²). How can I assist your clean energy goals today?`,
    },
  ]);

  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const recognitionRef = useRef(null);

  // Speech Recognition (Browser Web Speech API)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const speechToText = event.results[0][0].transcript;
        setIsListening(false);
        if (speechToText) {
          handleUserQuery(speechToText);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition notice:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [results, params, realData]);

  const toggleListening = () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn('Recognition start issue:', e);
          setIsListening(true);
        }
      } else {
        // Fallback demo question if microphone API is blocked in browser
        handleUserQuery(`What is the current solar condition in ${realData.location || 'my location'}?`);
      }
    }
  };

  const handleUserQuery = async (queryText) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      time: now,
      text: queryText,
    };

    setConversation((prev) => [...prev, userMsg]);

    // Query AI Copilot
    await askCopilot({
      prompt: queryText,
      results,
      params,
      activeRoute: location.pathname,
      realConditions: realData,
    });
  };

  // Append new AI spoken responses to conversation thread
  useEffect(() => {
    if (currentTranscript && !isThinking) {
      setConversation((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.sender === activePersona && last.text === currentTranscript) {
          return prev;
        }
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: activePersona,
            time: now,
            text: currentTranscript,
          },
        ];
      });
    }
  }, [currentTranscript, isThinking, activePersona]);

  // Flowing audio wave visualization
  useEffect(() => {
    if (!isWidgetOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth || 480);
    let height = (canvas.height = canvas.offsetHeight || 160);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth || 480;
      height = canvas.height = canvas.offsetHeight || 160;
    };
    window.addEventListener('resize', handleResize);

    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      phase += isSpeaking ? 0.06 : isListening ? 0.08 : isThinking ? 0.1 : 0.02;
      const currentLevel = isSpeaking ? audioLevel : isListening ? 0.75 : isThinking ? 0.5 : 0.15;

      const centerY = height * 0.5;
      const ribbons = [
        {
          color: 'rgba(52, 211, 153, 0.85)',
          freq: 0.022,
          amp: 12 + currentLevel * 32,
          speed: 1.0,
          lineWidth: 2.2,
        },
        {
          color: 'rgba(6, 182, 212, 0.75)',
          freq: 0.03,
          amp: 16 + currentLevel * 36,
          speed: -0.8,
          lineWidth: 2.0,
        },
        {
          color: 'rgba(255, 255, 255, 0.3)',
          freq: 0.04,
          amp: 8 + currentLevel * 18,
          speed: 1.4,
          lineWidth: 1.2,
        },
      ];

      ribbons.forEach((r) => {
        ctx.beginPath();
        ctx.strokeStyle = r.color;
        ctx.lineWidth = r.lineWidth;
        ctx.shadowColor = r.color;
        ctx.shadowBlur = isSpeaking || isListening ? 14 : 4;

        for (let x = 0; x <= width; x += 4) {
          const envelope = Math.sin((x / width) * Math.PI);
          const y =
            centerY +
            Math.sin(x * r.freq + phase * r.speed) *
              r.amp *
              envelope *
              (1 + Math.sin(x * 0.012 + phase) * 0.35);

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      ctx.shadowBlur = 0;
      animRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isWidgetOpen, isSpeaking, isListening, isThinking, audioLevel]);

  const handleSaveKey = () => {
    setApiKey(tempKey.trim());
    setKeySavedToast(true);
    setTimeout(() => {
      setKeySavedToast(false);
      setShowSettings(false);
    }, 1200);
  };

  // Determine current active state
  const currentState = isListening
    ? 'listening'
    : isThinking
    ? 'thinking'
    : isSpeaking
    ? 'speaking'
    : 'ready';

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
              className={`voice-mini-brief-btn ${isSpeaking ? 'active-speaking' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                if (isSpeaking) {
                  stopSpeaking();
                } else {
                  speakLiveBriefing(results, params, location.pathname, realData);
                }
              }}
              title={isSpeaking ? 'Stop speaking' : `Listen to ${personaInfo.name}'s AI briefing`}
            >
              {isSpeaking ? (
                <>
                  <Square size={10} style={{ fill: 'currentColor' }} />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Sparkles size={11} className="mini-brief-icon" />
                  <span>Brief Me</span>
                </>
              )}
            </button>
          </motion.div>
        )}
      </div>

      {/* REALISTIC CONVERSATIONAL VOICE AI MODAL */}
      <AnimatePresence>
        {isWidgetOpen && (
          <div className="voice-studio-modal-backdrop" onClick={() => setIsWidgetOpen(false)}>
            <motion.div
              className="voice-realistic-modal-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {/* TOP HEADER */}
              <div className="voice-realistic-header">
                <div className="voice-header-brand">
                  <div className="voice-brand-badge-icon">
                    <Leaf size={20} color="#34d399" />
                  </div>
                  <div>
                    <div className="voice-brand-title-row">
                      <span className="voice-brand-name">Mitra</span>
                      <span className="badge-sustainability-advisor">
                        AI Sustainability Advisor
                      </span>
                    </div>
                    <p className="voice-brand-tagline">
                      Your voice companion for a cleaner, greener tomorrow.
                    </p>
                  </div>
                </div>

                <div className="voice-header-actions">
                  <button
                    type="button"
                    className="voice-icon-tool-btn"
                    onClick={() => setShowSettings(!showSettings)}
                    title="Voice Engine Settings"
                  >
                    <Settings2 size={16} />
                  </button>
                  <button
                    type="button"
                    className="voice-icon-close-btn"
                    onClick={() => setIsWidgetOpen(false)}
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* SETTINGS DRAWER (If Open) */}
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
                        <div className="voice-setting-field">
                          <label className="voice-setting-label">Speech Synthesis Voice:</label>
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

                        <div className="voice-setting-field">
                          <label className="voice-setting-label">Voice Cadence Speed:</label>
                          <div className="voice-speed-buttons">
                            {[
                              { val: 0.92, label: '0.9x' },
                              { val: 1.0, label: '1.0x' },
                              { val: 1.1, label: '1.1x' },
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
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* HERO LIVING VOICE ORB & SINE WAVE CANVAS */}
              <div className="voice-hero-orb-arena">
                <canvas ref={canvasRef} className="voice-hero-wave-canvas" />

                <div className="voice-orb-central-anchor">
                  <div
                    className={`voice-living-orb ${currentState}`}
                    onClick={toggleListening}
                    style={{ cursor: 'pointer' }}
                    title="Tap to speak or stop"
                  >
                    {/* Concentric Aura Wave Rings */}
                    <div className="voice-orb-glow-ring ring-outer" />
                    <div className="voice-orb-glow-ring ring-middle" />

                    {/* Central Icon */}
                    <div className="voice-orb-core">
                      {isThinking ? (
                        <Sparkles size={32} color="#fff" className="spin-slow" />
                      ) : isSpeaking ? (
                        <Radio size={32} color="#fff" className="pulse-fast" />
                      ) : isListening ? (
                        <Mic size={32} color="#fff" className="pulse-fast" />
                      ) : (
                        <Mic size={32} color="#fff" />
                      )}
                    </div>
                  </div>

                  {/* Status Heading & Subtitle */}
                  <div className="voice-hero-status-box">
                    <h4 className="voice-hero-status-heading">
                      {isListening
                        ? 'Listening...'
                        : isThinking
                        ? 'Thinking & Reasoning...'
                        : isSpeaking
                        ? 'Speaking Response...'
                        : 'Ready to Listen'}
                    </h4>
                    <p className="voice-hero-status-sub">
                      Speak your question about energy, environment or SDG 7
                    </p>
                  </div>

                  {/* State Indicator Pills Row */}
                  <div className="voice-state-pills-row">
                    <span className={`state-pill ${currentState === 'listening' ? 'active-listening' : ''}`}>
                      <span className="dot" /> Listening
                    </span>
                    <span className={`state-pill ${currentState === 'thinking' ? 'active-thinking' : ''}`}>
                      <span className="dot" /> Thinking
                    </span>
                    <span className={`state-pill ${currentState === 'speaking' ? 'active-speaking' : ''}`}>
                      <span className="dot" /> Speaking
                    </span>
                    <span className={`state-pill ${currentState === 'ready' ? 'active-ready' : ''}`}>
                      <span className="dot" /> Ready
                    </span>
                  </div>
                </div>
              </div>

              {/* CONVERSATION THREAD MESSAGES */}
              <div className="voice-conversation-stream">
                {conversation.map((msg) => (
                  <div
                    key={msg.id}
                    className={`voice-chat-bubble-row ${msg.sender === 'user' ? 'user-row' : 'ai-row'}`}
                  >
                    {msg.sender === 'user' ? (
                      <div className="voice-user-message-card">
                        <div className="bubble-author-meta">
                          <div className="bubble-avatar user-av">
                            <User size={13} color="#fff" />
                          </div>
                          <span className="bubble-author-name">You</span>
                          <span className="bubble-time">{msg.time}</span>
                        </div>
                        <div className="bubble-content-text">{msg.text}</div>
                      </div>
                    ) : (
                      <div className="voice-ai-message-card">
                        <div className="bubble-author-meta">
                          <div className="bubble-avatar ai-av">
                            <Leaf size={13} color="#34d399" />
                          </div>
                          <span className="bubble-author-name">Mitra</span>
                          <span className="bubble-time">{msg.time}</span>
                        </div>
                        <div className="bubble-content-text">{msg.text}</div>

                        {/* Integrated Live Audio Playback Bar */}
                        {isSpeaking && currentTranscript === msg.text && (
                          <div className="bubble-audio-playback-bar">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Volume2 size={15} color="#34d399" className="pulse-fast" />
                              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Playing response...</span>
                            </div>
                            <div className="bubble-live-frequency-bars">
                              {[12, 22, 16, 28, 14, 24, 18, 10, 20, 15, 26, 12].map((h, i) => (
                                <div
                                  key={i}
                                  className="freq-bar"
                                  style={{
                                    height: `${Math.max(4, h * (0.4 + audioLevel * 0.8))}px`,
                                    background: '#34d399',
                                  }}
                                />
                              ))}
                            </div>
                            <span className="bubble-audio-time">Live Voice</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* TEXT INPUT TOGGLE (If clicked "Type instead") */}
              <AnimatePresence>
                {showTextInput && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!customPrompt.trim()) return;
                      handleUserQuery(customPrompt);
                      setCustomPrompt('');
                      setShowTextInput(false);
                    }}
                    className="voice-type-instead-form"
                  >
                    <input
                      type="text"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Type your question about clean energy, solar, wind, or SDG 7..."
                      className="voice-type-instead-input"
                      autoFocus
                    />
                    <button type="submit" className="voice-type-submit-btn">
                      <Send size={14} color="#0f172a" />
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* BOTTOM CONTROL & ACTION BAR */}
              <div className="voice-realistic-bottom-bar">
                {/* Left: Type instead button */}
                <button
                  type="button"
                  className="voice-type-toggle-btn"
                  onClick={() => setShowTextInput(!showTextInput)}
                >
                  <Keyboard size={15} />
                  <span>{showTextInput ? 'Hide Keyboard' : 'Type instead'}</span>
                </button>

                {/* Center: Live Pulsing Action Button */}
                <div className="voice-center-action-cluster">
                  {/* Left audio bars */}
                  <div className="action-side-frequency-bars">
                    {[10, 18, 14, 22, 8].map((h, i) => (
                      <div
                        key={i}
                        className="freq-bar"
                        style={{
                          height: `${Math.max(3, h * (isSpeaking || isListening ? 1.2 : 0.3))}px`,
                          background: isListening ? '#38bdf8' : '#22c55e',
                        }}
                      />
                    ))}
                  </div>

                  <div className="voice-action-btn-anchor">
                    <button
                      type="button"
                      className={`voice-main-action-orb-btn ${isSpeaking || isListening ? 'btn-stop-state' : 'btn-speak-state'}`}
                      onClick={toggleListening}
                      title={isSpeaking || isListening ? 'Tap to Stop' : 'Tap to Speak'}
                    >
                      {isSpeaking || isListening ? (
                        <Square size={18} style={{ fill: '#fff' }} />
                      ) : (
                        <Mic size={20} color="#fff" />
                      )}
                    </button>
                    <span className="voice-action-sublabel">
                      {isSpeaking || isListening ? 'Tap to stop' : 'Tap to speak'}
                    </span>
                  </div>

                  {/* Right audio bars */}
                  <div className="action-side-frequency-bars">
                    {[8, 22, 14, 18, 10].map((h, i) => (
                      <div
                        key={i}
                        className="freq-bar"
                        style={{
                          height: `${Math.max(3, h * (isSpeaking || isListening ? 1.2 : 0.3))}px`,
                          background: isListening ? '#38bdf8' : '#22c55e',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Right: Quick Brief Button */}
                <button
                  type="button"
                  className="voice-quick-brief-btn"
                  onClick={() => speakLiveBriefing(results, params, location.pathname, realData)}
                  title="Narrate live situational briefing"
                >
                  <Sparkles size={14} color="#fbbf24" />
                  <span>Brief Me</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

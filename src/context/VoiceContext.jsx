// VoiceContext.jsx — Dual AI Voice Synthesis Engine (Mitra & Miles)
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const VoiceContext = createContext(null);

export const PERSONAS = {
  mitra: {
    id: 'mitra',
    name: 'Mitra',
    title: 'AI Sustainability Advisor',
    role: 'Clean Energy & SDG Specialist',
    gender: 'female',
    accent: 'Warm & Articulate',
    color: '#22c55e',
    badgeColor: 'rgba(34, 197, 94, 0.15)',
    avatarGradient: 'linear-gradient(135deg, #22c55e, #10b981, #06b6d4)',
    pitch: 1.08,
    rate: 0.98,
    description: 'Focuses on environmental health, SDG 7 alignment, carbon offset, and clean renewable transition.',
  },
  miles: {
    id: 'miles',
    name: 'Miles',
    title: 'Grid Operations Dispatcher',
    role: 'Electrical & Telemetry Controller',
    gender: 'male',
    accent: 'Authoritative & Technical',
    color: '#3b82f6',
    badgeColor: 'rgba(59, 130, 246, 0.15)',
    avatarGradient: 'linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6)',
    pitch: 0.90,
    rate: 1.04,
    description: 'Focuses on real-time megawatts, battery SoC, grid stability, frequency regulation, and turbine RPM.',
  },
};

export function VoiceProvider({ children }) {
  const [activePersona, setActivePersona] = useState('mitra');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [audioLevel, setAudioLevel] = useState(0); // For dynamic visualizer
  const synthRef = useRef(null);
  const animFrameRef = useRef(null);

  // Initialize SpeechSynthesis and fetch voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;

      const updateVoices = () => {
        const voices = synthRef.current.getVoices();
        setAvailableVoices(voices);
      };

      updateVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = updateVoices;
      }
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Visualizer animation ticker when speaking
  useEffect(() => {
    if (isSpeaking && !isPaused) {
      const animateWave = () => {
        // Simulated sound levels for voice equalizer
        setAudioLevel(0.3 + Math.random() * 0.7);
        animFrameRef.current = requestAnimationFrame(animateWave);
      };
      animFrameRef.current = requestAnimationFrame(animateWave);
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setAudioLevel(0);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isSpeaking, isPaused]);

  // Pick best voice for persona
  const getBestVoiceForPersona = useCallback((personaKey) => {
    if (!availableVoices.length) return null;
    const persona = PERSONAS[personaKey] || PERSONAS.mitra;

    if (persona.gender === 'female') {
      // Find female or natural voice
      const preferred = availableVoices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('zira') ||
            v.name.toLowerCase().includes('samantha') ||
            v.name.toLowerCase().includes('karen') ||
            v.name.toLowerCase().includes('natural') ||
            v.name.toLowerCase().includes('india') ||
            v.name.toLowerCase().includes('heera'))
      );
      if (preferred) return preferred;
    } else {
      // Find male voice
      const preferred = availableVoices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.toLowerCase().includes('david') ||
            v.name.toLowerCase().includes('george') ||
            v.name.toLowerCase().includes('male') ||
            v.name.toLowerCase().includes('alex') ||
            v.name.toLowerCase().includes('daniel') ||
            v.name.toLowerCase().includes('guy') ||
            v.name.toLowerCase().includes('ravi'))
      );
      if (preferred) return preferred;
    }

    // Fallback to any English voice or first voice
    const englishVoice = availableVoices.find((v) => v.lang.startsWith('en'));
    return englishVoice || availableVoices[0] || null;
  }, [availableVoices]);

  // Main Speak function
  const speak = useCallback((text, personaOverride = null) => {
    if (!synthRef.current || !text) return;

    synthRef.current.cancel(); // Stop any ongoing speech

    const personaKey = personaOverride || activePersona;
    const persona = PERSONAS[personaKey];
    const utterance = new SpeechSynthesisUtterance(text);

    const voice = getBestVoiceForPersona(personaKey);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.pitch = persona.pitch;
    utterance.rate = persona.rate;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setCurrentTranscript(text);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis notice:', e);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    synthRef.current.speak(utterance);
  }, [activePersona, getBestVoiceForPersona]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, []);

  // Pause / Resume
  const pauseSpeaking = useCallback(() => {
    if (synthRef.current && isSpeaking) {
      synthRef.current.pause();
      setIsPaused(true);
    }
  }, [isSpeaking]);

  const resumeSpeaking = useCallback(() => {
    if (synthRef.current && isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
    }
  }, [isPaused]);

  // High-Level Speech Presets
  const speakLiveBriefing = useCallback((results, params) => {
    if (!results) return;

    if (activePersona === 'mitra') {
      const script = `Hello operator, I am Mitra, your AI Sustainability Advisor. Here is your live environmental report. Clean renewable energy is providing ${results.renewableSharePct} percent of your system power. Your facility has avoided ${Math.round(results.co2AvoidedKg)} kilograms of carbon dioxide emissions today, saving an estimated ₹${Math.round(results.dailyCostSaving)} rupees in power costs. Your SDG 7 clean energy compliance score is rated at ${Math.round(results.sdgScores?.sdg7?.total || 75)} out of 100. Environmental metrics are performing cleanly.`;
      speak(script);
    } else {
      const script = `Dispatcher Miles online. Grid telemetry verified. Total active power generation is holding at ${results.totalGeneration} kilowatt-hours against a consumer load demand of ${results.totalDemandKWh} kilowatt-hours. Grid dependency index is ${results.gridDependencyPct} percent, with battery storage reserves at ${Math.round(results.batterySoC)} percent State of Charge. Substation bus voltages and renewable dispatch are synchronized.`;
      speak(script);
    }
  }, [activePersona, speak]);

  const speakAssetReport = useCallback((assetKey, results, params) => {
    if (activePersona === 'mitra') {
      switch (assetKey) {
        case 'solar':
          speak(`Solar Photovoltaic array active. The monocrystalline silicon modules are converting sunlight into ${results?.solarEnergy || 0} kilowatt-hours of clean solar power, eliminating peak fossil fuel demand.`);
          break;
        case 'wind':
          speak(`Wind Farm inspected. Aerodynamic rotor blades are harnessing atmospheric kinetic currents, yielding ${results?.windEnergy || 0} kilowatt-hours of zero-carbon electricity.`);
          break;
        case 'battery':
          speak(`Megapack Battery Energy Storage online. Battery reserves are currently at ${Math.round(results?.batterySoC || 60)} percent State of Charge, buffering renewable intermittency for continuous 24/7 clean supply.`);
          break;
        case 'hydro':
          speak(`Hydropower and Biomass units reporting. Providing reliable baseline green energy and circular organic waste valorization for balanced ecosystem health.`);
          break;
        default:
          speak(`Sustainable Energy Transition facility operating in balanced hybrid mode with ${results?.renewableSharePct || 0} percent renewable penetration.`);
      }
    } else {
      switch (assetKey) {
        case 'solar':
          speak(`Solar Array telemetry: ${params?.solar?.capacity || 25} kilowatt peak capacity connected via central three-phase inverter station. Real-time generation stands at ${results?.solarEnergy || 0} kilowatt-hours.`);
          break;
        case 'wind':
          speak(`Wind Sector report: ${params?.wind?.numTurbines || 3} utility-scale wind turbines operational. Local wind velocity measured at ${params?.wind?.windSpeed || 8} meters per second. Rotor rotation synchronized to grid bus.`);
          break;
        case 'battery':
          speak(`BESS Megapack Hub: Containerized lithium storage standing by at ${Math.round(results?.batterySoC || 60)} percent State of Charge. Bi-directional inverter is active for peak shaving and grid frequency regulation.`);
          break;
        case 'hydro':
          speak(`Hydro and Biomass auxiliary baseline units: Delivering continuous baseline generation with ${results?.hydroEnergy || 0} kilowatt-hours hydroelectric yield.`);
          break;
        default:
          speak(`System overview: Hybrid renewable microgrid generation totaling ${results?.totalGeneration || 0} kilowatt-hours against ${results?.totalDemandKWh || 0} kilowatt-hours demand.`);
      }
    }
  }, [activePersona, speak]);

  const value = {
    activePersona,
    setActivePersona,
    personaInfo: PERSONAS[activePersona],
    isSpeaking,
    isPaused,
    audioLevel,
    currentTranscript,
    isWidgetOpen,
    setIsWidgetOpen,
    toggleWidget: () => setIsWidgetOpen((prev) => !prev),
    speak,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    speakLiveBriefing,
    speakAssetReport,
    isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
  };

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

export function useVoice() {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error('useVoice must be used within VoiceProvider');
  return ctx;
}

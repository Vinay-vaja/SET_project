// VoiceContext.jsx — Dual AI Voice Synthesis Engine with Gemini 3.8 Flash & Neural Voice Selection
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { generateGeminiSpeech, sanitizeForSpeech } from '../utils/geminiVoiceService.js';

const VoiceContext = createContext(null);

export const PERSONAS = {
  mitra: {
    id: 'mitra',
    name: 'Mitra',
    title: 'AI Sustainability Advisor',
    role: 'Clean Energy & SDG 7 Strategist',
    gender: 'female',
    accent: 'Warm, Articulate & Natural',
    color: '#10b981', // Bio-Emerald
    secondaryColor: '#06b6d4', // Cyan
    badgeColor: 'rgba(16, 185, 129, 0.16)',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    avatarGradient: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #06b6d4 100%)',
    pitch: 1.02,
    defaultRate: 1.0,
    description: 'Empathetic eco-intelligence. Focuses on renewable energy ratio, carbon offset, and sustainable transition.',
  },
  miles: {
    id: 'miles',
    name: 'Miles',
    title: 'Grid Operations Dispatcher',
    role: 'Telemetry & Electrical Dispatcher',
    gender: 'male',
    accent: 'Crisp, Technical & Authoritative',
    color: '#3b82f6', // Electric Cobalt
    secondaryColor: '#f59e0b', // Solar Amber
    badgeColor: 'rgba(59, 130, 246, 0.16)',
    glowColor: 'rgba(59, 130, 246, 0.45)',
    avatarGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #f59e0b 100%)',
    pitch: 0.95,
    defaultRate: 1.02,
    description: 'Technical dispatch commander. Focuses on generation megawatts, battery SoC buffer, and grid stability.',
  },
};

export function VoiceProvider({ children }) {
  const [activePersona, setActivePersona] = useState('mitra');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState('');
  const [speechRate, setSpeechRate] = useState(1.0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [apiKey, setApiKeyState] = useState(() => {
    return (
      (typeof window !== 'undefined' ? localStorage.getItem('gp_gemini_api_key') : '') ||
      import.meta.env.VITE_GEMINI_API_KEY ||
      import.meta.env.GEMIN_API_KEY ||
      import.meta.env.GEMINI_API_KEY ||
      ''
    );
  });

  const synthRef = useRef(null);
  const animFrameRef = useRef(null);
  const sentenceQueueRef = useRef([]);
  const activeUtteranceRef = useRef(null);

  const setApiKey = useCallback((key) => {
    setApiKeyState(key);
    if (typeof window !== 'undefined') {
      if (key) {
        localStorage.setItem('gp_gemini_api_key', key);
      } else {
        localStorage.removeItem('gp_gemini_api_key');
      }
    }
  }, []);

  // Fetch installed voices
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

  // Visualizer level oscillator
  useEffect(() => {
    if (isSpeaking && !isPaused) {
      const animateWave = () => {
        setAudioLevel(0.4 + Math.random() * 0.6);
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

  // High-clarity natural voice picker
  const getBestVoiceForPersona = useCallback(
    (personaKey) => {
      if (!availableVoices.length) return null;

      // If user manually chose a voice, respect it
      if (selectedVoiceUri) {
        const matched = availableVoices.find((v) => v.voiceURI === selectedVoiceUri);
        if (matched) return matched;
      }

      const persona = PERSONAS[personaKey] || PERSONAS.mitra;

      if (persona.gender === 'female') {
        // Priority 1: Natural / Online high clarity female voices (e.g. Edge Natural / Neural)
        const naturalFemale = availableVoices.find(
          (v) =>
            v.lang.startsWith('en') &&
            v.name.toLowerCase().includes('natural') &&
            (v.name.toLowerCase().includes('female') ||
              v.name.toLowerCase().includes('jenny') ||
              v.name.toLowerCase().includes('sonia') ||
              v.name.toLowerCase().includes('aria'))
        );
        if (naturalFemale) return naturalFemale;

        // Priority 2: Google UK / US Female, Apple Samantha, Microsoft Zira
        const qualityFemale = availableVoices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.toLowerCase().includes('google uk english female') ||
              v.name.toLowerCase().includes('zira') ||
              v.name.toLowerCase().includes('samantha') ||
              v.name.toLowerCase().includes('karen') ||
              v.name.toLowerCase().includes('heera') ||
              v.name.toLowerCase().includes('victoria'))
        );
        if (qualityFemale) return qualityFemale;

        // Priority 3: Any female English voice
        const anyFemale = availableVoices.find(
          (v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('female')
        );
        if (anyFemale) return anyFemale;
      } else {
        // Priority 1: Natural / Online high clarity male voices
        const naturalMale = availableVoices.find(
          (v) =>
            v.lang.startsWith('en') &&
            v.name.toLowerCase().includes('natural') &&
            (v.name.toLowerCase().includes('male') ||
              v.name.toLowerCase().includes('guy') ||
              v.name.toLowerCase().includes('christopher') ||
              v.name.toLowerCase().includes('ryan'))
        );
        if (naturalMale) return naturalMale;

        // Priority 2: Google US English, Microsoft David, Alex, Daniel
        const qualityMale = availableVoices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.toLowerCase().includes('david') ||
              v.name.toLowerCase().includes('george') ||
              v.name.toLowerCase().includes('google us english') ||
              v.name.toLowerCase().includes('alex') ||
              v.name.toLowerCase().includes('daniel') ||
              v.name.toLowerCase().includes('ravi'))
        );
        if (qualityMale) return qualityMale;

        // Priority 3: Any male English voice
        const anyMale = availableVoices.find(
          (v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('male')
        );
        if (anyMale) return anyMale;
      }

      // Default fallback English voice
      const englishVoice = availableVoices.find((v) => v.lang.startsWith('en'));
      return englishVoice || availableVoices[0] || null;
    },
    [availableVoices, selectedVoiceUri]
  );

  // Clear queued sentences and stop
  const stopSpeaking = useCallback(() => {
    sentenceQueueRef.current = [];
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setIsThinking(false);
    }
  }, []);

  // Speak sentence queue sequentially for human-like pacing
  const speakQueue = useCallback((sentences, personaKey) => {
    if (!synthRef.current || !sentences.length) {
      setIsSpeaking(false);
      setIsPaused(false);
      return;
    }

    setIsSpeaking(true);
    setIsPaused(false);

    const sentence = sentences.shift();
    const persona = PERSONAS[personaKey];
    const voice = getBestVoiceForPersona(personaKey);

    const utterance = new SpeechSynthesisUtterance(sentence);
    if (voice) {
      utterance.voice = voice;
    }
    utterance.pitch = persona.pitch;
    utterance.rate = speechRate;
    utterance.volume = 1.0;

    activeUtteranceRef.current = utterance;

    utterance.onend = () => {
      if (sentences.length > 0) {
        // Natural micro-pause between sentences
        setTimeout(() => {
          speakQueue(sentences, personaKey);
        }, 120);
      } else {
        setIsSpeaking(false);
        setIsPaused(false);
      }
    };

    utterance.onerror = (e) => {
      console.warn('Utterance notice:', e);
      if (sentences.length > 0) {
        speakQueue(sentences, personaKey);
      } else {
        setIsSpeaking(false);
        setIsPaused(false);
      }
    };

    synthRef.current.speak(utterance);
  }, [getBestVoiceForPersona, speechRate]);

  // Main Speak function with automatic sentence chunking
  const speak = useCallback(
    (text, personaOverride = null) => {
      if (!synthRef.current || !text) return;

      synthRef.current.cancel(); // Stop ongoing speech

      const cleanText = sanitizeForSpeech(text);
      if (!cleanText) return;

      const personaKey = personaOverride || activePersona;
      setCurrentTranscript(cleanText);

      // Split into sentences for clear, crisp pronunciation without browser audio clipping
      const sentences = cleanText
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);

      sentenceQueueRef.current = sentences;
      speakQueue(sentences, personaKey);
    },
    [activePersona, speakQueue]
  );

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

  // Context-aware Ask Copilot
  const askCopilot = useCallback(
    async ({ prompt, results, params, activeRoute = '/', personaOverride = null }) => {
      const targetPersona = personaOverride || activePersona;
      stopSpeaking();
      setIsThinking(true);

      try {
        const response = await generateGeminiSpeech({
          prompt,
          persona: targetPersona,
          results,
          params,
          activeRoute,
          customApiKey: apiKey,
        });

        setIsThinking(false);
        if (response?.text) {
          speak(response.text, targetPersona);
        }
      } catch (err) {
        console.warn('Voice AI Generation error:', err);
        setIsThinking(false);
      }
    },
    [activePersona, apiKey, speak, stopSpeaking]
  );

  const speakLiveBriefing = useCallback(
    (results, params, activeRoute = '/') => {
      askCopilot({
        prompt: 'Deliver an executive live situational status report on current renewable performance and grid health.',
        results,
        params,
        activeRoute,
      });
    },
    [askCopilot]
  );

  const speakAssetReport = useCallback(
    (assetKey, results, params, activeRoute = '/') => {
      askCopilot({
        prompt: `Inspect the ${assetKey} installation in the microgrid and deliver technical telemetry insights.`,
        results,
        params,
        activeRoute,
      });
    },
    [askCopilot]
  );

  const value = {
    activePersona,
    setActivePersona,
    personaInfo: PERSONAS[activePersona],
    isSpeaking,
    isPaused,
    isThinking,
    audioLevel,
    currentTranscript,
    isWidgetOpen,
    setIsWidgetOpen,
    toggleWidget: () => setIsWidgetOpen((prev) => !prev),
    apiKey,
    setApiKey,
    availableVoices,
    selectedVoiceUri,
    setSelectedVoiceUri,
    speechRate,
    setSpeechRate,
    speak,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    askCopilot,
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

// geminiVoiceService.js — Context-Aware Google Gemini 3.8 Flash AI Engine for Mitra & Miles

const GEMINI_MODEL = 'gemini-3.8-flash';

// Clean text for natural speech synthesis
export function sanitizeForSpeech(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1')     // Italics
    .replace(/#{1,6}\s?/g, '')       // Headers
    .replace(/`{1,3}.*?`{1,3}/gs, '') // Code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/[•\-\*]\s+/g, '')      // Bullets
    .replace(/\n+/g, ' ')            // Newlines to spaces
    .replace(/[\{\}\[\]\<\>\_\~\|]/g, '') // Special symbols
    .replace(/\s{2,}/g, ' ')         // Collapse whitespace
    .trim();
}

/**
 * Builds rich, real-time context for the Gemini model
 */
export function buildGridContext(results, params, activeRoute = '/') {
  if (!results) {
    return 'Grid simulation is currently initializing.';
  }

  return `
CURRENT SIMULATION TELEMETRY & CONTEXT:
- Platform Page: ${activeRoute}
- Generation Breakdown:
  * Solar Output: ${results.solarEnergy || 0} kWh/day (Installed: ${params?.solar?.capacity || 25} kW, Sunlight: ${params?.solar?.sunlightHours || 5.5} hrs)
  * Wind Output: ${results.windEnergy || 0} kWh/day (${params?.wind?.numTurbines || 3} turbines at ${params?.wind?.windSpeed || 8} m/s)
  * Hydro Output: ${results.hydroEnergy || 0} kWh/day (${params?.hydro?.capacity || 10} kW capacity)
  * Biomass Output: ${results.biomassEnergy || 0} kWh/day (${params?.biomass?.input || 150} kg/day)
  * Total Active Generation: ${results.totalGeneration || 0} kWh/day
- Grid Demand: ${results.totalDemandKWh || 120} kWh/day
- Renewable Share: ${results.renewableSharePct || 0}%
- Grid Fossil Dependency: ${results.gridDependencyPct || 0}%
- Battery Storage: ${results.batteryCapacity || 50} kWh capacity, current State of Charge is ${results.batterySoC || 60}%
- Environmental Impact: ${results.co2AvoidedKg || 0} kg CO2 avoided/day
- Economic Savings: ₹${results.dailyCostSaving || 0}/day
- SDG 7 Score: ${results.sdgScores?.sdg7?.total || 75}/100
  `.trim();
}

/**
 * Calls Google Gemini 3.8 Flash API with system instructions tailored to the chosen persona.
 */
export async function generateGeminiSpeech({
  prompt,
  persona = 'mitra',
  results,
  params,
  activeRoute = '/',
  customApiKey = null,
}) {
  const apiKey =
    customApiKey ||
    (typeof window !== 'undefined' ? localStorage.getItem('gp_gemini_api_key') : null) ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.GEMIN_API_KEY ||
    import.meta.env.GEMINI_API_KEY;

  const contextData = buildGridContext(results, params, activeRoute);

  const personaInstruction =
    persona === 'mitra'
      ? `You are "Mitra", the brilliant, warm, and articulate AI Sustainability Advisor for GreenPulse.
Your vocal personality: Empathetic, visionary, eco-conscious, speaking clearly and encouragingly.
Your specialty: Clean energy transition, SDG 7 alignment, carbon offset, and ecological benefits.
Tone guidelines:
1. Speak concisely in 2 to 3 natural spoken sentences (around 35-50 words).
2. NEVER use markdown symbols, asterisks, bullet points, hashtags, or emojis in your response.
3. Incorporate real simulation numbers naturally into your spoken advice.`
      : `You are "Miles", the crisp, technical, and authoritative Grid Operations Dispatcher for GreenPulse.
Your vocal personality: Mission-control engineer, decisive, analytical, technically precise.
Your specialty: Real-time kilowatt-hours, battery SoC buffer reserves, grid frequency, curtailment, and electrical dispatch.
Tone guidelines:
1. Speak concisely in 2 to 3 natural spoken sentences (around 35-50 words).
2. NEVER use markdown symbols, asterisks, bullet points, hashtags, or emojis in your response.
3. Incorporate real simulation numbers naturally into your spoken dispatch report.`;

  // Fallback if no API key is configured
  if (!apiKey) {
    return generateLocalFallback(prompt, persona, results, params);
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `
[SYSTEM INSTRUCTION]
${personaInstruction}

[CURRENT PLATFORM CONTEXT]
${contextData}

[USER OR OPERATOR TRIGGER]
${prompt || 'Give an immediate live situational briefing on current grid performance.'}

Provide your spoken response now:`.trim(),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 140,
    },
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      console.warn('Gemini API notice:', errJson);
      throw new Error(errJson?.error?.message || `Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanSpeech = sanitizeForSpeech(rawText);

    if (cleanSpeech) {
      return {
        text: cleanSpeech,
        source: 'gemini-3.8-flash',
      };
    }

    throw new Error('Empty response from Gemini');
  } catch (error) {
    console.warn('Falling back to local heuristic speech generator:', error);
    const fallback = generateLocalFallback(prompt, persona, results, params);
    return {
      text: fallback.text,
      source: 'local-fallback',
      error: error.message,
    };
  }
}

/**
 * Intelligent local contextual generator when offline
 */
function generateLocalFallback(prompt, persona, results, params) {
  const p = prompt ? prompt.toLowerCase() : '';
  const renewable = results?.renewableSharePct || 85;
  const co2 = Math.round(results?.co2AvoidedKg || 240);
  const soc = Math.round(results?.batterySoC || 65);
  const gen = Math.round(results?.totalGeneration || 310);
  const demand = Math.round(results?.totalDemandKWh || 120);

  if (persona === 'mitra') {
    if (p.includes('solar')) {
      return {
        text: `Inspecting the solar field. The panels are capturing intense solar irradiance, delivering ${results?.solarEnergy || 0} kilowatt-hours of clean power and preventing thermal carbon generation.`,
        source: 'local',
      };
    }
    if (p.includes('wind')) {
      return {
        text: `Wind kinetic sensors active. The aerodynamically tuned turbines are operating at peak aerodynamic efficiency, supplying ${results?.windEnergy || 0} kilowatt-hours toward our zero-emission goal.`,
        source: 'local',
      };
    }
    if (p.includes('battery')) {
      return {
        text: `Megapack battery buffer holding at ${soc} percent State of Charge. This stored renewable surplus ensures our community remains clean and resilient overnight.`,
        source: 'local',
      };
    }
    return {
      text: `Hello operator, I am Mitra. The microgrid is operating with outstanding ecological efficiency at ${renewable} percent renewable penetration. We have eliminated ${co2} kilograms of carbon dioxide today, maintaining exceptional SDG 7 alignment.`,
      source: 'local',
    };
  }

  // Miles
  if (p.includes('solar')) {
    return {
      text: `Solar array telemetry confirmed. Central inverters are pushing ${results?.solarEnergy || 0} kilowatt-hours into the main three-phase bus with harmonic distortion well below tolerance limits.`,
      source: 'local',
    };
  }
  if (p.includes('wind')) {
    return {
      text: `Wind farm dispatch reporting. All ${params?.wind?.numTurbines || 3} turbines are online with rotor speeds locked to grid frequency, yielding ${results?.windEnergy || 0} kilowatt-hours.`,
      source: 'local',
    };
  }
  if (p.includes('battery')) {
    return {
      text: `Megapack BESS storage verified. Storage capacity is standing by at ${soc} percent State of Charge, ready to absorb peak voltage spikes or deliver rapid frequency response.`,
      source: 'local',
    };
  }
  return {
    text: `Dispatcher Miles online. Active total generation is holding at ${gen} kilowatt-hours against an aggregate demand load of ${demand} kilowatt-hours. Battery reserves are steady at ${soc} percent State of Charge, and grid synchronizers are nominal.`,
    source: 'local',
  };
}

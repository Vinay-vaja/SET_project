const MODEL_CANDIDATES = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.8-flash'];

/**
 * Clean text for natural speech synthesis and ensure full, complete sentences
 */
export function sanitizeForSpeech(text) {
  if (!text) return '';

  let cleaned = text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1')     // Italics
    .replace(/#{1,6}\s?/g, '')       // Headers
    .replace(/`{1,3}.*?`{1,3}/gs, '') // Code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/[•\-\*]\s+/g, '')      // Bullets
    .replace(/\n+/g, ' ')            // Newlines to spaces
    .replace(/[\{\}\[\]\<\>\_\~\|]/g, '') // Special symbols
    .replace(/\s{2,}/g, ' ')         // Collapse whitespace
    .trim();

  // Guard against truncated or cut-off half sentences:
  // If the text does not end with sentence-terminating punctuation, trim back to the last complete sentence
  const lastPunctuation = Math.max(
    cleaned.lastIndexOf('.'),
    cleaned.lastIndexOf('!'),
    cleaned.lastIndexOf('?')
  );

  if (lastPunctuation !== -1 && lastPunctuation < cleaned.length - 1) {
    // If there is incomplete trailing text after the last period, keep only the complete sentences
    const trailingFragment = cleaned.slice(lastPunctuation + 1).trim();
    if (trailingFragment.length > 0) {
      cleaned = cleaned.slice(0, lastPunctuation + 1).trim();
    }
  } else if (lastPunctuation === -1 && cleaned.length > 0) {
    // If no punctuation was provided at all, add a period at the end
    cleaned = cleaned + '.';
  }

  return cleaned;
}

/**
 * Builds rich, real-time context for the AI model
 */
export function buildGridContext(results, params, activeRoute = '/') {
  if (!results) {
    return 'Grid simulation is currently initializing.';
  }

  return `
CURRENT SIMULATION TELEMETRY & CONTEXT:
- Platform Page: ${activeRoute}
- Generation Breakdown:
  * Solar Output: ${results.solarEnergy || 0} kWh/day (Installed Capacity: ${params?.solar?.capacity || 25} kW, Sunlight Hours: ${params?.solar?.sunlightHours || 5.5} hrs)
  * Wind Output: ${results.windEnergy || 0} kWh/day (${params?.wind?.numTurbines || 3} turbines operating at ${params?.wind?.windSpeed || 8} m/s)
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
 * Calls AI Cloud API with automatic multi-model failover and high token ceiling
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

  // Fallback immediately if no key is configured
  if (!apiKey) {
    return generateLocalFallback(prompt, persona, results, params);
  }

  const contextData = buildGridContext(results, params, activeRoute);

  const personaInstruction =
    persona === 'mitra'
      ? `You are "Mitra", the brilliant, warm, and articulate AI Sustainability Advisor for GreenPulse microgrid.
Your vocal personality: Empathetic, visionary, eco-conscious, speaking clearly and encouragingly.
Your specialty: Clean energy transition, SDG 7 alignment, carbon offset, and ecological benefits.
Tone guidelines:
1. Provide a COMPLETE, articulate response in 3 to 4 full spoken sentences.
2. ALWAYS complete your thoughts and conclude your final sentence cleanly with a period. Do not stop mid-sentence.
3. NEVER use markdown symbols, asterisks, bullet points, hashtags, or emojis.
4. Incorporate real simulation numbers (generation kWh, renewable percentage, battery SoC) naturally into your spoken advice.`
      : `You are "Miles", the crisp, technical, and authoritative Grid Operations Dispatcher for GreenPulse microgrid.
Your vocal personality: Mission-control engineer, decisive, analytical, technically precise.
Your specialty: Real-time kilowatt-hours, battery SoC buffer reserves, grid frequency, curtailment, and electrical dispatch.
Tone guidelines:
1. Provide a COMPLETE, articulate dispatch response in 3 to 4 full spoken sentences.
2. ALWAYS complete your thoughts and conclude your final sentence cleanly with a period. Do not stop mid-sentence.
3. NEVER use markdown symbols, asterisks, bullet points, hashtags, or emojis.
4. Incorporate real simulation numbers (generation kWh, grid dependency percentage, battery SoC) naturally into your spoken report.`;

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

[OPERATOR QUERY OR TRIGGER]
${prompt || 'Deliver a full, complete executive situational status report on current renewable performance and grid health.'}

Provide your complete spoken response now:`.trim(),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1500, // Ample token budget so Gemini never cuts off mid-sentence
    },
  };

  // Try candidate models in order for maximum availability
  for (const model of MODEL_CANDIDATES) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        continue; // Try next candidate model
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanSpeech = sanitizeForSpeech(rawText);

      if (cleanSpeech && cleanSpeech.length > 20) {
        return {
          text: cleanSpeech,
          source: model,
        };
      }
    } catch (err) {
      console.warn(`Model ${model} encounter notice:`, err?.message);
    }
  }

  // If all cloud endpoints fail, fall back seamlessly to local generator
  return generateLocalFallback(prompt, persona, results, params);
}

/**
 * Intelligent local contextual generator when offline or fallback
 * Returns complete, polished, multi-sentence spoken briefings
 */
function generateLocalFallback(prompt, persona, results, params) {
  const p = prompt ? prompt.toLowerCase() : '';
  const renewable = results?.renewableSharePct || 85;
  const co2 = Math.round(results?.co2AvoidedKg || 240);
  const soc = Math.round(results?.batterySoC || 65);
  const gen = Math.round(results?.totalGeneration || 310);
  const demand = Math.round(results?.totalDemandKWh || 120);
  const solar = (results?.solarEnergy || 0).toFixed(1);
  const wind = (results?.windEnergy || 0).toFixed(1);
  const savings = Math.round(results?.dailyCostSaving || 1400);

  if (persona === 'mitra') {
    if (p.includes('solar')) {
      return {
        text: `Inspecting the solar photovoltaic field. The monocrystalline arrays are operating at high irradiance efficiency, generating ${solar} kilowatt-hours of clean solar power today. This direct solar generation offsets daytime grid reliance and accelerates our sustainable energy transition.`,
        source: 'local-fallback',
      };
    }
    if (p.includes('wind')) {
      return {
        text: `Viewing the utility-scale wind farm array. The aerodynamically tuned turbines are operating in synchronization with local wind currents, delivering ${wind} kilowatt-hours of zero-emission electricity. This kinetic output provides steady momentum toward our net-zero carbon goals.`,
        source: 'local-fallback',
      };
    }
    if (p.includes('battery')) {
      return {
        text: `Focusing on the Megapack Battery Energy Storage System. Battery storage reserves are standing by at ${soc} percent State of Charge, actively buffering solar and wind fluctuations. Storing daytime surplus guarantees reliable clean power for our community around the clock.`,
        source: 'local-fallback',
      };
    }
    return {
      text: `Hello operator, I am Mitra, your Sustainability Advisor. The hybrid microgrid is operating with outstanding ecological efficiency, delivering ${renewable} percent renewable penetration today. Our clean sources have avoided ${co2} kilograms of carbon emissions and saved approximately ₹${savings} in energy costs. All sustainability and clean energy transition benchmarks remain on a steady positive trajectory.`,
      source: 'local-fallback',
    };
  }

  // Miles
  if (p.includes('solar')) {
    return {
      text: `Solar array telemetry confirmed. Central inverters are pushing ${solar} kilowatt-hours into the main three-phase distribution bus with harmonic distortion well below regulatory limits. Voltage stability across all feeder lines is operating within nominal thresholds.`,
      source: 'local-fallback',
    };
  }
  if (p.includes('wind')) {
    return {
      text: `Wind sector dispatch reporting. All ${params?.wind?.numTurbines || 3} turbines are synchronized online with rotor speeds locked to the 50-hertz bus frequency, yielding ${wind} kilowatt-hours. Aerodynamic pitch controls are actively compensating for shifting gust profiles.`,
      source: 'local-fallback',
    };
  }
  if (p.includes('battery')) {
    return {
      text: `BESS Megapack storage hub verified. Lithium storage reserves are standing by at ${soc} percent State of Charge, ready to absorb peak voltage spikes or deliver rapid frequency response. Bi-directional power electronics are fully synchronized with our central distribution grid.`,
      source: 'local-fallback',
    };
  }
  return {
    text: `Dispatcher Miles online. Active total generation is holding at ${gen} kilowatt-hours against an aggregate consumer demand load of ${demand} kilowatt-hours. Battery reserves are steady at ${soc} percent State of Charge, and substation grid synchronizers are operating within nominal specifications.`,
    source: 'local-fallback',
  };
}

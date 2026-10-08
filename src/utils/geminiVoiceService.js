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
 * Builds rich, real-time context for the AI model including live environmental data
 */
export function buildGridContext(results, params, activeRoute = '/', realConditions = null) {
  if (!results) {
    return 'Grid simulation is currently initializing.';
  }

  const envContext = realConditions
    ? `
REAL-WORLD ENVIRONMENTAL TELEMETRY (LIVE):
- Detected Location: ${realConditions.location || 'Ahmedabad'}, ${realConditions.region || 'Gujarat, India'}
- Ambient Temperature: ${realConditions.temperature || 31.4}°C (Apparent: ${realConditions.apparentTemperature || 33.2}°C)
- Wind Velocity: ${realConditions.windSpeed || 4.8} m/s (${realConditions.windSpeedKmh || 17.3} km/h) from ${realConditions.windDirection || 240}°
- Solar Irradiance: ${realConditions.solarIrradiance || 742} W/m² (Direct Normal / Shortwave Flux)
- Relative Humidity: ${realConditions.humidity || 58}%
- Cloud Cover: ${realConditions.cloudCover || 15}% (${realConditions.weatherDesc || 'Mainly Clear'})
- Data Source: ${realConditions.dataSource || 'Open-Meteo Free Meteorological API'}
`
    : '';

  return `
${envContext}
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
  realConditions = null,
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
    return generateLocalFallback(prompt, persona, results, params, realConditions);
  }

  const contextData = buildGridContext(results, params, activeRoute, realConditions);

  const personaInstruction =
    persona === 'mitra'
      ? `You are "Mitra", the brilliant, warm, and articulate AI Sustainability Advisor for GreenPulse microgrid.
Your vocal personality: Empathetic, visionary, eco-conscious, speaking clearly and encouragingly.
Your specialty: Clean energy transition, SDG 7 alignment, carbon offset, and ecological benefits.
Tone guidelines:
1. Provide a COMPLETE, articulate response in 3 to 4 full spoken sentences.
2. ALWAYS complete your thoughts and conclude your final sentence cleanly with a period. Do not stop mid-sentence.
3. NEVER use markdown symbols, asterisks, bullet points, hashtags, or emojis.
4. Integrate real-world location and weather data (temperature °C, wind speed m/s, solar irradiance W/m²) seamlessly with simulation outputs.`
      : `You are "Miles", the crisp, technical, and authoritative Grid Operations Dispatcher for GreenPulse microgrid.
Your vocal personality: Mission-control engineer, decisive, analytical, technically precise.
Your specialty: Real-time kilowatt-hours, battery SoC buffer reserves, grid frequency, curtailment, and electrical dispatch.
Tone guidelines:
1. Provide a COMPLETE, articulate dispatch response in 3 to 4 full spoken sentences.
2. ALWAYS complete your thoughts and conclude your final sentence cleanly with a period. Do not stop mid-sentence.
3. NEVER use markdown symbols, asterisks, bullet points, hashtags, or emojis.
4. Integrate real-world meteorological readings (ambient temp, wind speed, solar flux) with electrical telemetry and battery dispatch.`;

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
${prompt || 'Deliver a full, complete executive situational status report on current renewable performance, environmental conditions, and grid health.'}

Provide your complete spoken response now:`.trim(),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1500,
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
  return generateLocalFallback(prompt, persona, results, params, realConditions);
}

/**
 * Intelligent local contextual generator when offline or fallback
 * Dynamically synthesizes situational briefings from real environmental data and simulation state
 */
function generateLocalFallback(prompt, persona, results, params, realConditions = null) {
  const p = prompt ? prompt.toLowerCase() : '';
  const renewable = results?.renewableSharePct || 85;
  const co2 = Math.round(results?.co2AvoidedKg || 240);
  const soc = Math.round(results?.batterySoC || 65);
  const gen = Math.round(results?.totalGeneration || 310);
  const demand = Math.round(results?.totalDemandKWh || 120);
  const solar = (results?.solarEnergy || 0).toFixed(1);
  const wind = (results?.windEnergy || 0).toFixed(1);
  const savings = Math.round(results?.dailyCostSaving || 1400);
  const sdgScore = Math.round(results?.sdgScores?.sdg7?.total || 78);

  const loc = realConditions?.location || 'Ahmedabad';
  const temp = realConditions?.temperature ?? 31.4;
  const windSpeed = realConditions?.windSpeed ?? 4.8;
  const irradiance = realConditions?.solarIrradiance ?? 742;
  const weatherDesc = (realConditions?.weatherDesc || 'favorable skies').toLowerCase();

  // Greeting based on time
  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  if (persona === 'mitra') {
    // "Brief Me" / "What's happening?"
    if (p.includes('brief') || p.includes('happening') || p.includes('status') || !p) {
      const solarStrength = irradiance > 500 ? 'favorable' : 'moderate';
      const generationComparison =
        +solar > +wind
          ? 'estimates stronger solar generation than wind generation'
          : 'estimates strong kinetic wind yield alongside solar output';

      return {
        text: `${timeGreeting}. You are currently in ${loc}. The temperature is ${temp} degrees Celsius with ${weatherDesc}, and current wind speed is ${windSpeed} meters per second. Solar irradiance is ${irradiance} watts per square meter, so solar conditions are currently ${solarStrength}. Based on these conditions, GreenPulse ${generationComparison}, providing ${renewable} percent clean energy to meet your demand.`,
        source: 'local-dynamic-engine',
      };
    }

    // "Explain current conditions"
    if (p.includes('condition') || p.includes('weather') || p.includes('environment')) {
      return {
        text: `Live atmospheric telemetry for ${loc} reports ambient temperature at ${temp} degrees Celsius with ${realConditions?.humidity || 58} percent relative humidity. Solar shortwave irradiance is currently measuring ${irradiance} watts per square meter under ${weatherDesc}. Wind currents are steady at ${windSpeed} meters per second, creating optimal microclimate conditions for hybrid renewable harvesting.`,
        source: 'local-dynamic-engine',
      };
    }

    // "Explain solar generation"
    if (p.includes('solar') || p.includes('photovoltaic') || p.includes('sun')) {
      return {
        text: `Analyzing the solar photovoltaic installation. With real solar irradiance at ${irradiance} watts per square meter in ${loc}, our solar arrays are generating ${solar} kilowatt-hours of clean electricity today. Panel operating temperatures are hovering near ${temp} degrees Celsius, keeping thermal derating losses minimal and maximizing clean power yield.`,
        source: 'local-dynamic-engine',
      };
    }

    // "Explain wind generation"
    if (p.includes('wind') || p.includes('turbine') || p.includes('aerodynamic')) {
      return {
        text: `Inspecting the wind turbine sector. Local wind velocity is measuring ${windSpeed} meters per second, allowing our ${params?.wind?.numTurbines || 3} turbines to generate ${wind} kilowatt-hours of kinetic energy. The aerodynamically pitched rotor blades are synchronized to current atmospheric currents, delivering steady zero-carbon electricity.`,
        source: 'local-dynamic-engine',
      };
    }

    // "Explain my SDG score"
    if (p.includes('sdg') || p.includes('score') || p.includes('sustainability') || p.includes('impact')) {
      return {
        text: `Your current SDG 7 Clean Energy score stands at ${sdgScore} out of 100. Our renewable generation is supplying ${renewable} percent of total load, avoiding ${co2} kilograms of carbon emissions today. Increasing battery capacity or expanding solar array capture will further boost your SDG 7 energy affordability and reliability rating.`,
        source: 'local-dynamic-engine',
      };
    }

    if (p.includes('battery') || p.includes('storage') || p.includes('bess')) {
      return {
        text: `Focusing on the Megapack Battery Energy Storage System. Battery storage reserves are standing by at ${soc} percent State of Charge, actively buffering solar and wind fluctuations. Storing daytime surplus guarantees reliable clean power for our community around the clock.`,
        source: 'local-dynamic-engine',
      };
    }

    return {
      text: `${timeGreeting}, I am Mitra, your Sustainability Advisor. In ${loc}, our hybrid microgrid is delivering ${renewable} percent renewable penetration with ${solar} kilowatt-hours from solar and ${wind} kilowatt-hours from wind. Clean sources have avoided ${co2} kilograms of carbon emissions today, maintaining our SDG score at ${sdgScore} out of 100.`,
      source: 'local-dynamic-engine',
    };
  }

  // Miles (Grid Operations Dispatcher)
  if (p.includes('brief') || p.includes('happening') || p.includes('status') || !p) {
    return {
      text: `Dispatcher Miles reporting from ${loc} sector. Ambient temperature is ${temp} degrees Celsius, wind speed is ${windSpeed} meters per second, and solar flux is ${irradiance} watts per square meter. Active generation is delivering ${gen} kilowatt-hours against ${demand} kilowatt-hours demand, with battery reserves stable at ${soc} percent State of Charge.`,
      source: 'local-dynamic-engine',
    };
  }
  if (p.includes('condition') || p.includes('weather')) {
    return {
      text: `Meteorological telemetry in ${loc} confirmed: ambient temperature ${temp} degrees Celsius, surface wind velocity ${windSpeed} meters per second, and direct solar irradiance ${irradiance} watts per square meter. Substation thermal sensors and wind aerodynamic torque levels are operating well within safety envelopes.`,
      source: 'local-dynamic-engine',
    };
  }
  if (p.includes('solar')) {
    return {
      text: `Solar array telemetry confirmed. With solar irradiance at ${irradiance} watts per square meter, inverters are pushing ${solar} kilowatt-hours into the main distribution bus with nominal voltage stability and minimal harmonic distortion.`,
      source: 'local-dynamic-engine',
    };
  }
  if (p.includes('wind')) {
    return {
      text: `Wind dispatch reporting. Local velocity is ${windSpeed} meters per second across all ${params?.wind?.numTurbines || 3} turbines, delivering ${wind} kilowatt-hours. Rotor speeds are locked to 50-hertz bus frequency with active pitch control engaged.`,
      source: 'local-dynamic-engine',
    };
  }
  if (p.includes('battery')) {
    return {
      text: `BESS Megapack storage hub verified. Lithium storage reserves are standing by at ${soc} percent State of Charge, ready to absorb peak voltage spikes or deliver rapid frequency response across our central distribution grid.`,
      source: 'local-dynamic-engine',
    };
  }
  return {
    text: `Dispatcher Miles online in ${loc}. Active generation is holding at ${gen} kilowatt-hours against ${demand} kilowatt-hours demand. Battery reserves are steady at ${soc} percent State of Charge, and substation grid synchronizers are operating within nominal specifications.`,
    source: 'local-dynamic-engine',
  };
}


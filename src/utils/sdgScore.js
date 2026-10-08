// SDG Score Calculation Engine
// Scores are calculated from simulation parameters — not hardcoded

import { SDG_WEIGHTS } from '../data/energyConstants.js';

/**
 * Calculate SDG 7 score from simulation results
 * @param {object} simResults - Results from the main energy simulation
 * @returns {object} Detailed SDG scores
 */
export function calcSDG7Score(simResults) {
  const {
    renewableSharePct = 0,
    gridDependencyPct = 100,
    dailyCostSaving = 0,
    gridOnlyCost = 0,
    co2AvoidedKg = 0,
    totalGenerationKWh = 0,
    totalDemandKWh = 60,
  } = simResults;

  // Sub-metric 1: Renewable Adoption (0–25)
  const renewableScore = Math.min(25, (renewableSharePct / 100) * 25);

  // Sub-metric 2: Clean Energy — based on CO₂ avoided (0–25)
  const maxCo2Avoided = totalDemandKWh * 0.82; // if all grid
  const co2Score = maxCo2Avoided > 0
    ? Math.min(25, (co2AvoidedKg / maxCo2Avoided) * 25)
    : 0;

  // Sub-metric 3: Energy Efficiency — low grid dependency = high score (0–25)
  const efficiencyScore = Math.min(25, ((100 - gridDependencyPct) / 100) * 25);

  // Sub-metric 4: Affordability — cost saving percentage (0–25)
  const savingPct = gridOnlyCost > 0 ? (dailyCostSaving / gridOnlyCost) * 100 : 0;
  const affordabilityScore = Math.min(25, (savingPct / 80) * 25);

  const totalSDG7 = renewableScore + co2Score + efficiencyScore + affordabilityScore;

  // SDG 9 — Innovation: based on diverse energy mix
  const sdg9Score = calcSDG9Score(simResults);

  // SDG 11 — Sustainable communities: based on distributed + clean energy
  const sdg11Score = Math.min(100, (renewableScore + efficiencyScore) * 2);

  // SDG 12 — Responsible consumption: efficiency and waste minimization
  const sdg12Score = Math.min(100, efficiencyScore * 4);

  // SDG 13 — Climate action: CO₂ avoidance
  const sdg13Score = Math.min(100, co2Score * 4);

  return {
    sdg7: {
      total: +totalSDG7.toFixed(1),
      subMetrics: {
        affordable: +affordabilityScore.toFixed(1),
        clean: +co2Score.toFixed(1),
        efficiency: +efficiencyScore.toFixed(1),
        renewable: +renewableScore.toFixed(1),
      },
    },
    sdg9: +sdg9Score.toFixed(1),
    sdg11: +sdg11Score.toFixed(1),
    sdg12: +sdg12Score.toFixed(1),
    sdg13: +sdg13Score.toFixed(1),
    overall: +((totalSDG7 * 0.4 + sdg9Score * 0.2 + sdg11Score * 0.15 + sdg12Score * 0.15 + sdg13Score * 0.1)).toFixed(1),
  };
}

function calcSDG9Score(simResults) {
  const { renewableSharePct = 0, batteryCapacity = 0, totalGenerationKWh = 0 } = simResults;
  // SDG9: Innovation points for storage + renewable diversity
  let score = (renewableSharePct / 100) * 60;
  if (batteryCapacity > 0) score += 20;
  if (totalGenerationKWh > 0) score += 20;
  return Math.min(100, score);
}

/**
 * Get label and color for a score
 */
export function getScoreLabel(score, max = 100) {
  const pct = (score / max) * 100;
  if (pct >= 80) return { label: 'Excellent', color: '#22C55E' };
  if (pct >= 60) return { label: 'Good', color: '#84CC16' };
  if (pct >= 40) return { label: 'Fair', color: '#F59E0B' };
  return { label: 'Needs Improvement', color: '#EF4444' };
}

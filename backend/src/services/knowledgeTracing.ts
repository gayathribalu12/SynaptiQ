// Bayesian Knowledge Tracing (BKT) & Enhanced Learner State Implementation

interface BKTParameters {
  pL0: number; // Prior knowledge
  pT: number;  // Transition probability (learning step)
  pG: number;  // Guess probability
  pS: number;  // Slip probability
}

// Default BKT parameters
const DEFAULT_PARAMS: BKTParameters = {
  pL0: 0.15,
  pT: 0.12,
  pG: 0.20,
  pS: 0.10,
};

/**
 * Standard BKT posterior calculation.
 * Computes standard mastery probability based on correctness, slip, guess, and transition steps.
 */
export function calculateStandardBKT(
  priorMastery: number,
  answeredCorrectly: boolean,
  params: BKTParameters = DEFAULT_PARAMS
): number {
  const L_prev = Math.min(0.999, Math.max(0.001, priorMastery));
  let L_cond = 0;

  if (answeredCorrectly) {
    // P(L_prev | correct) = L_prev * (1 - pS) / [ L_prev * (1 - pS) + (1 - L_prev) * pG ]
    const numerator = L_prev * (1 - params.pS);
    const denominator = L_prev * (1 - params.pS) + (1 - L_prev) * params.pG;
    L_cond = numerator / denominator;
  } else {
    // P(L_prev | incorrect) = L_prev * pS / [ L_prev * pS + (1 - L_prev) * (1 - pG) ]
    const numerator = L_prev * params.pS;
    const denominator = L_prev * params.pS + (1 - L_prev) * (1 - params.pG);
    L_cond = numerator / denominator;
  }

  // P(L_t) = L_cond + (1 - L_cond) * pT
  const nextMastery = L_cond + (1 - L_cond) * params.pT;
  return parseFloat(nextMastery.toFixed(4));
}

/**
 * Enhanced Learner State Layer.
 * Integrates standard BKT with mistake frequencies, visual behaviors, and engagement times.
 */
export function calculateEnhancedLearnerState(
  standardBKT: number,
  mistakePatternCount: number,
  timeSpentSec: number = 60,
  formatEffectiveness: number = 0.5
): { mastery: number; confidence: number } {
  // If recurring misconceptions exist, we lower the effective mastery because of structural gaps.
  const mistakePenalty = Math.min(0.25, mistakePatternCount * 0.05);
  
  // Fast completions or high format effectiveness slightly boosts confidence
  const speedBonus = timeSpentSec < 30 ? -0.05 : timeSpentSec > 300 ? 0.03 : 0.0;
  const formatBonus = (formatEffectiveness - 0.5) * 0.1;

  const adjustedMastery = Math.min(0.99, Math.max(0.01, standardBKT - mistakePenalty));
  
  // Confidence increases if they have fewer mistakes and high visual success
  const baseConfidence = 0.5 + Math.abs(adjustedMastery - 0.5);
  const confidence = Math.min(0.99, Math.max(0.10, baseConfidence - (mistakePatternCount * 0.06) + speedBonus + formatBonus));

  return {
    mastery: parseFloat(adjustedMastery.toFixed(4)),
    confidence: parseFloat(confidence.toFixed(4)),
  };
}

/**
 * Legacy wrapper to maintain API compatibility for existing endpoints,
 * routing calculations through standard BKT followed by the Enhanced Learner State layer.
 */
export function calculateBKT(
  priorMastery: number,
  answeredCorrectly: boolean,
  mistakePatternCount: number = 0
): { mastery: number; confidence: number } {
  const standard = calculateStandardBKT(priorMastery, answeredCorrectly);
  return calculateEnhancedLearnerState(standard, mistakePatternCount);
}

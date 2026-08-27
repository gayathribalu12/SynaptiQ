// Bayesian Knowledge Tracing (BKT) Implementation

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
 * Calculates updated mastery (probability of learning) using BKT equations.
 * 
 * Formula:
 * 1. P(L_t-1 | Action) = Conditional probability of knowing the skill given response.
 * 2. P(L_t) = P(L_t-1 | Action) + (1 - P(L_t-1 | Action)) * P(T)
 */
export function calculateBKT(
  priorMastery: number,
  answeredCorrectly: boolean,
  mistakePatternCount: number = 0
): { mastery: number; confidence: number } {
  // If there are recurring mistake patterns, the transition probability pT decreases
  // because the student is experiencing a structural struggle, and slip pS increases.
  const pT = Math.max(0.02, DEFAULT_PARAMS.pT - mistakePatternCount * 0.015);
  const pS = Math.min(0.35, DEFAULT_PARAMS.pS + mistakePatternCount * 0.02);
  const pG = DEFAULT_PARAMS.pG;

  // Clamp prior mastery to avoid numerical errors
  const L_prev = Math.min(0.999, Math.max(0.001, priorMastery));

  let L_cond = 0;

  if (answeredCorrectly) {
    // P(L_prev | correct) = L_prev * (1 - pS) / [ L_prev * (1 - pS) + (1 - L_prev) * pG ]
    const numerator = L_prev * (1 - pS);
    const denominator = L_prev * (1 - pS) + (1 - L_prev) * pG;
    L_cond = numerator / denominator;
  } else {
    // P(L_prev | incorrect) = L_prev * pS / [ L_prev * pS + (1 - L_prev) * (1 - pG) ]
    const numerator = L_prev * pS;
    const denominator = L_prev * pS + (1 - L_prev) * (1 - pG);
    L_cond = numerator / denominator;
  }

  // Next state: P(L_t) = L_cond + (1 - L_cond) * pT
  const newMastery = L_cond + (1 - L_cond) * pT;

  // Confidence is inferred based on how close mastery is to 0 or 1.
  // When mastery is extreme (0.01 or 0.99), confidence is high.
  // When mastery is around 0.50, confidence is lowest.
  const confidence = 0.5 + Math.abs(newMastery - 0.5);

  return {
    mastery: parseFloat(newMastery.toFixed(4)),
    confidence: parseFloat(confidence.toFixed(4)),
  };
}

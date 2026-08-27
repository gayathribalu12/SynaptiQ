import prisma from '../db';

/**
 * Predicts the retention probability of a skill based on memory decay.
 * Formula: R = e^(-t / H)
 * Where:
 *  - t = days since last practiced
 *  - H = half-life in days = base_half_life * mastery * (1 + repetitions)
 */
export function predictRetention(
  mastery: number,
  daysSinceLastPracticed: number,
  repetitions: number = 1
): number {
  if (mastery <= 0) return 0;
  
  const baseHalfLife = 7; // base half-life of 7 days for a concept
  const halfLife = baseHalfLife * mastery * (1 + repetitions);
  
  const retention = Math.exp(-daysSinceLastPracticed / halfLife);
  return parseFloat(retention.toFixed(4));
}

/**
 * Predicts struggle probability for a student on a specific skill.
 * If the prerequisites of a skill are weak, the student is likely to struggle.
 * Formula: StruggleProb = Math.max(0, 1 - averagePrerequisiteMastery)
 */
export async function predictStruggle(
  profileId: string,
  skillId: string
): Promise<number> {
  // Find all prerequisites for the skill
  const prerequisites = await prisma.skillPrerequisite.findMany({
    where: { skillId },
    select: { prerequisiteId: true }
  });

  if (prerequisites.length === 0) {
    return 0.05; // Base low struggle probability for beginner concepts
  }

  // Get student's mastery in those prerequisites
  const prereqIds = prerequisites.map((p) => p.prerequisiteId);
  const learnerSkills = await prisma.learnerSkill.findMany({
    where: {
      profileId,
      skillId: { in: prereqIds }
    }
  });

  let sumMastery = 0;
  for (const pid of prereqIds) {
    const ls = learnerSkills.find((s) => s.skillId === pid);
    sumMastery += ls ? ls.mastery : 0; // 0 if they haven't touched it
  }

  const avgPrereqMastery = sumMastery / prereqIds.length;
  
  // High average prereq mastery means low struggle probability
  const struggleProb = Math.max(0.05, Math.min(0.95, 1 - avgPrereqMastery));
  return parseFloat(struggleProb.toFixed(4));
}

/**
 * Calculates Career Readiness Score based on target career skills requirements.
 * Compares current LearnerSkill mastery to CareerSkill requirements.
 */
export async function calculateCareerReadiness(
  profileId: string,
  careerGoalId: string
): Promise<{
  overallScore: number;
  breakdown: Record<string, { current: number; required: number }>;
}> {
  const careerSkills = await prisma.careerSkill.findMany({
    where: { careerGoalId },
    include: { skill: true }
  });

  if (careerSkills.length === 0) {
    return { overallScore: 0, breakdown: {} };
  }

  const learnerSkills = await prisma.learnerSkill.findMany({
    where: { profileId }
  });

  let totalRequired = 0;
  let totalAchieved = 0;
  const breakdown: Record<string, { current: number; required: number }> = {};

  for (const cs of careerSkills) {
    const ls = learnerSkills.find((s) => s.skillId === cs.skillId);
    const current = ls ? ls.mastery : 0;
    const required = cs.requiredMastery;

    totalRequired += required;
    // We cap achieved at required so over-mastery in one skill doesn't mask gaps in another
    totalAchieved += Math.min(current, required);

    breakdown[cs.skillId] = {
      current: parseFloat(current.toFixed(2)),
      required: parseFloat(required.toFixed(2))
    };
  }

  const overallScore = totalRequired > 0 ? (totalAchieved / totalRequired) * 100 : 0;

  return {
    overallScore: Math.round(overallScore),
    breakdown
  };
}

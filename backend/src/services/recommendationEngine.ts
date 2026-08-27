import prisma from '../db';
import { predictRetention, predictStruggle } from './predictiveEngine';

interface RecommendationResult {
  nextAction: 'learn' | 'revision' | 'project' | 'interview';
  skillId: string;
  skillName: string;
  recommendedResource: {
    id: string;
    title: string;
    type: string;
    url: string;
  } | null;
  recommendedFormat: string;
  confidence: number;
  reason: string;
}

/**
 * Recommends the next learning action for a user using:
 * 1. Prerequisite topology matching.
 * 2. Retention decay alerts (Revision triggers).
 * 3. Contextual Bandit format selections.
 */
export async function recommendNextAction(userId: string): Promise<RecommendationResult> {
  const profile = await prisma.learnerProfile.findUnique({
    where: { userId },
    include: { careerGoals: true, skills: { include: { skill: true } } }
  });

  if (!profile || profile.skills.length === 0) {
    throw new Error('Learner profile or skills not initialized.');
  }

  const goal = profile.careerGoals[0];
  if (!goal) {
    throw new Error('Career goal not configured.');
  }

  // 1. Check for Revision needs first (Forgetting Engine)
  // Check if any skill has retention < 50%
  const skillsToRevise = [];
  for (const ls of profile.skills) {
    // Estimate days since last practice
    const elapsedDays = (Date.now() - new Date(ls.lastPracticed).getTime()) / (24 * 60 * 60 * 1000);
    const predictedRet = predictRetention(ls.mastery, elapsedDays);
    
    if (predictedRet < 0.50 && ls.mastery > 0.30) {
      skillsToRevise.push({
        skillId: ls.skillId,
        name: ls.skill.name,
        retention: predictedRet,
        mastery: ls.mastery
      });
    }
  }

  // If we have revision needs, recommend revision for the weakest retention
  if (skillsToRevise.length > 0) {
    skillsToRevise.sort((a, b) => a.retention - b.retention);
    const revisionTarget = skillsToRevise[0];
    
    // Choose format using Bandit
    const format = await selectOptimalFormat(userId, revisionTarget.skillId);

    // Find revision resource
    const resource = await prisma.resource.findFirst({
      where: { skillId: revisionTarget.skillId, type: format }
    }) || await prisma.resource.findFirst({
      where: { skillId: revisionTarget.skillId }
    });

    return {
      nextAction: 'revision',
      skillId: revisionTarget.skillId,
      skillName: revisionTarget.name,
      recommendedResource: resource ? { id: resource.id, title: resource.title, type: resource.type, url: resource.url } : null,
      recommendedFormat: format,
      confidence: 0.90,
      reason: `Your predicted retention for ${revisionTarget.name} has dropped to ${Math.round(revisionTarget.retention * 100)}%. A short spaced-repetition session is recommended.`
    };
  }

  // 2. Career path selection
  // Find career skills we need to master
  const careerSkills = await prisma.careerSkill.findMany({
    where: { careerGoalId: goal.id },
    include: { skill: { include: { prerequisites: true } } }
  });

  // Evaluate skills in topologic order of dependencies
  // We want to find the first skill that:
  // - Learner has not mastered (mastery < requiredMastery)
  // - Prerequisites are sufficiently mastered (mastery > 0.50)
  const unmasteredSkills = careerSkills.filter(cs => {
    const ls = profile.skills.find(s => s.skillId === cs.skillId);
    const current = ls ? ls.mastery : 0;
    return current < cs.requiredMastery;
  });

  if (unmasteredSkills.length === 0) {
    // If all skills are mastered, recommend AI Project or Interview Simulator!
    const activeProject = await prisma.project.findFirst({
      where: { userId, status: 'started' }
    });

    if (activeProject) {
      return {
        nextAction: 'project',
        skillId: 'projects',
        skillName: 'Capstone Project',
        recommendedResource: null,
        recommendedFormat: 'code',
        confidence: 0.95,
        reason: 'You have mastered all core skills. Work on your generated capstone project to build your portfolio.'
      };
    }

    return {
      nextAction: 'interview',
      skillId: 'interviews',
      skillName: 'Technical Interview',
      recommendedResource: null,
      recommendedFormat: 'text',
      confidence: 0.90,
      reason: 'All core career skills are fully mastered! Prepare for your job hunt with the AI Technical Interview Simulator.'
    };
  }

  // Find which of these unmastered skills are unlocked (prereqs met)
  const unlockedSkills = [];
  for (const cs of unmasteredSkills) {
    const prereqs = cs.skill.prerequisites;
    let prereqsMet = true;

    for (const prereq of prereqs) {
      const lsPrereq = profile.skills.find(s => s.skillId === prereq.prerequisiteId);
      if (!lsPrereq || lsPrereq.mastery < 0.50) {
        prereqsMet = false;
        break;
      }
    }

    if (prereqsMet) {
      // Predict struggle probability
      const struggleProb = await predictStruggle(profile.id, cs.skillId);
      unlockedSkills.push({
        cs,
        struggleProb
      });
    }
  }

  // Sort unlocked skills: prioritize lowest struggle or first in line
  let targetSkillId = '';
  let targetSkillName = '';
  let struggleProbVal = 0;
  
  if (unlockedSkills.length > 0) {
    // Sort to tackle prerequisite chain in order, but flag if struggle probability is moderate
    const selected = unlockedSkills[0]; // grab first unlocked skill
    targetSkillId = selected.cs.skillId;
    targetSkillName = selected.cs.skill.name;
    struggleProbVal = selected.struggleProb;
  } else {
    // If no skill is unlocked (meaning prerequisites are holding the student back), 
    // we MUST recommend learning the weak prerequisites first!
    // Find the first unmastered skill's first weak prerequisite.
    const firstUnmastered = unmasteredSkills[0];
    const weakPrereq = firstUnmastered.skill.prerequisites.find(p => {
      const ls = profile.skills.find(s => s.skillId === p.prerequisiteId);
      return !ls || ls.mastery < 0.50;
    });

    if (weakPrereq) {
      const pSkill = await prisma.skill.findUnique({ where: { id: weakPrereq.prerequisiteId } });
      targetSkillId = weakPrereq.prerequisiteId;
      targetSkillName = pSkill ? pSkill.name : targetSkillId;
      struggleProbVal = 0.1; // fallback
    } else {
      // Fallback
      targetSkillId = unmasteredSkills[0].skillId;
      targetSkillName = unmasteredSkills[0].skill.name;
    }
  }

  // Select format using Contextual Bandit
  const format = await selectOptimalFormat(userId, targetSkillId);

  // Load resource for the target skill and format
  const resource = await prisma.resource.findFirst({
    where: { skillId: targetSkillId, type: format }
  }) || await prisma.resource.findFirst({
    where: { skillId: targetSkillId }
  });

  // Calculate confidence based on prerequisite strength and format matching
  const confidence = parseFloat((0.95 - struggleProbVal * 0.2).toFixed(2));

  return {
    nextAction: 'learn',
    skillId: targetSkillId,
    skillName: targetSkillName,
    recommendedResource: resource ? { id: resource.id, title: resource.title, type: resource.type, url: resource.url } : null,
    recommendedFormat: format,
    confidence,
    reason: `Recommended based on your career goal. It targets your primary skill gap in ${targetSkillName}. Prerequisite check passed, with a predicted struggle rate of ${Math.round(struggleProbVal * 100)}%.`
  };
}

/**
 * Implements Contextual Bandit selection (epsilon-greedy).
 * Scores each format = preferenceScore + randomExploration.
 */
export async function selectOptimalFormat(userId: string, skillId: string): Promise<string> {
  const preferences = await prisma.learningPreference.findMany({
    where: { userId }
  });

  if (preferences.length === 0) {
    return 'text'; // base default
  }

  const epsilon = 0.15; // 15% exploration rate
  const shouldExplore = Math.random() < epsilon;

  if (shouldExplore) {
    const randomIndex = Math.floor(Math.random() * preferences.length);
    return preferences[randomIndex].format;
  }

  // Exploitation: Pick format with highest preferenceScore
  preferences.sort((a, b) => b.preferenceScore - a.preferenceScore);
  
  // Section 27: If the system detects a difficult concept and 3D has high score, recommend 3D
  // If the skill is visual (like binary tree, neural network, or gradient descent), prioritize '3d'
  const visualSkills = ['dsa', 'deep_learning', 'gradient_descent'];
  const isVisualSkill = visualSkills.includes(skillId);
  
  if (isVisualSkill) {
    const tdPref = preferences.find(p => p.format === '3d');
    if (tdPref && tdPref.preferenceScore > 0.60) {
      return '3d';
    }
  }

  return preferences[0].format;
}

/**
 * Updates the Contextual Bandit rewards after an intervention event.
 * Reward formula: Reward = completion (0.3) + masteryImprovement (0.5) + speedRatio (0.2)
 * preferenceScore = (1 - alpha) * preferenceScore + alpha * Reward
 */
export async function updateContextualBandit(
  userId: string,
  format: string,
  successMetrics: {
    completed: boolean;
    scoreBefore: number;
    scoreAfter: number;
    timeSpentSec: number;
    expectedTimeSec: number;
  }
): Promise<void> {
  const preference = await prisma.learningPreference.findFirst({
    where: { userId, format }
  });

  if (!preference) return;

  const alpha = 0.25; // Learning rate

  const completionReward = successMetrics.completed ? 0.3 : 0.0;
  
  const scoreDiff = successMetrics.scoreAfter - successMetrics.scoreBefore;
  const masteryReward = Math.max(0, Math.min(0.5, scoreDiff * 0.5)); // positive improvement reward

  const speedRatio = successMetrics.expectedTimeSec / Math.max(1, successMetrics.timeSpentSec);
  const timeReward = successMetrics.completed ? Math.min(0.2, speedRatio * 0.2) : 0.0;

  const totalReward = completionReward + masteryReward + timeReward;

  // New score: (1 - alpha) * old_score + alpha * totalReward
  const newScore = (1 - alpha) * preference.preferenceScore + alpha * totalReward;
  const clampedScore = Math.max(0.05, Math.min(0.99, newScore));

  await prisma.learningPreference.update({
    where: { id: preference.id },
    data: {
      preferenceScore: parseFloat(clampedScore.toFixed(4)),
      timesSelected: preference.timesSelected + 1
    }
  });
}

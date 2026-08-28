import prisma from '../db';
import { calculateBKT } from './knowledgeTracing';
import { predictRetention, predictStruggle, calculateCareerReadiness } from './predictiveEngine';
import { updateContextualBandit } from './recommendationEngine';

interface ProcessEventResult {
  eventType: string;
  skillId?: string;
  masteryUpdated: boolean;
  newMastery?: number;
  newConfidence?: number;
  roadmapAdapted: boolean;
  roadmapReason?: string;
}

/**
 * Closed-Loop Learning Twin telemetry processor.
 * Ingests learning events, updates BKT masteries, recalculates predictions,
 * and dynamically restructures the learning roadmap.
 */
export async function processLearningEvent(
  userId: string,
  eventType: string,
  skillId?: string,
  payload: any = {}
): Promise<ProcessEventResult> {
  // 1. Ensure we have an active Learning Session
  let activeSession = await prisma.learningSession.findFirst({
    where: { userId, endedAt: null },
    orderBy: { startedAt: 'desc' }
  });

  if (!activeSession) {
    activeSession = await prisma.learningSession.create({
      data: {
        userId,
        startedAt: new Date()
      }
    });
  }

  // 2. Persist the event in the database
  await prisma.learningEvent.create({
    data: {
      sessionId: activeSession.id,
      type: eventType,
      metadata: JSON.stringify(payload)
    }
  });

  let masteryUpdated = false;
  let newMasteryVal: number | undefined;
  let newConfidenceVal: number | undefined;
  let roadmapAdapted = false;
  let roadmapReason = '';

  const profile = await prisma.learnerProfile.findUnique({
    where: { userId },
    include: { skills: { include: { skill: true } } }
  });

  if (!profile) {
    return { eventType, skillId, masteryUpdated, roadmapAdapted };
  }

  // 3. Update variables based on Event Types
  if (eventType === 'question_answered' && skillId) {
    const { correct, questionId, selectedOption, mistakeType } = payload;

    // Log Attempt
    await prisma.attempt.create({
      data: {
        userId,
        questionId,
        answeredCorrectly: correct,
        selectedOption
      }
    });

    // Process mistake counters
    let mistake = await prisma.mistake.findFirst({
      where: { userId, skillId, errorType: mistakeType || 'conceptual' }
    });

    if (!correct) {
      if (!mistake) {
        mistake = await prisma.mistake.create({
          data: {
            userId,
            skillId,
            errorType: mistakeType || 'conceptual',
            count: 1
          }
        });
      } else {
        mistake = await prisma.mistake.update({
          where: { id: mistake.id },
          data: { count: mistake.count + 1, lastUpdated: new Date() }
        });
      }
    }

    const mistakeCount = mistake ? mistake.count : 0;
    const lsRecord = profile.skills.find(s => s.skillId === skillId);
    const priorMastery = lsRecord ? lsRecord.mastery : 0.15;

    // Math loop: run BKT updates
    const { mastery, confidence } = calculateBKT(priorMastery, correct, mistakeCount);
    newMasteryVal = mastery;
    newConfidenceVal = confidence;
    masteryUpdated = true;

    // Recalculate struggle probability
    const struggleProb = await predictStruggle(profile.id, skillId);

    // Save mastery to database
    if (lsRecord) {
      await prisma.learnerSkill.update({
        where: { id: lsRecord.id },
        data: {
          mastery,
          confidence,
          struggleProbability: struggleProb,
          lastPracticed: new Date()
        }
      });
    } else {
      await prisma.learnerSkill.create({
        data: {
          profileId: profile.id,
          skillId,
          mastery,
          confidence,
          retention: 0.95,
          struggleProbability: struggleProb,
          lastPracticed: new Date()
        }
      });
    }

    // Trigger dynamic revision triggers on roadmap
    if (!correct && mastery < 0.35) {
      const existingRevision = await prisma.revisionSchedule.findFirst({
        where: { userId, skillId, completed: false }
      });
      if (!existingRevision) {
        await prisma.revisionSchedule.create({
          data: {
            userId,
            skillId,
            scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
          }
        });
        roadmapAdapted = true;
        roadmapReason = `Roadmap updated: failing assessment on ${skillId} reduced mastery to ${Math.round(mastery * 100)}%. Prerequisite remediation schedule inserted.`;
      }
    }

    // If correct and previously scheduled for revision, resolve it
    if (correct && mastery >= 0.50) {
      const pendingRevision = await prisma.revisionSchedule.findFirst({
        where: { userId, skillId, completed: false }
      });
      if (pendingRevision) {
        await prisma.revisionSchedule.update({
          where: { id: pendingRevision.id },
          data: { completed: true }
        });
        roadmapAdapted = true;
        roadmapReason = `Roadmap updated: resolved prerequisite revision gap for ${skillId}. Successor nodes unlocked.`;
      }
    }
  }

  else if (eventType === 'visualization_completed' && skillId) {
    const { vizId, timeSpent, stepsCompleted, completed } = payload;

    const lsRecord = profile.skills.find(s => s.skillId === skillId);
    const scoreBefore = lsRecord ? lsRecord.mastery : 0.20;
    const scoreAfter = Math.min(0.95, scoreBefore + (completed ? 0.08 : 0.02));
    newMasteryVal = scoreAfter;
    newConfidenceVal = lsRecord ? lsRecord.confidence : 0.50;
    masteryUpdated = true;

    if (lsRecord) {
      await prisma.learnerSkill.update({
        where: { id: lsRecord.id },
        data: {
          mastery: scoreAfter,
          lastPracticed: new Date()
        }
      });
    }

    // Reinforce Contextual Bandit
    await updateContextualBandit(userId, '3d', {
      completed: Boolean(completed),
      scoreBefore,
      scoreAfter,
      timeSpentSec: timeSpent || 60,
      expectedTimeSec: 180
    });
  }

  else if (eventType === 'interview_completed') {
    const { score, feedback, skillId: interviewSkill } = payload;
    if (interviewSkill) {
      const lsRecord = profile.skills.find(s => s.skillId === interviewSkill);
      if (lsRecord) {
        const confAfter = Math.min(0.99, lsRecord.confidence + (score > 70 ? 0.05 : -0.05));
        newMasteryVal = lsRecord.mastery;
        newConfidenceVal = confAfter;
        masteryUpdated = true;

        await prisma.learnerSkill.update({
          where: { id: lsRecord.id },
          data: { confidence: confAfter }
        });
      }
    }
  }

  // 4. Update memory decays for forgetting prediction engine
  if (skillId) {
    const freshSkill = await prisma.learnerSkill.findFirst({
      where: { profileId: profile.id, skillId }
    });
    if (freshSkill) {
      const elapsedDays = (Date.now() - new Date(freshSkill.lastPracticed).getTime()) / (24 * 60 * 60 * 1000);
      const updatedRetention = predictRetention(freshSkill.mastery, elapsedDays);
      
      await prisma.learnerSkill.update({
        where: { id: freshSkill.id },
        data: { retention: updatedRetention }
      });
      
      // Update learning prediction tables
      const prediction = await prisma.learningPrediction.findFirst({
        where: { userId, skillId }
      });
      if (prediction) {
        await prisma.learningPrediction.update({
          where: { id: prediction.id },
          data: {
            struggleProbability: freshSkill.struggleProbability,
            predictedRetention: updatedRetention,
            calculatedAt: new Date()
          }
        });
      } else {
        await prisma.learningPrediction.create({
          data: {
            userId,
            skillId,
            struggleProbability: freshSkill.struggleProbability,
            forgettingDecayRate: 0.15,
            predictedRetention: updatedRetention
          }
        });
      }
    }
  }

  return {
    eventType,
    skillId,
    masteryUpdated,
    newMastery: newMasteryVal ? Math.round(newMasteryVal * 100) : undefined,
    newConfidence: newConfidenceVal ? Math.round(newConfidenceVal * 100) : undefined,
    roadmapAdapted,
    roadmapReason
  };
}

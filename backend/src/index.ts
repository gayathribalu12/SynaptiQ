import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import prisma from './db';
import { calculateBKT } from './services/knowledgeTracing';
import { predictRetention, predictStruggle, calculateCareerReadiness } from './services/predictiveEngine';
import { recommendNextAction, updateContextualBandit } from './services/recommendationEngine';
import { analyzeGoal, analyzeResume, tutorChat, generateProject, evaluateInterview } from './services/aiOrchestrator';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({
  contentSecurityPolicy: false // disable CSP for local easy routing and 3D textures if needed
}));
app.use(cors());
app.use(express.json());

// Helper to get default demo user Alex
async function getDemoUser() {
  const user = await prisma.user.findFirst({
    where: { email: 'alex@synaptiq.ai' }
  });
  if (!user) {
    throw new Error('Seed data missing. Run npm run db:seed first.');
  }
  return user;
}

// 1. Get Learner Profile & Twin Stats
app.get('/api/twin/dashboard', async (req, res) => {
  try {
    const user = await getDemoUser();
    const profile = await prisma.learnerProfile.findUnique({
      where: { userId: user.id },
      include: { careerGoals: true, skills: { include: { skill: true } } }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const goal = profile.careerGoals[0];
    const readinessResult = goal 
      ? await calculateCareerReadiness(profile.id, goal.id)
      : { overallScore: 0, breakdown: {} };

    // Calculate overall average mastery and retention
    let sumMastery = 0;
    let sumRetention = 0;
    let totalSkills = profile.skills.length;

    for (const ls of profile.skills) {
      sumMastery += ls.mastery;
      // Recalculate retention based on time elapsed
      const elapsedDays = (Date.now() - new Date(ls.lastPracticed).getTime()) / (24 * 60 * 60 * 1000);
      const repObj = await prisma.attempt.count({
        where: { userId: user.id, question: { skillId: ls.skillId } }
      });
      const updatedRet = predictRetention(ls.mastery, elapsedDays, Math.max(1, repObj));
      sumRetention += updatedRet;

      // Update retention in db in background
      await prisma.learnerSkill.update({
        where: { id: ls.id },
        data: { retention: updatedRet }
      });
    }

    const averageMastery = totalSkills > 0 ? sumMastery / totalSkills : 0;
    const averageRetention = totalSkills > 0 ? sumRetention / totalSkills : 0;

    // Get learning preferences
    const preferences = await prisma.learningPreference.findMany({
      where: { userId: user.id }
    });

    res.json({
      name: user.name,
      overallMastery: Math.round(averageMastery * 100),
      careerReadiness: readinessResult.overallScore,
      learningVelocity: 12, // mock constant progression rate
      retention: Math.round(averageRetention * 100),
      streak: 8,
      predictedSuccess: Math.round((averageMastery * 0.7 + averageRetention * 0.3) * 100),
      skills: profile.skills.map(ls => ({
        id: ls.skillId,
        name: ls.skill.name,
        category: ls.skill.category,
        mastery: Math.round(ls.mastery * 100),
        confidence: Math.round(ls.confidence * 100),
        retention: Math.round(ls.retention * 100),
        struggleProbability: Math.round(ls.struggleProbability * 100)
      })),
      preferences: preferences.reduce((acc, curr) => {
        acc[curr.format] = Math.round(curr.preferenceScore * 100);
        return acc;
      }, {} as Record<string, number>)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Skill Graph nodes and links
app.get('/api/skills/graph', async (req, res) => {
  try {
    const user = await getDemoUser();
    const profile = await prisma.learnerProfile.findUnique({
      where: { userId: user.id },
      include: { skills: true }
    });

    const dbSkills = await prisma.skill.findMany({
      include: { prerequisites: true }
    });

    const nodes = dbSkills.map(s => {
      const ls = profile?.skills.find(x => x.skillId === s.id);
      const mastery = ls ? ls.mastery : 0;
      
      let status = 'locked';
      if (mastery >= 0.85) status = 'mastered';
      else if (mastery >= 0.65) status = 'strong';
      else if (mastery >= 0.30) status = 'learning';
      else if (mastery > 0) status = 'weak';
      else {
        // check if prereqs are met
        const prereqs = s.prerequisites;
        const prereqsMet = prereqs.every(p => {
          const pls = profile?.skills.find(x => x.skillId === p.prerequisiteId);
          return pls && pls.mastery >= 0.50;
        });
        if (prereqsMet) status = 'unlocked';
      }

      return {
        id: s.id,
        name: s.name,
        category: s.category,
        mastery: Math.round(mastery * 100),
        status,
        difficulty: s.difficulty
      };
    });

    const links: { source: string; target: string }[] = [];
    for (const s of dbSkills) {
      for (const p of s.prerequisites) {
        links.push({
          source: p.prerequisiteId,
          target: s.id
        });
      }
    }

    res.json({ nodes, links });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Dynamic Adaptive Roadmap
app.get('/api/roadmap', async (req, res) => {
  try {
    const user = await getDemoUser();
    const profile = await prisma.learnerProfile.findUnique({
      where: { userId: user.id },
      include: { skills: { include: { skill: true } } }
    });

    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    // Build timeline milestones. We create months adaptive sequence.
    // Order skills by hierarchy: Python/Math first, ML/DSA intermediate, DL/NLP/RAG advanced
    const skills = [...profile.skills].sort((a, b) => {
      const diffMap: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3 };
      return diffMap[a.skill.difficulty] - diffMap[b.skill.difficulty];
    });

    const milestones = [
      { month: 1, title: 'Foundations & Tooling', skills: [] as any[] },
      { month: 2, title: 'Core Analytics & ML', skills: [] as any[] },
      { month: 3, title: 'Deep Learning Systems', skills: [] as any[] },
      { month: 4, title: 'Advanced Language Modeling', skills: [] as any[] },
      { month: 5, title: 'RAG & AI Architectures', skills: [] as any[] },
      { month: 6, title: 'Capstone & Career Readiness', skills: [] as any[] }
    ];

    for (const ls of skills) {
      const diff = ls.skill.difficulty;
      let month = 1;
      if (diff === 'beginner') month = 1;
      else if (ls.skillId === 'ml' || ls.skillId === 'statistics' || ls.skillId === 'probability' || ls.skillId === 'gradient_descent') month = 2;
      else if (ls.skillId === 'deep_learning') month = 3;
      else if (ls.skillId === 'nlp') month = 4;
      else if (ls.skillId === 'llm' || ls.skillId === 'rag') month = 5;
      else month = 6;

      milestones[month - 1].skills.push({
        id: ls.skillId,
        name: ls.skill.name,
        mastery: Math.round(ls.mastery * 100),
        status: ls.mastery >= 0.85 ? 'completed' : ls.mastery >= 0.30 ? 'in_progress' : 'locked'
      });
    }

    // Check if there are active revision items to dynamically insert
    const activeRevisions = await prisma.revisionSchedule.findMany({
      where: { userId: user.id, completed: false },
      include: { skill: true }
    });

    if (activeRevisions.length > 0) {
      // Dynamic insert revision milestone alert at Month 1 / active month
      milestones.unshift({
        month: 0,
        title: '⚠️ Dynamic Revision Interventions',
        skills: activeRevisions.map(r => ({
          id: r.skillId,
          name: `REVISE: ${r.skill.name}`,
          mastery: 0,
          status: 'revision_required'
        }))
      });
    }

    res.json({ milestones });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Onboarding Endpoints
app.post('/api/onboard/analyze-goal', async (req, res) => {
  const { goal } = req.body;
  if (!goal) return res.status(400).json({ error: 'Goal text is required' });

  try {
    const analysis = await analyzeGoal(goal);
    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/onboard/analyze-resume', async (req, res) => {
  const { text } = req.body;
  try {
    const skills = await analyzeResume(text || '');
    res.json({ skills });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Get Explainable Recommendation
app.get('/api/recommendation', async (req, res) => {
  try {
    const user = await getDemoUser();
    const rec = await recommendNextAction(user.id);
    
    // Save recommendation to database
    if (rec.recommendedResource) {
      await prisma.recommendation.create({
        data: {
          userId: user.id,
          resourceId: rec.recommendedResource.id,
          recommendedFormat: rec.recommendedFormat,
          confidenceScore: rec.confidence,
          whyReason: rec.reason
        }
      });
    }

    res.json(rec);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Contextual AI Tutor Chat
app.post('/api/tutor/chat', async (req, res) => {
  const { message, topic, mode, history } = req.body;
  try {
    const user = await getDemoUser();
    const response = await tutorChat(user.id, message, topic || 'general', mode || 'explain', history || []);
    
    // Save conversation log
    await prisma.conversation.create({
      data: {
        userId: user.id,
        topic: topic || 'general',
        messages: JSON.stringify([
          ...(history || []),
          { role: 'user', content: message },
          { role: 'assistant', content: response.text }
        ])
      }
    });

    res.json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Get Quiz Questions for Skill
app.get('/api/assessment/quiz', async (req, res) => {
  const { skillId } = req.query;
  try {
    const questions = await prisma.question.findMany({
      where: skillId ? { skillId: String(skillId) } : {}
    });

    // Format options before sending
    const formatted = questions.map(q => ({
      id: q.id,
      skillId: q.skillId,
      questionText: q.questionText,
      options: JSON.parse(q.options),
      difficulty: q.difficulty
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Submit Quiz Question - Updates Learning Twin via Bayesian Knowledge Tracing
app.post('/api/assessment/submit', async (req, res) => {
  const { questionId, selectedOption } = req.body;
  try {
    const user = await getDemoUser();
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { skill: true }
    });

    if (!question) return res.status(404).json({ error: 'Question not found' });

    const correct = question.correctOption === selectedOption;

    // Log the attempt
    await prisma.attempt.create({
      data: {
        userId: user.id,
        questionId: question.id,
        answeredCorrectly: correct,
        selectedOption
      }
    });

    // Look up mistake counts for this skill
    let mistake = await prisma.mistake.findFirst({
      where: { userId: user.id, skillId: question.skillId }
    });

    if (!correct) {
      if (!mistake) {
        mistake = await prisma.mistake.create({
          data: {
            userId: user.id,
            skillId: question.skillId,
            errorType: question.skillId === 'ml' ? 'overfitting' : 'conceptual',
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

    // Retrieve previous mastery
    const profile = await prisma.learnerProfile.findUnique({
      where: { userId: user.id }
    });

    if (!profile) return res.status(404).json({ error: 'Learner profile not found' });

    const learnerSkill = await prisma.learnerSkill.findFirst({
      where: { profileId: profile.id, skillId: question.skillId }
    });

    const currentMastery = learnerSkill ? learnerSkill.mastery : 0.15; // default prior

    // Run BKT calculations!
    const { mastery, confidence } = calculateBKT(currentMastery, correct, mistakeCount);

    // Predict upcoming struggle
    const struggleProb = await predictStruggle(profile.id, question.skillId);

    // Update the Learning Twin database profile
    if (learnerSkill) {
      await prisma.learnerSkill.update({
        where: { id: learnerSkill.id },
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
          skillId: question.skillId,
          mastery,
          confidence,
          retention: 0.95,
          struggleProbability: struggleProb,
          lastPracticed: new Date()
        }
      });
    }

    // Dynamic Roadmap adaptation trigger: 
    // If they got it wrong and mastery falls below 0.35, insert revision schedule
    if (!correct && mastery < 0.35) {
      const existingRevision = await prisma.revisionSchedule.findFirst({
        where: { userId: user.id, skillId: question.skillId, completed: false }
      });
      if (!existingRevision) {
        await prisma.revisionSchedule.create({
          data: {
            userId: user.id,
            skillId: question.skillId,
            scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // in 2 days
          }
        });
      }
    }

    res.json({
      correct,
      correctOption: question.correctOption,
      feedback: correct 
        ? 'Correct answer! Your skill mastery has increased.' 
        : `Incorrect. Your Learning Twin detected a gap in ${question.skill.name}. Prerequisite revision is recommended.`,
      newMastery: Math.round(mastery * 100),
      newConfidence: Math.round(confidence * 100)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 9. 3D Lab Interaction Telemetry - Contextual Bandit loop update
app.post('/api/visualization/interact', async (req, res) => {
  const { vizId, timeSpent, stepsCompleted, completed } = req.body;
  try {
    const user = await getDemoUser();
    const viz = await prisma.visualization.findUnique({
      where: { id: vizId }
    });

    if (!viz) return res.status(404).json({ error: 'Visualization not found' });

    // Track the interaction event
    await prisma.visualizationInteraction.create({
      data: {
        userId: user.id,
        visualizationId: viz.id,
        timeSpent: Number(timeSpent || 0),
        stepsCompleted: Number(stepsCompleted || 0),
        completed: Boolean(completed)
      }
    });

    // Update Contextual Bandit preference score
    // In our seed, 3D visual has baseline score. If student completes this step-by-step 3D,
    // we increase 3D preference weight.
    const profile = await prisma.learnerProfile.findUnique({
      where: { userId: user.id }
    });

    const learnerSkill = await prisma.learnerSkill.findFirst({
      where: { profileId: profile!.id, skillId: viz.skillId }
    });

    const scoreBefore = learnerSkill ? learnerSkill.mastery : 0.2;
    // Boost mastery slightly by viewing the visual representation (Visual learning effectiveness)
    const scoreAfter = Math.min(0.95, scoreBefore + (completed ? 0.08 : 0.02));

    if (learnerSkill) {
      await prisma.learnerSkill.update({
        where: { id: learnerSkill.id },
        data: { 
          mastery: scoreAfter,
          lastPracticed: new Date()
        }
      });
    }

    // Trigger Bandit preferences reinforcement learning update!
    await updateContextualBandit(user.id, '3d', {
      completed: Boolean(completed),
      scoreBefore,
      scoreAfter,
      timeSpentSec: Number(timeSpent || 60),
      expectedTimeSec: 180 // Expect 3 minutes for deep interaction
    });

    res.json({
      success: true,
      masteryBoost: Math.round((scoreAfter - scoreBefore) * 100),
      message: 'Learning Twin telemetry updated with 3D interaction metrics.'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Generate AI Project
app.get('/api/project/generate', async (req, res) => {
  const { skillId } = req.query;
  try {
    const user = await getDemoUser();
    const proj = await generateProject(user.id, String(skillId || 'ml'));

    // Save project
    const dbProj = await prisma.project.create({
      data: {
        userId: user.id,
        title: proj.title,
        difficulty: proj.difficulty,
        problemStatement: proj.problemStatement,
        requirements: proj.requirements,
        milestones: proj.milestones,
        skillsUsed: proj.skillsUsed,
        status: 'started'
      }
    });

    res.json({
      ...proj,
      id: dbProj.id,
      requirements: JSON.parse(proj.requirements),
      milestones: JSON.parse(proj.milestones),
      skillsUsed: JSON.parse(proj.skillsUsed)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 11. Interview Simulation
app.post('/api/interview/evaluate', async (req, res) => {
  const { question, answer } = req.body;
  try {
    const user = await getDemoUser();
    const evalRes = await evaluateInterview(question, answer);

    // Save interview log
    await prisma.interview.create({
      data: {
        userId: user.id,
        type: 'technical',
        transcript: JSON.stringify([{ role: 'interviewer', content: question }, { role: 'user', content: answer }]),
        score: evalRes.score,
        feedback: evalRes.feedback
      }
    });

    // Update Career Readiness telemetry based on interview performance
    if (evalRes.score > 70) {
      // Find ML skill and boost confidence
      const profile = await prisma.learnerProfile.findUnique({
        where: { userId: user.id }
      });
      if (profile) {
        const mlSkill = await prisma.learnerSkill.findFirst({
          where: { profileId: profile.id, skillId: 'ml' }
        });
        if (mlSkill) {
          await prisma.learnerSkill.update({
            where: { id: mlSkill.id },
            data: { confidence: Math.min(0.99, mlSkill.confidence + 0.05) }
          });
        }
      }
    }

    res.json(evalRes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`SynaptiQ server running on port ${PORT}`);
});

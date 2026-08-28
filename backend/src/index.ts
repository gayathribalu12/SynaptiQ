import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import prisma from './db';
import { calculateBKT } from './services/knowledgeTracing';
import { predictRetention, predictStruggle, calculateCareerReadiness } from './services/predictiveEngine';
import { recommendNextAction } from './services/recommendationEngine';
import { selectOptimalFormatAI } from './services/optimalVisualLearning';
import { processLearningEvent } from './services/learningTwinService';
import { analyzeGoal, analyzeResume, tutorChat, generateProject, evaluateInterview, getMisconceptionIntervention } from './services/aiOrchestrator';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({
  contentSecurityPolicy: false
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

// 1. Unified Event Ingestion Endpoint
app.post('/api/events', async (req, res) => {
  const { eventType, skillId, payload } = req.body;
  try {
    const user = await getDemoUser();
    
    // Process the telemetry update in the learning twin loop
    const result = await processLearningEvent(user.id, eventType, skillId, payload);
    
    res.json({
      success: true,
      message: 'Learning Event tracked and twin state synchronized.',
      result
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get Learner Profile & Twin Stats
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

    let sumMastery = 0;
    let sumRetention = 0;
    let totalSkills = profile.skills.length;

    for (const ls of profile.skills) {
      sumMastery += ls.mastery;
      const elapsedDays = (Date.now() - new Date(ls.lastPracticed).getTime()) / (24 * 60 * 60 * 1000);
      const repObj = await prisma.attempt.count({
        where: { userId: user.id, question: { skillId: ls.skillId } }
      });
      const updatedRet = predictRetention(ls.mastery, elapsedDays, Math.max(1, repObj));
      sumRetention += updatedRet;

      await prisma.learnerSkill.update({
        where: { id: ls.id },
        data: { retention: updatedRet }
      });
    }

    const averageMastery = totalSkills > 0 ? sumMastery / totalSkills : 0;
    const averageRetention = totalSkills > 0 ? sumRetention / totalSkills : 0;

    const preferences = await prisma.learningPreference.findMany({
      where: { userId: user.id }
    });

    // Check if there are recurring mistakes for trace overlay
    const mistakes = await prisma.mistake.findMany({
      where: { userId: user.id }
    });

    res.json({
      name: user.name,
      overallMastery: Math.round(averageMastery * 100),
      careerReadiness: readinessResult.overallScore,
      learningVelocity: 12,
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
      }, {} as Record<string, number>),
      mistakes: mistakes.map(m => ({
        skillId: m.skillId,
        errorType: m.errorType,
        count: m.count
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Skill Graph nodes and links
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

// 4. Dynamic Adaptive Roadmap
app.get('/api/roadmap', async (req, res) => {
  try {
    const user = await getDemoUser();
    const profile = await prisma.learnerProfile.findUnique({
      where: { userId: user.id },
      include: { skills: { include: { skill: true } } }
    });

    if (!profile) return res.status(404).json({ error: 'Profile not found' });

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

    const activeRevisions = await prisma.revisionSchedule.findMany({
      where: { userId: user.id, completed: false },
      include: { skill: true }
    });

    let adapted = false;
    let adaptationReason = '';

    if (activeRevisions.length > 0) {
      adapted = true;
      adaptationReason = `Prerequisite gap flagged in ${activeRevisions[0].skill.name}. Pause successor milestones to resolve weakness.`;
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

    res.json({ milestones, adapted, adaptationReason });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Get Learner-Specific Optimal Learning Format AI Decision
app.get('/api/optimal-format', async (req, res) => {
  const { skillId } = req.query;
  try {
    const user = await getDemoUser();
    const decision = await selectOptimalFormatAI(user.id, String(skillId || 'ml'));
    res.json(decision);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Get Misconception Targeted Intervention
app.get('/api/misconceptions/intervention', async (req, res) => {
  const { skillId } = req.query;
  try {
    const user = await getDemoUser();
    const intervention = await getMisconceptionIntervention(user.id, String(skillId || 'ml'));
    res.json({ intervention });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Grounded RAG Document Chunk Upload
app.post('/api/documents/upload', async (req, res) => {
  const { filename, content } = req.body;
  try {
    const user = await getDemoUser();
    const doc = await prisma.document.create({
      data: {
        userId: user.id,
        filename: filename || 'notes.txt',
        filetype: 'text',
        content: content || ''
      }
    });

    // Chunk by paragraphs
    const paragraphs = content.split('\n').filter((p: string) => p.trim().length > 10);
    for (let i = 0; i < paragraphs.length; i++) {
      await prisma.documentChunk.create({
        data: {
          documentId: doc.id,
          chunkIndex: i,
          content: paragraphs[i].trim(),
          embedding: '0.0' // baseline placeholder
        }
      });
    }

    res.json({ success: true, documentId: doc.id, chunksCreated: paragraphs.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Onboarding Endpoints
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

// 9. Get Explainable Recommendation
app.get('/api/recommendation', async (req, res) => {
  try {
    const user = await getDemoUser();
    const rec = await recommendNextAction(user.id);
    res.json(rec);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Contextual AI Tutor Chat
app.post('/api/tutor/chat', async (req, res) => {
  const { message, topic, mode, history } = req.body;
  try {
    const user = await getDemoUser();
    const response = await tutorChat(user.id, message, topic || 'general', mode || 'explain', history || []);
    res.json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 11. Get Quiz Questions for Skill
app.get('/api/assessment/quiz', async (req, res) => {
  const { skillId } = req.query;
  try {
    const questions = await prisma.question.findMany({
      where: skillId ? { skillId: String(skillId) } : {}
    });

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

// 12. Submit Quiz Question - Reroutes directly through our closed-loop Event Telemetry pipeline
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

    // Direct event pipeline call
    const eventRes = await processLearningEvent(user.id, 'question_answered', question.skillId, {
      correct,
      questionId,
      selectedOption,
      mistakeType: question.skillId === 'ml' ? 'overfitting' : question.skillId === 'gradient_descent' ? 'learning_rate_overshoot' : 'conceptual'
    });

    res.json({
      correct,
      correctOption: question.correctOption,
      feedback: correct 
        ? 'Correct answer! Your skill mastery has increased.' 
        : `Incorrect. Your Learning Twin detected a gap in ${question.skill.name}. Prerequisite revision is recommended.`,
      newMastery: eventRes.newMastery,
      newConfidence: eventRes.newConfidence,
      roadmapAdapted: eventRes.roadmapAdapted,
      roadmapReason: eventRes.roadmapReason
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 13. 3D Lab Interaction Telemetry - Reroutes directly through Event Telemetry pipeline
app.post('/api/visualization/interact', async (req, res) => {
  const { vizId, timeSpent, stepsCompleted, completed } = req.body;
  try {
    const user = await getDemoUser();
    const viz = await prisma.visualization.findUnique({
      where: { id: vizId }
    });

    if (!viz) return res.status(404).json({ error: 'Visualization not found' });

    // Track the interaction using unified pipeline
    const eventRes = await processLearningEvent(user.id, 'visualization_completed', viz.skillId, {
      vizId,
      timeSpent: Number(timeSpent || 60),
      stepsCompleted: Number(stepsCompleted || 0),
      completed: Boolean(completed)
    });

    res.json({
      success: true,
      masteryBoost: eventRes.newMastery,
      message: 'Learning Twin telemetry updated with 3D interaction metrics.'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 14. Generate AI Project
app.get('/api/project/generate', async (req, res) => {
  const { skillId } = req.query;
  try {
    const user = await getDemoUser();
    const proj = await generateProject(user.id, String(skillId || 'ml'));

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

// 15. Interview Evaluation Evaluator
app.post('/api/interview/evaluate', async (req, res) => {
  const { question, answer, skillId } = req.body;
  try {
    const user = await getDemoUser();
    const evalRes = await evaluateInterview(question, answer);

    // Direct event pipeline call
    await processLearningEvent(user.id, 'interview_completed', skillId || 'ml', {
      score: evalRes.score,
      feedback: evalRes.feedback
    });

    res.json(evalRes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`SynaptiQ server running on port ${PORT}`);
});

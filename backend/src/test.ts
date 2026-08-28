import prisma from './db';
import { calculateStandardBKT, calculateEnhancedLearnerState, calculateBKT } from './services/knowledgeTracing';
import { predictRetention, predictStruggle } from './services/predictiveEngine';
import { selectOptimalFormatAI } from './services/optimalVisualLearning';
import { updateContextualBandit } from './services/recommendationEngine';
import { processLearningEvent } from './services/learningTwinService';
import { retrieveDocumentChunks, getMisconceptionIntervention } from './services/aiOrchestrator';

async function runTests() {
  console.log('===================================================');
  console.log('   🚀 RUNNING SYNAPTIQ ADAPTIVE ENGINE TEST SUITE  ');
  console.log('===================================================');

  let testUser: any = null;
  let testProfile: any = null;

  try {
    // Setup temporary test user
    console.log('\n[Setup] Provisioning temporary sandbox user...');
    testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@synaptiq.ai`,
        name: 'Test Learner',
        passwordHash: 'dummy-hash'
      }
    });

    testProfile = await prisma.learnerProfile.create({
      data: {
        userId: testUser.id,
        educationLevel: 'professional',
        branchField: 'Computer Science',
        experienceLevel: 'intermediate',
        dailyAvailability: 30,
        timelineMonths: 6
      }
    });

    // Seed skill masteries for test
    await prisma.learnerSkill.create({
      data: {
        profileId: testProfile.id,
        skillId: 'gradient_descent',
        mastery: 0.35,
        confidence: 0.40,
        retention: 0.90,
        struggleProbability: 0.50
      }
    });

    await prisma.learnerSkill.create({
      data: {
        profileId: testProfile.id,
        skillId: 'ml',
        mastery: 0.20,
        confidence: 0.30,
        retention: 0.85,
        struggleProbability: 0.70
      }
    });

    // Seed test-q question for foreign key checks
    await prisma.question.upsert({
      where: { id: 'test-q' },
      update: {},
      create: {
        id: 'test-q',
        skillId: 'ml',
        questionText: 'Test Question Text?',
        options: JSON.stringify(['Option A', 'Option B']),
        correctOption: 1,
        difficulty: 'intermediate'
      }
    });

    // Seed format preferences
    const formats = ['3d', 'code', 'video', 'text'];
    for (const f of formats) {
      await prisma.learningPreference.create({
        data: {
          userId: testUser.id,
          format: f,
          preferenceScore: 0.50,
          timesSelected: 0
        }
      });
    }

    console.log('🟢 Setup complete.');

    // 1. Verify standard BKT convergence
    console.log('\n[1] Testing Standard BKT mathematical properties...');
    const mastery0 = 0.30;
    const correct1 = calculateStandardBKT(mastery0, true);
    const correct2 = calculateStandardBKT(correct1, true);
    const correct3 = calculateStandardBKT(correct2, true);
    const incorrect1 = calculateStandardBKT(mastery0, false);

    console.log(`- Start: ${mastery0} -> After 1 Correct: ${correct1} -> After 3 Correct: ${correct3}`);
    console.log(`- After 1 Incorrect: ${incorrect1}`);

    if (correct1 > mastery0 && correct3 > correct1 && incorrect1 < mastery0 && correct3 > 0.65) {
      console.log('🟢 SUCCESS: BKT converges upward on correct answers and drops on mistakes.');
    } else {
      throw new Error('BKT math failure.');
    }

    // 2. Verify forgetting decay curves
    console.log('\n[2] Testing Spaced Repetition Forgetting Curve (R = e^(-lambda * t)):');
    const startM = 0.80;
    const r0 = predictRetention(startM, 0);
    const r5 = predictRetention(startM, 5);
    const r15 = predictRetention(startM, 15);

    console.log(`- Elapsed Days: 0 -> Retention: ${Math.round(r0 * 100)}%`);
    console.log(`- Elapsed Days: 5 -> Retention: ${Math.round(r5 * 100)}%`);
    console.log(`- Elapsed Days: 15 -> Retention: ${Math.round(r15 * 100)}%`);

    if (r0 === 1.0 && r5 > r15 && r15 < 0.80) {
      console.log('🟢 SUCCESS: Memory decays exponentially over elapsed duration.');
    } else {
      throw new Error('Forgetting curve math failure.');
    }

    // 3. Verify Struggle prediction alerts
    console.log('\n[3] Testing Prerequisite Struggle Risk prediction:');
    const struggleVal = await predictStruggle(testProfile.id, 'ml');
    console.log(`- Prerequisite low mastery (35%) struggle risk: ${Math.round(struggleVal * 100)}%`);
    if (struggleVal > 0.60) {
      console.log('🟢 SUCCESS: Struggle risk correctly flags prerequisite bottlenecks.');
    } else {
      throw new Error('Struggle prediction model failure.');
    }

    // 4. Verify Contextual Bandit updates
    console.log('\n[4] Testing Contextual Bandit outcome-based reinforcement updates:');
    const prefBefore = await prisma.learningPreference.findFirst({
      where: { userId: testUser.id, format: '3d' }
    });
    
    // Trigger successful engagement outcomes
    await updateContextualBandit(testUser.id, '3d', {
      completed: true,
      scoreBefore: 0.05,
      scoreAfter: 0.95,
      timeSpentSec: 175,
      expectedTimeSec: 180
    });

    const prefAfter = await prisma.learningPreference.findFirst({
      where: { userId: testUser.id, format: '3d' }
    });

    console.log(`- Preference Score: Before = ${prefBefore?.preferenceScore} -> After = ${prefAfter?.preferenceScore}`);
    if (prefAfter && prefBefore && prefAfter.preferenceScore > prefBefore.preferenceScore) {
      console.log('🟢 SUCCESS: Contextual bandit correctly reinforces successful outcomes.');
    } else {
      throw new Error('Bandit reward update failure.');
    }

    // 5. Verify Optimal Format selection
    console.log('\n[5] Testing Optimal Visual Learning AI selection:');
    const decision3D = await selectOptimalFormatAI(testUser.id, 'gradient_descent');
    console.log(`- Low mastery GD decision: Format = ${decision3D.format.toUpperCase()} (Confidence: ${decision3D.confidence})`);
    
    // Change preferences to code
    await prisma.learningPreference.updateMany({
      where: { userId: testUser.id, format: 'code' },
      data: { preferenceScore: 0.95 }
    });

    const decisionCode = await selectOptimalFormatAI(testUser.id, 'gradient_descent');
    console.log(`- Updated coder preference decision: Format = ${decisionCode.format.toUpperCase()}`);

    if (decision3D.format !== decisionCode.format) {
      console.log('🟢 SUCCESS: Optimal Format selection is learner-specific and dynamic.');
    } else {
      throw new Error('Optimal Format selection failure.');
    }

    // 6. Verify Mistake Interventions
    console.log('\n[6] Testing Misconception Engine Interventions:');
    await prisma.mistake.create({
      data: {
        userId: testUser.id,
        skillId: 'gradient_descent',
        errorType: 'learning_rate_overshoot',
        count: 2
      }
    });

    const intervention = await getMisconceptionIntervention(testUser.id, 'gradient_descent');
    console.log(`- Triggered Explanation: "${intervention?.explanation.slice(0, 70)}..."`);
    if (intervention && intervention.questions.length > 0) {
      console.log('🟢 SUCCESS: Repeated mistakes trigger customized cognitive interventions.');
    } else {
      throw new Error('Misconception intervention failure.');
    }

    // 7. Verify RAG document search
    console.log('\n[7] Testing Document Grounded RAG query retriever:');
    const testDoc = await prisma.document.create({
      data: {
        userId: testUser.id,
        filename: 'vector_calculus.txt',
        filetype: 'text',
        content: 'Gradient updates adjust model weights. Derivatives indicate direction of steepest ascent.'
      }
    });

    await prisma.documentChunk.create({
      data: {
        documentId: testDoc.id,
        chunkIndex: 0,
        content: 'Derivatives indicate direction of steepest ascent.',
        embedding: '0.0'
      }
    });

    const matches = await retrieveDocumentChunks(testUser.id, 'What is steepest ascent and derivatives?');
    console.log(`- Match found: "${matches[0]}"`);
    if (matches.length > 0 && matches[0].includes('steepest')) {
      console.log('🟢 SUCCESS: Lexical RAG retriever fetches correct chunks.');
    } else {
      throw new Error('RAG search retrieval failure.');
    }

    // 8. Verify Event Telemetry loop updates
    console.log('\n[8] Testing Event Telemetry closed-loop twin update:');
    
    // Simulate answering quiz correctly
    const res = await processLearningEvent(testUser.id, 'question_answered', 'ml', {
      correct: true,
      questionId: 'test-q',
      selectedOption: 1
    });

    console.log(`- Quiz submit event -> Mastery updated = ${res.masteryUpdated}, New Mastery = ${res.newMastery}%`);
    if (res.masteryUpdated && res.newMastery && res.newMastery > 20) {
      console.log('🟢 SUCCESS: Learning events trigger closed-loop twin updates.');
    } else {
      throw new Error('Closed-loop event processor failure.');
    }

    console.log('\n===================================================');
    console.log('   ✓ ALL SYNAPTIQ ADAPTIVE CHECKS PASSED SUCCESSFULLY  ');
    console.log('===================================================');

  } catch (error: any) {
    console.error('\n🔴 TESTING EXCEPTION ENCOUNTERED:');
    console.error(error.message);
    process.exit(1);
  } finally {
    // Cleanup sandbox records
    if (testUser) {
      console.log('\n[Cleanup] Removing temporary sandbox records...');
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
      console.log('🟢 Cleanup complete.');
    }
  }
}

runTests();

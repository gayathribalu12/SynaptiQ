import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data (in order of dependencies)
  await prisma.visualizationInteraction.deleteMany({});
  await prisma.visualization.deleteMany({});
  await prisma.attempt.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.mistake.deleteMany({});
  await prisma.revisionSchedule.deleteMany({});
  await prisma.learningPrediction.deleteMany({});
  await prisma.learningPreference.deleteMany({});
  await prisma.recommendation.deleteMany({});
  await prisma.resource.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.learnerSkill.deleteMany({});
  await prisma.careerSkill.deleteMany({});
  await prisma.careerGoal.deleteMany({});
  await prisma.learnerProfile.deleteMany({});
  await prisma.learningEvent.deleteMany({});
  await prisma.learningSession.deleteMany({});
  await prisma.documentChunk.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.interview.deleteMany({});
  await prisma.skillPrerequisite.deleteMany({});
  await prisma.skill.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create Skills
  const skillsData = [
    { id: 'python', name: 'Python Programming', category: 'Programming', difficulty: 'beginner' },
    { id: 'dsa', name: 'Data Structures & Algorithms', category: 'Programming', difficulty: 'intermediate' },
    { id: 'mathematics', name: 'Mathematics for AI', category: 'Math', difficulty: 'beginner' },
    { id: 'statistics', name: 'Applied Statistics', category: 'Math', difficulty: 'intermediate' },
    { id: 'probability', name: 'Probability Theory', category: 'Math', difficulty: 'intermediate' },
    { id: 'ml', name: 'Machine Learning Fundamentals', category: 'AI', difficulty: 'intermediate' },
    { id: 'deep_learning', name: 'Deep Learning & Neural Networks', category: 'AI', difficulty: 'advanced' },
    { id: 'nlp', name: 'Natural Language Processing', category: 'AI', difficulty: 'advanced' },
    { id: 'llm', name: 'Large Language Models (LLMs)', category: 'AI', difficulty: 'advanced' },
    { id: 'rag', name: 'Retrieval-Augmented Generation (RAG)', category: 'AI', difficulty: 'advanced' },
    { id: 'ai_agents', name: 'AI Agentic Workflows', category: 'AI', difficulty: 'advanced' },
    { id: 'gradient_descent', name: 'Gradient Descent Optimization', category: 'Math', difficulty: 'intermediate' }
  ];

  const skills = [];
  for (const s of skillsData) {
    const skill = await prisma.skill.create({ data: s });
    skills.push(skill);
  }
  console.log(`Seeded ${skills.length} skills.`);

  // 2. Create Skill Prerequisites
  const prereqs = [
    { skillId: 'dsa', prerequisiteId: 'python' },
    { skillId: 'statistics', prerequisiteId: 'mathematics' },
    { skillId: 'probability', prerequisiteId: 'mathematics' },
    { skillId: 'gradient_descent', prerequisiteId: 'mathematics' },
    { skillId: 'ml', prerequisiteId: 'python' },
    { skillId: 'ml', prerequisiteId: 'statistics' },
    { skillId: 'ml', prerequisiteId: 'gradient_descent' },
    { skillId: 'deep_learning', prerequisiteId: 'ml' },
    { skillId: 'deep_learning', prerequisiteId: 'gradient_descent' },
    { skillId: 'nlp', prerequisiteId: 'deep_learning' },
    { skillId: 'llm', prerequisiteId: 'nlp' },
    { skillId: 'rag', prerequisiteId: 'llm' },
    { skillId: 'ai_agents', prerequisiteId: 'llm' }
  ];

  for (const p of prereqs) {
    await prisma.skillPrerequisite.create({ data: p });
  }
  console.log(`Seeded ${prereqs.length} prerequisites.`);

  // 3. Create Visualizations
  const vizData = [
    { id: 'binary_tree', skillId: 'dsa', name: '3D Binary Search Tree', description: 'Interactive insertion, deletion and traversals of a binary tree' },
    { id: 'linked_list', skillId: 'dsa', name: '3D Linked List', description: 'Visual pointer tracking for insertion and deletion' },
    { id: 'graph', skillId: 'dsa', name: '3D Graph BFS/DFS', description: 'Visualizing Dijkstra and graph traversal algorithms' },
    { id: 'neural_network', skillId: 'deep_learning', name: '3D Feedforward Neural Network', description: 'Visualize layers, weights, and forward pass signals' },
    { id: 'gradient_descent', skillId: 'gradient_descent', name: '3D Loss Surface and Descent', description: 'Descent steps on a custom loss surface with adjustable learning rates' }
  ];

  for (const v of vizData) {
    await prisma.visualization.create({ data: v });
  }
  console.log(`Seeded ${vizData.length} visualizations.`);

  // 4. Create Standard Courses & Resources
  const course = await prisma.course.create({
    data: {
      title: 'AI Engineer Curriculum',
      description: 'The complete path from Python beginner to AI deployment engineer.'
    }
  });

  const resourcesData = [
    { title: 'Python Syntax & Basics', type: 'text', url: 'https://docs.python.org/3/tutorial/', skillId: 'python', difficulty: 'beginner' },
    { title: 'Interactive Python Coding Lab', type: 'code', url: 'https://learnpython.org', skillId: 'python', difficulty: 'beginner' },
    { title: 'Visual Data Structures', type: '3d', url: 'viz:binary_tree', skillId: 'dsa', difficulty: 'intermediate' },
    { title: 'Probability Theory Essentials', type: 'video', url: 'https://youtube.com/probability', skillId: 'probability', difficulty: 'intermediate' },
    { title: 'Interactive Gradient Descent Simulator', type: '3d', url: 'viz:gradient_descent', skillId: 'gradient_descent', difficulty: 'intermediate' },
    { title: 'Linear Regression & Classification', type: 'video', url: 'https://youtube.com/ml_basics', skillId: 'ml', difficulty: 'intermediate' },
    { title: 'Neural Networks from Scratch', type: 'code', url: 'https://github.com/nn_basics', skillId: 'deep_learning', difficulty: 'advanced' },
    { title: 'Deep Neural Network 3D Connections', type: '3d', url: 'viz:neural_network', skillId: 'deep_learning', difficulty: 'advanced' },
    { title: 'Building Transformer Models', type: 'text', url: 'https://huggingface.co/blog', skillId: 'llm', difficulty: 'advanced' },
    { title: 'Modern RAG System Design', type: 'text', url: 'https://rag-design.com', skillId: 'rag', difficulty: 'advanced' }
  ];

  for (const r of resourcesData) {
    await prisma.resource.create({
      data: {
        ...r,
        courseId: course.id
      }
    });
  }
  console.log(`Seeded ${resourcesData.length} learning resources.`);

  // 5. Create Questions
  const questionsData = [
    // Probability questions
    {
      skillId: 'probability',
      questionText: 'What is the probability of rolling a sum of 7 with two fair six-sided dice?',
      options: JSON.stringify(['1/12', '1/6', '1/9', '5/36']),
      correctOption: 1, // 1/6
      difficulty: 'intermediate'
    },
    {
      skillId: 'probability',
      questionText: 'Which probability distribution represents the number of successes in a sequence of independent yes/no trials?',
      options: JSON.stringify(['Normal', 'Poisson', 'Binomial', 'Exponential']),
      correctOption: 2, // Binomial
      difficulty: 'intermediate'
    },
    // ML/Overfitting questions
    {
      skillId: 'ml',
      questionText: 'If a model has high training accuracy but very low validation accuracy, it is likely suffering from:',
      options: JSON.stringify(['Underfitting', 'Overfitting', 'High Bias', 'Vanishing Gradients']),
      correctOption: 1, // Overfitting
      difficulty: 'intermediate'
    },
    {
      skillId: 'ml',
      questionText: 'Which technique is primarily used to mitigate overfitting by penalizing large model coefficients?',
      options: JSON.stringify(['Data Augmentation', 'Regularization (L1/L2)', 'Increasing learning rate', 'Principal Component Analysis']),
      correctOption: 1, // Regularization
      difficulty: 'intermediate'
    },
    // Gradient descent questions
    {
      skillId: 'gradient_descent',
      questionText: 'What happens if the learning rate in Gradient Descent is set to a value that is too large?',
      options: JSON.stringify(['The model will converge slowly', 'The algorithm will overshoot and may diverge', 'The model will hit a local minimum immediately', 'Nothing, it is automatically corrected']),
      correctOption: 1, // overshoot/diverge
      difficulty: 'intermediate'
    },
    {
      skillId: 'gradient_descent',
      questionText: 'In optimization, what does the gradient vector point towards?',
      options: JSON.stringify(['The direction of steepest decrease', 'The direction of steepest increase', 'The global saddle point', 'The direction of constant loss']),
      correctOption: 1, // direction of steepest increase
      difficulty: 'intermediate'
    }
  ];

  for (const q of questionsData) {
    await prisma.question.create({ data: q });
  }
  console.log(`Seeded ${questionsData.length} assessment questions.`);

  // 6. Create Demo User: Alex
  const alexUser = await prisma.user.create({
    data: {
      email: 'alex@synaptiq.ai',
      name: 'Alex',
      passwordHash: '$2b$10$wK1WwzT3gQ7gK8L2s8.w.O5vDmgUfM6QhIuDskc/U4R7N23G9B9G6' // dummy hash
    }
  });

  const alexProfile = await prisma.learnerProfile.create({
    data: {
      userId: alexUser.id,
      educationLevel: 'undergraduate',
      branchField: 'Computer Science',
      experienceLevel: 'intermediate',
      dailyAvailability: 60, // 1 hour
      timelineMonths: 6 // 6 months
    }
  });

  const alexGoal = await prisma.careerGoal.create({
    data: {
      profileId: alexProfile.id,
      careerTitle: 'AI Engineer',
      targetCompetency: 'internship'
    }
  });

  // Required skills for AI Engineer competency model
  const careerSkillsMapping = [
    { skillId: 'python', requiredMastery: 0.90 },
    { skillId: 'dsa', requiredMastery: 0.80 },
    { skillId: 'mathematics', requiredMastery: 0.75 },
    { skillId: 'statistics', requiredMastery: 0.80 },
    { skillId: 'probability', requiredMastery: 0.80 },
    { skillId: 'gradient_descent', requiredMastery: 0.85 },
    { skillId: 'ml', requiredMastery: 0.85 },
    { skillId: 'deep_learning', requiredMastery: 0.80 },
    { skillId: 'nlp', requiredMastery: 0.75 },
    { skillId: 'llm', requiredMastery: 0.70 },
    { skillId: 'rag', requiredMastery: 0.75 },
    { skillId: 'ai_agents', requiredMastery: 0.70 }
  ];

  for (const cs of careerSkillsMapping) {
    await prisma.careerSkill.create({
      data: {
        careerGoalId: alexGoal.id,
        skillId: cs.skillId,
        requiredMastery: cs.requiredMastery
      }
    });
  }

  // Alex's initial mastery states (Section 49: Python 82%, DSA 70%, Stats 42%, ML 35%, DL 18%)
  const initialMasteries = [
    { skillId: 'python', mastery: 0.82, confidence: 0.85, retention: 0.90, struggleProbability: 0.05 },
    { skillId: 'dsa', mastery: 0.70, confidence: 0.75, retention: 0.85, struggleProbability: 0.15 },
    { skillId: 'mathematics', mastery: 0.60, confidence: 0.60, retention: 0.75, struggleProbability: 0.20 },
    { skillId: 'statistics', mastery: 0.42, confidence: 0.45, retention: 0.60, struggleProbability: 0.45 },
    { skillId: 'probability', mastery: 0.38, confidence: 0.35, retention: 0.50, struggleProbability: 0.60 },
    { skillId: 'gradient_descent', mastery: 0.30, confidence: 0.25, retention: 0.40, struggleProbability: 0.70 },
    { skillId: 'ml', mastery: 0.35, confidence: 0.40, retention: 0.55, struggleProbability: 0.50 },
    { skillId: 'deep_learning', mastery: 0.18, confidence: 0.20, retention: 0.30, struggleProbability: 0.80 },
    { skillId: 'nlp', mastery: 0.10, confidence: 0.15, retention: 0.20, struggleProbability: 0.85 },
    { skillId: 'llm', mastery: 0.05, confidence: 0.10, retention: 0.10, struggleProbability: 0.90 },
    { skillId: 'rag', mastery: 0.02, confidence: 0.05, retention: 0.05, struggleProbability: 0.95 },
    { skillId: 'ai_agents', mastery: 0.0, confidence: 0.0, retention: 0.0, struggleProbability: 0.95 }
  ];

  for (const m of initialMasteries) {
    await prisma.learnerSkill.create({
      data: {
        profileId: alexProfile.id,
        skillId: m.skillId,
        mastery: m.mastery,
        confidence: m.confidence,
        retention: m.retention,
        struggleProbability: m.struggleProbability,
        lastPracticed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      }
    });
  }

  // Seeding Learning Preferences (Section 49: 3D interactive, Coding, Visual explanations preferred)
  const preferences = [
    { format: '3d', preferenceScore: 0.95, timesSelected: 15 },
    { format: 'code', preferenceScore: 0.88, timesSelected: 12 },
    { format: 'video', preferenceScore: 0.72, timesSelected: 10 },
    { format: 'text', preferenceScore: 0.41, timesSelected: 5 }
  ];

  for (const p of preferences) {
    await prisma.learningPreference.create({
      data: {
        userId: alexUser.id,
        format: p.format,
        preferenceScore: p.preferenceScore,
        timesSelected: p.timesSelected
      }
    });
  }

  // Seed some initial mistakes
  await prisma.mistake.create({
    data: {
      userId: alexUser.id,
      skillId: 'ml',
      errorType: 'overfitting',
      count: 4
    }
  });

  await prisma.mistake.create({
    data: {
      userId: alexUser.id,
      skillId: 'gradient_descent',
      errorType: 'learning_rate_overshoot',
      count: 3
    }
  });

  console.log(`Demo Student Alex initialized with goal, career skills, mastery profiles, and preferences.`);
  console.log('Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

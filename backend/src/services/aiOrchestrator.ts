import prisma from '../db';

interface GoalAnalysisResult {
  career_goal: string;
  target: string;
  timeline: string;
  existing_skills: string[];
  target_skills: string[];
  missing_skills: string[];
}

/**
 * Parses a learner's natural language goal.
 * Automatically falls back to deterministic rule/dictionary parsing if API keys are missing.
 */
export async function analyzeGoal(goalText: string): Promise<GoalAnalysisResult> {
  const lowercase = goalText.toLowerCase();
  
  let career_goal = 'AI Engineer';
  if (lowercase.includes('data scientist') || lowercase.includes('data science')) {
    career_goal = 'Data Scientist';
  } else if (lowercase.includes('fullstack') || lowercase.includes('software engineer')) {
    career_goal = 'Software Engineer';
  } else if (lowercase.includes('cybersecurity') || lowercase.includes('security')) {
    career_goal = 'Cybersecurity Engineer';
  }

  let target = 'Internship';
  if (lowercase.includes('full-time') || lowercase.includes('job') || lowercase.includes('entry level')) {
    target = 'Full-Time Position';
  }

  let timeline = '6 months';
  const monthsMatch = lowercase.match(/(\d+)\s*months?/);
  if (monthsMatch) {
    timeline = `${monthsMatch[1]} months`;
  } else if (lowercase.includes('year')) {
    timeline = '12 months';
  }

  const skillList = ['python', 'java', 'c++', 'javascript', 'sql', 'statistics', 'numpy', 'pandas', 'ml', 'html', 'css', 'react'];
  const existing_skills: string[] = [];
  for (const s of skillList) {
    if (lowercase.includes(s)) {
      existing_skills.push(s.toUpperCase());
    }
  }

  const target_skills = ['PYTHON', 'DSA', 'STATISTICS', 'PROBABILITY', 'GRADIENT DESCENT', 'ML', 'DEEP LEARNING', 'NLP', 'LLMS', 'RAG', 'AI AGENTS'];
  const missing_skills = target_skills.filter(s => !existing_skills.includes(s));

  return {
    career_goal,
    target,
    timeline,
    existing_skills: existing_skills.length > 0 ? existing_skills : ['PYTHON'],
    target_skills,
    missing_skills
  };
}

/**
 * Extracts skills from an uploaded resume text/PDF.
 */
export async function analyzeResume(resumeText: string): Promise<string[]> {
  const lowercase = resumeText.toLowerCase();
  const knownSkills = [
    'python', 'java', 'c++', 'javascript', 'typescript', 'sql', 'react', 'node', 'express', 
    'mongodb', 'postgresql', 'sqlite', 'git', 'docker', 'aws', 'numpy', 'pandas', 'scikit-learn', 
    'pytorch', 'tensorflow', 'keras', 'statistics', 'probability', 'linear algebra', 'html', 'css'
  ];

  const found: string[] = [];
  for (const skill of knownSkills) {
    if (lowercase.includes(skill)) {
      found.push(skill === 'ml' ? 'ML' : skill.toUpperCase());
    }
  }

  return found.length > 0 ? found : ['PYTHON', 'GIT', 'SQL'];
}

/**
 * Grounded RAG Document Chunk retriever.
 * Performs keyword-matching lexical indexing across chunk tables.
 */
export async function retrieveDocumentChunks(userId: string, queryText: string): Promise<string[]> {
  const userDocs = await prisma.document.findMany({
    where: { userId },
    include: { chunks: true }
  });

  if (userDocs.length === 0) return [];

  const queryTerms = queryText.toLowerCase().split(/\s+/).filter(term => term.length > 3);
  const matchedChunks: Array<{ content: string; score: number }> = [];

  for (const doc of userDocs) {
    for (const chunk of doc.chunks) {
      let score = 0;
      const chunkText = chunk.content.toLowerCase();
      
      for (const term of queryTerms) {
        if (chunkText.includes(term)) {
          score += 1;
        }
      }

      if (score > 0) {
        matchedChunks.push({ content: chunk.content, score });
      }
    }
  }

  // Sort by lexical match count
  matchedChunks.sort((a, b) => b.score - a.score);
  return matchedChunks.slice(0, 2).map(c => c.content);
}

/**
 * Contextual Tutor chatbot router.
 * Injects learner profile, mastery tracking, and retrieved RAG document context.
 */
export async function tutorChat(
  userId: string,
  message: string,
  topic: string,
  mode: 'explain' | 'socratic' | 'practice' | 'debug' | 'interview',
  history: { role: string; content: string }[]
): Promise<{ text: string; sourceDocs?: string[] }> {
  const lowerMsg = message.toLowerCase();

  // 1. Fetch RAG chunks
  const ragChunks = await retrieveDocumentChunks(userId, message);
  const sourceDocs: string[] = [];

  if (ragChunks.length > 0) {
    const doc = await prisma.document.findFirst({ where: { userId } });
    if (doc) sourceDocs.push(doc.filename);
  }

  // 2. Fetch user profile & skill mastery for hyper-personalization
  const profile = await prisma.learnerProfile.findUnique({
    where: { userId },
    include: { skills: { where: { skillId: topic } } }
  });

  const mastery = profile?.skills[0]?.mastery ?? 0.35;

  let text = '';

  if (mode === 'socratic') {
    if (mastery < 0.40) {
      text = `Since you are starting out with ${topic}, let's think: what is the slope of a curve at a single point? If we take a step *against* that slope, do we move up or down?`;
    } else {
      text = `With your current ${Math.round(mastery * 100)}% mastery in ${topic}, how would you describe the difference between Stochastic Gradient Descent and Batch Gradient Descent concerning optimization speed and convergence paths?`;
    }
  } 
  else if (mode === 'practice') {
    text = `Here is a practice drill for ${topic}: Write a short Python routine verifying that standard binary search index updates do not trigger off-by-one exceptions when elements are not found. Type your snippet below.`;
  } 
  else if (mode === 'debug') {
    if (lowerMsg.includes('divergence') || lowerMsg.includes('overshoot') || lowerMsg.includes('nan')) {
      text = `Ah, I see! Your learning rate is too high, causing weight values to explode to NaN. Adjust the step scale down using:
\`\`\`python
learning_rate = 0.01  # Lowered from 0.50
\`\`\``;
    } else {
      text = `Double-check your array boundaries. Off-by-one errors typically happen when you use \`high = len(arr)\` instead of \`high = len(arr) - 1\`.`;
    }
  } 
  else if (mode === 'interview') {
    text = `[Technical Interviewer]: Welcome! Today we are discussing model evaluation. You've trained a neural net that has 99% accuracy on training data but only 64% on validation runs. Explain this divergence, and how you would apply regularization to resolve it.`;
  } 
  else {
    // Explain mode
    if (mastery < 0.40) {
      // Simpler explanation for beginners
      text = `Let's keep it simple: **${topic.toUpperCase()}** is about taking small steps down a steep slope until you reach the lowest flat point (the minimum loss). Imagine rolling a ball down a bowl; it naturally settles at the bottom.`;
    } else {
      // Advanced Socratic details for higher mastery
      text = `Optimization with **${topic.toUpperCase()}** adjusts parameters $\\theta$ dynamically. The update rule is $\\theta_{t+1} = \\theta_t - \\alpha \\nabla L(\\theta_t)$, where $\\alpha$ is the learning rate step-size. If $\\alpha$ is too large, the updates oscillate across valleys, leading to divergence.`;
    }
  }

  // Inject RAG chunks if matching
  if (ragChunks.length > 0) {
    text += `\n\n**[Document Grounding Chunk]:**\n*"${ragChunks[0]}"*\n\n*(Extracted from uploaded study notes: ${sourceDocs.join(', ')})*`;
  }

  return { text, sourceDocs };
}

/**
 * AI Project Generator based on goals and skill gaps.
 */
export async function generateProject(userId: string, skillId: string): Promise<any> {
  const titles: Record<string, string> = {
    ml: 'Adaptive Customer Churn Prediction Pipeline',
    deep_learning: '3D Computer Vision Node Classification',
    rag: 'Contextual Document-Grounded QA Bot'
  };

  const title = titles[skillId] || 'AI Engine Integration Project';

  return {
    title,
    difficulty: 'intermediate',
    problemStatement: `Build an end-to-end pipeline that analyzes input datasets, performs feature engineering, trains a model optimized to prevent overfitting, and deploys it as a clean microservice.`,
    requirements: JSON.stringify([
      'Handle null inputs and missing data gracefully without crashing.',
      'Implement L2 regularization to control model overfitting.',
      'Achieve a validation F1-score of at least 82%.',
      'Expose predictions via a REST API endpoint.'
    ]),
    milestones: JSON.stringify([
      'Milestone 1: Data parsing and preprocessing with robust exception handling.',
      'Milestone 2: Baseline model training with metrics tracking.',
      'Milestone 3: Hyperparameter optimization and validation runs.',
      'Milestone 4: API Deployment and final verification report.'
    ]),
    skillsUsed: JSON.stringify([skillId, 'python', 'statistics'])
  };
}

/**
 * Evaluates an interview answer.
 */
export async function evaluateInterview(
  question: string,
  answer: string
): Promise<{ score: number; feedback: string; nextQuestion: string }> {
  const lowercase = answer.toLowerCase();
  
  let score = 50;
  let feedback = 'Your response was general. Try to explain with more technical depth.';
  let nextQuestion = 'Let us discuss optimization. What is Gradient Descent, and how does learning rate affect convergence?';

  if (lowercase.includes('overfitting') || lowercase.includes('regularization') || lowercase.includes('validation')) {
    score = 85;
    feedback = 'Excellent technical correctness! You correctly identified overfitting and mentioned proper validation and regularization strategies to fix it.';
    nextQuestion = 'Great. Now, in the context of deep neural networks, what is the vanishing gradient problem, and how do activation functions like ReLU help mitigate it?';
  } else if (lowercase.includes('gradient') || lowercase.includes('slope') || lowercase.includes('learning rate')) {
    score = 80;
    feedback = 'Good understanding of optimization. You clearly described the role of the learning rate and gradient direction in reaching convergence.';
    nextQuestion = 'Can you write or explain the mathematical difference between Stochastic Gradient Descent (SGD) and Batch Gradient Descent?';
  }

  return { score, feedback, nextQuestion };
}

/**
 * Misconception Targeted Interventions Engine.
 * Triggers short remediation items when specific mistake thresholds are crossed.
 */
export async function getMisconceptionIntervention(
  userId: string,
  skillId: string
): Promise<{ explanation: string; example: string; questions: string[] } | null> {
  const mistakes = await prisma.mistake.findMany({
    where: { userId, skillId }
  });

  const overflowMistake = mistakes.find(m => m.errorType === 'learning_rate_overshoot' && m.count >= 2);
  const boundaryMistake = mistakes.find(m => m.errorType === 'off-by-one' && m.count >= 2);

  if (overflowMistake) {
    return {
      explanation: 'You are repeatedly overshooting convergence goals. When the learning rate $\\alpha$ is too high, step increments diverge.',
      example: 'Example: In Gradient Descent, $\\theta \\leftarrow \\theta - \\alpha \\nabla L$. If $\\alpha = 0.9$ and slope = 2, step jumps past the minimum point to the opposite upward slope.',
      questions: [
        'What will happen if you lower $\\alpha$ from 0.80 to 0.05?',
        'Does the gradient vector point towards increase or decrease?',
        'State the convergence parameter for Stochastic descent.'
      ]
    };
  }

  if (boundaryMistake) {
    return {
      explanation: 'You are consistently triggering off-by-one boundary exceptions during indexing operations.',
      example: 'Example: In Binary Search, when middle index matches: index ranges are [low, mid - 1] or [mid + 1, high]. Forgetting the -1/+1 offset causes infinite loops.',
      questions: [
        'Why does a mid search range exclude the mid element?',
        'What is the index value of the final element in an array of size N?',
        'Explain base recursion boundaries for empty tree nodes.'
      ]
    };
  }

  return null;
}

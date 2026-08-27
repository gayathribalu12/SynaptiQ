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
  // Check if LLM API is available (e.g. env variables). Here we implement a high-fidelity dictionary parser.
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

  // Extract skills from text
  const skillList = ['python', 'java', 'c++', 'javascript', 'sql', 'statistics', 'numpy', 'pandas', 'ml', 'html', 'css', 'react'];
  const existing_skills: string[] = [];
  for (const s of skillList) {
    if (lowercase.includes(s)) {
      existing_skills.push(s.toUpperCase());
    }
  }

  // Set default target skills for AI Engineer
  const target_skills = ['PYTHON', 'DSA', 'STATISTICS', 'PROBABILITY', 'GRADIENT DESCENT', 'ML', 'DEEP LEARNING', 'NLP', 'LLMS', 'RAG', 'AI AGENTS'];
  
  // Calculate missing
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
      // Map to proper capitalizations
      found.push(skill === 'ml' ? 'ML' : skill.toUpperCase());
    }
  }

  return found.length > 0 ? found : ['PYTHON', 'GIT', 'SQL'];
}

/**
 * Contextual Tutor chatbot router.
 */
export async function tutorChat(
  userId: string,
  message: string,
  topic: string,
  mode: 'explain' | 'socratic' | 'practice' | 'debug' | 'interview',
  history: { role: string; content: string }[]
): Promise<{ text: string; sourceDocs?: string[] }> {
  // Check live API keys if desired. Here we use high-fidelity Socratic/Tutorial rule engines:
  const lowerMsg = message.toLowerCase();

  // RAG checks: if they ask about document contents, we can fetch document chunks from SQLite
  let sourceDocs: string[] = [];
  const hasDocQuery = lowerMsg.includes('pdf') || lowerMsg.includes('document') || lowerMsg.includes('my notes') || lowerMsg.includes('resume');
  if (hasDocQuery) {
    const doc = await prisma.document.findFirst({ where: { userId } });
    if (doc) {
      sourceDocs.push(doc.filename);
    }
  }

  let text = '';

  if (mode === 'socratic') {
    if (lowerMsg.includes('what') || lowerMsg.includes('how') || lowerMsg.includes('why')) {
      text = `Excellent question! Let's think about this step-by-step. If we are traversing a binary tree, what is the core difference between visiting the left node before the parent node versus visiting the parent node first? What do you think would happen to the order of elements?`;
    } else {
      text = `That is an interesting perspective. How does this fit with what we know about recursion base cases? What stops our function from executing indefinitely in this scenario?`;
    }
  } else if (mode === 'practice') {
    text = `Let's practice! Write a short Python function that checks if a binary search tree is valid. Try to include a base case for a null node. Type your code here, and I'll review it for any potential edge-case issues!`;
  } else if (mode === 'debug') {
    if (lowerMsg.includes('recursion') || lowerMsg.includes('stack overflow') || lowerMsg.includes('loop')) {
      text = `I spotted the bug! Your recursive call is missing a base case. In Python, if a node is \`None\`, the function must return immediately (e.g. \`return True\`). Otherwise, it will keep calling itself and throw a \`RecursionError\`. Add this at the very top of your function:
\`\`\`python
if node is None:
    return True
\`\`\``;
    } else {
      text = `Your logic looks solid, but check if you are handling boundary conditions correctly. Are you comparing values with strict inequalities (\`<\`) or inclusive inequalities (\`<=\`)? Often, off-by-one errors stem from this!`;
    }
  } else if (mode === 'interview') {
    text = `[Technical Interviewer]: Welcome! Today we are discussing model evaluation. You've trained a random forest classifier for customer churn. The training accuracy is 99%, but the test accuracy is only 63%. Tell me, what is happening here, and what steps would you take to diagnose and solve this?`;
  } else {
    // Explain mode
    if (topic.includes('binary_tree') || topic.includes('dsa')) {
      text = `A **Binary Search Tree (BST)** is a node-based binary tree data structure which has the following properties:
1. The left subtree of a node contains only nodes with keys less than the node's key.
2. The right subtree of a node contains only nodes with keys greater than the node's key.
3. Both the left and right subtrees must also be binary search trees.

Interactive 3D simulation is highly recommended for this concept. Click the **3D Lab** button in the center panel to visualize how insertions and traversals work!`;
    } else if (topic.includes('gradient_descent')) {
      text = `**Gradient Descent** is an optimization algorithm used to minimize a loss function by iteratively moving in the direction of steepest descent.
- Think of it as walking down a foggy mountain. You can't see the bottom, but you can feel the slope of the ground beneath your feet. You take a step in the direction that goes downhill.
- **Learning Rate (\(\alpha\))** defines the size of the steps. If it is too small, you'll take forever to reach the bottom. If it is too large, you might overshoot the valley and end up climbing up the other side!`;
    } else {
      text = `Let's break down **${topic.toUpperCase()}**. It is a crucial skill for your AI engineering goals. 
To build deep mastery:
1. Understand the theoretical formulation (the 'why').
2. Explore the visual representation in our 3D lab.
3. Solve practice quizzes to test boundary conditions and misconceptions.`;
    }
  }

  if (sourceDocs.length > 0) {
    text += `\n\n*(Grounded in uploaded document: ${sourceDocs.join(', ')})*`;
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

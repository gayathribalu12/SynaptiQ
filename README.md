# SynaptiQ AI-Powered Personalized Learning Coach
Learn smarter. Adapt faster. Build your own path.

SynaptiQ is an AI-powered personalized learning coach that continuously understands a learner's goals, existing knowledge, learning behavior, mistakes, and preferences to create and adapt a personalized learning experience.

Unlike traditional learning platforms that provide the same predefined curriculum to everyone, SynaptiQ dynamically generates learning paths, lessons, assessments, projects, visual explanations, and remediation strategies based on each individual learner.

📸 Product Preview
🏠 Personalized Learning Dashboard

The dashboard dynamically presents the learner's current mastery, learning progress, recommended next action, roadmap, career readiness, and active projects.

🧠 Learning Twin

The Learning Twin continuously builds a representation of the learner using:

Concept mastery
Quiz performance
Learning behavior
Mistake patterns
Response time
Learning format preferences
Retention/forgetting patterns
Goal progress

This information is used to continuously adapt the learning experience.

🗺️ Personalized Learning Roadmap

Instead of using a fixed roadmap, SynaptiQ dynamically determines:

Goal → Required Competencies → Skill Gaps → Prerequisites → Learning Sequence → Assessment → Project

The roadmap changes as the learner learns.

🎥 AI Interactive Learning Storyboard

Lessons are dynamically generated according to the learner's:

Current mastery
Learning goal
Knowledge gaps
Difficulty level
Learning preferences
Previous mistakes

The storyboard can contain:

Visual explanations
Narration
Examples
Code
Interactive checkpoints
Socratic questions
Summaries
👁️ Multimodal Learning Twin

Learners can upload:

Handwritten notes
Diagrams
Screenshots
Code errors
Whiteboard explanations
Learning material

SynaptiQ analyzes the uploaded image and connects the observation back to the learner's learning state.

From the analysis, learners can choose:

Teach Me This → Personalized explanation

Make This Visual → Interactive visual lesson

🚀 AI-Generated Projects

SynaptiQ can dynamically generate projects based on the learner's current skill gaps.

Projects can include:

Problem statement
Requirements
Skills involved
Milestones
Expected outcomes
Evidence submission
AI-based evaluation

Project performance can feed back into the learner's mastery model.

🎯 Problem

Modern learning platforms provide thousands of courses, but learners still face a fundamental problem:

What should I learn next?

A learner may have:

Different existing skills
Different levels of knowledge
Different career or personal goals
Different learning speeds
Different available study time
Different learning preferences
Different misconceptions

A fixed curriculum cannot effectively handle all these variations.

SynaptiQ addresses this problem by creating a continuously adapting learning journey for every learner.

💡 Solution

SynaptiQ acts as an AI learning coach rather than a traditional course recommendation system.

The system continuously follows:

USER GOAL
    ↓
LEARNER PROFILE
    ↓
AI COMPETENCY DISCOVERY
    ↓
SKILL GAP ANALYSIS
    ↓
PREREQUISITE DISCOVERY
    ↓
PERSONALIZED ROADMAP
    ↓
AI-GENERATED LESSON
    ↓
ASSESSMENT
    ↓
LEARNING TELEMETRY
    ↓
LEARNING TWIN UPDATE
    ↓
ROADMAP ADAPTATION
    ↓
NEXT BEST LEARNING ACTION

The process continuously repeats as the learner progresses.

✨ Key Features
1. 🧑‍🎓 Fully User-Driven Learning

SynaptiQ does not assume that every learner wants the same career or curriculum.

The learner provides their own:

Goal
Current knowledge
Experience
Interests
Time availability
Target timeline
Learning preferences

The system dynamically interprets these inputs.

2. 🤖 AI Competency Discovery

The AI analyzes a natural-language goal and determines:

Goal
 ↓
Required Competencies
 ↓
Current Skills
 ↓
Missing Skills
 ↓
Prerequisites
 ↓
Learning Sequence

This allows users to describe unconventional goals instead of selecting from a predefined career list.

For example:

"I want to build AI-powered autonomous underwater robots."

can result in a completely different competency map from:

"I want to become a cybersecurity engineer."
3. 🧠 Learning Twin

The Learning Twin maintains a dynamic learner state.

Core learner signals
Mastery
IRT Ability
Quiz Performance
Mistake Frequency
Response Time
Completion Rate
Retention
Learning Preferences
Goal Progress

These signals continuously influence recommendations.

4. 📊 Bayesian Knowledge Tracing

SynaptiQ uses Bayesian Knowledge Tracing (BKT) to estimate concept mastery.

A learner's mastery is continuously updated based on learning evidence.

Correct Answer
      ↓
Mastery ↑

Incorrect Answer
      ↓
Mastery ↓

Repeated Struggle
      ↓
Remediation

Successful Remediation
      ↓
Mastery Recovery

Mastery probabilities remain bounded between:

0.0 ≤ mastery ≤ 1.0
5. 📐 Item Response Theory

SynaptiQ separates:

Mastery probability
IRT ability (θ)

IRT dynamically models the relationship between learner ability and question difficulty.

This allows assessments to become increasingly personalized.

6. 🎯 Adaptive Assessments

Questions are generated dynamically according to:

Learner Ability
      +
Skill
      +
Current Mastery
      +
Difficulty
      +
Previous Mistakes

Quiz results are then fed back into the Learning Twin.

7. 🛤️ Dynamic Learning Path

The roadmap is not simply:

Course 1
 ↓
Course 2
 ↓
Course 3

Instead:

Learner State
      ↓
Skill Gaps
      ↓
Prerequisites
      ↓
Struggle Risk
      ↓
Retention
      ↓
Priority
      ↓
Next Best Action

If a learner struggles with a concept, the roadmap can dynamically introduce:

Revision
Practice
Additional Explanation
Visual Lesson
Assessment
Project
8. 🎥 AI Interactive Lessons

SynaptiQ generates interactive lesson storyboards instead of displaying static course content.

A lesson can dynamically contain:

Introduction
      ↓
Concept Explanation
      ↓
Visual Example
      ↓
Code Example
      ↓
Interactive Checkpoint
      ↓
Socratic Question
      ↓
Summary

Lesson depth and pacing can change according to learner ability.

9. 👁️ Multimodal Learning

Learners can interact with the Learning Twin using images.

Example
Upload Screenshot
       ↓
AI Vision Analysis
       ↓
Detect Concepts
       ↓
Detect Possible Issues
       ↓
Confidence Evaluation
       ↓
Learning Twin Update
       ↓
Personalized Intervention

The system can connect the image analysis to:

Lesson → Assessment → Visual Lesson → Roadmap

10. 🎨 Personalized Learning Formats

The system can dynamically evaluate different learning formats:

📖 Text
🎥 Visual Lesson
💻 Code
🧩 Interactive Practice
🧠 Socratic Learning
🌐 3D Visualization

Successful interactions influence future recommendations.

11. 🚀 AI-Generated Capstone Projects

Projects are generated according to the learner's current state.

Goal
 ↓
Skill Gaps
 ↓
Current Mastery
 ↓
Mistakes
 ↓
Project Generation
 ↓
Evidence Submission
 ↓
AI Evaluation
 ↓
Learning Twin Update

Project evidence can contribute to the learner's competency evaluation.

12. 🔄 Closed-Loop Learning

One of SynaptiQ's core concepts is that learning should never be a one-way process.

             ┌──────────────┐
             │    LEARN     │
             └──────┬───────┘
                    ↓
             ┌──────────────┐
             │   PRACTICE   │
             └──────┬───────┘
                    ↓
             ┌──────────────┐
             │   ASSESS     │
             └──────┬───────┘
                    ↓
             ┌──────────────┐
             │   ANALYZE    │
             └──────┬───────┘
                    ↓
             ┌──────────────┐
             │ UPDATE TWIN  │
             └──────┬───────┘
                    ↓
             ┌──────────────┐
             │ ADAPT PATH   │
             └──────┬───────┘
                    │
                    └──────────────→ LEARN

Every meaningful interaction can influence the next recommendation.

🏗️ System Architecture
                    ┌──────────────────────┐
                    │       FRONTEND       │
                    │      React + UI      │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      NODE.JS API     │
                    │ Express + Prisma     │
                    └──────────┬───────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
      ┌──────────────────┐          ┌──────────────────┐
      │   SQLite / DB    │          │    Groq AI       │
      │ Learner State    │          │ AI Gateway       │
      └──────────────────┘          └────────┬─────────┘
                                             │
                            ┌────────────────┼────────────────┐
                            ▼                ▼                ▼
                         Text AI         Vision AI       Generation
                            │                │                │
                            └────────────────┼────────────────┘
                                             ▼
                                  ┌────────────────────┐
                                  │ Learning Twin      │
                                  │ Adaptive Engine    │
                                  └────────────────────┘
🧩 Technology Stack
Frontend
React
TypeScript
Vite
Interactive UI components
Browser-based sandbox
Responsive dashboard
Backend
Node.js
Express
TypeScript
Prisma
SQLite
AI
Groq API
LLM-based competency discovery
AI-generated learning content
AI-generated assessments
AI-generated projects
Multimodal image analysis
AI tutoring
ML / Adaptive Intelligence
Bayesian Knowledge Tracing
Item Response Theory
Contextual Bandits
Learning-to-Rank
Forgetting/retention modeling
Struggle prediction
Misconception detection

🔐 User Data Isolation

Each learner maintains an isolated learning state.

The application uses a persistent:

x-user-id

request header to associate API requests with the correct learner profile.

This ensures that:

User A
   ↓
User A's Goals
User A's Mastery
User A's Roadmap
User A's Projects
User A's Telemetry

remain separate from another learner.

📡 Learning Telemetry

SynaptiQ captures meaningful learning events such as:

lesson_started
scene_completed
lesson_completed
checkpoint_answered
quiz_submitted
visualization_interacted
project_completed

These events contribute to the adaptive learning loop.

🧪 Verification

The system includes automated validation for:

Core ML
BKT probability boundaries
IRT ability separation
Forgetting behavior
Struggle prediction
Contextual bandit updates
AI
Dynamic goal analysis
Competency discovery
Dynamic project generation
Dynamic lesson generation
Vision analysis
Image → Lesson
Image → Video
Product
User isolation
Goal switching
Mastery preservation
Roadmap adaptation
Telemetry propagation
API integration
Build
npx tsc --noEmit

and backend:

npm run build
⚙️ Environment Variables

Create:

backend/.env

Example:

DATABASE_URL="file:./dev.db"
PORT=5000

GROQ_API_KEY="your_groq_api_key"
GROQ_MODEL="your_text_model"
GROQ_VISION_MODEL="your_vision_model"

Never commit .env or API keys to GitHub.

Add to .gitignore:

.env
.env.local
.env.*.local
🚀 Getting Started
1. Clone
git clone <your-repository-url>
cd SynaptiQ
2. Install dependencies
npm install

If frontend and backend have separate package files:

cd backend
npm install

cd ../frontend
npm install
3. Configure environment

Create:

backend/.env

and add your Groq configuration.

4. Initialize database
cd backend
npx prisma db push
5. Start backend
npm run dev
6. Start frontend

In another terminal:

cd frontend
npm run dev
🧑‍💻 Example User Journey
User enters goal
        ↓
"I want to build autonomous robots"
        ↓
AI analyzes goal
        ↓
Competencies discovered
        ↓
Existing knowledge evaluated
        ↓
Skill gaps identified
        ↓
Prerequisites generated
        ↓
Personalized roadmap created
        ↓
AI lesson generated
        ↓
Adaptive quiz
        ↓
Learning Twin updated
        ↓
Roadmap recalculated
        ↓
Project generated
        ↓
Project evidence evaluated
        ↓
Learning path adapts again
🌟 What Makes SynaptiQ Different?
Traditional Learning Platform
Course
  ↓
Fixed Curriculum
  ↓
Quiz
  ↓
Certificate
SynaptiQ
Learner
   ↓
Goal
   ↓
Learning Twin
   ↓
AI Skill Discovery
   ↓
Dynamic Roadmap
   ↓
Adaptive Learning
   ↓
Continuous Assessment
   ↓
Behavior Analysis
   ↓
Personalized Intervention
   ↓
Projects
   ↓
Twin Update
   ↓
New Personalized Path

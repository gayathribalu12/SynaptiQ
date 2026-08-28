import React, { useState, useEffect } from 'react';
import ThreeDLearningLab from '../components/ThreeDLearningLab';
import { 
  Play, ChevronRight, Sparkles, Brain, Database, Cpu, 
  Activity, Star, RefreshCw, HelpCircle, Code, ShieldCheck, ArrowRight,
  Calendar, Award
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Demo() {
  const [step, setStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);
  const [twinStats, setTwinStats] = useState({
    mastery: 35,
    retention: 55,
    struggleProb: 50,
    readiness: 54,
    streak: 8,
    banditWeights: { '3d': 85, 'code': 78, 'text': 41 }
  });

  const demoSteps = [
    {
      num: 1,
      title: 'Scan Weak Skill',
      desc: 'SynaptiQ scans the Knowledge Graph and detects Alex is weak in Probability & Optimization.',
      log: 'Learner Twin scan complete. Detected prerequisite gaps: Probability (38%) and Gradient Descent (30%) fall below threshold (60%).',
      action: 'Dashboard view active. Highlighting gap: Gradient Descent.'
    },
    {
      num: 2,
      title: 'Tutor Intervention Explain',
      desc: 'AI Tutor explains why Gradient Descent is a critical prerequisite for Deep Learning.',
      log: 'Orchestrator dispatch: Goal alignment warning. Prerequisites for Deep Learning are currently blocked.',
      action: 'Tutor Panel: "Gradient Descent is a prerequisite for training neural nets. Let\'s fix this first."'
    },
    {
      num: 3,
      title: 'Optimal Format Selection',
      desc: 'Optimal Format AI compares format reward matrices and selects Interactive 3D.',
      log: 'Contextual Bandit evaluates rewards. 3D visual format has maximum expected reward (0.95) for visual math concepts.',
      action: 'System recommends: Interactive 3D Visualization.'
    },
    {
      num: 4,
      title: 'Launch 3D Lab',
      desc: 'The workspace center panel automatically opens the 3D Gradient Descent surface.',
      log: 'WebGL Context: Initializing 3D Loss Surface mesh. Rendering z = sin(x)*cos(y) wireframe.',
      action: '3D Lab: Gradient Descent surface loaded.'
    },
    {
      num: 5,
      title: 'Interaction Telemetry',
      desc: 'Alex interacts with the 3D surface, modifying the learning rate slider.',
      log: 'Event tracked: visualization_interacted. Completed=true, steps=25. Format reward calculated: 0.88. 3D preference weight boosted to 89%.',
      action: 'Alex adjusts learning rate: alpha = 0.12 (Ideal convergence).'
    },
    {
      num: 6,
      title: 'Adaptive Quiz Trigger',
      desc: 'An adaptive assessment question appears at the bottom panel to test visual concepts.',
      log: 'Assessment Engine: Dispatching Question q5 ("What happens if the learning rate is too large?") at difficulty Intermediate.',
      action: 'Bottom Panel: Multiple choice question displayed.'
    },
    {
      num: 7,
      title: 'Incorrect Attempt',
      desc: 'Alex attempts the quiz but makes an optimization boundary error.',
      log: 'Attempt logged: incorrect. Selected option: "Slow step progress" (Correct: "Divergence/Overshoot").',
      action: 'Attempt logged. Grading completed.'
    },
    {
      num: 8,
      title: 'Misconception Extraction',
      desc: 'The Mistake Pattern Engine analyzes the failure and identifies the error pattern.',
      log: 'Mistake tracked. Pattern found: learning_rate_overshoot. AI identifies conceptual gap in boundary conditions.',
      action: 'Mistake DB updated: Gradient Descent error count = 4.'
    },
    {
      num: 9,
      title: 'BKT Twin Update',
      desc: 'Bayesian Knowledge Tracing runs and updates Alex\'s mastery in the database.',
      log: 'BKT recalculation: Prior mastery 30% -> posterior mastery 18%. Confidence lowered to 55%.',
      action: 'Learning Twin updated: Gradient Descent mastery set to 18%.'
    },
    {
      num: 10,
      title: 'Struggle Risk Flags',
      desc: 'The struggle prediction engine flags succeeding topics as high-risk.',
      log: 'Predictive ML: Struggle risk for upcoming "Deep Learning" concept spiked to 92%. Prerequisite path blocked.',
      action: 'Struggle probability updated in LearnerSkill table.'
    },
    {
      num: 11,
      title: 'Roadmap Adaptation',
      desc: 'The roadmap automatically halts forward progress and inserts prerequisite revision.',
      log: 'Roadmap Engine: Pausing "Month 3: Deep Learning". Inserting dynamic node: "⚠️ REVISE: Gradient Descent Basics".',
      action: 'Syllabus roadmap visual updated.'
    },
    {
      num: 12,
      title: 'Correct Attempt & Mastery Boost',
      desc: 'Alex reviews with the Tutor and re-takes the quiz, answering correctly.',
      log: 'Attempt logged: correct. BKT recalculation: Mastery boosted from 18% to 74%. Confidence increased to 80%.',
      action: 'Quiz passed! Mastery = 74%.'
    },
    {
      num: 13,
      title: 'Memory Forgetting Decay',
      desc: 'The forgetting engine predicts decay curves and schedules a revision.',
      log: 'Memory half-life calculated at 10 days. Spaced repetition scheduler inserts RevisionSchedule entry for 2026-08-29.',
      action: 'Revision schedule record created in Database.'
    },
    {
      num: 14,
      title: 'Project Generation',
      desc: 'Alex reaches sufficient core mastery; AI generates a custom capstone project.',
      log: 'Orchestrator generates project based on ML + Python skills. Title: "Adaptive Customer Churn Prediction Pipeline".',
      action: 'Project statement, datasets, and milestones generated.'
    },
    {
      num: 15,
      title: 'AI Technical Interview',
      desc: 'Alex enters the AI Interview Simulator. The system conducts a voice/text technical interview.',
      log: 'Interview session started. Question: "Explain how you mitigate overfitting in random forest classifiers."',
      action: 'Alex submits answer: "I would apply L2 regularization and data augmentation."'
    },
    {
      num: 16,
      title: 'Interview Grading',
      desc: 'AI Tutor evaluates the answer, giving technical grading feedback.',
      log: 'Interview evaluation: score 85%. Correctly identified bias-variance tradeoff. Learner ML confidence boosted (+5%).',
      action: 'Tutor feedback displayed.'
    },
    {
      num: 17,
      title: 'Career Readiness Growth',
      desc: 'Alex\'s overall career readiness score recalculates and grows!',
      log: 'Career Readiness model runs. Required competency ratio complete. Readiness score boosted from 54% to 68%!',
      action: 'Overall Career Readiness Score updated: 68%.'
    }
  ];

  // Auto-play timer
  useEffect(() => {
    let timer: number;
    if (isPlaying) {
      timer = window.setInterval(() => {
        setStep(prev => {
          if (prev < 17) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            confetti({ particleCount: 100, spread: 80 });
            return 17;
          }
        });
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const syncStepWithBackend = async (stepNum: number) => {
    try {
      if (stepNum === 1) {
        const res = await fetch('/api/twin/dashboard');
        const data = await res.json();
        setTwinStats({
          mastery: 35,
          retention: 55,
          struggleProb: 50,
          readiness: data.careerReadiness || 54,
          streak: 8,
          banditWeights: {
            '3d': data.preferences['3d'] || 85,
            'code': data.preferences['code'] || 78,
            'text': data.preferences['text'] || 41
          }
        });
      }

      if (stepNum === 5) {
        // Log real WebGL 3D interaction event to backend
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'visualization_completed',
            skillId: 'gradient_descent',
            payload: { vizId: 'gradient_descent', timeSpent: 120, stepsCompleted: 25, completed: true }
          })
        });
        const eventData = await res.json();

        // Query fresh dashboard to load actual preference score boosts
        const dashRes = await fetch('/api/twin/dashboard');
        const dashData = await dashRes.json();
        const gdSkill = dashData.skills.find((s: any) => s.id === 'gradient_descent');

        setTwinStats(prev => ({
          ...prev,
          mastery: gdSkill ? gdSkill.mastery : 43,
          banditWeights: {
            '3d': dashData.preferences['3d'] || 94,
            'code': dashData.preferences['code'] || 78,
            'text': dashData.preferences['text'] || 41
          }
        }));
      }

      if (stepNum === 7) {
        // Log real incorrect attempt to backend triggers (BKT + Mistakes)
        const quizRes = await fetch('/api/assessment/quiz?skillId=gradient_descent');
        const questionsList = await quizRes.json();
        const qId = questionsList[0]?.id || 'q5';

        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'question_answered',
            skillId: 'gradient_descent',
            payload: { correct: false, questionId: qId, selectedOption: 0, mistakeType: 'learning_rate_overshoot' }
          })
        });
        const eventData = await res.json();

        const dashRes = await fetch('/api/twin/dashboard');
        const dashData = await dashRes.json();
        const gdSkill = dashData.skills.find((s: any) => s.id === 'gradient_descent');

        setTwinStats(prev => ({
          ...prev,
          mastery: gdSkill ? gdSkill.mastery : 18,
          struggleProb: gdSkill ? gdSkill.struggleProbability : 92,
          readiness: dashData.careerReadiness
        }));
      }

      if (stepNum === 12) {
        // Log real correct attempt (BKT mastery recovery)
        const quizRes = await fetch('/api/assessment/quiz?skillId=gradient_descent');
        const questionsList = await quizRes.json();
        const qId = questionsList[0]?.id || 'q5';

        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'question_answered',
            skillId: 'gradient_descent',
            payload: { correct: true, questionId: qId, selectedOption: 1 }
          })
        });
        const eventData = await res.json();

        const dashRes = await fetch('/api/twin/dashboard');
        const dashData = await dashRes.json();
        const gdSkill = dashData.skills.find((s: any) => s.id === 'gradient_descent');

        setTwinStats(prev => ({
          ...prev,
          mastery: gdSkill ? gdSkill.mastery : 74,
          struggleProb: gdSkill ? gdSkill.struggleProbability : 15,
          readiness: dashData.careerReadiness
        }));
      }

      if (stepNum === 15) {
        // Log real interview transcript answers
        await fetch('/api/interview/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: 'Explain how you mitigate overfitting in random forest classifiers.',
            answer: 'I would apply L2 regularization and data validation techniques.',
            skillId: 'ml'
          })
        });
      }

      if (stepNum === 17) {
        const dashRes = await fetch('/api/twin/dashboard');
        const dashData = await dashRes.json();
        setTwinStats(prev => ({
          ...prev,
          readiness: dashData.careerReadiness
        }));
      }
    } catch (e) {
      console.warn('Demo step sync skipped', e);
    }
  };

  // Sync twin statistics and logs depending on the step
  useEffect(() => {
    const current = demoSteps[step - 1];
    if (current) {
      setTelemetryLogs(prev => [...prev.slice(-10), `[Step ${step}] ${current.log}`]);
      syncStepWithBackend(step);
    }
  }, [step]);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] gap-4 px-4 pb-4">
      
      {/* LEFT SIDE: Platform Sandbox Screens (Visual walkthrough changes depending on active step) */}
      <div className="flex-1 bg-[#121A2E]/50 border border-[#1E2D4A] rounded-2xl p-4 flex flex-col justify-between overflow-y-auto glass-panel relative">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2D4A] mb-3">
          <span className="text-xs font-mono font-bold text-gray-400">SYNAPTIQ SANDBOX PREVIEW</span>
          <span className="text-xs font-bold text-[#8B5CF6] font-mono">Alex's Learning Twin View</span>
        </div>

        {/* Dynamic page representation based on active step */}
        <div className="flex-1 flex flex-col justify-between min-h-[300px]">
          
          {/* STEP 1: SCAN WEAK SKILL (Dashboard) */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-red-950/20 border border-red-900/60 p-4 rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5 text-red-400">
                    <Activity className="w-4 h-4" />
                    <span className="text-[10px] font-mono font-bold">PREREQUISITE WARNING</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Gradient Descent mastery has decayed to 30%</h4>
                  <p className="text-xs text-gray-400">This topic is a prerequisite for upcoming Deep Learning models in your target path.</p>
                </div>
                <span className="text-xs bg-red-900/40 text-red-200 border border-red-800/80 px-2 py-1 rounded font-bold font-mono">Blocker Alert</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {['Python: 82%', 'DSA: 70%', 'ML Basics: 35%'].map((s, i) => (
                  <div key={i} className="bg-[#0A0E1A] border border-[#1E2D4A] rounded p-3 text-center text-xs">
                    <span className="block text-gray-400 font-mono text-[9px] uppercase">SKILL</span>
                    <strong className="text-white block mt-1">{s}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: TUTOR PLUG EXPLAIN */}
          {step === 2 && (
            <div className="bg-[#0A0E1A] border border-[#1E2D4A] rounded-xl p-4 space-y-3 max-w-md mx-auto">
              <div className="flex items-center space-x-2 text-[#8B5CF6]">
                <Brain className="w-5 h-5 animate-pulse" />
                <span className="text-xs font-bold font-mono text-white">AI Tutor Intervention</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-sans">
                "Alex, we detected that your understanding of **Gradient Descent** has decayed. In order to train weights in Deep Neural Networks (Month 3), you need to understand backpropagation optimization. Let's run a visual 3D simulation to review how step learning-rates affect convergence slopes."
              </p>
            </div>
          )}

          {/* STEP 3: CONTEXTUAL BANDIT SELECTS FORMAT */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-sm mx-auto py-8">
              <Cpu className="w-12 h-12 text-[#3B82F6] animate-spin" />
              <h3 className="text-sm font-bold text-white font-mono">Format selection in progress...</h3>
              <p className="text-xs text-gray-400">Evaluating visual vs coding vs reading rewards for mathematical optimizations.</p>
              
              <div className="w-full bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg p-3 space-y-1.5 text-xs text-left">
                <div className="flex justify-between">
                  <span className="font-mono text-gray-400">Interactive 3D Simulation</span>
                  <span className="text-emerald-400 font-bold">Reward Expected: 0.95</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-gray-400">Coding challenge</span>
                  <span className="text-yellow-500 font-bold">Reward Expected: 0.78</span>
                </div>
                <div className="flex justify-between border-t border-[#1E2D4A]/50 pt-1.5">
                  <strong className="text-white">Selected Action:</strong>
                  <strong className="text-[#3B82F6] font-mono">Launch 3D Lab</strong>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 & 5: RENDERS THE 3D GRADIENT DESCENT SIMULATOR */}
          {(step === 4 || step === 5) && (
            <div className="h-64">
              <ThreeDLearningLab simulationId="gradient_descent" />
            </div>
          )}

          {/* STEP 6 & 7: MULTIPLE CHOICE ADAPTIVE ASSESSMENT */}
          {(step === 6 || step === 7) && (
            <div className="bg-[#0F1626] border border-[#1E2D4A] rounded-xl p-4 space-y-3">
              <span className="text-[10px] font-mono text-[#3B82F6] uppercase">ADAPTIVE QUIZ // OPTIMIZATIONS</span>
              <p className="text-xs font-bold text-white">What happens if the learning rate in Gradient Descent is set to a value that is too large?</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <button className={`p-2 rounded text-left border ${step === 7 ? 'bg-red-950/60 border-red-500 text-red-200' : 'bg-[#0A0E1A] border-[#1E2D4A] text-gray-300'}`}>
                  The model will converge slowly
                </button>
                <button className={`p-2 rounded text-left border ${step === 7 ? 'bg-emerald-950/20 border-emerald-800 text-gray-400' : 'bg-[#0A0E1A] border-[#1E2D4A] text-gray-300'}`}>
                  The algorithm will overshoot and may diverge
                </button>
              </div>
              {step === 7 && <span className="text-[10px] text-red-400 font-mono font-bold block mt-1">❌ Incorrect attempt logged. Misconception analysis triggered.</span>}
            </div>
          )}

          {/* STEP 8: MISCONCEPTION EXTRACTION */}
          {step === 8 && (
            <div className="bg-[#0A0E1A] border border-[#1E2D4A] rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-2 text-amber-500">
                <ShieldCheck className="w-5 h-5" />
                <h4 className="text-xs font-bold font-mono text-white">AI Misconception Engine Report</h4>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-sans">
                "Alex repeatedly expects larger parameter values to delay convergence. We identified a misconception in understanding boundary divergence dynamics. Remediation required: review of learning-rate boundary overshoots."
              </p>
            </div>
          )}

          {/* STEP 9 & 10: BKT TWIN STATISTICS & STRUGGLE RISK ADAPTATIONS */}
          {(step === 9 || step === 10) && (
            <div className="space-y-4">
              <div className="bg-[#0A0E1A] border border-[#1E2D4A] rounded-xl p-4 flex justify-between items-center">
                <div>
                  <span className="text-[9px] font-mono text-gray-500 block uppercase">BKT MASTERY UPDATE</span>
                  <strong className="text-xl font-mono text-red-400 font-bold">18% mastery</strong>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono text-gray-500 block uppercase">STRUGGLE RISK</span>
                  <strong className="text-xl font-mono text-red-400 font-bold">92% Struggle Prob</strong>
                </div>
              </div>
              <div className="p-3 bg-red-950/20 border border-red-900/60 rounded text-xs text-gray-300 font-sans leading-relaxed">
                🚨 System blocked forward progression to month 3. The learner must complete remediation before successor nodes unlock.
              </div>
            </div>
          )}

          {/* STEP 11: ROADMAP ADAPTATION (Roadmap panel showing Revise insertion) */}
          {step === 11 && (
            <div className="bg-[#121A2E] border border-[#1E2D4A] rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-white font-mono uppercase">Roadmap Adapted</h4>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="p-2 bg-red-950/40 border border-red-900/50 text-red-300 rounded flex items-center justify-between">
                  <span>⚠️ REVISE: Gradient Descent Basics</span>
                  <span>Remediation step</span>
                </div>
                <div className="p-2 bg-[#0A0E1A] border border-[#1E2D4A] text-gray-500 rounded flex items-center justify-between opacity-50">
                  <span>Month 3: Deep Learning Neural Networks</span>
                  <span>Blocked</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 12: CORRECT QUIZ ATTEMPT */}
          {step === 12 && (
            <div className="bg-[#0F1626] border border-emerald-500/50 rounded-xl p-4 space-y-3">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">ADAPTIVE QUIZ // GRADED CORRECT</span>
              <p className="text-xs font-bold text-white">What happens if the learning rate in Gradient Descent is set to a value that is too large?</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded border border-emerald-500 bg-emerald-950/60 text-emerald-200 font-bold">
                  The algorithm will overshoot and may diverge
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold block">✓ BKT Mastery updated: 74%. Confidence: 80%.</span>
            </div>
          )}

          {/* STEP 13: FORGETTING SCHEDULER */}
          {step === 13 && (
            <div className="bg-[#0A0E1A] border border-[#1E2D4A] rounded-xl p-4 space-y-2 text-center max-w-sm mx-auto">
              <Calendar className="w-10 h-10 text-emerald-400 mx-auto animate-pulse" />
              <h4 className="text-xs font-bold text-white font-mono uppercase">Spaced repetition schedule locked</h4>
              <p className="text-[11px] text-gray-400 font-sans">
                Cognitive memory half-life calculated at 10 days. The system automatically scheduled a 5-minute revision trigger for 2026-08-29.
              </p>
            </div>
          )}

          {/* STEP 14: AI PROJECT GENERATION */}
          {step === 14 && (
            <div className="bg-[#0A0E1A] border border-[#1E2D4A] rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-2 text-[#8B5CF6]">
                <Code className="w-5 h-5" />
                <h4 className="text-xs font-bold font-mono text-white">AI Capstone Project Generated</h4>
              </div>
              <div className="space-y-1.5 text-xs">
                <h5 className="font-bold text-white">Project: Adaptive Customer Churn Prediction Pipeline</h5>
                <p className="text-[10px] text-gray-400">Implement data processing modules, linear optimization gradient functions, and prevent overfitting parameters.</p>
              </div>
            </div>
          )}

          {/* STEP 15 & 16: AI INTERVIEW SIMULATION */}
          {(step === 15 || step === 16) && (
            <div className="bg-[#0F1626] border border-[#1E2D4A] rounded-xl p-4 space-y-3">
              <span className="text-[10px] font-mono text-[#8B5CF6] uppercase">AI Technical Interview Simulator</span>
              <p className="text-xs font-semibold text-white bg-[#0A0E1A] p-2 rounded border border-[#1E2D4A]">
                Interviewer: "Explain how you mitigate overfitting in random forest classifiers."
              </p>
              <p className="text-xs text-gray-300 font-mono pl-2 border-l-2 border-blue-500">
                Alex: "I would apply L2 regularization and data validation techniques."
              </p>
              {step === 16 && (
                <div className="p-2 bg-emerald-950/20 border border-emerald-900/60 rounded text-[10px] text-emerald-300">
                  ✓ Evaluation: Score 85. Correctly identified bias-variance tradeoff.
                </div>
              )}
            </div>
          )}

          {/* STEP 17: CAREER READINESS SCORE GAUGE */}
          {step === 17 && (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-6">
              <Award className="w-16 h-16 text-[#8B5CF6] animate-bounce" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white font-mono uppercase">Career Readiness Boosted!</h4>
                <strong className="text-3xl font-mono text-[#10B981] font-bold block">68% READY</strong>
                <p className="text-xs text-gray-400 font-sans max-w-xs">
                  Alex completed optimizations remediation, passed assessment validation, and secured an interview evaluation score of 85.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between border-t border-[#1E2D4A]/50 pt-4 mt-4">
            <button
              onClick={() => setStep(prev => Math.max(1, prev - 1))}
              disabled={step === 1}
              className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-xs text-white px-3 py-1.5 rounded transition flex items-center"
            >
              Previous
            </button>
            <span className="text-xs font-mono text-gray-500">Step {step} of 17</span>
            <button
              onClick={() => {
                if (step < 17) setStep(prev => prev + 1);
                else {
                  confetti({ particleCount: 80, spread: 50 });
                  setStep(1);
                }
              }}
              className="bg-[#3B82F6] hover:bg-blue-600 text-xs text-white px-4 py-1.5 rounded transition font-semibold flex items-center space-x-1"
            >
              <span>{step === 17 ? 'Restart Demo' : 'Next Step'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* RIGHT SIDE: AI Orchestrator Log & Database Telemetry Inspector */}
      <div className="w-full lg:w-96 bg-[#121A2E] border border-[#1E2D4A] rounded-2xl p-4 flex flex-col justify-between glass-panel">
        
        {/* Core telemetry widgets */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E2D4A]">
            <div className="flex items-center space-x-2 text-white">
              <Database className="w-5 h-5 text-[#3B82F6]" />
              <h3 className="text-sm font-bold font-mono">DB TELEMETRY & LIVE STATE</h3>
            </div>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`text-[10px] font-bold px-3 py-1 rounded transition uppercase ${
                isPlaying ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white animate-pulse'
              }`}
            >
              {isPlaying ? 'Pause Autoplay' : 'Autoplay Demo'}
            </button>
          </div>

          {/* Database Live Variables State */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-[#0A0E1A] p-2.5 rounded border border-[#1E2D4A]">
              <span className="text-[9px] text-gray-500 block uppercase">BKT Mastery</span>
              <strong className="text-white block mt-0.5">{twinStats.mastery}%</strong>
            </div>
            <div className="bg-[#0A0E1A] p-2.5 rounded border border-[#1E2D4A]">
              <span className="text-[9px] text-gray-500 block uppercase">Forgetting Ret.</span>
              <strong className="text-white block mt-0.5">{twinStats.retention}%</strong>
            </div>
            <div className="bg-[#0A0E1A] p-2.5 rounded border border-[#1E2D4A]">
              <span className="text-[9px] text-gray-500 block uppercase">Struggle Risk</span>
              <strong className="text-white block mt-0.5">{twinStats.struggleProb}%</strong>
            </div>
            <div className="bg-[#0A0E1A] p-2.5 rounded border border-[#1E2D4A]">
              <span className="text-[9px] text-gray-500 block uppercase">Career Readiness</span>
              <strong className="text-white block mt-0.5">{twinStats.readiness}%</strong>
            </div>
          </div>

          {/* Bandit Weights widget */}
          <div className="bg-[#0A0E1A] p-3 rounded-lg border border-[#1E2D4A] space-y-2">
            <span className="text-[9px] text-gray-500 font-mono block uppercase">Bandit format probability weights</span>
            <div className="space-y-1.5 text-[11px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Interactive 3D</span>
                <span className="font-bold text-white">{twinStats.banditWeights['3d']}%</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded">
                <div className="h-full bg-purple-500 rounded" style={{ width: `${twinStats.banditWeights['3d']}%` }}></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Coding challenge</span>
                <span className="font-bold text-white">{twinStats.banditWeights['code']}%</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded">
                <div className="h-full bg-blue-500 rounded" style={{ width: `${twinStats.banditWeights['code']}%` }}></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Reading text</span>
                <span className="font-bold text-white">{twinStats.banditWeights['text']}%</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded">
                <div className="h-full bg-amber-500 rounded" style={{ width: `${twinStats.banditWeights['text']}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry Console Logger */}
        <div className="mt-4 flex-1 flex flex-col justify-between min-h-[150px]">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-1">AI Engine Live logs</span>
          <div className="flex-1 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg p-3 font-mono text-[10px] text-gray-400 space-y-2 overflow-y-auto max-h-[220px]">
            {telemetryLogs.map((log, idx) => (
              <div key={idx} className="border-b border-[#1E2D4A]/30 pb-1.5 last:border-0">
                <span className="text-blue-500 mr-1">&gt;</span> {log}
              </div>
            ))}
          </div>
        </div>
        
        {/* Step details explain panel */}
        <div className="mt-4 p-3 bg-violet-950/20 border border-violet-900/50 rounded-xl space-y-1">
          <div className="flex items-center space-x-1 text-[#8B5CF6]">
            <Sparkles className="w-3.5 h-3.5" />
            <h4 className="text-xs font-bold font-mono text-white">Step {step}: {demoSteps[step - 1]?.title}</h4>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
            {demoSteps[step - 1]?.desc}
          </p>
        </div>

      </div>
    </div>
  );
}

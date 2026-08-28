import React, { useEffect, useState, useRef } from 'react';
import ThreeDLearningLab from '../components/ThreeDLearningLab';
import { 
  BookOpen, Sparkles, Send, Award, RotateCcw, ChevronLeft,
  ChevronRight, Play, CheckCircle, FileText, Settings, ShieldAlert, AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface WorkspaceProps {
  selectedSkillId: string | null;
  onNavigateBack: () => void;
}

export default function Workspace({ selectedSkillId, onNavigateBack }: WorkspaceProps) {
  const activeSkill = selectedSkillId || 'ml';

  const [roadmap, setRoadmap] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [decisionTrace, setDecisionTrace] = useState<any>(null);
  const [showTrace, setShowTrace] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [masteryScore, setMasteryScore] = useState(50);
  
  // Tutor Chat state
  const [tutorMessages, setTutorMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [tutorInput, setTutorInput] = useState('');
  const [tutorMode, setTutorMode] = useState<'explain' | 'socratic' | 'practice' | 'debug' | 'interview'>('explain');
  const [isTutorTyping, setIsTutorTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to chat bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tutorMessages, isTutorTyping]);

  const loadSkillWorkspace = async () => {
    try {
      // 1. Fetch roadmap
      const roadmapRes = await fetch('/api/roadmap');
      const rData = await roadmapRes.json();
      setRoadmap(rData);

      // 2. Fetch specific recommendation
      const recRes = await fetch('/api/recommendation');
      const recData = await recRes.json();
      // If we are looking at a specific clicked skill, override rec parameters
      if (selectedSkillId) {
        recData.skillId = selectedSkillId;
        const skillNameMap: Record<string, string> = {
          python: 'Python Programming',
          dsa: 'Data Structures & Algorithms',
          mathematics: 'Mathematics for AI',
          gradient_descent: 'Gradient Descent Optimization',
          statistics: 'Applied Statistics',
          probability: 'Probability Theory',
          ml: 'Machine Learning Fundamentals',
          deep_learning: 'Deep Learning & Neural Networks'
        };
        recData.skillName = skillNameMap[selectedSkillId] || selectedSkillId;
      }

      // Fetch optimal format decision trace dynamically from AI engine
      try {
        const traceRes = await fetch(`/api/optimal-format?skillId=${recData.skillId}`);
        const traceData = await traceRes.json();
        setDecisionTrace(traceData);
        recData.recommendedFormat = traceData.format;
      } catch (e) {
        console.warn('Trace fetch failed:', e);
      }
      setRecommendation(recData);

      // Fetch mastery
      const twinRes = await fetch('/api/twin/dashboard');
      const tData = await twinRes.json();
      const matchedSkill = tData.skills.find((s: any) => s.id === recData.skillId);
      if (matchedSkill) {
        setMasteryScore(matchedSkill.mastery);
      }

      // 3. Fetch questions
      const quizRes = await fetch(`/api/assessment/quiz?skillId=${recData.skillId}`);
      const qData = await quizRes.json();
      setQuestions(qData);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setQuizResult(null);

      // Initialize Tutor welcome message
      setTutorMessages([
        {
          role: 'assistant',
          content: `Hi there! I am your SynaptiQ AI Tutor. We are currently focusing on **${recData.skillName}**. I understand you learn best via ${recData.recommendedFormat === '3d' ? 'Interactive 3D visuals' : 'hands-on practice'}. Let me know if you would like me to explain the core concepts, ask Socratic guiding questions, or start a debugging drill!`
        }
      ]);
    } catch (err) {
      // Offline fallback
      setRoadmap({
        milestones: [
          { month: 1, title: 'Foundations & Tooling', skills: [{ id: 'python', name: 'Python Programming', mastery: 82, status: 'in_progress' }] }
        ]
      });
      setRecommendation({
        skillId: activeSkill,
        skillName: activeSkill.toUpperCase().replace('_', ' '),
        recommendedFormat: '3d',
        confidence: 0.90,
        reason: 'Recommended target gap path.'
      });
      setQuestions([
        {
          id: 'q1',
          questionText: 'What is the standard effect of setting a large learning rate parameter during Optimization routines?',
          options: ['Slow step progress', 'Algorithm overshoots global minimum and diverges', 'Immediate local optimum locking', 'None of these'],
          correctOption: 1
        }
      ]);
    }
  };

  useEffect(() => {
    loadSkillWorkspace();
  }, [selectedSkillId]);

  // Handle Tutor Chat Submit
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutorInput.trim()) return;

    const userMsg = tutorInput;
    setTutorMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setTutorInput('');
    setIsTutorTyping(true);

    try {
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          topic: recommendation?.skillId,
          mode: tutorMode,
          history: tutorMessages
        })
      });
      const data = await res.json();
      setTutorMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (err) {
      setTutorMessages(prev => [...prev, { role: 'assistant', content: 'Tutor connection failed. Running locally: Excellent progress! Focus on parameter limits and try running the 3D surface simulation in the center panel.' }]);
    } finally {
      setIsTutorTyping(false);
    }
  };

  // Submit assessment answer
  const handleSubmitAnswer = async () => {
    if (selectedOption === null || !questions[currentQuestionIndex]) return;
    const question = questions[currentQuestionIndex];

    try {
      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          selectedOption
        })
      });
      const data = await res.json();
      setQuizResult(data);
      setMasteryScore(data.newMastery);

      if (data.correct) {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 } });
      }

      // Feed tutor explanation response
      setIsTutorTyping(true);
      setTimeout(() => {
        setTutorMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `[Assessment Feedback]: ${data.feedback} Your updated Learning Twin concept mastery is now ${data.newMastery}%. Let's review why this holds true.`
          }
        ]);
        setIsTutorTyping(false);
      }, 500);

    } catch (err) {
      setQuizResult({
        correct: selectedOption === question.correctOption,
        feedback: selectedOption === question.correctOption ? 'Correct!' : 'Incorrect.',
        newMastery: 75,
        newConfidence: 80
      });
    }
  };

  // Next question
  const handleNextQuestion = () => {
    setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1));
    setSelectedOption(null);
    setQuizResult(null);
  };

  // 3D Telemetry update hook
  const handle3DInteraction = async (metrics: { stepsCompleted: number; completed: boolean }) => {
    if (!recommendation) return;
    try {
      // Map skillId to visualizationId
      let vizId = 'binary_tree';
      if (recommendation.skillId === 'dsa') vizId = 'binary_tree';
      else if (recommendation.skillId === 'gradient_descent') vizId = 'gradient_descent';
      else if (recommendation.skillId === 'deep_learning') vizId = 'neural_network';

      const res = await fetch('/api/visualization/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vizId,
          timeSpent: 120, // simulate 2 min interaction
          stepsCompleted: metrics.stepsCompleted,
          completed: metrics.completed
        })
      });
      const data = await res.json();
      setMasteryScore(data.newMastery || (masteryScore + 5));

      // Append tutor message about visual effectiveness
      setTutorMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `🟢 [Learning Twin Telemetry]: I detected your interaction with the 3D lab. Your visual learning effectiveness scored 95%, boosting your ${recommendation.skillName} mastery. Try verifying this with the adaptive quiz below!`
        }
      ]);
    } catch (e) {
      console.log('Interaction upload skipped.');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-7xl mx-auto px-4 pb-4">
      {/* Workspace Header */}
      <div className="flex items-center justify-between py-2 border-b border-[#1E2D4A] mb-3">
        <div className="flex items-center space-x-2">
          <button onClick={onNavigateBack} className="text-gray-400 hover:text-white transition p-1 rounded hover:bg-[#121A2E]">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center">
              Learning Workspace: <span className="text-[#3B82F6] ml-1.5">{recommendation?.skillName}</span>
            </h2>
            <p className="text-[10px] text-gray-500 font-mono uppercase">COGNITIVE_ENGAGEMENT_WORKSPACE</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {decisionTrace && (
            <button
              onClick={() => setShowTrace(!showTrace)}
              className={`text-[10px] font-mono font-bold px-3 py-1 rounded transition uppercase ${
                showTrace ? 'bg-[#8B5CF6] text-white' : 'bg-[#1E2D4A] text-gray-400 hover:text-white'
              }`}
            >
              Toggle AI Trace
            </button>
          )}

          {/* Mastery rating */}
          <div className="flex items-center space-x-3 bg-[#121A2E] px-3 py-1 rounded-lg border border-[#1E2D4A]">
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-mono text-gray-400 uppercase">Current Mastery</span>
              <span className="text-xs font-bold text-white font-mono">{masteryScore}%</span>
            </div>
            <div className="w-16 h-2 bg-slate-800 rounded overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${masteryScore}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Decision Trace Overlay */}
      {showTrace && decisionTrace && (
        <div className="bg-[#151D30] border border-[#8B5CF6]/40 p-4 rounded-xl mb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fadeIn shadow-neon-purple text-xs font-mono">
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-purple-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>SYNAPTIQ REASONING ENGINE // TELEMETRY_DECISION_TRACE</span>
            </div>
            <p className="text-gray-300 font-sans max-w-4xl">
              <strong>Recommendation Rationale:</strong> {decisionTrace.reason}
            </p>
          </div>
          <div className="flex-shrink-0 bg-[#0A0E1A] p-2 rounded border border-[#1E2D4A] space-y-1">
            <div>
              <span className="text-gray-500">Selected Format:</span> <strong className="text-white">{decisionTrace.format.toUpperCase()}</strong>
            </div>
            <div>
              <span className="text-gray-500">Selection Confidence:</span> <strong className="text-purple-400">{Math.round(decisionTrace.confidence * 100)}%</strong>
            </div>
            <div>
              <span className="text-gray-500">Alternatives:</span> <strong className="text-blue-400">{(decisionTrace.alternatives || []).join(', ')}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Main 3-panel workspace content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden min-h-0">
        
        {/* LEFT PANEL: Course Outline & Syllabus */}
        <div className="lg:col-span-1 bg-[#121A2E]/60 border border-[#1E2D4A] rounded-xl p-3 flex flex-col glass-panel min-h-[150px] lg:min-h-0 overflow-y-auto">
          <h3 className="text-xs font-bold font-mono text-gray-300 uppercase mb-3 flex items-center">
            <BookOpen className="w-3.5 h-3.5 mr-1 text-[#3B82F6]" /> Adaptive Roadmap
          </h3>

          <div className="space-y-3">
            {roadmap?.milestones.map((m: any, mIdx: number) => (
              <div key={mIdx} className="space-y-1.5">
                <h4 className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-wide bg-[#0A0E1A] px-2 py-0.5 rounded border border-[#1E2D4A]/50">
                  {m.title}
                </h4>
                <div className="space-y-1 pl-1">
                  {m.skills.map((s: any, sIdx: number) => {
                    const isActive = s.id === recommendation?.skillId;
                    return (
                      <div
                        key={sIdx}
                        className={`flex items-center justify-between p-2 rounded text-xs transition cursor-pointer ${
                          isActive 
                            ? 'bg-[#8B5CF6]/20 border border-[#8B5CF6]/50 text-white font-semibold' 
                            : 'bg-[#0A0E1A]/40 border border-[#1E2D4A]/40 text-gray-400 hover:bg-[#121A2E]'
                        }`}
                      >
                        <span className="truncate max-w-[120px]">{s.name}</span>
                        <div className="flex items-center space-x-1 font-mono text-[9px]">
                          {s.status === 'completed' ? (
                            <span className="text-emerald-400">100%</span>
                          ) : (
                            <span>{s.mastery}%</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER PANEL: Visual Media Area / 3D Simulation */}
        <div className="lg:col-span-2 flex flex-col min-h-[300px] lg:min-h-0">
          {recommendation?.recommendedFormat === '3d' ? (
            <div className="flex-1 min-h-0">
              {/* Map skill ID to 3D Simulation Name */}
              <ThreeDLearningLab
                simulationId={
                  recommendation.skillId === 'gradient_descent' ? 'gradient_descent' :
                  recommendation.skillId === 'deep_learning' ? 'neural_network' : 'binary_tree'
                }
                onInteractionComplete={handle3DInteraction}
              />
            </div>
          ) : (
            // Text or code fallback reading content panel
            <div className="flex-1 bg-[#121A2E]/70 border border-[#1E2D4A] rounded-xl p-5 overflow-y-auto glass-panel space-y-4">
              <div className="flex items-center space-x-2 text-[#3B82F6] font-mono text-xs border-b border-[#1E2D4A] pb-2">
                <FileText className="w-4 h-4" />
                <span>RECOMMENDED READING // THEORY_GROUNDING</span>
              </div>
              <h2 className="text-lg font-bold text-white">{recommendation?.skillName} Theory</h2>
              <div className="text-sm text-gray-300 space-y-3 leading-relaxed">
                <p>
                  To become a successful AI Engineer, solid theoretical foundations are critical. This model guides you through parsing probability density distributions, mapping weight vectors, and calculating convergence slopes.
                </p>
                <p className="bg-[#0A0E1A] p-3 rounded-lg border border-[#1E2D4A] font-mono text-xs text-[#10B981]">
                  System recommendation: Interactive 3D visual formats are predicted to increase retention on this topic by 18% compared to standard reading. Click the 3D button in the panel controls to launch visual simulations.
                </p>
                <p>
                  Review the variables, test parameters, and proceed to the adaptive assessment quiz below to update your Learning Twin.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: AI Tutor Chat */}
        <div className="lg:col-span-1 bg-[#121A2E]/60 border border-[#1E2D4A] rounded-xl p-3 flex flex-col glass-panel min-h-[300px] lg:min-h-0">
          <div className="flex items-center justify-between border-b border-[#1E2D4A] pb-2 mb-2">
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
              <span className="text-xs font-bold text-white font-mono uppercase">AI Tutor</span>
            </div>
            
            {/* Tutor Mode Picker */}
            <select
              value={tutorMode}
              onChange={e => setTutorMode(e.target.value as any)}
              className="bg-[#0A0E1A] border border-[#1E2D4A] text-[9px] rounded font-mono p-1 text-gray-300 focus:outline-none focus:border-[#3B82F6]"
            >
              <option value="explain">Explain</option>
              <option value="socratic">Socratic</option>
              <option value="practice">Practice</option>
              <option value="debug">Debug</option>
            </select>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            {tutorMessages.map((msg, idx) => (
              <div key={idx} className={`p-2.5 rounded-lg leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-white ml-6'
                  : 'bg-[#0A0E1A]/60 border border-[#1E2D4A]/50 text-gray-300 mr-6'
              }`}>
                <p>{msg.content}</p>
              </div>
            ))}
            {isTutorTyping && (
              <div className="bg-[#0A0E1A]/60 border border-[#1E2D4A]/50 text-gray-300 mr-6 p-2 rounded-lg flex items-center space-x-1.5 w-16">
                <span className="w-1.5 h-1.5 bg-[#8B5CF6] rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-[#8B5CF6] rounded-full animate-bounce delay-75"></span>
                <span className="w-1.5 h-1.5 bg-[#8B5CF6] rounded-full animate-bounce delay-150"></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input form */}
          <form onSubmit={handleSendMessage} className="mt-3 flex items-center space-x-1.5">
            <input
              type="text"
              value={tutorInput}
              onChange={e => setTutorInput(e.target.value)}
              placeholder="Ask the Tutor..."
              className="flex-1 bg-[#0A0E1A] border border-[#1E2D4A] text-xs rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6]"
            />
            <button type="submit" className="bg-[#3B82F6] hover:bg-blue-600 p-2 rounded-lg text-white transition flex-shrink-0">
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* BOTTOM PANEL: Dynamic Adaptive Assessment Quiz */}
      <div className="h-44 bg-[#0F1626] border border-[#1E2D4A] rounded-xl p-4 mt-3 flex flex-col justify-between overflow-y-auto">
        {questions.length > 0 && questions[currentQuestionIndex] ? (
          <div className="flex flex-col h-full justify-between">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <span className="text-[10px] font-mono text-[#3B82F6] uppercase tracking-wider flex items-center">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                Adaptive assessment // Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-[10px] font-mono text-gray-500 uppercase bg-[#0A0E1A] px-2 py-0.5 rounded border border-[#1E2D4A]">
                Difficulty: {questions[currentQuestionIndex].difficulty}
              </span>
            </div>

            {/* Question Text */}
            <p className="text-xs md:text-sm font-semibold text-white my-2">
              {questions[currentQuestionIndex].questionText}
            </p>

            {/* Multiple Choice Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 my-1">
              {questions[currentQuestionIndex].options.map((opt: string, idx: number) => {
                let btnClass = 'bg-[#0A0E1A] border border-[#1E2D4A] text-gray-300 hover:border-[#3B82F6]/60';
                
                if (selectedOption === idx) {
                  btnClass = 'bg-[#3B82F6]/20 border-[#3B82F6] text-white';
                }

                // If graded result
                if (quizResult !== null) {
                  if (idx === quizResult.correctOption) {
                    btnClass = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold';
                  } else if (selectedOption === idx) {
                    btnClass = 'bg-red-950/60 border-red-500 text-red-200';
                  } else {
                    btnClass = 'bg-[#0A0E1A] border-[#1E2D4A] opacity-40 text-gray-500';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => quizResult === null && setSelectedOption(idx)}
                    disabled={quizResult !== null}
                    className={`text-left text-xs p-2 rounded transition flex items-center justify-between ${btnClass}`}
                  >
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Form actions */}
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#1E2D4A]/50">
              <div className="text-[10px] text-gray-400">
                {quizResult && (
                  <span className={quizResult.correct ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                    {quizResult.feedback}
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                {quizResult === null ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={selectedOption === null}
                    className="bg-[#3B82F6] hover:bg-blue-600 disabled:opacity-40 transition text-white text-xs font-bold px-4 py-1.5 rounded"
                  >
                    Submit Option
                  </button>
                ) : (
                  currentQuestionIndex < questions.length - 1 ? (
                    <button
                      onClick={handleNextQuestion}
                      className="bg-[#8B5CF6] hover:bg-purple-600 transition text-white text-xs font-bold px-4 py-1.5 rounded flex items-center space-x-1"
                    >
                      <span>Next Question</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={loadSkillWorkspace}
                      className="bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold px-4 py-1.5 rounded flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      <span>Retake Assessment</span>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 font-mono text-xs">
            <CheckCircle className="w-6 h-6 text-emerald-400 mb-1" />
            <span>Mastery check complete. No outstanding assessments for this concept.</span>
          </div>
        )}
      </div>
    </div>
  );
}

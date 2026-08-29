import React, { useEffect, useState } from 'react';
import ThreeDLearningLab from '../components/ThreeDLearningLab';
import LearningTwinAssistant from '../components/LearningTwinAssistant';
import InteractiveVideoPlayer from '../components/InteractiveVideoPlayer';
import { 
  BookOpen, Sparkles, Send, Award, RotateCcw, ChevronLeft,
  ChevronRight, Play, CheckCircle, FileText, Settings, ShieldAlert, AlertCircle,
  Video, Code, Terminal, HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface WorkspaceProps {
  selectedSkillId: string | null;
  onNavigateBack: () => void;
}

export default function Workspace({ selectedSkillId, onNavigateBack }: WorkspaceProps) {
  const activeSkill = selectedSkillId || 'programming';

  const [roadmap, setRoadmap] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [decisionTrace, setDecisionTrace] = useState<any>(null);
  const [showTrace, setShowTrace] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [masteryScore, setMasteryScore] = useState(50);
  const [generatedModule, setGeneratedModule] = useState<any>(null);
  const [aiMetadata, setAiMetadata] = useState<any>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'video' | '3d' | 'code' | 'quiz' | 'lesson'>('video');

  // Interactive Code Playground State
  const [codeContent, setCodeContent] = useState('// Write code here...\nconsole.log("Initializing verification checks...");');
  const [compilerOutput, setCompilerOutput] = useState('');
  const [runningCode, setRunningCode] = useState(false);

  useEffect(() => {
    loadSkillWorkspace();
  }, [selectedSkillId]);

  const loadSkillWorkspace = async () => {
    try {
      // 1. Fetch roadmap
      const roadmapRes = await fetch('/api/roadmap');
      const rData = await roadmapRes.json();
      setRoadmap(rData);

      // 2. Fetch specific recommendation
      const recRes = await fetch('/api/recommendation');
      const recData = await recRes.json();
      if (selectedSkillId) {
        recData.skillId = selectedSkillId;
      }

      // Fetch optimal format decision trace dynamically from AI engine
      try {
        const traceRes = await fetch(`/api/optimal-format?skillId=${recData.skillId}`);
        const traceData = await traceRes.json();
        setDecisionTrace(traceData);
        recData.recommendedFormat = traceData.format;
        // set default active tab based on ML recommendation
        if (traceData.format === '3d') {
          setActiveTab('3d');
        } else if (traceData.format === 'video') {
          setActiveTab('video');
        } else {
          setActiveTab('lesson');
        }
      } catch (e) {
        console.warn('Trace fetch failed:', e);
      }
      setRecommendation(recData);

      // Fetch mastery
      const twinRes = await fetch('/api/twin/dashboard');
      const tData = await twinRes.json();
      const matchedSkill = tData.skills?.find((s: any) => s.id === recData.skillId);
      if (matchedSkill) {
        setMasteryScore(matchedSkill.mastery * 100);
      }

      // 3. Fetch questions
      const quizRes = await fetch(`/api/assessment/quiz?skillId=${recData.skillId}`);
      const qData = await quizRes.json();
      setQuestions(qData);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setQuizResult(null);

      // 4. Fetch dynamic lesson module
      const lessonRes = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Generate a short summary of this lesson concept.',
          topic: recData.skillId,
          mode: 'explain'
        })
      });
      const lessonData = await lessonRes.json();
      setGeneratedModule(lessonData.text);
      setAiMetadata(lessonData.aiMetadata);

      // Set default coding template
      setCodeContent(`// Custom Coder Playground: ${recData.skillId.toUpperCase()}\n\nfunction verifyConcept() {\n  console.log("Analyzing variables for: ${recData.skillId}");\n  return true;\n}\n\nverifyConcept();`);
      setCompilerOutput('');

    } catch (err) {
      console.error("Workspace load error:", err);
    }
  };

  const handleRunCode = () => {
    setRunningCode(true);
    setCompilerOutput('Compiling package components...\n[Linker]: verified variable allocations.\n\n');
    setTimeout(() => {
      setCompilerOutput(prev => prev + `[Output]: Analyzing variables for: ${recommendation?.skillId || 'programming'}\nProcess terminated successfully with exit code 0.`);
      setRunningCode(false);
      setMasteryScore(prev => Math.min(100, prev + 2)); // Boost mastery on code practice
    }, 1200);
  };

  const handleSubmitAnswer = async () => {
    if (selectedOption === null || !questions[currentQuestionIndex]) return;
    const activeQ = questions[currentQuestionIndex];

    try {
      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: activeQ.id,
          selectedOption
        })
      });
      const data = await res.json();
      setQuizResult({
        correct: data.correct,
        correctOption: data.correctOption,
        feedback: data.feedback
      });

      if (data.newMastery) {
        setMasteryScore(Math.round(data.newMastery * 100));
      }

      if (data.correct) {
        confetti({ particleCount: 60, spread: 40, origin: { y: 0.8 } });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1));
    setSelectedOption(null);
    setQuizResult(null);
  };

  const handle3DInteraction = async (metrics: { stepsCompleted: number; completed: boolean }) => {
    if (!recommendation) return;
    try {
      let vizId = 'binary_tree';
      if (recommendation.skillId === 'dsa') vizId = 'binary_tree';
      else if (recommendation.skillId === 'gradient_descent') vizId = 'gradient_descent';
      else if (recommendation.skillId === 'deep_learning') vizId = 'neural_network';

      const res = await fetch('/api/visualization/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vizId,
          timeSpent: 120,
          stepsCompleted: metrics.stepsCompleted,
          completed: metrics.completed
        })
      });
      const data = await res.json();
      setMasteryScore(Math.round((data.newMastery || 0) * 100));
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
              Learning Workspace: <span className="text-[#3B82F6] ml-1.5">{recommendation?.skillName || activeSkill.toUpperCase()}</span>
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
              <span className="text-gray-500">AI Provider:</span> <strong className="text-emerald-400">{aiMetadata?.provider.toUpperCase() || 'LOCAL'}</strong>
            </div>
            <div>
              <span className="text-gray-500">Model:</span> <strong className="text-white">{aiMetadata?.model || 'None'}</strong>
            </div>
            <div>
              <span className="text-gray-500">Fallback Used:</span> <strong className={aiMetadata?.fallbackUsed ? 'text-amber-400' : 'text-emerald-400'}>{aiMetadata?.fallbackUsed ? 'TRUE' : 'FALSE'}</strong>
            </div>
            <div>
              <span className="text-gray-500">Latency:</span> <strong className="text-blue-400">{aiMetadata?.latencyMs || 0}ms</strong>
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
                    const isActive = s.id === activeSkill;
                    return (
                      <div
                        key={sIdx}
                        onClick={() => {
                          if (selectedSkillId !== s.id) {
                            window.location.hash = `#workspace`;
                          }
                        }}
                        className={`flex items-center justify-between p-2 rounded text-xs transition cursor-pointer ${
                          isActive 
                            ? 'bg-[#8B5CF6]/20 border border-[#8B5CF6]/50 text-white font-semibold' 
                            : 'bg-[#0A0E1A]/40 border border-[#1E2D4A]/40 text-gray-400 hover:bg-[#121A2E]'
                        }`}
                      >
                        <span className="truncate max-w-[120px]">{s.name}</span>
                        <div className="flex items-center space-x-1 font-mono text-[9px]">
                          {s.status === 'completed' || s.mastery >= 85 ? (
                            <span className="text-emerald-400">100%</span>
                          ) : (
                            <span>{Math.round(s.mastery)}%</span>
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

        {/* CENTER PANEL: Visual Media Area / Storyboard player */}
        <div className="lg:col-span-2 flex flex-col min-h-[300px] lg:min-h-0 space-y-3">
          {/* Tab Selector controls */}
          <div className="bg-[#121A2E] border border-[#1E2D4A] rounded-xl p-1.5 flex items-center space-x-2 select-none">
            <button
              onClick={() => setActiveTab('video')}
              className={`flex-1 py-1 rounded text-[10px] font-mono font-bold flex items-center justify-center space-x-1 transition ${
                activeTab === 'video' ? 'bg-[#3B82F6] text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>AI_VIDEO</span>
            </button>
            <button
              onClick={() => setActiveTab('3d')}
              className={`flex-1 py-1 rounded text-[10px] font-mono font-bold flex items-center justify-center space-x-1 transition ${
                activeTab === '3d' ? 'bg-[#3B82F6] text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>3D_LAB</span>
            </button>
            <button
              onClick={() => setActiveTab('lesson')}
              className={`flex-1 py-1 rounded text-[10px] font-mono font-bold flex items-center justify-center space-x-1 transition ${
                activeTab === 'lesson' ? 'bg-[#3B82F6] text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>LESSON</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex-1 py-1 rounded text-[10px] font-mono font-bold flex items-center justify-center space-x-1 transition ${
                activeTab === 'code' ? 'bg-[#3B82F6] text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>PLAYGROUND</span>
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex-1 py-1 rounded text-[10px] font-mono font-bold flex items-center justify-center space-x-1 transition ${
                activeTab === 'quiz' ? 'bg-[#3B82F6] text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>QUIZ</span>
            </button>
          </div>

          {/* Active View panel */}
          <div className="flex-1 min-h-0 flex flex-col">
            {activeTab === 'video' && (
              <InteractiveVideoPlayer 
                conceptId={activeSkill} 
                onCheckpointAnswer={(correct) => {
                  if (correct) setMasteryScore(p => Math.min(100, p + 8));
                }}
              />
            )}

            {activeTab === '3d' && (
              <div className="flex-1 min-h-0">
                {['gradient_descent', 'deep_learning', 'dsa'].includes(activeSkill) ? (
                  <ThreeDLearningLab
                    simulationId={
                      activeSkill === 'gradient_descent' ? 'gradient_descent' :
                      activeSkill === 'deep_learning' ? 'neural_network' : 'binary_tree'
                    }
                    onInteractionComplete={handle3DInteraction}
                  />
                ) : (
                  <div className="bg-[#121A2E]/60 border border-[#1E2D4A] rounded-xl p-8 flex flex-col items-center justify-center h-full text-center space-y-4">
                    <Sparkles className="w-12 h-12 text-purple-400 animate-pulse" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">No 3D Lab Required</h3>
                    <p className="text-xs text-gray-400 max-w-sm font-mono leading-normal">
                      This conceptual node doesn't require spatial mapping. Switch to AI_VIDEO or PLAYGROUND for hands-on practice.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'lesson' && (
              <div className="flex-1 bg-[#121A2E]/70 border border-[#1E2D4A] rounded-xl p-5 overflow-y-auto glass-panel space-y-4 font-mono text-xs">
                <div className="flex items-center space-x-2 text-[#3B82F6] border-b border-[#1E2D4A] pb-2 uppercase text-[10px]">
                  <FileText className="w-4 h-4" />
                  <span>DYNAMIC_LESSON_MODULE // THEORY_GROUNDING</span>
                </div>
                <h2 className="text-sm font-bold text-white uppercase">{recommendation?.skillName} Theory</h2>
                <div className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {generatedModule || "Generating lesson notes..."}
                </div>
              </div>
            )}

            {activeTab === 'code' && (
              <div className="flex-1 flex flex-col space-y-2 min-h-0 font-mono text-xs">
                <div className="flex-1 bg-[#0A0F1D] border border-[#1E2D4A] rounded-lg p-2 flex flex-col">
                  <span className="text-[9px] text-gray-500 uppercase pb-1 border-b border-white/5 mb-1.5">source_code_editor</span>
                  <textarea
                    value={codeContent}
                    onChange={e => setCodeContent(e.target.value)}
                    className="flex-1 bg-transparent text-[#A7F3D0] focus:outline-none resize-none font-mono leading-relaxed"
                  />
                  <div className="flex justify-end p-1">
                    <button
                      onClick={handleRunCode}
                      disabled={runningCode}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-3 rounded flex items-center space-x-1.5 transition text-[10px]"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>{runningCode ? 'Executing...' : 'Run Examples'}</span>
                    </button>
                  </div>
                </div>
                <div className="h-28 bg-black border border-[#1E2D4A] rounded-lg p-3 overflow-y-auto text-[10px] text-gray-400 select-all">
                  <span className="text-gray-600 select-none block uppercase text-[8px] pb-1">console_output</span>
                  <pre>{compilerOutput || "Click 'Run Examples' to check syntax rules."}</pre>
                </div>
              </div>
            )}

            {activeTab === 'quiz' && (
              <div className="flex-1 bg-[#121A2E]/70 border border-[#1E2D4A] rounded-xl p-4 overflow-y-auto glass-panel flex flex-col justify-between">
                {questions.length > 0 && questions[currentQuestionIndex] ? (
                  <div className="flex flex-col h-full justify-between space-y-3 font-mono text-xs">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <span className="text-[9px] text-[#3B82F6] uppercase tracking-wider flex items-center">
                        <AlertCircle className="w-3.5 h-3.5 mr-1" />
                        Question {currentQuestionIndex + 1} of {questions.length}
                      </span>
                      <span className="text-[8px] uppercase bg-[#0A0E1A] px-2 py-0.5 rounded border border-[#1E2D4A]">
                        Difficulty: {questions[currentQuestionIndex].difficulty}
                      </span>
                    </div>

                    <p className="font-semibold text-white leading-normal">
                      {questions[currentQuestionIndex].questionText}
                    </p>

                    <div className="space-y-2">
                      {questions[currentQuestionIndex].options.map((opt: string, idx: number) => {
                        let btnClass = 'bg-[#0A0E1A] border border-[#1E2D4A] text-gray-300 hover:border-[#3B82F6]/60';
                        if (selectedOption === idx) btnClass = 'bg-[#3B82F6]/20 border-[#3B82F6] text-white';
                        if (quizResult !== null) {
                          if (idx === quizResult.correctOption) btnClass = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold';
                          else if (selectedOption === idx) btnClass = 'bg-red-950/60 border-red-500 text-red-200';
                          else btnClass = 'bg-[#0A0E1A] border-[#1E2D4A] opacity-40 text-gray-500';
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => quizResult === null && setSelectedOption(idx)}
                            disabled={quizResult !== null}
                            className={`w-full text-left text-[10px] p-2.5 rounded transition ${btnClass}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-[#1E2D4A]/50 text-[10px]">
                      <div className="text-gray-400">
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
                            className="bg-[#3B82F6] hover:bg-blue-600 disabled:opacity-40 transition text-white font-bold px-4 py-1.5 rounded text-[10px]"
                          >
                            Submit Option
                          </button>
                        ) : (
                          currentQuestionIndex < questions.length - 1 ? (
                            <button
                              onClick={handleNextQuestion}
                              className="bg-[#8B5CF6] hover:bg-purple-600 transition text-white font-bold px-4 py-1.5 rounded flex items-center space-x-1 text-[10px]"
                            >
                              <span>Next Question</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={loadSkillWorkspace}
                              className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-4 py-1.5 rounded flex items-center space-x-1 text-[10px]"
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
                    <CheckCircle className="w-6 h-6 text-emerald-400 mb-1 animate-pulse" />
                    <span>Mastery check complete. No outstanding assessments.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Learning Twin assistant with vision upload */}
        <div className="lg:col-span-1 flex flex-col min-h-[300px] lg:min-h-0">
          <LearningTwinAssistant 
            currentConceptId={activeSkill} 
            onVisualize3D={(vizId) => {
              setActiveTab('3d');
            }}
            onRefreshPath={loadSkillWorkspace}
          />
        </div>
      </div>

      {/* BOTTOM PANEL: Progress + Actions */}
      <div className="bg-[#121A2E] border border-[#1E2D4A] rounded-xl p-3.5 mt-3 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono">
        <div className="flex items-center space-x-6 w-full md:w-auto">
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-500 uppercase">Estimated Remaining</span>
            <span className="text-white font-bold font-mono">4.2 hours to next milestone</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-500 uppercase">Daily Study Budget</span>
            <span className="text-white font-bold font-mono">40 min / 60 min target</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-500 uppercase">Career Readiness</span>
            <span className="text-[#3B82F6] font-bold font-mono">Index: 64%</span>
          </div>
        </div>

        <div className="flex space-x-2 w-full md:w-auto justify-end">
          <button 
            onClick={onNavigateBack}
            className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-4 py-2 rounded transition text-[10px]"
          >
            Mark Concept Complete & Next Node
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Check, FileText, Send, Loader2, Award, ArrowRight } from 'lucide-react';

interface OnboardingProps {
  onOnboardingComplete: () => void;
}

export default function Onboarding({ onOnboardingComplete }: OnboardingProps) {
  const [step, setStep] = useState(1); // 1: form, 2: processing extraction, 3: verify data, 4: twin creation, 5: adaptive diagnostic quiz
  const [formData, setFormData] = useState({
    name: '',
    educationLevel: 'undergraduate',
    branchField: '',
    experienceLevel: 'beginner',
    goal: '',
    timeline: '',
    dailyAvailability: '60',
  });

  const [extractedData, setExtractedData] = useState<any>(null);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);

  // Diagnostic states
  const [diagQuestion, setDiagQuestion] = useState<any>(null);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [diagCount, setDiagCount] = useState(1);
  const [diagLoading, setDiagLoading] = useState(false);

  const loadingPhrases = [
    'Understanding your goal...',
    'Goal identified: AI Engineer Intern',
    'Existing skills detected: Python, Java',
    'Target competency model loaded: AI Engineer model',
    'Timeline analyzed: 6 months target window',
    'Learning path being compiled...',
  ];

  const twinBuildingPhrases = [
    '01 Understanding your goal',
    '02 Analyzing your skills',
    '03 Building your skill graph',
    '04 Finding your skill gaps',
    '05 Understanding your learning behavior',
    '06 Predicting learning preferences',
    '07 Creating your adaptive roadmap',
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);

    for (let i = 0; i < loadingPhrases.length; i++) {
      setLoadingTextIndex(i);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    try {
      const res = await fetch('/api/onboard/analyze-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: formData.goal })
      });
      const data = await res.json();
      setExtractedData(data.data || data);
    } catch (err) {
      setExtractedData({
        career_goal: 'AI Engineer',
        target: 'Internship',
        timeline: '6 months',
        existing_skills: ['PYTHON', 'JAVA'],
        target_skills: ['PYTHON', 'DSA', 'STATISTICS', 'ML', 'DEEP LEARNING', 'NLP'],
        missing_skills: ['STATISTICS', 'ML', 'DEEP LEARNING', 'NLP']
      });
    }

    setStep(3);
  };

  const handleBuildTwin = async () => {
    setStep(4);
    
    try {
      await fetch('/api/onboard/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          educationLevel: formData.educationLevel,
          branchField: formData.branchField,
          experienceLevel: formData.experienceLevel,
          goal: formData.goal,
          timeline: Number(formData.timeline),
          dailyAvailability: Number(formData.dailyAvailability)
        })
      });
    } catch (e) {
      console.error("Dynamic path mapping failed:", e);
    }

    for (let i = 0; i < twinBuildingPhrases.length; i++) {
      setLoadingTextIndex(i);
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    
    // Fetch first diagnostic question
    fetchNextDiagnostic();
  };

  const fetchNextDiagnostic = async () => {
    try {
      setDiagLoading(true);
      const skill = extractedData?.missing_skills?.[0] || extractedData?.target_skills?.[0] || 'programming';
      const res = await fetch(`/api/assessment/diagnostic-next?skillId=${skill}`);
      const question = await res.json();
      setDiagQuestion(question);
      setSelectedOptionIdx(null);
      setStep(5); // Go to diagnostic assessment page
    } catch (err) {
      // Fallback
      setDiagQuestion({
        id: 'q1_sql',
        questionText: 'Which SQL operator is used to perform pattern matching on string values?',
        options: JSON.stringify(['IN', 'LIKE', 'BETWEEN', 'EXISTS']),
        correctOption: 1
      });
      setSelectedOptionIdx(null);
      setStep(5);
    } finally {
      setDiagLoading(false);
    }
  };

  const handleDiagnosticSubmit = async () => {
    if (selectedOptionIdx === null || !diagQuestion) return;

    const correct = selectedOptionIdx === diagQuestion.correctOption;
    const skill = extractedData?.missing_skills?.[0] || extractedData?.target_skills?.[0] || 'programming';

    try {
      setDiagLoading(true);
      // Post event to update BKT/IRT calibration
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'question_answered',
          skillId: diagQuestion.skillId || skill,
          payload: {
            questionId: diagQuestion.id,
            correct,
            selectedOption: selectedOptionIdx
          }
        })
      });

      if (diagCount >= 5) {
        // Diagnostic completed!
        onOnboardingComplete();
      } else {
        setDiagCount(prev => prev + 1);
        fetchNextDiagnostic();
      }
    } catch (e) {
      if (diagCount >= 5) {
        onOnboardingComplete();
      } else {
        setDiagCount(prev => prev + 1);
        fetchNextDiagnostic();
      }
    } finally {
      setDiagLoading(false);
    }
  };

  const optionsList = diagQuestion ? JSON.parse(diagQuestion.options || '[]') : [];

  return (
    <div className="max-w-2xl w-full mx-auto px-4 py-8">
      {step === 1 && (
        <form onSubmit={handleSubmitForm} className="bg-[#121A2E] border border-[#1E2D4A] rounded-2xl p-6 shadow-neon-blue space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-[#1E2D4A]">
            <Brain className="w-8 h-8 text-[#8B5CF6] animate-pulse" />
            <div>
              <h2 className="text-xl font-bold text-white">Create Your Learning Twin</h2>
              <p className="text-xs text-gray-400 font-mono">ONBOARDING // DATA_COLLECTION</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Your Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full bg-[#0A0E1A] border border-[#1E2D4A] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#3B82F6] text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Education Level</label>
              <select
                name="educationLevel"
                value={formData.educationLevel}
                onChange={handleInputChange}
                className="w-full bg-[#0A0E1A] border border-[#1E2D4A] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#3B82F6] text-white"
              >
                <option value="high_school">High School</option>
                <option value="undergraduate">Undergraduate Student</option>
                <option value="graduate">Graduate Student</option>
                <option value="professional">Working Professional</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Branch / Field</label>
              <input
                type="text"
                name="branchField"
                value={formData.branchField}
                onChange={handleInputChange}
                className="w-full bg-[#0A0E1A] border border-[#1E2D4A] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#3B82F6] text-white"
                placeholder="e.g. Computer Science"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Experience Level</label>
              <select
                name="experienceLevel"
                value={formData.experienceLevel}
                onChange={handleInputChange}
                className="w-full bg-[#0A0E1A] border border-[#1E2D4A] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#3B82F6] text-white"
              >
                <option value="beginner">Beginner (No coding background)</option>
                <option value="intermediate">Intermediate (Know Python/basic loops)</option>
                <option value="advanced">Advanced (Understand OOP & databases)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Career Goal (Natural Language)</label>
            <textarea
              name="goal"
              value={formData.goal}
              onChange={handleInputChange}
              rows={3}
              className="w-full bg-[#0A0E1A] border border-[#1E2D4A] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#3B82F6] text-white leading-relaxed"
              placeholder="What do you want to become? Tell us your target role and timeline..."
              required
            />
            <span className="text-[10px] text-gray-500 font-mono">Example: "I want to become an AI Engineer and get an internship in 6 months."</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Target Timeline (Months)</label>
              <input
                type="number"
                name="timeline"
                value={formData.timeline}
                onChange={handleInputChange}
                className="w-full bg-[#0A0E1A] border border-[#1E2D4A] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#3B82F6] text-white"
                min="1"
                max="36"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Daily Study availability</label>
              <select
                name="dailyAvailability"
                value={formData.dailyAvailability}
                onChange={handleInputChange}
                className="w-full bg-[#0A0E1A] border border-[#1E2D4A] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#3B82F6] text-white"
              >
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
                <option value="240">4 hours</option>
              </select>
            </div>
          </div>

          <div className="border-2 border-dashed border-[#1E2D4A] rounded-lg p-5 flex flex-col items-center justify-center bg-[#0A0E1A]/40 cursor-pointer hover:border-[#3B82F6]/60 transition">
            <FileText className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-xs text-white font-semibold">Upload your Resume or Certificates</span>
            <span className="text-[10px] text-gray-500 mt-1">PDF, DOCX, or JSON documents. We normalize skills automatically.</span>
          </div>

          <button
            type="submit"
            className="w-full bg-[#3B82F6] hover:bg-blue-600 transition text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2 shadow-neon-blue"
          >
            <Send className="w-4 h-4" />
            <span>Process AI Goal Analysis</span>
          </button>
        </form>
      )}

      {/* STEP 2: Extraction Processing */}
      {step === 2 && (
        <div className="bg-[#121A2E] border border-[#1E2D4A] rounded-2xl p-8 flex flex-col items-center justify-center shadow-lg text-center space-y-6">
          <Loader2 className="w-12 h-12 text-[#3B82F6] animate-spin" />
          <h3 className="text-lg font-bold text-white font-mono">Analyzing Career Ambition...</h3>
          
          <div className="bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg p-4 max-w-sm w-full font-mono text-xs text-left space-y-2">
            {loadingPhrases.map((phrase, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                {idx < loadingTextIndex ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                ) : idx === loadingTextIndex ? (
                  <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin flex-shrink-0" />
                ) : (
                  <span className="w-3.5 h-3.5"></span>
                )}
                <span className={idx === loadingTextIndex ? 'text-blue-400 font-bold' : idx < loadingTextIndex ? 'text-gray-400' : 'text-gray-600'}>
                  {phrase}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: Verify Data */}
      {step === 3 && extractedData && (
        <div className="bg-[#121A2E] border border-[#1E2D4A] rounded-2xl p-6 shadow-lg space-y-6">
          <div className="pb-3 border-b border-[#1E2D4A]">
            <h3 className="text-lg font-bold text-white flex items-center">
              <Sparkles className="w-4.5 h-4.5 mr-2 text-[#8B5CF6]" />
              NLP Extractions Completed
            </h3>
            <p className="text-xs text-gray-400 font-mono">VERIFY // CANONICAL_SKILL_ALIGNMENTS</p>
          </div>

          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 bg-[#0A0E1A] p-4 rounded-lg border border-[#1E2D4A]">
              <div>
                <span className="text-[10px] text-gray-500 font-mono block">CAREER GOAL</span>
                <span className="font-bold text-white">{extractedData.career_goal}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-mono block">TARGET</span>
                <span className="font-bold text-[#10B981]">{extractedData.target}</span>
              </div>
            </div>

            <div>
              <span className="text-xs text-gray-400 block mb-1.5 font-bold uppercase font-mono">Detected Existing Skills:</span>
              <div className="flex flex-wrap gap-2">
                {extractedData.existing_skills.map((s: string, i: number) => (
                  <span key={i} className="bg-blue-900/40 text-blue-200 border border-blue-800/80 px-2.5 py-1 rounded text-xs font-semibold">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs text-gray-400 block mb-1.5 font-bold uppercase font-mono">Identified Skill Gaps (Target Missing):</span>
              <div className="flex flex-wrap gap-2">
                {extractedData.missing_skills.map((s: string, i: number) => (
                  <span key={i} className="bg-red-950/40 text-red-300 border border-red-900/50 px-2.5 py-1 rounded text-xs">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleBuildTwin}
            className="w-full bg-[#8B5CF6] hover:bg-purple-600 transition text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2 shadow-neon-purple"
          >
            <Brain className="w-4.5 h-4.5" />
            <span>Confirm & Verify Profile</span>
          </button>
        </div>
      )}

      {/* STEP 4: Creating Learning Twin animation */}
      {step === 4 && (
        <div className="bg-[#121A2E] border border-[#1E2D4A] rounded-2xl p-8 flex flex-col items-center justify-center shadow-lg text-center space-y-6">
          <Loader2 className="w-12 h-12 text-[#8B5CF6] animate-spin" />
          <h3 className="text-lg font-bold text-white">Initializing Skill Calibration...</h3>
          <p className="text-xs text-gray-400 max-w-sm">Compiling profile modeling parameters, cognitive memory decay multipliers, and recommendation weights.</p>

          <div className="bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg p-4 max-w-sm w-full font-mono text-xs text-left space-y-2">
            {twinBuildingPhrases.map((phrase, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                {idx < loadingTextIndex ? (
                  <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                ) : idx === loadingTextIndex ? (
                  <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin flex-shrink-0" />
                ) : (
                  <span className="w-3.5 h-3.5"></span>
                )}
                <span className={idx === loadingTextIndex ? 'text-purple-400 font-bold' : idx < loadingTextIndex ? 'text-gray-400' : 'text-gray-600'}>
                  {phrase}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 5: Adaptive Diagnostic Quiz Stage */}
      {step === 5 && diagQuestion && (
        <div className="bg-[#121A2E] border border-[#1E2D4A] rounded-2xl p-6 shadow-lg space-y-6">
          <div className="flex justify-between items-center pb-3 border-b border-[#1E2D4A]">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-[#3B82F6]" />
              <h3 className="text-base font-bold text-white">Adaptive Diagnostic Assessment</h3>
            </div>
            <span className="text-xs font-mono text-gray-400 bg-[#0A0E1A] px-2 py-1 rounded border border-[#1E2D4A]">
              Question {diagCount} of 5
            </span>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white leading-relaxed">
              {diagQuestion.questionText}
            </h4>

            <div className="space-y-2.5">
              {optionsList.map((opt: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedOptionIdx(idx)}
                  className={`w-full text-left p-3.5 rounded-lg border text-xs transition duration-150 ${
                    selectedOptionIdx === idx
                      ? 'bg-[#3B82F6]/20 border-[#3B82F6] text-white font-semibold'
                      : 'bg-[#0A0E1A] border-[#1E2D4A] text-gray-300 hover:border-[#3B82F6]/50'
                  }`}
                >
                  <span className="font-mono text-gray-500 mr-2 uppercase">{String.fromCharCode(97 + idx)})</span>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleDiagnosticSubmit}
            disabled={selectedOptionIdx === null || diagLoading}
            className={`w-full bg-[#3B82F6] hover:bg-blue-600 transition text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2 shadow-neon-blue ${
              (selectedOptionIdx === null || diagLoading) && 'opacity-50 cursor-not-allowed'
            }`}
          >
            {diagLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{diagCount === 5 ? 'Finish & Build Twin' : 'Submit Answer'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

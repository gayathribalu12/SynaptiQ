import React, { useEffect, useState } from 'react';
import SkillGraph from '../components/SkillGraph';
import LearningTwinAssistant from '../components/LearningTwinAssistant';
import { 
  Sparkles, Award, ArrowUpRight, Flame, BarChart2, CheckCircle2,
  Calendar, AlertTriangle, BookOpen, PlayCircle, Star, Clock, Target, Compass, Cpu, ChevronRight, Brain
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

interface DashboardProps {
  onNavigate: (page: 'landing' | 'onboarding' | 'dashboard' | 'workspace' | 'demo') => void;
  setSelectedSkillId: (skillId: string) => void;
}

export default function Dashboard({ onNavigate, setSelectedSkillId }: DashboardProps) {
  const [twinData, setTwinData] = useState<any>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Time & Simulator states
  const [studyHours, setStudyHours] = useState(2);
  const [simulation, setSimulation] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [activeDomain, setActiveDomain] = useState('AI & Machine Learning');

  // CS Domain list
  const csDomains = [
    'AI & Machine Learning',
    'Data Structures & Algorithms',
    'Database Management',
    'Operating Systems',
    'Computer Networks',
    'Software Engineering',
    'Cybersecurity',
    'Distributed Systems',
    'Emerging Technologies'
  ];

  // Fetch twin stats, skill graph, recommendation, and path simulator
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [twinRes, graphRes, recRes, roadmapRes] = await Promise.all([
        fetch('/api/twin/dashboard'),
        fetch('/api/skills/graph'),
        fetch('/api/recommendation'),
        fetch('/api/roadmap')
      ]);

      const tData = await twinRes.json();
      const gData = await graphRes.json();
      const rData = await recRes.json();
      const roadData = await roadmapRes.json();

      setTwinData(tData);
      setGraphData(gData);
      setRecommendation(rData);
      setRoadmap(roadData);

      // Fetch path simulation
      const simRes = await fetch('/api/path/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speedHoursPerDay: studyHours })
      });
      const simData = await simRes.json();
      setSimulation(simData);

    } catch (err) {
      console.warn("Backend connection skipped, loading mock twin.");
      // offline fallback
      setTwinData({
        name: 'Alex',
        overallMastery: 54,
        careerReadiness: 48,
        learningVelocity: 12,
        retention: 70,
        streak: 8,
        predictedSuccess: 68,
        skills: [
          { id: 'python', name: 'Python Programming', mastery: 82, confidence: 85, retention: 90, struggleProbability: 5 },
          { id: 'dsa', name: 'Data Structures & Algorithms', mastery: 70, confidence: 75, retention: 85, struggleProbability: 15 },
          { id: 'sql', name: 'SQL & Database Design', mastery: 35, confidence: 40, retention: 60, struggleProbability: 25 },
          { id: 'os_fundamentals', name: 'Operating Systems & Scheduling', mastery: 42, confidence: 45, retention: 60, struggleProbability: 45 }
        ],
        preferences: { '3d': 95, 'code': 88, 'video': 72, 'text': 41 },
        modelRegistry: {
          models: {
            "bkt-math-v1": { active: true, type: "knowledge_tracing", metrics: { log_loss: 0.31 } },
            "struggle-lr-v1": { active: true, type: "struggle_prediction", metrics: { auc: 0.88 } }
          }
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = async (hours: number) => {
    try {
      setSimLoading(true);
      const res = await fetch('/api/path/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speedHoursPerDay: hours })
      });
      const data = await res.json();
      setSimulation(data);
    } catch (e) {
      // Mock simulation fallback
      setSimulation({
        estimated_days: Math.ceil(45 / hours),
        completion_date: '2026-11-20',
        simulated_steps: [
          { name: 'SQL & Database Design', days_needed: Math.ceil(8 / hours), completion_date: '2026-09-10' },
          { name: 'Operating Systems', days_needed: Math.ceil(15 / hours), completion_date: '2026-10-05' },
          { name: 'System Design', days_needed: Math.ceil(22 / hours), completion_date: '2026-11-20' }
        ]
      });
    } finally {
      setSimLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSelectSkill = (skillId: string) => {
    setSelectedSkillId(skillId);
    onNavigate('workspace');
  };

  const handleStudyHoursChange = (val: number) => {
    setStudyHours(val);
    runSimulation(val);
  };

  if (loading || !twinData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <span className="w-8 h-8 rounded-full border-2 border-t-transparent border-[#3B82F6] animate-spin mb-2"></span>
        <span className="text-xs font-mono text-gray-400">LOADING_DYNAMIC_CS_PATHWAY...</span>
      </div>
    );
  }

  if (twinData.onboarded === false) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-6 text-center">
        <div className="bg-[#121A2E] border border-[#1E2D4A] rounded-2xl p-8 shadow-neon-blue space-y-6 flex flex-col items-center">
          <Brain className="w-16 h-16 text-[#3B82F6] animate-pulse" />
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Design Your Personalized Journey</h2>
            <p className="text-sm text-gray-400">
              SynaptiQ has zero predefined paths. Tell us what career, technologies, or custom engineering goals you are pursuing, and our AI will build your roadmap.
            </p>
          </div>
          
          <button
            onClick={() => onNavigate('onboarding')}
            className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:from-blue-600 hover:to-purple-600 transition text-white font-bold py-3 px-8 rounded-lg flex items-center space-x-2 shadow-md"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Map My Learning Twin Now</span>
          </button>
        </div>
      </div>
    );
  }

  const radarData = Object.entries(twinData.preferences || {}).map(([format, val]) => ({
    format: format.toUpperCase(),
    value: val
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 pb-12">
      {/* 1. Header Profile & Goal Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#121A2E]/60 border border-[#1E2D4A] rounded-xl p-5 glass-panel">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-gray-500 font-mono uppercase">TARGET GOAL</span>
            <span className="bg-[#8B5CF6]/20 text-[#8B5CF6] text-[10px] font-bold px-2 py-0.5 rounded border border-[#8B5CF6]/40">Active Path</span>
            {twinData.groqConfigured ? (
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded font-mono flex items-center space-x-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                <span>GROQ_AI: CONNECTED ({twinData.groqModel})</span>
              </span>
            ) : (
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] px-2 py-0.5 rounded font-mono flex items-center space-x-1 animate-pulse">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping"></span>
                <span>LOCAL_FALLBACK (OFFLINE)</span>
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-white flex items-center">
            {twinData.careerTitle || 'Custom Pathway'} <ChevronRight className="w-4 h-4 mx-1.5 text-gray-500" /> <span className="text-[#3B82F6]">{twinData.userName || 'Learner'}</span>
          </h1>
          <p className="text-xs text-gray-400">Target Timeline: {twinData.timelineMonths || 6} Months (Diagnostics validated)</p>
        </div>

        {/* Time-Aware Controls */}
        <div className="flex items-center space-x-4 bg-[#0A0E1A] p-3 rounded-lg border border-[#1E2D4A]">
          <div className="flex items-center space-x-1.5 text-gray-400">
            <Clock className="w-4 h-4 text-[#3B82F6]" />
            <span className="text-xs font-mono">Study Speed:</span>
          </div>
          <select 
            value={studyHours} 
            onChange={e => handleStudyHoursChange(Number(e.target.value))}
            className="bg-[#121A2E] border border-[#1E2D4A] text-xs rounded font-mono p-1 text-white focus:outline-none focus:border-[#8B5CF6]"
          >
            <option value="1">1 Hour / Day</option>
            <option value="2">2 Hours / Day (Ideal)</option>
            <option value="4">4 Hours / Day (Accelerated)</option>
          </select>
        </div>
      </div>

      {/* 2. Top Telemetry Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { title: 'Overall Mastery', value: `${twinData.overallMastery}%`, icon: <Award className="w-4 h-4 text-[#8B5CF6]" /> },
          { title: 'Career Readiness', value: `${twinData.careerReadiness}%`, icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
          { title: 'Learning Velocity', value: `+${twinData.learningVelocity}%`, icon: <ArrowUpRight className="w-4 h-4 text-blue-400" /> },
          { title: 'Retention Est.', value: `${twinData.retention}%`, icon: <Calendar className="w-4 h-4 text-amber-400" /> },
          { title: 'Daily Streak', value: `${twinData.streak} days`, icon: <Flame className="w-4 h-4 text-red-400" /> },
          { title: 'Predicted Success', value: `${twinData.predictedSuccess}%`, icon: <Star className="w-4 h-4 text-yellow-400" /> }
        ].map((item, idx) => (
          <div key={idx} className="bg-[#121A2E] border border-[#1E2D4A] rounded-xl p-4 glass-panel flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-gray-400 uppercase">{item.title}</span>
              {item.icon}
            </div>
            <span className="text-xl font-bold text-white mt-2 font-mono">{item.value}</span>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] opacity-30"></div>
          </div>
        ))}
      </div>

      {/* 3. Next Best Action Explainability card */}
      {recommendation && (
        <div className="bg-gradient-to-r from-[#121A2E] to-[#16132D] border border-violet-900/50 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-neon-purple relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4.5 h-4.5 text-[#8B5CF6] animate-pulse" />
              <span className="text-xs font-mono font-bold text-purple-300 uppercase tracking-widest">AI ORCHESTRATOR // NEXT BEST ACTION</span>
            </div>
            <h2 className="text-base font-bold text-white">
              Target Concept: <span className="text-[#3B82F6]">{recommendation.skillName}</span>
            </h2>
            <p className="text-xs text-gray-300 font-sans leading-relaxed max-w-3xl">
              {recommendation.reason}
            </p>
          </div>

          <button
            onClick={() => handleSelectSkill(recommendation.skillId)}
            className="flex-shrink-0 bg-[#8B5CF6] hover:bg-purple-600 transition text-white font-semibold text-xs px-5 py-2.5 rounded-lg flex items-center space-x-1.5 shadow-md relative z-10"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Launch Recommended {recommendation.recommendedFormat?.toUpperCase()} Lab</span>
          </button>
        </div>
      )}

      {/* 4. CS Domain Explorer & Dynamic Pathway Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Domain Explorer & Roadmap Step milestones */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Domain Explorer Badge list */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold font-mono text-gray-400 uppercase flex items-center">
              <Compass className="w-4 h-4 mr-1.5 text-[#3B82F6]" /> Computer Science Domain Explorer
            </h2>
            <div className="flex flex-wrap gap-2">
              {csDomains.map((d, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveDomain(d)}
                  className={`text-[10px] font-mono px-3 py-1.5 rounded transition ${
                    activeDomain === d 
                      ? 'bg-[#3B82F6] text-white border border-transparent' 
                      : 'bg-[#121A2E] text-gray-400 hover:text-white border border-[#1E2D4A]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Pathway Roadmap milestones list */}
          {roadmap && (
            <div className="bg-[#121A2E]/50 border border-[#1E2D4A] rounded-xl p-5 glass-panel space-y-4">
              <h2 className="text-xs font-bold font-mono text-gray-300 uppercase">🛣️ Numbered Pathway Sequence ({activeDomain})</h2>
              
              <div className="space-y-3">
                {roadmap.milestones?.map((milestone: any, mIdx: number) => (
                  <div key={mIdx} className="space-y-2">
                    <h3 className="text-xs font-mono font-bold text-[#8B5CF6] border-b border-[#1E2D4A]/50 pb-1 mt-3">
                      {milestone.title}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {milestone.skills.map((s: any, sIdx: number) => {
                        const statusColors: Record<string, string> = {
                          completed: 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300',
                          in_progress: 'bg-blue-950/40 border-blue-500/50 text-blue-300',
                          revision_required: 'bg-red-950/40 border-red-500/50 text-red-300',
                          locked: 'bg-slate-900/40 border-slate-800 text-gray-500 opacity-50'
                        };
                        return (
                          <div 
                            key={sIdx} 
                            onClick={() => s.status !== 'locked' && handleSelectSkill(s.id)}
                            className={`p-3 border rounded-lg text-xs flex justify-between items-center transition cursor-pointer ${
                              statusColors[s.status] || 'border-[#1E2D4A] text-white'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <span className="font-bold block">{s.name}</span>
                              <span className="text-[9px] uppercase font-mono tracking-wider opacity-85">
                                Status: {s.status.replace('_', ' ')}
                              </span>
                            </div>
                            {s.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Path Simulator, Bandit Radar, and active models registry */}
        <div className="space-y-6">
          
          {/* Path Simulator Panel */}
          {simulation && (
            <div className="bg-[#121A2E]/70 border border-[#1E2D4A] rounded-xl p-4 glass-panel space-y-3 relative overflow-hidden">
              <div className="flex items-center space-x-1.5 text-[#3B82F6]">
                <Target className="w-4 h-4" />
                <h3 className="text-xs font-bold font-mono uppercase text-white">Path Simulator Console</h3>
              </div>
              <p className="text-[11px] text-gray-400">
                Simulated progress based on velocity of <strong className="text-white">8% mastery/hour</strong>.
              </p>

              <div className="bg-[#0A0E1A] p-3 rounded border border-[#1E2D4A] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400 font-mono">Completion Date:</span>
                  <strong className="text-emerald-400 font-mono">{simulation.completion_date}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-mono">Duration Needed:</span>
                  <strong className="text-white font-mono">{simulation.estimated_days} days</strong>
                </div>
              </div>

              <div className="space-y-1.5 text-[10px] max-h-40 overflow-y-auto">
                {simulation.simulated_steps?.map((step: any, sIdx: number) => (
                  <div key={sIdx} className="flex justify-between text-gray-400 border-b border-[#1E2D4A]/30 py-1">
                    <span>{step.name}</span>
                    <span className="font-mono text-white">{step.completion_date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optimal Bandit weights Radar */}
          <div className="bg-[#121A2E] border border-[#1E2D4A] rounded-xl p-4 glass-panel space-y-3">
            <h3 className="text-xs font-bold font-mono text-gray-300 uppercase">🧠 Format Preference Weights</h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#1E2D4A" />
                  <PolarAngleAxis dataKey="format" tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'monospace' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#4B5563' }} />
                  <Radar name="Format Pref" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Learning Twin Multimodal Assistant */}
          <LearningTwinAssistant onRefreshPath={fetchDashboardData} />

          {/* 3. AI Models Registry Panel */}
          {twinData.modelRegistry && (
            <div className="bg-[#121A2E]/50 border border-[#1E2D4A] rounded-xl p-4 glass-panel space-y-3">
              <div className="flex items-center space-x-1.5 text-yellow-500">
                <Cpu className="w-4 h-4" />
                <h3 className="text-xs font-bold font-mono uppercase text-white">Active Model Registry</h3>
              </div>
              
              <div className="space-y-2 text-[10px] font-mono">
                {Object.entries(twinData.modelRegistry.models || {}).map(([name, data]: any, idx) => (
                  <div key={idx} className="p-2 bg-[#0A0E1A] rounded border border-[#1E2D4A]/50 flex justify-between items-center">
                    <div>
                      <span className="text-[#3B82F6] font-bold">{name}</span>
                      <span className="block text-[8px] text-gray-500">Type: {data.type}</span>
                    </div>
                    <span className="bg-emerald-950 text-emerald-400 text-[8px] px-1 py-0.5 rounded font-bold uppercase">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}


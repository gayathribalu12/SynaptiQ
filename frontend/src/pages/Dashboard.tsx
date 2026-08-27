import React, { useEffect, useState } from 'react';
import SkillGraph from '../components/SkillGraph';
import { 
  Sparkles, Award, ArrowUpRight, Flame, BarChart2, CheckCircle2,
  Calendar, AlertTriangle, BookOpen, User, PlayCircle, Star
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

interface DashboardProps {
  onNavigate: (page: 'workspace' | 'demo') => void;
  setSelectedSkillId: (skillId: string) => void;
}

export default function Dashboard({ onNavigate, setSelectedSkillId }: DashboardProps) {
  const [twinData, setTwinData] = useState<any>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch twin stats, skill graph, and recommendation
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [twinRes, graphRes, recRes] = await Promise.all([
        fetch('/api/twin/dashboard'),
        fetch('/api/skills/graph'),
        fetch('/api/recommendation')
      ]);

      const tData = await twinRes.json();
      const gData = await graphRes.json();
      const rData = await recRes.json();

      setTwinData(tData);
      setGraphData(gData);
      setRecommendation(rData);
    } catch (err) {
      // Offline fallback defaults
      const mockTwin = {
        name: 'Alex',
        overallMastery: 68,
        careerReadiness: 54,
        learningVelocity: 12,
        retention: 73,
        streak: 8,
        predictedSuccess: 82,
        skills: [
          { id: 'python', name: 'Python Programming', mastery: 82, confidence: 85, retention: 90, struggleProbability: 5 },
          { id: 'dsa', name: 'Data Structures & Algorithms', mastery: 70, confidence: 75, retention: 85, struggleProbability: 15 },
          { id: 'statistics', name: 'Applied Statistics', mastery: 42, confidence: 45, retention: 60, struggleProbability: 45 },
          { id: 'probability', name: 'Probability Theory', mastery: 38, confidence: 35, retention: 50, struggleProbability: 60 },
          { id: 'gradient_descent', name: 'Gradient Descent Optimization', mastery: 30, confidence: 25, retention: 40, struggleProbability: 70 },
          { id: 'ml', name: 'Machine Learning Fundamentals', mastery: 35, confidence: 40, retention: 55, struggleProbability: 50 },
          { id: 'deep_learning', name: 'Deep Learning & Neural Networks', mastery: 18, confidence: 20, retention: 30, struggleProbability: 80 }
        ],
        preferences: { '3d': 95, 'code': 88, 'video': 72, 'text': 41 }
      };

      const mockGraph = {
        nodes: mockTwin.skills.map(s => ({
          id: s.id,
          name: s.name,
          category: s.id === 'python' || s.id === 'dsa' ? 'Programming' : 'AI',
          mastery: s.mastery,
          status: s.mastery >= 80 ? 'mastered' : s.mastery >= 60 ? 'strong' : s.mastery >= 30 ? 'learning' : 'weak',
          difficulty: 'intermediate'
        })),
        links: [
          { source: 'python', target: 'dsa' },
          { source: 'statistics', target: 'ml' },
          { source: 'gradient_descent', target: 'ml' },
          { source: 'ml', target: 'deep_learning' }
        ]
      };

      const mockRec = {
        nextAction: 'learn',
        skillId: 'ml',
        skillName: 'Machine Learning Fundamentals',
        recommendedFormat: '3d',
        confidence: 0.92,
        reason: 'Targets your primary career skill gap. Prerequisite check passed, with a predicted struggle rate of 50%.'
      };

      setTwinData(mockTwin);
      setGraphData(mockGraph);
      setRecommendation(mockRec);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading || !twinData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <span className="w-8 h-8 rounded-full border-2 border-t-transparent border-[#3B82F6] animate-spin mb-2"></span>
        <span className="text-xs font-mono text-gray-400">SYNCING_LEARNING_TWIN...</span>
      </div>
    );
  }

  // Formatting preference radar charts
  const radarData = Object.entries(twinData.preferences).map(([format, val]) => ({
    format: format.toUpperCase(),
    value: val
  }));

  // Velocity data graph mockup
  const velocityTrend = [
    { week: 'Wk 1', mastery: 45 },
    { week: 'Wk 2', mastery: 50 },
    { week: 'Wk 3', mastery: 52 },
    { week: 'Wk 4', mastery: 58 },
    { week: 'Wk 5', mastery: 61 },
    { week: 'Wk 6', mastery: 68 }
  ];

  const handleSelectSkill = (skillId: string) => {
    setSelectedSkillId(skillId);
    onNavigate('workspace');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 pb-12">
      {/* Dashboard Top telemetry stats */}
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

      {/* Recommended Next Action Panel */}
      {recommendation && (
        <div className="bg-gradient-to-r from-[#121A2E] to-[#16132D] border border-violet-900/50 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-neon-purple relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4.5 h-4.5 text-[#8B5CF6] animate-pulse" />
              <span className="text-xs font-mono font-bold text-purple-300 uppercase tracking-widest">AI ORCHESTRATOR // NEXT RECOMMENDATION</span>
            </div>
            <h2 className="text-base font-bold text-white">
              Target Concept: <span className="text-[#3B82F6]">{recommendation.skillName}</span>
            </h2>
            <p className="text-xs text-gray-400 font-sans leading-relaxed max-w-3xl">
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

      {/* Main Graph Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Skill Graph */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-sm font-bold font-mono text-gray-300">🕸️ DYNAMIC SKILL KNOWLEDGE TREE</h2>
            <span className="text-[10px] text-gray-500 font-mono">Prerequisite-grounded model</span>
          </div>
          {graphData && (
            <div className="h-[480px]">
              <SkillGraph
                nodes={graphData.nodes}
                links={graphData.links}
                onSelectSkill={handleSelectSkill}
              />
            </div>
          )}
        </div>

        {/* Right 1 col: Cognitive & Preferences Analytics */}
        <div className="space-y-6">
          {/* 1. Format effectiveness radar chart */}
          <div className="bg-[#121A2E] border border-[#1E2D4A] rounded-xl p-4 glass-panel space-y-3">
            <h3 className="text-xs font-bold font-mono text-gray-300 uppercase">🧠 OPTIMAL FORMAT EFFECTIVENESS (BANDIT)</h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" radius="70%" data={radarData}>
                  <PolarGrid stroke="#1E2D4A" />
                  <PolarAngleAxis dataKey="format" tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'monospace' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#4B5563' }} />
                  <Radar name="Format Pref" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-gray-400 font-sans text-center">
              Bandit favors <strong className="text-purple-300">Interactive 3D</strong> and <strong className="text-purple-300">Coding</strong> for difficult visual mechanics.
            </p>
          </div>

          {/* 2. Mastery growth Area chart */}
          <div className="bg-[#121A2E] border border-[#1E2D4A] rounded-xl p-4 glass-panel space-y-3">
            <h3 className="text-xs font-bold font-mono text-gray-300 uppercase">📈 LEARNING VELOCITY TRAJECTORY</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={velocityTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis dataKey="week" tick={{ fill: '#9CA3AF', fontSize: 9 }} stroke="#1E2D4A" />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 9 }} stroke="#1E2D4A" />
                  <Tooltip contentStyle={{ background: '#0F1626', border: '1px solid #1E2D4A', fontSize: 10 }} />
                  <Area type="monotone" dataKey="mastery" stroke="#3B82F6" fill="rgba(59, 130, 246, 0.2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Insights row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Prerequisite gaps */}
        <div className="bg-[#121A2E] border border-[#1E2D4A] rounded-xl p-4 glass-panel space-y-3">
          <div className="flex items-center space-x-2 text-red-400">
            <AlertTriangle className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase font-mono text-white">Critical Prerequisite Gaps</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg">
              <div className="flex justify-between font-bold mb-1">
                <span className="text-white">Applied Statistics</span>
                <span className="text-red-400">42% mastery</span>
              </div>
              <p className="text-[10px] text-gray-400">Required for successor node: <strong className="text-gray-300">Machine Learning Fundamentals</strong> (requires &gt; 80%).</p>
            </div>
            <div className="p-3 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg">
              <div className="flex justify-between font-bold mb-1">
                <span className="text-white">Probability Theory</span>
                <span className="text-red-400">38% mastery</span>
              </div>
              <p className="text-[10px] text-gray-400">Currently below the struggle risk margin. ML algorithms validation is affected.</p>
            </div>
          </div>
        </div>

        {/* Mistake patterns */}
        <div className="bg-[#121A2E] border border-[#1E2D4A] rounded-xl p-4 glass-panel space-y-3">
          <div className="flex items-center space-x-2 text-amber-500">
            <AlertTriangle className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase font-mono text-white">Mistake Patterns Detected</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg">
              <div className="flex justify-between mb-1">
                <span className="font-bold text-white">Overfitting boundaries</span>
                <span className="font-mono text-amber-500">4 occurrences</span>
              </div>
              <p className="text-[10px] text-gray-400">Your attempts indicate consistent struggle distinguishing bias/variance trade-offs during validation runs.</p>
            </div>
            <div className="p-3 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg">
              <div className="flex justify-between mb-1">
                <span className="font-bold text-white">Recursive Base Cases</span>
                <span className="font-mono text-amber-500">2 occurrences</span>
              </div>
              <p className="text-[10px] text-gray-400">Mistakes detected in base-case conditions for BST insertions.</p>
            </div>
          </div>
        </div>

        {/* Upcoming scheduled revisions */}
        <div className="bg-[#121A2E] border border-[#1E2D4A] rounded-xl p-4 glass-panel space-y-3">
          <div className="flex items-center space-x-2 text-emerald-400">
            <Calendar className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase font-mono text-white">Scheduled Revisions</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white">Python OOP & Arrays</h4>
                <p className="text-[9px] font-mono text-gray-500">Predicted retention has decayed to 52%</p>
              </div>
              <button 
                onClick={() => handleSelectSkill('python')}
                className="bg-[#121A2E] border border-[#1E2D4A] text-[#10B981] hover:bg-[#10B981] hover:text-white transition px-2.5 py-1 rounded text-[10px] font-semibold"
              >
                Review Now
              </button>
            </div>
            <div className="p-3 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white">Linked List Traversals</h4>
                <p className="text-[9px] font-mono text-gray-500">Spaced interval: recommended today</p>
              </div>
              <button 
                onClick={() => handleSelectSkill('dsa')}
                className="bg-[#121A2E] border border-[#1E2D4A] text-[#10B981] hover:bg-[#10B981] hover:text-white transition px-2.5 py-1 rounded text-[10px] font-semibold"
              >
                Review Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

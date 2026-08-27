import React, { useState } from 'react';
import { Shield, Sparkles, BookOpen, Clock, Activity, AlertTriangle } from 'lucide-react';

interface Node {
  id: string;
  name: string;
  category: string;
  mastery: number;
  status: string; // locked, weak, learning, strong, mastered, unlocked
  difficulty: string;
}

interface Link {
  source: string;
  target: string;
}

interface SkillGraphProps {
  nodes: Node[];
  links: Link[];
  onSelectSkill?: (skillId: string) => void;
}

export default function SkillGraph({ nodes, links, onSelectSkill }: SkillGraphProps) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Layout node coordinates statically for clean, readable hierarchical graph
  const nodePositions: Record<string, { x: number; y: number }> = {
    python: { x: 80, y: 120 },
    dsa: { x: 240, y: 50 },
    mathematics: { x: 80, y: 280 },
    gradient_descent: { x: 240, y: 190 },
    statistics: { x: 240, y: 280 },
    probability: { x: 240, y: 370 },
    ml: { x: 420, y: 240 },
    deep_learning: { x: 600, y: 190 },
    nlp: { x: 760, y: 190 },
    llm: { x: 900, y: 190 },
    rag: { x: 1040, y: 120 },
    ai_agents: { x: 1040, y: 260 },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'mastered':
        return { bg: '#8B5CF6', text: '#F3F4F6', stroke: '#A78BFA', shadow: 'rgba(139, 92, 246, 0.5)' };
      case 'strong':
        return { bg: '#3B82F6', text: '#F3F4F6', stroke: '#60A5FA', shadow: 'rgba(59, 130, 246, 0.4)' };
      case 'learning':
        return { bg: '#F59E0B', text: '#F3F4F6', stroke: '#FBBF24', shadow: 'rgba(245, 158, 11, 0.3)' };
      case 'weak':
        return { bg: '#EF4444', text: '#F3F4F6', stroke: '#F87171', shadow: 'rgba(239, 68, 68, 0.4)' };
      case 'unlocked':
        return { bg: '#1E2D4A', text: '#9CA3AF', stroke: '#3B82F6', shadow: 'rgba(59, 130, 246, 0.1)' };
      case 'locked':
      default:
        return { bg: '#111827', text: '#4B5563', stroke: '#1F2937', shadow: 'none' };
    }
  };

  const handleNodeClick = (node: Node) => {
    setSelectedNode(node);
    if (onSelectSkill) {
      onSelectSkill(node.id);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4">
      {/* Interactive SVG Skill Graph */}
      <div className="flex-1 bg-[#121A2E]/70 border border-[#1E2D4A] rounded-xl p-4 relative overflow-auto min-h-[400px]">
        <div className="absolute top-3 left-4 flex space-x-3 text-[10px] font-mono text-gray-400">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded bg-violet-600"></span>
            <span>Mastered (85%+)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded bg-blue-600"></span>
            <span>Strong (65%+)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
            <span>Learning (30%+)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded bg-red-500"></span>
            <span>Weak (0-30%)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded bg-slate-800 border border-blue-500"></span>
            <span>Unlocked</span>
          </div>
        </div>

        <svg width="1150" height="450" className="w-full h-full min-w-[1150px]">
          {/* SVG filter for beautiful glows */}
          <defs>
            <filter id="glow-mastered" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-strong" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Draw connection link paths */}
          {links.map((link, idx) => {
            const start = nodePositions[link.source];
            const end = nodePositions[link.target];
            if (!start || !end) return null;

            // Generate clean curved bezier lines between hierarchies
            const midX = (start.x + end.x) / 2;
            const pathData = `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`;

            const sourceNode = nodes.find(n => n.id === link.source);
            const isCompleted = sourceNode && (sourceNode.status === 'mastered' || sourceNode.status === 'strong');

            return (
              <path
                key={idx}
                d={pathData}
                fill="none"
                stroke={isCompleted ? '#3B82F6' : '#1E2D4A'}
                strokeWidth={isCompleted ? 2.5 : 1.5}
                className={isCompleted ? 'pulse-line' : ''}
                opacity={isCompleted ? 0.7 : 0.3}
              />
            );
          })}

          {/* Draw node objects */}
          {nodes.map((node) => {
            const pos = nodePositions[node.id];
            if (!pos) return null;

            const style = getStatusColor(node.status);
            const isSelected = selectedNode?.id === node.id;

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => handleNodeClick(node)}
                className="cursor-pointer"
              >
                {/* Outer ring glow */}
                <circle
                  r="24"
                  fill={style.bg}
                  stroke={isSelected ? '#FBBF24' : style.stroke}
                  strokeWidth={isSelected ? 3 : 2}
                  style={{
                    filter: node.status === 'mastered' ? 'url(#glow-mastered)' : node.status === 'strong' ? 'url(#glow-strong)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                />
                
                {/* Node icon placeholder letter */}
                <text
                  textAnchor="middle"
                  dy=".3em"
                  fill={style.text}
                  fontSize="11"
                  fontWeight="bold"
                  className="font-mono select-none"
                >
                  {node.name.slice(0, 2).toUpperCase()}
                </text>

                {/* Node category label */}
                <text
                  y="36"
                  textAnchor="middle"
                  fill="#9CA3AF"
                  fontSize="10"
                  fontWeight="500"
                  className="select-none font-sans"
                >
                  {node.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Node Telemetry Inspector */}
      <div className="w-full lg:w-80 bg-[#121A2E] border border-[#1E2D4A] rounded-xl p-4 flex flex-col justify-between">
        {selectedNode ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2D4A]">
              <div>
                <h3 className="text-sm font-bold text-white">{selectedNode.name}</h3>
                <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">{selectedNode.category}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                selectedNode.status === 'mastered' ? 'bg-purple-900/60 text-purple-200' :
                selectedNode.status === 'strong' ? 'bg-blue-900/60 text-blue-200' :
                selectedNode.status === 'learning' ? 'bg-amber-900/60 text-amber-200' :
                selectedNode.status === 'weak' ? 'bg-red-900/60 text-red-200' : 'bg-gray-800 text-gray-400'
              }`}>
                {selectedNode.status}
              </span>
            </div>

            {/* AI Skill Intelligence Details */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center"><Sparkles className="w-3.5 h-3.5 mr-1 text-[#8B5CF6]" /> BKT Mastery</span>
                <span className="font-bold text-white font-mono">{selectedNode.mastery}%</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center"><Shield className="w-3.5 h-3.5 mr-1 text-[#3B82F6]" /> AI Confidence</span>
                <span className="font-bold text-white font-mono">
                  {selectedNode.status === 'locked' ? '0' : Math.round(50 + selectedNode.mastery * 0.49)}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center"><Clock className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Retention Est.</span>
                <span className="font-bold text-white font-mono">
                  {selectedNode.status === 'locked' ? 'N/A' : `${Math.round(45 + selectedNode.mastery * 0.5)}%`}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center"><Activity className="w-3.5 h-3.5 mr-1 text-yellow-500" /> Struggle Risk</span>
                <span className={`font-bold font-mono ${
                  selectedNode.status === 'locked' ? 'text-gray-400' :
                  selectedNode.mastery < 40 ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  {selectedNode.status === 'locked' ? 'High' : `${Math.round(100 - selectedNode.mastery)}%`}
                </span>
              </div>

              <div className="pt-2 border-t border-[#1E2D4A]/50">
                <span className="text-[10px] text-gray-500 font-mono block mb-1">PREREQUISITE DEPENDENCIES</span>
                <p className="text-[11px] text-gray-300">
                  {selectedNode.id === 'python' || selectedNode.id === 'mathematics' ? (
                    'None (Foundation node)'
                  ) : selectedNode.id === 'ml' ? (
                    'Python, Statistics, Gradient Descent'
                  ) : selectedNode.id === 'deep_learning' ? (
                    'Machine Learning Fundamentals'
                  ) : (
                    'Prior node in hierarchy chain.'
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={() => onSelectSkill && onSelectSkill(selectedNode.id)}
              className="w-full mt-2 bg-[#3B82F6] hover:bg-blue-600 transition text-white text-xs font-semibold py-2 rounded flex items-center justify-center space-x-1.5 shadow-neon-blue"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Enter Study Workspace</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <Sparkles className="w-8 h-8 text-[#8B5CF6] mb-2 animate-pulse" />
            <p className="text-xs text-gray-400 font-mono">Select a skill node from the graph to inspect Learning Twin intelligence metrics.</p>
          </div>
        )}
        <div className="mt-4 p-2 bg-[#0F1626] border border-[#1E2D4A] rounded text-[10px] text-gray-500 font-mono flex items-start space-x-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
          <span>Prerequisite mastery is required before unlocking successor concepts.</span>
        </div>
      </div>
    </div>
  );
}

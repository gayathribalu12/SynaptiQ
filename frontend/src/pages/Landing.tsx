import React, { useEffect, useRef } from 'react';
import { Sparkles, Brain, Cpu, ArrowRight, Activity, Network } from 'lucide-react';

interface LandingProps {
  onNavigate: (page: 'onboarding' | 'demo' | 'dashboard') => void;
}

export default function Landing({ onNavigate }: LandingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated neural network canvas background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = 400);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
    }> = [];

    const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#60A5FA'];

    // Generate nodes
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2.5 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connections
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            ctx.strokeStyle = `rgba(30, 45, 74, ${1.0 - dist / 100})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Bounce
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      });

      // Draw central labels
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = 400;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">
      {/* Badge CTA */}
      <div className="mb-6 flex items-center space-x-2 bg-[#121A2E] border border-[#1E2D4A] rounded-full px-4 py-1.5 text-xs font-mono text-[#3B82F6] hover:border-[#3B82F6]/60 transition cursor-pointer">
        <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#8B5CF6]" />
        <span>V2.0 RELEASE: AI-POWERED 3D KNOWLEDGE DECISION SYSTEMS</span>
      </div>

      {/* Main Hero */}
      <h1 className="text-4xl md:text-6xl font-extrabold text-center tracking-tight text-white mb-4 max-w-4xl leading-tight">
        Meet Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]">Learning Twin.</span>
      </h1>

      <p className="text-base md:text-lg text-gray-400 text-center max-w-2xl mb-8 leading-relaxed">
        SynaptiQ continuously models what you know, predicts what you will forget, maps your skill gaps, and dynamically adapts interactive 3D simulations to match your cognitive preferences.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-12">
        <button
          onClick={() => onNavigate('onboarding')}
          className="w-full sm:w-auto bg-[#3B82F6] hover:bg-blue-600 transition text-white font-semibold px-8 py-3.5 rounded-lg flex items-center justify-center space-x-2 shadow-neon-blue"
        >
          <span>Build My Learning Twin</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => onNavigate('demo')}
          className="w-full sm:w-auto bg-[#121A2E] hover:bg-[#1E2D4A] transition border border-[#1E2D4A] text-gray-200 font-semibold px-8 py-3.5 rounded-lg flex items-center justify-center space-x-2"
        >
          <Brain className="w-4 h-4 text-[#8B5CF6]" />
          <span>Explore Sandbox Demo</span>
        </button>
      </div>

      {/* Landing Visual (Learning Twin Data Flow) */}
      <div className="w-full max-w-4xl bg-[#121A2E]/50 border border-[#1E2D4A] rounded-2xl overflow-hidden glass-panel mb-16 relative">
        <div className="border-b border-[#1E2D4A] px-4 py-3 bg-[#0F1626]/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
          </div>
          <span className="text-xs font-mono text-gray-400">TELEMETRY_ENGINE // KNOWLEDGE_TWIN_MAPPING</span>
        </div>

        <div className="p-4 relative">
          <canvas ref={canvasRef} className="w-full h-[300px]" />
          
          {/* Twin Data Flow Diagram */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-4 max-w-3xl w-full px-6">
              {[
                { title: 'LEARNER', icon: <Activity className="w-5 h-5 text-red-400" /> },
                { title: 'KNOWLEDGE', icon: <Brain className="w-5 h-5 text-[#3B82F6]" /> },
                { title: 'BEHAVIOR', icon: <Network className="w-5 h-5 text-emerald-400" /> },
                { title: 'GOALS', icon: <Sparkles className="w-5 h-5 text-yellow-400" /> },
                { title: 'AI MODEL', icon: <Cpu className="w-5 h-5 text-[#8B5CF6]" /> },
                { title: 'ADAPTIVE', icon: <ArrowRight className="w-5 h-5 text-blue-400 animate-pulse" /> }
              ].map((step, idx) => (
                <div key={idx} className="bg-[#0A0E1A]/90 border border-[#1E2D4A]/80 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-lg pointer-events-auto">
                  <div className="mb-2 p-2 bg-[#121A2E] border border-[#1E2D4A]/50 rounded-lg">
                    {step.icon}
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-wider text-white">{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feature section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full text-left mb-10">
        <div className="bg-[#121A2E]/60 border border-[#1E2D4A] rounded-xl p-5 hover:border-[#3B82F6]/50 transition">
          <Brain className="w-8 h-8 text-[#8B5CF6] mb-3" />
          <h3 className="text-base font-bold text-white mb-2">Closed-Loop Twin updates</h3>
          <p className="text-xs text-gray-400 leading-relaxed font-sans">
            Every code attempt, quiz choice, and 3D simulation step feeds back into your database record, updating knowledge tracing metrics.
          </p>
        </div>

        <div className="bg-[#121A2E]/60 border border-[#1E2D4A] rounded-xl p-5 hover:border-[#3B82F6]/50 transition">
          <Network className="w-8 h-8 text-[#3B82F6] mb-3" />
          <h3 className="text-base font-bold text-white mb-2">Contextual Bandit Format Selection</h3>
          <p className="text-xs text-gray-400 leading-relaxed font-sans">
            The platform learns whether you retain concepts better through reading text, writing code, or interacting with 3D simulations.
          </p>
        </div>

        <div className="bg-[#121A2E]/60 border border-[#1E2D4A] rounded-xl p-5 hover:border-[#3B82F6]/50 transition">
          <Cpu className="w-8 h-8 text-emerald-400 mb-3" />
          <h3 className="text-base font-bold text-white mb-2">Dynamic Roadmaps</h3>
          <p className="text-xs text-gray-400 leading-relaxed font-sans">
            Identify struggle areas beforehand. The roadmap adaptively halts forward progression to resolve weak prerequisites.
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';
import Demo from './pages/Demo';
import { Brain, Cpu, Sparkles, LayoutDashboard, Terminal } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'onboarding' | 'dashboard' | 'workspace' | 'demo'>('landing');
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0E1A] text-[#F3F4F6]">
      {/* Premium StartUp Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#0A0E1A]/80 backdrop-blur-md border-b border-[#1E2D4A]/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setCurrentPage('landing')}>
          <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-neon-blue">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-wider font-mono text-white">SYNAPTIQ</h1>
            <span className="text-[9px] text-gray-400 font-medium uppercase font-mono tracking-widest block -mt-1">Connect. Learn. Adapt.</span>
          </div>
        </div>

        {/* Navbar links */}
        <nav className="hidden md:flex items-center space-x-6 text-xs font-mono">
          <button 
            onClick={() => setCurrentPage('landing')} 
            className={`transition ${currentPage === 'landing' ? 'text-[#3B82F6] font-bold' : 'text-gray-400 hover:text-white'}`}
          >
            Home
          </button>
          <button 
            onClick={() => setCurrentPage('dashboard')} 
            className={`transition flex items-center space-x-1 ${currentPage === 'dashboard' ? 'text-[#3B82F6] font-bold' : 'text-gray-400 hover:text-white'}`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Learning Twin</span>
          </button>
          <button 
            onClick={() => { setSelectedSkillId(null); setCurrentPage('workspace'); }} 
            className={`transition flex items-center space-x-1 ${currentPage === 'workspace' ? 'text-[#3B82F6] font-bold' : 'text-gray-400 hover:text-white'}`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Workspace</span>
          </button>
          <button 
            onClick={() => setCurrentPage('demo')} 
            className={`transition flex items-center space-x-1 ${currentPage === 'demo' ? 'text-purple-400 font-bold' : 'text-gray-400 hover:text-white'}`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Sandbox Demo</span>
          </button>
        </nav>

        {/* CTA */}
        <button
          onClick={() => setCurrentPage('onboarding')}
          className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:from-blue-600 hover:to-purple-600 transition text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center space-x-1 shadow-md"
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Build Twin</span>
        </button>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 w-full pt-4">
        {currentPage === 'landing' && <Landing onNavigate={setCurrentPage} />}
        {currentPage === 'onboarding' && <Onboarding onOnboardingComplete={() => setCurrentPage('dashboard')} />}
        {currentPage === 'dashboard' && (
          <Dashboard 
            onNavigate={setCurrentPage} 
            setSelectedSkillId={setSelectedSkillId} 
          />
        )}
        {currentPage === 'workspace' && (
          <Workspace 
            selectedSkillId={selectedSkillId} 
            onNavigateBack={() => setCurrentPage('dashboard')} 
          />
        )}
        {currentPage === 'demo' && <Demo />}
      </main>
    </div>
  );
}

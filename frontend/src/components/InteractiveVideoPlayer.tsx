import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, HelpCircle, CheckCircle2, XCircle, ArrowRight, BookOpen, Cpu } from 'lucide-react';

interface Scene {
  sceneNumber: number;
  title: string;
  sceneDescription: string;
  narrationText: string;
  visualType: 'canvas_animation' | 'code_highlight' | 'analogy' | 'chart';
  visualData: string;
  codeSnippet?: string;
}

interface Chapter {
  timestamp: string;
  title: string;
}

interface Checkpoint {
  timestamp: string;
  questionText: string;
  options: string[];
  correctOption: number;
}

interface StoryboardData {
  title: string;
  durationSeconds: number;
  chapters: Chapter[];
  storyboard: Scene[];
  checkpoints: Checkpoint[];
}

interface InteractiveVideoPlayerProps {
  conceptId: string;
  onCheckpointAnswer?: (correct: boolean) => void;
}

export default function InteractiveVideoPlayer({ conceptId, onCheckpointAnswer }: InteractiveVideoPlayerProps) {
  const [videoData, setVideoData] = useState<StoryboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [checkpointFeedback, setCheckpointFeedback] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchVideoData();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [conceptId]);

  const fetchVideoData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conceptId })
      });
      const data = await res.json();
      setVideoData(data.storyboard || data);
      setCurrentTime(0);
      setActiveSceneIdx(0);
      setIsPlaying(false);
      setActiveCheckpoint(null);

      // Track lesson started telemetry event
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'lesson_started',
          skillId: conceptId,
          payload: { conceptId }
        })
      });
    } catch (e) {
      console.error("Failed to load dynamic video:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSceneIdx > 0 && videoData?.storyboard) {
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'scene_completed',
          skillId: conceptId,
          payload: { sceneNumber: activeSceneIdx }
        })
      });
    }
  }, [activeSceneIdx]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + 1;
          
          // Verify duration limits
          const duration = videoData?.durationSeconds || 120;
          if (next >= duration) {
            setIsPlaying(false);
            if (timerRef.current) clearInterval(timerRef.current);

            // Track completion event
            fetch('/api/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                eventType: 'lesson_completed',
                skillId: conceptId,
                payload: { completed: true }
              })
            });

            return duration;
          }

          // Check if we hit a checkpoint timestamp
          if (videoData?.checkpoints) {
            const formattedTime = formatTimestamp(next);
            const checkpoint = videoData.checkpoints.find(c => c.timestamp === formattedTime);
            if (checkpoint && !checkpointFeedback) {
              setIsPlaying(false);
              setActiveCheckpoint(checkpoint);
            }
          }

          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, videoData, checkpointFeedback]);

  // Synchronize scene index on every currentTime change (seeking or playing) matching chapter thresholds
  useEffect(() => {
    if (videoData?.chapters && videoData?.storyboard) {
      let activeIdx = 0;
      for (let i = 0; i < videoData.chapters.length; i++) {
        const [m, s] = videoData.chapters[i].timestamp.split(':').map(Number);
        const chapSec = m * 60 + s;
        if (currentTime >= chapSec) {
          activeIdx = i;
        } else {
          break;
        }
      }
      const mappedSceneIdx = Math.min(activeIdx, videoData.storyboard.length - 1);
      if (mappedSceneIdx !== activeSceneIdx && mappedSceneIdx >= 0) {
        setActiveSceneIdx(mappedSceneIdx);
      }
    }
  }, [currentTime, videoData, activeSceneIdx]);

  const formatTimestamp = (sec: number) => {
    const min = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${min.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const handleCheckpointSubmit = () => {
    if (selectedOption === null || !activeCheckpoint) return;
    const correct = selectedOption === activeCheckpoint.correctOption;

    if (onCheckpointAnswer) {
      onCheckpointAnswer(correct);
    }

    // Submit checkpoint response telemetry
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'checkpoint_answered',
        skillId: conceptId,
        payload: { correct, question: activeCheckpoint.questionText }
      })
    });

    setCheckpointFeedback(correct ? 'correct' : 'incorrect');
  };

  const resumePlayback = () => {
    setActiveCheckpoint(null);
    setSelectedOption(null);
    setCheckpointFeedback(null);
    setIsPlaying(true);
  };

  if (loading || !videoData) {
    return (
      <div className="flex flex-col items-center justify-center bg-[#0F162A] border border-[#1E2D4A] rounded-xl h-[400px] text-gray-400 font-mono text-xs">
        <span className="w-8 h-8 rounded-full border-2 border-t-transparent border-[#3B82F6] animate-spin mb-3"></span>
        <span className="uppercase tracking-widest text-[#60A5FA]">twin_rendering_storyboard_scenes...</span>
      </div>
    );
  }

  const renderVisualStage = (currentScene: Scene | undefined) => {
    if (!currentScene) return null;

    const visualType = currentScene.visualType || 'analogy';

    if (visualType === 'code_highlight') {
      return (
        <div className="w-full h-full overflow-hidden flex flex-col text-left">
          <span className="text-[8px] text-[#3B82F6] border-b border-[#23355A] pb-1 mb-2 select-none font-mono">CODE_PLAYBACK_DEBUGGER</span>
          <pre className="text-[10px] text-[#A7F3D0] overflow-x-auto select-all leading-relaxed whitespace-pre font-mono bg-[#090D16] p-3 rounded border border-[#1E2D4A]">
            {currentScene.codeSnippet || `// Code Context\nconsole.log("Analyzing concept: ${conceptId}");`}
          </pre>
        </div>
      );
    }

    if (visualType === 'canvas_animation') {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center relative select-none">
          {/* Animated Avatar / Flow simulation */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              {/* Avatar face circle */}
              <div className={`w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg border-2 border-white/20 transition-all duration-300 ${isPlaying ? 'scale-110 ring-4 ring-blue-500/30' : ''}`}>
                <Cpu className="w-8 h-8 text-white animate-pulse" />
              </div>
              {/* Wave pulse indicators for narrating avatar */}
              {isPlaying && (
                <>
                  <span className="absolute -inset-1 rounded-full border border-blue-400 animate-ping opacity-75"></span>
                  <span className="absolute -inset-2.5 rounded-full border border-purple-400 animate-ping opacity-50"></span>
                </>
              )}
            </div>
            
            {/* Action flow description box */}
            <div className="flex flex-col text-left max-w-xs space-y-1">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">{currentScene.title}</span>
              <p className="text-[9px] text-gray-400 leading-normal font-mono">{currentScene.sceneDescription}</p>
              <div className="flex items-center space-x-1.5 pt-1">
                <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
                <span className="text-[8px] text-gray-500 font-mono">{isPlaying ? 'AVATAR_ACTIVE_EXPLAINING' : 'PLAYER_PAUSED'}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (visualType === 'chart') {
      return (
        <div className="w-full h-full flex flex-col text-left">
          <span className="text-[8px] text-[#3B82F6] border-b border-[#23355A] pb-1 mb-2 select-none font-mono">DYNAMICAL_METRICS_CHART</span>
          <div className="flex-1 flex items-end justify-around px-4 pt-4 border-b border-[#23355A]/50 pb-2">
            {[45, 80, 60, 95, 75].map((val, idx) => {
              // Animate chart bars if playing
              const animatedHeight = isPlaying 
                ? Math.min(100, Math.max(10, val + Math.sin(currentTime + idx) * 15)) 
                : val;
              return (
                <div key={idx} className="flex flex-col items-center w-8 space-y-1">
                  <span className="text-[8px] text-gray-500 font-mono">{Math.round(animatedHeight)}%</span>
                  <div 
                    className="w-4 bg-gradient-to-t from-blue-600 to-purple-500 rounded-t transition-all duration-300"
                    style={{ height: `${animatedHeight * 0.7}px` }}
                  ></div>
                  <span className="text-[8px] text-gray-400 font-mono font-bold">C{idx+1}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[9px] text-gray-500 mt-1 text-center font-mono">{currentScene.sceneDescription}</p>
        </div>
      );
    }

    // Default to 'analogy' visual layout
    return (
      <div className="w-full h-full flex flex-col justify-between text-left p-1">
        <div className="flex items-center justify-between border-b border-[#23355A] pb-1 mb-2">
          <span className="text-[8px] text-[#3B82F6] font-mono">EXPLICIT_ANALOGY_MAPPER</span>
          <span className="text-[8px] text-purple-400 font-mono font-bold">ANALYSIS_ACTIVE</span>
        </div>
        <div className="flex-1 flex items-center justify-center space-x-4">
          <div className="bg-[#090D16] border border-[#22355A] p-2.5 rounded max-w-sm flex items-center space-x-3 w-full shadow-md">
            <div className="p-1.5 bg-blue-500/10 rounded">
              <BookOpen className="w-5 h-5 text-blue-400 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-[9px] font-bold text-white truncate">{currentScene.title}</h5>
              <p className="text-[8px] text-gray-400 leading-normal truncate">{currentScene.sceneDescription}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const duration = videoData.durationSeconds || 120;
  const currentScene = videoData.storyboard?.[activeSceneIdx] || videoData.storyboard?.[0];

  return (
    <div className="bg-[#0F162A] border border-[#1E2D4A] rounded-xl overflow-hidden shadow-2xl flex flex-col h-[520px] font-mono relative">
      {/* Video Viewport screen */}
      <div className="flex-1 bg-black relative flex flex-col justify-between p-4 overflow-hidden border-b border-[#1E2D4A]">
        {/* Top Header metadata */}
        <div className="flex justify-between items-center text-[10px] text-gray-400 z-10">
          <div className="flex items-center space-x-1">
            <span className="bg-[#EF4444] w-1.5 h-1.5 rounded-full animate-ping"></span>
            <span className="font-extrabold uppercase tracking-wider text-red-500">AI Interactive Lesson Storyboard: {videoData.title}</span>
          </div>
          <span>Format: SCENE_BASED_RENDER</span>
        </div>

        {/* Center Main Stage Content */}
        <div className="flex-1 flex items-center justify-center py-4">
          {activeCheckpoint ? (
            /* Checkpoint Assessment Question Card Overlay */
            <div className="bg-[#121A2E]/90 border border-[#2B3E69] p-5 rounded-lg max-w-md w-full space-y-4 shadow-2xl animate-fade-in z-20">
              <div className="flex items-center space-x-2 text-[#F59E0B]">
                <HelpCircle className="w-5 h-5 animate-pulse" />
                <h4 className="text-xs font-bold uppercase tracking-wider">CHECKPOINT_ASSESSMENT</h4>
              </div>
              <p className="text-[11px] text-white leading-relaxed">{activeCheckpoint.questionText}</p>
              
              <div className="space-y-2">
                {activeCheckpoint.options.map((opt, i) => (
                  <button
                    key={i}
                    disabled={checkpointFeedback !== null}
                    onClick={() => setSelectedOption(i)}
                    className={`w-full text-left p-2.5 rounded border text-[10px] transition ${
                      selectedOption === i 
                        ? 'border-[#3B82F6] bg-blue-500/20 text-[#60A5FA]' 
                        : 'border-[#22355A] bg-[#0E1626] text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {checkpointFeedback ? (
                <div className="flex flex-col items-center space-y-3 pt-2">
                  {checkpointFeedback === 'correct' ? (
                    <div className="flex items-center space-x-1.5 text-green-400 text-xs font-bold bg-green-500/10 py-1.5 px-3 rounded border border-green-500/20 w-full justify-center">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span>CORRECT ANSWER! (+BKT mastery)</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-red-400 text-xs font-bold bg-red-500/10 py-1.5 px-3 rounded border border-red-500/20 w-full justify-center">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span>INCORRECT (-struggle risk flagged)</span>
                    </div>
                  )}
                  <button
                    onClick={resumePlayback}
                    className="bg-[#3B82F6] hover:bg-blue-600 text-white font-bold py-1.5 px-4 rounded text-[10px] flex items-center space-x-1 transition"
                  >
                    <span>Resume Lesson Playback</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  disabled={selectedOption === null}
                  onClick={handleCheckpointSubmit}
                  className="w-full bg-[#3B82F6] hover:bg-blue-600 text-white font-bold py-2 rounded text-[10px] transition disabled:opacity-40"
                >
                  Submit Checkpoint Answer
                </button>
              )}
            </div>
          ) : (
            /* Visual Stage Renderer */
            <div className="w-full h-full flex flex-col md:flex-row gap-4 items-center justify-center p-2">
              {/* Visual scene animation */}
              <div className="flex-1 bg-[#1A233C] border border-[#23355A] rounded-lg h-44 w-full flex flex-col items-center justify-center relative p-3 shadow-inner">
                <span className="absolute top-2 left-2 text-[8px] text-gray-500">SCENE_GRAPHICS</span>
                {renderVisualStage(currentScene)}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Voice Narration subtitle overlay */}
        {!activeCheckpoint && currentScene && (
          <div className="bg-black/80 backdrop-blur border border-white/5 rounded-lg p-3 mx-2 text-[10px] text-gray-300 leading-normal flex items-start space-x-2 animate-fade-in relative shadow-lg z-10">
            <Volume2 className="w-4 h-4 text-[#3B82F6] flex-shrink-0 animate-pulse mt-0.5" />
            <p className="flex-1">
              <span className="text-[#8B5CF6] font-bold">NARRATOR:</span> {currentScene.narrationText}
            </p>
          </div>
        )}
      </div>

      {/* Progress & Chapter Controls bar */}
      <div className="p-3 bg-[#131B2E] border-t border-[#1E2D4A] space-y-2 flex flex-col">
        {/* Timeline track */}
        <div className="flex items-center space-x-3 text-[10px] text-gray-400">
          <span>{formatTimestamp(currentTime)}</span>
          <div className="flex-1 bg-[#1E2D4A] h-1.5 rounded-full overflow-hidden cursor-pointer relative">
            <div 
              className="bg-[#3B82F6] h-full transition-all duration-300 relative" 
              style={{ width: `${(currentTime / duration) * 100}%` }}
            >
              <span className="absolute right-0 top-1/2 -translate-y-1/2 bg-white w-2 h-2 rounded-full border border-blue-600"></span>
            </div>
          </div>
          <span>{formatTimestamp(duration)}</span>
        </div>

        {/* Player action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 bg-[#1E2D4A] hover:bg-[#2A3F65] rounded text-white transition"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>
            <button
              onClick={() => { setCurrentTime(0); setActiveSceneIdx(0); setIsPlaying(false); setActiveCheckpoint(null); }}
              className="p-1.5 bg-[#1E2D4A] hover:bg-[#2A3F65] rounded text-white transition"
              title="Reset Video"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center space-x-1.5 text-[9px] text-gray-400">
            {videoData.chapters?.map((chap, i) => (
              <span 
                key={i} 
                className="bg-[#1E2D4A] border border-[#2E3F65] px-1.5 py-0.5 rounded text-gray-300 cursor-pointer hover:border-gray-500"
                onClick={() => {
                  const [m, s] = chap.timestamp.split(':').map(Number);
                  const newTime = m * 60 + s;
                  setCurrentTime(newTime);
                  setIsPlaying(false);
                }}
              >
                {chap.title}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

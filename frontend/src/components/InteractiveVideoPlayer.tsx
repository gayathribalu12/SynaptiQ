import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, HelpCircle, CheckCircle2, XCircle, ArrowRight, BookOpen } from 'lucide-react';

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
    } catch (e) {
      console.error("Failed to load dynamic video:", e);
    } finally {
      setLoading(false);
    }
  };

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

          // Progress Scene index based on proportional duration steps
          if (videoData?.storyboard) {
            const scenesCount = videoData.storyboard.length;
            const proportionalIdx = Math.floor((next / duration) * scenesCount);
            if (proportionalIdx < scenesCount) {
              setActiveSceneIdx(proportionalIdx);
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
            <span className="font-extrabold uppercase tracking-wider text-red-500">dynamic_ai_video: {videoData.title}</span>
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
                {currentScene?.visualType === 'code_highlight' ? (
                  <div className="w-full h-full overflow-hidden flex flex-col">
                    <span className="text-[8px] text-[#3B82F6] border-b border-[#23355A] pb-1 mb-1 select-none">CODE_DEBUGGER</span>
                    <pre className="text-[9px] text-[#A7F3D0] overflow-x-auto select-all leading-normal whitespace-pre">
                      {currentScene.codeSnippet}
                    </pre>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2 text-center">
                    <BookOpen className="w-8 h-8 text-[#3B82F6] animate-bounce" />
                    <span className="text-[10px] text-white font-bold">{currentScene?.title || 'Visual Scene'}</span>
                    <p className="text-[9px] text-gray-400 max-w-xs leading-normal">{currentScene?.sceneDescription}</p>
                  </div>
                )}
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

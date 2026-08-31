import React, { useState, useRef } from 'react';
import { Upload, X, Send, Sparkles, Brain, Award, AlertCircle, Play } from 'lucide-react';

interface LearningTwinAssistantProps {
  currentConceptId?: string | null;
  onVisualize3D?: (vizId: string) => void;
  onRefreshPath?: () => void;
  onLaunchStoryboard?: (conceptId: string) => void;
}

export default function LearningTwinAssistant({ currentConceptId, onVisualize3D, onRefreshPath, onLaunchStoryboard }: LearningTwinAssistantProps) {
  const [messages, setMessages] = useState<Array<{
    sender: 'user' | 'twin';
    text: string;
    image?: string;
    concepts?: string[];
    issues?: string[];
    suggests3D?: boolean;
    aiMetadata?: {
      provider: string;
      model: string | null;
      fallbackUsed: boolean;
      latencyMs: number;
    };
  }>>([
    {
      sender: 'twin',
      text: "I am your Multimodal Learning Twin. Upload handwritten notes, whiteboard diagrams, or code exceptions, and I'll map them to your path!"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTeachMeThis = async (concept: string, issue?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Explain the concept "${concept}" ${issue ? `focusing on the issue "${issue}"` : ''} in relation to my career goal. Use a Socratic teaching style.`,
          topic: concept,
          mode: 'explain'
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        sender: 'twin',
        text: data.text,
        aiMetadata: data.aiMetadata
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        sender: 'twin',
        text: `Error generating lesson: ${err.message}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleMakeThisVisual = async (concept: string) => {
    if (onLaunchStoryboard) {
      onLaunchStoryboard(concept);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage) return;

    const userText = inputText;
    const userImg = selectedImage;

    // Append user message immediately
    setMessages(prev => [...prev, {
      sender: 'user',
      text: userText,
      image: userImg || undefined
    }]);

    setInputText('');
    setSelectedImage(null);
    setLoading(true);

    try {
      // Base64 payload extraction
      const cleanBase64 = userImg ? userImg.split(',')[1] : null;

      const res = await fetch('/api/twin/ask-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: cleanBase64,
          question: userText,
          currentConcept: currentConceptId || 'programming'
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        setMessages(prev => [...prev, {
          sender: 'twin',
          text: data.tutorResponse || data.analysisText || "I've analyzed the image.",
          concepts: data.detectedConcepts,
          issues: data.detectedIssues,
          suggests3D: data.suggests3D,
          aiMetadata: data.aiMetadata
        }]);

        if (data.detectedIssues && data.detectedIssues.length > 0 && onRefreshPath) {
          onRefreshPath(); // Automatically update/recalculate roadmap gaps
        }
      } else {
        throw new Error(data.error || "Failed to analyze");
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        sender: 'twin',
        text: `Error analyzing interaction: ${err.message}. Let me guide you Socratic-style instead.`
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121A2E]/70 border border-[#1E2D4A] rounded-xl flex flex-col h-[520px] overflow-hidden glass-panel">
      {/* Header */}
      <div className="bg-[#1A253E] border-b border-[#2A3B60] p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-[#3B82F6] animate-pulse" />
          <div>
            <h3 className="text-xs font-mono font-extrabold text-white">LEARNING_TWIN_ASSISTANT</h3>
            <span className="text-[9px] font-mono text-[#8B5CF6] block uppercase tracking-widest -mt-0.5">Multimodal Socratic Tutor</span>
          </div>
        </div>
        {currentConceptId && (
          <span className="bg-[#1E2D4A] text-gray-300 text-[9px] font-mono px-2 py-0.5 rounded border border-[#2A3B60]">
            Focus: {currentConceptId.toUpperCase()}
          </span>
        )}
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] rounded-xl p-3 shadow-md space-y-2 ${
              m.sender === 'user' ? 'bg-[#3B82F6] text-white' : 'bg-[#18233C] text-gray-200 border border-[#23355A]'
            }`}>
              {m.image && (
                <div className="relative rounded overflow-hidden mb-1 border border-white/10 max-h-40">
                  <img src={m.image} alt="User uploads note" className="object-cover w-full h-full" />
                </div>
              )}
              <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>

              {/* Mapped concept tags */}
              {m.concepts && m.concepts.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1 border-t border-white/5">
                  <span className="text-[9px] text-[#3B82F6] font-bold uppercase tracking-wider mr-1">Concepts:</span>
                  {m.concepts.map((c, i) => (
                    <span key={i} className="bg-blue-500/20 text-[#60A5FA] border border-blue-500/30 text-[9px] px-1.5 py-0.5 rounded">
                      {c.toUpperCase()}
                    </span>
                  ))}
                </div>
              )}

              {/* Identified errors */}
              {m.issues && m.issues.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1 border-t border-white/5">
                  <span className="text-[9px] text-[#EF4444] font-bold uppercase tracking-wider mr-1">Issues:</span>
                  {m.issues.map((iss, i) => (
                    <span key={i} className="bg-red-500/20 text-[#F87171] border border-red-500/30 text-[9px] px-1.5 py-0.5 rounded flex items-center space-x-0.5">
                      <AlertCircle className="w-2.5 h-2.5 text-red-400" />
                      <span>{iss}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* 3D Action launch option */}
              {m.suggests3D && onVisualize3D && (
                <button
                  onClick={() => onVisualize3D('gradient_descent')}
                  className="mt-2 w-full bg-gradient-to-r from-purple-500/80 to-blue-500/80 hover:from-purple-600 hover:to-blue-600 text-white font-bold py-1.5 px-3 rounded flex items-center justify-center space-x-1.5 transition text-[10px] shadow"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Visualize in 3D Learning Lab</span>
                </button>
              )}

              {/* Teach Me This & Make This Visual lesson generation triggers */}
              {m.concepts && m.concepts.length > 0 && (
                <div className="flex space-x-2 mt-2 pt-1.5 border-t border-white/5">
                  <button
                    onClick={() => handleTeachMeThis(m.concepts![0], m.issues?.[0])}
                    className="flex-1 bg-blue-600/30 hover:bg-blue-600/50 text-[#60A5FA] border border-blue-500/30 text-[9px] py-1 rounded transition text-center font-bold"
                  >
                    Teach Me This
                  </button>
                  {onLaunchStoryboard && (
                    <button
                      onClick={() => handleMakeThisVisual(m.concepts![0])}
                      className="flex-1 bg-purple-600/30 hover:bg-purple-600/50 text-[#C084FC] border border-purple-500/30 text-[9px] py-1 rounded transition text-center font-bold"
                    >
                      Make This Visual
                    </button>
                  )}
                </div>
              )}

              {/* AI Metadata Display badge */}
              {m.aiMetadata && (
                <div className="text-[8px] text-gray-500 font-mono flex items-center space-x-1 pt-1.5 mt-1.5 border-t border-white/5">
                  <span>Provider: {m.aiMetadata.provider} ({m.aiMetadata.model || 'local'})</span>
                  <span>•</span>
                  <span>Latency: {m.aiMetadata.latencyMs}ms</span>
                  {m.aiMetadata.fallbackUsed && (
                    <>
                      <span>•</span>
                      <span className="text-amber-500 font-bold">FALLBACK</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center space-x-2 text-gray-400">
            <span className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full animate-bounce"></span>
            <span className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full animate-bounce [animation-delay:0.4s]"></span>
            <span className="text-[10px] text-gray-500 font-mono tracking-wider uppercase">twin_parsing_multimodal_evidence...</span>
          </div>
        )}
      </div>

      {/* Input panel */}
      <div className="p-3 bg-[#172239]/90 border-t border-[#1E2D4A] space-y-2.5">
        {/* Preview image */}
        {selectedImage && (
          <div className="relative inline-block">
            <div className="w-16 h-16 rounded border border-[#3B82F6] overflow-hidden">
              <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex items-center space-x-2">
          {/* File select button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            type="button"
            className="p-2 bg-[#1A253E] border border-[#2E3F65] rounded-lg text-gray-400 hover:text-white hover:border-[#3B82F6] transition shadow-inner"
            title="Upload notes, code, diagrams, or errors"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />

          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={selectedImage ? "Describe this image..." : "Ask your Learning Twin..."}
            className="flex-1 bg-[#121A2E] border border-[#22355A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3B82F6] transition"
          />

          <button
            onClick={handleSend}
            disabled={loading}
            className="p-2 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition disabled:opacity-40 shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

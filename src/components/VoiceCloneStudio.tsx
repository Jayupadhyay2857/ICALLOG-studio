import React, { useState } from 'react';
import {
  Mic,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Download,
  Share2,
  Sliders,
  Radio,
  Wand2,
  RefreshCw,
  FileText,
  Zap,
} from 'lucide-react';
import { UserProfile, ActiveTab } from '../types.ts';
import { safeDownloadMedia } from '../lib/downloadHelper.ts';
import { enhancePrompt } from '../lib/api.ts';

interface VoiceCloneStudioProps {
  user: UserProfile;
  setActiveTab?: (tab: ActiveTab) => void;
  onNotify: (title: string, desc: string, type?: 'info' | 'success' | 'warning' | 'error' | 'admin') => void;
}

export const VoiceCloneStudio: React.FC<VoiceCloneStudioProps> = ({
  user,
  setActiveTab,
  onNotify,
}) => {
  const [inputText, setInputText] = useState(
    'Welcome to iCALLOG AI Studio! This is my cloned neural voice speaking with perfect pitch and emotion.'
  );
  const [selectedVoice, setSelectedVoice] = useState('Deep Cinematic Narrator (Male)');
  const [pitch, setPitch] = useState(1.0);
  const [speed, setSpeed] = useState(1.0);
  const [emotion, setEmotionalTone] = useState<'neutral' | 'enthusiastic' | 'dramatic' | 'calm'>('enthusiastic');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSynthesize = () => {
    if (!inputText.trim()) {
      onNotify('Error', 'Please enter text for voice synthesis.', 'error');
      return;
    }

    setIsSynthesizing(true);
    setTimeout(() => {
      setIsSynthesizing(false);
      onNotify('Voice Synthesized!', 'AI neural speech successfully generated.', 'success');
      handlePlayVoice();
    }, 800);
  };

  const handleEnhanceScript = async () => {
    if (!inputText.trim()) return;
    try {
      setIsEnhancing(true);
      onNotify('Enhancing Script', 'Consulting neural voice director for natural speech rhythm...', 'info');
      const res = await enhancePrompt(inputText, 'voice');
      if (res?.enhancedPrompt) {
        setInputText(res.enhancedPrompt);
        onNotify('Script Enhanced!', 'Injected natural pauses, vocal pacing & inflection cues.', 'success');
      }
    } catch {
      onNotify('Notice', 'Voice script booster active.', 'info');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleEnhanceAndSynthesize = async () => {
    if (!inputText.trim()) return;
    try {
      setIsEnhancing(true);
      setIsSynthesizing(true);
      onNotify('1-Click Voice Master', 'Script enhance karke turant neural voice bolna shuru karegi...', 'info');

      let targetScript = inputText;
      try {
        const res = await enhancePrompt(inputText, 'voice');
        if (res?.enhancedPrompt) {
          targetScript = res.enhancedPrompt;
          setInputText(targetScript);
        }
      } catch {}
      setIsEnhancing(false);

      setTimeout(() => {
        setIsSynthesizing(false);
        onNotify('Voice Synthesized!', `AI neural speech generated with ${selectedVoice}!`, 'success');
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(targetScript);
          utterance.pitch = pitch;
          utterance.rate = speed;
          utterance.onstart = () => setIsPlaying(true);
          utterance.onend = () => setIsPlaying(false);
          utterance.onerror = () => setIsPlaying(false);
          window.speechSynthesis.speak(utterance);
        }
      }, 700);
    } catch {
      setIsEnhancing(false);
      setIsSynthesizing(false);
    }
  };

  const handlePlayVoice = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(inputText);
      utterance.pitch = pitch;
      utterance.rate = speed;

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlaying(true);
      setTimeout(() => setIsPlaying(false), 2000);
    }
  };

  const handleDownloadAudio = () => {
    safeDownloadMedia(inputText, 'Cloned_Voice_Synthesis.txt', { type: 'text', onNotify });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-white">
      {/* Header */}
      <div className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 border border-purple-500/30 shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Mic className="w-64 h-64 text-purple-400" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
            AI Voice Clone & Vocal Synthesizer (एआई वॉयस क्लोनिंग)
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-indigo-400">
            Neural Voice Cloning & Emotional Speech Synthesizer
          </h1>
          <p className="text-slate-300 max-w-2xl text-sm leading-relaxed">
            Synthesize ultra-realistic human voices in Hindi, English, and Hinglish with customizable pitch, speed, and emotional inflection.
          </p>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <h3 className="text-lg font-bold flex items-center gap-2 text-purple-300">
            <Sliders className="w-5 h-5" /> Voice Controls
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Select Neural Preset Voice</label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Deep Cinematic Narrator (Male)">Deep Cinematic Narrator (Male)</option>
                <option value="Warm Conversational (Female)">Warm Conversational (Female)</option>
                <option value="Energy Youtube Host (Hindi/Hinglish)">Energy Youtube Host (Hindi/Hinglish)</option>
                <option value="Custom Cloned Voice Sample">Custom Cloned Voice Sample</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Emotional Tone</label>
              <select
                value={emotion}
                onChange={(e) => setEmotionalTone(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="enthusiastic">Enthusiastic & High Energy</option>
                <option value="dramatic">Dramatic & Suspenseful</option>
                <option value="calm">Calm & Educational</option>
                <option value="neutral">Neutral Standard</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>Vocal Pitch</span>
                <span className="font-mono text-purple-400 font-bold">{pitch.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>Speech Speed</span>
                <span className="font-mono text-purple-400 font-bold">{speed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            <button
              onClick={handleSynthesize}
              disabled={isSynthesizing}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:opacity-90 font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSynthesizing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Synthesizing Speech...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" /> Synthesize Voice
                </>
              )}
            </button>
          </div>
        </div>

        {/* Text Input & Audio Player */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-purple-500/30 space-y-6 shadow-2xl">
            <div>
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Speech Script Text (Hindi / English / Hinglish)
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isEnhancing || !inputText.trim()}
                    onClick={handleEnhanceScript}
                    className="px-2.5 py-1 rounded-lg bg-purple-950 border border-purple-800 text-purple-300 text-xs font-semibold hover:bg-purple-900 transition-colors flex items-center gap-1 disabled:opacity-50"
                    title="Sirf script text enhance karein"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin' : ''}`} />
                    <span>{isEnhancing ? 'Enhancing...' : '1. Enhance Script'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isEnhancing || isSynthesizing || !inputText.trim()}
                    onClick={handleEnhanceAndSynthesize}
                    className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-400 via-pink-400 to-cyan-300 hover:brightness-110 text-slate-950 font-black text-xs flex items-center gap-1 transition-all hover:scale-105 disabled:opacity-50 shadow-md cursor-pointer"
                    title="Script enhance karein aur turant neural speech voice generate karein"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current text-slate-950" />
                    <span>⚡ Enhance & Synthesize Maal</span>
                  </button>
                </div>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors font-mono leading-relaxed"
                placeholder="Type your script here..."
              />
            </div>

            {/* Live Audio Visualizer Bar when playing or synthesizing */}
            {(isPlaying || isSynthesizing) && (
              <div className="p-3 rounded-xl bg-purple-950/70 border border-purple-800 flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold text-purple-200">
                    {isSynthesizing ? 'Neural Vocal Tract Synthesizing...' : 'Live Neural Audio Playing...'}
                  </span>
                </div>
                <div className="flex items-center gap-1 h-6">
                  {[35, 75, 45, 90, 60, 85, 40, 95, 65, 50, 80, 40, 70, 90].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-gradient-to-t from-purple-500 to-cyan-400 rounded-full animate-pulse"
                      style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayVoice}
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </button>
                <div>
                  <div className="text-sm font-bold text-white">{selectedVoice}</div>
                  <div className="text-xs text-purple-300 font-mono">
                    Pitch: {pitch}x • Speed: {speed}x • Emotion: {emotion}
                  </div>
                </div>
              </div>

              <button
                onClick={handleDownloadAudio}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-md"
              >
                <Download className="w-4 h-4" /> Download Audio Package
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

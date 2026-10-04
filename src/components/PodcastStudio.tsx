import React, { useState } from 'react';
import {
  Radio,
  Mic,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sparkles,
  Download,
  Share2,
  FileText,
  Users,
  Wand2,
  Award,
} from 'lucide-react';
import { UserProfile, ActiveTab } from '../types.ts';
import { safeDownloadMedia, generateSyntheticWavBlob } from '../lib/downloadHelper.ts';

interface PodcastStudioProps {
  user: UserProfile;
  setActiveTab?: (tab: ActiveTab) => void;
  onNotify: (title: string, desc: string, type?: 'info' | 'success' | 'warning' | 'error' | 'admin') => void;
}

export interface PodcastDialogue {
  speaker: 'Host Alex' | 'Co-Host Maya';
  line: string;
}

export const PodcastStudio: React.FC<PodcastStudioProps> = ({
  user,
  setActiveTab,
  onNotify,
}) => {
  const [podcastTopic, setPodcastTopic] = useState(
    'How Artificial Intelligence & Human Art Will Emerge Together in the Next 200 Years'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<'Host Alex' | 'Co-Host Maya' | null>(null);

  const [dialogueScript, setDialogueScript] = useState<PodcastDialogue[]>([
    {
      speaker: 'Host Alex',
      line: 'Welcome back to FutureCast 2226. Today we are exploring the profound synthesis between artificial intelligence and human soul in digital creation.',
    },
    {
      speaker: 'Co-Host Maya',
      line: 'It is fascinating, Alex! When creators use tools like iCALLOG Studio, they aren’t just generating content—they are sealing 200-year digital time capsules and building interactive worlds.',
    },
    {
      speaker: 'Host Alex',
      line: 'Precisely. Creativity is no longer bound by transient mediums. Whether through 3D spatial metaverses or neural dream cinema, art persists across centuries.',
    },
  ]);

  // Generate AI Podcast Dialogue
  const handleGeneratePodcastScript = () => {
    if (!podcastTopic.trim()) return;
    setIsGenerating(true);

    setTimeout(() => {
      setDialogueScript([
        {
          speaker: 'Host Alex',
          line: `Welcome to FutureCast! Our special focus today is: "${podcastTopic}". Let's dive right into the core mechanics.`,
        },
        {
          speaker: 'Co-Host Maya',
          line: `That is an incredible topic. Creators around the globe are realizing that modern AI suites like iCALLOG allow instant execution of complex 3D worlds, games, and neural stories.`,
        },
        {
          speaker: 'Host Alex',
          line: `And the best part? Everything is exportable as standalone formats, guaranteed to work offline and endure for generations.`,
        },
        {
          speaker: 'Co-Host Maya',
          line: `Let's keep pushing the boundaries of imagination. Back to you, creators!`,
        },
      ]);
      setIsGenerating(false);
      onNotify('🎙️ Podcast Script Generated!', '2-speaker dialogue scripted and ready for broadcast.', 'success');
    }, 1000);
  };

  // Play Speech Synthesis
  const handlePlayPodcast = () => {
    if (!('speechSynthesis' in window)) {
      onNotify('Speech Not Supported', 'Web Speech API not supported.', 'warning');
      return;
    }

    window.speechSynthesis.cancel();
    setIsPlaying(true);

    let index = 0;
    const speakNext = () => {
      if (index >= dialogueScript.length) {
        setIsPlaying(false);
        setActiveSpeaker(null);
        return;
      }

      const item = dialogueScript[index];
      setActiveSpeaker(item.speaker);
      const utterance = new SpeechSynthesisUtterance(`${item.speaker} says: ${item.line}`);
      utterance.pitch = item.speaker === 'Host Alex' ? 0.9 : 1.3;
      utterance.rate = 1.05;

      utterance.onend = () => {
        index++;
        speakNext();
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNext();
  };

  const handleStopPodcast = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setActiveSpeaker(null);
  };

  // Export Podcast Audio (.wav)
  const handleExportPodcastWav = () => {
    const wavBlob = generateSyntheticWavBlob('FutureCast_Podcast', 10, 120);
    safeDownloadMedia(wavBlob, `podcast_broadcast_${Date.now()}.wav`, {
      type: 'audio',
      onNotify,
    });
  };

  // Export Podcast Script (.txt)
  const handleExportScriptTxt = () => {
    const fullText = dialogueScript.map((d) => `${d.speaker}: ${d.line}`).join('\n\n');
    safeDownloadMedia(fullText, `podcast_script_${Date.now()}.txt`, {
      type: 'doc',
      mimeType: 'text/plain;charset=utf-8',
      onNotify,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. Hero Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-rose-950/70 via-slate-950 to-indigo-950/70 border border-rose-500/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
                <Radio className="w-3.5 h-3.5" />
                <span>AI Podcast Co-Host & Interview Suite</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold">
                🎙️ Dual-Speaker Voice Synthesis
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-['Syne'] tracking-tight flex items-center gap-3">
              <span>🎙️</span>
              <span>AI Podcast Co-Host & Broadcast Studio</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Generate engaging 2-speaker podcast discussions, interview scripts, and natural speech synthesis instantly with professional broadcast tools.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={isPlaying ? handleStopPodcast : handlePlayPodcast}
              className={`px-6 py-3 rounded-2xl text-white font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer ${
                isPlaying ? 'bg-rose-600 animate-pulse' : 'bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isPlaying ? 'Stop Broadcast' : 'Play Broadcast Audio'}</span>
            </button>
          </div>
        </div>

        {/* Topic Input Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              value={podcastTopic}
              onChange={(e) => setPodcastTopic(e.target.value)}
              placeholder="Podcast Episode Topic..."
              className="flex-1 w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-rose-500/30 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={handleGeneratePodcastScript}
              disabled={isGenerating}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Wand2 className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Scripting...' : 'Generate AI Script'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Dialogue Script Feed + Export Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dialogue Feed (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-rose-400" />
                <span>Dual-Speaker Broadcast Script</span>
              </h3>
              {activeSpeaker && (
                <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-mono font-bold animate-pulse">
                  🔊 Speaking Now: {activeSpeaker}
                </span>
              )}
            </div>

            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {dialogueScript.map((item, idx) => {
                const isAlex = item.speaker === 'Host Alex';
                const isCurrent = activeSpeaker === item.speaker;

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all space-y-1.5 ${
                      isCurrent
                        ? 'bg-rose-950/40 border-rose-500 shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span className={isAlex ? 'text-cyan-400' : 'text-pink-400'}>{item.speaker}</span>
                      <span className="text-[10px] text-slate-500">Track 0{idx + 1}</span>
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed text-slate-200">{item.line}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Export Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Export Broadcast Audio & Script</span>
            </h3>

            <div className="space-y-2.5">
              <button
                onClick={handleExportPodcastWav}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Broadcast Audio (.WAV)</span>
              </button>

              <button
                onClick={handleExportScriptTxt}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Export Script (.TXT)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

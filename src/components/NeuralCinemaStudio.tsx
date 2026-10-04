import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Volume2,
  VolumeX,
  Download,
  Share2,
  Eye,
  Film,
  Compass,
  Layers,
  Wand2,
  Radio,
  Flame,
  Award,
} from 'lucide-react';
import { UserProfile, ActiveTab } from '../types.ts';
import { safeDownloadMedia } from '../lib/downloadHelper.ts';

interface NeuralCinemaStudioProps {
  user: UserProfile;
  setActiveTab?: (tab: ActiveTab) => void;
  onNotify: (title: string, desc: string, type?: 'info' | 'success' | 'warning' | 'error' | 'admin') => void;
}

export interface DreamScene {
  id: string;
  dreamPrompt: string;
  visualStyle: 'surreal_dreamcore' | 'bioluminescent_sci_fi' | 'neo_noir_cyber' | 'ethereal_aurora';
  cameraMotion: 'weightless_drift' | 'orbital_dive' | 'hyper_depth_zoom' | 'first_person_fly';
  neuralFrequency: '432Hz' | '528Hz' | 'theta_waves' | 'binaural_beat';
  narrativeMonologue: string;
  colorPalette: [string, string, string];
}

export const NeuralCinemaStudio: React.FC<NeuralCinemaStudioProps> = ({
  user,
  setActiveTab,
  onNotify,
}) => {
  const [dreamPrompt, setDreamPrompt] = useState(
    'A city built on floating crystal islands above a bioluminescent ocean where light rails connect ancient spires.'
  );
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const [activeDream, setActiveDream] = useState<DreamScene>({
    id: 'dream_01',
    dreamPrompt: 'Floating crystal islands above a bioluminescent ocean with luminous auroras.',
    visualStyle: 'bioluminescent_sci_fi',
    cameraMotion: 'weightless_drift',
    neuralFrequency: '432Hz',
    narrativeMonologue:
      'In the quiet space between wakefulness and eternity, gravity surrenders. The towers do not fall; they hum with the memory of light. Here, time has no dominion.',
    colorPalette: ['#06b6d4', '#8b5cf6', '#ec4899'],
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Synthesize Dream
  const handleSynthesizeDream = () => {
    if (!dreamPrompt.trim()) return;
    setIsSynthesizing(true);

    setTimeout(() => {
      const lower = dreamPrompt.toLowerCase();
      let style: DreamScene['visualStyle'] = 'bioluminescent_sci_fi';
      let colors: [string, string, string] = ['#06b6d4', '#8b5cf6', '#ec4899'];
      let freq: DreamScene['neuralFrequency'] = '432Hz';

      if (lower.includes('cyber') || lower.includes('city') || lower.includes('matrix')) {
        style = 'neo_noir_cyber';
        colors = ['#22c55e', '#06b6d4', '#0f172a'];
        freq = '528Hz';
      } else if (lower.includes('space') || lower.includes('cosmic') || lower.includes('aurora')) {
        style = 'ethereal_aurora';
        colors = ['#38bdf8', '#c084fc', '#f472b6'];
        freq = 'theta_waves';
      } else {
        style = 'surreal_dreamcore';
        colors = ['#f59e0b', '#ec4899', '#6366f1'];
      }

      setActiveDream({
        id: `dream_${Date.now()}`,
        dreamPrompt,
        visualStyle: style,
        cameraMotion: 'weightless_drift',
        neuralFrequency: freq,
        narrativeMonologue: `We awaken inside the collective subconscious. "${dreamPrompt}". The boundary between dream and cinema has dissolved.`,
        colorPalette: colors,
      });

      setIsSynthesizing(false);
      setIsPlaying(true);
      onNotify('🧠 Neural Dream Synthesized!', 'Visual atmosphere, camera glide & neural audio rendered.', 'success');
    }, 1100);
  };

  // Ethereal Canvas Particle & Nebula Dream Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let t = 0;
    const render = () => {
      if (isPlaying) t += 0.02;
      const w = canvas.width;
      const h = canvas.height;

      // Dark background
      ctx.fillStyle = '#05070f';
      ctx.fillRect(0, 0, w, h);

      // Multi-layer Neural Nebula
      const grad = ctx.createRadialGradient(
        w / 2 + Math.sin(t * 0.7) * 80,
        h / 2 + Math.cos(t * 0.5) * 60,
        20,
        w / 2,
        h / 2,
        Math.max(w, h) * 0.7
      );
      grad.addColorStop(0, `${activeDream.colorPalette[0]}45`);
      grad.addColorStop(0.5, `${activeDream.colorPalette[1]}30`);
      grad.addColorStop(1, '#05070f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Floating Dream Particles & Light Beams
      ctx.save();
      for (let i = 0; i < 40; i++) {
        const px = (Math.sin(t * 0.3 + i * 2) * 0.5 + 0.5) * w;
        const py = (Math.cos(t * 0.2 + i * 1.5) * 0.5 + 0.5) * h;
        const pSize = (Math.sin(t + i) * 0.5 + 0.5) * 6 + 2;

        ctx.fillStyle = i % 2 === 0 ? activeDream.colorPalette[0] : activeDream.colorPalette[2];
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, activeDream]);

  // Download Standalone Dream Experience
  const handleExportDreamExperience = () => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Neural Mind-to-Cinema Experience</title>
  <style>
    body { background: #05070f; color: #fff; font-family: 'Georgia', serif; text-align: center; padding: 40px; margin: 0; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; }
    h1 { color: ${activeDream.colorPalette[0]}; font-size: 26px; }
    p { font-size: 16px; color: #cbd5e1; max-width: 600px; line-height: 1.8; font-style: italic; }
  </style>
</head>
<body>
  <h1>Neural Dream Cinema</h1>
  <p>"${activeDream.narrativeMonologue}"</p>
  <div style="font-family: monospace; font-size: 12px; color: #38bdf8; margin-top: 20px;">
    Style: ${activeDream.visualStyle} • Frequency: ${activeDream.neuralFrequency}
  </div>
</body>
</html>`;

    safeDownloadMedia(html, `Neural_Dream_${Date.now()}.html`, {
      mimeType: 'text/html',
      onNotify,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. Hero Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950/70 via-slate-950 to-pink-950/60 border border-purple-500/40 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
                <Brain className="w-3.5 h-3.5" />
                <span>Neural Mind-to-Cinema Architecture</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold">
                🌌 Multi-Sensory Dream Synthesizer
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-['Syne'] tracking-tight flex items-center gap-3">
              <span>🧠</span>
              <span>Neural Mind-to-Cinema & Dream Visualizer</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Translate raw human thoughts, dreams, and stream-of-consciousness visions into multi-sensory cinematic scenes with ambient audio and poetic narratives.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-950/50 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isPlaying ? 'Pause Dream Canvas' : 'Play Dream Canvas'}</span>
            </button>
          </div>
        </div>

        {/* Dream Prompt Input Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              value={dreamPrompt}
              onChange={(e) => setDreamPrompt(e.target.value)}
              placeholder="Describe your subconscious dream: e.g. A city among floating purple storm clouds..."
              className="flex-1 w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-purple-500/30 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={handleSynthesizeDream}
              disabled={isSynthesizing}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Wand2 className={`w-4 h-4 ${isSynthesizing ? 'animate-spin' : ''}`} />
              <span>{isSynthesizing ? 'Synthesizing Layers...' : 'Synthesize Dream'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive Dream Canvas + Multi-Sensory Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Canvas Display Viewport (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative rounded-3xl bg-slate-950 border border-slate-800 p-2 overflow-hidden shadow-2xl flex flex-col items-center">
            <canvas
              ref={canvasRef}
              width={640}
              height={400}
              className="w-full max-w-full h-auto aspect-[16/10] rounded-2xl bg-[#05070f] border border-purple-500/20"
            />

            {/* In-Canvas Dream Caption */}
            <div className="p-4 w-full text-center space-y-1">
              <p className="text-xs sm:text-sm font-serif italic text-purple-200 leading-relaxed">
                &quot;{activeDream.narrativeMonologue}&quot;
              </p>
            </div>
          </div>
        </div>

        {/* Sensory Layers Breakdown (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>4-Tier Multi-Sensory Dream Matrix</span>
            </h3>

            {/* Layer 1: Visual Style */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[10px] font-mono text-purple-400 uppercase">1. Visual Atmosphere</div>
              <div className="text-xs font-bold text-white capitalize">{activeDream.visualStyle.replace(/_/g, ' ')}</div>
            </div>

            {/* Layer 2: Camera Dynamics */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[10px] font-mono text-cyan-400 uppercase">2. Spatial Camera Motion</div>
              <div className="text-xs font-bold text-white capitalize">{activeDream.cameraMotion.replace(/_/g, ' ')}</div>
            </div>

            {/* Layer 3: Neural Frequency */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[10px] font-mono text-amber-400 uppercase">3. Neural Acoustic Tuning</div>
              <div className="text-xs font-bold text-white">{activeDream.neuralFrequency} Healing & Dream Resonator</div>
            </div>

            <button
              onClick={handleExportDreamExperience}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Standalone Dream Experience</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

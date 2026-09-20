import React, { useState, useEffect, useRef } from 'react';
import {
  Sliders,
  Activity,
  Waves,
  Volume2,
  Sparkles,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { playSynthNote } from '../lib/musicThemeEngine.ts';

interface StudioFXRackDeviceProps {
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const StudioFXRackDevice: React.FC<StudioFXRackDeviceProps> = ({ onNotify }) => {
  // 5-Band EQ (dB gain: -12 to +12)
  const [eq60Hz, setEq60Hz] = useState(3);
  const [eq250Hz, setEq250Hz] = useState(1);
  const [eq1kHz, setEq1kHz] = useState(0);
  const [eq4kHz, setEq4kHz] = useState(2);
  const [eq12kHz, setEq12kHz] = useState(4);

  // FX Processors
  const [reverbRoom, setReverbRoom] = useState(45); // %
  const [delayTime, setDelayTime] = useState(280); // ms
  const [delayFeedback, setDelayFeedback] = useState(35); // %
  const [tubeDistortion, setTubeDistortion] = useState(15); // %
  const [chorusDepth, setChorusDepth] = useState(25); // %
  const [compressorThreshold, setCompressorThreshold] = useState(-18); // dB

  // Visualizer Mode
  const [visualMode, setVisualMode] = useState<'bars' | 'wave' | 'lissajous'>('bars');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Canvas visualizer animation
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const render = () => {
      phase += 0.04;
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      if (visualMode === 'bars') {
        const barCount = 36;
        const barWidth = width / barCount - 2;

        for (let i = 0; i < barCount; i++) {
          const freqFactor = Math.sin(phase + i * 0.2) * 0.5 + 0.5;
          const noise = Math.sin(phase * 2 + i * 0.7) * 0.3;
          const barHeight = Math.max(6, (freqFactor + noise) * (height * 0.8));

          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
          gradient.addColorStop(0, '#06b6d4');
          gradient.addColorStop(0.5, '#6366f1');
          gradient.addColorStop(1, '#ec4899');

          ctx.fillStyle = gradient;
          ctx.fillRect(i * (barWidth + 2), height - barHeight, barWidth, barHeight);
        }
      } else if (visualMode === 'wave') {
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#22d3ee';

        for (let x = 0; x < width; x++) {
          const y =
            height / 2 +
            Math.sin(x * 0.04 + phase * 3) * 22 * (eq60Hz / 6 + 1) +
            Math.sin(x * 0.09 - phase * 2) * 14 * (eq4kHz / 6 + 1);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else {
        // Lissajous / Stereo Phase Scope
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#a855f7';
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) * 0.75;

        for (let t = 0; t < Math.PI * 2; t += 0.05) {
          const x = centerX + Math.sin(t * 3 + phase) * radius;
          const y = centerY + Math.cos(t * 2 + phase * 1.2) * radius;
          if (t === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [visualMode, eq60Hz, eq4kHz]);

  const testMasterAudio = () => {
    playSynthNote(440, 'sawtooth', 0.6, { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.3 });
    setTimeout(() => {
      playSynthNote(554.37, 'sawtooth', 0.6, { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.3 });
    }, 120);
    setTimeout(() => {
      playSynthNote(659.25, 'sawtooth', 0.8, { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.3 });
    }, 240);
    onNotify('FX Rack Test', 'Auditioning master signal chain with current EQ & Reverb settings!', 'info');
  };

  const resetFX = () => {
    setEq60Hz(0);
    setEq250Hz(0);
    setEq1kHz(0);
    setEq4kHz(0);
    setEq12kHz(0);
    setReverbRoom(25);
    setDelayTime(250);
    setDelayFeedback(20);
    setTubeDistortion(0);
    setChorusDepth(15);
    setCompressorThreshold(-12);
    onNotify('FX Reset', 'Master rack reset to flat studio response.', 'info');
  };

  return (
    <div className="p-5 rounded-3xl bg-slate-900/90 border border-purple-500/40 shadow-2xl space-y-5">
      {/* Device Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/40">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white font-['Syne'] tracking-wide">
                Studio Master FX Rack & 5-Band Mastering EQ
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40">
                DSP Audio Chain
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Parametric frequency sculpting, hardware tube warmth, stereo spatial reverb & live oscilloscope visualizer.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={testMasterAudio}
            className="py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
          >
            <Volume2 className="w-4 h-4" />
            <span>Audition Signal</span>
          </button>

          <button
            type="button"
            onClick={resetFX}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Reset to Flat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Real-Time Audio Spectrum & Oscilloscope Display */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Real-Time Spectrum Visualizer</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setVisualMode('bars')}
              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all ${
                visualMode === 'bars' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bars 📊
            </button>
            <button
              type="button"
              onClick={() => setVisualMode('wave')}
              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all ${
                visualMode === 'wave' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Wave 〰️
            </button>
            <button
              type="button"
              onClick={() => setVisualMode('lissajous')}
              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all ${
                visualMode === 'lissajous' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Phase 🌀
            </button>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={600}
          height={100}
          className="w-full h-24 rounded-xl bg-slate-950 border border-cyan-500/20 shadow-inner"
        />
      </div>

      {/* 5-Band Graphic Equalizer */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
        <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" /> 5-Band Precision Mastering Equalizer (dB)
        </label>

        <div className="grid grid-cols-5 gap-3 text-center">
          {[
            { label: 'Sub 60Hz', value: eq60Hz, setter: setEq60Hz, color: 'accent-rose-500' },
            { label: 'Low 250Hz', value: eq250Hz, setter: setEq250Hz, color: 'accent-amber-500' },
            { label: 'Mid 1kHz', value: eq1kHz, setter: setEq1kHz, color: 'accent-emerald-500' },
            { label: 'High-Mid 4kHz', value: eq4kHz, setter: setEq4kHz, color: 'accent-cyan-500' },
            { label: 'Air 12kHz', value: eq12kHz, setter: setEq12kHz, color: 'accent-purple-500' },
          ].map((band) => (
            <div key={band.label} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 flex flex-col items-center">
              <span className="text-[10px] font-mono font-bold text-slate-300">{band.label}</span>
              <div className="h-28 flex items-center justify-center">
                <input
                  type="range"
                  min="-12"
                  max="12"
                  value={band.value}
                  onChange={(e) => band.setter(parseInt(e.target.value))}
                  className={`h-24 w-1.5 -rotate-90 bg-slate-800 rounded appearance-none cursor-pointer ${band.color}`}
                />
              </div>
              <span className={`text-[10px] font-mono font-bold ${band.value > 0 ? 'text-emerald-400' : band.value < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {band.value > 0 ? `+${band.value}` : band.value} dB
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hardware FX Modules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {/* Reverb Room */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-white">
            <span className="flex items-center gap-1">🌌 Hall Reverb</span>
            <span className="font-mono text-purple-400">{reverbRoom}% Wet</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={reverbRoom}
            onChange={(e) => setReverbRoom(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-purple-500"
          />
          <div className="text-[10px] text-slate-500">Spatial depth & acoustic reflection</div>
        </div>

        {/* Stereo Delay */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-white">
            <span className="flex items-center gap-1">⏱️ Ping-Pong Delay</span>
            <span className="font-mono text-cyan-400">{delayTime}ms / {delayFeedback}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="600"
            step="10"
            value={delayTime}
            onChange={(e) => setDelayTime(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="text-[10px] text-slate-500">Echo repeat time & stereo pan bounce</div>
        </div>

        {/* Tube Saturation / Overdrive */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-white">
            <span className="flex items-center gap-1">🔥 Analog Tube Drive</span>
            <span className="font-mono text-amber-400">{tubeDistortion}% Warmth</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={tubeDistortion}
            onChange={(e) => setTubeDistortion(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-500"
          />
          <div className="text-[10px] text-slate-500">Harmonic overtone saturation</div>
        </div>
      </div>
    </div>
  );
};

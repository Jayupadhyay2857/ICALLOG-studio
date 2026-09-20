import React, { useState, useEffect, useRef } from 'react';
import {
  Disc,
  Play,
  Pause,
  Repeat,
  Zap,
  Volume2,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { playDrumSound, playSynthNote } from '../lib/musicThemeEngine.ts';

interface DJTurntableDeviceProps {
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const DJTurntableDevice: React.FC<DJTurntableDeviceProps> = ({ onNotify }) => {
  const [isPlayingA, setIsPlayingA] = useState(false);
  const [isPlayingB, setIsPlayingB] = useState(false);
  const [crossfader, setCrossfader] = useState(50); // 0 (Deck A) to 100 (Deck B)
  const [pitchA, setPitchA] = useState(0); // -8% to +8%
  const [pitchB, setPitchB] = useState(0);
  const [activeLoopA, setActiveLoopA] = useState<number | null>(null);
  const [activeLoopB, setActiveLoopB] = useState<number | null>(null);
  const [deckARotation, setDeckARotation] = useState(0);
  const [deckBRotation, setDeckBRotation] = useState(0);

  // Scratch vinyl handler
  const handleScratch = (deck: 'A' | 'B') => {
    playSynthNote(deck === 'A' ? 220 : 330, 'sawtooth', 0.12, { attack: 0.005, decay: 0.08, sustain: 0.1, release: 0.05, cutoff: 1400 });
    if (deck === 'A') {
      setDeckARotation((prev) => prev + 45);
    } else {
      setDeckBRotation((prev) => prev - 45);
    }
    onNotify('DJ Vinyl Scratch', `Deck ${deck} record scratched & slip-matted!`, 'info');
  };

  // Vinyl Brake Sound FX
  const handleVinylBrake = (deck: 'A' | 'B') => {
    playSynthNote(deck === 'A' ? 180 : 260, 'sawtooth', 0.6, { attack: 0.01, decay: 0.4, sustain: 0.1, release: 0.2, cutoff: 800 });
    if (deck === 'A') setIsPlayingA(false);
    else setIsPlayingB(false);
    onNotify('Vinyl Turntable Brake', `Deck ${deck} platter stopped with motor slow-down!`, 'warning');
  };

  // Rotation animation
  useEffect(() => {
    let animId: number;
    const updateRotation = () => {
      if (isPlayingA) {
        setDeckARotation((prev) => (prev + 2 * (1 + pitchA / 100)) % 360);
      }
      if (isPlayingB) {
        setDeckBRotation((prev) => (prev + 2 * (1 + pitchB / 100)) % 360);
      }
      animId = requestAnimationFrame(updateRotation);
    };
    animId = requestAnimationFrame(updateRotation);
    return () => cancelAnimationFrame(animId);
  }, [isPlayingA, isPlayingB, pitchA, pitchB]);

  return (
    <div className="p-5 rounded-3xl bg-slate-900/90 border border-emerald-500/40 shadow-2xl space-y-5">
      {/* Device Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-900/40">
            <Disc className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white font-['Syne'] tracking-wide">
                Dual DJ Scratch Turntable & Crossfader Deck
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Pro DJ Console
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Dual spinning vinyl platters with interactive scratch jog wheels, pitch faders, cue points & vinyl brake.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-emerald-300 px-3 py-1 rounded-xl bg-emerald-950 border border-emerald-800">
            Crossfader: {crossfader < 45 ? `Deck A (${100 - crossfader}%)` : crossfader > 55 ? `Deck B (${crossfader}%)` : 'Center Mix (50/50)'}
          </span>
        </div>
      </div>

      {/* Dual Vinyl Turntables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deck A */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-4 text-center">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-cyan-400 font-mono">DECK A (Bollywood & Trap)</span>
            <span className="text-[10px] text-slate-400 font-mono">{128 * (1 + pitchA / 100)} BPM</span>
          </div>

          {/* Vinyl Platter */}
          <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
            <div
              style={{ transform: `rotate(${deckARotation}deg)` }}
              onMouseDown={() => handleScratch('A')}
              className="w-44 h-44 rounded-full bg-neutral-900 border-4 border-slate-700 shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing relative overflow-hidden transition-transform duration-75"
            >
              {/* Vinyl Grooves */}
              <div className="w-36 h-36 rounded-full border border-slate-700/60" />
              <div className="w-28 h-28 rounded-full border border-slate-700/60 absolute" />
              <div className="w-20 h-20 rounded-full border border-slate-700/60 absolute" />
              {/* Center Label */}
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-[9px] font-black text-white absolute shadow-md">
                DECK A
              </div>
            </div>
          </div>

          {/* Deck A Controls */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlayingA(!isPlayingA)}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1 shadow-md ${
                isPlayingA ? 'bg-rose-600 text-white' : 'bg-cyan-600 text-white'
              }`}
            >
              {isPlayingA ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlayingA ? 'Pause A' : 'Play A'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleScratch('A')}
              className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-bold active:scale-95"
            >
              🎛️ Scratch
            </button>

            <button
              type="button"
              onClick={() => handleVinylBrake('A')}
              className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-rose-950 text-rose-300 border border-slate-700 text-xs font-bold"
            >
              ⏹️ Brake
            </button>
          </div>

          {/* Deck A Pitch Slider */}
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span>Pitch:</span>
            <input
              type="range"
              min="-8"
              max="8"
              value={pitchA}
              onChange={(e) => setPitchA(parseInt(e.target.value))}
              className="flex-1 h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-500"
            />
            <span>{pitchA > 0 ? `+${pitchA}` : pitchA}%</span>
          </div>
        </div>

        {/* Deck B */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-4 text-center">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-purple-400 font-mono">DECK B (Cyberpunk & Lo-Fi)</span>
            <span className="text-[10px] text-slate-400 font-mono">{124 * (1 + pitchB / 100)} BPM</span>
          </div>

          {/* Vinyl Platter */}
          <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
            <div
              style={{ transform: `rotate(${deckBRotation}deg)` }}
              onMouseDown={() => handleScratch('B')}
              className="w-44 h-44 rounded-full bg-neutral-900 border-4 border-slate-700 shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing relative overflow-hidden transition-transform duration-75"
            >
              <div className="w-36 h-36 rounded-full border border-slate-700/60" />
              <div className="w-28 h-28 rounded-full border border-slate-700/60 absolute" />
              <div className="w-20 h-20 rounded-full border border-slate-700/60 absolute" />
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-[9px] font-black text-white absolute shadow-md">
                DECK B
              </div>
            </div>
          </div>

          {/* Deck B Controls */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlayingB(!isPlayingB)}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1 shadow-md ${
                isPlayingB ? 'bg-rose-600 text-white' : 'bg-purple-600 text-white'
              }`}
            >
              {isPlayingB ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlayingB ? 'Pause B' : 'Play B'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleScratch('B')}
              className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-purple-300 border border-slate-700 text-xs font-bold active:scale-95"
            >
              🎛️ Scratch
            </button>

            <button
              type="button"
              onClick={() => handleVinylBrake('B')}
              className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-rose-950 text-rose-300 border border-slate-700 text-xs font-bold"
            >
              ⏹️ Brake
            </button>
          </div>

          {/* Deck B Pitch Slider */}
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span>Pitch:</span>
            <input
              type="range"
              min="-8"
              max="8"
              value={pitchB}
              onChange={(e) => setPitchB(parseInt(e.target.value))}
              className="flex-1 h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-purple-500"
            />
            <span>{pitchB > 0 ? `+${pitchB}` : pitchB}%</span>
          </div>
        </div>
      </div>

      {/* Center Master Crossfader */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
        <div className="flex justify-between items-center text-xs font-mono font-bold">
          <span className="text-cyan-400">◀ DECK A</span>
          <span className="text-slate-400 font-normal">DJ Crossfader Slider</span>
          <span className="text-purple-400">DECK B ▶</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={crossfader}
          onChange={(e) => setCrossfader(parseInt(e.target.value))}
          className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
      </div>
    </div>
  );
};

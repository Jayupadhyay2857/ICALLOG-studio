import React, { useState, useEffect, useRef } from 'react';
import {
  Disc,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  Sliders,
  Zap,
} from 'lucide-react';
import { playDrumSound } from '../lib/musicThemeEngine.ts';

interface DrumMachineDeviceProps {
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

type DrumTrack = 'kick' | 'snare' | 'hihat' | '808' | 'clap' | 'perc';

interface TrackConfig {
  id: DrumTrack;
  name: string;
  hindiName: string;
  icon: string;
  color: string;
  steps: boolean[];
}

const PRESET_PATTERNS: { name: string; bpm: number; tracks: Record<DrumTrack, boolean[]> }[] = [
  {
    name: '🔥 Punjabi Bhangra Dhol Beat',
    bpm: 132,
    tracks: {
      kick:  [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
      hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      '808': [true, false, false, true, false, false, true, false, true, false, false, true, false, false, true, false],
      clap:  [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      perc:  [false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true],
    },
  },
  {
    name: '⚡ Trap 808 Rolling Beat',
    bpm: 140,
    tracks: {
      kick:  [true, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      '808': [true, false, false, false, false, false, true, false, false, false, true, false, false, false, true, false],
      clap:  [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      perc:  [false, false, false, true, false, false, false, true, false, false, false, true, false, false, false, true],
    },
  },
  {
    name: '🎛️ 4-On-The-Floor EDM Drop',
    bpm: 128,
    tracks: {
      kick:  [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
      '808': [true, true, false, false, true, true, false, false, true, true, false, false, true, true, false, false],
      clap:  [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      perc:  [false, false, false, false, false, false, false, false, true, false, false, false, false, false, true, false],
    },
  },
  {
    name: '☕ Lo-Fi Chillhop Dusty Groove',
    bpm: 80,
    tracks: {
      kick:  [true, false, false, false, false, false, true, false, false, false, false, false, true, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      '808': [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      clap:  [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      perc:  [false, true, false, false, false, true, false, false, false, true, false, false, false, true, false, false],
    },
  },
];

export const DrumMachineDevice: React.FC<DrumMachineDeviceProps> = ({ onNotify }) => {
  const [bpm, setBpm] = useState(128);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const [tracks, setTracks] = useState<TrackConfig[]>([
    { id: 'kick', name: 'Bass Kick', hindiName: 'किक बेस', icon: '🥁', color: 'from-rose-600 to-red-600', steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false] },
    { id: 'snare', name: 'Snare Drum', hindiName: 'स्नेयर ड्रम', icon: '🪘', color: 'from-amber-600 to-orange-600', steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false] },
    { id: 'hihat', name: 'Hi-Hat Cymbal', hindiName: 'हाई-हैट झांझ', icon: '✨', color: 'from-cyan-600 to-blue-600', steps: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false] },
    { id: '808', name: '808 Sub-Bass', hindiName: '808 सब-बेस', icon: '🔊', color: 'from-purple-600 to-indigo-600', steps: [true, false, false, false, false, false, true, false, false, false, true, false, false, false, true, false] },
    { id: 'clap', name: 'Hand Clap', hindiName: 'हाथ की ताली', icon: '👏', color: 'from-emerald-600 to-teal-600', steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false] },
    { id: 'perc', name: 'Percussion / Dhol', hindiName: 'ढोलक व परकशन', icon: '🔔', color: 'from-pink-600 to-rose-600', steps: [false, false, false, true, false, false, false, true, false, false, false, true, false, false, false, true] },
  ]);

  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;

  // Toggle step
  const toggleStep = (trackId: DrumTrack, stepIndex: number) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const newSteps = [...t.steps];
          newSteps[stepIndex] = !newSteps[stepIndex];
          return { ...t, steps: newSteps };
        }
        return t;
      })
    );
  };

  // Load Preset Pattern
  const loadPattern = (preset: typeof PRESET_PATTERNS[0]) => {
    setBpm(preset.bpm);
    setTracks((prev) =>
      prev.map((t) => ({
        ...t,
        steps: preset.tracks[t.id] || new Array(16).fill(false),
      }))
    );
    onNotify('Beat Pattern Loaded', `Loaded ${preset.name} (${preset.bpm} BPM)`, 'info');
  };

  // Clear all steps
  const clearAllSteps = () => {
    setTracks((prev) => prev.map((t) => ({ ...t, steps: new Array(16).fill(false) })));
    onNotify('Grid Cleared', 'All 16-step drum notes wiped.', 'info');
  };

  // Randomize Beat
  const randomizeBeat = () => {
    setTracks((prev) =>
      prev.map((t) => ({
        ...t,
        steps: Array.from({ length: 16 }, () => Math.random() > 0.7),
      }))
    );
    onNotify('Beat Randomizer', 'AI randomized fresh 16-step groove!', 'success');
  };

  // Step Sequencer Interval Loop
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    let step = 0;

    if (isPlaying) {
      const stepDurationMs = (60 / bpmRef.current / 4) * 1000;
      timer = setInterval(() => {
        setCurrentStep(step);
        // Play sounds for active steps
        tracksRef.current.forEach((t) => {
          if (t.steps[step]) {
            playDrumSound(t.id);
          }
        });
        step = (step + 1) % 16;
      }, stepDurationMs);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, bpm]);

  return (
    <div className="p-5 rounded-3xl bg-slate-900/90 border border-amber-500/40 shadow-2xl space-y-5">
      {/* Device Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-amber-900/40">
            <Disc className={`w-5 h-5 ${isPlaying ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white font-['Syne'] tracking-wide">
                16-Step Drum Machine & 808 Beat Matrix
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Hardware Sequencer
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Programmable 16-step multi-timbral rhythm matrix with instant drum trigger pads & groove presets.
            </p>
          </div>
        </div>

        {/* Play/Pause & Transport Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
              isPlaying
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Stop Loop' : 'Run Sequencer'}</span>
          </button>

          <button
            type="button"
            onClick={randomizeBeat}
            className="p-2 rounded-xl bg-slate-800 hover:bg-amber-950 text-amber-300 border border-slate-700 hover:border-amber-500 transition-colors"
            title="AI Randomize Pattern"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={clearAllSteps}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400 border border-slate-700 transition-colors"
            title="Clear Matrix"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* BPM & Pattern Presets */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* BPM Slider */}
        <div className="sm:col-span-4 p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-amber-400 w-16">{bpm} BPM</span>
          <input
            type="range"
            min="60"
            max="180"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value))}
            className="flex-1 h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Pattern Preset Pills */}
        <div className="sm:col-span-8 flex flex-wrap items-center gap-1.5">
          {PRESET_PATTERNS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => loadPattern(p)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-amber-950/80 border border-slate-800 hover:border-amber-500/60 text-[11px] text-slate-300 hover:text-white transition-all font-semibold"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* 16-Step LED Indicator Bar */}
      <div className="flex items-center gap-1 pl-32 pr-2">
        {Array.from({ length: 16 }).map((_, idx) => (
          <div
            key={idx}
            className={`flex-1 h-1.5 rounded-full transition-all ${
              currentStep === idx && isPlaying
                ? 'bg-amber-400 shadow-md shadow-amber-400/80 scale-y-125'
                : idx % 4 === 0
                ? 'bg-slate-700'
                : 'bg-slate-800/60'
            }`}
          />
        ))}
      </div>

      {/* 16-Step Grid Sequencer Matrix */}
      <div className="space-y-2.5">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="p-2 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-2"
          >
            {/* Drum Hit Trigger Button */}
            <button
              type="button"
              onClick={() => playDrumSound(track.id)}
              className={`w-28 py-2 px-2.5 rounded-xl bg-gradient-to-r ${track.color} text-white text-left font-bold shadow-md hover:brightness-110 active:scale-95 transition-all shrink-0 flex items-center justify-between`}
            >
              <div className="truncate">
                <div className="text-[11px] leading-tight truncate">{track.name}</div>
                <div className="text-[9px] opacity-80 truncate">{track.hindiName}</div>
              </div>
              <span className="text-sm">{track.icon}</span>
            </button>

            {/* 16 Step Buttons */}
            <div className="flex-1 grid grid-cols-16 gap-1">
              {track.steps.map((isActive, stepIdx) => {
                const isCurrent = currentStep === stepIdx && isPlaying;
                const isQuarterNote = stepIdx % 4 === 0;
                return (
                  <button
                    key={stepIdx}
                    type="button"
                    onClick={() => toggleStep(track.id, stepIdx)}
                    className={`h-9 rounded-lg border transition-all flex items-center justify-center font-mono text-[9px] ${
                      isActive
                        ? `bg-gradient-to-br ${track.color} border-white/60 text-white font-black shadow-inner shadow-black/40 scale-[0.98]`
                        : isQuarterNote
                        ? 'bg-slate-900 border-slate-700/80 text-slate-500 hover:bg-slate-800'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-600 hover:bg-slate-800/60'
                    } ${isCurrent ? 'ring-2 ring-amber-300' : ''}`}
                  >
                    {stepIdx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Live Drum MPC Trigger Pads (6 MPC Pads) */}
      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
        <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" /> Real-Time MPC Finger Drumming Pads
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {tracks.map((track) => (
            <button
              key={track.id}
              type="button"
              onMouseDown={() => playDrumSound(track.id)}
              className={`py-4 px-3 rounded-2xl bg-gradient-to-br ${track.color} hover:brightness-125 active:scale-90 text-white font-bold shadow-lg transition-all text-center space-y-1`}
            >
              <div className="text-xl">{track.icon}</div>
              <div className="text-xs font-black leading-none">{track.name}</div>
              <div className="text-[9px] opacity-80">Tap to Hit</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

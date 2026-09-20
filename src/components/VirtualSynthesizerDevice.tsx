import React, { useState, useEffect } from 'react';
import {
  Piano,
  Volume2,
  Sliders,
  Sparkles,
  Zap,
  Play,
  RotateCcw,
  Music,
} from 'lucide-react';
import {
  playSynthNote,
  playChord,
  NOTE_FREQUENCIES,
} from '../lib/musicThemeEngine.ts';

interface VirtualSynthesizerDeviceProps {
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

const SYNTH_PATCHES = [
  { id: 'supersaw', name: '⚡ Cyber Supersaw Lead', type: 'sawtooth' as OscillatorType, cutoff: 3200, resonance: 6, attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.4 },
  { id: 'bansuri', name: '🪈 Indian Bansuri Flute', type: 'sine' as OscillatorType, cutoff: 1800, resonance: 2, attack: 0.08, decay: 0.3, sustain: 0.7, release: 0.5 },
  { id: 'moog_bass', name: '🔊 Deep Moog 808 Bass', type: 'triangle' as OscillatorType, cutoff: 800, resonance: 8, attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.2 },
  { id: 'rhodes', name: '🎹 Lo-Fi Rhodes EPiano', type: 'triangle' as OscillatorType, cutoff: 2200, resonance: 1, attack: 0.03, decay: 0.4, sustain: 0.5, release: 0.6 },
  { id: 'sitar_pluck', name: '🪕 Vedic Sitar Pluck', type: 'sawtooth' as OscillatorType, cutoff: 4000, resonance: 9, attack: 0.005, decay: 0.35, sustain: 0.1, release: 0.5 },
  { id: 'glass_bell', name: '🔔 432Hz Crystal Bell', type: 'sine' as OscillatorType, cutoff: 5000, resonance: 3, attack: 0.01, decay: 0.8, sustain: 0.2, release: 0.9 },
];

const CHORD_PRESETS = [
  { name: 'C Major', notes: ['C4', 'E4', 'G4'], tag: 'Maj' },
  { name: 'A Minor', notes: ['A3', 'C4', 'E4'], tag: 'Min' },
  { name: 'F Maj7', notes: ['F3', 'A3', 'C4', 'E4'], tag: 'Maj7' },
  { name: 'G Dominant 7', notes: ['G3', 'B3', 'D4', 'F4'], tag: '7th' },
  { name: 'D Min9', notes: ['D3', 'F3', 'A3', 'C4', 'E4'], tag: 'Min9' },
  { name: 'E Sus4', notes: ['E3', 'A3', 'B3'], tag: 'Sus4' },
  { name: 'Raag Yaman', notes: ['C4', 'E4', 'F#4', 'G4', 'B4'], tag: 'Raga' },
  { name: 'Raag Bhairavi', notes: ['C4', 'D#4', 'F4', 'G4', 'A#4'], tag: 'Raga' },
];

// 2-Octave Keyboard Definition
const KEYBOARD_KEYS = [
  { note: 'C3', label: 'C3', keyBind: 'z', isBlack: false },
  { note: 'C#3', label: 'C#', keyBind: 's', isBlack: true },
  { note: 'D3', label: 'D3', keyBind: 'x', isBlack: false },
  { note: 'D#3', label: 'D#', keyBind: 'd', isBlack: true },
  { note: 'E3', label: 'E3', keyBind: 'c', isBlack: false },
  { note: 'F3', label: 'F3', keyBind: 'v', isBlack: false },
  { note: 'F#3', label: 'F#', keyBind: 'g', isBlack: true },
  { note: 'G3', label: 'G3', keyBind: 'b', isBlack: false },
  { note: 'G#3', label: 'G#', keyBind: 'h', isBlack: true },
  { note: 'A3', label: 'A3', keyBind: 'n', isBlack: false },
  { note: 'A#3', label: 'A#', keyBind: 'j', isBlack: true },
  { note: 'B3', label: 'B3', keyBind: 'm', isBlack: false },
  { note: 'C4', label: 'C4', keyBind: 'q', isBlack: false },
  { note: 'C#4', label: 'C#', keyBind: '2', isBlack: true },
  { note: 'D4', label: 'D4', keyBind: 'w', isBlack: false },
  { note: 'D#4', label: 'D#', keyBind: '3', isBlack: true },
  { note: 'E4', label: 'E4', keyBind: 'e', isBlack: false },
  { note: 'F4', label: 'F4', keyBind: 'r', isBlack: false },
  { note: 'F#4', label: 'F#', keyBind: '5', isBlack: true },
  { note: 'G4', label: 'G4', keyBind: 't', isBlack: false },
  { note: 'G#4', label: 'G#', keyBind: '6', isBlack: true },
  { note: 'A4', label: 'A4', keyBind: 'y', isBlack: false },
  { note: 'A#4', label: 'A#', keyBind: '7', isBlack: true },
  { note: 'B4', label: 'B4', keyBind: 'u', isBlack: false },
  { note: 'C5', label: 'C5', keyBind: 'i', isBlack: false },
];

export const VirtualSynthesizerDevice: React.FC<VirtualSynthesizerDeviceProps> = ({ onNotify }) => {
  const [selectedPatch, setSelectedPatch] = useState(SYNTH_PATCHES[0]);
  const [waveform, setWaveform] = useState<OscillatorType>('sawtooth');
  const [attack, setAttack] = useState(0.02);
  const [decay, setDecay] = useState(0.2);
  const [sustain, setSustain] = useState(0.6);
  const [release, setRelease] = useState(0.4);
  const [cutoff, setCutoff] = useState(3200);
  const [resonance, setResonance] = useState(6);
  const [activeNote, setActiveNote] = useState<string | null>(null);

  // Apply Patch
  const applyPatch = (patch: typeof SYNTH_PATCHES[0]) => {
    setSelectedPatch(patch);
    setWaveform(patch.type);
    setAttack(patch.attack);
    setDecay(patch.decay);
    setSustain(patch.sustain);
    setRelease(patch.release);
    setCutoff(patch.cutoff);
    setResonance(patch.resonance);
    onNotify('Synth Patch Loaded', `Loaded "${patch.name}" into virtual engine.`, 'info');
  };

  const handleTriggerNote = (note: string) => {
    const freq = NOTE_FREQUENCIES[note];
    if (freq) {
      setActiveNote(note);
      playSynthNote(freq, waveform, 0.5, {
        attack,
        decay,
        sustain,
        release,
        cutoff,
        resonance,
      });
      setTimeout(() => {
        setActiveNote((prev) => (prev === note ? null : prev));
      }, 300);
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      const keyObj = KEYBOARD_KEYS.find((k) => k.keyBind.toLowerCase() === e.key.toLowerCase());
      if (keyObj) {
        handleTriggerNote(keyObj.note);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [waveform, attack, decay, sustain, release, cutoff, resonance]);

  return (
    <div className="p-5 rounded-3xl bg-slate-900/90 border border-cyan-500/40 shadow-2xl space-y-5">
      {/* Device Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-900/40">
            <Piano className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white font-['Syne'] tracking-wide">
                Analog / FM Virtual Poly-Synthesizer V2
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Web Audio Real-Time
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive 2-octave piano keyboard with live ADSR filter envelopes, waveform routing & chord triggers.
            </p>
          </div>
        </div>

        {/* Patch Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Sound Patch:</span>
          <select
            value={selectedPatch.id}
            onChange={(e) => {
              const p = SYNTH_PATCHES.find((item) => item.id === e.target.value);
              if (p) applyPatch(p);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-cyan-500/40 text-xs font-bold text-cyan-300 focus:outline-none"
          >
            {SYNTH_PATCHES.map((patch) => (
              <option key={patch.id} value={patch.id}>
                {patch.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Control Racks: Oscillators & ADSR Envelope Knobs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Waveform Selector */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" /> Oscillator Waveform
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['sawtooth', 'square', 'sine', 'triangle'] as OscillatorType[]).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWaveform(w)}
                className={`py-2 px-1 rounded-xl text-[10px] font-mono font-bold capitalize transition-all ${
                  waveform === w
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {w === 'sawtooth' ? '🪚 Saw' : w === 'square' ? '⬛ Sqr' : w === 'sine' ? '〰️ Sin' : '🔺 Tri'}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Cutoff & Resonance */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" /> Lowpass Filter Cutoff & Q
          </label>
          <div className="space-y-1.5 text-[10px] font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Cutoff: {cutoff} Hz</span>
              <span>Resonance (Q): {resonance}</span>
            </div>
            <input
              type="range"
              min="200"
              max="6000"
              step="50"
              value={cutoff}
              onChange={(e) => setCutoff(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-500"
            />
            <input
              type="range"
              min="0.5"
              max="15"
              step="0.5"
              value={resonance}
              onChange={(e) => setResonance(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>

        {/* ADSR Envelope */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-purple-400" /> ADSR Amplitude Envelope
          </label>
          <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
            <div>
              <span className="text-slate-400 block mb-1">A ({attack}s)</span>
              <input
                type="range"
                min="0.005"
                max="0.5"
                step="0.005"
                value={attack}
                onChange={(e) => setAttack(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded accent-purple-500"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-1">D ({decay}s)</span>
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.01"
                value={decay}
                onChange={(e) => setDecay(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded accent-purple-500"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-1">S ({Math.round(sustain * 100)}%)</span>
              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.05"
                value={sustain}
                onChange={(e) => setSustain(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded accent-purple-500"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-1">R ({release}s)</span>
              <input
                type="range"
                min="0.05"
                max="1.5"
                step="0.05"
                value={release}
                onChange={(e) => setRelease(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded accent-purple-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chord Matrix Trigger Pads */}
      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Instant Chord Trigger Pads (एक-क्लिक कॉर्ड्स)
          </label>
          <span className="text-[10px] text-slate-400 font-mono">Polyphonic Synthesis</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {CHORD_PRESETS.map((chord) => (
            <button
              key={chord.name}
              type="button"
              onClick={() => playChord(chord.notes, waveform, 0.8)}
              className="py-2.5 px-2 rounded-xl bg-slate-900 hover:bg-gradient-to-r hover:from-cyan-900 hover:to-indigo-900 border border-slate-800 hover:border-cyan-500 text-left transition-all group active:scale-95"
            >
              <div className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                {chord.name}
              </div>
              <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 font-mono">
                {chord.tag}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2-Octave Visual Piano Keyboard (Interactive) */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Piano className="w-3.5 h-3.5 text-cyan-400" /> Interactive Piano Keyboard (Click or use QWERTY Keys)
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Keys: Z-M (Octave 3), Q-I (Octave 4)</span>
        </div>

        <div className="relative h-44 w-full flex overflow-x-auto pb-2 select-none">
          {KEYBOARD_KEYS.map((k) => {
            const isActive = activeNote === k.note;
            if (!k.isBlack) {
              return (
                <button
                  key={k.note}
                  type="button"
                  onMouseDown={() => handleTriggerNote(k.note)}
                  className={`flex-1 min-w-[34px] h-40 rounded-b-lg border border-slate-400/30 flex flex-col justify-end items-center pb-2 text-[10px] font-mono font-bold transition-all relative z-0 ${
                    isActive
                      ? 'bg-gradient-to-b from-cyan-300 to-cyan-500 text-slate-950 shadow-inner'
                      : 'bg-white hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <span className="text-[9px] text-slate-400 mb-0.5">[{k.keyBind.toUpperCase()}]</span>
                  <span>{k.label}</span>
                </button>
              );
            } else {
              return (
                <button
                  key={k.note}
                  type="button"
                  onMouseDown={() => handleTriggerNote(k.note)}
                  className={`w-6 h-24 -mx-3 rounded-b-md border border-slate-900 flex flex-col justify-end items-center pb-1 text-[9px] font-mono font-bold transition-all relative z-10 shadow-lg ${
                    isActive
                      ? 'bg-cyan-400 text-slate-950 ring-2 ring-cyan-300'
                      : 'bg-slate-900 hover:bg-slate-800 text-cyan-300'
                  }`}
                >
                  <span className="text-[8px] opacity-70">[{k.keyBind.toUpperCase()}]</span>
                  <span>{k.label}</span>
                </button>
              );
            }
          })}
        </div>
      </div>
    </div>
  );
};

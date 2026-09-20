import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Upload,
  Play,
  Pause,
  Volume2,
  Sliders,
  Sparkles,
  Download,
  RotateCcw,
  Check,
  Disc,
  Radio,
  Zap,
  Layers,
  Crown,
} from 'lucide-react';
import { triggerVoiceConvert } from '../lib/api.ts';
import { UserProfile } from '../types.ts';

interface VoiceConverterProps {
  user?: UserProfile;
  tokenBalance: number;
  openPaymentModal?: () => void;
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

interface VoiceProfile {
  id: string;
  name: string;
  category: string;
  gender: string;
  description: string;
  avatar: string;
  pitchOffset: number;
  formantOffset: number;
}

const VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'hollywood_trailer',
    name: 'Hollywood Movie Trailer',
    category: 'Cinematic Epic',
    gender: 'Male (Deep Bass)',
    description: 'Ultra-deep resonant cinema trailer voice with sub-bass punch and dramatic weight.',
    avatar: '🎬',
    pitchOffset: -6,
    formantOffset: 85,
  },
  {
    id: 'scarlett_narrator',
    name: 'Scarlett Cinematic Narrator',
    category: 'Cinematic Drama',
    gender: 'Female (Warm Alto)',
    description: 'Captivating, soulful, low-warmth female alto voice ideal for emotional cinema and audiobooks.',
    avatar: '🌟',
    pitchOffset: 3,
    formantOffset: 55,
  },
  {
    id: 'morgan_narrator',
    name: 'Morgan Gravitas Narrator',
    category: 'Documentary',
    gender: 'Male (Warm Baritone)',
    description: 'Warm, wise, empathetic cadence perfect for philosophical narration and documentaries.',
    avatar: '🎙️',
    pitchOffset: -4,
    formantOffset: 70,
  },
  {
    id: 'elena_ai_assistant',
    name: 'Elena Neural Assistant',
    category: 'Sci-Fi AI',
    gender: 'Female (Clear Soprano)',
    description: 'Crystal-clear, futuristic AI assistant voice with silky articulation and high-end air.',
    avatar: '🤖',
    pitchOffset: 6,
    formantOffset: 40,
  },
  {
    id: 'anime_protagonist',
    name: 'Anime Shonen Protagonist',
    category: 'Anime / Gaming',
    gender: 'Male (High-Energy Youth)',
    description: 'Crisp, high-velocity emotional delivery suited for anime and gaming voiceovers.',
    avatar: '⚡',
    pitchOffset: 5,
    formantOffset: 45,
  },
  {
    id: 'aria_pop_diva',
    name: 'Aria Melodic Vocalist',
    category: 'Music / Studio',
    gender: 'Female (Melodic Soprano)',
    description: 'Lush, breathy vocal texture with studio compression and harmonic warmth.',
    avatar: '🎶',
    pitchOffset: 4,
    formantOffset: 50,
  },
  {
    id: 'bbc_documentary',
    name: 'BBC British Naturalist',
    category: 'Documentary Host',
    gender: 'Male (British RP)',
    description: 'Refined, cultured, whispering proximity effect ideal for nature and scientific series.',
    avatar: '📻',
    pitchOffset: -1,
    formantOffset: 65,
  },
  {
    id: 'sophia_royal_broadcast',
    name: 'Sophia Royal Broadcast',
    category: 'Broadcast Radio',
    gender: 'Female (Elegant British)',
    description: 'Poised, articulate, authoritative British female broadcast voice with pristine clarity.',
    avatar: '👑',
    pitchOffset: 2,
    formantOffset: 60,
  },
];

export const VoiceConverter: React.FC<VoiceConverterProps> = ({
  user,
  tokenBalance,
  openPaymentModal,
  onNotify,
}) => {
  // Source Voice Input mode: 'mic' or 'upload'
  const [inputMode, setInputMode] = useState<'mic' | 'upload'>('mic');

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [hasSourceAudio, setHasSourceAudio] = useState(true); // default demo audio ready
  const [sourceAudioName, setSourceAudioName] = useState('human_voice_sample_48khz.wav');
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);

  const [customProfiles, setCustomProfiles] = useState<VoiceProfile[]>([
    {
      id: 'custom_user_1',
      name: 'Custom AI Voice Studio',
      category: 'User Custom',
      gender: 'Custom Blend',
      description: 'Your personalized custom AI voice profile with calibrated pitch and formant parameters.',
      avatar: '🎙️',
      pitchOffset: 2,
      formantOffset: 75,
    }
  ]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newVoiceName, setNewVoiceName] = useState('');
  const [newVoiceGender, setNewVoiceGender] = useState('Male / Female Custom');
  const [newVoiceDesc, setNewVoiceDesc] = useState('');
  const [newVoiceAvatar, setNewVoiceAvatar] = useState('🎙️');
  const [newPitch, setNewPitch] = useState(0);
  const [newFormant, setNewFormant] = useState(50);

  const allProfiles = [...VOICE_PROFILES, ...customProfiles];

  // Selected Voice Profile & Voice Parameters
  const [selectedProfileId, setSelectedProfileId] = useState(allProfiles[0].id);
  const [pitchShift, setPitchShift] = useState<number>(allProfiles[0].pitchOffset);
  const [formantStrength, setFormantStrength] = useState<number>(allProfiles[0].formantOffset);
  const [neuralDenoise, setNeuralDenoise] = useState(true);
  const [studioReverb, setStudioReverb] = useState(true);
  const [sampleRate, setSampleRate] = useState('48 kHz (Studio Master)');

  // Conversion & Output State
  const [isConverting, setIsConverting] = useState(false);
  const [isConverted, setIsConverted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(35);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const selectedVoice = allProfiles.find((v) => v.id === selectedProfileId) || allProfiles[0];

  const handleCreateCustomVoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVoiceName.trim()) {
      onNotify('Name Required', 'Please enter a name for your custom AI voice.', 'warning');
      return;
    }
    const id = 'custom_' + Date.now();
    const newProfile: VoiceProfile = {
      id,
      name: newVoiceName.trim(),
      category: 'User Custom',
      gender: newVoiceGender,
      description: newVoiceDesc.trim() || 'Custom generated neural AI voice model.',
      avatar: newVoiceAvatar,
      pitchOffset: newPitch,
      formantOffset: newFormant,
    };
    setCustomProfiles((prev) => [newProfile, ...prev]);
    setSelectedProfileId(id);
    setPitchShift(newPitch);
    setFormantStrength(newFormant);
    setIsCreateModalOpen(false);
    setNewVoiceName('');
    setNewVoiceDesc('');
    onNotify('Custom Voice Created!', `"${newProfile.name}" has been successfully added to your voice studio.`, 'success');
  };

  // Draw Audio Waveform on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const renderWave = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Background subtle grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      const bars = 48;
      const barWidth = width / bars - 2;

      for (let i = 0; i < bars; i++) {
        let barHeight = 6;
        if (isRecording) {
          barHeight = 10 + Math.sin(phase + i * 0.4) * 28 + Math.random() * 20;
        } else if (isPlaying) {
          barHeight = 12 + Math.abs(Math.sin(phase + i * 0.25) * 35) + (i % 3) * 6;
        } else if (isConverted) {
          // Resting waveform
          const mid = bars / 2;
          const dist = Math.abs(i - mid) / mid;
          barHeight = (1 - dist) * 28 + Math.sin(i * 0.8) * 6;
        }

        const x = i * (barWidth + 2);
        const y = (height - barHeight) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isRecording) {
          grad.addColorStop(0, '#ef4444');
          grad.addColorStop(1, '#f97316');
        } else if (isPlaying) {
          grad.addColorStop(0, '#06b6d4');
          grad.addColorStop(1, '#6366f1');
        } else {
          grad.addColorStop(0, '#64748b');
          grad.addColorStop(1, '#334155');
        }

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, Math.max(4, barHeight));
      }

      phase += 0.15;
      animationFrameRef.current = requestAnimationFrame(renderWave);
    };

    renderWave();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRecording, isPlaying, isConverted]);

  // Handle Voice Profile Selection
  const handleSelectProfile = (p: VoiceProfile) => {
    setSelectedProfileId(p.id);
    setPitchShift(p.pitchOffset);
    setFormantStrength(p.formantOffset);
  };

  // Start / Stop Microphone Recording
  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setHasSourceAudio(true);
      setSourceAudioName(`mic_recording_${recordDuration}s.wav`);
      onNotify('Voice Captured', `Microphone recorded ${recordDuration}s human voice sample!`, 'success');
    } else {
      // Start recording
      setIsRecording(true);
      setRecordDuration(0);
      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
      onNotify('Recording Started', 'Speak clearly into your microphone...', 'info');
    }
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedAudioUrl(url);
      setHasSourceAudio(true);
      setSourceAudioName(file.name);
      onNotify('Audio File Uploaded', `Source file "${file.name}" loaded successfully. Ready for AI voice conversion.`, 'success');
    }
  };

  // Handle AI Conversion Trigger
  const handleConvertVoice = async () => {
    if (!hasSourceAudio) {
      onNotify('Source Audio Missing', 'Please record your voice or upload an audio file first.', 'warning');
      return;
    }

    try {
      setIsConverting(true);
      const res = await triggerVoiceConvert({
        targetVoice: selectedVoice.name,
        pitchShift,
        formantStrength,
        denoise: neuralDenoise,
        audioDurationSeconds: recordDuration || 14,
        userId: user?.id,
      });

      setIsConverted(true);
      onNotify(
        'Voice Conversion Complete',
        `Human speech morphed into ${selectedVoice.name} with pitch shift: ${pitchShift > 0 ? '+' : ''}${pitchShift} semitones.`,
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Voice conversion failed';
      onNotify('Conversion Error', msg, 'error');
    } finally {
      setIsConverting(false);
    }
  };

  // Web Audio Synth Playback simulation
  const togglePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      // Play brief audible confirmation sound through Web Audio API
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        // Pitch shift mapped to frequency: Base 220Hz
        const freq = 220 * Math.pow(2, pitchShift / 12);
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.5);
      } catch (e) {
        // AudioContext disabled in background
      }

      // Auto stop after 5s
      setTimeout(() => {
        setIsPlaying(false);
      }, 5000);
    }
  };

  // Download Converted Audio
  const handleDownloadAudio = () => {
    const fakeAudioData = 'RIFF....WAVEfmt ....data....iCALLOG_CONVERTED_VOICE_48KHZ';
    const blob = new Blob([fakeAudioData], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedVoice.id}_ai_converted_voice.wav`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('Downloaded', `${selectedVoice.name} audio master downloaded (.wav).`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-['Syne'] tracking-wide">
              Human to AI Voice Converter
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Live Human Voice Morphing, Deep Neural Formant Cloning, Morgan Freeman, Hollywood Trailer, & Cyber AI Models.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 font-bold">
            <Zap className="w-3.5 h-3.5 text-cyan-400" /> 48kHz Neural Resampler
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Human Voice Input & Audio Controls */}
        <div className="lg:col-span-5 space-y-4">
          {/* Input Box: Mic vs Upload */}
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-mono tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" /> 1. Human Voice Input
              </span>

              {/* Toggle Mic / Upload */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setInputMode('mic')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    inputMode === 'mic' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Microphone
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    inputMode === 'upload' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Upload File
                </button>
              </div>
            </div>

            {/* Mic Recording Area */}
            {inputMode === 'mic' ? (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                      isRecording
                        ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse shadow-red-900/50'
                        : 'bg-gradient-to-tr from-cyan-600 to-indigo-600 hover:scale-105 text-white shadow-cyan-900/40'
                    }`}
                  >
                    {isRecording ? <Square className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>
                </div>

                <div className="text-xs font-mono text-slate-300">
                  {isRecording ? (
                    <span className="text-red-400 font-bold animate-pulse">
                      Recording: 00:{recordDuration < 10 ? `0${recordDuration}` : recordDuration}
                    </span>
                  ) : hasSourceAudio ? (
                    <span className="text-emerald-400 flex items-center justify-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Source Audio Ready ({sourceAudioName})
                    </span>
                  ) : (
                    <span className="text-slate-500">Tap microphone to record your voice</span>
                  )}
                </div>
              </div>
            ) : (
              /* File Upload Area */
              <div className="p-4 rounded-2xl bg-slate-950 border border-dashed border-slate-800 hover:border-cyan-500/50 text-center space-y-2 transition-colors">
                <Upload className="w-8 h-8 text-cyan-400 mx-auto" />
                <div className="text-xs text-slate-300 font-semibold">Drop vocal audio or browse</div>
                <p className="text-[10px] text-slate-500">WAV, MP3, M4A, OGG supported (Up to 50MB)</p>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="vocal-file-input"
                />
                <label
                  htmlFor="vocal-file-input"
                  className="inline-block px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-cyan-300 cursor-pointer font-semibold"
                >
                  Choose File
                </label>
              </div>
            )}

            {/* Neural Conversion Parameters */}
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">Pitch Shift (Semitones)</span>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {pitchShift > 0 ? `+${pitchShift}` : pitchShift} st
                </span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={pitchShift}
                onChange={(e) => setPitchShift(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-slate-200">Formant Morphing & Resonance</span>
                <span className="text-xs font-mono font-bold text-indigo-400">{formantStrength}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={formantStrength}
                onChange={(e) => setFormantStrength(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNeuralDenoise(!neuralDenoise)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                    neuralDenoise
                      ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  <span>AI Denoise</span>
                  <span className="text-[10px] font-mono">{neuralDenoise ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStudioReverb(!studioReverb)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                    studioReverb
                      ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  <span>Studio Space</span>
                  <span className="text-[10px] font-mono">{studioReverb ? 'ON' : 'OFF'}</span>
                </button>
              </div>

              {/* Convert Button */}
              <button
                type="button"
                onClick={handleConvertVoice}
                disabled={isConverting}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-cyan-700 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold font-['Syne'] text-xs shadow-lg shadow-cyan-900/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
              >
                {isConverting ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
                    Morphing Human Voice...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    Morph into {selectedVoice.name}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Target Voice Selector & Waveform Studio */}
        <div className="lg:col-span-7 space-y-4">
          {/* Target Voice Models Grid */}
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-mono tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                <Disc className="w-3.5 h-3.5" /> 2. Target AI Voice Model ({allProfiles.length})
              </span>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/30 flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" /> + Create Custom Voice
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {allProfiles.map((profile) => {
                const isSelected = selectedProfileId === profile.id;
                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => handleSelectProfile(profile)}
                    className={`p-3 rounded-2xl border text-left transition-all relative ${
                      isSelected
                        ? 'bg-gradient-to-br from-indigo-950/80 to-slate-950 border-cyan-400 shadow-md shadow-cyan-950'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="text-2xl">{profile.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white truncate font-['Syne']">
                            {profile.name}
                          </h4>
                          {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                        </div>
                        <span className="text-[10px] font-mono text-cyan-400 block mb-0.5">
                          {profile.gender}
                        </span>
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                          {profile.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-time Audio Spectrum & Output Master Player */}
          <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  AI Master Audio Spectrum (48kHz 320kbps)
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Target: <strong className="text-cyan-300">{selectedVoice.name}</strong>
              </span>
            </div>

            {/* Canvas Waveform Visualizer */}
            <div className="relative rounded-2xl bg-[#080d16] border border-slate-800 p-3 h-28 flex items-center justify-center overflow-hidden">
              <canvas ref={canvasRef} width={500} height={100} className="w-full h-full" />
            </div>

            {/* Audio Master Control Bar */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="w-11 h-11 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-900/30 transition-transform active:scale-95"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-slate-950" /> : <Play className="w-5 h-5 fill-slate-950 ml-0.5" />}
                </button>
                <div>
                  <div className="text-xs font-bold text-white font-['Syne']">
                    {selectedVoice.name} Output Preview
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    Pitch: {pitchShift > 0 ? `+${pitchShift}` : pitchShift}st • Formant: {formantStrength}% • AI Denoise Active
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadAudio}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download .WAV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Custom Voice Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white font-['Syne'] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" /> Create Custom Neural AI Voice
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomVoice} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Voice Name</label>
                <input
                  type="text"
                  placeholder="e.g. Cinematic Hero V2"
                  value={newVoiceName}
                  onChange={(e) => setNewVoiceName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Gender / Tone</label>
                  <select
                    value={newVoiceGender}
                    onChange={(e) => setNewVoiceGender(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Male Custom">Male Custom</option>
                    <option value="Female Custom">Female Custom</option>
                    <option value="Synthetic AI">Synthetic AI</option>
                    <option value="Neutral Blend">Neutral Blend</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Emoji Avatar</label>
                  <select
                    value={newVoiceAvatar}
                    onChange={(e) => setNewVoiceAvatar(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="🎙️">🎙️ Studio Mic</option>
                    <option value="🌟">🌟 Star</option>
                    <option value="🤖">🤖 Android</option>
                    <option value="⚡">⚡ Lightning</option>
                    <option value="👑">👑 Crown</option>
                    <option value="🎧">🎧 Headphones</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Deep rich vocal tone with cinematic warmth"
                  value={newVoiceDesc}
                  onChange={(e) => setNewVoiceDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Initial Pitch: {newPitch > 0 ? `+${newPitch}` : newPitch}st</label>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    value={newPitch}
                    onChange={(e) => setNewPitch(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Formant: {newFormant}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={newFormant}
                    onChange={(e) => setNewFormant(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg"
                >
                  Create Voice Model
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

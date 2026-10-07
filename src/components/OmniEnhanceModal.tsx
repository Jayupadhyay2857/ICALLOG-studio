import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Copy,
  Check,
  Image as ImageIcon,
  Video as VideoIcon,
  Music,
  FileText,
  Box,
  Mic,
  Film,
  Layers,
  ArrowRight,
  Play,
  Download,
  Wand2,
  Sliders,
  Volume2,
  Square,
  Zap,
  Cpu,
  Globe2,
  Compass,
  CheckCircle2,
  Activity,
  Terminal,
} from 'lucide-react';
import * as THREE from 'three';
import {
  enhancePrompt,
  triggerImageGen,
  triggerVideoGen,
  generateAiDocument,
  generateAiSongLyrics,
  orchestrateMasterAi,
  MasterAiResponse,
} from '../lib/api.ts';
import { ActiveTab, UserProfile } from '../types.ts';
import { safeDownloadMedia } from '../lib/downloadHelper.ts';

interface OmniEnhanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile;
  onNavigateToStudio: (tab: ActiveTab, prefillPrompt?: string) => void;
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export type ModalModality =
  | 'auto'
  | 'image'
  | 'video'
  | 'image_to_video'
  | 'image_to_image'
  | 'video_to_image'
  | 'video_to_video'
  | 'music'
  | 'document'
  | '3d'
  | 'voice'
  | 'film'
  | 'all';

export type AiPersonalityMode =
  | 'omni_fusion'
  | 'visual_artist'
  | 'cinema_director'
  | 'storyteller'
  | 'voice_audio'
  | 'game_3d'
  | 'office_strategy';

interface ModalityOption {
  id: ModalModality;
  label: string;
  shortLabel: string;
  icon: string;
  badge: string;
  targetStudio: ActiveTab;
  placeholder: string;
  quickExamples: string[];
  description: string;
}

const MODALITY_OPTIONS: ModalityOption[] = [
  {
    id: 'auto',
    label: '⚡ Master Multi-AI Fusion (Auto-Orchestrate All)',
    shortLabel: '⚡ Omni-Fusion',
    icon: '⚡',
    badge: '🧠 Merged Gemini + Multi-AI Engine',
    targetStudio: 'image_studio',
    placeholder: 'Type anything (e.g. Motu Patlu in futuristic Mumbai, Iron Man vs Thanos in 8K, Anime music video, Shiva 3D)...',
    quickExamples: [
      'Motu Patlu futuristic 3D comedy adventure in Furfuri Nagar 2050',
      'Spider-Man swinging through Cyberpunk Neo Tokyo in rainy 8K',
      'Ancient Lord Shiva Mahadev meditating on Mount Kailash with celestial aura',
      'Goku powering up Ultra Instinct against Jiren with electric volumetric aura',
      'High-energy Bollywood EDM Punjabi rap track with 130 bpm heavy 808 bass',
    ],
    description: 'Automatically parses your prompt, detects world characters/mythology, and generates synchronized Image, Video, Dialogue, Audio & 3D instructions.',
  },
  {
    id: 'image',
    label: '🖼️ 8K Photoreal Visual Studio',
    shortLabel: 'Image 8K',
    icon: '🖼️',
    badge: 'Text → 8K Photoreal Visual',
    targetStudio: 'image_studio',
    placeholder: 'e.g. Motu Patlu, Batman, Lord Shiva, Naruto, Lamborghini, Cyberpunk City...',
    quickExamples: [
      'Batman standing on Gotham skyscraper gargoyle in pouring rain, cinematic 8K',
      'Lord Shiva meditating in Himalayan snow with glowing third eye and crescent moon',
      'Motu Patlu enjoying hot samosas in Furfuri Nagar market, Pixar 3D animated style',
    ],
    description: 'Synthesizes 8K photorealistic prompts with 35mm f/1.4 lenses, volumetric rim lighting, and Unreal Engine 5 details.',
  },
  {
    id: 'video',
    label: '🎬 60fps Cinema & Video Suite',
    shortLabel: 'Video 60fps',
    icon: '🎬',
    badge: 'Text → 60fps Cinema Motion',
    targetStudio: 'video_audio',
    placeholder: 'e.g. FPV drone flying through mountain canyon at sunset at 60fps...',
    quickExamples: [
      'Iron Man suit up sequence in holographic Tony Stark lab with particle sparks',
      'Anime ninja combat sword clash with slow-motion dynamic camera tracking',
      'Hypercar drifting around tight mountain bend with tire smoke simulation',
    ],
    description: 'Generates cinematic camera trajectories (Dolly, Crane, 360 Orbit) and 60fps motion physics.',
  },
  {
    id: 'film',
    label: '🎭 Hollywood Screenplay & Dialogue',
    shortLabel: 'Film & Dialogue',
    icon: '🎭',
    badge: 'Screenplay & Direction',
    targetStudio: 'film_studio',
    placeholder: 'e.g. intense confrontation dialogue between two master detectives...',
    quickExamples: [
      'Interrogation room standoff: Detective confronts undercover kingpin',
      'Epic battle speech before charging into final alien invasion stronghold',
      'Emotional farewell on misty train platform in Hindi and English mix',
    ],
    description: 'Formats industry-standard screenplays with sluglines, character emotional beats, and bilingual dialogue.',
  },
  {
    id: 'music',
    label: '🎵 Music Composition & Beats',
    shortLabel: 'Music & Beats',
    icon: '🎵',
    badge: 'Lyrics & 808 Arrangement',
    targetStudio: 'song_studio',
    placeholder: 'e.g. Punjabi drill track with heavy bass, or Bollywood romantic melody...',
    quickExamples: [
      'High-energy gym workout anthem with heavy 808 drop and aggressive brass',
      'Soothing acoustic lo-fi indie love song with rain sounds and warm Rhodes piano',
      'Epic orchestral battle theme with thunderous taiko drums and choir chanting',
    ],
    description: 'Composes radio-ready lyrics, musical key, BPM, and multi-instrument arrangement stems.',
  },
  {
    id: '3d',
    label: '🕹️ 3D WebGL Mesh & Auto-Rigging',
    shortLabel: '3D & Rigging',
    icon: '🕹️',
    badge: '3D Geometry & Bones',
    targetStudio: 'holo_sculpt_3d',
    placeholder: 'e.g. futuristic mecha robot with articulated joints and glowing visor...',
    quickExamples: [
      'Cyberpunk biped humanoid armor with 54-bone skeletal rig and PBR metallic textures',
      'Ancient carved stone dragon statue with displacement maps and high-poly topology',
      'Sci-fi hovercraft vehicle with glowing engine thrusters and quad mesh topology',
    ],
    description: 'Creates 3D mesh topology specifications, bone counts, and Unreal Engine 5 PBR materials.',
  },
  {
    id: 'document',
    label: '📄 Executive Office Docs & Strategy',
    shortLabel: 'Office Docs',
    icon: '📄',
    badge: 'Office Document Suite',
    targetStudio: 'office_suite',
    placeholder: 'e.g. business proposal for AI creative studio with 5-year financial plan...',
    quickExamples: [
      'Comprehensive Creative Studio Business Strategy and 5-Year Scaling Roadmap',
      '10-Slide Investor Pitch Deck for Multi-Modal AI Generator Platform',
      'Mutual Non-Disclosure Agreement (NDA) and Intellectual Property Agreement',
    ],
    description: 'Generates executive summaries, strategy roadmaps, slide deck outlines, and financial models.',
  },
];

export const OmniEnhanceModal: React.FC<OmniEnhanceModalProps> = ({
  isOpen,
  onClose,
  user,
  onNavigateToStudio,
  onNotify,
}) => {
  const [selectedModality, setSelectedModality] = useState<ModalModality>('auto');
  const [inputPrompt, setInputPrompt] = useState('');
  const [aiMode, setAiMode] = useState<AiPersonalityMode>('omni_fusion');
  const [languageTone, setLanguageTone] = useState<'auto' | 'hinglish' | 'hindi' | 'english' | 'multilingual'>('auto');
  const [creativityLevel, setCreativityLevel] = useState<number>(0.85);
  const [autoExecuteOnEnhance, setAutoExecuteOnEnhance] = useState<boolean>(true);

  // Master AI Orchestration State
  const [masterResult, setMasterResult] = useState<MasterAiResponse | null>(null);
  const [activeOutputTab, setActiveOutputTab] = useState<'synthesis' | 'image' | 'video' | 'script' | 'music' | '3d' | 'strategy'>('synthesis');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Generated Media Previews
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [isSynthesizingAudio, setIsSynthesizingAudio] = useState(false);
  const [isSpeakingVoice, setIsSpeakingVoice] = useState(false);
  const [is3DActive, setIs3DActive] = useState(false);
  const [isWireframe3D, setIsWireframe3D] = useState(false);

  // 3D Canvas Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthTimerRef = useRef<any>(null);
  const threeCanvasRef = useRef<HTMLDivElement>(null);
  const threeRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const threeAnimIdRef = useRef<number | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  // Stop Audio
  const stopAudio = () => {
    if (synthTimerRef.current) {
      clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsSynthesizingAudio(false);
  };

  // Play Real Web Audio Synth Melodic Arpeggio
  const playSynthAudio = (bpm = 124) => {
    stopAudio();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      setIsSynthesizingAudio(true);

      const notes = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 349.23, 440.0, 523.25];
      let step = 0;
      const intervalMs = (60 / bpm / 2) * 1000;

      const playNote = (freq: number) => {
        if (!ctx || ctx.state === 'closed') return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, ctx.currentTime);

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      };

      synthTimerRef.current = setInterval(() => {
        playNote(notes[step % notes.length]);
        step++;
      }, intervalMs);
    } catch (e) {
      console.warn('Audio synthesis init failed:', e);
      setIsSynthesizingAudio(false);
    }
  };

  // Voice narration speech
  const handleToggleVoice = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeakingVoice) {
        window.speechSynthesis.cancel();
        setIsSpeakingVoice(false);
      } else {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text.slice(0, 350));
        u.rate = 1.0;
        u.pitch = 1.0;
        u.onend = () => setIsSpeakingVoice(false);
        u.onerror = () => setIsSpeakingVoice(false);
        window.speechSynthesis.speak(u);
        setIsSpeakingVoice(true);
      }
    } else {
      onNotify('Notice', 'Speech synthesis is not supported in this browser.', 'info');
    }
  };

  // 3D Canvas initialization
  useEffect(() => {
    if (!is3DActive || !threeCanvasRef.current) return;
    const container = threeCanvasRef.current;
    const width = container.clientWidth || 400;
    const height = 220;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040714);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.5, 3.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    threeRendererRef.current = renderer;

    const grid = new THREE.GridHelper(8, 16, 0x06b6d4, 0x1e293b);
    grid.position.y = -0.8;
    scene.add(grid);

    const geometry = new THREE.TorusKnotGeometry(0.7, 0.22, 100, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      wireframe: isWireframe3D,
      roughness: 0.25,
      metalness: 0.85,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0.2;
    scene.add(mesh);
    meshRef.current = mesh;

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0x38bdf8, 2);
    dirLight.position.set(3, 4, 3);
    scene.add(dirLight);

    let isDragging = false;
    let prevX = 0;
    let prevY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      mesh.rotation.y += dx * 0.01;
      mesh.rotation.x += dy * 0.01;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onMouseUp = () => { isDragging = false; };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    const animate = () => {
      threeAnimIdRef.current = requestAnimationFrame(animate);
      if (!isDragging) {
        mesh.rotation.y += 0.01;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (threeAnimIdRef.current) cancelAnimationFrame(threeAnimIdRef.current);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [is3DActive, isWireframe3D]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isOpen) return null;

  const currentModalityConfig =
    MODALITY_OPTIONS.find((m) => m.id === selectedModality) || MODALITY_OPTIONS[0];

  // Master AI Orchestrator Execution
  const handleOrchestrateMasterAi = async (overridePrompt?: string) => {
    const promptToUse = (overridePrompt || inputPrompt).trim();
    if (!promptToUse) {
      onNotify('Notice', 'Please type a rough prompt, character name, or creative idea first!', 'warning');
      return;
    }

    try {
      setIsProcessing(true);
      stopAudio();
      setPreviewImageUrl(null);
      setPreviewVideoUrl(null);
      setIs3DActive(false);

      const res = await orchestrateMasterAi({
        prompt: promptToUse,
        aiMode,
        language: languageTone,
        creativityLevel,
        targetStudio: currentModalityConfig.targetStudio,
        autoExecute: autoExecuteOnEnhance,
      });

      setMasterResult(res);

      // Auto-trigger instant visual rendering
      if (autoExecuteOnEnhance) {
        triggerImageGen({
          prompt: res.masterEnhancedPrompt,
          style: res.detectedUniverse || 'Cinematic 8K',
          resolution: '8K',
          aspectRatio: (res.cinematicDirectives?.aspectRatio as any) || '16:9',
        }).then((imgRes) => {
          if (imgRes?.assetUrl) {
            setPreviewImageUrl(imgRes.assetUrl);
          }
        }).catch(console.warn);
      }

      onNotify(
        '⚡ Omni-AI Master Brain Synchronized!',
        `Merged Gemini + Neural Engines: Classified for ${res.recommendedStudio} with 8K visual, video, audio & 3D specs!`,
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Master AI Orchestration failed';
      onNotify('Notice', msg, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    onNotify('Copied!', 'Content copied to clipboard.', 'success');
  };

  const handleLaunchInStudio = (targetStudio: string, prefillPrompt: string) => {
    onNavigateToStudio(targetStudio as ActiveTab, prefillPrompt);
    onNotify('Studio Initialized', `Loaded Master AI prompt into ${targetStudio} Studio!`, 'info');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[94vh] flex flex-col rounded-3xl bg-[#070b16] border border-cyan-500/40 shadow-2xl shadow-cyan-950/70 overflow-hidden font-sans">
        
        {/* Top Master AI Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-indigo-950/70 to-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-cyan-950/60 ring-2 ring-cyan-400/40">
              <Zap className="w-6 h-6 animate-pulse fill-current text-amber-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white font-['Syne'] tracking-wide">
                  iCALLOG Omni-AI Master Brain — All-in-One Merged AI
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Gemini 3.8 + Neural Consensus
                </span>
              </div>
              <p className="text-xs text-slate-400">
                World ke sabhi AI tools (Gemini, Flux, Whisper Audio, 60fps Director, 3D Engine & Character Lore) ka merged super-AI jo aapke mutabiq chale!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* Active Merged Multi-AI Cluster Status Bar */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Active Merged AI Engines Cluster (सभी AI टूल्स एक साथ)
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                ● 100% Free & Zero-Stall Active
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-[10px] font-mono">
              <div className="p-2 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex items-center gap-1.5 text-slate-300">
                <span className="text-cyan-400">🧠</span>
                <div className="truncate">
                  <div className="text-white font-bold">Gemini 3.8</div>
                  <div className="text-[9px] text-slate-400">Deep Reasoning</div>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/80 border border-purple-500/30 flex items-center gap-1.5 text-slate-300">
                <span className="text-purple-400">🎨</span>
                <div className="truncate">
                  <div className="text-white font-bold">Flux 1.1</div>
                  <div className="text-[9px] text-slate-400">8K Photoreal</div>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex items-center gap-1.5 text-slate-300">
                <span className="text-emerald-400">⚡</span>
                <div className="truncate">
                  <div className="text-white font-bold">Pollinations</div>
                  <div className="text-[9px] text-slate-400">Zero-Stall Node</div>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/80 border border-amber-500/30 flex items-center gap-1.5 text-slate-300">
                <span className="text-amber-400">🎬</span>
                <div className="truncate">
                  <div className="text-white font-bold">60fps Director</div>
                  <div className="text-[9px] text-slate-400">Spatial Camera</div>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/80 border border-rose-500/30 flex items-center gap-1.5 text-slate-300">
                <span className="text-rose-400">🎙️</span>
                <div className="truncate">
                  <div className="text-white font-bold">Audio Synth</div>
                  <div className="text-[9px] text-slate-400">Voice & Beats</div>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/80 border border-indigo-500/30 flex items-center gap-1.5 text-slate-300">
                <span className="text-indigo-400">🌍</span>
                <div className="truncate">
                  <div className="text-white font-bold">Lore Matrix</div>
                  <div className="text-[9px] text-slate-400">All Characters</div>
                </div>
              </div>
            </div>
          </div>

          {/* User Persona & Behavior Tuning Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            {/* AI Persona Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 font-mono block mb-1">
                AI Behavior Mode (AI का मिज़ाज):
              </label>
              <select
                value={aiMode}
                onChange={(e) => setAiMode(e.target.value as AiPersonalityMode)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-cyan-300 font-semibold focus:outline-none focus:border-cyan-500"
              >
                <option value="omni_fusion">⚡ Omni-Fusion Master (Auto-All)</option>
                <option value="visual_artist">🎨 8K Visual Artist (Photoreal)</option>
                <option value="cinema_director">🎬 Hollywood Cinema Director</option>
                <option value="storyteller">✍️ Master Storyteller & Dialogue</option>
                <option value="voice_audio">🎙️ Voice & Audio Music Producer</option>
                <option value="game_3d">🕹️ 3D Game Sculptor & Rigging</option>
                <option value="office_strategy">💼 Business & Strategy Executive</option>
              </select>
            </div>

            {/* Language Tone */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 font-mono block mb-1">
                Language Tone (भाषा):
              </label>
              <select
                value={languageTone}
                onChange={(e) => setLanguageTone(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-semibold focus:outline-none focus:border-cyan-500"
              >
                <option value="auto">🌐 Auto-Detect (Hindi / Hinglish / English)</option>
                <option value="hinglish">🇮🇳 Hinglish (Desi + Modern Mix)</option>
                <option value="hindi">🇮🇳 Hindi (शुद्ध हिंदी)</option>
                <option value="english">🇺🇸 English (Hollywood Master)</option>
                <option value="multilingual">🌍 Multilingual Global</option>
              </select>
            </div>

            {/* Auto Execute Switch */}
            <div className="flex flex-col justify-center">
              <label className="text-[11px] font-bold text-slate-300 font-mono block mb-1">
                Auto-Execution Engine:
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAutoExecuteOnEnhance(!autoExecuteOnEnhance)}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                    autoExecuteOnEnhance
                      ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white border-emerald-400/50 shadow-md'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <Zap className={`w-3.5 h-3.5 ${autoExecuteOnEnhance ? 'fill-current text-amber-300' : ''}`} />
                  <span>{autoExecuteOnEnhance ? '⚡ Auto-Render ON' : 'Manual Preview'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* User Input Prompt Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 font-mono flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Enter Any Prompt, Character, or Concept (कुछ भी लिखें):</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                Motu Patlu, Shiva, Iron Man, Anime, Songs, Cinema & 3D Supported
              </span>
            </div>

            <div className="relative">
              <textarea
                rows={3}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Type your idea in Hindi, Hinglish, or English (e.g. 'Motu Patlu flying in futuristic Furfuri Nagar', 'Lord Shiva tandav 8K cinematic', 'Iron Man vs Thanos')..."
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono shadow-inner leading-relaxed"
              />

              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  disabled={isProcessing || !inputPrompt.trim()}
                  onClick={() => handleOrchestrateMasterAi()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600 hover:brightness-110 text-slate-950 font-black text-xs shadow-lg shadow-cyan-950/60 flex items-center gap-1.5 transition-all hover:scale-105 disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className={`w-4 h-4 text-slate-950 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>{isProcessing ? 'Merging & Orchestrating...' : '⚡ Merge & Execute All AI'}</span>
                </button>
              </div>
            </div>

            {/* Quick Starter Character & Universe Inspiration Chips */}
            <div className="space-y-1 pt-1">
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                <span>⚡ Instant One-Click Character Prompts:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '🧸 Motu Patlu 3D', prompt: 'Motu Patlu enjoying hot samosas in Furfuri Nagar market, Pixar 3D animated comedy' },
                  { label: '🔱 Lord Shiva 8K', prompt: 'Lord Shiva Mahadev meditating on Mount Kailash in Himalayan snow with glowing third eye and celestial aura, 8K epic' },
                  { label: '🦸 Iron Man Lab', prompt: 'Iron Man holographic armor assembly in Tony Stark futuristic lab with volumetric plasma sparks' },
                  { label: '⚔️ Goku vs Jiren', prompt: 'Goku mastering Ultra Instinct with silver glowing aura fighting Jiren in tournament of power' },
                  { label: '🎬 Spider-Man Tokyo', prompt: 'Spider-Man swinging through Cyberpunk Neo Tokyo in rainy neon street, cinematic IMAX' },
                  { label: '🎵 Bollywood Rap', prompt: 'High-energy Bollywood EDM Punjabi rap track with 130 bpm heavy 808 bass and catchy hook' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputPrompt(item.prompt);
                      handleOrchestrateMasterAi(item.prompt);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-cyan-300 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Master AI Orchestrated Result Dashboard */}
          {masterResult && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-cyan-500/50 space-y-4 shadow-2xl shadow-cyan-950/50 animate-in fade-in slide-in-from-bottom-2">
              
              {/* Subject & Lore Anchor Banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-cyan-950/80 border border-cyan-500/30">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👑</span>
                  <div>
                    <div className="text-xs font-bold text-white font-['Syne']">
                      Subject Detected: <span className="text-cyan-300 font-mono">{masterResult.detectedSubject}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Universe Style: <span className="text-amber-300">{masterResult.detectedUniverse}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                    Target: {masterResult.recommendedStudio.toUpperCase()}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleLaunchInStudio(masterResult.recommendedStudio, masterResult.masterEnhancedPrompt)}
                    className="px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md flex items-center gap-1 cursor-pointer"
                  >
                    <span>🚀 Launch in Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Output Multi-Modal Tabs */}
              <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto">
                {[
                  { id: 'synthesis', label: '🌟 Master Synthesis', icon: '🌟' },
                  { id: 'image', label: '🖼️ 8K Visual', icon: '🖼️' },
                  { id: 'video', label: '🎬 60fps Cinema', icon: '🎬' },
                  { id: 'script', label: '📜 Script & Dialogue', icon: '📜' },
                  { id: 'music', label: '🎵 Music & Audio', icon: '🎵' },
                  { id: '3d', label: '🕹️ 3D & Rigging', icon: '🕹️' },
                  { id: 'strategy', label: '📄 Strategy Plan', icon: '📄' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveOutputTab(t.id as any);
                      if (t.id === '3d') setIs3DActive(true);
                      if (t.id === 'music' && masterResult?.musicAndAudio) {
                        playSynthAudio(masterResult.musicAndAudio.bpm || 124);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                      activeOutputTab === t.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-950/40'
                        : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800'
                    }`}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab 1: Master Synthesis & Consensus */}
              {activeOutputTab === 'synthesis' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-300 font-mono">
                        Master Enhanced Prompt (All Models Unified):
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(masterResult.masterEnhancedPrompt, 'master')}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-mono flex items-center gap-1 border border-slate-800"
                      >
                        {copiedKey === 'master' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'master' ? 'Copied' : 'Copy Prompt'}</span>
                      </button>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono leading-relaxed select-all">
                      {masterResult.masterEnhancedPrompt}
                    </div>
                  </div>

                  {/* Multi-Model Consensus Metrics */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-mono text-slate-400">Merged Multi-AI Consensus Matrix:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {masterResult.activeAiConsensus?.map((c, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <div className="text-white font-bold">{c.engineName}</div>
                            <div className="text-[10px] text-slate-400">{c.role}</div>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
                            {c.latencyMs}ms
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: 8K Visual */}
              {activeOutputTab === 'image' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-purple-300 font-mono">Visual Rendering Directives:</span>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5 text-slate-300 font-mono">
                        <div><strong>Lighting:</strong> {masterResult.cinematicDirectives?.lighting}</div>
                        <div><strong>Aspect Ratio:</strong> {masterResult.cinematicDirectives?.aspectRatio}</div>
                        <div><strong>Color Grade:</strong> {masterResult.cinematicDirectives?.colorGrade}</div>
                        <div><strong>VFX:</strong> {masterResult.cinematicDirectives?.vfxElements}</div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            triggerImageGen({
                              prompt: masterResult.masterEnhancedPrompt,
                              style: masterResult.detectedUniverse || 'Cinematic 8K',
                              resolution: '8K',
                              aspectRatio: '16:9',
                            }).then((res) => {
                              if (res?.assetUrl) setPreviewImageUrl(res.assetUrl);
                            });
                          }}
                          className="flex-1 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Re-Render 8K
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLaunchInStudio('image_studio', masterResult.masterEnhancedPrompt)}
                          className="flex-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                        >
                          Open Image Studio
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-bold text-cyan-300 font-mono">Instant 8K Visual Preview:</span>
                      <div className="aspect-video rounded-2xl overflow-hidden border border-cyan-500/40 bg-black flex items-center justify-center relative">
                        {previewImageUrl ? (
                          <>
                            <img src={previewImageUrl} alt="Render" className="w-full h-full object-cover" />
                            <button
                              onClick={() => safeDownloadMedia(previewImageUrl, 'master_8k_visual.jpg')}
                              className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black text-white text-xs flex items-center gap-1 backdrop-blur"
                            >
                              <Download className="w-3.5 h-3.5" /> 8K
                            </button>
                          </>
                        ) : (
                          <div className="text-center p-4 text-slate-500 text-xs font-mono">
                            <Sparkles className="w-6 h-6 mx-auto mb-1 text-cyan-400 animate-spin" />
                            Rendering Master 8K Visual...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: 60fps Cinema */}
              {activeOutputTab === 'video' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-amber-300 font-mono">Camera & Motion Blueprint:</span>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5 text-slate-300 font-mono">
                        <div><strong>Camera Motion:</strong> {masterResult.cinematicDirectives?.cameraMotion}</div>
                        <div><strong>Frame Rate:</strong> {masterResult.cinematicDirectives?.fps} FPS High Smoothness</div>
                        <div><strong>LUT & Tone:</strong> {masterResult.cinematicDirectives?.colorGrade}</div>
                        <div><strong>VFX Particles:</strong> {masterResult.cinematicDirectives?.vfxElements}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleLaunchInStudio('video_audio', masterResult.masterEnhancedPrompt)}
                        className="w-full px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg"
                      >
                        <VideoIcon className="w-4 h-4" /> Open in 8K Video Studio
                      </button>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-bold text-amber-300 font-mono">Cinematic Motion Preview:</span>
                      <div className="aspect-video rounded-2xl overflow-hidden border border-amber-500/40 bg-black flex items-center justify-center relative">
                        {previewVideoUrl ? (
                          <video src={previewVideoUrl} controls autoPlay loop playsInline className="w-full h-full object-cover" />
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-400 font-mono space-y-2">
                            <Film className="w-6 h-6 mx-auto text-amber-400 animate-pulse" />
                            <div>Camera Trajectory: {masterResult.cinematicDirectives?.cameraMotion}</div>
                            <button
                              onClick={() => {
                                triggerVideoGen({
                                  prompt: masterResult.masterEnhancedPrompt,
                                  cinematicStyle: masterResult.cinematicDirectives?.cameraMotion || 'Dynamic 360 Orbit',
                                  fps: 60,
                                }).then((res) => {
                                  if (res?.videoUrl) setPreviewVideoUrl(res.videoUrl);
                                });
                              }}
                              className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs"
                            >
                              ⚡ Encode 60fps Motion Plate
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Script & Dialogue */}
              {activeOutputTab === 'script' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div>
                        <h4 className="text-xs font-bold text-white font-['Syne']">{masterResult.storyAndDialogue?.sceneTitle}</h4>
                        <p className="text-[11px] text-slate-400 font-mono">{masterResult.storyAndDialogue?.logline}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleVoice(masterResult.storyAndDialogue?.dialogueSnippet || '')}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{isSpeakingVoice ? 'Stop' : 'Voice Dialogue'}</span>
                      </button>
                    </div>

                    <div className="space-y-1 text-xs font-mono">
                      <span className="text-cyan-300 font-bold">Action Sequence Beats:</span>
                      <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                        {masterResult.storyAndDialogue?.characterBeats?.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs font-mono text-cyan-200">
                      <strong>Dialogue Line:</strong> "{masterResult.storyAndDialogue?.dialogueSnippet}"
                    </div>

                    <button
                      type="button"
                      onClick={() => handleLaunchInStudio('film_studio', masterResult.masterEnhancedPrompt)}
                      className="w-full px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <Film className="w-3.5 h-3.5 text-cyan-400" /> Open Film Studio & Screenwriter
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 5: Music & Audio */}
              {activeOutputTab === 'music' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-900 border border-purple-800/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">Genre: {masterResult.musicAndAudio?.genre}</div>
                        <div className="text-[11px] text-purple-300 font-mono">
                          {masterResult.musicAndAudio?.bpm} BPM • Key: {masterResult.musicAndAudio?.musicalKey} • {masterResult.musicAndAudio?.voiceStyle}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (isSynthesizingAudio) stopAudio();
                          else playSynthAudio(masterResult.musicAndAudio?.bpm || 124);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                          isSynthesizingAudio ? 'bg-rose-600 text-white animate-pulse' : 'bg-purple-600 hover:bg-purple-500 text-white'
                        }`}
                      >
                        {isSynthesizingAudio ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        <span>{isSynthesizingAudio ? 'Stop Beats' : 'Play Live Synth Audio'}</span>
                      </button>
                    </div>

                    {isSynthesizingAudio && (
                      <div className="flex items-center gap-1 h-5 px-3 bg-purple-950/80 rounded-lg">
                        {[40, 80, 60, 100, 75, 90, 45, 85, 95, 65, 50, 70, 90, 30].map((h, i) => (
                          <span
                            key={i}
                            className="flex-1 bg-gradient-to-t from-purple-500 to-cyan-400 rounded-full animate-pulse"
                            style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }}
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1 text-[11px] font-mono">
                      <span className="text-slate-400">Foley & SFX:</span>
                      {masterResult.musicAndAudio?.soundFx?.map((sfx, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-200">
                          {sfx}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleLaunchInStudio('song_studio', masterResult.masterEnhancedPrompt)}
                      className="w-full px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <Music className="w-3.5 h-3.5" /> Open Music Studio & Composer
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 6: 3D & Rigging */}
              {activeOutputTab === '3d' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-cyan-300 font-mono">3D Skeletal Rigging Spec:</span>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5 text-slate-300 font-mono">
                        <div><strong>Topology:</strong> {masterResult.threeDimParams?.meshTopology}</div>
                        <div><strong>Bone Hierarchy:</strong> {masterResult.threeDimParams?.boneCount} Joints (Inverse Kinematics)</div>
                        <div><strong>Shader Engine:</strong> {masterResult.threeDimParams?.shaderStyle}</div>
                        <div><strong>PBR Material:</strong> {masterResult.threeDimParams?.materialPbr}</div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsWireframe3D(!isWireframe3D)}
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-slate-700"
                        >
                          {isWireframe3D ? 'Solid Shading' : 'Wireframe Mesh'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLaunchInStudio('holo_sculpt_3d', masterResult.masterEnhancedPrompt)}
                          className="flex-1 px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                        >
                          Open 3D Sculpt
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-bold text-cyan-300 font-mono">Interactive 3D WebGL Viewport:</span>
                      <div
                        ref={threeCanvasRef}
                        className="w-full h-48 rounded-xl overflow-hidden border border-cyan-500/40 bg-black cursor-grab active:cursor-grabbing"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 7: Strategy Plan */}
              {activeOutputTab === 'strategy' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs font-mono">
                    <h4 className="font-bold text-white font-['Syne']">Executive Creative Strategy:</h4>
                    <p className="text-slate-300 leading-relaxed">{masterResult.documentPlan?.summary}</p>
                    <div className="pt-2">
                      <span className="text-cyan-300 font-bold block mb-1">Execution Action Items:</span>
                      <ul className="list-disc list-inside text-slate-300 space-y-1">
                        {masterResult.documentPlan?.actionItems?.map((act, i) => (
                          <li key={i}>{act}</li>
                        ))}
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLaunchInStudio('office_suite', masterResult.masterEnhancedPrompt)}
                      className="w-full px-4 py-2 mt-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" /> Open Office & Document Studio
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Bar */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono">Unified Master AI Engine (Gemini 3.8 + Flux + Audio + Cinema + 3D)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-cyan-300">Zero Quota Stalls • 100% Free Pass Active</span>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

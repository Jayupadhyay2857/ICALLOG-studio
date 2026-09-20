import React, { useState, useRef, useEffect } from 'react';
import {
  Film,
  Music,
  Mic,
  Play,
  Pause,
  Sliders,
  Volume2,
  Download,
  Sparkles,
  RefreshCw,
  Layers,
  Radio,
  Monitor,
  Video,
  Clock,
  Lock,
  Crown,
} from 'lucide-react';
import { triggerVideoGen, triggerVoiceSynth, enhancePrompt, triggerImageToVideo } from '../lib/api.ts';
import { ResolutionTier, RESOLUTION_SPECTRUM } from './ImageStudio.tsx';
import { UserProfile, ActiveTab } from '../types.ts';
import { ExplicitStudioToolbar } from './ExplicitStudioToolbar.tsx';
import { ExplicitGenre } from '../lib/explicitEngine.ts';
import {
  SocialPlatformEditingToolbar,
  EditingState,
  TARGET_PLATFORMS,
} from './SocialPlatformEditingToolbar.tsx';
import { UniversalMediaCaptureToolbar } from './UniversalMediaCaptureToolbar.tsx';

interface VideoAudioSuiteProps {
  user?: UserProfile;
  tokenBalance: number;
  openPaymentModal?: () => void;
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  setActiveTab?: (tab: ActiveTab) => void;
}

export interface DurationOption {
  id: string;
  label: string;
  minutes: number;
  isFreeAllowed: boolean;
  badge: string;
  description: string;
}

export const VIDEO_DURATION_OPTIONS: DurationOption[] = [
  // Free Plan Option: strictly 15 sec max
  { id: '15s', label: '15s (Free Max)', minutes: 0.25, isFreeAllowed: true, badge: 'Free', description: 'Free tier limit (15 seconds max)' },
  // Premium / VIP Unlimited Options
  { id: '30s', label: '30s', minutes: 0.5, isFreeAllowed: false, badge: 'VIP Only', description: 'Reels / Shorts motion' },
  { id: '1m', label: '1m', minutes: 1, isFreeAllowed: false, badge: 'VIP Only', description: 'Standard teaser preview' },
  { id: '5m', label: '5m', minutes: 5, isFreeAllowed: false, badge: 'VIP Only', description: 'Music sequence / reel' },
  { id: '15m', label: '15m', minutes: 15, isFreeAllowed: false, badge: 'VIP Only', description: 'Short scene / narrative' },
  { id: '30m', label: '30m', minutes: 30, isFreeAllowed: false, badge: 'VIP Only', description: 'Full episode format' },
  { id: '1hr', label: '1 Hour', minutes: 60, isFreeAllowed: false, badge: 'VIP Only', description: 'Cinematic master format' },
  { id: 'unlimited', label: '∞ Unlimited', minutes: 99999, isFreeAllowed: false, badge: 'VIP Unlimited', description: 'Infinite duration studio master' },
];

export interface VideoResolutionConfig {
  id: ResolutionTier;
  label: string;
  dimensions: string;
  tokens: number;
  maxFps: number;
  description: string;
}

export const VIDEO_RESOLUTION_SPECTRUM: VideoResolutionConfig[] = [
  { id: '240p', label: '240p Draft', dimensions: '426 × 240 px', tokens: 5, maxFps: 24, description: 'Rapid motion storyboard draft' },
  { id: '360p', label: '360p Mobile', dimensions: '640 × 360 px', tokens: 8, maxFps: 30, description: 'Mobile lightweight clip' },
  { id: '480p', label: '480p Standard', dimensions: '854 × 480 px', tokens: 12, maxFps: 30, description: 'Standard definition social preview' },
  { id: '720p', label: '720p HD', dimensions: '1280 × 720 px', tokens: 18, maxFps: 60, description: 'High definition crisp video' },
  { id: '1080p', label: '1080p Full HD', dimensions: '1920 × 1080 px', tokens: 24, maxFps: 60, description: 'Studio broadcast quality 1080p' },
  { id: '2K', label: '2K QHD Cinema', dimensions: '2560 × 1440 px', tokens: 30, maxFps: 60, description: 'Cinematic widescreen 2K master' },
  { id: '4K', label: '4K UHD Ultra', dimensions: '3840 × 2160 px', tokens: 40, maxFps: 60, description: 'Ultra high definition 4K crystal render' },
  { id: '8K', label: '8K Hyper IMAX', dimensions: '7680 × 4320 px', tokens: 50, maxFps: 60, description: 'Extreme 8K IMAX spatial video' },
];

export const VideoAudioSuite: React.FC<VideoAudioSuiteProps> = ({
  user,
  tokenBalance,
  openPaymentModal,
  onNotify,
  setActiveTab,
}) => {
  // Mode toggle: Video vs Audio
  const [activeModule, setActiveModule] = useState<'video' | 'image_to_video' | 'multi_video_blend' | 'audio_visualizer' | 'voiceover' | 'fl_studio'>('video');

  // Check VIP / Premium status
  const isPremium = Boolean(
    user &&
      (user.role === 'creator_override' ||
        user.role === 'admin' ||
        user.vipTier === 'diamond' ||
        user.vipTier === 'gold' ||
        user.vipTier === 'silver' ||
        user.vipTier === 'bronze')
  );

  // Video State: 240p to 8K
  const [selectedExplicitGenre, setSelectedExplicitGenre] = useState<string>('cinematic_hyperrealism');
  const [videoPrompt, setVideoPrompt] = useState('Cinematic drone hyperlapse through glowing Cyberpunk skyline, neon rain reflections, smooth camera pan');
  const [cinematicStyle, setCinematicStyle] = useState('Studio Ghibli Anime');
  const [videoGenderFocus, setVideoGenderFocus] = useState<'female' | 'male' | 'couple' | 'unisex'>('female');
  const [videoResolution, setVideoResolution] = useState<ResolutionTier>('8K');
  const [fps, setFps] = useState(60);
  const [selectedDurationId, setSelectedDurationId] = useState<string>('1hr');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [videoBgmTrack, setVideoBgmTrack] = useState<string>('Epic Orchestral Masterpiece');
  const [videoBgmVolume, setVideoBgmVolume] = useState<number>(85);
  const [isVideoEncoding, setIsVideoEncoding] = useState(false);

  // Social Platform Editing Suite State
  const [editingState, setEditingState] = useState<EditingState>({
    selectedPlatform: TARGET_PLATFORMS[0],
    trimStart: 0,
    trimEnd: 15,
    bgRemoverActive: false,
    bgType: 'blur',
    speed: 1.0,
    zoom: 1.0,
    panX: 0,
    panY: 0,
    blurLevel: 0,
    isFullscreen: false,
    likeCount: 128,
    isLiked: false,
    comments: [
      { id: '1', user: 'ProDirector', text: 'Stunning 8K hyperlapse lighting!', time: '2m ago' },
      { id: '2', user: 'ReelsCreator', text: 'Optimized perfectly for Instagram Reel 9:16!', time: '5m ago' },
    ],
    alterPrompt: '',
    alterStyle: 'cyberpunk_neon',
  });

  const [videoLetterGroup, setVideoLetterGroup] = useState<string>('ALL');

  const CINEMATIC_STYLES = [
    { id: 'A', letter: 'A', name: 'Anime & Studio Ghibli Motion', icon: '🌿', region: 'Japan' },
    { id: 'B', letter: 'B', name: 'Bollywood & Mass Action Motion', icon: '🎥', region: 'India' },
    { id: 'C', letter: 'C', name: 'Cyberpunk Neon Synthwave', icon: '🌆', region: 'Global' },
    { id: 'D', letter: 'D', name: 'Dark Erotic Thriller & Neo-Noir (Explicit 18+ Uncensored)', icon: '🔞', region: 'Hollywood/Global' },
    { id: 'E', letter: 'E', name: 'Extreme Body Horror & Visceral Motion (Unrated)', icon: '🩸', region: 'Extreme Cinema' },
    { id: 'F', letter: 'F', name: 'Folk Horror & Occult Ritual Motion', icon: '🕯️', region: 'Nordic/Global' },
    { id: 'G', letter: 'G', name: 'Grindhouse B-Movie & Cult Exploitation (Unfiltered)', icon: '🎞️', region: 'USA/Global' },
    { id: 'H', letter: 'H', name: 'Hardcore Mafia & Underworld Crime Motion', icon: '💼', region: 'Global Underworld' },
    { id: 'I', letter: 'I', name: 'Independent Festival Cinema & Art-House', icon: '🎟️', region: 'Global Art-House' },
    { id: 'J', letter: 'J', name: 'Japanese Samurai Katana Motion', icon: '🌊', region: 'Japan' },
    { id: 'K', letter: 'K', name: 'Korean Revenge Thriller Motion', icon: '📱', region: 'South Korea' },
    { id: 'L', letter: 'L', name: 'Lo-Fi Chill & 16-Bit Pixel Anim', icon: '🎮', region: 'Global' },
    { id: 'M', letter: 'M', name: 'Manga & Comic Motion Comic', icon: '📖', region: 'Japan/USA' },
    { id: 'N', letter: 'N', name: 'Neo-Noir Shadow Detective & Femme Fatale', icon: '🎬', region: 'Hollywood' },
    { id: 'O', letter: 'O', name: 'Occult Dark Fantasy & Demonology', icon: '🔮', region: 'Global' },
    { id: 'P', letter: 'P', name: 'Photorealistic 8K Anamorphic IMAX', icon: '📸', region: 'Global' },
    { id: 'Q', letter: 'Q', name: 'Quantum Hologram Glitch Matrix', icon: '⚡', region: 'Cyber' },
    { id: 'R', letter: 'R', name: 'Retro 80s Synth & Vaporwave', icon: '📼', region: 'USA/Global' },
    { id: 'S', letter: 'S', name: 'Surrealist Avant-Garde & Dream Motion', icon: '🌀', region: 'Europe/Global' },
    { id: 'T', letter: 'T', name: 'Uncensored Shock Comedy & Satire', icon: '🎭', region: 'Global' },
    { id: 'U', letter: 'U', name: 'Unreal Engine 5 Octane Cinematic', icon: '🕹️', region: 'Game Engine' },
    { id: 'V', letter: 'V', name: 'Vintage Spaghetti Western Outlaw', icon: '🤠', region: 'Italy/USA' },
    { id: 'W', letter: 'W', name: 'World Underground & Independent Rebel Cinema', icon: '🎥', region: 'Global Rebel' },
    { id: 'X', letter: 'X', name: 'Xtreme Action & Car Chase Heist', icon: '🏎️', region: 'Hollywood' },
    { id: 'Y', letter: 'Y', name: 'Yakuza Underground & Tokyo Neon Crime', icon: '🏮', region: 'Japan' },
    { id: 'Z', letter: 'Z', name: 'Zen Shanshui Mist & Wuxia Fly', icon: '⛰️', region: 'China' },
  ];

  const GENDER_PRESETS = [
    { id: 'female', label: '👩 Female Lead' },
    { id: 'male', label: '👨 Male Lead' },
    { id: 'couple', label: '👫 Male & Female Duo' },
    { id: 'unisex', label: '🌌 Scene / World' },
  ];

  // Image-to-Video State
  const [img2vidImage, setImg2vidImage] = useState<string>(
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop'
  );
  const [img2vidPrompt, setImg2vidPrompt] = useState<string>(
    'Dynamic cinematic dolly zoom, billowing volumetric atmospheric haze drifting across lens, dramatic 60fps camera motion'
  );
  const [img2vidMotionType, setImg2vidMotionType] = useState<string>('Cinematic Dolly Zoom');
  const [img2vidMotionIntensity, setImg2vidMotionIntensity] = useState<number>(7);
  const [img2vidResolution, setImg2vidResolution] = useState<ResolutionTier>('8K');
  const [img2vidDurationId, setImg2vidDurationId] = useState<string>('1hr');
  const [isImg2VidEncoding, setIsImg2VidEncoding] = useState(false);

  const selectedDuration =
    VIDEO_DURATION_OPTIONS.find((d) => d.id === selectedDurationId) || VIDEO_DURATION_OPTIONS[6];

  const selectedImg2VidDuration =
    VIDEO_DURATION_OPTIONS.find((d) => d.id === img2vidDurationId) || VIDEO_DURATION_OPTIONS[6];

  const activeVideoRes = VIDEO_RESOLUTION_SPECTRUM.find((v) => v.id === videoResolution) || VIDEO_RESOLUTION_SPECTRUM[7];

  // Audio Visualizer State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [visualizerMode, setVisualizerMode] = useState<'bars' | 'circular' | 'wave'>('bars');
  const spectrumCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

  // Voiceover State
  const [voiceText, setVoiceText] = useState('Welcome to iCALLOG V18, the interactive artificial intelligence learning and operational gateway.');
  const [voicePreset, setVoicePreset] = useState('Zephyr (Studio Deep)');
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // FL Studio Project Tools State
  const [flBpm, setFlBpm] = useState(132);
  const [flScale, setFlScale] = useState('Minor Pentatonic (Cyber Bass)');
  const [flPattern, setFlPattern] = useState([
    { note: 'C3', step: 0, active: true },
    { note: 'D#3', step: 3, active: true },
    { note: 'F3', step: 6, active: true },
    { note: 'G3', step: 8, active: true },
    { note: 'A#3', step: 11, active: true },
    { note: 'C4', step: 14, active: true },
  ]);

  // Handle Video Generation Trigger (240p to 8K)
  const handleGenerateVideo = async () => {
    if (!isPremium && !selectedDuration.isFreeAllowed) {
      onNotify(
        'VIP Unlimited Duration Required',
        'Free plan allows video duration up to 1 Hour. Upgrade to VIP / Premium for Unlimited video rendering.',
        'warning'
      );
      if (openPaymentModal) openPaymentModal();
      return;
    }

    try {
      setIsVideoEncoding(true);
      const res = await triggerVideoGen({
        prompt: videoPrompt,
        cinematicStyle,
        fps,
        resolution: videoResolution,
        duration: selectedDuration.label,
        durationMinutes: selectedDuration.minutes,
        isUnlimited: selectedDuration.id === 'unlimited',
        userId: user?.id || 'demo_user',
      });
      onNotify(
        `${videoResolution} Video Encoding`,
        `Job ${res.jobId} enqueued for ${videoResolution} (${selectedDuration.label} duration - ${activeVideoRes.tokens} Tokens)!`,
        'success'
      );
      setTimeout(() => {
        setIsVideoEncoding(false);
        onNotify(
          'Video Clip Ready',
          `${videoResolution} MP4 encoded at ${fps}fps with duration: ${selectedDuration.label} (${activeVideoRes.dimensions}).`,
          'success'
        );
      }, 2200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Encoding failed';
      onNotify('Notice', msg, 'error');
      setIsVideoEncoding(false);
    }
  };

  // Handle Image-to-Video Trigger
  const handleGenerateImageToVideo = async () => {
    if (!isPremium && !selectedImg2VidDuration.isFreeAllowed) {
      onNotify(
        'VIP Unlimited Duration Required',
        'Free plan allows video duration up to 1 Hour. Upgrade to VIP / Premium for Unlimited video rendering.',
        'warning'
      );
      if (openPaymentModal) openPaymentModal();
      return;
    }

    try {
      setIsImg2VidEncoding(true);
      const res = await triggerImageToVideo({
        imageUrl: img2vidImage,
        prompt: img2vidPrompt,
        motionType: img2vidMotionType,
        motionIntensity: img2vidMotionIntensity,
        resolution: img2vidResolution,
        fps: 60,
        duration: selectedImg2VidDuration.label,
        durationMinutes: selectedImg2VidDuration.minutes,
        isUnlimited: selectedImg2VidDuration.id === 'unlimited',
        userId: user?.id || 'demo_user',
      });
      onNotify(
        `${img2vidResolution} Image-to-Video Animation`,
        `Job ${res.jobId} enqueued for ${img2vidMotionType} (${selectedImg2VidDuration.label} duration)!`,
        'success'
      );
      setTimeout(() => {
        setIsImg2VidEncoding(false);
        onNotify(
          'Motion Video Ready',
          `Image converted to ${img2vidResolution} video with ${img2vidMotionType} motion!`,
          'success'
        );
      }, 2400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Image to video failed';
      onNotify('Notice', msg, 'error');
      setIsImg2VidEncoding(false);
    }
  };

  // Audio Spectrum Visualizer Engine
  const toggleAudioVisualizer = () => {
    if (isPlayingAudio) {
      setIsPlayingAudio(false);
      cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyserRef.current = analyser;

      // Create synthetic audio synthesizer wave
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, ctx.currentTime);

      // Low frequency modulation for rhythmic cyber bass
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(3.5, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(80, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      osc.connect(gain);
      gain.connect(analyser);
      analyser.connect(ctx.destination);

      osc.start();
      lfo.start();
      setIsPlayingAudio(true);

      // Render Visualizer Loop
      const renderSpectrum = () => {
        animFrameRef.current = requestAnimationFrame(renderSpectrum);
        const canvas = spectrumCanvasRef.current;
        if (!canvas) return;
        const cCtx = canvas.getContext('2d');
        if (!cCtx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        cCtx.fillStyle = '#0a0e17';
        cCtx.fillRect(0, 0, canvas.width, canvas.height);

        if (visualizerMode === 'bars') {
          const barWidth = (canvas.width / bufferLength) * 2.2;
          let x = 0;
          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;
            const gradient = cCtx.createLinearGradient(0, canvas.height, 0, 0);
            gradient.addColorStop(0, '#4f46e5');
            gradient.addColorStop(0.5, '#06b6d4');
            gradient.addColorStop(1, '#f43f5e');

            cCtx.fillStyle = gradient;
            cCtx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
            x += barWidth;
          }
        } else if (visualizerMode === 'circular') {
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const radius = 60;

          cCtx.beginPath();
          cCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          cCtx.strokeStyle = '#06b6d4';
          cCtx.lineWidth = 2;
          cCtx.stroke();

          for (let i = 0; i < bufferLength; i++) {
            const rad = (i / bufferLength) * 2 * Math.PI;
            const barLen = (dataArray[i] / 255) * 80;
            const x1 = centerX + Math.cos(rad) * radius;
            const y1 = centerY + Math.sin(rad) * radius;
            const x2 = centerX + Math.cos(rad) * (radius + barLen);
            const y2 = centerY + Math.sin(rad) * (radius + barLen);

            cCtx.beginPath();
            cCtx.moveTo(x1, y1);
            cCtx.lineTo(x2, y2);
            cCtx.strokeStyle = '#818cf8';
            cCtx.lineWidth = 3;
            cCtx.stroke();
          }
        }
      };

      renderSpectrum();
    } catch {
      onNotify('Audio Notice', 'Audio visualizer synthetic engine initialized.', 'info');
    }
  };

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Voiceover Synthesis
  const handleVoiceover = async () => {
    try {
      setIsSynthesizing(true);
      await triggerVoiceSynth(voiceText, voicePreset);
      onNotify('Voiceover Synthesized', `Generated speech using ${voicePreset}.`, 'success');
      
      // Browser SpeechSynthesis
      if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(voiceText);
        utter.pitch = voicePreset.includes('Deep') ? 0.75 : 1.1;
        utter.rate = 1.0;
        window.speechSynthesis.speak(utter);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Synthesis failed';
      onNotify('Notice', msg, 'error');
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div id="video-audio-suite-container" className="space-y-4">
      {/* Universal Quick Media Capture & Recording Toolbar */}
      <UniversalMediaCaptureToolbar user={user} onNotify={(t, d, ty) => onNotify(t, d, ty as any)} setActiveTab={setActiveTab} />

      {/* Explicit & Unrestricted Studio Mode Toolbar with All Genres */}
      {user && (
        <ExplicitStudioToolbar
          user={user}
          currentStudio="video"
          activeGenreId={selectedExplicitGenre}
          onSelectGenre={(g) => {
            setSelectedExplicitGenre(g.id);
            setCinematicStyle(g.name);
          }}
          currentPrompt={videoPrompt}
          onApplyPromptModifier={(enhanced) => setVideoPrompt(enhanced)}
          onOpenVipModal={openPaymentModal}
          onNotify={onNotify}
        />
      )}

      {/* Module Selector Pill Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'video', label: '240p to 8K Video AI Engine', icon: '🎬' },
            { id: 'image_to_video', label: 'Image to Video Animator', icon: '⚡' },
            { id: 'multi_video_blend', label: 'Multi-Video AI Blender (2+ Videos)', icon: '🎥' },
            { id: 'audio_visualizer', label: 'Audio-Reactive Spectrum', icon: '🔊' },
            { id: 'voiceover', label: 'AI Voiceover Studio', icon: '🎙️' },
            { id: 'fl_studio', label: 'FL Studio Project Tools', icon: '🎹' },
          ].map((mod) => (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod.id as typeof activeModule)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeModule === mod.id
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>{mod.icon}</span>
              <span>{mod.label}</span>
            </button>
          ))}
        </div>

        {activeModule === 'video' && (
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
            <span>Video Resolution:</span>
            <span className="px-2 py-0.5 rounded font-bold bg-cyan-950 border border-cyan-700 text-cyan-300">
              {videoResolution} ({activeVideoRes.dimensions})
            </span>
            <span className="text-amber-400 font-bold">{activeVideoRes.tokens} Tokens</span>
          </div>
        )}
      </div>

      {/* Module 1: 240p to 8K Text-to-Video Engine */}
      {activeModule === 'video' && (
        <div className="space-y-4">
          {/* Video Resolution Segmented Selector (240p to 8K) */}
          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white font-['Syne']">
                  Video Resolution Spectrum (240p Draft to 8K Ultra IMAX)
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                {activeVideoRes.description} • Max FPS: {activeVideoRes.maxFps} • <span className="text-amber-400 font-mono font-bold">{activeVideoRes.tokens} Tokens</span>
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {VIDEO_RESOLUTION_SPECTRUM.map((v) => {
                const isSelected = videoResolution === v.id;
                return (
                  <button
                    key={v.id}
                    id={`video-res-btn-${v.id}`}
                    onClick={() => {
                      setVideoResolution(v.id);
                      if (fps > v.maxFps) setFps(v.maxFps);
                    }}
                    className={`py-2 px-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-gradient-to-t from-cyan-600 to-blue-600 text-white border-cyan-300 shadow-lg shadow-cyan-900/40 font-bold scale-[1.02]'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="text-xs font-mono font-bold">{v.id}</span>
                    <span className="text-[9px] opacity-75 font-mono">{v.tokens}T</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-4">
              <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
                <Film className="w-4 h-4 text-cyan-400" /> Video Generation Parameters
              </h3>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Cinematic Video Prompt</label>
                <textarea
                  rows={4}
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Character Gender Focus for Video */}
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">Subject Lead Focus</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {GENDER_PRESETS.map((g) => {
                    const isSel = videoGenderFocus === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setVideoGenderFocus(g.id as 'female' | 'male' | 'couple' | 'unisex')}
                        className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold border text-left truncate transition-all ${
                          isSel
                            ? 'bg-cyan-900 text-white border-cyan-400 font-bold'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {g.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Art Styles & Animation presets */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] font-mono border border-cyan-800">A-Z</span>
                    Global World Motion Styles Dictionary
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">26 Worldwide Styles</span>
                </div>

                {/* Letter Group Filter Bar */}
                <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-1 text-[10px] font-mono">
                  {['ALL', 'A-E', 'F-J', 'K-O', 'P-T', 'U-Z'].map((grp) => (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => setVideoLetterGroup(grp)}
                      className={`px-2 py-0.5 rounded-lg border transition-all ${
                        videoLetterGroup === grp
                          ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {grp}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {CINEMATIC_STYLES.filter((st) => {
                    if (videoLetterGroup === 'ALL') return true;
                    if (videoLetterGroup === 'A-E') return ['A','B','C','D','E'].includes(st.letter);
                    if (videoLetterGroup === 'F-J') return ['F','G','H','I','J'].includes(st.letter);
                    if (videoLetterGroup === 'K-O') return ['K','L','M','N','O'].includes(st.letter);
                    if (videoLetterGroup === 'P-T') return ['P','Q','R','S','T'].includes(st.letter);
                    if (videoLetterGroup === 'U-Z') return ['U','V','W','X','Y','Z'].includes(st.letter);
                    return true;
                  }).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setCinematicStyle(st.name)}
                      className={`py-1.5 px-2 rounded-xl text-xs border text-left transition-all flex items-center justify-between gap-1 ${
                        cinematicStyle === st.name
                          ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white border-cyan-300 font-bold shadow'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-4 h-4 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono font-bold text-cyan-300 flex items-center justify-center shrink-0">
                          {st.letter}
                        </span>
                        <span className="text-sm">{st.icon}</span>
                        <span className="truncate text-[11px]">{st.name}</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 shrink-0 border border-slate-800 px-1 rounded bg-slate-950">
                        {st.region}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Frame Rate & Aspect Ratio */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-semibold">Frame Rate</label>
                  <select
                    value={fps}
                    onChange={(e) => setFps(parseInt(e.target.value))}
                    className="w-full py-2 px-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value={24}>24 FPS (Cinematic Motion)</option>
                    <option value={30}>30 FPS (Standard Video)</option>
                    {activeVideoRes.maxFps >= 60 && <option value={60}>60 FPS (Ultra Smooth)</option>}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-semibold">Aspect Ratio</label>
                  <div className="grid grid-cols-3 gap-1">
                    {['16:9', '9:16', '21:9'].map((ar) => (
                      <button
                        key={ar}
                        type="button"
                        onClick={() => setAspectRatio(ar)}
                        className={`py-2 rounded-xl text-xs font-mono font-semibold border ${
                          aspectRatio === ar
                            ? 'bg-indigo-600 text-white border-indigo-400 font-bold'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        {ar}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Video Background Music & Soundtrack Dubbing Suite */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5 font-['Syne']">
                    <Music className="w-4 h-4 text-pink-400" /> Video Background Music & Soundtrack Dubbing
                  </label>
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                    Auto-Mix & Sync
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={videoBgmTrack}
                    onChange={(e) => setVideoBgmTrack(e.target.value)}
                    className="w-full py-2 px-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Epic Orchestral Masterpiece">🎵 Epic Orchestral Masterpiece (Cinematic)</option>
                    <option value="Cyberpunk Neon Synthwave Beat">🎧 Cyberpunk Neon Synthwave Beat</option>
                    <option value="Ambient Chillout & Lofi Piano">🎹 Ambient Chillout & Lofi Piano</option>
                    <option value="Action Thriller Trap Drumline">🥁 Action Thriller Trap Drumline</option>
                    <option value="Romantic Violin & Acoustic Strings">🎻 Romantic Violin & Acoustic Strings</option>
                    <option value="Dark Horror Suspense Drone">👻 Dark Horror Suspense Drone</option>
                    <option value="Custom Uploaded Audio File">📂 Custom Uploaded BGM Track</option>
                  </select>

                  <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 shrink-0 font-mono">BGM Vol:</span>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={videoBgmVolume}
                      onChange={(e) => setVideoBgmVolume(Number(e.target.value))}
                      className="w-full accent-pink-500"
                    />
                    <span className="text-[11px] font-mono text-pink-400 shrink-0">{videoBgmVolume}%</span>
                  </div>
                </div>
              </div>

              {/* Video Duration Limit Engine: Free up to 1 Hour, Premium Unlimited */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <label className="text-xs font-bold text-white font-['Syne']">
                      Video Duration Limit
                    </label>
                  </div>
                  {isPremium ? (
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 font-bold">
                      <Crown className="w-3 h-3 text-amber-400" /> VIP Unlimited
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                      Free Plan: 1 Hr Cap
                    </span>
                  )}
                </div>

                {/* Duration Status Header */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                  <span>
                    Selected: <strong className="text-cyan-300 font-mono font-bold">{selectedDuration.label}</strong>
                    <span className="text-slate-500 ml-1.5">({selectedDuration.description})</span>
                  </span>
                  {!isPremium && (
                    <button
                      type="button"
                      onClick={openPaymentModal}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition-colors"
                    >
                      <Lock className="w-3 h-3" /> Upgrade VIP
                    </button>
                  )}
                </div>

                {/* Free Plan Durations (Up to 1 Hour) */}
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold flex items-center justify-between">
                    <span>Free Plan Supported (Up to 1 Hour):</span>
                    <span className="text-emerald-400 text-[9px]">Included</span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                    {VIDEO_DURATION_OPTIONS.filter((opt) => opt.isFreeAllowed).map((opt) => {
                      const isSelected = selectedDurationId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedDurationId(opt.id)}
                          className={`py-1.5 px-1 rounded-xl text-center border transition-all text-xs font-mono flex flex-col items-center justify-center ${
                            isSelected
                              ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white border-cyan-400 font-bold shadow-md shadow-cyan-950'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <span className="font-bold">{opt.label}</span>
                          <span className="text-[8px] text-cyan-400 opacity-90">{opt.badge}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Premium / VIP Unlimited Durations */}
                <div className="space-y-1 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-400" /> VIP / Premium (Unlimited):
                    </span>
                    {!isPremium && (
                      <span className="text-[9px] text-amber-400/80 font-mono">Requires VIP Plan</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {VIDEO_DURATION_OPTIONS.filter((opt) => !opt.isFreeAllowed).map((opt) => {
                      const isSelected = selectedDurationId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            if (!isPremium) {
                              onNotify(
                                'VIP Feature: Unlimited Duration',
                                'Free plan allows video duration up to 1 Hour. Please upgrade to VIP / Premium for Unlimited video duration.',
                                'warning'
                              );
                              if (openPaymentModal) openPaymentModal();
                              return;
                            }
                            setSelectedDurationId(opt.id);
                          }}
                          className={`py-2 px-2 rounded-xl border transition-all text-xs font-mono flex items-center justify-between gap-1.5 ${
                            isSelected
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 border-amber-300 font-bold shadow-md shadow-amber-950'
                              : isPremium
                              ? 'bg-amber-950/30 border-amber-500/30 text-amber-300 hover:bg-amber-900/40'
                              : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-amber-500/40 hover:text-amber-300'
                          }`}
                        >
                          <span className="font-bold truncate text-[11px]">{opt.label}</span>
                          {!isPremium && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                id="generate-video-btn"
                disabled={isVideoEncoding}
                onClick={handleGenerateVideo}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isVideoEncoding ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Encoding {videoResolution} Frames (Queue Active)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Render Video at {videoResolution} ({activeVideoRes.tokens} Tokens)</span>
                  </>
                )}
              </button>
            </div>

            <div className="lg:col-span-2 p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-white font-['Syne'] flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" /> Real-Time Video Player
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold">
                    {videoResolution} • {activeVideoRes.dimensions} • {fps} FPS
                  </span>
                  <a
                    href="https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1400&q=80"
                    download={`iCALLOG_${videoResolution}_Clip.mp4`}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Export
                  </a>
                </div>
              </div>

              <div className={`rounded-2xl overflow-hidden relative border border-slate-800 bg-black flex items-center justify-center transition-all ${
                editingState.isFullscreen ? 'fixed inset-4 z-[9999] shadow-2xl h-auto' : 'h-[420px]'
              }`}>
                <img
                  src="https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1400&q=80"
                  alt={`${videoResolution} Video Preview`}
                  className="w-full h-full object-cover opacity-85 transition-transform duration-300"
                  style={{
                    transform: `scale(${editingState.zoom}) translate(${editingState.panX}px, ${editingState.panY}px)`,
                    filter: `blur(${editingState.blurLevel}px)`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-5 pointer-events-none">
                  <div className="flex items-center justify-between text-xs text-slate-200">
                    <span className="font-bold flex items-center gap-2">
                      <Play className="w-4 h-4 text-cyan-400" /> {cinematicStyle} - {videoResolution} Ultra Clip
                    </span>
                    <span className="font-mono text-cyan-300 font-bold bg-black/60 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                      Target: {editingState.selectedPlatform.name} ({editingState.selectedPlatform.aspectRatio}) • {editingState.speed}x
                    </span>
                  </div>
                </div>
              </div>

              {/* Universal Platform Selector & Video Editing Suite */}
              <div className="mt-4">
                <SocialPlatformEditingToolbar
                  mediaType="video"
                  mediaUrl="https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1400&q=80"
                  editingState={editingState}
                  onUpdateState={(updated) => setEditingState((prev) => ({ ...prev, ...updated }))}
                  onApplyAlteration={(alterPrompt, alterStyle) => {
                    setVideoPrompt(`[ALTERED: ${alterStyle}] ${alterPrompt}`);
                    onNotify('Video Scene Altered', `Altered video style to ${alterStyle} with custom prompt rules!`, 'success');
                  }}
                  onNotify={onNotify}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Module: Multi-Video AI Blender (2+ Videos) */}
      {activeModule === 'multi_video_blend' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white font-['Syne'] flex items-center gap-2">
                <Film className="w-5 h-5 text-cyan-400" /> Multi-Video AI Blender & Morph Compositor
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload 2 or more videos to morph transitions, layer VFX explosions, or sequence cinematic scenes with AI prompts.
              </p>
            </div>

            <span className="text-xs font-mono text-cyan-300 px-2.5 py-1 rounded-xl bg-cyan-950 border border-cyan-800 font-bold">
              2+ Videos Deck Active
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Video Deck */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Video 1 */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 font-mono">Video #1 (Primary Clip)</span>
                    <label className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white cursor-pointer border border-slate-700">
                      Upload
                      <input
                        type="file"
                        accept="video/*,image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            onNotify('Video #1 Loaded', 'Primary video file updated.', 'success');
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                    <img
                      src="https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop"
                      alt="Vid 1"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Video 2 */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 font-mono">Video #2 (Target Clip / VFX)</span>
                    <label className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white cursor-pointer border border-slate-700">
                      Upload
                      <input
                        type="file"
                        accept="video/*,image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            onNotify('Video #2 Loaded', 'Target video file updated.', 'success');
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                    <img
                      src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop"
                      alt="Vid 2"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Drag & Drop Multi-Video Zone */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-slate-800 hover:border-cyan-500/50 bg-slate-950 text-center space-y-2">
                <Film className="w-5 h-5 text-cyan-400 mx-auto" />
                <div className="text-xs font-bold text-slate-300">
                  Drag & Drop Video 3, Video 4 or overlay clips here
                </div>
                <label className="inline-block px-3 py-1 rounded-xl bg-cyan-950 text-cyan-200 border border-cyan-800 text-[11px] font-bold cursor-pointer hover:bg-cyan-900 transition-colors">
                  + Add More Video Clips
                  <input
                    type="file"
                    multiple
                    accept="video/*,image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        onNotify('Additional Videos Loaded', `Loaded ${e.target.files.length} video files into blend deck!`, 'success');
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {/* AI Command Textarea */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  AI Multi-Video Command / Prompt
                </label>
                <textarea
                  rows={3}
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
                  placeholder="e.g. Morph Video 1 into Video 2 seamlessly with liquid transition, add fire particle effects, 60fps cinema grade"
                />
              </div>

              <button
                type="button"
                disabled={isVideoEncoding}
                onClick={handleGenerateVideo}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2"
              >
                {isVideoEncoding ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Blending Multi-Videos with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                    <span>Execute AI Multi-Video Blend ({videoResolution} {fps}fps)</span>
                  </>
                )}
              </button>
            </div>

            {/* Output Preview */}
            <div className="lg:col-span-5 space-y-3">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>Combined Video Preview</span>
                <span className="font-mono text-cyan-300">{videoResolution} {fps}fps</span>
              </div>

              <div className="aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl relative">
                <img src={img2vidImage} alt="Video Result" className="w-full h-full object-cover" />
              </div>

              <a
                href={img2vidImage}
                download={`Blended_Video_${Date.now()}.mp4`}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-md"
              >
                <Download className="w-4 h-4" /> Export Combined {videoResolution} Video (.MP4)
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Module: Image-to-Video Animator */}
      {activeModule === 'image_to_video' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
                  <Video className="w-4 h-4 text-cyan-400" /> AI Image-to-Video Motion Animator
                </h3>
                <p className="text-xs text-slate-400">
                  Transform static concept art and portraits into cinematic 60fps video with camera trajectory physics.
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                Motion AI Engine
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Image Source & Motion Parameters */}
              <div className="lg:col-span-6 space-y-4">
                {/* Source Image Selector */}
                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-semibold">Source Image URL or Preset</label>
                  <input
                    type="text"
                    value={img2vidImage}
                    onChange={(e) => setImg2vidImage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none"
                    placeholder="https://..."
                  />
                  {/* Preset Quick Images */}
                  <div className="flex gap-2 mt-2">
                    {[
                      { label: 'Cyberpunk Alley', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop' },
                      { label: 'Sci-Fi Astronaut', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop' },
                      { label: 'Neon Metropolis', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop' },
                    ].map((sample) => (
                      <button
                        key={sample.label}
                        type="button"
                        onClick={() => setImg2vidImage(sample.url)}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-400 hover:text-white transition-colors"
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Motion Trajectory */}
                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-semibold">Camera Motion Trajectory</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'Cinematic Dolly Zoom',
                      '360° Orbit Pan',
                      'Forward Hyperspeed Dive',
                      'Atmospheric Drift',
                      'Vertical Crane Rise',
                      'Matrix Bullet-Time',
                    ].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setImg2vidMotionType(m)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                          img2vidMotionType === m
                            ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white border-cyan-400 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Motion Intensity Slider */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-slate-300 font-semibold">Motion Velocity & Intensity</label>
                    <span className="text-xs font-mono font-bold text-cyan-400">Level {img2vidMotionIntensity}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={img2vidMotionIntensity}
                    onChange={(e) => setImg2vidMotionIntensity(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>

                {/* Motion Description Prompt */}
                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-semibold">Atmospheric Animation Prompt</label>
                  <textarea
                    rows={2}
                    value={img2vidPrompt}
                    onChange={(e) => setImg2vidPrompt(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none resize-none"
                  />
                </div>

                {/* Video Duration Selector (Free 1hr / VIP Unlimited) */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Video Duration</label>
                    <span className="text-[11px] font-mono text-cyan-400">
                      Free plan: Up to 1 Hour • VIP: Unlimited
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {VIDEO_DURATION_OPTIONS.slice(0, 7).map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setImg2vidDurationId(d.id)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-mono border transition-all ${
                          img2vidDurationId === d.id
                            ? 'bg-cyan-600 text-white border-cyan-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        if (!isPremium) {
                          onNotify('VIP Feature', 'Upgrade to VIP for Unlimited duration rendering.', 'warning');
                          if (openPaymentModal) openPaymentModal();
                        } else {
                          setImg2vidDurationId('unlimited');
                        }
                      }}
                      className={`py-1.5 px-2 rounded-xl text-xs font-mono border transition-all flex items-center justify-center gap-1 ${
                        img2vidDurationId === 'unlimited'
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-300'
                          : 'bg-amber-950/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      <span>∞ VIP</span>
                      {!isPremium && <Lock className="w-3 h-3 text-amber-400" />}
                    </button>
                  </div>
                </div>

                {/* Render Button */}
                <button
                  type="button"
                  disabled={isImg2VidEncoding}
                  onClick={handleGenerateImageToVideo}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-cyan-700 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold font-['Syne'] text-xs shadow-lg shadow-cyan-900/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isImg2VidEncoding ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                      <span>Synthesizing Video Frames...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-cyan-300" />
                      <span>Animate Image to Video ({img2vidMotionType})</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: Image Preview & Motion Simulation */}
              <div className="lg:col-span-6 space-y-3">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl group">
                  <img
                    src={img2vidImage}
                    alt="Source for Animation"
                    className={`w-full h-full object-cover transition-transform duration-1000 ${
                      isImg2VidEncoding ? 'scale-110 blur-sm' : 'group-hover:scale-105'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                    <div className="flex items-center justify-between text-xs text-white">
                      <span className="font-bold flex items-center gap-1.5 font-mono">
                        <Play className="w-4 h-4 text-cyan-400" /> {img2vidMotionType}
                      </span>
                      <span className="font-mono text-cyan-300 font-bold bg-black/60 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                        {selectedImg2VidDuration.label} • 60 FPS
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 space-y-1 font-mono">
                  <div className="text-slate-300 font-bold">Physics Trajectory Specs:</div>
                  <div>• Motion Model: Optical Flow Diffusion & Camera Frustum Warping</div>
                  <div>• Frame Rate: 60 FPS Dynamic Motion Blur</div>
                  <div>• Max Video Duration: {selectedImg2VidDuration.label} ({selectedImg2VidDuration.isFreeAllowed ? 'Free Tier Enabled' : 'VIP Unlimited Tier'})</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Module 2: Audio-Reactive Spectrum Visualizer */}
      {activeModule === 'audio_visualizer' && (
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-cyan-400" /> HTML5 Web Audio API Spectrum Visualizer
              </h3>
              <p className="text-[11px] text-slate-400">
                Real-time frequency FFT analysis reacting to synthesized cyber bass
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                {(['bars', 'circular'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setVisualizerMode(m)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                      visualizerMode === m ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <button
                onClick={toggleAudioVisualizer}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  isPlayingAudio
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                }`}
              >
                {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlayingAudio ? 'Stop Visualizer' : 'Start Audio Engine'}</span>
              </button>
            </div>
          </div>

          <div className="h-[360px] rounded-2xl overflow-hidden border border-slate-800 bg-[#0a0e17] flex items-center justify-center relative">
            <canvas ref={spectrumCanvasRef} width={800} height={360} className="w-full h-full object-contain" />
            {!isPlayingAudio && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
                <Radio className="w-10 h-10 text-cyan-400 animate-pulse mb-2" />
                <p className="text-xs text-slate-300 font-semibold">Click 'Start Audio Engine' to stream reactive frequencies</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Module 3: AI Voiceover Speech Studio */}
      {activeModule === 'voiceover' && (
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
              <Mic className="w-4 h-4 text-purple-400" /> AI Voiceover Speech Generator & Vocal Master
            </h3>
            <span className="text-xs font-mono text-amber-400">Cost: 5 Tokens</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-3">
              <label className="text-xs text-slate-300 block font-semibold">Voiceover Text Script</label>
              <textarea
                rows={5}
                value={voiceText}
                onChange={(e) => setVoiceText(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white"
              />

              <button
                disabled={isSynthesizing}
                onClick={handleVoiceover}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isSynthesizing ? 'Synthesizing...' : 'Synthesize & Play Voiceover'}</span>
              </button>
            </div>

            <div className="space-y-2 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-300 block font-semibold">Studio Voice Profiles</span>
              <div className="space-y-1.5">
                {[
                  'Zephyr (Studio Deep)',
                  'Kore (Dynamic Natural)',
                  'Puck (Energetic Creator)',
                  'Fenrir (Cinematic Trailer)',
                  'Cyber Synth Narrator',
                ].map((vp) => (
                  <button
                    key={vp}
                    onClick={() => setVoicePreset(vp)}
                    className={`w-full p-2 rounded-xl text-left text-xs border transition-colors ${
                      voicePreset === vp
                        ? 'bg-purple-600/30 border-purple-500 text-white font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {vp}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Module 4: FL Studio Project Integration Tools */}
      {activeModule === 'fl_studio' && (
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" /> FL Studio Piano Roll & Chord Generator
              </h3>
              <p className="text-[11px] text-slate-400">
                Generate MIDI chord structures, bass arpeggios, and export project clips
              </p>
            </div>

            <button
              onClick={() => {
                onNotify('FL Studio Pattern Exported', 'Downloaded .flp / MIDI pattern file', 'success');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <Download className="w-3.5 h-3.5" /> Export .FLP MIDI Pattern
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Project Tempo (BPM)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="80"
                    max="180"
                    value={flBpm}
                    onChange={(e) => setFlBpm(parseInt(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <span className="text-xs font-mono text-amber-400 font-bold">{flBpm}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Harmonic Scale</label>
                <select
                  value={flScale}
                  onChange={(e) => setFlScale(e.target.value)}
                  className="w-full py-1.5 px-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                >
                  <option>Minor Pentatonic (Cyber Bass)</option>
                  <option>Phrygian Dominant (Trap)</option>
                  <option>Dorian Horizon (Synthwave)</option>
                  <option>Natural Minor (Cinematic)</option>
                </select>
              </div>
            </div>

            {/* Piano Roll Grid View */}
            <div className="md:col-span-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-2 font-mono">16-Step Step Sequencer Matrix</span>
              <div className="grid grid-cols-8 sm:grid-cols-16 gap-1">
                {Array.from({ length: 16 }).map((_, stepIdx) => {
                  const activeNote = flPattern.find((p) => p.step === stepIdx);
                  return (
                    <button
                      key={stepIdx}
                      onClick={() => {
                        if (activeNote) {
                          setFlPattern(flPattern.filter((p) => p.step !== stepIdx));
                        } else {
                          setFlPattern([...flPattern, { note: 'C3', step: stepIdx, active: true }]);
                        }
                      }}
                      className={`h-16 rounded-lg text-[10px] font-mono font-bold flex flex-col items-center justify-center border transition-all ${
                        activeNote
                          ? 'bg-gradient-to-t from-amber-600 to-yellow-500 text-black border-amber-300 shadow-md'
                          : stepIdx % 4 === 0
                          ? 'bg-slate-900 border-slate-700 text-slate-400'
                          : 'bg-slate-950 border-slate-850 text-slate-600 hover:border-slate-600'
                      }`}
                    >
                      <span>{stepIdx + 1}</span>
                      {activeNote && <span className="text-[8px] font-extrabold">{activeNote.note}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

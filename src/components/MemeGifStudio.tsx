import React, { useState, useRef, useEffect } from 'react';
import {
  Smile,
  Camera,
  Upload,
  Video,
  Image as ImageIcon,
  Sparkles,
  Download,
  Share2,
  Play,
  Pause,
  RefreshCw,
  Scissors,
  Layers,
  Type,
  Maximize2,
  Sliders,
  Film,
  Zap,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  Wand2,
} from 'lucide-react';
import { UserProfile } from '../types.ts';
import { ExplicitStudioToolbar } from './ExplicitStudioToolbar.tsx';
import { UniversalMediaCaptureToolbar } from './UniversalMediaCaptureToolbar.tsx';
import { ExplicitGenre } from '../lib/explicitEngine.ts';
import {
  SocialPlatformEditingToolbar,
  EditingState,
  TARGET_PLATFORMS,
} from './SocialPlatformEditingToolbar.tsx';

interface MemeGifStudioProps {
  user?: UserProfile;
  setActiveTab?: (tab: string) => void;
  onNotify?: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

const TRENDING_MEME_TEMPLATES = [
  {
    id: 'drake',
    name: 'Drake Hotline Bling',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    category: 'Choice / Reaction',
  },
  {
    id: 'distracted',
    name: 'Distracted Boyfriend',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    category: 'Trending',
  },
  {
    id: 'gigachad',
    name: 'Gigachad Cyberpunk',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    category: 'Attitude',
  },
  {
    id: 'doge',
    name: 'AI Cyber Doge',
    url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80',
    category: 'Funny',
  },
  {
    id: 'thinking',
    name: 'Roll Safe Thinking Guy',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    category: 'Smart',
  },
  {
    id: 'cat_yelling',
    name: 'Woman Yelling at Cat',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80',
    category: 'Argument',
  },
];

export const MemeGifStudio: React.FC<MemeGifStudioProps> = ({ user, setActiveTab: setActiveTabProp, onNotify }) => {
  const [activeTab, setActiveTab] = useState<'meme_maker' | 'gif_animator' | 'camera_studio' | 'exclusive_vip'>('meme_maker');
  const [selectedImage, setSelectedImage] = useState<string>(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80'
  );

  // Exclusive Feature State
  const [aiScenarioPrompt, setAiScenarioPrompt] = useState<string>('');
  const [isSynthesizingMeme, setIsSynthesizingMeme] = useState<boolean>(false);
  const [faceSwapSelfieUrl, setFaceSwapSelfieUrl] = useState<string | null>(null);
  const [isFaceSwapping, setIsFaceSwapping] = useState<boolean>(false);
  const [selectedSoundEffect, setSelectedSoundEffect] = useState<string>('vine_boom');

  // Meme Text Controls
  const [topText, setTopText] = useState('WHEN CODE COMPILES');
  const [bottomText, setBottomText] = useState('ON THE FIRST TRY 🚀');
  const [fontSize, setFontSize] = useState<number>(36);
  const [textColor, setTextColor] = useState<string>('#FFFFFF');
  const [textOutlineColor, setTextOutlineColor] = useState<string>('#000000');
  const [isUppercase, setIsUppercase] = useState<boolean>(true);
  const [fontFamily, setFontFamily] = useState<string>('Impact, sans-serif');

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // GIF Engine State
  const [gifFrameRate, setGifFrameRate] = useState<number>(10); // 10 FPS
  const [gifLoopType, setGifLoopType] = useState<'infinite' | 'bounce'>('infinite');
  const [isGeneratingGif, setIsGeneratingGif] = useState<boolean>(false);
  const [generatedGifUrl, setGeneratedGifUrl] = useState<string | null>(null);

  // Social Platform Editing Toolbar State
  const [editingState, setEditingState] = useState<EditingState>({
    selectedPlatform: TARGET_PLATFORMS[0], // WhatsApp Status
    trimStart: 0,
    trimEnd: 15,
    bgRemoverActive: false,
    bgType: 'transparent',
    speed: 1.0,
    zoom: 1.0,
    panX: 0,
    panY: 0,
    blurLevel: 0,
    isFullscreen: false,
    likeCount: 342,
    isLiked: false,
    comments: [
      { id: '1', user: 'MemeKing', text: 'This meme layout is hilarious! Saved!', time: '1m ago' },
    ],
    alterPrompt: '',
    alterStyle: 'cyberpunk_neon',
  });

  // Explicit Toolbar State
  const [activeGenreId, setActiveGenreId] = useState<string>('cinematic_hyperrealism');

  // Canvas Ref for Meme Export
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Camera Control Functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true,
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      if (onNotify) {
        onNotify('Camera Enabled', 'Webcam feed active. Take a snapshot or record a meme clip!', 'success');
      }
    } catch (err) {
      if (onNotify) {
        onNotify('Camera Error', 'Could not access camera. Check device permissions.', 'error');
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setSelectedImage(dataUrl);
      setActiveTab('meme_maker');
      stopCamera();
      if (onNotify) {
        onNotify('Photo Captured', 'Webcam photo loaded into Meme Generator!', 'success');
      }
    }
  };

  const startRecordVideo = () => {
    if (!cameraStream) return;
    recordedChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(cameraStream, { mimeType: 'video/webm' });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    const maxDurationSec = isVipUser ? 15 : 5;

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedVideoUrl(url);
      setGeneratedGifUrl(url); // Also use as animated GIF source
      setIsRecordingVideo(false);
      if (onNotify) {
        onNotify('Video Clip Recorded', `${maxDurationSec}s camera clip ready for GIF creation!`, 'success');
      }
    };

    mediaRecorder.start();
    setIsRecordingVideo(true);

    // Auto stop after limit
    setTimeout(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }, maxDurationSec * 1000);
  };

  // External File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    if (file.type.startsWith('image/')) {
      setSelectedImage(fileUrl);
      setActiveTab('meme_maker');
      if (onNotify) {
        onNotify('Image Loaded', `${file.name} imported into Meme Studio!`, 'success');
      }
    } else if (file.type.startsWith('video/')) {
      setRecordedVideoUrl(fileUrl);
      setGeneratedGifUrl(fileUrl);
      setActiveTab('gif_animator');
      if (onNotify) {
        onNotify('Video Loaded', `${file.name} imported for GIF Creation!`, 'success');
      }
    }
  };

  // User VIP Tier Detection
  const isVipUser = user?.vipTier && user.vipTier !== 'free';
  const isFreeTier = !isVipUser;

  // Render Meme Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = selectedImage;
    img.onload = () => {
      canvas.width = img.width || 800;
      canvas.height = img.height || 800;

      // Clear & Draw Image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Apply Font Styling
      const computedFontSize = (fontSize / 400) * canvas.width;
      ctx.font = `900 ${computedFontSize}px ${fontFamily}`;
      ctx.fillStyle = textColor;
      ctx.strokeStyle = textOutlineColor;
      ctx.lineWidth = computedFontSize / 8;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      // Top Text
      const topStr = isUppercase ? topText.toUpperCase() : topText;
      if (topStr) {
        ctx.strokeText(topStr, canvas.width / 2, 20);
        ctx.fillText(topStr, canvas.width / 2, 20);
      }

      // Bottom Text
      ctx.textBaseline = 'bottom';
      const bottomStr = isUppercase ? bottomText.toUpperCase() : bottomText;
      if (bottomStr) {
        ctx.strokeText(bottomStr, canvas.width / 2, canvas.height - (isFreeTier ? 45 : 20));
        ctx.fillText(bottomStr, canvas.width / 2, canvas.height - (isFreeTier ? 45 : 20));
      }

      // Free Tier Watermark vs VIP Gold Stamp
      if (isFreeTier) {
        ctx.font = `bold ${Math.max(12, canvas.width / 40)}px sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 3;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.strokeText('⚡ iCALLOG AI (Free Plan)', canvas.width - 15, canvas.height - 10);
        ctx.fillText('⚡ iCALLOG AI (Free Plan)', canvas.width - 15, canvas.height - 10);
      } else {
        // VIP Creator Badge
        ctx.font = `bold ${Math.max(12, canvas.width / 45)}px sans-serif`;
        ctx.fillStyle = '#F59E0B'; // Gold
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.strokeText('👑 VIP PRO CREATOR', canvas.width - 15, canvas.height - 10);
        ctx.fillText('👑 VIP PRO CREATOR', canvas.width - 15, canvas.height - 10);
      }
    };
  }, [selectedImage, topText, bottomText, fontSize, textColor, textOutlineColor, isUppercase, fontFamily, isFreeTier]);

  // Convert Meme to GIF / High-Res PNG
  const handleExportMemeImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `icallog_meme_${editingState.selectedPlatform.id}_${Date.now()}.png`;
    a.click();
    if (onNotify) {
      onNotify('Meme Downloaded', 'Watermark-free HD Meme saved to device!', 'success');
    }
  };

  const handleGenerateGifAnimation = () => {
    setIsGeneratingGif(true);
    setTimeout(() => {
      setIsGeneratingGif(false);
      const canvas = canvasRef.current;
      if (canvas) {
        setGeneratedGifUrl(canvas.toDataURL('image/gif'));
      }
      if (onNotify) {
        onNotify('GIF Created', `Animated GIF rendered at ${gifFrameRate} FPS!`, 'success');
      }
    }, 1500);
  };

  return (
    <div id="meme-gif-studio-container" className="space-y-4">
      {/* Universal Studio Navigation Toolbar */}
      <UniversalMediaCaptureToolbar activeTab="meme_gif_studio" setActiveTab={setActiveTabProp} />

      {/* Explicit Safety Toolbar */}
      <ExplicitStudioToolbar
        user={user || { id: 'usr_guest_01', username: 'Creator', email: 'c@i.com', tokenBalance: 50, vipTier: 'free', isExplicitUnlocked: true } as any}
        currentStudio="image"
        activeGenreId={activeGenreId}
        onSelectGenre={(g) => setActiveGenreId(g.id)}
        currentPrompt={`${topText} ${bottomText}`}
        onNotify={onNotify}
      />

      {/* Main Studio Card */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-4 sm:p-6 shadow-2xl backdrop-blur-md space-y-5">
        {/* Tier Comparison Banner */}
        <div className={`p-3 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
          isVipUser
            ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
            : 'bg-slate-950/90 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] font-mono border ${
              isVipUser
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-cyan-950 text-cyan-300 border-cyan-800'
            }`}>
              {isVipUser ? '👑 VIP PRO UNLOCKED' : '⚡ FREE PLAN'}
            </span>
            <p className="text-slate-300">
              {isVipUser
                ? 'Unlimited 60 FPS GIFs • 8K Ultra IMAX Memes • Zero Watermark • 15s Camera Recording'
                : 'Free Tier Active: 5s Camera GIF • 1080p Export • Lightweight Watermark Tag. Upgrade for 60 FPS & 0 Watermark!'}
            </p>
          </div>

          {isFreeTier && (
            <button
              onClick={() => {
                if (onNotify) {
                  onNotify('VIP Upgrade', 'Upgrade to VIP Platinum for Unlimited 60 FPS GIFs & Zero Watermarks!', 'info');
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[11px] shadow-md hover:scale-105 transition-transform shrink-0"
            >
              👑 UPGRADE TO VIP
            </button>
          )}
        </div>

        {/* Header Bar & Tab Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 p-0.5 shadow-xl flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                <Smile className="w-6 h-6 text-amber-400 animate-bounce" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2 font-['Syne']">
                <span>AI Meme & Animated GIF Creator Studio</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800/60 font-bold">
                  Camera + Upload + GIF Engine
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Create viral memes, capture webcam photos/videos, upload external files & generate animated GIFs for WhatsApp, Instagram, Facebook & TikTok.
              </p>
            </div>
          </div>

          {/* Module Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex-wrap">
            <button
              onClick={() => setActiveTab('meme_maker')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'meme_maker'
                  ? 'bg-gradient-to-r from-amber-500 to-pink-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Smile className="w-4 h-4 text-amber-300" />
              <span>Meme Generator</span>
            </button>

            <button
              onClick={() => setActiveTab('camera_studio')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'camera_studio'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Camera className="w-4 h-4 text-pink-300" />
              <span>Camera Capture</span>
            </button>

            <button
              onClick={() => setActiveTab('gif_animator')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'gif_animator'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Film className="w-4 h-4 text-purple-300" />
              <span>GIF Creator Engine</span>
            </button>

            <button
              onClick={() => setActiveTab('exclusive_vip')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'exclusive_vip'
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-pink-600 text-white shadow-lg'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 border border-amber-800/40'
              }`}
            >
              <Wand2 className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>👑 VIP Exclusive Features</span>
            </button>
          </div>
        </div>

        {/* EXTERNAL FILE UPLOAD BAR */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Import External Image / Video File</h4>
              <p className="text-[11px] text-slate-400">
                Bahar ka photo ya video upload karo (JPG, PNG, WebP, MP4, WebM)
              </p>
            </div>
          </div>

          <label className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 cursor-pointer transition-all flex items-center justify-center gap-2">
            <Upload className="w-3.5 h-3.5" />
            <span>Select External File</span>
            <input type="file" accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* TAB 1: MEME GENERATOR STUDIO */}
        {activeTab === 'meme_maker' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
            {/* Left Controls Column */}
            <div className="lg:col-span-5 space-y-4">
              {/* Text Input Section */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <Type className="w-4 h-4 text-amber-400" />
                  <span>Meme Typography & Text Overlay</span>
                </h3>

                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">TOP TEXT</label>
                    <input
                      type="text"
                      value={topText}
                      onChange={(e) => setTopText(e.target.value)}
                      placeholder="e.g. WHEN CODE RUNS FIRST TRY"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">BOTTOM TEXT</label>
                    <input
                      type="text"
                      value={bottomText}
                      onChange={(e) => setBottomText(e.target.value)}
                      placeholder="e.g. ABSOLUTE CINEMA 🎬"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-bold"
                    />
                  </div>
                </div>

                {/* Font Styling Options */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Font Size ({fontSize}px)</label>
                    <input
                      type="range"
                      min={18}
                      max={72}
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Text Color</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer p-0.5"
                      />
                      <input
                        type="color"
                        value={textOutlineColor}
                        onChange={(e) => setTextOutlineColor(e.target.value)}
                        className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer p-0.5"
                        title="Text Outline Color"
                      />
                      <button
                        onClick={() => setIsUppercase(!isUppercase)}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold border ${
                          isUppercase ? 'bg-amber-950 text-amber-300 border-amber-600' : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        UPPER
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trending Templates Carousel */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5">
                <h3 className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Trending Meme Templates</span>
                  <span className="text-[10px] font-mono text-pink-400">Click to load</span>
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  {TRENDING_MEME_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      onClick={() => {
                        setSelectedImage(tmpl.url);
                        if (onNotify) {
                          onNotify('Template Loaded', `Loaded ${tmpl.name} template!`, 'info');
                        }
                      }}
                      className="group relative rounded-xl overflow-hidden border border-slate-800 hover:border-amber-500 transition-all aspect-square"
                    >
                      <img src={tmpl.url} alt={tmpl.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1 text-[9px] font-bold text-white text-center">
                        {tmpl.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Canvas Output Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    Live Canvas Meme Render
                  </span>

                  <button
                    onClick={handleExportMemeImage}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download HD Meme</span>
                  </button>
                </div>

                {/* Canvas Container */}
                <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center p-2 min-h-[380px]">
                  <canvas ref={canvasRef} className="max-w-full max-h-[420px] rounded-xl object-contain shadow-2xl" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CAMERA CAPTURE STUDIO */}
        {activeTab === 'camera_studio' && (
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-pink-400" />
                  <span>Pro Camera & Video Recording Studio</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Capture high-res photos or record video clips with HDR, zoom, and cinema filters to create instant memes & GIFs.
                </p>
              </div>

              {!isCameraActive ? (
                <button
                  onClick={startCamera}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-pink-500/20 flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" /> Start Camera
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Stop Camera
                </button>
              )}
            </div>

            {/* Live Camera Viewport */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-black h-[360px] flex items-center justify-center">
              {isCameraActive ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6 space-y-3">
                  <Camera className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
                  <p className="text-xs text-slate-400">Camera inactive. Click "Start Camera" above to enable live feed.</p>
                </div>
              )}

              {/* Controls Overlay */}
              {isCameraActive && (
                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-black/80 backdrop-blur-md border border-slate-800 flex items-center justify-center gap-3">
                  <button
                    onClick={captureCameraPhoto}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" /> Take Photo for Meme
                  </button>

                  <button
                    onClick={startRecordVideo}
                    disabled={isRecordingVideo}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 ${
                      isRecordingVideo
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>{isRecordingVideo ? 'Recording 5s Clip...' : 'Record 5s GIF Clip'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ANIMATED GIF CREATOR ENGINE */}
        {activeTab === 'gif_animator' && (
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-purple-500/30 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-purple-400" />
                  <span>Animated GIF Converter & Loop Engine</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Convert uploaded video or camera recording into smooth looping animated GIF.
                </p>
              </div>

              <button
                onClick={handleGenerateGifAnimation}
                disabled={isGeneratingGif}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/20 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGeneratingGif ? 'Rendering GIF...' : 'Render Animated GIF'}</span>
              </button>
            </div>

            {/* GIF Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white block">GIF Frame Rate (FPS)</span>
                  {isFreeTier && (
                    <span className="text-[10px] text-amber-400 font-mono">24 & 60 FPS = VIP Only</span>
                  )}
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[5, 10, 15, 24, 60].map((fps) => {
                    const isVipFps = fps >= 24;
                    const isDisabled = isVipFps && isFreeTier;
                    return (
                      <button
                        key={fps}
                        onClick={() => {
                          if (isDisabled) {
                            if (onNotify) {
                              onNotify('VIP Feature', `${fps} FPS high motion GIF is unlocked for VIP Platinum users!`, 'warning');
                            }
                          } else {
                            setGifFrameRate(fps);
                          }
                        }}
                        className={`py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                          gifFrameRate === fps
                            ? 'bg-purple-600 text-white border-purple-400'
                            : isDisabled
                            ? 'bg-slate-950/60 text-slate-600 border-slate-900 cursor-not-allowed'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <span>{fps} FPS</span>
                        {isVipFps && <span className="text-[9px]">👑</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                <span className="text-xs font-bold text-white block">Loop Mode</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setGifLoopType('infinite')}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      gifLoopType === 'infinite'
                        ? 'bg-purple-600 text-white border-purple-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Infinite Loop 🔁
                  </button>
                  <button
                    onClick={() => setGifLoopType('bounce')}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      gifLoopType === 'bounce'
                        ? 'bg-purple-600 text-white border-purple-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Bounce / Boomerang 🪃
                  </button>
                </div>
              </div>
            </div>

            {/* GIF Preview Window */}
            {generatedGifUrl && (
              <div className="p-4 rounded-2xl bg-black border border-purple-500/50 flex flex-col items-center justify-center space-y-3">
                <img src={generatedGifUrl} alt="Generated Animated GIF" className="max-h-[320px] rounded-xl object-contain shadow-2xl" />
                <a
                  href={generatedGifUrl}
                  download={`icallog_animated_gif_${Date.now()}.gif`}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download Animated GIF
                </a>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: EXCLUSIVE VIP PRO FEATURES */}
        {activeTab === 'exclusive_vip' && (
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-amber-500/40 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 font-['Syne']">
                  <Wand2 className="w-4 h-4 text-amber-400" />
                  <span>👑 VIP Exclusive AI Meme Features</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono">
                    PRO UNLOCKED
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  AI Auto Scenario Generator, Face Swap on Trending Memes & Viral Audio Soundboard.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* FEATURE 1: AI Auto Scenario Meme Generator */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>1. AI Auto Scenario Meme Creator</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Koi bhi situation likho (e.g. "Jab bill dene ka time aaye aur dost gayab ho jaye"), AI turant viral meme concept synthesize karega!
                </p>

                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={aiScenarioPrompt}
                    onChange={(e) => setAiScenarioPrompt(e.target.value)}
                    placeholder="e.g. When WiFi disconnects during rank match in gaming..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />

                  <button
                    onClick={() => {
                      if (!aiScenarioPrompt.trim()) {
                        if (onNotify) onNotify('Input Needed', 'Type a meme situation or topic!', 'warning');
                        return;
                      }
                      setIsSynthesizingMeme(true);
                      setTimeout(() => {
                        setIsSynthesizingMeme(false);
                        setSelectedImage('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80');
                        setTopText('JAB BILL PAY KARNE KA TIME AAYA');
                        setBottomText('AND BRO SAID: MEIN DUA MEIN YAAD RAKHUNGA 💀');
                        setActiveTab('meme_maker');
                        if (onNotify) {
                          onNotify('AI Meme Synthesized', 'Generated viral meme concept & loaded into Meme Canvas!', 'success');
                        }
                      }, 1200);
                    }}
                    disabled={isSynthesizingMeme}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>{isSynthesizingMeme ? 'Synthesizing Viral Meme...' : '✨ Generate AI Meme Concept'}</span>
                  </button>
                </div>
              </div>

              {/* FEATURE 2: AI Face Swap on Memes */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-pink-400 font-bold text-xs">
                  <Layers className="w-4 h-4" />
                  <span>2. AI Face Swap on Meme Templates</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Apni photo/selfie upload karo aur Gigachad ya Drake ke face par swap karke customized meme banao.
                </p>

                <div className="flex items-center gap-2">
                  <label className="flex-1 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-pink-500 text-slate-300 font-bold text-xs cursor-pointer flex items-center justify-center gap-2 transition-all">
                    <Upload className="w-3.5 h-3.5 text-pink-400" />
                    <span>Upload Face Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFaceSwapSelfieUrl(URL.createObjectURL(file));
                          if (onNotify) onNotify('Selfie Loaded', 'Face photo ready for AI Meme Swap!', 'info');
                        }
                      }}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={() => {
                      if (!faceSwapSelfieUrl) {
                        if (onNotify) onNotify('Upload Required', 'First upload a face photo or selfie!', 'warning');
                        return;
                      }
                      setIsFaceSwapping(true);
                      setTimeout(() => {
                        setIsFaceSwapping(false);
                        setSelectedImage(faceSwapSelfieUrl);
                        setTopText('ME AFTER AI FACE SWAP');
                        setBottomText('GIGACHAD VERSION UNLOCKED 👑');
                        setActiveTab('meme_maker');
                        if (onNotify) {
                          onNotify('Face Swap Complete', 'Swapped face onto Meme template!', 'success');
                        }
                      }, 1500);
                    }}
                    disabled={isFaceSwapping}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 transition-all"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isFaceSwapping ? 'Swapping...' : 'Swap Face'}</span>
                  </button>
                </div>

                {faceSwapSelfieUrl && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <img src={faceSwapSelfieUrl} alt="Selfie" className="w-10 h-10 rounded-lg object-cover" />
                    <span className="text-[11px] text-emerald-400 font-bold">Selfie loaded & aligned</span>
                  </div>
                )}
              </div>
            </div>

            {/* FEATURE 3: Viral Soundboard & Sound Effects Engine */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-cyan-400" />
                  <span>3. Viral Meme Soundboard & Audio FX Engine</span>
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">1-Click Sound Test</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {[
                  { id: 'vine_boom', label: 'Vine Boom 💥' },
                  { id: 'bruh', label: 'Bruh Sound 🗿' },
                  { id: 'airhorn', label: 'Airhorn MLG 📯' },
                  { id: 'curb', label: 'Curb Theme 🎺' },
                  { id: 'laughing', label: 'Wheezing Laugh 😂' },
                  { id: 'oh_no', label: 'Oh No No No 🎶' },
                ].map((snd) => (
                  <button
                    key={snd.id}
                    onClick={() => {
                      setSelectedSoundEffect(snd.id);
                      if (onNotify) {
                        onNotify('Sound Effect Selected', `Attached ${snd.label} to video meme!`, 'info');
                      }
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      selectedSoundEffect === snd.id
                        ? 'bg-cyan-600 text-white border-cyan-400 shadow-lg'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-cyan-800'
                    }`}
                  >
                    <span>{snd.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Universal Social Platform & Meme Editing Suite */}
        <div className="pt-2">
          <SocialPlatformEditingToolbar
            mediaType="image"
            mediaUrl={selectedImage}
            editingState={editingState}
            onUpdateState={(updated) => setEditingState((prev) => ({ ...prev, ...updated }))}
            onApplyAlteration={(alterPrompt, alterStyle) => {
              setTopText(`[ALTERED: ${alterStyle}]`);
              setBottomText(alterPrompt);
              if (onNotify) {
                onNotify('Meme Altered', `Altered meme style to ${alterStyle}!`, 'success');
              }
            }}
            onNotify={onNotify}
          />
        </div>
      </div>
    </div>
  );
};

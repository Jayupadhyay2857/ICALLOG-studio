import React, { useState } from 'react';
import {
  Share2,
  ThumbsUp,
  MessageSquare,
  Flag,
  Download,
  Scissors,
  Eye,
  Maximize2,
  Minimize2,
  Gauge,
  Sparkles,
  Zap,
  Sliders,
  Crop,
  Layers,
  Wand2,
  ZoomIn,
  ZoomOut,
  Eraser,
  Sun,
  Video,
  Image as ImageIcon,
  Check,
  X,
  Send,
  Lock,
  Copy,
  CheckCircle2,
  Film,
  Aperture,
  Palette,
} from 'lucide-react';

export interface TargetPlatformPreset {
  id: string;
  name: string;
  icon: string;
  aspectRatio: string;
  resolution: string;
  maxDuration: string;
  recommendedFps: number;
  badge: string;
  description: string;
}

export const TARGET_PLATFORMS: TargetPlatformPreset[] = [
  {
    id: 'whatsapp_status',
    name: 'WhatsApp Status',
    icon: '💬',
    aspectRatio: '9:16',
    resolution: '1080 × 1920',
    maxDuration: '30s',
    recommendedFps: 30,
    badge: 'Popular',
    description: 'Vertical 9:16 status & story format',
  },
  {
    id: 'instagram_reel',
    name: 'Instagram Reel / Story',
    icon: '📸',
    aspectRatio: '9:16',
    resolution: '1080 × 1920',
    maxDuration: '90s',
    recommendedFps: 60,
    badge: 'Trending',
    description: 'High engagement vertical motion',
  },
  {
    id: 'instagram_post',
    name: 'Instagram Feed / Post',
    icon: '📷',
    aspectRatio: '1:1',
    resolution: '1080 × 1080',
    maxDuration: '60s',
    recommendedFps: 30,
    badge: 'Classic',
    description: 'Square 1:1 crisp feed carousel',
  },
  {
    id: 'facebook_reel',
    name: 'Facebook Video / Reel',
    icon: '📘',
    aspectRatio: '16:9',
    resolution: '1920 × 1080',
    maxDuration: '3m',
    recommendedFps: 30,
    badge: 'Viral',
    description: 'Landscape & vertical FB video',
  },
  {
    id: 'youtube_shorts',
    name: 'YouTube Shorts',
    icon: '🔴',
    aspectRatio: '9:16',
    resolution: '1080 × 1920',
    maxDuration: '60s',
    recommendedFps: 60,
    badge: 'Shorts',
    description: 'Vertical YouTube feed algorithm',
  },
  {
    id: 'youtube_video',
    name: 'YouTube Main Video',
    icon: '📺',
    aspectRatio: '16:9',
    resolution: '3840 × 2160 (4K)',
    maxDuration: 'Unlimited',
    recommendedFps: 60,
    badge: '4K Ultra',
    description: 'Cinema landscape broadcast',
  },
  {
    id: 'tiktok_video',
    name: 'TikTok Feed',
    icon: '🎵',
    aspectRatio: '9:16',
    resolution: '1080 × 1920',
    maxDuration: '3m',
    recommendedFps: 60,
    badge: 'Viral',
    description: 'High dynamic vertical feed',
  },
  {
    id: 'twitter_x',
    name: 'Twitter / X Post',
    icon: '🐦',
    aspectRatio: '16:9',
    resolution: '1280 × 720',
    maxDuration: '2m',
    recommendedFps: 30,
    badge: 'News',
    description: 'Responsive media timeline clip',
  },
  {
    id: 'linkedin_post',
    name: 'LinkedIn Professional',
    icon: '💼',
    aspectRatio: '1:1',
    resolution: '1080 × 1080',
    maxDuration: '10m',
    recommendedFps: 30,
    badge: 'Corporate',
    description: 'Professional square/HD clip',
  },
  {
    id: 'custom_canvas',
    name: 'Custom Cinema Spec',
    icon: '🎬',
    aspectRatio: '21:9',
    resolution: '7680 × 4320 (8K)',
    maxDuration: 'Master',
    recommendedFps: 60,
    badge: 'Pro 8K',
    description: 'UltraWide IMAX cinematic format',
  },
];

export interface EditingState {
  selectedPlatform: TargetPlatformPreset;
  trimStart: number; // in seconds
  trimEnd: number; // in seconds
  bgRemoverActive: boolean;
  bgType: 'transparent' | 'blur' | 'green_screen' | 'ai_scene';
  speed: number; // 0.25 (slomo) to 4 (fast forward)
  zoom: number; // 1 to 5
  panX: number; // -50 to 50
  panY: number; // -50 to 50
  blurLevel: number; // 0 to 20px
  isFullscreen: boolean;
  likeCount: number;
  isLiked: boolean;
  comments: { id: string; user: string; text: string; time: string }[];
  alterPrompt: string;
  alterStyle: string;
}

interface SocialPlatformEditingToolbarProps {
  mediaType: 'video' | 'image' | 'video_image_blend' | 'film';
  mediaUrl?: string;
  editingState: EditingState;
  onUpdateState: (updated: Partial<EditingState>) => void;
  onApplyAlteration?: (alterPrompt: string, alterStyle: string) => void;
  onNotify?: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const SocialPlatformEditingToolbar: React.FC<SocialPlatformEditingToolbarProps> = ({
  mediaType,
  mediaUrl,
  editingState,
  onUpdateState,
  onApplyAlteration,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'platform' | 'edit_tools' | 'alter_film' | 'social'>('platform');
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Inappropriate Content');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleLikeToggle = () => {
    const nextLiked = !editingState.isLiked;
    onUpdateState({
      isLiked: nextLiked,
      likeCount: nextLiked ? editingState.likeCount + 1 : Math.max(0, editingState.likeCount - 1),
    });
    if (onNotify) {
      onNotify('Engagement', nextLiked ? 'Liked this creation!' : 'Unliked', 'info');
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const newComment = {
      id: `c-${Date.now()}`,
      user: 'You (Creator)',
      text: newCommentText.trim(),
      time: 'Just now',
    };
    onUpdateState({
      comments: [newComment, ...editingState.comments],
    });
    setNewCommentText('');
    setIsCommentModalOpen(false);
    if (onNotify) {
      onNotify('Comment Added', 'Your feedback was posted to this creation.', 'success');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    if (onNotify) {
      onNotify('Link Copied', 'Direct share link copied to clipboard.', 'success');
    }
  };

  return (
    <div className="w-full bg-slate-950/90 border border-slate-800 rounded-3xl p-4 space-y-4 shadow-2xl backdrop-blur-md">
      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('platform')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'platform'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>🎯 Target Platform</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-950/60 text-cyan-300">
              {editingState.selectedPlatform.name.split(' ')[0]}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('edit_tools')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'edit_tools'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Edit & FX Tools</span>
          </button>

          <button
            onClick={() => setActiveTab('alter_film')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'alter_film'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-pink-400" />
            <span>AI Video Alteration</span>
          </button>

          <button
            onClick={() => setActiveTab('social')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'social'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Social & Engagement</span>
          </button>
        </div>

        {/* Quick Social Action Icons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLikeToggle}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              editingState.isLiked
                ? 'bg-pink-950/80 border-pink-500/80 text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.3)]'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${editingState.isLiked ? 'fill-pink-400 text-pink-400' : ''}`} />
            <span>{editingState.likeCount}</span>
          </button>

          <button
            onClick={() => setIsCommentModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>{editingState.comments.length}</span>
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:border-emerald-500/60 hover:text-emerald-400 transition-all"
            title="Share Video / Image to WhatsApp, Instagram, Facebook"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onUpdateState({ isFullscreen: !editingState.isFullscreen })}
            className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-500/50 text-indigo-300 hover:text-white transition-all shadow-md"
            title="Toggle Fullscreen Cinema Mode"
          >
            {editingState.isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* TAB 1: TARGET PLATFORM SELECTOR */}
      {activeTab === 'platform' && (
        <div className="space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <span>Select Target Platform for Creation</span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-800/60">
                  Auto-Optimizes Aspect Ratio & Resolution
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Aap kis app ke liye bana rahe ho? Select WhatsApp, Instagram Reel, Facebook, YouTube Shorts, or TikTok.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {TARGET_PLATFORMS.map((platform) => {
              const isSelected = editingState.selectedPlatform.id === platform.id;
              return (
                <button
                  key={platform.id}
                  onClick={() => {
                    onUpdateState({ selectedPlatform: platform });
                    if (onNotify) {
                      onNotify(
                        'Platform Preset Applied',
                        `Optimized specs for ${platform.name} (${platform.aspectRatio}, ${platform.resolution})`,
                        'success'
                      );
                    }
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between group ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] scale-[1.02]'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{platform.icon}</span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full border ${
                        isSelected
                          ? 'bg-cyan-900/90 text-cyan-300 border-cyan-500'
                          : 'bg-slate-950/80 text-slate-400 border-slate-800'
                      }`}
                    >
                      {platform.badge}
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {platform.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {platform.aspectRatio} • {platform.resolution}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: EDITING TOOLS (Trimming, Speed/Slomo, BG Remover, Zoom, Blur) */}
      {activeTab === 'edit_tools' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-fadeIn">
          {/* Tool 1: Video Trimming & Timeline */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-pink-400" />
                Video Trimmer & Cut
              </span>
              <span className="text-[10px] font-mono text-pink-300 bg-pink-950 px-2 py-0.5 rounded-full border border-pink-800/60">
                {editingState.trimStart}s - {editingState.trimEnd}s ({editingState.trimEnd - editingState.trimStart}s total)
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Start Cut: {editingState.trimStart}s</span>
                <span>End Cut: {editingState.trimEnd}s</span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(15, editingState.trimEnd - 1)}
                value={editingState.trimStart}
                onChange={(e) => onUpdateState({ trimStart: Number(e.target.value) })}
                className="w-full accent-pink-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <input
                type="range"
                min={editingState.trimStart + 1}
                max={60}
                value={editingState.trimEnd}
                onChange={(e) => onUpdateState({ trimEnd: Number(e.target.value) })}
                className="w-full accent-pink-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          </div>

          {/* Tool 2: Speed Controls & Slow Motion */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                Playback Speed & Slow-Mo
              </span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-800/60 font-bold">
                {editingState.speed === 0.25 ? '0.25x Ultra Slomo' : editingState.speed === 0.5 ? '0.5x Smooth Slomo' : `${editingState.speed}x Speed`}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1">
              {[0.25, 0.5, 1.0, 1.5, 2.0].map((s) => (
                <button
                  key={s}
                  onClick={() => onUpdateState({ speed: s })}
                  className={`py-1 rounded-xl text-[10px] font-mono font-bold border transition-all ${
                    editingState.speed === s
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Tool 3: Background Remover & Magic Eraser */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Eraser className="w-3.5 h-3.5 text-purple-400" />
                AI BG Remover & Magic Eraser
              </span>
              <button
                onClick={() => onUpdateState({ bgRemoverActive: !editingState.bgRemoverActive })}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border transition-all ${
                  editingState.bgRemoverActive
                    ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                {editingState.bgRemoverActive ? 'ENABLED' : 'OFF'}
              </button>
            </div>

            {editingState.bgRemoverActive && (
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'transparent', label: 'Transparent BG' },
                  { id: 'blur', label: 'Blur Background' },
                  { id: 'green_screen', label: 'Green Screen' },
                  { id: 'ai_scene', label: 'AI Cyberpunk Scene' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => onUpdateState({ bgType: type.id as any })}
                    className={`p-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                      editingState.bgType === type.id
                        ? 'bg-purple-950 text-purple-300 border-purple-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tool 4: Zoom & Pan Controls */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
                Camera Zoom ({editingState.zoom}x)
              </span>
              <button
                onClick={() => onUpdateState({ zoom: 1, panX: 0, panY: 0 })}
                className="text-[10px] font-mono text-slate-400 hover:text-white"
              >
                Reset
              </button>
            </div>

            <input
              type="range"
              min={1}
              max={5}
              step={0.1}
              value={editingState.zoom}
              onChange={(e) => onUpdateState({ zoom: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          {/* Tool 5: Privacy Blur & Gaussian Filter */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Aperture className="w-3.5 h-3.5 text-indigo-400" />
                Privacy & Face Blur ({editingState.blurLevel}px)
              </span>
              <span className="text-[10px] font-mono text-indigo-300">
                {editingState.blurLevel === 0 ? 'Clear' : 'Blur Active'}
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={20}
              value={editingState.blurLevel}
              onChange={(e) => onUpdateState({ blurLevel: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>
        </div>
      )}

      {/* TAB 3: FILMMAKING VIDEO ALTERATION */}
      {activeTab === 'alter_film' && (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-pink-500/30 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <Film className="w-4 h-4 text-pink-400" />
                <span>Filmmaking Video Alteration & Restyle Engine</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Alter scene mood, change weather, swap character styles, or re-direct video camera motion in real-time.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Video Alteration Prompt (What to change?)
              </label>
              <input
                type="text"
                value={editingState.alterPrompt}
                onChange={(e) => onUpdateState({ alterPrompt: e.target.value })}
                placeholder="e.g. Turn sunny afternoon into Cyberpunk neon rainy night scene with volumetric fog"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Cinematic Alter Style Preset
              </label>
              <select
                value={editingState.alterStyle}
                onChange={(e) => onUpdateState({ alterStyle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-pink-500"
              >
                <option value="cyberpunk_neon">Cyberpunk Neon City Swap</option>
                <option value="anime_ghibli">Studio Ghibli Hand-Drawn Anime</option>
                <option value="cinematic_noir">Cinematic Black & White Film Noir</option>
                <option value="slow_mo_rain">Slow Motion Rainy Atmosphere</option>
                <option value="vintage_80s">80s VHS Retro Analog Tape</option>
                <option value="hyper_real_3d">Hyper-Realistic Unreal Engine 5</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => {
              if (onApplyAlteration) {
                onApplyAlteration(editingState.alterPrompt, editingState.alterStyle);
              }
              if (onNotify) {
                onNotify('Video Alteration Dispatched', 'AI is modifying video clips according to your script rules.', 'success');
              }
            }}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-pink-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Apply AI Video Alteration & Render Clip</span>
          </button>
        </div>
      )}

      {/* TAB 4: SOCIAL ENGAGEMENT & DOWNLOAD */}
      {activeTab === 'social' && (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-amber-400" />
              <span>Social Engagement, Direct Share & Watermark-Free Export</span>
            </h3>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={handleLikeToggle}
                className="px-4 py-2 rounded-xl bg-pink-950/80 hover:bg-pink-900 border border-pink-500/80 text-pink-300 font-bold text-xs flex items-center gap-2 transition-all"
              >
                <ThumbsUp className={`w-4 h-4 ${editingState.isLiked ? 'fill-pink-400 text-pink-400' : ''}`} />
                <span>Like ({editingState.likeCount})</span>
              </button>

              <button
                onClick={() => setIsCommentModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs flex items-center gap-2 transition-all"
              >
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span>Comments ({editingState.comments.length})</span>
              </button>

              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-rose-400 font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Report</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1.5"
              >
                {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Share Link'}</span>
              </button>

              <a
                href={mediaUrl || '#'}
                download={`icallog_creation_${editingState.selectedPlatform.id}_${Date.now()}`}
                onClick={(e) => {
                  if (!mediaUrl) {
                    e.preventDefault();
                    if (onNotify) {
                      onNotify('Ready to Export', 'Generate or render media first to trigger instant file download.', 'info');
                    }
                  }
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Watermark-Free</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-cyan-400" />
                Share Creation directly to Apps
              </h3>
              <button onClick={() => setIsShareModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { name: 'WhatsApp', icon: '💬', color: 'hover:border-emerald-500 text-emerald-400' },
                { name: 'Instagram', icon: '📸', color: 'hover:border-pink-500 text-pink-400' },
                { name: 'Facebook', icon: '📘', color: 'hover:border-blue-500 text-blue-400' },
                { name: 'YouTube Shorts', icon: '🔴', color: 'hover:border-rose-500 text-rose-400' },
              ].map((app) => (
                <button
                  key={app.name}
                  onClick={() => {
                    handleCopyLink();
                    setIsShareModalOpen(false);
                  }}
                  className={`p-3 rounded-2xl bg-slate-950 border border-slate-800 text-left transition-all flex items-center gap-2.5 ${app.color}`}
                >
                  <span className="text-xl">{app.icon}</span>
                  <span className="text-xs font-bold text-white">{app.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* COMMENTS MODAL */}
      {isCommentModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                Comments & Community Feedback ({editingState.comments.length})
              </h3>
              <button onClick={() => setIsCommentModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {editingState.comments.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No comments yet. Be the first to comment!</p>
              ) : (
                editingState.comments.map((c) => (
                  <div key={c.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                    <div className="flex justify-between text-[10px] font-bold text-cyan-400 mb-1">
                      <span>{c.user}</span>
                      <span className="text-slate-500 font-mono">{c.time}</span>
                    </div>
                    <p className="text-slate-200">{c.text}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Post
              </button>
            </form>
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <Flag className="w-4 h-4 text-rose-400" />
                Report Media Content
              </h3>
              <button onClick={() => setIsReportModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-slate-300 font-bold block">Select Report Reason:</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
              >
                <option value="Inappropriate Content">Inappropriate Content</option>
                <option value="Copyright Violation">Copyright Violation</option>
                <option value="Low Quality Render">Low Quality Render Bug</option>
                <option value="Other">Other Safety Issue</option>
              </select>
            </div>

            <button
              onClick={() => {
                setIsReportModalOpen(false);
                if (onNotify) {
                  onNotify('Report Submitted', 'Thank you. Our moderation team has logged your feedback.', 'info');
                }
              }}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all"
            >
              Submit Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

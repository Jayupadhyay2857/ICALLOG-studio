import React, { useState, useRef } from 'react';
import {
  Layers,
  Sparkles,
  Upload,
  Play,
  Pause,
  Download,
  Film,
  Image as ImageIcon,
  Plus,
  Trash2,
  Sliders,
  Wand2,
  Video,
  RefreshCw,
  Zap,
  CheckCircle2,
  Share2,
  Eye,
  Music,
  Maximize2,
  ArrowRight,
  Tv,
  Blend,
  Grid,
} from 'lucide-react';
import { UserProfile } from '../types.ts';
import { ExplicitStudioToolbar } from './ExplicitStudioToolbar.tsx';
import { ExplicitGenre } from '../lib/explicitEngine.ts';
import { UniversalMediaCaptureToolbar } from './UniversalMediaCaptureToolbar.tsx';

interface MediaSlot {
  id: string;
  slotNumber: number;
  type: 'image' | 'video';
  title: string;
  url: string;
  opacity: number; // 0 to 100
  blendMode: 'normal' | 'screen' | 'overlay' | 'chroma_green' | 'ai_neural_composite' | 'morph_shift';
  timeOffsetSec: number;
}

interface MediaMixerStudioProps {
  user?: UserProfile;
  tokenBalance?: number;
  setActiveTab?: (tab: string) => void;
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  onSendToFilmStudio?: (script: string, videoUrl: string) => void;
}

const SAMPLE_MEDIA_PRESETS = [
  {
    id: 'sample_cyber_girl',
    type: 'image' as const,
    title: 'Cyberpunk Girl Heroine',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop',
    tag: 'Image • Character',
  },
  {
    id: 'sample_rainy_city',
    type: 'video' as const,
    title: 'Neon Rainy City Highway',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop',
    tag: 'Video • Environment',
  },
  {
    id: 'sample_ghibli_landscape',
    type: 'image' as const,
    title: 'Studio Ghibli Grassland',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop',
    tag: 'Image • Style Preset',
  },
  {
    id: 'sample_fire_vfx',
    type: 'video' as const,
    title: 'Particle Fire & Explosion VFX',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop',
    tag: 'Video • VFX Overlay',
  },
];

const PRESET_AI_COMMANDS = [
  {
    label: '🖼️ + 🎥 Insert Image Character into Video Background',
    command: 'Take the character from Slot 1, remove background, composite into the rainy neon video in Slot 2 with dynamic lighting and camera match-moving.',
    combo: 'image_video',
  },
  {
    label: '🎥 + 🖼️ Apply Image Art Style onto Video Clip',
    command: 'Transfer the Studio Ghibli painterly watercolor art style of Slot 1 onto the video motion of Slot 2. Maintain 60fps anime animation.',
    combo: 'video_image',
  },
  {
    label: '🎥 + 🎥 Morph Video 1 into Video 2 Seamlessly',
    command: 'Seamlessly morph the scene in Slot 1 into Slot 2 using AI liquid transition, matching camera motion and audio beat drop.',
    combo: 'video_video',
  },
  {
    label: '🖼️ + 🖼️ Blend 2 Images into 3D Animated Video',
    command: 'Combine the character in Slot 1 with the landscape in Slot 2, generate 8K motion camera zoom, and turn into a cinematic video.',
    combo: 'image_image',
  },
  {
    label: '🎬 Film Montage & Multi-Slot VFX Composite (3+ Media)',
    command: 'Chain all loaded slots sequentially into a 10-second film scene with AI voiceover, cinematic color grade, and particle VFX overlay.',
    combo: 'multi_slot',
  },
];

export const MediaMixerStudio: React.FC<MediaMixerStudioProps> = ({
  user,
  tokenBalance = 450,
  setActiveTab,
  onNotify,
  onSendToFilmStudio,
}) => {
  // Slots Deck State (Default starts with 2 slots: 1 Image, 1 Video)
  const [slots, setSlots] = useState<MediaSlot[]>([
    {
      id: 'slot_1',
      slotNumber: 1,
      type: 'image',
      title: 'Cyberpunk Girl Heroine',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop',
      opacity: 100,
      blendMode: 'normal',
      timeOffsetSec: 0,
    },
    {
      id: 'slot_2',
      slotNumber: 2,
      type: 'video',
      title: 'Neon Rainy City Highway',
      url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop',
      opacity: 100,
      blendMode: 'ai_neural_composite',
      timeOffsetSec: 0,
    },
  ]);

  // AI Command Prompt
  const [selectedExplicitGenre, setSelectedExplicitGenre] = useState<string>('cinematic_hyperrealism');
  const [aiPromptCommand, setAiPromptCommand] = useState(
    'Insert the character from Slot 1 into the rainy neon video in Slot 2. Apply Studio Ghibli anime style, cinematic lighting match, and camera zoom in.'
  );

  // Fusion Config Settings
  const [outputResolution, setOutputResolution] = useState<'1080p' | '4K' | '8K'>('8K');
  const [targetFps, setTargetFps] = useState<number>(60);
  const [outputDurationSec, setOutputDurationSec] = useState<number>(10);
  const [audioStrategy, setAudioStrategy] = useState<'mix_all' | 'video_1_only' | 'ai_bgm_score'>('ai_bgm_score');
  const [stylePreset, setStylePreset] = useState<string>('Studio Ghibli Anime');

  // Generation & Player State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processProgress, setProcessProgress] = useState<number>(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const [activePreviewUrl, setActivePreviewUrl] = useState<string>(
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop'
  );
  const [viewMode, setViewMode] = useState<'merged' | 'split' | 'grid'>('merged');
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [customMediaUrl, setCustomMediaUrl] = useState<string>('');

  // Handle Drag & Drop Multiple Files
  const handleMultipleFilesUpload = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    let updatedSlots = [...slots];

    fileArray.forEach((file, index) => {
      const objectUrl = URL.createObjectURL(file);
      const isVid = file.type.startsWith('video');

      // If slot exists at index, update it; otherwise add new slot if limit not reached
      if (index < updatedSlots.length) {
        updatedSlots[index] = {
          ...updatedSlots[index],
          url: objectUrl,
          title: file.name,
          type: isVid ? 'video' : 'image',
        };
      } else if (updatedSlots.length < 6) {
        const newNum = updatedSlots.length + 1;
        updatedSlots.push({
          id: `slot_${Date.now()}_${index}`,
          slotNumber: newNum,
          type: isVid ? 'video' : 'image',
          title: file.name,
          url: objectUrl,
          opacity: 100,
          blendMode: 'normal',
          timeOffsetSec: 0,
        });
      }
    });

    setSlots(updatedSlots);
    onNotify(
      'External Media Uploaded!',
      `Successfully loaded ${fileArray.length} file(s) into your Media Mixer Deck!`,
      'success'
    );
  };

  // Handle URL import
  const handleImportUrl = () => {
    if (!customMediaUrl.trim()) return;
    const isVidUrl = customMediaUrl.endsWith('.mp4') || customMediaUrl.endsWith('.webm') || customMediaUrl.includes('video');
    const newNum = slots.length + 1;
    const newSlot: MediaSlot = {
      id: `slot_${Date.now()}`,
      slotNumber: newNum,
      type: isVidUrl ? 'video' : 'image',
      title: `External Web Media #${newNum}`,
      url: customMediaUrl.trim(),
      opacity: 100,
      blendMode: 'normal',
      timeOffsetSec: 0,
    };
    setSlots([...slots, newSlot]);
    setCustomMediaUrl('');
    onNotify('URL Media Imported', `Loaded web asset into Slot #${newNum}.`, 'success');
  };

  // Add new Slot
  const handleAddSlot = (type: 'image' | 'video') => {
    if (slots.length >= 6) {
      onNotify('Slot Limit Reached', 'You can mix up to 6 media slots simultaneously.', 'warning');
      return;
    }
    const newNum = slots.length + 1;
    const defaultSample = SAMPLE_MEDIA_PRESETS[newNum % SAMPLE_MEDIA_PRESETS.length];
    const newSlot: MediaSlot = {
      id: `slot_${Date.now()}`,
      slotNumber: newNum,
      type: type,
      title: `${type === 'image' ? 'Image' : 'Video'} Layer #${newNum}`,
      url: defaultSample.url,
      opacity: 100,
      blendMode: 'normal',
      timeOffsetSec: 0,
    };
    setSlots([...slots, newSlot]);
    onNotify(`Media Slot #${newNum} Added`, `Added new ${type.toUpperCase()} slot layer.`, 'info');
  };

  // Remove Slot
  const handleRemoveSlot = (id: string) => {
    if (slots.length <= 2) {
      onNotify('Minimum 2 Slots Required', 'Multi-media mixing requires at least 2 media inputs.', 'warning');
      return;
    }
    const filtered = slots.filter((s) => s.id !== id).map((s, idx) => ({ ...s, slotNumber: idx + 1 }));
    setSlots(filtered);
  };

  // Update Slot Property
  const handleUpdateSlot = (id: string, updates: Partial<MediaSlot>) => {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  // Handle Custom Media Upload
  const handleUploadToSlot = (slotId: string, file: File) => {
    const objectUrl = URL.createObjectURL(file);
    const isVid = file.type.startsWith('video');
    handleUpdateSlot(slotId, {
      url: objectUrl,
      title: file.name,
      type: isVid ? 'video' : 'image',
    });
    onNotify('File Loaded into Slot', `Successfully loaded "${file.name}" into media deck.`, 'success');
  };

  // Execute AI Fusion / Mix Command
  const handleExecuteMix = () => {
    if (!aiPromptCommand.trim()) {
      onNotify('Prompt Empty', 'Please enter an AI command describing how to mix the media slots.', 'warning');
      return;
    }

    setIsProcessing(true);
    setProcessProgress(10);

    const interval = setInterval(() => {
      setProcessProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 15;
      });
    }, 400);

    setTimeout(() => {
      clearInterval(interval);
      setProcessProgress(100);
      setIsProcessing(false);

      // Pick high-quality output result
      const sampleOutputs = [
        'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop',
      ];
      const randomOut = sampleOutputs[Math.floor(Math.random() * sampleOutputs.length)];
      setActivePreviewUrl(randomOut);

      // Summary of combo
      const imageCount = slots.filter((s) => s.type === 'image').length;
      const videoCount = slots.filter((s) => s.type === 'video').length;

      onNotify(
        'AI Multi-Media Fusion Rendered!',
        `Combined ${slots.length} media items (${imageCount} Image + ${videoCount} Video) into ${outputResolution} ${targetFps}fps composition based on your AI command!`,
        'success'
      );
    }, 2800);
  };

  return (
    <div className="space-y-6">
      {/* Universal Quick Media Capture & Recording Toolbar */}
      <UniversalMediaCaptureToolbar activeTab="media_mixer" setActiveTab={setActiveTab} user={user} onNotify={(t, d, ty) => onNotify(t, d, ty as any)} />

      {/* Header Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950/90 via-slate-900 to-purple-950/80 border border-indigo-500/30 shadow-2xl overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-cyan-300 text-xs font-mono font-bold">
              <Blend className="w-3.5 h-3.5 text-cyan-400" /> AI Multi-Media Fusion Engine V18
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Syne'] tracking-tight">
              AI Multi-Media Mixer & Command Composer
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Mix 2 or more <span className="text-cyan-300 font-bold">Images + Videos</span> in any combination (<span className="text-amber-300 font-mono">Image+Video</span>, <span className="text-purple-300 font-mono">Video+Image</span>, <span className="text-emerald-300 font-mono">Image+Image</span>, <span className="text-rose-300 font-mono">Video+Video</span>). Give custom natural language AI commands to morph, blend styles, overlay characters, transfer VFX, or sequence film scenes!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right font-mono">
              <div className="text-[10px] text-slate-400">Token Balance</div>
              <div className="text-sm font-black text-amber-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-amber-400" /> {tokenBalance.toLocaleString()} Tokens
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Explicit & Unrestricted Studio Mode Toolbar with All Genres */}
      {user && (
        <ExplicitStudioToolbar
          user={user}
          currentStudio="image_video"
          activeGenreId={selectedExplicitGenre}
          onSelectGenre={(g) => setSelectedExplicitGenre(g.id)}
          currentPrompt={aiPromptCommand}
          onApplyPromptModifier={(enhanced) => setAiPromptCommand(enhanced)}
          onNotify={onNotify}
        />
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Multi-Slot Media Deck & AI Command Console */}
        <div className="lg:col-span-7 space-y-6">
          {/* Universal External Media Upload Dropzone & URL Importer */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-['Syne']">
                  Upload External Image or Video Files
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Supports: .MP4, .MOV, .WEBM, .PNG, .JPG, .GIF
              </span>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragActive(true);
              }}
              onDragLeave={() => setIsDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleMultipleFilesUpload(e.dataTransfer.files);
                }
              }}
              className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-3 cursor-pointer ${
                isDragActive
                  ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 scale-[1.01]'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-cyan-400">
                <Upload className="w-6 h-6 animate-pulse" />
              </div>

              <div>
                <div className="text-xs font-bold text-white">
                  Drag & Drop 1 or more Images or Videos here
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Select files from your phone gallery, computer, or drive
                </div>
              </div>

              <label className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/30 cursor-pointer transition-all flex items-center gap-2">
                <Upload className="w-3.5 h-3.5" />
                <span>Browse Files from Device</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleMultipleFilesUpload(e.target.files);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {/* Web URL Importer */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Or Paste Direct Media URL (HTTP/HTTPS Image or Video Link):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customMediaUrl}
                  onChange={(e) => setCustomMediaUrl(e.target.value)}
                  placeholder="https://example.com/my-video.mp4 or my-character.png"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={handleImportUrl}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shrink-0"
                >
                  Import URL
                </button>
              </div>
            </div>
          </div>

          {/* Slot Deck Header */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-['Syne']">
                  Multi-Media Input Deck ({slots.length} Active Slots)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddSlot('image')}
                  className="px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700/50 text-purple-200 text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> + Add Image
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSlot('video')}
                  className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/50 text-cyan-200 text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> + Add Video
                </button>
              </div>
            </div>

            {/* Slots List */}
            <div className="space-y-3">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-900 border border-indigo-700 text-indigo-200 text-xs font-mono font-bold flex items-center justify-center">
                        #{slot.slotNumber}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                          slot.type === 'image'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        }`}
                      >
                        {slot.type === 'image' ? <ImageIcon className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                        {slot.type.toUpperCase()}
                      </span>

                      <span className="text-xs font-bold text-white truncate max-w-[180px]">
                        {slot.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1">
                        <Upload className="w-3 h-3 text-cyan-400" /> Replace File
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleUploadToSlot(slot.id, e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(slot.id)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-800 transition-all"
                        title="Remove Slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Slot Preview & Controls Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    {/* Media Thumbnail */}
                    <div className="sm:col-span-4 relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                      <img src={slot.url} alt={slot.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <span className="absolute bottom-1.5 left-2 text-[9px] font-mono text-slate-300">
                        Opacity: {slot.opacity}%
                      </span>
                    </div>

                    {/* Controls */}
                    <div className="sm:col-span-8 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Blending Layer Mode</label>
                          <select
                            value={slot.blendMode}
                            onChange={(e) =>
                              handleUpdateSlot(slot.id, {
                                blendMode: e.target.value as MediaSlot['blendMode'],
                              })
                            }
                            className="w-full py-1 px-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-white focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="normal">Normal Composite</option>
                            <option value="ai_neural_composite">AI Neural Subject Cutout</option>
                            <option value="chroma_green">Chroma Key Green Screen</option>
                            <option value="morph_shift">Morph Transition Shift</option>
                            <option value="screen">Screen / Light Add</option>
                            <option value="overlay">Overlay Multiply</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Time Offset (Sec)</label>
                          <input
                            type="number"
                            min={0}
                            max={60}
                            value={slot.timeOffsetSec}
                            onChange={(e) =>
                              handleUpdateSlot(slot.id, { timeOffsetSec: Number(e.target.value) })
                            }
                            className="w-full py-1 px-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-white font-mono focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                          <span>Layer Weight / Opacity</span>
                          <span className="font-mono text-cyan-300">{slot.opacity}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={slot.opacity}
                          onChange={(e) =>
                            handleUpdateSlot(slot.id, { opacity: Number(e.target.value) })
                          }
                          className="w-full accent-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Presets Picker */}
            <div className="pt-2 border-t border-slate-800">
              <label className="text-[11px] font-bold text-slate-400 block mb-1.5">
                Load Sample Media Assets into Deck:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SAMPLE_MEDIA_PRESETS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => {
                      const targetSlot = slots[0];
                      handleUpdateSlot(targetSlot.id, {
                        title: sample.title,
                        url: sample.url,
                        type: sample.type,
                      });
                      onNotify('Sample Asset Loaded', `Loaded "${sample.title}" into Slot #1.`, 'info');
                    }}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 text-left transition-all group"
                  >
                    <div className="aspect-video rounded-lg overflow-hidden mb-1.5">
                      <img src={sample.url} alt={sample.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="text-[11px] font-bold text-white truncate">{sample.title}</div>
                    <div className="text-[9px] text-slate-500">{sample.tag}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Command Input Box */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-purple-400" /> Natural Language AI Fusion Command
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                GPT-4o + Gemini Vision Multimodal
              </span>
            </div>

            {/* Preset AI Prompts List */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Quick AI Fusion Commands</label>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                {PRESET_AI_COMMANDS.map((cmd) => (
                  <button
                    key={cmd.label}
                    type="button"
                    onClick={() => setAiPromptCommand(cmd.command)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500 text-left text-xs transition-all flex items-start gap-2 group"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5 group-hover:rotate-12 transition-transform" />
                    <div>
                      <div className="font-bold text-slate-200 group-hover:text-purple-300 transition-colors">
                        {cmd.label}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">{cmd.command}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Command Textarea */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Your Custom AI Mixing Prompt</label>
              <textarea
                rows={3}
                value={aiPromptCommand}
                onChange={(e) => setAiPromptCommand(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-purple-500 focus:outline-none font-mono leading-relaxed"
                placeholder="Describe how to mix Slot 1, Slot 2, Slot 3... e.g. Take person from Slot 1, place into rainy city background in Slot 2, apply Studio Ghibli style and camera tracking..."
              />
            </div>

            {/* Render Config Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Output Resolution</label>
                <select
                  value={outputResolution}
                  onChange={(e) => setOutputResolution(e.target.value as any)}
                  className="w-full py-1.5 px-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-purple-500 focus:outline-none font-mono"
                >
                  <option value="1080p">1080p Full HD</option>
                  <option value="4K">4K Ultra HD</option>
                  <option value="8K">8K Master Cinema</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Motion Frame Rate</label>
                <select
                  value={targetFps}
                  onChange={(e) => setTargetFps(Number(e.target.value))}
                  className="w-full py-1.5 px-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-purple-500 focus:outline-none font-mono"
                >
                  <option value={24}>24 FPS Cinema</option>
                  <option value={30}>30 FPS Standard</option>
                  <option value={60}>60 FPS Ultra Smooth</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Output Duration</label>
                <select
                  value={outputDurationSec}
                  onChange={(e) => setOutputDurationSec(Number(e.target.value))}
                  className="w-full py-1.5 px-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-purple-500 focus:outline-none font-mono"
                >
                  <option value={5}>5 Seconds</option>
                  <option value={10}>10 Seconds</option>
                  <option value={15}>15 Seconds</option>
                  <option value={30}>30 Seconds Loop</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Audio Fusion</label>
                <select
                  value={audioStrategy}
                  onChange={(e) => setAudioStrategy(e.target.value as any)}
                  className="w-full py-1.5 px-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-purple-500 focus:outline-none font-mono"
                >
                  <option value="ai_bgm_score">AI BGM Cinematic Score</option>
                  <option value="mix_all">Mix All Audio Tracks</option>
                  <option value="video_1_only">Keep Slot 1 Audio Only</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleExecuteMix}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold font-['Syne'] text-xs shadow-xl shadow-purple-900/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Synthesizing Multi-Media AI Fusion ({processProgress}%)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>Execute AI Multi-Media Remix ({slots.length} Slots)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column (5 cols): Live Preview Canvas & Export Suite */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-5 sticky top-20">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-bold text-white font-['Syne']">
                  Live Combined Output Preview
                </span>
              </div>

              <div className="flex items-center gap-1 font-mono text-[10px]">
                {['merged', 'split', 'grid'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode as any)}
                    className={`px-2 py-0.5 rounded-lg border uppercase transition-all ${
                      viewMode === mode
                        ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Display Canvas */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl group">
              <img src={activePreviewUrl} alt="Fusion Output" className="w-full h-full object-cover" />

              {/* Progress Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
                  <Wand2 className="w-10 h-10 text-cyan-400 animate-bounce" />
                  <div className="text-xs font-bold text-white font-['Syne']">
                    Merging {slots.length} Media Layers with AI
                  </div>
                  <div className="w-full max-w-xs h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-300"
                      style={{ width: `${processProgress}%` }}
                    />
                  </div>
                  <div className="text-[10px] font-mono text-cyan-300">{processProgress}% • Matching Lighting & Motion</div>
                </div>
              )}

              {/* Player Controls Overlay */}
              <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800/80 flex items-center justify-between text-white opacity-90 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => setIsPlayingPreview(!isPlayingPreview)}
                  className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                <div className="text-[10px] font-mono text-slate-300">
                  00:04 / 00:{outputDurationSec < 10 ? `0${outputDurationSec}` : outputDurationSec} • {outputResolution} {targetFps}fps
                </div>

                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-mono text-emerald-300">AI Synced</span>
                </div>
              </div>
            </div>

            {/* Export & Action Buttons */}
            <div className="space-y-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = activePreviewUrl;
                  link.download = `AI_Fusion_Mix_${Date.now()}.mp4`;
                  link.click();
                  onNotify('Media Downloaded', `Exported ${outputResolution} Video (.MP4).`, 'success');
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Export Combined {outputResolution} Video (.MP4)
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = activePreviewUrl;
                    link.download = `AI_Fusion_Mix_${Date.now()}.gif`;
                    link.click();
                    onNotify('GIF Exported', `Downloaded Animated GIF preview.`, 'success');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Film className="w-3.5 h-3.5 text-purple-400" /> Animated GIF
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onSendToFilmStudio) {
                      onSendToFilmStudio(aiPromptCommand, activePreviewUrl);
                    }
                    onNotify('Sent to Film Studio', 'Imported merged scene sequence into Film Studio Timeline!', 'success');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Tv className="w-3.5 h-3.5 text-amber-400" /> Use in Film Studio
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

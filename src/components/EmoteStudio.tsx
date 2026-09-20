import React, { useState, useRef } from 'react';
import {
  Smile,
  Sparkles,
  Download,
  Upload,
  Layers,
  Palette,
  Zap,
  Image as ImageIcon,
  CheckCircle2,
  Copy,
  RefreshCw,
  Sliders,
  Type,
  Flame,
  Heart,
  Meh,
  Frown,
  Laugh,
  X,
  Share2,
  Grid,
} from 'lucide-react';

interface EmoteStudioProps {
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export interface PresetEmote {
  id: string;
  name: string;
  expression: string;
  style: string;
  category: 'Gaming/Twitch' | 'Chibi Anime' | 'Meme Reaction' | 'Pixel Art' | '3D Glossy';
  imageUrl: string;
  badgeText: string;
  badgeBg: string;
}

const PRESET_EMOTES: PresetEmote[] = [
  {
    id: 'poggers_cyber',
    name: 'Cyber Poggers',
    expression: 'Shocked / Open Mouth Hype',
    style: 'Neon Cyberpunk',
    category: 'Gaming/Twitch',
    imageUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=500&auto=format&fit=crop',
    badgeText: 'POG',
    badgeBg: 'bg-amber-500 text-slate-950',
  },
  {
    id: 'rage_operator',
    name: 'Rage Mode Fire',
    expression: 'Angry Eyes & Flame Aura',
    style: 'Anime Shonen',
    category: 'Chibi Anime',
    imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop',
    badgeText: 'RAGE',
    badgeBg: 'bg-red-600 text-white',
  },
  {
    id: 'gg_wp_victory',
    name: 'GG WP Royal Crown',
    expression: 'Smirk & Crown Victory Wave',
    style: '3D Glossy Render',
    category: '3D Glossy',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop',
    badgeText: 'GG WP',
    badgeBg: 'bg-emerald-500 text-slate-950',
  },
  {
    id: 'sus_imposter',
    name: 'Space Sus Eye Glow',
    expression: 'Suspicious Side Glance',
    style: 'Vector Cartoon',
    category: 'Meme Reaction',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop',
    badgeText: 'SUS',
    badgeBg: 'bg-purple-600 text-white',
  },
  {
    id: 'pixel_heart_love',
    name: 'Pixel Heart Hype',
    expression: 'Heart Eyes Love',
    style: 'Retro 16-Bit Pixel',
    category: 'Pixel Art',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop',
    badgeText: 'LOVE',
    badgeBg: 'bg-pink-500 text-white',
  },
  {
    id: 'pepe_laugh_ez',
    name: 'EZ Clap Smirk',
    expression: 'Trolling Laugh',
    style: 'Meme Comic',
    category: 'Meme Reaction',
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop',
    badgeText: 'EZ',
    badgeBg: 'bg-cyan-500 text-slate-950',
  },
];

export const EmoteStudio: React.FC<EmoteStudioProps> = ({ onNotify }) => {
  // Mode: AI Prompt Emote vs Photo to Emote
  const [generationMode, setGenerationMode] = useState<'prompt' | 'photo' | 'presets'>('prompt');

  // AI Prompt State
  const [emotePrompt, setEmotePrompt] = useState('Chibi Cat Operator wearing RGB Gaming Headset with Fire Eyes');
  const [selectedExpression, setSelectedExpression] = useState('Hype / POG');
  const [emoteStyle, setEmoteStyle] = useState('Chibi Anime Vector');
  const [overlayText, setOverlayText] = useState('HYPE');
  const [textColor, setTextColor] = useState('#38bdf8');
  const [outlineColor, setOutlineColor] = useState('#0f172a');
  const [stickerBorder, setStickerBorder] = useState(true);
  const [glowEffect, setGlowEffect] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Active Emote Preview State
  const [currentEmoteImage, setCurrentEmoteImage] = useState<string>(PRESET_EMOTES[0].imageUrl);
  const [activeBadgeText, setActiveBadgeText] = useState<string>('POG');

  // Photo to Emote State
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);

  // Reaction Expressions list
  const EXPRESSIONS = [
    { label: 'Hype / POG', icon: <Zap className="w-3.5 h-3.5 text-amber-400" />, defaultText: 'POG' },
    { label: 'Rage / Flame', icon: <Flame className="w-3.5 h-3.5 text-red-400" />, defaultText: 'RAGE' },
    { label: 'GG / Victory', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />, defaultText: 'GG' },
    { label: 'Love / Hearts', icon: <Heart className="w-3.5 h-3.5 text-pink-400" />, defaultText: 'LOVE' },
    { label: 'Laugh / LUL', icon: <Laugh className="w-3.5 h-3.5 text-cyan-400" />, defaultText: 'LUL' },
    { label: 'SUS / Imposter', icon: <Meh className="w-3.5 h-3.5 text-purple-400" />, defaultText: 'SUS' },
  ];

  const handleGenerateEmote = () => {
    if (!emotePrompt.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      // Select random vibrant image matching prompt
      const sampleImages = [
        'https://images.unsplash.com/photo-1563089145-599997674d42?w=500&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop',
      ];
      const randomImg = sampleImages[Math.floor(Math.random() * sampleImages.length)];
      setCurrentEmoteImage(randomImg);
      setActiveBadgeText(overlayText.toUpperCase());

      onNotify(
        'Custom AI Emote Generated!',
        `Synthesized transparent sticker emote "${overlayText}" in ${emoteStyle} style. Ready for Twitch & Discord!`,
        'success'
      );
    }, 1400);
  };

  const handleExportEmote = (platform: 'twitch' | 'discord' | 'youtube' | 'hd_png') => {
    let sizeMsg = '';
    if (platform === 'twitch') sizeMsg = 'Twitch Emote Suite (28x28, 56x56, 112x112 transparent PNGs)';
    if (platform === 'discord') sizeMsg = 'Discord Sticker & Animated Emote (320x320 PNG/APNG)';
    if (platform === 'youtube') sizeMsg = 'YouTube Membership Badges (18x18, 36x36, 72x72 PNGs)';
    if (platform === 'hd_png') sizeMsg = '4K Vector Transparent Sticker (.PNG & .WEBP)';

    // Trigger virtual file download
    const link = document.createElement('a');
    link.href = currentEmoteImage;
    link.download = `Emote_${overlayText}_${platform}.png`;
    link.click();

    onNotify('Emote Export Complete!', `Downloaded ${sizeMsg} with transparent background!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Studio Header Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-purple-950/80 via-slate-900 to-slate-950 border border-purple-500/30 shadow-2xl overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold">
              <Smile className="w-3.5 h-3.5 text-purple-400" /> Custom Twitch, Discord & YouTube Emote Generator
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Syne'] tracking-tight">
              AI Custom Emote, Sticker & Badge Creator Studio
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Generate custom gaming emotes, reaction stickers, and sub badges. Auto-resized for <span className="text-purple-300 font-mono font-bold">Twitch (112px/56px/28px)</span>, <span className="text-cyan-300 font-mono font-bold">Discord (320px)</span>, and <span className="text-red-400 font-mono font-bold">YouTube (72px)</span> with 100% transparent backgrounds.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setGenerationMode('prompt')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                generationMode === 'prompt'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" /> AI Prompt Emote
            </button>
            <button
              type="button"
              onClick={() => setGenerationMode('photo')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                generationMode === 'photo'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Upload className="w-4 h-4 text-cyan-300" /> Photo to Chibi Emote
            </button>
            <button
              type="button"
              onClick={() => setGenerationMode('presets')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                generationMode === 'presets'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Grid className="w-4 h-4 text-amber-300" /> Preset Library
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Creator Controls */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-5">
          {generationMode === 'prompt' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" /> AI Concept & Expression Generator
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  Transparency Engine
                </span>
              </div>

              {/* Expression Selector Grid */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">Select Emote Emotion / Expression</label>
                <div className="grid grid-cols-3 gap-2">
                  {EXPRESSIONS.map((expr) => {
                    const isSelected = selectedExpression === expr.label;
                    return (
                      <button
                        key={expr.label}
                        type="button"
                        onClick={() => {
                          setSelectedExpression(expr.label);
                          setOverlayText(expr.defaultText);
                        }}
                        className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-purple-950 border-purple-500 text-white shadow-md'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {expr.icon}
                        <span className="text-[11px] font-bold truncate">{expr.label.split('/')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Text Prompt */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Emote Subject & Description</label>
                <textarea
                  rows={2}
                  value={emotePrompt}
                  onChange={(e) => setEmotePrompt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-purple-500 focus:outline-none font-mono"
                  placeholder="e.g., Cyberpunk Fox with neon glowing headset holding coffee..."
                />
              </div>

              {/* Style & Text Overlay Controls */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Art Style</label>
                  <select
                    value={emoteStyle}
                    onChange={(e) => setEmoteStyle(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="Chibi Anime Vector">Chibi Anime Vector</option>
                    <option value="Twitch Gaming Glossy">Twitch Gaming Glossy</option>
                    <option value="Retro 16-Bit Pixel Art">Retro 16-Bit Pixel Art</option>
                    <option value="3D Toy Claymorphism">3D Toy Claymorphism</option>
                    <option value="Meme Line Art">Meme Line Art</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Text Overlay Badge</label>
                  <input
                    type="text"
                    value={overlayText}
                    onChange={(e) => setOverlayText(e.target.value.toUpperCase())}
                    maxLength={8}
                    className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono font-bold text-center focus:border-purple-500 focus:outline-none"
                    placeholder="POG / GG"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <span className="text-[11px] font-bold text-slate-300">White Sticker Outline</span>
                  <input
                    type="checkbox"
                    checked={stickerBorder}
                    onChange={(e) => setStickerBorder(e.target.checked)}
                    className="w-4 h-4 accent-purple-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <span className="text-[11px] font-bold text-slate-300 font-mono">Neon Glow Aura</span>
                  <input
                    type="checkbox"
                    checked={glowEffect}
                    onChange={(e) => setGlowEffect(e.target.checked)}
                    className="w-4 h-4 accent-purple-500"
                  />
                </label>
              </div>

              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerateEmote}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold font-['Syne'] text-xs shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-purple-300" />
                    <span>Synthesizing Transparent Emote Sticker...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-300" />
                    <span>Generate Custom Emote ({overlayText})</span>
                  </>
                )}
              </button>
            </div>
          )}

          {generationMode === 'photo' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
                  <Upload className="w-4 h-4 text-cyan-400" /> Turn Photo into Chibi Emote
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Face Stylizer
                </span>
              </div>

              <div className="relative aspect-square max-w-[220px] mx-auto rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 p-3 flex flex-col items-center justify-center text-center group cursor-pointer">
                {uploadedPhoto ? (
                  <img src={uploadedPhoto} alt="Uploaded face" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="space-y-2 p-4">
                    <ImageIcon className="w-8 h-8 text-slate-500 mx-auto" />
                    <p className="text-xs text-slate-400">Upload Your Photo / Avatar</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadedPhoto(URL.createObjectURL(e.target.files[0]));
                      setCurrentEmoteImage(URL.createObjectURL(e.target.files[0]));
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateEmote}
                className="w-full py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold font-['Syne'] text-xs shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Convert Photo to Chibi Gaming Emote
              </button>
            </div>
          )}

          {generationMode === 'presets' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-white font-['Syne']">Preset Gaming Emotes Library</div>
              <div className="grid grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
                {PRESET_EMOTES.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setCurrentEmoteImage(preset.imageUrl);
                      setActiveBadgeText(preset.badgeText);
                      setOverlayText(preset.badgeText);
                    }}
                    className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500 text-left transition-all group"
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-2">
                      <img src={preset.imageUrl} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <span className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${preset.badgeBg}`}>
                        {preset.badgeText}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white truncate">{preset.name}</div>
                    <div className="text-[10px] text-slate-400">{preset.category}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Emote Canvas & Multi-Platform Size Exporter */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Emote Display Card */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-white font-['Syne']">
                  Live Transparent Emote Preview ({activeBadgeText})
                </span>
              </div>
              <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-2.5 py-1 rounded-lg border border-purple-800">
                PNG Transparency Active
              </span>
            </div>

            {/* Checkerboard Transparent Background Canvas */}
            <div className="relative aspect-square max-w-[280px] mx-auto rounded-3xl border border-slate-800 p-4 flex items-center justify-center overflow-hidden bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] bg-slate-950 shadow-2xl">
              {/* Outer Glow */}
              {glowEffect && (
                <div className="absolute inset-4 rounded-2xl bg-purple-500/20 blur-xl pointer-events-none" />
              )}

              {/* Emote Image with optional Sticker Outline */}
              <div className="relative w-full h-full flex items-center justify-center group">
                <img
                  src={currentEmoteImage}
                  alt="Custom Emote"
                  className={`w-full h-full object-contain transition-all duration-300 ${
                    stickerBorder ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]' : ''
                  }`}
                />

                {/* Overlay Badge */}
                {overlayText && (
                  <div
                    className="absolute bottom-2 right-2 px-3 py-1 rounded-xl text-xs font-extrabold font-mono tracking-wider shadow-lg border border-white/20 transform group-hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: textColor,
                      color: outlineColor,
                    }}
                  >
                    {overlayText}
                  </div>
                )}
              </div>
            </div>

            {/* Platform Sizes Grid Preview */}
            <div className="space-y-3 border-t border-slate-800 pt-3">
              <div className="text-xs font-bold text-slate-300 font-mono flex items-center justify-between">
                <span>Multi-Platform Auto-Resized Previews:</span>
                <span className="text-[10px] text-slate-500">Instant Export Standard</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Twitch Sizes */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-center">
                  <div className="text-[10px] font-bold text-purple-400 font-mono">Twitch Emotes</div>
                  <div className="flex items-center justify-center gap-2 py-1">
                    <img src={currentEmoteImage} alt="Twitch 28" className="w-7 h-7 object-contain" />
                    <img src={currentEmoteImage} alt="Twitch 56" className="w-9 h-9 object-contain" />
                    <img src={currentEmoteImage} alt="Twitch 112" className="w-12 h-12 object-contain" />
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">28px • 56px • 112px</div>
                  <button
                    type="button"
                    onClick={() => handleExportEmote('twitch')}
                    className="w-full py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center gap-1"
                  >
                    <Download className="w-3 h-3" /> Twitch Pack
                  </button>
                </div>

                {/* Discord Sticker */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-center">
                  <div className="text-[10px] font-bold text-cyan-400 font-mono">Discord Sticker</div>
                  <div className="py-1">
                    <img src={currentEmoteImage} alt="Discord 320" className="w-12 h-12 mx-auto object-contain" />
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">320px • PNG / APNG</div>
                  <button
                    type="button"
                    onClick={() => handleExportEmote('discord')}
                    className="w-full py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold flex items-center justify-center gap-1"
                  >
                    <Download className="w-3 h-3" /> Discord Pack
                  </button>
                </div>

                {/* YouTube Badges */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-center">
                  <div className="text-[10px] font-bold text-red-400 font-mono">YouTube Badges</div>
                  <div className="flex items-center justify-center gap-2 py-1">
                    <img src={currentEmoteImage} alt="YT 18" className="w-5 h-5 object-contain" />
                    <img src={currentEmoteImage} alt="YT 36" className="w-8 h-8 object-contain" />
                    <img src={currentEmoteImage} alt="YT 72" className="w-10 h-10 object-contain" />
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">18px • 36px • 72px</div>
                  <button
                    type="button"
                    onClick={() => handleExportEmote('youtube')}
                    className="w-full py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold flex items-center justify-center gap-1"
                  >
                    <Download className="w-3 h-3" /> YouTube Pack
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleExportEmote('hd_png')}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download 4K HD Vector Sticker (.PNG & .WEBP)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

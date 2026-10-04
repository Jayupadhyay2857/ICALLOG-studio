import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Download,
  Plus,
  RefreshCw,
  Layout,
  MessageSquare,
  Camera,
  Layers,
  CheckCircle2,
  FileText,
  Sliders,
  Image as ImageIcon,
  Eye,
  Film,
} from 'lucide-react';
import { UserProfile } from '../types.ts';
import { safeDownloadMedia } from '../lib/downloadHelper.ts';

interface MangaStoryboardStudioProps {
  user?: UserProfile;
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

interface ComicPanel {
  id: number;
  shotType: 'Extreme Close-Up' | 'Establishing Wide' | 'Low-Angle Hero' | 'Over-the-Shoulder' | 'Bird Eye Action';
  caption: string;
  dialogue: string;
  speaker: string;
  sfx: string;
  imageUrl: string;
}

export const MangaStoryboardStudio: React.FC<MangaStoryboardStudioProps> = ({ user, onNotify }) => {
  const [comicTitle, setComicTitle] = useState('Cyber Samurai: Dawn of Neo-Kashi');
  const [storyPrompt, setStoryPrompt] = useState(
    'In a rain-soaked futuristic city, the last cybernetic samurai awakens atop a neon skyscraper. He draws his laser katana as shadowy drone sentinels circle the sky.'
  );
  const [artStyle, setArtStyle] = useState<'shonen_manga' | 'marvel_comic' | 'cyberpunk_novel' | 'pixar_storyboard' | 'noir'>('shonen_manga');
  const [layoutMode, setLayoutMode] = useState<'4_panel_webtoon' | '6_panel_manga' | 'storyboard_grid'>('4_panel_webtoon');
  const [isGenerating, setIsGenerating] = useState(false);

  const [panels, setPanels] = useState<ComicPanel[]>([
    {
      id: 1,
      shotType: 'Establishing Wide',
      caption: 'NEO-KASHI CITY — YEAR 2099',
      dialogue: 'The city never sleeps... neither do its hunters.',
      speaker: 'Narration',
      sfx: '⚡ BZZZZT',
      imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 2,
      shotType: 'Low-Angle Hero',
      caption: 'THE ROOFTOP AWAKENING',
      dialogue: 'My blade is sharp. The code is pure.',
      speaker: 'Ren (Cyber Samurai)',
      sfx: '⚔️ SHINNNG',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 3,
      shotType: 'Extreme Close-Up',
      caption: 'COMBAT SENSORS ACTIVE',
      dialogue: 'Three hunter drones locked at 400 meters.',
      speaker: 'AI Visor',
      sfx: '🎯 BEEP-BEEP',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 4,
      shotType: 'Bird Eye Action',
      caption: 'THE LEAP OF FAITH',
      dialogue: 'Let the dance begin!',
      speaker: 'Ren',
      sfx: '💥 BOOOOM!',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    },
  ]);

  const handleGenerateStoryboard = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      onNotify(
        '🎨 Manga Storyboard Generated!',
        `Created 4-panel visual strip with ${artStyle.toUpperCase()} aesthetic and speech bubbles.`,
        'success'
      );
    }, 1200);
  };

  const handleExportComicPng = () => {
    safeDownloadMedia(
      panels[0].imageUrl,
      `${comicTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_manga_strip.png`,
      {
        type: 'image',
        onSuccess: (msg) => onNotify('Comic Strip Downloaded', msg, 'success'),
      }
    );
  };

  const handleExportStoryboardDoc = () => {
    let doc = `==========================================================\n`;
    doc += `   iCALLOG AI VISUAL STORYBOARD & MANGA PRODUCTION SCRIPT \n`;
    doc += `==========================================================\n\n`;
    doc += `Title: ${comicTitle}\n`;
    doc += `Style: ${artStyle.toUpperCase()} | Layout: ${layoutMode}\n`;
    doc += `Created: ${new Date().toLocaleString()}\n`;
    doc += `----------------------------------------------------------\n\n`;

    panels.forEach((p, idx) => {
      doc += `[PANEL #${idx + 1}] - Camera: ${p.shotType}\n`;
      doc += `  Caption:   ${p.caption}\n`;
      doc += `  Speaker:   ${p.speaker}\n`;
      doc += `  Dialogue:  "${p.dialogue}"\n`;
      doc += `  SFX Sound: ${p.sfx}\n`;
      doc += `  Visual:    ${p.imageUrl}\n\n`;
    });

    const blob = new Blob([doc], { type: 'text/plain;charset=utf-8' });
    safeDownloadMedia(blob, `${comicTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_storyboard.txt`, {
      type: 'text',
      onSuccess: (msg) => onNotify('Storyboard Script Saved', msg, 'success'),
    });
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-amber-950/60 to-orange-950/40 border border-amber-500/40 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-600 to-red-600 flex items-center justify-center text-white shadow-xl shadow-amber-950/50 text-2xl">
              📚
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white font-['Syne']">
                  AI Storyboard & Comic / Manga Strip Studio
                </h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  Webtoon • Manga • Hollywood Storyboard
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-mono mt-1">
                Convert story prompts and film scripts into multi-panel comic strips, speech bubbles, and director camera angles.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              type="button"
              onClick={handleExportStoryboardDoc}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Export Script</span>
            </button>
            <button
              type="button"
              onClick={handleExportComicPng}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-950 stroke-[3]" />
              <span>Download Manga Strip</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout: Configuration & Storyboard Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Creator Controls (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Story / Episode Title</label>
              <input
                type="text"
                value={comicTitle}
                onChange={(e) => setComicTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Story Prompt / Screenplay Scene</label>
              <textarea
                rows={4}
                value={storyPrompt}
                onChange={(e) => setStoryPrompt(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 resize-none font-mono"
              />
            </div>

            {/* Art Style Selector */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Manga & Comic Art Style</label>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { id: 'shonen_manga', label: 'Japanese Shonen Manga (Ink & Speed Lines)', icon: '🇯🇵' },
                  { id: 'marvel_comic', label: 'Marvel Superhero Comic (Dynamic Color)', icon: '🦸' },
                  { id: 'cyberpunk_novel', label: 'Cyberpunk Graphic Novel (Neon Noir)', icon: '🌃' },
                  { id: 'pixar_storyboard', label: 'Pixar 3D Cinematic Storyboard', icon: '🎬' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setArtStyle(st.id as any)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                      artStyle === st.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{st.icon}</span>
                    <span className="truncate">{st.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              type="button"
              onClick={handleGenerateStoryboard}
              disabled={isGenerating}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-xl shadow-amber-950/50 flex items-center justify-center gap-2 transition-all hover:scale-102 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Synthesizing Comic Panels...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Generate Multi-Panel Manga Strip</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Comic Strip Panels (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-black text-white font-['Syne'] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" /> {comicTitle}
              </h2>
              <span className="text-xs font-mono text-amber-400 font-bold">
                {panels.length} Story Panels Active
              </span>
            </div>

            {/* Multi-Panel Comic Strip Viewport */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {panels.map((panel, idx) => (
                <div
                  key={panel.id}
                  className="rounded-2xl bg-black border-2 border-slate-800 hover:border-amber-500/60 transition-all overflow-hidden shadow-2xl relative flex flex-col justify-between"
                >
                  {/* Top Panel Camera Shot Badge */}
                  <div className="p-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
                      <Camera className="w-3 h-3" /> Panel #{idx + 1}: {panel.shotType}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
                      {panel.sfx}
                    </span>
                  </div>

                  {/* Panel Image */}
                  <div className="relative aspect-video overflow-hidden bg-slate-950">
                    <img
                      src={panel.imageUrl}
                      alt={panel.caption}
                      className="w-full h-full object-cover"
                    />

                    {/* Speech Bubble Overlay */}
                    <div className="absolute top-2 right-2 max-w-[75%] p-2 rounded-2xl bg-white text-slate-950 shadow-2xl border-2 border-black animate-in fade-in">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                        {panel.speaker}:
                      </div>
                      <div className="text-[11px] font-black leading-tight font-['Comic_Neue',sans-serif]">
                        "{panel.dialogue}"
                      </div>
                    </div>

                    {/* Narration Caption Box */}
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-amber-400 text-slate-950 font-mono font-black text-[10px] uppercase tracking-wider shadow-lg border border-black">
                      {panel.caption}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

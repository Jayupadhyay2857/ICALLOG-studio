import React, { useState } from 'react';
import {
  Sparkles,
  Music,
  Plus,
  Save,
  Play,
  Volume2,
  Trash2,
  Download,
  Check,
  Zap,
  Sliders,
  Radio,
  Layers,
} from 'lucide-react';
import {
  CustomMusicTheme,
  PRESET_MUSIC_THEMES,
  generateThemeFromPrompt,
  saveUserCustomThemes,
  playChord,
  playDrumSound,
} from '../lib/musicThemeEngine.ts';

interface CustomThemeStudioProps {
  currentTheme: CustomMusicTheme;
  onChangeTheme: (theme: CustomMusicTheme) => void;
  savedCustomThemes: CustomMusicTheme[];
  onUpdateSavedThemes: (themes: CustomMusicTheme[]) => void;
  onApplyToComposer: (theme: CustomMusicTheme) => void;
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

const SCALE_TYPES = [
  { id: 'minor', label: 'Minor (उदासी / रहस्य)', tag: 'Minor' },
  { id: 'major', label: 'Major (उत्साह / खुशी)', tag: 'Major' },
  { id: 'ragas', label: 'Indian Raags (राग भैरवी / यमन)', tag: 'Raga' },
  { id: 'pentatonic', label: 'Pentatonic (सुकून / ध्यान)', tag: 'Penta' },
  { id: 'blues', label: 'Blues / Soul (सुलझा हुआ ग्रूव्)', tag: 'Blues' },
  { id: 'oriental', label: 'Oriental / Arabic (जादुई मिजाज)', tag: 'Arabic' },
];

const GENRE_CATEGORIES = [
  'Bollywood & EDM',
  'Punjabi & Bhangra',
  'Lo-Fi & Chillhop',
  'Sufi & Qawwali',
  'Synthwave & Cyberpunk',
  'Hip-Hop, Trap & Drill',
  'Ambient & Vedic 432Hz',
  'Hard Rock & Metal',
  'Classical Symphony',
  'Afrobeat & Amapiano',
  'Pop & Latin Dance',
  'Custom Fusion',
];

const LEAD_INSTRUMENTS = [
  'Indian Shehnai & Sitar Solo',
  'Vintage Rhodes & Electric Piano',
  'Supersaw Cyberpunk Lead Synth',
  'Indian Bansuri Bamboo Flute',
  'Harmonium & Sarangi Devotional',
  'Distorted Electric Guitar Shred',
  'Tumbi & Punjabi Folk Plucks',
  'Jazzy Saxophone & Brass Horns',
  'Grand Concert Acoustic Piano',
  'French Horns & Trailer Symphony Strings',
];

const BASS_TYPES = [
  'Deep 808 Sliding Sub-Bass',
  'Acid 303 Rolling Techno Bass',
  'Warm Analog Muffled Bassline',
  'Acoustic Tanpura & Drone Sub',
  'Heavy Slap Funk Electric Bass',
  'Punchy Amapiano Log-Drum Bass',
  'Orchestral Taiko Sub-Impacts',
];

const RHYTHM_STYLES = [
  'Punjabi Dholak + 4/4 Kick Drop',
  'Dusty Boom-Bap Swing & Shaker',
  '16-Step Trap Hi-Hat & Snare Roll',
  'Live Tabla Teentaal & Hand Claps',
  'Gated 80s LinnDrum Snare Groove',
  'Syncopated African Log-Drum & Rimshot',
  'Marching Taiko & Anvil Trailer Impact',
  'Gentle Wind Chimes & Zero-Percussion Ambient',
];

const ATMOSPHERE_FX_OPTIONS = [
  'Vinyl Dust Crackle & Raindrops',
  'Temple Reverb Wash & Incense Smoke Drone',
  'Laser Risers & Cyber Sirens',
  'Cassette Tape Flutter & Cozy Cafe',
  'Himalayan Breeze & 432Hz Singing Bowls',
  'Stadium Crowd Cheers & Festival Horns',
  'Guitar Amp Feedback & Thunder Crash',
];

export const CustomThemeStudio: React.FC<CustomThemeStudioProps> = ({
  currentTheme,
  onChangeTheme,
  savedCustomThemes,
  onUpdateSavedThemes,
  onApplyToComposer,
  onNotify,
}) => {
  const [promptText, setPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Form State
  const [name, setName] = useState(currentTheme.name);
  const [hindiName, setHindiName] = useState(currentTheme.hindiName);
  const [icon, setIcon] = useState(currentTheme.icon);
  const [genreCategory, setGenreCategory] = useState(currentTheme.genreCategory);
  const [tempoBpm, setTempoBpm] = useState(currentTheme.tempoBpm);
  const [musicalKey, setMusicalKey] = useState(currentTheme.musicalKey);
  const [scaleType, setScaleType] = useState(currentTheme.scaleType);
  const [moodTag, setMoodTag] = useState(currentTheme.moodTag);
  const [leadInstrument, setLeadInstrument] = useState(currentTheme.leadInstrument);
  const [bassType, setBassType] = useState(currentTheme.bassType);
  const [rhythmStyle, setRhythmStyle] = useState(currentTheme.rhythmStyle);
  const [atmosphereFx, setAtmosphereFx] = useState(currentTheme.atmosphereFx);
  const [colorGradient, setColorGradient] = useState(currentTheme.colorGradient);
  const [description, setDescription] = useState(currentTheme.description);

  // Synchronize when current theme changes
  const loadThemeIntoForm = (theme: CustomMusicTheme) => {
    setName(theme.name);
    setHindiName(theme.hindiName);
    setIcon(theme.icon);
    setGenreCategory(theme.genreCategory);
    setTempoBpm(theme.tempoBpm);
    setMusicalKey(theme.musicalKey);
    setScaleType(theme.scaleType);
    setMoodTag(theme.moodTag);
    setLeadInstrument(theme.leadInstrument);
    setBassType(theme.bassType);
    setRhythmStyle(theme.rhythmStyle);
    setAtmosphereFx(theme.atmosphereFx);
    setColorGradient(theme.colorGradient);
    setDescription(theme.description);
    onChangeTheme(theme);
  };

  // AI Prompt Theme Generator
  const handleAiGenerateTheme = () => {
    if (!promptText.trim()) {
      onNotify('Enter Prompt', 'Please describe your dream music theme or mood!', 'warning');
      return;
    }
    setIsGenerating(true);
    onNotify('AI Music Architect', `Synthesizing music theme & sound palette for: "${promptText}"...`, 'info');

    setTimeout(() => {
      const generated = generateThemeFromPrompt(promptText);
      loadThemeIntoForm(generated);
      setIsGenerating(false);
      onNotify('New Theme Synthesized!', `Created "${generated.name}" with custom sound layers!`, 'success');
    }, 1200);
  };

  // Preview Theme Audition
  const handleAuditionTheme = () => {
    // Play chord + kick + hi-hat in sync
    playDrumSound('kick');
    playDrumSound('hihat');
    if (scaleType === 'ragas') {
      playChord(['C4', 'D#4', 'G4', 'A#4'], 'sawtooth', 0.9);
    } else if (scaleType === 'minor') {
      playChord(['A3', 'C4', 'E4', 'A4'], 'sawtooth', 0.9);
    } else if (scaleType === 'pentatonic') {
      playChord(['F3', 'A3', 'C4', 'E4'], 'triangle', 1.0);
    } else {
      playChord(['C4', 'E4', 'G4', 'B4'], 'sawtooth', 0.9);
    }
    onNotify('Theme Audition', `Playing live sound palette for ${name} (${tempoBpm} BPM)!`, 'info');
  };

  // Save to Custom Library
  const handleSaveTheme = () => {
    const updatedTheme: CustomMusicTheme = {
      id: currentTheme.id.startsWith('custom_') ? currentTheme.id : `custom_theme_${Date.now()}`,
      name,
      hindiName,
      icon,
      genreCategory,
      tempoBpm,
      musicalKey,
      scaleType,
      moodTag,
      leadInstrument,
      bassType,
      rhythmStyle,
      atmosphereFx,
      colorGradient,
      description,
      isCustom: true,
      createdAt: new Date().toLocaleDateString(),
    };

    const existsIndex = savedCustomThemes.findIndex((t) => t.id === updatedTheme.id);
    let updatedList: CustomMusicTheme[];
    if (existsIndex >= 0) {
      updatedList = [...savedCustomThemes];
      updatedList[existsIndex] = updatedTheme;
    } else {
      updatedList = [updatedTheme, ...savedCustomThemes];
    }

    onUpdateSavedThemes(updatedList);
    saveUserCustomThemes(updatedList);
    onChangeTheme(updatedTheme);
    onNotify('Theme Saved!', `"${updatedTheme.name}" added to your custom music library!`, 'success');
  };

  // Delete Custom Theme
  const handleDeleteTheme = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedCustomThemes.filter((t) => t.id !== id);
    onUpdateSavedThemes(updated);
    saveUserCustomThemes(updated);
    onNotify('Theme Removed', 'Custom theme deleted from library.', 'info');
  };

  // Export Theme JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentTheme, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${name.toLowerCase().replace(/\s+/g, '_')}_theme.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onNotify('Theme Exported', `${name} JSON downloaded successfully.`, 'success');
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900/90 border border-purple-500/40 shadow-2xl space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/50">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white font-['Syne'] tracking-wide">
                Custom Music Theme & Sound Palette Architect (नया म्यूजिक थीम क्रिएटर)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40">
                AI + Manual Synthesis
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Create, synthesize, and customize your own musical themes, moods, sound layers, and harmonic scales!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAuditionTheme}
            className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Audition Sound Palette</span>
          </button>

          <button
            type="button"
            onClick={handleSaveTheme}
            className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Theme</span>
          </button>
        </div>
      </div>

      {/* AI Theme Synthesizer Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/70 via-slate-950 to-indigo-950/70 border border-purple-800/80 space-y-3">
        <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-300" /> AI Instant Theme Generator (प्रॉम्प्ट से थीम बनाएं)
        </label>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="e.g. Energetic Gujarati Garba with fast Dholak & Flute, Dark Phonk 808 with cowbells..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-purple-800/80 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
          />
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleAiGenerateTheme}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-950/50 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isGenerating ? 'Synthesizing...' : 'AI Generate Theme'}</span>
          </button>
        </div>

        {/* Quick Inspiration Prompts */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] text-slate-400 font-mono">Idea Prompts:</span>
          {[
            'Bhangra Trap Dholak Drop',
            'Sufi Devotional Qawwali',
            'Cyberpunk 80s Synthwave',
            'Lo-Fi Chai Coffee Beats',
            'Vedic 432Hz Himalayan Flute',
            'Hans Zimmer Cinematic Trailer',
          ].map((idea) => (
            <button
              key={idea}
              type="button"
              onClick={() => {
                setPromptText(idea);
                const gen = generateThemeFromPrompt(idea);
                loadThemeIntoForm(gen);
                onNotify('Idea Loaded', `Configured "${gen.name}"!`, 'info');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-purple-950/80 border border-slate-800 hover:border-purple-800 text-[11px] text-slate-300 hover:text-purple-200 transition-colors"
            >
              {idea}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Theme Sound Layer Editor vs Saved Theme Shelf */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Custom Sound Palette Configuration */}
        <div className="lg:col-span-8 space-y-4">
          {/* Identity & Basic Parameters */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-white font-['Syne'] flex items-center gap-2">
              <Music className="w-4 h-4 text-purple-400" /> Theme Identity & Mood
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Theme Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Hindi Title (हिंदी नाम)</label>
                <input
                  type="text"
                  value={hindiName}
                  onChange={(e) => setHindiName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Genre Category</label>
                <select
                  value={genreCategory}
                  onChange={(e) => setGenreCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                >
                  {GENRE_CATEGORIES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tempo BPM & Musical Scale */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <div className="flex justify-between text-[11px] font-bold mb-1">
                  <span className="text-slate-300">Tempo (BPM)</span>
                  <span className="font-mono text-purple-400">{tempoBpm} BPM</span>
                </div>
                <input
                  type="range"
                  min="55"
                  max="190"
                  value={tempoBpm}
                  onChange={(e) => setTempoBpm(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Musical Key</label>
                <input
                  type="text"
                  value={musicalKey}
                  onChange={(e) => setMusicalKey(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                  placeholder="e.g. D Minor, Raag Bhairavi..."
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Scale Harmony</label>
                <select
                  value={scaleType}
                  onChange={(e) => setScaleType(e.target.value as typeof scaleType)}
                  className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                >
                  {SCALE_TYPES.map((st) => (
                    <option key={st.id} value={st.id}>{st.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sound Layers & Orchestration */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-white font-['Syne'] flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" /> Sound Layers & Instrument Orchestration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Lead Instrument */}
              <div>
                <label className="text-[11px] font-bold text-cyan-300 block mb-1">Lead Melodic Instrument</label>
                <select
                  value={leadInstrument}
                  onChange={(e) => setLeadInstrument(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                >
                  {LEAD_INSTRUMENTS.map((inst) => (
                    <option key={inst} value={inst}>{inst}</option>
                  ))}
                </select>
              </div>

              {/* Bassline */}
              <div>
                <label className="text-[11px] font-bold text-purple-300 block mb-1">Bassline & Low-End</label>
                <select
                  value={bassType}
                  onChange={(e) => setBassType(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                >
                  {BASS_TYPES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Rhythm Style */}
              <div>
                <label className="text-[11px] font-bold text-amber-300 block mb-1">Rhythm & Drum Pattern</label>
                <select
                  value={rhythmStyle}
                  onChange={(e) => setRhythmStyle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                >
                  {RHYTHM_STYLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Atmosphere FX */}
              <div>
                <label className="text-[11px] font-bold text-emerald-300 block mb-1">Atmosphere & Ambient Texture</label>
                <select
                  value={atmosphereFx}
                  onChange={(e) => setAtmosphereFx(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                >
                  {ATMOSPHERE_FX_OPTIONS.map((fx) => (
                    <option key={fx} value={fx}>{fx}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description / Story */}
            <div className="pt-2">
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Theme Aesthetic Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Active Card Preview & Preset Library */}
        <div className="lg:col-span-4 space-y-4">
          {/* Live Preview Card */}
          <div className={`p-5 rounded-3xl bg-gradient-to-br ${colorGradient} text-white shadow-2xl space-y-3 relative overflow-hidden`}>
            <div className="flex items-center justify-between">
              <span className="text-2xl">{icon}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20">
                {tempoBpm} BPM • {scaleType.toUpperCase()}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-black font-['Syne'] leading-tight">{name}</h4>
              <div className="text-xs opacity-90">{hindiName}</div>
              <span className="text-[10px] opacity-80 block mt-0.5">Key: {musicalKey}</span>
            </div>

            <p className="text-[11px] opacity-90 leading-snug line-clamp-3">
              {description}
            </p>

            <div className="pt-2 border-t border-white/20 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onApplyToComposer({
                  id: `theme_${Date.now()}`,
                  name,
                  hindiName,
                  icon,
                  genreCategory,
                  tempoBpm,
                  musicalKey,
                  scaleType,
                  moodTag,
                  leadInstrument,
                  bassType,
                  rhythmStyle,
                  atmosphereFx,
                  colorGradient,
                  description,
                  isCustom: true,
                })}
                className="w-full py-2 px-3 rounded-xl bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/30 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-cyan-300" />
                <span>Use in Song Lyrics Composer</span>
              </button>

              <button
                type="button"
                onClick={handleExportJson}
                className="w-full py-1.5 px-3 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3 h-3" />
                <span>Export Theme JSON</span>
              </button>
            </div>
          </div>

          {/* Custom & Preset Theme Library */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white font-['Syne']">
                Theme Library ({savedCustomThemes.length + PRESET_MUSIC_THEMES.length})
              </h4>
              <span className="text-[10px] text-purple-400 font-mono">Custom & Presets</span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {/* User Saved Custom Themes */}
              {savedCustomThemes.map((theme) => (
                <div
                  key={theme.id}
                  onClick={() => loadThemeIntoForm(theme)}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-purple-950/80 border border-purple-800/60 hover:border-purple-500 transition-all cursor-pointer flex items-center justify-between gap-2 group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">{theme.icon}</span>
                    <div className="truncate">
                      <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                        <span className="truncate">{theme.name}</span>
                        <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300">Custom</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{theme.tempoBpm} BPM • {theme.genreCategory}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteTheme(theme.id, e)}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Preset Themes */}
              {PRESET_MUSIC_THEMES.map((theme) => (
                <div
                  key={theme.id}
                  onClick={() => loadThemeIntoForm(theme)}
                  className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">{theme.icon}</span>
                    <div className="truncate">
                      <div className="text-xs font-bold text-white truncate">{theme.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{theme.tempoBpm} BPM • {theme.genreCategory}</div>
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

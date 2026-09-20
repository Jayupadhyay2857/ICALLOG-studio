import React, { useState } from 'react';
import {
  Film,
  Clapperboard,
  FileText,
  Camera,
  Sliders,
  Sparkles,
  Play,
  Download,
  Copy,
  Check,
  Send,
  Eye,
  Layers,
  Palette,
  Volume2,
  Clock,
  ChevronRight,
  Video,
  ListOrdered,
  Globe,
  Upload,
  FileUp,
  RefreshCw,
} from 'lucide-react';
import { triggerFilmScript, triggerFilmDirection } from '../lib/api.ts';
import { UserProfile } from '../types.ts';
import { ExplicitStudioToolbar } from './ExplicitStudioToolbar.tsx';
import { UniversalMediaCaptureToolbar } from './UniversalMediaCaptureToolbar.tsx';
import { ExplicitGenre } from '../lib/explicitEngine.ts';
import {
  SocialPlatformEditingToolbar,
  EditingState,
  TARGET_PLATFORMS,
} from './SocialPlatformEditingToolbar.tsx';

interface FilmStudioProps {
  user?: UserProfile;
  tokenBalance: number;
  openPaymentModal?: () => void;
  setActiveTab?: (tab: string) => void;
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

const DIRECTOR_STYLES = [
  {
    id: 'Hayao Miyazaki (Studio Ghibli)',
    name: 'Hayao Miyazaki (Studio Ghibli)',
    tagline: 'Lush hand-drawn pastoral landscapes, whimsical flight scenes, painterly soft watercolors (Spirited Away / Howl\'s Moving Castle)',
    aspectRatio: '1.85:1 Widescreen',
    lighting: 'Soft golden hour sunlight & vibrant painterly natural light',
    lut: 'Ghibli Soft Pastel Watercolor & Emerald Greens',
  },
  {
    id: 'Makoto Shinkai (Modern Anime)',
    name: 'Makoto Shinkai (Modern Anime)',
    tagline: 'Hyper-vibrant atmospheric skies, lens flare reflections, emotional male & female lead stories (Your Name / Weathering With You)',
    aspectRatio: '16:9 HD Anime',
    lighting: 'Crystalline twilight, glowing stardust & rain reflections',
    lut: 'Hyper-Saturated Indigo Sky & Crimson Sunset',
  },
  {
    id: 'Denis Villeneuve',
    name: 'Denis Villeneuve',
    tagline: 'Monumental scale, atmospheric tension, deep negative space (Dune / Blade Runner 2049)',
    aspectRatio: '2.39:1 Anamorphic',
    lighting: 'Volumetric golden haze & brutalist silhouettes',
    lut: 'Sand Dune Warm / Cyan Haze Split',
  },
  {
    id: 'Christopher Nolan',
    name: 'Christopher Nolan',
    tagline: 'High-contrast practical lighting, non-linear tension, 70mm IMAX framing (Oppenheimer / Inception)',
    aspectRatio: '1.43:1 IMAX',
    lighting: 'Hard chiaroscuro, natural sunlight, practical tungsten',
    lut: 'Kodak 5219 Photochemical Emulsion',
  },
  {
    id: 'Ridley Scott',
    name: 'Ridley Scott',
    tagline: 'Industrial smoke, backlighting, rain-streaked anamorphic flares (Alien / Gladiator)',
    aspectRatio: '2.39:1 Anamorphic',
    lighting: 'Heavy mineral haze, strong rim lights, neon reflections',
    lut: 'Cyber Bleach Bypass & Teal Shadows',
  },
  {
    id: 'Wes Anderson',
    name: 'Wes Anderson',
    tagline: 'Rigid central symmetry, pastel color blocking, planar lateral tracking (Grand Budapest Hotel)',
    aspectRatio: '1.37:1 Academy',
    lighting: 'Soft diffuse frontal flat lighting, zero harsh shadows',
    lut: 'Pastel Pink, Mustard Yellow & Mint Green',
  },
];

const GENRE_PRESETS = [
  'A - Anime & Studio Ghibli Fantasy (Japan)',
  'B - Bollywood & Mass Action Blockbuster (India)',
  'C - Cyberpunk Neon Synthwave Sci-Fi (Global)',
  'D - Dark Erotic Thriller & Neo-Noir (Explicit 18+ Uncensored)',
  'E - Extreme Body Horror & Visceral Splatter (Unrated)',
  'F - Folk Horror & Occult Ritual Thriller (Nordic/Global)',
  'G - Grindhouse B-Movie & Cult Exploitation (Unfiltered)',
  'H - Hardcore Mafia & Underworld Crime Syndicate (Global)',
  'I - Independent Festival Cinema & Art-House (Global)',
  'J - Japanese Samurai Wuxia & Katana Duel (Japan)',
  'K - Korean Webtoon & K-Drama Revenge Thriller (South Korea)',
  'L - Lo-Fi Retro 16-Bit Pixel Adventure (Global)',
  'M - Martial Arts Splatter & Kung Fu Action (Hong Kong)',
  'N - Neo-Noir Shadow Detective & Femme Fatale (Hollywood)',
  'O - Occult Dark Fantasy & Demonology (Global)',
  'P - Psychological Thriller & Mind-Bending Mystery (Global)',
  'Q - Quantum Cyber Matrix & Glitch Sci-Fi (Futuristic)',
  'R - Romantic Melodrama & Passionate Drama (Bollywood/Hollywood)',
  'S - Surrealist Avant-Garde & Dream Logic (Europe)',
  'T - Uncensored Shock Comedy & Satire (Global)',
  'U - Unreal Engine 5 Octane 3D Sci-Fi (Gaming)',
  'V - Vintage Spaghetti Western & Outlaw Gunfighter (Italy/USA)',
  'W - World Underground & Independent Rebel Cinema (Global)',
  'X - Xtreme Action & Car Chase Heist (Hollywood)',
  'Y - Yakuza Underground & Tokyo Neon Crime (Japan)',
  'Z - Zen Shanshui Wuxia Mountain Epic (China)',
];

export const FilmStudio: React.FC<FilmStudioProps> = ({
  user,
  tokenBalance,
  openPaymentModal,
  setActiveTab: setActiveTabProp,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'scriptwriting' | 'film_direction' | 'storyboard'>('scriptwriting');

  // Social Platform Editing Suite State
  const [editingState, setEditingState] = useState<EditingState>({
    selectedPlatform: TARGET_PLATFORMS[5], // YouTube Main Video / 4K Cinema
    trimStart: 0,
    trimEnd: 60,
    bgRemoverActive: false,
    bgType: 'blur',
    speed: 1.0,
    zoom: 1.0,
    panX: 0,
    panY: 0,
    blurLevel: 0,
    isFullscreen: false,
    likeCount: 512,
    isLiked: false,
    comments: [
      { id: '1', user: 'FilmProducer', text: 'Impressive screenplay and camera direction notes!', time: '10m ago' },
    ],
    alterPrompt: 'Turn night scene to Cyberpunk rainy sunset with volumetric lens flares',
    alterStyle: 'cinematic_noir',
  });

  // Scriptwriting State
  const [scriptTitle, setScriptTitle] = useState('NEO-METROPOLIS 2099: PROTOCOL ZERO');
  const [genre, setGenre] = useState('Dark Erotic Thriller & Neo-Noir (Explicit 18+ Uncensored)');
  const [scriptLanguage, setScriptLanguage] = useState<string>('English (Hollywood)');
  const [isTranslatingScript, setIsTranslatingScript] = useState<boolean>(false);
  const [logline, setLogline] = useState(
    'In a rain-drenched cyberpunk megalopolis, a rogue synthetic agent must recover an encrypted neural core before the corporate security network initiates an orbital purge.'
  );
  const [characters, setCharacters] = useState('Aria (Cybernetic operative), Marcus (Rebel underground leader), Cyber-Core V18 (Synthetic AI Oracle)');
  const [tone, setTone] = useState('Gritty, atmospheric, heart-pounding suspense');
  const [sceneCount, setSceneCount] = useState(2);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<string>(`TITLE: NEO-METROPOLIS 2099: PROTOCOL ZERO
WRITTEN BY: iCALLOG AI Screenplay Engine
GENRE: Cyberpunk Sci-Fi
TONE: Gritty, atmospheric, heart-pounding suspense

=======================================================
LOGLINE:
In a rain-drenched cyberpunk megalopolis, a rogue synthetic agent must recover an encrypted neural core before the corporate security network initiates an orbital purge.
=======================================================

SCENE 1: EXT. CITADEL LOWER CATWALKS - NIGHT [ACID RAIN]

Drenching sheets of rain cascade across towering obsidian skyscrapers. Monolithic holographic advertisements flicker in cyan and magenta.

A high-speed mag-lev train screeches past overhead, casting strobing lattice shadows over the lower industrial catwalks.

Emerging from the steam is ARIA (30s). Drenched trench coat, an illuminated cybernetic optical visor humming faintly violet. In her mechanical right hand, she grips an encrypted neural drive.

ARIA
(whispering into comms collar)
Control, the primary vault is breached. The core cipher is live.

Static crackles through her earpiece. A deep, synthetic resonance cuts through the storm.

CYBER-CORE V18 (V.O.)
Proceed to Sector 7 extraction. They already know you are inside the mainframe.

A sharp METALLIC CLACK echoes from the steam behind her. Two heavy tactical droids decloak from the mist, twin crimson targeting lasers pinning her chest.

ARIA
(smiles, unholstering plasma blade)
Then let us make sure they do not forget it.

ARIA DASHES forward as plasma fire illuminates the midnight sky--

CUT TO:

SCENE 2: INT. SUB-LEVEL CORE VAULT - CONTINUOUS

Sparks shower from ruptured conduit cables. The air is thick with ozone and cooling gas.

Aria slides across the reflective mirrored floor, slamming the drive into the central pedestal.

TERMINAL VOICE (A.I.)
Access Granted. Master Protocol V18 Initialized.`);

  const [copiedScript, setCopiedScript] = useState(false);

  // Film Direction State
  const [selectedDirector, setSelectedDirector] = useState(DIRECTOR_STYLES[0].id);
  const [aspectRatio, setAspectRatio] = useState('2.39:1 Anamorphic Cinema');
  const [lightingStyle, setLightingStyle] = useState('Three-point high contrast chiaroscuro with atmospheric mineral haze');
  const [colorPalette, setColorPalette] = useState('Teal & Amber Split-Tone LUT');
  const [isGeneratingDirection, setIsGeneratingDirection] = useState(false);

  const [directionPlan, setDirectionPlan] = useState<{
    visualMoodboard: string;
    lightingSetup: string;
    colorGradeLUT: string;
    soundDesignDirection: string;
    shotList: Array<{
      shotNumber: number;
      shotType: string;
      cameraMovement: string;
      lens: string;
      description: string;
      audioCues: string;
      directorNotes: string;
    }>;
  }>({
    visualMoodboard: 'Cinematic visual atmosphere inspired by Denis Villeneuve. Monumental scale compositions with deep negative space, tactile atmospheric rain haze, and brooding focal tension.',
    lightingSetup: 'Three-point high-contrast lighting: 1200W HMI soft key at 45 degrees, negative fill on the shadow side for high-ratio falloff, and strong tungsten/neon rim light highlighting rain droplets.',
    colorGradeLUT: 'Teal and Amber Split-Tone LUT: Deep crushed blacks with cool cyan midtones in the shadows, glowing warm amber highlights for skin tones and visor glows.',
    soundDesignDirection: 'Immersion through low-frequency sub-bass drones (30Hz-45Hz), isolated spatial rain Foley, tactile metallic armor clinks, and sudden silence before high-intensity action hits.',
    shotList: [
      {
        shotNumber: 1,
        shotType: 'Extreme Wide Shot (EWS)',
        cameraMovement: 'Slow Crane Downward Tracking with Rain Foreground',
        lens: '28mm Master Anamorphic T1.9',
        description: 'Establish the towering cyber-spires of the citadel. Rain slicing across the lens flare.',
        audioCues: 'Deep orchestral sub-bass swell, thunder clap in surround left.',
        directorNotes: 'Allow the frame to breathe for 4 seconds before the protagonist enters the silhouette.',
      },
      {
        shotNumber: 2,
        shotType: 'Medium Tracking Shot (MS)',
        cameraMovement: 'Steadicam tracking backward as character advances',
        lens: '40mm Prime Lens, Shallow Depth of Field (f/1.8)',
        description: 'Aria strides down the catwalk, moisture dripping from her collar. Neural drive glows cyan.',
        audioCues: 'Tactile heavy footsteps splashing on metal grate, rapid breathing.',
        directorNotes: 'Keep the camera locked onto Aria eye-line. Tension must rise with each step.',
      },
      {
        shotNumber: 3,
        shotType: 'Tight Close-Up (CU)',
        cameraMovement: 'Snap Push-In on weapon unholstering',
        lens: '85mm Macro Prime (f/1.4)',
        description: 'Plasma blade ignites with sudden violet energy bloom reflecting in her iris.',
        audioCues: 'High-frequency plasma hum slicing through the rain hiss.',
        directorNotes: 'Hold on her resolute gaze for half a beat before cutting to action.',
      },
      {
        shotNumber: 4,
        shotType: 'Dutch Angle Over-The-Shoulder (OTS)',
        cameraMovement: 'Whip pan to hostile tactical droids locking weapons',
        lens: '35mm Wide Anamorphic',
        description: 'Two massive armored droids materialize from steam, twin targeting lasers crossing the frame.',
        audioCues: 'Hydraulic lock-on chirp, industrial synthetic riser.',
        directorNotes: 'Heighten spatial disorientation with a 15-degree canted angle.',
      },
    ],
  });

  const [selectedExplicitGenre, setSelectedExplicitGenre] = useState<string>('cinematic_hyperrealism');
  const activeDirectorObj = DIRECTOR_STYLES.find((d) => d.id === selectedDirector) || DIRECTOR_STYLES[0];

  // Handle External Script File Upload (.txt, .fdx, .md, .docx, .json, .pdf)
  const handleScriptFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setGeneratedScript(content);
        setScriptTitle(file.name.replace(/\.[^/.]+$/, '').toUpperCase());
        onNotify('External Script Imported!', `Loaded external script file "${file.name}" (${(file.size / 1024).toFixed(1)} KB)`, 'success');
      }
    };
    reader.readAsText(file);
  };

  // Handle Translate / Adapt Script into Selected Language
  const handleTranslateScript = () => {
    setIsTranslatingScript(true);
    onNotify('AI Screenplay Translator', `Adapting screenplay into ${scriptLanguage}...`, 'info');

    setTimeout(() => {
      setIsTranslatingScript(false);
      setGeneratedScript((prev) => `[LANG: ${scriptLanguage.toUpperCase()} - ADAPTED SCREENPLAY]\n\n` + prev);
      onNotify('Translation Complete', `Screenplay adapted & formatted in ${scriptLanguage}!`, 'success');
    }, 1500);
  };

  // Handle Script Generation
  const handleGenerateScript = async () => {
    try {
      setIsGeneratingScript(true);
      const res = await triggerFilmScript({
        title: scriptTitle,
        genre,
        logline,
        characters,
        tone,
        sceneCount,
        userId: user?.id,
      });

      if (res.script && res.script.screenplay) {
        setGeneratedScript(res.script.screenplay);
      }
      onNotify('Screenplay Formatted', `Hollywood screenplay for "${scriptTitle}" generated successfully!`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Screenplay generation failed';
      onNotify('Script Generation Error', msg, 'error');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Handle Film Direction Generation
  const handleGenerateDirection = async () => {
    try {
      setIsGeneratingDirection(true);
      const res = await triggerFilmDirection({
        script: generatedScript,
        directorStyle: selectedDirector,
        aspectRatio,
        lightingStyle,
        colorPalette,
        userId: user?.id,
      });

      if (res.directionPlan) {
        setDirectionPlan(res.directionPlan);
      }
      onNotify('Director Plan Ready', `Master Shot List & Production Blueprint formulated for ${selectedDirector}!`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Direction planning failed';
      onNotify('Direction Planning Error', msg, 'error');
    } finally {
      setIsGeneratingDirection(false);
    }
  };

  // Copy Screenplay to Clipboard
  const handleCopyScript = () => {
    navigator.clipboard.writeText(generatedScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
    onNotify('Copied', 'Screenplay copied to clipboard.', 'info');
  };

  // Download Screenplay File
  const handleDownloadScript = () => {
    const blob = new Blob([generatedScript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scriptTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_screenplay.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('Exported', 'Screenplay file downloaded.', 'success');
  };

  // Download Shotlist
  const handleDownloadShotlist = () => {
    const blob = new Blob([JSON.stringify(directionPlan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scriptTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_directors_shotlist.json`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('Exported', "Director's Master Shot List downloaded.", 'success');
  };

  return (
    <div className="space-y-6">
      {/* Universal Studio Navigation Bar */}
      <UniversalMediaCaptureToolbar activeTab="film_studio" setActiveTab={setActiveTabProp} />

      {/* Studio Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Film className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-['Syne'] tracking-wide">
              Film Making & Direction Suite
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Professional AI Screenwriting, Professional Standard Sluglines, Director's Master Shot List, Camera Lenses, and Lighting Setup.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('scriptwriting')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-['Syne'] flex items-center gap-2 transition-all ${
              activeTab === 'scriptwriting'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-900/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" /> Script Writing
          </button>
          <button
            onClick={() => setActiveTab('film_direction')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-['Syne'] flex items-center gap-2 transition-all ${
              activeTab === 'film_direction'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-900/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clapperboard className="w-4 h-4" /> Film Direction
          </button>
          <button
            onClick={() => setActiveTab('storyboard')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-['Syne'] flex items-center gap-2 transition-all ${
              activeTab === 'storyboard'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" /> Storyboard Cards
          </button>
        </div>
      </div>

      {/* Explicit & Unrestricted Studio Mode Toolbar with All Genres */}
      {user && (
        <ExplicitStudioToolbar
          user={user}
          currentStudio="film"
          activeGenreId={selectedExplicitGenre}
          onSelectGenre={(g) => {
            setSelectedExplicitGenre(g.id);
            setGenre(g.name);
          }}
          currentPrompt={logline}
          onApplyPromptModifier={(enhanced) => setLogline(enhanced)}
          onOpenVipModal={openPaymentModal}
          onNotify={onNotify}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 1: SCRIPT WRITING ENGINE */}
      {/* ========================================================================= */}
      {activeTab === 'scriptwriting' && (
        <div className="space-y-4">
          {user?.vipTier === 'free' && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-900 border border-amber-500/40 flex flex-wrap items-center justify-between gap-2 text-xs shadow-md">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 font-bold">
                  🆓 FREE PLAN LIMITATIONS
                </span>
                <span className="text-slate-300 font-medium">
                  Free Tier: <b>1-3 Scenes Max</b> • Upgrade to Premium VIP for <b>100+ Scene Feature-Length Screenplays</b> & Shot Lists!
                </span>
              </div>
              <button
                onClick={openPaymentModal}
                className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 transition-all"
              >
                <span>Unlock Unlimited Screenplays</span>
              </button>
            </div>
          )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Script Parameters Form */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-mono tracking-wider text-indigo-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Screenplay Parameters
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Hollywood Industry Standard
                </span>
              </div>

              {/* External Script File Importer */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <FileUp className="w-4 h-4 text-cyan-400" /> Import External Script File
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">.TXT, .FDX, .PDF, .MD, .DOCX</span>
                </div>

                <label className="p-3 rounded-xl border border-dashed border-slate-700 hover:border-cyan-500 bg-slate-900/60 hover:bg-slate-900 flex items-center justify-center gap-2 cursor-pointer transition-colors text-xs text-slate-300">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Browse or Drag & Drop External Script File</span>
                  <input
                    type="file"
                    accept=".txt,.fdx,.pdf,.docx,.md,.json"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleScriptFileUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Title & Language Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-semibold">Film Title</label>
                  <input
                    type="text"
                    value={scriptTitle}
                    onChange={(e) => setScriptTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. INCEPTION: BEYOND TIME"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-semibold flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" /> Script Language
                  </label>
                  <select
                    value={scriptLanguage}
                    onChange={(e) => setScriptLanguage(e.target.value)}
                    className="w-full py-2 px-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option>Hindi / Hinglish</option>
                    <option>English (Hollywood)</option>
                    <option>Punjabi</option>
                    <option>Spanish / Español</option>
                    <option>French / Français</option>
                    <option>Japanese / 日本語</option>
                    <option>Korean / 한국어</option>
                    <option>German / Deutsch</option>
                    <option>Russian / Русский</option>
                    <option>Arabic / العربية</option>
                    <option>Mandarin / 中文</option>
                    <option>Tamil / Telugu</option>
                    <option>Italian / Italiano</option>
                  </select>
                </div>
              </div>

              {/* Genre Selector Dropdown & Preset Pills */}
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">
                  Worldwide Film Genre (Including Explicit 18+ & Unrated)
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full py-2 px-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-semibold focus:border-indigo-500 focus:outline-none mb-2"
                >
                  {GENRE_PRESETS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>

                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-slate-950 rounded-xl border border-slate-800 custom-scrollbar">
                  {GENRE_PRESETS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGenre(g)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                        genre === g
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {g.split(' - ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logline */}
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">Logline / Core Premise</label>
                <textarea
                  rows={3}
                  value={logline}
                  onChange={(e) => setLogline(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none resize-none"
                  placeholder="The one-sentence dramatic hook..."
                />
              </div>

              {/* Characters */}
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">Character Ensembles</label>
                <input
                  type="text"
                  value={characters}
                  onChange={(e) => setCharacters(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="Aria (Operative), Marcus (Rebel), Cyber-Core (AI)"
                />
              </div>

              {/* Tone & Scene Count */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-semibold">Tone / Atmosphere</label>
                  <input
                    type="text"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-semibold">Scenes to Generate</label>
                  <select
                    value={sceneCount}
                    onChange={(e) => setSceneCount(parseInt(e.target.value))}
                    className="w-full py-2 px-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value={1}>1 Scene (Opening Hook)</option>
                    <option value={2}>2 Scenes (Sequence Arc)</option>
                    <option value={3}>3 Scenes (Full Sequence)</option>
                  </select>
                </div>
              </div>

              {/* Generate Button */}
              <button
                type="button"
                onClick={handleGenerateScript}
                disabled={isGeneratingScript}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-600 text-white font-bold font-['Syne'] text-xs shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isGeneratingScript ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
                    Writing Screenplay...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    Write Hollywood Screenplay
                  </>
                )}
              </button>

              {/* Direct Bridge to Film Direction */}
              <button
                type="button"
                onClick={() => setActiveTab('film_direction')}
                className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Clapperboard className="w-3.5 h-3.5 text-amber-400" /> Direct This Screenplay in Director Suite
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Screenplay Courier Viewport */}
          <div className="lg:col-span-7 space-y-3">
            <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl space-y-3">
              {/* Viewer Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="text-xs font-mono text-slate-400 font-bold ml-2">
                    SCREENPLAY.FOUNTAIN ({scriptLanguage.toUpperCase()})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTranslateScript}
                    disabled={isTranslatingScript}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {isTranslatingScript ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                    <span className="text-[10px]">Adapt to {scriptLanguage}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyScript}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs flex items-center gap-1 transition-colors"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[10px]">{copiedScript ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadScript}
                    className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs flex items-center gap-1 transition-colors font-bold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Export .txt</span>
                  </button>
                </div>
              </div>

              {/* Formatted Script Terminal */}
              <div className="bg-[#080c14] p-5 rounded-2xl border border-slate-900 overflow-x-auto max-h-[580px] overflow-y-auto">
                <pre className="font-mono text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap selection:bg-indigo-600 selection:text-white">
                  {generatedScript}
                </pre>
              </div>

              {/* Screenplay Stats Footer */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 font-mono">
                <span>Format: WGA Standard Screenplay</span>
                <span>Scene Count: {sceneCount}</span>
                <span>Slugline Standard: INT./EXT. CAPS</span>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FILM DIRECTION MASTER */}
      {/* ========================================================================= */}
      {activeTab === 'film_direction' && (
        <div className="space-y-6">
          {/* Director Selection & Camera Specs Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Director Style */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Clapperboard className="w-3.5 h-3.5" /> Director Vision Style
              </label>
              <select
                value={selectedDirector}
                onChange={(e) => setSelectedDirector(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-amber-500 focus:outline-none font-semibold"
              >
                {DIRECTOR_STYLES.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">{activeDirectorObj.tagline}</p>
            </div>

            {/* Aspect Ratio & Lens Framing */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" /> Cinema Aspect Ratio
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none font-semibold"
              >
                <option value="2.39:1 Anamorphic Cinema">2.39:1 Anamorphic (Widescreen Epic)</option>
                <option value="1.43:1 IMAX 70mm">1.43:1 IMAX (Giant Practical Scale)</option>
                <option value="1.85:1 Academy Flat">1.85:1 Academy (Standard Cinema)</option>
                <option value="16:9 Digital Native">16:9 Broadcast (Ultra HD TV)</option>
                <option value="1.37:1 Classic Academy">1.37:1 Classic (Planar Tableau)</option>
              </select>
              <p className="text-[11px] text-slate-400">Default Lens: Master Anamorphic Prime (28mm-85mm)</p>
            </div>

            {/* Production Action Button */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-2">
              <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" /> Direction Pipeline
              </label>
              <button
                type="button"
                onClick={handleGenerateDirection}
                disabled={isGeneratingDirection}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold font-['Syne'] text-xs shadow-lg shadow-amber-900/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isGeneratingDirection ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                    Formulating Shot List...
                  </>
                ) : (
                  <>
                    <Clapperboard className="w-4 h-4 text-slate-950" />
                    Direct Master Shot List
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleDownloadShotlist}
                className="text-[11px] text-slate-400 hover:text-white flex items-center justify-center gap-1 font-mono transition-colors"
              >
                <Download className="w-3 h-3" /> Export Production JSON
              </button>
            </div>
          </div>

          {/* Director Blueprint Panels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5">
              <span className="text-[11px] font-bold text-amber-400 font-mono flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" /> Visual Moodboard & Staging
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">{directionPlan.visualMoodboard}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5">
              <span className="text-[11px] font-bold text-cyan-400 font-mono flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" /> Lighting Grid & Atmosphere
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">{directionPlan.lightingSetup}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5">
              <span className="text-[11px] font-bold text-purple-400 font-mono flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" /> Sound Design & Score Cues
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">{directionPlan.soundDesignDirection}</p>
            </div>
          </div>

          {/* Master Shot List Table */}
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-amber-400" /> Director's Master Production Shot List
                </h3>
                <p className="text-xs text-slate-400">
                  Comprehensive camera angles, lens choices, camera moves, and actor direction notes.
                </p>
              </div>
              <span className="text-xs font-mono text-amber-300 font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30">
                {directionPlan.shotList.length} Shots Planned
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Shot #</th>
                    <th className="py-2.5 px-3">Shot Type</th>
                    <th className="py-2.5 px-3">Lens & Movement</th>
                    <th className="py-2.5 px-4">Action & Frame Framing</th>
                    <th className="py-2.5 px-4">Director's Actor Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {directionPlan.shotList.map((shot) => (
                    <tr key={shot.shotNumber} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-amber-400 align-top">
                        #{shot.shotNumber}
                      </td>
                      <td className="py-3 px-3 align-top">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {shot.shotType}
                        </span>
                      </td>
                      <td className="py-3 px-3 align-top font-mono text-[11px] space-y-1">
                        <div className="text-cyan-300 font-bold">{shot.lens}</div>
                        <div className="text-slate-400 text-[10px]">{shot.cameraMovement}</div>
                      </td>
                      <td className="py-3 px-4 align-top space-y-1">
                        <p className="text-slate-200">{shot.description}</p>
                        <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Volume2 className="w-3 h-3 text-purple-400 shrink-0" /> {shot.audioCues}
                        </p>
                      </td>
                      <td className="py-3 px-4 align-top text-slate-300 italic text-[11px] bg-slate-950/40 rounded-xl">
                        "{shot.directorNotes}"
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STORYBOARD CARDS */}
      {/* ========================================================================= */}
      {activeTab === 'storyboard' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-['Syne']">
                Cinematic Storyboard Sequence
              </h3>
              <p className="text-xs text-slate-400">
                Visual representations and camera framing composition for each shot in the sequence.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('film_direction')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Modify Shotlist
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {directionPlan.shotList.map((shot, idx) => (
              <div
                key={shot.shotNumber}
                className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 hover:border-slate-700 transition-all group"
              >
                {/* Frame Preview Header */}
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5" /> Shot {shot.shotNumber}: {shot.shotType}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800 font-bold">
                    {shot.lens}
                  </span>
                </div>

                {/* Aspect-Ratio Framing Box */}
                <div className="relative aspect-video rounded-2xl bg-[#070b12] border border-slate-800 overflow-hidden flex flex-col items-center justify-center p-4 text-center group-hover:border-cyan-500/40 transition-colors">
                  {/* Subtle cinema frame guides */}
                  <div className="absolute inset-4 border border-dashed border-cyan-500/20 pointer-events-none rounded-xl" />
                  <div className="absolute top-2 left-3 text-[9px] font-mono text-cyan-400/60 uppercase">
                    CAM A • {aspectRatio}
                  </div>
                  <div className="absolute bottom-2 right-3 text-[9px] font-mono text-amber-400/60 uppercase">
                    {shot.cameraMovement}
                  </div>

                  <Clapperboard className="w-8 h-8 text-slate-600 mb-2 group-hover:text-cyan-400 transition-colors" />
                  <p className="text-xs text-slate-300 max-w-xs font-medium">{shot.description}</p>
                </div>

                {/* Director Staging Note */}
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] space-y-1">
                  <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                    Director Staging:
                  </div>
                  <p className="text-slate-300 italic">{shot.directorNotes}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Universal Social Platform & Filmmaking Editing Suite */}
      <div className="mt-6">
        <SocialPlatformEditingToolbar
          mediaType="film"
          editingState={editingState}
          onUpdateState={(updated) => setEditingState((prev) => ({ ...prev, ...updated }))}
          onApplyAlteration={(alterPrompt, alterStyle) => {
            setScriptTitle(`[ALTERED: ${alterStyle}] ${scriptTitle}`);
            onNotify('Film Script & Shots Altered', `Updated screenplay direction to ${alterStyle}!`, 'success');
          }}
          onNotify={onNotify}
        />
      </div>
    </div>
  );
};

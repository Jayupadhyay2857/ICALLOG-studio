import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Sparkles,
  Clapperboard,
  Film,
  FileText,
  Presentation,
  Sheet,
  Award,
  Box,
  Image as ImageIcon,
  Video,
  Mic,
  BookOpen,
  ChevronRight,
  Smile,
  ArrowRight,
  FolderKanban,
  Plus,
  Music,
  Globe,
  Camera,
  Download,
  Share2,
  Users,
  Gamepad2,
  X,
  CreditCard,
  HardDrive,
  Cookie,
  KeyRound,
  Shield,
  Layers,
  Wand2,
  Clock,
  Radio,
  Sliders,
  Palette,
  Eye,
  Tv,
  Atom,
  Flame,
  Binary,
  Volume2,
  FileCode,
  Compass,
  Cpu,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { ActiveTab, UserProfile, ProjectItem } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { ProfileTab } from './ProfileSettingsModal.tsx';

export type GlobalSearchFilter =
  | 'all'
  | 'studios'
  | '3d'
  | 'video'
  | 'audio'
  | 'office'
  | 'design'
  | 'projects'
  | 'actions';

export interface GlobalSearchItem {
  id: string;
  title: string;
  description: string;
  category: string;
  filterType: 'studios' | '3d' | 'video' | 'audio' | 'office' | 'design' | 'projects' | 'actions';
  icon: React.ReactNode;
  iconBg?: string;
  tab: ActiveTab;
  subTab?: string;
  action?: () => void;
  badge?: string;
  badgeColor?: string;
  keywords?: string[];
  hotkey?: string;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onSelectSubTab?: (tab: ActiveTab, subTab: string) => void;
  openAdminModal?: () => void;
  openHistoryModal?: () => void;
  openProfileModal?: (tab?: ProfileTab) => void;
  openOmniEnhanceModal?: () => void;
  openVoiceHistory?: () => void;
  user?: UserProfile;
}

const RECENT_SEARCHES_KEY = 'icallog_global_recent_searches_v1';

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  onSelectSubTab,
  openAdminModal,
  openHistoryModal,
  openProfileModal,
  openOmniEnhanceModal,
  openVoiceHistory,
  user,
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<GlobalSearchFilter>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [userProjects, setUserProjects] = useState<ProjectItem[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Load recent searches and user saved projects
  useEffect(() => {
    if (isOpen) {
      try {
        const storedRecents = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (storedRecents) {
          const parsed = JSON.parse(storedRecents);
          if (Array.isArray(parsed)) setRecentSearches(parsed.slice(0, 6));
        }
      } catch {
        // ignore
      }

      try {
        const storedProjects = localStorage.getItem('icallog_user_projects_v1');
        if (storedProjects) {
          const parsed = JSON.parse(storedProjects);
          if (Array.isArray(parsed)) setUserProjects(parsed);
        }
      } catch {
        // ignore
      }

      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

  const saveRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;
    try {
      const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleClearRecents = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  };

  // Master Comprehensive Search Catalog of All Studios & Tools
  const ALL_SEARCH_ITEMS: GlobalSearchItem[] = useMemo(() => {
    const items: GlobalSearchItem[] = [
      // 1. CORE WORKSPACE & DASHBOARD
      {
        id: 'studio_role_dashboard',
        title: 'Role Workspace & Persona Dashboard',
        description: 'Personalized multi-role hub customized for Creator, Student, Teacher, and Studio Pro.',
        category: 'Workspace & Core',
        filterType: 'studios',
        icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
        iconBg: 'bg-indigo-500/20 border-indigo-500/30',
        tab: 'role_dashboard',
        badge: 'Personalized',
        badgeColor: 'text-indigo-300 bg-indigo-950 border-indigo-500/30',
        keywords: ['dashboard', 'role', 'persona', 'workspace', 'home', 'overview'],
      },
      {
        id: 'studio_projects_hub',
        title: 'Projects Hub & Saved Vault',
        description: 'Organize, modify, duplicate, pin, and multi-track export all your saved creation files.',
        category: 'Workspace & Core',
        filterType: 'projects',
        icon: <FolderKanban className="w-4 h-4 text-cyan-400" />,
        iconBg: 'bg-cyan-500/20 border-cyan-500/30',
        tab: 'projects_hub',
        badge: 'File Vault',
        badgeColor: 'text-cyan-300 bg-cyan-950 border-cyan-500/30',
        keywords: ['projects', 'saved', 'files', 'hub', 'documents', 'archive'],
      },
      {
        id: 'studio_welcome_blog',
        title: 'Master Welcome Guide & Feature Blog',
        description: 'Explore full system capabilities, update release notes, AI tutorials, and changelogs.',
        category: 'Workspace & Core',
        filterType: 'studios',
        icon: <BookOpen className="w-4 h-4 text-teal-400" />,
        iconBg: 'bg-teal-500/20 border-teal-500/30',
        tab: 'welcome_blog',
        badge: 'Guide',
        badgeColor: 'text-teal-300 bg-teal-950 border-teal-500/30',
        keywords: ['blog', 'welcome', 'guide', 'manual', 'help', 'tutorial'],
      },

      // 2. 3D & WEBGL STUDIOS
      {
        id: 'studio_3d_engine',
        title: '3D WebGL Engine & Auto-Rigging Studio',
        description: '17-bone inverse kinematics skeleton, WebGL shaders, camera orbits, GLTF/OBJ import & export.',
        category: '3D & WebGL',
        filterType: '3d',
        icon: <Box className="w-4 h-4 text-cyan-400" />,
        iconBg: 'bg-cyan-500/20 border-cyan-500/30',
        tab: '3d_engine',
        badge: 'WebGL 3D',
        badgeColor: 'text-cyan-300 bg-cyan-950 border-cyan-500/30',
        keywords: ['3d', 'three.js', 'webgl', 'mesh', 'rigging', 'skeleton', 'gltf', 'obj', 'bones'],
      },
      {
        id: 'studio_holo_sculpt',
        title: 'HoloSculpt 3D & Holographic Voxel Studio',
        description: 'Sculpt virtual 3D clay, voxelize meshes, customize laser materials, and render 3D holograms.',
        category: '3D & WebGL',
        filterType: '3d',
        icon: <Atom className="w-4 h-4 text-purple-400" />,
        iconBg: 'bg-purple-500/20 border-purple-500/30',
        tab: 'holo_sculpt_3d',
        badge: 'Hologram',
        badgeColor: 'text-purple-300 bg-purple-950 border-purple-500/30',
        keywords: ['holosculpt', 'voxel', 'sculpt', 'clay', 'holographic', '3d'],
      },
      {
        id: 'studio_exoplanet_world',
        title: 'Exoplanet World 3D & Solar System Simulator',
        description: 'Procedural astronomical 3D planet synthesis, atmosphere scattering, ring systems & orbital physics.',
        category: '3D & WebGL',
        filterType: '3d',
        icon: <Compass className="w-4 h-4 text-amber-400" />,
        iconBg: 'bg-amber-500/20 border-amber-500/30',
        tab: 'exoplanet_world',
        badge: 'Space 3D',
        badgeColor: 'text-amber-300 bg-amber-950 border-amber-500/30',
        keywords: ['exoplanet', 'planet', 'space', 'solar', 'astronomy', 'orbit', 'simulator'],
      },
      {
        id: 'studio_metaverse_world',
        title: 'Metaverse World 3D Realm Builder',
        description: 'Build interactive cyber worlds, spatial avatars, neon citadels, and multiplayer metaverse nodes.',
        category: '3D & WebGL',
        filterType: '3d',
        icon: <Flame className="w-4 h-4 text-rose-400" />,
        iconBg: 'bg-rose-500/20 border-rose-500/30',
        tab: 'metaverse_world',
        badge: 'Metaverse',
        badgeColor: 'text-rose-300 bg-rose-950 border-rose-500/30',
        keywords: ['metaverse', 'world', 'virtual', 'vr', 'spatial', 'avatar', '3d'],
      },

      // 3. VIDEO & FILM STUDIOS
      {
        id: 'studio_pro_camera',
        title: 'Pro Camera Studio & 8K HDR Viewfinder',
        description: 'Real-time collaborative drawing, smart teleprompter, cinema LUTs, optical zoom & hardware flash.',
        category: 'Video & Cinema',
        filterType: 'video',
        icon: <Camera className="w-4 h-4 text-cyan-400" />,
        iconBg: 'bg-cyan-500/20 border-cyan-500/30',
        tab: 'pro_camera',
        badge: '8K HDR • Collab',
        badgeColor: 'text-cyan-300 bg-cyan-950 border-cyan-500/30',
        keywords: ['camera', 'webcam', 'record', 'teleprompter', 'annotation', 'draw', 'lut', 'hdr', 'video', '8k'],
        hotkey: 'Ctrl+R',
      },
      {
        id: 'studio_film_studio',
        title: 'AI Film Studio: Hollywood Screenplay & Direction',
        description: 'Industry-standard scriptwriter, Denis Villeneuve/Nolan director blocking, and shot list master.',
        category: 'Video & Cinema',
        filterType: 'video',
        icon: <Clapperboard className="w-4 h-4 text-amber-400" />,
        iconBg: 'bg-amber-500/20 border-amber-500/30',
        tab: 'film_studio',
        badge: 'Cinema',
        badgeColor: 'text-amber-300 bg-amber-950 border-amber-500/30',
        keywords: ['film', 'screenplay', 'script', 'director', 'shotlist', 'cinema', 'hollywood', 'movie'],
      },
      {
        id: 'studio_video_audio',
        title: '240p to 8K AI Video Suite & Cinema Renderer',
        description: 'Generative video sequences, dynamic camera motion, 60 FPS interpolation & Raytraced animation.',
        category: 'Video & Cinema',
        filterType: 'video',
        icon: <Video className="w-4 h-4 text-rose-400" />,
        iconBg: 'bg-rose-500/20 border-rose-500/30',
        tab: 'video_audio',
        badge: '8K Video',
        badgeColor: 'text-rose-300 bg-rose-950 border-rose-500/30',
        keywords: ['video', 'animation', 'render', '8k', 'cinema', 'motion', 'upscale', 'fps'],
      },
      {
        id: 'studio_neural_cinema',
        title: 'Neural Cinema Studio & Generative Shot Director',
        description: 'Procedural cinematic scenes, neural light passes, camera crane tracks, and anamorphic depth.',
        category: 'Video & Cinema',
        filterType: 'video',
        icon: <Tv className="w-4 h-4 text-indigo-400" />,
        iconBg: 'bg-indigo-500/20 border-indigo-500/30',
        tab: 'neural_cinema',
        badge: 'Neural VFX',
        badgeColor: 'text-indigo-300 bg-indigo-950 border-indigo-500/30',
        keywords: ['neural', 'cinema', 'vfx', 'generative', 'director', 'scenes'],
      },
      {
        id: 'studio_quantum_director',
        title: 'Quantum Multiverse Storytelling Director',
        description: 'Branching cinematic narratives, parallel timeline trees, and quantum script simulation.',
        category: 'Video & Cinema',
        filterType: 'video',
        icon: <Zap className="w-4 h-4 text-amber-400" />,
        iconBg: 'bg-amber-500/20 border-amber-500/30',
        tab: 'quantum_director',
        badge: 'Multiverse',
        badgeColor: 'text-amber-300 bg-amber-950 border-amber-500/30',
        keywords: ['quantum', 'storytelling', 'branching', 'multiverse', 'director', 'timeline'],
      },
      {
        id: 'studio_media_mixer',
        title: 'Multi-Media AI Fusion Mixer',
        description: 'Blend and cross-synthesize Image+Video, Video+Video, Image+Image with multi-modal AI logic.',
        category: 'Video & Cinema',
        filterType: 'video',
        icon: <Wand2 className="w-4 h-4 text-purple-400" />,
        iconBg: 'bg-purple-500/20 border-purple-500/30',
        tab: 'media_mixer',
        badge: 'Fusion',
        badgeColor: 'text-purple-300 bg-purple-950 border-purple-500/30',
        keywords: ['mixer', 'fusion', 'blend', 'image', 'video', 'combine', 'multimodal'],
      },
      {
        id: 'studio_manga_storyboard',
        title: 'Manga Storyboard & Comic Strip Studio',
        description: 'Transform screenplay scenes into stylized manga panels, comic books, speech balloons & webtoons.',
        category: 'Video & Cinema',
        filterType: 'video',
        icon: <Film className="w-4 h-4 text-pink-400" />,
        iconBg: 'bg-pink-500/20 border-pink-500/30',
        tab: 'manga_storyboard',
        badge: 'Manga / Comic',
        badgeColor: 'text-pink-300 bg-pink-950 border-pink-500/30',
        keywords: ['manga', 'storyboard', 'comic', 'strip', 'panels', 'webtoon', 'anime'],
      },
      {
        id: 'studio_auto_dubbing',
        title: 'AI Multi-Language Video Dubbing & Subtitles',
        description: 'Auto-translate, voice-match, and generate synchronized subtitles (.SRT) in 20+ global languages.',
        category: 'Video & Cinema',
        filterType: 'video',
        icon: <Globe className="w-4 h-4 text-emerald-400" />,
        iconBg: 'bg-emerald-500/20 border-emerald-500/30',
        tab: 'auto_dubbing',
        badge: 'Dubbing',
        badgeColor: 'text-emerald-300 bg-emerald-950 border-emerald-500/30',
        keywords: ['dubbing', 'translate', 'languages', 'subtitles', 'srt', 'voiceover', 'lipsync'],
      },

      // 4. AUDIO & MUSIC STUDIOS
      {
        id: 'studio_song_studio',
        title: 'Song & Music Studio (A to Z 26 Genres)',
        description: 'Compose full songs, synthesize vocals, customize lyrics, set BPM, and export multi-track audio stems.',
        category: 'Audio & Music',
        filterType: 'audio',
        icon: <Music className="w-4 h-4 text-purple-400" />,
        iconBg: 'bg-purple-500/20 border-purple-500/30',
        tab: 'song_studio',
        badge: 'A-Z Music',
        badgeColor: 'text-purple-300 bg-purple-950 border-purple-500/30',
        keywords: ['music', 'song', 'lyrics', 'vocals', 'bpm', 'genres', 'bhangra', 'rock', 'pop', 'edm', 'stems'],
      },
      {
        id: 'studio_voice_converter',
        title: 'Human-to-AI Voice Converter & Pitch Studio',
        description: 'Morph voice timbre, apply formant shifts, remove noise, and synthesize custom vocal personas.',
        category: 'Audio & Music',
        filterType: 'audio',
        icon: <Mic className="w-4 h-4 text-rose-400" />,
        iconBg: 'bg-rose-500/20 border-rose-500/30',
        tab: 'voice_converter',
        badge: 'Voice Morph',
        badgeColor: 'text-rose-300 bg-rose-950 border-rose-500/30',
        keywords: ['voice', 'pitch', 'vocal', 'morph', 'clarity', 'microphone', 'convert'],
      },
      {
        id: 'studio_voice_clone',
        title: 'Neural Voice Cloning & Custom Speech Profiles',
        description: 'Sample voice snippets, train personalized vocal clones, and synthesize text-to-speech in your voice.',
        category: 'Audio & Music',
        filterType: 'audio',
        icon: <Radio className="w-4 h-4 text-indigo-400" />,
        iconBg: 'bg-indigo-500/20 border-indigo-500/30',
        tab: 'voice_clone',
        badge: 'Voice Clone',
        badgeColor: 'text-indigo-300 bg-indigo-950 border-indigo-500/30',
        keywords: ['voice', 'clone', 'speech', 'tts', 'synthesizer', 'neural'],
      },
      {
        id: 'studio_podcast_studio',
        title: 'Multi-Host AI Podcast & Audio Show Studio',
        description: 'Produce conversational multi-host podcasts, sound effects, audio cues, and RSS publishing.',
        category: 'Audio & Music',
        filterType: 'audio',
        icon: <Volume2 className="w-4 h-4 text-amber-400" />,
        iconBg: 'bg-amber-500/20 border-amber-500/30',
        tab: 'podcast_studio',
        badge: 'Podcast',
        badgeColor: 'text-amber-300 bg-amber-950 border-amber-500/30',
        keywords: ['podcast', 'audio', 'hosts', 'show', 'mic', 'recording', 'broadcast'],
      },

      // 5. IMAGE & CREATIVE MEDIA
      {
        id: 'studio_image_studio',
        title: '240p to 8K AI Image Studio & Super-Resolution',
        description: 'Ultra-photorealistic prompts, cyber styles, aspect ratio control, and 8K neural upscaling.',
        category: 'Creative Media',
        filterType: 'studios',
        icon: <ImageIcon className="w-4 h-4 text-pink-400" />,
        iconBg: 'bg-pink-500/20 border-pink-500/30',
        tab: 'image_studio',
        badge: '8K Image',
        badgeColor: 'text-pink-300 bg-pink-950 border-pink-500/30',
        keywords: ['image', 'photo', 'picture', '8k', 'upscale', 'art', 'photorealistic', 'prompt'],
      },
      {
        id: 'studio_meme_gif',
        title: 'Viral Meme & Animated GIF Creator Studio',
        description: 'Create viral social memes, upload face selfies, AI Face Swap, and export animated GIFs.',
        category: 'Creative Media',
        filterType: 'studios',
        icon: <Smile className="w-4 h-4 text-amber-400" />,
        iconBg: 'bg-amber-500/20 border-amber-500/30',
        tab: 'meme_gif_studio',
        badge: 'Viral Meme',
        badgeColor: 'text-amber-300 bg-amber-950 border-amber-500/30',
        keywords: ['meme', 'gif', 'viral', 'humor', 'funny', 'faceswap', 'social'],
      },
      {
        id: 'studio_game_studio',
        title: 'AI Game Maker & 60 FPS Interactive Arcade',
        description: 'Play and build Space Shooters, Neon Runners, Brick Breakers, Cyber Snake with HTML5 export.',
        category: 'Creative Media',
        filterType: 'studios',
        icon: <Gamepad2 className="w-4 h-4 text-emerald-400" />,
        iconBg: 'bg-emerald-500/20 border-emerald-500/30',
        tab: 'game_studio',
        badge: '60 FPS Arcade',
        badgeColor: 'text-emerald-300 bg-emerald-950 border-emerald-500/30',
        keywords: ['game', 'arcade', 'play', 'build', 'snake', 'shooter', 'canvas', 'html5'],
      },
      {
        id: 'studio_digital_twin',
        title: 'AI Digital Twin & Interactive Avatar Studio',
        description: 'Train synthetic neural avatars, mimic speaking gestures, and configure virtual representatives.',
        category: 'Creative Media',
        filterType: 'studios',
        icon: <Eye className="w-4 h-4 text-cyan-400" />,
        iconBg: 'bg-cyan-500/20 border-cyan-500/30',
        tab: 'digital_twin',
        badge: 'Avatar Twin',
        badgeColor: 'text-cyan-300 bg-cyan-950 border-cyan-500/30',
        keywords: ['twin', 'avatar', 'digital', 'interactive', 'ai persona', 'spokesperson'],
      },
      {
        id: 'studio_time_capsule',
        title: 'Memory Time Capsule & Legacy Vault',
        description: 'Encrypt multimedia time capsules, set future reveal dates, and seal generational archives.',
        category: 'Creative Media',
        filterType: 'studios',
        icon: <Clock className="w-4 h-4 text-indigo-400" />,
        iconBg: 'bg-indigo-500/20 border-indigo-500/30',
        tab: 'time_capsule',
        badge: 'Vault',
        badgeColor: 'text-indigo-300 bg-indigo-950 border-indigo-500/30',
        keywords: ['time capsule', 'memory', 'legacy', 'archive', 'seal', 'encryption'],
      },

      // 6. COLLABORATION & SOCIAL
      {
        id: 'studio_live_collab',
        title: 'Live Collaborative Canvas & Real-time Whiteboard',
        description: 'Multi-user shared whiteboard, multiplayer cursor beacons, live chat, and audio pin drops.',
        category: 'Collaboration',
        filterType: 'studios',
        icon: <Users className="w-4 h-4 text-teal-400" />,
        iconBg: 'bg-teal-500/20 border-teal-500/30',
        tab: 'live_collab',
        badge: 'Multiplayer',
        badgeColor: 'text-teal-300 bg-teal-950 border-teal-500/30',
        keywords: ['collab', 'whiteboard', 'canvas', 'team', 'realtime', 'multiplayer', 'chat'],
      },
      {
        id: 'studio_collab_timeline',
        title: 'Collaborative Multi-Track Timeline Studio',
        description: 'Real-time collaborative audio/video timeline editing with peer cursor markers.',
        category: 'Collaboration',
        filterType: 'studios',
        icon: <Sliders className="w-4 h-4 text-purple-400" />,
        iconBg: 'bg-purple-500/20 border-purple-500/30',
        tab: 'collab_timeline',
        badge: 'Timeline',
        badgeColor: 'text-purple-300 bg-purple-950 border-purple-500/30',
        keywords: ['timeline', 'tracks', 'editing', 'collab', 'video', 'audio'],
      },
      {
        id: 'studio_social_publisher',
        title: '1-Click Social Auto-Publisher & Schedule Hub',
        description: 'Auto-format and schedule posts to YouTube Shorts, Instagram Reels, TikTok, and X.',
        category: 'Social & Distribution',
        filterType: 'studios',
        icon: <Share2 className="w-4 h-4 text-purple-400" />,
        iconBg: 'bg-purple-500/20 border-purple-500/30',
        tab: 'social_publisher',
        badge: 'Publisher',
        badgeColor: 'text-purple-300 bg-purple-950 border-purple-500/30',
        keywords: ['social', 'publisher', 'youtube', 'reels', 'tiktok', 'schedule', 'broadcast'],
      },
      {
        id: 'studio_creator_marketplace',
        title: 'Creator Marketplace & Asset Monetization Store',
        description: 'Buy and sell 3D rigged models, song stems, prompts, and templates with SWIFT/UPI payouts.',
        category: 'Social & Distribution',
        filterType: 'studios',
        icon: <CreditCard className="w-4 h-4 text-emerald-400" />,
        iconBg: 'bg-emerald-500/20 border-emerald-500/30',
        tab: 'creator_marketplace',
        badge: 'Store',
        badgeColor: 'text-emerald-300 bg-emerald-950 border-emerald-500/30',
        keywords: ['marketplace', 'store', 'buy', 'sell', 'monetize', 'assets', 'templates', 'payout'],
      },

      // 7. OFFICE & DOCUMENT SUITE
      {
        id: 'studio_office_docs',
        title: 'Office Suite: AI Word Document Generator',
        description: 'Generate formatted executive reports, academic papers, contracts, and proposals.',
        category: 'Office & Productivity',
        filterType: 'office',
        icon: <FileText className="w-4 h-4 text-indigo-400" />,
        iconBg: 'bg-indigo-500/20 border-indigo-500/30',
        tab: 'office_suite',
        subTab: 'docs',
        badge: 'Word Docs',
        badgeColor: 'text-indigo-300 bg-indigo-950 border-indigo-500/30',
        keywords: ['office', 'word', 'document', 'report', 'contract', 'proposal', 'writing'],
      },
      {
        id: 'studio_office_ppt',
        title: 'Office Suite: AI Slide Pitch Deck Creator',
        description: 'Generate investor pitch decks, keynote presentations, slide layouts, and PDF exports.',
        category: 'Office & Productivity',
        filterType: 'office',
        icon: <Presentation className="w-4 h-4 text-amber-400" />,
        iconBg: 'bg-amber-500/20 border-amber-500/30',
        tab: 'office_suite',
        subTab: 'ppt',
        badge: 'Slide PPT',
        badgeColor: 'text-amber-300 bg-amber-950 border-amber-500/30',
        keywords: ['office', 'ppt', 'slides', 'presentation', 'pitch deck', 'keynote', 'powerpoint'],
      },
      {
        id: 'studio_office_excel',
        title: 'Office Suite: AI Data Spreadsheet Analytics',
        description: 'Interactive Excel grid, automated CSV/XLS data formulas, and executive chart generators.',
        category: 'Office & Productivity',
        filterType: 'office',
        icon: <Sheet className="w-4 h-4 text-emerald-400" />,
        iconBg: 'bg-emerald-500/20 border-emerald-500/30',
        tab: 'office_suite',
        subTab: 'excel',
        badge: 'Excel Grid',
        badgeColor: 'text-emerald-300 bg-emerald-950 border-emerald-500/30',
        keywords: ['office', 'excel', 'sheet', 'spreadsheet', 'csv', 'data', 'formulas', 'analytics'],
      },

      // 8. DESIGN & IDENTITY SUITE
      {
        id: 'studio_design_favicon',
        title: 'Design Identity: App Icons & Favicon Generator',
        description: 'Pixel-perfect SVG and ICO app logos, favicons, vector branding, and download packs.',
        category: 'Design & Identity',
        filterType: 'design',
        icon: <Palette className="w-4 h-4 text-pink-400" />,
        iconBg: 'bg-pink-500/20 border-pink-500/30',
        tab: 'design_studio',
        subTab: 'favicon',
        badge: 'Favicons',
        badgeColor: 'text-pink-300 bg-pink-950 border-pink-500/30',
        keywords: ['design', 'favicon', 'icon', 'app icon', 'logo', 'branding', 'svg'],
      },
      {
        id: 'studio_design_badges',
        title: 'Design Identity: Achievement Badges & Medals',
        description: 'Gaming badges, reward emblems, VIP medals with holographic glow and vector export.',
        category: 'Design & Identity',
        filterType: 'design',
        icon: <Award className="w-4 h-4 text-amber-400" />,
        iconBg: 'bg-amber-500/20 border-amber-500/30',
        tab: 'design_studio',
        subTab: 'badges',
        badge: 'Badges',
        badgeColor: 'text-amber-300 bg-amber-950 border-amber-500/30',
        keywords: ['design', 'badge', 'medal', 'achievement', 'emblem', 'award'],
      },
      {
        id: 'studio_design_resume',
        title: 'Design Identity: Professional CV & Resume Builder',
        description: 'Clean modern resume templates, ATS-friendly layouts, and print-ready PDF export.',
        category: 'Design & Identity',
        filterType: 'design',
        icon: <FileCode className="w-4 h-4 text-cyan-400" />,
        iconBg: 'bg-cyan-500/20 border-cyan-500/30',
        tab: 'design_studio',
        subTab: 'resume',
        badge: 'Resume / CV',
        badgeColor: 'text-cyan-300 bg-cyan-950 border-cyan-500/30',
        keywords: ['design', 'resume', 'cv', 'curriculum vitae', 'job', 'bio'],
      },
      {
        id: 'studio_design_cards',
        title: 'Design Identity: Executive Business Cards',
        description: 'Double-sided corporate business cards, QR code integration, and print bleeds.',
        category: 'Design & Identity',
        filterType: 'design',
        icon: <CreditCard className="w-4 h-4 text-purple-400" />,
        iconBg: 'bg-purple-500/20 border-purple-500/30',
        tab: 'design_studio',
        subTab: 'business_cards',
        badge: 'Cards',
        badgeColor: 'text-purple-300 bg-purple-950 border-purple-500/30',
        keywords: ['design', 'business card', 'visiting card', 'corporate', 'qr code'],
      },

      // 9. AI UTILITIES & ASSISTANTS
      {
        id: 'studio_chat_mentor',
        title: 'AI Chat Mentor & Coding Assistant with Memory',
        description: 'Multi-turn intelligent brainstorming, code generator, creative guidance, and context memory.',
        category: 'AI Assistant',
        filterType: 'studios',
        icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
        iconBg: 'bg-cyan-500/20 border-cyan-500/30',
        tab: 'chat_mentor',
        badge: 'AI Mentor',
        badgeColor: 'text-cyan-300 bg-cyan-950 border-cyan-500/30',
        keywords: ['chat', 'mentor', 'assistant', 'ai', 'coding', 'brainstorm', 'gemini'],
      },
      {
        id: 'studio_master_toolkit',
        title: 'All-in-One Master Toolkit & Utility Center',
        description: 'Quick converters, hash utilities, format transformers, and production helpers in one place.',
        category: 'Utilities',
        filterType: 'studios',
        icon: <Cpu className="w-4 h-4 text-amber-400" />,
        iconBg: 'bg-amber-500/20 border-amber-500/30',
        tab: 'master_toolkit',
        badge: 'Toolkit',
        badgeColor: 'text-amber-300 bg-amber-950 border-amber-500/30',
        keywords: ['toolkit', 'utilities', 'tools', 'converter', 'helper', 'all-in-one'],
      },
      {
        id: 'studio_cloud_storage',
        title: 'Cloud Storage Vault & Storage Management',
        description: 'AWS S3 & Cloudinary synchronized buckets, media asset storage, and cloud backups.',
        category: 'Storage',
        filterType: 'actions',
        icon: <HardDrive className="w-4 h-4 text-emerald-400" />,
        iconBg: 'bg-emerald-500/20 border-emerald-500/30',
        tab: 'cloud_storage',
        badge: 'AWS S3',
        badgeColor: 'text-emerald-300 bg-emerald-950 border-emerald-500/30',
        keywords: ['storage', 'cloud', 's3', 'cloudinary', 'backup', 'files', 'vault'],
      },
      {
        id: 'studio_user_manual',
        title: 'Interactive User Manual & Full Documentation',
        description: 'Comprehensive guides, keyboard hotkeys list, video setup instructions, and API docs.',
        category: 'Documentation',
        filterType: 'studios',
        icon: <BookOpen className="w-4 h-4 text-slate-300" />,
        iconBg: 'bg-slate-800 border-slate-700',
        tab: 'user_manual',
        badge: 'Docs',
        badgeColor: 'text-slate-300 bg-slate-900 border-slate-700',
        keywords: ['manual', 'documentation', 'docs', 'help', 'instructions', 'api'],
      },

      // 10. QUICK SYSTEM ACTIONS
      {
        id: 'action_omni_enhance',
        title: '✨ Multi-Modal Prompt Enhancer (Omni AI)',
        description: 'Refine raw prompts into studio-quality creative instructions with auto modality detection.',
        category: 'Quick Actions',
        filterType: 'actions',
        icon: <Wand2 className="w-4 h-4 text-cyan-400" />,
        iconBg: 'bg-cyan-500/20 border-cyan-500/30',
        tab: activeTab,
        action: () => openOmniEnhanceModal?.(),
        badge: 'Omni AI',
        badgeColor: 'text-cyan-300 bg-cyan-950 border-cyan-500/30',
        keywords: ['omni', 'enhance', 'prompt', 'refine', 'improve', 'ai prompt'],
      },
      {
        id: 'action_new_blank_project',
        title: '➕ Create New Blank Project',
        description: 'Initialize a fresh project workspace in the Projects Hub.',
        category: 'Quick Actions',
        filterType: 'projects',
        icon: <Plus className="w-4 h-4 text-emerald-400" />,
        iconBg: 'bg-emerald-500/20 border-emerald-500/30',
        tab: 'projects_hub',
        badge: 'New',
        badgeColor: 'text-emerald-300 bg-emerald-950 border-emerald-500/30',
        keywords: ['new', 'create', 'blank', 'project', 'start'],
      },
      {
        id: 'action_open_profile_wallet',
        title: '💳 Global Wallet & Payout Settings',
        description: 'Configure bank SWIFT, IBAN, PayPal, UPI, and view transaction statements.',
        category: 'Account & Settings',
        filterType: 'actions',
        icon: <CreditCard className="w-4 h-4 text-amber-400" />,
        iconBg: 'bg-amber-500/20 border-amber-500/30',
        tab: activeTab,
        action: () => openProfileModal?.('global_payments'),
        badge: 'Wallet',
        badgeColor: 'text-amber-300 bg-amber-950 border-amber-500/30',
        keywords: ['wallet', 'payout', 'earnings', 'bank', 'money', 'upi', 'paypal'],
      },
      {
        id: 'action_open_history',
        title: '📜 Activity History & Token Ledger',
        description: 'Audit AI generation transactions, token credits, and session history logs.',
        category: 'Account & Settings',
        filterType: 'actions',
        icon: <HardDrive className="w-4 h-4 text-cyan-400" />,
        iconBg: 'bg-cyan-500/20 border-cyan-500/30',
        tab: activeTab,
        action: () => openHistoryModal?.(),
        badge: 'Ledger',
        badgeColor: 'text-cyan-300 bg-cyan-950 border-cyan-500/30',
        keywords: ['history', 'ledger', 'tokens', 'credits', 'transactions', 'audit'],
      },
      {
        id: 'action_voice_history',
        title: '🎙️ Voice Navigation Command History & Transcripts',
        description: 'View recognized speech transcripts, recognition confidence, and re-execute commands.',
        category: 'Quick Actions',
        filterType: 'actions',
        icon: <Mic className="w-4 h-4 text-cyan-400" />,
        iconBg: 'bg-cyan-500/20 border-cyan-500/30',
        tab: activeTab,
        action: () => {
          if (openVoiceHistory) {
            openVoiceHistory();
          } else {
            window.dispatchEvent(new CustomEvent('app:open-voice-history'));
          }
        },
        badge: 'Voice Log',
        badgeColor: 'text-cyan-300 bg-cyan-950 border-cyan-500/30',
        keywords: ['voice', 'speech', 'microphone', 'commands', 'transcript', 'history', 're-execute'],
        hotkey: 'Alt+V',
      },
      {
        id: 'action_admin_override',
        title: '🛡️ Creator Admin Passcode Override',
        description: 'Authenticate Master Admin Passcode for unrestricted VIP Diamond & infinite tokens.',
        category: 'Account & Settings',
        filterType: 'actions',
        icon: <KeyRound className="w-4 h-4 text-rose-400" />,
        iconBg: 'bg-rose-500/20 border-rose-500/30',
        tab: activeTab,
        action: () => openAdminModal?.(),
        badge: 'Master Key',
        badgeColor: 'text-rose-300 bg-rose-950 border-rose-500/30',
        keywords: ['admin', 'override', 'passcode', 'jayupadhyay', 'secret', 'vip', 'unlimited'],
      },
    ];

    // Add user saved projects to search catalog
    if (userProjects.length > 0) {
      userProjects.forEach((p) => {
        items.unshift({
          id: `saved_project_${p.id}`,
          title: p.title,
          description: p.description || `Saved project in ${p.category.toUpperCase()} category`,
          category: 'Saved Projects',
          filterType: 'projects',
          icon: <FolderKanban className="w-4 h-4 text-cyan-400" />,
          iconBg: 'bg-cyan-500/20 border-cyan-500/30',
          tab: 'projects_hub',
          badge: p.isPinned ? '📌 Pinned' : '📁 Project',
          badgeColor: p.isPinned
            ? 'text-amber-300 bg-amber-950 border-amber-500/30'
            : 'text-cyan-300 bg-cyan-950 border-cyan-500/30',
          keywords: ['project', p.category, ...(p.tags || [])],
        });
      });
    }

    return items;
  }, [userProjects, activeTab, openOmniEnhanceModal, openProfileModal, openHistoryModal, openAdminModal, openVoiceHistory]);

  // Filter and Query Match Logic
  const filteredResults = useMemo(() => {
    let list = ALL_SEARCH_ITEMS;

    if (selectedFilter !== 'all') {
      list = list.filter((item) => item.filterType === selectedFilter);
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;

    return list.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      const matchBadge = item.badge?.toLowerCase().includes(q);
      const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(q));

      return matchTitle || matchDesc || matchCategory || matchBadge || matchKeywords;
    });
  }, [ALL_SEARCH_ITEMS, selectedFilter, searchQuery]);

  // Keyboard navigation inside modal
  useEffect(() => {
    if (!isOpen) return;

    const handleModalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, filteredResults.length - 1)));
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          handleExecuteItem(filteredResults[selectedIndex]);
        }
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        const filters: GlobalSearchFilter[] = [
          'all',
          'studios',
          'video',
          'audio',
          '3d',
          'office',
          'design',
          'projects',
          'actions',
        ];
        const curIdx = filters.indexOf(selectedFilter);
        const nextIdx = e.shiftKey
          ? (curIdx - 1 + filters.length) % filters.length
          : (curIdx + 1) % filters.length;
        setSelectedFilter(filters[nextIdx]);
        return;
      }
    };

    window.addEventListener('keydown', handleModalKeyDown);
    return () => window.removeEventListener('keydown', handleModalKeyDown);
  }, [isOpen, selectedIndex, filteredResults, selectedFilter, onClose]);

  // Auto-scroll highlighted result
  useEffect(() => {
    if (isOpen && resultsContainerRef.current) {
      const activeElement = resultsContainerRef.current.querySelector(
        `[data-search-index="${selectedIndex}"]`
      );
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, isOpen]);

  // Reset selected index on query or filter change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery, selectedFilter]);

  const handleExecuteItem = (item: GlobalSearchItem) => {
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
    }

    if (item.action) {
      item.action();
    } else {
      setActiveTab(item.tab);
      if (item.subTab && onSelectSubTab) {
        onSelectSubTab(item.tab, item.subTab);
      }
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global Search & Studio Navigator"
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-2xl flex items-start justify-center p-3 sm:p-6 sm:pt-16 animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[#070c18] border border-cyan-500/40 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Input Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-slate-950/80 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
            <Search className="w-5 h-5" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all 34+ AI Studios, 3D Engines, Film, Audio, Office Docs, Projects, Tools..."
            className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder:text-slate-500 focus:outline-none font-medium"
            autoFocus
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Clear Search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-400 font-bold">
              ESC
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              title="Close Search"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Category Tabs Bar */}
        <div className="px-3 sm:px-4 py-2 border-b border-slate-800/80 bg-slate-950/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          {[
            { id: 'all', label: 'All Tools' },
            { id: 'studios', label: 'Studios' },
            { id: 'video', label: 'Video & Cinema' },
            { id: 'audio', label: 'Audio & Music' },
            { id: '3d', label: '3D & WebGL' },
            { id: 'office', label: 'Office Suite' },
            { id: 'design', label: 'Design Identity' },
            { id: 'projects', label: 'Saved Projects' },
            { id: 'actions', label: 'Actions & Settings' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedFilter(f.id as GlobalSearchFilter)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all text-xs flex items-center gap-1.5 ${
                selectedFilter === f.id
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80'
              }`}
            >
              <span>{f.label}</span>
            </button>
          ))}
        </div>

        {/* Recent Searches Header (if empty query) */}
        {!searchQuery.trim() && recentSearches.length > 0 && selectedFilter === 'all' && (
          <div className="px-4 pt-3 pb-1 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-400">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Recent Searches</span>
            </div>
            <button
              type="button"
              onClick={handleClearRecents}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* Recent Searches Pills (if empty query) */}
        {!searchQuery.trim() && recentSearches.length > 0 && selectedFilter === 'all' && (
          <div className="px-4 py-1.5 flex flex-wrap gap-1.5 border-b border-slate-800/60 pb-3">
            {recentSearches.map((rec, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSearchQuery(rec)}
                className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-cyan-300 font-medium transition-colors flex items-center gap-1.5"
              >
                <Search className="w-3 h-3 text-slate-500" />
                <span>{rec}</span>
              </button>
            ))}
          </div>
        )}

        {/* Results List Container */}
        <div
          ref={resultsContainerRef}
          className="max-h-[60vh] sm:max-h-[50vh] overflow-y-auto p-2 sm:p-3 space-y-1.5 divide-y divide-slate-900"
        >
          {filteredResults.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white font-['Syne']">
                  No studios or tools found for "{searchQuery}"
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Try searching for keywords like <b className="text-cyan-400">"3D"</b>, <b className="text-rose-400">"Camera"</b>, <b className="text-purple-400">"Song"</b>, <b className="text-amber-400">"Film"</b>, or <b className="text-indigo-400">"Docs"</b>.
                </p>
              </div>
            </div>
          ) : (
            filteredResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const isCurrentActiveTab = activeTab === item.tab && !item.action;

              return (
                <div
                  key={item.id}
                  data-search-index={idx}
                  onClick={() => handleExecuteItem(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3 group ${
                    isSelected
                      ? 'bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-cyan-500/50 shadow-lg shadow-cyan-950/40 translate-x-1'
                      : 'hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-transform ${
                        item.iconBg || 'bg-slate-900 border-slate-800'
                      } ${isSelected ? 'scale-110 shadow-md' : ''}`}
                    >
                      {item.icon}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-white truncate font-['Syne']">
                          {item.title}
                        </span>

                        {item.badge && (
                          <span
                            className={`text-[10px] font-mono px-2 py-0.2 rounded-full font-bold border ${
                              item.badgeColor || 'text-slate-300 bg-slate-900 border-slate-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}

                        {isCurrentActiveTab && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                            Active Studio
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-1 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.hotkey && (
                      <span className="hidden sm:inline text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 font-bold">
                        {item.hotkey}
                      </span>
                    )}

                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/40'
                          : 'bg-slate-900/80 text-slate-500 group-hover:text-white'
                      }`}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Navigation Shortcuts Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 font-mono">
              <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-bold">↑↓</span>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1 font-mono">
              <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-bold">↵</span>
              <span>Open Studio</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 font-mono">
              <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-bold">Tab</span>
              <span>Filter Categories</span>
            </div>
          </div>

          <div className="text-[10px] font-mono text-cyan-400 font-semibold">
            {filteredResults.length} Available Studios & Tools
          </div>
        </div>
      </div>
    </div>
  );
};

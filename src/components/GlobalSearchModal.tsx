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
  Languages,
  Copy,
  Check,
  Play,
  Star,
  ExternalLink,
  MessageSquare,
  FileDown,
  Key,
  BookmarkPlus,
  Bookmark,
  BookmarkCheck,
  FolderPlus,
  CheckCircle2,
  Link,
  Info,
  SlidersHorizontal,
  TrendingUp,
  Activity,
  Layers3,
  Sparkle,
  UserCheck,
} from 'lucide-react';
import { ActiveTab, UserProfile, ProjectItem } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { ProfileTab } from './ProfileSettingsModal.tsx';
import {
  EntertainmentItem,
  EntertainmentMediaType,
  TrendingMediaItem,
  CharacterProfile,
  CharacterVisualTraits,
  SUPPORTED_SUBTITLE_LANGUAGES,
  searchEntertainmentCatalog,
  generateDynamicEntertainmentItem,
  generateSrtContent,
  MASTER_ENTERTAINMENT_CATALOG,
  MASTER_CHARACTER_REPOSITORY,
  fetchCrossPlatformEntertainmentSearch,
  importEntertainmentToActiveProject,
  fetchTrendingMediaFromTMDB,
  syncMultilingualEntertainment,
  populateStudioAssets,
  fetchCharacterRepository,
  saveCharacterToRepository,
  removeCharacterFromRepository,
  importCharacterToStudio,
} from '../lib/entertainmentAggregator.ts';

export type GlobalSearchFilter =
  | 'all'
  | 'trending'
  | 'characters'
  | 'entertainment'
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
const TMDB_KEY_STORAGE = 'icallog_custom_tmdb_api_key';
const OMDB_KEY_STORAGE = 'icallog_custom_omdb_api_key';

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
  const [activeMode, setActiveMode] = useState<'trending' | 'characters' | 'entertainment' | 'studios'>('characters');
  const [selectedFilter, setSelectedFilter] = useState<GlobalSearchFilter>('all');
  const [entertainmentFilter, setEntertainmentFilter] = useState<'all' | EntertainmentMediaType>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [userProjects, setUserProjects] = useState<ProjectItem[]>([]);

  // 1. Trending Media Dashboard State
  const [trendingTimeWindow, setTrendingTimeWindow] = useState<'day' | 'week' | 'all_time'>('day');
  const [trendingCategory, setTrendingCategory] = useState<'all' | 'movies' | 'tv_ott' | 'anime' | 'characters' | 'gaming' | 'mature'>('all');
  const [trendingResults, setTrendingResults] = useState<TrendingMediaItem[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  const [isLiveTmdbTrending, setIsLiveTmdbTrending] = useState(false);

  // 2. Character Repository State (NEW!)
  const [characterResults, setCharacterResults] = useState<CharacterProfile[]>(MASTER_CHARACTER_REPOSITORY);
  const [characterCategory, setCharacterCategory] = useState<'all' | 'anime' | 'superhero' | 'cinema' | 'gaming' | 'scifi' | 'fantasy' | 'global'>('all');
  const [characterFilterSaved, setCharacterFilterSaved] = useState(false);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
  const [isLiveTmdbCharacters, setIsLiveTmdbCharacters] = useState(false);
  const [savedCharactersCount, setSavedCharactersCount] = useState(0);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterProfile | null>(null);
  const [characterDrawerTab, setCharacterDrawerTab] = useState<'traits' | 'bio' | 'filmography' | 'quotes' | 'prompts'>('traits');
  const [copiedTraitKey, setCopiedTraitKey] = useState<string | null>(null);

  // 3. Cross-Platform Live Entertainment State
  const [entertainmentResults, setEntertainmentResults] = useState<EntertainmentItem[]>(MASTER_ENTERTAINMENT_CATALOG);
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [activeProviders, setActiveProviders] = useState({ tmdb: false, omdb: false, catalog: true });
  const [searchSource, setSearchSource] = useState<'live_api' | 'catalog_merge' | 'dynamic_lore'>('catalog_merge');

  // Custom API Keys Configuration Drawer
  const [showApiDrawer, setShowApiDrawer] = useState(false);
  const [customTmdbKey, setCustomTmdbKey] = useState('');
  const [customOmdbKey, setCustomOmdbKey] = useState('');

  // Selected Entertainment Character Detail State
  const [selectedEntertainment, setSelectedEntertainment] = useState<EntertainmentItem | null>(null);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>('hi');
  const [copiedSubtitle, setCopiedSubtitle] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  // Multilingual Subtitle Sync State
  const [syncedQuotes, setSyncedQuotes] = useState<any[]>([]);
  const [isSyncingLanguage, setIsSyncingLanguage] = useState(false);

  // Instant Studio Asset Population Suite State
  const [populatedToast, setPopulatedToast] = useState<string | null>(null);
  const [populatedSuccessItem, setPopulatedSuccessItem] = useState<EntertainmentItem | null>(null);

  // Import to Project Workflow State
  const [importModalItem, setImportModalItem] = useState<EntertainmentItem | null>(null);
  const [importTargetType, setImportTargetType] = useState<'new_project' | 'existing_project'>('new_project');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [importProjectCategory, setImportProjectCategory] = useState<'film' | '3d' | 'music' | 'office' | 'design' | 'general'>('film');
  const [importingStatus, setImportingStatus] = useState<{ [id: string]: 'idle' | 'loading' | 'success' }>({});
  const [saveAssetsCloud, setSaveAssetsCloud] = useState(true);

  // Media Trailer Preview
  const [activeTrailerItem, setActiveTrailerItem] = useState<EntertainmentItem | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Load stored configuration, keys, and saved characters
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

      try {
        const tmdbKey = localStorage.getItem(TMDB_KEY_STORAGE) || '';
        const omdbKey = localStorage.getItem(OMDB_KEY_STORAGE) || '';
        setCustomTmdbKey(tmdbKey);
        setCustomOmdbKey(omdbKey);
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

  // Load Real-Time Character Repository
  const loadCharacterRepository = async () => {
    setIsLoadingCharacters(true);
    try {
      const res = await fetchCharacterRepository({
        query: searchQuery,
        category: characterCategory,
        filterSaved: characterFilterSaved,
        tmdbKey: customTmdbKey.trim() || undefined,
        language: selectedLanguageCode,
        userId: user?.id || 'demo_user',
      });

      setCharacterResults(res.characters);
      setSavedCharactersCount(res.savedCount);
      setIsLiveTmdbCharacters(res.isLiveTmdb);
    } catch (err) {
      console.warn('Failed to load character repository:', err);
    } finally {
      setIsLoadingCharacters(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeMode === 'characters') {
      loadCharacterRepository();
    }
  }, [isOpen, activeMode, characterCategory, characterFilterSaved, searchQuery, customTmdbKey]);

  // Load Real-Time Trending Media from TMDB API
  const loadTrendingData = async () => {
    setIsLoadingTrending(true);
    try {
      const res = await fetchTrendingMediaFromTMDB({
        timeWindow: trendingTimeWindow,
        category: trendingCategory,
        language: selectedLanguageCode === 'hi' ? 'hi-IN' : selectedLanguageCode === 'ja' ? 'ja-JP' : 'en-US',
        tmdbKey: customTmdbKey.trim() || undefined,
        omdbKey: customOmdbKey.trim() || undefined,
      });

      setTrendingResults(res.items);
      setIsLiveTmdbTrending(res.isLiveTmdb);
    } catch (err) {
      console.warn('Failed to load trending data:', err);
    } finally {
      setIsLoadingTrending(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeMode === 'trending') {
      loadTrendingData();
    }
  }, [isOpen, activeMode, trendingTimeWindow, trendingCategory, customTmdbKey]);

  // Multilingual synchronization when selected language or character changes
  useEffect(() => {
    if (!selectedEntertainment) return;

    let isMounted = true;
    setIsSyncingLanguage(true);

    syncMultilingualEntertainment(selectedEntertainment, selectedLanguageCode).then((res) => {
      if (isMounted) {
        setSyncedQuotes(res.quotes);
        setIsSyncingLanguage(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedEntertainment, selectedLanguageCode]);

  // Debounced Cross-Platform TMDB/OMDb & Catalog Data Fetching
  useEffect(() => {
    if (activeMode !== 'entertainment') return;

    let isMounted = true;
    setIsSearchingLive(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetchCrossPlatformEntertainmentSearch(
          searchQuery,
          entertainmentFilter,
          {
            tmdbKey: customTmdbKey.trim() || undefined,
            omdbKey: customOmdbKey.trim() || undefined,
          }
        );

        if (isMounted) {
          setEntertainmentResults(res.items);
          setActiveProviders(res.providersActive);
          setSearchSource(res.source);
          setIsSearchingLive(false);
        }
      } catch (err) {
        if (isMounted) {
          setIsSearchingLive(false);
          const fallback = searchEntertainmentCatalog(searchQuery, entertainmentFilter);
          setEntertainmentResults(fallback.length > 0 ? fallback : MASTER_ENTERTAINMENT_CATALOG);
        }
      }
    }, 180);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, entertainmentFilter, activeMode, customTmdbKey, customOmdbKey]);

  // Auto-switch modes based on query intent
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (
      q.includes('character') ||
      q.includes('hero') ||
      q.includes('protagonist') ||
      q.includes('bio') ||
      q.includes('traits')
    ) {
      if (activeMode === 'studios') setActiveMode('characters');
    }
  }, [searchQuery]);

  const handleSaveApiKeys = () => {
    try {
      localStorage.setItem(TMDB_KEY_STORAGE, customTmdbKey.trim());
      localStorage.setItem(OMDB_KEY_STORAGE, customOmdbKey.trim());
      setShowApiDrawer(false);
      loadCharacterRepository();
      loadTrendingData();
    } catch {
      // ignore
    }
  };

  // Toggle Save / Bookmark Character in Repository
  const handleToggleSaveCharacter = async (char: CharacterProfile) => {
    if (char.isSavedToRepo) {
      await removeCharacterFromRepository(char.id, user?.id || 'demo_user');
      setPopulatedToast(`Removed "${char.name}" from saved repository.`);
    } else {
      await saveCharacterToRepository(char, user?.id || 'demo_user');
      setPopulatedToast(`⭐ Saved "${char.name}" to your permanent Character Repository!`);
    }
    loadCharacterRepository();
    setTimeout(() => setPopulatedToast(null), 3000);
  };

  // Launch Studio Tool with Direct Character Import
  const handleLaunchStudioWithCharacter = async (
    char: CharacterProfile,
    targetTab: 'image_studio' | 'film_studio' | '3d_engine' | 'video_audio' | 'projects_hub'
  ) => {
    try {
      await importCharacterToStudio(char, targetTab, user?.id || 'demo_user');
      setPopulatedToast(`🚀 "${char.name}" loaded into ${targetTab.replace('_', ' ').toUpperCase()}!`);
      setTimeout(() => {
        setActiveTab(targetTab as ActiveTab);
        onClose();
      }, 300);
    } catch (err) {
      console.warn('Import character error:', err);
      setActiveTab(targetTab as ActiveTab);
      onClose();
    }
  };

  // Instant Studio Asset Population Trigger
  const handlePopulateStudioAssets = async (item: EntertainmentItem, studioKey: string = 'all') => {
    try {
      await populateStudioAssets(item, {
        studioKey: studioKey as any,
        userId: user?.id || 'demo_user',
      });
      setPopulatedToast(`⚡ Studio Assets for "${item.title}" successfully populated across all studios!`);
      setPopulatedSuccessItem(item);
      setTimeout(() => setPopulatedToast(null), 4000);
    } catch (err) {
      console.warn('Failed to populate studio assets:', err);
    }
  };

  // Launch Studio Tool with Pre-Populated Reference
  const handleLaunchStudioWithAsset = (tab: ActiveTab, subTab?: string, item?: EntertainmentItem) => {
    if (item) {
      try {
        localStorage.setItem('icallog_active_entertainment_reference', JSON.stringify(item));
        window.dispatchEvent(new CustomEvent('icallog_studio_populated', { detail: { item, tab, subTab } }));
      } catch {
        // ignore
      }
    }
    setActiveTab(tab);
    if (subTab && onSelectSubTab) onSelectSubTab(tab, subTab);
    onClose();
  };

  // Direct Project Import Workflow
  const handleExecuteImportProject = async (item: EntertainmentItem) => {
    setImportingStatus((prev) => ({ ...prev, [item.id]: 'loading' }));

    try {
      const targetId = importTargetType === 'existing_project' ? selectedProjectId : undefined;
      const res = await importEntertainmentToActiveProject(item, {
        targetProjectId: targetId,
        projectCategory: importProjectCategory,
        userId: user?.id || 'demo_user',
        saveAssetsToCloud: saveAssetsCloud,
      });

      if (res.success) {
        setImportingStatus((prev) => ({ ...prev, [item.id]: 'success' }));
        setTimeout(() => {
          setImportModalItem(null);
          setImportingStatus((prev) => ({ ...prev, [item.id]: 'idle' }));
        }, 1500);
      }
    } catch (err) {
      console.error('Project import error:', err);
      setImportingStatus((prev) => ({ ...prev, [item.id]: 'idle' }));
    }
  };

  // Copy Subtitle Text or SRT File
  const handleCopySubtitles = (track: any) => {
    if (!track) return;
    const quotes = track.quotes || syncedQuotes;
    const text = quotes.map((q: any) => `[${q.time}] ${q.speaker}: ${q.translated || q.text}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedSubtitle(true);
    setTimeout(() => setCopiedSubtitle(false), 2000);
  };

  const handleDownloadSrt = (track: any, title: string) => {
    const srt = track?.fullSrt || generateSrtContent(syncedQuotes);
    const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}_${selectedLanguageCode}.srt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Static Platform Features & Systems Registry
  const allPlatformItems: GlobalSearchItem[] = useMemo(() => {
    return [
      {
        id: 'studio_image_8k',
        title: '8K Photorealistic Image Studio',
        description: 'Multi-engine neural image generator (Flux, Gemini 3.1, Recraft, SDXL) with 8K upscale and inpainting.',
        category: 'Image Studio',
        filterType: 'studios',
        icon: <ImageIcon className="w-5 h-5 text-indigo-400" />,
        iconBg: 'bg-indigo-500/10 border-indigo-500/20',
        tab: 'image_studio',
        keywords: ['image', 'photo', 'art', 'draw', 'flux', 'portrait', 'wallpaper', '8k', 'character art', 'cinematic render'],
        hotkey: '⌘1',
      },
      {
        id: 'studio_film',
        title: 'Hollywood Film Studio & Scriptwriter',
        description: 'End-to-end screenplay writing, cinematic breakdown, multi-shot storyboard, and director bible.',
        category: 'Film & Screenplay',
        filterType: 'video',
        icon: <Film className="w-5 h-5 text-purple-400" />,
        iconBg: 'bg-purple-500/10 border-purple-500/20',
        tab: 'film_studio',
        keywords: ['film', 'movie', 'hollywood', 'script', 'director', 'scene', 'cinema', 'screenplay', 'ott'],
        hotkey: '⌘2',
      },
      {
        id: 'studio_video_8k',
        title: '8K Video Generation Suite',
        description: 'Luma Dream Machine, Kling AI, Runway Gen-3 camera control, motion interpolation, and VFX.',
        category: 'Video Generation',
        filterType: 'video',
        icon: <Video className="w-5 h-5 text-pink-400" />,
        iconBg: 'bg-pink-500/10 border-pink-500/20',
        tab: 'video_audio',
        keywords: ['video', 'animation', 'render', 'movie', 'kling', 'luma', 'runway', 'motion', 'cinematic'],
        hotkey: '⌘3',
      },
      {
        id: 'studio_3d_engine',
        title: '3D WebGL Engine & Rigging Studio',
        description: 'Text-to-3D mesh synthesis, skeletal rigging, normal maps, PBR materials, and OBJ/GLTF export.',
        category: '3D & Spatial',
        filterType: '3d',
        icon: <Box className="w-5 h-5 text-cyan-400" />,
        iconBg: 'bg-cyan-500/10 border-cyan-500/20',
        tab: '3d_engine',
        keywords: ['3d', 'threejs', 'mesh', 'gltf', 'obj', 'sculpt', 'character 3d', 'model', 'rigging'],
        hotkey: '⌘4',
      },
      {
        id: 'studio_music_song',
        title: 'Song Studio & AI Audio Generation',
        description: 'Suno V3.5, Udio stem generation, multi-track melody synthesis, custom lyrics, and mastering.',
        category: 'Music & Audio',
        filterType: 'audio',
        icon: <Music className="w-5 h-5 text-amber-400" />,
        iconBg: 'bg-amber-500/10 border-amber-500/20',
        tab: 'song_studio',
        keywords: ['music', 'song', 'audio', 'suno', 'udio', 'lyrics', 'soundtrack', 'voice', 'singing', 'ost'],
        hotkey: '⌘5',
      },
      {
        id: 'studio_auto_dubbing',
        title: 'Auto-Dubbing & Multi-Language Voice Morph',
        description: 'Instant speech-to-speech dubbing with 20+ language real-time lipsync, accent tuning, and SRT sync.',
        category: 'Audio & Dubbing',
        filterType: 'audio',
        icon: <Volume2 className="w-5 h-5 text-emerald-400" />,
        iconBg: 'bg-emerald-500/10 border-emerald-500/20',
        tab: 'auto_dubbing',
        keywords: ['dubbing', 'voice', 'translate', 'languages', 'subtitles', 'srt', 'hindi', 'japanese', 'spanish', 'speech'],
      },
      {
        id: 'studio_manga_storyboard',
        title: 'Manga & Comic Storyboard Suite',
        description: 'Generates multi-panel Japanese manga layouts, speech bubbles, screentones, and dynamic SFX.',
        category: 'Storyboarding',
        filterType: 'design',
        icon: <Layers3 className="w-5 h-5 text-rose-400" />,
        iconBg: 'bg-rose-500/10 border-rose-500/20',
        tab: 'manga_storyboard',
        keywords: ['manga', 'comic', 'anime storyboard', 'panels', 'webtoon', 'shonen', 'sketch'],
      },
      {
        id: 'studio_game_creator',
        title: 'Game Studio & Asset Generator',
        description: 'Creates 2D sprite sheets, 3D character rigs, level mechanics, and logic bibles.',
        category: 'Game Engine',
        filterType: '3d',
        icon: <Gamepad2 className="w-5 h-5 text-violet-400" />,
        iconBg: 'bg-violet-500/10 border-violet-500/20',
        tab: 'game_studio',
        keywords: ['game', 'character design', 'unity', 'unreal', 'godot', 'sprite', 'rpg', 'mechanics'],
      },
      {
        id: 'studio_projects_hub',
        title: 'Projects Hub & Cloud Asset Vault',
        description: 'Manage active creative projects, cloud assets, AWS S3 storage, and collaborative boards.',
        category: 'Workspace',
        filterType: 'projects',
        icon: <FolderKanban className="w-5 h-5 text-blue-400" />,
        iconBg: 'bg-blue-500/10 border-blue-500/20',
        tab: 'projects_hub',
        keywords: ['projects', 'vault', 'files', 'cloud', 's3', 'saved', 'active', 'workspace'],
      },
    ];
  }, []);

  // Filtered Results for Studios Mode
  const filteredStudioItems = useMemo(() => {
    let items = allPlatformItems;
    if (selectedFilter !== 'all') {
      items = items.filter((i) => i.filterType === selectedFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.keywords?.some((k) => k.toLowerCase().includes(q))
      );
    }
    return items;
  }, [allPlatformItems, selectedFilter, searchQuery]);

  // Filtered Results for Trending Mode
  const filteredTrendingItems = useMemo(() => {
    let items = trendingResults;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.character.toLowerCase().includes(q) ||
          i.franchise.toLowerCase().includes(q) ||
          i.genres.some((g) => g.toLowerCase().includes(q)) ||
          i.synopsis.toLowerCase().includes(q)
      );
    }
    return items;
  }, [trendingResults, searchQuery]);

  // Selected Item Subtitle Track
  const activeSubtitleTrack = useMemo(() => {
    if (!selectedEntertainment) return null;
    return (
      selectedEntertainment.subtitles?.[selectedLanguageCode] ||
      selectedEntertainment.subtitles?.['hi'] ||
      selectedEntertainment.subtitles?.['en'] ||
      Object.values(selectedEntertainment.subtitles || {})[0] ||
      null
    );
  }, [selectedEntertainment, selectedLanguageCode]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-start justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl bg-gradient-to-b from-slate-900/98 via-slate-900/95 to-slate-950/98 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-4 sm:my-8 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Alert */}
        {populatedToast && (
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-lg animate-slideDown">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>{populatedToast}</span>
            </div>
            <button
              onClick={() => setPopulatedToast(null)}
              className="p-1 hover:bg-white/20 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Header & Universal Search Input */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/60 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeMode === 'characters'
                      ? '👥 Search character profiles, visual traits, anime, superhero & cinema bios...'
                      : activeMode === 'trending'
                      ? '🔥 Filter trending media, movies, anime, OTT series & box office sensations...'
                      : activeMode === 'entertainment'
                      ? '🌐 Search cross-platform TMDB / OMDb global entertainment & multi-language lore...'
                      : '🚀 Search 30+ creative studios, AI tools, 3D meshes & workflows...'
                  }
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-11 pr-10 py-3 text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/80 focus:border-transparent transition-all shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Custom API Key Config Button */}
            <button
              onClick={() => setShowApiDrawer(!showApiDrawer)}
              className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                customTmdbKey || customOmdbKey
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="Configure TMDB / OMDb API Keys"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">TMDB API Gateway</span>
            </button>

            <button
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Mode Navigation Tabs (4 Core Pillars) */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
              {/* Character Repository Tab */}
              <button
                onClick={() => {
                  setActiveMode('characters');
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                  activeMode === 'characters'
                    ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4 text-purple-300" />
                <span>Character Repository</span>
                <span className="px-1.5 py-0.5 text-[10px] bg-purple-950/80 border border-purple-500/30 rounded-full text-purple-200">
                  {characterResults.length} Profiles
                </span>
              </button>

              {/* Trending Media Tab */}
              <button
                onClick={() => {
                  setActiveMode('trending');
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                  activeMode === 'trending'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>Trending Media</span>
                <span className="px-1.5 py-0.5 text-[10px] bg-black/40 rounded-full text-amber-200">Live TMDB</span>
              </button>

              {/* Global Search & Lore Tab */}
              <button
                onClick={() => {
                  setActiveMode('entertainment');
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                  activeMode === 'entertainment'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-4 h-4 text-cyan-300" />
                <span>Global Media & Subtitles</span>
              </button>

              {/* Creative Studios Tab */}
              <button
                onClick={() => {
                  setActiveMode('studios');
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                  activeMode === 'studios'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4 text-indigo-300" />
                <span>30+ Studios & Tools</span>
              </button>
            </div>

            {/* Global Media Sync Language Indicator */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden md:inline">Global Sync:</span>
              <select
                value={selectedLanguageCode}
                onChange={(e) => setSelectedLanguageCode(e.target.value)}
                className="bg-slate-950/90 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                {SUPPORTED_SUBTITLE_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name} ({lang.native})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* MODE SPECIFIC FILTERS & CONTROLS */}
          {/* 1. Character Repository Filter Pills */}
          {activeMode === 'characters' && (
            <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
                {[
                  { id: 'all', label: 'All Characters', icon: Users },
                  { id: 'anime', label: 'Anime & Manga', icon: Sparkle },
                  { id: 'superhero', label: 'Superheroes & DC/Marvel', icon: Shield },
                  { id: 'cinema', label: 'Hollywood & Cinema', icon: Film },
                  { id: 'gaming', label: 'Gaming Legends', icon: Gamepad2 },
                  { id: 'scifi', label: 'Sci-Fi & Cyberpunk', icon: Atom },
                  { id: 'fantasy', label: 'Dark Fantasy', icon: Wand2 },
                  { id: 'global', label: 'Indian & Global Mass Cinema', icon: Globe },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setCharacterCategory(tab.id as any);
                        setCharacterFilterSaved(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
                        characterCategory === tab.id && !characterFilterSaved
                          ? 'bg-purple-600/30 border border-purple-500/50 text-purple-200 shadow-sm'
                          : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Saved to Repository Toggle & Refresh Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCharacterFilterSaved(!characterFilterSaved)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    characterFilterSaved
                      ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                      : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-amber-300'
                  }`}
                >
                  <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>My Saved Characters ({savedCharactersCount})</span>
                </button>

                <button
                  onClick={loadCharacterRepository}
                  disabled={isLoadingCharacters}
                  className="p-1.5 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition-colors"
                  title="Refresh Characters from TMDB & Local Repository"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCharacters ? 'animate-spin text-purple-400' : ''}`} />
                </button>
              </div>
            </div>
          )}

          {/* 2. Trending Media Filters */}
          {activeMode === 'trending' && (
            <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
                {[
                  { id: 'all', label: '🔥 All Trending' },
                  { id: 'movies', label: '🎬 Blockbuster Movies' },
                  { id: 'tv_ott', label: '📺 OTT Web Series' },
                  { id: 'anime', label: '⚡ Trending Anime' },
                  { id: 'characters', label: '👤 Top Characters' },
                  { id: 'gaming', label: '🎮 Gaming Lore' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setTrendingCategory(cat.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      trendingCategory === cat.id
                        ? 'bg-amber-500/20 border border-amber-500/50 text-amber-200'
                        : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setTrendingTimeWindow('day')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      trendingTimeWindow === 'day' ? 'bg-amber-600 text-white font-medium' : 'text-slate-400'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setTrendingTimeWindow('week')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      trendingTimeWindow === 'week' ? 'bg-amber-600 text-white font-medium' : 'text-slate-400'
                    }`}
                  >
                    This Week
                  </button>
                </div>

                <button
                  onClick={loadTrendingData}
                  disabled={isLoadingTrending}
                  className="p-1.5 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTrending ? 'animate-spin text-amber-400' : ''}`} />
                </button>
              </div>
            </div>
          )}

          {/* 3. Global Search Filters */}
          {activeMode === 'entertainment' && (
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 pt-2 border-t border-slate-800/80">
              {[
                { id: 'all', label: 'All Catalog' },
                { id: 'anime', label: 'Anime & Manga' },
                { id: 'cartoon', label: 'Cartoon & Animation' },
                { id: 'movie', label: 'Movies & Cinema' },
                { id: 'ott_series', label: 'OTT Web Series' },
                { id: 'game', label: 'Gaming Characters' },
                { id: '18_plus_mature', label: '18+ Mature Themes' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setEntertainmentFilter(pill.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    entertainmentFilter === pill.id
                      ? 'bg-blue-600/30 border border-blue-500/50 text-blue-200'
                      : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          )}

          {/* 4. Creative Studios Filters */}
          {activeMode === 'studios' && (
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 pt-2 border-t border-slate-800/80">
              {[
                { id: 'all', label: 'All Studios' },
                { id: 'studios', label: 'Image & Generative' },
                { id: 'video', label: 'Film & 8K Video' },
                { id: '3d', label: '3D Mesh & Engine' },
                { id: 'audio', label: 'Music & Dubbing' },
                { id: 'design', label: 'Manga & Design' },
                { id: 'projects', label: 'Projects Hub' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setSelectedFilter(pill.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    selectedFilter === pill.id
                      ? 'bg-indigo-600/30 border border-indigo-500/50 text-indigo-200'
                      : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* API Drawer (TMDB / OMDb Keys) */}
        {showApiDrawer && (
          <div className="p-4 bg-slate-950 border-b border-amber-500/20 text-xs flex flex-col gap-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-300 font-semibold">
                <Key className="w-4 h-4" />
                <span>Custom TMDB & OMDb API Gateway Configuration</span>
              </div>
              <button
                onClick={() => setShowApiDrawer(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-slate-400">
              Enter your TMDB API v3 Key (from themoviedb.org) or OMDb API Key to unlock real-time live global searches, full character visual traits parsing, and multi-language movie/show metadata.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">TMDB API Key (v3 auth):</label>
                <input
                  type="password"
                  value={customTmdbKey}
                  onChange={(e) => setCustomTmdbKey(e.target.value)}
                  placeholder="e.g. 4f3b2a1c0d9e8f7a6b5c4d3e2f1a0b9"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">OMDb API Key:</label>
                <input
                  type="password"
                  value={customOmdbKey}
                  onChange={(e) => setCustomOmdbKey(e.target.value)}
                  placeholder="e.g. 8a7b6c5d"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={handleSaveApiKeys}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors"
              >
                Save & Sync Live TMDB Feed
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL BODY CONTENT */}
        {/* ============================================================ */}
        <div className="flex-1 overflow-y-auto max-h-[68vh] p-4 sm:p-6" ref={resultsContainerRef}>
          {/* TAB 1: CHARACTER REPOSITORY (PRIMARY SPOTLIGHT) */}
          {activeMode === 'characters' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="flex items-center justify-between flex-wrap gap-3 bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 p-4 rounded-xl border border-purple-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <span>Global Character Repository</span>
                      <span className="px-2 py-0.5 text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full font-semibold">
                        TMDB Visual Trait Sync Active
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Fetches & stores character bios, visual traits, aesthetic color palettes, and provides 1-click import into ImageStudio and FilmStudio.
                    </p>
                  </div>
                </div>
              </div>

              {/* Character Cards Grid */}
              {isLoadingCharacters ? (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mb-3" />
                  <p className="text-sm text-slate-300 font-medium">Querying Character Repository & TMDB API...</p>
                  <p className="text-xs text-slate-500">Extracting visual traits, screen lore, and studio presets</p>
                </div>
              ) : characterResults.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-base font-semibold text-slate-300">No characters found matching your filters</p>
                  <p className="text-xs text-slate-500 mt-1">Try changing the category or searching for another character name</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {characterResults.map((char) => (
                    <div
                      key={char.id}
                      className="group bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/50 rounded-xl overflow-hidden shadow-lg transition-all flex flex-col justify-between hover:shadow-purple-500/10"
                    >
                      {/* Top Visual Section */}
                      <div className="relative h-44 overflow-hidden bg-slate-950">
                        <img
                          src={char.avatarUrl}
                          alt={char.name}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                        {/* Top Badges */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 bg-black/70 backdrop-blur-md border border-white/10 rounded-md text-[10px] font-bold text-white uppercase tracking-wider">
                            {char.category}
                          </span>
                          <span className="px-2 py-0.5 bg-purple-950/80 backdrop-blur-md border border-purple-500/40 rounded-md text-[10px] font-medium text-purple-200">
                            {char.franchise}
                          </span>
                        </div>

                        {/* Save / Bookmark Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSaveCharacter(char);
                          }}
                          className={`absolute top-2.5 right-2.5 p-1.5 rounded-lg backdrop-blur-md border transition-all ${
                            char.isSavedToRepo
                              ? 'bg-amber-500/30 border-amber-500 text-amber-300'
                              : 'bg-black/60 border-white/20 text-white/70 hover:text-amber-300 hover:bg-black/80'
                          }`}
                          title={char.isSavedToRepo ? 'Saved in Repository' : 'Save to Character Repository'}
                        >
                          <Bookmark className="w-4 h-4 fill-current" />
                        </button>

                        {/* Character Name & Role Overlay */}
                        <div className="absolute bottom-2.5 left-3 right-3">
                          <h4 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors leading-tight">
                            {char.name}
                          </h4>
                          <p className="text-xs text-purple-300/90 line-clamp-1 font-medium">
                            {char.characterRole} • <span className="text-slate-400">{char.actorName}</span>
                          </p>
                        </div>
                      </div>

                      {/* Middle Body: Visual Traits & Palette */}
                      <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                        <div>
                          {/* Visual Traits Summary */}
                          <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                            <div className="flex items-start gap-1.5">
                              <Sparkle className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-2 text-slate-300 leading-snug">
                                <strong className="text-slate-100">Outfit:</strong> {char.visualTraits?.outfit || 'Signature costume'}
                              </span>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-1 text-slate-300">
                                <strong className="text-slate-100">Features:</strong> {char.visualTraits?.hairAndEyes || 'Distinctive gaze'}
                              </span>
                            </div>
                          </div>

                          {/* Color Palette Swatches */}
                          {char.visualTraits?.colorPalette && char.visualTraits.colorPalette.length > 0 && (
                            <div className="flex items-center justify-between pt-2">
                              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                <Palette className="w-3 h-3 text-pink-400" /> Color Palette:
                              </span>
                              <div className="flex items-center gap-1">
                                {char.visualTraits.colorPalette.slice(0, 5).map((hex, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      navigator.clipboard.writeText(hex);
                                      setPopulatedToast(`Copied color ${hex} to clipboard!`);
                                      setTimeout(() => setPopulatedToast(null), 2000);
                                    }}
                                    className="w-4 h-4 rounded-full border border-white/20 hover:scale-125 transition-transform"
                                    style={{ backgroundColor: hex }}
                                    title={`Click to copy ${hex}`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 1-Click Action Buttons for ImageStudio, FilmStudio, and Inspector */}
                        <div className="pt-2 border-t border-slate-800 space-y-2">
                          <div className="grid grid-cols-2 gap-1.5">
                            {/* Import to Image Studio */}
                            <button
                              onClick={() => handleLaunchStudioWithCharacter(char, 'image_studio')}
                              className="px-2.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-200 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                              <span>ImageStudio</span>
                            </button>

                            {/* Import to Film Studio */}
                            <button
                              onClick={() => handleLaunchStudioWithCharacter(char, 'film_studio')}
                              className="px-2.5 py-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-purple-200 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                            >
                              <Film className="w-3.5 h-3.5 text-purple-400" />
                              <span>FilmStudio</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            {/* Import to 3D Engine */}
                            <button
                              onClick={() => handleLaunchStudioWithCharacter(char, '3d_engine')}
                              className="px-2 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
                            >
                              <Box className="w-3 h-3 text-cyan-400" />
                              <span>3D Rig</span>
                            </button>

                            {/* Inspect Profile */}
                            <button
                              onClick={() => setSelectedCharacter(char)}
                              className="px-2 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
                            >
                              <Eye className="w-3 h-3 text-amber-400" />
                              <span>Inspect Bio</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TRENDING MEDIA DASHBOARD */}
          {activeMode === 'trending' && (
            <div className="space-y-6">
              {/* TMDB Trending Grid */}
              {isLoadingTrending ? (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mb-3" />
                  <p className="text-sm text-slate-300 font-medium">Aggregating Real-Time TMDB Global Trending Feed...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTrendingItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="group bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 rounded-xl overflow-hidden shadow-lg transition-all flex flex-col justify-between"
                    >
                      <div className="relative h-44 overflow-hidden bg-slate-950">
                        <img
                          src={item.bannerImage || item.characterAvatar}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-xs rounded-md flex items-center gap-1">
                            <Flame className="w-3 h-3" /> #{item.rank || idx + 1}
                          </span>
                          <span className="px-2 py-0.5 bg-black/70 text-amber-300 border border-white/10 text-[10px] font-bold rounded-md uppercase">
                            {item.mediaType}
                          </span>
                        </div>
                        <div className="absolute bottom-2.5 left-3 right-3">
                          <h4 className="text-base font-bold text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-300 line-clamp-1">{item.character}</p>
                        </div>
                      </div>

                      <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                        <p className="text-xs text-slate-400 line-clamp-2">{item.synopsis}</p>
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handlePopulateStudioAssets(item)}
                            className="flex-1 py-1.5 bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/40 text-amber-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all"
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            <span>Populate Studios</span>
                          </button>
                          <button
                            onClick={() => setSelectedEntertainment(item)}
                            className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs"
                            title="View Multilingual Subtitles & Lore"
                          >
                            <Languages className="w-3.5 h-3.5 text-blue-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GLOBAL ENTERTAINMENT & LORE SEARCH */}
          {activeMode === 'entertainment' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {entertainmentResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedEntertainment(item)}
                    className="p-3.5 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/50 rounded-xl cursor-pointer transition-all flex gap-3 group"
                  >
                    <img
                      src={item.characterAvatar}
                      alt={item.title}
                      className="w-16 h-20 object-cover rounded-lg shrink-0 border border-slate-700 group-hover:border-blue-500/40 transition-colors"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-1.5 py-0.5 bg-blue-950 border border-blue-500/30 rounded text-[9px] font-bold text-blue-300 uppercase">
                          {item.mediaType}
                        </span>
                        <span className="text-[10px] text-slate-500">{item.releaseYear}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors truncate">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-300 truncate">{item.character}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">{item.synopsis}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CREATIVE STUDIOS & SYSTEM TOOLS */}
          {activeMode === 'studios' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudioItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.action) item.action();
                      else if (item.tab) {
                        setActiveTab(item.tab);
                        if (item.subTab && onSelectSubTab) onSelectSubTab(item.tab, item.subTab);
                      }
                      onClose();
                    }}
                    className="p-4 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 rounded-xl cursor-pointer transition-all flex items-start gap-3.5 group"
                  >
                    <div className={`p-2.5 rounded-xl border ${item.iconBg || 'bg-slate-800 border-slate-700'} shrink-0 group-hover:scale-105 transition-transform`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                          {item.category}
                        </span>
                        {item.hotkey && (
                          <span className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-[10px] text-slate-400 font-mono">
                            {item.hotkey}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* CHARACTER DEEP DIVE INSPECTOR MODAL / DRAWER */}
        {/* ============================================================ */}
        {selectedCharacter && (
          <div
            className="fixed inset-0 z-60 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
            onClick={() => setSelectedCharacter(null)}
          >
            <div
              className="w-full max-w-4xl bg-slate-900 border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative h-48 sm:h-56 bg-slate-950 overflow-hidden shrink-0">
                <img
                  src={selectedCharacter.backdropUrl || selectedCharacter.avatarUrl}
                  alt={selectedCharacter.name}
                  className="w-full h-full object-cover object-center opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
                <button
                  onClick={() => setSelectedCharacter(null)}
                  className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 border border-white/20 text-white rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedCharacter.avatarUrl}
                      alt={selectedCharacter.name}
                      className="w-20 h-20 rounded-xl object-cover border-2 border-purple-400 shadow-xl"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded-md uppercase">
                          {selectedCharacter.category}
                        </span>
                        <span className="text-xs text-purple-200 font-semibold">{selectedCharacter.franchise}</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-white">{selectedCharacter.name}</h3>
                      <p className="text-xs text-slate-300">{selectedCharacter.characterRole} • {selectedCharacter.actorName}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inspector Navigation Tabs */}
              <div className="flex items-center border-b border-slate-800 bg-slate-950/80 px-6 gap-2 text-xs font-semibold overflow-x-auto">
                {[
                  { id: 'traits', label: 'Visual Traits Matrix' },
                  { id: 'bio', label: 'Biography & Screen Lore' },
                  { id: 'prompts', label: 'ImageStudio & FilmStudio Prompts' },
                  { id: 'filmography', label: 'Filmography & Media' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setCharacterDrawerTab(t.id as any)}
                    className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
                      characterDrawerTab === t.id
                        ? 'border-purple-500 text-purple-300 font-bold'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Inspector Body */}
              <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-300">
                {characterDrawerTab === 'traits' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-purple-400 font-bold uppercase text-[10px]">Signature Outfit</span>
                        <p className="text-slate-200">{selectedCharacter.visualTraits.outfit}</p>
                      </div>
                      <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-cyan-400 font-bold uppercase text-[10px]">Hair, Eyes & Silhouette</span>
                        <p className="text-slate-200">{selectedCharacter.visualTraits.hairAndEyes}</p>
                      </div>
                      <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-amber-400 font-bold uppercase text-[10px]">Iconic Prop / Weapon</span>
                        <p className="text-slate-200">{selectedCharacter.visualTraits.iconicItem}</p>
                      </div>
                      <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-pink-400 font-bold uppercase text-[10px]">Aesthetic Archetype</span>
                        <p className="text-slate-200">{selectedCharacter.visualTraits.aestheticArchetype}</p>
                      </div>
                    </div>

                    {/* Color Palette Matrix */}
                    <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-300">Color Palette Swatches:</span>
                      <div className="flex items-center gap-3 flex-wrap">
                        {selectedCharacter.visualTraits.colorPalette.map((hex, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                            <div className="w-5 h-5 rounded-md border border-white/20" style={{ backgroundColor: hex }} />
                            <span className="font-mono text-xs text-slate-200">{hex}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(hex);
                                setPopulatedToast(`Copied ${hex}!`);
                                setTimeout(() => setPopulatedToast(null), 1500);
                              }}
                              className="p-1 hover:text-white"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {characterDrawerTab === 'bio' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                      <h4 className="font-bold text-purple-300 text-sm">Character Biography</h4>
                      <p className="text-slate-300 leading-relaxed">{selectedCharacter.biography}</p>
                    </div>
                    <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                      <h4 className="font-bold text-cyan-300 text-sm">Universe Lore & Legacy</h4>
                      <p className="text-slate-300 leading-relaxed">{selectedCharacter.characterLore}</p>
                    </div>
                    <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                      <h4 className="font-bold text-amber-300 text-sm">Powers & Iconic Abilities</h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        {selectedCharacter.abilities.map((ability, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-200 text-xs font-semibold">
                            ⚡ {ability}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {characterDrawerTab === 'prompts' && (
                  <div className="space-y-4">
                    {/* Image Studio Prompt */}
                    <div className="p-4 bg-slate-950/80 rounded-xl border border-indigo-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4" /> 8K ImageStudio Prompt (Flux / Midjourney)
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedCharacter.studioPresets.imageStudioPrompt);
                            setPopulatedToast('Copied ImageStudio prompt!');
                            setTimeout(() => setPopulatedToast(null), 1500);
                          }}
                          className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 rounded-md text-xs font-semibold flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> Copy Prompt
                        </button>
                      </div>
                      <p className="text-slate-300 font-mono text-xs bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        {selectedCharacter.studioPresets.imageStudioPrompt}
                      </p>
                    </div>

                    {/* Film Studio Screenplay Prompt */}
                    <div className="p-4 bg-slate-950/80 rounded-xl border border-purple-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-300 flex items-center gap-1.5">
                          <Film className="w-4 h-4" /> FilmStudio Screenplay & Dialogue
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedCharacter.studioPresets.filmStudioScriptPrompt);
                            setPopulatedToast('Copied FilmStudio screenplay!');
                            setTimeout(() => setPopulatedToast(null), 1500);
                          }}
                          className="px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 rounded-md text-xs font-semibold flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> Copy Script
                        </button>
                      </div>
                      <pre className="text-slate-300 font-mono text-xs bg-slate-900 p-2.5 rounded-lg border border-slate-800 whitespace-pre-wrap">
                        {selectedCharacter.studioPresets.filmStudioScriptPrompt}
                      </pre>
                    </div>
                  </div>
                )}

                {characterDrawerTab === 'filmography' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedCharacter.filmography.map((film, idx) => (
                      <div key={idx} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-3">
                        <img src={film.poster || selectedCharacter.avatarUrl} alt={film.title} className="w-12 h-16 object-cover rounded-lg" />
                        <div>
                          <h5 className="font-bold text-white text-sm">{film.title}</h5>
                          <p className="text-xs text-slate-400">Role: {film.role}</p>
                          <p className="text-[11px] text-purple-300 font-semibold">{film.year}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Inspector Footer Actions */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
                <button
                  onClick={() => handleToggleSaveCharacter(selectedCharacter)}
                  className={`px-4 py-2.5 rounded-xl border font-semibold flex items-center gap-2 text-xs sm:text-sm transition-all ${
                    selectedCharacter.isSavedToRepo
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Bookmark className="w-4 h-4 fill-current" />
                  <span>{selectedCharacter.isSavedToRepo ? 'Saved in Repository' : 'Save to Character Repository'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleLaunchStudioWithCharacter(selectedCharacter, 'image_studio');
                      setSelectedCharacter(null);
                    }}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Import to ImageStudio</span>
                  </button>

                  <button
                    onClick={() => {
                      handleLaunchStudioWithCharacter(selectedCharacter, 'film_studio');
                      setSelectedCharacter(null);
                    }}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-purple-500/20"
                  >
                    <Film className="w-4 h-4" />
                    <span>Import to FilmStudio</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>
              Pillars: <strong className="text-purple-400">Character Repository</strong> • <strong className="text-amber-400">Trending TMDB</strong> • <strong className="text-cyan-400">Global Lore</strong> • <strong className="text-indigo-400">30+ Studios</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span>ESC to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

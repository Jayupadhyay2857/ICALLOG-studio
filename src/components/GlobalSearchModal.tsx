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
  Heart,
  Scale,
  Columns,
  Swords,
  Maximize2,
  Trash2,
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
  toggleCharacterFavorite,
  getFavoriteCharacterIds,
  isCharacterFavorite,
  generateCrossoverPrompt,
  FAVORITE_CHARACTERS_STORAGE_KEY,
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

  // 2. Character Repository State (with Favorites & Visual Comparison)
  const [characterResults, setCharacterResults] = useState<CharacterProfile[]>(MASTER_CHARACTER_REPOSITORY);
  const [characterCategory, setCharacterCategory] = useState<'all' | 'anime' | 'superhero' | 'cinema' | 'gaming' | 'scifi' | 'fantasy' | 'global'>('all');
  const [characterFilterSaved, setCharacterFilterSaved] = useState(false);
  const [characterFilterFavorites, setCharacterFilterFavorites] = useState(false);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
  const [isLiveTmdbCharacters, setIsLiveTmdbCharacters] = useState(false);
  const [savedCharactersCount, setSavedCharactersCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterProfile | null>(null);
  const [characterDrawerTab, setCharacterDrawerTab] = useState<'traits' | 'bio' | 'filmography' | 'quotes' | 'prompts'>('traits');
  const [copiedTraitKey, setCopiedTraitKey] = useState<string | null>(null);

  // Visual Comparison State
  const [selectedForComparison, setSelectedForComparison] = useState<CharacterProfile[]>([]);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [crossoverResult, setCrossoverResult] = useState<{ imageStudioPrompt: string; filmStudioScriptPrompt: string; summary: string } | null>(null);
  const [comparisonActiveTab, setComparisonActiveTab] = useState<'visual_matrix' | 'color_palette' | 'abilities' | 'studio_prompts' | 'crossover'>('visual_matrix');

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
        const favs = getFavoriteCharacterIds();
        setFavoriteIds(favs);
        setFavoritesCount(favs.length);
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
        filterFavorites: characterFilterFavorites,
        tmdbKey: customTmdbKey.trim() || undefined,
        language: selectedLanguageCode,
        userId: user?.id || 'demo_user',
      });

      setCharacterResults(res.characters);
      setSavedCharactersCount(res.savedCount);
      setFavoritesCount(res.favoritesCount);
      setIsLiveTmdbCharacters(res.isLiveTmdb);
      setFavoriteIds(getFavoriteCharacterIds());
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
  }, [isOpen, activeMode, characterCategory, characterFilterSaved, characterFilterFavorites, searchQuery, customTmdbKey]);

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

  // Toggle Favorite Character in LocalStorage & Server
  const handleToggleFavorite = async (char: CharacterProfile) => {
    const res = await toggleCharacterFavorite(char, user?.id || 'demo_user');
    setFavoriteIds(res.favorites);
    setFavoritesCount(res.count);

    if (res.isFavorite) {
      setPopulatedToast(`❤️ Added "${char.name}" to your Favorites!`);
    } else {
      setPopulatedToast(`Removed "${char.name}" from Favorites.`);
    }

    // Update current character results in-place
    setCharacterResults((prev) =>
      prev.map((c) => (c.id === char.id ? { ...c, isFavorite: res.isFavorite } : c))
    );

    if (selectedCharacter && selectedCharacter.id === char.id) {
      setSelectedCharacter({ ...selectedCharacter, isFavorite: res.isFavorite });
    }

    setTimeout(() => setPopulatedToast(null), 3000);
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

  // Toggle Character in Visual Comparison Tray
  const handleToggleCompare = (char: CharacterProfile) => {
    const exists = selectedForComparison.some((c) => c.id === char.id);
    if (exists) {
      setSelectedForComparison((prev) => prev.filter((c) => c.id !== char.id));
      setPopulatedToast(`Removed "${char.name}" from visual comparison.`);
    } else {
      if (selectedForComparison.length >= 4) {
        setPopulatedToast('⚠️ Maximum 4 characters can be compared simultaneously.');
        setTimeout(() => setPopulatedToast(null), 3000);
        return;
      }
      const updated = [...selectedForComparison, char];
      setSelectedForComparison(updated);
      setPopulatedToast(`⚖️ Added "${char.name}" to Visual Comparison (${updated.length}/4).`);
      if (updated.length >= 2) {
        setCrossoverResult(generateCrossoverPrompt(updated));
      }
    }
    setTimeout(() => setPopulatedToast(null), 3000);
  };

  const handleOpenComparisonModal = () => {
    if (selectedForComparison.length < 2) {
      setPopulatedToast('⚠️ Please select at least 2 characters to compare.');
      setTimeout(() => setPopulatedToast(null), 3000);
      return;
    }
    setCrossoverResult(generateCrossoverPrompt(selectedForComparison));
    setIsComparisonModalOpen(true);
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

  // Launch Crossover Prompt into ImageStudio / FilmStudio
  const handleLaunchCrossoverToStudio = (target: 'image_studio' | 'film_studio') => {
    if (!crossoverResult || selectedForComparison.length < 2) return;
    try {
      const payload = {
        title: `Crossover: ${selectedForComparison.map((c) => c.name).join(' vs ')}`,
        characters: selectedForComparison,
        prompt: target === 'image_studio' ? crossoverResult.imageStudioPrompt : crossoverResult.filmStudioScriptPrompt,
        targetStudio: target,
        timestamp: Date.now(),
      };
      localStorage.setItem('icallog_active_crossover_studio_import', JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('icallog_crossover_studio_imported', { detail: payload }));
      setPopulatedToast(`⚔️ Crossover loaded into ${target.replace('_', ' ').toUpperCase()}!`);
      setTimeout(() => {
        setActiveTab(target as ActiveTab);
        setIsComparisonModalOpen(false);
        onClose();
      }, 300);
    } catch (err) {
      console.warn('Crossover launch error:', err);
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
      console.warn('Asset population notice:', err);
    }
  };

  // Filtered Studio tools list
  const filteredStudioItems: GlobalSearchItem[] = useMemo(() => {
    const items: GlobalSearchItem[] = [
      {
        id: 'image_studio',
        title: '8K Image & Character Studio',
        description: 'Generate hyper-realistic 8K cinematic imagery, character portraits, and visual concept art.',
        category: 'Image & Generative',
        filterType: 'studios',
        icon: <ImageIcon className="w-5 h-5 text-purple-400" />,
        tab: 'image_studio' as ActiveTab,
        keywords: ['image', 'photo', 'flux', 'art', 'draw', 'character', 'portrait', '8k'],
        hotkey: '⌘I',
      },
      {
        id: 'film_studio',
        title: 'Film & Screenplay Studio',
        description: 'Multi-scene screenplay writer, shot-by-shot storyboard generator, and character bible.',
        category: 'Film & 8K Video',
        filterType: 'video',
        icon: <Film className="w-5 h-5 text-indigo-400" />,
        tab: 'film_studio' as ActiveTab,
        keywords: ['film', 'screenplay', 'script', 'storyboard', 'director', 'scene', 'dialogue'],
        hotkey: '⌘F',
      },
      {
        id: 'three_d_engine',
        title: '3D Mesh Engine & Spatial Canvas',
        description: 'Generate 3D character meshes, rigged models, and spatial environment scenes.',
        category: '3D Mesh & Engine',
        filterType: '3d',
        icon: <Box className="w-5 h-5 text-cyan-400" />,
        tab: '3d_engine' as ActiveTab,
        keywords: ['3d', 'mesh', 'glb', 'threejs', 'obj', 'rigging', 'spatial', 'animation'],
        hotkey: '⌘3',
      },
      {
        id: 'music_studio',
        title: 'Music & Audio Studio',
        description: 'AI lyric composer, multi-track stems generator, and character voice dubbing.',
        category: 'Music & Dubbing',
        filterType: 'audio',
        icon: <Music className="w-5 h-5 text-emerald-400" />,
        tab: 'video_audio' as ActiveTab,
        keywords: ['music', 'audio', 'stem', 'voice', 'dub', 'song', 'orchestral'],
        hotkey: '⌘M',
      },
      {
        id: 'manga_studio',
        title: 'Manga & Comic Storyboarder',
        description: 'Multi-panel anime & comic creator with speech bubbles and dynamic speedlines.',
        category: 'Manga & Design',
        filterType: 'design',
        icon: <Sparkle className="w-5 h-5 text-pink-400" />,
        tab: 'image_studio' as ActiveTab,
        keywords: ['manga', 'comic', 'panel', 'anime', 'storyboard', 'dialogue', 'bubble'],
      },
      {
        id: 'projects_hub',
        title: 'Unified Projects Hub',
        description: 'Manage active studio productions, cloud assets, and team collaborations.',
        category: 'Projects Hub',
        filterType: 'projects',
        icon: <FolderKanban className="w-5 h-5 text-amber-400" />,
        tab: 'projects_hub' as ActiveTab,
        keywords: ['project', 'manage', 'vault', 'export', 'files', 'cloud'],
        hotkey: '⌘P',
      },
    ];

    if (!searchQuery.trim()) {
      return selectedFilter === 'all' ? items : items.filter((i) => i.filterType === selectedFilter);
    }
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        (selectedFilter === 'all' || item.filterType === selectedFilter) &&
        (item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.keywords?.some((k) => k.toLowerCase().includes(q)))
    );
  }, [searchQuery, selectedFilter]);

  // Filtered Trending items
  const filteredTrendingItems = useMemo(() => {
    if (!searchQuery.trim()) return trendingResults;
    const q = searchQuery.toLowerCase();
    return trendingResults.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.character.toLowerCase().includes(q) ||
        item.synopsis.toLowerCase().includes(q)
    );
  }, [trendingResults, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-16 px-3 bg-black/80 backdrop-blur-xl animate-fadeIn">
      {/* Toast Notification */}
      {populatedToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-70 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-2xl border border-purple-300/40 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
          <span>{populatedToast}</span>
        </div>
      )}

      <div
        className="w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ============================================================ */}
        {/* SEARCH HEADER & NAVIGATION MODES */}
        {/* ============================================================ */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/70 space-y-3">
          {/* Main Search Bar & Quick Toggles */}
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-purple-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeMode === 'characters'
                  ? 'Search Character Repository (e.g. Goku, Batman, Spider-Man, Sukuna, Leo, Neo)...'
                  : activeMode === 'trending'
                  ? 'Search Trending TMDB Blockbusters, OTT Series & Anime...'
                  : activeMode === 'entertainment'
                  ? 'Search Global Entertainment Lore & Multi-Language Subtitles...'
                  : 'Search 30+ Studios, AI Tools & Creative Features...'
              }
              className="w-full bg-transparent border-none text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:ring-0"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Custom API Key Configuration Button */}
            <button
              onClick={() => setShowApiDrawer(!showApiDrawer)}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                customTmdbKey || customOmdbKey
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="Configure TMDB / OMDb API Gateway"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {customTmdbKey ? 'TMDB Connected' : 'API Keys'}
              </span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 4 PRIMARY NAVIGATION MODAL TABS */}
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5 overflow-x-auto gap-2">
            <div className="flex items-center gap-1.5">
              {/* Character Repository Tab */}
              <button
                onClick={() => {
                  setActiveMode('characters');
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                  activeMode === 'characters'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20 ring-1 ring-purple-400/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Users className="w-4 h-4 text-purple-300" />
                <span>Character Repository</span>
                {favoritesCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                    {favoritesCount}
                  </span>
                )}
              </button>

              {/* Trending Media Dashboard Tab */}
              <button
                onClick={() => {
                  setActiveMode('trending');
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                  activeMode === 'trending'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-500/20 ring-1 ring-amber-400/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-amber-300" />
                <span>Trending Media</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              </button>

              {/* Global Media & Subtitles Tab */}
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
                        setCharacterFilterFavorites(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
                        characterCategory === tab.id && !characterFilterSaved && !characterFilterFavorites
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

              {/* Favorites Toggle, Saved to Repository Toggle & Refresh Button */}
              <div className="flex items-center gap-2">
                {/* Favorites Toggle */}
                <button
                  onClick={() => {
                    setCharacterFilterFavorites(!characterFilterFavorites);
                    if (!characterFilterFavorites) setCharacterFilterSaved(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    characterFilterFavorites
                      ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300 shadow-sm shadow-rose-500/20'
                      : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-rose-300'
                  }`}
                  title="Filter Favorited Characters"
                >
                  <Heart className={`w-3.5 h-3.5 ${characterFilterFavorites ? 'fill-rose-500 text-rose-500' : 'text-rose-400'}`} />
                  <span>Favorites ({favoritesCount})</span>
                </button>

                {/* Saved to Repo Toggle */}
                <button
                  onClick={() => {
                    setCharacterFilterSaved(!characterFilterSaved);
                    if (!characterFilterSaved) setCharacterFilterFavorites(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    characterFilterSaved
                      ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-sm shadow-amber-500/20'
                      : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-amber-300'
                  }`}
                >
                  <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Saved ({savedCharactersCount})</span>
                </button>

                {/* Open Visual Comparison Modal */}
                {selectedForComparison.length >= 2 && (
                  <button
                    onClick={handleOpenComparisonModal}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20 hover:brightness-110 transition-all animate-pulse"
                    title="Open Side-by-Side Visual Comparison"
                  >
                    <Scale className="w-3.5 h-3.5 text-cyan-200" />
                    <span>Compare ({selectedForComparison.length})</span>
                  </button>
                )}

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
                      Toggle favorites (stored in localStorage), compare multiple characters visually side-by-side, and import 1-click presets into ImageStudio and FilmStudio.
                    </p>
                  </div>
                </div>

                {/* Quick Compare Action if 2+ selected */}
                {selectedForComparison.length >= 2 && (
                  <button
                    onClick={handleOpenComparisonModal}
                    className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all transform hover:scale-105"
                  >
                    <Scale className="w-4 h-4 text-cyan-200" />
                    <span>Compare {selectedForComparison.length} Characters Side-by-Side</span>
                  </button>
                )}
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
                  <p className="text-xs text-slate-500 mt-1">Try changing the category, clearing favorites filter, or searching for another character name</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {characterResults.map((char) => {
                    const isFav = char.isFavorite || favoriteIds.includes(char.id);
                    const isCompared = selectedForComparison.some((c) => c.id === char.id);

                    return (
                      <div
                        key={char.id}
                        className={`group bg-slate-900/80 hover:bg-slate-850 border rounded-xl overflow-hidden shadow-lg transition-all flex flex-col justify-between hover:shadow-purple-500/10 ${
                          isCompared ? 'border-cyan-500/80 ring-2 ring-cyan-500/30' : 'border-slate-800 hover:border-purple-500/50'
                        }`}
                      >
                        {/* Top Visual Section */}
                        <div className="relative h-44 overflow-hidden bg-slate-950">
                          <img
                            src={char.avatarUrl}
                            alt={char.name}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                          {/* Top Left Badges */}
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 bg-black/70 backdrop-blur-md border border-white/10 rounded-md text-[10px] font-bold text-white uppercase tracking-wider">
                              {char.category}
                            </span>
                            <span className="px-2 py-0.5 bg-purple-950/80 backdrop-blur-md border border-purple-500/40 rounded-md text-[10px] font-medium text-purple-200">
                              {char.franchise}
                            </span>
                          </div>

                          {/* Top Right Action Controls (Favorite Heart & Save Bookmark) */}
                          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                            {/* Favorite Heart Toggle */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(char);
                              }}
                              className={`p-1.5 rounded-lg backdrop-blur-md border transition-all ${
                                isFav
                                  ? 'bg-rose-500/30 border-rose-500 text-rose-300 shadow-md shadow-rose-500/30'
                                  : 'bg-black/60 border-white/20 text-white/70 hover:text-rose-400 hover:bg-black/80'
                              }`}
                              title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
                            >
                              <Heart className={`w-4 h-4 transition-transform active:scale-125 ${isFav ? 'fill-rose-500 text-rose-400' : ''}`} />
                            </button>

                            {/* Bookmark Save Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSaveCharacter(char);
                              }}
                              className={`p-1.5 rounded-lg backdrop-blur-md border transition-all ${
                                char.isSavedToRepo
                                  ? 'bg-amber-500/30 border-amber-500 text-amber-300 shadow-md shadow-amber-500/30'
                                  : 'bg-black/60 border-white/20 text-white/70 hover:text-amber-300 hover:bg-black/80'
                              }`}
                              title={char.isSavedToRepo ? 'Saved in Repository' : 'Save to Character Repository'}
                            >
                              <Bookmark className={`w-4 h-4 ${char.isSavedToRepo ? 'fill-amber-400 text-amber-400' : ''}`} />
                            </button>
                          </div>

                          {/* Character Name & Role Overlay */}
                          <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between gap-2">
                            <div>
                              <h4 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors leading-tight flex items-center gap-1.5">
                                <span>{char.name}</span>
                                {isFav && <span className="text-xs text-rose-400 font-normal">❤️</span>}
                              </h4>
                              <p className="text-xs text-purple-300/90 line-clamp-1 font-medium">
                                {char.characterRole} • <span className="text-slate-400">{char.actorName}</span>
                              </p>
                            </div>
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

                            {/* Color Palette Swatches & Compare Button */}
                            <div className="flex items-center justify-between pt-2">
                              {char.visualTraits?.colorPalette && char.visualTraits.colorPalette.length > 0 ? (
                                <div className="flex items-center gap-1">
                                  <Palette className="w-3 h-3 text-pink-400 mr-1" />
                                  {char.visualTraits.colorPalette.slice(0, 4).map((hex, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => {
                                        navigator.clipboard.writeText(hex);
                                        setPopulatedToast(`Copied color ${hex} to clipboard!`);
                                        setTimeout(() => setPopulatedToast(null), 2000);
                                      }}
                                      className="w-3.5 h-3.5 rounded-full border border-white/20 hover:scale-125 transition-transform"
                                      style={{ backgroundColor: hex }}
                                      title={`Click to copy ${hex}`}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-500 font-mono">PBR Cinematic</span>
                              )}

                              {/* Visual Comparison Checkbox Button */}
                              <button
                                onClick={() => handleToggleCompare(char)}
                                className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all ${
                                  isCompared
                                    ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-sm'
                                    : 'bg-slate-950/80 border border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40'
                                }`}
                              >
                                <Scale className="w-3 h-3" />
                                <span>{isCompared ? 'Comparing' : '+ Compare'}</span>
                              </button>
                            </div>
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
                    );
                  })}
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
        {/* FLOATING VISUAL COMPARISON BOTTOM DOCK */}
        {/* ============================================================ */}
        {selectedForComparison.length > 0 && (
          <div className="p-3 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 border-t border-cyan-500/30 flex items-center justify-between flex-wrap gap-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-xs font-bold text-cyan-200">
                  Visual Comparison ({selectedForComparison.length}/4 Selected):
                </span>
              </div>

              {/* Selected Character Avatars */}
              <div className="flex items-center gap-2">
                {selectedForComparison.map((c) => (
                  <div key={c.id} className="relative group">
                    <img
                      src={c.avatarUrl}
                      alt={c.name}
                      className="w-8 h-8 rounded-lg object-cover border border-cyan-400 shadow-md"
                    />
                    <button
                      onClick={() => handleToggleCompare(c)}
                      className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                    <div className="hidden group-hover:block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap z-50">
                      {c.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedForComparison([])}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs rounded-lg transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>

              <button
                onClick={handleOpenComparisonModal}
                disabled={selectedForComparison.length < 2}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg transition-all ${
                  selectedForComparison.length >= 2
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/20 ring-1 ring-cyan-400/50'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Scale className="w-4 h-4" />
                <span>Compare Visual Traits Now</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* CHARACTER DEEP DIVE INSPECTOR MODAL */}
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
                
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  {/* Favorite Toggle inside inspector */}
                  <button
                    onClick={() => handleToggleFavorite(selectedCharacter)}
                    className={`p-2 rounded-xl backdrop-blur-md border transition-all ${
                      selectedCharacter.isFavorite || favoriteIds.includes(selectedCharacter.id)
                        ? 'bg-rose-500/30 border-rose-500 text-rose-300'
                        : 'bg-black/60 border-white/20 text-white/80 hover:text-rose-400'
                    }`}
                    title="Toggle Favorite"
                  >
                    <Heart className={`w-5 h-5 ${selectedCharacter.isFavorite || favoriteIds.includes(selectedCharacter.id) ? 'fill-rose-500 text-rose-400' : ''}`} />
                  </button>

                  <button
                    onClick={() => setSelectedCharacter(null)}
                    className="p-2 bg-black/60 hover:bg-black/80 border border-white/20 text-white rounded-xl"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

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
                        {(selectedCharacter.isFavorite || favoriteIds.includes(selectedCharacter.id)) && (
                          <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-[10px] font-bold flex items-center gap-1">
                            <Heart className="w-3 h-3 fill-rose-500 text-rose-500" /> Favorite
                          </span>
                        )}
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
                <div className="flex items-center gap-2">
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

                  <button
                    onClick={() => handleToggleCompare(selectedCharacter)}
                    className={`px-3 py-2.5 rounded-xl border font-semibold flex items-center gap-1.5 text-xs sm:text-sm transition-all ${
                      selectedForComparison.some((c) => c.id === selectedCharacter.id)
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-900 border-slate-700 text-slate-200 hover:text-cyan-300'
                    }`}
                  >
                    <Scale className="w-4 h-4" />
                    <span>{selectedForComparison.some((c) => c.id === selectedCharacter.id) ? 'In Compare' : 'Add to Compare'}</span>
                  </button>
                </div>

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

        {/* ============================================================ */}
        {/* DEDICATED VISUAL COMPARISON MODAL */}
        {/* ============================================================ */}
        {isComparisonModalOpen && selectedForComparison.length >= 2 && (
          <div
            className="fixed inset-0 z-70 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
            onClick={() => setIsComparisonModalOpen(false)}
          >
            <div
              className="w-full max-w-6xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Comparison Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-cyan-950/50 to-indigo-950 border-b border-cyan-500/30 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <span>Visual Trait Comparison Matrix</span>
                      <span className="px-2 py-0.5 text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 rounded-full font-bold">
                        {selectedForComparison.length} Characters Side-by-Side
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Comparing aesthetic archetypes, color palettes, visual signatures, and generative crossover prompts.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLaunchCrossoverToStudio('image_studio')}
                    className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Crossover in ImageStudio</span>
                  </button>

                  <button
                    onClick={() => handleLaunchCrossoverToStudio('film_studio')}
                    className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5"
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Crossover in FilmStudio</span>
                  </button>

                  <button
                    onClick={() => setIsComparisonModalOpen(false)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Comparison Section Tabs */}
              <div className="flex items-center bg-slate-950 px-6 border-b border-slate-800 gap-2 text-xs font-semibold overflow-x-auto">
                {[
                  { id: 'visual_matrix', label: 'Visual Traits & Archetypes' },
                  { id: 'color_palette', label: 'Color Harmony & Swatches' },
                  { id: 'abilities', label: 'Abilities & Lore' },
                  { id: 'studio_prompts', label: 'Studio Presets' },
                  { id: 'crossover', label: '⚔️ Unified Crossover Arena' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setComparisonActiveTab(t.id as any)}
                    className={`py-3 px-3.5 border-b-2 transition-all whitespace-nowrap ${
                      comparisonActiveTab === t.id
                        ? 'border-cyan-400 text-cyan-300 font-bold'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Comparison Multi-Column Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* 1. Visual Traits Multi-Column Comparison */}
                {comparisonActiveTab === 'visual_matrix' && (
                  <div className={`grid grid-cols-1 md:grid-cols-${selectedForComparison.length} gap-4`}>
                    {selectedForComparison.map((char) => (
                      <div key={char.id} className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden p-4 space-y-4">
                        {/* Avatar & Header */}
                        <div className="relative h-44 rounded-lg overflow-hidden bg-slate-900 border border-slate-700">
                          <img src={char.avatarUrl} alt={char.name} className="w-full h-full object-cover object-top" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                          <div className="absolute bottom-2 left-2 right-2">
                            <span className="px-2 py-0.5 bg-purple-900/80 text-purple-200 text-[10px] font-bold rounded">
                              {char.category.toUpperCase()}
                            </span>
                            <h4 className="text-base font-bold text-white leading-tight mt-1">{char.name}</h4>
                            <p className="text-xs text-slate-400">{char.franchise}</p>
                          </div>
                        </div>

                        {/* Traits Matrix */}
                        <div className="space-y-2 text-xs">
                          <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                            <span className="text-purple-400 font-bold text-[10px] uppercase block mb-0.5">Signature Outfit</span>
                            <p className="text-slate-200">{char.visualTraits.outfit}</p>
                          </div>
                          <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                            <span className="text-cyan-400 font-bold text-[10px] uppercase block mb-0.5">Hair, Eyes & Silhouette</span>
                            <p className="text-slate-200">{char.visualTraits.hairAndEyes}</p>
                          </div>
                          <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                            <span className="text-amber-400 font-bold text-[10px] uppercase block mb-0.5">Iconic Prop / Weapon</span>
                            <p className="text-slate-200">{char.visualTraits.iconicItem}</p>
                          </div>
                          <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                            <span className="text-pink-400 font-bold text-[10px] uppercase block mb-0.5">Aesthetic Archetype</span>
                            <p className="text-slate-200">{char.visualTraits.aestheticArchetype}</p>
                          </div>
                        </div>

                        {/* Quick 1-click import buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                          <button
                            onClick={() => {
                              handleLaunchStudioWithCharacter(char, 'image_studio');
                              setIsComparisonModalOpen(false);
                            }}
                            className="px-2 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1"
                          >
                            <ImageIcon className="w-3 h-3" /> ImageStudio
                          </button>
                          <button
                            onClick={() => {
                              handleLaunchStudioWithCharacter(char, 'film_studio');
                              setIsComparisonModalOpen(false);
                            }}
                            className="px-2 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1"
                          >
                            <Film className="w-3 h-3" /> FilmStudio
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Color Harmony & Swatches Comparison */}
                {comparisonActiveTab === 'color_palette' && (
                  <div className="space-y-6">
                    <div className={`grid grid-cols-1 md:grid-cols-${selectedForComparison.length} gap-4`}>
                      {selectedForComparison.map((char) => (
                        <div key={char.id} className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                          <div className="flex items-center gap-3">
                            <img src={char.avatarUrl} alt={char.name} className="w-12 h-12 rounded-lg object-cover border border-slate-700" />
                            <div>
                              <h4 className="font-bold text-white text-sm">{char.name}</h4>
                              <p className="text-xs text-slate-400">{char.visualTraits.aestheticArchetype}</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[11px] font-bold text-slate-300">Palette Swatches:</span>
                            <div className="space-y-2">
                              {char.visualTraits.colorPalette.map((hex, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-md border border-white/20" style={{ backgroundColor: hex }} />
                                    <span className="font-mono text-xs text-slate-200">{hex}</span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(hex);
                                      setPopulatedToast(`Copied ${hex}!`);
                                      setTimeout(() => setPopulatedToast(null), 1500);
                                    }}
                                    className="p-1 text-slate-400 hover:text-white"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Abilities & Lore Comparison */}
                {comparisonActiveTab === 'abilities' && (
                  <div className={`grid grid-cols-1 md:grid-cols-${selectedForComparison.length} gap-4`}>
                    {selectedForComparison.map((char) => (
                      <div key={char.id} className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                        <div className="flex items-center gap-3">
                          <img src={char.avatarUrl} alt={char.name} className="w-12 h-12 rounded-lg object-cover border border-slate-700" />
                          <div>
                            <h4 className="font-bold text-white text-sm">{char.name}</h4>
                            <p className="text-xs text-slate-400">{char.franchise}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-xs font-bold text-amber-300">Powers & Signature Moves:</span>
                          <div className="flex flex-col gap-1.5">
                            {char.abilities.map((ability, idx) => (
                              <div key={idx} className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-200 font-medium">
                                ⚡ {ability}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Personality & Drive</span>
                          <p className="text-xs text-slate-300">{char.personality}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. Studio Presets Comparison */}
                {comparisonActiveTab === 'studio_prompts' && (
                  <div className={`grid grid-cols-1 md:grid-cols-${selectedForComparison.length} gap-4`}>
                    {selectedForComparison.map((char) => (
                      <div key={char.id} className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          <span>{char.name}</span>
                        </h4>

                        <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-indigo-300 uppercase">ImageStudio Prompt</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(char.studioPresets.imageStudioPrompt);
                                setPopulatedToast(`Copied ${char.name}'s image prompt!`);
                                setTimeout(() => setPopulatedToast(null), 1500);
                              }}
                              className="text-xs text-indigo-400 hover:text-white"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-300 font-mono line-clamp-4">{char.studioPresets.imageStudioPrompt}</p>
                        </div>

                        <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-purple-300 uppercase">Screenplay Scene</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(char.studioPresets.filmStudioScriptPrompt);
                                setPopulatedToast(`Copied ${char.name}'s screenplay script!`);
                                setTimeout(() => setPopulatedToast(null), 1500);
                              }}
                              className="text-xs text-purple-400 hover:text-white"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <pre className="text-[11px] text-slate-300 font-mono line-clamp-4 whitespace-pre-wrap">{char.studioPresets.filmStudioScriptPrompt}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 5. Fused Crossover Arena */}
                {comparisonActiveTab === 'crossover' && crossoverResult && (
                  <div className="p-5 bg-gradient-to-r from-purple-950/60 via-slate-950 to-indigo-950/60 rounded-xl border border-purple-500/30 space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Swords className="w-5 h-5 text-amber-400" />
                        <h4 className="text-base font-bold text-white">{crossoverResult.summary}</h4>
                      </div>
                    </div>

                    {/* ImageStudio Crossover Prompt */}
                    <div className="p-4 bg-slate-900/90 rounded-xl border border-indigo-500/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-300 text-xs flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4" /> 8K Crossover Battle Art Prompt
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(crossoverResult.imageStudioPrompt);
                              setPopulatedToast('Copied Crossover Image prompt!');
                              setTimeout(() => setPopulatedToast(null), 1500);
                            }}
                            className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 rounded-md text-xs font-semibold flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                          <button
                            onClick={() => handleLaunchCrossoverToStudio('image_studio')}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold flex items-center gap-1 shadow-md shadow-indigo-500/30"
                          >
                            <Play className="w-3 h-3" /> Generate in ImageStudio
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-200 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800">
                        {crossoverResult.imageStudioPrompt}
                      </p>
                    </div>

                    {/* FilmStudio Crossover Screenplay */}
                    <div className="p-4 bg-slate-900/90 rounded-xl border border-purple-500/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-300 text-xs flex items-center gap-1.5">
                          <Film className="w-4 h-4" /> Multiverse Showdown Screenplay Script
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(crossoverResult.filmStudioScriptPrompt);
                              setPopulatedToast('Copied Crossover Screenplay!');
                              setTimeout(() => setPopulatedToast(null), 1500);
                            }}
                            className="px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 rounded-md text-xs font-semibold flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                          <button
                            onClick={() => handleLaunchCrossoverToStudio('film_studio')}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-xs font-semibold flex items-center gap-1 shadow-md shadow-purple-500/30"
                          >
                            <Play className="w-3 h-3" /> Open in FilmStudio
                          </button>
                        </div>
                      </div>
                      <pre className="text-xs text-slate-200 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap">
                        {crossoverResult.filmStudioScriptPrompt}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>
              Pillars: <strong className="text-purple-400">Character Repository (with Favorites & Compare)</strong> • <strong className="text-amber-400">Trending TMDB</strong> • <strong className="text-cyan-400">Global Lore</strong> • <strong className="text-indigo-400">30+ Studios</strong>
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

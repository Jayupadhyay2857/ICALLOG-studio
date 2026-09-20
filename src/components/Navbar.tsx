import React, { useState, useEffect, useRef, useMemo } from 'react';
import JSZip from 'jszip';
import {
  Sparkles,
  Coins,
  ShieldAlert,
  HardDrive,
  CreditCard,
  Crown,
  KeyRound,
  Menu,
  X,
  Search,
  Clapperboard,
  Film,
  FileText,
  Presentation,
  Sheet,
  Award,
  FileCheck,
  Box,
  Image as ImageIcon,
  Video,
  Mic,
  BookOpen,
  ChevronRight,
  Type,
  Smile,
  ArrowRight,
  FolderKanban,
  Plus,
  Music,
  Globe,
  LogIn,
  RefreshCw,
  Cookie,
  Camera,
  Download,
  FolderDown,
} from 'lucide-react';
import { UserProfile, ActiveTab, ProjectItem } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { PersonaBadge, getPersonaConfig } from './PersonaBadge.tsx';
import { ProfileTab } from './ProfileSettingsModal.tsx';
import {
  startVoiceRecognition,
  stopVoiceRecognition,
  subscribeVoiceNav,
  VoiceNavState,
} from '../lib/voiceNavigation.ts';
import { sanitizeInput, checkRateLimit, setSecureLocalItem, getSecureLocalItem } from '../lib/securitySanitizer.ts';

export type SearchFilterType = 'all' | 'projects' | 'tools' | 'docs';

interface SearchResultItem {
  id: string;
  title: string;
  description: string;
  category: string;
  itemType: 'project' | 'tool' | 'docs';
  icon: React.ReactNode;
  tab: ActiveTab;
  subTab?: string;
  action?: () => void;
  badge?: string;
  isProject?: boolean;
  manualSectionId?: string;
}

interface NavbarProps {
  user: UserProfile;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  openAdminModal: () => void;
  openHistoryModal: () => void;
  openProfileModal: (tab?: ProfileTab) => void;
  openCookieModal?: () => void;
  onSelectSubTab?: (tab: ActiveTab, subTab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  isDarkMode,
  toggleDarkMode,
  openAdminModal,
  openHistoryModal,
  openProfileModal,
  openCookieModal,
  onSelectSubTab,
}) => {
  const { t, currentLangOption } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<SearchFilterType>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [userProjects, setUserProjects] = useState<ProjectItem[]>([]);
  const [voiceNavState, setVoiceNavState] = useState<VoiceNavState | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeVoiceNav((st) => setVoiceNavState(st));
    return () => unsubscribe();
  }, []);

  // Load user saved projects from localStorage
  useEffect(() => {
    const loadProjects = () => {
      try {
        const saved = localStorage.getItem('icallog_user_projects_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setUserProjects(parsed);
          }
        }
      } catch {
        // ignore
      }
    };
    loadProjects();
    window.addEventListener('storage', loadProjects);
    return () => window.removeEventListener('storage', loadProjects);
  }, [isSearchOpen, mobileMenuOpen]);

  const [isExporting, setIsExporting] = useState(false);

  const handleExportProjectZip = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();

      // Manifest
      const manifest = {
        exportedAt: new Date().toISOString(),
        appName: 'AI Studio Workspace',
        activeTab,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          vipTier: user.vipTier,
        },
        savedProjectsCount: userProjects.length,
        savedProjects: userProjects,
      };
      zip.file('manifest.json', JSON.stringify(manifest, null, 2));

      // README
      const readme = `================================================
AI STUDIO WORKSPACE ASSET EXPORT
Export Date: ${new Date().toLocaleString()}
Active Module: ${activeTab}
User: ${user.name || 'User'} (${user.email || 'Guest Account'})
================================================

Included Files:
- /manifest.json : Workspace session summary and active project indices
- /projects/      : Saved project files and JSON state
- /media_vault/   : Image, audio, video, and screenplay assets
- /session_backup/: Browser workspace snapshot

Thank you for building with AI Studio!
`;
      zip.file('README.txt', readme);

      // Projects folder
      const projectsFolder = zip.folder('projects');
      if (userProjects.length > 0) {
        userProjects.forEach((proj, idx) => {
          const safeTitle = (proj.title || `project_${idx + 1}`).replace(/[^a-z0-9]/gi, '_').toLowerCase();
          projectsFolder?.file(`${idx + 1}_${safeTitle}.json`, JSON.stringify(proj, null, 2));
        });
      } else {
        projectsFolder?.file('current_workspace.json', JSON.stringify({
          activeTab,
          exportedAt: new Date().toISOString(),
          status: 'Active Workspace Session',
        }, null, 2));
      }

      // Media vault folder
      const mediaVaultFolder = zip.folder('media_vault');
      try {
        const storedVault = localStorage.getItem('aistudio_media_vault') || localStorage.getItem('media_vault_items');
        if (storedVault) {
          const parsedVault = JSON.parse(storedVault);
          if (Array.isArray(parsedVault)) {
            parsedVault.forEach((item: any, idx: number) => {
              if (item.url && item.url.startsWith('data:')) {
                const parts = item.url.split(',');
                const mimeMatch = parts[0].match(/:(.*?);/);
                const mime = mimeMatch ? mimeMatch[1] : 'image/png';
                const ext = mime.split('/')[1] || 'png';
                const base64Data = parts[1];
                mediaVaultFolder?.file(`asset_${idx + 1}_${(item.title || 'media').replace(/[^a-z0-9]/gi, '_')}.${ext}`, base64Data, { base64: true });
              } else {
                mediaVaultFolder?.file(`asset_${idx + 1}_info.json`, JSON.stringify(item, null, 2));
              }
            });
          }
        }
      } catch (err) {
        console.warn('Error archiving media vault:', err);
      }

      // Session Backup
      const sessionFolder = zip.folder('session_backup');
      const backupData: Record<string, any> = {};
      const backupKeys = [
        'icallog_user_projects_v1',
        'aistudio_media_vault',
        'aistudio_history',
        'aistudio_cinema_scripts',
        'aistudio_music_tracks',
      ];
      backupKeys.forEach((key) => {
        const val = localStorage.getItem(key);
        if (val) {
          try {
            backupData[key] = JSON.parse(val);
          } catch {
            backupData[key] = val;
          }
        }
      });
      sessionFolder?.file('session_snapshot.json', JSON.stringify(backupData, null, 2));

      // Generate Zip
      const blob = await zip.generateAsync({ type: 'blob' });
      const zipName = `aistudio_export_${activeTab}_${Date.now()}.zip`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = zipName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      // Toast feedback
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-5 right-5 z-[9999] px-4 py-2.5 rounded-xl bg-slate-900 border border-emerald-400 text-emerald-300 text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce';
      toast.innerHTML = '<span>📦</span> <span>Workspace assets exported successfully as ZIP archive!</span>';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } catch (err) {
      console.error('Failed to export project archive:', err);
      alert('Failed to generate project zip archive.');
    } finally {
      setIsExporting(false);
    }
  };

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        // Only close dropdown if not in full modal overlay
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Master Search Index for Tools
  const SEARCH_ITEMS: SearchResultItem[] = [
    {
      id: 'role_dashboard_search',
      title: 'Personalized Role Workspace & Dashboard',
      description: 'Dynamic tools layout tailored for Professional, Student, General, or Content Creator roles',
      category: 'Workspace',
      itemType: 'tool',
      icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
      tab: 'role_dashboard',
      badge: 'Role',
    },
    {
      id: 'projects_hub_search',
      title: 'My Projects Hub & Saved Files',
      description: 'Access all your saved projects, create unlimited projects, modify, pin, and share',
      category: 'Projects',
      itemType: 'tool',
      icon: <FolderKanban className="w-4 h-4 text-cyan-400" />,
      tab: 'projects_hub',
      badge: 'Hub',
    },
    {
      id: 'pro_camera_search',
      title: 'Pro Camera Studio (8K HDR • Zoom • Video • Sound)',
      description: 'Click high-res photos, record 4K video, record voice mic with audio FX & store in media vault',
      category: 'Camera Studio',
      itemType: 'tool',
      icon: <Camera className="w-4 h-4 text-cyan-400" />,
      tab: 'pro_camera',
      badge: '8K HDR',
    },
    {
      id: 'camera_video_recording_search',
      title: '4K Ultra Video Recording Studio',
      description: 'Record high-fps cinema videos with teleprompter HUD, audio sync, and LUT filters',
      category: 'Camera Studio',
      itemType: 'tool',
      icon: <Video className="w-4 h-4 text-rose-400" />,
      tab: 'pro_camera',
      badge: 'Video',
    },
    {
      id: 'camera_sound_mic_search',
      title: 'High-Definition Sound & Mic Recorder',
      description: 'Record voice podcasts, vocal tracks with live frequency waveform visualizer & studio FX',
      category: 'Audio Studio',
      itemType: 'tool',
      icon: <Mic className="w-4 h-4 text-purple-400" />,
      tab: 'pro_camera',
      badge: 'Sound',
    },
    {
      id: 'new_blank_project_action',
      title: '+ Create New Blank Project',
      description: 'Launch an empty project canvas with all 14+ AI engines & office tools unlocked',
      category: 'Action',
      itemType: 'tool',
      icon: <Plus className="w-4 h-4 text-emerald-400" />,
      tab: 'projects_hub',
      badge: 'New',
    },
    {
      id: 'song_studio_search',
      title: 'A-Z Music & Audio Studio',
      description: '26 genres (Acoustic to Zouk), AI multi-voice generation, BPM slider, stem export',
      category: 'Music',
      itemType: 'tool',
      icon: <Music className="w-4 h-4 text-purple-400" />,
      tab: 'song_studio',
      badge: 'A-Z',
    },
    {
      id: 'media_mixer_search',
      title: 'AI Multi-Media Mixer & Fusion Studio',
      description: 'Mix 2+ Images and Videos in any combo (Image+Video, Video+Video, Image+Image) with custom AI commands',
      category: 'Creative Media',
      itemType: 'tool',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      tab: 'media_mixer',
      badge: 'Fusion',
    },
    {
      id: 'film_studio',
      title: 'AI Film Studio: Script Writing & Direction',
      description: 'Screenplay generator, director styles, shot lists, and camera blocking',
      category: 'Cinema',
      itemType: 'tool',
      icon: <Clapperboard className="w-4 h-4 text-amber-400" />,
      tab: 'film_studio',
      badge: 'Cinema',
    },
    {
      id: 'script_writing',
      title: 'Screenplay & Script Writer',
      description: 'Professional standard sluglines, action description, and character dialogue',
      category: 'Cinema',
      itemType: 'tool',
      icon: <Film className="w-4 h-4 text-amber-400" />,
      tab: 'film_studio',
      badge: 'Script',
    },
    {
      id: 'film_direction',
      title: 'Director Style Calibration & Camera Blocking',
      description: 'Christopher Nolan, Denis Villeneuve, Quentin Tarantino cinematography presets',
      category: 'Cinema',
      itemType: 'tool',
      icon: <Clapperboard className="w-4 h-4 text-cyan-400" />,
      tab: 'film_studio',
      badge: 'Director',
    },
    {
      id: 'docs_editor',
      title: 'Docs File & Word Studio',
      description: 'Create, edit, and format documents, project proposals, agreements (.doc/.txt)',
      category: 'Office Suite',
      itemType: 'tool',
      icon: <FileText className="w-4 h-4 text-cyan-400" />,
      tab: 'office_suite',
      subTab: 'docs',
      badge: 'Word',
    },
    {
      id: 'ppt_generator',
      title: 'PPT Presentation & Slides Studio',
      description: 'Build pitch decks, slide shows, executive presentations with live presentation mode',
      category: 'Office Suite',
      itemType: 'tool',
      icon: <Presentation className="w-4 h-4 text-amber-400" />,
      tab: 'office_suite',
      subTab: 'ppt',
      badge: 'Slides',
    },
    {
      id: 'excel_spreadsheet',
      title: 'Excel Spreadsheet & Financial Grid',
      description: 'Dynamic cells, formula engine (=SUM, =C*D), production budgets, CSV export',
      category: 'Office Suite',
      itemType: 'tool',
      icon: <Sheet className="w-4 h-4 text-emerald-400" />,
      tab: 'office_suite',
      subTab: 'excel',
      badge: 'Excel',
    },
    {
      id: 'favicon_creation',
      title: 'Favicon & App Icon Generator',
      description: 'Multi-resolution icons (16x16, 32x32, 180x180, SVG) with browser tab mockups',
      category: 'Design & Identity',
      itemType: 'tool',
      icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
      tab: 'design_studio',
      subTab: 'favicon',
      badge: 'Favicon',
    },
    {
      id: 'badges_creator',
      title: 'Security & Enterprise ID Badges',
      description: 'ID cards, VIP access passes, holographic security strip, print-ready format',
      category: 'Design & Identity',
      itemType: 'tool',
      icon: <Award className="w-4 h-4 text-amber-400" />,
      tab: 'design_studio',
      subTab: 'badges',
      badge: 'Badges',
    },
    {
      id: 'business_cards',
      title: 'Business Cards Studio (3.5" x 2.0")',
      description: 'Front & back luxury double-sided cards, metallic accents, vCard QR code',
      category: 'Design & Identity',
      itemType: 'tool',
      icon: <CreditCard className="w-4 h-4 text-purple-400" />,
      tab: 'design_studio',
      subTab: 'business_cards',
      badge: 'Cards',
    },
    {
      id: 'resume_builder',
      title: 'Professional ATS Resume & CV Builder',
      description: 'Modern executive two-column resume builder, competencies, one-click PDF print',
      category: 'Design & Identity',
      itemType: 'tool',
      icon: <FileCheck className="w-4 h-4 text-emerald-400" />,
      tab: 'design_studio',
      subTab: 'resume',
      badge: 'Resume',
    },
    {
      id: 'emote_studio',
      title: 'Custom Emote & Sticker Creator Studio',
      description: 'Generate Twitch, Discord & YouTube emotes, reaction stickers, and sub badges with transparent PNG export',
      category: 'Design & Identity',
      itemType: 'tool',
      icon: <Smile className="w-4 h-4 text-purple-400" />,
      tab: 'design_studio',
      subTab: 'emote_studio',
      badge: 'Emotes',
    },
    {
      id: 'font_handwriting_studio',
      title: 'Handwriting to Font & World Language Font Studio',
      description: 'Convert paper handwriting into .TTF/.OTF font files. Supports Hindi, English, Arabic, CJK & 150+ scripts',
      category: 'Design & Identity',
      itemType: 'tool',
      icon: <Type className="w-4 h-4 text-pink-400" />,
      tab: 'design_studio',
      subTab: 'font_studio',
      badge: 'Font Studio',
    },
    {
      id: 'text_to_3d',
      title: 'Text to 3D Model AI Generator',
      description: 'Synthesize full 3D volumetric GLTF/OBJ meshes from natural language prompts',
      category: '3D & Motion',
      itemType: 'tool',
      icon: <Box className="w-4 h-4 text-cyan-400" />,
      tab: '3d_engine',
      badge: '3D AI',
    },
    {
      id: '3d_webgl',
      title: '3D WebGL Studio & Auto-Rigging',
      description: 'Interactive 3D viewport, 17-bone inverse kinematics, GLTF downloads',
      category: '3D & Motion',
      itemType: 'tool',
      icon: <Box className="w-4 h-4 text-cyan-400" />,
      tab: '3d_engine',
      badge: 'WebGL',
    },
    {
      id: 'image_to_3d',
      title: 'Image to 3D Model AI',
      description: 'Reconstruct 3D polygonal meshes from 2D concepts with automatic rigging',
      category: '3D & Motion',
      itemType: 'tool',
      icon: <Box className="w-4 h-4 text-indigo-400" />,
      tab: '3d_engine',
      badge: 'Img3D',
    },
    {
      id: '3d_to_video',
      title: '3D Model to Video Cinema',
      description: 'Render 3D WebGL models with camera trajectory rigs into 8K cinema video',
      category: '3D & Motion',
      itemType: 'tool',
      icon: <Film className="w-4 h-4 text-amber-400" />,
      tab: '3d_engine',
      badge: '3D Cinema',
    },
    {
      id: 'meme_gif_studio_search',
      title: 'AI Meme Generator & GIF Creator Studio',
      description: 'Create viral memes, camera selfie memes, upload photos/videos, AI Face Swap, talking meme avatars & animated GIFs',
      category: 'Meme & Viral',
      itemType: 'tool',
      icon: <Smile className="w-4 h-4 text-amber-400" />,
      tab: 'meme_gif_studio',
      badge: 'Viral',
    },
    {
      id: 'quick_image_search_item',
      title: 'Image Studio & AI Photo Generator',
      description: 'Generate high-res AI images, artistic styles, upscaling and prompt engineering',
      category: 'Creative Media',
      itemType: 'tool',
      icon: <ImageIcon className="w-4 h-4 text-pink-400" />,
      tab: 'image_studio',
      badge: 'Image',
    },
    {
      id: 'quick_video_search_item',
      title: 'Video Studio & AI Animation Generator',
      description: 'Create cinematic video clips, motion grading, and text-to-video sequences',
      category: 'Creative Media',
      itemType: 'tool',
      icon: <Video className="w-4 h-4 text-cyan-400" />,
      tab: 'video_audio',
      badge: 'Video',
    },
    {
      id: 'voice_converter',
      title: 'Human to AI Voice Converter',
      description: 'Live mic recording, vocal stems upload, pitch shift, 6 AI vocal personas',
      category: 'Audio',
      itemType: 'tool',
      icon: <Mic className="w-4 h-4 text-rose-400" />,
      tab: 'voice_converter',
      badge: 'Voice AI',
    },
    {
      id: 'privacy_cookies_storage_permissions',
      title: 'Privacy, Cookies & Storage Permissions',
      description: 'Configure LocalStorage, IndexedDB storage permissions, Cookie consent, Geolocation, Camera, Microphone, and WebGL device APIs',
      category: 'Privacy & Security',
      itemType: 'tool',
      icon: <Cookie className="w-4 h-4 text-cyan-400" />,
      tab: activeTab,
      action: () => openProfileModal('cookies'),
      badge: 'Privacy',
    },
    {
      id: 'cloud_storage_manager',
      title: 'Cloud Storage & File Vault',
      description: 'Synchronized cloud storage buckets, asset downloads, and storage management',
      category: 'Storage',
      itemType: 'tool',
      icon: <HardDrive className="w-4 h-4 text-emerald-400" />,
      tab: 'cloud_storage',
      badge: 'Storage',
    },
  ];

  // Master Search Index for Documentation Pages & User Manual Chapters
  const DOCS_ITEMS: SearchResultItem[] = [
    {
      id: 'doc_getting_started',
      title: 'Documentation: Getting Started & System Architecture',
      description: 'System overview, 14+ AI engines, 8K WebGL viewport, local session sync & user profiles',
      category: 'Documentation',
      itemType: 'docs',
      icon: <BookOpen className="w-4 h-4 text-cyan-400" />,
      tab: 'user_manual',
      badge: 'Guide',
      manualSectionId: 'getting-started',
    },
    {
      id: 'doc_3d_engine',
      title: 'Documentation: WebGL 3D Studio, Inverse Kinematics & Auto-Rigging',
      description: '17-bone inverse kinematics character rigging, GLTF mesh generation, 8K camera trajectories',
      category: 'Documentation',
      itemType: 'docs',
      icon: <Box className="w-4 h-4 text-indigo-400" />,
      tab: 'user_manual',
      badge: '3D Manual',
      manualSectionId: '3d-engine',
    },
    {
      id: 'doc_image_studio',
      title: 'Documentation: Photorealistic AI Image Generation & Prompting Guide',
      description: 'Mastering aspect ratios, prompt modifiers, lighting presets, negative prompts, and upscaling',
      category: 'Documentation',
      itemType: 'docs',
      icon: <ImageIcon className="w-4 h-4 text-pink-400" />,
      tab: 'user_manual',
      badge: 'Prompting',
      manualSectionId: 'image-studio',
    },
    {
      id: 'doc_video_audio',
      title: 'Documentation: 8K Video Suite & Motion Grading',
      description: 'Text-to-video rendering, image-to-video motion, frame rate control, audio spectrum visualizer',
      category: 'Documentation',
      itemType: 'docs',
      icon: <Video className="w-4 h-4 text-purple-400" />,
      tab: 'user_manual',
      badge: 'Video Guide',
      manualSectionId: 'video-audio',
    },
    {
      id: 'doc_film_studio',
      title: 'Documentation: AI Film Making, Screenwriting & Camera Blocking',
      description: 'Hollywood sluglines, character dialogue trees, director style presets (Nolan, Villeneuve, Tarantino)',
      category: 'Documentation',
      itemType: 'docs',
      icon: <Clapperboard className="w-4 h-4 text-amber-400" />,
      tab: 'user_manual',
      badge: 'Cinema',
      manualSectionId: 'film-studio',
    },
    {
      id: 'doc_voice_converter',
      title: 'Documentation: Human to AI Voice Converter & Persona Models',
      description: 'Live voice mic recording, vocal pitch shift, stem separation, and 6 custom AI vocal models',
      category: 'Documentation',
      itemType: 'docs',
      icon: <Mic className="w-4 h-4 text-rose-400" />,
      tab: 'user_manual',
      badge: 'Voice Guide',
      manualSectionId: 'voice-converter',
    },
    {
      id: 'doc_office_suite',
      title: 'Documentation: Office Suite Word Docs, PPT Slides & Excel Engine',
      description: 'Document formatting, PPT slide decks, Excel formulas (=SUM, =AVERAGE), CSV export & print guides',
      category: 'Documentation',
      itemType: 'docs',
      icon: <FileText className="w-4 h-4 text-cyan-400" />,
      tab: 'user_manual',
      badge: 'Office Guide',
      manualSectionId: 'office-suite',
    },
    {
      id: 'doc_design_identity',
      title: 'Documentation: Design Studio Favicons, ID Badges, Cards & ATS Resumes',
      description: 'Generating multi-res favicons, holographic VIP badges, business card vCards, and ATS resumes',
      category: 'Documentation',
      itemType: 'docs',
      icon: <Award className="w-4 h-4 text-purple-400" />,
      tab: 'user_manual',
      badge: 'Design',
      manualSectionId: 'design-identity',
    },
    {
      id: 'doc_ai_mentor',
      title: 'Documentation: AI Mentor & Interactive Chat Assistant Guide',
      description: 'Context-aware prompt guidance, code debugging, creative brainstorming, and workflow automation',
      category: 'Documentation',
      itemType: 'docs',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      tab: 'user_manual',
      badge: 'Assistant',
      manualSectionId: 'ai-mentor',
    },
    {
      id: 'doc_cloud_vault',
      title: 'Documentation: Cloud Vault, LocalStorage & IndexedDB Sync Guide',
      description: 'Offline state synchronization, local IndexedDB file storage, auto-saves, and backup exports',
      category: 'Documentation',
      itemType: 'docs',
      icon: <HardDrive className="w-4 h-4 text-sky-400" />,
      tab: 'user_manual',
      badge: 'Storage',
      manualSectionId: 'cloud-vault',
    },
    {
      id: 'doc_payments_vip',
      title: 'Documentation: UPI Recharge, VIP Tier Benefits & Token System',
      description: 'Token balances, UPI PhonePe/Paytm QR activation, VIP Silver/Gold/Diamond tier perks',
      category: 'Documentation',
      itemType: 'docs',
      icon: <CreditCard className="w-4 h-4 text-teal-400" />,
      tab: 'user_manual',
      badge: 'Billing',
      manualSectionId: 'payments-vip',
    },
    {
      id: 'doc_security_privacy',
      title: 'Documentation: Security, Cookie Consent & Device API Permissions',
      description: 'Managing browser permissions (Camera, Mic, Geolocation), cookie consent, and data privacy',
      category: 'Documentation',
      itemType: 'docs',
      icon: <ShieldAlert className="w-4 h-4 text-emerald-400" />,
      tab: 'user_manual',
      badge: 'Security',
      manualSectionId: 'security-privacy',
    },
    {
      id: 'doc_keyboard_shortcuts',
      title: 'Documentation: Master Keyboard Shortcuts & Hotkeys Guide',
      description: 'Quick reference for hotkeys: Ctrl+K / Cmd+K (Global Search), Esc (Close Modal), Arrow Keys & Enter',
      category: 'Documentation',
      itemType: 'docs',
      icon: <KeyRound className="w-4 h-4 text-amber-400" />,
      tab: 'user_manual',
      badge: 'Hotkeys',
      manualSectionId: 'getting-started',
    },
  ];

  // Sample Active Projects if user hasn't saved custom projects yet
  const defaultSampleProjects: ProjectItem[] = [
    {
      id: 'sample_proj_01',
      title: 'NEO-METROPOLIS 2099: Cyberpunk Screenplay',
      category: 'film',
      description: 'Rain-drenched cyberpunk thriller script with Denis Villeneuve camera blocking',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPinned: true,
      activeTool: 'film_studio',
      tags: ['Cyberpunk', 'Cinema', '4K'],
    },
    {
      id: 'sample_proj_02',
      title: 'Bollywood High-Energy Bhangra Audio Track',
      category: 'music',
      description: 'A-Z Punjabi Dholak rhythm with female lead vocal synthesis & 130 BPM drop',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPinned: true,
      activeTool: 'song_studio',
      tags: ['Bhangra', 'Audio', 'Pro'],
    },
    {
      id: 'sample_proj_03',
      title: '3D WebGL Cyber Avatar Character Rig',
      category: '3d',
      description: '17-bone inverse kinematics mesh ready for 8K video animation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPinned: false,
      activeTool: '3d_engine',
      tags: ['3D', 'WebGL', 'Rigging'],
    },
  ];

  const effectiveProjects = userProjects.length > 0 ? userProjects : defaultSampleProjects;

  // Active User Projects converted to Search Items
  const projectSearchItems: SearchResultItem[] = effectiveProjects.map((p) => ({
    id: `project_${p.id}`,
    title: p.title,
    description: p.description || `Active saved project in ${p.category.toUpperCase()} category`,
    category: `Active Project (${p.category.toUpperCase()})`,
    itemType: 'project',
    icon: <FolderKanban className="w-4 h-4 text-cyan-400" />,
    tab: 'projects_hub',
    badge: p.isPinned ? 'Pinned' : 'Active',
    isProject: true,
  }));

  // Combined Master Search List
  const allSearchableItems: SearchResultItem[] = [
    ...projectSearchItems,
    ...SEARCH_ITEMS,
    ...DOCS_ITEMS,
  ];

  // Category and Search Query Filtering
  const filteredSearchResults = useMemo(() => {
    let items = allSearchableItems;

    if (selectedFilter === 'projects') {
      items = items.filter((i) => i.itemType === 'project');
    } else if (selectedFilter === 'tools') {
      items = items.filter((i) => i.itemType === 'tool');
    } else if (selectedFilter === 'docs') {
      items = items.filter((i) => i.itemType === 'docs');
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return items;
    }

    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.badge && item.badge.toLowerCase().includes(q))
    );
  }, [allSearchableItems, selectedFilter, searchQuery]);

  // Keyboard Shortcuts Handler (Ctrl+K, Cmd+K, /, ArrowUp, ArrowDown, Enter, Tab, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInputFocused =
        targetTag === 'input' ||
        targetTag === 'textarea' ||
        (e.target as HTMLElement)?.isContentEditable;

      // Ctrl+K or Cmd+K trigger
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => {
          modalInputRef.current?.focus();
          searchInputRef.current?.focus();
        }, 50);
        return;
      }

      // '/' trigger when not in input
      if (e.key === '/' && !isInputFocused && !isSearchOpen) {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => {
          modalInputRef.current?.focus();
          searchInputRef.current?.focus();
        }, 50);
        return;
      }

      if (!isSearchOpen) return;

      // Escape key to close modal
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        return;
      }

      // Arrow navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredSearchResults.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : Math.max(0, filteredSearchResults.length - 1)
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredSearchResults[selectedIndex]) {
          handleSelectResult(filteredSearchResults[selectedIndex]);
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const filters: SearchFilterType[] = ['all', 'projects', 'tools', 'docs'];
        const currentIdx = filters.indexOf(selectedFilter);
        const nextIdx = e.shiftKey
          ? (currentIdx - 1 + filters.length) % filters.length
          : (currentIdx + 1) % filters.length;
        setSelectedFilter(filters[nextIdx]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, selectedIndex, filteredSearchResults, selectedFilter]);

  // Reset selected index on query or filter change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery, selectedFilter, isSearchOpen]);

  // Auto-scroll selected item into view in search list
  useEffect(() => {
    if (isSearchOpen && resultsContainerRef.current) {
      const activeEl = resultsContainerRef.current.querySelector(
        `[data-result-index="${selectedIndex}"]`
      );
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, isSearchOpen]);

  const handleSelectResult = (item: SearchResultItem) => {
    if (item.action) {
      item.action();
    } else {
      setActiveTab(item.tab);
      if (item.subTab && onSelectSubTab) {
        onSelectSubTab(item.tab, item.subTab);
      }
      if (item.manualSectionId) {
        try {
          sessionStorage.setItem('icallog_manual_active_section', item.manualSectionId);
        } catch {
          // ignore
        }
      }
    }
    setIsSearchOpen(false);
    setSearchQuery('');
    setMobileMenuOpen(false);
  };

  // Primary Navigation Tabs
  const tabs: { id: ActiveTab; label: string; icon: string; badge?: string }[] = [
    { id: 'role_dashboard', label: 'Dashboard', icon: getPersonaConfig(user.personaType).badgeEmoji || '✨', badge: getPersonaConfig(user.personaType).badgeLabel },
    { id: 'projects_hub', label: t('nav_projects_hub'), icon: '📁', badge: 'Hub' },
    { id: 'pro_camera', label: 'Pro Camera', icon: '📸', badge: '8K HDR' },
    { id: 'film_studio', label: t('nav_film_studio'), icon: '🎬', badge: 'Cinema' },
    { id: 'song_studio', label: t('nav_song_studio'), icon: '🎵', badge: 'A-Z' },
    { id: 'media_mixer', label: t('nav_media_mixer'), icon: '🌀', badge: 'Fusion' },
    { id: 'office_suite', label: t('nav_office_suite'), icon: '📄', badge: 'New' },
    { id: 'design_studio', label: t('nav_design_studio'), icon: '🎨', badge: 'Pro' },
    { id: 'meme_gif_studio', label: 'Meme & GIF', icon: '🤡', badge: 'Viral' },
    { id: '3d_engine', label: t('nav_3d_engine'), icon: '🎮' },
    { id: 'image_studio', label: t('nav_image_studio'), icon: '🖼️' },
    { id: 'video_audio', label: t('nav_video_audio'), icon: '🎥' },
    { id: 'voice_converter', label: t('nav_voice_converter'), icon: '🎙️' },
    { id: 'user_manual', label: t('nav_user_manual'), icon: '📖' },
  ];

  const getVipBadge = () => {
    switch (user.vipTier) {
      case 'diamond':
        return 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-white border-cyan-300';
      case 'gold':
        return 'bg-gradient-to-r from-amber-400 to-yellow-600 text-black border-amber-300';
      case 'silver':
        return 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900 border-slate-200';
      case 'bronze':
        return 'bg-gradient-to-r from-amber-700 to-orange-800 text-amber-100 border-amber-600';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <header
      id="main-header"
      className="sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-300 bg-[#0b0f19]/90 border-slate-800/80"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Left Hamburger Menu */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Hamburger Menu Toggle (- - -) Button Placed to the Left of iCALLOG Symbol */}
            <button
              id="main-hamburger-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              title="Toggle Studio Menu"
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800 hover:border-cyan-500/40 transition-all flex items-center justify-center group shadow-sm"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-cyan-400 transition-transform duration-200" />
              ) : (
                <Menu className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              )}
            </button>

            <button
              id="icallog-home-logo-btn"
              onClick={() => {
                setActiveTab('projects_hub');
                setMobileMenuOpen(false);
              }}
              title="iCallog - Open My Projects & Blank Workspace"
              className="flex items-center gap-2 group text-left focus:outline-none shrink-0"
            >
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4 text-white animate-pulse" />
                </div>
                <div className="hidden sm:block text-left">
                  <span className="font-extrabold tracking-wider text-base font-['Syne'] bg-gradient-to-r from-white via-indigo-200 to-cyan-400 bg-clip-text text-transparent leading-none">
                    ICALLOG
                  </span>
                  <p className="text-[9px] text-slate-400 tracking-tight leading-none mt-0.5">
                    Cinema, Office & WebGL Studio
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Universal Search Bar Trigger in Navbar */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-5xl lg:max-w-6xl hidden md:block mx-2 sm:mx-3">
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(true);
                setTimeout(() => modalInputRef.current?.focus(), 50);
              }}
              className="flex items-center justify-between gap-3 px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-700/70 hover:border-cyan-500/80 text-slate-300 text-xs sm:text-sm transition-all group shadow-md w-full cursor-pointer hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Search className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
                <span className="text-slate-300 text-xs sm:text-sm truncate font-medium">
                  Search active projects, AI tools, documentation...
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <kbd className="hidden lg:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-mono font-semibold text-cyan-300 shadow-xs">
                  Ctrl+K
                </kbd>
              </div>
            </button>
          </div>

          {/* Right Action Bar - Compact Buttons to Give Search Maximum Space */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Mobile Search Button */}
            <button
              onClick={() => {
                setIsSearchOpen(true);
                setTimeout(() => modalInputRef.current?.focus(), 50);
              }}
              title="Global Search (Ctrl+K)"
              className="md:hidden p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center"
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            {/* Voice Navigation Mic Button (Web Speech API) */}
            <button
              id="navbar-voice-navigation-btn"
              onClick={() => {
                if (voiceNavState?.isListening) {
                  stopVoiceRecognition();
                } else {
                  startVoiceRecognition(false);
                }
              }}
              title={
                voiceNavState?.isListening
                  ? `Voice Navigation Active: "${voiceNavState.interimTranscript || voiceNavState.transcript || 'Listening...'}" (Click to Stop)`
                  : 'Voice Navigation (Web Speech API) - Say "Open Admin Modal" or "Go to Film Studio"'
              }
              className={`relative p-1.5 rounded-lg border transition-all hover:scale-105 shadow-sm flex items-center justify-center group cursor-pointer ${
                voiceNavState?.isListening
                  ? 'bg-rose-600 text-white border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse'
                  : 'bg-indigo-950/80 hover:bg-indigo-900 border-indigo-500/50 text-indigo-300 hover:text-white'
              }`}
            >
              <Mic className={`w-3.5 h-3.5 ${voiceNavState?.isListening ? 'animate-bounce text-white' : 'group-hover:scale-110'} transition-transform`} />
              {voiceNavState?.isListening ? (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-80"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              ) : (
                <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded-full bg-cyan-500/20 text-[7px] font-mono font-bold text-cyan-300 border border-cyan-500/40 leading-none">
                  MIC
                </span>
              )}
            </button>

            {/* VIP Crown Logo Button */}
            <button
              id="premium-vip-badge-btn"
              onClick={() => openProfileModal('vip')}
              title={`VIP Membership: ${user.vipTier === 'free' ? 'Free Plan (Click to Upgrade)' : `${user.vipTier.toUpperCase()} Unlimited`}`}
              className="relative p-1.5 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-600/10 hover:from-amber-500/30 hover:to-yellow-500/20 border border-amber-500/40 text-amber-300 transition-all hover:scale-105 shadow-sm flex items-center justify-center group"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              {user.vipTier === 'free' ? (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              ) : (
                <span className="absolute -top-1 -right-1 px-0.5 py-0.2 rounded-full bg-amber-400 text-[7px] font-black text-slate-950 font-mono leading-none">
                  VIP
                </span>
              )}
            </button>

            {/* Auto-Sync Compact Logo Icon Button */}
            <button
              id="auto-sync-status-indicator"
              onClick={() => {
                window.dispatchEvent(new Event('storage'));
                const toast = document.createElement('div');
                toast.className = 'fixed bottom-5 right-5 z-[9999] px-3.5 py-2 rounded-xl bg-slate-900 border border-emerald-500 text-emerald-300 text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce';
                toast.innerHTML = '<span>⚡</span> <span>Instant Auto-Sync Triggered! All states and tools synced.</span>';
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 2500);
              }}
              className="relative p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 transition-all hover:scale-105 shadow-sm flex items-center justify-center group cursor-pointer"
              title="Auto-Sync Active (Click for Instant Sync)"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-300 animate-spin group-hover:rotate-180 transition-transform" style={{ animationDuration: '4s' }} />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
              </span>
            </button>

            {/* Quick Pro Camera Button */}
            <button
              id="navbar-quick-camera-btn"
              onClick={() => {
                setActiveTab('pro_camera');
              }}
              title="Open Pro Camera & Recording Studio (8K HDR • Video • Audio)"
              className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 hover:text-white transition-all hover:scale-105 shadow-sm flex items-center justify-center group"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-300 group-hover:rotate-12 transition-transform" />
            </button>

            {/* New Blank Project Logo Button */}
            <button
              id="new-project-logo-btn"
              onClick={() => {
                setActiveTab('projects_hub');
              }}
              title="Create Blank Project & My Projects Hub"
              className="hidden sm:flex p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white transition-all hover:scale-105 shadow-sm items-center justify-center group"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-12 transition-transform" />
            </button>

            {/* Quick Language Indicator Button */}
            <button
              id="navbar-language-selector-btn"
              onClick={() => openProfileModal('language')}
              title={`Language: ${currentLangOption.name} (${currentLangOption.nativeName}) - Click to change in Profile`}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-400 text-slate-300 hover:text-white transition-all text-[11px] font-semibold shadow-xs group"
            >
              <span className="text-xs select-none">{currentLangOption.flag}</span>
              <span className="text-[10px] font-mono text-cyan-300 font-bold uppercase">
                {currentLangOption.code}
              </span>
            </button>

            {/* Sign In / Sign Up or Guest Mode Quick Button - Compact */}
            {user.isGuestAccount || user.personaType === 'guest' || user.id === 'usr_guest_01' ? (
              <button
                onClick={() => openProfileModal('auth')}
                className="p-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 transition-all hover:scale-105 flex items-center justify-center shrink-0"
                title="You are using Guest Account. Click to Sign In"
              >
                <LogIn className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => openProfileModal('auth')}
                className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 transition-all hover:scale-105 flex items-center justify-center shrink-0"
                title="Account Settings & Authentication"
              >
                <LogIn className="w-3.5 h-3.5 text-cyan-300" />
              </button>
            )}

            {/* Export Project ZIP Button (Positioned to the left of user profile) - Compact */}
            <button
              id="navbar-export-project-btn"
              onClick={handleExportProjectZip}
              disabled={isExporting}
              title="Export Project: Download consolidated ZIP archive of active workspace assets"
              className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 font-bold text-[10px] transition-all hover:scale-105 cursor-pointer disabled:opacity-50 shrink-0 shadow-xs"
            >
              {isExporting ? (
                <RefreshCw className="w-3 h-3 animate-spin text-emerald-300" />
              ) : (
                <FolderDown className="w-3 h-3 text-emerald-300" />
              )}
              <span className="hidden xl:inline text-[10px]">Export</span>
            </button>

            {/* User Profile Badge */}
            <button
              id="user-profile-settings-btn"
              onClick={() => openProfileModal()}
              title={`Open Profile & Account Settings (${user.name || 'User'}) - ${getPersonaConfig(user.personaType).label}`}
              className="flex items-center gap-1 p-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-400/80 transition-all shadow-xs group focus:outline-none"
            >
              <div className="relative">
                <img
                  src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                  alt={user.name || 'Profile'}
                  className="w-5 h-5 rounded-full object-cover border border-cyan-400/80 group-hover:border-cyan-300 shadow-xs"
                />
                <span className="absolute -bottom-1 -right-1 text-[8px] select-none leading-none">
                  {getPersonaConfig(user.personaType).badgeEmoji}
                </span>
              </div>
            </button>

            {/* Secret Admin Override Logo */}
            <button
              id="secret-admin-trigger-btn"
              onClick={openAdminModal}
              title="Secret Admin Key Override"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-amber-400/80 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 transition-all hover:scale-105 flex items-center justify-center"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Secondary Sub-Navbar Bar: Desktop Navigation Tabs */}
        <div className="hidden lg:flex items-center justify-between py-2 border-t border-slate-800/80 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden gap-1">
          <nav className="flex items-center gap-1 shrink-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-btn-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 shrink-0 whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-cyan-300'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400 shrink-0">
            <button
              onClick={openHistoryModal}
              className="hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              <span>Vault</span>
            </button>
          </div>
        </div>

        {/* Navigation Menu Drawer / Dropdown */}
        {mobileMenuOpen && (
          <div className="py-3 px-3 border-t border-slate-800/80 space-y-2.5 bg-[#0d121f]/95 backdrop-blur-2xl rounded-2xl my-2 shadow-2xl border border-slate-700/60 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Create Project & Blank Project Action Card */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-cyan-950/80 border border-indigo-500/40 shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-['Syne']">
                        Create Project & Blank Canvas
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ALL FREE TOOLS
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Launch a fresh blank project with access to all free features, or manage unlimited projects with save, pin, share & modify.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    onClick={() => {
                      setActiveTab('projects_hub');
                      setMobileMenuOpen(false);
                    }}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-500/25 flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Blank Project</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('projects_hub');
                      setMobileMenuOpen(false);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-slate-700/80"
                  >
                    <FolderKanban className="w-3.5 h-3.5 text-cyan-400" />
                    <span>My Projects</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Search in Drawer on smaller screens */}
            <div className="p-1 md:hidden space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <Search className="w-4 h-4 text-cyan-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(sanitizeInput(e.target.value))}
                  placeholder="Search all tools and projects..."
                  className="w-full bg-transparent text-white focus:outline-none text-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Live search results inside mobile drawer */}
              {searchQuery.trim() && (
                <div className="max-h-56 overflow-y-auto space-y-1 p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] font-mono text-cyan-400 px-2 py-1 flex justify-between items-center">
                    <span>MATCHING RESULTS ({filteredSearchResults.length})</span>
                    <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">Clear</button>
                  </div>
                  {filteredSearchResults.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 space-y-2">
                      <p>No tools or projects found.</p>
                      <button
                        onClick={() => {
                          setActiveTab('projects_hub');
                          setMobileMenuOpen(false);
                          setSearchQuery('');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold"
                      >
                        + Create Blank Project
                      </button>
                    </div>
                  ) : (
                    filteredSearchResults.map((item: SearchResultItem) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          handleSelectResult(item);
                          setMobileMenuOpen(false);
                        }}
                        className="w-full p-2 rounded-lg text-left hover:bg-slate-800 flex items-center justify-between text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="p-1 rounded bg-slate-900 shrink-0">{item.icon}</span>
                          <div className="truncate">
                            <div className="text-white font-semibold truncate flex items-center gap-1.5">
                              <span>{item.title}</span>
                              {item.badge && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">{item.description}</div>
                          </div>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono shrink-0 ml-2">
                          {item.category}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold shadow-md shadow-indigo-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-cyan-300 font-mono">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
              <div
                onClick={() => {
                  openProfileModal();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                      alt={user.name || 'Profile'}
                      className="w-10 h-10 rounded-full object-cover border-2 border-cyan-400"
                    />
                    <span className="absolute -bottom-1 -right-1 text-xs select-none leading-none">
                      {getPersonaConfig(user.personaType).badgeEmoji}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{user.name || 'User Profile'}</span>
                      <PersonaBadge type={user.personaType || 'general'} size="sm" />
                    </div>
                    <div className="text-[11px] text-cyan-400 font-mono mt-0.5">
                      {getPersonaConfig(user.personaType).hindiLabel} • Switch Role →
                    </div>
                  </div>
                </div>
                <span className="text-xs text-slate-400">Edit</span>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                <button
                  onClick={() => {
                    openProfileModal();
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold text-center flex items-center justify-center gap-2 shadow-md"
                >
                  <CreditCard className="w-4 h-4" /> My Profile, VIP & Settings
                </button>
                <button
                  onClick={() => {
                    openAdminModal();
                    setMobileMenuOpen(false);
                  }}
                  className="py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Global Command Palette Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-start justify-center pt-6 sm:pt-12 px-3 sm:px-6">
          <div
            ref={searchContainerRef}
            className="max-w-3xl w-full bg-[#0b0f19] border border-slate-700/90 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col max-h-[85vh] transition-all"
          >
            {/* Search Input Header */}
            <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/60">
              <Search className="w-5 h-5 text-cyan-400 shrink-0" />
              <input
                ref={modalInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(sanitizeInput(e.target.value))}
                placeholder="Search active projects, AI tools, documentation, guides... (Ctrl+K)"
                className="w-full bg-transparent text-white focus:outline-none placeholder:text-slate-500 text-sm sm:text-base font-medium"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  selectedFilter === 'all'
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>All Results</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
                  {allSearchableItems.length}
                </span>
              </button>

              <button
                onClick={() => setSelectedFilter('projects')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  selectedFilter === 'projects'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span>Active Projects</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
                  {projectSearchItems.length}
                </span>
              </button>

              <button
                onClick={() => setSelectedFilter('tools')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  selectedFilter === 'tools'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Tools</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
                  {SEARCH_ITEMS.length}
                </span>
              </button>

              <button
                onClick={() => setSelectedFilter('docs')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  selectedFilter === 'docs'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Docs & Guides</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
                  {DOCS_ITEMS.length}
                </span>
              </button>
            </div>

            {/* Results List Container */}
            <div
              ref={resultsContainerRef}
              className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-[260px]"
            >
              {filteredSearchResults.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <p className="text-xs sm:text-sm text-slate-400">
                    No results found for "<span className="text-cyan-300 font-semibold">{searchQuery}</span>" in {selectedFilter.toUpperCase()}
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab('projects_hub');
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white text-xs font-bold shadow-lg hover:brightness-110 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Create New Blank Project with this Title
                  </button>
                </div>
              ) : (
                filteredSearchResults.map((item: SearchResultItem, idx: number) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      data-result-index={idx}
                      onClick={() => handleSelectResult(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full p-3 rounded-2xl text-left flex items-center justify-between gap-3 transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-indigo-950/90 via-slate-900 to-cyan-950/80 border-cyan-400/80 shadow-lg shadow-cyan-500/10'
                          : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`p-2.5 rounded-xl border shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                            <span className="truncate">{item.title}</span>
                            <span className="text-[9px] px-2 py-0.5 rounded-md bg-slate-800/90 text-cyan-400 font-mono border border-slate-700/60">
                              {item.category}
                            </span>
                            {item.badge && (
                              <span className="text-[9px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 truncate max-w-lg mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isSelected && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                            <span>↵ Enter</span>
                          </span>
                        )}
                        <ArrowRight
                          className={`w-4 h-4 transition-all ${
                            isSelected ? 'text-cyan-400 translate-x-1' : 'text-slate-600'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Keyboard Shortcuts Footer Bar */}
            <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">↑↓</kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">↵</kbd>
                  <span>Select</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Tab</kbd>
                  <span>Filter</span>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">ESC</kbd>
                <span>Dismiss</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

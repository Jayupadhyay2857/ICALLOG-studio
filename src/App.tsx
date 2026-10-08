import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Crown,
  HardDrive,
  CreditCard,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { UserProfile, ActiveTab } from './types.ts';
import { fetchUserProfile, initSSEConnection } from './lib/api.ts';
import { Navbar } from './components/Navbar.tsx';
import { ThreeCanvas } from './components/ThreeCanvas.tsx';
import { ImageStudio } from './components/ImageStudio.tsx';
import { VideoAudioSuite } from './components/VideoAudioSuite.tsx';
import { ChatMentor } from './components/ChatMentor.tsx';
import { AdminModal } from './components/AdminModal.tsx';
import { HistoryStorageModal } from './components/HistoryStorageModal.tsx';
import { UserManual } from './components/UserManual.tsx';
import { FilmStudio } from './components/FilmStudio.tsx';
import { VoiceConverter } from './components/VoiceConverter.tsx';
import { OfficeSuite } from './components/OfficeSuite.tsx';
import { DesignIdentitySuite } from './components/DesignIdentitySuite.tsx';
import { MemeGifStudio } from './components/MemeGifStudio.tsx';
import { ProfileSettingsModal, ProfileTab } from './components/ProfileSettingsModal.tsx';
import { MediaMixerStudio } from './components/MediaMixerStudio.tsx';
import { SongMusicStudio } from './components/SongMusicStudio.tsx';
import { ProjectsHub } from './components/ProjectsHub.tsx';
import { WelcomeBlog } from './components/WelcomeBlog.tsx';
import { RoleWorkspaceDashboard } from './components/RoleWorkspaceDashboard.tsx';
import { CameraStudio } from './components/CameraStudio.tsx';
import { GuestSessionBanner } from './components/GuestSessionBanner.tsx';
import { GuestTutorialModal } from './components/GuestTutorialModal.tsx';
import { CookieConsentModal } from './components/CookieConsentModal.tsx';
import { AutoSaveWarningNotification } from './components/AutoSaveWarningNotification.tsx';
import { OfflineStatusBanner } from './components/OfflineStatusBanner.tsx';
import { VoiceNavigationOverlay } from './components/VoiceNavigationOverlay.tsx';
import { VoiceNavigationHistorySidebar } from './components/VoiceNavigationHistorySidebar.tsx';
import { OmniEnhanceModal } from './components/OmniEnhanceModal.tsx';
import { GlobalSearchModal } from './components/GlobalSearchModal.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import { syncUserState, initOfflineSyncListeners } from './lib/offlineSync.ts';
import { AutoDubbingStudio } from './components/AutoDubbingStudio.tsx';
import { CreatorMarketplaceStudio } from './components/CreatorMarketplaceStudio.tsx';
import { SocialPublisherStudio } from './components/SocialPublisherStudio.tsx';
import { MangaStoryboardStudio } from './components/MangaStoryboardStudio.tsx';
import { LiveCollabCanvasStudio } from './components/LiveCollabCanvasStudio.tsx';
import { GameStudio } from './components/GameStudio.tsx';
import { TimeCapsuleStudio } from './components/TimeCapsuleStudio.tsx';
import { DigitalTwinStudio } from './components/DigitalTwinStudio.tsx';
import { NeuralCinemaStudio } from './components/NeuralCinemaStudio.tsx';
import { MetaverseWorldStudio } from './components/MetaverseWorldStudio.tsx';
import { MasterToolkitStudio } from './components/MasterToolkitStudio.tsx';
import { CollabWhiteboardTimelineStudio } from './components/CollabWhiteboardTimelineStudio.tsx';
import { PodcastStudio } from './components/PodcastStudio.tsx';
import { QuantumDirectorStudio } from './components/QuantumDirectorStudio.tsx';
import { ExoplanetStudio } from './components/ExoplanetStudio.tsx';
import { HoloSculptStudio } from './components/HoloSculptStudio.tsx';
import { VoiceCloneStudio } from './components/VoiceCloneStudio.tsx';
import { getUserStateFromIDB } from './lib/offlineIndexedDB.ts';
import { registerVoiceHandlers } from './lib/voiceNavigation.ts';
import { executeAutoSave, extendSessionToken } from './lib/sessionManager.ts';
import { autoInitializeAppAccess } from './lib/permissionsManager.ts';

interface Toast {
  id: string;
  title: string;
  desc: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'admin';
}

export default function App() {
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('icallog_user_profile_v1') : null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      id: 'usr_guest_01',
      username: 'Creative User',
      name: 'Profile User',
      email: 'creator@icallog.studio',
      tokenBalance: 50,
      vipTier: 'free',
      vipExpiry: null,
      role: 'user',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      createdAt: new Date().toISOString(),
    };
  });

  const handleUpdateUser = (updated: UserProfile) => {
    setUser(updated);
    syncUserState(updated).catch(console.warn);
  };

  const [activeTab, setActiveTab] = useState<ActiveTab>('welcome_blog');
  const [officeSubTab, setOfficeSubTab] = useState<'docs' | 'ppt' | 'excel'>('docs');
  const [designSubTab, setDesignSubTab] = useState<'favicon' | 'badges' | 'business_cards' | 'resume'>('favicon');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const handleSelectSubTab = (tab: ActiveTab, subTab: string) => {
    setActiveTab(tab);
    if (tab === 'office_suite') {
      setOfficeSubTab(subTab as 'docs' | 'ppt' | 'excel');
    } else if (tab === 'design_studio') {
      setDesignSubTab(subTab as 'favicon' | 'badges' | 'business_cards' | 'resume');
    }
  };

  // Modals state
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isGuestTutorialOpen, setIsGuestTutorialOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<ProfileTab | undefined>(undefined);
  const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isOmniEnhanceOpen, setIsOmniEnhanceOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isVoiceHistoryOpen, setIsVoiceHistoryOpen] = useState(false);

  // Global Keyboard Shortcuts (Ctrl+K / Cmd+K / Slash key) & Event Listener for Spotlight Search & Voice History (Alt+V / Ctrl+Shift+V)
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;

      // Alt+V or Ctrl+Shift+V or Cmd+Shift+V: Toggle Voice Navigation History Sidebar
      if (
        (e.altKey && (e.key.toLowerCase() === 'v' || e.code === 'KeyV')) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key.toLowerCase() === 'v' || e.code === 'KeyV'))
      ) {
        e.preventDefault();
        setIsVoiceHistoryOpen((prev) => !prev);
        return;
      }

      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
        return;
      }

      // '/' slash trigger when outside any text input
      if (e.key === '/' && !isInput && !isGlobalSearchOpen) {
        e.preventDefault();
        setIsGlobalSearchOpen(true);
        return;
      }
    };

    const handleOpenSearchCustomEvent = () => {
      setIsGlobalSearchOpen(true);
    };

    const handleOpenVoiceHistoryCustomEvent = () => {
      setIsVoiceHistoryOpen(true);
    };

    window.addEventListener('keydown', handleGlobalKeys);
    window.addEventListener('app:open-global-search', handleOpenSearchCustomEvent);
    window.addEventListener('app:open-voice-history', handleOpenVoiceHistoryCustomEvent);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeys);
      window.removeEventListener('app:open-global-search', handleOpenSearchCustomEvent);
      window.removeEventListener('app:open-voice-history', handleOpenVoiceHistoryCustomEvent);
    };
  }, [isGlobalSearchOpen, isVoiceHistoryOpen]);

  const handleOpenProfileModal = (tab?: ProfileTab) => {
    setProfileInitialTab(tab);
    setIsProfileModalOpen(true);
  };

  const handleNavigateFromOmni = (tab: ActiveTab, prefillPrompt?: string) => {
    setActiveTab(tab);
    if (prefillPrompt) {
      localStorage.setItem('icallog_prefill_prompt', prefillPrompt);
      window.dispatchEvent(new CustomEvent('icallog_apply_prompt', { detail: { prompt: prefillPrompt, tab } }));
    }
  };

  // Toast Notification Dispatcher
  const notify = (
    title: string,
    desc: string,
    type: 'info' | 'success' | 'warning' | 'error' | 'admin' = 'info'
  ) => {
    const newToast: Toast = {
      id: `toast-${Date.now()}-${Math.random()}`,
      title,
      desc,
      type,
    };
    setToasts((prev) => [...prev.slice(-4), newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4500);
  };

  // 1. Initial User Fetch
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await fetchUserProfile();
        // Merge with local changes if user customized avatar/name
        const saved = localStorage.getItem('icallog_user_profile_v1');
        let localUser: Partial<UserProfile> | null = null;
        if (saved) {
          try {
            localUser = JSON.parse(saved);
          } catch {
            // ignore
          }
        }
        const merged: UserProfile = {
          ...user,
          ...profile,
          ...(localUser || {}),
        };
        setUser(merged);
        syncUserState(merged).catch(console.warn);
      } catch {
        // Fallback to IndexedDB offline user state if network fetch fails
        try {
          const idbUser = await getUserStateFromIDB();
          if (idbUser) {
            setUser(idbUser);
          }
        } catch {
          // Default initialized state is safe
        }
      }
    };
    loadProfile();

    // Auto-initialize permissions & device readiness on startup (Auto-Start Access ON by default)
    autoInitializeAppAccess().catch((err) => {
      console.warn('Auto-initialize access permissions caught:', err);
    });

    const cleanupOffline = initOfflineSyncListeners((isOnline, wasOffline) => {
      if (wasOffline) {
        notify('Network Restored', 'IndexedDB offline state synchronized with session.', 'success');
      } else if (!isOnline) {
        notify('Offline Mode Active', 'Operating offline with IndexedDB & Service Worker cache.', 'warning');
      }
    });

    return () => {
      cleanupOffline();
    };
  }, []);

  // Web Speech Voice Navigation Engine Handlers
  useEffect(() => {
    const unregisterVoice = registerVoiceHandlers({
      onNavigateTab: (tab: ActiveTab, subTab?: string) => {
        handleSelectSubTab(tab, subTab || 'docs');
      },
      onOpenAdminModal: () => {
        setIsAdminModalOpen(true);
      },
      onCloseAdminModal: () => {
        setIsAdminModalOpen(false);
      },
      onOpenProfileModal: (tab?: ProfileTab) => {
        handleOpenProfileModal(tab);
      },
      onOpenHistoryModal: () => {
        setIsHistoryModalOpen(true);
      },
      onOpenCookieModal: () => {
        setIsCookieModalOpen(true);
      },
      onOpenVoiceHistory: () => {
        setIsVoiceHistoryOpen(true);
      },
      onCloseVoiceHistory: () => {
        setIsVoiceHistoryOpen(false);
      },
      onCloseAllModals: () => {
        setIsAdminModalOpen(false);
        setIsHistoryModalOpen(false);
        setIsProfileModalOpen(false);
        setIsCookieModalOpen(false);
        setIsVoiceHistoryOpen(false);
      },
      onToggleDarkMode: () => {
        setIsDarkMode((prev) => !prev);
      },
      onSaveWork: () => {
        executeAutoSave('manual_voice_autosave');
      },
      onExtendSession: () => {
        extendSessionToken(15);
      },
      onNotify: notify,
    });

    return () => {
      unregisterVoice();
    };
  }, [user, activeTab]);

  // 2. Real-Time Auto-Sync Engine (Server-Sent Events & Local Storage Auto-Sync)
  useEffect(() => {
    // Background Periodic State Auto-Sync
    const autoSyncInterval = setInterval(() => {
      try {
        const saved = localStorage.getItem('icallog_user_profile_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (JSON.stringify(parsed) !== JSON.stringify(user)) {
            localStorage.setItem('icallog_user_profile_v1', JSON.stringify(user));
          }
        }
      } catch {
        // Safe fallback
      }
    }, 5000);

    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('icallog_user_profile_v1');
        if (saved) {
          setUser(JSON.parse(saved));
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', handleStorageChange);

    const unsubscribe = initSSEConnection((event) => {
      if (event.type === 'TOKEN_UPDATE' || event.type === 'PAYMENT_CONFIRMED') {
        const payload = event.data as { newBalance?: number; tokensAdded?: number };
        if (payload.newBalance !== undefined) {
          setUser((prev) => ({ ...prev, tokenBalance: payload.newBalance! }));
        }
        notify(
          'Balance Synced via SSE',
          `Live token balance updated to ${payload.newBalance?.toLocaleString() ?? 'active state'}.`,
          'success'
        );
      } else if (event.type === 'TASK_UPDATE') {
        const task = event.data as { type: string; status: string; title: string };
        if (task.status === 'completed') {
          notify('Queue Job Completed', `${task.title} has completed in background!`, 'success');
        }
      }
    });

    return () => {
      clearInterval(autoSyncInterval);
      window.removeEventListener('storage', handleStorageChange);
      unsubscribe();
    };
  }, [user]);

  return (
    <LanguageProvider
      initialLanguage={user.language}
      onLanguageChange={(lang) => handleUpdateUser({ ...user, language: lang })}
    >
      <div className={`min-h-screen ${isDarkMode ? 'bg-[#060911] text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans transition-colors duration-300`}>
        {/* Dynamic Background Mesh Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      {/* Guest Session Auto-Expiry Warning & Management Banner */}
      <GuestSessionBanner
        user={user}
        onNotify={notify}
        onOpenProfileModal={handleOpenProfileModal}
        onOpenTutorial={() => setIsGuestTutorialOpen(true)}
      />

      {/* Main Navigation Bar */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        openAdminModal={() => setIsAdminModalOpen(true)}
        openHistoryModal={() => setIsHistoryModalOpen(true)}
        openProfileModal={(tab) => handleOpenProfileModal(tab)}
        openCookieModal={() => handleOpenProfileModal('cookies')}
        openOmniEnhanceModal={() => setIsOmniEnhanceOpen(true)}
        openGlobalSearch={() => setIsGlobalSearchOpen(true)}
        openVoiceHistory={() => setIsVoiceHistoryOpen(true)}
        onSelectSubTab={handleSelectSubTab}
      />

      {/* Main Dynamic Viewport Workspace */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 flex-1">
        {activeTab === 'role_dashboard' && (
          <RoleWorkspaceDashboard
            user={user}
            setActiveTab={setActiveTab}
            onSelectSubTab={handleSelectSubTab}
            onUpdateUser={handleUpdateUser}
            onNotify={notify}
            onOpenTutorial={() => setIsGuestTutorialOpen(true)}
            onOpenProfileModal={handleOpenProfileModal}
          />
        )}
        {activeTab === 'welcome_blog' && (
          <WelcomeBlog
            onSelectTab={setActiveTab}
            user={user}
            onOpenVipModal={() => setIsProfileModalOpen(true)}
            onOpenProfileModal={handleOpenProfileModal}
          />
        )}
        {activeTab === 'projects_hub' && (
          <ProjectsHub
            user={user}
            setActiveTab={setActiveTab}
            onSelectSubTab={handleSelectSubTab}
            onNotify={notify}
            onUpdateUser={handleUpdateUser}
            onOpenTutorial={() => setIsGuestTutorialOpen(true)}
            onOpenProfileModal={handleOpenProfileModal}
          />
        )}
        {activeTab === 'pro_camera' && (
          <CameraStudio
            user={user}
            setActiveTab={setActiveTab}
            onNotify={notify}
            onUpdateUser={handleUpdateUser}
          />
        )}
        {activeTab === 'game_studio' && (
          <GameStudio
            user={user}
            tokenBalance={user.tokenBalance}
            setActiveTab={(tab) => setActiveTab(tab as ActiveTab)}
            openPaymentModal={() => setIsProfileModalOpen(true)}
            onNotify={notify}
          />
        )}
        {activeTab === 'time_capsule' && (
          <TimeCapsuleStudio
            user={user}
            setActiveTab={(tab) => setActiveTab(tab as ActiveTab)}
            onNotify={notify}
          />
        )}
        {activeTab === 'digital_twin' && (
          <DigitalTwinStudio
            user={user}
            setActiveTab={(tab) => setActiveTab(tab as ActiveTab)}
            onNotify={notify}
          />
        )}
        {activeTab === 'neural_cinema' && (
          <NeuralCinemaStudio
            user={user}
            setActiveTab={(tab) => setActiveTab(tab as ActiveTab)}
            onNotify={notify}
          />
        )}
        {activeTab === 'metaverse_world' && (
          <MetaverseWorldStudio
            user={user}
            setActiveTab={(tab) => setActiveTab(tab as ActiveTab)}
            onNotify={notify}
          />
        )}
        {activeTab === 'master_toolkit' && (
          <MasterToolkitStudio
            user={user}
            setActiveTab={(tab) => setActiveTab(tab as ActiveTab)}
            onNotify={notify}
          />
        )}
        {activeTab === 'quantum_director' && (
          <QuantumDirectorStudio
            user={user}
            setActiveTab={(tab) => setActiveTab(tab as ActiveTab)}
            onNotify={notify}
          />
        )}
        {activeTab === 'exoplanet_world' && (
          <ExoplanetStudio
            user={user}
            setActiveTab={(tab) => setActiveTab(tab as ActiveTab)}
            onNotify={notify}
          />
        )}
        {activeTab === 'holo_sculpt_3d' && (
          <HoloSculptStudio
            user={user}
            setActiveTab={(tab) => setActiveTab(tab as ActiveTab)}
            onNotify={notify}
          />
        )}
        {activeTab === 'voice_clone' && (
          <VoiceCloneStudio
            user={user}
            setActiveTab={(tab) => setActiveTab(tab as ActiveTab)}
            onNotify={notify}
          />
        )}
        {activeTab === 'collab_timeline' && (
          <CollabWhiteboardTimelineStudio
            user={user}
            setActiveTab={(tab) => setActiveTab(tab as ActiveTab)}
            onNotify={notify}
          />
        )}
        {activeTab === 'podcast_studio' && (
          <PodcastStudio
            user={user}
            setActiveTab={(tab) => setActiveTab(tab as ActiveTab)}
            onNotify={notify}
          />
        )}
        {activeTab === 'song_studio' && (
          <SongMusicStudio
            user={user}
            tokenBalance={user.tokenBalance}
            setActiveTab={(tab) => setActiveTab(tab as ActiveTab)}
            openPaymentModal={() => setIsProfileModalOpen(true)}
            onNotify={notify}
          />
        )}
        {activeTab === 'media_mixer' && (
          <MediaMixerStudio
            user={user}
            tokenBalance={user.tokenBalance}
            setActiveTab={(tab) => setActiveTab(tab as ActiveTab)}
            onNotify={notify}
            onSendToFilmStudio={(script, videoUrl) => {
              setActiveTab('film_studio');
            }}
          />
        )}
        {activeTab === 'film_studio' && (
          <FilmStudio
            user={user}
            tokenBalance={user.tokenBalance}
            setActiveTab={(tab) => setActiveTab(tab as ActiveTab)}
            openPaymentModal={() => setIsProfileModalOpen(true)}
            onNotify={notify}
          />
        )}
        {activeTab === 'office_suite' && (
          <OfficeSuite
            user={user}
            initialSubTab={officeSubTab}
            onNotify={notify}
          />
        )}
        {activeTab === 'design_studio' && (
          <DesignIdentitySuite
            user={user}
            initialSubTab={designSubTab}
            onNotify={notify}
          />
        )}
        {activeTab === 'meme_gif_studio' && (
          <MemeGifStudio
            user={user}
            setActiveTab={(tab) => setActiveTab(tab as ActiveTab)}
            onNotify={notify}
          />
        )}
        {activeTab === 'voice_converter' && (
          <VoiceConverter
            tokenBalance={user.tokenBalance}
            onNotify={notify}
          />
        )}
        {activeTab === 'auto_dubbing' && (
          <AutoDubbingStudio
            user={user}
            onNotify={notify}
          />
        )}
        {activeTab === 'creator_marketplace' && (
          <CreatorMarketplaceStudio
            user={user}
            onNotify={notify}
            onOpenGlobalPayments={() => setIsProfileModalOpen(true)}
          />
        )}
        {activeTab === 'social_publisher' && (
          <SocialPublisherStudio
            user={user}
            onNotify={notify}
          />
        )}
        {activeTab === 'manga_storyboard' && (
          <MangaStoryboardStudio
            user={user}
            onNotify={notify}
          />
        )}
        {activeTab === 'live_collab' && (
          <LiveCollabCanvasStudio
            user={user}
            onNotify={notify}
          />
        )}
        {activeTab === '3d_engine' && (
          <ThreeCanvas
            user={user}
            openPaymentModal={() => setIsProfileModalOpen(true)}
            onNotify={notify}
          />
        )}
        {activeTab === 'image_studio' && (
          <ImageStudio
            user={user}
            tokenBalance={user.tokenBalance}
            openPaymentModal={() => setIsProfileModalOpen(true)}
            onNotify={notify}
          />
        )}
        {activeTab === 'video_audio' && (
          <VideoAudioSuite
            user={user}
            tokenBalance={user.tokenBalance}
            openPaymentModal={() => setIsProfileModalOpen(true)}
            onNotify={notify}
          />
        )}
        {activeTab === 'chat_mentor' && <ChatMentor onNotify={notify} />}
        {activeTab === 'user_manual' && (
          <UserManual
            setActiveTab={setActiveTab}
            openPaymentModal={() => setIsProfileModalOpen(true)}
            openAdminModal={() => setIsAdminModalOpen(true)}
            openHistoryModal={() => setIsHistoryModalOpen(true)}
            onNotify={notify}
          />
        )}
        {activeTab === 'cloud_storage' && (
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
            <HardDrive className="w-12 h-12 text-cyan-400 mx-auto animate-pulse" />
            <h3 className="text-base font-bold text-white font-['Syne']">
              Cloud Vault & High-Performance Object Storage
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Inspect your synchronized AWS S3 and Cloudinary asset representations, download high-res files, and manage your storage bucket.
            </p>
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/30"
            >
              Open Cloud Vault Modal
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-[#070b12] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-2 font-mono">
            <span className="font-bold text-slate-300">ICALLOG</span>
            <span>•</span>
            <span>Three.js WebGL Engine</span>
            <span>•</span>
            <span>Node.js / Express</span>
            <span>•</span>
            <span>PostgreSQL & Mongo Models</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-emerald-400 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              AES-256-GCM Secure
            </span>
            <button
              onClick={() => handleOpenProfileModal('cookies')}
              className="text-slate-400 hover:text-cyan-400 transition-colors font-mono"
            >
              Privacy & Permissions
            </button>
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="text-slate-400 hover:text-amber-400 transition-colors font-mono"
            >
              Admin Override
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CookieConsentModal
        isOpen={isCookieModalOpen}
        onClose={() => setIsCookieModalOpen(false)}
        onSavePermissions={() => {
          notify('Permissions Saved', 'Your privacy and device permissions preferences have been updated.', 'success');
        }}
      />

      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onOverrideSuccess={(updated) => handleUpdateUser(updated)}
        onNotify={notify}
      />

      <HistoryStorageModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onNotify={notify}
      />

      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setProfileInitialTab(undefined);
        }}
        initialTab={profileInitialTab}
        user={user}
        onUpdateUser={handleUpdateUser}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onNotify={notify}
        onOpenCookieModal={() => handleOpenProfileModal('cookies')}
        onOpenProCamera={() => {
          setIsProfileModalOpen(false);
          setActiveTab('pro_camera');
        }}
      />

      {/* Guest & First-Time Visitor Interactive Tutorial Modal */}
      <GuestTutorialModal
        isOpen={isGuestTutorialOpen}
        onClose={() => setIsGuestTutorialOpen(false)}
        onOpenAuth={() => handleOpenProfileModal('auth')}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsGuestTutorialOpen(false);
        }}
        onSelectPersona={(persona) => {
          handleUpdateUser({ ...user, personaType: persona });
        }}
        user={user}
      />

      {/* Auto-Save Pre-Expiry Warning Notification (triggers 2 mins before session token expiration) */}
      <AutoSaveWarningNotification
        onNotify={notify}
        onOpenProfileModal={handleOpenProfileModal}
      />

      {/* Offline Status & IndexedDB Cache Banner */}
      <OfflineStatusBanner
        onNotify={notify}
        onOpenProfileModal={handleOpenProfileModal}
      />

      {/* Quick Global Camera & Recording Studio Modal */}
      {isCameraModalOpen && (
        <CameraStudio
          isModal={true}
          user={user}
          setActiveTab={setActiveTab}
          onNotify={notify}
          onUpdateUser={handleUpdateUser}
          onCloseModal={() => setIsCameraModalOpen(false)}
        />
      )}

      {/* Web Speech API Voice Navigation Overlay & Command Hub */}
      <VoiceNavigationOverlay
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        onNavigateTab={(tab) => handleSelectSubTab(tab, 'docs')}
        onOpenVoiceHistory={() => setIsVoiceHistoryOpen(true)}
      />

      {/* Voice Navigation History & Command Re-execution Slide-over Sidebar (Alt+V / Ctrl+Shift+V) */}
      <VoiceNavigationHistorySidebar
        isOpen={isVoiceHistoryOpen}
        onClose={() => setIsVoiceHistoryOpen(false)}
        onNavigateTab={(tab, subTab) => handleSelectSubTab(tab, subTab || 'docs')}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        onOpenProfileModal={handleOpenProfileModal}
        onNotify={notify}
      />

      {/* Omni Enhance AI Universal Multi-Modal Prompt Booster Modal */}
      <OmniEnhanceModal
        isOpen={isOmniEnhanceOpen}
        onClose={() => setIsOmniEnhanceOpen(false)}
        user={user}
        onNavigateToStudio={handleNavigateFromOmni}
        onNotify={notify}
      />

      {/* Global Spotlight Search & Studio Navigator Modal (Ctrl+K / Cmd+K / Slash) */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSelectSubTab={handleSelectSubTab}
        openAdminModal={() => setIsAdminModalOpen(true)}
        openHistoryModal={() => setIsHistoryModalOpen(true)}
        openProfileModal={handleOpenProfileModal}
        openOmniEnhanceModal={() => setIsOmniEnhanceOpen(true)}
        openVoiceHistory={() => setIsVoiceHistoryOpen(true)}
        user={user}
      />

      {/* Floating Toast Notification Stack */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-3.5 rounded-2xl backdrop-blur-xl border shadow-2xl flex items-start gap-3 transition-all transform translate-y-0 ${
              t.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100 shadow-emerald-900/30'
                : t.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-100 shadow-rose-900/30'
                : t.type === 'admin'
                ? 'bg-amber-950/90 border-amber-500/50 text-amber-100 shadow-amber-900/30'
                : 'bg-slate-900/90 border-slate-700 text-slate-200'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />}
            {t.type === 'admin' && <Crown className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />}

            <div className="text-xs space-y-0.5">
              <div className="font-bold font-['Syne']">{t.title}</div>
              <div className="text-[11px] opacity-90 leading-tight">{t.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </LanguageProvider>
  );
}

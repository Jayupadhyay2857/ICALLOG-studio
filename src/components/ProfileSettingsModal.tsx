import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Lock,
  Mail,
  Shield,
  Palette,
  MessageSquare,
  LogOut,
  LogIn,
  UserPlus,
  Check,
  Sparkles,
  Key,
  Globe,
  Bell,
  Eye,
  EyeOff,
  Crown,
  CreditCard,
  Camera,
  Upload,
  Image as ImageIcon,
  RefreshCw,
  Trash2,
  Video,
  X,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  FlipHorizontal,
  ChevronDown,
  Search,
  Languages,
  Phone,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Copy,
  Printer,
  Wallet,
  FileText,
  CheckCircle,
  MapPin,
  Building,
  ArrowRight,
  ExternalLink,
  Cookie,
  HardDrive,
  Mic,
  Cpu,
  BarChart3,
  Sliders,
  ShieldCheck,
  Volume2,
  VolumeX,
  Radio,
  Activity,
  SlidersHorizontal,
  Clock,
} from 'lucide-react';
import { UserProfile, TransactionRecord, PersonaType } from '../types.ts';
import { updateUserProfile, fetchUserTransactions, TransactionsSummary } from '../lib/api.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { SUPPORTED_LANGUAGES, LanguageOption } from '../lib/i18n.ts';
import { PersonaBadge, getPersonaConfig } from './PersonaBadge.tsx';
import { PersonaProfileManager } from './PersonaProfileManager.tsx';
import { getPlansForPersona, PersonaPlan, PERSONA_PLANS } from '../lib/personaPlans.ts';
import { isUserExplicitFree } from '../lib/explicitEngine.ts';
import { Layers, Flame, Zap, Wifi, WifiOff, Database } from 'lucide-react';
import {
  getStoredSession,
  extendSessionToken,
  simulateSessionExpiryInSeconds,
  executeAutoSave,
  SessionData,
} from '../lib/sessionManager.ts';
import {
  getOfflineStorageDiagnostics,
  clearAllOfflineData,
  saveUserStateToIDB,
  saveProjectsToIDB,
  OfflineDiagnostics,
} from '../lib/offlineIndexedDB.ts';
import {
  getEffectiveOnlineStatus,
  setSimulatedOffline,
  processPendingOfflineSync,
  forceHardRefreshIndexedDB,
} from '../lib/offlineSync.ts';
import {
  getStoredVoicePreferences,
  saveVoicePreferences,
  resetVoicePreferences,
  calculateEffectiveConfidenceCutoff,
  createMicAudioMeter,
  speakFeedback,
  VOICE_LANGUAGES,
  VoicePreferences,
} from '../lib/voiceNavigation.ts';
import { playCameraSound, saveVaultItem } from '../lib/cameraVault.ts';
import { CameraLutFilter } from '../types.ts';

const PRESET_AVATARS = [
  { label: 'Creative', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80' },
  { label: 'Director', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80' },
  { label: 'Musician', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80' },
  { label: 'Designer', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80' },
  { label: '3D Artist', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=240&q=80' },
  { label: 'Cyber Tech', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=240&q=80' },
];

const COUNTRY_CODES = [
  { code: '+91', country: 'India (भारत)', flag: '🇮🇳' },
  { code: '+1', country: 'United States / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+977', country: 'Nepal', flag: '🇳🇵' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
];

export type ProfileTab = 'profile' | 'personas' | 'transactions' | 'language' | 'vip' | 'auth' | 'security' | 'theme' | 'privacy' | 'cookies' | 'voice' | 'feedback';

interface ProfileSettingsModalProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isOpen: boolean;
  onClose: () => void;
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  onOpenCookieModal?: () => void;
  onOpenProCamera?: () => void;
  initialTab?: ProfileTab;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  user,
  onUpdateUser,
  isDarkMode,
  toggleDarkMode,
  isOpen,
  onClose,
  onNotify,
  onOpenCookieModal,
  onOpenProCamera,
  initialTab,
}) => {
  const { currentLanguage, setLanguage, t, currentLangOption } = useLanguage();
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');
  const [languageSearch, setLanguageSearch] = useState('');

  // Sync initialTab when modal opens
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Cookies, LocalStorage & Device Permissions state
  const [cookiePermissions, setCookiePermissions] = useState<{
    essential: boolean;
    storage: boolean;
    location: boolean;
    mediaDevices: boolean;
    notifications: boolean;
    gpuHardware: boolean;
    analytics: boolean;
    hasConsented: boolean;
  }>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('icallog_cookie_permissions_v1') : null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      essential: true,
      storage: true,
      location: false,
      mediaDevices: false,
      notifications: false,
      gpuHardware: true,
      analytics: true,
      hasConsented: false,
    };
  });

  const [storageMetrics, setStorageMetrics] = useState<{
    usedKb: number;
    itemsCount: number;
    projectsCount: number;
    lastSavedTime: string;
  }>({
    usedKb: 0,
    itemsCount: 0,
    projectsCount: 0,
    lastSavedTime: 'Just now',
  });

  const [locationStatus, setLocationStatus] = useState<string>('Not requested');
  const [micCameraStatus, setMicCameraStatus] = useState<string>('Ready');
  const [notificationStatus, setNotificationStatus] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'Not supported'
  );

  const refreshStorageMetrics = () => {
    try {
      let totalBytes = 0;
      let count = 0;
      let projCount = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key) || '';
          totalBytes += (key.length + val.length) * 2;
          count++;
          if (key.includes('project') || key.includes('icallog_projects')) {
            try {
              const parsed = JSON.parse(val);
              if (Array.isArray(parsed)) projCount += parsed.length;
            } catch {
              projCount++;
            }
          }
        }
      }
      setStorageMetrics({
        usedKb: Math.max(1, Math.round(totalBytes / 1024)),
        itemsCount: count,
        projectsCount: projCount,
        lastSavedTime: new Date().toLocaleTimeString(),
      });
      refreshOfflineDiag();
    } catch {
      // ignore
    }
  };

  // Offline Diagnostics & Service Worker state
  const [offlineDiag, setOfflineDiag] = useState<OfflineDiagnostics | null>(null);
  const [isSimOffline, setIsSimOffline] = useState<boolean>(() => !getEffectiveOnlineStatus());
  const [isHardRefreshing, setIsHardRefreshing] = useState<boolean>(false);
  const [forceServerSyncToggle, setForceServerSyncToggle] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('icallog_force_server_sync_toggle_v1') === 'true';
    }
    return true;
  });
  const [swActive, setSwActive] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' && !!navigator.serviceWorker?.controller;
  });

  const refreshOfflineDiag = async () => {
    try {
      const diag = await getOfflineStorageDiagnostics();
      setOfflineDiag(diag);
      setIsSimOffline(!getEffectiveOnlineStatus());
      setSwActive(typeof navigator !== 'undefined' && !!navigator.serviceWorker?.controller);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshStorageMetrics();
    }
  }, [isOpen, activeTab]);

  // Live session token and countdown for security tab
  const [modalSession, setModalSession] = useState<SessionData>(() => getStoredSession());
  const [modalSessionSecs, setModalSessionSecs] = useState<number>(() => {
    const s = getStoredSession();
    return Math.max(0, Math.floor((s.expiresAt - Date.now()) / 1000));
  });

  useEffect(() => {
    if (!isOpen) return;
    const updateSessionState = () => {
      const s = getStoredSession();
      setModalSession(s);
      setModalSessionSecs(Math.max(0, Math.floor((s.expiresAt - Date.now()) / 1000)));
    };
    updateSessionState();
    const interval = setInterval(updateSessionState, 1000);
    return () => clearInterval(interval);
  }, [isOpen, activeTab]);

  const saveCookiePermissions = (updated: typeof cookiePermissions) => {
    const finalState = { ...updated, hasConsented: true };
    setCookiePermissions(finalState);
    try {
      localStorage.setItem('icallog_cookie_permissions_v1', JSON.stringify(finalState));
    } catch {
      // ignore
    }
    onNotify('Preferences Saved', 'Cookies & Storage permissions updated successfully.', 'success');
  };

  const handleToggleCookiePermission = async (key: keyof typeof cookiePermissions) => {
    if (key === 'essential') return;
    const nextVal = !cookiePermissions[key];
    const updated = { ...cookiePermissions, [key]: nextVal };
    setCookiePermissions(updated);

    if (nextVal) {
      if (key === 'location' && 'geolocation' in navigator) {
        setLocationStatus('Requesting GPS...');
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocationStatus(`Granted (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`);
            onNotify('Location Granted', 'Regional AI context updated.', 'info');
          },
          (err) => {
            setLocationStatus(`Denied (${err.message})`);
            onNotify('Location Denied', err.message, 'warning');
          }
        );
      } else if (key === 'mediaDevices' && 'mediaDevices' in navigator) {
        try {
          setMicCameraStatus('Requesting Camera/Mic...');
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
          stream.getTracks().forEach((track) => track.stop());
          setMicCameraStatus('Granted & Verified');
          onNotify('Media Devices Granted', 'Camera & Microphone hardware ready.', 'success');
        } catch {
          setMicCameraStatus('Blocked in site settings');
          onNotify('Hardware Access', 'Media permissions can be changed in browser site settings.', 'warning');
        }
      } else if (key === 'notifications' && 'Notification' in window) {
        try {
          const res = await Notification.requestPermission();
          setNotificationStatus(res);
          if (res === 'granted') {
            onNotify('Notifications Active', 'You will receive background alerts when rendering finishes.', 'success');
          }
        } catch {
          // ignore
        }
      }
    }
  };

  const handleAcceptAllCookies = () => {
    const allOn = {
      essential: true,
      storage: true,
      location: true,
      mediaDevices: true,
      notifications: true,
      gpuHardware: true,
      analytics: true,
      hasConsented: true,
    };
    saveCookiePermissions(allOn);
  };

  const handleResetEssentialCookies = () => {
    const essentialOnly = {
      essential: true,
      storage: true,
      location: false,
      mediaDevices: false,
      notifications: false,
      gpuHardware: true,
      analytics: false,
      hasConsented: true,
    };
    saveCookiePermissions(essentialOnly);
  };

  const handleClearTemporaryStorage = () => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('cache') || key.includes('temp') || key.includes('search_history'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      refreshStorageMetrics();
      onNotify('Cache Flushed', `Removed ${keysToRemove.length} temporary cached items. Saved projects remain intact.`, 'info');
    } catch {
      // ignore
    }
  };

  // Voice Preferences & Microphone Sensitivity state
  const [voicePrefs, setVoicePrefs] = useState<VoicePreferences>(() => getStoredVoicePreferences());
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micVuLevel, setMicVuLevel] = useState(0);
  const [micPeakLevel, setMicPeakLevel] = useState(0);
  const [micStatus, setMicStatus] = useState<'silence' | 'voice' | 'clipping'>('silence');
  const [testTtsPlaying, setTestTtsPlaying] = useState(false);
  const audioMeterRef = useRef<{ stop: () => void } | null>(null);

  // Sync voice preferences when modal opens or activeTab changes
  useEffect(() => {
    if (isOpen) {
      setVoicePrefs(getStoredVoicePreferences());
    } else {
      if (audioMeterRef.current) {
        audioMeterRef.current.stop();
        audioMeterRef.current = null;
        setIsTestingMic(false);
      }
    }
  }, [isOpen]);

  // Clean up mic tester on tab navigation
  useEffect(() => {
    if (activeTab !== 'voice' && audioMeterRef.current) {
      audioMeterRef.current.stop();
      audioMeterRef.current = null;
      setIsTestingMic(false);
      setMicVuLevel(0);
      setMicPeakLevel(0);
      setMicStatus('silence');
    }
  }, [activeTab]);

  const handleToggleTestMic = () => {
    if (isTestingMic) {
      if (audioMeterRef.current) {
        audioMeterRef.current.stop();
        audioMeterRef.current = null;
      }
      setIsTestingMic(false);
      setMicVuLevel(0);
      setMicPeakLevel(0);
      setMicStatus('silence');
    } else {
      setIsTestingMic(true);
      const meter = createMicAudioMeter((level, peak, status) => {
        setMicVuLevel(level);
        setMicPeakLevel(peak);
        setMicStatus(status);
      }, voicePrefs.micSensitivity);
      audioMeterRef.current = meter;
    }
  };

  const handleVoicePrefChange = (updates: Partial<VoicePreferences>) => {
    const next = { ...voicePrefs, ...updates };
    setVoicePrefs(next);
    saveVoicePreferences(next);
  };

  const handleSaveVoicePreferences = () => {
    saveVoicePreferences(voicePrefs);
    onNotify('Voice Preferences Saved', 'Microphone sensitivity and voice recognition thresholds updated successfully.', 'success');
  };

  const handleResetVoicePreferences = () => {
    const defaults = resetVoicePreferences();
    setVoicePrefs(defaults);
    onNotify('Voice Preferences Reset', 'Restored recommended sensitivity and noise suppression settings.', 'info');
  };

  const handlePlaySampleAudioFeedback = () => {
    setTestTtsPlaying(true);
    speakFeedback(`Voice navigation ready. Microphone sensitivity is calibrated at ${voicePrefs.micSensitivity} percent.`);
    setTimeout(() => setTestTtsPlaying(false), 2600);
  };

  // Auth form state
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [emailInput, setEmailInput] = useState(user.email);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Profile edit state
  const [username, setUsername] = useState(user.username);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');

  // Contact Info state
  const [phoneInput, setPhoneInput] = useState(user.phone || '');
  const [contactEmailInput, setContactEmailInput] = useState(user.contactEmail || user.email || '');
  const [countryCodeInput, setCountryCodeInput] = useState(user.countryCode || '+91');
  const [whatsappInput, setWhatsappInput] = useState(user.whatsapp || '');
  const [addressInput, setAddressInput] = useState(user.address || '');

  // Account Transactions & Ledger state
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [transactionsSummary, setTransactionsSummary] = useState<TransactionsSummary | null>(null);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [txFilter, setTxFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<TransactionRecord | null>(null);
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);

  // Camera & Gallery profile photo state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [photoSourceType, setPhotoSourceType] = useState<'camera' | 'gallery' | 'preset' | 'default'>('default');
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);

  // Pro Camera Extended Features in Profile
  const [cameraZoom, setCameraZoom] = useState<number>(1.0);
  const [cameraHdr, setCameraHdr] = useState<boolean>(false);
  const [cameraLut, setCameraLut] = useState<CameraLutFilter>('normal');
  const [cameraRotation, setCameraRotation] = useState<number>(0);
  const [cameraFlash, setCameraFlash] = useState<boolean>(false);
  const [cameraTimer, setCameraTimer] = useState<number>(0);
  const [cameraCountdown, setCameraCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Load Transactions function
  const loadTransactions = async () => {
    setIsLoadingTx(true);
    try {
      const data = await fetchUserTransactions(user.id);
      setTransactions(data.transactions || []);
      setTransactionsSummary(data.summary || null);
    } catch (err) {
      console.warn('Failed to fetch transactions:', err);
    } finally {
      setIsLoadingTx(false);
    }
  };

  // Sync state when modal opens or user changes
  useEffect(() => {
    if (isOpen) {
      setEmailInput(user.email);
      setNameInput(user.name || '');
      setUsername(user.username);
      setAvatarUrl(user.avatarUrl || '');
      setPhoneInput(user.phone || '');
      setContactEmailInput(user.contactEmail || user.email || '');
      setCountryCodeInput(user.countryCode || '+91');
      setWhatsappInput(user.whatsapp || '');
      setAddressInput(user.address || '');
      loadTransactions();
    } else {
      stopCamera();
      setPhotoMenuOpen(false);
      setSelectedReceipt(null);
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (activeTab === 'transactions') {
      loadTransactions();
    }
  }, [activeTab]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async (facing: 'user' | 'environment' = cameraFacingMode) => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Camera access issue:', err);
      setCameraError(
        'Camera permission was not granted or camera is unavailable. You can also click "Device Camera" below to use your phone/system camera app, or pick a photo from your Gallery.'
      );
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
    setCameraCountdown(null);
  };

  const flipCamera = () => {
    const nextFacing = cameraFacingMode === 'user' ? 'environment' : 'user';
    setCameraFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  const rotateCameraLens = () => {
    setCameraRotation((prev) => ((prev + 90) % 360));
  };

  const executeSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    // Flash effect
    if (cameraFlash) {
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 250);
    }

    // Audio shutter sound
    playCameraSound('shutter');

    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    const size = Math.min(width, height);
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.translate(300, 300);
    ctx.rotate((cameraRotation * Math.PI) / 180);

    if (cameraFacingMode === 'user') {
      ctx.scale(-1, 1);
    }

    // Filter application
    let filterString = '';
    if (cameraHdr) {
      filterString += 'contrast(1.3) saturate(1.3) brightness(1.05) ';
    }
    if (cameraLut === 'cyber_neon') filterString += 'hue-rotate(290deg) saturate(1.7) contrast(1.2) ';
    else if (cameraLut === 'vivid') filterString += 'saturate(1.8) contrast(1.2) ';
    else if (cameraLut === 'warm_vintage') filterString += 'sepia(0.55) contrast(1.1) brightness(0.95) ';
    else if (cameraLut === 'noir_bw') filterString += 'grayscale(1) contrast(1.6) ';
    else if (cameraLut === 'golden_hour') filterString += 'sepia(0.3) saturate(1.4) hue-rotate(-15deg) ';
    else if (cameraLut === 'hdr_cinema') filterString += 'contrast(1.4) saturate(1.3) brightness(1.05) ';
    else if (cameraLut === 'cold_glacier') filterString += 'hue-rotate(180deg) saturate(1.2) contrast(1.15) ';
    else if (cameraLut === 'dramatic_contrast') filterString += 'contrast(1.6) brightness(0.9) ';

    if (filterString.trim()) {
      ctx.filter = filterString.trim();
    }

    // Zoom crop
    const cropSize = size / cameraZoom;
    const startX = (width - cropSize) / 2;
    const startY = (height - cropSize) / 2;

    ctx.drawImage(video, startX, startY, cropSize, cropSize, -300, -300, 600, 600);
    ctx.restore();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setAvatarUrl(dataUrl);
    setPhotoSourceType('camera');

    // Save to Vault
    saveVaultItem({
      id: 'cam_avatar_' + Date.now(),
      type: 'image',
      url: dataUrl,
      title: `Avatar Photo (${new Date().toLocaleDateString()})`,
      timestamp: new Date().toISOString(),
      resolution: '600x600',
      filterUsed: cameraLut,
      zoomLevel: cameraZoom,
      rotation: cameraRotation,
      mirrored: cameraFacingMode === 'user',
      fileSizeBytes: Math.round((dataUrl.length * 3) / 4),
    });

    stopCamera();
    onNotify('8K HDR Photo Captured', 'Profile photo snapped with Pro Camera! Click "Save Profile Changes" to finish.', 'success');
  };

  const capturePhotoFromVideo = () => {
    if (cameraTimer > 0) {
      setCameraCountdown(cameraTimer);
      let count = cameraTimer;
      playCameraSound('beep');
      const timerInt = setInterval(() => {
        count -= 1;
        if (count > 0) {
          setCameraCountdown(count);
          playCameraSound('beep');
        } else {
          clearInterval(timerInt);
          setCameraCountdown(null);
          executeSnap();
        }
      }, 1000);
    } else {
      executeSnap();
    }
  };

  const handleGalleryFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onNotify('Invalid File', 'Please select an image file (JPEG, PNG, WEBP, etc.)', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) return;

      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, 400, 400);
          const optimized = canvas.toDataURL('image/jpeg', 0.88);
          setAvatarUrl(optimized);
        } else {
          setAvatarUrl(result);
        }
        setPhotoSourceType('gallery');
        onNotify('Photo Loaded', 'Profile photo loaded from gallery! Click "Save Profile Changes" to apply.', 'success');
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleResetAvatar = () => {
    const defaultUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';
    setAvatarUrl(defaultUrl);
    setPhotoSourceType('default');
    onNotify('Avatar Reset', 'Profile avatar reset to default.', 'info');
  };

  // Privacy toggles
  const [dataSync, setDataSync] = useState(true);
  const [analyticsOptIn, setAnalyticsOptIn] = useState(false);
  const [publicProfile, setPublicProfile] = useState(true);

  // Dynamic Persona & Role Based Plans State
  const [selectedPersonaForPlans, setSelectedPersonaForPlans] = useState<PersonaType>(user.personaType || 'general');
  const personaPlansList = getPlansForPersona(selectedPersonaForPlans);

  // Subscription state inside operator profile modal
  const [selectedPlan, setSelectedPlan] = useState<PersonaPlan>(() => {
    const list = getPlansForPersona(user.personaType || 'general');
    return list.find((p) => p.popular) || list[0];
  });

  // When persona selection changes, adjust default selected plan
  useEffect(() => {
    const list = getPlansForPersona(selectedPersonaForPlans);
    const popular = list.find((p) => p.popular) || list[0];
    setSelectedPlan(popular);
  }, [selectedPersonaForPlans]);

  const [paymentMethod, setPaymentMethod] = useState<'GPay' | 'PhonePe' | 'Paytm' | 'Net Banking' | 'Cards'>('GPay');
  const [showQr, setShowQr] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Card & Bank & UPI payment details state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [upiId, setUpiId] = useState('user@okicici');

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowQr(false);
      const creditedTokens = selectedPlan.tokenBonus || (selectedPlan.price * 10);
      onUpdateUser({
        ...user,
        vipTier: selectedPlan.tier,
        tokenBalance: user.tokenBalance + creditedTokens,
      });
      onNotify(
        'VIP Subscription Activated',
        `Successfully activated ${selectedPlan.name} (₹${selectedPlan.price})! +${creditedTokens.toLocaleString()} Tokens & Exclusive Content (18+ & All Genres) Enabled!`,
        'success'
      );
    }, 1200);
  };

  // Feedback state
  const [feedbackCategory, setFeedbackCategory] = useState('feature');
  const [feedbackText, setFeedbackText] = useState('');

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...user,
      username: username.trim() || user.username,
      name: (nameInput || '').trim() || user.name || 'Profile User',
      email: emailInput.trim() || user.email,
      phone: phoneInput.trim(),
      contactEmail: contactEmailInput.trim() || emailInput.trim(),
      countryCode: countryCodeInput,
      whatsapp: whatsappInput.trim(),
      address: addressInput.trim(),
      avatarUrl: avatarUrl.trim() || user.avatarUrl,
      language: currentLanguage,
    };
    onUpdateUser(updated);
    try {
      await updateUserProfile({
        name: updated.name,
        username: updated.username,
        avatarUrl: updated.avatarUrl,
        email: updated.email,
        phone: updated.phone,
        contactEmail: updated.contactEmail,
        countryCode: updated.countryCode,
        whatsapp: updated.whatsapp,
        address: updated.address,
        language: currentLanguage,
      });
    } catch {
      // client-side storage active
    }
    onNotify('Profile & Contact Saved', 'Your profile details, contact information, and preferences have been updated successfully!', 'success');
  };

  // Export Statement as CSV
  const handleExportCsv = () => {
    if (!transactions.length) {
      onNotify('No Data', 'No transactions found to export.', 'warning');
      return;
    }
    const headers = ['Date', 'Transaction ID', 'Type', 'Category', 'Description', 'Token Amount', 'Rupees (INR)', 'Balance After', 'Status', 'Payment Method'];
    const rows = transactions.map((t) => [
      `"${new Date(t.timestamp).toLocaleString()}"`,
      `"${t.referenceId}"`,
      `"${t.type.toUpperCase()}"`,
      `"${t.category.toUpperCase()}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${t.type === 'credit' ? '+' : '-'}${t.tokenAmount}"`,
      `"${t.amountRupees ? '₹' + t.amountRupees : 'N/A'}"`,
      `"${t.balanceAfter ?? 'N/A'}"`,
      `"${t.status.toUpperCase()}"`,
      `"${t.paymentMethod || 'SYSTEM'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `iCALLOG_Statement_${user.username}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('Statement Downloaded', 'Account transaction CSV statement downloaded to your device.', 'success');
  };

  // Export Statement as TXT
  const handleExportTxt = () => {
    if (!transactions.length) {
      onNotify('No Data', 'No transactions found to export.', 'warning');
      return;
    }
    let txt = `==========================================================\n`;
    txt += `          iCALLOG STUDIO ACCOUNT TRANSACTION STATEMENT    \n`;
    txt += `==========================================================\n`;
    txt += `User: ${user.name || user.username} (${user.email})\n`;
    txt += `Phone: ${user.phone || 'N/A'}\n`;
    txt += `VIP Tier: ${user.vipTier.toUpperCase()} | Balance: ${user.tokenBalance} Tokens\n`;
    txt += `Generated: ${new Date().toLocaleString()}\n`;
    txt += `----------------------------------------------------------\n\n`;

    transactions.forEach((t, i) => {
      txt += `[#${i + 1}] Date: ${new Date(t.timestamp).toLocaleString()}\n`;
      txt += `     Ref ID: ${t.referenceId}\n`;
      txt += `     Type: ${t.type.toUpperCase()} | Category: ${t.category.toUpperCase()}\n`;
      txt += `     Description: ${t.description}\n`;
      txt += `     Tokens: ${t.type === 'credit' ? '+' : '-'}${t.tokenAmount} | Amount: ${t.amountRupees ? '₹' + t.amountRupees : 'N/A'}\n`;
      txt += `     Balance After: ${t.balanceAfter ?? 'N/A'} | Status: ${t.status}\n`;
      txt += `     --------------------------------------------------\n`;
    });

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `iCALLOG_Passbook_${user.username}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    onNotify('Ledger Downloaded', 'Account passbook text file saved successfully.', 'success');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTxId(id);
    setTimeout(() => setCopiedTxId(null), 2000);
    onNotify('Copied', `Copied: ${text}`, 'info');
  };

  const handleSelectLanguage = (langCode: string) => {
    setLanguage(langCode);
    const selectedOption = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
    const updated: UserProfile = {
      ...user,
      language: langCode,
    };
    onUpdateUser(updated);
    updateUserProfile({ language: langCode }).catch(() => {});
    onNotify(
      t('language_updated'),
      `${selectedOption?.flag || '🌐'} ${selectedOption?.name} (${selectedOption?.nativeName})`,
      'success'
    );
  };

  const handleCategorySelect = (newCat: PersonaType) => {
    const pCfg = getPersonaConfig(newCat);
    const existingSubs = user.subProfiles || [];
    const matchingProfile = existingSubs.find((p) => p.personaType === newCat);

    if (matchingProfile) {
      const updated: UserProfile = {
        ...user,
        activeProfileId: matchingProfile.id,
        personaType: matchingProfile.personaType,
        name: matchingProfile.name,
        avatarUrl: matchingProfile.avatarUrl || user.avatarUrl,
        subProfiles: existingSubs,
      };
      setNameInput(matchingProfile.name);
      setAvatarUrl(matchingProfile.avatarUrl || user.avatarUrl || '');
      onUpdateUser(updated);
      updateUserProfile({
        name: updated.name,
        avatarUrl: updated.avatarUrl,
        personaType: updated.personaType,
        activeProfileId: updated.activeProfileId,
        subProfiles: updated.subProfiles,
      }).catch(() => {});
      onNotify(
        'Profile Switched to ' + pCfg.label,
        `Switched active profile to "${matchingProfile.name}" (${pCfg.badgeEmoji} ${pCfg.badgeLabel}). Workspace customized!`,
        'success'
      );
      return;
    }

    const defaultNames: Record<string, { name: string; avatar: string; title: string }> = {
      professional: {
        name: 'Pro Studio VFX',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
        title: 'Studio Professional',
      },
      student: {
        name: 'Scholar Student',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
        title: 'Student & Study Sandbox',
      },
      general: {
        name: 'General Creator',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        title: 'General Creative Studio',
      },
      creator: {
        name: 'Creator Studio',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
        title: 'YouTube & Reels Creator',
      },
    };
    const def = defaultNames[newCat] || { name: pCfg.label, avatar: user.avatarUrl || '', title: pCfg.badgeLabel };

    const updatedSubProfiles = existingSubs.map((p) =>
      p.id === user.activeProfileId
        ? {
            ...p,
            personaType: newCat,
            name: def.name,
            avatarUrl: def.avatar,
            badgeLabel: pCfg.badgeLabel,
            badgeColor: pCfg.badgeColor,
            title: def.title,
          }
        : p
    );

    const updated: UserProfile = {
      ...user,
      personaType: newCat,
      name: def.name,
      avatarUrl: def.avatar,
      subProfiles: updatedSubProfiles,
    };

    setNameInput(def.name);
    setAvatarUrl(def.avatar);
    onUpdateUser(updated);
    updateUserProfile({
      name: updated.name,
      avatarUrl: updated.avatarUrl,
      personaType: newCat,
      subProfiles: updatedSubProfiles,
    }).catch(() => {});

    onNotify(
      'Profile Switched to ' + pCfg.label,
      `Switched profile to "${def.name}" (${pCfg.badgeEmoji} ${pCfg.hindiLabel}). All tools and badges updated!`,
      'success'
    );
  };

  const handleContinueAsGuest = () => {
    const guestUser: UserProfile = {
      id: 'usr_guest_01',
      username: 'Guest Creator',
      name: 'Guest User (अतिथि)',
      email: 'guest@icallog.studio',
      role: 'user',
      isGuestAccount: true,
      personaType: 'guest',
      tokenBalance: 50,
      vipTier: 'free',
      vipExpiry: null,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      createdAt: new Date().toISOString(),
    };
    onUpdateUser(guestUser);
    onNotify(
      'Guest Sandbox Activated (अतिथि खाता)',
      'You are exploring iCALLOG with 50 starter demo tokens. Create unlimited drafts without password!',
      'info'
    );
    onClose();
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      onNotify('Validation Error', 'Please enter both email and password.', 'warning');
      return;
    }
    onUpdateUser({
      ...user,
      email: emailInput,
      name: nameInput || emailInput.split('@')[0],
      username: nameInput || 'Profile User',
      isGuestAccount: false,
      role: 'user',
    });
    onNotify(
      authMode === 'signin' ? 'Successfully Signed In' : 'Account Created & Verified',
      `Welcome back, ${emailInput}! Cloud projects and custom settings secured.`,
      'success'
    );
    onClose();
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.length < 6) {
      onNotify('Weak Password', 'Password must be at least 6 characters long.', 'warning');
      return;
    }
    setPasswordInput('');
    onNotify('Password Updated', 'Your security credentials have been successfully updated.', 'success');
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      onNotify('Feedback Empty', 'Please enter your feedback message.', 'warning');
      return;
    }
    setFeedbackText('');
    onNotify('Feedback Received', 'Thank you! Your feedback has been transmitted to the iCALLOG engineering team.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold">
              👤
            </div>
            <div>
              <h2 className="text-base font-black text-white font-['Syne']">
                My Profile & Account Settings
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Update profile photo, personal information, VIP status, and preferences
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body with Sidebar Navigation */}
        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
          {/* Sidebar Nav */}
          <div className="w-full sm:w-56 bg-slate-950/80 border-r border-slate-800 p-3 space-y-1 shrink-0 overflow-y-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <User className="w-4 h-4 text-cyan-400" />
              <span>{t('my_profile_photo')}</span>
            </button>

            <button
              onClick={() => setActiveTab('personas')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                activeTab === 'personas'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold shadow-md shadow-indigo-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Roles & Personas</span>
              </div>
              <PersonaBadge type={user.personaType || 'general'} size="sm" showLabel={false} />
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                activeTab === 'transactions'
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>Transactions & Ledger</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono">
                {transactions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('language')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                activeTab === 'language'
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>{t('language_region')}</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono flex items-center gap-1">
                <span>{currentLangOption.flag}</span>
                <span>{currentLangOption.code.toUpperCase()}</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('vip')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'vip'
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span>{t('vip_tokens')}</span>
            </button>

            <button
              onClick={() => setActiveTab('auth')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'auth'
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <LogIn className="w-4 h-4 text-emerald-400" />
              <span>{t('login_signup')}</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'security'
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>{t('password_security')}</span>
            </button>

            <button
              onClick={() => setActiveTab('theme')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'theme'
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Palette className="w-4 h-4 text-purple-400" />
              <span>{t('theme_display')}</span>
            </button>

            <button
              onClick={() => setActiveTab('privacy')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'privacy'
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Shield className="w-4 h-4 text-blue-400" />
              <span>{t('privacy_data')}</span>
            </button>

            <button
              id="profile-tab-cookies-btn"
              onClick={() => setActiveTab('cookies')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                activeTab === 'cookies'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-bold shadow-md shadow-cyan-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Cookie className="w-4 h-4 text-cyan-400" />
                <span>Cookies & Storage</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono border border-cyan-800/60 font-bold">
                {storageMetrics.usedKb} KB
              </span>
            </button>

            <button
              id="profile-tab-voice-preferences-btn"
              onClick={() => setActiveTab('voice')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                activeTab === 'voice'
                  ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white font-bold shadow-md shadow-rose-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Mic className="w-4 h-4 text-rose-400" />
                <span>Voice Preferences</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 font-mono border border-rose-800/60 font-bold">
                {voicePrefs.micSensitivity}%
              </span>
            </button>

            <button
              id="profile-tab-feedback-btn"
              onClick={() => setActiveTab('feedback')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'feedback'
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-rose-400" />
              <span>{t('feedback_support')}</span>
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-slate-900/60">
            {/* 1. PROFILE DETAILS & PHOTO STUDIO */}
            {activeTab === 'profile' && (
              <div className="space-y-5">
                {/* Hidden File Inputs for Gallery & Native Mobile Camera */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleGalleryFileSelect}
                  className="hidden"
                />
                <input
                  ref={nativeCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleGalleryFileSelect}
                  className="hidden"
                />

                {/* VIP Active Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-950 to-slate-950 border border-amber-500/40 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-base">
                      👑
                    </div>
                    <div>
                      <div className="text-xs font-black text-white font-['Syne'] flex items-center gap-1.5">
                        VIP Active Status <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <div className="text-[11px] font-mono text-amber-400">
                        {user.tokenBalance.toLocaleString()} Tokens Available • {user.vipTier.toUpperCase()} Plan
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('vip')}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-900/30 transition-all"
                  >
                    Manage VIP
                  </button>
                </div>

                {/* Account Role Archetype & Multi-Profile Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-lg select-none">
                      {getPersonaConfig(user.personaType).badgeEmoji}
                    </div>
                    <div>
                      <div className="text-xs font-black text-white font-['Syne'] flex items-center gap-2 flex-wrap">
                        <span>Account Role & Category</span>
                        <PersonaBadge type={user.personaType || 'general'} size="sm" />
                        <button
                          type="button"
                          onClick={() => setActiveTab('cookies')}
                          className="px-2 py-0.5 rounded-full bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 text-[10px] font-mono font-bold flex items-center gap-1 transition-all hover:scale-105 shadow-sm"
                          title="Open Cookie, Storage & Hardware Permissions"
                        >
                          <Cookie className="w-3 h-3 text-cyan-400" />
                          <span>Cookie & Storage</span>
                        </button>
                      </div>
                      <div className="text-[11px] font-mono text-cyan-400">
                        {getPersonaConfig(user.personaType).hindiLabel} • Multi-Profile Enabled
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* Category Dropdown on the right side */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700">
                      <span className="text-[10px] font-mono font-semibold text-slate-400">Category:</span>
                      <select
                        id="profile-banner-category-select"
                        value={user.personaType || 'general'}
                        onChange={(e) => handleCategorySelect(e.target.value as PersonaType)}
                        aria-label="Select Persona Role Category"
                        className="bg-slate-950 text-cyan-300 font-bold text-xs py-1 px-2 rounded-lg border border-cyan-500/40 hover:border-cyan-400 focus:outline-none cursor-pointer"
                      >
                        <option value="professional">💼 Professional (पेशेवर)</option>
                        <option value="student">🎒 Student (छात्र)</option>
                        <option value="general">✨ General (सामान्य)</option>
                        <option value="creator">🎬 Content Creator (क्रिएटर)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('personas')}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-cyan-300 border border-indigo-500/40 text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <span>All Roles</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Live Pro Camera Viewfinder Modal / Section */}
                {isCameraActive && (
                  <div className="p-4 sm:p-5 rounded-3xl bg-slate-950 border-2 border-cyan-500 shadow-2xl space-y-3.5 relative overflow-hidden">
                    {/* Screen Flash burst overlay */}
                    {isFlashing && (
                      <div className="absolute inset-0 bg-white z-50 animate-pulse pointer-events-none" />
                    )}

                    {/* Top Bar: Camera HUD Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                        <span className="text-xs font-black text-white font-['Syne'] uppercase tracking-wider flex items-center gap-1.5">
                          <Camera className="w-4 h-4 text-cyan-400" /> Pro Camera Live Viewfinder
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                          8K HDR • {cameraZoom.toFixed(1)}x
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Flash / Torch */}
                        <button
                          type="button"
                          onClick={() => setCameraFlash(!cameraFlash)}
                          className={`p-1.5 rounded-xl border text-xs flex items-center gap-1 font-mono transition-all ${
                            cameraFlash
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                          title="Toggle Flash Burst"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span className="text-[10px] hidden sm:inline">{cameraFlash ? 'FLASH ON' : 'FLASH'}</span>
                        </button>

                        {/* HDR Mode */}
                        <button
                          type="button"
                          onClick={() => setCameraHdr(!cameraHdr)}
                          className={`p-1.5 rounded-xl border text-xs flex items-center gap-1 font-mono font-bold transition-all ${
                            cameraHdr
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                          title="Toggle Dynamic HDR"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span className="text-[10px] hidden sm:inline">{cameraHdr ? 'HDR ON' : 'HDR'}</span>
                        </button>

                        {/* Lens Rotation */}
                        <button
                          type="button"
                          onClick={rotateCameraLens}
                          className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-xs flex items-center gap-1"
                          title="Rotate Lens (0°, 90°, 180°, 270°)"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-[10px] font-mono">{cameraRotation}°</span>
                        </button>

                        {/* Self Timer */}
                        <button
                          type="button"
                          onClick={() => setCameraTimer((prev) => (prev === 0 ? 3 : prev === 3 ? 5 : 0))}
                          className={`p-1.5 rounded-xl border text-xs flex items-center gap-1 font-mono transition-all ${
                            cameraTimer > 0
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                          title="Self Timer Delay"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-[10px]">{cameraTimer === 0 ? 'OFF' : `${cameraTimer}s`}</span>
                        </button>

                        {/* Camera Flip */}
                        <button
                          type="button"
                          onClick={flipCamera}
                          className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-xs flex items-center gap-1"
                          title="Flip Front / Rear Camera"
                        >
                          <FlipHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                        </button>

                        {/* Close Viewfinder */}
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 border border-slate-800 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {cameraError ? (
                      <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs space-y-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <p>{cameraError}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => nativeCameraInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
                          >
                            <Smartphone className="w-3.5 h-3.5" /> Open Device Camera
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" /> Choose from Gallery
                          </button>
                          {onOpenProCamera && (
                            <button
                              type="button"
                              onClick={() => {
                                stopCamera();
                                onClose();
                                onOpenProCamera();
                              }}
                              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5"
                            >
                              <Camera className="w-3.5 h-3.5" /> Open Pro Camera Studio
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="relative rounded-2xl overflow-hidden bg-black aspect-video sm:aspect-square max-h-80 flex items-center justify-center border border-slate-800">
                        {/* Video Feed with CSS Transforms (Rotation, Mirror Flip, Zoom, Filters) */}
                        <div
                          className="w-full h-full flex items-center justify-center overflow-hidden"
                          style={{
                            transform: `rotate(${cameraRotation}deg)`,
                            transition: 'transform 0.25s ease',
                          }}
                        >
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover transition-all ${
                              cameraFacingMode === 'user' ? 'scale-x-[-1]' : ''
                            }`}
                            style={{
                              transform: `${cameraFacingMode === 'user' ? 'scaleX(-1)' : ''} scale(${cameraZoom})`,
                              filter: `
                                ${cameraHdr ? 'contrast(1.3) saturate(1.3) brightness(1.05)' : ''}
                                ${cameraLut === 'cyber_neon' ? 'hue-rotate(290deg) saturate(1.7) contrast(1.2)' : ''}
                                ${cameraLut === 'vivid' ? 'saturate(1.8) contrast(1.2)' : ''}
                                ${cameraLut === 'warm_vintage' ? 'sepia(0.55) contrast(1.1) brightness(0.95)' : ''}
                                ${cameraLut === 'noir_bw' ? 'grayscale(1) contrast(1.6)' : ''}
                                ${cameraLut === 'golden_hour' ? 'sepia(0.3) saturate(1.4) hue-rotate(-15deg)' : ''}
                                ${cameraLut === 'hdr_cinema' ? 'contrast(1.4) saturate(1.3) brightness(1.05)' : ''}
                                ${cameraLut === 'cold_glacier' ? 'hue-rotate(180deg) saturate(1.2) contrast(1.15)' : ''}
                                ${cameraLut === 'dramatic_contrast' ? 'contrast(1.6) brightness(0.9)' : ''}
                              `.trim(),
                            }}
                          />
                        </div>

                        {/* Countdown Overlay */}
                        {cameraCountdown !== null && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center animate-pulse">
                            <span className="text-7xl font-black text-cyan-400 font-mono tracking-tighter drop-shadow-[0_0_25px_rgba(6,182,212,0.8)]">
                              {cameraCountdown}
                            </span>
                            <span className="text-xs font-mono text-white mt-2 uppercase tracking-widest">
                              Get Ready for Snap...
                            </span>
                          </div>
                        )}

                        {/* Visual Reticle Circle for centering avatar face */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div className="w-44 h-44 sm:w-56 sm:h-56 rounded-full border-2 border-dashed border-cyan-400/80 shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center">
                            <span className="text-[10px] text-cyan-300 font-mono bg-black/70 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                              Avatar Framing Circle
                            </span>
                          </div>
                        </div>

                        {/* Zoom Level Indicator */}
                        <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-cyan-300 text-[10px] font-mono font-bold">
                          {cameraZoom.toFixed(1)}x ZOOM
                        </div>
                      </div>
                    )}

                    {!cameraError && (
                      <div className="space-y-3">
                        {/* Zoom Slider Bar */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">1.0x</span>
                          <input
                            type="range"
                            min="1.0"
                            max="5.0"
                            step="0.1"
                            value={cameraZoom}
                            onChange={(e) => setCameraZoom(parseFloat(e.target.value))}
                            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                          />
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">5.0x</span>
                          <div className="flex gap-1 shrink-0">
                            {[1.0, 2.0, 3.0].map((z) => (
                              <button
                                key={z}
                                type="button"
                                onClick={() => setCameraZoom(z)}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                  cameraZoom === z ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {z}x
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Cinema LUT Filters Strip */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                          {[
                            { id: 'normal', label: 'Natural' },
                            { id: 'hdr_cinema', label: 'HDR Cinema' },
                            { id: 'cyber_neon', label: 'Cyber Neon' },
                            { id: 'vivid', label: 'Vivid Pop' },
                            { id: 'warm_vintage', label: 'Vintage 70s' },
                            { id: 'noir_bw', label: 'Noir B&W' },
                            { id: 'golden_hour', label: 'Golden Hour' },
                            { id: 'cold_glacier', label: 'Cold Glacier' },
                            { id: 'dramatic_contrast', label: 'Dramatic' },
                          ].map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setCameraLut(f.id as CameraLutFilter)}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${
                                cameraLut === f.id
                                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-black'
                                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                              }`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>

                        {/* Bottom Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                          <button
                            type="button"
                            onClick={capturePhotoFromVideo}
                            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-600 hover:brightness-110 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/30 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Snap Photo & Set Avatar</span>
                          </button>

                          {onOpenProCamera && (
                            <button
                              type="button"
                              onClick={() => {
                                stopCamera();
                                onClose();
                                onOpenProCamera();
                              }}
                              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Open Full Pro Studio</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={stopCamera}
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Profile Photo Studio & Upload Card */}
                <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div>
                      <h3 className="text-xs font-black text-white font-['Syne'] uppercase tracking-wider flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-cyan-400" /> Profile Photo (Avatar)
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Upload a photo from your gallery, or capture live using your camera
                      </p>
                    </div>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={handleResetAvatar}
                        className="text-[11px] font-mono text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Reset Default
                      </button>
                    )}
                  </div>

                  {/* Photo Preview & Action Center */}
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                      {/* Avatar preview image */}
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-1 bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 shadow-xl shadow-cyan-500/20 shrink-0">
                        <img
                          src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80'}
                          alt="Profile Preview"
                          className="w-full h-full rounded-[22px] object-cover bg-slate-900"
                        />
                      </div>

                    {/* Unified Camera & Gallery Action */}
                    <div className="flex-1 w-full space-y-2.5 text-center sm:text-left">
                      <div>
                        <div className="text-xs font-bold text-slate-200">
                          Profile Photo
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Select an image from your device or capture live with your camera
                        </p>
                      </div>

                      {/* Direct Prominent Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => startCamera('user')}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-cyan-950/50 transition-transform hover:scale-105"
                        >
                          <span>Open Camera</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all"
                        >
                          <Upload className="w-4 h-4 text-cyan-400" />
                          <span>📁 Upload Gallery</span>
                        </button>
                      </div>

                      <div className="text-[10px] text-slate-500 font-mono">
                        Supported formats: JPG, PNG, WEBP
                      </div>
                    </div>
                  </div>

                  {/* Preset Avatars Selection Strip */}
                  <div className="pt-2 border-t border-slate-800">
                    <div className="text-[11px] font-mono text-slate-400 mb-2 flex items-center justify-between">
                      <span>OR CHOOSE A PRESET AVATAR:</span>
                      <span className="text-[10px] text-slate-500">6 available</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {PRESET_AVATARS.map((preset) => {
                        const isSelected = avatarUrl === preset.url;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setAvatarUrl(preset.url);
                              setPhotoSourceType('preset');
                              onNotify('Preset Selected', `Applied ${preset.label} avatar. Click Save Changes to apply.`, 'info');
                            }}
                            className={`p-1.5 rounded-xl border text-center transition-all group ${
                              isSelected
                                ? 'bg-cyan-950/60 border-cyan-400 ring-2 ring-cyan-500/30'
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.label}
                              className="w-10 h-10 rounded-lg object-cover mx-auto group-hover:scale-105 transition-transform"
                            />
                            <div className="text-[9px] font-medium text-slate-300 truncate mt-1">
                              {preset.label}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Profile Form Details */}
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 shadow-xl">
                    <div className="text-xs font-black text-white font-['Syne'] uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center justify-between">
                      <span>Personal Details & Role Category</span>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/40">
                        {user.personaType?.toUpperCase() || 'GENERAL'}
                      </span>
                    </div>

                    {/* Role & Category Selector */}
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
                        <span>Account Role & Category (भूमिका और श्रेणी)</span>
                        <span className="text-[10px] text-cyan-400 font-normal">Click to switch instant profile</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'professional', label: 'Professional', emoji: '💼', hindi: 'पेशेवर' },
                          { id: 'student', label: 'Student', emoji: '🎒', hindi: 'छात्र' },
                          { id: 'general', label: 'General', emoji: '✨', hindi: 'सामान्य' },
                          { id: 'creator', label: 'Content Creator', emoji: '🎬', hindi: 'क्रिएटर' },
                        ].map((cat) => {
                          const isActive = (user.personaType || 'general') === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => handleCategorySelect(cat.id as PersonaType)}
                              className={`p-2.5 rounded-xl border text-left transition-all ${
                                isActive
                                  ? 'bg-gradient-to-r from-cyan-950 to-indigo-950 border-cyan-400 ring-2 ring-cyan-500/30 shadow-md'
                                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'
                              }`}
                            >
                              <div className="text-base mb-1">{cat.emoji}</div>
                              <div className={`text-xs font-bold ${isActive ? 'text-cyan-200' : 'text-slate-200'}`}>
                                {cat.label}
                              </div>
                              <div className="text-[9px] text-slate-400 font-mono">
                                {cat.hindi}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Full Name</label>
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          placeholder="e.g. Alex Morgan"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Username / Profile Handle</label>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="e.g. CreativeAlex"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Email Address</label>
                        <input
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center justify-between">
                          <span>Direct Image URL (Optional)</span>
                          <span className="text-[10px] text-slate-500 font-mono">Web link</span>
                        </label>
                        <input
                          type="text"
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono text-[11px]"
                        />
                      </div>
                    </div>

                    {/* Contact Information & Channels */}
                    <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3 shadow-xl">
                      <div className="text-xs font-black text-white font-['Syne'] uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Contact Information & Communication (सम्पर्क विवरण)</span>
                        </span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40 font-mono">
                          Verified
                        </span>
                      </div>

                      <div className="space-y-3">
                        {/* Phone with Country Code Selector */}
                        <div>
                          <label className="text-xs font-bold text-slate-300 block mb-1">
                            Primary Mobile / Phone Number
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={countryCodeInput}
                              onChange={(e) => setCountryCodeInput(e.target.value)}
                              aria-label="Country Code"
                              className="w-32 px-2.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none shrink-0"
                            >
                              {COUNTRY_CODES.map((c) => (
                                <option key={c.code + c.country} value={c.code}>
                                  {c.flag} {c.code}
                                </option>
                              ))}
                            </select>
                            <input
                              type="tel"
                              value={phoneInput}
                              onChange={(e) => setPhoneInput(e.target.value)}
                              placeholder="9876543210"
                              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none transition-colors"
                            />
                          </div>
                        </div>

                        {/* WhatsApp / Telegram Number */}
                        <div>
                          <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center justify-between">
                            <span>WhatsApp / Telegram Number</span>
                            <span className="text-[10px] text-slate-500">For direct support & alerts</span>
                          </label>
                          <input
                            type="text"
                            value={whatsappInput}
                            onChange={(e) => setWhatsappInput(e.target.value)}
                            placeholder="+91 9876543210"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none transition-colors"
                          />
                        </div>

                        {/* Alternate / Billing Email */}
                        <div>
                          <label className="text-xs font-bold text-slate-300 block mb-1">
                            Alternate / Invoicing Email Address
                          </label>
                          <input
                            type="email"
                            value={contactEmailInput}
                            onChange={(e) => setContactEmailInput(e.target.value)}
                            placeholder="billing-contact@example.com"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none transition-colors"
                          />
                        </div>

                        {/* Studio / Billing Address */}
                        <div>
                          <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center justify-between">
                            <span>Studio Location / Billing Address</span>
                            <span className="text-[10px] text-slate-500 font-mono">Optional</span>
                          </label>
                          <input
                            type="text"
                            value={addressInput}
                            onChange={(e) => setAddressInput(e.target.value)}
                            placeholder="City, State, Country"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Language Quick Switcher Card */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{currentLangOption.flag}</span>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{t('language')}: {currentLangOption.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-900/60 text-indigo-300 font-mono">
                              {currentLangOption.nativeName}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {t('choose_language')}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('language')}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>{t('select_language')} (18)</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/40 flex items-center gap-2 transition-transform hover:scale-102"
                    >
                      <Check className="w-4 h-4" /> {t('save_profile_changes')}
                    </button>
                    <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Auto-saved to your device
                    </span>
                  </div>
                </form>
              </div>
            )}

            {/* 2. PERSONAS & SUB-PROFILES TAB */}
            {activeTab === 'personas' && (
              <PersonaProfileManager
                user={user}
                onUpdateUser={onUpdateUser}
                onNotify={onNotify}
                onOpenVipTab={() => setActiveTab('vip')}
              />
            )}

            {/* TRANSACTIONS & PASSBOOK TAB */}
            {activeTab === 'transactions' && (
              <div className="space-y-4">
                {/* Header Banner */}
                <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white font-['Syne']">
                          Account Ledger & Passbook (खाता लेन-देन)
                        </h3>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Live real-time transaction ledger for token usage, recharges & payments
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={loadTransactions}
                        disabled={isLoadingTx}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTx ? 'animate-spin text-emerald-400' : ''}`} />
                        <span>Refresh</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleExportCsv}
                        className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 hover:text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5 border border-emerald-800/60 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>CSV Statement</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleExportTxt}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 text-[11px] font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>TXT Passbook</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800/90">
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Wallet className="w-3 h-3 text-cyan-400" />
                        <span>ACTIVE BALANCE</span>
                      </div>
                      <div className="text-lg font-black text-cyan-400 font-mono mt-0.5">
                        {user.tokenBalance}
                        <span className="text-[11px] font-normal text-slate-400 ml-1">Tokens</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        ≈ ₹{(user.tokenBalance * 0.4).toFixed(2)} valuation
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800/90">
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                        <span>TOTAL CREDITED</span>
                      </div>
                      <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">
                        +{transactionsSummary?.totalCreditedTokens ?? user.tokenBalance}
                        <span className="text-[11px] font-normal text-slate-400 ml-1">Tokens</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Recharges & Welcome grants
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800/90">
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3 text-rose-400" />
                        <span>TOTAL SPENT</span>
                      </div>
                      <div className="text-lg font-black text-rose-400 font-mono mt-0.5">
                        -{transactionsSummary?.totalDebitedTokens ?? 0}
                        <span className="text-[11px] font-normal text-slate-400 ml-1">Tokens</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        3D, Video & AI generations
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800/90">
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-purple-400" />
                        <span>INR PAYMENTS</span>
                      </div>
                      <div className="text-lg font-black text-purple-300 font-mono mt-0.5">
                        ₹{transactionsSummary?.totalSpentInr ?? 0}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Direct UPI & Card billing
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 self-start">
                    <button
                      type="button"
                      onClick={() => setTxFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        txFilter === 'all'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      All ({transactions.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxFilter('credit')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                        txFilter === 'credit'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-emerald-400'
                      }`}
                    >
                      <ArrowDownLeft className="w-3 h-3" />
                      Credits (+)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxFilter('debit')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                        txFilter === 'debit'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-rose-400'
                      }`}
                    >
                      <ArrowUpRight className="w-3 h-3" />
                      Spent (-)
                    </button>
                  </div>

                  <div className="relative flex-1 max-w-xs">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={txSearchQuery}
                      onChange={(e) => setTxSearchQuery(e.target.value)}
                      placeholder="Search transactions, ref ID, features..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    {txSearchQuery && (
                      <button
                        onClick={() => setTxSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Transactions List */}
                <div className="space-y-2">
                  {(() => {
                    const filtered = transactions.filter((tx) => {
                      if (txFilter === 'credit' && tx.type !== 'credit') return false;
                      if (txFilter === 'debit' && tx.type !== 'debit') return false;
                      if (txSearchQuery) {
                        const q = txSearchQuery.toLowerCase();
                        const matchDesc = tx.description.toLowerCase().includes(q);
                        const matchRef = tx.referenceId.toLowerCase().includes(q);
                        const matchCat = tx.category.toLowerCase().includes(q);
                        return matchDesc || matchRef || matchCat;
                      }
                      return true;
                    });

                    if (isLoadingTx) {
                      return (
                        <div className="p-12 text-center text-slate-400 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                          <div className="text-xs font-semibold text-white">Loading your account passbook...</div>
                          <div className="text-[11px] text-slate-500">Fetching live ledger records from server</div>
                        </div>
                      );
                    }

                    if (filtered.length === 0) {
                      return (
                        <div className="p-10 text-center rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                          <Receipt className="w-8 h-8 text-slate-600 mx-auto" />
                          <div>
                            <div className="text-xs font-bold text-white">No transactions found</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {txSearchQuery
                                ? 'No records match your search filter'
                                : 'No account transactions recorded in this ledger yet'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('vip')}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 inline-flex items-center gap-1.5"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Recharge VIP Tokens</span>
                          </button>
                        </div>
                      );
                    }

                    return filtered.map((tx) => {
                      const isCredit = tx.type === 'credit';
                      return (
                        <div
                          key={tx.id || tx.referenceId}
                          className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                                isCredit
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                              }`}
                            >
                              {isCredit ? (
                                <ArrowDownLeft className="w-4 h-4" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4" />
                              )}
                            </div>

                            <div className="space-y-0.5">
                              <div className="text-xs font-bold text-white flex items-center gap-2 flex-wrap">
                                <span>{tx.description}</span>
                                <span
                                  className={`text-[9px] px-2 py-0.5 rounded-full font-mono uppercase font-bold border ${
                                    isCredit
                                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800/40'
                                      : 'bg-slate-900 text-slate-400 border-slate-800'
                                  }`}
                                >
                                  {tx.category}
                                </span>
                                {tx.paymentMethod && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40 font-mono">
                                    {tx.paymentMethod}
                                  </span>
                                )}
                              </div>

                              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 flex-wrap">
                                <span>{new Date(tx.timestamp).toLocaleString()}</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-500 flex items-center gap-1">
                                  Ref: <span className="text-slate-400">{tx.referenceId}</span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(tx.referenceId, tx.referenceId)}
                                    title="Copy Ref ID"
                                    className="hover:text-cyan-400 text-slate-500"
                                  >
                                    {copiedTxId === tx.referenceId ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center">
                            <div className="text-right">
                              <div
                                className={`text-sm font-black font-mono ${
                                  isCredit ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {isCredit ? '+' : '-'}{tx.tokenAmount}
                                <span className="text-[10px] font-normal text-slate-400 ml-1">Tokens</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 justify-end">
                                {tx.amountRupees && (
                                  <span className="text-purple-300 font-bold">₹{tx.amountRupees}</span>
                                )}
                                {tx.balanceAfter !== undefined && (
                                  <span className="text-slate-500">
                                    Bal: <span className="text-slate-300">{tx.balanceAfter}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedReceipt(tx)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 text-[10px] font-semibold border border-slate-800 hover:border-cyan-500/40 transition-colors flex items-center gap-1 shrink-0"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Receipt</span>
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* RECEIPT / INVOICE MODAL POPUP */}
            {selectedReceipt && (
              <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
                <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-emerald-500 to-indigo-500" />

                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-white font-['Syne'] uppercase">
                          Official Transaction Receipt
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          iCALLOG Studio V18 Media Engine
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedReceipt(null)}
                      className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Receipt Body */}
                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-400">Transaction Ref ID:</span>
                        <span className="font-mono font-bold text-white">{selectedReceipt.referenceId}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-400">Timestamp:</span>
                        <span className="font-mono text-slate-300">{new Date(selectedReceipt.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-400">Account User:</span>
                        <span className="text-white font-semibold">{user.name || user.username}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-400">User Email:</span>
                        <span className="text-cyan-400 font-mono">{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-400">Contact Mobile:</span>
                          <span className="text-slate-200 font-mono">{user.countryCode || '+91'} {user.phone}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-400">Payment Gateway:</span>
                        <span className="text-indigo-300 font-mono">{selectedReceipt.paymentMethod || 'SYSTEM_INTERNAL'}</span>
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="text-[10px] text-slate-400 font-mono uppercase font-bold border-b border-slate-800 pb-1">
                        Item Description & Summary
                      </div>
                      <div className="flex justify-between text-white font-medium">
                        <span>{selectedReceipt.description}</span>
                        <span
                          className={`font-mono font-bold ${
                            selectedReceipt.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {selectedReceipt.type === 'credit' ? '+' : '-'}{selectedReceipt.tokenAmount} Tokens
                        </span>
                      </div>
                      {selectedReceipt.amountRupees && (
                        <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800/60">
                          <span className="text-slate-400">Total Billed Amount:</span>
                          <span className="text-purple-300 font-bold font-mono">₹{selectedReceipt.amountRupees}.00 INR</span>
                        </div>
                      )}
                      {selectedReceipt.balanceAfter !== undefined && (
                        <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800/60 text-[11px]">
                          <span>Account Balance Remaining:</span>
                          <span className="font-mono text-cyan-400 font-bold">{selectedReceipt.balanceAfter} Tokens</span>
                        </div>
                      )}
                    </div>

                    {/* Security verification stamp */}
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/30 flex items-center justify-between text-[10px] text-emerald-400 font-mono">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>VERIFIED & AUDITED ON IMMUTABLE LOGS</span>
                      </div>
                      <span className="text-slate-500 font-mono">Status: COMPLETED</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(JSON.stringify(selectedReceipt, null, 2), selectedReceipt.referenceId)}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-800 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedReceipt(null)}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-900/30"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. LANGUAGE & REGION */}
            {activeTab === 'language' && (
              <div className="space-y-5">
                {/* Header Card */}
                <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-cyan-400">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white font-['Syne']">
                          {t('language_region')}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {t('choose_language')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                      <span className="text-xs text-slate-400">{t('current_language')}:</span>
                      <span className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-1.5">
                        <span>{currentLangOption.flag}</span>
                        <span>{currentLangOption.name}</span>
                        <span className="text-slate-400">({currentLangOption.nativeName})</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400">
                    {t('switch_language_desc')}
                  </p>

                  {/* Search Bar */}
                  <div className="relative pt-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={languageSearch}
                      onChange={(e) => setLanguageSearch(e.target.value)}
                      placeholder={t('search_language')}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
                    />
                    {languageSearch && (
                      <button
                        onClick={() => setLanguageSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Languages Grid */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                    <span>{t('all_languages')} ({SUPPORTED_LANGUAGES.filter((l) => {
                      const q = languageSearch.toLowerCase().trim();
                      if (!q) return true;
                      return (
                        l.name.toLowerCase().includes(q) ||
                        l.nativeName.toLowerCase().includes(q) ||
                        l.code.toLowerCase().includes(q) ||
                        l.region.toLowerCase().includes(q)
                      );
                    }).length})</span>
                    <span className="text-slate-500">18 supported</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {SUPPORTED_LANGUAGES.filter((lang) => {
                      const q = languageSearch.toLowerCase().trim();
                      if (!q) return true;
                      return (
                        lang.name.toLowerCase().includes(q) ||
                        lang.nativeName.toLowerCase().includes(q) ||
                        lang.code.toLowerCase().includes(q) ||
                        lang.region.toLowerCase().includes(q)
                      );
                    }).map((lang) => {
                      const isSelected = currentLanguage === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => handleSelectLanguage(lang.code)}
                          className={`p-3 rounded-2xl border text-left transition-all relative group flex items-start justify-between ${
                            isSelected
                              ? 'bg-gradient-to-r from-cyan-950/70 to-indigo-950/70 border-cyan-400 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-950/50'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl shrink-0 mt-0.5 select-none">{lang.flag}</span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-white font-['Syne']">
                                  {lang.nativeName}
                                </span>
                                {lang.dir === 'rtl' && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                                    RTL
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-300 font-medium">
                                {lang.name}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                {lang.region}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 ml-2">
                            {isSelected ? (
                              <div className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md shadow-cyan-500/40">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-600 font-mono uppercase group-hover:text-cyan-400 transition-colors">
                                {lang.code}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-between text-xs text-indigo-300">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Selected language is saved to your profile and auto-applied across the entire website.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] shrink-0 ml-3"
                  >
                    Back to Profile
                  </button>
                </div>
              </div>
            )}

            {/* VIP MEMBERSHIP & SUBSCRIPTION */}
            {activeTab === 'vip' && (
              <div className="space-y-4">
                <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-950 to-slate-950 border border-amber-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-lg">
                        👑
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white font-['Syne']">VIP PRO Active Status</h4>
                        <p className="text-[11px] text-amber-400 font-mono">Current Tier: {user.vipTier.toUpperCase()}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 text-xs font-extrabold uppercase">
                      Active
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                    <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-mono">VIP AI Credits</div>
                      <div className="text-base font-bold text-cyan-400 font-mono mt-0.5">{user.tokenBalance.toLocaleString()} ⚡</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-mono">Video Duration Limit</div>
                      <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">Unlimited 🚀</div>
                    </div>
                  </div>
                </div>

                {/* Master Creator Lifetime Free Pass Banner for Jay */}
                {isUserExplicitFree(user) && (
                  <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-indigo-950/70 border border-amber-500/60 shadow-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-xl bg-amber-500 text-black font-black text-xs">👑 CREATOR PASS</span>
                        <h4 className="text-xs font-black text-amber-300 font-['Syne'] uppercase tracking-wider">
                          100% Free Lifetime Master Access Active (₹0)
                        </h4>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold">
                        FREE LIFETIME ACTIVE
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Welcome, <span className="text-white font-bold">{user.name || 'Master Creator'}</span>! Your account has permanent, zero-cost access to all VIP features, unrestricted 8K renders, and the entire <strong className="text-amber-300">Exclusive Content Suite (All Genres & 18+ Uncensored)</strong> without requiring any token deductions or payments.
                    </p>
                  </div>
                )}

                {/* Free vs Premium Plan Comparison Matrix */}
                <div className="p-4 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white font-['Syne'] uppercase tracking-wider flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-400" /> Free Plan vs Premium VIP Plan Breakdown
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newTier = user.vipTier === 'free' ? 'gold' : 'free';
                        onUpdateUser({ ...user, vipTier: newTier });
                        onNotify('Plan Toggled', `Switched active account mode to: ${newTier.toUpperCase()}`, 'info');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-950 border border-indigo-700 text-cyan-300 text-[10px] font-bold font-mono hover:bg-indigo-900 transition-colors"
                    >
                      Toggle Current Mode: {user.vipTier === 'free' ? '🆓 FREE' : '👑 PREMIUM VIP'}
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                          <th className="py-2 px-2">Studio Feature</th>
                          <th className="py-2 px-2 text-slate-400 bg-slate-900/60">🆓 Free Plan</th>
                          <th className="py-2 px-2 text-amber-300 bg-amber-950/30">👑 Premium VIP Plan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 text-slate-300 font-sans">
                        <tr className="bg-amber-500/5">
                          <td className="py-2.5 px-2 font-black text-amber-300 flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                            Exclusive Content (एक्सक्लूसिव कंटेंट • 18+ Unrestricted)
                          </td>
                          <td className="py-2.5 px-2 text-red-400/80 bg-slate-900/40 font-mono">
                            ❌ Locked / Filtered (Safe General Only)
                          </td>
                          <td className="py-2.5 px-2 font-bold text-amber-300 bg-amber-950/30">
                            🔥 Fully Unlocked (All 9+ Mature, Dark Fantasy, Erotic Thriller, Horror & Crime Genres)
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2 font-bold text-slate-200">Image Studio Max Resolution</td>
                          <td className="py-2 px-2 text-slate-400 bg-slate-900/40">720p HD Standard</td>
                          <td className="py-2 px-2 font-bold text-cyan-300 bg-amber-950/20">8K Ultra-HD (7680×4320)</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2 font-bold text-slate-200">Video & Render Length</td>
                          <td className="py-2 px-2 text-slate-400 bg-slate-900/40">Max 15 Seconds</td>
                          <td className="py-2 px-2 font-bold text-emerald-300 bg-amber-950/20">Unlimited Length (60 FPS)</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2 font-bold text-slate-200">Film Studio Screenplays</td>
                          <td className="py-2 px-2 text-slate-400 bg-slate-900/40">Max 1 Scene (Opening Hook)</td>
                          <td className="py-2 px-2 font-bold text-amber-300 bg-amber-950/20">Unlimited 100+ Scenes</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2 font-bold text-slate-200">Song & Audio Mixer</td>
                          <td className="py-2 px-2 text-slate-400 bg-slate-900/40">Max 2 Tracks</td>
                          <td className="py-2 px-2 font-bold text-purple-300 bg-amber-950/20">Unlimited Stems & Studio WAV</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2 font-bold text-slate-200">Watermark / Branding</td>
                          <td className="py-2 px-2 text-slate-400 bg-slate-900/40">Watermarked Previews</td>
                          <td className="py-2 px-2 font-bold text-emerald-400 bg-amber-950/20">Zero Watermark & Commercial Use</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2 font-bold text-slate-200">GPU Priority & Speed</td>
                          <td className="py-2 px-2 text-slate-400 bg-slate-900/40">Standard Queue</td>
                          <td className="py-2 px-2 font-bold text-amber-300 bg-amber-950/20">High-Speed Ultra Priority GPU</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Role & Persona Customized Plan Selector (₹199 - ₹1,999) */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-black text-white block uppercase tracking-wider font-['Syne']">
                        VIP Plans Customized for Role & Persona (₹199 - ₹1,999)
                      </label>
                      <p className="text-[11px] text-slate-400">
                        Select a profile role below to view tailored plans with role-specific tools, tokens & Exclusive Content.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-cyan-300 text-[10px] font-mono font-bold">
                      Active Role: {selectedPersonaForPlans.toUpperCase()}
                    </span>
                  </div>

                  {/* Persona Role Switcher Pills */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    {[
                      { id: 'teacher', label: 'Teacher', emoji: '🎓' },
                      { id: 'student', label: 'Student', emoji: '🎒' },
                      { id: 'creator', label: 'Creator', emoji: '🎬' },
                      { id: 'professional', label: 'Pro / VFX', emoji: '💼' },
                      { id: 'general', label: 'General', emoji: '✨' },
                      { id: 'guest', label: 'Guest', emoji: '👤' },
                    ].map((pRole) => {
                      const isRoleActive = selectedPersonaForPlans === pRole.id;
                      return (
                        <button
                          key={pRole.id}
                          type="button"
                          onClick={() => setSelectedPersonaForPlans(pRole.id as PersonaType)}
                          className={`py-1.5 px-2 rounded-xl text-center text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
                            isRoleActive
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50 scale-[1.02]'
                              : 'bg-slate-950/40 text-slate-400 hover:text-white hover:bg-slate-800/60'
                          }`}
                        >
                          <span className="text-sm">{pRole.emoji}</span>
                          <span className="text-[11px] truncate">{pRole.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Dynamic Persona Plan Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {personaPlansList.map((p) => {
                      const isSelected = selectedPlan.id === p.id || selectedPlan.name === p.name;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedPlan(p);
                            setShowQr(false);
                          }}
                          className={`p-4 rounded-2xl text-left border relative transition-all ${
                            isSelected
                              ? 'bg-gradient-to-b from-indigo-950/80 via-slate-900 to-slate-900 border-cyan-400 shadow-xl shadow-cyan-950/30'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {p.popular && (
                            <span className="absolute -top-2 right-3 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md">
                              🔥 BEST VALUE +1 MO
                            </span>
                          )}
                          <div className="flex justify-between items-start mb-1.5">
                            <div>
                              <div className="text-xs font-black text-white font-['Syne']">{p.name}</div>
                              <div className="text-[10px] text-slate-400">{p.hindiName}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-base font-black font-['Syne'] text-cyan-400">
                                ₹{p.price}
                              </div>
                              <div className="text-[9px] font-mono text-slate-400">
                                {p.durationMonths} Mo {p.bonusMonths > 0 ? `+${p.bonusMonths} Mo` : ''}
                              </div>
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-300 mb-2 leading-tight">{p.description}</div>

                          {/* Exclusive Content Badge */}
                          {p.hasExclusiveContent ? (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold mb-2">
                              <Flame className="w-3 h-3 text-orange-400" />
                              {p.exclusiveContentBadge || 'Includes Exclusive Content (18+ & All Genres)'}
                            </div>
                          ) : (
                            <div className="text-[10px] font-mono text-slate-500 mb-2">
                              Standard General Content
                            </div>
                          )}

                          {/* Key Role Features */}
                          <div className="space-y-0.5 border-t border-slate-800/80 pt-1.5">
                            {p.roleBenefits.slice(0, 3).map((b, i) => (
                              <div key={i} className="text-[10px] text-slate-400 flex items-center gap-1.5">
                                <span className="text-cyan-400 font-bold">✓</span> {b}
                              </div>
                            ))}
                          </div>

                          <div className="mt-2.5 flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] font-mono">
                            <span className="text-emerald-400 font-bold">+{p.tokenBonus.toLocaleString()} ⚡ AI Credits</span>
                            <span className="text-slate-400">Unlimited Video</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">Select Payment Method</label>
                  <div className="flex flex-wrap gap-2">
                    {['GPay', 'PhonePe', 'Paytm', 'Net Banking', 'Cards'].map((app) => (
                      <button
                        key={app}
                        type="button"
                        onClick={() => setPaymentMethod(app as typeof paymentMethod)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          paymentMethod === app
                            ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                            : 'bg-slate-800/60 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {app}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  {!showQr ? (
                    <button
                      type="button"
                      onClick={() => setShowQr(true)}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 uppercase tracking-wide"
                    >
                      <CreditCard className="w-4 h-4" /> Proceed to Pay ₹{selectedPlan.price} via {paymentMethod}
                    </button>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="text-xs font-bold text-white uppercase tracking-wider font-['Syne']">
                          {paymentMethod === 'Cards' && 'Credit / Debit Card Secure Checkout'}
                          {paymentMethod === 'Net Banking' && 'Select Bank for Net Banking'}
                          {['GPay', 'PhonePe', 'Paytm'].includes(paymentMethod) && `${paymentMethod} UPI Checkout`}
                        </div>
                        <span className="text-xs font-mono font-bold text-cyan-400">₹{selectedPlan.price}</span>
                      </div>

                      {paymentMethod === 'Cards' && (
                        <div className="space-y-3 pt-1">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Cardholder Name</label>
                            <input
                              type="text"
                              value={cardHolder}
                              onChange={(e) => setCardHolder(e.target.value)}
                              placeholder="Name on Card"
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Card Number</label>
                            <input
                              type="text"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                              placeholder="4532 •••• •••• 7890"
                              maxLength={19}
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Expiry (MM/YY)</label>
                              <input
                                type="text"
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(e.target.value)}
                                placeholder="12/28"
                                maxLength={5}
                                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">CVV / PIN</label>
                              <input
                                type="password"
                                value={cardCvv}
                                onChange={(e) => setCardCvv(e.target.value)}
                                placeholder="•••"
                                maxLength={4}
                                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'Net Banking' && (
                        <div className="space-y-3 pt-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Choose Popular Bank</label>
                          <div className="grid grid-cols-2 gap-2">
                            {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'].map((bank) => (
                              <button
                                key={bank}
                                type="button"
                                onClick={() => setSelectedBank(bank)}
                                className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition-all ${
                                  selectedBank === bank
                                    ? 'bg-indigo-600 text-white border-indigo-400'
                                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                {bank}
                              </button>
                            ))}
                          </div>
                          <div className="text-[11px] font-mono text-emerald-400 pt-1">
                            Selected: {selectedBank} (Secure 2FA Gateway)
                          </div>
                        </div>
                      )}

                      {['GPay', 'PhonePe', 'Paytm'].includes(paymentMethod) && (
                        <div className="text-center space-y-3 py-1">
                          <div className="w-32 h-32 mx-auto bg-white p-2 rounded-xl flex items-center justify-center">
                            <div className="w-full h-full bg-slate-900 flex items-center justify-center text-cyan-400 text-xs font-mono font-bold p-2 text-center">
                              [UPI QR] {paymentMethod.toLowerCase()}@icici ₹{selectedPlan.price}
                            </div>
                          </div>
                          <div>
                            <input
                              type="text"
                              value={upiId}
                              onChange={(e) => setUpiId(e.target.value)}
                              placeholder="user@oksbi"
                              className="w-full max-w-xs mx-auto px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono text-center focus:border-cyan-500 focus:outline-none block"
                            />
                          </div>
                        </div>
                      )}

                      <div className="text-[11px] text-slate-400 font-mono text-center">
                        Secure Reference ID: TXN-{Math.random().toString(36).substring(2, 10).toUpperCase()}
                      </div>

                      <div className="flex gap-2 justify-center pt-2">
                        <button
                          type="button"
                          onClick={() => setShowQr(false)}
                          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSimulatePayment}
                          disabled={isProcessing}
                          className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg flex items-center gap-2"
                        >
                          {isProcessing ? 'Verifying 2FA...' : `Pay ₹${selectedPlan.price} & Activate VIP`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-2 font-mono">
                  <div className="font-bold text-slate-200">VIP Member Benefits:</div>
                  <div>• Unlimited 8K Video Generation & Audio Conversion</div>
                  <div>• Priority Queue Access with 0ms Delay</div>
                  <div>• Exclusive Holographic Badges & Premium Templates</div>
                </div>
              </div>
            )}

            {/* 2. LOGIN / SIGNUP & GUEST ACCOUNT ACCESS */}
            {activeTab === 'auth' && (
              <div className="space-y-4">
                {/* Mode Selector */}
                <div className="flex flex-wrap items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-semibold gap-1">
                  <button
                    type="button"
                    onClick={() => setAuthMode('signin')}
                    className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                      authMode === 'signin' ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-900/40' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In (लॉगिन)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('signup')}
                    className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                      authMode === 'signup' ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/40' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create Account (नया खाता)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleContinueAsGuest}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-amber-300 border border-amber-500/40 hover:border-amber-400 text-xs font-bold transition-all flex items-center gap-1.5 ml-auto shadow-sm"
                    title="Use instantly without password"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Use as Guest (गेस्ट खाता)</span>
                  </button>
                </div>

                {/* Guest Account Info Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
                  <div className="space-y-1">
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>👤 Guest Sandbox vs 🔐 Registered Account</span>
                      {user.isGuestAccount && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono">
                          Current: Guest Mode
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Anyone can explore 14+ AI creative studios as a <strong>Guest</strong> without signing up (includes 50 starter demo tokens). <strong>Sign in</strong> to sync cloud saves, create sub-profiles, and unlock permanent project vaults.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleContinueAsGuest}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shrink-0 transition-all shadow-md shadow-amber-950/30"
                  >
                    Continue as Guest
                  </button>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-4 pt-1">
                  {authMode === 'signup' && (
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Your Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Alex Sterling"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="operator@icallog.studio"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-none pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
                  >
                    {authMode === 'signin' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {authMode === 'signin' ? 'Sign In to iCALLOG Gateway' : 'Create New Account & Initialize'}
                  </button>
                </form>
              </div>
            )}

            {/* 3. PASSWORD & SECURITY */}
            {activeTab === 'security' && (
              <div className="space-y-5">
                {/* Session Token & Auto-Save Life-Cycle Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 border border-amber-500/40 shadow-xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
                        <Key className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white font-['Syne']">Session Token & Auto-Save Security</h4>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Live token lifecycle & 2-minute pre-expiration auto-save protection
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-500/50 text-emerald-400">
                      TOKEN ACTIVE
                    </span>
                  </div>

                  {/* Countdown & Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Session Token Remaining</div>
                      <div className="text-sm font-mono font-bold text-amber-300 mt-0.5">
                        {modalSessionSecs > 0 ? (
                          `${Math.floor(modalSessionSecs / 60)}m ${(modalSessionSecs % 60).toString().padStart(2, '0')}s`
                        ) : (
                          <span className="text-rose-400">Expired</span>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Auto-Save Warning Trigger</div>
                      <div className="text-sm font-mono font-bold text-cyan-300 mt-0.5">
                        2 min (120s)
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 col-span-2 sm:col-span-1">
                      <div className="text-[10px] text-slate-400">Auto-Save Vault Status</div>
                      <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                        {modalSession.lastAutoSavedAt ? 'Draft Saved' : 'Armed & Ready'}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-amber-200/80 bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/40 leading-relaxed">
                    💡 An <strong>Auto-Save Warning Notification</strong> appears exactly <strong>2 minutes</strong> before your session token expires, prompting you to save all work or extend your session so no project data is ever lost.
                  </p>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const res = executeAutoSave('User clicked Save Work in Security Settings');
                        if (res.success) {
                          onNotify('Auto-Save Executed', `Work saved to recovery vault at ${res.savedAt} (${res.itemsCount} records).`, 'success');
                          refreshStorageMetrics();
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                      <HardDrive className="w-3.5 h-3.5 text-cyan-400" /> Save Work Now
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const updated = await extendSessionToken(15);
                        setModalSession(updated);
                        setModalSessionSecs(Math.max(0, Math.floor((updated.expiresAt - Date.now()) / 1000)));
                        onNotify('Session Extended', 'Security token refreshed for +15 minutes.', 'success');
                      }}
                      className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black shadow-md flex items-center gap-1.5 transition-transform hover:scale-102"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-slate-950" /> Extend Session (+15m)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = simulateSessionExpiryInSeconds(115);
                        setModalSession(updated);
                        setModalSessionSecs(115);
                        onNotify(
                          '2-Min Warning Simulated',
                          'Token set to 1m 55s remaining. Close modal or view top-right for the Auto-Save Warning notification!',
                          'warning'
                        );
                      }}
                      title="Test the 2-minute pre-expiration auto-save warning notification immediately"
                      className="px-3 py-2 rounded-xl bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5 text-cyan-400" /> Simulate 2-Min Warning
                    </button>
                  </div>
                </div>

                {/* Password Change Form */}
                <form onSubmit={handlePasswordChange} className="space-y-4 pt-1">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">New Secure Password</label>
                    <input
                      type="password"
                      placeholder="At least 6 characters"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-amber-500 focus:outline-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-900/30 flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" /> Update Password
                  </button>
                </form>
              </div>
            )}

            {/* 4. THEME & DISPLAY */}
            {activeTab === 'theme' && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-white font-['Syne']">Theme & Display Appearance</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Select your preferred color scheme or match your operating system.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isDarkMode) toggleDarkMode();
                        onNotify('Theme Applied', 'Dark Mode activated.', 'info');
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        isDarkMode
                          ? 'bg-purple-950/60 border-purple-500 text-white shadow-lg shadow-purple-950'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-sm mb-1">🌙</div>
                      <div className="text-xs font-bold text-white">Dark Mode</div>
                      <div className="text-[10px] text-slate-400">Cyberpunk luxury theme</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (isDarkMode) toggleDarkMode();
                        onNotify('Theme Applied', 'Light Mode activated.', 'info');
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        !isDarkMode
                          ? 'bg-amber-950/40 border-amber-500 text-white shadow-lg shadow-amber-950'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-sm mb-1">☀️</div>
                      <div className="text-xs font-bold text-white">Light Mode</div>
                      <div className="text-[10px] text-slate-400">Clean high-contrast</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                        if (prefersDark !== isDarkMode) toggleDarkMode();
                        onNotify('Theme Applied', 'Synced with System Default preference.', 'success');
                      }}
                      className="p-3.5 rounded-xl border bg-slate-900 border-slate-800 hover:border-cyan-500 text-left transition-all text-slate-300"
                    >
                      <div className="text-sm mb-1">💻</div>
                      <div className="text-xs font-bold text-white">System Default</div>
                      <div className="text-[10px] text-slate-400">Auto match OS settings</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 5. PRIVACY & DATA */}
            {activeTab === 'privacy' && (
              <div className="space-y-4 text-xs">
                {/* Embedded Cookies & Permissions launcher inside Profile Privacy */}
                <div className="p-4 rounded-2xl bg-cyan-950/25 border border-cyan-800/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cookie className="w-4 h-4 text-cyan-400" />
                      <h4 className="font-bold text-white font-['Syne']">Cookies & Storage Permissions</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('cookies')}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all hover:scale-102"
                    >
                      <Cookie className="w-3.5 h-3.5" />
                      <span>Manage Permissions</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Control LocalStorage persistence, IndexedDB records, session cookies, Camera & Microphone access, Geolocation context, and WebGL GPU hardware acceleration.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="font-bold text-white font-['Syne']">Privacy & Cloud Data Controls</h4>
                  
                  <label className="flex items-center justify-between cursor-pointer py-1">
                    <span className="text-slate-300">Enable Cloud Vault Auto-Sync</span>
                    <input
                      type="checkbox"
                      checked={dataSync}
                      onChange={(e) => setDataSync(e.target.checked)}
                      className="accent-cyan-500 w-4 h-4 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer py-1">
                    <span className="text-slate-300">Public Creator Portfolio Indexing</span>
                    <input
                      type="checkbox"
                      checked={publicProfile}
                      onChange={(e) => setPublicProfile(e.target.checked)}
                      className="accent-cyan-500 w-4 h-4 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer py-1">
                    <span className="text-slate-300">Share Anonymous Telemetry & Crash Reports</span>
                    <input
                      type="checkbox"
                      checked={analyticsOptIn}
                      onChange={(e) => setAnalyticsOptIn(e.target.checked)}
                      className="accent-cyan-500 w-4 h-4 rounded"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* 6. COOKIES & STORAGE PERMISSIONS SUITE */}
            {activeTab === 'cookies' && (
              <div className="space-y-4 text-xs">
                {/* Top Banner with Real-time Diagnostics */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/50 via-slate-900 to-indigo-950/40 border border-cyan-800/60 shadow-lg space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-lg flex items-center justify-center shrink-0">
                        <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                          <Cookie className="w-5 h-5 text-cyan-400" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
                          <span>Cookies & Storage Center</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/80 font-bold">
                            ENCRYPTED
                          </span>
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Complete control over browser cookies, offline storage vault, and hardware device APIs.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={refreshStorageMetrics}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
                        title="Refresh Storage Metrics"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Refresh Stats</span>
                      </button>
                    </div>
                  </div>

                  {/* Storage Capacity & Live Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <HardDrive className="w-3 h-3 text-cyan-400" /> Storage Used
                      </div>
                      <div className="text-sm font-black text-cyan-300 font-mono mt-0.5">
                        ~{storageMetrics.usedKb} KB
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <FileText className="w-3 h-3 text-emerald-400" /> Saved Records
                      </div>
                      <div className="text-sm font-black text-emerald-300 font-mono mt-0.5">
                        {storageMetrics.itemsCount} Keys
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-indigo-400" /> Studio Vault
                      </div>
                      <div className="text-sm font-black text-indigo-300 font-mono mt-0.5">
                        {storageMetrics.projectsCount} Projects
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Cookie className="w-3 h-3 text-amber-400" /> Session Cookie
                      </div>
                      <div className="text-sm font-black text-amber-300 font-mono mt-0.5">
                        Active
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Worker & IndexedDB Offline Architecture Panel */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/50 border border-indigo-500/40 shadow-xl space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white font-['Syne'] flex items-center gap-2">
                          <span>Service Worker & IndexedDB Offline Architecture</span>
                          {swActive ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-950 border border-emerald-500/50 text-emerald-400">
                              SW ACTIVE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-950 border border-amber-500/50 text-amber-400">
                              SW REGISTERED
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          Pre-caches critical app shell and retains user state in browser IndexedDB database (<code className="text-cyan-300">iCALLOG_OfflineDB_v1</code>)
                        </p>
                      </div>
                    </div>

                    {/* Online / Offline Status Badge */}
                    <div className="flex items-center gap-1.5">
                      {isSimOffline ? (
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold bg-amber-950/80 border border-amber-500/70 text-amber-300 flex items-center gap-1">
                          <WifiOff className="w-3 h-3" /> OFFLINE MODE
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold bg-emerald-950/80 border border-emerald-500/70 text-emerald-300 flex items-center gap-1">
                          <Wifi className="w-3 h-3" /> ONLINE & READY
                        </span>
                      )}
                    </div>
                  </div>

                  {/* IndexedDB Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div className="text-[10px] text-slate-400">IndexedDB Projects</div>
                      <div className="text-sm font-mono font-bold text-cyan-300 mt-0.5">
                        {offlineDiag ? offlineDiag.projectsCount : '—'} Saved
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div className="text-[10px] text-slate-400">User State Cache</div>
                      <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                        {offlineDiag?.userStateSaved ? 'Cached & Armed' : 'Pending'}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Offline Sync Queue</div>
                      <div className="text-sm font-mono font-bold text-amber-400 mt-0.5">
                        {offlineDiag ? offlineDiag.pendingQueueCount : 0} Pending
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Database Schema</div>
                      <div className="text-sm font-mono font-bold text-indigo-300 mt-0.5">
                        v{offlineDiag ? offlineDiag.dbVersion : 1}
                      </div>
                    </div>
                  </div>

                  {/* Interactive Offline Controls & Server Database Hard-Refresh Panel */}
                  <div className="space-y-3 pt-1">
                    {/* Hard Refresh Toggle Bar */}
                    <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 flex items-center justify-between gap-3 shadow-inner">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
                          <RefreshCw className={`w-4 h-4 text-cyan-400 ${isHardRefreshing ? 'animate-spin' : ''}`} />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-white flex items-center gap-2">
                            <span>Force Hard-Refresh Local IndexedDB vs Server Database</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-bold">
                              AUTHORITATIVE SYNC
                            </span>
                          </h5>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Purges local IndexedDB cache and pulls canonical user state directly from the server backend.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                            {forceServerSyncToggle ? 'Auto-Sync Enabled' : 'Manual Only'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = !forceServerSyncToggle;
                              setForceServerSyncToggle(next);
                              try {
                                localStorage.setItem('icallog_force_server_sync_toggle_v1', String(next));
                              } catch {
                                // ignore
                              }
                              onNotify(
                                'Hard-Refresh Policy',
                                next ? 'IndexedDB hard refresh on server reconnect is enabled.' : 'Server hard refresh set to manual mode.',
                                'info'
                              );
                            }}
                            className={`w-11 h-6 rounded-full p-1 transition-colors relative ${
                              forceServerSyncToggle ? 'bg-cyan-500' : 'bg-slate-800'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                                forceServerSyncToggle ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={isHardRefreshing}
                        onClick={async () => {
                          setIsHardRefreshing(true);
                          try {
                            const result = await forceHardRefreshIndexedDB(user);
                            if (result.success && result.user) {
                              onUpdateUser(result.user);
                              const diag = await getOfflineStorageDiagnostics();
                              setOfflineDiag(diag);
                              onNotify('Hard Refresh Complete', result.message, 'success');
                            } else {
                              onNotify('Hard Refresh Notice', result.message, 'warning');
                            }
                          } catch (err: any) {
                            onNotify('Hard Refresh Error', err.message || 'Server sync failed', 'error');
                          } finally {
                            setIsHardRefreshing(false);
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-950 flex items-center gap-1.5 transition-all hover:scale-105 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isHardRefreshing ? 'animate-spin' : ''}`} />
                        <span>{isHardRefreshing ? 'Hard Refreshing...' : 'Force Hard-Refresh IndexedDB Now'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          await saveUserStateToIDB(user);
                          const diag = await getOfflineStorageDiagnostics();
                          setOfflineDiag(diag);
                          onNotify('IndexedDB Synced', 'User state and project models committed to IndexedDB vault.', 'success');
                        }}
                        className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-950 flex items-center gap-1.5 transition-colors"
                      >
                        <Database className="w-3.5 h-3.5" /> Sync to IndexedDB Now
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const next = !isSimOffline;
                          setSimulatedOffline(next);
                          setIsSimOffline(next);
                          onNotify(
                            next ? 'Offline Mode Active' : 'Network Reconnected',
                            next
                              ? 'Operating from IndexedDB & Service Worker cache. Offline status banner is now visible.'
                              : 'Online connectivity restored. Synchronization engine active.',
                            next ? 'warning' : 'success'
                          );
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors ${
                          isSimOffline
                            ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-700/50'
                        }`}
                      >
                        {isSimOffline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                        <span>{isSimOffline ? 'Exit Offline Simulation' : 'Simulate Offline Mode'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          await clearAllOfflineData();
                          const diag = await getOfflineStorageDiagnostics();
                          setOfflineDiag(diag);
                          onNotify('IndexedDB Flushed', 'Offline object stores reset successfully.', 'info');
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-rose-400 text-xs font-medium border border-slate-800 transition-colors"
                      >
                        Clear IndexedDB
                      </button>
                    </div>
                  </div>
                </div>

                {/* Permissions Toggles List */}
                <div className="space-y-2.5">
                  {/* 1. Essential Storage & Security Cookies */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                        <HardDrive className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-2">
                          <span>Essential Storage & Security Cookies</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-bold">
                            REQUIRED
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Stores your user profile, active project workspaces, and encrypted authentication state locally.
                        </p>
                      </div>
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-800 shrink-0">
                      Always Active
                    </div>
                  </div>

                  {/* 2. Geolocation & Regional AI Context */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-2">
                          <span>Geolocation & Regional AI Context</span>
                          {locationStatus !== 'Not requested' && (
                            <span className="text-[9px] font-mono text-cyan-300">({locationStatus})</span>
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Enables localized language suggestions, regional weather context, and nearby venue search.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleCookiePermission('location')}
                      className={`w-11 h-6 rounded-full p-1 transition-colors relative shrink-0 ${
                        cookiePermissions.location ? 'bg-cyan-500' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                          cookiePermissions.location ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 3. Camera & Microphone Access */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center shrink-0">
                        <Camera className="w-4 h-4 text-pink-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-2">
                          <span>Camera & Microphone Media Access</span>
                          <span className="text-[9px] font-mono text-pink-300">({micCameraStatus})</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Empowers AI Voice Studio recording, live camera meme creation, and avatar photography.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleCookiePermission('mediaDevices')}
                      className={`w-11 h-6 rounded-full p-1 transition-colors relative shrink-0 ${
                        cookiePermissions.mediaDevices ? 'bg-pink-500' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                          cookiePermissions.mediaDevices ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 4. Browser Push Notifications */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-2">
                          <span>Push Notifications & AI Alerts</span>
                          <span className="text-[9px] font-mono text-amber-300">({notificationStatus})</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Sends desktop alerts when long 8K video renders, song generation, or script exports finish.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleCookiePermission('notifications')}
                      className={`w-11 h-6 rounded-full p-1 transition-colors relative shrink-0 ${
                        cookiePermissions.notifications ? 'bg-amber-500' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                          cookiePermissions.notifications ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 5. WebGL & GPU Hardware Acceleration */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
                        <Cpu className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">WebGL & GPU Hardware Acceleration</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Direct GPU shader execution for 3D viewport canvas, Three.js models, and 60fps animations.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleCookiePermission('gpuHardware')}
                      className={`w-11 h-6 rounded-full p-1 transition-colors relative shrink-0 ${
                        cookiePermissions.gpuHardware ? 'bg-purple-500' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                          cookiePermissions.gpuHardware ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 6. Performance Diagnostics & Telemetry */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0">
                        <BarChart3 className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Performance Metrics & Diagnostics</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Anonymous memory and frame rate metrics to optimize performance and prevent crashes.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleCookiePermission('analytics')}
                      className={`w-11 h-6 rounded-full p-1 transition-colors relative shrink-0 ${
                        cookiePermissions.analytics ? 'bg-indigo-500' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                          cookiePermissions.analytics ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Storage Maintenance & Bulk Action Controls */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="font-bold text-white font-['Syne'] flex items-center justify-between">
                    <span>Storage Maintenance & Reset</span>
                    <span className="text-[10px] text-slate-400 font-mono">Last verified: {storageMetrics.lastSavedTime}</span>
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleClearTemporaryStorage}
                      className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Flush Temp Cache</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetEssentialCookies}
                      className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
                    >
                      <span>Essential Only</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => saveCookiePermissions(cookiePermissions)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-900/30 flex items-center gap-1.5 transition-all"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Save Current Preferences</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAcceptAllCookies}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-900/30 flex items-center gap-1.5 transition-all"
                    >
                      <Check className="w-4 h-4" />
                      <span>Accept All Permissions</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 5.5. VOICE PREFERENCES & MICROPHONE SENSITIVITY */}
            {activeTab === 'voice' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Header Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-indigo-950/40 to-slate-900 border border-rose-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-950">
                      <Mic className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-sm font-['Syne']">Voice Preferences & Mic Calibration</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-900/60 text-rose-300 border border-rose-700/50">
                          Web Speech API
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Calibrate microphone sensitivity and speech recognition confidence thresholds to reject background noise in noisy environments.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <button
                      type="button"
                      onClick={handleResetVoicePreferences}
                      className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-all"
                    >
                      Reset Defaults
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveVoicePreferences}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-rose-900/30 flex items-center gap-1.5 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Save
                    </button>
                  </div>
                </div>

                {/* Environmental Presets */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-rose-400" />
                      <span>Quick Environmental Calibration Presets</span>
                    </label>
                    <span className="text-[11px] text-slate-400">1-click acoustic profiling</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleVoicePrefChange({
                          micSensitivity: 25,
                          confidenceThreshold: 0.8,
                          noiseSuppressionMode: 'high',
                        })
                      }
                      className={`p-3 rounded-xl border text-left transition-all ${
                        voicePrefs.micSensitivity <= 35 && voicePrefs.noiseSuppressionMode === 'high'
                          ? 'bg-rose-950/50 border-rose-500 shadow-md shadow-rose-950'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">Noisy / Cafe</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-900/80 text-rose-200 font-mono">
                          25%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Strict filtering. Rejects chatter, HVAC, and coffee shop clatter.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleVoicePrefChange({
                          micSensitivity: 60,
                          confidenceThreshold: 0.55,
                          noiseSuppressionMode: 'auto',
                        })
                      }
                      className={`p-3 rounded-xl border text-left transition-all ${
                        voicePrefs.micSensitivity > 35 && voicePrefs.micSensitivity <= 70
                          ? 'bg-indigo-950/50 border-indigo-500 shadow-md shadow-indigo-950'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">Balanced / Office</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-900/80 text-indigo-200 font-mono">
                          60%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Recommended for standard rooms, laptops, and headset mics.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleVoicePrefChange({
                          micSensitivity: 85,
                          confidenceThreshold: 0.4,
                          noiseSuppressionMode: 'off',
                        })
                      }
                      className={`p-3 rounded-xl border text-left transition-all ${
                        voicePrefs.micSensitivity > 70
                          ? 'bg-emerald-950/50 border-emerald-500 shadow-md shadow-emerald-950'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">Quiet Studio</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-900/80 text-emerald-200 font-mono">
                          85%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        High sensitivity. Captures soft whispers and distant speaking.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Primary Feature: Microphone Sensitivity Slider */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-xs font-['Syne']">Microphone Sensitivity Slider</h4>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                            voicePrefs.micSensitivity <= 35
                              ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                              : voicePrefs.micSensitivity <= 70
                              ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                          }`}
                        >
                          {voicePrefs.micSensitivity <= 35
                            ? 'High Noise Rejection'
                            : voicePrefs.micSensitivity <= 70
                            ? 'Balanced Sensitivity'
                            : 'Maximum Pickup'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Adjust to tune speech thresholding. Lower values require higher voice volume and filter out ambient murmurs.
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-2xl font-black text-rose-400 font-mono">{voicePrefs.micSensitivity}%</span>
                    </div>
                  </div>

                  {/* Range Slider */}
                  <div className="space-y-2">
                    <input
                      id="voice-mic-sensitivity-slider"
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={voicePrefs.micSensitivity}
                      onChange={(e) => handleVoicePrefChange({ micSensitivity: parseInt(e.target.value, 10) })}
                      className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 focus:outline-none"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono px-0.5">
                      <span>0% (Aggressive Noise Gate)</span>
                      <span>50% (Standard)</span>
                      <span>100% (High Gain / Whisper)</span>
                    </div>
                  </div>

                  {/* Visual Sensitivity Zone Gauge */}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                    <div
                      className={`p-2.5 rounded-xl border transition-all ${
                        voicePrefs.micSensitivity <= 35
                          ? 'bg-rose-950/40 border-rose-500/80 text-rose-200'
                          : 'bg-slate-900/30 border-slate-800/60 text-slate-400'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5 mb-0.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        Noisy Room (0-35%)
                      </div>
                      <p className="text-[10px] text-slate-400">Strict confidence gate; drops ambient clicks.</p>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border transition-all ${
                        voicePrefs.micSensitivity > 35 && voicePrefs.micSensitivity <= 70
                          ? 'bg-indigo-950/40 border-indigo-500/80 text-indigo-200'
                          : 'bg-slate-900/30 border-slate-800/60 text-slate-400'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5 mb-0.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        Balanced (36-70%)
                      </div>
                      <p className="text-[10px] text-slate-400">Default for office environments.</p>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border transition-all ${
                        voicePrefs.micSensitivity > 70
                          ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-200'
                          : 'bg-slate-900/30 border-slate-800/60 text-slate-400'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5 mb-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Sensitive (71-100%)
                      </div>
                      <p className="text-[10px] text-slate-400">Picks up low-volume speaking & whispers.</p>
                    </div>
                  </div>
                </div>

                {/* Live Microphone VU Meter & Noise Floor Tester */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-xs font-['Syne'] flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        <span>Live Noise Floor & Mic Level Tester</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Speak normally or remain silent to visually verify that background noise does not breach the threshold.
                      </p>
                    </div>
                    <button
                      id="voice-test-mic-vu-btn"
                      type="button"
                      onClick={handleToggleTestMic}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isTestingMic
                          ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-900/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {isTestingMic ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5" /> Stop Mic Test
                        </>
                      ) : (
                        <>
                          <Radio className="w-3.5 h-3.5 text-rose-400" /> Test Microphone Level
                        </>
                      )}
                    </button>
                  </div>

                  {/* VU Level Bar */}
                  <div className="space-y-2 pt-1">
                    <div className="relative h-6 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 p-0.5">
                      {/* Audio Level Fill */}
                      <div
                        className={`h-full rounded transition-all duration-75 ${
                          micStatus === 'clipping'
                            ? 'bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500'
                            : micStatus === 'voice'
                            ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                            : 'bg-slate-700'
                        }`}
                        style={{ width: `${isTestingMic ? micVuLevel : 0}%` }}
                      />

                      {/* Threshold Gate Needle */}
                      {isTestingMic && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-rose-400 shadow-md shadow-rose-500 z-10"
                          style={{
                            left: `${Math.max(10, Math.round(70 - (voicePrefs.micSensitivity / 100) * 55))}%`,
                          }}
                        >
                          <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 rounded-full bg-rose-400" />
                        </div>
                      )}

                      {!isTestingMic && (
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                          Click "Test Microphone Level" to monitor live ambient audio
                        </div>
                      )}
                    </div>

                    {/* Meter Status Badges */}
                    {isTestingMic && (
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[10px] flex items-center gap-1 ${
                              micStatus === 'voice'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : micStatus === 'clipping'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-slate-900 text-slate-400 border border-slate-800'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                micStatus === 'voice'
                                  ? 'bg-emerald-400 animate-pulse'
                                  : micStatus === 'clipping'
                                  ? 'bg-rose-400'
                                  : 'bg-slate-500'
                              }`}
                            />
                            {micStatus === 'voice'
                              ? 'Voice Command Detected'
                              : micStatus === 'clipping'
                              ? 'Audio Peak / Loud'
                              : 'Ambient Silence / Filtered'}
                          </span>
                          <span className="text-slate-400">
                            RMS: <strong className="text-white">{micVuLevel}%</strong>
                          </span>
                          <span className="text-slate-400">
                            Peak: <strong className="text-white">{micPeakLevel}%</strong>
                          </span>
                        </div>
                        <span className="text-rose-300 text-[10px]">
                          Threshold Gate: {Math.max(10, Math.round(70 - (voicePrefs.micSensitivity / 100) * 55))}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Secondary Tuning: Recognition Confidence & Noise Mode */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Confidence Threshold */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white block">Recognition Confidence Cutoff</label>
                      <span className="text-xs font-mono font-bold text-indigo-400">
                        {Math.round(voicePrefs.confidenceThreshold * 100)}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Minimum machine confidence required to execute navigation commands.
                    </p>
                    <input
                      id="voice-confidence-threshold-slider"
                      type="range"
                      min="0.30"
                      max="0.95"
                      step="0.05"
                      value={voicePrefs.confidenceThreshold}
                      onChange={(e) => handleVoicePrefChange({ confidenceThreshold: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>30% (Permissive)</span>
                      <span>Effective: {(calculateEffectiveConfidenceCutoff(voicePrefs) * 100).toFixed(0)}%</span>
                      <span>95% (Strict)</span>
                    </div>
                  </div>

                  {/* Noise Suppression Mode */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <label className="text-xs font-bold text-white block">Acoustic Noise Suppression Mode</label>
                    <p className="text-[11px] text-slate-400">Hardware DSP noise gate applied by browser audio track.</p>
                    <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                      {(['auto', 'high', 'off'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => handleVoicePrefChange({ noiseSuppressionMode: mode })}
                          className={`py-2 px-2 rounded-xl text-xs font-semibold capitalize border transition-all ${
                            voicePrefs.noiseSuppressionMode === mode
                              ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-950'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          {mode === 'auto' ? 'Auto (Default)' : mode === 'high' ? 'High Rejection' : 'Off / Raw'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Spoken Feedback & Voice Language */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <h4 className="font-bold text-white text-xs font-['Syne'] flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>Audio Feedback & Speech Synthesis (TTS)</span>
                  </h4>

                  {/* Toggle Audio Feedback */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div>
                      <h5 className="text-xs font-bold text-white">Spoken Command Confirmations</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Plays a brief voice confirmation when a voice command is triggered (e.g., "Opening Film Studio").
                      </p>
                    </div>
                    <button
                      id="voice-feedback-toggle-btn"
                      type="button"
                      onClick={() => handleVoicePrefChange({ voiceFeedbackEnabled: !voicePrefs.voiceFeedbackEnabled })}
                      className={`w-11 h-6 rounded-full p-1 transition-colors relative shrink-0 ${
                        voicePrefs.voiceFeedbackEnabled ? 'bg-emerald-500' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                          voicePrefs.voiceFeedbackEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Speech Rate & Pitch Controls */}
                  {voicePrefs.voiceFeedbackEnabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300 font-medium">Speech Rate</span>
                          <span className="text-emerald-400 font-mono">{voicePrefs.speechRate}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.8"
                          max="1.4"
                          step="0.05"
                          value={voicePrefs.speechRate}
                          onChange={(e) => handleVoicePrefChange({ speechRate: parseFloat(e.target.value) })}
                          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300 font-medium">Speech Pitch</span>
                          <span className="text-emerald-400 font-mono">{voicePrefs.speechPitch}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.8"
                          max="1.3"
                          step="0.05"
                          value={voicePrefs.speechPitch}
                          onChange={(e) => handleVoicePrefChange({ speechPitch: parseFloat(e.target.value) })}
                          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Test Feedback Button & Language Selector */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-slate-900">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-400 font-medium shrink-0">Recognition Language:</label>
                      <select
                        value={voicePrefs.language}
                        onChange={(e) => handleVoicePrefChange({ language: e.target.value })}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
                      >
                        {VOICE_LANGUAGES.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.flag} {lang.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      id="voice-test-feedback-btn"
                      type="button"
                      onClick={handlePlaySampleAudioFeedback}
                      disabled={testTtsPlaying}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2 transition-all"
                    >
                      <Volume2 className={`w-3.5 h-3.5 text-emerald-400 ${testTtsPlaying ? 'animate-bounce' : ''}`} />
                      <span>{testTtsPlaying ? 'Playing Audio Sample...' : 'Test Audio Confirmation'}</span>
                    </button>
                  </div>
                </div>

                {/* Continuous Mode & Hands-Free Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-800/60">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Continuous Hands-Free Mode</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        When enabled, speech recognition stays open indefinitely across multiple commands without requiring re-triggering.
                      </p>
                    </div>
                  </div>
                  <button
                    id="voice-continuous-toggle-btn"
                    type="button"
                    onClick={() => handleVoicePrefChange({ continuousMode: !voicePrefs.continuousMode })}
                    className={`w-11 h-6 rounded-full p-1 transition-colors relative shrink-0 ${
                      voicePrefs.continuousMode ? 'bg-indigo-500' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                        voicePrefs.continuousMode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* 6. FEEDBACK & SUPPORT */}
            {activeTab === 'feedback' && (
              <form onSubmit={handleSendFeedback} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Feedback Category</label>
                  <select
                    value={feedbackCategory}
                    onChange={(e) => setFeedbackCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="feature">💡 Feature Request</option>
                    <option value="bug">🐛 Bug Report</option>
                    <option value="performance">⚡ Performance & Speed</option>
                    <option value="general">💬 General Comment</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Your Message</label>
                  <textarea
                    rows={4}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Tell us what you love or how we can improve..."
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-rose-500 focus:outline-none resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-rose-900/30 flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" /> Send Feedback to Engineers
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

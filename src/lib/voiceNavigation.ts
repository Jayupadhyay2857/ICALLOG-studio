/**
 * Web Speech API Voice Navigation Engine for iCALLOG
 * Provides continuous or on-demand voice recognition for:
 * - Switching tabs (e.g. 'Go to Film Studio', 'Go to Office Suite', 'Open 3D Engine')
 * - Opening modals (e.g. 'Open Admin Modal', 'Open VIP Plans', 'Open Profile')
 * - Triggering actions (e.g. 'Save Work', 'Toggle Theme', 'Close Modal')
 */

import { ActiveTab } from '../types.ts';
import { ProfileTab } from '../components/ProfileSettingsModal.tsx';

// Browser Web Speech Recognition Types
interface IWindowSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export type VoiceActionType =
  | { type: 'NAVIGATE_TAB'; tab: ActiveTab; subTab?: string; label: string }
  | { type: 'OPEN_ADMIN_MODAL'; label: string }
  | { type: 'CLOSE_ADMIN_MODAL'; label: string }
  | { type: 'OPEN_PROFILE_MODAL'; initialTab?: ProfileTab; label: string }
  | { type: 'OPEN_HISTORY_MODAL'; label: string }
  | { type: 'OPEN_COOKIE_MODAL'; label: string }
  | { type: 'CLOSE_ALL_MODALS'; label: string }
  | { type: 'TOGGLE_DARK_MODE'; label: string }
  | { type: 'SAVE_WORK'; label: string }
  | { type: 'EXTEND_SESSION'; label: string };

export interface VoicePreferences {
  micSensitivity: number; // 0 to 100 (percentage). 0-35% = noisy room/strict threshold, 36-70% = balanced, 71-100% = quiet/whisper
  confidenceThreshold: number; // 0.0 to 1.0 (min recognition confidence required in noisy environment)
  noiseSuppressionMode: 'auto' | 'high' | 'off';
  language: string; // 'en-US', 'en-IN', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP'
  continuousMode: boolean;
  voiceFeedbackEnabled: boolean;
  speechRate: number; // 0.8 to 1.5
  speechPitch: number; // 0.8 to 1.5
}

export const DEFAULT_VOICE_PREFERENCES: VoicePreferences = {
  micSensitivity: 60,
  confidenceThreshold: 0.55,
  noiseSuppressionMode: 'auto',
  language: 'en-US',
  continuousMode: false,
  voiceFeedbackEnabled: true,
  speechRate: 1.05,
  speechPitch: 1.0,
};

export interface VoiceNavState {
  isSupported: boolean;
  isListening: boolean;
  isContinuous: boolean;
  transcript: string;
  interimTranscript: string;
  lastMatchedCommand: string | null;
  lastAction: VoiceActionType | null;
  error: string | null;
  voiceFeedbackEnabled: boolean;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unknown';
  preferences: VoicePreferences;
  lastConfidenceScore?: number;
  filteredOutNoiseCount: number;
}

export interface VoiceNavigationHandlers {
  onNavigateTab: (tab: ActiveTab, subTab?: string) => void;
  onOpenAdminModal: () => void;
  onCloseAdminModal: () => void;
  onOpenProfileModal: (tab?: ProfileTab) => void;
  onOpenHistoryModal: () => void;
  onOpenCookieModal: () => void;
  onCloseAllModals: () => void;
  onToggleDarkMode: () => void;
  onSaveWork: () => void;
  onExtendSession: () => void;
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error' | 'admin') => void;
}

// Sample quick commands for UI suggestions
export const VOICE_COMMAND_EXAMPLES = [
  { phrase: 'Open Admin Modal', desc: 'Opens the Admin Override & RBAC Panel' },
  { phrase: 'Open Voice Preferences', desc: 'Opens Microphone Sensitivity & Voice Settings' },
  { phrase: 'Go to Film Studio', desc: 'Opens Cinema Director & Script Writing' },
  { phrase: 'Go to Office Suite', desc: 'Opens Docs, Spreadsheets & Presentations' },
  { phrase: 'Go to Design Studio', desc: 'Opens Favicon, Badges & Resumes' },
  { phrase: 'Go to 3D Engine', desc: 'Launches Three.js WebGL Sandbox' },
  { phrase: 'Go to Projects', desc: 'Opens My Projects & Blank Canvas Hub' },
  { phrase: 'Open VIP Plans', desc: 'Opens VIP Membership Pricing' },
  { phrase: 'Open Security Modal', desc: 'Opens Token Expiry & Password Settings' },
  { phrase: 'Save Work', desc: 'Executes Immediate Vault Auto-Save' },
  { phrase: 'Toggle Dark Mode', desc: 'Flips Light / Dark Theme' },
  { phrase: 'Close Modal', desc: 'Dismisses any open modal dialog' },
];

export const VOICE_LANGUAGES = [
  { code: 'en-US', label: 'English (United States)', flag: '🇺🇸' },
  { code: 'en-IN', label: 'English (India)', flag: '🇮🇳' },
  { code: 'en-GB', label: 'English (United Kingdom)', flag: '🇬🇧' },
  { code: 'es-ES', label: 'Spanish (Español)', flag: '🇪🇸' },
  { code: 'fr-FR', label: 'French (Français)', flag: '🇫🇷' },
  { code: 'de-DE', label: 'German (Deutsch)', flag: '🇩🇪' },
  { code: 'ja-JP', label: 'Japanese (日本語)', flag: '🇯🇵' },
  { code: 'hi-IN', label: 'Hindi (हिन्दी)', flag: '🇮🇳' },
];

export function getStoredVoicePreferences(): VoicePreferences {
  if (typeof window === 'undefined') return DEFAULT_VOICE_PREFERENCES;
  try {
    const raw = localStorage.getItem('icallog_voice_preferences_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_VOICE_PREFERENCES, ...parsed };
    }
  } catch (err) {
    console.warn('[VoiceNav] Failed to load voice preferences from localStorage:', err);
  }
  return { ...DEFAULT_VOICE_PREFERENCES };
}

let recognitionInstance: any = null;
let currentHandlers: VoiceNavigationHandlers | null = null;
const initialPrefs = getStoredVoicePreferences();

let navState: VoiceNavState = {
  isSupported: false,
  isListening: false,
  isContinuous: initialPrefs.continuousMode,
  transcript: '',
  interimTranscript: '',
  lastMatchedCommand: null,
  lastAction: null,
  error: null,
  voiceFeedbackEnabled: initialPrefs.voiceFeedbackEnabled,
  permissionState: 'unknown',
  preferences: initialPrefs,
  filteredOutNoiseCount: 0,
};

const listeners = new Set<(state: VoiceNavState) => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn({ ...navState, preferences: { ...navState.preferences } }));
}

/**
 * Save & sync updated voice preferences
 */
export function saveVoicePreferences(prefsUpdate: Partial<VoicePreferences>): VoicePreferences {
  const merged: VoicePreferences = {
    ...navState.preferences,
    ...prefsUpdate,
  };
  navState.preferences = merged;
  navState.voiceFeedbackEnabled = merged.voiceFeedbackEnabled;
  navState.isContinuous = merged.continuousMode;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('icallog_voice_preferences_v1', JSON.stringify(merged));
    } catch (err) {
      console.warn('[VoiceNav] Error persisting voice preferences:', err);
    }
  }

  notifyListeners();
  return merged;
}

/**
 * Reset voice preferences to defaults
 */
export function resetVoicePreferences(): VoicePreferences {
  return saveVoicePreferences(DEFAULT_VOICE_PREFERENCES);
}

/**
 * Calculate effective confidence threshold requirement based on sensitivity slider
 * In noisy rooms (low sensitivity e.g. 20%), higher confidence is required (e.g. 0.75 - 0.85)
 * In quiet rooms (high sensitivity e.g. 80%), lower confidence is permitted (e.g. 0.35 - 0.50)
 */
export function calculateEffectiveConfidenceCutoff(prefs: VoicePreferences): number {
  // micSensitivity is 0 to 100
  // normalized sensitivity factor: 0 = strictest (noisy), 1 = most sensitive (quiet)
  const sensFactor = Math.min(Math.max(prefs.micSensitivity / 100, 0), 1);
  // Interpolate cutoff: When sensFactor=0 (noisy), cutoff = 0.85. When sensFactor=1 (whisper), cutoff = 0.35
  const baseCutoff = 0.85 - sensFactor * 0.50;
  // Blend with user's specific confidence threshold
  return Math.max(0.3, Math.min(0.95, (baseCutoff + prefs.confidenceThreshold) / 2));
}

/**
 * Text-to-Speech audio confirmation
 */
export function speakFeedback(text: string) {
  if (!navState.preferences.voiceFeedbackEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = navState.preferences.speechRate || 1.05;
    utterance.pitch = navState.preferences.speechPitch || 1.0;
    utterance.volume = 0.85;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('[VoiceNav] TTS error:', err);
  }
}

/**
 * Live Web Audio VU meter helper for testing microphone sensitivity & ambient noise floor
 */
export function createMicAudioMeter(
  onLevelChange: (level: number, peak: number, status: 'silence' | 'voice' | 'clipping') => void,
  micSensitivity: number
): { stop: () => void } {
  let audioContext: AudioContext | null = null;
  let mediaStream: MediaStream | null = null;
  let animId: number | null = null;
  let isRunning = true;

  const startMeter = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      if (!isRunning) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      mediaStream = stream;
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContext = new AudioContextClass();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const update = () => {
        if (!isRunning) return;
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        let peak = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const val = dataArray[i];
          sum += val;
          if (val > peak) peak = val;
        }
        const avg = sum / dataArray.length;
        // Normalize to 0-100 scale
        const normalizedLevel = Math.min(100, Math.round((avg / 128) * 100));
        const normalizedPeak = Math.min(100, Math.round((peak / 255) * 100));

        // Threshold status based on mic sensitivity
        // Stricter threshold at lower sensitivity (e.g. sensitivity 20% requires level >= 40%)
        const requiredThreshold = Math.max(10, Math.round(70 - (micSensitivity / 100) * 55));
        let status: 'silence' | 'voice' | 'clipping' = 'silence';
        if (normalizedLevel > 85) {
          status = 'clipping';
        } else if (normalizedLevel >= requiredThreshold) {
          status = 'voice';
        }

        onLevelChange(normalizedLevel, normalizedPeak, status);
        animId = requestAnimationFrame(update);
      };

      update();
    } catch (err) {
      console.warn('[VoiceNav] Mic audio meter permission or initialization failed:', err);
    }
  };

  startMeter();

  return {
    stop: () => {
      isRunning = false;
      if (animId) cancelAnimationFrame(animId);
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {});
      }
    },
  };
}

/**
 * Check browser support
 */
export function checkSpeechSupport(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as IWindowSpeech;
  const supported = !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  navState.isSupported = supported;
  return supported;
}

/**
 * Register active handlers from React App component
 */
export function registerVoiceHandlers(handlers: VoiceNavigationHandlers): () => void {
  currentHandlers = handlers;
  return () => {
    if (currentHandlers === handlers) {
      currentHandlers = null;
    }
  };
}

/**
 * Parse transcript into concrete system action
 */
export function parseVoiceCommand(rawText: string): VoiceActionType | null {
  const text = rawText
    .toLowerCase()
    .replace(/[.,?!;:]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) return null;

  // 1. ADMIN MODAL COMMANDS
  if (
    text.includes('open admin modal') ||
    text.includes('open admin') ||
    text.includes('admin modal') ||
    text.includes('admin panel') ||
    text.includes('admin override') ||
    text === 'admin'
  ) {
    return { type: 'OPEN_ADMIN_MODAL', label: 'Opening Admin Modal' };
  }

  if (
    text.includes('close admin modal') ||
    text.includes('close admin') ||
    text.includes('exit admin')
  ) {
    return { type: 'CLOSE_ADMIN_MODAL', label: 'Closing Admin Modal' };
  }

  // 2. OTHER MODALS (VIP, SECURITY, PROFILE, COOKIES, HISTORY, VOICE)
  if (
    text.includes('open voice preferences') ||
    text.includes('voice preferences') ||
    text.includes('voice settings') ||
    text.includes('mic preferences') ||
    text.includes('microphone settings') ||
    text.includes('mic sensitivity') ||
    text.includes('speech settings') ||
    text.includes('voice control settings')
  ) {
    return { type: 'OPEN_PROFILE_MODAL', initialTab: 'voice', label: 'Opening Voice Preferences' };
  }

  if (
    text.includes('open vip modal') ||
    text.includes('open vip') ||
    text.includes('vip plans') ||
    text.includes('pricing plans') ||
    text.includes('upgrade vip') ||
    text.includes('vip tier') ||
    text.includes('membership plans')
  ) {
    return { type: 'OPEN_PROFILE_MODAL', initialTab: 'vip', label: 'Opening VIP Plans' };
  }

  if (
    text.includes('open security modal') ||
    text.includes('open security') ||
    text.includes('security settings') ||
    text.includes('password modal') ||
    text.includes('token settings') ||
    text.includes('session security')
  ) {
    return { type: 'OPEN_PROFILE_MODAL', initialTab: 'security', label: 'Opening Security Settings' };
  }

  if (
    text.includes('open cookies modal') ||
    text.includes('open cookie modal') ||
    text.includes('open cookies') ||
    text.includes('cookie settings') ||
    text.includes('storage settings') ||
    text.includes('privacy settings')
  ) {
    return { type: 'OPEN_COOKIE_MODAL', label: 'Opening Cookie & Storage Settings' };
  }

  if (
    text.includes('open history modal') ||
    text.includes('open history') ||
    text.includes('version history') ||
    text.includes('audit log') ||
    text.includes('activity log')
  ) {
    return { type: 'OPEN_HISTORY_MODAL', label: 'Opening Version History Modal' };
  }

  if (
    text.includes('open profile modal') ||
    text.includes('open profile') ||
    text.includes('my profile') ||
    text.includes('profile settings') ||
    text.includes('user profile') ||
    text.includes('my account')
  ) {
    return { type: 'OPEN_PROFILE_MODAL', initialTab: 'profile', label: 'Opening User Profile' };
  }

  if (
    text.includes('close modal') ||
    text.includes('close modals') ||
    text.includes('close dialog') ||
    text.includes('dismiss modal') ||
    text.includes('exit modal') ||
    text === 'close'
  ) {
    return { type: 'CLOSE_ALL_MODALS', label: 'Closing Modals' };
  }

  // 3. TAB NAVIGATION COMMANDS
  // Film Studio
  if (
    text.includes('film studio') ||
    text.includes('cinema studio') ||
    text.includes('film director') ||
    text.includes('script writing') ||
    text.includes('screenplay') ||
    text === 'film' ||
    text === 'cinema'
  ) {
    return { type: 'NAVIGATE_TAB', tab: 'film_studio', label: 'Navigating to Film Studio' };
  }

  // Office Suite
  if (
    text.includes('office suite') ||
    text.includes('open office') ||
    text.includes('go to office') ||
    text === 'office'
  ) {
    return { type: 'NAVIGATE_TAB', tab: 'office_suite', label: 'Navigating to Office Suite' };
  }
  if (text.includes('docs') || text.includes('word document') || text.includes('word processor')) {
    return { type: 'NAVIGATE_TAB', tab: 'office_suite', subTab: 'docs', label: 'Opening Office Suite Docs' };
  }
  if (text.includes('spreadsheet') || text.includes('excel') || text.includes('sheets')) {
    return { type: 'NAVIGATE_TAB', tab: 'office_suite', subTab: 'excel', label: 'Opening Office Suite Excel' };
  }
  if (text.includes('presentation') || text.includes('powerpoint') || text.includes('slides') || text.includes('ppt')) {
    return { type: 'NAVIGATE_TAB', tab: 'office_suite', subTab: 'ppt', label: 'Opening Office Suite PPT' };
  }

  // Design Studio
  if (
    text.includes('design studio') ||
    text.includes('open design') ||
    text.includes('identity studio') ||
    text === 'design'
  ) {
    return { type: 'NAVIGATE_TAB', tab: 'design_studio', label: 'Navigating to Design Studio' };
  }
  if (text.includes('favicon') || text.includes('icon maker')) {
    return { type: 'NAVIGATE_TAB', tab: 'design_studio', subTab: 'favicon', label: 'Opening Favicon Designer' };
  }
  if (text.includes('badges') || text.includes('badge maker')) {
    return { type: 'NAVIGATE_TAB', tab: 'design_studio', subTab: 'badges', label: 'Opening Badge Designer' };
  }
  if (text.includes('business card') || text.includes('cards')) {
    return { type: 'NAVIGATE_TAB', tab: 'design_studio', subTab: 'business_cards', label: 'Opening Business Card Studio' };
  }
  if (text.includes('resume') || text.includes('cv') || text.includes('ats resume')) {
    return { type: 'NAVIGATE_TAB', tab: 'design_studio', subTab: 'resume', label: 'Opening ATS Resume Studio' };
  }

  // 3D WebGL Engine
  if (
    text.includes('3d engine') ||
    text.includes('3d studio') ||
    text.includes('webgl') ||
    text.includes('three js') ||
    text.includes('3d canvas') ||
    text === '3d'
  ) {
    return { type: 'NAVIGATE_TAB', tab: '3d_engine', label: 'Navigating to 3D WebGL Engine' };
  }

  // Projects Hub
  if (
    text.includes('projects hub') ||
    text.includes('my projects') ||
    text.includes('all projects') ||
    text.includes('blank project') ||
    text.includes('workspace') ||
    text === 'projects'
  ) {
    return { type: 'NAVIGATE_TAB', tab: 'projects_hub', label: 'Navigating to Projects Hub' };
  }

  // Welcome Blog / Home
  if (
    text.includes('welcome blog') ||
    text.includes('go home') ||
    text.includes('home page') ||
    text.includes('welcome') ||
    text.includes('blog')
  ) {
    return { type: 'NAVIGATE_TAB', tab: 'welcome_blog', label: 'Navigating to Welcome Blog' };
  }

  // Image Studio
  if (
    text.includes('image studio') ||
    text.includes('image generator') ||
    text.includes('photos') ||
    text.includes('ai image') ||
    text === 'images'
  ) {
    return { type: 'NAVIGATE_TAB', tab: 'image_studio', label: 'Navigating to Image Studio' };
  }

  // Video Audio Studio
  if (
    text.includes('video audio') ||
    text.includes('video studio') ||
    text.includes('video editor') ||
    text === 'video' ||
    text === 'videos'
  ) {
    return { type: 'NAVIGATE_TAB', tab: 'video_audio', label: 'Navigating to Video Audio Studio' };
  }

  // Media Mixer
  if (
    text.includes('media mixer') ||
    text.includes('mixer studio') ||
    text.includes('remix') ||
    text === 'mixer'
  ) {
    return { type: 'NAVIGATE_TAB', tab: 'media_mixer', label: 'Navigating to Media Mixer' };
  }

  // Song Studio
  if (
    text.includes('song studio') ||
    text.includes('music studio') ||
    text.includes('songs') ||
    text.includes('music') ||
    text.includes('audio generator')
  ) {
    return { type: 'NAVIGATE_TAB', tab: 'song_studio', label: 'Navigating to Song Studio' };
  }

  // Voice Converter
  if (
    text.includes('voice converter') ||
    text.includes('voice studio') ||
    text.includes('voice changer') ||
    text.includes('ai voice')
  ) {
    return { type: 'NAVIGATE_TAB', tab: 'voice_converter', label: 'Navigating to Voice Converter' };
  }

  // Meme GIF Studio
  if (
    text.includes('meme gif') ||
    text.includes('meme studio') ||
    text.includes('memes') ||
    text.includes('gif maker') ||
    text.includes('gifs')
  ) {
    return { type: 'NAVIGATE_TAB', tab: 'meme_gif_studio', label: 'Navigating to Meme & GIF Studio' };
  }

  // Chat Mentor
  if (
    text.includes('chat mentor') ||
    text.includes('ai mentor') ||
    text.includes('chatbot') ||
    text.includes('ai chat') ||
    text.includes('assistant')
  ) {
    return { type: 'NAVIGATE_TAB', tab: 'chat_mentor', label: 'Navigating to Chat Mentor' };
  }

  // Cloud Storage
  if (
    text.includes('cloud storage') ||
    text.includes('cloud vault') ||
    text.includes('file vault') ||
    text.includes('drive')
  ) {
    return { type: 'NAVIGATE_TAB', tab: 'cloud_storage', label: 'Navigating to Cloud Storage' };
  }

  // User Manual
  if (
    text.includes('user manual') ||
    text.includes('help documentation') ||
    text.includes('documentation') ||
    text.includes('guide') ||
    text.includes('manual')
  ) {
    return { type: 'NAVIGATE_TAB', tab: 'user_manual', label: 'Navigating to User Manual' };
  }

  // 4. ACTION COMMANDS
  if (
    text.includes('dark mode') ||
    text.includes('light mode') ||
    text.includes('toggle theme') ||
    text.includes('switch theme')
  ) {
    return { type: 'TOGGLE_DARK_MODE', label: 'Toggling Theme Mode' };
  }

  if (
    text.includes('save work') ||
    text.includes('auto save') ||
    text.includes('save draft') ||
    text.includes('save project')
  ) {
    return { type: 'SAVE_WORK', label: 'Executing Auto-Save' };
  }

  if (
    text.includes('extend session') ||
    text.includes('refresh token') ||
    text.includes('extend time') ||
    text.includes('add time')
  ) {
    return { type: 'EXTEND_SESSION', label: 'Extending Security Session' };
  }

  return null;
}

/**
 * Execute a parsed voice action
 */
export function executeVoiceAction(action: VoiceActionType): boolean {
  if (!currentHandlers) {
    console.warn('[VoiceNav] No handlers registered to execute action:', action);
    return false;
  }

  navState.lastAction = action;
  navState.lastMatchedCommand = action.label;
  notifyListeners();

  speakFeedback(action.label);

  switch (action.type) {
    case 'NAVIGATE_TAB':
      currentHandlers.onNavigateTab(action.tab, action.subTab);
      currentHandlers.onNotify('Voice Navigation', action.label, 'success');
      return true;

    case 'OPEN_ADMIN_MODAL':
      currentHandlers.onOpenAdminModal();
      currentHandlers.onNotify('Voice Command', 'Admin Override Modal opened via voice.', 'admin');
      return true;

    case 'CLOSE_ADMIN_MODAL':
      currentHandlers.onCloseAdminModal();
      currentHandlers.onNotify('Voice Command', 'Admin Modal closed.', 'info');
      return true;

    case 'OPEN_PROFILE_MODAL':
      currentHandlers.onOpenProfileModal(action.initialTab);
      currentHandlers.onNotify('Voice Command', action.label, 'success');
      return true;

    case 'OPEN_HISTORY_MODAL':
      currentHandlers.onOpenHistoryModal();
      currentHandlers.onNotify('Voice Command', action.label, 'info');
      return true;

    case 'OPEN_COOKIE_MODAL':
      currentHandlers.onOpenCookieModal();
      currentHandlers.onNotify('Voice Command', action.label, 'info');
      return true;

    case 'CLOSE_ALL_MODALS':
      currentHandlers.onCloseAllModals();
      currentHandlers.onNotify('Voice Command', 'All modals closed.', 'info');
      return true;

    case 'TOGGLE_DARK_MODE':
      currentHandlers.onToggleDarkMode();
      currentHandlers.onNotify('Voice Command', 'Display theme toggled.', 'info');
      return true;

    case 'SAVE_WORK':
      currentHandlers.onSaveWork();
      currentHandlers.onNotify('Voice Command', 'Immediate work auto-save executed.', 'success');
      return true;

    case 'EXTEND_SESSION':
      currentHandlers.onExtendSession();
      currentHandlers.onNotify('Voice Command', 'Session token extended for +15m.', 'success');
      return true;

    default:
      return false;
  }
}

/**
 * Start listening using Web Speech API
 */
export function startVoiceRecognition(continuous = false): boolean {
  if (!checkSpeechSupport()) {
    navState.error = 'Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari.';
    notifyListeners();
    return false;
  }

  const win = window as IWindowSpeech;
  const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

  try {
    if (recognitionInstance) {
      try {
        recognitionInstance.stop();
      } catch {
        // ignore
      }
    }

    recognitionInstance = new SpeechRecognitionClass();
    const effectiveContinuous = continuous !== undefined ? continuous : (navState.preferences.continuousMode || false);
    recognitionInstance.continuous = effectiveContinuous;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = navState.preferences.language || 'en-US';
    navState.isContinuous = effectiveContinuous;

    recognitionInstance.onstart = () => {
      navState.isListening = true;
      navState.error = null;
      navState.permissionState = 'granted';
      notifyListeners();
    };

    recognitionInstance.onresult = (event: any) => {
      let interim = '';
      let finalTranscript = '';
      let lastConf: number | undefined = undefined;

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        const primaryAlternative = result[0];
        const text = primaryAlternative?.transcript || '';
        const confidence = typeof primaryAlternative?.confidence === 'number' ? primaryAlternative.confidence : undefined;

        if (result.isFinal) {
          if (confidence !== undefined && confidence > 0) {
            lastConf = confidence;
          }

          // Sensitivity noise rejection filter
          const effectiveCutoff = calculateEffectiveConfidenceCutoff(navState.preferences);
          const isNoisySetting = navState.preferences.micSensitivity <= 35;

          // 1. Check confidence score if reported by browser engine
          if (confidence !== undefined && confidence > 0 && confidence < effectiveCutoff) {
            console.log(
              `[VoiceNav] Speech ignored due to noise threshold (confidence ${confidence.toFixed(2)} < required ${effectiveCutoff.toFixed(2)})`
            );
            navState.filteredOutNoiseCount += 1;
            continue;
          }

          // 2. Strict noise filter in low sensitivity mode for short gibberish noise
          if (isNoisySetting && text.trim().length < 3) {
            navState.filteredOutNoiseCount += 1;
            continue;
          }

          finalTranscript += text;
        } else {
          interim += text;
        }
      }

      if (lastConf !== undefined) {
        navState.lastConfidenceScore = lastConf;
      }

      navState.interimTranscript = interim;
      if (finalTranscript.trim()) {
        navState.transcript = finalTranscript.trim();
        notifyListeners();

        // Attempt command parse
        const action = parseVoiceCommand(finalTranscript);
        if (action) {
          executeVoiceAction(action);
          // If not continuous, stop after successful command
          if (!effectiveContinuous) {
            stopVoiceRecognition();
          }
        }
      } else {
        notifyListeners();
      }
    };

    recognitionInstance.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        // Normal silence timeout
        navState.error = null;
      } else if (event.error === 'not-allowed') {
        navState.permissionState = 'denied';
        navState.error = 'Microphone permission was denied. Please allow microphone access in browser settings.';
      } else {
        navState.error = `Speech recognition error: ${event.error}`;
      }
      notifyListeners();
    };

    recognitionInstance.onend = () => {
      // If continuous listening is enabled and no fatal error occurred, restart
      if (navState.isContinuous && navState.isListening && !navState.error) {
        try {
          recognitionInstance.start();
          return;
        } catch {
          // ignore
        }
      }
      navState.isListening = false;
      notifyListeners();
    };

    recognitionInstance.start();
    return true;
  } catch (err: any) {
    navState.isListening = false;
    navState.error = err.message || 'Could not start speech recognition';
    notifyListeners();
    return false;
  }
}

/**
 * Stop listening
 */
export function stopVoiceRecognition(): void {
  navState.isContinuous = false;
  navState.isListening = false;
  if (recognitionInstance) {
    try {
      recognitionInstance.stop();
    } catch {
      // ignore
    }
  }
  notifyListeners();
}

/**
 * Toggle voice feedback (SpeechSynthesis)
 */
export function toggleVoiceFeedback(): boolean {
  navState.voiceFeedbackEnabled = !navState.voiceFeedbackEnabled;
  notifyListeners();
  return navState.voiceFeedbackEnabled;
}

/**
 * Subscribe to state changes
 */
export function subscribeVoiceNav(fn: (state: VoiceNavState) => void): () => void {
  listeners.add(fn);
  checkSpeechSupport();
  fn({ ...navState });
  return () => {
    listeners.delete(fn);
  };
}

export function getVoiceNavState(): VoiceNavState {
  return { ...navState };
}

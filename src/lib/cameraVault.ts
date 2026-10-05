import { CameraMediaItem, CameraLutFilter, CameraStudioPreset, TeleprompterScript } from '../types.ts';
import { getSecureLocalItem, setSecureLocalItem } from './securitySanitizer.ts';

const CAMERA_STORAGE_KEY = 'icallog_camera_vault_items_v1';
const CAMERA_PRESETS_STORAGE_KEY = 'icallog_camera_presets_v1';
const CAMERA_SCRIPTS_STORAGE_KEY = 'icallog_camera_scripts_v1';

// Play realistic camera sound effects with Web Audio API (no external asset needed)
export function playCameraSound(type: 'shutter' | 'burst' | 'beep' | 'record_start' | 'record_stop' | 'torch') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'shutter') {
      // Mechanical dual-click shutter sound
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(120, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.08);

      gain1.gain.setValueAtTime(0.7, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.08);

      // Second mechanical click
      setTimeout(() => {
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1800, ctx.currentTime);
          osc2.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);

          gain2.gain.setValueAtTime(0.5, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.05);
        } catch {
          // ignore
        }
      }, 50);
    } else if (type === 'burst') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } else if (type === 'beep') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6 tone
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'record_start') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.07); // A5
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } else if (type === 'record_stop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.08); // A4
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'torch') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1500, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    }
  } catch (err) {
    console.debug('WebAudio shutter tone unavailable:', err);
  }
}

// Get CSS filter string based on LUT Filter and AI Quick Actions
export function getLutFilterCss(
  filter: CameraLutFilter,
  exposureEv: number = 0,
  hdrEnabled: boolean = false,
  options?: {
    realtimeColorGrading?: boolean;
    aiDenoiseEnabled?: boolean;
    beautyFilterEnabled?: boolean;
  }
): string {
  let baseFilters = '';

  // Exposure compensation EV (-3 to +3)
  const brightnessVal = 1 + exposureEv * 0.18;
  baseFilters += ` brightness(${Math.max(0.2, brightnessVal)})`;

  if (hdrEnabled || filter === 'hdr_cinema') {
    // Dynamic HDR simulation: expanded dynamic range, boosted contrast + saturation + sharpness
    baseFilters += ' contrast(1.25) saturate(1.3) drop-shadow(0px 0px 1px rgba(255,255,255,0.2))';
  }

  if (options?.realtimeColorGrading) {
    baseFilters += ' contrast(1.18) saturate(1.22)';
  }

  if (options?.beautyFilterEnabled) {
    baseFilters += ' brightness(1.04) contrast(0.97) saturate(1.08)';
  }

  switch (filter) {
    case 'cyber_neon':
      return `${baseFilters} hue-rotate(190deg) saturate(1.7) contrast(1.3)`.trim();
    case 'vivid':
      return `${baseFilters} saturate(1.6) contrast(1.15)`.trim();
    case 'warm_vintage':
      return `${baseFilters} sepia(0.35) contrast(1.1) saturate(1.2) hue-rotate(-15deg)`.trim();
    case 'noir_bw':
      return `${baseFilters} grayscale(1) contrast(1.45) brightness(0.95)`.trim();
    case 'golden_hour':
      return `${baseFilters} sepia(0.2) saturate(1.4) hue-rotate(-10deg) brightness(1.05)`.trim();
    case 'cold_glacier':
      return `${baseFilters} hue-rotate(15deg) saturate(0.85) contrast(1.1) brightness(1.02)`.trim();
    case 'dramatic_contrast':
      return `${baseFilters} contrast(1.6) saturate(1.1)`.trim();
    case 'hdr_cinema':
      return baseFilters.trim();
    case 'normal':
    default:
      return baseFilters.trim() || 'none';
  }
}

// Save Captured Item to Local Storage / Vault
export function saveVaultItem(item: CameraMediaItem): CameraMediaItem[] {
  try {
    const existing = getVaultItems();
    // Keep max 60 items
    const updated = [item, ...existing.filter((i) => i.id !== item.id)].slice(0, 60);
    try {
      setSecureLocalItem(CAMERA_STORAGE_KEY, updated);
    } catch (quotaErr) {
      // Quota exceeded guard: trim older heavy base64 items
      console.warn('Storage quota alert! Trimming older media items to protect state integrity.');
      const trimmed = [item, ...existing.filter((i) => i.id !== item.id)].slice(0, 20);
      setSecureLocalItem(CAMERA_STORAGE_KEY, trimmed);
      return trimmed;
    }
    return updated;
  } catch (e) {
    console.warn('Failed to save to camera vault:', e);
    return getVaultItems();
  }
}

// Retrieve All Vault Items
export function getVaultItems(): CameraMediaItem[] {
  try {
    return getSecureLocalItem<CameraMediaItem[]>(CAMERA_STORAGE_KEY, []);
  } catch {
    return [];
  }
}

// Delete Single Vault Item
export function deleteVaultItem(id: string): CameraMediaItem[] {
  try {
    const existing = getVaultItems();
    const updated = existing.filter((item) => item.id !== id);
    setSecureLocalItem(CAMERA_STORAGE_KEY, updated);
    return updated;
  } catch {
    return getVaultItems();
  }
}

// Clear Entire Vault
export function clearVault(): void {
  try {
    localStorage.removeItem(CAMERA_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// DEFAULT FACTORY PRESET CONFIGURATIONS
export const DEFAULT_FACTORY_PRESETS: CameraStudioPreset[] = [
  {
    id: 'preset_cyberpunk_neon',
    name: '🎬 Cyberpunk Matrix Studio',
    createdAt: 'Factory Preset',
    isDefault: true,
    filter: 'cyber_neon',
    hdrEnabled: true,
    virtualLightingEnabled: true,
    lightingPreset: 'cyber_neon',
    keyIntensity: 90, keyColor: '#EC4899', keyPosX: 20, keyPosY: 30, keyRadius: 60,
    fillIntensity: 65, fillColor: '#06B6D4', fillPosX: 80, fillPosY: 50, fillRadius: 70,
    rimIntensity: 85, rimColor: '#A855F7', rimPosX: 50, rimPosY: 5, rimRadius: 50,
    lightingBlendMode: 'overlay',
    virtualBg: 'cyberpunk_tokyo',
    smartChromaEnabled: true,
    keyColorHex: '#00FF00', keyTolerance: 35, keySmoothness: 15, spillSuppression: 30,
    webglTexture: 'matrix_rain', webglAnimSpeed: 1.2, webglIntensity: 1.2,
    aiAutoCorrectionEnabled: true, autoExposureGain: 1.1,
    handGestureTrackingEnabled: true,
  },
  {
    id: 'preset_studio_portrait',
    name: '📸 8K High-Key Portrait',
    createdAt: 'Factory Preset',
    isDefault: true,
    filter: 'vivid',
    hdrEnabled: true,
    virtualLightingEnabled: true,
    lightingPreset: 'studio_portrait',
    keyIntensity: 80, keyColor: '#FFF4EA', keyPosX: 25, keyPosY: 25, keyRadius: 65,
    fillIntensity: 45, fillColor: '#E0F2FE', fillPosX: 75, fillPosY: 45, fillRadius: 75,
    rimIntensity: 55, rimColor: '#FDE047', rimPosX: 50, rimPosY: 10, rimRadius: 45,
    lightingBlendMode: 'soft-light',
    virtualBg: 'blur',
    smartChromaEnabled: false,
    keyColorHex: '#00FF00', keyTolerance: 35, keySmoothness: 15, spillSuppression: 30,
    webglTexture: 'cyber_grid', webglAnimSpeed: 1.0, webglIntensity: 1.0,
    aiAutoCorrectionEnabled: true, autoExposureGain: 1.0,
    handGestureTrackingEnabled: false,
  },
  {
    id: 'preset_golden_sunset',
    name: '🌅 Synthwave Sunset Live',
    createdAt: 'Factory Preset',
    isDefault: true,
    filter: 'warm_vintage',
    hdrEnabled: true,
    virtualLightingEnabled: true,
    lightingPreset: 'golden_sunset',
    keyIntensity: 85, keyColor: '#F97316', keyPosX: 30, keyPosY: 30, keyRadius: 70,
    fillIntensity: 40, fillColor: '#8B5CF6', fillPosX: 70, fillPosY: 50, fillRadius: 75,
    rimIntensity: 75, rimColor: '#FDE047', rimPosX: 50, rimPosY: 10, rimRadius: 45,
    lightingBlendMode: 'soft-light',
    virtualBg: 'neon_sunset',
    smartChromaEnabled: true,
    keyColorHex: '#00FF00', keyTolerance: 35, keySmoothness: 15, spillSuppression: 30,
    webglTexture: 'synthwave_sun', webglAnimSpeed: 1.0, webglIntensity: 1.2,
    aiAutoCorrectionEnabled: false, autoExposureGain: 1.0,
    handGestureTrackingEnabled: true,
  },
  {
    id: 'preset_pro_greenscreen',
    name: '🟩 Pro Broadcast Keyer',
    createdAt: 'Factory Preset',
    isDefault: true,
    filter: 'hdr_cinema',
    hdrEnabled: true,
    virtualLightingEnabled: true,
    lightingPreset: 'cool_broadcaster',
    keyIntensity: 75, keyColor: '#FFFFFF', keyPosX: 30, keyPosY: 20, keyRadius: 60,
    fillIntensity: 50, fillColor: '#38BDF8', fillPosX: 70, fillPosY: 40, fillRadius: 70,
    rimIntensity: 45, rimColor: '#E0F2FE', rimPosX: 50, rimPosY: 15, rimRadius: 40,
    lightingBlendMode: 'soft-light',
    virtualBg: 'green_screen',
    smartChromaEnabled: true,
    keyColorHex: '#00FF00', keyTolerance: 40, keySmoothness: 20, spillSuppression: 40,
    webglTexture: 'cyber_grid', webglAnimSpeed: 1.0, webglIntensity: 1.0,
    aiAutoCorrectionEnabled: true, autoExposureGain: 1.0,
    handGestureTrackingEnabled: false,
  },
];

export function getSavedPresets(): CameraStudioPreset[] {
  try {
    const saved = getSecureLocalItem<CameraStudioPreset[]>(CAMERA_PRESETS_STORAGE_KEY, []);
    return [...DEFAULT_FACTORY_PRESETS, ...saved];
  } catch {
    return DEFAULT_FACTORY_PRESETS;
  }
}

export function saveCustomPreset(preset: CameraStudioPreset): CameraStudioPreset[] {
  try {
    const currentCustom = getSecureLocalItem<CameraStudioPreset[]>(CAMERA_PRESETS_STORAGE_KEY, []);
    const updatedCustom = [preset, ...currentCustom.filter((p) => p.id !== preset.id)];
    setSecureLocalItem(CAMERA_PRESETS_STORAGE_KEY, updatedCustom);
    return [...DEFAULT_FACTORY_PRESETS, ...updatedCustom];
  } catch (e) {
    console.warn('Failed to save custom preset:', e);
    return getSavedPresets();
  }
}

export function deletePreset(id: string): CameraStudioPreset[] {
  try {
    const currentCustom = getSecureLocalItem<CameraStudioPreset[]>(CAMERA_PRESETS_STORAGE_KEY, []);
    const updatedCustom = currentCustom.filter((p) => p.id !== id);
    setSecureLocalItem(CAMERA_PRESETS_STORAGE_KEY, updatedCustom);
    return [...DEFAULT_FACTORY_PRESETS, ...updatedCustom];
  } catch {
    return getSavedPresets();
  }
}

// DEFAULT FACTORY TELEPROMPTER SCRIPTS
export const DEFAULT_FACTORY_SCRIPTS: TeleprompterScript[] = [
  {
    id: 'script_product_launch',
    title: '🎤 8K AI Camera Studio Product Pitch',
    category: 'Product Pitch',
    content:
      'Welcome everyone to this live product presentation! Today we are introducing our new 8K AI Camera Studio. With real-time 3-point studio lighting, smart chroma keying, hand gesture shutter AI, and AI auto-tune, you can produce broadcast-quality video content directly from your browser. Try uploading your own custom background or generating WebGL energy waves for your live video stream.',
    wordCount: 65,
    estReadingTimeMin: 0.4,
    createdAt: 'Factory Sample',
    updatedAt: 'Just now',
    isDefault: true,
  },
  {
    id: 'script_social_reel',
    title: '🎬 Creator Video Tips Reel (60s Short)',
    category: 'Vlog / Reel',
    content:
      "Hey creators! Welcome back to my channel. Today I'm sharing 5 pro video recording tips. Tip 1: Always maintain natural eye contact near the lens using this teleprompter overlay. Tip 2: Use soft key and rim backlight to separate yourself from the background. Tip 3: Clean up background ambient noise with AI denoise. Tip 4: Record in 4K UHD. Drop a comment below if you want part 2!",
    wordCount: 71,
    estReadingTimeMin: 0.5,
    createdAt: 'Factory Sample',
    updatedAt: 'Just now',
    isDefault: true,
  },
  {
    id: 'script_keynote_presentation',
    title: '🎙️ Live Executive Keynote Intro',
    category: 'Keynote',
    content:
      "Good morning team, and thank you for joining today's annual strategic keynote presentation. Over the past year, our development team has transformed the digital workspace landscape. Today, we're unveiling our next-generation browser-based media production suite.",
    wordCount: 38,
    estReadingTimeMin: 0.3,
    createdAt: 'Factory Sample',
    updatedAt: 'Just now',
    isDefault: true,
  },
];

export function getTeleprompterScripts(): TeleprompterScript[] {
  try {
    const saved = getSecureLocalItem<TeleprompterScript[]>(CAMERA_SCRIPTS_STORAGE_KEY, []);
    return [...DEFAULT_FACTORY_SCRIPTS, ...saved];
  } catch {
    return DEFAULT_FACTORY_SCRIPTS;
  }
}

export function saveTeleprompterScript(script: TeleprompterScript): TeleprompterScript[] {
  try {
    const currentCustom = getSecureLocalItem<TeleprompterScript[]>(CAMERA_SCRIPTS_STORAGE_KEY, []);
    const updatedCustom = [script, ...currentCustom.filter((s) => s.id !== script.id)];
    setSecureLocalItem(CAMERA_SCRIPTS_STORAGE_KEY, updatedCustom);
    return [...DEFAULT_FACTORY_SCRIPTS, ...updatedCustom];
  } catch (e) {
    console.warn('Failed to save teleprompter script:', e);
    return getTeleprompterScripts();
  }
}

export function deleteTeleprompterScript(id: string): TeleprompterScript[] {
  try {
    const currentCustom = getSecureLocalItem<TeleprompterScript[]>(CAMERA_SCRIPTS_STORAGE_KEY, []);
    const updatedCustom = currentCustom.filter((s) => s.id !== id);
    setSecureLocalItem(CAMERA_SCRIPTS_STORAGE_KEY, updatedCustom);
    return [...DEFAULT_FACTORY_SCRIPTS, ...updatedCustom];
  } catch {
    return getTeleprompterScripts();
  }
}

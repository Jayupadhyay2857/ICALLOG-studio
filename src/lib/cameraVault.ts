import { CameraMediaItem, CameraLutFilter } from '../types.ts';
import { getSecureLocalItem, setSecureLocalItem } from './securitySanitizer.ts';

const CAMERA_STORAGE_KEY = 'icallog_camera_vault_items_v1';

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

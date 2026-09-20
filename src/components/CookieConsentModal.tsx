import React, { useState, useEffect } from 'react';
import {
  Cookie,
  ShieldCheck,
  MapPin,
  Camera,
  Mic,
  Bell,
  HardDrive,
  Cpu,
  BarChart3,
  X,
  Check,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface CookiePermissions {
  essential: boolean; // Always true
  storage: boolean; // LocalStorage & IndexedDB
  location: boolean; // Geolocation API
  mediaDevices: boolean; // Camera & Microphone
  notifications: boolean; // Browser Push Notifications
  gpuHardware: boolean; // WebGL & GPU Hardware Acceleration
  analytics: boolean; // Performance Metrics
  hasConsented: boolean; // User clicked Accept/Decline
}

interface CookieConsentModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSavePermissions?: (permissions: CookiePermissions) => void;
}

export const CookieConsentModal: React.FC<CookieConsentModalProps> = ({
  isOpen: externalIsOpen,
  onClose,
  onSavePermissions,
}) => {
  const [permissions, setPermissions] = useState<CookiePermissions>(() => {
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

  const [showBanner, setShowBanner] = useState(!permissions.hasConsented);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('Not requested');
  const [storageStats, setStorageStats] = useState<{ usedKb: number; itemsCount: number }>({ usedKb: 0, itemsCount: 0 });

  useEffect(() => {
    try {
      let totalBytes = 0;
      let count = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key) || '';
          totalBytes += (key.length + val.length) * 2;
          count++;
        }
      }
      setStorageStats({ usedKb: Math.max(1, Math.round(totalBytes / 1024)), itemsCount: count });
    } catch {
      // ignore
    }
  }, [externalIsOpen]);

  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setShowBanner(externalIsOpen);
      if (externalIsOpen) setIsDetailsOpen(true);
    }
  }, [externalIsOpen]);

  const saveAndApply = (updated: CookiePermissions) => {
    const finalState = { ...updated, hasConsented: true };
    setPermissions(finalState);
    try {
      localStorage.setItem('icallog_cookie_permissions_v1', JSON.stringify(finalState));
    } catch {
      // ignore
    }

    if (onSavePermissions) {
      onSavePermissions(finalState);
    }

    setShowBanner(false);
    if (onClose) onClose();
  };

  const handleToggle = async (key: keyof CookiePermissions) => {
    if (key === 'essential') return; // Cannot toggle essential

    const newValue = !permissions[key];
    const updated = { ...permissions, [key]: newValue };
    setPermissions(updated);

    // Live Request Browser APIs when enabled
    if (newValue) {
      if (key === 'location' && 'geolocation' in navigator) {
        setLocationStatus('Requesting GPS location...');
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocationStatus(`Granted (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`);
          },
          (err) => {
            setLocationStatus(`Denied (${err.message})`);
          }
        );
      } else if (key === 'mediaDevices' && 'mediaDevices' in navigator) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
          stream.getTracks().forEach((track) => track.stop());
        } catch {
          // User denied or cancelled
        }
      } else if (key === 'notifications' && 'Notification' in window) {
        try {
          await Notification.requestPermission();
        } catch {
          // ignore
        }
      }
    }
  };

  const handleAcceptAll = () => {
    const allOn: CookiePermissions = {
      essential: true,
      storage: true,
      location: true,
      mediaDevices: true,
      notifications: true,
      gpuHardware: true,
      analytics: true,
      hasConsented: true,
    };

    // Request permissions
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(() => {}, () => {});
    }
    if ('Notification' in window) {
      Notification.requestPermission().catch(() => {});
    }

    saveAndApply(allOn);
  };

  const handleRejectNonEssential = () => {
    const essentialOnly: CookiePermissions = {
      essential: true,
      storage: true,
      location: false,
      mediaDevices: false,
      notifications: false,
      gpuHardware: true,
      analytics: false,
      hasConsented: true,
    };
    saveAndApply(essentialOnly);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-lg flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                <Cookie className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-['Syne'] flex items-center gap-2">
                Privacy, Cookies & Device Permissions
              </h2>
              <p className="text-xs text-slate-400">
                Manage how ICALLOG uses cookies, local storage, location, camera, and device APIs.
              </p>
            </div>
          </div>
          {permissions.hasConsented && (
            <button
              onClick={() => {
                setShowBanner(false);
                if (onClose) onClose();
              }}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              We respect your privacy. All user-authored content, 3D scenes, and studio files remain locally persisted or encrypted. Choose which hardware and browser permissions you wish to grant below.
            </p>
          </div>

          {/* Toggle Accordion / List */}
          <div className="space-y-2.5">
            {/* 1. Essential Cookies & Storage */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    Essential Storage & Security Cookies
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-bold">
                      REQUIRED
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Saves active session state, user login, and studio preferences locally (LocalStorage & IndexedDB).
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[10px] font-mono text-emerald-400/90">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active Usage: ~{storageStats.usedKb} KB across {storageStats.itemsCount} stored records • Cookies: Encrypted Session</span>
                  </div>
                </div>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-800">
                Always Active
              </div>
            </div>

            {/* 2. Geolocation / Location Access */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    Geolocation & Regional AI Context
                    {locationStatus !== 'Not requested' && (
                      <span className="text-[9px] font-mono text-cyan-300">({locationStatus})</span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Enables regional language auto-detection, local weather, and location-aware prompts.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('location')}
                className={`w-11 h-6 rounded-full p-1 transition-colors relative shrink-0 ${
                  permissions.location ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                    permissions.location ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 3. Camera & Microphone Media Devices */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-pink-400 shrink-0">
                  <Camera className="w-4 h-4" />
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Camera & Microphone Access</h4>
                  <p className="text-[11px] text-slate-400">
                    Required for AI Voice Studio recording, avatar video capturing, and live mic input.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('mediaDevices')}
                className={`w-11 h-6 rounded-full p-1 transition-colors relative shrink-0 ${
                  permissions.mediaDevices ? 'bg-pink-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                    permissions.mediaDevices ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 4. Browser Push Notifications */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Push Notifications & AI Alerts</h4>
                  <p className="text-[11px] text-slate-400">
                    Notifies you when 8K video renders or long background AI jobs finish.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('notifications')}
                className={`w-11 h-6 rounded-full p-1 transition-colors relative shrink-0 ${
                  permissions.notifications ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                    permissions.notifications ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 5. GPU Hardware Acceleration & WebGL */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">WebGL & GPU Hardware Acceleration</h4>
                  <p className="text-[11px] text-slate-400">
                    Accelerates Three.js 3D viewport rendering, shaders, and video canvas operations.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('gpuHardware')}
                className={`w-11 h-6 rounded-full p-1 transition-colors relative shrink-0 ${
                  permissions.gpuHardware ? 'bg-purple-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                    permissions.gpuHardware ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 6. Performance & Usage Analytics */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Performance Metrics & Analytics</h4>
                  <p className="text-[11px] text-slate-400">
                    Helps us optimize load speeds and fix UI crashes automatically.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('analytics')}
                className={`w-11 h-6 rounded-full p-1 transition-colors relative shrink-0 ${
                  permissions.analytics ? 'bg-indigo-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                    permissions.analytics ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleRejectNonEssential}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all"
          >
            Essential Only
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => saveAndApply(permissions)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold border border-indigo-500/50 transition-all flex items-center justify-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5" /> Save Selection
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Accept All Permissions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

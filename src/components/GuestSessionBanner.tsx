import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  Sparkles,
  LogIn,
  RefreshCw,
  Plus,
  ShieldAlert,
  X,
  ChevronRight,
  BookOpen,
  Lock,
  Save
} from 'lucide-react';
import { UserProfile } from '../types.ts';
import {
  getGuestSession,
  saveGuestSession,
  extendGuestSession,
  resetGuestSession,
  GuestSessionState
} from '../lib/guestSessionManager.ts';
import { executeAutoSave } from '../lib/sessionManager.ts';

interface GuestSessionBannerProps {
  user: UserProfile;
  onNotify: (title: string, desc: string, type?: 'info' | 'success' | 'warning' | 'error' | 'admin') => void;
  onOpenProfileModal: (tab?: 'auth' | 'profile' | 'personas' | 'vip' | 'cookies') => void;
  onOpenTutorial: () => void;
}

export const GuestSessionBanner: React.FC<GuestSessionBannerProps> = ({
  user,
  onNotify,
  onOpenProfileModal,
  onOpenTutorial,
}) => {
  const isGuest = Boolean(
    user.isGuestAccount ||
    user.personaType === 'guest' ||
    user.id === 'usr_guest_01' ||
    user.email === 'guest@icallog.studio'
  );

  const [session, setSession] = useState<GuestSessionState>(() => getGuestSession());
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const s = getGuestSession();
    return Math.max(0, Math.floor((s.expiresAt - Date.now()) / 1000));
  });
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isExpiredModalOpen, setIsExpiredModalOpen] = useState(false);
  const [hasWarnedThisSession, setHasWarnedThisSession] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Monitor timer every second
  useEffect(() => {
    if (!isGuest) return;

    const interval = setInterval(() => {
      const current = getGuestSession();
      setSession(current);
      const remaining = Math.max(0, Math.floor((current.expiresAt - Date.now()) / 1000));
      setRemainingSeconds(remaining);

      // Trigger 2-minute pre-expiration warning (120 seconds)
      if (remaining <= 120 && remaining > 0 && !current.hasWarned2Min && !hasWarnedThisSession) {
        setHasWarnedThisSession(true);
        const updated = { ...current, hasWarned2Min: true };
        saveGuestSession(updated);
        setIsAlertModalOpen(true);
        executeAutoSave('Auto-saved 2 minutes before guest session expiry');
        onNotify(
          '⚠️ Guest Session Expiring in 2 Minutes!',
          'You have 2 minutes left. Extend session by +5 min (up to 15 min max) or log in to preserve your work.',
          'warning'
        );
      }

      // Trigger session expired modal
      if (remaining === 0 && !current.isExpired) {
        const updated = { ...current, isExpired: true };
        saveGuestSession(updated);
        setIsExpiredModalOpen(true);
        setIsAlertModalOpen(false);
        onNotify(
          '⏱️ Guest Session Expired',
          'Maximum guest sandbox time reached. Sign in to continue or restart guest mode.',
          'error'
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isGuest, hasWarnedThisSession]);

  if (!isGuest) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleExtend = () => {
    const result = extendGuestSession();
    if (result.success) {
      setSession(result.session);
      const remaining = Math.max(0, Math.floor((result.session.expiresAt - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      setHasWarnedThisSession(false);
      setIsAlertModalOpen(false);
      onNotify('Session Extended (+5 Min)', result.message, 'success');
    } else {
      onNotify('Max Time Reached', result.message, 'warning');
    }
  };

  const handleRestartGuest = () => {
    const fresh = resetGuestSession();
    setSession(fresh);
    const remaining = Math.max(0, Math.floor((fresh.expiresAt - Date.now()) / 1000));
    setRemainingSeconds(remaining);
    setHasWarnedThisSession(false);
    setIsExpiredModalOpen(false);
    onNotify('New Guest Session Started', 'Fresh 10-minute sandbox session initialized with 50 demo tokens.', 'info');
  };

  const totalDuration = session.baseDurationMinutes + session.extendedMinutes;
  const is2MinWarning = remainingSeconds <= 120 && remainingSeconds > 0;
  const isExpired = remainingSeconds === 0;

  return (
    <>
      {/* Top Persistent Guest Bar */}
      <div
        id="guest-session-top-banner"
        className={`w-full py-1.5 px-3 sm:px-6 transition-all duration-300 z-40 border-b ${
          is2MinWarning
            ? 'bg-gradient-to-r from-amber-950 via-red-950 to-amber-950 border-amber-500/80 text-amber-200 animate-pulse'
            : isExpired
            ? 'bg-red-950/90 border-red-500/80 text-red-200'
            : 'bg-slate-950/95 border-amber-500/30 text-slate-300'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold text-[10px] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              GUEST SANDBOX
            </span>
            <span className="hidden md:inline text-slate-400 text-[11px]">
              Active session: <strong>{totalDuration}m max</strong> (Base 10m + up to 5m extend).
            </span>
            <span className="font-mono font-bold text-cyan-300 flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-700">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{isExpired ? 'EXPIRED (00:00)' : `${formatTime(remainingSeconds)} left`}</span>
            </span>
            {is2MinWarning && (
              <span className="text-[11px] font-bold text-amber-400 hidden lg:inline animate-bounce">
                ⚠️ 2 Min Warning: Extend or Sign In!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Guest Tutorial Trigger */}
            <button
              onClick={onOpenTutorial}
              className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-cyan-300 border border-indigo-500/40 text-[11px] font-bold transition-all flex items-center gap-1"
              title="Open Guest Interactive Tutorial"
            >
              <BookOpen className="w-3 h-3 text-cyan-400" />
              <span>Guest Tutorial</span>
            </button>

            {/* Extend +5 min Button (if within limits) */}
            {session.canExtend && !isExpired && (
              <button
                onClick={handleExtend}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-[11px] font-bold transition-all flex items-center gap-1"
                title="Extend guest session by 5 minutes (max 15 min total)"
              >
                <Plus className="w-3 h-3" />
                <span>+5 Min Extension</span>
              </button>
            )}

            {/* Sign In to Save All */}
            <button
              onClick={() => onOpenProfileModal('auth')}
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-[11px] shadow-sm flex items-center gap-1 transition-all hover:scale-105"
            >
              <LogIn className="w-3 h-3" />
              <span>Sign In to Keep Work</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2-Minute Pre-Expiration Warning Modal */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border-2 border-amber-500/90 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setIsAlertModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white font-['Syne']">
                  Guest Session Expiring in 2 Minutes!
                </h3>
                <p className="text-xs text-amber-300 font-mono">
                  Time Remaining: <strong>{formatTime(remainingSeconds)}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Your temporary guest sandbox session will expire shortly. All drafts have been auto-saved to your local browser storage. To continue without interruption and prevent losing generated media:
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 font-bold text-white">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Options to Keep Creating:</span>
              </div>
              <div>• <strong>Extend +5 Minutes</strong>: Gain extra time up to the 15-minute maximum guest limit.</div>
              <div>• <strong>Sign In / Create Account</strong>: Save all your projects to the cloud vault permanently with unlimited time.</div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAlertModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                Dismiss
              </button>

              {session.canExtend && (
                <button
                  type="button"
                  onClick={handleExtend}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Extend +5 Minutes ({totalDuration + 5}m Total)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsAlertModalOpen(false);
                  onOpenProfileModal('auth');
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Create Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Expired Overlay Modal (When 15 min / session runs out) */}
      {isExpiredModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border-2 border-red-500/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white font-['Syne']">
                  Guest Session Expired (15 Min Limit)
                </h3>
                <p className="text-xs text-red-400 font-mono">
                  Sandbox session has ended.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Your guest session has reached the 15-minute maximum limit. Your drafts are preserved in local storage. Create an account or sign in to synchronize them to the cloud forever, or start a new guest session.
            </p>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleRestartGuest}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4 text-cyan-400" />
                <span>Start New 10-Min Guest Session</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsExpiredModalOpen(false);
                  onOpenProfileModal('auth');
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In & Save Everything</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

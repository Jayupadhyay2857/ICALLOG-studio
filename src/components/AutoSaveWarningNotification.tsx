import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  Save,
  RefreshCw,
  CheckCircle2,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Lock
} from 'lucide-react';
import {
  getStoredSession,
  extendSessionToken,
  executeAutoSave,
  SessionData
} from '../lib/sessionManager.ts';

interface AutoSaveWarningNotificationProps {
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  onOpenProfileModal?: (tab?: any) => void;
}

export const AutoSaveWarningNotification: React.FC<AutoSaveWarningNotificationProps> = ({
  onNotify,
  onOpenProfileModal,
}) => {
  const [session, setSession] = useState<SessionData>(() => getStoredSession());
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const s = getStoredSession();
    return Math.max(0, Math.floor((s.expiresAt - Date.now()) / 1000));
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dismissedUntilNextWarning, setDismissedUntilNextWarning] = useState(false);
  const [hasAutoSavedForThisCycle, setHasAutoSavedForThisCycle] = useState(false);

  // Monitor session expiration every second
  useEffect(() => {
    const timer = setInterval(() => {
      const current = getStoredSession();
      setSession(current);
      const remaining = Math.max(0, Math.floor((current.expiresAt - Date.now()) / 1000));
      setRemainingSeconds(remaining);

      // Trigger automatic draft save at 2 minutes (120s) if not already done
      if (remaining <= 120 && remaining > 0 && !hasAutoSavedForThisCycle) {
        setHasAutoSavedForThisCycle(true);
        const result = executeAutoSave('Auto-save triggered 2 minutes before session token expiry');
        if (result.success) {
          setSaveSuccessMsg(`Auto-saved at ${result.savedAt}`);
        }
      }

      // Reset auto-save flag if session was extended beyond 2 minutes
      if (remaining > 120) {
        setHasAutoSavedForThisCycle(false);
        setDismissedUntilNextWarning(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [hasAutoSavedForThisCycle]);

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Only appear when <= 2 minutes (120 seconds) or when expired (0 seconds)
  const isWarningActive = remainingSeconds <= 120;
  const isExpired = remainingSeconds === 0;

  // Handle immediate manual Auto-Save click
  const handleManualSave = () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);
    setTimeout(() => {
      const result = executeAutoSave('User clicked Save Work Now on session warning');
      setIsSaving(false);
      if (result.success) {
        setSaveSuccessMsg(`Work saved successfully (${result.itemsCount} items)`);
        onNotify(
          'Work Auto-Saved',
          `All workspace projects, profile, and drafts saved to secure offline vault at ${result.savedAt}.`,
          'success'
        );
      } else {
        onNotify('Auto-Save Error', 'Unable to complete auto-save to browser storage.', 'error');
      }
    }, 400);
  };

  // Handle Extend Session (+15 minutes)
  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      const updated = await extendSessionToken(15);
      setSession(updated);
      const remaining = Math.max(0, Math.floor((updated.expiresAt - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      setHasAutoSavedForThisCycle(false);
      setDismissedUntilNextWarning(false);
      setSaveSuccessMsg(null);
      setIsMinimized(false);
      onNotify(
        'Session Extended',
        'Your security token has been renewed for another 15 minutes. Continue your creative work safely!',
        'success'
      );
    } catch {
      onNotify('Extension Failed', 'Could not refresh session token. Please save your work.', 'warning');
    } finally {
      setIsExtending(false);
    }
  };

  if (!isWarningActive || dismissedUntilNextWarning) {
    return null;
  }

  // Progress percentage of the 2-minute window (120s down to 0s)
  const warningProgressPercent = Math.min(100, Math.max(0, ((120 - remainingSeconds) / 120) * 100));

  // If user minimized the card, show a compact floating warning pill
  if (isMinimized) {
    return (
      <div className="fixed top-20 right-5 z-50 animate-bounce">
        <button
          onClick={() => setIsMinimized(false)}
          className="px-3.5 py-2 rounded-2xl bg-amber-950/95 border-2 border-amber-500/80 text-amber-200 shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs font-bold hover:scale-105 transition-all"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Session Warning: <strong className="font-mono text-amber-300">{formatTime(remainingSeconds)}</strong></span>
          <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
        </button>
      </div>
    );
  }

  return (
    <div
      id="session-autosave-warning-notification"
      className="fixed top-20 right-4 sm:right-6 z-50 max-w-md w-full sm:w-[420px] transition-all duration-300"
    >
      <div
        className={`rounded-3xl border shadow-2xl backdrop-blur-xl overflow-hidden p-5 transition-all ${
          isExpired
            ? 'bg-rose-950/95 border-rose-500/80 shadow-rose-950/60 text-white'
            : 'bg-slate-950/95 border-amber-500/70 shadow-amber-950/50 text-slate-100 ring-1 ring-amber-500/30'
        }`}
      >
        {/* Progress Bar inside 2-minute window */}
        {!isExpired && (
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3.5">
            <div
              className="bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 h-full transition-all duration-1000"
              style={{ width: `${warningProgressPercent}%` }}
            />
          </div>
        )}

        {/* Header & Controls */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                isExpired
                  ? 'bg-rose-600 text-white'
                  : 'bg-gradient-to-tr from-amber-500 to-orange-600 text-slate-950'
              }`}
            >
              {isExpired ? (
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black font-['Syne'] text-white">
                  {isExpired ? 'Session Expired' : 'Auto-Save Warning'}
                </h3>
                <span
                  className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full border ${
                    isExpired
                      ? 'bg-rose-900/80 border-rose-500 text-rose-200'
                      : 'bg-amber-950 border-amber-500/60 text-amber-300 animate-pulse'
                  }`}
                >
                  {isExpired ? 'EXPIRED' : `${formatTime(remainingSeconds)} REMAINING`}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {isExpired
                  ? 'Your session token has expired. All drafts were automatically secured.'
                  : 'Your session token expires in less than 2 minutes.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 rounded-xl hover:bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
              title="Minimize warning to small pill"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDismissedUntilNextWarning(true)}
              className="p-1.5 rounded-xl hover:bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
              title="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Auto-Save Status Message */}
        <div className="mt-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-[11px]">
              {saveSuccessMsg || (
                <>
                  Draft Auto-Save: <strong className="text-emerald-400 font-semibold">Active & Armed</strong>
                </>
              )}
            </span>
          </div>
          {saveSuccessMsg && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold">
              <CheckCircle2 className="w-3 h-3" /> Saved
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button
            id="session-warning-save-work-btn"
            type="button"
            onClick={handleManualSave}
            disabled={isSaving}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700/80 flex items-center justify-center gap-1.5 transition-all hover:scale-102 disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            ) : (
              <Save className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Work Now'}</span>
          </button>

          <button
            id="session-warning-extend-session-btn"
            type="button"
            onClick={handleExtendSession}
            disabled={isExtending}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-950/50 flex items-center justify-center gap-1.5 transition-all hover:scale-102 disabled:opacity-50"
          >
            {isExtending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            )}
            <span>{isExpired ? 'Reconnect Session' : 'Extend (+15m)'}</span>
          </button>
        </div>

        {/* Footer Sub-Note */}
        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1 border-t border-slate-800/60">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-slate-500" /> AES-256 JWT Vault Protection
          </span>
          {onOpenProfileModal && (
            <button
              type="button"
              onClick={() => onOpenProfileModal('security')}
              className="text-cyan-400 hover:underline"
            >
              Session Settings →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

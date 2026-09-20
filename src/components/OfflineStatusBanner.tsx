import React, { useState, useEffect } from 'react';
import {
  WifiOff,
  Wifi,
  Database,
  RefreshCw,
  CheckCircle2,
  HardDrive,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles
} from 'lucide-react';
import {
  subscribeConnectivity,
  ConnectivityState,
  setSimulatedOffline,
  processPendingOfflineSync,
} from '../lib/offlineSync.ts';
import { getOfflineStorageDiagnostics, OfflineDiagnostics } from '../lib/offlineIndexedDB.ts';

interface OfflineStatusBannerProps {
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  onOpenProfileModal?: (tab?: any) => void;
}

export const OfflineStatusBanner: React.FC<OfflineStatusBannerProps> = ({
  onNotify,
  onOpenProfileModal,
}) => {
  const [connState, setConnState] = useState<ConnectivityState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSimulatedOffline: false,
    isSyncing: false,
    pendingActionsCount: 0,
    lastOnlineTimestamp: Date.now(),
  });

  const [diagnostics, setDiagnostics] = useState<OfflineDiagnostics | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showReconnectedToast, setShowReconnectedToast] = useState(false);

  useEffect(() => {
    const unsub = subscribeConnectivity((state) => {
      setConnState((prev) => {
        // If we transitioned from offline to online, show temporary reconnected alert
        if (!prev.isOnline && state.isOnline) {
          setShowReconnectedToast(true);
          setTimeout(() => setShowReconnectedToast(false), 5000);
        }
        return state;
      });
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    // Refresh IndexedDB diagnostics
    getOfflineStorageDiagnostics().then((diag) => setDiagnostics(diag));
  }, [connState.isOnline]);

  const handleManualSync = async () => {
    if (!connState.isOnline) {
      onNotify('Offline Mode', 'Connect to the internet or toggle simulated offline off to sync.', 'warning');
      return;
    }
    const result = await processPendingOfflineSync();
    onNotify('IndexedDB Sync', result.message, 'success');
    getOfflineStorageDiagnostics().then((diag) => setDiagnostics(diag));
  };

  // 1. Reconnected Banner
  if (showReconnectedToast && connState.isOnline) {
    return (
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-bounce">
        <div className="px-4 py-2 rounded-2xl bg-emerald-950/95 border border-emerald-500/80 text-emerald-200 shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs font-bold">
          <Wifi className="w-4 h-4 text-emerald-400" />
          <span>Back Online — All IndexedDB state & projects are synced!</span>
          <button
            onClick={() => setShowReconnectedToast(false)}
            className="p-1 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // If online and not simulated offline, do not render offline banner
  if (connState.isOnline || dismissed) {
    return null;
  }

  // Minimized floating offline pill
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 z-50 animate-pulse">
        <button
          onClick={() => setIsMinimized(false)}
          className="px-3.5 py-2 rounded-2xl bg-amber-950/95 border-2 border-amber-500/80 text-amber-200 shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs font-bold hover:scale-105 transition-all"
        >
          <WifiOff className="w-4 h-4 text-amber-400" />
          <span>Offline Mode Active • IndexedDB Armed</span>
          <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
        </button>
      </div>
    );
  }

  return (
    <div
      id="offline-indexeddb-banner"
      className="fixed bottom-4 left-4 sm:left-6 z-50 max-w-md w-full sm:w-[410px] transition-all duration-300"
    >
      <div className="rounded-3xl border border-amber-500/80 bg-slate-950/95 shadow-2xl shadow-amber-950/50 backdrop-blur-xl p-4 text-slate-100 ring-1 ring-amber-500/30">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0 shadow-lg">
              <WifiOff className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black font-['Syne'] text-white">
                  Offline Mode Active
                </h3>
                {connState.isSimulatedOffline ? (
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/60 text-cyan-300">
                    SIMULATED
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950 border border-amber-500/60 text-amber-300">
                    NO INTERNET
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Service Worker & IndexedDB caching active. Your projects and edits are preserved locally.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              title="Minimize"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* IndexedDB Live Cache Diagnostics Card */}
        <div className="mt-3 p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 text-slate-300">
            <Database className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              IndexedDB Projects:{' '}
              <strong className="text-emerald-400 font-mono">
                {diagnostics ? diagnostics.projectsCount : '—'}
              </strong>
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {diagnostics?.userStateSaved ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> State Cached
              </span>
            ) : (
              'Syncing...'
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-3 flex items-center gap-2">
          {connState.isSimulatedOffline ? (
            <button
              type="button"
              onClick={() => {
                setSimulatedOffline(false);
                onNotify('Simulation Ended', 'Reconnected to normal network status.', 'info');
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
            >
              <Wifi className="w-3.5 h-3.5" /> Restore Online
            </button>
          ) : (
            <button
              type="button"
              onClick={handleManualSync}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" /> Check & Sync
            </button>
          )}

          {onOpenProfileModal && (
            <button
              type="button"
              onClick={() => onOpenProfileModal('cookies')}
              className="py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5"
            >
              <HardDrive className="w-3.5 h-3.5" /> Storage
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

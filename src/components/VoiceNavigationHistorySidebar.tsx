import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Mic,
  MicOff,
  History,
  Play,
  RotateCcw,
  Trash2,
  Copy,
  Check,
  Search,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Download,
  Volume2,
  VolumeX,
  ChevronRight,
  HelpCircle,
  Layers,
  Shield,
  Clapperboard,
  FileText,
  Save,
  Moon,
  Palette,
  Eye,
  Sliders,
} from 'lucide-react';
import {
  VoiceHistoryEntry,
  VoiceNavState,
  subscribeVoiceHistory,
  subscribeVoiceNav,
  reExecuteVoiceCommand,
  clearVoiceCommandHistory,
  deleteVoiceCommandHistoryItem,
  addVoiceCommandHistoryEntry,
  startVoiceRecognition,
  stopVoiceRecognition,
  toggleVoiceFeedback,
  VOICE_COMMAND_EXAMPLES,
  DEFAULT_VOICE_PREFERENCES,
} from '../lib/voiceNavigation.ts';
import { ActiveTab } from '../types.ts';

interface VoiceNavigationHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: ActiveTab, subTab?: string) => void;
  onOpenAdminModal?: () => void;
  onOpenProfileModal?: (tab?: any) => void;
  onNotify?: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error' | 'admin') => void;
}

export const VoiceNavigationHistorySidebar: React.FC<VoiceNavigationHistorySidebarProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenAdminModal,
  onOpenProfileModal,
  onNotify,
}) => {
  const [history, setHistory] = useState<VoiceHistoryEntry[]>([]);
  const [voiceNavState, setVoiceNavState] = useState<VoiceNavState>({
    isSupported: true,
    isListening: false,
    isContinuous: false,
    transcript: '',
    interimTranscript: '',
    lastMatchedCommand: null,
    lastAction: null,
    error: null,
    voiceFeedbackEnabled: true,
    permissionState: 'unknown',
    preferences: DEFAULT_VOICE_PREFERENCES,
    filteredOutNoiseCount: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'executed' | 'unrecognized' | 'failed'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [reExecutingId, setReExecutingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'cheat_sheet'>('history');
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Subscribe to voice history and navigation state
  useEffect(() => {
    const unsubHistory = subscribeVoiceHistory((h) => {
      setHistory(h);
    });
    const unsubVoice = subscribeVoiceNav((v) => {
      setVoiceNavState(v);
    });

    return () => {
      unsubHistory();
      unsubVoice();
    };
  }, []);

  // Keyboard shortcut (Escape to close)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setIsConfirmingClear(false);
      setSearchQuery('');
    }
  }, [isOpen]);

  // Filtered voice history list
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.transcript.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.matchedLabel && item.matchedLabel.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.action?.type && item.action.type.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [history, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = history.length;
    const executed = history.filter((h) => h.status === 'executed').length;
    const unrecognized = history.filter((h) => h.status === 'unrecognized').length;
    const successRate = total > 0 ? Math.round((executed / total) * 100) : 0;
    return { total, executed, unrecognized, successRate };
  }, [history]);

  // Handle re-executing command
  const handleReExecute = (entry: VoiceHistoryEntry) => {
    setReExecutingId(entry.id);
    const success = reExecuteVoiceCommand(entry);

    if (onNotify) {
      if (success) {
        onNotify('Voice Command Re-Executed', `Successfully ran "${entry.transcript}"`, 'success');
      } else {
        onNotify('Voice Command Failed', `Could not execute "${entry.transcript}"`, 'warning');
      }
    }

    setTimeout(() => {
      setReExecutingId(null);
    }, 600);
  };

  // Handle copy transcript
  const handleCopyTranscript = (entry: VoiceHistoryEntry) => {
    navigator.clipboard.writeText(entry.transcript);
    setCopiedId(entry.id);
    if (onNotify) {
      onNotify('Copied', `"${entry.transcript}" copied to clipboard`, 'info');
    }
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle delete item
  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteVoiceCommandHistoryItem(id);
    if (onNotify) {
      onNotify('Deleted', 'Command entry removed from history', 'info');
    }
  };

  // Handle clear all
  const handleClearAll = () => {
    clearVoiceCommandHistory();
    setIsConfirmingClear(false);
    if (onNotify) {
      onNotify('History Cleared', 'All voice command transcripts have been cleared', 'info');
    }
  };

  // Handle export JSON
  const handleExportHistory = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `voice_command_history_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    if (onNotify) {
      onNotify('Exported', 'Voice history exported as JSON file', 'success');
    }
  };

  // Toggle microphone
  const handleToggleMic = () => {
    if (voiceNavState.isListening) {
      stopVoiceRecognition();
      if (onNotify) onNotify('Voice Navigation', 'Microphone paused', 'info');
    } else {
      startVoiceRecognition(false);
      if (onNotify) onNotify('Voice Navigation', 'Listening for commands...', 'info');
    }
  };

  // Format relative timestamp
  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Format exact time string
  const formatExactTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Action Icon Resolver
  const renderActionIcon = (entry: VoiceHistoryEntry) => {
    if (!entry.action) {
      return <HelpCircle className="w-4 h-4 text-amber-400" />;
    }
    switch (entry.action.type) {
      case 'NAVIGATE_TAB':
        return <Layers className="w-4 h-4 text-cyan-400" />;
      case 'OPEN_ADMIN_MODAL':
      case 'CLOSE_ADMIN_MODAL':
        return <Shield className="w-4 h-4 text-amber-400" />;
      case 'OPEN_PROFILE_MODAL':
        return <Sliders className="w-4 h-4 text-indigo-400" />;
      case 'SAVE_WORK':
        return <Save className="w-4 h-4 text-emerald-400" />;
      case 'TOGGLE_DARK_MODE':
        return <Moon className="w-4 h-4 text-purple-400" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Slide-over Panel from Right */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10 pointer-events-auto">
        <aside
          aria-label="Voice Navigation History"
          className="w-screen max-w-md bg-[#0b0f19]/95 backdrop-blur-2xl border-l border-indigo-500/30 text-white flex flex-col shadow-2xl shadow-black/90 animate-in slide-in-from-right duration-300"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-gradient-to-b from-indigo-950/40 to-transparent flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-cyan-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-indigo-950/80">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-bold text-white font-['Syne'] tracking-wide">
                      Voice Navigation History
                    </h2>
                    <span className="px-1.5 py-0.2 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-700/60 text-[9px] font-mono font-bold">
                      {history.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Transcripts & one-click command re-execution
                  </p>
                </div>
              </div>

              {/* Close & Mute Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleVoiceFeedback}
                  title={voiceNavState.voiceFeedbackEnabled ? 'Audio Feedback ON (Click to Mute)' : 'Audio Feedback OFF (Click to Unmute)'}
                  className={`p-2 rounded-xl border text-xs transition-colors ${
                    voiceNavState.voiceFeedbackEnabled
                      ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {voiceNavState.voiceFeedbackEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Close Sidebar (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Live Mic Bar & Stats Pill */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleToggleMic}
                className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  voiceNavState.isListening
                    ? 'bg-rose-600/90 hover:bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-950 animate-pulse'
                    : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border-indigo-500/40 hover:border-indigo-400'
                }`}
              >
                {voiceNavState.isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Stop Recording</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Speak New Command</span>
                  </>
                )}
              </button>

              <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Success Rate:</span>
                <span className="font-mono font-bold text-emerald-400">{stats.successRate}%</span>
              </div>
            </div>

            {/* Live Streaming Audio / Interim Transcript Card (when mic is active) */}
            {voiceNavState.isListening && (
              <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-[10px] font-mono text-rose-300 mb-1">
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    LIVE SPEECH STREAM
                  </span>
                  <span>{voiceNavState.isContinuous ? 'CONTINUOUS' : 'SINGLE SHOT'}</span>
                </div>
                <div className="text-xs text-amber-200 font-mono italic">
                  {voiceNavState.interimTranscript
                    ? `"${voiceNavState.interimTranscript}"`
                    : voiceNavState.transcript
                    ? `"${voiceNavState.transcript}"`
                    : 'Listening... say a command like "Go to Film Studio" or "Save Work"'}
                </div>
              </div>
            )}

            {/* Navigation Tabs (History vs Cheat Sheet) */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'history'
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Transcript Log</span>
                <span className="text-[10px] font-mono opacity-80">({history.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('cheat_sheet')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'cheat_sheet'
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Quick Commands</span>
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={listContainerRef}>
            {activeTab === 'history' ? (
              <>
                {/* Search & Filter Bar */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search transcripts or commands..."
                      className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Status Filters */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setStatusFilter('all')}
                      className={`px-2.5 py-1 rounded-lg border font-semibold transition-all shrink-0 ${
                        statusFilter === 'all'
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-600/80 shadow-xs'
                          : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      All ({history.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('executed')}
                      className={`px-2.5 py-1 rounded-lg border font-semibold transition-all shrink-0 flex items-center gap-1 ${
                        statusFilter === 'executed'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-600/80 shadow-xs'
                          : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Executed ({stats.executed})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('unrecognized')}
                      className={`px-2.5 py-1 rounded-lg border font-semibold transition-all shrink-0 flex items-center gap-1 ${
                        statusFilter === 'unrecognized'
                          ? 'bg-amber-950 text-amber-300 border-amber-600/80 shadow-xs'
                          : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <AlertCircle className="w-3 h-3 text-amber-400" />
                      <span>Unrecognized ({stats.unrecognized})</span>
                    </button>
                  </div>
                </div>

                {/* Transcripts List */}
                {filteredHistory.length === 0 ? (
                  <div className="py-12 px-4 text-center rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                      <Mic className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-300 font-['Syne']">
                        {searchQuery || statusFilter !== 'all' ? 'No matching commands found' : 'No voice commands yet'}
                      </h3>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-1">
                        {searchQuery || statusFilter !== 'all'
                          ? 'Try clearing your search query or filter tags.'
                          : 'Speak into your microphone or pick a command from the Quick Commands tab.'}
                      </p>
                    </div>
                    {(!searchQuery && statusFilter === 'all') && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('cheat_sheet')}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-lg shadow-indigo-950 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Browse Command Examples</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredHistory.map((item) => {
                      const isReExecuting = reExecutingId === item.id;
                      const isCopied = copiedId === item.id;
                      const isSuccess = item.status === 'executed';

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-2xl border transition-all relative group ${
                            isSuccess
                              ? 'bg-slate-950/80 hover:bg-slate-900/90 border-slate-800 hover:border-cyan-500/40'
                              : 'bg-amber-950/20 hover:bg-amber-950/30 border-amber-500/30 hover:border-amber-500/50'
                          }`}
                        >
                          {/* Top Row: Timestamp & Status badge */}
                          <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400 mb-1.5">
                            <div className="flex items-center gap-1.5 font-mono">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span title={formatExactTime(item.timestamp)}>{formatTime(item.timestamp)}</span>
                              {item.confidence !== undefined && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                                  {Math.round(item.confidence * 100)}% conf
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              {isSuccess ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-semibold text-[9px]">
                                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                                  Executed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 font-semibold text-[9px]">
                                  <AlertCircle className="w-2.5 h-2.5 text-amber-400" />
                                  Unrecognized
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Middle: Transcript Quote */}
                          <div className="flex items-start gap-2.5 my-1.5">
                            <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                              {renderActionIcon(item)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-200 font-mono tracking-tight leading-snug">
                                "{item.transcript}"
                              </p>
                              {item.matchedLabel && (
                                <p className="text-[11px] text-cyan-400 font-medium flex items-center gap-1 mt-0.5 truncate">
                                  <ChevronRight className="w-3 h-3 shrink-0" />
                                  <span>{item.matchedLabel}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Bottom Row: Actions (Re-execute, Copy, Delete) */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-2">
                            <button
                              type="button"
                              onClick={() => handleReExecute(item)}
                              disabled={isReExecuting}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                                isSuccess
                                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:brightness-110 text-white shadow-xs'
                                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-xs'
                              } disabled:opacity-50`}
                              title="Re-run this voice command immediately"
                            >
                              <Play className={`w-3 h-3 ${isReExecuting ? 'animate-spin' : 'fill-current'}`} />
                              <span>{isReExecuting ? 'Executing...' : 'Re-Execute'}</span>
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleCopyTranscript(item)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                                title="Copy transcript to clipboard"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteItem(item.id, e)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/80 hover:text-rose-400 border border-slate-800 hover:border-rose-800 text-slate-400 transition-colors"
                                title="Delete from history"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              /* Cheat Sheet / Quick Commands Tab */
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-xs space-y-1">
                  <div className="font-bold text-indigo-300 font-['Syne'] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Instant Re-execution Cheat Sheet</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Click any command below to test or say it aloud after starting the microphone.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {VOICE_COMMAND_EXAMPLES.map((item) => (
                    <button
                      key={item.phrase}
                      type="button"
                      onClick={() => {
                        const newEntry = addVoiceCommandHistoryEntry({
                          transcript: item.phrase,
                          action: null,
                          matchedLabel: null,
                          timestamp: Date.now(),
                          confidence: 1.0,
                          status: 'executed',
                        });
                        handleReExecute(newEntry);
                      }}
                      className="p-3 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-left transition-all group flex items-center justify-between"
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 font-mono flex items-center gap-1.5">
                          <span>"{item.phrase}"</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {item.desc}
                        </div>
                      </div>
                      <div className="px-2 py-1 rounded-lg bg-indigo-600/20 group-hover:bg-indigo-600 text-indigo-300 group-hover:text-white border border-indigo-500/40 text-[10px] font-bold flex items-center gap-1 shrink-0 transition-all">
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Run</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/90 flex items-center justify-between gap-2">
            {isConfirmingClear ? (
              <div className="flex items-center gap-1.5 w-full">
                <span className="text-[11px] text-rose-300 font-semibold flex-1">Clear all {history.length} records?</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
                >
                  Yes, Clear
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingClear(false)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleExportHistory}
                    disabled={history.length === 0}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
                    title="Export history as JSON"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Export</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsConfirmingClear(true)}
                    disabled={history.length === 0}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-900 text-slate-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
                    title="Clear history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>

                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                  <span>Shortcut:</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">Esc</kbd>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

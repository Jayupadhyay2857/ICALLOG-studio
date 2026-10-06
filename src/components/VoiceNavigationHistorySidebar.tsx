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
  Zap,
  Plus,
  ArrowRight,
  Radio,
  Box,
  Edit2,
  Power,
  Music,
  ExternalLink,
} from 'lucide-react';
import {
  VoiceHistoryEntry,
  VoiceNavState,
  VoiceMacro,
  VoiceMacroStep,
  subscribeVoiceHistory,
  subscribeVoiceNav,
  subscribeVoiceMacros,
  getVoiceMacros,
  saveVoiceMacro,
  deleteVoiceMacro,
  toggleVoiceMacro,
  executeVoiceMacro,
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

const ALL_STUDIO_TABS: { id: ActiveTab; label: string; icon: string }[] = [
  { id: 'film_studio', label: 'Film Studio (Cinema Director)', icon: '🎬' },
  { id: '3d_engine', label: '3D WebGL Armature Engine', icon: '🎮' },
  { id: 'podcast_studio', label: 'Podcast & Soundstage Studio', icon: '🎙️' },
  { id: 'pro_camera', label: 'Pro Camera & Teleprompter', icon: '📷' },
  { id: 'office_suite', label: 'Office Suite (Docs/Excel/PPT)', icon: '📄' },
  { id: 'design_studio', label: 'Design Identity & Favicons', icon: '🎨' },
  { id: 'image_studio', label: '240p to 8K Image Studio', icon: '🖼️' },
  { id: 'video_audio', label: '8K Video & Audio Suite', icon: '📹' },
  { id: 'song_studio', label: 'Song & Music Synth Studio', icon: '🎵' },
  { id: 'live_collab', label: 'Live Collab Canvas Whiteboard', icon: '👥' },
  { id: 'projects_hub', label: 'Projects Hub & My Work', icon: '📁' },
  { id: 'chat_mentor', label: 'AI Chatbot Mentor', icon: '🤖' },
  { id: 'cloud_storage', label: 'Cloud Media Storage Vault', icon: '☁️' },
  { id: 'user_manual', label: 'User Manual & Documentation', icon: '📖' },
];

export const VoiceNavigationHistorySidebar: React.FC<VoiceNavigationHistorySidebarProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenAdminModal,
  onOpenProfileModal,
  onNotify,
}) => {
  const [history, setHistory] = useState<VoiceHistoryEntry[]>([]);
  const [macros, setMacros] = useState<VoiceMacro[]>([]);
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
  const [runningMacroId, setRunningMacroId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'macros' | 'cheat_sheet'>('history');
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  // Macro Creator / Editor State
  const [isMacroModalOpen, setIsMacroModalOpen] = useState(false);
  const [editingMacroId, setEditingMacroId] = useState<string | null>(null);
  const [macroName, setMacroName] = useState('');
  const [macroTrigger, setMacroTrigger] = useState('');
  const [macroDesc, setMacroDesc] = useState('');
  const [macroSteps, setMacroSteps] = useState<VoiceMacroStep[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Subscribe to voice history, navigation state, and macros
  useEffect(() => {
    const unsubHistory = subscribeVoiceHistory((h) => setHistory(h));
    const unsubVoice = subscribeVoiceNav((v) => setVoiceNavState(v));
    const unsubMacros = subscribeVoiceMacros((m) => setMacros(m));

    return () => {
      unsubHistory();
      unsubVoice();
      unsubMacros();
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

  // Filtered macros list
  const filteredMacros = useMemo(() => {
    return macros.filter((m) => {
      return (
        searchQuery.trim() === '' ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.triggerPhrase.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [macros, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = history.length;
    const executed = history.filter((h) => h.status === 'executed').length;
    const unrecognized = history.filter((h) => h.status === 'unrecognized').length;
    const successRate = total > 0 ? Math.round((executed / total) * 100) : 0;
    const totalMacroRuns = macros.reduce((acc, m) => acc + (m.timesExecuted || 0), 0);
    return { total, executed, unrecognized, successRate, totalMacroRuns };
  }, [history, macros]);

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

  // Handle run macro directly
  const handleRunMacro = async (macro: VoiceMacro) => {
    setRunningMacroId(macro.id);
    const success = await executeVoiceMacro(macro);
    if (onNotify) {
      if (success) {
        onNotify('Voice Macro Executed', `Finished "${macro.name}" workflow.`, 'success');
      } else {
        onNotify('Macro Execution Failed', `Could not finish "${macro.name}".`, 'warning');
      }
    }
    setTimeout(() => {
      setRunningMacroId(null);
    }, 800);
  };

  // Open macro creator modal
  const handleOpenCreateMacro = () => {
    setEditingMacroId(null);
    setMacroName('');
    setMacroTrigger('');
    setMacroDesc('');
    setMacroSteps([
      {
        id: `step_${Date.now()}_1`,
        type: 'speech_feedback',
        speechText: 'Activating custom studio mode',
        delayMs: 100,
      },
      {
        id: `step_${Date.now()}_2`,
        type: 'navigate_tab',
        tab: 'film_studio',
        delayMs: 200,
      },
      {
        id: `step_${Date.now()}_3`,
        type: 'save_work',
        delayMs: 150,
      },
    ]);
    setIsMacroModalOpen(true);
  };

  // Open macro editor
  const handleOpenEditMacro = (macro: VoiceMacro) => {
    setEditingMacroId(macro.id);
    setMacroName(macro.name);
    setMacroTrigger(macro.triggerPhrase);
    setMacroDesc(macro.description);
    setMacroSteps(macro.steps.map((s) => ({ ...s })));
    setIsMacroModalOpen(true);
  };

  // Save macro
  const handleSaveMacroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!macroName.trim() || !macroTrigger.trim()) {
      if (onNotify) onNotify('Incomplete Macro', 'Please provide a macro name and spoken trigger phrase.', 'warning');
      return;
    }

    if (macroSteps.length === 0) {
      if (onNotify) onNotify('No Steps Added', 'Please add at least one execution step to the macro.', 'warning');
      return;
    }

    const saved = saveVoiceMacro({
      id: editingMacroId || undefined,
      name: macroName.trim(),
      triggerPhrase: macroTrigger.trim(),
      description: macroDesc.trim() || `Custom voice macro alias for "${macroTrigger.trim()}"`,
      steps: macroSteps,
      icon: 'Zap',
      badgeColor: 'from-amber-500 to-cyan-500',
      isEnabled: true,
    });

    if (onNotify) {
      onNotify('Voice Macro Saved!', `Say "${saved.triggerPhrase}" anytime to trigger this workflow.`, 'success');
    }
    setIsMacroModalOpen(false);
  };

  // Add step to current macro builder
  const handleAddStepToMacro = (type: VoiceMacroStep['type']) => {
    const newStep: VoiceMacroStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type,
      delayMs: 150,
      tab: type === 'navigate_tab' ? 'film_studio' : undefined,
      speechText: type === 'speech_feedback' ? 'Executing voice macro action' : undefined,
      modal: type === 'open_modal' ? 'admin' : undefined,
    };
    setMacroSteps((prev) => [...prev, newStep]);
  };

  // Remove step from macro builder
  const handleRemoveStepFromMacro = (id: string) => {
    setMacroSteps((prev) => prev.filter((s) => s.id !== id));
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
    const payload = {
      exportedAt: new Date().toISOString(),
      history,
      macros,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `voice_navigation_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    if (onNotify) {
      onNotify('Exported', 'Voice history and macros exported as JSON file', 'success');
    }
  };

  // Toggle microphone
  const handleToggleMic = () => {
    if (voiceNavState.isListening) {
      stopVoiceRecognition();
      if (onNotify) onNotify('Voice Navigation', 'Microphone paused', 'info');
    } else {
      startVoiceRecognition(false);
      if (onNotify) onNotify('Voice Navigation', 'Listening for commands & macros...', 'info');
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

  const formatExactTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Action Icon Resolver
  const renderActionIcon = (entry: VoiceHistoryEntry) => {
    if (!entry.action) {
      return <HelpCircle className="w-4 h-4 text-amber-400" />;
    }
    if (entry.action.type === 'EXECUTE_MACRO') {
      return <Zap className="w-4 h-4 text-amber-400" />;
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
          aria-label="Voice Navigation History & Macro Manager"
          className="w-screen max-w-lg bg-[#0b0f19]/95 backdrop-blur-2xl border-l border-indigo-500/30 text-white flex flex-col shadow-2xl shadow-black/90 animate-in slide-in-from-right duration-300"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-gradient-to-b from-indigo-950/40 to-transparent flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-cyan-500 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-indigo-950/80">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-bold text-white font-['Syne'] tracking-wide">
                      Voice Hub & Macro Manager
                    </h2>
                    <span className="px-1.5 py-0.2 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-700/60 text-[9px] font-mono font-bold">
                      {macros.length} Macros • {history.length} Logs
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Transcripts, custom voice aliases & multi-step workflows
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
                    <span>Stop Mic</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Speak Command / Macro</span>
                  </>
                )}
              </button>

              <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Macro Runs:</span>
                <span className="font-mono font-bold text-amber-400">{stats.totalMacroRuns}</span>
              </div>
            </div>

            {/* Live Streaming Audio / Interim Transcript Card */}
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
                    : 'Listening... say any custom macro like "Cinema Director Mode" or "Deep Focus Podcast"'}
                </div>
              </div>
            )}

            {/* Navigation Tabs (History vs Macros vs Cheat Sheet) */}
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
                <span>Logs</span>
                <span className="text-[10px] font-mono opacity-80">({history.length})</span>
              </button>

              <button
                id="voice-macros-manager-tab-btn"
                type="button"
                onClick={() => setActiveTab('macros')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'macros'
                    ? 'bg-gradient-to-r from-amber-500 to-cyan-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Macros ⚡</span>
                <span className="text-[10px] font-mono opacity-90">({macros.length})</span>
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
                <span>Cheats</span>
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={listContainerRef}>
            {/* TAB 1: HISTORY / TRANSCRIPT LOG */}
            {activeTab === 'history' && (
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
                      placeholder="Search transcripts, macros, or actions..."
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
                          : 'Speak into your microphone or try running a custom macro workflow.'}
                      </p>
                    </div>
                    {(!searchQuery && statusFilter === 'all') && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('macros')}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-cyan-500 text-slate-950 text-xs font-black inline-flex items-center gap-1.5 shadow-lg transition-all"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>Explore Voice Macros</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredHistory.map((item) => {
                      const isReExecuting = reExecutingId === item.id;
                      const isCopied = copiedId === item.id;
                      const isSuccess = item.status === 'executed';
                      const isMacro = item.action?.type === 'EXECUTE_MACRO';

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-2xl border transition-all relative group ${
                            isMacro
                              ? 'bg-gradient-to-r from-amber-950/30 via-slate-950/80 to-slate-950/90 border-amber-500/40 hover:border-amber-400'
                              : isSuccess
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
                              {isMacro && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[9px]">
                                  <Zap className="w-2.5 h-2.5 fill-current" />
                                  Macro
                                </span>
                              )}
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

                          {/* Bottom Row: Actions */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-2">
                            <button
                              type="button"
                              onClick={() => handleReExecute(item)}
                              disabled={isReExecuting}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                                isMacro
                                  ? 'bg-gradient-to-r from-amber-500 to-cyan-500 text-slate-950 font-black shadow-xs'
                                  : isSuccess
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
            )}

            {/* TAB 2: VOICE MACRO MANAGER */}
            {activeTab === 'macros' && (
              <div className="space-y-4">
                {/* Header Banner & Add Macro Button */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-cyan-950/40 border border-amber-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shadow-md">
                        <Zap className="w-4 h-4 fill-current" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-white font-['Syne']">
                          Voice Macro Workflows
                        </h3>
                        <p className="text-[10px] text-slate-300">
                          Create custom voice aliases for multi-step tasks
                        </p>
                      </div>
                    </div>
                    <button
                      id="create-new-voice-macro-btn"
                      type="button"
                      onClick={handleOpenCreateMacro}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-cyan-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>New Macro</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Speak your trigger phrase (e.g. <span className="text-amber-300 font-mono font-bold">"Cinema Director Mode"</span>) to execute sequential actions, open studios, and apply presets hands-free.
                  </p>
                </div>

                {/* Macro List */}
                <div className="space-y-2.5">
                  {filteredMacros.map((macro) => {
                    const isRunning = runningMacroId === macro.id;

                    return (
                      <div
                        key={macro.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          macro.isEnabled
                            ? 'bg-slate-950/90 border-slate-800 hover:border-amber-500/50 shadow-md'
                            : 'bg-slate-950/40 border-slate-900 opacity-60'
                        }`}
                      >
                        {/* Macro Title & Status Toggle */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
                              <Zap className="w-3.5 h-3.5 fill-current" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white truncate font-['Syne']">
                                {macro.name}
                              </h4>
                              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                <span>Trigger:</span>
                                <span className="px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 font-bold border border-amber-500/30">
                                  "{macro.triggerPhrase}"
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleVoiceMacro(macro.id, !macro.isEnabled)}
                              title={macro.isEnabled ? 'Disable Macro' : 'Enable Macro'}
                              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                                macro.isEnabled
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600/60'
                                  : 'bg-slate-900 text-slate-500 border-slate-800'
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditMacro(macro)}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
                              title="Edit Macro"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteVoiceMacro(macro.id)}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-800"
                              title="Delete Macro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-[11px] text-slate-400 mb-2">
                          {macro.description}
                        </p>

                        {/* Steps Sequence Pills */}
                        <div className="space-y-1 bg-slate-900/90 p-2 rounded-xl border border-slate-800/80 mb-2.5">
                          <div className="text-[9px] font-mono font-bold text-slate-400 uppercase">
                            Execution Sequence ({macro.steps.length} Steps):
                          </div>
                          <div className="flex flex-wrap items-center gap-1 text-[10px]">
                            {macro.steps.map((step, idx) => (
                              <React.Fragment key={step.id}>
                                <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 font-mono flex items-center gap-1">
                                  <span className="text-amber-400 font-bold">{idx + 1}.</span>
                                  {step.type === 'speech_feedback' && `🗣️ "${step.speechText}"`}
                                  {step.type === 'navigate_tab' && `📂 ${step.tab?.replace('_', ' ')}`}
                                  {step.type === 'open_modal' && `🪟 Open ${step.modal}`}
                                  {step.type === 'save_work' && `💾 Auto-Save`}
                                  {step.type === 'toggle_dark_mode' && `🌓 Theme`}
                                  {step.type === 'extend_session' && `⏱️ Token +15m`}
                                </span>
                                {idx < macro.steps.length - 1 && (
                                  <ArrowRight className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>

                        {/* Bottom Bar: Run Macro & Stats */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                          <span className="text-[10px] text-slate-500 font-mono">
                            Ran {macro.timesExecuted || 0} times
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRunMacro(macro)}
                            disabled={isRunning || !macro.isEnabled}
                            className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-cyan-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-40"
                          >
                            <Play className={`w-3 h-3 ${isRunning ? 'animate-spin' : 'fill-current'}`} />
                            <span>{isRunning ? 'Running...' : 'Run Macro'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: CHEAT SHEET */}
            {activeTab === 'cheat_sheet' && (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-xs space-y-1">
                  <div className="font-bold text-indigo-300 font-['Syne'] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Standard Voice Command Cheats</span>
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
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Export history and macros as JSON"
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

      {/* Voice Macro Builder Modal */}
      {isMacroModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg p-5 sm:p-6 rounded-3xl bg-slate-900 border border-amber-500/40 shadow-2xl text-white space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shadow-md">
                  <Zap className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-['Syne']">
                    {editingMacroId ? 'Edit Voice Macro Workflow' : 'Create Custom Voice Macro'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Multi-step automated sequence triggered by spoken phrase
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMacroModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMacroSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
              {/* Macro Name & Trigger */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 font-mono uppercase">
                    Macro Name
                  </label>
                  <input
                    type="text"
                    required
                    value={macroName}
                    onChange={(e) => setMacroName(e.target.value)}
                    placeholder="e.g. Cinema 8K Master Mode"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-amber-300 font-mono uppercase flex items-center gap-1">
                    <Mic className="w-3 h-3 text-amber-400" />
                    Spoken Trigger Phrase
                  </label>
                  <input
                    type="text"
                    required
                    value={macroTrigger}
                    onChange={(e) => setMacroTrigger(e.target.value)}
                    placeholder="e.g. action movie setup"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-amber-500/50 text-xs text-amber-200 placeholder-slate-500 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 font-mono uppercase">
                  Description / Workflow Notes
                </label>
                <input
                  type="text"
                  value={macroDesc}
                  onChange={(e) => setMacroDesc(e.target.value)}
                  placeholder="e.g. Navigates to Film Studio, speaks confirmation and auto-saves project"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Steps Sequence Builder */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white font-['Syne'] uppercase">
                    Sequence Steps ({macroSteps.length})
                  </label>

                  {/* Add Step Dropdown / Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleAddStepToMacro('speech_feedback')}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-bold flex items-center gap-1"
                    >
                      <span>+ 🗣️ Speak</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddStepToMacro('navigate_tab')}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-bold flex items-center gap-1"
                    >
                      <span>+ 📂 Studio</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddStepToMacro('save_work')}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-bold flex items-center gap-1"
                    >
                      <span>+ 💾 Save</span>
                    </button>
                  </div>
                </div>

                {/* Steps List */}
                <div className="space-y-2">
                  {macroSteps.map((step, index) => (
                    <div
                      key={step.id}
                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-400 font-mono flex items-center gap-1.5">
                          <span>Step {index + 1}:</span>
                          <span className="text-slate-300 capitalize">
                            {step.type.replace('_', ' ')}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveStepFromMacro(step.id)}
                          className="p-1 rounded-md text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Step Configuration Fields */}
                      {step.type === 'speech_feedback' && (
                        <div>
                          <input
                            type="text"
                            value={step.speechText || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMacroSteps((prev) =>
                                prev.map((s) => (s.id === step.id ? { ...s, speechText: val } : s))
                              );
                            }}
                            placeholder="Spoken feedback text (TTS)..."
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                          />
                        </div>
                      )}

                      {step.type === 'navigate_tab' && (
                        <div>
                          <select
                            value={step.tab || 'film_studio'}
                            onChange={(e) => {
                              const val = e.target.value as ActiveTab;
                              setMacroSteps((prev) =>
                                prev.map((s) => (s.id === step.id ? { ...s, tab: val } : s))
                              );
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                          >
                            {ALL_STUDIO_TABS.map((tab) => (
                              <option key={tab.id} value={tab.id} className="bg-slate-900">
                                {tab.icon} {tab.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {step.type === 'open_modal' && (
                        <div>
                          <select
                            value={step.modal || 'admin'}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              setMacroSteps((prev) =>
                                prev.map((s) => (s.id === step.id ? { ...s, modal: val } : s))
                              );
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                          >
                            <option value="admin">Admin Override Modal</option>
                            <option value="profile">User Profile & VIP Modal</option>
                            <option value="history">Activity Ledger Modal</option>
                            <option value="cookies">Cookie Storage Modal</option>
                            <option value="voice_history">Voice History Sidebar</option>
                          </select>
                        </div>
                      )}

                      {/* Delay Configuration */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span>Delay after step:</span>
                        <select
                          value={step.delayMs || 150}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setMacroSteps((prev) =>
                              prev.map((s) => (s.id === step.id ? { ...s, delayMs: val } : s))
                            );
                          }}
                          className="bg-slate-900 border border-slate-800 text-slate-300 rounded px-1.5 py-0.5 text-[10px]"
                        >
                          <option value={0}>0ms (Immediate)</option>
                          <option value={150}>150ms</option>
                          <option value={300}>300ms</option>
                          <option value={600}>600ms</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMacroModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-cyan-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-md"
                >
                  {editingMacroId ? 'Update Macro' : 'Save Voice Macro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

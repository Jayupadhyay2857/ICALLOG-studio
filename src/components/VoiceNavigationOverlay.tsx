import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Command,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  Play,
  Layers,
  Shield,
  Clapperboard,
  FileText,
  Box,
  FolderKanban,
  Save,
  Moon,
  Info,
} from 'lucide-react';
import {
  VoiceNavState,
  subscribeVoiceNav,
  startVoiceRecognition,
  stopVoiceRecognition,
  toggleVoiceFeedback,
  executeVoiceAction,
  parseVoiceCommand,
  VOICE_COMMAND_EXAMPLES,
  DEFAULT_VOICE_PREFERENCES,
} from '../lib/voiceNavigation.ts';

interface VoiceNavigationOverlayProps {
  onOpenAdminModal?: () => void;
  onNavigateTab?: (tab: any) => void;
}

export const VoiceNavigationOverlay: React.FC<VoiceNavigationOverlayProps> = () => {
  const [voiceState, setVoiceState] = useState<VoiceNavState>({
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

  const [isExpanded, setIsExpanded] = useState(false);
  const [showCommandsSheet, setShowCommandsSheet] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeVoiceNav((state) => {
      setVoiceState(state);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleToggleListening = () => {
    if (voiceState.isListening) {
      stopVoiceRecognition();
    } else {
      startVoiceRecognition(false);
    }
  };

  const handleToggleContinuous = () => {
    if (voiceState.isListening && voiceState.isContinuous) {
      stopVoiceRecognition();
    } else {
      startVoiceRecognition(true);
    }
  };

  const handleExecuteQuickCommand = (phrase: string) => {
    const action = parseVoiceCommand(phrase);
    if (action) {
      executeVoiceAction(action);
    }
  };

  return (
    <>
      {/* Floating Compact Voice Controller Bar */}
      <div
        id="voice-navigation-floating-bar"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-auto transition-all duration-300"
      >
        {/* Expanded Command Sheet / Drawer */}
        {isExpanded && (
          <div className="mb-2.5 w-[92vw] max-w-lg p-4 rounded-3xl bg-[#0d121f]/95 backdrop-blur-2xl border border-indigo-500/40 shadow-2xl shadow-indigo-950/80 text-white animate-in fade-in slide-in-from-bottom-4 duration-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white font-['Syne'] flex items-center gap-1.5">
                    <span>Web Speech Voice Navigation</span>
                    <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 text-[9px] font-mono">
                      W3C API
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Hands-free voice control to switch studios and open modals
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleVoiceFeedback}
                  title={voiceState.voiceFeedbackEnabled ? 'Mute Voice Audio Feedback' : 'Unmute Voice Audio Feedback'}
                  className={`p-1.5 rounded-lg border text-xs transition-colors ${
                    voiceState.voiceFeedbackEnabled
                      ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {voiceState.voiceFeedbackEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Error or Permission Alert */}
            {voiceState.error && (
              <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-[11px]">{voiceState.error}</div>
                  <div className="text-[10px] text-rose-200/80">
                    Tip: If permissions were blocked, click the lock icon in your browser URL address bar and set Microphone to "Allow".
                  </div>
                </div>
              </div>
            )}

            {/* Live Voice State Box */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      voiceState.isListening ? 'bg-red-500 animate-ping' : 'bg-slate-600'
                    }`}
                  />
                  {voiceState.isListening
                    ? voiceState.isContinuous
                      ? 'LISTENING CONTINUOUSLY...'
                      : 'LISTENING FOR COMMAND...'
                    : 'MIC IDLE'}
                </span>
                <span>{voiceState.voiceFeedbackEnabled ? 'Audio Feedback ON' : 'Audio Feedback OFF'}</span>
              </div>

              {/* Transcript Display */}
              <div className="min-h-[40px] flex items-center justify-center text-center p-2 rounded-xl bg-slate-900/90 border border-slate-800/80">
                {voiceState.interimTranscript ? (
                  <p className="text-xs text-amber-300 font-mono italic animate-pulse">
                    "{voiceState.interimTranscript}"
                  </p>
                ) : voiceState.transcript ? (
                  <p className="text-xs text-cyan-300 font-medium font-mono">
                    "{voiceState.transcript}"
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    {voiceState.isListening
                      ? 'Speak now: "Open Admin Modal" or "Go to Film Studio"...'
                      : 'Press Start Speaking or tap any suggested command below.'}
                  </p>
                )}
              </div>

              {/* Matched Command Badge */}
              {voiceState.lastMatchedCommand && (
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-300 pt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Executed: {voiceState.lastMatchedCommand}</span>
                </div>
              )}
            </div>

            {/* Quick Command Suggestions Chips */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>CLICK TO TEST OR SAY ALOUD:</span>
                <span className="text-cyan-400">11+ Commands Available</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {VOICE_COMMAND_EXAMPLES.map((item) => (
                  <button
                    key={item.phrase}
                    type="button"
                    onClick={() => handleExecuteQuickCommand(item.phrase)}
                    className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-850 hover:border-cyan-500/50 border border-slate-800 text-left transition-all group flex flex-col justify-between"
                  >
                    <div className="text-[11px] font-bold text-slate-200 group-hover:text-cyan-300 flex items-center gap-1 truncate">
                      <Play className="w-2.5 h-2.5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span>"{item.phrase}"</span>
                    </div>
                    <div className="text-[9px] text-slate-500 truncate mt-0.5">
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mode & Action Controls */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
              <button
                type="button"
                onClick={handleToggleContinuous}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 ${
                  voiceState.isListening && voiceState.isContinuous
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <span>Continuous Mode</span>
                <span className={`w-1.5 h-1.5 rounded-full ${voiceState.isContinuous ? 'bg-amber-400' : 'bg-slate-600'}`} />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleListening}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold shadow-lg flex items-center gap-2 transition-all ${
                    voiceState.isListening
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950 animate-pulse'
                      : 'bg-gradient-to-r from-indigo-600 via-cyan-600 to-emerald-600 hover:brightness-110 text-white shadow-indigo-950'
                  }`}
                >
                  {voiceState.isListening ? (
                    <>
                      <MicOff className="w-3.5 h-3.5" />
                      <span>Stop Listening</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      <span>Start Speaking</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Compact Pill Badge when Docked */}
        <div className="flex items-center gap-2 p-1.5 pl-3 pr-2 rounded-full bg-[#0d121f]/95 backdrop-blur-xl border border-indigo-500/40 shadow-xl shadow-indigo-950/60 text-white">
          {/* Wave / Mic Indicator */}
          <button
            type="button"
            onClick={handleToggleListening}
            title={voiceState.isListening ? 'Click to Stop Listening' : 'Click to Speak Voice Command'}
            className={`p-2 rounded-full transition-all flex items-center justify-center ${
              voiceState.isListening
                ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {voiceState.isListening ? (
              <Mic className="w-4 h-4 animate-bounce" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          {/* Text feedback */}
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className="cursor-pointer flex flex-col justify-center select-none"
          >
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-[11px] font-bold font-['Syne'] text-white">
                Voice Navigation
              </span>
              {voiceState.isListening && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </div>
            <span className="text-[9px] text-slate-400 font-mono truncate max-w-[170px] sm:max-w-[240px]">
              {voiceState.isListening
                ? voiceState.interimTranscript || voiceState.transcript || 'Listening... Say command'
                : voiceState.lastMatchedCommand
                ? `Done: ${voiceState.lastMatchedCommand}`
                : "Say 'Open Admin Modal' or 'Go to Film Studio'"}
            </span>
          </div>

          {/* Quick Trigger Admin Modal direct button */}
          <button
            type="button"
            onClick={() => handleExecuteQuickCommand('Open Admin Modal')}
            title="Voice Quick Test: Open Admin Modal"
            className="hidden sm:flex px-2 py-1 rounded-full bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 text-amber-300 text-[10px] font-bold items-center gap-1 transition-colors"
          >
            <Shield className="w-2.5 h-2.5" />
            <span>Admin</span>
          </button>

          {/* Quick Trigger Film Studio direct button */}
          <button
            type="button"
            onClick={() => handleExecuteQuickCommand('Go to Film Studio')}
            title="Voice Quick Test: Go to Film Studio"
            className="hidden sm:flex px-2 py-1 rounded-full bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-300 text-[10px] font-bold items-center gap-1 transition-colors"
          >
            <Clapperboard className="w-2.5 h-2.5" />
            <span>Film</span>
          </button>

          {/* Toggle Expand / Collapse button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse Voice Panel' : 'Expand Voice Commands Panel'}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </>
  );
};

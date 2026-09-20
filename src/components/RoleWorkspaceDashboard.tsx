import React, { useState } from 'react';
import {
  Sparkles,
  Film,
  Music,
  Video,
  Box,
  FolderKanban,
  FileText,
  Presentation,
  FileSpreadsheet,
  Palette,
  Layers,
  Mic,
  Cpu,
  Zap,
  ArrowRight,
  Clock,
  ShieldCheck,
  CheckCircle,
  Plus,
  Play,
  Sliders,
  Share2,
  Bookmark,
  TrendingUp,
  Award,
  BookOpen,
  Hash,
  Smartphone,
  Flame,
  GraduationCap,
  Briefcase,
  SlidersHorizontal,
  Compass,
  Camera,
} from 'lucide-react';
import { ActiveTab, PersonaType, UserProfile, ProjectItem } from '../types.ts';
import { getPersonaConfig, PRIMARY_CATEGORIES } from './PersonaBadge.tsx';

interface RoleWorkspaceDashboardProps {
  user: UserProfile;
  setActiveTab: (tab: ActiveTab) => void;
  onSelectSubTab?: (tab: ActiveTab, subTab: string) => void;
  onUpdateUser: (updated: UserProfile) => void;
  onNotify: (title: string, desc: string, type?: 'info' | 'success' | 'warning' | 'error' | 'admin') => void;
  onOpenTutorial?: () => void;
  onOpenProfileModal?: (tab?: 'auth' | 'profile' | 'personas' | 'vip' | 'cookies') => void;
}

export const RoleWorkspaceDashboard: React.FC<RoleWorkspaceDashboardProps> = ({
  user,
  setActiveTab,
  onSelectSubTab,
  onUpdateUser,
  onNotify,
  onOpenTutorial,
  onOpenProfileModal,
}) => {
  const currentRole: PersonaType = user.personaType || 'general';
  const personaConfig = getPersonaConfig(currentRole);

  // Quick switch role handler directly from the dashboard
  const handleRoleChange = (role: PersonaType) => {
    const cfg = getPersonaConfig(role);
    const existingSubs = user.subProfiles || [];
    const matching = existingSubs.find((p) => p.personaType === role);

    const defaultNames: Record<string, { name: string; avatar: string }> = {
      professional: { name: 'Pro Studio VFX', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80' },
      student: { name: 'Scholar Student', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80' },
      general: { name: 'General Creator', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80' },
      creator: { name: 'Creator Studio', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80' },
    };
    const def = defaultNames[role] || { name: cfg.label, avatar: user.avatarUrl || '' };

    const updatedUser: UserProfile = {
      ...user,
      personaType: role,
      name: matching ? matching.name : def.name,
      avatarUrl: matching ? (matching.avatarUrl || user.avatarUrl) : def.avatar,
      activeProfileId: matching ? matching.id : user.activeProfileId,
    };

    onUpdateUser(updatedUser);
    onNotify(
      `Workspace Switched to ${cfg.label}`,
      `Tools, layout, and priority actions updated for ${cfg.badgeEmoji} ${cfg.hindiLabel}.`,
      'success'
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. Header & Dynamic Role Selector Bar */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Personalized Role Workspace</span>
                </span>
                {user.isGuestAccount && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
                    👤 Guest Mode
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-['Syne'] tracking-tight flex items-center gap-2">
                <span>{personaConfig.badgeEmoji}</span>
                <span>{user.name || 'Creator'}&apos;s Workspace</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                Active Role: <strong className="text-cyan-300">{personaConfig.label} ({personaConfig.hindiLabel})</strong>. Tools, layout hierarchy, and AI pipelines are dynamically aligned to your objective.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-start md:self-center">
              {onOpenTutorial && (
                <button
                  type="button"
                  onClick={onOpenTutorial}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-cyan-300 border border-indigo-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Guest Tutorial</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenProfileModal && onOpenProfileModal('personas')}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Manage Roles</span>
              </button>
            </div>
          </div>

          {/* Interactive Role Switcher Pill Bar */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Switch Category:</span>
            </span>

            {PRIMARY_CATEGORIES.map((cat) => {
              const isActive = currentRole === cat.type;
              return (
                <button
                  key={cat.type}
                  type="button"
                  onClick={() => handleRoleChange(cat.type)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-cyan-900/40 scale-105 border border-cyan-400/80'
                      : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white ml-1 animate-pulse" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Launch Pro Camera Studio Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 shrink-0">
            <Camera className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-white font-['Syne'] text-sm tracking-wide">
                PRO CAMERA & RECORDING SUITE
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                8K HDR • Zoom • 4K Video • Sound Mic
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Directly capture photos, record 4K clips, or high-fidelity vocal tracks with real-time waveform visualizers and cinema LUT filters.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('pro_camera')}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 transition-all hover:scale-105 shrink-0"
        >
          <Camera className="w-4 h-4" />
          <span>Launch Pro Camera Studio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. ROLE-SPECIFIC DYNAMIC WORKSPACE LAYOUT */}

      {/* ========================================================================= */}
      {/* CASE A: PROFESSIONAL WORKSPACE (Directing, Stems, 3D Shaders, VFX Engine) */}
      {/* ========================================================================= */}
      {currentRole === 'professional' && (
        <div className="space-y-6">
          {/* Priority Studio Tools for Professionals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. 8K Cinema Directing Suite */}
            <div className="p-5 rounded-3xl bg-slate-950/90 border border-slate-800 hover:border-indigo-500/60 transition-all flex flex-col justify-between shadow-xl space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                    <Film className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                    PRO CINEMA
                  </span>
                </div>
                <h3 className="text-base font-black text-white font-['Syne']">8K Cinema Directing & Screenplay</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Full 3-act scripts with automated sluglines, regional cinema styles (Bollywood, Tollywood, World Cinema), dialogue formatting, and camera breakdowns.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('film_studio')}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-900/40"
              >
                <span>Launch Directing Suite</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* 2. Multi-Track Master Mixing & Stems */}
            <div className="p-5 rounded-3xl bg-slate-950/90 border border-slate-800 hover:border-purple-500/60 transition-all flex flex-col justify-between shadow-xl space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                    <Music className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                    STUDIO CONSOLE
                  </span>
                </div>
                <h3 className="text-base font-black text-white font-['Syne']">A-Z Studio Console & Stem Separation</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Isolate Vocals, Drums, Bass, and Synth stems. 26 high-fidelity musical genres, DJ Turntable scratch engine, and synthesizer rack.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('song_studio')}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-900/40"
              >
                <span>Open Audio Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* 3. 3D WebGL Shader Engine */}
            <div className="p-5 rounded-3xl bg-slate-950/90 border border-slate-800 hover:border-cyan-500/60 transition-all flex flex-col justify-between shadow-xl space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <Box className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                    PBR SHADERS
                  </span>
                </div>
                <h3 className="text-base font-black text-white font-['Syne']">3D WebGL Shader & Mesh Studio</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time lighting rigs, metallic roughness parameters, glTF/OBJ import/export, and hardware accelerated interactive camera orbits.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('3d_engine')}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-900/40"
              >
                <span>Launch 3D Engine</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Professional Production Tools Bar */}
          <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 font-['Syne'] uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Professional Pipeline Utilities</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('video_audio')}
                className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-cyan-300">Video FX & Transitions</div>
                <div className="text-[10px] text-slate-400 mt-0.5">8K Upscale & Color Grading</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('voice_converter')}
                className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-cyan-300">Voice Synthesis & Dubbing</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Multi-character voiceover</div>
              </button>

              <button
                type="button"
                onClick={() => onSelectSubTab ? onSelectSubTab('office_suite', 'excel') : setActiveTab('office_suite')}
                className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-cyan-300">Budget & Cost Breakdown</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Spreadsheet financial modeling</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('cloud_storage')}
                className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-cyan-300">Studio Vault & Exports</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Encrypted project assets</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CASE B: STUDENT WORKSPACE (Academic, Slide Decks, Math/Docs, Citations)   */}
      {/* ========================================================================= */}
      {currentRole === 'student' && (
        <div className="space-y-6">
          {/* Priority Studio Tools for Students */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Academic Office & Thesis Suite */}
            <div className="p-5 rounded-3xl bg-slate-950/90 border border-slate-800 hover:border-emerald-500/60 transition-all flex flex-col justify-between shadow-xl space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    ACADEMIC DOCS
                  </span>
                </div>
                <h3 className="text-base font-black text-white font-['Syne']">Research Docs & Thesis Writer</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Draft reports, essays, formatted bibliographies, and structured research documentation with auto-formatting and instant word count metrics.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectSubTab ? onSelectSubTab('office_suite', 'word') : setActiveTab('office_suite')}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-900/40"
              >
                <span>Open Word & Essay Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* 2. Presentation Deck Generator */}
            <div className="p-5 rounded-3xl bg-slate-950/90 border border-slate-800 hover:border-amber-500/60 transition-all flex flex-col justify-between shadow-xl space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Presentation className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                    SLIDE MAKER
                  </span>
                </div>
                <h3 className="text-base font-black text-white font-['Syne']">Class Presentations & Slides</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Generate slide decks for seminars, class presentations, visual infographics, and project defenses with exportable templates.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectSubTab ? onSelectSubTab('office_suite', 'powerpoint') : setActiveTab('office_suite')}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-900/40"
              >
                <span>Launch Slide Maker</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* 3. AI Chat Mentor & Study Assistant */}
            <div className="p-5 rounded-3xl bg-slate-950/90 border border-slate-800 hover:border-cyan-500/60 transition-all flex flex-col justify-between shadow-xl space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                    AI TUTOR
                  </span>
                </div>
                <h3 className="text-base font-black text-white font-['Syne']">AI Mentor & Research Buddy</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ask complex science, humanities, or technical questions. Get summarized study notes, exam question generation, and instant explanations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('chat_mentor')}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-900/40"
              >
                <span>Ask Study Mentor</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Student Study Kit Utilities */}
          <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 font-['Syne'] uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Student Quick Study Kit</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => onSelectSubTab ? onSelectSubTab('office_suite', 'excel') : setActiveTab('office_suite')}
                className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-emerald-300">Math & Data Spreadsheets</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Statistical calculations & graphs</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('design_studio')}
                className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-emerald-300">Student ID & Resume Maker</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Academic profiles & credentials</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('voice_converter')}
                className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-emerald-300">Voice-to-Text Class Notes</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Lecture transcriptions & audio</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('meme_gif_studio')}
                className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-emerald-300">Campus Memes & Visuals</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Infographics & event posters</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CASE C: CONTENT CREATOR (Shorts, Thumbnails, YouTube Hooks, Memes/BGM)    */}
      {/* ========================================================================= */}
      {currentRole === 'creator' && (
        <div className="space-y-6">
          {/* Priority Studio Tools for Content Creators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Viral Shorts & 9:16 Reels Engine */}
            <div className="p-5 rounded-3xl bg-slate-950/90 border border-slate-800 hover:border-pink-500/60 transition-all flex flex-col justify-between shadow-xl space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 font-bold">
                    VIRAL 9:16
                  </span>
                </div>
                <h3 className="text-base font-black text-white font-['Syne']">Shorts, Reels & TikTok Studio</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Craft high-retention 15-60s vertical videos with fast pacing, auto-caption placements, dynamic zoom cues, and hook templates.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('video_audio')}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-pink-900/40"
              >
                <span>Launch Shorts Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* 2. YouTube Thumbnail & Banner Studio */}
            <div className="p-5 rounded-3xl bg-slate-950/90 border border-slate-800 hover:border-amber-500/60 transition-all flex flex-col justify-between shadow-xl space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Palette className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                    HIGH CTR
                  </span>
                </div>
                <h3 className="text-base font-black text-white font-['Syne']">CTR Thumbnails & Channel Art</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  High-contrast YouTube thumbnails, avatar branding, custom typography stickers, and social channel banners.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('design_studio')}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-900/40"
              >
                <span>Design Thumbnails</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* 3. Meme & GIF Factory */}
            <div className="p-5 rounded-3xl bg-slate-950/90 border border-slate-800 hover:border-purple-500/60 transition-all flex flex-col justify-between shadow-xl space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                    <Flame className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                    VIRAL MEMES
                  </span>
                </div>
                <h3 className="text-base font-black text-white font-['Syne']">Meme & GIF Creation Suite</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Generate trending memes, reaction GIFs, animated stickers, and viral social hooks to boost engagement on X, Reddit, and Instagram.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('meme_gif_studio')}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-900/40"
              >
                <span>Open Meme Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Creator Growth Toolkit */}
          <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 font-['Syne'] uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-pink-400" />
              <span>Creator Growth & Audio Toolkit</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('song_studio')}
                className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-pink-300">Trending BGM & Beats</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Royalty-free background music</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('voice_converter')}
                className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-pink-300">AI Voiceover & Dubs</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Energetic narrator voices</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('film_studio')}
                className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-pink-300">3-Second Viral Hook Crafter</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Script openers & punchlines</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('media_mixer')}
                className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-pink-300">Multi-Track Media Mixer</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Layer video, SFX, and graphics</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CASE D: GENERAL WORKSPACE (Balanced All-in-One Master Suite)              */}
      {/* ========================================================================= */}
      {currentRole === 'general' && (
        <div className="space-y-6">
          {/* Priority Studio Tools for General Users */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Film Studio */}
            <div className="p-4 rounded-3xl bg-slate-950/90 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between shadow-xl space-y-3">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Film className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-white font-['Syne']">Film & Directing</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Full screenplays, character dialogues, and multi-cinema genres.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('film_studio')}
                className="w-full py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-cyan-300 border border-indigo-500/40 text-xs font-bold transition-all"
              >
                Launch Studio
              </button>
            </div>

            {/* Song Studio */}
            <div className="p-4 rounded-3xl bg-slate-950/90 border border-slate-800 hover:border-purple-500/50 transition-all flex flex-col justify-between shadow-xl space-y-3">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Music className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-white font-['Syne']">A-Z Song Studio</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  26 genres, vocal synthesis, DJ turntables, and mixer console.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('song_studio')}
                className="w-full py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all"
              >
                Open Music
              </button>
            </div>

            {/* 3D WebGL */}
            <div className="p-4 rounded-3xl bg-slate-950/90 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between shadow-xl space-y-3">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Box className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-white font-['Syne']">3D WebGL Engine</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Real-time 3D models, PBR shaders, lighting, and camera orbits.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('3d_engine')}
                className="w-full py-2 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all"
              >
                Launch 3D
              </button>
            </div>

            {/* Office Suite */}
            <div className="p-4 rounded-3xl bg-slate-950/90 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between shadow-xl space-y-3">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-white font-['Syne']">Universal Office</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Word documents, PowerPoint presentations, and Excel sheets.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('office_suite')}
                className="w-full py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all"
              >
                Open Office
              </button>
            </div>
          </div>

          {/* Quick Hub Grid */}
          <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 font-['Syne'] uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Full Studio Ecosystem Navigation</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('design_studio')}
                className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-cyan-300">Design Identity</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Badges, cards, branding</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('meme_gif_studio')}
                className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-cyan-300">Meme & GIF Factory</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Humor, stickers & social</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('chat_mentor')}
                className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-cyan-300">AI Chat Mentor</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Creative brainstorming</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('cloud_storage')}
                className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-cyan-300">My Projects Vault</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Saved creations & history</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

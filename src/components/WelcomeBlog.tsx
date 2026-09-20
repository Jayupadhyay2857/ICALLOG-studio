import React from 'react';
import { Sparkles, Film, Music, Video, Box, FolderKanban, ShieldCheck, ArrowRight, Zap, Globe2, Award, Cpu, BookOpen, Layers, Mic, Palette, LogIn, UserCheck } from 'lucide-react';
import { ActiveTab, UserProfile } from '../types.ts';

interface WelcomeBlogProps {
  onSelectTab: (tab: ActiveTab) => void;
  user: UserProfile;
  onOpenVipModal: () => void;
  onOpenProfileModal?: (tab?: 'auth' | 'profile' | 'personas' | 'vip' | 'cookies') => void;
}

export const WelcomeBlog: React.FC<WelcomeBlogProps> = ({ onSelectTab, user, onOpenVipModal, onOpenProfileModal }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-fadeIn">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/90 to-slate-900 border border-slate-800 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>iCallog Master AI Studio Ecosystem</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white font-['Syne'] tracking-tight leading-tight">
            Welcome to the Ultimate <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent">Film Making & AI Suite</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            Hello, <strong className="text-white">{(!user || user.email === 'creator@icallog.studio' || user.name === 'Profile User' || !user.name) ? 'User' : user.name.split('(')[0].trim()}</strong>! This platform is engineered to empower directors, musicians, 3D artists, and creators with professional-grade generative AI tools. Explore 14+ integrated creative suites featuring advanced screenwriting, multi-lingual cinema styles, music production, and WebGL 3D rendering.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => onSelectTab('film_studio')}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-sm shadow-lg shadow-indigo-900/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2.5"
            >
              <Film className="w-4 h-4 text-white" />
              <span>Launch Film Making Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onSelectTab('projects_hub')}
              className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm transition-all flex items-center gap-2"
            >
              <FolderKanban className="w-4 h-4 text-cyan-400" />
              <span>My Projects Hub</span>
            </button>

            <button
              onClick={onOpenVipModal}
              className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-300 font-bold text-sm hover:bg-amber-500/30 transition-all flex items-center gap-2"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>VIP Diamond Pass</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visitor Access Mode: Guest Sandbox vs Sign In Account */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Guest Mode Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 border border-amber-500/40 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                <span>👤 GUEST ACCOUNT (अतिथि खाता)</span>
              </span>
              <span className="text-xs font-mono text-emerald-400">50 Free Demo Tokens</span>
            </div>
            <h3 className="text-base font-black text-white font-['Syne']">
              Use as Guest (बिना लॉगिन सीधे शुरू करें)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No registration or password required. Immediately create screenplays, 8K video prompts, AI songs, and 3D models with 50 instant starter demo tokens.
            </p>
          </div>
          <button
            onClick={() => onSelectTab('film_studio')}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2"
          >
            <span>🚀 Continue as Guest Sandbox</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Login / Register Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border border-cyan-500/40 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                <span>🔐 REGISTERED ACCOUNT (लॉगिन करें)</span>
              </span>
              <span className="text-xs font-mono text-cyan-400">Cloud Sync & Vault</span>
            </div>
            <h3 className="text-base font-black text-white font-['Syne']">
              Sign In or Create Account
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Save unlimited cloud projects, create custom personas (Professional, Student, General, Content Creator), and access priority VIP queues.
            </p>
          </div>
          <button
            onClick={() => onOpenProfileModal ? onOpenProfileModal('auth') : onOpenVipModal()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-cyan-950/40 flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In / Create Account</span>
          </button>
        </div>
      </div>

      {/* Main Studio Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Film Studio */}
        <div className="p-6 rounded-3xl bg-slate-950/90 border border-slate-800/80 hover:border-indigo-500/50 transition-all space-y-4 flex flex-col justify-between shadow-xl">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Film className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white font-['Syne']">Film Making & Directing Suite</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Write professional industry-standard screenplays with automated sluglines, character dialogue, and scene descriptions. Features multicultural regional film genres: Bollywood, Tollywood, Kollywood, Mollywood, Sandalwood, Pollywood, and World Cinema.
            </p>
          </div>
          <button
            onClick={() => onSelectTab('film_studio')}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 pt-2"
          >
            <span>Explore Film Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Music Studio */}
        <div className="p-6 rounded-3xl bg-slate-950/90 border border-slate-800/80 hover:border-purple-500/50 transition-all space-y-4 flex flex-col justify-between shadow-xl">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Music className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white font-['Syne']">A-Z Song & Music Studio</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Compose full-length tracks across 26 musical genres. Control BPM, instruments, stem separation, and generate multi-voice AI vocal performances with professional mixing console tools.
            </p>
          </div>
          <button
            onClick={() => onSelectTab('song_studio')}
            className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1.5 pt-2"
          >
            <span>Open Music Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3D WebGL Studio */}
        <div className="p-6 rounded-3xl bg-slate-950/90 border border-slate-800/80 hover:border-cyan-500/50 transition-all space-y-4 flex flex-col justify-between shadow-xl">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Box className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white font-['Syne']">3D WebGL & Character Studio</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Synthesize 3D polygonal models, manipulate PBR shaders, apply 17-bone skeletal inverse kinematics, and export assets in GLTF/OBJ formats for immersive virtual reality and game development.
            </p>
          </div>
          <button
            onClick={() => onSelectTab('3d_engine')}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 pt-2"
          >
            <span>Launch 3D Engine</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Additional Studio Suites Quick Access */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onSelectTab('image_studio')}
          className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-pink-500/40 cursor-pointer transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-pink-500/10 text-pink-400"><Palette className="w-4 h-4" /></span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-pink-400 transition-colors" />
          </div>
          <h4 className="text-sm font-bold text-white font-['Syne']">Image & Upscaling Suite</h4>
          <p className="text-[11px] text-slate-400">8K generative images, neural upscaling, and portrait studio tools.</p>
        </div>

        <div 
          onClick={() => onSelectTab('video_audio')}
          className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400"><Video className="w-4 h-4" /></span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
          </div>
          <h4 className="text-sm font-bold text-white font-['Syne']">Video Animation Suite</h4>
          <p className="text-[11px] text-slate-400">Cinematic text-to-video, frame interpolation, and motion grading.</p>
        </div>

        <div 
          onClick={() => onSelectTab('voice_converter')}
          className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400"><Mic className="w-4 h-4" /></span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 transition-colors" />
          </div>
          <h4 className="text-sm font-bold text-white font-['Syne']">Voice Morph & TTS Studio</h4>
          <p className="text-[11px] text-slate-400">Neural formant cloning, human voice morphing, and cinematic dubbing.</p>
        </div>

        <div 
          onClick={() => onSelectTab('office_suite')}
          className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400"><Layers className="w-4 h-4" /></span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-500 transition-colors" />
          </div>
          <h4 className="text-sm font-bold text-white font-['Syne']">Office & Productivity Suite</h4>
          <p className="text-[11px] text-slate-400">Professional document editor, presentation slides, and data spreadsheets.</p>
        </div>
      </div>

      {/* Platform Information & Guide Section */}
      <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 space-y-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white font-['Syne']">Platform Architecture & Quick Guide</h2>
            <p className="text-xs text-slate-400">Essential tips for getting the most out of your creative workflow.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300 leading-relaxed">
          <div className="space-y-2 p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              1. Project Management
            </h4>
            <p>
              Use the <strong className="text-white">Projects Hub</strong> to organize all your screenplays, 3D models, song tracks, and design assets in one secure workspace with instant local and cloud synchronization.
            </p>
          </div>

          <div className="space-y-2 p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              2. Multi-Cultural Cinema
            </h4>
            <p>
              In the <strong className="text-white">Film Making Studio</strong>, switch between Hollywood, Indian Bollywood, Tollywood, Kollywood, and Global World Cinema categories to tailor professional scene prompts instantly.
            </p>
          </div>

          <div className="space-y-2 p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              3. VIP Diamond Pass
            </h4>
            <p>
              Unlock premium 18+ mature storytelling, advanced AI generation tokens, and priority rendering speeds by upgrading your account with the VIP Diamond Pass.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

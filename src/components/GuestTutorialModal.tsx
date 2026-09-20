import React, { useState } from 'react';
import {
  Sparkles,
  Film,
  Music,
  Box,
  Layers,
  FileText,
  Palette,
  Clock,
  LogIn,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X,
  UserCheck,
  ShieldCheck,
  Zap,
  BookOpen
} from 'lucide-react';
import { PersonaType, UserProfile, ActiveTab } from '../types.ts';

interface GuestTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
  onSelectTab: (tab: ActiveTab) => void;
  onSelectPersona?: (persona: PersonaType) => void;
  user: UserProfile;
}

export const GuestTutorialModal: React.FC<GuestTutorialModalProps> = ({
  isOpen,
  onClose,
  onOpenAuth,
  onSelectTab,
  onSelectPersona,
  user,
}) => {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const TUTORIAL_STEPS = [
    {
      title: 'Welcome to iCALLOG Studio Sandbox',
      hindiTitle: 'iCALLOG स्टूडियो सैंडबॉक्स में आपका स्वागत है',
      icon: <Sparkles className="w-8 h-8 text-cyan-400" />,
      badge: 'Step 1 of 4: Sandbox Basics',
      description:
        'You are currently exploring in Guest Mode with 50 instant starter demo tokens. You can immediately create industry-standard screenplays, AI vocal songs, 3D models, and office documents without signing up or providing any password.',
      highlightList: [
        '✨ 50 Free Starter Demo Tokens loaded automatically',
        '⚡ Instant sandbox access with zero registration friction',
        '🔒 Safe client-side auto-save to browser storage',
      ],
      actionBtnText: 'Next: Explore 4 Dynamic Roles',
    },
    {
      title: '4 Dynamic Role-Tailored Workspaces',
      hindiTitle: '4 डायनामिक रोल और पर्सनलाइज्ड वर्कस्पेस',
      icon: <UserCheck className="w-8 h-8 text-indigo-400" />,
      badge: 'Step 2 of 4: Roles & Layouts',
      description:
        'iCALLOG dynamically transforms its workspace layout and prioritizes tools based on your active category. Switch roles instantly to customize your workflow:',
      roles: [
        {
          id: 'professional' as PersonaType,
          name: 'Professional (पेशेवर)',
          desc: '8K Cinema Directing, Multi-track Mixing Console, 3D WebGL Shader Engine & VFX Pipeline.',
          emoji: '💼',
        },
        {
          id: 'student' as PersonaType,
          name: 'Student (छात्र)',
          desc: 'Study Doc Generator, Academic Slide Maker, Math Solvers & Citations Scratchpad.',
          emoji: '🎒',
        },
        {
          id: 'creator' as PersonaType,
          name: 'Content Creator (क्रिएटर)',
          desc: 'Viral 9:16 Shorts/Reels Generator, YouTube Thumbnails, Hook Crafter & Meme Factory.',
          emoji: '🎬',
        },
        {
          id: 'general' as PersonaType,
          name: 'General (सामान्य)',
          desc: 'Balanced All-in-One master studio with quick access to all 14+ AI creative engines.',
          emoji: '✨',
        },
      ],
      actionBtnText: 'Next: 14+ Creative Studios',
    },
    {
      title: '14+ Professional AI Creative Suites',
      hindiTitle: '14+ प्रोफेशनल AI क्रिएटिव सूट',
      icon: <Layers className="w-8 h-8 text-pink-400" />,
      badge: 'Step 3 of 4: Studio Engines',
      description:
        'Everything you need for full-stack media production is available in one unified platform:',
      suites: [
        { name: 'Film Making Studio', desc: 'Screenplays, sluglines & multi-cinema genres', icon: '🎬', tab: 'film_studio' as ActiveTab },
        { name: 'A-Z Song Studio', desc: '26 genres, vocal synthesis & stem separator', icon: '🎵', tab: 'song_studio' as ActiveTab },
        { name: '3D WebGL Engine', desc: 'PBR materials, lighting & real-time canvas', icon: '🧊', tab: '3d_engine' as ActiveTab },
        { name: 'Office Suite', desc: 'Word processor, slide decks & spreadsheets', icon: '📄', tab: 'office_suite' as ActiveTab },
        { name: 'Meme & GIF Factory', desc: 'Animated memes, templates & stickers', icon: '🎭', tab: 'meme_gif_studio' as ActiveTab },
        { name: 'Design Identity', desc: 'Badges, business cards, resumes & favicons', icon: '🎨', tab: 'design_studio' as ActiveTab },
      ],
      actionBtnText: 'Next: Guest Sessions & Cloud Sync',
    },
    {
      title: 'Guest Session Limits & Cloud Upgrades',
      hindiTitle: 'गेस्ट सेशन सीमा और क्लाउड सेविंग',
      icon: <Clock className="w-8 h-8 text-amber-400" />,
      badge: 'Step 4 of 4: Session & Cloud Save',
      description:
        'Guest sessions run for 10 minutes (extendable up to 15 minutes). A 2-minute pre-expiration notification alerts you before the session expires. Sign in anytime to preserve all your creations permanently!',
      points: [
        { title: '10-Min Base Session + 5-Min Extension', desc: 'Guest sessions are designed for quick sandbox testing up to 15 minutes max.' },
        { title: '2-Minute Pre-Expiration Alert', desc: 'Auto-saves drafts and warns you 2 minutes before sandbox expiration.' },
        { title: 'Cloud Vault & Multi-Profiles', desc: 'Create a free registered account anytime to store unlimited projects across devices.' },
      ],
      actionBtnText: 'Finish Tutorial & Start Creating',
    },
  ];

  const currentStep = TUTORIAL_STEPS[step];

  const handleNext = () => {
    if (step < TUTORIAL_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                {currentStep.badge}
              </span>
              <h2 className="text-base sm:text-lg font-black text-white font-['Syne']">
                {currentStep.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-slate-950/50 border-b border-slate-800/60">
          {TUTORIAL_STEPS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setStep(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === step
                  ? 'bg-gradient-to-r from-cyan-400 to-indigo-500'
                  : idx < step
                  ? 'bg-emerald-500'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-300 text-xs leading-relaxed">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
              {currentStep.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{currentStep.description}</p>
              <p className="text-[11px] text-cyan-400 font-mono mt-0.5">{currentStep.hindiTitle}</p>
            </div>
          </div>

          {/* Step 1 Highlights */}
          {step === 0 && currentStep.highlightList && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              {currentStep.highlightList.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* Step 2 Roles */}
          {step === 1 && currentStep.roles && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentStep.roles.map((r) => (
                <div
                  key={r.id}
                  onClick={() => onSelectPersona && onSelectPersona(r.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    user.personaType === r.id
                      ? 'bg-indigo-950/60 border-cyan-400 shadow-md shadow-cyan-950/40'
                      : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white flex items-center gap-1.5 font-['Syne']">
                      <span>{r.emoji}</span>
                      <span>{r.name}</span>
                    </span>
                    {user.personaType === r.id && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{r.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Step 3 Studio Engines */}
          {step === 2 && currentStep.suites && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {currentStep.suites.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelectTab(s.tab);
                    onClose();
                  }}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/60 text-left transition-all group"
                >
                  <div className="text-xl mb-1">{s.icon}</div>
                  <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {s.name}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>
          )}

          {/* Step 4 Session Limits */}
          {step === 3 && currentStep.points && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {currentStep.points.map((p, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="font-bold text-white text-xs">{p.title}</div>
                    <div className="text-[11px] text-slate-400 leading-tight">{p.desc}</div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-white text-xs">Ready to save everything permanently?</div>
                  <div className="text-[11px] text-slate-400">Sign in to unlock unlimited project saving and VIP queues.</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shrink-0 flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In / Create Account</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 px-6 border-t border-slate-800 flex items-center justify-between bg-slate-950/80">
          <button
            type="button"
            disabled={step === 0}
            onClick={handlePrev}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              step === 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:text-white bg-slate-800'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Skip Tutorial
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-cyan-950/40 flex items-center gap-1.5 transition-all hover:scale-105"
            >
              <span>{currentStep.actionBtnText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

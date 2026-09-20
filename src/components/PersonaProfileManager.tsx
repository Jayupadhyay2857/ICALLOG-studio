import React, { useState } from 'react';
import {
  User,
  Plus,
  Check,
  CheckCircle2,
  Trash2,
  Edit3,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  GraduationCap,
  BookOpen,
  Briefcase,
  Clapperboard,
  UserCheck,
  Zap,
  Info,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { UserProfile, SubProfile, PersonaType } from '../types.ts';
import { PERSONA_CONFIGS, PersonaBadge, getPersonaConfig, PRIMARY_CATEGORIES } from './PersonaBadge.tsx';
import { updateUserProfile } from '../lib/api.ts';

interface PersonaProfileManagerProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  onOpenVipTab?: () => void;
}

const PRESET_SUB_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
];

export const PersonaProfileManager: React.FC<PersonaProfileManagerProps> = ({
  user,
  onUpdateUser,
  onNotify,
  onOpenVipTab,
}) => {
  const currentPersona = user.personaType || 'general';
  const currentMeta = getPersonaConfig(currentPersona);

  // Initialize sub-profiles if none exist
  const getSubProfiles = (): SubProfile[] => {
    if (user.subProfiles && user.subProfiles.length > 0) {
      return user.subProfiles;
    }
    return [
      {
        id: 'sub_prof_master',
        name: user.name || 'Master Profile',
        personaType: 'general',
        title: 'Master Creative Profile',
        badgeLabel: 'General Studio',
        badgeColor: '#6366f1',
        avatarUrl: user.avatarUrl || PRESET_SUB_AVATARS[0],
        bio: 'Primary versatile creative account.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'sub_prof_teacher',
        name: 'Prof. Educator',
        personaType: 'teacher',
        title: 'Academic & Teacher Mode',
        badgeLabel: 'Teacher / Educator',
        badgeColor: '#10b981',
        avatarUrl: PRESET_SUB_AVATARS[2],
        bio: 'Lesson planning, safe student materials & educational slides.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'sub_prof_student',
        name: 'Scholar Student',
        personaType: 'student',
        title: 'Student & Study Sandbox',
        badgeLabel: 'Student Scholar',
        badgeColor: '#06b6d4',
        avatarUrl: PRESET_SUB_AVATARS[3],
        bio: 'Homework AI, 3D science anatomy & revision notes.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'sub_prof_creator',
        name: 'Creator Studio',
        personaType: 'creator',
        title: 'YouTube & Reels Creator',
        badgeLabel: 'Content Creator',
        badgeColor: '#f59e0b',
        avatarUrl: PRESET_SUB_AVATARS[1],
        bio: 'Viral shorts, hooks, thumbnail generator & audio clips.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'sub_prof_pro',
        name: 'Pro Studio VFX',
        personaType: 'professional',
        title: 'Studio Professional',
        badgeLabel: 'Studio Professional',
        badgeColor: '#8b5cf6',
        avatarUrl: PRESET_SUB_AVATARS[4],
        bio: '8K commercial master renders & tax invoices.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'sub_prof_guest',
        name: 'Guest Free Sandbox',
        personaType: 'guest',
        title: 'Guest Account (Free Tier Only)',
        badgeLabel: 'Guest Sandbox (Free)',
        badgeColor: '#64748b',
        isGuest: true,
        avatarUrl: PRESET_SUB_AVATARS[6],
        bio: 'Free tier sandbox for rapid testing without sign-up.',
        createdAt: new Date().toISOString(),
      },
    ];
  };

  const subProfiles = getSubProfiles();
  const activeProfileId = user.activeProfileId || subProfiles[0]?.id || 'sub_prof_master';

  // Sub-profile creation / edit state
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formPersona, setFormPersona] = useState<PersonaType>('creator');
  const [formAvatar, setFormAvatar] = useState(PRESET_SUB_AVATARS[1]);
  const [formBio, setFormBio] = useState('');

  // Switch Sub-Profile in 1 Click
  const handleSwitchProfile = async (profile: SubProfile) => {
    const updated: UserProfile = {
      ...user,
      activeProfileId: profile.id,
      personaType: profile.personaType,
      name: profile.name,
      avatarUrl: profile.avatarUrl || user.avatarUrl,
      subProfiles: subProfiles,
    };

    onUpdateUser(updated);

    try {
      await updateUserProfile({
        name: updated.name,
        avatarUrl: updated.avatarUrl,
        personaType: updated.personaType,
        activeProfileId: updated.activeProfileId,
        subProfiles: updated.subProfiles,
      });
    } catch {
      // Local fallback
    }

    const cfg = getPersonaConfig(profile.personaType);
    onNotify(
      'Profile Switched',
      `Switched active sub-profile to "${profile.name}" (${cfg.badgeEmoji} ${cfg.badgeLabel}). Workspace customized!`,
      'success'
    );
  };

  // Change Persona and Switch Profile directly for active role
  const handleSetPersona = async (type: PersonaType) => {
    const cfg = getPersonaConfig(type);

    // 1. Check if user already has an existing sub-profile for this personaType
    const matchingSub = subProfiles.find((p) => p.personaType === type);

    if (matchingSub) {
      const updated: UserProfile = {
        ...user,
        activeProfileId: matchingSub.id,
        personaType: matchingSub.personaType,
        name: matchingSub.name,
        avatarUrl: matchingSub.avatarUrl || user.avatarUrl,
        subProfiles: subProfiles,
      };

      onUpdateUser(updated);

      try {
        await updateUserProfile({
          name: updated.name,
          avatarUrl: updated.avatarUrl,
          personaType: updated.personaType,
          activeProfileId: updated.activeProfileId,
          subProfiles: updated.subProfiles,
        });
      } catch {
        // fallback
      }

      onNotify(
        'Profile Switched to ' + cfg.label,
        `Switched workspace profile to "${matchingSub.name}" (${cfg.badgeEmoji} ${cfg.badgeLabel}).`,
        'success'
      );
      return;
    }

    // 2. If no matching subprofile exists, map to category preset defaults
    const defaults = {
      professional: { name: 'Pro Studio VFX', avatar: PRESET_SUB_AVATARS[4], title: 'Studio Professional' },
      student: { name: 'Scholar Student', avatar: PRESET_SUB_AVATARS[3], title: 'Student & Study Sandbox' },
      general: { name: 'General Studio', avatar: PRESET_SUB_AVATARS[0], title: 'Master Creative Profile' },
      creator: { name: 'Creator Studio', avatar: PRESET_SUB_AVATARS[1], title: 'YouTube & Reels Creator' },
      teacher: { name: 'Prof. Educator', avatar: PRESET_SUB_AVATARS[2], title: 'Academic & Teacher Mode' },
      guest: { name: 'Guest Sandbox', avatar: PRESET_SUB_AVATARS[6], title: 'Guest Account (Free Tier)' },
    }[type] || { name: cfg.label, avatar: PRESET_SUB_AVATARS[0], title: cfg.badgeLabel };

    const updatedSubProfiles = subProfiles.map((p) => {
      if (p.id === activeProfileId) {
        return {
          ...p,
          personaType: type,
          name: defaults.name,
          title: defaults.title,
          avatarUrl: defaults.avatar,
          badgeLabel: cfg.badgeLabel,
          badgeColor: cfg.badgeColor,
        };
      }
      return p;
    });

    const updated: UserProfile = {
      ...user,
      personaType: type,
      name: defaults.name,
      avatarUrl: defaults.avatar,
      subProfiles: updatedSubProfiles,
    };

    onUpdateUser(updated);

    try {
      await updateUserProfile({
        name: updated.name,
        avatarUrl: updated.avatarUrl,
        personaType: type,
        subProfiles: updatedSubProfiles,
      });
    } catch {
      // fallback
    }

    onNotify(
      'Profile Switched to ' + cfg.label,
      `Switched profile to "${defaults.name}" (${cfg.badgeEmoji} ${cfg.badgeLabel}). Creative tools updated!`,
      'success'
    );
  };

  // Start creating new sub-profile
  const startCreate = () => {
    setEditingId(null);
    setFormName('');
    setFormTitle('');
    setFormPersona('creator');
    setFormAvatar(PRESET_SUB_AVATARS[Math.floor(Math.random() * PRESET_SUB_AVATARS.length)]);
    setFormBio('');
    setIsCreating(true);
  };

  // Start editing existing sub-profile
  const startEdit = (profile: SubProfile) => {
    setEditingId(profile.id);
    setFormName(profile.name);
    setFormTitle(profile.title || '');
    setFormPersona(profile.personaType);
    setFormAvatar(profile.avatarUrl || PRESET_SUB_AVATARS[0]);
    setFormBio(profile.bio || '');
    setIsCreating(true);
  };

  // Save new or edited sub-profile
  const handleSaveSubProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      onNotify('Validation Error', 'Please enter a name for this sub-profile.', 'warning');
      return;
    }

    const cfg = getPersonaConfig(formPersona);

    let updatedList: SubProfile[];
    if (editingId) {
      updatedList = subProfiles.map((p) => {
        if (p.id === editingId) {
          return {
            ...p,
            name: formName.trim(),
            title: formTitle.trim() || cfg.label,
            personaType: formPersona,
            avatarUrl: formAvatar,
            bio: formBio.trim(),
            badgeLabel: cfg.badgeLabel,
            badgeColor: cfg.badgeColor,
            isGuest: formPersona === 'guest',
          };
        }
        return p;
      });
    } else {
      const newId = `sub_prof_${Date.now()}`;
      const newSubProfile: SubProfile = {
        id: newId,
        name: formName.trim(),
        title: formTitle.trim() || cfg.label,
        personaType: formPersona,
        avatarUrl: formAvatar,
        bio: formBio.trim(),
        badgeLabel: cfg.badgeLabel,
        badgeColor: cfg.badgeColor,
        isGuest: formPersona === 'guest',
        createdAt: new Date().toISOString(),
      };
      updatedList = [...subProfiles, newSubProfile];
    }

    const updated: UserProfile = {
      ...user,
      subProfiles: updatedList,
    };

    onUpdateUser(updated);

    try {
      await updateUserProfile({
        subProfiles: updatedList,
      });
    } catch {
      // fallback
    }

    setIsCreating(false);
    setEditingId(null);
    onNotify(
      editingId ? 'Sub-Profile Updated' : 'New Sub-Profile Created',
      `"${formName}" is saved to your account. You can switch to it anytime!`,
      'success'
    );
  };

  // Delete sub-profile
  const handleDeleteSubProfile = async (id: string, name: string) => {
    if (subProfiles.length <= 1) {
      onNotify('Action Not Allowed', 'You must have at least one active profile.', 'warning');
      return;
    }

    const filtered = subProfiles.filter((p) => p.id !== id);
    const nextActiveId = activeProfileId === id ? filtered[0].id : activeProfileId;
    const nextActiveProfile = filtered.find((p) => p.id === nextActiveId) || filtered[0];

    const updated: UserProfile = {
      ...user,
      activeProfileId: nextActiveId,
      personaType: nextActiveProfile.personaType,
      name: nextActiveProfile.name,
      subProfiles: filtered,
    };

    onUpdateUser(updated);

    try {
      await updateUserProfile({
        activeProfileId: updated.activeProfileId,
        personaType: updated.personaType,
        name: updated.name,
        subProfiles: filtered,
      });
    } catch {
      // fallback
    }

    onNotify('Sub-Profile Deleted', `Removed "${name}" from your account list.`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* 1. Active Profile & Persona Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 border border-slate-800 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={user.avatarUrl || PRESET_SUB_AVATARS[0]}
                alt={user.name || 'User'}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/60 shadow-lg"
              />
              <span className="absolute -bottom-1 -right-1 text-base select-none">
                {currentMeta.badgeEmoji}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-white font-['Syne']">
                  {user.name || user.username}
                </h3>
                <PersonaBadge type={currentPersona} size="sm" />
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {currentMeta.hindiLabel} • {user.email}
              </p>
              <p className="text-[11px] text-slate-300 mt-1 max-w-md line-clamp-1">
                {currentMeta.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Category Dropdown on the right of Category label */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-md">
              <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap flex items-center gap-1">
                <span>Category:</span>
              </span>
              <select
                id="role-category-dropdown"
                value={currentPersona}
                onChange={(e) => handleSetPersona(e.target.value as PersonaType)}
                aria-label="Select Profile Category"
                className="bg-slate-950 text-cyan-300 font-bold text-xs py-1 px-2.5 rounded-xl border border-cyan-500/50 focus:border-cyan-400 focus:outline-none cursor-pointer"
              >
                <option value="professional">💼 Professional (पेशेवर)</option>
                <option value="student">🎒 Student (छात्र)</option>
                <option value="general">✨ General (सामान्य)</option>
                <option value="creator">🎬 Content Creator (क्रिएटर)</option>
                {currentPersona === 'teacher' && <option value="teacher">🎓 Teacher / Educator</option>}
                {currentPersona === 'guest' && <option value="guest">👤 Guest Sandbox</option>}
              </select>
            </div>

            <button
              onClick={startCreate}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-indigo-900/40 flex items-center gap-1.5 transition-all hover:scale-102"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Sub-Profile</span>
            </button>
          </div>
        </div>

        {/* Quick Category / Role Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 -mx-5 -mb-5 p-4 rounded-b-3xl">
          <div className="flex items-center gap-2.5">
            <span className="text-xl select-none">{currentMeta.badgeEmoji}</span>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Active Role Category:</span>
                <span className="text-cyan-300 font-black">{currentMeta.label}</span>
              </div>
              <div className="text-[10px] text-slate-400">
                {currentMeta.hindiDesc || currentMeta.description}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <label htmlFor="quick-category-select" className="text-xs font-semibold text-slate-300">
              Change Category:
            </label>
            <select
              id="quick-category-select"
              value={currentPersona}
              onChange={(e) => handleSetPersona(e.target.value as PersonaType)}
              className="bg-slate-950 text-white text-xs font-semibold py-1.5 px-3 rounded-xl border border-indigo-500/50 hover:border-indigo-400 focus:outline-none cursor-pointer shadow-sm"
            >
              <option value="professional">💼 Professional</option>
              <option value="student">🎒 Student</option>
              <option value="general">✨ General</option>
              <option value="creator">🎬 Content Creator</option>
            </select>
          </div>
        </div>

        {/* Guest Free-Tier Warning Banner */}
        {currentPersona === 'guest' && (
          <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-300 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Guest Sandbox Mode (Free Tier):</strong> You are currently testing with sandbox limits. Switch to a Teacher, Student, Pro, or Creator profile to unlock full features.
              </span>
            </div>
            {onOpenVipTab && (
              <button
                onClick={onOpenVipTab}
                className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-[11px] font-black uppercase whitespace-nowrap hover:bg-amber-400 transition-colors"
              >
                Upgrade VIP
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Sub-Profiles List (Multi-Profile System in One Master Account) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-black text-white font-['Syne']">
              Multiple Profiles in 1 Account ({subProfiles.length})
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Click any profile to switch instantly
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {subProfiles.map((prof) => {
            const isActive = prof.id === activeProfileId;
            const pConfig = getPersonaConfig(prof.personaType);
            const IconComp = pConfig.icon;

            return (
              <div
                key={prof.id}
                className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                  isActive
                    ? 'bg-slate-900/90 border-cyan-500/80 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={prof.avatarUrl || PRESET_SUB_AVATARS[0]}
                      alt={prof.name}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-700"
                    />
                    <span className="absolute -bottom-1 -right-1 text-xs select-none">
                      {pConfig.badgeEmoji}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white truncate max-w-[140px]">
                        {prof.name}
                      </span>
                      <PersonaBadge type={prof.personaType} size="sm" />
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                      {prof.title || pConfig.hindiLabel}
                    </div>
                    {prof.bio && (
                      <div className="text-[10px] text-slate-500 truncate max-w-[180px] mt-0.5">
                        {prof.bio}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isActive ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black font-mono border border-emerald-500/40 flex items-center gap-1">
                      <Check className="w-3 h-3" /> ACTIVE
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSwitchProfile(prof)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 text-xs font-bold transition-all flex items-center gap-1"
                      title="Switch to this profile"
                    >
                      <span>Switch</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  <button
                    onClick={() => startEdit(prof)}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-cyan-300 transition-colors"
                    title="Edit Sub-Profile"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {subProfiles.length > 1 && (
                    <button
                      onClick={() => handleDeleteSubProfile(prof.id, prof.name)}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                      title="Delete Sub-Profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Create or Edit Sub-Profile Modal / Form */}
      {isCreating && (
        <form
          onSubmit={handleSaveSubProfile}
          className="p-5 rounded-3xl bg-slate-950 border-2 border-indigo-500/60 shadow-2xl space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/30 flex items-center justify-center text-indigo-400 font-bold">
                {editingId ? '✏️' : '✨'}
              </div>
              <div>
                <h4 className="text-sm font-black text-white font-['Syne']">
                  {editingId ? 'Edit Sub-Profile' : 'Create New Sub-Profile'}
                </h4>
                <p className="text-[11px] text-slate-400">
                  Configure custom role, name, avatar, and persona badge
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Profile Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Prof. Jay Sharma, Jay Reels, VFX Pro"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Persona Role Archetype
              </label>
              <select
                value={formPersona}
                onChange={(e) => setFormPersona(e.target.value as PersonaType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="teacher">🎓 Teacher / Educator (शिक्षक)</option>
                <option value="student">🎒 Student / Scholar (छात्र)</option>
                <option value="creator">🎬 Content Creator (क्रिएटर)</option>
                <option value="professional">💼 Studio Professional (पेशेवर)</option>
                <option value="general">✨ General Creative Studio (सामान्य)</option>
                <option value="guest">👤 Guest Account (Free Tier Sandbox)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Custom Title / Designation (Optional)
            </label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Senior Physics Teacher, 4K Filmmaker, Computer Science Student"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Choose Avatar
            </label>
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {PRESET_SUB_AVATARS.map((url, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setFormAvatar(url)}
                  className={`w-10 h-10 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    formAvatar === url ? 'border-cyan-400 scale-110 shadow-md shadow-cyan-500/30' : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="Preset" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Bio / Focus Note
            </label>
            <input
              type="text"
              value={formBio}
              onChange={(e) => setFormBio(e.target.value)}
              placeholder="e.g. Creating physics lectures and 3D visual study guides"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white text-xs font-bold shadow-lg shadow-indigo-900/40 hover:brightness-110"
            >
              {editingId ? 'Update Sub-Profile' : 'Save New Profile'}
            </button>
          </div>
        </form>
      )}

      {/* 4. Persona Archetypes Selector & Perks Grid */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-black text-white font-['Syne'] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Persona Roles & Exclusive Tool Perks (भूमिका व सुविधाएँ)</span>
            </h4>
            <p className="text-xs text-slate-400">
              Select an archetype to customize your studio tools, prompts, and official badge
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(Object.keys(PERSONA_CONFIGS) as PersonaType[]).map((type) => {
            const cfg = PERSONA_CONFIGS[type];
            const isSelected = currentPersona === type;
            const IconComp = cfg.icon;

            return (
              <div
                key={type}
                onClick={() => handleSetPersona(type)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 relative group flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-cyan-400 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-400'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-white shadow-md`}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className="text-base select-none">{cfg.badgeEmoji}</span>
                    </div>

                    {isSelected ? (
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/40 flex items-center gap-1">
                        <Check className="w-3 h-3" /> ACTIVE
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 group-hover:text-slate-300 font-mono transition-colors">
                        Select
                      </span>
                    )}
                  </div>

                  <h5 className="text-xs font-black text-white font-['Syne']">
                    {cfg.label}
                  </h5>
                  <p className="text-[11px] text-cyan-400 font-medium mt-0.5">
                    {cfg.hindiLabel}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    {cfg.description}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1">
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                      Included Perks:
                    </div>
                    {cfg.perks.map((perk, idx) => (
                      <div
                        key={idx}
                        className="text-[11px] text-slate-300 flex items-center gap-1.5"
                      >
                        <span className="w-1 h-1 rounded-full bg-cyan-400 shrink-0" />
                        <span>{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-2 flex items-center justify-between">
                  <PersonaBadge type={type} size="sm" />
                  {cfg.isFreeOnly && (
                    <span className="text-[9px] text-slate-400 font-mono">
                      Free Sandbox Mode
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

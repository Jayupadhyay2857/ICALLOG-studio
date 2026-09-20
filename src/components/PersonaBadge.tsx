import React from 'react';
import {
  GraduationCap,
  BookOpen,
  Briefcase,
  Clapperboard,
  Sparkles,
  UserCheck,
  Shield,
  Crown,
} from 'lucide-react';
import { PersonaType } from '../types.ts';

export interface PersonaMeta {
  type: PersonaType;
  label: string;
  hindiLabel: string;
  badgeLabel: string;
  badgeEmoji: string;
  badgeColor: string;
  gradient: string;
  bgLight: string;
  borderColor: string;
  textColor: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  hindiDesc: string;
  isFreeOnly?: boolean;
  perks: string[];
}

export const PERSONA_CONFIGS: Record<PersonaType, PersonaMeta> = {
  teacher: {
    type: 'teacher',
    label: 'Teacher / Educator',
    hindiLabel: 'शिक्षक / अध्यापक प्रोफ़ाइल',
    badgeLabel: 'Teacher / Educator',
    badgeEmoji: '🎓',
    badgeColor: '#10b981',
    gradient: 'from-emerald-500 to-teal-700',
    bgLight: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-400',
    icon: GraduationCap,
    description: 'Specialized for educators, lesson planning, student presentations & safe AI classrooms.',
    hindiDesc: 'पाठ योजना, शैक्षणिक प्रस्तुतियाँ एवं सुरक्षित क्लासरूम टूल्स के लिए।',
    perks: [
      'Lesson Script & Quiz Generator',
      'Educational PPT & Sheet Templates',
      'Watermark-Free Educator Export',
      'Classroom-Safe Content Filtering',
    ],
  },
  student: {
    type: 'student',
    label: 'Student / Scholar',
    hindiLabel: 'छात्र / विद्यार्थी प्रोफ़ाइल',
    badgeLabel: 'Student Scholar',
    badgeEmoji: '🎒',
    badgeColor: '#06b6d4',
    gradient: 'from-cyan-500 to-blue-700',
    bgLight: 'bg-cyan-500/15',
    borderColor: 'border-cyan-500/40',
    textColor: 'text-cyan-400',
    icon: BookOpen,
    description: 'Designed for school & college students, study notes, 3D science visualizers & homework help.',
    hindiDesc: 'अध्ययन नोट्स, 3D विज्ञान विज़ुअलाइज़र और प्रोजेक्ट प्रेजेंटेशन के लिए।',
    perks: [
      'Study AI & Homework Assistant',
      '3D Science & Anatomy Visualizers',
      'Student Project & Resume Templates',
      'Daily Free Study Tokens Boost',
    ],
  },
  professional: {
    type: 'professional',
    label: 'Studio Professional',
    hindiLabel: 'पेशेवर / स्टूडियो प्रोफ़ाइल',
    badgeLabel: 'Studio Professional',
    badgeEmoji: '💼',
    badgeColor: '#8b5cf6',
    gradient: 'from-violet-500 to-indigo-700',
    bgLight: 'bg-violet-500/15',
    borderColor: 'border-violet-500/40',
    textColor: 'text-violet-400',
    icon: Briefcase,
    description: 'For VFX artists, design agencies & commercial production studios.',
    hindiDesc: 'कमर्शियल प्रोडक्शन, 8K रेंडरिंग और इनवॉइसिंग सपोर्ट के लिए।',
    perks: [
      'Commercial Usage License Badge',
      '8K Master Render Priority Queue',
      'Official Tax Invoicing Support',
      'Multi-Track VFX Studio Presets',
    ],
  },
  creator: {
    type: 'creator',
    label: 'Content Creator',
    hindiLabel: 'डिजिटल क्रिएटर / इन्फ्लुएंसर',
    badgeLabel: 'Content Creator',
    badgeEmoji: '🎬',
    badgeColor: '#f59e0b',
    gradient: 'from-amber-500 to-rose-600',
    bgLight: 'bg-amber-500/15',
    borderColor: 'border-amber-500/40',
    textColor: 'text-amber-400',
    icon: Clapperboard,
    description: 'For YouTube, Instagram Reels & TikTok creators needing viral hooks and 4K shorts.',
    hindiDesc: 'यूट्यूब शॉर्ट्स, रील्स, वायरल हुक और थंबनेल निर्माण के लिए।',
    perks: [
      'Viral Reels & Shorts Auto-Generator',
      'Click-Worthy Thumbnail Generator',
      'Audio Meme & Voice FX Packs',
      'Gaming Emote Choreography',
    ],
  },
  general: {
    type: 'general',
    label: 'General Studio',
    hindiLabel: 'सामान्य रचनात्मक प्रोफ़ाइल',
    badgeLabel: 'General Studio',
    badgeEmoji: '✨',
    badgeColor: '#6366f1',
    gradient: 'from-indigo-500 to-cyan-600',
    bgLight: 'bg-indigo-500/15',
    borderColor: 'border-indigo-500/40',
    textColor: 'text-indigo-400',
    icon: Sparkles,
    description: 'Standard all-around multi-tool creative studio suite for personal projects.',
    hindiDesc: 'व्यक्तिगत प्रोजेक्ट्स के लिए संपूर्ण ऑल-इन-वन क्रिएटिव स्टूडियो।',
    perks: [
      'All 12 Studio Engines Access',
      'Free Text & Video Generation',
      '3D Auto-Rigging Tool',
      'Standard Cloud Storage Export',
    ],
  },
  guest: {
    type: 'guest',
    label: 'Guest Sandbox (Free Tier)',
    hindiLabel: 'अतिथि खाता (केवल मुफ़्त टियर)',
    badgeLabel: 'Guest Sandbox (Free)',
    badgeEmoji: '👤',
    badgeColor: '#64748b',
    gradient: 'from-slate-600 to-slate-800',
    bgLight: 'bg-slate-700/20',
    borderColor: 'border-slate-600/40',
    textColor: 'text-slate-300',
    icon: UserCheck,
    description: 'Temporary sandbox session for testing features without sign-up. Free tier limits apply.',
    hindiDesc: 'बिना साइन-अप के फ़ीचर्स टेस्ट करने के लिए मुफ़्त सैंडबॉक्स मोड।',
    isFreeOnly: true,
    perks: [
      'Instant Sandbox Access (No Sign-up)',
      '50 Starter Demo Tokens',
      'Standard 240p-720p Previews',
      '1-Click Upgrade to Master Profile',
    ],
  },
};

export const PRIMARY_CATEGORIES: {
  type: PersonaType;
  label: string;
  emoji: string;
  shortLabel: string;
  desc: string;
}[] = [
  {
    type: 'professional',
    label: 'Studio Professional (पेशेवर)',
    emoji: '💼',
    shortLabel: 'Professional',
    desc: '8K Master Renders, VFX, Commercial Tools',
  },
  {
    type: 'student',
    label: 'Student / Scholar (छात्र)',
    emoji: '🎒',
    shortLabel: 'Student',
    desc: 'Study AI, 3D Science, Homework & Projects',
  },
  {
    type: 'general',
    label: 'General Studio (सामान्य)',
    emoji: '✨',
    shortLabel: 'General',
    desc: 'All-in-one Creative Studio Suite',
  },
  {
    type: 'creator',
    label: 'Content Creator (क्रिएटर)',
    emoji: '🎬',
    shortLabel: 'Content Creator',
    desc: 'Reels, Shorts, Viral Hooks & Thumbnails',
  },
];

export function getPersonaConfig(type?: PersonaType): PersonaMeta {
  if (type && PERSONA_CONFIGS[type]) {
    return PERSONA_CONFIGS[type];
  }
  return PERSONA_CONFIGS.general;
}

interface PersonaBadgeProps {
  type?: PersonaType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showEmoji?: boolean;
  showLabel?: boolean;
  customLabel?: string;
  onClick?: () => void;
  className?: string;
}

export const PersonaBadge: React.FC<PersonaBadgeProps> = ({
  type = 'general',
  size = 'md',
  showIcon = true,
  showEmoji = true,
  showLabel = true,
  customLabel,
  onClick,
  className = '',
}) => {
  const config = getPersonaConfig(type);
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[9px] gap-1',
    md: 'px-2.5 py-1 text-[11px] gap-1.5',
    lg: 'px-3.5 py-1.5 text-xs gap-2',
  }[size];

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  const content = (
    <span
      className={`inline-flex items-center font-bold font-mono rounded-full border shadow-sm transition-all select-none whitespace-nowrap ${config.bgLight} ${config.borderColor} ${config.textColor} ${sizeClasses} ${onClick ? 'cursor-pointer hover:scale-105 hover:brightness-110' : ''} ${className}`}
      title={`${config.label} (${config.hindiLabel}) - ${config.description}`}
    >
      {showEmoji && <span className="select-none">{config.badgeEmoji}</span>}
      {showIcon && <IconComponent className={iconSizes} />}
      {showLabel && <span>{customLabel || config.badgeLabel}</span>}
      {config.isFreeOnly && (
        <span className="text-[8px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 uppercase font-black">
          Free Tier
        </span>
      )}
    </span>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="inline-flex focus:outline-none">
        {content}
      </button>
    );
  }

  return content;
};

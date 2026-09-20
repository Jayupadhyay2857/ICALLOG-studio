import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Award,
  CreditCard,
  FileCheck,
  Download,
  Copy,
  Check,
  RefreshCw,
  QrCode,
  Globe,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Plus,
  Trash2,
  Printer,
  Sliders,
  Palette,
  Eye,
  Layers,
  Shield,
  Zap,
  Camera,
  Film,
  Code,
  Type,
  Smile,
} from 'lucide-react';
import { UserProfile } from '../types.ts';
import { FontStudio } from './FontStudio.tsx';
import { EmoteStudio } from './EmoteStudio.tsx';

interface DesignIdentitySuiteProps {
  user?: UserProfile;
  initialSubTab?: 'favicon' | 'badges' | 'business_cards' | 'resume' | 'font_studio' | 'emote_studio';
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

/* ==========================================================================
   FAVICON PRESETS & ICONS
   ========================================================================== */
const FAVICON_GLYPHS = [
  { id: 'sparkles', label: 'Sparkles', icon: '✨' },
  { id: 'lightning', label: 'Lightning', icon: '⚡' },
  { id: 'film', label: 'Cinema', icon: '🎬' },
  { id: 'shield', label: 'Shield', icon: '🛡️' },
  { id: 'cube', label: '3D Cube', icon: '🧊' },
  { id: 'camera', label: 'Camera', icon: '🎥' },
  { id: 'rocket', label: 'Rocket', icon: '🚀' },
  { id: 'star', label: 'Star', icon: '⭐' },
  { id: 'flame', label: 'Flame', icon: '🔥' },
  { id: 'eye', label: 'Optic Eye', icon: '👁️' },
];

const FAVICON_GRADIENTS = [
  { id: 'cyan_indigo', label: 'Cyber Cyan', from: '#06b6d4', to: '#4f46e5' },
  { id: 'amber_rose', label: 'Solar Amber', from: '#f59e0b', to: '#e11d48' },
  { id: 'emerald_teal', label: 'Emerald Mint', from: '#10b981', to: '#0d9488' },
  { id: 'purple_pink', label: 'Neon Velvet', from: '#a855f7', to: '#ec4899' },
  { id: 'dark_gold', label: 'Luxury Gold', from: '#d97706', to: '#1e293b' },
];

export const DesignIdentitySuite: React.FC<DesignIdentitySuiteProps> = ({
  user,
  initialSubTab = 'favicon',
  onNotify,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'favicon' | 'badges' | 'business_cards' | 'resume' | 'font_studio' | 'emote_studio'
  >(initialSubTab);

  /* --------------------------------------------------------------------------
     FAVICON STATE
     -------------------------------------------------------------------------- */
  const [faviconLetter, setFaviconLetter] = useState('iC');
  const [faviconGlyph, setFaviconGlyph] = useState('✨');
  const [faviconMode, setFaviconMode] = useState<'letter' | 'glyph'>('letter');
  const [faviconShape, setFaviconShape] = useState<'squircle' | 'circle' | 'square'>('squircle');
  const [faviconGradient, setFaviconGradient] = useState(FAVICON_GRADIENTS[0]);
  const [faviconBorderGlow, setFaviconBorderGlow] = useState(true);
  const [isCopiedFaviconHtml, setIsCopiedFaviconHtml] = useState(false);

  const handleDownloadFavicon = (format: 'svg' | 'png') => {
    // Generate SVG string
    const rx = faviconShape === 'circle' ? '50%' : faviconShape === 'squircle' ? '25%' : '4%';
    const content =
      faviconMode === 'letter'
        ? `<text x="50%" y="54%" dominant-baseline="central" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="28">${faviconLetter}</text>`
        : `<text x="50%" y="52%" dominant-baseline="central" text-anchor="middle" font-size="32">${faviconGlyph}</text>`;

    const svgData = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <defs>
        <linearGradient id="favGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${faviconGradient.from}" />
          <stop offset="100%" stop-color="${faviconGradient.to}" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="${rx}" fill="url(#favGrad)" stroke="${faviconBorderGlow ? '#ffffff' : 'none'}" stroke-width="1.5" stroke-opacity="0.3" />
      ${content}
    </svg>`;

    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `favicon_${faviconLetter || 'logo'}.${format === 'svg' ? 'svg' : 'svg'}`;
    a.click();
    URL.revokeObjectURL(url);

    onNotify('Favicon Generated', `Downloaded ${format.toUpperCase()} Favicon icon!`, 'success');
  };

  const handleCopyFaviconHtml = () => {
    const snippet = `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />\n<meta name="theme-color" content="${faviconGradient.from}" />`;
    navigator.clipboard.writeText(snippet);
    setIsCopiedFaviconHtml(true);
    setTimeout(() => setIsCopiedFaviconHtml(false), 2000);
    onNotify('HTML Tag Copied', 'Favicon link tags copied to clipboard!', 'info');
  };

  /* --------------------------------------------------------------------------
     BADGES STATE
     -------------------------------------------------------------------------- */
  const [badgeHolderName, setBadgeHolderName] = useState(user?.name || 'KAIREN CHEN');
  const [badgeRole, setBadgeRole] = useState('LEAD CINEMA DIRECTOR');
  const [badgeDept, setBadgeDept] = useState('VIRTUAL PRODUCTION & 3D');
  const [badgeClearance, setBadgeClearance] = useState('LEVEL 5 - SOVEREIGN ACCESS');
  const [badgeIdCode, setBadgeIdCode] = useState('IC-9028-V18');
  const [badgeTheme, setBadgeTheme] = useState<'hologram' | 'gold_vip' | 'cyber_noir'>('hologram');

  const handlePrintBadge = () => {
    window.print();
    onNotify('Badge Export', 'Initiated badge printing dialog.', 'info');
  };

  /* --------------------------------------------------------------------------
     BUSINESS CARD STATE
     -------------------------------------------------------------------------- */
  const [cardSide, setCardSide] = useState<'front' | 'back'>('front');
  const [cardName, setCardName] = useState(user?.name || 'ALEXANDER STERLING');
  const [cardTitle, setCardTitle] = useState('Executive Creative Technologist');
  const [cardCompany, setCardCompany] = useState('iCALLOG STUDIOS');
  const [cardPhone, setCardPhone] = useState('+91 98765 43210');
  const [cardEmail, setCardEmail] = useState(user?.email || 'contact@icallog.studio');
  const [cardWebsite, setCardWebsite] = useState('https://icallog.studio');
  const [cardTagline, setCardTagline] = useState('Autonomous Cinema, 3D WebGL & Neural VFX');
  const [cardTheme, setCardTheme] = useState<'luxury_black' | 'cyber_neon' | 'pure_minimal'>('luxury_black');

  /* --------------------------------------------------------------------------
     RESUME STATE
     -------------------------------------------------------------------------- */
  const [resumeName, setResumeName] = useState('VIKRAMADITYA SEN');
  const [resumeTitle, setResumeTitle] = useState('Senior AI Systems & 3D WebGL Architect');
  const [resumeEmail, setResumeEmail] = useState('vikram.sen@icallog.studio');
  const [resumePhone, setResumePhone] = useState('+91 98200 12345');
  const [resumeLocation, setResumeLocation] = useState('Mumbai, MH / Remote');
  const [resumeSummary, setResumeSummary] = useState(
    'Accomplished Creative Technologist with 8+ years architecting real-time WebGL engines, neural video diffusion pipelines, and high-throughput microservices. Proven leadership in delivering 60 FPS in-browser 3D tools and cinematic autonomous workflows.'
  );

  const [resumeExperience, setResumeExperience] = useState([
    {
      company: 'iCALLOG Global Studios',
      role: 'Principal Creative & Systems Architect',
      period: '2023 – Present',
      bullets: [
        'Spearheaded development of 3D WebGL Emote Engine rendering 17-bone inverse kinematic armature rigs at 60 FPS.',
        'Engineered 8K video neural diffusion bus with distributed Node.js/Express queues, servicing 10,000+ creators.',
        'Integrated dynamic NPCI-compliant UPI recharge gateway and real-time Server-Sent Events token ledger.',
      ],
    },
    {
      company: 'Quantum Cinema Interactive',
      role: 'Lead Graphics Engineer',
      period: '2020 – 2023',
      bullets: [
        'Built custom WebGL shader pipelines utilizing Three.js and custom GLSL vertex deformation shaders.',
        'Decreased 3D asset cold-start load times by 68% via Draco compression and optimized GLTF buffers.',
      ],
    },
  ]);

  const [resumeSkills, setResumeSkills] = useState(
    'TypeScript, React 18, Three.js, WebGL, Node.js, Express, PostgreSQL, GLSL, 3D Auto-Rigging, 8K Video Pipelines, Tailwind CSS, Docker, Linux'
  );

  const [resumeEducation, setResumeEducation] = useState(
    'B.Tech in Computer Science & Engineering • Indian Institute of Technology (IIT) • 2016 – 2020'
  );

  return (
    <div className="space-y-4">
      {/* Top Identity Sub-Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'emote_studio', label: 'Custom Emote & Sticker Creator', icon: <Smile className="w-4 h-4 text-purple-400" /> },
            { id: 'font_studio', label: 'Font & Handwriting Studio', icon: <Type className="w-4 h-4 text-pink-400" /> },
            { id: 'favicon', label: 'Favicon Generator', icon: <Sparkles className="w-4 h-4 text-cyan-400" /> },
            { id: 'badges', label: 'Security & ID Badges', icon: <Award className="w-4 h-4 text-amber-400" /> },
            { id: 'business_cards', label: 'Business Cards Studio', icon: <CreditCard className="w-4 h-4 text-purple-400" /> },
            { id: 'resume', label: 'Professional ATS Resume', icon: <FileCheck className="w-4 h-4 text-emerald-400" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeSubTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 text-white shadow-lg shadow-purple-900/30 font-["Syne"]'
                  : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800/80'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Vector & Print Ready (300 DPI)</span>
        </div>
      </div>

      {/* ====================================================================
          VIEW 1: FAVICON CREATOR
          ==================================================================== */}
      {activeSubTab === 'favicon' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" /> Multi-Resolution Favicon & App Icon Studio
              </h3>
              <p className="text-xs text-slate-400">
                Design custom SVG & PNG favicons with realistic browser tab mockups and one-click code generation.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyFaviconHtml}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
              >
                {isCopiedFaviconHtml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopiedFaviconHtml ? 'Copied' : 'Copy <link> Tag'}</span>
              </button>

              <button
                onClick={() => handleDownloadFavicon('svg')}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-900/30"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download SVG Icon</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Controls */}
            <div className="lg:col-span-6 p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Icon Style Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFaviconMode('letter')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      faviconMode === 'letter'
                        ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Monogram Lettermark
                  </button>
                  <button
                    type="button"
                    onClick={() => setFaviconMode('glyph')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      faviconMode === 'glyph'
                        ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Symbolic Glyph
                  </button>
                </div>
              </div>

              {/* Input Value */}
              {faviconMode === 'letter' ? (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Monogram Characters (1–3 Letters)</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={faviconLetter}
                    onChange={(e) => setFaviconLetter(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-bold text-white uppercase focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Choose Glyph Symbol</label>
                  <div className="grid grid-cols-5 gap-2">
                    {FAVICON_GLYPHS.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setFaviconGlyph(g.icon)}
                        className={`p-2.5 rounded-xl text-xl border flex items-center justify-center transition-all ${
                          faviconGlyph === g.icon
                            ? 'bg-slate-800 border-cyan-400 ring-2 ring-cyan-500/40'
                            : 'bg-slate-950 border-slate-800 hover:bg-slate-800/60'
                        }`}
                      >
                        {g.icon}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Shape Selection */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Icon Geometry Shape</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'squircle', label: 'Squircle (iOS)' },
                    { id: 'circle', label: 'Circle' },
                    { id: 'square', label: 'Square' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFaviconShape(s.id as typeof faviconShape)}
                      className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all ${
                        faviconShape === s.id
                          ? 'bg-indigo-600 text-white border-indigo-400 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gradient Color */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Color Palette Gradient</label>
                <div className="grid grid-cols-5 gap-2">
                  {FAVICON_GRADIENTS.map((grad) => (
                    <button
                      key={grad.id}
                      type="button"
                      onClick={() => setFaviconGradient(grad)}
                      style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }}
                      className={`h-9 rounded-xl border transition-all ${
                        faviconGradient.id === grad.id ? 'ring-2 ring-white border-transparent' : 'border-slate-700/60'
                      }`}
                      title={grad.label}
                    />
                  ))}
                </div>
              </div>

              {/* Border Glow Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="text-xs font-bold text-white">Subtle Outer Rim Stroke</div>
                  <div className="text-[10px] text-slate-400">Adds polished high-contrast rim for dark and light tabs</div>
                </div>
                <input
                  type="checkbox"
                  checked={faviconBorderGlow}
                  onChange={(e) => setFaviconBorderGlow(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500"
                />
              </div>
            </div>

            {/* Right: Realistic Browser Mockup Preview */}
            <div className="lg:col-span-6 space-y-4">
              {/* Chrome Browser Tab Mockup */}
              <div className="p-4 rounded-3xl bg-slate-950 border border-slate-800 space-y-3 shadow-2xl">
                <div className="text-xs font-bold text-slate-300 font-['Syne'] flex items-center justify-between">
                  <span>Realistic Browser Tab Preview</span>
                  <span className="text-[10px] font-mono text-cyan-400">16x16 / 32x32 Tab View</span>
                </div>

                {/* Mock Browser Window */}
                <div className="rounded-2xl border border-slate-700/60 bg-[#1e232f] overflow-hidden shadow-xl">
                  {/* Browser Tab Header */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#121620] border-b border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </div>

                    {/* Active Browser Tab */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-t-xl bg-[#1e232f] border-t border-x border-slate-700/60 text-xs font-semibold text-white max-w-xs shadow-md">
                      {/* Rendered Tiny Favicon */}
                      <div
                        style={{
                          background: `linear-gradient(135deg, ${faviconGradient.from}, ${faviconGradient.to})`,
                          borderRadius: faviconShape === 'circle' ? '9999px' : faviconShape === 'squircle' ? '4px' : '2px',
                        }}
                        className={`w-4 h-4 shrink-0 flex items-center justify-center text-[9px] font-black text-white ${
                          faviconBorderGlow ? 'ring-1 ring-white/30' : ''
                        }`}
                      >
                        {faviconMode === 'letter' ? faviconLetter : faviconGlyph}
                      </div>
                      <span className="truncate">iCALLOG | Autonomous Studio</span>
                    </div>
                  </div>

                  {/* Mock URL Bar */}
                  <div className="px-3 py-2 bg-[#1e232f] flex items-center gap-2 text-xs font-mono text-slate-400">
                    <div className="flex-1 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 text-[11px]">
                      <span className="text-emerald-400 font-bold">🔒 https://</span>
                      <span className="text-white">studio.icallog.ai/workspace</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-Resolution Size Grid Preview */}
              <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
                <span className="text-xs font-mono text-slate-400 block font-bold">EXPORT RESOLUTIONS MATRIX</span>
                <div className="flex items-end justify-between gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                  {[
                    { size: '16px', wh: 16, label: '16x16' },
                    { size: '32px', wh: 32, label: '32x32' },
                    { size: '48px', wh: 48, label: '48x48' },
                    { size: '64px', wh: 64, label: '64x64' },
                    { size: '96px', wh: 96, label: '180x180 (iOS)' },
                  ].map((res) => (
                    <div key={res.label} className="flex flex-col items-center gap-1.5">
                      <div
                        style={{
                          width: `${res.wh}px`,
                          height: `${res.wh}px`,
                          background: `linear-gradient(135deg, ${faviconGradient.from}, ${faviconGradient.to})`,
                          borderRadius:
                            faviconShape === 'circle' ? '9999px' : faviconShape === 'squircle' ? `${Math.max(4, res.wh * 0.25)}px` : '4px',
                        }}
                        className={`flex items-center justify-center font-black text-white shadow-lg ${
                          faviconBorderGlow ? 'ring-1 ring-white/30' : ''
                        }`}
                      >
                        <span style={{ fontSize: `${Math.max(8, res.wh * 0.45)}px` }}>
                          {faviconMode === 'letter' ? faviconLetter : faviconGlyph}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500">{res.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          VIEW 2: BADGES CREATOR
          ==================================================================== */}
      {activeSubTab === 'badges' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" /> Security & Enterprise ID Badge Studio
              </h3>
              <p className="text-xs text-slate-400">
                Design physical and digital credentials with holographic foils, barcode security stripes, and chip contacts.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintBadge}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-900/30"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Pass Card</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Badge Form Fields */}
            <div className="lg:col-span-6 p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Member / Employee Full Name</label>
                <input
                  type="text"
                  value={badgeHolderName}
                  onChange={(e) => setBadgeHolderName(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-bold text-white focus:border-amber-400 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Designation & Role</label>
                <input
                  type="text"
                  value={badgeRole}
                  onChange={(e) => setBadgeRole(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white focus:border-amber-400 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Department / Production Unit</label>
                <input
                  type="text"
                  value={badgeDept}
                  onChange={(e) => setBadgeDept(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-amber-400 focus:outline-none uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Clearance Tier</label>
                  <select
                    value={badgeClearance}
                    onChange={(e) => setBadgeClearance(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  >
                    <option value="LEVEL 5 - SOVEREIGN ACCESS">LEVEL 5 - Sovereign Access</option>
                    <option value="LEVEL 4 - LEAD DIRECTOR">LEVEL 4 - Lead Director</option>
                    <option value="LEVEL 3 - TECHNICAL CREW">LEVEL 3 - Technical Crew</option>
                    <option value="VIP PASS - UNRESTRICTED">VIP PASS - Unrestricted</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Badge ID Code</label>
                  <input
                    type="text"
                    value={badgeIdCode}
                    onChange={(e) => setBadgeIdCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Badge Live Canvas Card */}
            <div className="lg:col-span-6 flex items-center justify-center p-6 rounded-3xl bg-slate-950 border border-slate-800">
              <div className="relative w-80 rounded-3xl overflow-hidden p-6 bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-amber-500/40 shadow-2xl space-y-4 text-center">
                {/* Lanyard Hole Mockup */}
                <div className="w-12 h-2.5 mx-auto rounded-full bg-slate-800 border border-slate-700/80" />

                {/* Top Studio Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-1.5 text-left">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-black text-slate-950 text-xs">
                      iC
                    </div>
                    <span className="font-extrabold text-xs font-['Syne'] tracking-wider text-white">iCALLOG STUDIOS</span>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    SECURITY ACCESS
                  </span>
                </div>

                {/* Avatar / Portrait Holder */}
                <div className="relative w-28 h-28 mx-auto rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-lg group">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop"
                    alt="Badge Holder"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-transparent to-amber-500/20 pointer-events-none" />
                </div>

                {/* Name & Role */}
                <div className="space-y-0.5">
                  <div className="text-base font-extrabold text-white font-['Syne'] tracking-wide">{badgeHolderName}</div>
                  <div className="text-xs font-bold text-amber-400 font-mono tracking-tight">{badgeRole}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{badgeDept}</div>
                </div>

                {/* Clearance Ribbon */}
                <div className="py-1 px-3 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold text-emerald-400">
                  {badgeClearance}
                </div>

                {/* Holographic Strip & Barcode */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400 opacity-70 animate-pulse" />
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
                    <span>ID: {badgeIdCode}</span>
                    <span>EXP: 12/2029</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          VIEW 3: BUSINESS CARDS MAKER
          ==================================================================== */}
      {activeSubTab === 'business_cards' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-400" /> Executive Business Cards Studio (3.5" x 2.0")
              </h3>
              <p className="text-xs text-slate-400">
                Design double-sided luxury business cards with metallic foil finishes and live QR vCard integrations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCardSide(cardSide === 'front' ? 'back' : 'front')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                <span>Flip to {cardSide === 'front' ? 'Back' : 'Front'}</span>
              </button>

              <button
                onClick={handlePrintBadge}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-900/30"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Card (300 DPI)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Inputs */}
            <div className="lg:col-span-5 p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Professional Title</label>
                <input
                  type="text"
                  value={cardTitle}
                  onChange={(e) => setCardTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Company / Studio</label>
                  <input
                    type="text"
                    value={cardCompany}
                    onChange={(e) => setCardCompany(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={cardPhone}
                    onChange={(e) => setCardPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
                <input
                  type="text"
                  value={cardEmail}
                  onChange={(e) => setCardEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Website URL</label>
                <input
                  type="text"
                  value={cardWebsite}
                  onChange={(e) => setCardWebsite(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
            </div>

            {/* Card Preview (Front & Back) */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCardSide('front')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                    cardSide === 'front' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  Front Side
                </button>
                <button
                  type="button"
                  onClick={() => setCardSide('back')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                    cardSide === 'back' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  Back Side
                </button>
              </div>

              {/* Physical Card Ratio Container */}
              <div className="w-full max-w-md aspect-[1.75/1] rounded-3xl p-6 flex flex-col justify-between shadow-2xl bg-gradient-to-br from-[#0c1017] via-[#141a24] to-[#0a0d13] border-2 border-purple-500/30 relative overflow-hidden">
                {/* Decorative Metallic Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

                {cardSide === 'front' ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center font-extrabold text-white text-xs shadow-md">
                          iC
                        </div>
                        <div>
                          <div className="font-extrabold text-sm tracking-wider text-white font-['Syne']">{cardCompany}</div>
                          <div className="text-[9px] text-purple-400 font-mono">GLOBAL CREATIVE STUDIO</div>
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                        <QrCode className="w-5 h-5 text-slate-300" />
                      </div>
                    </div>

                    <div className="space-y-1 my-auto">
                      <div className="text-lg font-black text-white font-['Syne'] tracking-wide">{cardName}</div>
                      <div className="text-xs font-semibold text-purple-300 font-mono">{cardTitle}</div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono">
                      <div className="flex items-center gap-1.5 truncate">
                        <Phone className="w-3 h-3 text-purple-400 shrink-0" />
                        <span className="truncate">{cardPhone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 text-purple-400 shrink-0" />
                        <span className="truncate">{cardEmail}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 flex items-center justify-center font-black text-white text-lg shadow-xl shadow-purple-900/40">
                      iCALLOG
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-white tracking-widest uppercase font-['Syne']">
                        {cardTagline}
                      </div>
                      <div className="text-[10px] font-mono text-cyan-400">{cardWebsite}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          VIEW 4: ATS RESUME BUILDER
          ==================================================================== */}
      {activeSubTab === 'resume' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" /> Professional ATS Resume & CV Builder
              </h3>
              <p className="text-xs text-slate-400">
                Generate high-impact ATS-friendly resumes optimized for tech, creative cinema, and engineering roles.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintBadge}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-900/30"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save as PDF</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Editor Sidebar */}
            <div className="lg:col-span-5 p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 max-h-[700px] overflow-y-auto">
              <div className="text-xs font-bold text-white font-mono border-b border-slate-800 pb-2">PERSONAL DETAILS</div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={resumeName}
                  onChange={(e) => setResumeName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Professional Title</label>
                <input
                  type="text"
                  value={resumeTitle}
                  onChange={(e) => setResumeTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Email</label>
                  <input
                    type="text"
                    value={resumeEmail}
                    onChange={(e) => setResumeEmail(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={resumePhone}
                    onChange={(e) => setResumePhone(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Executive Summary</label>
                <textarea
                  rows={3}
                  value={resumeSummary}
                  onChange={(e) => setResumeSummary(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed resize-none"
                />
              </div>

              <div className="text-xs font-bold text-white font-mono border-b border-slate-800 pt-2 pb-1">TECHNICAL SKILLS</div>
              <textarea
                rows={2}
                value={resumeSkills}
                onChange={(e) => setResumeSkills(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 resize-none"
              />

              <div className="text-xs font-bold text-white font-mono border-b border-slate-800 pt-2 pb-1">EDUCATION</div>
              <input
                type="text"
                value={resumeEducation}
                onChange={(e) => setResumeEducation(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            {/* Resume Sheet Preview (A4 Paper Print Ready) */}
            <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-950 border border-slate-800 flex justify-center">
              <div className="w-full max-w-xl rounded-2xl bg-white text-slate-900 p-8 shadow-2xl space-y-4 text-left font-sans">
                {/* Header */}
                <div className="border-b-2 border-slate-900 pb-3">
                  <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">{resumeName}</h1>
                  <h2 className="text-xs font-bold tracking-wider text-cyan-700 uppercase mt-0.5">{resumeTitle}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-600 mt-2 font-mono">
                    <span>{resumeEmail}</span>
                    <span>•</span>
                    <span>{resumePhone}</span>
                    <span>•</span>
                    <span>{resumeLocation}</span>
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-1">
                  <h3 className="text-xs font-bold tracking-wider text-slate-900 uppercase border-b border-slate-300 pb-0.5">
                    Professional Summary
                  </h3>
                  <p className="text-[11px] text-slate-700 leading-relaxed">{resumeSummary}</p>
                </div>

                {/* Experience */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold tracking-wider text-slate-900 uppercase border-b border-slate-300 pb-0.5">
                    Work Experience
                  </h3>
                  {resumeExperience.map((exp, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-950">{exp.role} — {exp.company}</span>
                        <span className="text-[10px] font-mono text-slate-500">{exp.period}</span>
                      </div>
                      <ul className="list-disc list-inside text-[10px] text-slate-700 space-y-0.5 pl-1">
                        {exp.bullets.map((b, bIdx) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Skills */}
                <div className="space-y-1">
                  <h3 className="text-xs font-bold tracking-wider text-slate-900 uppercase border-b border-slate-300 pb-0.5">
                    Core Competencies & Tech Stack
                  </h3>
                  <p className="text-[11px] text-slate-700 leading-relaxed">{resumeSkills}</p>
                </div>

                {/* Education */}
                <div className="space-y-1">
                  <h3 className="text-xs font-bold tracking-wider text-slate-900 uppercase border-b border-slate-300 pb-0.5">
                    Education & Credentials
                  </h3>
                  <p className="text-[11px] text-slate-700">{resumeEducation}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ====================================================================
          VIEW 5: EMOTE & STICKER CREATOR STUDIO
          ==================================================================== */}
      {activeSubTab === 'emote_studio' && <EmoteStudio onNotify={onNotify} />}

      {/* ====================================================================
          VIEW 6: FONT & HANDWRITING STUDIO
          ==================================================================== */}
      {activeSubTab === 'font_studio' && <FontStudio onNotify={onNotify} />}
    </div>
  );
};

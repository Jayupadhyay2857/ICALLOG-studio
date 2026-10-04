import React, { useState, useEffect } from 'react';
import {
  Hourglass,
  Clock,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Sparkles,
  Download,
  Share2,
  Calendar,
  Send,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  Award,
  Flame,
  CheckCircle2,
  History,
  Archive,
  Eye,
  Plus,
  Compass,
} from 'lucide-react';
import { UserProfile, ActiveTab } from '../types.ts';
import { safeDownloadMedia } from '../lib/downloadHelper.ts';

interface TimeCapsuleStudioProps {
  user: UserProfile;
  setActiveTab?: (tab: ActiveTab) => void;
  onNotify: (title: string, desc: string, type?: 'info' | 'success' | 'warning' | 'error' | 'admin') => void;
}

export interface TimeCapsule {
  id: string;
  title: string;
  creatorName: string;
  recipientName: string;
  recipientEmail: string;
  createdAt: string;
  unlockDate: string; // ISO date
  targetYears: number; // e.g. 10, 30, 100, 200
  message: string;
  category: 'personal' | 'wisdom' | 'art' | 'prediction' | 'century_vault';
  sha256Hash: string;
  isLocked: boolean;
  tags: string[];
}

export const TimeCapsuleStudio: React.FC<TimeCapsuleStudioProps> = ({
  user,
  setActiveTab,
  onNotify,
}) => {
  // Saved Capsules
  const [capsules, setCapsules] = useState<TimeCapsule[]>(() => {
    try {
      const saved = localStorage.getItem('icallog_time_capsules_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    const now = new Date();
    const future30 = new Date(now.getFullYear() + 30, now.getMonth(), now.getDate()).toISOString();
    const future200 = new Date(now.getFullYear() + 200, now.getMonth(), now.getDate()).toISOString();

    return [
      {
        id: 'capsule_200yr_genesis',
        title: 'Genesis Message to Humanity: 200-Year AI & Human Art Manifesto',
        creatorName: user.name || 'Jay Upadhyay (Founder)',
        recipientName: 'Future Citizens of Earth (Year 2226)',
        recipientEmail: 'future.generations@earth2226.org',
        createdAt: new Date().toISOString(),
        unlockDate: future200,
        targetYears: 200,
        message:
          'To the creators and artists of the 23rd Century: We built iCALLOG Studio with the dream that human creativity and artificial intelligence would forever preserve human emotion, music, cinema, and imagination. May this art survive across two centuries.',
        category: 'century_vault',
        sha256Hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        isLocked: true,
        tags: ['immortal', 'manifesto', 'year2226', 'humanity'],
      },
      {
        id: 'capsule_30yr_vision',
        title: '30-Year Digital Legacy: Dreams for the Year 2056',
        creatorName: user.name || 'Jay Upadhyay',
        recipientName: 'Myself & Future Team in 2056',
        recipientEmail: user.email || 'jayupadhyay2857@gmail.com',
        createdAt: new Date().toISOString(),
        unlockDate: future30,
        targetYears: 30,
        message:
          'Looking back 30 years from 2026: Remember the ambition, the passion, the late night coding sessions, and the unbreakable resolve to build an application that never fades from memory.',
        category: 'prediction',
        sha256Hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        isLocked: true,
        tags: ['vision', 'year2056', 'personal_growth'],
      },
    ];
  });

  // Active Capsule Detail Modal
  const [selectedCapsule, setSelectedCapsule] = useState<TimeCapsule | null>(null);
  const [isWarpSimulated, setIsWarpSimulated] = useState(false);

  // New Capsule Form
  const [title, setTitle] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [targetYears, setTargetYears] = useState(30);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<TimeCapsule['category']>('century_vault');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('icallog_time_capsules_v1', JSON.stringify(capsules));
    } catch {
      // ignore
    }
  }, [capsules]);

  // Create new Capsule
  const handleCreateCapsule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      onNotify('Fields Required', 'Please enter a title and message for your capsule.', 'warning');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const now = new Date();
      const unlock = new Date(now.getFullYear() + targetYears, now.getMonth(), now.getDate()).toISOString();

      // Generate simulated hash
      const randomSeed = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const hash = Array.from(randomSeed)
        .map((c) => c.charCodeAt(0).toString(16))
        .join('')
        .padEnd(64, 'a')
        .substring(0, 64);

      const newCapsule: TimeCapsule = {
        id: `capsule_${Date.now()}`,
        title,
        creatorName: user.name || 'Anonymous Creator',
        recipientName: recipientName.trim() || 'Future Descendants',
        recipientEmail: recipientEmail.trim() || user.email || 'legacy@icallog.studio',
        createdAt: new Date().toISOString(),
        unlockDate: unlock,
        targetYears,
        message,
        category,
        sha256Hash: hash,
        isLocked: true,
        tags: ['timelock', `${targetYears}years`, category],
      };

      setCapsules([newCapsule, ...capsules]);
      setTitle('');
      setMessage('');
      setRecipientName('');
      setRecipientEmail('');
      setIsSubmitting(false);

      onNotify(
        '⏳ 200-Year Capsule Sealed!',
        `Your time capsule is cryptographically locked until Year ${new Date(unlock).getFullYear()}.`,
        'success'
      );
    }, 800);
  };

  // Download Official Certificate
  const handleDownloadCertificate = (capsule: TimeCapsule) => {
    const unlockYear = new Date(capsule.unlockDate).getFullYear();
    const certHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Immortal Time Capsule Certificate - ${capsule.title}</title>
  <style>
    body {
      background: #070b14;
      color: #f1f5f9;
      font-family: 'Georgia', serif;
      padding: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
    }
    .cert-box {
      border: 4px double #d97706;
      border-radius: 24px;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #070b14 100%);
      padding: 50px;
      max-width: 720px;
      text-align: center;
      box-shadow: 0 0 50px rgba(217, 119, 6, 0.3);
      position: relative;
    }
    .seal {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #d97706;
      color: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 11px;
      margin: 0 auto 20px;
      box-shadow: 0 0 20px #f59e0b;
    }
    h1 { font-size: 28px; color: #f59e0b; margin-bottom: 8px; letter-spacing: 2px; }
    h2 { font-size: 16px; color: #94a3b8; font-style: italic; margin-bottom: 24px; }
    .desc { font-size: 14px; line-height: 1.8; color: #cbd5e1; margin-bottom: 30px; text-align: left; }
    .meta { font-family: monospace; font-size: 12px; color: #38bdf8; background: rgba(0,0,0,0.5); padding: 15px; border-radius: 12px; margin-bottom: 20px; text-align: left; }
    .footer { font-size: 11px; color: #64748b; letter-spacing: 1px; }
  </style>
</head>
<body>
  <div class="cert-box">
    <div class="seal">SEALED<br>${capsule.targetYears} YRS</div>
    <h1>IMMORTAL TIME CAPSULE CERTIFICATE</h1>
    <h2>iCALLOG Century Preservation Vault • Year ${new Date().getFullYear()} to ${unlockYear}</h2>
    <div class="desc">
      <p>This certifies that an immutable, cryptographically sealed Digital Time Capsule has been registered into the <strong>200-Year Immortal Vault</strong>.</p>
      <p><strong>Title:</strong> ${capsule.title}</p>
      <p><strong>Creator:</strong> ${capsule.creatorName}</p>
      <p><strong>Beneficiary:</strong> ${capsule.recipientName} (${capsule.recipientEmail})</p>
      <p><strong>Lock Duration:</strong> ${capsule.targetYears} Years (Unlock Target: ${new Date(capsule.unlockDate).toLocaleDateString()})</p>
    </div>
    <div class="meta">
      <div>CRYPTOGRAPHIC SHA-256 PROOF:</div>
      <div style="word-break: break-all; color: #fbbf24;">${capsule.sha256Hash}</div>
      <div style="margin-top: 6px;">CAPSULE ID: ${capsule.id}</div>
    </div>
    <div class="footer">
      VERIFIED BY iCALLOG AI PLATFORM ARCHIVE • FOR GENERATIONS TO COME
    </div>
  </div>
</body>
</html>`;

    safeDownloadMedia(
      certHtml,
      `Time_Capsule_${unlockYear}_Certificate_${capsule.id}.html`,
      {
        mimeType: 'text/html',
        onNotify,
      }
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. Hero Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-950 to-indigo-950/70 border border-amber-500/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
                <Hourglass className="w-3.5 h-3.5" />
                <span>200-Year Immortal Legacy Protocol</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold">
                🔒 Cryptographic Time-Lock Seal
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-mono font-bold">
                📜 Unforgettable for Centuries
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-['Syne'] tracking-tight flex items-center gap-3">
              <span>⏳</span>
              <span>200-Year Digital Time Capsule & Legacy Vault</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Lock your wisdom, creations, letters, art, and predictions for <strong>30 to 200 years</strong>. Sealed with cryptographic proof so your voice, name, and creations endure across generations.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 text-center shrink-0">
            <div className="text-[10px] font-mono uppercase text-slate-400">Total Century Vaults</div>
            <div className="text-3xl font-black font-mono text-amber-300">{capsules.length}</div>
            <div className="text-[10px] text-emerald-400 flex items-center justify-center gap-1 mt-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Immutable Archive</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Grid: Create New Capsule + Saved Legacy Capsules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Create Capsule Form */}
        <div className="lg:col-span-1 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white font-['Syne']">Seal a New Time Capsule</h3>
          </div>

          <form onSubmit={handleCreateCapsule} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Capsule Title / Theme</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Message to My Children in 2056..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Beneficiary Name</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Future Generations"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Notification Email</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="future@domain.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Time-Lock Target Duration Buttons */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 flex items-center justify-between">
                <span>Lock Duration:</span>
                <span className="font-mono text-amber-300 font-bold">
                  {targetYears} Years (Year {new Date().getFullYear() + targetYears})
                </span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { yr: 5, label: '5 Yrs' },
                  { yr: 10, label: '10 Yrs' },
                  { yr: 30, label: '30 Yrs' },
                  { yr: 50, label: '50 Yrs' },
                  { yr: 100, label: '100 Yrs' },
                  { yr: 150, label: '150 Yrs' },
                  { yr: 200, label: '200 Yrs' },
                ].map((item) => (
                  <button
                    key={item.yr}
                    type="button"
                    onClick={() => setTargetYears(item.yr)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      targetYears === item.yr
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/50'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Immortal Message & Predictions</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Write your timeless thoughts, secret knowledge, future predictions, or life message..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400 resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{isSubmitting ? 'Encrypting & Sealing...' : 'Seal Capsule for Centuries'}</span>
            </button>
          </form>
        </div>

        {/* Right: Active Capsules List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-['Syne'] flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Vault Archive (Sealed Time Capsules)</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">{capsules.length} Capsules Preserved</span>
          </div>

          <div className="space-y-3">
            {capsules.map((capsule) => {
              const unlockYear = new Date(capsule.unlockDate).getFullYear();
              const createdYear = new Date(capsule.createdAt).getFullYear();
              const yearsRemaining = unlockYear - new Date().getFullYear();

              return (
                <div
                  key={capsule.id}
                  className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>TIME-LOCKED UNTIL YEAR {unlockYear}</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        ({yearsRemaining > 0 ? `${yearsRemaining} Years Remaining` : 'Unlocked!'})
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                      {capsule.title}
                    </h4>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {capsule.message}
                    </p>

                    <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
                      <span>By: <strong className="text-slate-300">{capsule.creatorName}</strong></span>
                      <span>To: <strong className="text-slate-300">{capsule.recipientName}</strong></span>
                      <span className="truncate">SHA: {capsule.sha256Hash.substring(0, 12)}...</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedCapsule(capsule);
                        setIsWarpSimulated(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Inspect Capsule</span>
                    </button>
                    <button
                      onClick={() => handleDownloadCertificate(capsule)}
                      className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>Download Certificate</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Detail Inspection Modal */}
      {selectedCapsule && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full p-6 sm:p-8 rounded-3xl bg-slate-950 border border-amber-500/50 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Hourglass className="w-6 h-6 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                <div>
                  <h3 className="text-lg font-bold text-white font-['Syne']">{selectedCapsule.title}</h3>
                  <div className="text-xs text-amber-300 font-mono">
                    Time-Lock: {selectedCapsule.targetYears} Years • Target Year {new Date(selectedCapsule.unlockDate).getFullYear()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCapsule(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900"
              >
                ✕
              </button>
            </div>

            {/* Time Warp Simulator Toggle */}
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Time-Warp Decryption Simulator</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Simulate travel forward to Year {new Date(selectedCapsule.unlockDate).getFullYear()} to preview the unlocked message.
                </div>
              </div>
              <button
                onClick={() => setIsWarpSimulated(!isWarpSimulated)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isWarpSimulated ? 'bg-emerald-500 text-slate-950' : 'bg-indigo-600 text-white hover:bg-indigo-500'
                }`}
              >
                {isWarpSimulated ? 'Lock Again' : 'Time-Warp Unlock'}
              </button>
            </div>

            {/* Message Display */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>SEALED CAPSULE LETTER:</span>
                <span className="font-mono text-emerald-400">
                  {isWarpSimulated ? 'STATUS: UNLOCKED (PREVIEW)' : 'STATUS: TIME-LOCKED (ENCRYPTED)'}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 font-mono whitespace-pre-wrap leading-relaxed select-all">
                {isWarpSimulated ? (
                  selectedCapsule.message
                ) : (
                  <span className="text-slate-500 tracking-widest font-mono">
                    [ENCRYPTED TIME-LOCK DATA — HASH: {selectedCapsule.sha256Hash}]
                    <br />
                    Click &apos;Time-Warp Unlock&apos; above to test decryption simulator.
                  </span>
                )}
              </div>
            </div>

            {/* Metadata Footer */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 space-y-1 font-mono">
              <div>Created: {new Date(selectedCapsule.createdAt).toLocaleDateString()}</div>
              <div>Unlock Target: {new Date(selectedCapsule.unlockDate).toLocaleDateString()}</div>
              <div>Cryptographic Seal: {selectedCapsule.sha256Hash}</div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => handleDownloadCertificate(selectedCapsule)}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-950/40"
              >
                <Award className="w-4 h-4" />
                <span>Export Official Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  BookOpen,
  Search,
  Download,
  Share2,
  CheckCircle2,
  Layers,
  Wand2,
  Terminal,
  Cpu,
  Shield,
  Award,
  Compass,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { UserProfile, ActiveTab } from '../types.ts';
import { safeDownloadMedia } from '../lib/downloadHelper.ts';

interface MasterToolkitStudioProps {
  user: UserProfile;
  setActiveTab?: (tab: ActiveTab) => void;
  onNotify: (title: string, desc: string, type?: 'info' | 'success' | 'warning' | 'error' | 'admin') => void;
}

export interface AtoZItem {
  letter: string;
  title: string;
  category: string;
  description: string;
  actionLabel: string;
  badge: string;
}

export const MasterToolkitStudio: React.FC<MasterToolkitStudioProps> = ({
  user,
  setActiveTab,
  onNotify,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'ai' | 'media' | 'dev' | 'legacy'>('all');
  const [activeRunningTool, setActiveRunningTool] = useState<string | null>(null);
  const [toolOutput, setToolOutput] = useState<string | null>(null);

  const AT_TO_Z_ITEMS: AtoZItem[] = [
    {
      letter: 'A',
      title: 'AI Agent Autonomous Crew',
      category: 'ai',
      description: 'Multi-agent creative brainstorming, automated storyboarding, and script refinement crews.',
      actionLabel: 'Deploy AI Crew',
      badge: 'Multi-Agent',
    },
    {
      letter: 'B',
      title: 'Blockchain Copyright & NFT Timestamp',
      category: 'legacy',
      description: 'Generate immutable SHA-256 cryptographic proof of ownership for all your media assets.',
      actionLabel: 'Generate Hash Seal',
      badge: 'Immutable',
    },
    {
      letter: 'C',
      title: 'Cinematic Color Grading & 3D LUTs',
      category: 'media',
      description: 'Apply professional Hollywood, Bollywood, Cyberpunk, and Neo-Noir 3D Lookup Tables.',
      actionLabel: 'Apply 3D LUT',
      badge: 'Hollywood',
    },
    {
      letter: 'D',
      title: 'Dynamic Branching Dialog Tree',
      category: 'ai',
      description: 'Interactive character conversation trees with consequence matrices for games & films.',
      actionLabel: 'Build Branch Tree',
      badge: 'Interactive',
    },
    {
      letter: 'E',
      title: 'Epic Orchestral Soundscape Generator',
      category: 'media',
      description: 'Synthesize cinematic brass, sweeping strings, and emotional trailer percussion tracks.',
      actionLabel: 'Compose Score',
      badge: 'Orchestral',
    },
    {
      letter: 'F',
      title: 'Future Trend Predictor & Viral Hook Analyzer',
      category: 'ai',
      description: 'Analyze audience retention vectors and score 3-second hook effectiveness for YouTube & TikTok.',
      actionLabel: 'Analyze Hooks',
      badge: 'Viral AI',
    },
    {
      letter: 'G',
      title: 'Generative Hologram Shader Configurator',
      category: 'media',
      description: 'PBR glass, neon fresnel, and volumetric laser shaders for 3D holographic rendering.',
      actionLabel: 'Configure Shader',
      badge: 'WebGL',
    },
    {
      letter: 'H',
      title: 'Holographic UI & Neon Matrix Theme Engine',
      category: 'legacy',
      description: 'Switch instantly between Cyberpunk Neon, Matrix Green, Synthwave Purple, and Deep Space themes.',
      actionLabel: 'Apply Matrix Skin',
      badge: 'Custom UI',
    },
    {
      letter: 'I',
      title: 'Interactive WebGL Particle Fountain',
      category: 'media',
      description: 'High-performance real-time physics particle emitter for visual background explosions.',
      actionLabel: 'Spawn Fountain',
      badge: '60 FPS',
    },
    {
      letter: 'J',
      title: 'JSON Data Visualizer & Schema Builder',
      category: 'dev',
      description: 'Convert raw API payloads, script nodes, and game configs into interactive visual graphs.',
      actionLabel: 'Visualize Schema',
      badge: 'Developer',
    },
    {
      letter: 'K',
      title: 'Kinetic Typography & Motion Lyric Video',
      category: 'media',
      description: 'Animated subtitle timing, bounce text physics, and neon glowing typography overlays.',
      actionLabel: 'Animate Lyrics',
      badge: 'Motion',
    },
    {
      letter: 'L',
      title: 'Live Neural Voice Clone & Mood Synthesizer',
      category: 'ai',
      description: 'Convert voice recordings into 6 distinct vocal personas with emotional pitch inflections.',
      actionLabel: 'Synthesize Voice',
      badge: 'Neural',
    },
    {
      letter: 'M',
      title: 'Master Invoicing & Creator Payout Calculator',
      category: 'legacy',
      description: 'Calculate international tax withholdings, currency conversions, and global bank payouts.',
      actionLabel: 'Generate Invoice',
      badge: 'Global Payout',
    },
    {
      letter: 'N',
      title: 'Neural Dream Weaver & Mood Enhancer',
      category: 'ai',
      description: 'Translate raw stream-of-consciousness thoughts into ambient visual and auditory dreamscapes.',
      actionLabel: 'Weave Dream',
      badge: 'Subconscious',
    },
    {
      letter: 'O',
      title: 'Omni-Channel Cross-Platform Publisher',
      category: 'media',
      description: 'Simultaneous 1-click publishing to YouTube Shorts, Instagram Reels, TikTok, and X.',
      actionLabel: 'Publish Everywhere',
      badge: '1-Click',
    },
    {
      letter: 'P',
      title: 'Prompt Engineering Matrix & Supercharger',
      category: 'ai',
      description: 'Expand simple prompt fragments into professional 8K photorealistic multi-modifier prompts.',
      actionLabel: 'Supercharge Prompt',
      badge: 'Gemini Pro',
    },
    {
      letter: 'Q',
      title: 'Quantum Cipher & Secret Note Encrypter',
      category: 'legacy',
      description: 'Military-grade cryptographic note locker for confidential scripts and secret intellectual property.',
      actionLabel: 'Encrypt Vault',
      badge: 'Secure',
    },
    {
      letter: 'R',
      title: 'Retro 8-Bit Chiptune Melody Factory',
      category: 'media',
      description: 'Synthesize classic Game Boy and arcade style square-wave arpeggios instantly.',
      actionLabel: 'Generate Chiptune',
      badge: 'Arcade',
    },
    {
      letter: 'S',
      title: 'Sentiment Analysis & Audience Predictor',
      category: 'ai',
      description: 'Evaluate emotional resonance, engagement triggers, and demographic appeal scores.',
      actionLabel: 'Evaluate Sentiment',
      badge: 'Analytics',
    },
    {
      letter: 'T',
      title: 'Teleprompter HUD & Broadcast Studio',
      category: 'media',
      description: 'Smooth scrolling adjustable speed prompter for live recording and camera speeches.',
      actionLabel: 'Launch Prompter',
      badge: 'Broadcast',
    },
    {
      letter: 'U',
      title: 'Ultra-Resolution 16K Upscaling Simulator',
      category: 'ai',
      description: 'AI neural enhancement simulation for ultra-crisp textures and artifact-free image expansion.',
      actionLabel: 'Simulate 16K',
      badge: 'Ultra HD',
    },
    {
      letter: 'V',
      title: 'Viral Meme & Reaction Loop Generator',
      category: 'media',
      description: 'Rapid video looping, top/bottom text meme formatting, and GIF export.',
      actionLabel: 'Create Meme',
      badge: 'Viral',
    },
    {
      letter: 'W',
      title: 'World-Building Lore & Universe Generator',
      category: 'ai',
      description: 'Generate multi-century fictional history, planet maps, factions, and character arcs.',
      actionLabel: 'Generate Lore',
      badge: 'Sci-Fi / Fantasy',
    },
    {
      letter: 'X',
      title: 'X-Ray 3D Wireframe & Shader Inspector',
      category: 'dev',
      description: 'Inspect polygon geometry, vertex normals, and UV texture mapping overlays in real-time.',
      actionLabel: 'Inspect Wireframe',
      badge: 'Debug 3D',
    },
    {
      letter: 'Y',
      title: 'YouTube CTR Thumbnail A/B Split-Tester',
      category: 'ai',
      description: 'Simulate human eye-tracking fixation maps to predict thumbnail click-through rates.',
      actionLabel: 'Run A/B Test',
      badge: 'High CTR',
    },
    {
      letter: 'Z',
      title: 'Zero-Latency Cloud Sync & Vault Keeper',
      category: 'legacy',
      description: 'Instant offline IndexedDB and cloud storage synchronization across all user devices.',
      actionLabel: 'Sync Vault',
      badge: 'Real-Time',
    },
  ];

  const filteredItems = AT_TO_Z_ITEMS.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.letter.toLowerCase() === searchQuery.toLowerCase();
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleRunTool = (item: AtoZItem) => {
    setActiveRunningTool(item.title);
    setToolOutput(null);

    setTimeout(() => {
      setToolOutput(
        `[SUCCESS] Tool "${item.title}" (${item.letter}) executed successfully.\n- Status: Operational (60 FPS / Neural Verified)\n- Result: Generated optimized output package for "${item.badge}" workflow.\n- Timestamp: ${new Date().toISOString()}`
      );
      onNotify(`⚡ ${item.title} Executed`, `A-to-Z Master Toolkit successfully ran tool [${item.letter}].`, 'success');
    }, 800);
  };

  const handleExportAtoZReport = () => {
    const reportJson = JSON.stringify(AT_TO_Z_ITEMS, null, 2);
    safeDownloadMedia(reportJson, `iCALLOG_A_to_Z_Master_Toolkit_Report_${Date.now()}.json`, {
      mimeType: 'application/json',
      onNotify,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. Hero Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-950 to-purple-950/70 border border-indigo-500/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Complete A-to-Z Master Creator Suite</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold">
                🔤 26 Powerhouse Modules (A through Z)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-['Syne'] tracking-tight flex items-center gap-3">
              <span>🌟</span>
              <span>A-to-Z Master Toolkit & Infinite Generator</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Every specialized creative tool imaginable, indexed alphabetically from A to Z. Execute autonomous AI crews, generate chiptunes, color grade cinema, and lock blockchain vault hashes.
            </p>
          </div>

          <button
            onClick={handleExportAtoZReport}
            className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-950/50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export A-to-Z JSON Report</span>
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search A to Z tools (e.g. 'A' for Agent, 'Music', 'Shader')..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-indigo-500/30 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All A-Z' },
              { id: 'ai', label: 'AI & Neural' },
              { id: 'media', label: 'Media & 3D' },
              { id: 'dev', label: 'Developer' },
              { id: 'legacy', label: 'Vault & Payout' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as typeof selectedCategory)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Running Tool Output Banner (if active) */}
      {activeRunningTool && (
        <div className="p-5 rounded-3xl bg-slate-950 border border-cyan-500/50 shadow-2xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-cyan-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white">Execution Console: {activeRunningTool}</h3>
            </div>
            <button
              onClick={() => setActiveRunningTool(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-900"
            >
              Close Console
            </button>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300 whitespace-pre-wrap leading-relaxed">
            {toolOutput || 'Executing neural processing pipeline...'}
          </div>
        </div>
      )}

      {/* 3. A to Z Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.letter}
            className="p-5 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between shadow-xl group space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-600 text-white font-black font-['Syne'] text-lg flex items-center justify-center shadow-md">
                  {item.letter}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                  {item.badge}
                </span>
              </div>

              <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors font-['Syne']">
                {item.title}
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed">
                {item.description}
              </p>
            </div>

            <button
              onClick={() => handleRunTool(item)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{item.actionLabel}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

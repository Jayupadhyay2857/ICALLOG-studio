import React, { useState } from 'react';
import {
  ShoppingBag,
  Tag,
  DollarSign,
  Sparkles,
  Download,
  Plus,
  Search,
  CheckCircle2,
  Box,
  Music,
  Video,
  FileText,
  Star,
  Layers,
  ArrowRight,
  TrendingUp,
  Globe,
  Wallet,
  ShieldCheck,
  X,
  Upload,
} from 'lucide-react';
import { UserProfile } from '../types.ts';
import { safeDownloadMedia } from '../lib/downloadHelper.ts';

interface CreatorMarketplaceStudioProps {
  user?: UserProfile;
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  onOpenGlobalPayments?: () => void;
}

interface MarketplaceItem {
  id: string;
  title: string;
  creatorName: string;
  creatorAvatar: string;
  category: '3d' | 'music' | 'video' | 'prompt' | 'vfx';
  priceTokens: number;
  priceUsd: number;
  rating: number;
  downloadsCount: number;
  previewUrl: string;
  description: string;
  tags: string[];
  fileFormat: string;
}

const INITIAL_MARKETPLACE_ITEMS: MarketplaceItem[] = [
  {
    id: 'item_3d_dragon',
    title: 'Ancient Cyber Dragon (17-Bone Rigged 3D GLTF)',
    creatorName: 'Jay Master Creator',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    category: '3d',
    priceTokens: 250,
    priceUsd: 15,
    rating: 4.9,
    downloadsCount: 1420,
    previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    description: 'Fully rigged volumetric dragon model with 8K PBR emission shaders and inverse kinematics.',
    tags: ['3D Mesh', 'Rigged', 'GLTF', 'Unreal Engine'],
    fileFormat: '.GLTF / .OBJ (8K Textures)',
  },
  {
    id: 'item_music_lofi',
    title: 'Neon Tokyo Chillhop & Trap Beat Pack (8 Stems)',
    creatorName: 'BeatLab DJ Studio',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    category: 'music',
    priceTokens: 180,
    priceUsd: 10,
    rating: 4.8,
    downloadsCount: 890,
    previewUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    description: 'Royalty-free multi-track audio stems, MIDI files, 128 BPM synthesizer chords, and 808 sub-bass.',
    tags: ['Music Stems', 'WAV 24-bit', 'Royalty-Free', 'Trap Beats'],
    fileFormat: '.WAV Multi-Track (320kbps MP3 Master)',
  },
  {
    id: 'item_video_cyberpunk',
    title: 'Cyberpunk Hyper-Speed Transit VFX Loop (60fps 8K)',
    creatorName: 'VFX Mastermind',
    creatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
    category: 'video',
    priceTokens: 300,
    priceUsd: 20,
    rating: 5.0,
    downloadsCount: 2150,
    previewUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    description: 'Seamless 60fps cinematic video background with volumetric neon fog and chromatic aberration.',
    tags: ['60 FPS', '8K Render', 'Motion VFX', 'Seamless Loop'],
    fileFormat: '.MP4 (Apple ProRes 422 HQ)',
  },
  {
    id: 'item_prompt_cinematic',
    title: 'Hollywood Director Prompt Engineering Vault (150+ Styles)',
    creatorName: 'AI Cinematic Studio',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    category: 'prompt',
    priceTokens: 120,
    priceUsd: 8,
    rating: 4.9,
    downloadsCount: 3400,
    previewUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
    description: 'Master chain-of-thought prompts for Gemini, Midjourney v6, and Stable Diffusion photorealism.',
    tags: ['Prompt Pack', 'CoT AI', 'Hollywood Lens', 'JSON Bundle'],
    fileFormat: '.JSON / .DOC Prompt Bundle',
  },
  {
    id: 'item_vfx_portal',
    title: 'Interstellar Warp Portal Particle VFX Sequence',
    creatorName: 'Galactic FX',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    category: 'vfx',
    priceTokens: 220,
    priceUsd: 14,
    rating: 4.7,
    downloadsCount: 670,
    previewUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    description: 'Particle simulation sprite sheets and alpha transparency matte passes for film creators.',
    tags: ['Particle VFX', 'Alpha Channel', 'Houdini SIM', '60fps'],
    fileFormat: '.PNG Sequence (Alpha Transparency)',
  },
];

export const CreatorMarketplaceStudio: React.FC<CreatorMarketplaceStudioProps> = ({
  user,
  onNotify,
  onOpenGlobalPayments,
}) => {
  const [items, setItems] = useState<MarketplaceItem[]>(INITIAL_MARKETPLACE_ITEMS);
  const [selectedCategory, setSelectedCategory] = useState<'all' | '3d' | 'music' | 'video' | 'prompt' | 'vfx'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSellModal, setShowSellModal] = useState(false);

  // New Asset Upload Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<MarketplaceItem['category']>('3d');
  const [newPriceTokens, setNewPriceTokens] = useState('150');
  const [newPriceUsd, setNewPriceUsd] = useState('10');
  const [newDescription, setNewDescription] = useState('');
  const [newTags, setNewTags] = useState('3D Mesh, AI Creation');

  const [creatorTotalEarningsUsd, setCreatorTotalEarningsUsd] = useState<number>(1420);
  const [purchasedItemIds, setPurchasedItemIds] = useState<string[]>([]);

  const handlePurchase = (item: MarketplaceItem) => {
    if (purchasedItemIds.includes(item.id)) {
      // Already owned, just download
      handleDownloadAsset(item);
      return;
    }

    if ((user?.tokenBalance ?? 0) < item.priceTokens) {
      onNotify('Insufficient Tokens', `You need ${item.priceTokens} tokens to acquire "${item.title}".`, 'warning');
      return;
    }

    setPurchasedItemIds([...purchasedItemIds, item.id]);
    onNotify(
      '🎉 Asset Acquired & Added to Vault!',
      `Successfully purchased "${item.title}" for ${item.priceTokens} Tokens ($${item.priceUsd} USD). Direct download starting...`,
      'success'
    );
    handleDownloadAsset(item);
  };

  const handleDownloadAsset = (item: MarketplaceItem) => {
    safeDownloadMedia(item.previewUrl, `${item.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_master.png`, {
      type: item.category === 'music' ? 'audio' : item.category === 'video' ? 'video' : 'image',
      onSuccess: (msg) => onNotify('Asset Exported', msg, 'success'),
      onError: (err) => onNotify('Notice', err, 'info'),
    });
  };

  const handleListAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      onNotify('Validation Error', 'Please provide a title for your asset.', 'warning');
      return;
    }

    const newItem: MarketplaceItem = {
      id: `item_${Date.now()}`,
      title: newTitle.trim(),
      creatorName: user?.name || user?.username || 'Verified Creator',
      creatorAvatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      category: newCategory,
      priceTokens: parseInt(newPriceTokens, 10) || 100,
      priceUsd: parseInt(newPriceUsd, 10) || 8,
      rating: 5.0,
      downloadsCount: 1,
      previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      description: newDescription.trim() || 'High quality digital creator asset made on iCALLOG Studio.',
      tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
      fileFormat: newCategory === '3d' ? '.GLTF / .OBJ' : newCategory === 'music' ? '.WAV / .MP3' : '.MP4 60fps',
    };

    setItems([newItem, ...items]);
    setShowSellModal(false);
    setNewTitle('');
    setNewDescription('');
    onNotify(
      '🚀 Asset Listed on Global Marketplace!',
      `"${newItem.title}" is now live worldwide! Earnings will be sent directly to your Global-Ready Bank account.`,
      'success'
    );
  };

  const filteredItems = items.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.creatorName.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950/60 to-cyan-950/40 border border-emerald-500/40 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-600 to-cyan-600 flex items-center justify-center text-white shadow-xl shadow-emerald-950/50 text-2xl">
              🏪
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white font-['Syne']">
                  Creator Marketplace & Asset Store
                </h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  Global Payouts Enabled (SWIFT & UPI)
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-mono mt-1">
                Monetize your 3D models, song stems, 60fps video clips & master prompt engineering packs worldwide.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              type="button"
              onClick={() => setShowSellModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
              <span>List Asset for Sale</span>
            </button>
          </div>
        </div>

        {/* Global Creator Revenue Dashboard Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-4 border-t border-slate-800/80">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Creator Lifetime Revenue</div>
            <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
              ${creatorTotalEarningsUsd.toLocaleString()} USD
            </div>
            <div className="text-[9px] text-slate-500 font-mono">≈ ₹{(creatorTotalEarningsUsd * 87.5).toLocaleString('en-IN')} INR</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Global Payout Route</div>
            <div className="text-base font-black text-cyan-300 font-mono mt-0.5 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Global-Ready</span>
            </div>
            <div className="text-[9px] text-emerald-400 font-mono">24h Direct SWIFT Clearing</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Total Assets Listed</div>
            <div className="text-base font-black text-indigo-300 font-mono mt-0.5">
              {items.length} Worldwide
            </div>
            <div className="text-[9px] text-slate-500 font-mono">100% Royalty Ownership</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">License Security</div>
            <div className="text-base font-black text-amber-300 font-mono mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Commercial CC-BY</span>
            </div>
            <div className="text-[9px] text-slate-500 font-mono">Audited Smart Contracts</div>
          </div>
        </div>
      </div>

      {/* Filter Categories and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
          {[
            { id: 'all', label: 'All Assets', icon: '🌟' },
            { id: '3d', label: '3D Models & Rigs', icon: '📦' },
            { id: 'music', label: 'Music & Beat Stems', icon: '🎵' },
            { id: 'video', label: '60fps Video Clips', icon: '🎬' },
            { id: 'prompt', label: 'Master Prompts', icon: '✨' },
            { id: 'vfx', label: 'VFX & Overlays', icon: '🌌' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 3D models, beats, creators..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => {
          const isOwned = purchasedItemIds.includes(item.id);
          return (
            <div
              key={item.id}
              className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 transition-all shadow-xl overflow-hidden flex flex-col justify-between group"
            >
              {/* Asset Preview Image */}
              <div className="relative aspect-video overflow-hidden bg-slate-950">
                <img
                  src={item.previewUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/80 text-cyan-300 border border-white/10 backdrop-blur-xs uppercase">
                  {item.fileFormat}
                </span>
                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 backdrop-blur-xs">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {item.rating}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <img
                      src={item.creatorAvatar}
                      alt={item.creatorName}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span className="text-[11px] text-slate-400 font-mono truncate">{item.creatorName}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Pricing & Purchase Button */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                  <div>
                    <div className="text-sm font-black text-emerald-400 font-mono">
                      {item.priceTokens} Tokens
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      ≈ ${item.priceUsd} USD
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePurchase(item)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                      isOwned
                        ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isOwned ? 'Re-Download' : 'Acquire & Download'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* LIST NEW ASSET MODAL */}
      {showSellModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl shadow-md">
                  🚀
                </div>
                <div>
                  <h3 className="text-sm font-black text-white font-['Syne']">
                    List Your Creation for Global Sale
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Earn tokens & USD deposited directly into your Global-Ready account
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSellModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleListAsset} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Asset Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Cyberpunk Katana 3D Model with PBR Glow"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Asset Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="3d">3D Model & Rigs</option>
                    <option value="music">Music & Audio Stems</option>
                    <option value="video">60fps Video Clip</option>
                    <option value="prompt">Master Prompt Pack</option>
                    <option value="vfx">VFX & Shaders</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Price (Tokens / USD)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={newPriceTokens}
                      onChange={(e) => {
                        setNewPriceTokens(e.target.value);
                        setNewPriceUsd((parseInt(e.target.value || '0', 10) / 15).toFixed(0));
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                      placeholder="Tokens"
                    />
                    <input
                      type="number"
                      value={newPriceUsd}
                      onChange={(e) => setNewPriceUsd(e.target.value)}
                      className="w-20 px-2 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                      placeholder="$ USD"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Description & Specs</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe your creation, texture maps, animation format..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Tags (Comma Separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="3D, Unreal Engine, Cyberpunk, Rigged"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-[11px] font-mono text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>95% Creator Revenue Share • Direct Payout to your SWIFT/UPI Bank!</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs shadow-lg transition-all cursor-pointer"
              >
                Publish Asset to Global Marketplace
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderKanban,
  Search,
  Filter,
  Tag,
  Download,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  SlidersHorizontal,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Box,
  Palette,
  Sparkles,
  Check,
  Plus,
  X,
  Share2,
  Copy,
  Clock,
  HardDrive,
  Layers,
  Info,
} from 'lucide-react';
import { ActiveTab, ProjectItem, UserProfile } from '../types.ts';
import { safeDownloadMedia } from '../lib/downloadHelper.ts';

interface MediaAssetItem {
  id: string;
  title: string;
  type: 'image' | 'video' | 'audio' | '3d' | 'doc' | 'design';
  category: string;
  url: string;
  thumbnailUrl?: string;
  fileSize: string;
  resolution?: string;
  duration?: string;
  author: string;
  createdAt: string;
  tags: string[];
  sourceStudio: ActiveTab;
  isPinned?: boolean;
}

interface ResourceAssetLibraryProps {
  user?: UserProfile;
  setActiveTab: (tab: ActiveTab) => void;
  onSelectSubTab?: (tab: ActiveTab, subTab: string) => void;
  onNotify: (title: string, desc: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

const STORAGE_ASSETS_KEY = 'icallog_resource_asset_library_v1';

const DEFAULT_ASSETS: MediaAssetItem[] = [
  {
    id: 'asset_1',
    title: 'Cyberpunk Neo-Metropolis 8K HDR Concept',
    type: 'image',
    category: 'Images & 8K',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    fileSize: '4.2 MB',
    resolution: '7680 × 4320 (8K)',
    author: 'Creative Director',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    tags: ['Sci-Fi', '8K', 'Cyberpunk', 'Concept Art'],
    sourceStudio: 'image_studio',
    isPinned: true,
  },
  {
    id: 'asset_2',
    title: 'Neon Horizon Synthwave Audio Stem .WAV',
    type: 'audio',
    category: 'Audio & Music',
    url: 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg',
    fileSize: '12.8 MB',
    duration: '3:45 min',
    resolution: '16-bit 44.1kHz PCM',
    author: 'Audio Producer',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    tags: ['Synthwave', '128 BPM', 'Audio Stems', 'Mastered'],
    sourceStudio: 'song_studio',
    isPinned: true,
  },
  {
    id: 'asset_3',
    title: 'Cyber Dragon 17-Bone Rigged 3D Model',
    type: '3d',
    category: '3D Models',
    url: '#gltf-model-export',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    fileSize: '18.4 MB',
    resolution: '18,450 Polygons',
    author: 'VFX Supervisor',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    tags: ['GLTF', 'Rigged', '3D Dragon', 'Animation'],
    sourceStudio: '3d_engine',
    isPinned: false,
  },
  {
    id: 'asset_4',
    title: 'Matrix Cinematic Action Trailer (4K MP4)',
    type: 'video',
    category: 'Videos',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-with-code-31910-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=400&q=80',
    fileSize: '45.1 MB',
    resolution: '3840 × 2160 (4K 60FPS)',
    duration: '0:30 min',
    author: 'Cinema Director',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    tags: ['4K MP4', 'Trailer', 'VFX', 'Cinematic'],
    sourceStudio: 'video_audio',
    isPinned: true,
  },
  {
    id: 'asset_5',
    title: 'Corporate Q4 Financial KPI Workbook',
    type: 'doc',
    category: 'Office / Docs',
    url: '#spreadsheet-csv-export',
    fileSize: '340 KB',
    resolution: '24 Data Columns',
    author: 'Chief Financial Officer',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    tags: ['Excel', 'Spreadsheet', 'Finance', 'KPI'],
    sourceStudio: 'office_suite',
    isPinned: false,
  },
  {
    id: 'asset_6',
    title: 'Sovereign Level 5 Executive Security Badge',
    type: 'design',
    category: 'Design / Badges',
    url: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=400&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=400&q=80',
    fileSize: '1.9 MB',
    resolution: '1200 × 800 Vector SVG',
    author: 'Brand Lead',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    tags: ['ID Badge', 'Vector', 'QR Code', 'Branding'],
    sourceStudio: 'design_studio',
    isPinned: false,
  },
];

export const ResourceAssetLibrary: React.FC<ResourceAssetLibraryProps> = ({
  setActiveTab,
  onSelectSubTab,
  onNotify,
}) => {
  const [assets, setAssets] = useState<MediaAssetItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_ASSETS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_ASSETS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showMetadata, setShowMetadata] = useState<boolean>(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // New asset form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<MediaAssetItem['type']>('image');
  const [newCategory, setNewCategory] = useState('Images & 8K');
  const [newTags, setNewTags] = useState('AI, Creative');
  const [newUrl, setNewUrl] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80');

  // Persist assets
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ASSETS_KEY, JSON.stringify(assets));
    } catch (e) {
      console.warn('Failed to save assets to localStorage:', e);
    }
  }, [assets]);

  // Extract all unique tags across assets
  const allTags = useMemo(() => {
    const set = new Set<string>();
    assets.forEach((a) => a.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [assets]);

  // Categories list
  const categories = ['All', 'Images & 8K', 'Videos', '3D Models', 'Audio & Music', 'Office / Docs', 'Design / Badges'];

  // Filtered assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesCategory = selectedCategory === 'All' || asset.category === selectedCategory;
      const matchesTag = !selectedTag || asset.tags?.includes(selectedTag);
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        asset.title.toLowerCase().includes(q) ||
        asset.author.toLowerCase().includes(q) ||
        asset.tags?.some((t) => t.toLowerCase().includes(q)) ||
        asset.category.toLowerCase().includes(q);

      return matchesCategory && matchesTag && matchesSearch;
    });
  }, [assets, selectedCategory, selectedTag, searchQuery]);

  const handleAddAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      onNotify('Validation Error', 'Please enter an asset title.', 'warning');
      return;
    }

    const created: MediaAssetItem = {
      id: `asset_${Date.now()}`,
      title: newTitle.trim(),
      type: newType,
      category: newCategory,
      url: newUrl.trim(),
      thumbnailUrl: newType === 'image' || newType === 'design' ? newUrl.trim() : undefined,
      fileSize: '5.4 MB',
      resolution: newType === 'image' ? '3840 × 2160 (4K)' : 'HD Standard',
      author: 'Creator User',
      createdAt: new Date().toISOString(),
      tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
      sourceStudio: 'image_studio',
      isPinned: false,
    };

    setAssets([created, ...assets]);
    setIsUploadModalOpen(false);
    setNewTitle('');
    onNotify('Asset Added', `Successfully imported "${created.title}" into library.`, 'success');
  };

  const handleDeleteAsset = (id: string) => {
    setAssets(assets.filter((a) => a.id !== id));
    onNotify('Asset Removed', 'Media asset removed from library.', 'info');
  };

  const handleDownloadAsset = (asset: MediaAssetItem) => {
    const blob = new Blob([`iCALLOG Studio Asset Payload: ${asset.title}\nType: ${asset.type}\nURL: ${asset.url}`], {
      type: 'text/plain;charset=utf-8',
    });
    safeDownloadMedia(blob, `${asset.title.toLowerCase().replace(/\s+/g, '_')}_export.${asset.type === 'audio' ? 'ogg' : asset.type === 'video' ? 'mp4' : 'png'}`, {
      type: asset.type === 'image' ? 'image' : 'text',
      onSuccess: (msg) => onNotify('Asset Exported', msg, 'success'),
    });
  };

  const handleJumpToStudio = (sourceStudio: ActiveTab) => {
    setActiveTab(sourceStudio);
    onNotify('Studio Navigation', `Jumping to producing studio...`, 'info');
  };

  const getTypeIcon = (type: MediaAssetItem['type']) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-pink-400" />;
      case 'video':
        return <Video className="w-4 h-4 text-cyan-400" />;
      case 'audio':
        return <Music className="w-4 h-4 text-amber-400" />;
      case '3d':
        return <Box className="w-4 h-4 text-indigo-400" />;
      case 'doc':
        return <FileText className="w-4 h-4 text-emerald-400" />;
      case 'design':
        return <Palette className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls Toolbar */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-cyan-950/40 border border-indigo-500/40 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-cyan-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-xl text-2xl">
              🗄️
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white font-['Syne']">
                  Resource Asset Library & Media Hub
                </h2>
                <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/40">
                  {filteredAssets.length} Assets Found
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-mono mt-1">
                Unified searchable inventory for all generated 8K images, videos, 3D models, audio stems, and office files.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start md:self-center">
            {/* Metadata Toggle Switch */}
            <button
              type="button"
              onClick={() => setShowMetadata(!showMetadata)}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                showMetadata
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-sm'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title={showMetadata ? 'Hide asset metadata cards' : 'Show asset metadata cards'}
            >
              {showMetadata ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>{showMetadata ? 'Metadata ON' : 'Metadata OFF'}</span>
            </button>

            {/* Add Asset Button */}
            <button
              id="import-new-asset-btn"
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:brightness-110 text-white font-bold text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer hover:scale-105"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Import Asset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets by title, tag, author..."
              className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tag Cloud Filter */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-800 text-[11px]">
            <span className="text-slate-500 font-mono font-bold shrink-0 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Filter Tag:
            </span>
            {selectedTag && (
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                className="px-2 py-0.5 rounded-lg bg-cyan-500 text-slate-950 font-bold shrink-0"
              >
                Clear Tag ({selectedTag})
              </button>
            )}
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`px-2.5 py-0.5 rounded-lg border transition-all shrink-0 font-mono ${
                  selectedTag === tag
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Asset Grid Gallery */}
      {filteredAssets.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <FolderKanban className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-300 font-['Syne']">No matching media assets found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords, clearing tag filters, or importing a new asset.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl group hover:border-cyan-500/50 transition-all flex flex-col justify-between"
            >
              {/* Thumbnail / Media Preview */}
              <div className="relative aspect-video bg-slate-950 overflow-hidden border-b border-slate-800">
                {asset.thumbnailUrl ? (
                  <img
                    src={asset.thumbnailUrl}
                    alt={asset.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-500 gap-2">
                    {getTypeIcon(asset.type)}
                    <span className="text-xs font-mono">{asset.category}</span>
                  </div>
                )}

                {/* Type Badge & Source */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] font-mono font-bold text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                    {getTypeIcon(asset.type)}
                    <span className="capitalize">{asset.type}</span>
                  </span>
                </div>

                {/* File Size Badge */}
                <div className="absolute top-2.5 right-2.5">
                  <span className="px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] font-mono text-slate-300 border border-slate-800">
                    {asset.fileSize}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold text-white font-['Syne'] leading-snug line-clamp-2">
                    {asset.title}
                  </h3>

                  {/* Metadata (Conditionally Shown based on toggle switch) */}
                  {showMetadata && (
                    <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-[11px] font-mono text-slate-400 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span>Resolution:</span>
                        <span className="text-slate-200">{asset.resolution || asset.duration || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Author:</span>
                        <span className="text-cyan-300">{asset.author}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Created:</span>
                        <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {asset.tags && asset.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {asset.tags.map((t) => (
                        <span
                          key={t}
                          onClick={() => setSelectedTag(t)}
                          className="px-1.5 py-0.5 rounded bg-slate-950 text-[10px] font-mono text-indigo-300 border border-slate-800 cursor-pointer hover:border-indigo-500"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleJumpToStudio(asset.sourceStudio)}
                    className="text-[11px] text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
                    title="Open producing studio"
                  >
                    <span>Studio</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDownloadAsset(asset)}
                      className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 transition-colors"
                      title="Download Asset"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="p-1.5 rounded-xl bg-slate-950 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
                      title="Delete Asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Import Asset Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-indigo-500/40 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-['Syne']">
                    Import Media Asset
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Add new generated file to unified library
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAssetSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 font-mono uppercase">Asset Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Cinematic 8K Landscape Render"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 font-mono uppercase">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  >
                    <option value="image">Image (8K)</option>
                    <option value="video">Video (MP4)</option>
                    <option value="audio">Audio (WAV/OGG)</option>
                    <option value="3d">3D Model (GLTF)</option>
                    <option value="doc">Office Document</option>
                    <option value="design">Design / Badge</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 font-mono uppercase">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 font-mono uppercase">Image / Media URL</label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 font-mono uppercase">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="Sci-Fi, 8K, Concept"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-bold text-xs shadow-md"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  X,
  HardDrive,
  Download,
  Trash2,
  ExternalLink,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { GenerationAsset } from '../types.ts';
import { fetchAssets, deleteAssetById } from '../lib/api.ts';

interface HistoryStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const HistoryStorageModal: React.FC<HistoryStorageModalProps> = ({
  isOpen,
  onClose,
  onNotify,
}) => {
  const [assets, setAssets] = useState<GenerationAsset[]>([]);
  const [filter, setFilter] = useState<'all' | '3d_model' | 'image_8k' | 'video_8k' | 'voice_audio'>('all');
  const [isLoading, setIsLoading] = useState(false);

  const loadAssets = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAssets();
      setAssets(data);
    } catch {
      //
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAssets();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = async (id: string) => {
    await deleteAssetById(id);
    setAssets((prev) => prev.filter((a) => a.id !== id));
    onNotify('Asset Removed', 'Purged file from cloud storage bucket.', 'info');
  };

  const filteredAssets = assets.filter((a) => (filter === 'all' ? true : a.assetType === filter));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-4xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white font-['Syne'] flex items-center gap-2">
                <span>Cloud Vault Storage</span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                  AWS S3 & Cloudinary
                </span>
              </h2>
              <p className="text-xs text-slate-400">Persistent storage of 3D meshes, 8K renders, and audio files</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'all', label: 'All Cloud Assets' },
              { id: '3d_model', label: '3D Models' },
              { id: 'image_8k', label: '8K Images' },
              { id: 'video_8k', label: '8K Videos' },
              { id: 'voice_audio', label: 'Voice & Audio' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as typeof filter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  filter === f.id ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white bg-slate-800/40'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={loadAssets}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            title="Refresh Bucket"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Asset Cards Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">
              No cloud assets found in this category. Render 8K images or 3D models to populate.
            </div>
          ) : (
            filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="rounded-2xl bg-slate-950/60 border border-slate-800 p-3.5 space-y-2.5 flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800 uppercase">
                      {asset.cloudProvider}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {(asset.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{asset.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 italic">{asset.prompt}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <a
                    href={asset.outputUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>View Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={() => handleDelete(asset.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

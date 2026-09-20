import React, { useState } from 'react';
import {
  Flame,
  ShieldCheck,
  Crown,
  Lock,
  Sparkles,
  Zap,
  Check,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Layers,
  Film,
  Image as ImageIcon,
  Video,
  Box,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { UserProfile } from '../types.ts';
import {
  EXPLICIT_GENRES,
  ExplicitGenre,
  StudioTarget,
  isUserExplicitFree,
  canAccessExplicit,
  applyExplicitEnhancement,
  getGenreModifier,
} from '../lib/explicitEngine.ts';

interface ExplicitStudioToolbarProps {
  user: UserProfile;
  currentStudio: StudioTarget;
  activeGenreId?: string;
  onSelectGenre: (genre: ExplicitGenre) => void;
  onApplyPromptModifier?: (enhancedPrompt: string) => void;
  currentPrompt?: string;
  onOpenVipModal?: () => void;
  onNotify?: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const ExplicitStudioToolbar: React.FC<ExplicitStudioToolbarProps> = ({
  user,
  currentStudio,
  activeGenreId = 'cinematic_hyperrealism',
  onSelectGenre,
  onApplyPromptModifier,
  currentPrompt = '',
  onOpenVipModal,
  onNotify,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'general' | 'non_general' | 'all_over_world' | 'indian_bollywood'>('all');
  const [isExplicitModeActive, setIsExplicitModeActive] = useState(true);

  const isFreeCreator = isUserExplicitFree(user);
  const hasAccess = canAccessExplicit(user);

  const studioLabelMap: Record<StudioTarget, { name: string; icon: React.ReactNode }> = {
    image: { name: 'Image Studio', icon: <ImageIcon className="w-3.5 h-3.5 text-pink-400" /> },
    film: { name: 'Film Studio', icon: <Film className="w-3.5 h-3.5 text-amber-400" /> },
    video: { name: 'Video Studio', icon: <Video className="w-3.5 h-3.5 text-cyan-400" /> },
    image_video: { name: 'Image+Video Fusion', icon: <Layers className="w-3.5 h-3.5 text-emerald-400" /> },
    '3d': { name: '3D WebGL Engine', icon: <Box className="w-3.5 h-3.5 text-purple-400" /> },
  };

  const filteredGenres = EXPLICIT_GENRES.filter((g) => {
    const matchesStudio = g.targetStudios.includes(currentStudio);
    if (!matchesStudio) return false;
    if (categoryFilter === 'all') return true;
    return g.category === categoryFilter;
  });

  const activeGenre = EXPLICIT_GENRES.find((g) => g.id === activeGenreId) || filteredGenres[0];

  const handleApplyPreset = (presetName: string) => {
    if (!hasAccess) {
      if (onNotify) {
        onNotify('VIP Pass Required', 'Explicit / Mature genres require VIP Diamond or Master Creator Pass.', 'warning');
      }
      if (onOpenVipModal) onOpenVipModal();
      return;
    }

    const enhanced = applyExplicitEnhancement(currentPrompt || presetName, activeGenre?.id || 'cinematic_hyperrealism', currentStudio);
    if (onApplyPromptModifier) {
      onApplyPromptModifier(enhanced);
    }
    if (onNotify) {
      onNotify(
        'Preset Applied',
        `Applied "${presetName}" (${activeGenre.name}) to your ${studioLabelMap[currentStudio].name} prompt!`,
        'success'
      );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/90 shadow-xl overflow-hidden mb-4 transition-all">
      {/* Header Bar */}
      <div className="p-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-rose-900/40">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-white font-['Syne']">
                Explicit & Unrestricted Director Mode (ऑल-जोनर स्टूडियो)
              </span>

              {/* Creator Free Pass vs Regular VIP Status */}
              {isFreeCreator ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>Master Creator: FREE 100% Unlimited Access</span>
                </span>
              ) : hasAccess ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>VIP Unlocked</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-mono flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>VIP / Creator Mode</span>
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>Target:</span>
              <span className="flex items-center gap-1 text-cyan-300 font-semibold">
                {studioLabelMap[currentStudio].icon} {studioLabelMap[currentStudio].name}
              </span>
              <span>•</span>
              <span className="text-slate-300">
                Active: {activeGenre?.emoji} {activeGenre?.name}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {!hasAccess && (
            <button
              type="button"
              onClick={onOpenVipModal}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black shadow-md flex items-center gap-1"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Unlock VIP</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isExpanded ? 'Hide Genres' : 'Explore Genres & Presets'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Genres & Controls Panel */}
      {isExpanded && (
        <div className="p-4 space-y-4 bg-slate-950/60">
          {/* Category Filter Pills */}
          <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-800 pb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-slate-400 mr-1">GENRE FILTER:</span>
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  categoryFilter === 'all'
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                All Available ({filteredGenres.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('general')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  categoryFilter === 'general'
                    ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-900/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                ✨ General (Cinematic, Anime, Sci-Fi)
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('non_general')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  categoryFilter === 'non_general'
                    ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-900/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                🔞 Mature, Erotic & Dark Horror (18+)
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('all_over_world')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  categoryFilter === 'all_over_world'
                    ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-900/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                🌍 All Over World (Global & Cultural)
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('indian_bollywood')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  categoryFilter === 'indian_bollywood'
                    ? 'bg-pink-600 text-white font-bold shadow-md shadow-pink-900/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                🇮🇳 Indian & Bollywood (हिंदी/साउथ)
              </button>
            </div>

            {isFreeCreator && (
              <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Tokens Deducted for Creator Jay</span>
              </div>
            )}
          </div>

          {/* Genre Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredGenres.map((genre) => {
              const isSelected = activeGenre?.id === genre.id;
              const isLocked18Plus = genre.is18Plus && !hasAccess && !isFreeCreator;
              return (
                <div
                  key={genre.id}
                  onClick={() => {
                    if (isLocked18Plus) {
                      if (onNotify) {
                        onNotify('VIP Premium Required', 'Mature / 18+ explicit genres require VIP Diamond or Master Creator Pass.', 'warning');
                      }
                      if (onOpenVipModal) onOpenVipModal();
                      return;
                    }
                    onSelectGenre(genre);
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-900/90 border-cyan-400 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400'
                      : isLocked18Plus
                      ? 'bg-slate-950/40 border-rose-900/40 opacity-75 hover:border-rose-700/60'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg select-none">{genre.emoji}</span>
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold border ${genre.bgLight} ${genre.borderColor}`}
                          style={{ color: genre.color }}
                        >
                          {genre.badge}
                        </span>
                      </div>

                      {isLocked18Plus ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[9px] font-mono font-bold flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>VIP 18+</span>
                        </span>
                      ) : isSelected ? (
                        <span className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center text-slate-950 text-[10px] font-black">
                          ✓
                        </span>
                      ) : null}
                    </div>

                    <h5 className="text-xs font-black text-white leading-tight font-['Syne']">
                      {genre.name}
                    </h5>
                    <p className="text-[11px] text-cyan-400 font-medium mt-0.5">
                      {genre.hindiName}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                      {genre.description}
                    </p>
                  </div>

                  {/* Preset Pills for this Genre */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                    <div className="text-[9px] font-mono text-slate-500 uppercase font-bold mb-1">
                      Quick Presets:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {genre.presets.slice(0, 2).map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectGenre(genre);
                            handleApplyPreset(p);
                          }}
                          className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-cyan-600 hover:text-white text-slate-300 border border-slate-800 transition-colors"
                        >
                          + {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Modifier Preview & Apply Action */}
          {activeGenre && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Active Engine Modifier:</span>
                  <span className="text-cyan-300 font-mono">{activeGenre.name} ({activeGenre.badge})</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono truncate max-w-xl mt-0.5">
                  {getGenreModifier(activeGenre, currentStudio)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleApplyPreset(currentPrompt || activeGenre.name)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-900/30 flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-transform hover:scale-102"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Inject Genre into Prompt</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

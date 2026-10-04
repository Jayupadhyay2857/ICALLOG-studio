import React, { useState } from 'react';
import {
  Globe2,
  Sparkles,
  Download,
  Share2,
  Compass,
  Zap,
  Flame,
  Wand2,
  RefreshCw,
  Box,
  Eye,
} from 'lucide-react';
import { UserProfile, ActiveTab } from '../types.ts';
import { safeDownloadMedia } from '../lib/downloadHelper.ts';

interface ExoplanetStudioProps {
  user: UserProfile;
  setActiveTab?: (tab: ActiveTab) => void;
  onNotify: (title: string, desc: string, type?: 'info' | 'success' | 'warning' | 'error' | 'admin') => void;
}

export const ExoplanetStudio: React.FC<ExoplanetStudioProps> = ({
  user,
  setActiveTab,
  onNotify,
}) => {
  const [planetName, setPlanetName] = useState('Kepler-452b Prime');
  const [atmosphere, setAtmosphere] = useState('Bioluminescent Nitrogen-Oxygen');
  const [terrain, setTerrain] = useState('Floating Crystal Islands & Purple Oceans');
  const [starType, setStarType] = useState('Binary Red Supergiant');
  const [isSimulating, setIsSimulating] = useState(false);
  const [planetData, setPlanetData] = useState<{
    gravity: string;
    temperature: string;
    dominantLife: string;
    habitability: string;
  } | null>({
    gravity: '0.84 G',
    temperature: '22°C (Temperate Zone)',
    dominantLife: 'Silicon-based crystalline flora & floating fauna',
    habitability: '94.8% (Tier-1 Habitable)',
  });

  const handleGenerateWorld = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setPlanetData({
        gravity: (0.7 + Math.random() * 0.6).toFixed(2) + ' G',
        temperature: Math.floor(-10 + Math.random() * 60) + '°C',
        dominantLife: 'Bioluminescent spore networks & sentient hive structures',
        habitability: (80 + Math.random() * 19).toFixed(1) + '%',
      });
      onNotify('Exoplanet Generated!', `Successfully simulated celestial world: ${planetName}`, 'success');
    }, 1000);
  };

  const handleDownloadReport = () => {
    if (!planetData) return;
    const report = `# EXOPLANET RECONNAISSANCE REPORT: ${planetName}\n\n- Star System: ${starType}\n- Atmosphere: ${atmosphere}\n- Terrain: ${terrain}\n- Gravity: ${planetData.gravity}\n- Surface Temp: ${planetData.temperature}\n- Dominant Lifeform: ${planetData.dominantLife}\n- Habitability Index: ${planetData.habitability}`;
    safeDownloadMedia(report, `${planetName}_Recon_Report.md`, { type: 'text', onNotify });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-white">
      {/* Header */}
      <div className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-r from-teal-950 via-cyan-950 to-slate-950 border border-cyan-500/30 shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Globe2 className="w-64 h-64 text-cyan-400" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            Interstellar Exoplanet & Alien World Generator (ब्रह्मांडीय ग्रह जनरेटर)
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-200 to-cyan-400">
            Simulate Custom Habitable Worlds & Exoplanet Biomes
          </h1>
          <p className="text-slate-300 max-w-2xl text-sm leading-relaxed">
            Design atmospheric compositions, stellar orbits, and alien ecosystems with real-time planetary physics simulation.
          </p>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <h3 className="text-lg font-bold flex items-center gap-2 text-cyan-300">
            <Compass className="w-5 h-5" /> Planetary Parameters
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Planet Name</label>
              <input
                type="text"
                value={planetName}
                onChange={(e) => setPlanetName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Atmosphere Composition</label>
              <input
                type="text"
                value={atmosphere}
                onChange={(e) => setAtmosphere(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Terrain & Biome</label>
              <input
                type="text"
                value={terrain}
                onChange={(e) => setTerrain(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Star System Type</label>
              <select
                value={starType}
                onChange={(e) => setStarType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Binary Red Supergiant">Binary Red Supergiant</option>
                <option value="Yellow Main Sequence (G-Type)">Yellow Main Sequence (G-Type)</option>
                <option value="Trinary Neutron Star Cluster">Trinary Neutron Star Cluster</option>
                <option value="Ancient White Dwarf">Ancient White Dwarf</option>
              </select>
            </div>

            <button
              onClick={handleGenerateWorld}
              disabled={isSimulating}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600 hover:opacity-90 font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Simulating Orbital Physics...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" /> Simulate Exoplanet World
                </>
              )}
            </button>
          </div>
        </div>

        {/* Planet Visual & Recon */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-8 rounded-3xl bg-slate-900/90 border border-cyan-500/30 space-y-6 shadow-2xl relative overflow-hidden text-center">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/20 to-transparent pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="w-40 h-40 mx-auto rounded-full bg-gradient-to-br from-cyan-400 via-teal-600 to-indigo-900 shadow-[0_0_50px_rgba(6,182,212,0.4)] flex items-center justify-center animate-pulse border-4 border-cyan-300/30">
                <Globe2 className="w-20 h-20 text-white/90 animate-spin" style={{ animationDuration: '25s' }} />
              </div>

              <div>
                <h2 className="text-2xl font-black text-white">{planetName}</h2>
                <p className="text-xs text-cyan-300 font-medium">Stellar Orbit: {starType}</p>
              </div>

              {planetData && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800 text-left">
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Surface Gravity</span>
                    <span className="text-sm font-bold text-cyan-300">{planetData.gravity}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Temperature</span>
                    <span className="text-sm font-bold text-teal-300">{planetData.temperature}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Habitability</span>
                    <span className="text-sm font-bold text-emerald-300">{planetData.habitability}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Atmosphere</span>
                    <span className="text-xs font-bold text-indigo-300 truncate block">{atmosphere}</span>
                  </div>
                </div>
              )}

              {planetData && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Dominant Ecosystem & Biosphere</span>
                  <p className="text-xs text-slate-200">🌿 {planetData.dominantLife}</p>
                </div>
              )}

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleDownloadReport}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold flex items-center gap-2 shadow-md transition-colors"
                >
                  <Download className="w-4 h-4" /> Download Reconnaissance Report
                </button>
                {setActiveTab && (
                  <button
                    onClick={() => setActiveTab('metaverse_world')}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center gap-2 transition-colors"
                  >
                    <Box className="w-4 h-4" /> Explore 3D Metaverse World
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

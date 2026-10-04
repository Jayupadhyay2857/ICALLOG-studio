import React, { useState, useEffect, useRef } from 'react';
import {
  Globe2,
  Box,
  Compass,
  Sparkles,
  Maximize2,
  RotateCcw,
  Play,
  Volume2,
  Download,
  Share2,
  ArrowRight,
  Eye,
  Gamepad2,
  Film,
  Music,
  Hourglass,
  Layers,
  Award,
} from 'lucide-react';
import { UserProfile, ActiveTab } from '../types.ts';
import { safeDownloadMedia } from '../lib/downloadHelper.ts';

interface MetaverseWorldStudioProps {
  user: UserProfile;
  setActiveTab?: (tab: ActiveTab) => void;
  onNotify: (title: string, desc: string, type?: 'info' | 'success' | 'warning' | 'error' | 'admin') => void;
}

export const MetaverseWorldStudio: React.FC<MetaverseWorldStudioProps> = ({
  user,
  setActiveTab,
  onNotify,
}) => {
  // Player Position in Spatial 3D Room
  const [playerPos, setPlayerPos] = useState({ x: 300, y: 220, angle: 0 });
  const [activeExhibit, setActiveExhibit] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});

  // Keyboard navigation for first-person/isometric walkable world
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      keysRef.current[e.code] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
      keysRef.current[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 3D Spatial Canvas Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const loop = () => {
      time += 0.03;
      const w = canvas.width;
      const h = canvas.height;

      // Update player position
      setPlayerPos((prev) => {
        let nextX = prev.x;
        let nextY = prev.y;
        const speed = 4;

        if (keysRef.current['ArrowUp'] || keysRef.current['KeyW']) nextY -= speed;
        if (keysRef.current['ArrowDown'] || keysRef.current['KeyS']) nextY += speed;
        if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) nextX -= speed;
        if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) nextX += speed;

        nextX = Math.max(50, Math.min(w - 50, nextX));
        nextY = Math.max(50, Math.min(h - 50, nextY));

        return { ...prev, x: nextX, y: nextY };
      });

      // Clear Canvas (Isometric Cyber Metaverse Room)
      ctx.fillStyle = '#060913';
      ctx.fillRect(0, 0, w, h);

      // Perspective Grid Floor
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = 1;
      for (let x = 40; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 40);
        ctx.lineTo(x, h - 40);
        ctx.stroke();
      }
      for (let y = 40; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(w - 40, y);
        ctx.stroke();
      }

      // Exhibits / Portals
      const exhibits = [
        { id: 'film', title: 'Cinema Gallery', x: 120, y: 100, color: '#6366f1', icon: '🎬' },
        { id: 'music', title: 'Audio Soundstage', x: w - 120, y: 100, color: '#ec4899', icon: '🎵' },
        { id: 'arcade', title: 'Game Arcade', x: 120, y: h - 100, color: '#eab308', icon: '🎮' },
        { id: 'capsule', title: '200-Yr Vault', x: w - 120, y: h - 100, color: '#f59e0b', icon: '⏳' },
        { id: 'twin', title: 'Digital Twin AI', x: w / 2, y: 80, color: '#06b6d4', icon: '🧬' },
      ];

      // Draw Exhibit Holograms
      exhibits.forEach((ex) => {
        ctx.save();
        ctx.shadowColor = ex.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = `${ex.color}30`;
        ctx.beginPath();
        ctx.arc(ex.x, ex.y, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = ex.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Icon text
        ctx.font = '20px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ex.icon, ex.x, ex.y);

        // Label
        ctx.font = '11px system-ui';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(ex.title, ex.x, ex.y + 45);
        ctx.restore();

        // Check proximity
        const dist = Math.hypot(playerPos.x - ex.x, playerPos.y - ex.y);
        if (dist < 50) {
          setActiveExhibit(ex.id);
        }
      });

      // Draw Center 3D Floating Crystal
      ctx.save();
      const cx = w / 2;
      const cy = h / 2;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 25;
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 35 + Math.sin(time) * 6);
      ctx.lineTo(cx + 25, cy + Math.sin(time) * 6);
      ctx.lineTo(cx, cy + 35 + Math.sin(time) * 6);
      ctx.lineTo(cx - 25, cy + Math.sin(time) * 6);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // Draw Player Avatar (Neon Orb with directional pointer)
      ctx.save();
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(playerPos.x, playerPos.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [playerPos]);

  // Export Standalone Metaverse World HTML
  const handleExportMetaverseHtml = () => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>iCALLOG 3D Spatial Metaverse World</title>
  <style>
    body { background: #060913; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    canvas { border: 2px solid #06b6d4; border-radius: 20px; box-shadow: 0 0 30px #06b6d440; }
    h1 { color: #06b6d4; margin-top: 15px; }
  </style>
</head>
<body>
  <canvas id="world" width="600" height="400"></canvas>
  <h1>3D Spatial Metaverse World</h1>
  <p>Use WASD / Arrow Keys to walk around and explore exhibits.</p>
</body>
</html>`;

    safeDownloadMedia(html, `Metaverse_World_${Date.now()}.html`, {
      mimeType: 'text/html',
      onNotify,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. Hero Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-cyan-950/70 via-slate-950 to-indigo-950/70 border border-cyan-500/40 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
                <Globe2 className="w-3.5 h-3.5" />
                <span>3D Spatial Metaverse Exhibition Hub</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono font-bold">
                🕹️ Walkable Spatial World
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-['Syne'] tracking-tight flex items-center gap-3">
              <span>🌐</span>
              <span>3D Metaverse Virtual Exhibition World</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Step into an interactive 3D spatial metaverse room where your games, films, music albums, digital twins, and 200-year time capsules are exhibited in real-time.
            </p>
          </div>

          <button
            onClick={handleExportMetaverseHtml}
            className="px-5 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export 3D World .HTML</span>
          </button>
        </div>
      </div>

      {/* 2. Walkable Canvas + Interactive Exhibit HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-3">
          <div className="relative rounded-3xl bg-slate-950 border border-slate-800 p-2 overflow-hidden shadow-2xl flex flex-col items-center">
            {/* Top HUD */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
              <div className="px-3 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700 text-cyan-300 font-mono text-xs flex items-center gap-2">
                <Compass className="w-3.5 h-3.5" />
                <span>MOVE: WASD / ARROW KEYS</span>
              </div>
            </div>

            <canvas
              ref={canvasRef}
              width={640}
              height={420}
              className="w-full max-w-full h-auto aspect-[16/10] rounded-2xl bg-[#060913] border border-cyan-500/20"
            />
          </div>
        </div>

        {/* Exhibit Detail Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Box className="w-4 h-4 text-cyan-400" />
              <span>Spatial Exhibit Station</span>
            </h3>

            {activeExhibit === 'film' && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-indigo-300">🎬 8K Cinema Directing Suite</div>
                <p className="text-xs text-slate-400">Step closer to launch screenplay scripts and camera blocking.</p>
                <button
                  onClick={() => setActiveTab && setActiveTab('film_studio')}
                  className="w-full py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                >
                  Enter Film Studio
                </button>
              </div>
            )}

            {activeExhibit === 'music' && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-pink-300">🎵 A-Z Song & Turntable Station</div>
                <p className="text-xs text-slate-400">Step closer to compose beats and play vinyl stems.</p>
                <button
                  onClick={() => setActiveTab && setActiveTab('song_studio')}
                  className="w-full py-2 rounded-xl bg-pink-600 text-white text-xs font-bold"
                >
                  Enter Music Studio
                </button>
              </div>
            )}

            {activeExhibit === 'arcade' && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-amber-300">🎮 AI Game Maker & Arcade</div>
                <p className="text-xs text-slate-400">Play Space Shooter, Neon Runner, Brick Breaker & Snake.</p>
                <button
                  onClick={() => setActiveTab && setActiveTab('game_studio')}
                  className="w-full py-2 rounded-xl bg-amber-600 text-slate-950 font-black text-xs"
                >
                  Launch Game Arcade
                </button>
              </div>
            )}

            {activeExhibit === 'capsule' && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-amber-400">⏳ 200-Year Digital Time Capsule</div>
                <p className="text-xs text-slate-400">Preserve your thoughts and legacy for up to two centuries.</p>
                <button
                  onClick={() => setActiveTab && setActiveTab('time_capsule')}
                  className="w-full py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  Open Time Capsule Vault
                </button>
              </div>
            )}

            {(!activeExhibit || activeExhibit === 'twin') && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-cyan-300">🧬 AI Digital Twin Hologram</div>
                <p className="text-xs text-slate-400">Interact with your personal digital clone in real-time.</p>
                <button
                  onClick={() => setActiveTab && setActiveTab('digital_twin')}
                  className="w-full py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold"
                >
                  Launch Digital Twin
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

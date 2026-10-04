import React, { useState, useEffect, useRef } from 'react';
import {
  Gamepad2,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Download,
  Sliders,
  Volume2,
  VolumeX,
  Layers,
  Palette,
  Video,
  Share2,
  Trophy,
  Zap,
  Flame,
  Shield,
  Rocket,
  Heart,
  Target,
  RefreshCw,
  Code,
  Save,
  CheckCircle2,
  Award,
  Smartphone,
  Monitor,
  Maximize2,
  HelpCircle,
  FolderKanban,
  Wand2,
  Music,
  Plus,
  Compass,
} from 'lucide-react';
import { UserProfile, ActiveTab, ProjectItem } from '../types.ts';
import { safeDownloadMedia } from '../lib/downloadHelper.ts';

interface GameStudioProps {
  user: UserProfile;
  tokenBalance?: number;
  setActiveTab?: (tab: ActiveTab) => void;
  openPaymentModal?: () => void;
  onNotify: (title: string, desc: string, type?: 'info' | 'success' | 'warning' | 'error' | 'admin') => void;
}

export type GameGenre =
  | 'space_shooter'
  | 'neon_runner'
  | 'brick_breaker'
  | 'cyber_snake'
  | 'dungeon_hero'
  | 'memory_matrix';

export interface GameConfig {
  id: string;
  title: string;
  genre: GameGenre;
  theme: 'cyberpunk' | 'retro8bit' | 'synthwave' | 'matrix' | 'darkfantasy';
  playerSpeed: number;
  gravity: number;
  bulletSpeed: number;
  enemySpawnRate: number;
  maxLives: number;
  difficulty: 'casual' | 'arcade' | 'nightmare' | 'godmode';
  soundEnabled: boolean;
  bgmEnabled: boolean;
  scoreMultiplier: number;
  customColor: string;
}

export const GameStudio: React.FC<GameStudioProps> = ({
  user,
  tokenBalance = 50,
  setActiveTab,
  openPaymentModal,
  onNotify,
}) => {
  // Game Configuration State
  const [activeGenre, setActiveGenre] = useState<GameGenre>('space_shooter');
  const [config, setConfig] = useState<GameConfig>({
    id: 'game_proj_' + Date.now(),
    title: 'Cyber Space Shooter 2099',
    genre: 'space_shooter',
    theme: 'cyberpunk',
    playerSpeed: 7,
    gravity: 0.6,
    bulletSpeed: 12,
    enemySpawnRate: 1.2,
    maxLives: 3,
    difficulty: 'arcade',
    soundEnabled: true,
    bgmEnabled: false,
    scoreMultiplier: 1,
    customColor: '#06b6d4',
  });

  // Active Sub Tab: 'arcade' | 'editor' | 'sprites' | 'audio' | 'export'
  const [subTab, setSubTab] = useState<'arcade' | 'editor' | 'sprites' | 'audio' | 'export'>('arcade');

  // Gameplay Run State
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('icallog_game_high_score') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  // AI Prompt Copilot
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingGame, setIsGeneratingGame] = useState(false);

  // Pixel Sprite Editor State
  const [spriteGrid, setSpriteGrid] = useState<string[][]>(() =>
    Array(16)
      .fill(null)
      .map(() => Array(16).fill('#00000000'))
  );
  const [selectedColor, setSelectedColor] = useState('#06b6d4');
  const [brushMode, setBrushMode] = useState<'draw' | 'erase'>('draw');

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Web Audio Synth Helper
  const playSound = (type: 'laser' | 'jump' | 'coin' | 'explosion' | 'powerup' | 'gameover') => {
    if (!config.soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'laser') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'jump') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.18);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'coin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'explosion') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.3);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'powerup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.setValueAtTime(440, now + 0.08);
        osc.frequency.setValueAtTime(554.37, now + 0.16);
        osc.frequency.setValueAtTime(659.25, now + 0.24);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(180, now + 0.2);
        osc.frequency.linearRampToValueAtTime(100, now + 0.5);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      }
    } catch {
      // Audio synth fallback
    }
  };

  // Game Engine Internal Variables
  const keysRef = useRef<Record<string, boolean>>({});
  const gameVariables = useRef({
    player: { x: 300, y: 350, vx: 0, vy: 0, w: 32, h: 32, isGrounded: false, color: '#06b6d4' },
    bullets: [] as { x: number; y: number; vx: number; vy: number; radius: number; color: string }[],
    enemies: [] as { x: number; y: number; vx: number; vy: number; w: number; h: number; hp: number; color: string; type: string }[],
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number }[],
    coins: [] as { x: number; y: number; w: number; h: number; collected: boolean }[],
    obstacles: [] as { x: number; y: number; w: number; h: number; color: string }[],
    bricks: [] as { x: number; y: number; w: number; h: number; hp: number; color: string }[],
    ball: { x: 300, y: 300, vx: 4, vy: -4, radius: 8, active: true },
    snake: {
      body: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }],
      dir: { x: 1, y: 0 },
      food: { x: 15, y: 15 },
      timer: 0,
      gridSize: 20,
    },
    hero: { x: 300, y: 200, hp: 100, maxHp: 100, attackTimer: 0, slashAngle: 0, xp: 0 },
    spawnTimer: 0,
    lastFrameTime: performance.now(),
  });

  // Initialize Game on genre or config change
  const initGame = (genre: GameGenre) => {
    setScore(0);
    setLives(config.maxLives);
    setLevel(1);
    const gv = gameVariables.current;
    gv.bullets = [];
    gv.enemies = [];
    gv.particles = [];
    gv.coins = [];
    gv.obstacles = [];
    gv.bricks = [];

    if (genre === 'space_shooter') {
      gv.player = { x: 320, y: 400, vx: 0, vy: 0, w: 36, h: 36, isGrounded: false, color: config.customColor };
    } else if (genre === 'neon_runner') {
      gv.player = { x: 80, y: 360, vx: 0, vy: 0, w: 28, h: 42, isGrounded: true, color: config.customColor };
    } else if (genre === 'brick_breaker') {
      gv.player = { x: 280, y: 440, vx: 0, vy: 0, w: 90, h: 14, isGrounded: false, color: config.customColor };
      gv.ball = { x: 320, y: 420, vx: 4 * (Math.random() > 0.5 ? 1 : -1), vy: -5, radius: 7, active: true };
      // Build brick grid
      const brickColors = ['#f43f5e', '#fb923c', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6'];
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 8; c++) {
          gv.bricks.push({
            x: 40 + c * 72,
            y: 50 + r * 26,
            w: 64,
            h: 18,
            hp: 1,
            color: brickColors[r % brickColors.length],
          });
        }
      }
    } else if (genre === 'cyber_snake') {
      gv.snake = {
        body: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }],
        dir: { x: 1, y: 0 },
        food: { x: Math.floor(Math.random() * 28) + 2, y: Math.floor(Math.random() * 20) + 2 },
        timer: 0,
        gridSize: 20,
      };
    } else if (genre === 'dungeon_hero') {
      gv.hero = { x: 320, y: 240, hp: 100, maxHp: 100, attackTimer: 0, slashAngle: 0, xp: 0 };
    }
  };

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      keysRef.current[e.code] = true;

      // Space / Action
      if (e.code === 'Space' && gameState === 'playing') {
        e.preventDefault();
        handleActionInput();
      }

      // Arrow keys prevent scroll during play
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) && gameState === 'playing') {
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
  }, [gameState, activeGenre, config]);

  // Action Input (Shoot / Jump / Slash)
  const handleActionInput = () => {
    const gv = gameVariables.current;
    if (activeGenre === 'space_shooter') {
      // Fire Bullet
      gv.bullets.push({
        x: gv.player.x + gv.player.w / 2 - 3,
        y: gv.player.y - 10,
        vx: 0,
        vy: -config.bulletSpeed,
        radius: 4,
        color: config.customColor,
      });
      // Fire double laser if upgraded
      if (score > 1000) {
        gv.bullets.push({
          x: gv.player.x - 2,
          y: gv.player.y,
          vx: -1,
          vy: -config.bulletSpeed,
          radius: 3,
          color: '#38bdf8',
        });
        gv.bullets.push({
          x: gv.player.x + gv.player.w + 2,
          y: gv.player.y,
          vx: 1,
          vy: -config.bulletSpeed,
          radius: 3,
          color: '#38bdf8',
        });
      }
      playSound('laser');
    } else if (activeGenre === 'neon_runner') {
      // Jump
      if (gv.player.isGrounded || gv.player.vy > -2) {
        gv.player.vy = -12;
        gv.player.isGrounded = false;
        playSound('jump');
      }
    } else if (activeGenre === 'dungeon_hero') {
      // Slash Attack
      gv.hero.attackTimer = 12;
      gv.hero.slashAngle = Math.atan2(
        keysRef.current['ArrowDown'] || keysRef.current['KeyS'] ? 1 : keysRef.current['ArrowUp'] || keysRef.current['KeyW'] ? -1 : 0,
        keysRef.current['ArrowRight'] || keysRef.current['KeyD'] ? 1 : keysRef.current['ArrowLeft'] || keysRef.current['KeyA'] ? -1 : 1
      );
      playSound('laser');
    }
  };

  // Main 60 FPS Canvas Game Loop
  useEffect(() => {
    if (gameState !== 'playing') {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localScore = score;
    let localLives = lives;

    const gameLoop = () => {
      const gv = gameVariables.current;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Clear Canvas & Background
      ctx.fillStyle = config.theme === 'matrix' ? '#031208' : config.theme === 'synthwave' ? '#110524' : '#070b14';
      ctx.fillRect(0, 0, width, height);

      // Neon Grid Lines Effect
      ctx.strokeStyle =
        config.theme === 'matrix'
          ? 'rgba(34, 197, 94, 0.12)'
          : config.theme === 'synthwave'
          ? 'rgba(236, 72, 153, 0.15)'
          : 'rgba(6, 182, 212, 0.12)';
      ctx.lineWidth = 1;
      const gridStep = 40;
      for (let x = 0; x < width; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // ==========================================
      // GENRE 1: SPACE SHOOTER ENGINE
      // ==========================================
      if (activeGenre === 'space_shooter') {
        // Player Input
        if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) gv.player.x -= config.playerSpeed;
        if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) gv.player.x += config.playerSpeed;
        if (keysRef.current['ArrowUp'] || keysRef.current['KeyW']) gv.player.y -= config.playerSpeed;
        if (keysRef.current['ArrowDown'] || keysRef.current['KeyS']) gv.player.y += config.playerSpeed;

        // Boundaries
        gv.player.x = Math.max(10, Math.min(width - gv.player.w - 10, gv.player.x));
        gv.player.y = Math.max(20, Math.min(height - gv.player.h - 10, gv.player.y));

        // Draw Player Ship (Neon Jet)
        ctx.save();
        ctx.shadowColor = config.customColor;
        ctx.shadowBlur = 15;
        ctx.fillStyle = config.customColor;
        ctx.beginPath();
        ctx.moveTo(gv.player.x + gv.player.w / 2, gv.player.y);
        ctx.lineTo(gv.player.x + gv.player.w, gv.player.y + gv.player.h);
        ctx.lineTo(gv.player.x + gv.player.w / 2, gv.player.y + gv.player.h - 8);
        ctx.lineTo(gv.player.x, gv.player.y + gv.player.h);
        ctx.closePath();
        ctx.fill();

        // Thruster flame particle
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(gv.player.x + gv.player.w / 2 - 4, gv.player.y + gv.player.h - 6);
        ctx.lineTo(gv.player.x + gv.player.w / 2 + 4, gv.player.y + gv.player.h - 6);
        ctx.lineTo(gv.player.x + gv.player.w / 2, gv.player.y + gv.player.h + Math.random() * 12 + 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Update Bullets
        for (let i = gv.bullets.length - 1; i >= 0; i--) {
          const b = gv.bullets[i];
          b.x += b.vx;
          b.y += b.vy;

          ctx.save();
          ctx.shadowColor = b.color;
          ctx.shadowBlur = 10;
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          if (b.y < -10) gv.bullets.splice(i, 1);
        }

        // Spawn Enemies
        gv.spawnTimer++;
        if (gv.spawnTimer > Math.max(20, 60 / config.enemySpawnRate)) {
          gv.spawnTimer = 0;
          gv.enemies.push({
            x: Math.random() * (width - 40) + 20,
            y: -30,
            vx: (Math.random() - 0.5) * 2,
            vy: Math.random() * 2 + 2,
            w: 30,
            h: 30,
            hp: 1,
            color: Math.random() > 0.7 ? '#ec4899' : '#e11d48',
            type: Math.random() > 0.8 ? 'boss' : 'standard',
          });
        }

        // Update Enemies & Bullet Collisions
        for (let eIdx = gv.enemies.length - 1; eIdx >= 0; eIdx--) {
          const enemy = gv.enemies[eIdx];
          enemy.x += enemy.vx;
          enemy.y += enemy.vy;

          // Enemy Draw
          ctx.save();
          ctx.shadowColor = enemy.color;
          ctx.shadowBlur = 12;
          ctx.fillStyle = enemy.color;
          ctx.beginPath();
          ctx.moveTo(enemy.x + enemy.w / 2, enemy.y + enemy.h);
          ctx.lineTo(enemy.x + enemy.w, enemy.y);
          ctx.lineTo(enemy.x, enemy.y);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          // Check Bullet Hit
          for (let bIdx = gv.bullets.length - 1; bIdx >= 0; bIdx--) {
            const b = gv.bullets[bIdx];
            if (
              b.x > enemy.x &&
              b.x < enemy.x + enemy.w &&
              b.y > enemy.y &&
              b.y < enemy.y + enemy.h
            ) {
              // Enemy Hit
              gv.bullets.splice(bIdx, 1);
              enemy.hp--;
              if (enemy.hp <= 0) {
                // Spawn explosion particles
                for (let p = 0; p < 12; p++) {
                  gv.particles.push({
                    x: enemy.x + enemy.w / 2,
                    y: enemy.y + enemy.h / 2,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6,
                    life: 20,
                    maxLife: 20,
                    color: enemy.color,
                    size: Math.random() * 4 + 2,
                  });
                }
                gv.enemies.splice(eIdx, 1);
                localScore += 100 * config.scoreMultiplier;
                setScore(localScore);
                playSound('explosion');
                break;
              }
            }
          }

          // Check Player Collision
          if (
            gv.player.x < enemy.x + enemy.w &&
            gv.player.x + gv.player.w > enemy.x &&
            gv.player.y < enemy.y + enemy.h &&
            gv.player.y + gv.player.h > enemy.y
          ) {
            gv.enemies.splice(eIdx, 1);
            localLives--;
            setLives(localLives);
            playSound('gameover');
            if (localLives <= 0) {
              setGameState('gameover');
              if (localScore > highScore) {
                setHighScore(localScore);
                localStorage.setItem('icallog_game_high_score', localScore.toString());
              }
              return;
            }
          }

          if (enemy.y > height + 40) gv.enemies.splice(eIdx, 1);
        }
      }

      // ==========================================
      // GENRE 2: NEON RUNNER ENGINE
      // ==========================================
      else if (activeGenre === 'neon_runner') {
        // Runner Physics
        gv.player.vy += config.gravity;
        gv.player.y += gv.player.vy;

        const groundY = height - 70;
        if (gv.player.y >= groundY) {
          gv.player.y = groundY;
          gv.player.vy = 0;
          gv.player.isGrounded = true;
        }

        // Draw Ground Line
        ctx.save();
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, height - 70, width, 70);
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, height - 70);
        ctx.lineTo(width, height - 70);
        ctx.stroke();
        ctx.restore();

        // Draw Neon Runner Hero
        ctx.save();
        ctx.shadowColor = config.customColor;
        ctx.shadowBlur = 15;
        ctx.fillStyle = config.customColor;
        ctx.fillRect(gv.player.x, gv.player.y, gv.player.w, gv.player.h);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(gv.player.x + 14, gv.player.y + 8, 8, 6);
        ctx.restore();

        // Spawn Obstacles & Coins
        gv.spawnTimer++;
        if (gv.spawnTimer > 80 / config.enemySpawnRate) {
          gv.spawnTimer = 0;
          gv.obstacles.push({
            x: width + 20,
            y: height - 110,
            w: 24,
            h: 40,
            color: '#f43f5e',
          });
          if (Math.random() > 0.4) {
            gv.coins.push({
              x: width + 70,
              y: height - 140,
              w: 16,
              h: 16,
              collected: false,
            });
          }
        }

        // Update Obstacles
        for (let i = gv.obstacles.length - 1; i >= 0; i--) {
          const obs = gv.obstacles[i];
          obs.x -= config.playerSpeed + 1;

          ctx.save();
          ctx.shadowColor = obs.color;
          ctx.shadowBlur = 12;
          ctx.fillStyle = obs.color;
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
          ctx.restore();

          // Check Collision
          if (
            gv.player.x < obs.x + obs.w &&
            gv.player.x + gv.player.w > obs.x &&
            gv.player.y < obs.y + obs.h &&
            gv.player.y + gv.player.h > obs.y
          ) {
            gv.obstacles.splice(i, 1);
            localLives--;
            setLives(localLives);
            playSound('gameover');
            if (localLives <= 0) {
              setGameState('gameover');
              return;
            }
          }

          if (obs.x < -40) {
            gv.obstacles.splice(i, 1);
            localScore += 50 * config.scoreMultiplier;
            setScore(localScore);
          }
        }

        // Update Coins
        for (let i = gv.coins.length - 1; i >= 0; i--) {
          const c = gv.coins[i];
          c.x -= config.playerSpeed + 1;

          ctx.save();
          ctx.shadowColor = '#eab308';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(c.x + 8, c.y + 8, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          if (
            gv.player.x < c.x + c.w &&
            gv.player.x + gv.player.w > c.x &&
            gv.player.y < c.y + c.h &&
            gv.player.y + gv.player.h > c.y
          ) {
            gv.coins.splice(i, 1);
            localScore += 100 * config.scoreMultiplier;
            setScore(localScore);
            playSound('coin');
          }

          if (c.x < -30) gv.coins.splice(i, 1);
        }
      }

      // ==========================================
      // GENRE 3: BRICK BREAKER ENGINE
      // ==========================================
      else if (activeGenre === 'brick_breaker') {
        // Paddle movement
        if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) gv.player.x -= config.playerSpeed * 1.3;
        if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) gv.player.x += config.playerSpeed * 1.3;
        gv.player.x = Math.max(10, Math.min(width - gv.player.w - 10, gv.player.x));

        // Draw Paddle
        ctx.save();
        ctx.shadowColor = config.customColor;
        ctx.shadowBlur = 15;
        ctx.fillStyle = config.customColor;
        ctx.fillRect(gv.player.x, gv.player.y, gv.player.w, gv.player.h);
        ctx.restore();

        // Ball Physics
        const ball = gv.ball;
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Wall collisions
        if (ball.x - ball.radius < 0 || ball.x + ball.radius > width) {
          ball.vx *= -1;
          playSound('laser');
        }
        if (ball.y - ball.radius < 0) {
          ball.vy *= -1;
          playSound('laser');
        }

        // Paddle collision
        if (
          ball.y + ball.radius >= gv.player.y &&
          ball.y - ball.radius <= gv.player.y + gv.player.h &&
          ball.x >= gv.player.x &&
          ball.x <= gv.player.x + gv.player.w
        ) {
          ball.vy = -Math.abs(ball.vy);
          const hitOffset = (ball.x - (gv.player.x + gv.player.w / 2)) / (gv.player.w / 2);
          ball.vx = hitOffset * 6;
          playSound('jump');
        }

        // Ball Out
        if (ball.y > height + 20) {
          localLives--;
          setLives(localLives);
          playSound('gameover');
          if (localLives <= 0) {
            setGameState('gameover');
            return;
          } else {
            ball.x = gv.player.x + gv.player.w / 2;
            ball.y = gv.player.y - 15;
            ball.vy = -5;
          }
        }

        // Draw Ball
        ctx.save();
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw Bricks & Collisions
        for (let i = gv.bricks.length - 1; i >= 0; i--) {
          const b = gv.bricks[i];
          ctx.save();
          ctx.shadowColor = b.color;
          ctx.shadowBlur = 8;
          ctx.fillStyle = b.color;
          ctx.fillRect(b.x, b.y, b.w, b.h);
          ctx.restore();

          if (
            ball.x + ball.radius > b.x &&
            ball.x - ball.radius < b.x + b.w &&
            ball.y + ball.radius > b.y &&
            ball.y - ball.radius < b.y + b.h
          ) {
            ball.vy *= -1;
            gv.bricks.splice(i, 1);
            localScore += 50 * config.scoreMultiplier;
            setScore(localScore);
            playSound('coin');
            if (gv.bricks.length === 0) {
              // Level Clear!
              playSound('powerup');
              initGame('brick_breaker');
            }
          }
        }
      }

      // ==========================================
      // GENRE 4: CYBER SNAKE ENGINE
      // ==========================================
      else if (activeGenre === 'cyber_snake') {
        const s = gv.snake;
        if (keysRef.current['ArrowUp'] && s.dir.y === 0) s.dir = { x: 0, y: -1 };
        if (keysRef.current['ArrowDown'] && s.dir.y === 0) s.dir = { x: 0, y: 1 };
        if (keysRef.current['ArrowLeft'] && s.dir.x === 0) s.dir = { x: -1, y: 0 };
        if (keysRef.current['ArrowRight'] && s.dir.x === 0) s.dir = { x: 1, y: 0 };

        s.timer++;
        if (s.timer > 6) {
          s.timer = 0;
          const head = { x: s.body[0].x + s.dir.x, y: s.body[0].y + s.dir.y };

          // Wall Wrap or Collision
          const cols = Math.floor(width / s.gridSize);
          const rows = Math.floor(height / s.gridSize);
          if (head.x < 0) head.x = cols - 1;
          if (head.x >= cols) head.x = 0;
          if (head.y < 0) head.y = rows - 1;
          if (head.y >= rows) head.y = 0;

          // Self Collision
          for (let i = 1; i < s.body.length; i++) {
            if (head.x === s.body[i].x && head.y === s.body[i].y) {
              setGameState('gameover');
              playSound('gameover');
              return;
            }
          }

          s.body.unshift(head);

          // Food Check
          if (head.x === s.food.x && head.y === s.food.y) {
            localScore += 100 * config.scoreMultiplier;
            setScore(localScore);
            playSound('coin');
            s.food = {
              x: Math.floor(Math.random() * (cols - 2)) + 1,
              y: Math.floor(Math.random() * (rows - 2)) + 1,
            };
          } else {
            s.body.pop();
          }
        }

        // Draw Food
        ctx.save();
        ctx.shadowColor = '#e11d48';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(
          s.food.x * s.gridSize + s.gridSize / 2,
          s.food.y * s.gridSize + s.gridSize / 2,
          s.gridSize / 2 - 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.restore();

        // Draw Snake
        s.body.forEach((seg, idx) => {
          ctx.save();
          ctx.shadowColor = config.customColor;
          ctx.shadowBlur = idx === 0 ? 15 : 6;
          ctx.fillStyle = idx === 0 ? '#ffffff' : config.customColor;
          ctx.fillRect(
            seg.x * s.gridSize + 1,
            seg.y * s.gridSize + 1,
            s.gridSize - 2,
            s.gridSize - 2
          );
          ctx.restore();
        });
      }

      // ==========================================
      // GENRE 5: DUNGEON HERO ARENA
      // ==========================================
      else if (activeGenre === 'dungeon_hero') {
        const hero = gv.hero;
        if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) hero.x -= config.playerSpeed;
        if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) hero.x += config.playerSpeed;
        if (keysRef.current['ArrowUp'] || keysRef.current['KeyW']) hero.y -= config.playerSpeed;
        if (keysRef.current['ArrowDown'] || keysRef.current['KeyS']) hero.y += config.playerSpeed;

        hero.x = Math.max(20, Math.min(width - 40, hero.x));
        hero.y = Math.max(20, Math.min(height - 40, hero.y));

        // Draw Hero
        ctx.save();
        ctx.shadowColor = config.customColor;
        ctx.shadowBlur = 12;
        ctx.fillStyle = config.customColor;
        ctx.beginPath();
        ctx.arc(hero.x, hero.y, 16, 0, Math.PI * 2);
        ctx.fill();

        // Slash effect if attacking
        if (hero.attackTimer > 0) {
          hero.attackTimer--;
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(hero.x, hero.y, 36, hero.slashAngle - 0.8, hero.slashAngle + 0.8);
          ctx.stroke();
        }
        ctx.restore();

        // Spawn Dungeon Slimes
        gv.spawnTimer++;
        if (gv.spawnTimer > 50 / config.enemySpawnRate) {
          gv.spawnTimer = 0;
          gv.enemies.push({
            x: Math.random() > 0.5 ? 0 : width,
            y: Math.random() * height,
            vx: 0,
            vy: 0,
            w: 22,
            h: 22,
            hp: 2,
            color: '#22c55e',
            type: 'slime',
          });
        }

        // Slimes move toward Hero
        for (let i = gv.enemies.length - 1; i >= 0; i--) {
          const e = gv.enemies[i];
          const dx = hero.x - e.x;
          const dy = hero.y - e.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 1) {
            e.x += (dx / dist) * 2;
            e.y += (dy / dist) * 2;
          }

          ctx.save();
          ctx.shadowColor = e.color;
          ctx.shadowBlur = 10;
          ctx.fillStyle = e.color;
          ctx.beginPath();
          ctx.arc(e.x, e.y, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Slash Hit check
          if (hero.attackTimer > 0 && dist < 45) {
            e.hp--;
            if (e.hp <= 0) {
              gv.enemies.splice(i, 1);
              localScore += 80 * config.scoreMultiplier;
              setScore(localScore);
              playSound('explosion');
            }
          }

          // Enemy touches hero
          if (dist < 20) {
            hero.hp -= 0.5;
            if (hero.hp <= 0) {
              setGameState('gameover');
              playSound('gameover');
              return;
            }
          }
        }

        // Draw Health Bar
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(hero.x - 20, hero.y - 28, 40, 6);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(hero.x - 20, hero.y - 28, (hero.hp / hero.maxHp) * 40, 6);
      }

      // 6. Update Particle Engine
      for (let pIdx = gv.particles.length - 1; pIdx >= 0; pIdx--) {
        const p = gv.particles[pIdx];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.life <= 0) gv.particles.splice(pIdx, 1);
      }

      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, activeGenre, config]);

  // Start / Pause Controls
  const handleStartGame = () => {
    if (gameState === 'idle' || gameState === 'gameover') {
      initGame(activeGenre);
    }
    setGameState('playing');
    playSound('powerup');
  };

  const handlePauseGame = () => {
    setGameState('paused');
  };

  const handleResetGame = () => {
    initGame(activeGenre);
    setGameState('playing');
  };

  // AI Game Generator Prompt
  const handleGenerateGameFromPrompt = () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingGame(true);

    setTimeout(() => {
      const lower = aiPrompt.toLowerCase();
      let genre: GameGenre = 'space_shooter';
      let theme: GameConfig['theme'] = 'cyberpunk';
      let title = 'AI Generated Cyber Adventure';
      let speed = 7;
      let color = '#06b6d4';

      if (lower.includes('runner') || lower.includes('jump') || lower.includes('dash')) {
        genre = 'neon_runner';
        title = 'Neon Skyline Runner';
        color = '#ec4899';
        theme = 'synthwave';
        speed = 8;
      } else if (lower.includes('brick') || lower.includes('arkanoid') || lower.includes('ball')) {
        genre = 'brick_breaker';
        title = 'Quantum Brick Crusher';
        color = '#eab308';
        theme = 'retro8bit';
      } else if (lower.includes('snake') || lower.includes('grid')) {
        genre = 'cyber_snake';
        title = 'Matrix Cyber Snake 2099';
        color = '#22c55e';
        theme = 'matrix';
      } else if (lower.includes('dungeon') || lower.includes('rpg') || lower.includes('slash') || lower.includes('hero')) {
        genre = 'dungeon_hero';
        title = 'Dungeon Arena Slasher';
        color = '#8b5cf6';
        theme = 'darkfantasy';
      } else {
        genre = 'space_shooter';
        title = 'Galaxy Defender Strike';
        color = '#38bdf8';
        theme = 'cyberpunk';
      }

      setActiveGenre(genre);
      setConfig((prev) => ({
        ...prev,
        genre,
        theme,
        title,
        playerSpeed: speed,
        customColor: color,
      }));
      initGame(genre);
      setIsGeneratingGame(false);
      onNotify(
        '🎮 AI Game Generated!',
        `Custom mechanics, physics & visuals synthesized for "${title}". Click Play to test!`,
        'success'
      );
    }, 1200);
  };

  // Gameplay Video Screen Recording (WebM/MP4)
  const handleToggleRecordGameplay = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isRecording) {
      // Stop Recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      onNotify('📹 Recording Finished', 'Gameplay video clip generated and ready for download!', 'success');
    } else {
      // Start Recording
      try {
        const stream = canvas.captureStream(60);
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        recordedChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          setRecordedVideoUrl(url);
        };

        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        if (gameState !== 'playing') {
          handleStartGame();
        }
        onNotify('🔴 Recording Gameplay...', 'Playing at 60 FPS. Click Stop when finished.', 'info');
      } catch (err) {
        console.error(err);
        onNotify('Recording Error', 'Canvas capture not supported in this browser.', 'error');
      }
    }
  };

  // Download Standalone Playable HTML5 Game (.html)
  const handleExportStandaloneHtmlGame = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${config.title} - Standalone Playable Game</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #060913;
      color: #ffffff;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
      touch-action: manipulation;
    }
    #game-container {
      position: relative;
      border: 2px solid ${config.customColor};
      border-radius: 16px;
      box-shadow: 0 0 30px ${config.customColor}40;
      overflow: hidden;
    }
    canvas {
      display: block;
      background: #070b14;
    }
    #ui-hud {
      position: absolute;
      top: 12px;
      left: 16px;
      right: 16px;
      display: flex;
      justify-content: space-between;
      font-weight: bold;
      font-size: 14px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.8);
      pointer-events: none;
    }
    #controls {
      margin-top: 14px;
      font-size: 12px;
      color: #94a3b8;
      text-align: center;
    }
    .touch-btn {
      padding: 12px 24px;
      border-radius: 12px;
      background: ${config.customColor};
      color: #000;
      font-weight: bold;
      border: none;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div id="game-container">
    <div id="ui-hud">
      <div>🎮 ${config.title}</div>
      <div id="score-display">Score: 0 | Lives: ${config.maxLives}</div>
    </div>
    <canvas id="gameCanvas" width="640" height="480"></canvas>
  </div>
  <div id="controls">
    Controls: Arrow Keys / WASD to Move • Space to Shoot / Jump<br>
    Built with iCALLOG AI Game Studio Engine
  </div>
  <script>
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score-display');
    let score = 0, lives = ${config.maxLives};
    let keys = {};
    window.addEventListener('keydown', e => { keys[e.code] = true; if(e.code==='Space') fireBullet(); });
    window.addEventListener('keyup', e => keys[e.code] = false);

    let player = { x: 300, y: 400, w: 32, h: 32, speed: ${config.playerSpeed} };
    let bullets = [], enemies = [];

    function fireBullet() {
      bullets.push({ x: player.x + 14, y: player.y, vy: -10 });
    }

    function loop() {
      if(keys['ArrowLeft'] || keys['KeyA']) player.x -= player.speed;
      if(keys['ArrowRight'] || keys['KeyD']) player.x += player.speed;
      if(keys['ArrowUp'] || keys['KeyW']) player.y -= player.speed;
      if(keys['ArrowDown'] || keys['KeyS']) player.y += player.speed;
      player.x = Math.max(10, Math.min(canvas.width - player.w - 10, player.x));
      player.y = Math.max(20, Math.min(canvas.height - player.h - 10, player.y));

      ctx.fillStyle = '#070b14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Player
      ctx.fillStyle = '${config.customColor}';
      ctx.beginPath();
      ctx.moveTo(player.x + 16, player.y);
      ctx.lineTo(player.x + 32, player.y + 32);
      ctx.lineTo(player.x, player.y + 32);
      ctx.fill();

      // Bullets
      ctx.fillStyle = '#38bdf8';
      for(let i=bullets.length-1; i>=0; i--) {
        let b = bullets[i];
        b.y += b.vy;
        ctx.fillRect(b.x, b.y, 4, 10);
        if(b.y < 0) bullets.splice(i, 1);
      }

      // Enemies
      if(Math.random() < 0.03) enemies.push({ x: Math.random()*(canvas.width-30)+15, y: -20, vy: 3 });
      for(let i=enemies.length-1; i>=0; i--) {
        let e = enemies[i];
        e.y += e.vy;
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(e.x, e.y, 24, 24);

        for(let j=bullets.length-1; j>=0; j--) {
          let b = bullets[j];
          if(b.x > e.x && b.x < e.x+24 && b.y > e.y && b.y < e.y+24) {
            enemies.splice(i, 1);
            bullets.splice(j, 1);
            score += 100;
            scoreEl.innerText = 'Score: ' + score + ' | Lives: ' + lives;
            break;
          }
        }
        if(e.y > canvas.height) enemies.splice(i, 1);
      }
      requestAnimationFrame(loop);
    }
    loop();
  </script>
</body>
</html>`;

    safeDownloadMedia(
      htmlContent,
      `${config.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_playable_game.html`,
      {
        mimeType: 'text/html',
        onNotify,
      }
    );
  };

  // Save Game Project to iCALLOG Projects Hub
  const handleSaveToProjectsHub = () => {
    try {
      const saved = localStorage.getItem('icallog_user_projects_v1');
      const projects: ProjectItem[] = saved ? JSON.parse(saved) : [];
      const newProj: ProjectItem = {
        id: config.id,
        title: config.title,
        description: `Interactive ${config.genre.toUpperCase()} Game with custom physics, sound & sprites.`,
        category: 'general',
        isPinned: true,
        activeTool: 'game_studio',
        subTool: config.genre,
        content: JSON.stringify(config),
        tags: ['game', config.genre, config.theme, 'ai_game_maker'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      projects.unshift(newProj);
      localStorage.setItem('icallog_user_projects_v1', JSON.stringify(projects));
      onNotify('💾 Game Project Saved', `"${config.title}" saved to Projects Hub!`, 'success');
    } catch {
      onNotify('Save Failed', 'Could not save game project to local storage.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. Header Hero Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950/80 to-purple-950/60 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Next-Gen Interactive Game Engine</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
                ⚡ 60 FPS Canvas & Web Audio
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                📱 Mobile Touch & Virtual Joypad
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-['Syne'] tracking-tight flex items-center gap-3">
              <span>🎮</span>
              <span>AI Game Maker & Interactive Arcade</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Create, customize, test-play, and export standalone 2D/3D arcade games, retro platformers, space shooters, and logic puzzles with zero code or prompt synthesis!
            </p>
          </div>

          {/* Quick Action Badges & High Score */}
          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl shrink-0">
            <Trophy className="w-8 h-8 text-amber-400 animate-pulse shrink-0" />
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Top Arcade Score</div>
              <div className="text-xl font-mono font-black text-amber-300">{highScore.toLocaleString()} PTS</div>
            </div>
          </div>
        </div>

        {/* AI Game Synthesizer Prompt Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="AI Game Prompt: e.g. 'Cyber space shooter with triple lasers' or 'Retro endless neon runner'..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-indigo-500/40 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-400 shadow-inner"
              />
            </div>
            <button
              onClick={handleGenerateGameFromPrompt}
              disabled={isGeneratingGame}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 cursor-pointer disabled:opacity-50"
            >
              <Wand2 className={`w-4 h-4 ${isGeneratingGame ? 'animate-spin' : ''}`} />
              <span>{isGeneratingGame ? 'Synthesizing...' : 'Generate Game (AI)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Mode Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { id: 'arcade', label: 'Play & Arcade Live', icon: Gamepad2, badge: 'Live 60fps' },
          { id: 'editor', label: 'Physics & Mechanics Studio', icon: Sliders, badge: 'Tuning' },
          { id: 'sprites', label: '2D Pixel Sprite Editor', icon: Palette, badge: 'Assets' },
          { id: 'audio', label: '8-Bit Chiptune SFX', icon: Music, badge: 'Synth' },
          { id: 'export', label: 'Standalone Export Hub', icon: Download, badge: 'HTML5 / Video' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as typeof subTab)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-900/30'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-cyan-400'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Game Genre Selector Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { id: 'space_shooter', label: 'Space Shooter', emoji: '🚀', desc: 'Arcade laser battle' },
          { id: 'neon_runner', label: 'Neon Runner', emoji: '🏃', desc: 'Endless jump & dash' },
          { id: 'brick_breaker', label: 'Brick Breaker', emoji: '🧱', desc: 'Quantum Arkanoid' },
          { id: 'cyber_snake', label: 'Cyber Snake', emoji: '🐍', desc: 'Matrix grid runner' },
          { id: 'dungeon_hero', label: 'Dungeon Hero', emoji: '⚔️', desc: 'Arena slash & loot' },
          { id: 'memory_matrix', label: 'Memory Matrix', emoji: '🧩', desc: 'AI Cyber hacking' },
        ].map((genre) => {
          const isSelected = activeGenre === genre.id;
          return (
            <button
              key={genre.id}
              onClick={() => {
                setActiveGenre(genre.id as GameGenre);
                setConfig((prev) => ({ ...prev, genre: genre.id as GameGenre }));
                initGame(genre.id as GameGenre);
              }}
              className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-950/60 border-cyan-400/80 shadow-lg shadow-cyan-950/40'
                  : 'bg-slate-900/60 hover:bg-slate-800/60 border-slate-800 text-slate-400'
              }`}
            >
              <div className="text-xl mb-1">{genre.emoji}</div>
              <div className="text-xs font-bold text-white truncate">{genre.label}</div>
              <div className="text-[10px] text-slate-400 truncate">{genre.desc}</div>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: LIVE ARCADE & PLAY ENGINE */}
      {/* ========================================================================= */}
      {subTab === 'arcade' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Canvas Viewport */}
          <div className="lg:col-span-3 space-y-3">
            <div className="relative rounded-3xl bg-slate-950 border border-slate-800 p-2 overflow-hidden shadow-2xl flex flex-col items-center justify-center">
              {/* Top In-Game HUD overlay */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700 text-white font-mono font-bold text-xs flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>SCORE: {score.toLocaleString()}</span>
                  </div>
                  <div className="px-3 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700 text-rose-400 font-mono font-bold text-xs flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 fill-rose-500" />
                    <span>x{lives}</span>
                  </div>
                </div>

                {isRecording && (
                  <div className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-mono font-bold flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span>REC 60 FPS</span>
                  </div>
                )}
              </div>

              {/* Game Screen Canvas */}
              <canvas
                ref={canvasRef}
                width={640}
                height={460}
                className="w-full max-w-full h-auto aspect-[4/3] sm:aspect-[16/10] rounded-2xl bg-[#070b14] cursor-crosshair border border-slate-800/80"
              />

              {/* Overlay for Idle / Paused / GameOver */}
              {gameState !== 'playing' && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center gap-4 z-20">
                  <div className="text-4xl animate-bounce">
                    {gameState === 'gameover' ? '💀' : gameState === 'paused' ? '⏸️' : '🚀'}
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl sm:text-2xl font-black text-white font-['Syne']">
                      {gameState === 'gameover' ? 'GAME OVER' : gameState === 'paused' ? 'GAME PAUSED' : config.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-xs">
                      {gameState === 'gameover'
                        ? `Final Score: ${score.toLocaleString()} Points`
                        : 'Use WASD / Arrow Keys to Move, Space to Shoot / Jump'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleStartGame}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-black text-sm flex items-center gap-2 shadow-xl shadow-cyan-950/60 transition-transform hover:scale-105 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>{gameState === 'gameover' ? 'Play Again' : gameState === 'paused' ? 'Resume' : 'Start Game'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile / Touchpad Virtual Controls Bar */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={gameState === 'playing' ? handlePauseGame : handleStartGame}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {gameState === 'playing' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                  <span>{gameState === 'playing' ? 'Pause' : 'Play'}</span>
                </button>
                <button
                  onClick={handleResetGame}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                  title="Reset Game"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setConfig((c) => ({ ...c, soundEnabled: !c.soundEnabled }))}
                  className={`p-2 rounded-xl border cursor-pointer ${
                    config.soundEnabled ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' : 'bg-slate-800 text-slate-500 border-slate-700'
                  }`}
                  title="Toggle Sound Effects"
                >
                  {config.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>

              {/* Action Button for mobile touch */}
              <div className="flex items-center gap-2">
                <button
                  onMouseDown={handleActionInput}
                  onTouchStart={handleActionInput}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black text-xs active:scale-95 shadow-md flex items-center gap-1.5 select-none cursor-pointer"
                >
                  <Flame className="w-4 h-4" />
                  <span>ACTION (SPACE)</span>
                </button>
                <button
                  onClick={handleToggleRecordGameplay}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border ${
                    isRecording
                      ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>{isRecording ? 'Stop Rec' : 'Rec Clip'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Control & Quick Parameter Panel */}
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Live Physics Tweaker</span>
              </h3>

              {/* Player Speed Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Player Speed</span>
                  <span className="font-mono text-cyan-400">{config.playerSpeed}x</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="14"
                  value={config.playerSpeed}
                  onChange={(e) => setConfig({ ...config, playerSpeed: parseInt(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Enemy Spawn Rate */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Enemy Spawn Wave</span>
                  <span className="font-mono text-amber-400">{config.enemySpawnRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={config.enemySpawnRate}
                  onChange={(e) => setConfig({ ...config, enemySpawnRate: parseFloat(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Lives / Shields */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Starting Lives</span>
                  <span className="font-mono text-rose-400">{config.maxLives}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={config.maxLives}
                  onChange={(e) => setConfig({ ...config, maxLives: parseInt(e.target.value) })}
                  className="w-full accent-rose-400 cursor-pointer"
                />
              </div>

              {/* Theme Color Selector */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-xs text-slate-400">Neon Energy Theme</label>
                <div className="flex items-center gap-2">
                  {['#06b6d4', '#ec4899', '#22c55e', '#eab308', '#8b5cf6', '#f43f5e'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setConfig({ ...config, customColor: c })}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                        config.customColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-70'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Export / Save Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Save className="w-3.5 h-3.5 text-indigo-400" />
                <span>Save & Export Game</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Download a self-contained HTML5 file that plays standalone in any browser offline.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleExportStandaloneHtmlGame}
                  className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Standalone .HTML</span>
                </button>
                <button
                  onClick={handleSaveToProjectsHub}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FolderKanban className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Save to Projects Hub</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: PHYSICS & MECHANICS STUDIO */}
      {/* ========================================================================= */}
      {subTab === 'editor' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-bold text-white font-['Syne'] flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <span>Deep Game Mechanics & Difficulty Architect</span>
              </h3>
              <p className="text-xs text-slate-400">
                Configure game gravity, collision mechanics, score algorithms, and difficulty modes.
              </p>
            </div>
            <button
              onClick={() => {
                initGame(activeGenre);
                setSubTab('arcade');
                setGameState('playing');
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Apply & Test Play</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Game Identity */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-4">
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Game Metadata</h4>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Game Title</label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Difficulty Mode</label>
                <select
                  value={config.difficulty}
                  onChange={(e) => setConfig({ ...config, difficulty: e.target.value as GameConfig['difficulty'] })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                >
                  <option value="casual">Casual (Easy & Relaxed)</option>
                  <option value="arcade">Arcade (Balanced Challenge)</option>
                  <option value="nightmare">Nightmare (Ultra Fast)</option>
                  <option value="godmode">God Mode (Invincible)</option>
                </select>
              </div>
            </div>

            {/* Column 2: Physics Parameters */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-4">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">Physics & Velocities</h4>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Bullet Velocity</span>
                  <span className="font-mono text-white">{config.bulletSpeed} px/f</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="24"
                  value={config.bulletSpeed}
                  onChange={(e) => setConfig({ ...config, bulletSpeed: parseInt(e.target.value) })}
                  className="w-full accent-amber-400"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Gravity Pull (Platformer)</span>
                  <span className="font-mono text-white">{config.gravity}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.5"
                  step="0.1"
                  value={config.gravity}
                  onChange={(e) => setConfig({ ...config, gravity: parseFloat(e.target.value) })}
                  className="w-full accent-amber-400"
                />
              </div>
            </div>

            {/* Column 3: Multipliers */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-4">
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Score & Multipliers</h4>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Score Multiplier</span>
                  <span className="font-mono text-white">{config.scoreMultiplier}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={config.scoreMultiplier}
                  onChange={(e) => setConfig({ ...config, scoreMultiplier: parseInt(e.target.value) })}
                  className="w-full accent-emerald-400"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: 2D PIXEL SPRITE EDITOR */}
      {/* ========================================================================= */}
      {subTab === 'sprites' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-bold text-white font-['Syne'] flex items-center gap-2">
                <Palette className="w-5 h-5 text-pink-400" />
                <span>16x16 Pixel Art Sprite & Asset Maker</span>
              </h3>
              <p className="text-xs text-slate-400">
                Draw custom player ships, alien enemies, coins, or powerup sprites and import them into your games.
              </p>
            </div>

            {/* Preset Templates */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // Fill Ship Preset
                  const grid = Array(16)
                    .fill(null)
                    .map(() => Array(16).fill('#00000000'));
                  for (let y = 3; y < 14; y++) {
                    const width = y - 2;
                    for (let x = 8 - Math.floor(width / 2); x <= 8 + Math.floor(width / 2); x++) {
                      if (x >= 0 && x < 16) grid[y][x] = '#06b6d4';
                    }
                  }
                  setSpriteGrid(grid);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 cursor-pointer"
              >
                Preset: Ship
              </button>
              <button
                onClick={() => {
                  // Clear
                  setSpriteGrid(
                    Array(16)
                      .fill(null)
                      .map(() => Array(16).fill('#00000000'))
                  );
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-rose-300 cursor-pointer"
              >
                Clear Grid
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
            {/* Pixel Grid 16x16 */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl">
              <div className="grid grid-cols-16 gap-[1px] bg-slate-800 p-1 rounded-lg">
                {spriteGrid.map((row, rIdx) =>
                  row.map((color, cIdx) => (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      onClick={() => {
                        const next = spriteGrid.map((r, ri) =>
                          r.map((c, ci) => (ri === rIdx && ci === cIdx ? (brushMode === 'draw' ? selectedColor : '#00000000') : c))
                        );
                        setSpriteGrid(next);
                      }}
                      style={{ backgroundColor: color === '#00000000' ? '#0f172a' : color }}
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded-xs cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  ))
                )}
              </div>
            </div>

            {/* Color Palette & Tools */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBrushMode('draw')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    brushMode === 'draw' ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Brush Tool
                </button>
                <button
                  onClick={() => setBrushMode('erase')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    brushMode === 'erase' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Eraser
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400">Palette</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    '#06b6d4',
                    '#3b82f6',
                    '#8b5cf6',
                    '#ec4899',
                    '#f43f5e',
                    '#ef4444',
                    '#f59e0b',
                    '#eab308',
                    '#22c55e',
                    '#10b981',
                    '#ffffff',
                    '#94a3b8',
                    '#475569',
                    '#0f172a',
                    '#000000',
                  ].map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setSelectedColor(c);
                        setBrushMode('draw');
                      }}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-lg transition-transform cursor-pointer ${
                        selectedColor === c ? 'scale-110 ring-2 ring-white' : 'opacity-80'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: 8-BIT CHIPTUNE SFX SYNTH */}
      {/* ========================================================================= */}
      {subTab === 'audio' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white font-['Syne'] flex items-center gap-2">
              <Music className="w-5 h-5 text-amber-400" />
              <span>Web Audio Chiptune SFX Synthesizer</span>
            </h3>
            <p className="text-xs text-slate-400">
              Interactive synthesized sound effects for your arcade games without any external MP3 dependencies.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { type: 'laser', label: 'Laser Blast Zap', emoji: '🔫', desc: 'Sawtooth pitch drop' },
              { type: 'jump', label: 'Jump Chime', emoji: '🦘', desc: 'Square wave frequency ramp' },
              { type: 'coin', label: 'Coin Pickup Melody', emoji: '🪙', desc: 'Dual sine harmonics' },
              { type: 'explosion', label: 'Explosion Boom', emoji: '💥', desc: 'Low triangle bass rumble' },
              { type: 'powerup', label: 'Power-Up Arpeggio', emoji: '⭐', desc: '4-note upward fanfare' },
              { type: 'gameover', label: 'Game Over Tone', emoji: '💀', desc: 'Downward chromatic drop' },
            ].map((sfx) => (
              <button
                key={sfx.type}
                onClick={() => playSound(sfx.type as Parameters<typeof playSound>[0])}
                className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-cyan-400/60 hover:bg-slate-900/80 transition-all text-left group cursor-pointer"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{sfx.emoji}</div>
                <div className="text-xs font-bold text-white">{sfx.label}</div>
                <div className="text-[10px] text-slate-400">{sfx.desc}</div>
                <div className="mt-2 text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                  <Play className="w-3 h-3 fill-cyan-400" />
                  <span>Click to Test SFX</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 5: STANDALONE EXPORT HUB */}
      {/* ========================================================================= */}
      {subTab === 'export' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white font-['Syne'] flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-400" />
              <span>Universal Standalone Game Exporter</span>
            </h3>
            <p className="text-xs text-slate-400">
              Export your games in multiple formats for web distribution, offline play, or social media clips.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Export 1: Standalone HTML */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between space-y-4">
              <div>
                <div className="text-2xl mb-2">🌐</div>
                <h4 className="text-sm font-bold text-white">Standalone HTML5 (.html)</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Single-file executable HTML game with embedded canvas engine & sound synth. Plays anywhere offline!
                </p>
              </div>
              <button
                onClick={handleExportStandaloneHtmlGame}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Export Playable .HTML</span>
              </button>
            </div>

            {/* Export 2: JSON Game Bundle */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between space-y-4">
              <div>
                <div className="text-2xl mb-2">📦</div>
                <h4 className="text-sm font-bold text-white">Game Project Bundle (.json)</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Complete physics parameters, custom sprites, and settings ready for reloading or sharing.
                </p>
              </div>
              <button
                onClick={() => {
                  const jsonStr = JSON.stringify(config, null, 2);
                  safeDownloadMedia(jsonStr, `${config.id}_bundle.json`, {
                    mimeType: 'application/json',
                    onNotify,
                  });
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Code className="w-4 h-4" />
                <span>Export JSON Project</span>
              </button>
            </div>

            {/* Export 3: Gameplay Video Clip */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between space-y-4">
              <div>
                <div className="text-2xl mb-2">📹</div>
                <h4 className="text-sm font-bold text-white">Recorded Gameplay Clip</h4>
                <p className="text-xs text-slate-400 mt-1">
                  {recordedVideoUrl ? 'High-FPS gameplay video ready to download!' : 'Record a 60fps clip in the Arcade tab.'}
                </p>
              </div>
              {recordedVideoUrl ? (
                <button
                  onClick={() => {
                    safeDownloadMedia(recordedVideoUrl, `gameplay_${config.genre}_${Date.now()}.webm`, {
                      mimeType: 'video/webm',
                      onNotify,
                    });
                  }}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Video Clip</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSubTab('arcade');
                    handleToggleRecordGameplay();
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Video className="w-4 h-4 text-rose-400" />
                  <span>Record In Arcade</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

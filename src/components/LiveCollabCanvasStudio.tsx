import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Users,
  Share2,
  Copy,
  Check,
  Plus,
  Send,
  MessageSquare,
  Sparkles,
  Download,
  PenTool,
  Square,
  StickyNote,
  Box,
  Music,
  Video,
  Layers,
  CheckCircle2,
  Radio,
  Mic,
  Smile,
  Camera,
  Image as ImageIcon,
  Sliders,
  Trash2,
  Eye,
  X,
  ExternalLink,
  RotateCcw,
  Palette,
  Maximize2,
  FileImage,
} from 'lucide-react';
import { UserProfile } from '../types.ts';
import { safeDownloadMedia } from '../lib/downloadHelper.ts';

interface LiveCollabCanvasStudioProps {
  user?: UserProfile;
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role: string;
  cursorX: number;
  cursorY: number;
  status: 'active' | 'idle';
}

interface CanvasNote {
  id: string;
  x: number;
  y: number;
  text: string;
  author: string;
  color: string;
  type?: 'sticky' | '3d_pin' | 'audio_pin';
}

interface DrawingStroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

interface SavedSnapshot {
  id: string;
  name: string;
  timestamp: number;
  resolution: string;
  width: number;
  height: number;
  notesCount: number;
  roomId: string;
  dataUrl: string;
}

const LOCAL_SNAPSHOTS_KEY = 'icallog_canvas_snapshots_v1';

export const LiveCollabCanvasStudio: React.FC<LiveCollabCanvasStudioProps> = ({ user, onNotify }) => {
  const [roomId, setRoomId] = useState('icallog-room-8821');
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTool, setActiveTool] = useState<'select' | 'pen' | 'note' | '3d_pin' | 'audio_pin'>('note');
  const [penColor, setPenColor] = useState('#06b6d4');
  const [penWidth, setPenWidth] = useState(3);

  // Drawing state
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Snapshot Modal & Gallery state
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [snapshotResolution, setSnapshotResolution] = useState<'4k' | '1080p' | '2k_square'>('4k');
  const [includeCursors, setIncludeCursors] = useState(true);
  const [includeGrid, setIncludeGrid] = useState(true);
  const [includeBranding, setIncludeBranding] = useState(true);
  const [transparentBg, setTransparentBg] = useState(false);
  const [isGeneratingSnapshot, setIsGeneratingSnapshot] = useState(false);
  const [savedSnapshots, setSavedSnapshots] = useState<SavedSnapshot[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_SNAPSHOTS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return [];
  });

  const canvasViewportRef = useRef<HTMLDivElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: 'usr_me',
      name: user?.name || user?.username || 'You (Host)',
      avatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      color: '#06b6d4',
      role: 'Director',
      cursorX: 250,
      cursorY: 180,
      status: 'active',
    },
    {
      id: 'usr_2',
      name: 'Sarah (VFX Lead)',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      color: '#ec4899',
      role: '3D Animator',
      cursorX: 420,
      cursorY: 290,
      status: 'active',
    },
    {
      id: 'usr_3',
      name: 'Alex (Audio Soundstage)',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      color: '#10b981',
      role: 'Music Producer',
      cursorX: 610,
      cursorY: 140,
      status: 'active',
    },
  ]);

  const [notes, setNotes] = useState<CanvasNote[]>([
    {
      id: 'n_1',
      x: 60,
      y: 70,
      text: '🎬 Act 1 Climax: Add volumetric neon rain & laser katana particle flare here!',
      author: 'Sarah (VFX Lead)',
      color: 'bg-pink-500/20 border-pink-400 text-pink-200',
      type: 'sticky',
    },
    {
      id: 'n_2',
      x: 340,
      y: 90,
      text: '🎵 Audio Beat Drop: 128 BPM Synthwave bassline synced to character leap.',
      author: 'Alex (Audio Soundstage)',
      color: 'bg-emerald-500/20 border-emerald-400 text-emerald-200',
      type: 'audio_pin',
    },
    {
      id: 'n_3',
      x: 160,
      y: 250,
      text: '📦 3D Asset: Cyber Dragon GLTF Rig calibrated with 17-bone IK motion.',
      author: 'You (Host)',
      color: 'bg-cyan-500/20 border-cyan-400 text-cyan-200',
      type: '3d_pin',
    },
  ]);

  const [chatMessages, setChatMessages] = useState<{ id: string; user: string; text: string; time: string }[]>([
    { id: 'm_1', user: 'Sarah', text: 'Hey team! Just uploaded the 8K Dragon model preview 🐉', time: '10:02 AM' },
    { id: 'm_2', user: 'Alex', text: 'Love the lightning effect! Mixing the audio stems right now 🎧', time: '10:04 AM' },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Simulated live cursor movement for multiplayer feel
  useEffect(() => {
    const interval = setInterval(() => {
      setTeamMembers((prev) =>
        prev.map((m) => {
          if (m.id === 'usr_me') return m;
          return {
            ...m,
            cursorX: Math.max(50, Math.min(750, m.cursorX + (Math.random() * 40 - 20))),
            cursorY: Math.max(50, Math.min(380, m.cursorY + (Math.random() * 40 - 20))),
          };
        })
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Save snapshots to local storage on change
  const saveSnapshotsToStorage = (updated: SavedSnapshot[]) => {
    setSavedSnapshots(updated);
    try {
      localStorage.setItem(LOCAL_SNAPSHOTS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist snapshot to localStorage:', e);
    }
  };

  // Render freehand drawing strokes on overlay canvas
  useEffect(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allStrokes = currentStroke ? [...strokes, currentStroke] : strokes;
    allStrokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  }, [strokes, currentStroke]);

  // Drawing event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'pen') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setCurrentStroke({
      id: `stroke_${Date.now()}`,
      points: [{ x, y }],
      color: penColor,
      width: penWidth,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentStroke({
      ...currentStroke,
      points: [...currentStroke.points, { x, y }],
    });
  };

  const handlePointerUp = () => {
    if (isDrawing && currentStroke) {
      setStrokes((prev) => [...prev, currentStroke]);
      setCurrentStroke(null);
    }
    setIsDrawing(false);
  };

  const handleClearStrokes = () => {
    setStrokes([]);
    onNotify('Drawings Cleared', 'Pen annotations cleared from canvas.', 'info');
  };

  const handleCopyInviteLink = () => {
    const link = `https://icallog.studio/collab/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    onNotify('Invite Link Copied!', `Share link "${link}" with team members for real-time collaboration.`, 'success');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = {
      id: `m_${Date.now()}`,
      user: user?.name || user?.username || 'You',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages([...chatMessages, msg]);
    setChatInput('');
  };

  const handleAddStickyNote = (type: 'sticky' | '3d_pin' | 'audio_pin' = 'sticky') => {
    let defaultText = '✨ New Scene Note: Add cinematic color grading & audio reverb pass.';
    let defaultColor = 'bg-indigo-500/20 border-indigo-400 text-indigo-200';

    if (type === '3d_pin') {
      defaultText = '📦 3D Asset Marker: Place volumetric holo hologram emitter node.';
      defaultColor = 'bg-cyan-500/20 border-cyan-400 text-cyan-200';
    } else if (type === 'audio_pin') {
      defaultText = '🎵 Audio Stem Marker: Place spatial 5.1 surround sound ambient cue.';
      defaultColor = 'bg-pink-500/20 border-pink-400 text-pink-200';
    }

    const newNote: CanvasNote = {
      id: `n_${Date.now()}`,
      x: 80 + Math.random() * 260,
      y: 80 + Math.random() * 180,
      text: defaultText,
      author: user?.name || 'You',
      color: defaultColor,
      type,
    };
    setNotes([...notes, newNote]);
    onNotify('Marker Placed', `Added collaborative ${type.replace('_', ' ')} to the canvas.`, 'info');
  };

  // HIGH-RESOLUTION CANVAS SNAPSHOT ENGINE
  const generateHighResCanvasSnapshot = async (
    targetResolution: '4k' | '1080p' | '2k_square' = snapshotResolution
  ): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> => {
    let outWidth = 3840;
    let outHeight = 2160;

    if (targetResolution === '1080p') {
      outWidth = 1920;
      outHeight = 1080;
    } else if (targetResolution === '2k_square') {
      outWidth = 2048;
      outHeight = 2048;
    }

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = outWidth;
    exportCanvas.height = outHeight;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas 2D context');

    // Source viewport measurements (normalize to virtual 800x450 base coords)
    const baseW = 800;
    const baseH = 450;
    const scaleX = outWidth / baseW;
    const scaleY = outHeight / baseH;

    // 1. Background
    if (!transparentBg) {
      const grad = ctx.createLinearGradient(0, 0, outWidth, outHeight);
      grad.addColorStop(0, '#020617');
      grad.addColorStop(0.5, '#090d16');
      grad.addColorStop(1, '#06131f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, outWidth, outHeight);

      // Subtle Ambient Glows
      const radialGlow1 = ctx.createRadialGradient(outWidth * 0.2, outHeight * 0.3, 10, outWidth * 0.2, outHeight * 0.3, outWidth * 0.5);
      radialGlow1.addColorStop(0, 'rgba(6, 182, 212, 0.12)');
      radialGlow1.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = radialGlow1;
      ctx.fillRect(0, 0, outWidth, outHeight);

      const radialGlow2 = ctx.createRadialGradient(outWidth * 0.8, outHeight * 0.7, 10, outWidth * 0.8, outHeight * 0.7, outWidth * 0.4);
      radialGlow2.addColorStop(0, 'rgba(236, 72, 153, 0.09)');
      radialGlow2.addColorStop(1, 'rgba(236, 72, 153, 0)');
      ctx.fillStyle = radialGlow2;
      ctx.fillRect(0, 0, outWidth, outHeight);
    } else {
      ctx.clearRect(0, 0, outWidth, outHeight);
    }

    // 2. Grid Pattern (if enabled)
    if (includeGrid && !transparentBg) {
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)';
      ctx.lineWidth = Math.max(1, Math.round(outWidth / 1920));
      const gridSize = Math.round(36 * (outWidth / 1920));

      for (let x = 0; x <= outWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, outHeight);
        ctx.stroke();
      }
      for (let y = 0; y <= outHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(outWidth, y);
        ctx.stroke();
      }
    }

    // 3. Freehand Drawing Strokes
    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width * scaleX;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke.points[0].x * scaleX, stroke.points[0].y * scaleY);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x * scaleX, stroke.points[i].y * scaleY);
      }
      ctx.stroke();
    });

    // 4. Collaborative Note Cards
    notes.forEach((note) => {
      const cardX = note.x * scaleX;
      const cardY = note.y * scaleY;
      const cardW = 280 * scaleX;
      const cardH = 115 * scaleY;
      const radius = 16 * scaleX;

      // Card background & border color
      let cardBg = 'rgba(15, 23, 42, 0.88)';
      let cardBorder = 'rgba(6, 182, 212, 0.7)';
      let cardText = '#e2e8f0';
      let tagText = note.author;
      let badgeBg = '#06b6d4';

      if (note.color.includes('pink')) {
        cardBorder = 'rgba(244, 114, 182, 0.8)';
        badgeBg = '#ec4899';
      } else if (note.color.includes('emerald')) {
        cardBorder = 'rgba(52, 211, 153, 0.8)';
        badgeBg = '#10b981';
      } else if (note.color.includes('indigo')) {
        cardBorder = 'rgba(129, 140, 248, 0.8)';
        badgeBg = '#6366f1';
      }

      // Draw rounded card drop shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 20 * scaleX;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 8 * scaleY;

      ctx.fillStyle = cardBg;
      ctx.strokeStyle = cardBorder;
      ctx.lineWidth = 2.5 * scaleX;

      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, radius);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Header Author Badge
      ctx.fillStyle = badgeBg;
      ctx.beginPath();
      ctx.arc(cardX + 16 * scaleX, cardY + 20 * scaleY, 5 * scaleX, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#94a3b8';
      ctx.font = `bold ${Math.round(11 * scaleX)}px monospace`;
      ctx.fillText(tagText.toUpperCase(), cardX + 28 * scaleX, cardY + 24 * scaleY);

      // Card Content Text wrapping
      ctx.fillStyle = cardText;
      ctx.font = `bold ${Math.round(13 * scaleX)}px sans-serif`;
      
      const words = note.text.split(' ');
      let line = '';
      let textY = cardY + 48 * scaleY;
      const maxTextWidth = cardW - 32 * scaleX;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxTextWidth && n > 0) {
          ctx.fillText(line, cardX + 16 * scaleX, textY);
          line = words[n] + ' ';
          textY += 20 * scaleY;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, cardX + 16 * scaleX, textY);
    });

    // 5. Team Member Live Cursors (if enabled)
    if (includeCursors) {
      teamMembers.forEach((member) => {
        const cx = member.cursorX * scaleX;
        const cy = member.cursorY * scaleY;

        ctx.save();
        ctx.fillStyle = member.color;
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 2 * scaleX;

        // Pointer Arrow
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + 20 * scaleX, cy + 8 * scaleY);
        ctx.lineTo(cx + 12 * scaleX, cy + 12 * scaleY);
        ctx.lineTo(cx + 8 * scaleX, cy + 20 * scaleY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // User Pill Tag
        const tag = member.name;
        ctx.font = `bold ${Math.round(11 * scaleX)}px monospace`;
        const textWidth = ctx.measureText(tag).width;
        const pillX = cx + 18 * scaleX;
        const pillY = cy + 16 * scaleY;
        const pillW = textWidth + 16 * scaleX;
        const pillH = 22 * scaleY;

        ctx.fillStyle = member.color;
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 8 * scaleX);
        ctx.fill();

        ctx.fillStyle = '#020617';
        ctx.fillText(tag, pillX + 8 * scaleX, pillY + 15 * scaleY);
        ctx.restore();
      });
    }

    // 6. Header Watermark Branding & Studio Metadata (if enabled)
    if (includeBranding) {
      ctx.save();
      // Top Header Overlay Bar
      ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
      ctx.fillRect(0, 0, outWidth, 54 * scaleY);

      ctx.fillStyle = '#38bdf8';
      ctx.font = `900 ${Math.round(16 * scaleX)}px 'Syne', sans-serif`;
      ctx.fillText('iCALLOG • LIVE COLLAB CANVAS', 24 * scaleX, 34 * scaleY);

      ctx.fillStyle = '#94a3b8';
      ctx.font = `bold ${Math.round(11 * scaleX)}px monospace`;
      ctx.fillText(`ROOM: ${roomId} • CREATORS: ${teamMembers.length} • RESOLUTION: ${outWidth}x${outHeight}`, 380 * scaleX, 33 * scaleY);

      const timestampStr = new Date().toLocaleString();
      ctx.fillStyle = '#34d399';
      ctx.fillText(`SNAPSHOT EXPORT: ${timestampStr}`, outWidth - 360 * scaleX, 33 * scaleY);
      ctx.restore();
    }

    const dataUrl = exportCanvas.toDataURL('image/png');
    const blob = await new Promise<Blob>((resolve) => {
      exportCanvas.toBlob((b) => resolve(b || new Blob()), 'image/png');
    });

    return { blob, dataUrl, width: outWidth, height: outHeight };
  };

  // Perform Snapshot Execution (Download + Local Storage Save)
  const handleTakeSnapshot = async (downloadDirectly = true) => {
    setIsGeneratingSnapshot(true);
    try {
      const { blob, dataUrl, width, height } = await generateHighResCanvasSnapshot(snapshotResolution);
      const filename = `${roomId}_snapshot_${snapshotResolution}_${Date.now()}.png`;

      // 1. Save to Local Storage Snapshot Vault
      const newSnapshot: SavedSnapshot = {
        id: `snap_${Date.now()}`,
        name: filename,
        timestamp: Date.now(),
        resolution: `${width}×${height}`,
        width,
        height,
        notesCount: notes.length,
        roomId,
        dataUrl,
      };

      const updatedSnapshots = [newSnapshot, ...savedSnapshots].slice(0, 20);
      saveSnapshotsToStorage(updatedSnapshots);

      // 2. Trigger browser download if requested
      if (downloadDirectly) {
        safeDownloadMedia(blob, filename, {
          type: 'image',
          onSuccess: () => {
            onNotify(
              'High-Res Snapshot Exported!',
              `Saved ${filename} (${width}×${height} PNG) to Downloads & Local Vault.`,
              'success'
            );
          },
        });
      } else {
        onNotify('Snapshot Saved to Local Vault', `Saved high-res PNG (${width}×${height}) to browser storage.`, 'success');
      }

      setIsSnapshotModalOpen(false);
    } catch (err: any) {
      console.error('Snapshot error:', err);
      onNotify('Snapshot Error', err.message || 'Could not export canvas snapshot', 'error');
    } finally {
      setIsGeneratingSnapshot(false);
    }
  };

  // Copy Image to Clipboard
  const handleCopySnapshotToClipboard = async () => {
    setIsGeneratingSnapshot(true);
    try {
      const { blob } = await generateHighResCanvasSnapshot('1080p');
      if (typeof window !== 'undefined' && navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({
            'image/png': blob,
          }),
        ]);
        onNotify('Snapshot Copied!', 'High-resolution PNG copied to clipboard.', 'success');
      } else {
        onNotify('Clipboard Notice', 'Clipboard image writing not supported in this browser.', 'warning');
      }
    } catch (err: any) {
      console.error('Clipboard copy error:', err);
      onNotify('Copy Failed', 'Unable to copy image directly to clipboard.', 'error');
    } finally {
      setIsGeneratingSnapshot(false);
    }
  };

  const handleDeleteSavedSnapshot = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedSnapshots.filter((s) => s.id !== id);
    saveSnapshotsToStorage(updated);
    onNotify('Snapshot Removed', 'Snapshot removed from local vault.', 'info');
  };

  const handleDownloadSavedSnapshot = (snap: SavedSnapshot, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = snap.dataUrl;
    link.download = snap.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('Downloading Snapshot', `Downloading ${snap.name}...`, 'success');
  };

  const handleExportCanvasBoard = () => {
    const exportData = {
      project: 'iCALLOG Live Collab Board',
      roomId,
      membersCount: teamMembers.length,
      notes,
      strokesCount: strokes.length,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    safeDownloadMedia(blob, `${roomId}_board_export.json`, {
      type: 'text',
      onSuccess: (msg) => onNotify('Canvas Exported', msg, 'success'),
    });
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950/60 to-cyan-950/40 border border-teal-500/40 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 via-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-teal-950/50 text-2xl">
              👥
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white font-['Syne']">
                  Live Multi-User Collaborative Canvas & Team Hub
                </h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-400/40 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {teamMembers.length} Creators Connected Live
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-mono mt-1">
                Real-time shared whiteboard, 4K snapshot exporter, 3D pins, audio stems, and live team chat.
              </p>
            </div>
          </div>

          {/* Top Header Actions (Invite, Snapshot, Export) */}
          <div className="flex items-center gap-2 flex-wrap self-start md:self-center">
            <button
              type="button"
              onClick={handleCopyInviteLink}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all cursor-pointer shadow-md"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Invite Team'}</span>
            </button>

            {/* Prominent High-Res Snapshot Button */}
            <button
              id="collab-canvas-snapshot-btn"
              type="button"
              onClick={() => setIsSnapshotModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-cyan-500 to-teal-400 hover:brightness-110 text-slate-950 font-black text-xs shadow-lg shadow-cyan-950/60 flex items-center gap-2 transition-all cursor-pointer hover:scale-105"
              title="Export High-Resolution Canvas Snapshot as PNG"
            >
              <Camera className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>Snapshot (.PNG)</span>
            </button>

            {/* Saved Snapshot Vault / Gallery Button */}
            <button
              type="button"
              onClick={() => setIsGalleryOpen(true)}
              className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="View saved local snapshots"
            >
              <FileImage className="w-3.5 h-3.5 text-cyan-400" />
              <span>Vault ({savedSnapshots.length})</span>
            </button>

            <button
              type="button"
              onClick={handleExportCanvasBoard}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Canvas + Live Team Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Whiteboard Canvas (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
            {/* Toolbar Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTool('note')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeTool === 'note' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <StickyNote className="w-3.5 h-3.5" />
                  <span>Sticky Notes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTool('pen')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeTool === 'pen' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Pen Draw</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTool('3d_pin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeTool === '3d_pin' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>3D Pin</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTool('audio_pin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeTool === 'audio_pin' ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>Audio Stem</span>
                </button>
              </div>

              {/* Pen Settings / Clear / Quick Add Buttons */}
              <div className="flex items-center gap-2">
                {activeTool === 'pen' && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <input
                      type="color"
                      value={penColor}
                      onChange={(e) => setPenColor(e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                      title="Pen Color"
                    />
                    <select
                      value={penWidth}
                      onChange={(e) => setPenWidth(Number(e.target.value))}
                      className="bg-transparent text-slate-300 text-xs font-mono focus:outline-none"
                    >
                      <option value={2} className="bg-slate-900">Thin</option>
                      <option value={4} className="bg-slate-900">Medium</option>
                      <option value={8} className="bg-slate-900">Thick</option>
                    </select>
                    {strokes.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearStrokes}
                        className="p-1 text-slate-400 hover:text-rose-400"
                        title="Clear pen drawings"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleAddStickyNote(activeTool === '3d_pin' ? '3d_pin' : activeTool === 'audio_pin' ? 'audio_pin' : 'sticky')}
                  className="px-3 py-1.5 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Marker</span>
                </button>

                {/* Quick Snapshot Action */}
                <button
                  type="button"
                  onClick={() => handleTakeSnapshot(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Quick High-Res Snapshot"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Snap</span>
                </button>
              </div>
            </div>

            {/* Visual Multiplayer Canvas Viewport */}
            <div
              ref={canvasViewportRef}
              className="relative h-96 rounded-2xl bg-slate-950 border-2 border-slate-800/80 shadow-2xl overflow-hidden group select-none"
            >
              {/* Grid Background */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-35 pointer-events-none" />

              {/* Freehand Drawing Overlay Canvas */}
              <canvas
                ref={drawingCanvasRef}
                width={800}
                height={400}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className={`absolute inset-0 w-full h-full z-10 ${activeTool === 'pen' ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`}
              />

              {/* Placed Interactive Notes */}
              {notes.map((note) => (
                <div
                  key={note.id}
                  style={{ top: `${note.y}px`, left: `${note.x}px` }}
                  className={`absolute max-w-xs p-3 rounded-2xl border-2 shadow-2xl backdrop-blur-md select-none animate-in fade-in z-20 ${note.color}`}
                >
                  <div className="text-[10px] font-mono font-bold uppercase opacity-80 mb-1 flex items-center justify-between gap-1">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      {note.author}
                    </span>
                    {note.type === '3d_pin' && <span className="px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 text-[8px] font-mono">3D PIN</span>}
                    {note.type === 'audio_pin' && <span className="px-1 py-0.2 rounded bg-pink-950 text-pink-300 text-[8px] font-mono">AUDIO</span>}
                  </div>
                  <div className="text-xs font-bold leading-relaxed">{note.text}</div>
                </div>
              ))}

              {/* Live Multiplayer Cursors */}
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  style={{
                    transform: `translate(${member.cursorX}px, ${member.cursorY}px)`,
                    transition: 'transform 0.4s ease-out',
                  }}
                  className="absolute pointer-events-none z-30 flex items-center gap-1.5"
                >
                  {/* Cursor Arrow Pointer */}
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill={member.color}>
                    <path d="M0 0L24 10L14 14L10 24L0 0Z" />
                  </svg>
                  <span
                    style={{ backgroundColor: member.color }}
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-950 font-mono shadow-md whitespace-nowrap"
                  >
                    {member.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Active Team Hub & Live Chat (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Members Card */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
            <h3 className="text-xs font-black text-white font-['Syne'] uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-400" /> Active Team Members ({teamMembers.length})
            </h3>
            <div className="space-y-2">
              {teamMembers.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800/80"
                >
                  <div className="flex items-center gap-2.5">
                    <img src={m.avatar} alt={m.name} className="w-6 h-6 rounded-full object-cover" />
                    <div>
                      <div className="text-xs font-bold text-white truncate">{m.name}</div>
                      <div className="text-[10px] text-teal-400 font-mono">{m.role}</div>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Live Team Chat */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl flex flex-col justify-between h-72">
            <h3 className="text-xs font-black text-white font-['Syne'] uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" /> Team Production Chat
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs font-mono">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="p-2 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-bold text-teal-300">{msg.user}</span>
                    <span>{msg.time}</span>
                  </div>
                  <div className="text-white">{msg.text}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type team update..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center justify-center cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* High-Resolution Snapshot Config Modal */}
      {isSnapshotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-2xl text-white space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-cyan-500 flex items-center justify-center text-slate-950 font-bold shadow-md">
                  <Camera className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-['Syne']">
                    Export Canvas Snapshot (.PNG)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    High-resolution crisp image export with notes & drawings
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSnapshotModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Resolution Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider">
                Output Resolution
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSnapshotResolution('4k')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    snapshotResolution === '4k'
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-bold font-['Syne']">Ultra 4K UHD</div>
                  <div className="text-[10px] font-mono text-slate-400">3840 × 2160</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSnapshotResolution('1080p')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    snapshotResolution === '1080p'
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-bold font-['Syne']">Full HD 1080p</div>
                  <div className="text-[10px] font-mono text-slate-400">1920 × 1080</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSnapshotResolution('2k_square')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    snapshotResolution === '2k_square'
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-bold font-['Syne']">2K Square</div>
                  <div className="text-[10px] font-mono text-slate-400">2048 × 2048</div>
                </button>
              </div>
            </div>

            {/* Customization Toggles */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider">
                Layers & Rendering Options
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCursors}
                    onChange={(e) => setIncludeCursors(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-slate-200">Include Team Cursors</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeGrid}
                    onChange={(e) => setIncludeGrid(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-slate-200">Include Canvas Grid</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeBranding}
                    onChange={(e) => setIncludeBranding(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-slate-200">Studio Watermark Bar</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transparentBg}
                    onChange={(e) => setTransparentBg(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-slate-200">Transparent PNG</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleCopySnapshotToClipboard}
                disabled={isGeneratingSnapshot}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span>Copy Image</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTakeSnapshot(false)}
                  disabled={isGeneratingSnapshot}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Save to Vault
                </button>
                <button
                  type="button"
                  onClick={() => handleTakeSnapshot(true)}
                  disabled={isGeneratingSnapshot}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-cyan-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-slate-950 stroke-[3]" />
                  <span>{isGeneratingSnapshot ? 'Rendering PNG...' : 'Download High-Res PNG'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved Snapshot Vault / Gallery Modal */}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[85vh] p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-white space-y-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <FileImage className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-['Syne']">
                    Canvas Snapshot Vault ({savedSnapshots.length})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Snapshots stored in local storage and browser downloads
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGalleryOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {savedSnapshots.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                  <Camera className="w-8 h-8 mx-auto text-slate-600" />
                  <p>No snapshots taken yet. Click "Snapshot (.PNG)" to capture the board.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedSnapshots.map((snap) => (
                    <div
                      key={snap.id}
                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 group hover:border-cyan-500/50 transition-all"
                    >
                      <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-900 border border-slate-800">
                        <img
                          src={snap.dataUrl}
                          alt={snap.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-slate-950/80 font-mono text-[9px] text-cyan-300">
                          {snap.resolution}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-white truncate max-w-[160px]">{snap.name}</div>
                          <div className="text-[10px] text-slate-400">{new Date(snap.timestamp).toLocaleTimeString()}</div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleDownloadSavedSnapshot(snap, e)}
                            className="p-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800"
                            title="Download PNG"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSavedSnapshot(snap.id, e)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-800"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => saveSnapshotsToStorage([])}
                disabled={savedSnapshots.length === 0}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold disabled:opacity-40"
              >
                Clear All Vault Snapshots
              </button>
              <button
                type="button"
                onClick={() => setIsGalleryOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
              >
                Close Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

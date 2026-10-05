import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  PenTool,
  Highlighter,
  Radio,
  Square,
  Circle,
  ArrowUpRight,
  RotateCcw,
  Trash2,
  Plus,
  Pin,
  X,
  Palette,
  Users,
  Eye,
  Sparkles,
} from 'lucide-react';
import {
  AnnotationStroke,
  AnnotationPoint,
  AnnotationTool,
  StickyNote,
  ParticipantCursor,
} from '../types.ts';
import { studioRealtime } from '../lib/studioRealtime.ts';

interface CameraAnnotationLayerProps {
  roomId?: string;
  isRecording?: boolean;
  enabled: boolean;
  onToggleEnabled: () => void;
  onNotify: (title: string, desc: string, type?: 'info' | 'success' | 'warning' | 'error' | 'admin') => void;
}

const PALETTE_COLORS = [
  { hex: '#06b6d4', name: 'Cyan' },
  { hex: '#ec4899', name: 'Pink' },
  { hex: '#eab308', name: 'Yellow' },
  { hex: '#10b981', name: 'Green' },
  { hex: '#8b5cf6', name: 'Purple' },
  { hex: '#ef4444', name: 'Red' },
  { hex: '#ffffff', name: 'White' },
];

const STICKY_COLORS = [
  { bg: 'bg-cyan-950/90 border-cyan-400/80 text-cyan-100', hex: '#06b6d4', name: 'Cyan' },
  { bg: 'bg-amber-950/90 border-amber-400/80 text-amber-100', hex: '#eab308', name: 'Amber' },
  { bg: 'bg-rose-950/90 border-rose-400/80 text-rose-100', hex: '#ec4899', name: 'Rose' },
  { bg: 'bg-emerald-950/90 border-emerald-400/80 text-emerald-100', hex: '#10b981', name: 'Emerald' },
  { bg: 'bg-purple-950/90 border-purple-400/80 text-purple-100', hex: '#8b5cf6', name: 'Purple' },
];

export const CameraAnnotationLayer: React.FC<CameraAnnotationLayerProps> = ({
  isRecording = false,
  enabled,
  onToggleEnabled,
  onNotify,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tools & Styling State
  const [activeTool, setActiveTool] = useState<AnnotationTool>('pen');
  const [activeColor, setActiveColor] = useState<string>('#06b6d4');
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [strokes, setStrokes] = useState<AnnotationStroke[]>([]);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [participants, setParticipants] = useState<ParticipantCursor[]>([]);
  const [wsConnected, setWsConnected] = useState<boolean>(studioRealtime.getIsConnected());
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState<boolean>(false);

  // Drawing state
  const isDrawingRef = useRef<boolean>(false);
  const currentPointsRef = useRef<AnnotationPoint[]>([]);
  const laserDecayTimerRef = useRef<number | null>(null);

  // Dragging Sticky Note state
  const draggingStickyRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  // Subscribe to WebSocket real-time events
  useEffect(() => {
    studioRealtime.setCallbacks({
      onConnectionChange: (connected) => {
        setWsConnected(connected);
      },
      onRoomInit: (data) => {
        setStrokes(data.strokes);
        setStickyNotes(data.stickyNotes);
        setParticipants(data.participants);
      },
      onStrokeAdd: (stroke) => {
        setStrokes((prev) => {
          if (prev.some((s) => s.id === stroke.id)) return prev;
          return [...prev, stroke];
        });
      },
      onStrokeUndo: (strokeId, userId) => {
        setStrokes((prev) => {
          if (strokeId) return prev.filter((s) => s.id !== strokeId);
          if (userId) {
            const copy = [...prev];
            for (let i = copy.length - 1; i >= 0; i--) {
              if (copy[i].userId === userId) {
                copy.splice(i, 1);
                break;
              }
            }
            return copy;
          }
          return prev;
        });
      },
      onAnnotationClear: (userId) => {
        setStrokes((prev) => (userId ? prev.filter((s) => s.userId !== userId) : []));
      },
      onStickyAdd: (note) => {
        setStickyNotes((prev) => {
          if (prev.some((n) => n.id === note.id)) return prev;
          return [...prev, note];
        });
      },
      onStickyUpdate: (note) => {
        setStickyNotes((prev) =>
          prev.map((n) => (n.id === note.id ? { ...n, ...note } : n))
        );
      },
      onStickyDelete: (noteId) => {
        setStickyNotes((prev) => prev.filter((n) => n.id !== noteId));
      },
      onCursorMove: (cursor) => {
        setParticipants((prev) => {
          const idx = prev.findIndex((p) => p.userId === cursor.userId);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = cursor;
            return updated;
          }
          return [...prev, cursor];
        });
      },
      onUserJoined: (user) => {
        setParticipants((prev) => {
          if (prev.some((p) => p.userId === user.userId)) return prev;
          return [...prev, user];
        });
        onNotify('Collaborator Joined 👥', `${user.userName} connected to live session.`, 'info');
      },
      onUserLeft: (userId) => {
        setParticipants((prev) => prev.filter((p) => p.userId !== userId));
      },
    });

    return () => {
      if (laserDecayTimerRef.current) cancelAnimationFrame(laserDecayTimerRef.current);
    };
  }, [onNotify]);

  // Redraw Canvas on strokes or container resize
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const now = Date.now();

    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;

      ctx.save();
      ctx.beginPath();

      const startX = stroke.points[0].x * canvas.width;
      const startY = stroke.points[0].y * canvas.height;
      ctx.moveTo(startX, startY);

      if (stroke.tool === 'highlighter') {
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = stroke.width * 2.5;
        ctx.lineCap = 'square';
        ctx.lineJoin = 'miter';
      } else if (stroke.tool === 'laser') {
        // Laser pointer with glow and decaying opacity
        const ageMs = now - stroke.timestamp;
        const fade = Math.max(0.1, 1 - ageMs / 3000);
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = fade * 0.9;
        ctx.lineWidth = stroke.width * 1.5;
        ctx.shadowColor = stroke.color;
        ctx.shadowBlur = 12;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      } else {
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = stroke.opacity || 1.0;
        ctx.lineWidth = stroke.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }

      if (stroke.tool === 'arrow') {
        const endP = stroke.points[stroke.points.length - 1];
        const endX = endP.x * canvas.width;
        const endY = endP.y * canvas.height;
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(endY - startY, endX - startX);
        const headLen = 14 + stroke.width;
        ctx.fillStyle = stroke.color;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - headLen * Math.cos(angle - Math.PI / 6),
          endY - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          endX - headLen * Math.cos(angle + Math.PI / 6),
          endY - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        return;
      } else if (stroke.tool === 'rect') {
        const endP = stroke.points[stroke.points.length - 1];
        const endX = endP.x * canvas.width;
        const endY = endP.y * canvas.height;
        ctx.strokeRect(startX, startY, endX - startX, endY - startY);
        ctx.restore();
        return;
      } else if (stroke.tool === 'circle') {
        const endP = stroke.points[stroke.points.length - 1];
        const endX = endP.x * canvas.width;
        const endY = endP.y * canvas.height;
        const rx = Math.abs(endX - startX) / 2;
        const ry = Math.abs(endY - startY) / 2;
        const cx = Math.min(startX, endX) + rx;
        const cy = Math.min(startY, endY) + ry;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx || 1, ry || 1, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        return;
      }

      for (let i = 1; i < stroke.points.length; i++) {
        const pX = stroke.points[i].x * canvas.width;
        const pY = stroke.points[i].y * canvas.height;
        ctx.lineTo(pX, pY);
      }

      ctx.stroke();
      ctx.restore();
    });
  }, [strokes]);

  // Keep canvas resolution synced to container element
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current && canvasRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
        renderCanvas();
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [renderCanvas]);

  useEffect(() => {
    renderCanvas();
  }, [strokes, renderCanvas]);

  // Pointer event handlers for collaborative drawing
  const getNormalizedCoords = (e: React.PointerEvent<HTMLCanvasElement>): AnnotationPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!enabled) return;
    isDrawingRef.current = true;
    const pt = getNormalizedCoords(e);
    currentPointsRef.current = [pt];

    // Broadcast cursor position with drawing state
    studioRealtime.sendCursor(pt.x * 100, pt.y * 100, true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = getNormalizedCoords(e);

    if (isDrawingRef.current) {
      currentPointsRef.current.push(pt);

      // Temporary local preview stroke
      const user = studioRealtime.getCurrentUser();
      const currentStroke: AnnotationStroke = {
        id: 'preview_stroke',
        userId: user.id,
        userName: user.name,
        userColor: user.color,
        tool: activeTool,
        color: activeColor,
        width: strokeWidth,
        opacity: activeTool === 'highlighter' ? 0.45 : 1.0,
        points: [...currentPointsRef.current],
        timestamp: Date.now(),
      };

      setStrokes((prev) => [
        ...prev.filter((s) => s.id !== 'preview_stroke'),
        currentStroke,
      ]);
    }

    studioRealtime.sendCursor(pt.x * 100, pt.y * 100, isDrawingRef.current);
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (currentPointsRef.current.length >= 2) {
      const user = studioRealtime.getCurrentUser();
      const newStroke: AnnotationStroke = {
        id: `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        userId: user.id,
        userName: user.name,
        userColor: user.color,
        tool: activeTool,
        color: activeColor,
        width: strokeWidth,
        opacity: activeTool === 'highlighter' ? 0.45 : 1.0,
        points: [...currentPointsRef.current],
        timestamp: Date.now(),
      };

      setStrokes((prev) => [...prev.filter((s) => s.id !== 'preview_stroke'), newStroke]);
      studioRealtime.sendStroke(newStroke);
    } else {
      setStrokes((prev) => prev.filter((s) => s.id !== 'preview_stroke'));
    }

    currentPointsRef.current = [];
  };

  // Sticky Note handlers
  const handleAddStickyNote = (colorHex: string = '#06b6d4') => {
    const user = studioRealtime.getCurrentUser();
    const newNote: StickyNote = {
      id: `sticky_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId: user.id,
      userName: user.name,
      userColor: user.color,
      x: 35 + Math.random() * 20,
      y: 30 + Math.random() * 20,
      text: '📌 Presentation note / key topic...',
      color: colorHex,
      timestamp: Date.now(),
      pinned: false,
    };

    setStickyNotes((prev) => [...prev, newNote]);
    studioRealtime.addStickyNote(newNote);
    onNotify('Sticky Note Added 📌', 'Pinned collaborative note on video feed.', 'success');
  };

  const handleUpdateStickyText = (id: string, text: string) => {
    setStickyNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)));
    studioRealtime.updateStickyNote({ id, text });
  };

  const handleDeleteSticky = (id: string) => {
    setStickyNotes((prev) => prev.filter((n) => n.id !== id));
    studioRealtime.deleteStickyNote(id);
  };

  const handleToggleStickyPin = (id: string) => {
    setStickyNotes((prev) => {
      const target = prev.find((n) => n.id === id);
      if (!target) return prev;
      const pinned = !target.pinned;
      studioRealtime.updateStickyNote({ id, pinned });
      return prev.map((n) => (n.id === id ? { ...n, pinned } : n));
    });
  };

  const handleStickyDragStart = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    draggingStickyRef.current = {
      id,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (!draggingStickyRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(85, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(5, Math.min(85, ((e.clientY - rect.top) / rect.height) * 100));

    const id = draggingStickyRef.current.id;
    setStickyNotes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
    studioRealtime.updateStickyNote({ id, x, y });
  };

  const handleContainerMouseUp = () => {
    draggingStickyRef.current = null;
  };

  const handleUndo = () => {
    const user = studioRealtime.getCurrentUser();
    studioRealtime.undoStroke();
    setStrokes((prev) => {
      const copy = [...prev];
      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i].userId === user.id) {
          copy.splice(i, 1);
          break;
        }
      }
      return copy;
    });
  };

  const handleClearAll = () => {
    studioRealtime.clearAnnotations(true);
    setStrokes([]);
    onNotify('Annotations Cleared', 'Removed all collaborative strokes.', 'info');
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleContainerMouseMove}
      onMouseUp={handleContainerMouseUp}
      className={`absolute inset-0 z-20 pointer-events-none select-none ${
        enabled ? 'cursor-crosshair' : ''
      }`}
    >
      {/* 1. Real-time Drawing Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`w-full h-full ${enabled ? 'pointer-events-auto' : 'pointer-events-none'}`}
      />

      {/* 2. Participant Live Cursors on Feed */}
      {participants
        .filter((p) => p.userId !== studioRealtime.getCurrentUser().id && Date.now() - p.lastActive < 10000)
        .map((p) => (
          <div
            key={p.userId}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            className="absolute -translate-x-1 -translate-y-1 pointer-events-none transition-all duration-75 flex items-center gap-1.5 z-30"
          >
            <div
              className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg animate-pulse"
              style={{ backgroundColor: p.userColor }}
            />
            <span
              className="px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white shadow-md backdrop-blur-md"
              style={{ backgroundColor: p.userColor }}
            >
              {p.userName} {p.isDrawing ? '✏️' : ''}
            </span>
          </div>
        ))}

      {/* 3. Collaborative Sticky Notes Layer */}
      {stickyNotes.map((note) => {
        const theme =
          STICKY_COLORS.find((c) => c.hex.toLowerCase() === note.color?.toLowerCase()) ||
          STICKY_COLORS[0];

        return (
          <div
            key={note.id}
            style={{ left: `${note.x}%`, top: `${note.y}%` }}
            className={`absolute pointer-events-auto w-52 sm:w-60 p-2.5 rounded-2xl border shadow-2xl backdrop-blur-xl transition-shadow ${theme.bg} ${
              note.pinned ? 'ring-2 ring-cyan-400/60 shadow-cyan-500/20' : 'hover:shadow-lg'
            }`}
          >
            {/* Sticky Header & Drag Handle */}
            <div
              onMouseDown={(e) => handleStickyDragStart(note.id, e)}
              className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10 cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center gap-1.5 text-[10px] font-bold truncate">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: note.userColor }}
                />
                <span className="truncate">{note.userName}</span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleStickyPin(note.id)}
                  className={`p-1 rounded-lg transition-colors ${
                    note.pinned ? 'text-cyan-300 bg-cyan-950/60' : 'text-slate-400 hover:text-white'
                  }`}
                  title={note.pinned ? 'Pinned on feed' : 'Pin Note'}
                >
                  <Pin className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSticky(note.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                  title="Delete Note"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Editable Note Text Area */}
            <textarea
              value={note.text}
              onChange={(e) => handleUpdateStickyText(note.id, e.target.value)}
              rows={3}
              placeholder="Write live presenter notes..."
              className="w-full bg-transparent border-none text-xs leading-relaxed resize-none focus:outline-none placeholder:text-white/40 font-medium font-sans"
            />

            {/* Footer timestamp */}
            <div className="text-[8px] opacity-60 text-right font-mono mt-0.5">
              {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        );
      })}

      {/* 4. FLOATING COLLABORATIVE ANNOTATION TOOLBAR (TOP-LEFT / BOTTOM) */}
      <div className="absolute top-4 left-4 z-30 pointer-events-auto flex flex-col gap-2">
        {/* Toggle Master Annotation Badge */}
        <div className="flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-800 shadow-2xl">
          <button
            type="button"
            onClick={onToggleEnabled}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              enabled
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
            title="Toggle Collaborative Annotation Layer"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>{enabled ? 'Annotations ON' : 'Draw / Annotate'}</span>
          </button>

          {/* WebSocket Live Connection Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-[10px] font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-300 font-bold hidden sm:inline">
              {wsConnected ? 'Live Collab' : 'Reconnecting'}
            </span>
            <span className="text-cyan-400 font-bold">
              ({participants.length || 1} <Users className="w-3 h-3 inline -mt-0.5" />)
            </span>
          </div>

          {enabled && (
            <button
              type="button"
              onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-colors"
              title="Collapse / Expand Tools"
            >
              {isToolbarCollapsed ? '⚙️' : '✕'}
            </button>
          )}
        </div>

        {/* Expanded Drawing & Sticky Tools Tray */}
        {enabled && !isToolbarCollapsed && (
          <div className="p-2.5 rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-cyan-500/40 shadow-2xl space-y-2.5 max-w-[340px] animate-in fade-in zoom-in-95 duration-150">
            {/* Tool Type Selector Buttons */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Drawing Tools
              </div>
              <div className="grid grid-cols-6 gap-1">
                {[
                  { id: 'pen', label: 'Pen', icon: PenTool },
                  { id: 'highlighter', label: 'Highlight', icon: Highlighter },
                  { id: 'laser', label: 'Laser', icon: Radio },
                  { id: 'arrow', label: 'Arrow', icon: ArrowUpRight },
                  { id: 'rect', label: 'Box', icon: Square },
                  { id: 'circle', label: 'Circle', icon: Circle },
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTool(t.id as AnnotationTool)}
                      className={`p-2 rounded-xl text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                        activeTool === t.id
                          ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-black shadow-md'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                      title={t.label}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Palette & Brush Size Row */}
            <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-slate-400">Color & Stroke Width</span>
                <span className="font-mono text-cyan-400 font-bold">{strokeWidth}px</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                {/* Palette Swatches */}
                <div className="flex items-center gap-1">
                  {PALETTE_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setActiveColor(c.hex)}
                      className={`w-5 h-5 rounded-full border transition-all ${
                        activeColor.toLowerCase() === c.hex.toLowerCase()
                          ? 'border-white ring-2 ring-cyan-400 shadow-md scale-110'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>

                {/* Brush Width Slider */}
                <input
                  type="range"
                  min="2"
                  max="20"
                  step="1"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                  className="w-20 accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>

            {/* Sticky Notes & Action Buttons */}
            <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-800/80 text-[10px]">
              <button
                type="button"
                onClick={() => handleAddStickyNote(activeColor)}
                className="px-2.5 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 font-bold flex items-center gap-1 transition-all"
                title="Add Collaborative Sticky Note"
              >
                <Plus className="w-3 h-3" />
                <span>Sticky Note</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={strokes.length === 0}
                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 border border-slate-800 transition-colors"
                  title="Undo Last Stroke"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>

                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={strokes.length === 0}
                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 disabled:opacity-40 border border-slate-800 transition-colors"
                  title="Clear All Annotations"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

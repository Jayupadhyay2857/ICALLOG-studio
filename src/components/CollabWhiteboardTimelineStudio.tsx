import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Download,
  Share2,
  Layers,
  Sparkles,
  Palette,
  Maximize2,
  RotateCcw,
  Play,
  Award,
  Kanban,
  FileSpreadsheet,
} from 'lucide-react';
import { UserProfile, ActiveTab } from '../types.ts';
import { safeDownloadMedia } from '../lib/downloadHelper.ts';

interface CollabWhiteboardTimelineStudioProps {
  user: UserProfile;
  setActiveTab?: (tab: ActiveTab) => void;
  onNotify: (title: string, desc: string, type?: 'info' | 'success' | 'warning' | 'error' | 'admin') => void;
}

export interface ProjectTask {
  id: string;
  title: string;
  phase: string;
  progress: number; // 0 to 100
  startDate: string;
  dueDate: string;
  status: 'completed' | 'in_progress' | 'planning';
  assignee: string;
}

export interface StickyNote {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
}

export const CollabWhiteboardTimelineStudio: React.FC<CollabWhiteboardTimelineStudioProps> = ({
  user,
  setActiveTab,
  onNotify,
}) => {
  const [subView, setSubView] = useState<'whiteboard' | 'timeline'>('whiteboard');

  /* --------------------------------------------------------------------------
     PROJECT TIMELINE / GANTT STATE
     -------------------------------------------------------------------------- */
  const [tasks, setTasks] = useState<ProjectTask[]>([
    {
      id: 'task_1',
      title: 'Concept, Script & Storyboarding',
      phase: 'Phase 1: Pre-Production',
      progress: 100,
      startDate: '2026-10-01',
      dueDate: '2026-10-05',
      status: 'completed',
      assignee: 'Jay Upadhyay (Director)',
    },
    {
      id: 'task_2',
      title: 'AI Video & Voice Generation',
      phase: 'Phase 2: Production',
      progress: 75,
      startDate: '2026-10-06',
      dueDate: '2026-10-12',
      status: 'in_progress',
      assignee: 'AI Neural Engine',
    },
    {
      id: 'task_3',
      title: '3D WebGL & Game Maker Arcade',
      phase: 'Phase 3: Interactive Suite',
      progress: 60,
      startDate: '2026-10-10',
      dueDate: '2026-10-18',
      status: 'in_progress',
      assignee: '3D Graphics Team',
    },
    {
      id: 'task_4',
      title: 'Global Payments & Vault Security',
      phase: 'Phase 4: Monetization',
      progress: 40,
      startDate: '2026-10-15',
      dueDate: '2026-10-25',
      status: 'planning',
      assignee: 'Finance & Security',
    },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPhase, setNewTaskPhase] = useState('Phase 2: Production');
  const [newTaskAssignee, setNewTaskAssignee] = useState(user.name || 'Lead Creator');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: ProjectTask = {
      id: `task_${Date.now()}`,
      title: newTaskTitle.trim(),
      phase: newTaskPhase,
      progress: 10,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'in_progress',
      assignee: newTaskAssignee,
    };

    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    onNotify('📅 Milestone Added', `"${newTask.title}" added to project timeline.`, 'success');
  };

  const handleExportTimelineJson = () => {
    const json = JSON.stringify({ projectTitle: 'iCALLOG Master Schedule', tasks }, null, 2);
    safeDownloadMedia(json, `project_timeline_gantt_${Date.now()}.json`, {
      type: 'json',
      mimeType: 'application/json',
      onNotify,
    });
  };

  /* --------------------------------------------------------------------------
     COLLABORATIVE WHITEBOARD STATE
     -------------------------------------------------------------------------- */
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawTool, setDrawTool] = useState<'pen' | 'eraser' | 'rect' | 'circle'>('pen');
  const [brushColor, setBrushColor] = useState('#06b6d4');
  const [brushSize, setBrushSize] = useState(4);

  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([
    { id: 'sn_1', x: 80, y: 80, text: 'Brainstorm 3D Game Level Design 🚀', color: '#f59e0b' },
    { id: 'sn_2', x: 320, y: 120, text: 'Review 8K Film Render Output 🎬', color: '#06b6d4' },
  ]);
  const [newNoteText, setNewNoteText] = useState('');

  const handleAddStickyNote = () => {
    if (!newNoteText.trim()) return;
    const colors = ['#f59e0b', '#06b6d4', '#ec4899', '#22c55e', '#8b5cf6'];
    const note: StickyNote = {
      id: `sn_${Date.now()}`,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 150,
      text: newNoteText.trim(),
      color: colors[Math.floor(Math.random() * colors.length)],
    };
    setStickyNotes([...stickyNotes, note]);
    setNewNoteText('');
    onNotify('📌 Sticky Note Added', 'New collaborative note pinned to board.', 'info');
  };

  const handleClearWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onNotify('Whiteboard Cleared', 'Canvas reset successfully.', 'info');
  };

  const handleExportWhiteboardPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    safeDownloadMedia(dataUrl, `collaborative_whiteboard_${Date.now()}.png`, {
      type: 'image',
      onNotify,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. Hero Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950/80 to-purple-950/60 border border-indigo-500/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
                <Kanban className="w-3.5 h-3.5" />
                <span>Multiplayer Workspace & Gantt Suite</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono font-bold">
                👥 Real-Time Collaboration
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-['Syne'] tracking-tight flex items-center gap-3">
              <span>📋</span>
              <span>Collaborative Whiteboard & Project Timelines</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Plan, sketch, brainstorm, and track milestones with interactive Gantt project timelines and real-time multiplayer whiteboard sticky notes.
            </p>
          </div>

          {/* Subview Selector */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shrink-0">
            <button
              onClick={() => setSubView('whiteboard')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                subView === 'whiteboard'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Whiteboard</span>
            </button>
            <button
              onClick={() => setSubView('timeline')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                subView === 'timeline'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Project Timelines</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBVIEW A: COLLABORATIVE WHITEBOARD */}
      {/* ========================================================================= */}
      {subView === 'whiteboard' && (
        <div className="space-y-4">
          {/* Whiteboard Toolbar */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setDrawTool('pen')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  drawTool === 'pen' ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-300'
                }`}
              >
                Pen
              </button>
              <button
                onClick={() => setDrawTool('eraser')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  drawTool === 'eraser' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                Eraser
              </button>

              <div className="h-5 w-[1px] bg-slate-800 mx-1" />

              {['#06b6d4', '#ec4899', '#22c55e', '#eab308', '#ffffff'].map((c) => (
                <button
                  key={c}
                  onClick={() => setBrushColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                    brushColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-75'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleClearWhiteboard}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
              <button
                onClick={handleExportWhiteboardPng}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Board .PNG</span>
              </button>
            </div>
          </div>

          {/* Canvas Viewport + Sticky Notes */}
          <div className="relative rounded-3xl bg-slate-950 border border-slate-800 p-2 overflow-hidden shadow-2xl">
            <canvas
              ref={canvasRef}
              width={800}
              height={450}
              className="w-full max-w-full h-auto aspect-[16/9] rounded-2xl bg-[#060a12] cursor-crosshair border border-slate-800/80"
              onMouseDown={(e) => {
                setIsDrawing(true);
                const canvas = canvasRef.current;
                if (!canvas) return;
                const rect = canvas.getBoundingClientRect();
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                ctx.beginPath();
                ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
              }}
              onMouseUp={() => setIsDrawing(false)}
              onMouseMove={(e) => {
                if (!isDrawing) return;
                const canvas = canvasRef.current;
                if (!canvas) return;
                const rect = canvas.getBoundingClientRect();
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                ctx.strokeStyle = drawTool === 'eraser' ? '#060a12' : brushColor;
                ctx.lineWidth = drawTool === 'eraser' ? 24 : brushSize;
                ctx.lineCap = 'round';
                ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
                ctx.stroke();
              }}
            />

            {/* Sticky Notes Overlay */}
            {stickyNotes.map((note) => (
              <div
                key={note.id}
                style={{
                  left: `${note.x}px`,
                  top: `${note.y}px`,
                  backgroundColor: note.color,
                }}
                className="absolute p-3 rounded-xl text-slate-950 font-bold text-xs shadow-xl w-44 flex flex-col justify-between cursor-move select-none border border-black/20"
              >
                <div>{note.text}</div>
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => setStickyNotes(stickyNotes.filter((n) => n.id !== note.id))}
                    className="text-[10px] text-slate-900 hover:text-rose-900 font-mono"
                  >
                    [delete]
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Sticky Note Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Pin a sticky note to the whiteboard..."
              className="flex-1 px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={handleAddStickyNote}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-md"
            >
              Pin Note
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBVIEW B: PROJECT TIMELINES & GANTT */}
      {/* ========================================================================= */}
      {subView === 'timeline' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-['Syne'] flex items-center gap-2">
                  <Kanban className="w-5 h-5 text-indigo-400" />
                  <span>Project Milestones & Gantt Schedule</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Track production phases, deadlines, progress percentages, and assignees.
                </p>
              </div>

              <button
                onClick={handleExportTimelineJson}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Export Schedule .JSON</span>
              </button>
            </div>

            {/* Task Add Form */}
            <form onSubmit={handleAddTask} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="New Milestone Title..."
                className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                required
              />
              <select
                value={newTaskPhase}
                onChange={(e) => setNewTaskPhase(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="Phase 1: Pre-Production">Phase 1: Pre-Production</option>
                <option value="Phase 2: Production">Phase 2: Production</option>
                <option value="Phase 3: Interactive Suite">Phase 3: Interactive Suite</option>
                <option value="Phase 4: Monetization">Phase 4: Monetization</option>
              </select>
              <input
                type="text"
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
                placeholder="Assignee Name..."
                className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Add Milestone</span>
              </button>
            </form>

            {/* Task List / Gantt Rows */}
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                        {task.phase}
                      </span>
                      <h4 className="text-sm font-bold text-white">{task.title}</h4>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-slate-400">Assignee: <strong className="text-slate-200">{task.assignee}</strong></span>
                      <span className="text-cyan-400">{task.progress}%</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden">
                    <div
                      style={{ width: `${task.progress}%` }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Start: {task.startDate}</span>
                    <span>Due: {task.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
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
}

export const LiveCollabCanvasStudio: React.FC<LiveCollabCanvasStudioProps> = ({ user, onNotify }) => {
  const [roomId, setRoomId] = useState('icallog-room-8821');
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTool, setActiveTool] = useState<'select' | 'pen' | 'note' | '3d_pin' | 'audio_pin'>('note');

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
      x: 80,
      y: 90,
      text: '🎬 Act 1 Climax: Add volumetric neon rain & laser katana particle flare here!',
      author: 'Sarah (VFX Lead)',
      color: 'bg-pink-500/20 border-pink-400 text-pink-200',
    },
    {
      id: 'n_2',
      x: 360,
      y: 110,
      text: '🎵 Audio Beat Drop: 128 BPM Synthwave bassline synced to character leap.',
      author: 'Alex (Audio Soundstage)',
      color: 'bg-emerald-500/20 border-emerald-400 text-emerald-200',
    },
    {
      id: 'n_3',
      x: 180,
      y: 280,
      text: '📦 3D Asset: Cyber Dragon GLTF Rig calibrated with 17-bone IK motion.',
      author: 'You (Host)',
      color: 'bg-cyan-500/20 border-cyan-400 text-cyan-200',
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

  const handleAddStickyNote = () => {
    const newNote: CanvasNote = {
      id: `n_${Date.now()}`,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 150,
      text: '✨ New Scene Note: Add cinematic color grading & audio reverb pass.',
      author: user?.name || 'You',
      color: 'bg-indigo-500/20 border-indigo-400 text-indigo-200',
    };
    setNotes([...notes, newNote]);
    onNotify('Sticky Note Placed', 'Added collaborative marker to the canvas.', 'info');
  };

  const handleExportCanvasBoard = () => {
    const exportData = {
      project: 'iCALLOG Live Collab Board',
      roomId,
      membersCount: teamMembers.length,
      notes,
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
                Real-time shared whiteboard, 3D pins, audio stems, and live team chat for studio productions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              type="button"
              onClick={handleCopyInviteLink}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all cursor-pointer shadow-md"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Invite Team Link'}</span>
            </button>
            <button
              type="button"
              onClick={handleExportCanvasBoard}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-950 stroke-[3]" />
              <span>Export Board (.JSON)</span>
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
              <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
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
                  onClick={() => setActiveTool('3d_pin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeTool === '3d_pin' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>3D Object Pin</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTool('audio_pin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeTool === 'audio_pin' ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>Audio Stem Pin</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddStickyNote}
                className="px-3 py-1.5 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Idea Note</span>
              </button>
            </div>

            {/* Visual Multiplayer Canvas */}
            <div className="relative h-96 rounded-2xl bg-slate-950 border-2 border-slate-800/80 shadow-2xl overflow-hidden group">
              {/* Grid Background */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-30 pointer-events-none" />

              {/* Placed Interactive Notes */}
              {notes.map((note) => (
                <div
                  key={note.id}
                  style={{ top: `${note.y}px`, left: `${note.x}px` }}
                  className={`absolute max-w-xs p-3 rounded-2xl border-2 shadow-2xl backdrop-blur-md cursor-move select-none animate-in fade-in ${note.color}`}
                >
                  <div className="text-[10px] font-mono font-bold uppercase opacity-80 mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {note.author}
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
    </div>
  );
};

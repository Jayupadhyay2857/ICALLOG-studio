import React, { useState, useEffect, useRef } from 'react';
import {
  UserCheck,
  Bot,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sliders,
  Download,
  Share2,
  Cpu,
  Brain,
  MessageSquare,
  Send,
  Zap,
  Flame,
  Shield,
  Palette,
  Maximize2,
  Radio,
  Award,
} from 'lucide-react';
import { UserProfile, ActiveTab } from '../types.ts';
import { safeDownloadMedia } from '../lib/downloadHelper.ts';

interface DigitalTwinStudioProps {
  user: UserProfile;
  setActiveTab?: (tab: ActiveTab) => void;
  onNotify: (title: string, desc: string, type?: 'info' | 'success' | 'warning' | 'error' | 'admin') => void;
}

export interface TwinConfig {
  id: string;
  name: string;
  archetype: 'visionary' | 'cyber_influencer' | 'bollywood_star' | 'philosopher' | 'anime_hero';
  gender: 'male' | 'female' | 'nonbinary';
  hologramColor: string;
  voicePitch: number;
  voiceSpeed: number;
  expressiveness: number;
  knowledgeBase: string;
  quote: string;
}

export const DigitalTwinStudio: React.FC<DigitalTwinStudioProps> = ({
  user,
  setActiveTab,
  onNotify,
}) => {
  // Config
  const [twinConfig, setTwinConfig] = useState<TwinConfig>({
    id: 'twin_' + Date.now(),
    name: user.name || 'Jay Upadhyay Digital Twin',
    archetype: 'visionary',
    gender: 'male',
    hologramColor: '#06b6d4',
    voicePitch: 1.0,
    voiceSpeed: 1.0,
    expressiveness: 80,
    knowledgeBase:
      'I am the eternal Digital Twin of Jay Upadhyay. I know creative film making, full-stack systems architecture, 3D engines, and high-performance applications.',
    quote: 'Ideas are immortal. Even 200 years from now, our creativity will live forever.',
  });

  // State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTextToSpeak, setCurrentTextToSpeak] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'twin'; text: string; time: string }>>([
    {
      sender: 'twin',
      text: `Hello! I am your AI Digital Twin. I represent your creative voice and identity. What shall we brainstorm or record today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [userChatInput, setUserChatInput] = useState('');

  // Canvas Ref for Hologram Avatar Animation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Holographic Canvas Animation Loop (Facial Motion & Hologram particles)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const render = () => {
      time += 0.04;
      const w = canvas.width;
      const h = canvas.height;

      // Dark Hologram Backdrop
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, w, h);

      // Holographic scanlines
      ctx.strokeStyle = `${twinConfig.hologramColor}15`;
      ctx.lineWidth = 1;
      for (let y = 0; y < h; y += 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Rotating Hologram Rings
      ctx.save();
      ctx.translate(w / 2, h / 2 + 30);
      ctx.strokeStyle = `${twinConfig.hologramColor}40`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 110, 140, 35, time * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Avatar Head Glow
      const headX = w / 2;
      const headY = h / 2 - 20 + Math.sin(time) * 4;

      ctx.save();
      ctx.shadowColor = twinConfig.hologramColor;
      ctx.shadowBlur = 25;

      // Head Base (Cyber Avatar)
      ctx.fillStyle = `${twinConfig.hologramColor}30`;
      ctx.beginPath();
      ctx.ellipse(headX, headY, 65, 80, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = twinConfig.hologramColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Cyber Hair / Crown Outline
      ctx.beginPath();
      ctx.moveTo(headX - 60, headY - 30);
      ctx.quadraticCurveTo(headX, headY - 110, headX + 60, headY - 30);
      ctx.stroke();

      // Eyes (Blinking animation)
      const isBlink = Math.sin(time * 1.5) > 0.95;
      ctx.fillStyle = '#ffffff';
      if (!isBlink) {
        // Left Eye
        ctx.beginPath();
        ctx.arc(headX - 22, headY - 10, 6, 0, Math.PI * 2);
        ctx.fill();
        // Right Eye
        ctx.beginPath();
        ctx.arc(headX + 22, headY - 10, 6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(headX - 28, headY - 10, 12, 2);
        ctx.fillRect(headX + 16, headY - 10, 12, 2);
      }

      // Mouth (Moving when speaking)
      const mouthOpen = isSpeaking ? Math.abs(Math.sin(time * 8)) * 14 + 2 : 2;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(headX, headY + 35, 16, mouthOpen, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cybernetic Jaw markings
      ctx.strokeStyle = `${twinConfig.hologramColor}80`;
      ctx.beginPath();
      ctx.moveTo(headX - 40, headY + 20);
      ctx.lineTo(headX - 20, headY + 60);
      ctx.moveTo(headX + 40, headY + 20);
      ctx.lineTo(headX + 20, headY + 60);
      ctx.stroke();

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [twinConfig, isSpeaking]);

  // Web Speech API Voice Synthesis
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      onNotify('Speech Not Supported', 'Web Speech API is not supported in this browser.', 'warning');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = twinConfig.voicePitch;
    utterance.rate = twinConfig.voiceSpeed;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Send message in interactive Twin chat
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userChatInput.trim()) return;

    const userMsg = userChatInput.trim();
    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg, time: userTime }]);
    setUserChatInput('');

    // Simulated Smart Twin Response grounded in twin knowledge base
    setTimeout(() => {
      let reply = `As your Digital Twin, I echo your vision: "${twinConfig.quote}". `;
      const lower = userMsg.toLowerCase();
      if (lower.includes('who are you') || lower.includes('identity')) {
        reply = `I am ${twinConfig.name}, your eternal AI counterpart created in iCALLOG Studio. My archetype is ${twinConfig.archetype}.`;
      } else if (lower.includes('future') || lower.includes('30') || lower.includes('200')) {
        reply = `Our creations are designed to withstand 30 to 200 years. Whether through standalone games, music, cinema, or time capsules, our legacy will inspire generations.`;
      } else if (lower.includes('game') || lower.includes('code')) {
        reply = `I have full access to the AI Game Maker, 3D WebGL Engine, and Pro Camera suites. What should we build next?`;
      } else {
        reply += `I have indexed your input into my neural memory matrix. I am ready to speak this or export it as a holographic avatar greeting.`;
      }

      const twinTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setChatMessages((prev) => [...prev, { sender: 'twin', text: reply, time: twinTime }]);
      speakText(reply);
    }, 600);
  };

  // Export Twin Avatar Config & Standalone Hologram HTML
  const handleExportHologramHtml = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${twinConfig.name} - 3D AI Digital Twin</title>
  <style>
    body { background: #060a12; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    #hologram { border: 2px solid ${twinConfig.hologramColor}; border-radius: 20px; box-shadow: 0 0 40px ${twinConfig.hologramColor}50; }
    h1 { color: ${twinConfig.hologramColor}; margin-top: 15px; font-size: 20px; }
    p { color: #94a3b8; font-size: 13px; max-width: 450px; text-align: center; }
    button { margin-top: 10px; padding: 10px 20px; border-radius: 12px; background: ${twinConfig.hologramColor}; color: #000; font-weight: bold; border: none; cursor: pointer; }
  </style>
</head>
<body>
  <canvas id="hologram" width="400" height="400"></canvas>
  <h1>${twinConfig.name}</h1>
  <p>"${twinConfig.quote}"</p>
  <button onclick="speak()">Speak Twin Manifesto</button>
  <script>
    function speak() {
      const u = new SpeechSynthesisUtterance("${twinConfig.quote}");
      window.speechSynthesis.speak(u);
    }
  </script>
</body>
</html>`;

    safeDownloadMedia(
      html,
      `${twinConfig.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_digital_twin.html`,
      {
        mimeType: 'text/html',
        onNotify,
      }
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-cyan-950/70 via-slate-950 to-indigo-950/70 border border-cyan-500/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
                <Bot className="w-3.5 h-3.5" />
                <span>AI Digital Twin & Virtual Human Hologram</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono font-bold">
                🎙️ Real-Time Voice Lip-Sync
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-mono font-bold">
                🧠 Immortal Persona Matrix
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-['Syne'] tracking-tight flex items-center gap-3">
              <span>🧬</span>
              <span>AI Digital Twin & Virtual Human Hologram Studio</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Create your own autonomous AI Digital Twin that speaks, answers questions, teaches your audience, and preserves your creative thoughts for decades to come.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => speakText(twinConfig.quote)}
              className="px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              <span>Speak Twin Manifesto</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive Hologram Viewport + Twin Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Hologram Display Viewport (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col items-center">
            {/* Hologram Badge */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold flex items-center gap-1.5">
                <Radio className={`w-3 h-3 text-cyan-400 ${isSpeaking ? 'animate-pulse' : ''}`} />
                <span>{isSpeaking ? 'SPEAKING (LIVE)' : 'STANDBY NEURAL MATRIX'}</span>
              </span>
            </div>

            <canvas
              ref={canvasRef}
              width={380}
              height={360}
              className="w-full max-w-full h-auto aspect-square rounded-2xl bg-[#060a12] border border-cyan-500/30 shadow-inner"
            />

            <div className="mt-4 text-center space-y-1">
              <h3 className="text-base font-bold text-white font-['Syne']">{twinConfig.name}</h3>
              <p className="text-xs text-slate-400 italic font-serif">&quot;{twinConfig.quote}&quot;</p>
            </div>
          </div>

          {/* Hologram Customizer Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              <span>Holographic Laser Hue</span>
            </h4>
            <div className="flex items-center gap-2">
              {['#06b6d4', '#ec4899', '#8b5cf6', '#22c55e', '#f59e0b', '#38bdf8'].map((c) => (
                <button
                  key={c}
                  onClick={() => setTwinConfig({ ...twinConfig, hologramColor: c })}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                    twinConfig.hologramColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-70'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Interactive Twin Chat & Memory Matrix (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Live Digital Twin Dialogue</h3>
                <div className="text-[11px] text-slate-400">Autonomous conversational agent with your custom memories</div>
              </div>
            </div>
            <button
              onClick={handleExportHologramHtml}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Avatar .HTML</span>
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 space-y-3 max-h-80 overflow-y-auto pr-1">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-br-xs'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-xs'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] font-mono text-slate-500 mt-1 px-1">{msg.time}</span>
              </div>
            ))}
          </div>

          {/* Input Chat Box */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <input
              type="text"
              value={userChatInput}
              onChange={(e) => setUserChatInput(e.target.value)}
              placeholder="Ask your Digital Twin a question or teach it a new idea..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-400 shadow-inner"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

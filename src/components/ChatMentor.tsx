import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Copy,
  Check,
  Code,
  Sparkles,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import { ChatMessage } from '../types.ts';
import { sendChatMessage } from '../lib/api.ts';

interface ChatMentorProps {
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const ChatMentor: React.FC<ChatMentorProps> = ({ onNotify }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      role: 'model',
      content: `### Welcome to iCALLOG AI Mentor & Creative Architect
I am your dedicated technical assistant for **Three.js WebGL graphics**, **8K generative AI pipelines**, **skeletal rigging**, and **full-stack software systems**.

How can I assist your engineering session? Choose a quick prompt below or enter any custom query.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (queryToSend?: string) => {
    const text = queryToSend || inputQuery.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryToSend) setInputQuery('');
    setIsLoading(true);

    try {
      const res = await sendChatMessage(text);
      const modelMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        content: res.text,
        codeSnippet: res.codeSnippet,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Chat error';
      onNotify('Mentor Notice', msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    onNotify('Code Copied', 'Copied snippet to clipboard!', 'success');
  };

  const quickPrompts = [
    'How do I implement inverse kinematics in Three.js bones?',
    'Write a GLSL fragment shader for a cyberpunk neon hologram',
    'Explain the 8K latent diffusion pipeline parameters',
    'How does the BullMQ Redis queue handle async video encoding?',
  ];

  return (
    <div id="chat-mentor-container" className="h-[600px] flex flex-col rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
              <span>iCALLOG AI Mentor</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </h3>
            <p className="text-[10px] text-slate-400">Context Memory Active • Powered by Gemini 2.5 Flash</p>
          </div>
        </div>

        <div className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400">
          Latency: ~180ms
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isModel = m.role === 'model';
          return (
            <div key={m.id} className={`flex gap-3 ${isModel ? 'items-start' : 'items-start flex-row-reverse'}`}>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs ${
                  isModel ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-200'
                }`}
              >
                {isModel ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-2xl p-4 rounded-2xl text-xs space-y-2 leading-relaxed ${
                  isModel
                    ? 'bg-slate-950/80 border border-slate-800 text-slate-200 shadow-md'
                    : 'bg-indigo-600 text-white shadow-md'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{m.content}</div>

                {m.codeSnippet && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-slate-700/80 bg-[#080c14]">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[10px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1.5">
                        <Terminal className="w-3 h-3 text-cyan-400" /> code-snippet
                      </span>
                      <button
                        onClick={() => copyCode(m.codeSnippet!, m.id)}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                      >
                        {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-3 text-[11px] font-mono text-cyan-300 overflow-x-auto">
                      <code>{m.codeSnippet}</code>
                    </pre>
                  </div>
                )}

                <div className={`text-[9px] font-mono mt-1 ${isModel ? 'text-slate-500' : 'text-indigo-200'}`}>
                  {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>Synthesizing engineering response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(qp)}
            className="flex-shrink-0 px-3 py-1 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors border border-slate-700/60"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
        <input
          id="mentor-chat-input"
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask the AI Mentor about 3D WebGL, shaders, 8K diffusion, or code architecture..."
          className="flex-1 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          id="send-mentor-chat-btn"
          disabled={isLoading || !inputQuery.trim()}
          onClick={() => handleSend()}
          className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md disabled:opacity-40 hover:scale-105 transition-transform"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  X,
  KeyRound,
  ShieldAlert,
  CheckCircle,
  Crown,
  Lock,
  Sparkles,
  Zap,
  Eye,
  EyeOff,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { submitAdminOverride } from '../lib/api.ts';
import { UserProfile } from '../types.ts';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOverrideSuccess: (updatedUser: UserProfile) => void;
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error' | 'admin') => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onOverrideSuccess,
  onNotify,
}) => {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await submitAdminOverride(passcode.trim());

      // Trigger confetti celebration
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#4f46e5', '#f59e0b', '#10b981'],
      });

      onOverrideSuccess(res.user);
      onNotify('ADMIN AUTHENTICATED', 'Unlimited tokens and VIP Diamond override granted!', 'admin');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Passcode rejected';
      onNotify('Security Alert', msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-amber-500/40 shadow-2xl shadow-amber-500/10 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-black shadow-lg shadow-amber-500/25">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white font-['Syne'] flex items-center gap-2">
                <span>Secret Admin Override</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                  AES-256
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Validate Master Key for Unlimited Access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Creator Security Protocol V18</p>
              <p className="text-[11px] text-amber-300/80">
                Enter your secret master administrator passcode to authenticate VIP access and unlock +999,999 tokens.
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Master Admin Passcode
            </label>
            <div className="relative">
              <input
                id="admin-passcode-input"
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter secret passcode..."
                className="w-full p-3 pr-10 rounded-2xl bg-slate-950 border border-slate-800 text-sm font-mono text-cyan-400 tracking-wider focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                title={showPasscode ? 'Hide Passcode' : 'Show Passcode'}
              >
                {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="submit-admin-passcode-btn"
            type="submit"
            disabled={isSubmitting || !passcode.trim()}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Crown className="w-4 h-4" />
            <span>{isSubmitting ? 'Authenticating AES-256...' : 'Unlock Unlimited VIP Tokens'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

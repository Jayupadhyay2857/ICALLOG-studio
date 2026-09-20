// ============================================================================
// Custom Dance & Emote Choreographer Studio Component
// Allows user to create, synthesize with AI, and manually customize 3D dance steps
// ============================================================================

import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  Play,
  Save,
  Trash2,
  Download,
  RotateCcw,
  Zap,
  Flame,
  Music,
  User,
} from 'lucide-react';
import {
  CustomDanceStep,
  PRESET_DANCE_STEPS,
  ArmChoreoStyle,
  LegChoreoStyle,
  HeadBobStyle,
  synthesizeMotionFromPrompt,
  saveUserCustomDances,
} from '../lib/choreographerEngine.ts';

interface CustomChoreographerStudioProps {
  currentStep: CustomDanceStep;
  onChangeStep: (step: CustomDanceStep) => void;
  savedCustomDances: CustomDanceStep[];
  onUpdateSavedDances: (dances: CustomDanceStep[]) => void;
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const CustomChoreographerStudio: React.FC<CustomChoreographerStudioProps> = ({
  currentStep,
  onChangeStep,
  savedCustomDances,
  onUpdateSavedDances,
  onNotify,
}) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [stepName, setStepName] = useState(currentStep.name);
  const [stepHindiName, setStepHindiName] = useState(currentStep.hindiName || '');
  const [stepIcon, setStepIcon] = useState(currentStep.icon || '🕺');

  // AI Prompt Synthesizer
  const handleSynthesize = () => {
    if (!aiPrompt.trim()) return;
    setIsSynthesizing(true);
    setTimeout(() => {
      const generated = synthesizeMotionFromPrompt(aiPrompt);
      onChangeStep(generated);
      setStepName(generated.name);
      setStepHindiName(generated.hindiName || '');
      setStepIcon(generated.icon);
      setIsSynthesizing(false);
      onNotify(
        'Custom Dance Synthesized!',
        `AI motion engine calibrated 17-bone kinematics for "${generated.name}". Playing live in WebGL Viewport!`,
        'success'
      );
    }, 1000);
  };

  // Save current step to user's personal library
  const handleSaveToLibrary = () => {
    const newStepToSave: CustomDanceStep = {
      ...currentStep,
      id: currentStep.id.startsWith('custom_') ? currentStep.id : `custom_${Date.now()}`,
      name: stepName || 'Custom Dance Step',
      hindiName: stepHindiName || 'कस्टम डांस स्टेप',
      icon: stepIcon,
      isCustom: true,
    };

    const existingIndex = savedCustomDances.findIndex((d) => d.id === newStepToSave.id);
    let updated: CustomDanceStep[];
    if (existingIndex >= 0) {
      updated = [...savedCustomDances];
      updated[existingIndex] = newStepToSave;
    } else {
      updated = [newStepToSave, ...savedCustomDances];
    }

    onUpdateSavedDances(updated);
    saveUserCustomDances(updated);
    onChangeStep(newStepToSave);
    onNotify(
      'Dance Step Saved',
      `"${newStepToSave.name}" has been saved to your personal 3D Emote Library!`,
      'success'
    );
  };

  // Delete from user's library
  const handleDeleteStep = (id: string, name: string) => {
    const updated = savedCustomDances.filter((d) => d.id !== id);
    onUpdateSavedDances(updated);
    saveUserCustomDances(updated);
    onNotify('Deleted Step', `Removed "${name}" from your custom library.`, 'info');
  };

  // Export Motion as JSON
  const handleExportMotionJson = () => {
    const motionData = {
      generator: 'iCALLOG 3D Dance Choreographer V18',
      step: currentStep,
      exportedAt: new Date().toISOString(),
      rigFormat: '17_BONE_BIPED_IK',
    };
    const blob = new Blob([JSON.stringify(motionData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `iCALLOG_Motion_${currentStep.name.replace(/\s+/g, '_')}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
    onNotify('Motion Data Exported', 'Downloaded custom kinematics configuration JSON!', 'success');
  };

  return (
    <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-black text-white font-['Syne'] flex items-center gap-2">
            <span className="text-lg">🕺</span> Custom Emote & Dance Step Choreographer (कस्टम डांस मेकर)
          </h3>
          <p className="text-xs text-slate-400">
            Create any dance step from your imagination, synthesize motion with AI, or manually tweak 17-bone joint sliders in real-time!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportMotionJson}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            title="Download Motion JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Motion JSON</span>
          </button>
        </div>
      </div>

      {/* Mode 1: AI Prompt-to-Dance Motion */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-cyan-300 font-['Syne'] flex items-center gap-1.5 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> 1. AI Prompt से मनचाहा नया डांस स्टेप बनाएं
          </label>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
            Real-Time Kinematics Solver
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSynthesize()}
            placeholder="जैसे: 'Bollywood energetic Thumka with fast hand clap & waist swing', 'Michael Jackson moonwalk glide', 'Punjabi Bhangra high knee bounce'..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
          />
          <button
            type="button"
            disabled={isSynthesizing || !aiPrompt.trim()}
            onClick={handleSynthesize}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold font-['Syne'] shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 shrink-0"
          >
            {isSynthesizing ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>AI Generate Step</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Style Chips */}
        <div className="space-y-1">
          <div className="text-[10px] text-slate-400 font-mono">Popular Dance Styles (1-Click Prompt):</div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: '💃 Bollywood Thumka', prompt: 'Bollywood energetic dramatic thumka with waist twist and wave hand' },
              { label: '👳 Punjabi Bhangra', prompt: 'Punjabi Bhangra shoulder bounce with high-knee jumping kicks and cheer hands' },
              { label: '🕺 MJ Moonwalk Glide', prompt: 'Michael Jackson smooth backwards moonwalk glide with hat snap pose' },
              { label: '⚡ Cyberpunk Shuffle', prompt: 'Cyberpunk 160 BPM electronic rave dance with rapid cutting shapes' },
              { label: '✨ K-Pop Idol Point', prompt: 'K-Pop idol razor-sharp synchronized point and waist twirl' },
              { label: '🪘 Garba 360 Spin', prompt: 'Traditional Gujarati Garba 360 degree spin with rhythmic hand claps' },
              { label: '⚔️ Ninja Combat Kata', prompt: 'Martial arts shadow combat kata with karate chops and matrix dodge' },
              { label: '🧢 Hip-Hop Popping', prompt: 'Street hip-hop electric popping wave with heavy chest isolation lock' },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setAiPrompt(preset.prompt);
                  const generated = synthesizeMotionFromPrompt(preset.prompt);
                  onChangeStep(generated);
                  setStepName(generated.name);
                  setStepHindiName(generated.hindiName || '');
                  setStepIcon(generated.icon);
                  onNotify('Dance Applied', `Calibrated 3D skeleton to ${preset.label}!`, 'info');
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-cyan-300 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mode 2: Interactive Motion & Joint Sliders (Manual Choreographer) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sliders Area (Span 8) */}
        <div className="lg:col-span-8 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-amber-300 font-['Syne'] flex items-center gap-1.5 uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-amber-400" /> 2. Manual Joint & Motion Parameter Controls
            </label>
            <span className="text-[10px] text-slate-400 font-mono">
              Tempo: <strong className="text-cyan-400">{currentStep.tempoBpm} BPM</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Rhythm BPM */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex justify-between text-xs text-slate-300 font-semibold">
                <span className="flex items-center gap-1"><Music className="w-3.5 h-3.5 text-indigo-400" /> Dance Tempo (BPM)</span>
                <span className="text-cyan-400 font-mono">{currentStep.tempoBpm} BPM</span>
              </div>
              <input
                type="range"
                min="60"
                max="200"
                step="2"
                value={currentStep.tempoBpm}
                onChange={(e) => onChangeStep({ ...currentStep, tempoBpm: parseInt(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>60 (Slow Slow)</span>
                <span>128 (Standard)</span>
                <span>200 (Hyper)</span>
              </div>
            </div>

            {/* Hip Sway Amplitude */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex justify-between text-xs text-slate-300 font-semibold">
                <span>Hip Sway (कमर लचक)</span>
                <span className="text-cyan-400 font-mono">{currentStep.hipSwayAmp.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.5"
                step="0.1"
                value={currentStep.hipSwayAmp}
                onChange={(e) => onChangeStep({ ...currentStep, hipSwayAmp: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>0.0 (Still)</span>
                <span>0.8 (Moderate)</span>
                <span>1.5 (Extreme Thumka)</span>
              </div>
            </div>

            {/* Torso & Spine Twist */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex justify-between text-xs text-slate-300 font-semibold">
                <span>Torso & Spine Twist</span>
                <span className="text-cyan-400 font-mono">{currentStep.torsoTwist.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.5"
                step="0.1"
                value={currentStep.torsoTwist}
                onChange={(e) => onChangeStep({ ...currentStep, torsoTwist: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>0.0 (Rigid)</span>
                <span>1.5 (Dynamic Spine)</span>
              </div>
            </div>

            {/* Chest Bounce & Pump */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex justify-between text-xs text-slate-300 font-semibold">
                <span>Chest Pump / Bounce</span>
                <span className="text-cyan-400 font-mono">{currentStep.chestPump.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.5"
                step="0.1"
                value={currentStep.chestPump}
                onChange={(e) => onChangeStep({ ...currentStep, chestPump: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>0.0 (Smooth)</span>
                <span>1.5 (Heavy Pop)</span>
              </div>
            </div>
          </div>

          {/* Bone Action Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
            {/* Left Arm */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-semibold">Left Arm Action</label>
              <select
                value={currentStep.lArmChoreo}
                onChange={(e) => onChangeStep({ ...currentStep, lArmChoreo: e.target.value as ArmChoreoStyle })}
                className="w-full py-2 px-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="wave">Wave Swing</option>
                <option value="fist_pump">Fist Pump</option>
                <option value="cheer">Raised Cheer</option>
                <option value="disco_point">Disco Point</option>
                <option value="karate_chop">Karate Chop</option>
                <option value="clap">Hand Clap</option>
                <option value="robot">Robot 90° Angle</option>
                <option value="floss">Floss Swing</option>
              </select>
            </div>

            {/* Right Arm */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-semibold">Right Arm Action</label>
              <select
                value={currentStep.rArmChoreo}
                onChange={(e) => onChangeStep({ ...currentStep, rArmChoreo: e.target.value as ArmChoreoStyle })}
                className="w-full py-2 px-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="disco_point">Disco Point</option>
                <option value="fist_pump">Fist Pump</option>
                <option value="wave">Wave Swing</option>
                <option value="cheer">Raised Cheer</option>
                <option value="karate_chop">Karate Chop</option>
                <option value="clap">Hand Clap</option>
                <option value="robot">Robot 90° Angle</option>
                <option value="floss">Floss Swing</option>
              </select>
            </div>

            {/* Head & Neck */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-semibold">Head Movement</label>
              <select
                value={currentStep.headBobType}
                onChange={(e) => onChangeStep({ ...currentStep, headBobType: e.target.value as HeadBobStyle })}
                className="w-full py-2 px-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="bob">Rhythmic Bob</option>
                <option value="look_around">Look Left & Right</option>
                <option value="nod">Nodding Head</option>
                <option value="spin">360° Continuous Spin</option>
                <option value="still">Locked / Still</option>
              </select>
            </div>

            {/* Leg & Footwork */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-semibold">Leg & Footwork</label>
              <select
                value={currentStep.legAction}
                onChange={(e) => onChangeStep({ ...currentStep, legAction: e.target.value as LegChoreoStyle })}
                className="w-full py-2 px-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="shuffle">Shuffle Glide</option>
                <option value="bhangra_kick">Bhangra High Kick</option>
                <option value="moonwalk_slide">Moonwalk Slide</option>
                <option value="jump_bounce">Jump & Bounce</option>
                <option value="running_man">Running Man</option>
                <option value="wide_squat">Combat Stance</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save & Library Area (Span 4) */}
        <div className="lg:col-span-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <label className="text-xs font-bold text-emerald-400 font-['Syne'] flex items-center gap-1.5 uppercase tracking-wider">
              <Save className="w-3.5 h-3.5" /> 3. Save Custom Dance Step
            </label>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-semibold">Step Title</label>
              <input
                type="text"
                value={stepName}
                onChange={(e) => setStepName(e.target.value)}
                placeholder="e.g. My Signature Dance Move"
                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-semibold">Hindi Title / Subtitle</label>
              <input
                type="text"
                value={stepHindiName}
                onChange={(e) => setStepHindiName(e.target.value)}
                placeholder="उदा. मेरा पसंदीदा डांस स्टेप"
                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-semibold">Choose Emoji Icon</label>
              <div className="flex flex-wrap gap-1.5">
                {['🕺', '💃', '⚡', '👳', '✨', '🤖', '⚔️', '🪘', '🔥', '🏆', '🎉'].map((ico) => (
                  <button
                    key={ico}
                    type="button"
                    onClick={() => setStepIcon(ico)}
                    className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${
                      stepIcon === ico ? 'bg-emerald-600 scale-110 shadow-md' : 'bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    {ico}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveToLibrary}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold font-['Syne'] shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-1.5 transition-all mt-3"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save to 3D Emote Library (सेव करें)</span>
          </button>
        </div>
      </div>

      {/* Preset & Saved Library Grid */}
      <div className="space-y-3 pt-3 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-white font-['Syne'] flex items-center gap-2">
            <span>🎭</span> Studio Presets & Your Custom Steps Library ({PRESET_DANCE_STEPS.length + savedCustomDances.length})
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Click to preview live in WebGL viewport</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {/* User Saved Steps First */}
          {savedCustomDances.map((step) => {
            const isSelected = currentStep.id === step.id;
            return (
              <div
                key={step.id}
                className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2 relative ${
                  isSelected
                    ? 'bg-gradient-to-b from-indigo-950/90 to-slate-900 border-cyan-400 shadow-lg shadow-cyan-950/30'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{step.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-white leading-tight">{step.name}</div>
                      <div className="text-[10px] text-cyan-400">{step.hindiName}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteStep(step.id, step.name)}
                    className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                    title="Delete step"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    ⭐ Custom Step
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onChangeStep(step);
                      setStepName(step.name);
                      setStepHindiName(step.hindiName || '');
                      setStepIcon(step.icon);
                      onNotify('Playing Custom Step', `Armature now playing "${step.name}".`, 'info');
                    }}
                    className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1"
                  >
                    <Play className="w-2.5 h-2.5" /> Apply
                  </button>
                </div>
              </div>
            );
          })}

          {/* Built-in Presets */}
          {PRESET_DANCE_STEPS.map((step) => {
            const isSelected = currentStep.id === step.id;
            return (
              <div
                key={step.id}
                className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-gradient-to-b from-indigo-950/90 to-slate-900 border-cyan-400 shadow-lg shadow-cyan-950/30'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl">{step.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-white leading-tight">{step.name}</div>
                    <div className="text-[10px] text-slate-400">{step.hindiName}</div>
                    <div className="text-[9px] text-slate-500 font-mono mt-0.5">{step.genre} • {step.tempoBpm} BPM</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] font-mono">
                  <span className="text-slate-400">{step.tempoBpm} BPM</span>
                  <button
                    type="button"
                    onClick={() => {
                      onChangeStep(step);
                      setStepName(step.name);
                      setStepHindiName(step.hindiName || '');
                      setStepIcon(step.icon);
                      onNotify('Dance Emote Selected', `Armature now playing ${step.name}.`, 'info');
                    }}
                    className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1"
                  >
                    <Play className="w-2.5 h-2.5" /> Apply
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

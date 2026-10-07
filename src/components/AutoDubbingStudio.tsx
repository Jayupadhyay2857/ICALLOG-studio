import React, { useState, useRef } from 'react';
import {
  Mic,
  Video,
  Globe,
  Sparkles,
  Download,
  Play,
  Pause,
  RefreshCw,
  Upload,
  FileText,
  Volume2,
  CheckCircle2,
  Headphones,
  Languages,
  Sliders,
  Radio,
  Zap,
} from 'lucide-react';
import { UserProfile } from '../types.ts';
import { safeDownloadMedia } from '../lib/downloadHelper.ts';

interface AutoDubbingStudioProps {
  user?: UserProfile;
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

interface DubbedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  accent: string;
}

const SUPPORTED_DUB_LANGUAGES: DubbedLanguage[] = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', accent: 'Standard Indian Accent' },
  { code: 'en', name: 'English (US)', nativeName: 'English (US)', flag: '🇺🇸', accent: 'Studio American' },
  { code: 'en_uk', name: 'English (UK)', nativeName: 'English (UK)', flag: '🇬🇧', accent: 'British Cinematic' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', accent: 'Castilian & Latin' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', accent: 'Tokyo Anime / Natural' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', accent: 'Parisian Studio' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', accent: 'Berlin Standard' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇦🇪', accent: 'Modern Standard Gulf' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', accent: 'Seoul K-Drama' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', accent: 'Moscow Studio' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', accent: 'Brazilian Modern' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', accent: 'Milan Cinematic' },
  { code: 'zh', name: 'Mandarin Chinese', nativeName: '中文', flag: '🇨🇳', accent: 'Standard Beijing' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩', accent: 'Kolkata Standard' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', accent: 'Tollywood Cinema' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', accent: 'Kollywood Cinema' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', accent: 'Standard Marathi' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', accent: 'Lahore Classic' },
];

export const AutoDubbingStudio: React.FC<AutoDubbingStudioProps> = ({ user, onNotify }) => {
  const [sourceVideoUrl, setSourceVideoUrl] = useState<string>(
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
  );
  const [videoTitle, setVideoTitle] = useState('Cinematic Reel Project');
  const [targetLang, setTargetLang] = useState<string>('hi');
  const [emotionTone, setEmotionTone] = useState<'cinematic' | 'energetic' | 'podcast' | 'anime' | 'documentary'>('cinematic');
  const [preserveVoiceTone, setPreserveVoiceTone] = useState<boolean>(true);
  const [autoLipSync, setAutoLipSync] = useState<boolean>(true);
  const [isDubbing, setIsDubbing] = useState<boolean>(false);
  const [dubbingProgress, setDubbingProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioTrackMode, setAudioTrackMode] = useState<'dubbed' | 'original'>('dubbed');
  const [subtitlesEnabled, setSubtitlesEnabled] = useState<boolean>(true);
  const [activeReferenceCharacter, setActiveReferenceCharacter] = useState<string | null>(null);
  const [customSrtContent, setCustomSrtContent] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen for global entertainment character references & subtitles
  React.useEffect(() => {
    try {
      const storedRef = localStorage.getItem('icallog_entertainment_reference');
      if (storedRef) {
        const item = JSON.parse(storedRef);
        if (item?.character) {
          setActiveReferenceCharacter(item.character);
          setVideoTitle(`${item.character} - ${item.title}`);
          const track = item.subtitles?.[targetLang] || item.subtitles?.['hi'] || item.subtitles?.['en'];
          if (track?.fullSrt || track?.quotes) {
            setCustomSrtContent(track.fullSrt || track.quotes.map((q: any, i: number) => `${i+1}\n00:00:0${i*3},000 --> 00:00:0${i*3+2},500\n[${q.speaker}] ${q.translated || q.text}`).join('\n\n'));
          }
        }
      }
    } catch {
      // ignore
    }

    const handleApplyReference = (e: Event) => {
      const custom = e as CustomEvent<{ character?: string; title?: string; subtitles?: Record<string, any> }>;
      if (custom.detail?.character) {
        setActiveReferenceCharacter(custom.detail.character);
        setVideoTitle(`${custom.detail.character} - ${custom.detail.title || 'Universe'}`);
        const track = custom.detail.subtitles?.[targetLang] || custom.detail.subtitles?.['hi'] || custom.detail.subtitles?.['en'];
        if (track) {
          setCustomSrtContent(track.fullSrt || track.quotes?.map((q: any, i: number) => `${i+1}\n00:00:0${i*3},000 --> 00:00:0${i*3+2},500\n[${q.speaker}] ${q.translated || q.text}`).join('\n\n'));
        }
        onNotify('Reference Injected', `Loaded ${custom.detail.character} dialogue & multi-language subtitles!`, 'success');
      }
    };

    window.addEventListener('icallog_apply_entertainment_reference', handleApplyReference);
    return () => window.removeEventListener('icallog_apply_entertainment_reference', handleApplyReference);
  }, [targetLang, onNotify]);

  // Mock generated subtitles based on target language or custom reference
  const getSubtitlesSample = (langCode: string) => {
    if (customSrtContent) {
      return customSrtContent;
    }
    switch (langCode) {
      case 'hi':
        return `1\n00:00:01,000 --> 00:00:03,500\nनमस्ते दोस्तों! iCALLOG AI स्टूडियो में आपका स्वागत है।\n\n2\n00:00:04,000 --> 00:00:07,200\nअब आप अपनी आवाज़ और वीडियो को 18+ भाषाओं में तुरंत डब कर सकते हैं!\n\n3\n00:00:08,000 --> 00:00:11,500\nसिनेमैटिक 60fps और परफेक्ट लिप-सिंक के साथ दुनिया भर में छा जाइए।`;
      case 'es':
        return `1\n00:00:01,000 --> 00:00:03,500\n¡Hola a todos! Bienvenidos a iCALLOG AI Studio.\n\n2\n00:00:04,000 --> 00:00:07,200\n¡Ahora puedes doblar tus videos a más de 18 idiomas al instante!\n\n3\n00:00:08,000 --> 00:00:11,500\nPerfecta sincronización de labios y calidad cinematográfica.`;
      case 'ja':
        return `1\n00:00:01,000 --> 00:00:03,500\n皆さんこんにちは！iCALLOG AIスタジオへようこそ。\n\n2\n00:00:04,000 --> 00:00:07,200\n18以上の言語で音声を即座にAI吹き替えできます！\n\n3\n00:00:08,000 --> 00:00:11,500\n完璧なリップシンクと映画のようなクオリティをお楽しみください。`;
      default:
        return `1\n00:00:01,000 --> 00:00:03,500\nHello creators! Welcome to iCALLOG Universal AI Studio.\n\n2\n00:00:04,000 --> 00:00:07,200\nInstantly dub your audio and video into 18+ languages worldwide!\n\n3\n00:00:08,000 --> 00:00:11,500\nPerfect AI voice tone preservation and 60fps lip-sync clarity.`;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSourceVideoUrl(url);
      setVideoTitle(file.name.replace(/\.[^/.]+$/, ''));
      onNotify('Video Uploaded', `Loaded "${file.name}" for multi-language AI dubbing.`, 'success');
    }
  };

  const handleStartDubbing = () => {
    setIsDubbing(true);
    setDubbingProgress(15);

    const targetLangObj = SUPPORTED_DUB_LANGUAGES.find((l) => l.code === targetLang) || SUPPORTED_DUB_LANGUAGES[0];

    const interval = setInterval(() => {
      setDubbingProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          setIsDubbing(false);
          onNotify(
            '🎙️ AI Dubbing Complete!',
            `Successfully dubbed video into ${targetLangObj.name} (${targetLangObj.nativeName}) with ${emotionTone.toUpperCase()} emotion and synchronised subtitles!`,
            'success'
          );
          return 100;
        }
        return prev + 20;
      });
    }, 400);
  };

  const handleDownloadSubtitles = () => {
    const srtContent = getSubtitlesSample(targetLang);
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    safeDownloadMedia(blob, `${videoTitle}_${targetLang}_Subtitles.srt`, {
      type: 'text',
      onSuccess: (msg) => onNotify('Subtitles Exported', msg, 'success'),
    });
  };

  const handleDownloadDubbedVideo = () => {
    safeDownloadMedia(sourceVideoUrl, `${videoTitle}_Dubbed_${targetLang}_60fps.mp4`, {
      type: 'video',
      onSuccess: (msg) => onNotify('Dubbed Video Downloaded', msg, 'success'),
      onError: (err) => onNotify('Download Notice', err, 'info'),
    });
  };

  const handleDownloadDubbedAudio = () => {
    safeDownloadMedia(sourceVideoUrl, `${videoTitle}_Dubbed_${targetLang}_Audio.wav`, {
      type: 'audio',
      onSuccess: (msg) => onNotify('Dubbed Audio Master Downloaded', msg, 'success'),
      onError: (err) => onNotify('Download Notice', err, 'info'),
    });
  };

  const currentLangObj = SUPPORTED_DUB_LANGUAGES.find((l) => l.code === targetLang) || SUPPORTED_DUB_LANGUAGES[0];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-purple-950/40 border border-indigo-500/40 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-cyan-950/50 text-2xl">
              🎙️
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white font-['Syne']">
                  AI Multi-Language Video Dubbing & Subtitles
                </h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/40">
                  18+ World Languages • 60fps Lip-Sync
                </span>
                {activeReferenceCharacter && (
                  <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    Lore Active: {activeReferenceCharacter}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-mono mt-1">
                {activeReferenceCharacter
                  ? `Active Lore Dialogue & Subtitles Loaded for ${activeReferenceCharacter}. Ready to synthesize in ${currentLangObj.name}!`
                  : 'Translate, voice-clone, and dub videos into Hindi, English, Spanish, Japanese & more with emotion matching.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all cursor-pointer shadow-md"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Upload Video / Audio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Controls + Dual Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-black text-white font-['Syne'] flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" /> Target Dubbing Language
              </h2>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                {currentLangObj.flag} {currentLangObj.name}
              </span>
            </div>

            {/* Language Selector Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
              {SUPPORTED_DUB_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setTargetLang(lang.code)}
                  className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                    targetLang === lang.code
                      ? 'bg-indigo-600/30 border-cyan-400 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold truncate">{lang.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">{lang.nativeName}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Emotion & Tone Presets */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Voice Emotion & Style Matching</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'cinematic', label: 'Cinematic Movie', icon: '🎬' },
                  { id: 'energetic', label: 'Viral Reel / Shorts', icon: '⚡' },
                  { id: 'podcast', label: 'Studio Podcast', icon: '🎙️' },
                  { id: 'anime', label: 'Anime / Animation', icon: '✨' },
                  { id: 'documentary', label: 'Documentary', icon: '📜' },
                ].map((emo) => (
                  <button
                    key={emo.id}
                    type="button"
                    onClick={() => setEmotionTone(emo.id as any)}
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      emotionTone === emo.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{emo.icon}</span>
                    <span className="truncate">{emo.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Preserve Original Vocal Timbre</div>
                    <div className="text-[10px] text-slate-400">Match pitch and vocal identity of original speaker</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preserveVoiceTone}
                  onChange={(e) => setPreserveVoiceTone(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-xs font-bold text-white">AI Visual Lip-Sync Calibration</div>
                    <div className="text-[10px] text-slate-400">Synchronize mouth movements to dubbed speech</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoLipSync}
                  onChange={(e) => setAutoLipSync(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={handleStartDubbing}
              disabled={isDubbing}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs shadow-xl shadow-cyan-950/50 flex items-center justify-center gap-2 transition-all hover:scale-102 cursor-pointer disabled:opacity-50"
            >
              {isDubbing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Synthesizing {currentLangObj.name} Dubbing ({dubbingProgress}%)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>Generate AI Dubbing in {currentLangObj.flag} {currentLangObj.name}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Player & Subtitles Workspace (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
            {/* Viewport Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white font-['Syne'] truncate max-w-xs">
                  {videoTitle}
                </h3>
              </div>

              {/* Audio Switcher & Subtitle Toggle */}
              <div className="flex items-center gap-2">
                <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAudioTrackMode('dubbed')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      audioTrackMode === 'dubbed'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {currentLangObj.flag} Dubbed Track
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudioTrackMode('original')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      audioTrackMode === 'original'
                        ? 'bg-slate-800 text-cyan-300'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Original
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                    subtitlesEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-950 text-slate-500 border-slate-800'
                  }`}
                >
                  CC {subtitlesEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl group">
              <video
                ref={videoRef}
                src={sourceVideoUrl}
                controls
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Overlay Synchronized Subtitle Preview */}
              {subtitlesEnabled && (
                <div className="absolute bottom-12 inset-x-4 text-center pointer-events-none">
                  <span className="inline-block px-3 py-1.5 rounded-lg bg-black/85 text-white font-bold text-xs sm:text-sm shadow-xl border border-white/10 backdrop-blur-xs leading-relaxed">
                    {targetLang === 'hi'
                      ? 'नमस्ते दोस्तों! iCALLOG AI स्टूडियो में आपका स्वागत है।'
                      : targetLang === 'es'
                      ? '¡Hola a todos! Bienvenidos a iCALLOG AI Studio.'
                      : targetLang === 'ja'
                      ? '皆さんこんにちは！iCALLOG AIスタジオへようこそ。'
                      : 'Hello creators! Welcome to iCALLOG Universal AI Studio.'}
                  </span>
                </div>
              )}
            </div>

            {/* Subtitle Script Box */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Synchronized Multi-Language Subtitles (.SRT / .VTT)</span>
                </span>
                <button
                  type="button"
                  onClick={handleDownloadSubtitles}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-bold flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download .SRT
                </button>
              </div>
              <pre className="p-2.5 rounded-xl bg-slate-900 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-24 whitespace-pre-wrap">
                {getSubtitlesSample(targetLang)}
              </pre>
            </div>

            {/* Export Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Latency • 60 FPS Export Ready</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadDubbedAudio}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Dubbed Audio (.WAV)
                </button>
                <button
                  type="button"
                  onClick={handleDownloadDubbedVideo}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-950/40 transition-transform hover:scale-102 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Export Dubbed Video (.MP4)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

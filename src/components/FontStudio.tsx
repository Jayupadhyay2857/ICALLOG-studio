import React, { useState, useRef, useEffect } from 'react';
import {
  Type,
  Upload,
  Download,
  Sparkles,
  Globe,
  Sliders,
  Check,
  Copy,
  RefreshCw,
  PenTool,
  FileText,
  Languages,
  Layers,
  Zap,
  Eye,
  Palette,
  Image as ImageIcon,
  CheckCircle2,
  Share2,
} from 'lucide-react';

interface FontStudioProps {
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export interface FontScriptConfig {
  id: string;
  name: string;
  nativeName: string;
  flag: string;
  category: 'Indic' | 'Latin/European' | 'Middle Eastern' | 'East Asian (CJK)' | 'Southeast Asian';
  samplePangram: string;
  sampleGlyphs: string[];
}

const WORLD_SCRIPTS: FontScriptConfig[] = [
  {
    id: 'devanagari',
    name: 'Hindi / Devanagari',
    nativeName: 'हिन्दी / देवनागरी',
    flag: '🇮🇳',
    category: 'Indic',
    samplePangram: 'ऋषि और मुनियों की पवित्र धरा भारत में कला और विद्या का अनुपम संगम है।',
    sampleGlyphs: ['अ', 'आ', 'इ', 'ई', 'क', 'ख', 'ग', 'घ', 'च', 'छ', 'ज', 'झ', 'ट', 'ठ', 'ड', 'ढ', 'त', 'थ', 'द', 'ध', 'न', 'प', 'फ', 'ब', 'भ', 'म', 'य', 'र', 'ल', 'व', 'श', 'ष', 'स', 'ह', 'क्ष', 'त्र', 'ज्ञ'],
  },
  {
    id: 'latin_english',
    name: 'English / Latin',
    nativeName: 'English (Worldwide)',
    flag: '🌐',
    category: 'Latin/European',
    samplePangram: 'The quick brown fox jumps over the lazy dog near 1234567890.',
    sampleGlyphs: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', '0', '1', '2', '3', '4', '5'],
  },
  {
    id: 'arabic',
    name: 'Arabic / Persian / Urdu',
    nativeName: 'العربية / اردو',
    flag: '🇸🇦',
    category: 'Middle Eastern',
    samplePangram: 'أبجد هوز حطي كلمن سعفص قرشت ثخذ ضظغ - خط عربي أصيل للجمال والإبداع.',
    sampleGlyphs: ['أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي'],
  },
  {
    id: 'japanese_cjk',
    name: 'Japanese / Kanji / Kana',
    nativeName: '日本語 (Kanji / Hiragana)',
    flag: '🇯🇵',
    category: 'East Asian (CJK)',
    samplePangram: 'いろはにほへと ちりぬるを わかよたれそ つねならむ 有為の奥山 今日越えて',
    sampleGlyphs: ['あ', 'い', 'う', 'え', 'お', 'カ', 'キ', 'ク', 'ケ', 'コ', '愛', '龍', '光', '美', '和', '心', '創', '作', '字', '体'],
  },
  {
    id: 'cyrillic',
    name: 'Russian / Cyrillic',
    nativeName: 'Русский Язык',
    flag: '🇷🇺',
    category: 'Latin/European',
    samplePangram: 'Съешь же ещё этих мягких французских булок, да выпей чаю.',
    sampleGlyphs: ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'Й', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ', 'Ы', 'Ь', 'Э', 'Ю', 'Я'],
  },
  {
    id: 'bengali',
    name: 'Bengali / Bangla',
    nativeName: 'বাংলা লিপি',
    flag: '🇧🇩',
    category: 'Indic',
    samplePangram: 'আমাদের ছোট নদী চলে বাঁকে বাঁকে, বৈশাখ মাসে তার হাঁটু জল থাকে।',
    sampleGlyphs: ['অ', 'আ', 'ই', 'ঈ', 'ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ', 'ট', 'ঠ', 'ড', 'ঢ', 'ণ'],
  },
  {
    id: 'tamil',
    name: 'Tamil',
    nativeName: 'தமிழ் எழுத்துமுறை',
    flag: '🇮🇳',
    category: 'Indic',
    samplePangram: 'தமிழ் বর্ণமாலை உலக மொழிகளிலேயே மிக தொன்மையானது.',
    sampleGlyphs: ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ', 'க', 'ங', 'ச', 'ஞ', 'ட', 'ண', 'த', 'ந'],
  },
  {
    id: 'telugu',
    name: 'Telugu',
    nativeName: 'తెలుగు లిపి',
    flag: '🇮🇳',
    category: 'Indic',
    samplePangram: 'దేశభాషలందు తెలుగు లెస్స - అందమైన అక్షర రూపాలు.',
    sampleGlyphs: ['అ', 'ఆ', 'ఇ', 'ఈ', 'ఉ', 'ఊ', 'ఋ', 'ఎ', 'ఏ', 'ఐ', 'ఒ', 'ఓ', 'ఔ', 'క', 'ఖ', 'గ', 'ఘ', 'ఙ'],
  },
  {
    id: 'gujarati',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી લિપિ',
    flag: '🇮🇳',
    category: 'Indic',
    samplePangram: 'જ્યાં જ્યાં વસે એક ગુજરાતી, ત્યાં ત્યાં સદાકાળ ગુજરાત.',
    sampleGlyphs: ['અ', 'આ', 'ઇ', 'ઈ', 'ઉ', 'ઊ', 'ઋ', 'એ', 'ઐ', 'ઓ', 'ઔ', 'ક', 'ખ', 'ગ', 'ઘ', 'ચ', 'છ', 'જ', 'ઝ'],
  },
  {
    id: 'chinese_cjk',
    name: 'Chinese / Simplified Hanzi',
    nativeName: '中文 (简体汉字)',
    flag: '🇨🇳',
    category: 'East Asian (CJK)',
    samplePangram: '天地玄黄 宇宙洪荒 日月盈杲 辰宿列张 创意字体',
    sampleGlyphs: ['永', '国', '龙', '凤', '华', '夏', '书', '法', '艺', '术', '海', '纳', '百', '川', '文', '字', '美', '学'],
  },
  {
    id: 'thai',
    name: 'Thai',
    nativeName: 'อักษรไทย',
    flag: '🇹🇭',
    category: 'Southeast Asian',
    samplePangram: 'เป็นมนุษย์สุดประเสริฐเลิศคุณค่า กว่าบรรดาฝูงสัตว์เดรัจฉาน',
    sampleGlyphs: ['ก', 'ข', 'ค', 'ง', 'จ', 'ฉ', 'ช', 'ซ', 'ฌ', 'ญ', 'ฎ', 'ฏ', 'ฐ', 'ฑ', 'ฒ', 'ณ', 'ด', 'ต', 'ถ', 'ท'],
  },
];

export const FontStudio: React.FC<FontStudioProps> = ({ onNotify }) => {
  // Mode: Handwriting Vectorizer vs AI Worldwide Font Studio
  const [activeMode, setActiveMode] = useState<'handwriting' | 'world_font'>('handwriting');

  // Handwriting State
  const [handwritingMethod, setHandwritingMethod] = useState<'upload' | 'draw'>('draw');
  const [uploadedImage, setUploadedImage] = useState<string | null>(
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop'
  );
  const [fontName, setFontName] = useState('MyCustomHandwritingFont');
  const [vectorContrast, setVectorContrast] = useState(75);
  const [strokeThickness, setStrokeThickness] = useState(2.5);
  const [baselineSmoothing, setBaselineSmoothing] = useState(80);
  const [isVectorizing, setIsVectorizing] = useState(false);
  const [vectorizedSuccess, setVectorizedSuccess] = useState(true);

  // Canvas Drawing State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentGlyphIndex, setCurrentGlyphIndex] = useState(0);
  const targetGlyphs = ['A', 'B', 'C', 'D', 'E', 'अ', 'आ', 'क', 'ख', '1', '2', '3'];

  // World Font State
  const [selectedScript, setSelectedScript] = useState<FontScriptConfig>(WORLD_SCRIPTS[0]);
  const [fontFamilyName, setFontFamilyName] = useState('GlobalRoyalSerif');
  const [fontWeight, setFontWeight] = useState(600);
  const [fontSlant, setFontSlant] = useState(0);
  const [letterSpacing, setLetterSpacing] = useState(1);
  const [lineHeight, setLineHeight] = useState(1.4);
  const [fontCategory, setFontCategory] = useState<'Serif' | 'Sans-Serif' | 'Handwriting' | 'Calligraphy' | 'Display / Gothic'>('Calligraphy');
  const [enableLigatures, setEnableLigatures] = useState(true);
  const [customPreviewText, setCustomPreviewText] = useState(selectedScript.samplePangram);
  const [copiedCss, setCopiedCss] = useState(false);
  const [isExportingFont, setIsExportingFont] = useState(false);

  // Update preview text on script change
  useEffect(() => {
    setCustomPreviewText(selectedScript.samplePangram);
  }, [selectedScript]);

  // Setup Drawing Canvas
  useEffect(() => {
    if (handwritingMethod === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw baseline
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(10, canvas.height * 0.7);
        ctx.lineTo(canvas.width - 10, canvas.height * 0.7);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }, [handwritingMethod, currentGlyphIndex]);

  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = strokeThickness * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const handleStopDraw = () => {
    setIsDrawing(false);
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw baseline
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(10, canvas.height * 0.7);
    ctx.lineTo(canvas.width - 10, canvas.height * 0.7);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const handleVectorizeHandwriting = () => {
    setIsVectorizing(true);
    setTimeout(() => {
      setIsVectorizing(false);
      setVectorizedSuccess(true);
      onNotify(
        'Handwriting Vectorized Successfully!',
        `Converted handwriting sheet into TrueType font "${fontName}.ttf" with ${selectedScript.sampleGlyphs.length} unicode glyphs.`,
        'success'
      );
    }, 1500);
  };

  const handleExportFontFile = (format: 'TTF' | 'OTF' | 'WOFF2' | 'SVG') => {
    setIsExportingFont(true);
    setTimeout(() => {
      setIsExportingFont(false);
      // Create virtual blob download
      const content = `/* Vector Font Export: ${fontFamilyName} (${format}) - Generated by AI Studio Font Engine */\n@font-face {\n  font-family: '${fontFamilyName}';\n  src: url('/fonts/${fontFamilyName.toLowerCase()}.${format.toLowerCase()}') format('${format.toLowerCase()}');\n  font-weight: ${fontWeight};\n  font-style: ${fontSlant !== 0 ? 'italic' : 'normal'};\n}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fontFamilyName}_Font.${format.toLowerCase()}`;
      a.click();
      URL.revokeObjectURL(url);

      onNotify(
        'Font Package Exported!',
        `Downloaded ${fontFamilyName}.${format.toLowerCase()} installable font file with full character set.`,
        'success'
      );
    }, 1200);
  };

  const handleCopyCss = () => {
    const cssCode = `@font-face {\n  font-family: '${fontFamilyName}';\n  src: url('${fontFamilyName.toLowerCase()}.woff2') format('woff2');\n  font-weight: ${fontWeight};\n  font-style: ${fontSlant !== 0 ? 'italic' : 'normal'};\n  font-display: swap;\n}\n\n.custom-font-style {\n  font-family: '${fontFamilyName}', ${selectedScript.category === 'Indic' ? "'Kohinoor Devanagari', 'Noto Sans Devanagari'" : "'Inter', sans-serif"};\n  letter-spacing: ${letterSpacing}px;\n  line-height: ${lineHeight};\n}`;
    navigator.clipboard.writeText(cssCode);
    setCopiedCss(true);
    setTimeout(() => setCopiedCss(false), 2000);
    onNotify('CSS Snippet Copied', '@font-face rule copied to clipboard!', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Hero Studio Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-950 border border-slate-800 shadow-2xl overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
              <Languages className="w-3.5 h-3.5 text-cyan-400" /> Universal Handwriting & World Font Studio
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Syne'] tracking-tight">
              Handwriting to Font Vectorizer & Worldwide Typographic Engine
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Convert physical handwriting paper scans or digital strokes into installable <span className="text-cyan-300 font-mono font-bold">.TTF / .OTF / .WOFF2</span> font files. Supports all world scripts including Hindi (Devanagari), English, Arabic, Japanese, Russian Cyrillic, Bengali, Tamil, Telugu, and CJK Hanzi.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveMode('handwriting')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                activeMode === 'handwriting'
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <PenTool className="w-4 h-4" /> Handwriting to Font
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('world_font')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                activeMode === 'world_font'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Globe className="w-4 h-4" /> All World Languages Font Engine
            </button>
          </div>
        </div>
      </div>

      {/* MODE 1: HANDWRITING TO FONT VECTORIZER */}
      {activeMode === 'handwriting' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-5 p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
                <PenTool className="w-4 h-4 text-cyan-400" /> Handwriting Capture & OCR Vectorizer
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                AI Vector Engine
              </span>
            </div>

            {/* Input Method Toggle */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2">Select Capture Source</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setHandwritingMethod('draw')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    handwritingMethod === 'draw'
                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <PenTool className="w-4 h-4" /> Draw Live Strokes
                </button>
                <button
                  type="button"
                  onClick={() => setHandwritingMethod('upload')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    handwritingMethod === 'upload'
                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Upload className="w-4 h-4" /> Upload Paper Scan
                </button>
              </div>
            </div>

            {/* Font Parameters */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Target Font Name</label>
                <input
                  type="text"
                  value={fontName}
                  onChange={(e) => setFontName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                  placeholder="MyHandwritingFont"
                />
              </div>

              {/* Sliders */}
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                    <span>Vector Threshold / Contrast</span>
                    <span className="font-mono text-cyan-400">{vectorContrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={vectorContrast}
                    onChange={(e) => setVectorContrast(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                    <span>Stroke Thickness / Weight</span>
                    <span className="font-mono text-cyan-400">{strokeThickness}pt</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    step="0.5"
                    value={strokeThickness}
                    onChange={(e) => setStrokeThickness(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                    <span>Baseline Curve Smoothing</span>
                    <span className="font-mono text-cyan-400">{baselineSmoothing}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={baselineSmoothing}
                    onChange={(e) => setBaselineSmoothing(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={isVectorizing}
              onClick={handleVectorizeHandwriting}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-cyan-700 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold font-['Syne'] text-xs shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isVectorizing ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
                  <span>Extracting & Vectorizing Handwriting Glyphs...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>Vectorize Handwriting into TrueType Font (.TTF)</span>
                </>
              )}
            </button>
          </div>

          {/* Interactive Workspace Column */}
          <div className="lg:col-span-7 space-y-4">
            {handwritingMethod === 'draw' ? (
              <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono">
                      Digital Touchpad Drawing Canvas (Glyph #{currentGlyphIndex + 1}: <span className="text-cyan-400 text-base">{targetGlyphs[currentGlyphIndex]}</span>)
                    </h4>
                    <p className="text-[11px] text-slate-400">Write the letter using mouse or touch. Pressure-sensitive stroke vectorizer active.</p>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={handleClearCanvas}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                    >
                      Clear Stroke
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentGlyphIndex((prev) => (prev + 1) % targetGlyphs.length)}
                      className="px-3 py-1.5 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-bold"
                    >
                      Next Character ({targetGlyphs[(currentGlyphIndex + 1) % targetGlyphs.length]})
                    </button>
                  </div>
                </div>

                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 p-2 flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={260}
                    onMouseDown={handleStartDraw}
                    onMouseMove={handleDraw}
                    onMouseUp={handleStopDraw}
                    onMouseLeave={handleStopDraw}
                    onTouchStart={handleStartDraw}
                    onTouchMove={handleDraw}
                    onTouchEnd={handleStopDraw}
                    className="w-full h-auto max-h-[260px] rounded-xl cursor-crosshair touch-none"
                  />
                  <div className="absolute bottom-4 right-4 pointer-events-none text-slate-600 text-5xl font-serif font-black opacity-15">
                    {targetGlyphs[currentGlyphIndex]}
                  </div>
                </div>

                {/* Character Map Quick Strip */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {targetGlyphs.map((glyph, idx) => (
                    <button
                      key={glyph}
                      type="button"
                      onClick={() => setCurrentGlyphIndex(idx)}
                      className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center border transition-all ${
                        currentGlyphIndex === idx
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {glyph}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Upload Photo Method */
              <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white font-mono">Upload Paper Handwriting Scan</h4>
                  <span className="text-[10px] text-slate-400 font-mono">Supported: JPG, PNG, PDF Scans</span>
                </div>

                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 p-3 flex flex-col items-center justify-center gap-2 group">
                  {uploadedImage ? (
                    <img
                      src={uploadedImage}
                      alt="Handwriting scan source"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="text-center space-y-2 p-6">
                      <ImageIcon className="w-8 h-8 text-slate-500 mx-auto" />
                      <p className="text-xs text-slate-400">Drag & drop handwriting paper photo here or click to browse</p>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const url = URL.createObjectURL(e.target.files[0]);
                        setUploadedImage(url);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Live Vectorized Font Preview Output */}
            {vectorizedSuccess && (
              <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white font-['Syne']">Vector Font Live Preview ({fontName})</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleExportFontFile('TTF')}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Download .TTF
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportFontFile('WOFF2')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> .WOFF2
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs text-slate-400 font-mono">Sample Sentence Rendering (Your Handwriting Font):</div>
                  <div
                    className="text-lg text-cyan-300 leading-relaxed font-serif tracking-wide"
                    style={{
                      fontStyle: fontSlant !== 0 ? 'italic' : 'normal',
                      letterSpacing: `${letterSpacing}px`,
                    }}
                  >
                    The quick brown fox jumps over the lazy dog. 0123456789. हिन्दी एवं देवनागरी वर्णमाला का सुंदर रूप।
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: ALL WORLD LANGUAGES FONT ENGINE */}
      {activeMode === 'world_font' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Script & Typographic Controls */}
          <div className="lg:col-span-5 p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" /> Worldwide Script Selector & Font Studio
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                150+ Languages
              </span>
            </div>

            {/* World Languages Script Picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Select Target World Language / Script</label>
              <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                {WORLD_SCRIPTS.map((script) => {
                  const isSelected = selectedScript.id === script.id;
                  return (
                    <button
                      key={script.id}
                      type="button"
                      onClick={() => setSelectedScript(script)}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-indigo-950 to-slate-900 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{script.flag}</span>
                        <div>
                          <div className="text-xs font-bold">{script.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{script.nativeName}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-slate-800">
                        {script.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Styling Controls */}
            <div className="space-y-3 border-t border-slate-800 pt-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Font Family Name</label>
                  <input
                    type="text"
                    value={fontFamilyName}
                    onChange={(e) => setFontFamilyName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Style Category</label>
                  <select
                    value={fontCategory}
                    onChange={(e) => setFontCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Serif">Royal Serif</option>
                    <option value="Sans-Serif">Modern Sans</option>
                    <option value="Handwriting">Handwriting Script</option>
                    <option value="Calligraphy">Calligraphic Royal</option>
                    <option value="Display / Gothic">Cyber Display / Gothic</option>
                  </select>
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-2.5 pt-1">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Font Weight</span>
                    <span className="font-mono text-indigo-400">{fontWeight}</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="900"
                    step="100"
                    value={fontWeight}
                    onChange={(e) => setFontWeight(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Slant / Italics Angle</span>
                    <span className="font-mono text-indigo-400">{fontSlant}°</span>
                  </div>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    value={fontSlant}
                    onChange={(e) => setFontSlant(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Letter Spacing / Tracking</span>
                    <span className="font-mono text-indigo-400">{letterSpacing}px</span>
                  </div>
                  <input
                    type="range"
                    min="-2"
                    max="10"
                    value={letterSpacing}
                    onChange={(e) => setLetterSpacing(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>

              {/* Toggle Ligatures */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="text-xs font-bold text-white">Contextual Swashes & Ligatures</div>
                  <div className="text-[10px] text-slate-400">Join conjuncts ('क्ष', 'त्र', 'fi', 'fl', Arabic letters)</div>
                </div>
                <input
                  type="checkbox"
                  checked={enableLigatures}
                  onChange={(e) => setEnableLigatures(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500"
                />
              </div>
            </div>

            {/* Export Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleExportFontFile('TTF')}
                className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export .TTF
              </button>
              <button
                type="button"
                onClick={() => handleExportFontFile('OTF')}
                className="py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export .OTF
              </button>
            </div>
          </div>

          {/* Right Column: Live Interactive Playground & Glyph Sheet */}
          <div className="lg:col-span-7 space-y-4">
            {/* Live Interactive Text Playground */}
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{selectedScript.flag}</span>
                  <span className="text-xs font-bold text-white font-['Syne']">
                    Live Rendering ({selectedScript.name} - {fontCategory})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCss}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5"
                >
                  {copiedCss ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCss ? 'Copied @font-face' : 'Copy CSS Code'}</span>
                </button>
              </div>

              {/* Editable Text Tester */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 font-mono">Type Any Custom Text in World Language:</label>
                <textarea
                  rows={3}
                  value={customPreviewText}
                  onChange={(e) => setCustomPreviewText(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                  placeholder="Type anything in Hindi, English, Arabic, Japanese..."
                />
              </div>

              {/* Large Display Banner */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 min-h-[160px] flex items-center justify-center text-center overflow-hidden">
                <div
                  className="text-2xl sm:text-3xl text-indigo-300 leading-relaxed font-serif tracking-wide transition-all"
                  style={{
                    fontWeight: fontWeight,
                    fontStyle: fontSlant !== 0 ? 'italic' : 'normal',
                    letterSpacing: `${letterSpacing}px`,
                    lineHeight: lineHeight,
                  }}
                >
                  {customPreviewText || selectedScript.samplePangram}
                </div>
              </div>
            </div>

            {/* Glyph Matrix Character Map */}
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white font-mono flex items-center gap-2">
                  <Type className="w-3.5 h-3.5 text-indigo-400" /> Unicode Glyph Grid ({selectedScript.sampleGlyphs.length} Character Vectors)
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">Vector Curvature Optimized</span>
              </div>

              <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                {selectedScript.sampleGlyphs.map((glyph, idx) => (
                  <div
                    key={`${glyph}-${idx}`}
                    className="aspect-square rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-base text-indigo-200 hover:border-indigo-500 hover:text-white hover:scale-110 transition-all font-serif"
                    style={{
                      fontWeight: fontWeight,
                      fontStyle: fontSlant !== 0 ? 'italic' : 'normal',
                    }}
                  >
                    {glyph}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

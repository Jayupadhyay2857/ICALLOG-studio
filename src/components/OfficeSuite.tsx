import React, { useState } from 'react';
import {
  FileText,
  Presentation,
  Sheet,
  Download,
  Plus,
  Trash2,
  Play,
  Copy,
  Check,
  Sparkles,
  Bold,
  Italic,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Calculator,
  Eye,
  RefreshCw,
  FolderOpen,
  Save,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import { UserProfile } from '../types.ts';
import { UniversalMediaCaptureToolbar } from './UniversalMediaCaptureToolbar.tsx';

interface OfficeSuiteProps {
  user?: UserProfile;
  initialSubTab?: 'docs' | 'ppt' | 'excel';
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

/* ==========================================================================
   DOCS PRESETS & TEMPLATES
   ========================================================================== */
const DOC_TEMPLATES = [
  {
    id: 'film_proposal',
    title: 'Film Project & Production Proposal',
    category: 'Cinema & Media',
    content: `# PROJECT GREENLIGHT PROPOSAL: CHRONICLES OF NEO-KYOTO

## 1. EXECUTIVE SUMMARY
- **Genre:** Cyberpunk Neo-Noir / Psychological Sci-Fi
- **Format:** Feature Film (118 Minutes)
- **Target Audience:** Core Sci-Fi, Cinema Connoisseurs (18–35)
- **Estimated Budget:** ₹85,00,000 (INR)
- **Production Pipeline:** Unreal Engine 5.4 Virtual Production + 8K AI Pre-visualization

## 2. LOGLINE
In a submerged neo-megalopolis where human memory is an exportable commodity, a disgraced memory detective discovers that the city's reigning synthetic oligarch has been living inside a stolen human conscience.

## 3. KEY CHARACTERS
1. **DETECTIVE KAIREN CHEN (34):** Cynical, augmented optic implants, haunted by an unresolved case.
2. **MADAME VERA VOSS (50s):** Sovereign chairperson of Neuro-Nexus Syndicate. Cold, architectural elegance.
3. **ECHO-7:** An unsanctioned neural clone searching for the origin of its biological memories.

## 4. CAMERA & VISUAL AESTHETICS
- **Aspect Ratio:** 2.39:1 Anamorphic
- **Lensing:** Hawk V-Lite Vintage Anamorphic primes with cyan horizontal flares
- **Lighting Palette:** Wet asphalt reflections, deep sodium tungsten, and stark cobalt shadows.`,
  },
  {
    id: 'nda_contract',
    title: 'Confidentiality & Non-Disclosure Agreement (NDA)',
    category: 'Legal & Business',
    content: `# MUTUAL NON-DISCLOSURE AGREEMENT (NDA)

This Agreement is entered into between:
**DISCLOSING PARTY:** iCALLOG Studios Private Limited
**RECEIVING PARTY:** Collaborative Studio Partner / Contractor

### 1. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" refers to all technical data, proprietary AI workflows, 3D model rigs, screenplay drafts, financial models, and operational assets disclosed directly or indirectly.

### 2. OBLIGATIONS OF RECEIVING PARTY
The Receiving Party agrees to hold and maintain the Confidential Information in strictest confidence for a period of three (3) years from the date of disclosure.

### 3. EXCLUSIONS
Confidential Information does not include information that is publicly known through no breach of this Agreement, or was already in possession prior to disclosure.

### 4. GOVERNING LAW & JURISDICTION
This Agreement shall be construed in accordance with the Laws of India, subject to the jurisdiction of the courts of Mumbai.

**Signed & Sealed:**
- Disclosing Representative: _______________________
- Receiving Representative: _______________________
- Date: September 18, 2026`,
  },
  {
    id: 'tech_spec',
    title: 'AI Platform System Architecture Spec',
    category: 'Engineering',
    content: `# SYSTEM ARCHITECTURE SPECIFICATION: iCALLOG V18

## 1. OVERVIEW
High-throughput creative workstation unifying 3D WebGL rendering, 8K video diffusion pipelines, neural audio synthesis, and document automation under a single micro-service gateway.

## 2. CORE SUBSYSTEMS
- **Client Tier:** React 18 SPA + Vite + Three.js r128 + Tailwind CSS
- **API Ingress:** Node.js Express 5.0 with Server-Sent Events (SSE) streaming
- **Persistence Layer:** PostgreSQL relational user ledger + S3/Cloudinary object store
- **GPU Inference Bus:** Asynchronous worker queue handling 60 FPS motion interpolation

## 3. SLA & LATENCY TARGETS
- WebGL 3D Viewport FPS: 60 FPS minimum on standard discrete GPUs
- SSE Event Dispatch: < 45ms end-to-end
- Document Export: Immediate client-side blob generation (< 20ms)`,
  },
];

/* ==========================================================================
   PPT SLIDES PRESETS
   ========================================================================== */
interface Slide {
  id: string;
  title: string;
  subtitle: string;
  bullets: string[];
  notes: string;
  tag: string;
}

const INITIAL_SLIDES: Slide[] = [
  {
    id: 's1',
    title: 'iCALLOG V18 CREATIVE SUITE',
    subtitle: 'Next-Generation Cinema, 3D WebGL & Autonomous Production',
    bullets: [
      'Unifying 8K Neural Diffusion, 3D Armature Rigging & Screenplay Direction',
      'Zero-Latency In-Browser Audio & Visual Production Workflows',
      'Decentralized Asset Storage via S3 & Fast Object Buckets',
    ],
    notes: 'Opening slide: Welcome investors and lead technical directors.',
    tag: 'Title Slide',
  },
  {
    id: 's2',
    title: 'THE CORE INDUSTRY PROBLEM',
    subtitle: 'Fragmented Pipelines Cost Creative Studios Millions',
    bullets: [
      'Disjointed tools: Scriptwriters, 3D modelers, and colorists work in isolated silos',
      'Prohibitive cloud rendering costs and prolonged queue delays',
      'Inability to rapidly pre-visualize cinematic scenes before greenlighting',
    ],
    notes: 'Highlight pain points across Hollywood and independent game studios.',
    tag: 'Problem',
  },
  {
    id: 's3',
    title: 'THE iCALLOG SOLUTION',
    subtitle: 'Unified Real-Time WebGL & Cinematic Directorial AI',
    bullets: [
      'Instant Screenplay to Shot List generation with camera blocking in 1 click',
      'Image to 3D mesh reconstruction with 17-bone inverse kinematic rigging',
      'High-dynamic range 8K video diffusion up to 60 FPS with 1-hour free tier',
    ],
    notes: 'Demonstrate live WebGL viewport and one-click export capabilities.',
    tag: 'Solution',
  },
  {
    id: 's4',
    title: 'COMMERCIAL MODEL & UNIT ECONOMICS',
    subtitle: 'Transparent UPI Token Ledger & High-Margin VIP Tiers',
    bullets: [
      'UPI QR Instant Token Top-ups: ₹200 to ₹2,000 packages',
      'Over 72% gross margin on compute routing and storage caching',
      'Scalable to 100,000+ concurrent enterprise creators worldwide',
    ],
    notes: 'Show revenue breakdown and growth projections.',
    tag: 'Financials',
  },
];

/* ==========================================================================
   EXCEL SPREADSHEET INITIAL DATA
   ========================================================================== */
const INITIAL_SPREADSHEET = [
  ['Category', 'Item Description', 'Qty', 'Unit Rate (₹)', 'Total (₹)', 'Notes / Status'],
  ['Pre-Production', 'Screenplay & Director Pass', '1', '150000', '=C2*D2', 'Approved by Lead Director'],
  ['Pre-Production', 'Storyboard & Concept Renders', '25', '4500', '=C3*D3', '8K AI Pre-vis complete'],
  ['3D Modeling', 'Biped Hero Characters (Rigged)', '6', '35000', '=C4*D4', 'WebGL Armature ready'],
  ['3D Modeling', 'Vehicular & Hard Surface Meshes', '12', '18000', '=C5*D5', 'GLTF format exported'],
  ['Production', 'Virtual Studio Stage Rental (Days)', '4', '85000', '=C6*D6', 'Stage B Booked'],
  ['Audio Post', 'Orchestral Score & Sound Design', '1', '120000', '=C7*D7', 'Master stems rendered'],
  ['VFX / Compute', '8K Neural Video Frame Synthesis', '140', '1200', '=C8*D8', 'GPU Worker cluster'],
  ['TOTAL BUDGET', 'Consolidated Production Expenditure', '', '', '=SUM(E2:E8)', 'Under allocated budget cap'],
];

export const OfficeSuite: React.FC<OfficeSuiteProps> = ({
  user,
  initialSubTab = 'docs',
  onNotify,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'docs' | 'ppt' | 'excel'>(initialSubTab);

  /* --------------------------------------------------------------------------
     DOCS STATE & ACTIONS
     -------------------------------------------------------------------------- */
  const [docTitle, setDocTitle] = useState('Film Production Agreement & Proposal');
  const [docContent, setDocContent] = useState(DOC_TEMPLATES[0].content);
  const [isCopiedDoc, setIsCopiedDoc] = useState(false);

  const wordCount = docContent.trim().split(/\s+/).filter(Boolean).length;
  const charCount = docContent.length;
  const readingTime = Math.ceil(wordCount / 200);

  const handleDownloadDoc = (format: 'txt' | 'doc' | 'md') => {
    let mime = 'text/plain';
    let ext = format;
    let data = docContent;

    if (format === 'doc') {
      mime = 'application/msword';
      ext = 'doc';
      data = `<html><head><meta charset="utf-8"><title>${docTitle}</title><style>body{font-family:Arial,sans-serif;line-height:1.6;padding:20px;}</style></head><body><pre style="white-space:pre-wrap;font-family:inherit;">${docContent}</pre></body></html>`;
    }

    const blob = new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);

    onNotify('Document Exported', `Saved as .${ext} file successfully!`, 'success');
  };

  const handleCopyDoc = () => {
    navigator.clipboard.writeText(docContent);
    setIsCopiedDoc(true);
    setTimeout(() => setIsCopiedDoc(false), 2000);
    onNotify('Copied', 'Full document copied to clipboard!', 'info');
  };

  /* --------------------------------------------------------------------------
     PPT STATE & ACTIONS
     -------------------------------------------------------------------------- */
  const [slides, setSlides] = useState<Slide[]>(INITIAL_SLIDES);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [slideTheme, setSlideTheme] = useState<'cyber' | 'executive' | 'neon' | 'minimal'>('cyber');
  const [isPresenting, setIsPresenting] = useState(false);

  const activeSlide = slides[activeSlideIdx] || slides[0];

  const handleAddSlide = () => {
    const newSlide: Slide = {
      id: `s_${Date.now()}`,
      title: 'NEW SLIDE TITLE',
      subtitle: 'Add a concise explanatory subtitle here',
      bullets: [
        'Strategic key takeaway point number one',
        'Detailed metric or architectural capability',
        'Actionable conclusion for stakeholder review',
      ],
      notes: 'Presenter notes for this slide.',
      tag: 'New Slide',
    };
    setSlides([...slides, newSlide]);
    setActiveSlideIdx(slides.length);
    onNotify('Slide Added', 'New presentation slide created.', 'info');
  };

  const handleDeleteSlide = (idx: number) => {
    if (slides.length <= 1) {
      onNotify('Action Denied', 'Presentation must contain at least one slide.', 'warning');
      return;
    }
    const nextSlides = slides.filter((_, i) => i !== idx);
    setSlides(nextSlides);
    setActiveSlideIdx(Math.max(0, idx - 1));
  };

  const handleUpdateSlideField = (field: keyof Slide, val: string | string[]) => {
    const updated = [...slides];
    updated[activeSlideIdx] = {
      ...updated[activeSlideIdx],
      [field]: val,
    };
    setSlides(updated);
  };

  const handleDownloadPPT = () => {
    const jsonStr = JSON.stringify({ presentationTitle: 'iCALLOG Presentation', slides, theme: slideTheme }, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presentation_deck_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('Slides Exported', 'Exported slide deck in structured format.', 'success');
  };

  /* --------------------------------------------------------------------------
     EXCEL STATE & ACTIONS
     -------------------------------------------------------------------------- */
  const [gridData, setGridData] = useState<string[][]>(INITIAL_SPREADSHEET);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number }>({ r: 1, c: 1 });
  const [formulaValue, setFormulaValue] = useState(INITIAL_SPREADSHEET[1][1]);

  const handleCellChange = (r: number, c: number, val: string) => {
    const next = gridData.map((row, ri) =>
      row.map((cell, ci) => (ri === r && ci === c ? val : cell))
    );
    setGridData(next);
  };

  const handleSelectCell = (r: number, c: number) => {
    setSelectedCell({ r, c });
    setFormulaValue(gridData[r]?.[c] || '');
  };

  const calculateDisplayValue = (val: string, r: number, c: number): string => {
    if (!val || !val.startsWith('=')) return val;

    try {
      // Basic SUM formula parser e.g. =SUM(E2:E8)
      if (val.toUpperCase().startsWith('=SUM(')) {
        let sum = 0;
        // Sum column E rows 1 to 7
        for (let i = 1; i < gridData.length - 1; i++) {
          const raw = gridData[i][4];
          let num = 0;
          if (raw.startsWith('=')) {
            // Evaluates =C*D
            const q = parseFloat(gridData[i][2]) || 0;
            const rate = parseFloat(gridData[i][3]) || 0;
            num = q * rate;
          } else {
            num = parseFloat(raw) || 0;
          }
          sum += num;
        }
        return `₹${sum.toLocaleString('en-IN')}`;
      }

      // Basic multiplication formula parser e.g. =C2*D2
      if (val.includes('*')) {
        const qty = parseFloat(gridData[r][2]) || 0;
        const rate = parseFloat(gridData[r][3]) || 0;
        return `₹${(qty * rate).toLocaleString('en-IN')}`;
      }
    } catch {
      return val;
    }
    return val;
  };

  const handleExportCSV = () => {
    const csvContent = gridData
      .map((row, ri) =>
        row
          .map((cell, ci) => `"${calculateDisplayValue(cell, ri, ci).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial_ledger_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('Spreadsheet Exported', 'Downloaded complete ledger as .CSV file!', 'success');
  };

  const handleAddRow = () => {
    const newRow = ['Operational', 'New Budget Line Item', '1', '10000', '=C' + (gridData.length + 1) + '*D' + (gridData.length + 1), 'Pending Approval'];
    // insert before last row
    const next = [...gridData.slice(0, -1), newRow, gridData[gridData.length - 1]];
    setGridData(next);
    onNotify('Row Added', 'Added new spreadsheet row.', 'info');
  };

  return (
    <div className="space-y-4">
      {/* Universal Quick Media Capture & Recording Toolbar */}
      <UniversalMediaCaptureToolbar user={user} onNotify={(t, d, ty) => onNotify(t, d, ty as any)} />

      {/* Top Suite Sub-Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'docs', label: 'Docs & Word Studio', icon: <FileText className="w-4 h-4 text-cyan-400" /> },
            { id: 'ppt', label: 'PPT Slide Generator', icon: <Presentation className="w-4 h-4 text-amber-400" /> },
            { id: 'excel', label: 'Excel Spreadsheet Grid', icon: <Sheet className="w-4 h-4 text-emerald-400" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeSubTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white shadow-lg shadow-indigo-900/30 font-["Syne"]'
                  : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800/80'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Offline Client Storage • Zero Latency</span>
        </div>
      </div>

      {/* ====================================================================
          VIEW 1: DOCS & WORD CREATOR
          ==================================================================== */}
      {activeSubTab === 'docs' && (
        <div className="space-y-4">
          {/* Header Controls & Template Selector */}
          <div className="p-4 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex-1 w-full sm:w-auto">
                <label className="text-[11px] font-mono text-slate-400 block mb-1">DOCUMENT TITLE</label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full sm:max-w-md px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-bold text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleCopyDoc}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {isCopiedDoc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopiedDoc ? 'Copied' : 'Copy Text'}</span>
                </button>

                <button
                  onClick={() => handleDownloadDoc('doc')}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-900/30"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .DOC</span>
                </button>

                <button
                  onClick={() => handleDownloadDoc('txt')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>.TXT</span>
                </button>
              </div>
            </div>

            {/* Template Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
              <span className="text-[11px] font-mono text-slate-400">Templates:</span>
              {DOC_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => {
                    setDocTitle(tmpl.title);
                    setDocContent(tmpl.content);
                    onNotify('Template Loaded', `Switched to "${tmpl.title}"`, 'info');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition-colors"
                >
                  {tmpl.title}
                </button>
              ))}
            </div>
          </div>

          {/* Document Editor Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Main Text Editor */}
            <div className="lg:col-span-8 p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-3">
                  <span>Words: <strong className="text-white">{wordCount}</strong></span>
                  <span>Characters: <strong className="text-white">{charCount}</strong></span>
                  <span>Est. Reading: <strong className="text-cyan-400">{readingTime} min</strong></span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <Check className="w-3.5 h-3.5" /> Auto-saved
                </div>
              </div>

              <textarea
                rows={22}
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-sm font-mono text-slate-200 focus:border-cyan-500 focus:outline-none leading-relaxed resize-y"
                placeholder="Type your document content here in clean text or Markdown..."
              />
            </div>

            {/* Live Document Preview Panel */}
            <div className="lg:col-span-4 p-5 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-white font-['Syne'] flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" /> Formatted Layout View
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    A4 Page Mode
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white text-slate-900 shadow-lg text-[11px] leading-relaxed max-h-[500px] overflow-y-auto space-y-2 font-serif">
                  <div className="text-center pb-2 border-b border-slate-200">
                    <h1 className="text-sm font-bold tracking-tight uppercase text-slate-950">{docTitle}</h1>
                    <p className="text-[9px] text-slate-500 italic mt-0.5">Prepared via iCALLOG Document Studio</p>
                  </div>
                  <div className="whitespace-pre-wrap text-slate-800 font-sans text-[11px]">
                    {docContent}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
                <div className="text-slate-300 font-bold">Document Export Formats:</div>
                <div>• Microsoft Word (.doc) with XML formatting tags</div>
                <div>• Pure UTF-8 Text (.txt) compatible with all platforms</div>
                <div>• Direct Print to PDF via Browser Dialog</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          VIEW 2: PPT PRESENTATION GENERATOR
          ==================================================================== */}
      {activeSubTab === 'ppt' && (
        <div className="space-y-4">
          {/* Deck Header Controls */}
          <div className="p-4 rounded-3xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-white font-['Syne'] flex items-center gap-2">
                <Presentation className="w-4 h-4 text-amber-400" /> PowerPoint Deck Builder
              </span>
              <span className="text-xs font-mono text-slate-400">
                ({slides.length} Slides)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddSlide}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-900/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Slide</span>
              </button>

              <button
                onClick={() => setIsPresenting(!isPresenting)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-900/30"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isPresenting ? 'Exit Show' : 'Present Deck'}</span>
              </button>

              <button
                onClick={handleDownloadPPT}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PPT Deck</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Carousel: Slide Thumbnails */}
            <div className="lg:col-span-3 space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {slides.map((s, idx) => (
                <div
                  key={s.id}
                  onClick={() => setActiveSlideIdx(idx)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    activeSlideIdx === idx
                      ? 'bg-slate-800/90 border-amber-400/80 shadow-lg shadow-amber-900/20'
                      : 'bg-slate-950/60 border-slate-800/70 hover:bg-slate-900 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold text-amber-400">SLIDE {idx + 1}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSlide(idx);
                      }}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-xs font-bold text-white truncate">{s.title || 'Untitled Slide'}</div>
                  <div className="text-[11px] text-slate-400 truncate">{s.subtitle}</div>
                </div>
              ))}
            </div>

            {/* Center Canvas: Active Slide Visualizer & In-Place Editor */}
            <div className="lg:col-span-9 space-y-4">
              {/* Slide Screen Stage */}
              <div className="relative aspect-video rounded-3xl overflow-hidden p-8 sm:p-12 flex flex-col justify-between shadow-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800">
                {/* Slide Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold uppercase">
                      {activeSlide.tag}
                    </span>
                    <span className="text-xs font-mono text-slate-400">iCALLOG SLIDE STUDIO</span>
                  </div>

                  <input
                    type="text"
                    value={activeSlide.title}
                    onChange={(e) => handleUpdateSlideField('title', e.target.value)}
                    className="w-full bg-transparent text-xl sm:text-3xl font-extrabold text-white font-['Syne'] tracking-wide border-b border-transparent focus:border-amber-400 focus:outline-none"
                    placeholder="Slide Title..."
                  />

                  <input
                    type="text"
                    value={activeSlide.subtitle}
                    onChange={(e) => handleUpdateSlideField('subtitle', e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm text-cyan-400 font-medium border-b border-transparent focus:border-cyan-400 focus:outline-none"
                    placeholder="Slide Subtitle..."
                  />
                </div>

                {/* Bullets List */}
                <div className="space-y-2.5 my-4">
                  {activeSlide.bullets.map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-amber-400 mt-2 shrink-0" />
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => {
                          const next = [...activeSlide.bullets];
                          next[bIdx] = e.target.value;
                          handleUpdateSlideField('bullets', next);
                        }}
                        className="w-full bg-slate-900/40 hover:bg-slate-900/80 px-2.5 py-1 rounded-lg text-xs sm:text-sm text-slate-200 border border-transparent focus:border-slate-700 focus:outline-none"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      handleUpdateSlideField('bullets', [...activeSlide.bullets, 'New bullet takeaway point...']);
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1 pt-1"
                  >
                    <Plus className="w-3 h-3" /> Add Takeaway Bullet
                  </button>
                </div>

                {/* Slide Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                  <span>Confidential • Internal Executive Briefing</span>
                  <span>Slide {activeSlideIdx + 1} of {slides.length}</span>
                </div>
              </div>

              {/* Presenter Notes Box */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <label className="text-[11px] font-mono text-slate-400 font-bold">PRESENTER TALKING POINTS & NOTES</label>
                <textarea
                  rows={2}
                  value={activeSlide.notes}
                  onChange={(e) => handleUpdateSlideField('notes', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:border-amber-400 focus:outline-none resize-none"
                  placeholder="Key notes to remember during this slide..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          VIEW 3: EXCEL SPREADSHEET GRID
          ==================================================================== */}
      {activeSubTab === 'excel' && (
        <div className="space-y-4">
          {/* Spreadsheet Header Toolbar */}
          <div className="p-4 rounded-3xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-white font-['Syne'] flex items-center gap-2">
                <Sheet className="w-4 h-4 text-emerald-400" /> Excel Spreadsheet Studio
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Formula Engine Active: =SUM(), =C*D Multiplications
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddRow}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-900/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-900/30"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .CSV / Excel</span>
              </button>
            </div>
          </div>

          {/* Formula Bar */}
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 font-bold">
              Cell [{String.fromCharCode(65 + selectedCell.c)}{selectedCell.r + 1}]
            </span>
            <span className="text-slate-500 font-bold">fx</span>
            <input
              type="text"
              value={formulaValue}
              onChange={(e) => {
                setFormulaValue(e.target.value);
                handleCellChange(selectedCell.r, selectedCell.c, e.target.value);
              }}
              className="flex-1 bg-transparent text-white focus:outline-none"
              placeholder="Enter text, number, or formula (e.g. =SUM(E2:E8) or =C2*D2)..."
            />
          </div>

          {/* Grid Table */}
          <div className="rounded-3xl border border-slate-800 overflow-hidden bg-slate-950 shadow-2xl">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="py-2.5 px-3 border-r border-slate-800 w-12 text-center">#</th>
                    {gridData[0].map((_, ci) => (
                      <th key={ci} className="py-2.5 px-3 border-r border-slate-800 font-bold text-slate-300">
                        {String.fromCharCode(65 + ci)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gridData.map((row, ri) => (
                    <tr
                      key={ri}
                      className={`border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors ${
                        ri === 0
                          ? 'bg-slate-900/60 font-bold text-cyan-300'
                          : ri === gridData.length - 1
                          ? 'bg-emerald-950/20 font-bold text-emerald-300'
                          : ''
                      }`}
                    >
                      {/* Row Index */}
                      <td className="py-2 px-3 border-r border-slate-800 bg-slate-950 text-slate-500 font-mono text-center text-[10px]">
                        {ri + 1}
                      </td>

                      {/* Cell Data */}
                      {row.map((cell, ci) => {
                        const isSelected = selectedCell.r === ri && selectedCell.c === ci;
                        const displayVal = calculateDisplayValue(cell, ri, ci);

                        return (
                          <td
                            key={ci}
                            onClick={() => handleSelectCell(ri, ci)}
                            className={`py-1.5 px-2 border-r border-slate-800/60 transition-all ${
                              isSelected
                                ? 'bg-indigo-950/40 ring-1 ring-cyan-400 text-white'
                                : 'text-slate-300'
                            }`}
                          >
                            <input
                              type="text"
                              value={displayVal}
                              onChange={(e) => {
                                handleCellChange(ri, ci, e.target.value);
                                setFormulaValue(e.target.value);
                              }}
                              className="w-full bg-transparent text-xs focus:outline-none"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-mono">
            <div>Spreadsheet formulas calculate dynamically. Click any cell to edit or inspect its raw formula.</div>
            <div className="text-emerald-400 font-bold">Standard Excel / Google Sheets CSV Compatible</div>
          </div>
        </div>
      )}
    </div>
  );
};

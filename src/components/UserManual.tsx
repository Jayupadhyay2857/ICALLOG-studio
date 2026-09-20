import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Download,
  Copy,
  Check,
  Gamepad2,
  Image,
  Video,
  Bot,
  HardDrive,
  CreditCard,
  Zap,
  Terminal,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Sparkles,
  Clapperboard,
  Mic,
  Film,
  FileText,
  Award,
  Globe,
  Printer,
  FileDown,
  CheckCircle2,
} from 'lucide-react';
import { ActiveTab } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { SUPPORTED_LANGUAGES, LanguageOption } from '../lib/i18n.ts';
import {
  getManualPackage,
  generateManualText,
  generateManualHtml,
  ManualSectionData,
} from '../lib/manualData.ts';

interface UserManualProps {
  setActiveTab: (tab: ActiveTab) => void;
  openPaymentModal: () => void;
  openAdminModal: () => void;
  openHistoryModal: () => void;
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const UserManual: React.FC<UserManualProps> = ({
  setActiveTab,
  openPaymentModal,
  openHistoryModal,
  onNotify,
}) => {
  const { currentLanguage, setLanguage, currentLangOption } = useLanguage();
  const [selectedLangCode, setSelectedLangCode] = useState<string>(currentLanguage || 'en');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSectionId, setActiveSectionId] = useState<string>('getting-started');
  const [copied, setCopied] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // Synchronize manual language if global language changes
  React.useEffect(() => {
    if (currentLanguage && currentLanguage !== selectedLangCode) {
      setSelectedLangCode(currentLanguage);
    }
  }, [currentLanguage]);

  // Handle switching language in the manual (also updates global language so user experience is cohesive)
  const handleSwitchLanguage = (langCode: string) => {
    setSelectedLangCode(langCode);
    setLanguage(langCode);
    const targetLang = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
    onNotify(
      'Language Switched',
      `Manual displayed in ${targetLang?.name || langCode} (${targetLang?.nativeName || ''})`,
      'info'
    );
  };

  // Get active language manual package (clean, sanitized - zero override key leaks)
  const activePackage = useMemo(() => {
    return getManualPackage(selectedLangCode);
  }, [selectedLangCode]);

  const activeLangOption = useMemo(() => {
    return (
      SUPPORTED_LANGUAGES.find((l) => l.code === selectedLangCode) ||
      currentLangOption ||
      SUPPORTED_LANGUAGES[0]
    );
  }, [selectedLangCode, currentLangOption]);

  // Section Icon Mapper
  const getSectionIcon = (id: string) => {
    switch (id) {
      case 'getting-started':
        return <Zap className="w-4 h-4 text-cyan-400" />;
      case '3d-engine':
        return <Gamepad2 className="w-4 h-4 text-indigo-400" />;
      case 'image-studio':
        return <Image className="w-4 h-4 text-pink-400" />;
      case 'video-audio':
        return <Video className="w-4 h-4 text-purple-400" />;
      case 'ai-mentor':
        return <Bot className="w-4 h-4 text-emerald-400" />;
      case 'payments-vip':
        return <CreditCard className="w-4 h-4 text-teal-400" />;
      case 'security-privacy':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'cloud-vault':
        return <HardDrive className="w-4 h-4 text-sky-400" />;
      case 'film-studio':
        return <Clapperboard className="w-4 h-4 text-amber-400" />;
      case 'voice-converter':
        return <Mic className="w-4 h-4 text-rose-400" />;
      case 'cross-modality':
        return <Film className="w-4 h-4 text-cyan-400" />;
      case 'office-suite':
        return <FileText className="w-4 h-4 text-cyan-400" />;
      case 'design-identity':
        return <Award className="w-4 h-4 text-purple-400" />;
      default:
        return <BookOpen className="w-4 h-4 text-cyan-400" />;
    }
  };

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return activePackage.sections;

    return activePackage.sections.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.badge.toLowerCase().includes(q) ||
        s.content.some(
          (c) =>
            c.heading.toLowerCase().includes(q) ||
            c.details.some((d) => d.toLowerCase().includes(q)) ||
            (c.proTips && c.proTips.some((pt) => pt.toLowerCase().includes(q)))
        )
    );
  }, [activePackage, searchQuery]);

  const currentSection = useMemo(() => {
    return (
      activePackage.sections.find((s) => s.id === activeSectionId) ||
      activePackage.sections[0]
    );
  }, [activePackage, activeSectionId]);

  // Copy Full Manual in Active Language
  const handleCopyManual = () => {
    const text = generateManualText(activePackage);
    navigator.clipboard.writeText(text);
    setCopied(true);
    onNotify(
      'Manual Copied',
      `Full manual copied to clipboard in ${activeLangOption.name}!`,
      'success'
    );
    setTimeout(() => setCopied(false), 2500);
  };

  // Download Manual as Markdown (.md) in Active Language
  const handleDownloadMarkdown = () => {
    const text = generateManualText(activePackage);
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const sanitizedLangName = activeLangOption.name.replace(/[^a-zA-Z0-9]/g, '_');
    link.download = `iCALLOG_V18_User_Manual_${sanitizedLangName}.md`;
    link.click();
    setShowDownloadMenu(false);
    onNotify(
      'Download Complete',
      `Saved ${link.download} to your downloads folder!`,
      'success'
    );
  };

  // Download Manual as Plain Text (.txt) in Active Language
  const handleDownloadTxt = () => {
    const text = generateManualText(activePackage);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const sanitizedLangName = activeLangOption.name.replace(/[^a-zA-Z0-9]/g, '_');
    link.download = `iCALLOG_V18_User_Manual_${sanitizedLangName}.txt`;
    link.click();
    setShowDownloadMenu(false);
    onNotify(
      'Download Complete',
      `Saved ${link.download} to your downloads folder!`,
      'success'
    );
  };

  // Download Printable Document / HTML in Active Language
  const handleDownloadHtml = () => {
    const html = generateManualHtml(activePackage, activeLangOption.name);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const sanitizedLangName = activeLangOption.name.replace(/[^a-zA-Z0-9]/g, '_');
    link.download = `iCALLOG_V18_User_Manual_${sanitizedLangName}.html`;
    link.click();
    setShowDownloadMenu(false);
    onNotify(
      'Document Ready',
      `Saved ${link.download}! Open in browser to view or print as PDF.`,
      'success'
    );
  };

  // Direct Print Dialog
  const handlePrintDoc = () => {
    const html = generateManualHtml(activePackage, activeLangOption.name);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      // Fallback to downloading html if popups blocked
      handleDownloadHtml();
    }
    setShowDownloadMenu(false);
  };

  return (
    <div id="user-manual-view" className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900/95 via-indigo-950/80 to-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <BookOpen className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black font-['Syne'] text-white">
                {activePackage.manualTitle}
              </h2>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                V18 A to Z
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {activePackage.manualSubtitle}
            </p>
          </div>

          {/* Language Selector & Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
            {/* Language Selector Dropdown */}
            <div className="relative flex items-center gap-1.5 bg-slate-950/90 border border-slate-700/80 rounded-2xl px-3 py-1.5 shadow-md">
              <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-base select-none">{activeLangOption.flag}</span>
              <select
                id="manual-language-selector"
                value={selectedLangCode}
                onChange={(e) => handleSwitchLanguage(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-2 appearance-none"
                title="Select language to read and download"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-slate-900 text-white py-1">
                    {lang.flag} {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>

            {/* Copy Manual Button */}
            <button
              id="copy-manual-btn"
              onClick={handleCopyManual}
              className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all shadow-sm"
              title="Copy entire manual text to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? activePackage.copied : activePackage.copyManual}</span>
            </button>

            {/* Download Dropdown / Button */}
            <div className="relative">
              <button
                id="download-manual-dropdown-btn"
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-900/30 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{activeLangOption.flag} Download Manual</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showDownloadMenu ? 'rotate-90' : ''}`} />
              </button>

              {/* Download Menu Popup */}
              {showDownloadMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl p-2 z-50 backdrop-blur-xl space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-mono text-cyan-400 font-bold border-b border-slate-800 flex items-center justify-between">
                    <span>FORMAT OPTIONS ({activeLangOption.name})</span>
                    <span>{activeLangOption.flag}</span>
                  </div>

                  <button
                    onClick={handleDownloadMarkdown}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-xs font-medium text-slate-200 flex items-center gap-2.5 transition-colors"
                  >
                    <FileDown className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="font-bold text-white leading-none">Markdown (.md)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{activePackage.downloadMd}</div>
                    </div>
                  </button>

                  <button
                    onClick={handleDownloadTxt}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-xs font-medium text-slate-200 flex items-center gap-2.5 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div className="font-bold text-white leading-none">Plain Text (.txt)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{activePackage.downloadTxt}</div>
                    </div>
                  </button>

                  <button
                    onClick={handleDownloadHtml}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-xs font-medium text-slate-200 flex items-center gap-2.5 transition-colors"
                  >
                    <Printer className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-bold text-white leading-none">Printable HTML (.html)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{activePackage.downloadHtml}</div>
                    </div>
                  </button>

                  <button
                    onClick={handlePrintDoc}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-xs font-medium text-slate-200 flex items-center gap-2.5 transition-colors"
                  >
                    <Printer className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-bold text-white leading-none">Print / Save as PDF</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{activePackage.printDoc}</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Language Badges Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
            <Globe className="w-3 h-3 text-cyan-400" /> Quick Language Switch:
          </span>
          {[
            { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
            { code: 'en', name: 'English', flag: '🇺🇸' },
            { code: 'es', name: 'Español', flag: '🇪🇸' },
            { code: 'fr', name: 'Français', flag: '🇫🇷' },
            { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
            { code: 'ar', name: 'العربية', flag: '🇸🇦' },
            { code: 'ja', name: '日本語', flag: '🇯🇵' },
            { code: 'zh', name: '中文', flag: '🇨🇳' },
            { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
            { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
          ].map((l) => (
            <button
              key={l.code}
              onClick={() => handleSwitchLanguage(l.code)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                selectedLangCode === l.code
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <span>{l.flag}</span>
              <span>{l.name}</span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="manual-search-input"
            type="text"
            placeholder={activePackage.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 rounded-xl bg-black/40 border border-slate-700/80 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Manual Layout: Sidebar Navigation + Content Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar Table of Contents */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 font-mono flex items-center justify-between">
            <span>{activePackage.tableOfContents} ({filteredSections.length})</span>
            <span className="text-[10px] text-cyan-400">{activeLangOption.nativeName}</span>
          </div>

          <div className="space-y-1.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredSections.map((sec) => {
              const isSelected = sec.id === currentSection.id;
              return (
                <button
                  key={sec.id}
                  id={`manual-toc-${sec.id}`}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`w-full p-3 rounded-2xl text-left border transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-950/90 to-slate-900/90 border-indigo-500 text-white shadow-lg shadow-indigo-950/40 font-bold ring-1 ring-indigo-500/30'
                      : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span className="p-1.5 rounded-lg bg-slate-800/80 mt-0.5">
                    {getSectionIcon(sec.id)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate leading-tight">{sec.title}</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{sec.summary}</div>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 mt-1 transition-transform ${
                      isSelected ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Quick Support Card */}
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-indigo-300 font-['Syne']">
              <HelpCircle className="w-4 h-4 text-cyan-400" /> {activePackage.needHelpTitle}
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {activePackage.needHelpDesc}
            </p>
            <button
              id="manual-ask-ai-mentor-btn"
              onClick={() => setActiveTab('chat_mentor')}
              className="w-full py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold text-center flex items-center justify-center gap-1.5 transition-colors shadow-md"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>{activePackage.askAiMentor}</span>
            </button>
          </div>
        </div>

        {/* Right Section Content Viewer */}
        <div className="lg:col-span-8">
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl shadow-xl space-y-6">
            {/* Section Heading */}
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                  {getSectionIcon(currentSection.id)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white font-['Syne']">
                      {currentSection.title}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {currentSection.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{currentSection.summary}</p>
                </div>
              </div>

              {/* Language Tag */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                <span>{activeLangOption.flag}</span>
                <span className="font-mono text-[11px] text-cyan-300">{activeLangOption.name}</span>
              </div>
            </div>

            {/* Subsection Articles */}
            <div className="space-y-6">
              {currentSection.content.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-cyan-300 font-['Syne'] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      {item.heading}
                    </h4>

                    {item.quickActionTab && (
                      <button
                        onClick={() => setActiveTab(item.quickActionTab as ActiveTab)}
                        className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors shadow-md"
                      >
                        <span>{item.quickActionLabel || 'Open'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <ul className="space-y-2">
                    {item.details.map((detail, dIdx) => (
                      <li key={dIdx} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                        <span className="text-cyan-400 font-bold font-mono mt-0.5">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Pro Tips Box */}
                  {item.proTips && item.proTips.length > 0 && (
                    <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-1.5">
                      <div className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> {activePackage.proTipsTitle}
                      </div>
                      {item.proTips.map((tip, tIdx) => (
                        <p key={tIdx} className="text-[11px] text-slate-300 leading-normal pl-4">
                          💡 {tip}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Keyboard Shortcuts Box */}
                  {item.keyboardShortcuts && item.keyboardShortcuts.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-700/60 space-y-2">
                      <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 font-mono">
                        <Terminal className="w-3.5 h-3.5 text-emerald-400" /> {activePackage.hotkeysTitle}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {item.keyboardShortcuts.map((sc, scIdx) => (
                          <div
                            key={scIdx}
                            className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-slate-800 text-[11px]"
                          >
                            <span className="text-slate-400">{sc.desc}</span>
                            <kbd className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[10px] border border-slate-700 font-bold">
                              {sc.key}
                            </kbd>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

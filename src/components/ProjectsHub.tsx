import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Plus,
  Pin,
  Share2,
  Trash2,
  Edit3,
  Check,
  Search,
  Sparkles,
  ExternalLink,
  Save,
  Tag,
  Copy,
  SlidersHorizontal,
  X,
  Clock,
  Film,
  Music,
  FileText,
  Palette,
  Box,
  Video,
  Mic,
  ArrowRight,
  Layers,
  FileSpreadsheet,
  Presentation,
  ShieldCheck,
  CreditCard,
  BookOpen
} from 'lucide-react';
import { ActiveTab, ProjectItem, UserProfile } from '../types.ts';
import { syncProjects } from '../lib/offlineSync.ts';
import { getProjectsFromIDB } from '../lib/offlineIndexedDB.ts';
import { UniversalMediaCaptureToolbar } from './UniversalMediaCaptureToolbar.tsx';

interface ProjectsHubProps {
  user: UserProfile;
  onNotify: (title: string, desc: string, type?: 'info' | 'success' | 'warning' | 'error' | 'admin') => void;
  setActiveTab: (tab: ActiveTab) => void;
  onSelectSubTab?: (tab: ActiveTab, subTab: string) => void;
  initialMode?: 'list' | 'blank';
  onUpdateUser?: (updated: UserProfile) => void;
  onOpenTutorial?: () => void;
  onOpenProfileModal?: (tab?: any) => void;
}

const STORAGE_KEY = 'icallog_user_projects_v1';

const DEFAULT_PROJECTS: ProjectItem[] = [
  {
    id: 'proj_default_1',
    title: 'Cyberpunk 2099: Hollywood Master Script',
    description: 'Feature-length sci-fi neo-noir screenplay with 3-act structure and character arcs.',
    category: 'film',
    isPinned: true,
    activeTool: 'film_studio',
    tags: ['Sci-Fi', 'Screenplay', 'Hollywood', 'Cyberpunk'],
    content: 'SCENE 1: EXT. NEO-METROPOLIS - NIGHT\nRain cascades over neon towering holograms. MARCUS stands by the ledge.',
    createdAt: '2026-09-18T10:00:00.000Z',
    updatedAt: '2026-09-19T04:30:00.000Z',
  },
  {
    id: 'proj_default_2',
    title: 'Neon Horizon: Synthwave Electronic Anthem',
    description: 'A-Z Music Studio production with retro synth leads, punchy 808 drums, and vocal vocoder.',
    category: 'music',
    isPinned: true,
    activeTool: 'song_studio',
    tags: ['Synthwave', 'EDM', '128 BPM', 'Audio Mix'],
    content: 'Verse 1: Lights in the rear view, city on the wire\nChorus: Neon horizon, taking me higher',
    createdAt: '2026-09-17T14:15:00.000Z',
    updatedAt: '2026-09-18T20:10:00.000Z',
  },
  {
    id: 'proj_default_3',
    title: 'Corporate Q4 Financial Model & KPI Deck',
    description: 'Multi-sheet operational workbook with profit-loss forecasts and visual breakdown charts.',
    category: 'office',
    isPinned: false,
    activeTool: 'office_suite',
    subTool: 'excel',
    tags: ['Spreadsheet', 'Q4 2026', 'Finance', 'Formulas'],
    content: 'Revenue Projection 2026: $1.4M (ARR growth +38%)',
    createdAt: '2026-09-16T09:00:00.000Z',
    updatedAt: '2026-09-17T11:20:00.000Z',
  },
  {
    id: 'proj_default_4',
    title: 'Global Security ID Badge & Executive Cards',
    description: 'High-security metallic QR-coded staff credentials and matching business cards.',
    category: 'design',
    isPinned: false,
    activeTool: 'design_studio',
    subTool: 'badges',
    tags: ['Identity', 'Badges', 'QR Code', 'Print-Ready'],
    content: 'Badge Code: IC-8842-ALPHA | Clearance Level: 5 Executive',
    createdAt: '2026-09-15T18:00:00.000Z',
    updatedAt: '2026-09-16T15:40:00.000Z',
  },
];

export const ProjectsHub: React.FC<ProjectsHubProps> = ({
  user,
  onNotify,
  setActiveTab,
  onSelectSubTab,
  initialMode = 'list',
}) => {
  // Projects State
  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_PROJECTS;
  });

  // Current active mode: 'list' (My Projects) or 'workbench' (Blank Project Workspace)
  const [currentView, setCurrentView] = useState<'list' | 'workbench'>(
    initialMode === 'blank' ? 'workbench' : 'list'
  );

  // Active loaded project in the workbench
  const [activeProject, setActiveProject] = useState<ProjectItem>(() => {
    return (
      projects[0] || {
        id: `proj_${Date.now()}`,
        title: 'Untitled Blank Project',
        description: 'New creative project with free access to all ICALLOG tools.',
        category: 'general',
        isPinned: false,
        activeTool: 'office_suite',
        subTool: 'docs',
        tags: ['New', 'Draft'],
        content: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
  });

  // Workbench in-progress edits
  const [wbTitle, setWbTitle] = useState(activeProject.title);
  const [wbDesc, setWbDesc] = useState(activeProject.description);
  const [wbCategory, setWbCategory] = useState(activeProject.category);
  const [wbContent, setWbContent] = useState(activeProject.content || '');
  const [wbTool, setWbTool] = useState<ActiveTab>(activeProject.activeTool);
  const [wbSubTool, setWbSubTool] = useState<string | undefined>(activeProject.subTool);
  const [wbTags, setWbTags] = useState<string[]>(activeProject.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isSavedRecently, setIsSavedRecently] = useState(true);

  // Filters & Search for Projects List
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modals
  const [modifyModalProject, setModifyModalProject] = useState<ProjectItem | null>(null);
  const [modTitle, setModTitle] = useState('');
  const [modDesc, setModDesc] = useState('');
  const [modCategory, setModCategory] = useState<ProjectItem['category']>('general');
  const [modTagsText, setModTagsText] = useState('');

  const [shareModalProject, setShareModalProject] = useState<ProjectItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Persist projects to localStorage and IndexedDB
  useEffect(() => {
    syncProjects(projects).catch(console.warn);
  }, [projects]);

  // If local state was empty or default, attempt restoration from IndexedDB
  useEffect(() => {
    getProjectsFromIDB().then((idbProjects) => {
      if (idbProjects && idbProjects.length > 0) {
        // Only hydrate if we had defaulted or fewer items
        setProjects((prev) => (prev === DEFAULT_PROJECTS ? idbProjects : prev));
      }
    }).catch(console.warn);
  }, []);

  // Sync workbench inputs whenever activeProject changes
  useEffect(() => {
    setWbTitle(activeProject.title);
    setWbDesc(activeProject.description);
    setWbCategory(activeProject.category);
    setWbContent(activeProject.content || '');
    setWbTool(activeProject.activeTool);
    setWbSubTool(activeProject.subTool);
    setWbTags(activeProject.tags || []);
    setIsSavedRecently(true);
  }, [activeProject]);

  // Create a brand new blank project
  const handleCreateBlankProject = () => {
    const newId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newProj: ProjectItem = {
      id: newId,
      title: `Blank Project #${projects.length + 1}`,
      description: 'Unified blank canvas with all ICALLOG free tools & engines.',
      category: 'general',
      isPinned: false,
      activeTool: 'office_suite',
      subTool: 'docs',
      tags: ['Blank Project', 'Free Tools'],
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProjects((prev) => [newProj, ...prev]);
    setActiveProject(newProj);
    setCurrentView('workbench');
    onNotify(
      'Blank Project Created',
      `"${newProj.title}" is ready. All free features are active!`,
      'success'
    );
  };

  // Save current workbench changes
  const handleSaveWorkbench = () => {
    const updatedProj: ProjectItem = {
      ...activeProject,
      title: wbTitle.trim() || 'Untitled Project',
      description: wbDesc.trim() || 'No description provided.',
      category: wbCategory,
      content: wbContent,
      activeTool: wbTool,
      subTool: wbSubTool,
      tags: wbTags,
      updatedAt: new Date().toISOString(),
    };

    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProj.id ? updatedProj : p))
    );
    setActiveProject(updatedProj);
    setIsSavedRecently(true);
    onNotify('Project Saved', `"${updatedProj.title}" has been saved to My Projects.`, 'success');
  };

  // Toggle Pin on a project
  const handleTogglePin = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextPinned = !p.isPinned;
          onNotify(
            nextPinned ? 'Project Pinned' : 'Project Unpinned',
            `"${p.title}" ${nextPinned ? 'pinned to top' : 'unpinned'}.`,
            'info'
          );
          return { ...p, isPinned: nextPinned, updatedAt: new Date().toISOString() };
        }
        return p;
      })
    );

    if (activeProject.id === id) {
      setActiveProject((prev) => ({ ...prev, isPinned: !prev.isPinned }));
    }
  };

  // Delete project
  const handleDeleteProject = (id: string, title: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      onNotify('Project Deleted', `"${title}" has been deleted.`, 'warning');
      if (activeProject.id === id) {
        const remaining = projects.filter((p) => p.id !== id);
        if (remaining.length > 0) {
          setActiveProject(remaining[0]);
        }
      }
    }
  };

  // Open Modify modal
  const handleOpenModifyModal = (proj: ProjectItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setModifyModalProject(proj);
    setModTitle(proj.title);
    setModDesc(proj.description);
    setModCategory(proj.category);
    setModTagsText(proj.tags.join(', '));
  };

  // Save modified details from modal
  const handleSaveModifiedDetails = () => {
    if (!modifyModalProject) return;
    const splitTags = modTagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const updated: ProjectItem = {
      ...modifyModalProject,
      title: modTitle.trim() || 'Untitled Project',
      description: modDesc.trim() || '',
      category: modCategory,
      tags: splitTags,
      updatedAt: new Date().toISOString(),
    };

    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    if (activeProject.id === updated.id) {
      setActiveProject(updated);
      setWbTitle(updated.title);
      setWbDesc(updated.description);
      setWbCategory(updated.category);
      setWbTags(updated.tags);
    }

    setModifyModalProject(null);
    onNotify('Project Modified', `Updated details for "${updated.title}".`, 'success');
  };

  // Open Share modal
  const handleOpenShareModal = (proj: ProjectItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShareModalProject(proj);
    setCopiedLink(false);
  };

  // Copy shareable link
  const handleCopyShareLink = () => {
    if (!shareModalProject) return;
    const shareUrl = `${window.location.origin}/?project=${shareModalProject.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    onNotify('Share Link Copied', 'Link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Add a tag to active project
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!wbTags.includes(tagInput.trim())) {
        const next = [...wbTags, tagInput.trim()];
        setWbTags(next);
        setIsSavedRecently(false);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setWbTags(wbTags.filter((t) => t !== tagToRemove));
    setIsSavedRecently(false);
  };

  // Jump into the dedicated tool with this project
  const handleLaunchExternalStudio = (tool: ActiveTab, sub?: string) => {
    handleSaveWorkbench();
    if (sub && onSelectSubTab) {
      onSelectSubTab(tool, sub);
    } else {
      setActiveTab(tool);
    }
    onNotify('Studio Launched', `Opening ${tool} with project data.`, 'info');
  };

  // Free Features List for the blank project workspace
  const freeToolsCatalog = [
    {
      id: 'film_studio' as ActiveTab,
      label: 'Film & Script Studio',
      icon: '🎬',
      desc: 'Hollywood Screenwriting & Director Master Shot Lists',
      badge: 'Cinema',
    },
    {
      id: 'song_studio' as ActiveTab,
      label: 'A-Z Song & Music',
      icon: '🎵',
      desc: '26 Audio Styles, AI Vocals, BPM & Track Arrangement',
      badge: 'Music',
    },
    {
      id: 'media_mixer' as ActiveTab,
      label: 'AI Media Mixer',
      icon: '🌀',
      desc: 'Fusion of Images, Video, Audio Clips & Multi-track timeline',
      badge: 'Fusion',
    },
    {
      id: 'office_suite' as ActiveTab,
      sub: 'docs',
      label: 'Word Docs Editor',
      icon: '📄',
      desc: 'Clean Rich Text Documentation, Export to PDF & Markdown',
      badge: 'Office',
    },
    {
      id: 'office_suite' as ActiveTab,
      sub: 'ppt',
      label: 'PowerPoint Slide Deck',
      icon: '📊',
      desc: 'Visual Presentations, Bullet Decks & Interactive Slideware',
      badge: 'Office',
    },
    {
      id: 'office_suite' as ActiveTab,
      sub: 'excel',
      label: 'Excel Spreadsheet',
      icon: '📈',
      desc: 'Grid Formulas, SUM, AVERAGE, Cell Formatting & Math Engine',
      badge: 'Office',
    },
    {
      id: 'design_studio' as ActiveTab,
      sub: 'favicon',
      label: 'Favicon & Logo Studio',
      icon: '✨',
      desc: 'Web App Favicons, 32x32 to 512x512 PNG/SVG Generator',
      badge: 'Design',
    },
    {
      id: 'design_studio' as ActiveTab,
      sub: 'badges',
      label: 'Security ID Badges',
      icon: '🛡️',
      desc: 'Employee Identification, NFC/QR Code Metal Cards',
      badge: 'Design',
    },
    {
      id: 'design_studio' as ActiveTab,
      sub: 'business_cards',
      label: 'Executive Cards',
      icon: '💳',
      desc: 'Custom Luxury Business Cards with Golden Foil accents',
      badge: 'Design',
    },
    {
      id: 'design_studio' as ActiveTab,
      sub: 'resume',
      label: 'ATS Resume Builder',
      icon: '📝',
      desc: 'Single-column professional resume layout with score check',
      badge: 'Design',
    },
    {
      id: '3d_engine' as ActiveTab,
      label: '3D WebGL Engine',
      icon: '🎮',
      desc: 'Interactive 3D Viewport, Cyber Androids, Three.js Rendering',
      badge: '3D',
    },
    {
      id: 'image_studio' as ActiveTab,
      label: '8K Images Diffusion',
      icon: '🖼️',
      desc: 'Photorealistic Image Synthesis with Style Presets',
      badge: 'Art',
    },
    {
      id: 'video_audio' as ActiveTab,
      label: '8K Video Suite',
      icon: '🎥',
      desc: 'Image-to-Video Animator, 24-60 FPS Cinematic Clips',
      badge: 'Video',
    },
    {
      id: 'voice_converter' as ActiveTab,
      label: 'Voice AI & Synthesizer',
      icon: '🎙️',
      desc: 'Text-to-Speech Morphing, Pitch, Frequency & Neural Voice',
      badge: 'Audio',
    },
  ];

  // Filtered projects for list view
  const filteredProjects = projects
    .filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchFilter.toLowerCase()));

      const matchCategory =
        categoryFilter === 'all' || p.category === categoryFilter;

      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      // Pinned first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Then by updatedAt descending
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'film':
        return <Film className="w-3.5 h-3.5 text-amber-400" />;
      case 'music':
        return <Music className="w-3.5 h-3.5 text-purple-400" />;
      case 'office':
        return <FileText className="w-3.5 h-3.5 text-cyan-400" />;
      case 'design':
        return <Palette className="w-3.5 h-3.5 text-rose-400" />;
      case '3d':
        return <Box className="w-3.5 h-3.5 text-indigo-400" />;
      case 'video':
        return <Video className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Universal Quick Media Capture & Recording Toolbar */}
      <UniversalMediaCaptureToolbar user={user} onNotify={(t, d, ty) => onNotify(t, d, ty as any)} />

      {/* Top Header Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#0d1424]/90 to-slate-900/90 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
              <FolderKanban className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-white font-['Syne'] tracking-wide">
                  Projects & Blank Workspace Hub
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {projects.length} {projects.length === 1 ? 'Project' : 'Projects'} Saved
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Unlimited Projects
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Create unlimited projects, start with clean blank canvases, and access all ICALLOG free tools with save, pin, share, and modify controls.
              </p>
            </div>
          </div>

          {/* Action Tabs Switcher & New Project Button */}
          <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto">
            <button
              onClick={() => setActiveTab('role_dashboard')}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-cyan-300 border border-indigo-500/40 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              title="Open Role-tailored dynamic workspace dashboard"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Role Dashboard</span>
            </button>

            <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800">
              <button
                onClick={() => setCurrentView('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  currentView === 'list'
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>My Projects ({projects.length})</span>
              </button>

              <button
                onClick={() => setCurrentView('workbench')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  currentView === 'workbench'
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Blank Project Studio</span>
              </button>
            </div>

            <button
              onClick={handleCreateBlankProject}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Blank Project</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: BLANK PROJECT WORKSPACE / STUDIO */}
      {currentView === 'workbench' && (
        <div className="space-y-5">
          {/* Active Project Control Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-md">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex-1 w-full">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider">
                    Editing Project
                  </span>
                  {activeProject.isPinned && (
                    <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                      <Pin className="w-3 h-3 fill-amber-400" /> Pinned
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Updated {new Date(activeProject.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={wbTitle}
                    onChange={(e) => {
                      setWbTitle(e.target.value);
                      setIsSavedRecently(false);
                    }}
                    placeholder="Project Title..."
                    className="w-full text-base sm:text-lg font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-cyan-400 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Action Toolbar for Active Project: Save, Pin, Share, Details, Delete */}
              <div className="flex items-center gap-1.5 flex-wrap self-end md:self-auto">
                <button
                  onClick={handleSaveWorkbench}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isSavedRecently
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 animate-pulse'
                  }`}
                  title="Save Project (Persist to Local Storage)"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavedRecently ? 'Saved' : 'Save Project'}</span>
                </button>

                <button
                  onClick={() => handleTogglePin(activeProject.id)}
                  className={`p-2 rounded-xl text-xs border transition-all ${
                    activeProject.isPinned
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white border-slate-700/50'
                  }`}
                  title={activeProject.isPinned ? 'Unpin Project' : 'Pin Project to Top'}
                >
                  <Pin className={`w-3.5 h-3.5 ${activeProject.isPinned ? 'fill-amber-400' : ''}`} />
                </button>

                <button
                  onClick={() => handleOpenShareModal(activeProject)}
                  className="p-2 rounded-xl text-xs bg-slate-800/80 text-slate-300 hover:text-cyan-400 border border-slate-700/50 transition-all"
                  title="Share Project Link"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleOpenModifyModal(activeProject)}
                  className="p-2 rounded-xl text-xs bg-slate-800/80 text-slate-300 hover:text-purple-400 border border-slate-700/50 transition-all"
                  title="Modify Project Details"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDeleteProject(activeProject.id, activeProject.title)}
                  className="p-2 rounded-xl text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all"
                  title="Delete Project"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Description & Category selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                  Project Description & Goals
                </label>
                <input
                  type="text"
                  value={wbDesc}
                  onChange={(e) => {
                    setWbDesc(e.target.value);
                    setIsSavedRecently(false);
                  }}
                  placeholder="Describe your creative vision, requirements, or script outline..."
                  className="w-full text-xs text-slate-200 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                  Category
                </label>
                <select
                  value={wbCategory}
                  onChange={(e) => {
                    setWbCategory(e.target.value as ProjectItem['category']);
                    setIsSavedRecently(false);
                  }}
                  className="w-full text-xs text-slate-200 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 focus:border-cyan-400 focus:outline-none"
                >
                  <option value="general">✨ General / Multi-Tool</option>
                  <option value="film">🎬 Cinema & Script</option>
                  <option value="music">🎵 Music & Audio</option>
                  <option value="office">📄 Office & Docs</option>
                  <option value="design">🎨 Design & Branding</option>
                  <option value="3d">🎮 3D WebGL</option>
                  <option value="video">🎥 8K Video</option>
                </select>
              </div>
            </div>

            {/* Tags Bar */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
                <Tag className="w-3 h-3 text-slate-400" /> Tags:
              </span>
              {wbTags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-slate-400 hover:text-rose-400 ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="+ Add tag (Press Enter)"
                className="text-[11px] bg-transparent border-b border-slate-700 text-slate-300 px-1 py-0.5 focus:border-cyan-400 focus:outline-none w-36"
              />
            </div>
          </div>

          {/* All Free Features Launcher Grid */}
          <div className="p-5 rounded-2xl bg-[#090e18] border border-slate-800/90 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Free Studio Engines for this Project
                </h2>
                <p className="text-xs text-slate-400">
                  Select any tool below to launch and link its creative output into this project.
                </p>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                14+ Free Tools Integrated
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {freeToolsCatalog.map((tool) => (
                <div
                  key={`${tool.id}-${tool.sub || 'root'}`}
                  className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/40 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl p-1.5 rounded-lg bg-slate-800/80 group-hover:scale-110 transition-transform">
                        {tool.icon}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-cyan-300 border border-slate-700">
                        {tool.badge}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {tool.label}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {tool.desc}
                    </p>
                  </div>

                  <button
                    onClick={() => handleLaunchExternalStudio(tool.id, tool.sub)}
                    className="mt-3 w-full py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-cyan-600 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <span>Launch & Work</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Project Scratchpad & Notes */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Project Scratchpad, Content & Action Notes
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                {wbContent.length} characters
              </span>
            </div>
            <textarea
              value={wbContent}
              onChange={(e) => {
                setWbContent(e.target.value);
                setIsSavedRecently(false);
              }}
              rows={6}
              placeholder="Jot down script concepts, song chord progressions, document draft outlines, or production notes here..."
              className="w-full text-xs font-mono text-slate-200 bg-slate-950/80 border border-slate-800 rounded-xl p-3 focus:border-cyan-400 focus:outline-none resize-y leading-relaxed"
            />
            <div className="flex justify-end">
              <button
                onClick={handleSaveWorkbench}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:scale-105 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Notes & Content</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: MY PROJECTS LIST & MANAGEMENT */}
      {currentView === 'list' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search projects by title or tag..."
                className="w-full text-xs text-white bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 focus:border-cyan-400 focus:outline-none"
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {[
                { id: 'all', label: 'All' },
                { id: 'film', label: '🎬 Film' },
                { id: 'music', label: '🎵 Music' },
                { id: 'office', label: '📄 Office' },
                { id: 'design', label: '🎨 Design' },
                { id: '3d', label: '🎮 3D' },
                { id: 'general', label: '✨ General' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    categoryFilter === cat.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Projects Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Quick Create Card */}
            <button
              onClick={handleCreateBlankProject}
              className="p-6 rounded-2xl border-2 border-dashed border-slate-800 hover:border-cyan-500/50 bg-slate-950/40 hover:bg-slate-900/40 transition-all flex flex-col items-center justify-center text-center gap-3 group min-h-[220px]"
            >
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 group-hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Create Blank Project
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Start fresh with full access to all 14+ free tools, custom tags, and infinite saves.
                </p>
              </div>
              <span className="text-[11px] px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-bold font-mono">
                + Instant New
              </span>
            </button>

            {/* Render Projects */}
            {filteredProjects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => {
                  setActiveProject(proj);
                  setCurrentView('workbench');
                }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative ${
                  proj.isPinned
                    ? 'bg-gradient-to-b from-[#11192d] to-slate-900 border-amber-500/40 shadow-lg shadow-amber-500/5'
                    : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700 shadow-md'
                }`}
              >
                <div>
                  {/* Top Bar: Category Pill + Pin status + Action buttons */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center gap-1 font-mono uppercase">
                        {getCategoryIcon(proj.category)}
                        <span>{proj.category}</span>
                      </span>

                      {proj.isPinned && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 font-bold">
                          <Pin className="w-2.5 h-2.5 fill-amber-400" />
                          PINNED
                        </span>
                      )}
                    </div>

                    {/* Quick Card Action Buttons */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleTogglePin(proj.id, e)}
                        className={`p-1.5 rounded-lg text-xs transition-colors ${
                          proj.isPinned
                            ? 'text-amber-400 bg-amber-500/10'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                        }`}
                        title={proj.isPinned ? 'Unpin' : 'Pin to Top'}
                      >
                        <Pin className={`w-3.5 h-3.5 ${proj.isPinned ? 'fill-amber-400' : ''}`} />
                      </button>

                      <button
                        onClick={(e) => handleOpenModifyModal(proj, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-slate-800 transition-colors"
                        title="Modify Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleOpenShareModal(proj, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                        title="Share Link"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleDeleteProject(proj.id, proj.title, e)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                    {proj.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {proj.description || 'No description provided.'}
                  </p>

                  {/* Tags */}
                  {proj.tags && proj.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {proj.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-400 font-mono border border-slate-800"
                        >
                          #{tag}
                        </span>
                      ))}
                      {proj.tags.length > 3 && (
                        <span className="text-[10px] text-slate-400 font-mono self-center">
                          +{proj.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Card Footer */}
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date(proj.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>

                  <span className="text-cyan-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    <span>Open Project</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 space-y-3">
              <Search className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">No projects found matching your search or category filter.</p>
              <button
                onClick={() => {
                  setSearchFilter('');
                  setCategoryFilter('all');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs hover:text-white"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: MODIFY PROJECT DETAILS */}
      {modifyModalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0e1424] border border-slate-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-['Syne']">
                  Modify Project Details
                </h3>
              </div>
              <button
                onClick={() => setModifyModalProject(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  value={modTitle}
                  onChange={(e) => setModTitle(e.target.value)}
                  className="w-full text-xs text-white bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  Description
                </label>
                <textarea
                  value={modDesc}
                  onChange={(e) => setModDesc(e.target.value)}
                  rows={3}
                  className="w-full text-xs text-white bg-slate-900 border border-slate-800 rounded-xl p-3 focus:border-cyan-400 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  Category
                </label>
                <select
                  value={modCategory}
                  onChange={(e) => setModCategory(e.target.value as ProjectItem['category'])}
                  className="w-full text-xs text-white bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 focus:border-cyan-400 focus:outline-none"
                >
                  <option value="general">✨ General / Multi-Tool</option>
                  <option value="film">🎬 Cinema & Script</option>
                  <option value="music">🎵 Music & Audio</option>
                  <option value="office">📄 Office & Docs</option>
                  <option value="design">🎨 Design & Identity</option>
                  <option value="3d">🎮 3D WebGL</option>
                  <option value="video">🎥 8K Video Suite</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={modTagsText}
                  onChange={(e) => setModTagsText(e.target.value)}
                  placeholder="e.g. Cinema, Script, Hollywood, V18"
                  className="w-full text-xs text-white bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setModifyModalProject(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModifiedDetails}
                className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SHARE PROJECT MODAL */}
      {shareModalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0e1424] border border-slate-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-['Syne']">
                  Share Project
                </h3>
              </div>
              <button
                onClick={() => setShareModalProject(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <h4 className="text-xs font-bold text-white mb-0.5">
                {shareModalProject.title}
              </h4>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                {shareModalProject.description}
              </p>
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                Shareable Direct Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/?project=${shareModalProject.id}`}
                  className="w-full text-xs text-slate-300 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono"
                />
                <button
                  onClick={handleCopyShareLink}
                  className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Project configuration is encrypted and portable across all ICALLOG environments.
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShareModalProject(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

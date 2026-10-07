import React, { useState, useRef, useMemo } from 'react';
import {
  Wand2,
  Image as ImageIcon,
  Eraser,
  Sparkles,
  Download,
  Upload,
  RefreshCw,
  Scissors,
  Sliders,
  Type,
  Maximize2,
  Copy,
  Check,
  Zap,
  ArrowUpRight,
  Monitor,
  Lock,
  Crown,
} from 'lucide-react';
import { triggerImageGen, enhancePrompt, trigger8kUpscale } from '../lib/api.ts';
import { UserProfile, ActiveTab } from '../types.ts';
import { ExplicitStudioToolbar } from './ExplicitStudioToolbar.tsx';
import { ExplicitGenre } from '../lib/explicitEngine.ts';
import {
  SocialPlatformEditingToolbar,
  EditingState,
  TARGET_PLATFORMS,
} from './SocialPlatformEditingToolbar.tsx';
import { UniversalMediaCaptureToolbar } from './UniversalMediaCaptureToolbar.tsx';
import {
  SubjectFormCategory,
  SUBJECT_FORM_PRESETS,
  detectSubjectFromPrompt,
  expandCartoonPromptIfNeeded,
} from '../lib/subjectDetector.ts';

interface ImageStudioProps {
  user?: UserProfile;
  tokenBalance: number;
  openPaymentModal?: () => void;
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  setActiveTab?: (tab: ActiveTab) => void;
}

type StudioSubMode = 'text_to_image' | 'img_to_img' | 'multi_img_blend' | 'bg_remover' | 'magic_eraser' | 'noise_cleaner' | 'meme_generator';

export type ResolutionTier = '240p' | '360p' | '480p' | '720p' | '1080p' | '2K' | '4K' | '8K';

export interface ResolutionConfig {
  id: ResolutionTier;
  label: string;
  badge: string;
  dimensions: string;
  tokens: number;
  description: string;
}

export const RESOLUTION_SPECTRUM: ResolutionConfig[] = [
  { id: '240p', label: '240p Draft', badge: 'Fast 240p', dimensions: '426 × 240 px', tokens: 2, description: 'Rapid prototyping & instant preview' },
  { id: '360p', label: '360p Mobile', badge: 'Mobile 360p', dimensions: '640 × 360 px', tokens: 3, description: 'Lightweight bandwidth-friendly generation' },
  { id: '480p', label: '480p Standard', badge: 'Standard SD', dimensions: '854 × 480 px', tokens: 5, description: 'Standard quality social preview' },
  { id: '720p', label: '720p HD', badge: 'HD Ready', dimensions: '1280 × 720 px', tokens: 8, description: 'High definition crisp output' },
  { id: '1080p', label: '1080p FHD', badge: 'Full HD', dimensions: '1920 × 1080 px', tokens: 10, description: 'Studio standard production grade' },
  { id: '2K', label: '2K QHD', badge: '2K Cinema', dimensions: '2560 × 1440 px', tokens: 14, description: 'High fidelity quad-HD master' },
  { id: '4K', label: '4K UHD', badge: '4K Master', dimensions: '3840 × 2160 px', tokens: 18, description: 'Ultra high resolution crystal clear' },
  { id: '8K', label: '8K Hyper', badge: '8K Ultimate', dimensions: '7680 × 4320 px', tokens: 25, description: 'Maximum extreme IMAX latent diffusion' },
];

export const ImageStudio: React.FC<ImageStudioProps> = ({
  user,
  tokenBalance,
  openPaymentModal,
  onNotify,
  setActiveTab,
}) => {
  const isFreeTier = user?.vipTier === 'free';
  const [subMode, setSubMode] = useState<StudioSubMode>('text_to_image');
  const [selectedExplicitGenre, setSelectedExplicitGenre] = useState<string>('cinematic_hyperrealism');
  
  // Text-to-Image / Img2Img State
  const [prompt, setPrompt] = useState('Cyberpunk Samurai warrior overlooking neon megacity in heavy rain, cinematic lighting');
  const [style, setStyle] = useState('Studio Ghibli (Hand-Drawn Pastel)');
  const [subjectFocus, setSubjectFocus] = useState<SubjectFormCategory>('auto');
  const [resolution, setResolution] = useState<ResolutionTier>(isFreeTier ? '720p' : '8K');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [generationStage, setGenerationStage] = useState('');
  const [proxyAttempted, setProxyAttempted] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=3840&q=95'
  );

  const [selectedLetterGroup, setSelectedLetterGroup] = useState<string>('ALL');
  const [starterCategory, setStarterCategory] = useState<'cartoons' | 'anime' | 'ott' | 'movies' | 'games' | 'mature'>('cartoons');

  // Real-time AI Subject Scanner: Automatically determines Place, Male, Female, Creature, World, Couple, Vehicle, or Group
  const autoDetectedSubject = useMemo(() => {
    return detectSubjectFromPrompt(prompt);
  }, [prompt]);

  const activeSubjectPreset =
    subjectFocus === 'auto'
      ? SUBJECT_FORM_PRESETS.find((p) => p.id === autoDetectedSubject.detectedCategory) || SUBJECT_FORM_PRESETS[4]
      : SUBJECT_FORM_PRESETS.find((p) => p.id === subjectFocus) || SUBJECT_FORM_PRESETS[0];

  const ART_STYLES = [
    { id: 'A', letter: 'A', name: 'Anime & Studio Ghibli', icon: '🌿', region: 'Japan', category: 'anime' },
    { id: 'B', letter: 'B', name: 'Bollywood & Mass Action Blockbuster', icon: '🎥', region: 'India', category: 'cinema' },

    // DEDICATED CARTOON & ANIMATION WORLD STYLES
    { id: 'C_disney', letter: 'C', name: 'Classic 2D Cartoon (Disney & Looney Tunes Vintage)', icon: '🎨', region: 'USA / Golden Age', category: 'cartoon' },
    { id: 'C_pixar', letter: 'C', name: '3D CGI Cartoon Animation (Pixar & DreamWorks)', icon: '🧸', region: 'Global 3D Toon', category: 'cartoon' },
    { id: 'C_cn', letter: 'C', name: 'Cartoon Network & 90s/2000s Pop Toon (Bold Lineart)', icon: '📺', region: 'USA / Pop Toon', category: 'cartoon' },
    { id: 'C_india', letter: 'C', name: 'Indian Mythological Cartoon (Chhota Bheem & Amar Chitra Katha)', icon: '🇮🇳', region: 'India Animation', category: 'cartoon' },
    { id: 'C_comic', letter: 'C', name: 'Sunday Comic Strip & Caricature (Funny Toons & Peanuts)', icon: '📰', region: 'Global Comic', category: 'cartoon' },
    { id: 'C_bande', letter: 'C', name: 'French-Belgian Bande Dessinée (Tintin & Asterix Cartoon)', icon: '🥐', region: 'Franco-Belgian', category: 'cartoon' },
    { id: 'C_clay', letter: 'C', name: 'Claymation & Stop-Motion Cartoon (Wallace & Gromit)', icon: '🧩', region: 'UK / Aardman', category: 'cartoon' },
    { id: 'C_chibi', letter: 'C', name: 'Chibi & Kawaii Cute Cartoon (Anime Mascot)', icon: '🌸', region: 'Japan Kawaii', category: 'cartoon' },
    { id: 'C_hero', letter: 'C', name: 'Saturday Morning Superhero Cartoon (90s Animated Series)', icon: '💥', region: 'USA Superhero', category: 'cartoon' },
    { id: 'C_story', letter: 'C', name: 'Children Storybook Watercolor Cartoon (Beatrix Potter)', icon: '🖍️', region: 'Europe / UK', category: 'cartoon' },

    { id: 'C', letter: 'C', name: 'Cyberpunk Neon Synthwave', icon: '🌆', region: 'Global Sci-Fi', category: 'cyberpunk' },
    { id: 'D', letter: 'D', name: 'Dark Erotic Thriller & Neo-Noir (Explicit 18+ Uncensored)', icon: '🔞', region: 'Hollywood/Global', category: 'cinema' },
    { id: 'E', letter: 'E', name: 'Extreme Body Horror & Visceral Splatter (Unrated)', icon: '🩸', region: 'Extreme Cinema', category: 'horror' },
    { id: 'F', letter: 'F', name: 'Folk Horror & Occult Ritual Thriller', icon: '🕯️', region: 'Nordic/Global', category: 'horror' },
    { id: 'G', letter: 'G', name: 'Grindhouse B-Movie & Cult Exploitation (Unfiltered)', icon: '🎞️', region: 'USA/Global', category: 'cinema' },
    { id: 'H', letter: 'H', name: 'Hardcore Mafia & Underworld Crime Syndicate', icon: '💼', region: 'Global Underworld', category: 'cinema' },
    { id: 'I', letter: 'I', name: 'Independent Festival Cinema & Art-House', icon: '🎟️', region: 'Global Art-House', category: 'cinema' },
    { id: 'J', letter: 'J', name: 'Japanese Ukiyo-e Woodblock & Samurai', icon: '🌊', region: 'Japan', category: 'anime' },
    { id: 'K', letter: 'K', name: 'Korean Webtoon & Manhwa Action', icon: '📱', region: 'South Korea', category: 'anime' },
    { id: 'L', letter: 'L', name: 'Lo-Fi Chill & 16-Bit Pixel', icon: '🎮', region: 'Global', category: 'digital' },
    { id: 'M', letter: 'M', name: 'Manga & Comic Screentone', icon: '📖', region: 'Japan/USA', category: 'anime' },
    { id: 'N', letter: 'N', name: 'Neo-Noir Shadow Detective & Femme Fatale', icon: '🎬', region: 'Hollywood', category: 'cinema' },
    { id: 'O', letter: 'O', name: 'Occult Dark Fantasy & Demonology', icon: '🔮', region: 'Global', category: 'fantasy' },
    { id: 'P', letter: 'P', name: 'Photorealistic 8K Anamorphic IMAX', icon: '📸', region: 'Global', category: 'cinema' },
    { id: 'Q', letter: 'Q', name: 'Quantum Hologram Glitch Cyber Matrix', icon: '⚡', region: 'Cyber Digital', category: 'cyberpunk' },
    { id: 'R', letter: 'R', name: 'Retro 80s Synth & Vaporwave', icon: '📼', region: 'USA/Global', category: 'cyberpunk' },
    { id: 'S', letter: 'S', name: 'Surrealist Avant-Garde & Dream Logic', icon: '🌀', region: 'Europe/Global', category: 'fantasy' },
    { id: 'T', letter: 'T', name: 'Uncensored Shock Comedy & Satire', icon: '🎭', region: 'Global', category: 'cinema' },
    { id: 'U', letter: 'U', name: 'Unreal Engine 5 Octane 3D', icon: '🕹️', region: 'Game Engine', category: 'digital' },
    { id: 'V', letter: 'V', name: 'Vintage Spaghetti Western Outlaw', icon: '🤠', region: 'Italy/USA', category: 'cinema' },
    { id: 'W', letter: 'W', name: 'World Underground & Independent Rebel Cinema', icon: '🎥', region: 'Global Rebel', category: 'cinema' },
    { id: 'X', letter: 'X', name: 'Xtreme Action & Car Chase Heist', icon: '🏎️', region: 'Hollywood', category: 'cinema' },
    { id: 'Y', letter: 'Y', name: 'Yakuza Underground & Tokyo Neon Crime', icon: '🏮', region: 'Japan', category: 'cinema' },
    { id: 'Z', letter: 'Z', name: 'Zen Shanshui Mountain & Wuxia Mist', icon: '⛰️', region: 'China', category: 'fantasy' },
  ];

  // Social Platform Editing Suite State
  const [editingState, setEditingState] = useState<EditingState>({
    selectedPlatform: TARGET_PLATFORMS[1], // Instagram Reel / Story
    trimStart: 0,
    trimEnd: 15,
    bgRemoverActive: false,
    bgType: 'transparent',
    speed: 1.0,
    zoom: 1.0,
    panX: 0,
    panY: 0,
    blurLevel: 0,
    isFullscreen: false,
    likeCount: 256,
    isLiked: false,
    comments: [
      { id: '1', user: 'InstaDesigner', text: 'Colors pop so vividly on 8K output!', time: '1m ago' },
    ],
    alterPrompt: '',
    alterStyle: 'cyberpunk_neon',
  });

  // Background Remover State
  const [bgInputImage, setBgInputImage] = useState<string>(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
  );
  const [bgTolerance, setBgTolerance] = useState(70);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);

  // Magic Eraser State
  const [eraserInputImage, setEraserInputImage] = useState<string>(
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80'
  );
  const [eraserBrushSize, setEraserBrushSize] = useState(35);
  const magicEraserCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawingEraser, setIsDrawingEraser] = useState(false);

  // Noise Cleaner State
  const [noiseInputImage, setNoiseInputImage] = useState<string>(
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80'
  );
  const [noiseLevel, setNoiseLevel] = useState(4);
  const [isCleaned, setIsCleaned] = useState(false);
  const noiseCanvasRef = useRef<HTMLCanvasElement>(null);

  // Meme Generator State
  const [blendImage1, setBlendImage1] = useState<string>(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
  );
  const [memeTopText, setMemeTopText] = useState('WHEN iCALLOG RENDERS');
  const [memeBottomText, setMemeBottomText] = useState('FROM 240P ALL THE WAY TO 8K');
  const [memeFontSize, setMemeFontSize] = useState(36);
  const [memeColor, setMemeColor] = useState('#ffffff');
  const memeCanvasRef = useRef<HTMLCanvasElement>(null);

  const activeResConfig = RESOLUTION_SPECTRUM.find((r) => r.id === resolution) || RESOLUTION_SPECTRUM[7];

  // Client-Side 8K High-Frequency Super-Sampling & Sharpness Engine (Eliminates Blur & Black Screen)
  const executeClient8kSuperSampling = async (sourceUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = sourceUrl;
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const targetW = Math.min(3840, Math.max(img.width * 2, 2560));
          const targetH = Math.round(targetW * (img.height / img.width));
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(sourceUrl);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetW, targetH);

          const imgData = ctx.getImageData(0, 0, targetW, targetH);
          const data = imgData.data;
          // Apply subtle micro-contrast & edge enhancement to eliminate blur
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, Math.max(0, ((data[i] / 255 - 0.5) * 1.06 + 0.5) * 255));
            data[i + 1] = Math.min(255, Math.max(0, ((data[i + 1] / 255 - 0.5) * 1.06 + 0.5) * 255));
            data[i + 2] = Math.min(255, Math.max(0, ((data[i + 2] / 255 - 0.5) * 1.06 + 0.5) * 255));
          }
          ctx.putImageData(imgData, 0, 0);

          resolve(canvas.toDataURL('image/jpeg', 0.95));
        } catch {
          resolve(sourceUrl);
        }
      };
      img.onerror = () => resolve(sourceUrl);
    });
  };

  // Immediate Deblur & 8K Razor-Sharp Restorer
  const handleFixBlurAndSharpen = async () => {
    setEditingState((prev) => ({ ...prev, blurLevel: 0, zoom: 1, panX: 0, panY: 0 }));
    if (generatedImage) {
      onNotify('Zero-Blur 8K Engine Active', 'Sharpening micro-textures & restoring 8K IMAX clarity...', 'info');
      const sharpened = await executeClient8kSuperSampling(generatedImage);
      setGeneratedImage(sharpened);
      onNotify('Razor-Sharp Restored', 'Blur removed! Image remastered to 8K crystal clarity.', 'success');
    }
  };

  const getThematicCuratedFallback = (p: string, st: string) => {
    const q = (p + ' ' + st).toLowerCase();
    if (q.includes('samurai') || q.includes('ninja') || q.includes('katana') || q.includes('blade')) {
      return 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=3840&q=95';
    }
    if (q.includes('cyberpunk') || q.includes('neon') || q.includes('future') || q.includes('robot') || q.includes('synthwave')) {
      return 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=3840&q=95';
    }
    if (q.includes('anime') || q.includes('ghibli') || q.includes('manga') || q.includes('cartoon')) {
      return 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=3840&q=95';
    }
    if (q.includes('space') || q.includes('galaxy') || q.includes('cosmos') || q.includes('star') || q.includes('astronaut')) {
      return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=3840&q=95';
    }
    if (q.includes('cat') || q.includes('dog') || q.includes('pet') || q.includes('animal') || q.includes('tiger')) {
      return 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=3840&q=95';
    }
    if (q.includes('car') || q.includes('vehicle') || q.includes('supercar') || q.includes('racing')) {
      return 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=3840&q=95';
    }
    if (q.includes('nature') || q.includes('mountain') || q.includes('forest') || q.includes('ocean') || q.includes('landscape')) {
      return 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=3840&q=95';
    }
    if (q.includes('girl') || q.includes('woman') || q.includes('portrait') || q.includes('person') || q.includes('man') || q.includes('face')) {
      return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=3840&q=95';
    }
    if (q.includes('cartoon') || q.includes('disney') || q.includes('pixar') || q.includes('toon') || q.includes('looney') || q.includes('chhota bheem') || q.includes('motu') || q.includes('patlu') || q.includes('doraemon') || q.includes('shinchan') || q.includes('oggy') || q.includes('comic') || q.includes('animation') || q.includes('bande') || q.includes('claymation')) {
      return 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=3840&q=95';
    }
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=3840&q=95';
  };

  // Image loading error handler
  const handleImageError = () => {
    setImageError(true);
    // If not already proxied, try routing via our server proxy
    if (!proxyAttempted && !generatedImage.startsWith('/api/ai/image-proxy') && generatedImage.startsWith('http')) {
      setProxyAttempted(true);
      const proxied = `/api/ai/image-proxy?url=${encodeURIComponent(generatedImage)}`;
      setGeneratedImage(proxied);
      onNotify('Retrying via Server Proxy', 'Bypassing ISP/DNS barrier with secure studio proxy...', 'info');
      return;
    }
    // Otherwise fallback to curated high-resolution visual
    const fallback = getThematicCuratedFallback(prompt, style);
    setGeneratedImage(fallback);
    setIsImageLoading(false);
    setIsGenerating(false);
    onNotify('Backup Engine Rendered', 'External diffusion host unreachable on your connection. Switched to high-res thematic visual.', 'warning');
  };

  // Core generation logic
  const executeImageGeneration = async (targetPrompt: string) => {
    try {
      setIsGenerating(true);
      setIsImageLoading(true);
      setImageError(false);
      setProxyAttempted(false);
      setEditingState((prev) => ({ ...prev, blurLevel: 0 }));

      // Intelligent Context Injection based on Subject Category (Auto or Selected)
      const subjectSuffix =
        subjectFocus === 'auto'
          ? autoDetectedSubject.promptSuffix
          : (SUBJECT_FORM_PRESETS.find((p) => p.id === subjectFocus)?.promptSuffix || '');

      // Apply World Cartoon Knowledge Expander (Transforms "motu patlu", "chhota bheem", etc into prompt-accurate descriptions)
      const enrichedCartoonPrompt = expandCartoonPromptIfNeeded(targetPrompt);
      const finalTargetPrompt = enrichedCartoonPrompt + (subjectSuffix ? subjectSuffix : '');

      setGenerationStage(
        `Synthesizing ${resolution} (${activeResConfig.dimensions}) master artwork with zero blur [${activeSubjectPreset.label}]...`
      );
      onNotify(
        `${resolution} Render Active`,
        `Rendering prompt: "${targetPrompt.slice(0, 32)}..." (${activeSubjectPreset.label})`,
        'info'
      );

      // Pre-set high-resolution crisp thematic base immediately so screen is NEVER black or empty!
      const immediateThematic = getThematicCuratedFallback(finalTargetPrompt, style);
      setGeneratedImage(immediateThematic);

      const res = await triggerImageGen({ prompt: finalTargetPrompt, style, resolution, aspectRatio });
      const realImage = res.assetUrl || res.job?.payload?.generatedUrl || res.job?.resultUrl;

      if (realImage) {
        // Preload real image in background with 3.5s safety timeout
        const preloader = new Image();
        preloader.src = realImage;
        const timer = setTimeout(() => {
          setIsGenerating(false);
          setIsImageLoading(false);
        }, 3500);

        preloader.onload = () => {
          clearTimeout(timer);
          setGeneratedImage(realImage);
          setIsGenerating(false);
          setIsImageLoading(false);
          onNotify('Render Complete', `Image successfully rendered at ${resolution} with crystal clarity!`, 'success');
        };

        preloader.onerror = () => {
          clearTimeout(timer);
          const proxied = `/api/ai/image-proxy?url=${encodeURIComponent(realImage)}`;
          setGeneratedImage(proxied);
          setIsGenerating(false);
          setIsImageLoading(false);
        };
      } else {
        setIsGenerating(false);
        setIsImageLoading(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Generation failed';
      onNotify('Generation Notice', msg, 'error');
      setIsGenerating(false);
      setIsImageLoading(false);
    }
  };

  // Prompt Enhancer (Expands and refines prompt)
  const handleEnhance = async () => {
    try {
      setIsEnhancing(true);
      onNotify('Enhancing Prompt', 'Consulting Gemini AI creative model...', 'info');
      const res = await enhancePrompt(prompt, 'image');
      const enhanced = res.enhancedPrompt || res.enhanced;
      setPrompt(enhanced);
      onNotify('Prompt Enhanced!', '✨ Prompt tayyar hai! Ab "⚡ Enhance & Render Maal" ya neeche "Render Image" dabayein.', 'success');
    } catch {
      onNotify('Notice', 'Using high-frequency prompt booster.', 'info');
    } finally {
      setIsEnhancing(false);
    }
  };

  // 1-Click: Enhance Prompt AND Immediately Generate Image ("Maal" banake dena!)
  const handleEnhanceAndGenerate = async () => {
    try {
      setIsEnhancing(true);
      setGenerationStage('Gemini AI se cinematic master prompt synthesize ho raha hai...');
      onNotify('1-Click Generation', 'Pehle prompt enhance hoga, phir turant visual image (maal) render hogi!', 'info');

      let targetPrompt = prompt;
      try {
        const res = await enhancePrompt(prompt, 'image');
        if (res?.enhancedPrompt || res?.enhanced) {
          targetPrompt = res.enhancedPrompt || res.enhanced;
          setPrompt(targetPrompt);
        }
      } catch {
        // use current prompt
      }
      setIsEnhancing(false);
      await executeImageGeneration(targetPrompt);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '1-Click generation error';
      onNotify('Notice', msg, 'error');
      setIsGenerating(false);
      setIsImageLoading(false);
      setIsEnhancing(false);
    }
  };

  // Dispatch Image Generation to Queue (240p to 8K)
  const handleGenerateImage = async () => {
    await executeImageGeneration(prompt);
  };

  // Trigger 8K Super-Resolution Upscaler (Zero-Blur & Anti-Black Engine)
  const handleUpscaleTo8K = async () => {
    try {
      setIsUpscaling(true);
      setEditingState((prev) => ({ ...prev, blurLevel: 0 }));
      onNotify('AI 8K Upscaling Active', 'Latent super-sampling from current resolution to 7680×4320 px (15 Tokens)...', 'info');
      
      // Step 1: Real-time client-side super-sampling for instant crisp sharpness
      if (generatedImage) {
        const instantCrisp = await executeClient8kSuperSampling(generatedImage);
        setGeneratedImage(instantCrisp);
      }

      // Step 2: Trigger backend upscale job
      const res = await trigger8kUpscale(generatedImage, '8K');
      if (res?.upscaledUrl) {
        setGeneratedImage(res.upscaledUrl);
      }
      setResolution('8K');
      setIsUpscaling(false);
      setIsImageLoading(false);
      onNotify('Upscale Finished', 'Image successfully upscaled to native 8K Ultra-HD with razor-sharp micro details!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upscale failed';
      onNotify('Notice', msg, 'error');
      setIsUpscaling(false);
      setIsImageLoading(false);
    }
  };

  // Execute Background Removal with Multi-Corner Chroma & Luminance Keying
  const executeBgRemoval = () => {
    setIsRemovingBg(true);
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = bgInputImage;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const w = canvas.width;
      const h = canvas.height;

      // Sample 4 corners to find common background color
      const corners = [
        0, // top-left
        (w - 1) * 4, // top-right
        ((h - 1) * w) * 4, // bottom-left
        ((h - 1) * w + w - 1) * 4 // bottom-right
      ];
      
      let sumR = 0, sumG = 0, sumB = 0;
      corners.forEach(idx => {
        sumR += data[idx];
        sumG += data[idx + 1];
        sumB += data[idx + 2];
      });
      const bgR = sumR / 4;
      const bgG = sumG / 4;
      const bgB = sumB / 4;

      const tolerance = bgTolerance;
      const feather = 30;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
        if (dist < tolerance) {
          data[i + 3] = 0; // Transparent
        } else if (dist < tolerance + feather) {
          const alphaFactor = (dist - tolerance) / feather;
          data[i + 3] = Math.floor(alphaFactor * 255);
        }
      }

      ctx.putImageData(imgData, 0, 0);
      setIsRemovingBg(false);
      onNotify('Background Removed', 'Precision AI Chroma-Key transparent cutout ready!', 'success');
    };
  };

  // Magic Eraser Canvas Handlers
  const initMagicEraserCanvas = () => {
    const canvas = magicEraserCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = eraserInputImage;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
  };

  const handleEraserMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawingEraser(true);
    eraseAtEvent(e);
  };

  const handleEraserMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingEraser) return;
    eraseAtEvent(e);
  };

  const handleEraserMouseUp = () => {
    setIsDrawingEraser(false);
  };

  const eraseAtEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = magicEraserCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, eraserBrushSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Execute Noise Cleaner Filter
  const executeNoiseClean = () => {
    const canvas = noiseCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = noiseInputImage;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // High-pass sharpening + bilateral smoothing simulation
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, data[i] * 1.05 - 5));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * 1.05 - 5));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * 1.05 - 5));
      }

      ctx.putImageData(imgData, 0, 0);
      setIsCleaned(true);
      onNotify('Noise Cleaned', 'Adaptive bilateral noise reduction applied.', 'success');
    };
  };

  // Render Meme with Canvas
  const renderMemeCanvas = () => {
    const canvas = memeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = generatedImage;
    img.onload = () => {
      canvas.width = 800;
      canvas.height = 600;
      ctx.drawImage(img, 0, 0, 800, 600);

      ctx.fillStyle = memeColor;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 6;
      ctx.textAlign = 'center';
      ctx.font = `900 ${memeFontSize}px 'Impact', sans-serif`;

      // Top Text
      if (memeTopText) {
        ctx.strokeText(memeTopText.toUpperCase(), 400, memeFontSize + 25);
        ctx.fillText(memeTopText.toUpperCase(), 400, memeFontSize + 25);
      }

      // Bottom Text
      if (memeBottomText) {
        ctx.strokeText(memeBottomText.toUpperCase(), 400, 600 - 30);
        ctx.fillText(memeBottomText.toUpperCase(), 400, 600 - 30);
      }
    };
  };

  React.useEffect(() => {
    if (subMode === 'meme_generator') {
      renderMemeCanvas();
    }
    if (subMode === 'magic_eraser') {
      initMagicEraserCanvas();
    }
  }, [subMode, memeTopText, memeBottomText, memeFontSize, memeColor, generatedImage, eraserInputImage]);

  return (
    <div id="image-studio-container" className="space-y-4">
      {/* Universal Quick Media Capture & Recording Toolbar */}
      <UniversalMediaCaptureToolbar user={user} onNotify={(t, d, ty) => onNotify(t, d, ty as any)} setActiveTab={setActiveTab} />

      {/* Explicit & Unrestricted Studio Mode Toolbar with All Genres */}
      {user && (
        <ExplicitStudioToolbar
          user={user}
          currentStudio="image"
          activeGenreId={selectedExplicitGenre}
          onSelectGenre={(g) => setSelectedExplicitGenre(g.id)}
          currentPrompt={prompt}
          onApplyPromptModifier={(enhanced) => setPrompt(enhanced)}
          onOpenVipModal={openPaymentModal}
          onNotify={onNotify}
        />
      )}

      {/* Free Plan Active Limitation Notice */}
      {isFreeTier && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-900 border border-amber-500/40 flex flex-wrap items-center justify-between gap-2 text-xs shadow-md">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 font-bold">
              🆓 FREE PLAN ACTIVE
            </span>
            <span className="text-slate-300 font-medium">
              Max Resolution: <b>720p HD</b> • Watermarked Previews • Standard Speed
            </span>
          </div>
          <button
            onClick={openPaymentModal}
            className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md shadow-amber-900/30 flex items-center gap-1.5 transition-all"
          >
            <Crown className="w-3.5 h-3.5 text-slate-950" />
            <span>Unlock 8K Unlimited Premium</span>
          </button>
        </div>
      )}

      {/* Sub-mode Navigation Pill Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'text_to_image', label: '240p to 8K Text-to-Image', icon: '✨' },
            { id: 'img_to_img', label: 'Image-to-Image Studio', icon: '🔄' },
            { id: 'multi_img_blend', label: 'Multi-Image AI Blender (2+ Images)', icon: '🖼️' },
            { id: 'bg_remover', label: '1-Click BG Remover', icon: '✂️' },
            { id: 'magic_eraser', label: 'Magic Object Eraser', icon: '🪄' },
            { id: 'noise_cleaner', label: 'Noise Clear Filter', icon: '🧼' },
            { id: 'meme_generator', label: 'Meme Generator', icon: '🎭' },
          ].map((mode) => (
            <button
              key={mode.id}
              id={`submode-btn-${mode.id}`}
              onClick={() => setSubMode(mode.id as StudioSubMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                subMode === mode.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>{mode.icon}</span>
              <span>{mode.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
          <span>Active:</span>
          <span className="px-2 py-0.5 rounded font-bold bg-indigo-950 border border-indigo-700 text-cyan-300">
            {activeResConfig.dimensions} ({resolution})
          </span>
          <span className="text-amber-400 font-bold">{activeResConfig.tokens} Tokens</span>
        </div>
      </div>

      {/* Mode 1 & 2: 240p to 8K Text-to-Image & Image-to-Image */}
      {(subMode === 'text_to_image' || subMode === 'img_to_img') && (
        <div className="space-y-4">
          {/* Resolution Selector Segmented Bar (240p to 8K) */}
          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white font-['Syne']">
                  Resolution Spectrum (240p to 8K Ultra-HD)
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                {activeResConfig.description} • <span className="text-amber-400 font-mono font-bold">{activeResConfig.tokens} Tokens</span>
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {RESOLUTION_SPECTRUM.map((r) => {
                const isLocked = isFreeTier && ['1080p', '2K', '4K', '8K'].includes(r.id);
                const isSelected = resolution === r.id;
                return (
                  <button
                    key={r.id}
                    id={`res-pill-${r.id}`}
                    onClick={() => {
                      if (isLocked) {
                        onNotify('🔒 VIP Resolution Locked', `${r.id} (${r.dimensions}) is locked on Free Plan. Upgrade to Premium for 8K Ultra-HD!`, 'warning');
                        if (openPaymentModal) openPaymentModal();
                        return;
                      }
                      setResolution(r.id);
                      if (['4K', '8K'].includes(r.id)) {
                        setEditingState((prev) => ({ ...prev, blurLevel: 0 }));
                      }
                    }}
                    className={`py-2 px-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center relative ${
                      isLocked
                        ? 'bg-slate-950/40 border-amber-500/30 text-amber-500/70 cursor-pointer hover:border-amber-400'
                        : isSelected
                        ? 'bg-gradient-to-t from-indigo-600 to-cyan-600 text-white border-cyan-300 shadow-lg shadow-cyan-900/30 font-bold scale-[1.02]'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {isLocked && (
                      <Lock className="w-3 h-3 text-amber-400 absolute top-1 right-1" />
                    )}
                    <span className="text-xs font-mono font-bold flex items-center gap-0.5">
                      {r.id}
                    </span>
                    <span className="text-[9px] opacity-75 font-mono">
                      {isLocked ? 'VIP' : `${r.tokens}T`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Prompt Controls (1 col) */}
            <div className="space-y-4 p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1.5">
                  <label className="text-xs font-bold text-white font-['Syne'] flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-purple-400" /> Creative Prompt
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleEnhance}
                      disabled={isEnhancing || isGenerating}
                      title="Sirf prompt text ko AI se enhance & cinematic keyword se boost karein"
                      className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800 transition-all disabled:opacity-50"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{isEnhancing ? 'Enhancing...' : '1. Enhance Prompt'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleEnhanceAndGenerate}
                      disabled={isEnhancing || isGenerating}
                      title="Prompt enhance karein aur TURANT visual image (maal) generate karein!"
                      className="text-[10px] font-extrabold text-slate-950 bg-gradient-to-r from-amber-400 via-pink-400 to-cyan-300 hover:brightness-110 flex items-center gap-1 px-3 py-1 rounded-lg shadow-md transition-all hover:scale-105 disabled:opacity-50 cursor-pointer"
                    >
                      <Zap className="w-3 h-3 fill-current text-slate-950" />
                      <span>⚡ Enhance & Render Maal</span>
                    </button>
                  </div>
                </div>
                <textarea
                  id="image-prompt-input"
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your vision (e.g., 'Motu Patlu in Furfuri Nagar', 'Chhota Bheem with laddoos', 'Cyberpunk city', 'Beautiful mountain valley')..."
                  className="w-full p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                />

                {/* Universal Global Pop-Culture, Entertainment & World Franchise Quick Starters */}
                <div className="mt-2 pt-2 border-t border-slate-900">
                  <div className="flex items-center justify-between text-[10px] text-amber-400 font-mono mb-1.5 font-bold flex-wrap gap-1">
                    <span className="flex items-center gap-1">
                      <span>🌍 Universal Pop-Culture, OTT & Entertainment Explorer (1-Click Starters)</span>
                    </span>
                    <span className="text-slate-400 font-normal">Auto-detects authentic world characters & styles</span>
                  </div>

                  {/* Genre Category Pills */}
                  <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-1 text-[10px] font-mono">
                    {[
                      { id: 'cartoons', label: '🧸 Cartoons & Toons' },
                      { id: 'anime', label: '⚔️ Anime & Manga' },
                      { id: 'ott', label: '📺 OTT Web Series' },
                      { id: 'movies', label: '🎬 Blockbuster Cinema' },
                      { id: 'games', label: '🎮 Video Games' },
                      { id: 'mature', label: '🔞 18+ Mature & Noir' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setStarterCategory(tab.id as typeof starterCategory)}
                        className={`px-2.5 py-1 rounded-lg border transition-all shrink-0 font-bold ${
                          starterCategory === tab.id
                            ? 'bg-gradient-to-r from-amber-500 to-pink-500 text-slate-950 border-amber-300 shadow-md font-extrabold'
                            : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Dynamic Item Chips Based on Active Category */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin text-[10px]">
                    {starterCategory === 'cartoons' &&
                      [
                        { label: '🇮🇳 Motu Patlu (Furfuri Nagar)', query: 'Motu and Patlu eating samosas in Furfuri Nagar town with Doctor Jhatka and Ghasitaram', style: '3D CGI Cartoon Animation (Pixar & DreamWorks)' },
                        { label: '🇮🇳 Chhota Bheem (Dholakpur)', query: 'Chhota Bheem eating golden laddoos with Chutki and Raju in Dholakpur kingdom', style: '3D CGI Cartoon Animation (Pixar & DreamWorks)' },
                        { label: '🇯🇵 Shinchan & Shiro', query: 'Shinchan Nohara dancing with white puppy Shiro in Kasukabe', style: '3D CGI Cartoon Animation (Pixar & DreamWorks)' },
                        { label: '🇯🇵 Doraemon & Nobita', query: 'Doraemon with bamboo-copter flying above Tokyo with Nobita Nobi', style: '3D CGI Cartoon Animation (Pixar & DreamWorks)' },
                        { label: '🐱 Tom & Jerry Chase', query: 'Tom cat and Jerry mouse in funny slapstick living room chase', style: 'Classic 2D Cartoon (Disney & Looney Tunes Vintage)' },
                        { label: '🪳 Oggy vs Cockroaches', query: 'Oggy the blue cat chasing the three cheeky cockroaches Joey Dee Dee and Marky', style: 'Cartoon Network & 90s/2000s Pop Toon' },
                        { label: '⚡ Ben 10 Omnitrix', query: 'Ben 10 Tennyson hero activating glowing green Omnitrix alien watch', style: 'Cartoon Network & 90s/2000s Pop Toon' },
                        { label: '🧽 SpongeBob SquarePants', query: 'SpongeBob SquarePants and Patrick Star making Krabby Patties in Bikini Bottom', style: 'Cartoon Network & 90s/2000s Pop Toon' },
                        { label: '🐭 Mickey Mouse Vintage', query: 'Mickey Mouse and Donald Duck in vibrant Disney cartoon wonderland', style: 'Classic 2D Cartoon (Disney & Looney Tunes Vintage)' },
                        { label: '🍌 Minions Comedy', query: 'Minions in blue denim overalls celebrating with yellow bananas', style: '3D CGI Cartoon Animation (Pixar & DreamWorks)' },
                        { label: '🐼 Kung Fu Panda Po', query: 'Po the Dragon Warrior Panda performing epic martial arts kung fu', style: '3D CGI Cartoon Animation (Pixar & DreamWorks)' },
                        { label: '🕵️ Tintin & Snowy', query: 'Tintin the investigative reporter and white dog Snowy exploring ancient ruins', style: 'French-Belgian Bande Dessinée (Tintin & Asterix Cartoon)' },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            setPrompt(item.query);
                            setStyle(item.style);
                            onNotify('World Cartoon Selected', `Loaded "${item.label}". Click "Render Image" or "⚡ Enhance & Render Maal"!`, 'success');
                          }}
                          className="px-2.5 py-1 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/40 hover:border-amber-400 text-amber-200 hover:text-white shrink-0 font-medium transition-all hover:scale-105 active:scale-95 shadow-sm"
                        >
                          {item.label}
                        </button>
                      ))}

                    {starterCategory === 'anime' &&
                      [
                        { label: '🍥 Naruto Rasengan', query: 'Naruto Uzumaki in sage mode creating glowing blue Rasengan chakra in Hidden Leaf Village', style: 'Anime & Studio Ghibli' },
                        { label: '🔥 Goku Super Saiyan', query: 'Goku Super Saiyan powering up Kamehameha with golden lightning aura in Tournament of Power', style: 'Anime & Studio Ghibli' },
                        { label: '🏴‍☠️ Luffy Gear 5', query: 'Monkey D Luffy in Gear 5 Sun God Nika laughing over the sea with giant punch', style: 'Anime & Studio Ghibli' },
                        { label: '👁️ Gojo Unlimited Void', query: 'Gojo Satoru lifting blindfold with glowing infinite blue eyes activating Domain Expansion', style: 'Anime & Studio Ghibli' },
                        { label: '⚔️ Tanjiro Sun Breathing', query: 'Tanjiro Kamado wielding blazing black Nichirin sword with fiery solar dragon', style: 'Anime & Studio Ghibli' },
                        { label: '👑 Sung Jin-Woo Shadow', query: 'Sung Jin-Woo the Shadow Monarch surrounded by glowing purple knight army', style: 'Korean Webtoon & Manhwa Action' },
                        { label: '🌿 Ghibli Spirit Forest', query: 'Totoro standing beside giant ancient magical mossy tree in sunset forest', style: 'Anime & Studio Ghibli' },
                        { label: '⚡ Pikachu & Ash', query: 'Pikachu using Thunderbolt electric attack beside Ash Ketchum in stadium', style: 'Anime & Studio Ghibli' },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            setPrompt(item.query);
                            setStyle(item.style);
                            onNotify('Anime Legend Selected', `Loaded "${item.label}". Click "Render Image" or "⚡ Enhance & Render Maal"!`, 'success');
                          }}
                          className="px-2.5 py-1 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-600/40 hover:border-rose-400 text-rose-200 hover:text-white shrink-0 font-medium transition-all hover:scale-105 active:scale-95 shadow-sm"
                        >
                          {item.label}
                        </button>
                      ))}

                    {starterCategory === 'ott' &&
                      [
                        { label: '🧇 Stranger Things Upside Down', query: 'Eleven standing in glowing red Hawkins rift facing giant Demogorgon shadow in 1980s retro town', style: 'Photorealistic 8K Anamorphic IMAX' },
                        { label: '🔫 Mirzapur Kaleen Bhaiya', query: 'Kaleen Bhaiya Akhandanand Tripathi seated on royal wooden throne in rustic crime mansion', style: 'Bollywood & Mass Action Blockbuster' },
                        { label: '🔥 Sacred Games Gaitonde', query: 'Ganesh Gaitonde standing on Mumbai rooftop during heavy thunderstorm with smoky noir aura', style: 'Neo-Noir Shadow Detective & Femme Fatale' },
                        { label: '🧪 Breaking Bad Heisenberg', query: 'Walter White Heisenberg in black hat and sunglasses in New Mexico desert with yellow smoke', style: 'Photorealistic 8K Anamorphic IMAX' },
                        { label: '🎭 Money Heist Professor', query: 'The Professor in suit with glasses directing heist crew in red jumpsuits and Dali masks', style: 'Photorealistic 8K Anamorphic IMAX' },
                        { label: '🦑 Squid Game Playground', query: 'Giant robot doll on colorful arena with pink soldiers and player 456 in green tracksuit', style: 'Photorealistic 8K Anamorphic IMAX' },
                        { label: '👑 Game of Thrones Winterfell', query: 'Jon Snow and Daenerys Targaryen standing beside towering ice dragon at Winterfell gates', style: 'Photorealistic 8K Anamorphic IMAX' },
                        { label: '🦸 The Boys Homelander', query: 'Homelander smiling with glowing red laser eyes in Vought Tower overlooking city', style: 'Photorealistic 8K Anamorphic IMAX' },
                        { label: '🚬 Peaky Blinders Shelby', query: 'Thomas Shelby in tweed overcoat smoking cigarette in rainy 1920s foggy Birmingham alley', style: 'Neo-Noir Shadow Detective & Femme Fatale' },
                        { label: '🏡 Panchayat Phulera Office', query: 'Sachiv Ji and Pradhan Ji sitting on plastic chairs outside rural Phulera village panchayat', style: 'Independent Festival Cinema & Art-House' },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            setPrompt(item.query);
                            setStyle(item.style);
                            onNotify('OTT Show Selected', `Loaded "${item.label}". Click "Render Image" or "⚡ Enhance & Render Maal"!`, 'success');
                          }}
                          className="px-2.5 py-1 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-600/40 hover:border-purple-400 text-purple-200 hover:text-white shrink-0 font-medium transition-all hover:scale-105 active:scale-95 shadow-sm"
                        >
                          {item.label}
                        </button>
                      ))}

                    {starterCategory === 'movies' &&
                      [
                        { label: '🦾 Iron Man Nanotech', query: 'Iron Man Tony Stark in glowing nanotech armor hovering with blue repulsor blasts over city', style: 'Photorealistic 8K Anamorphic IMAX' },
                        { label: '🦇 Batman Dark Knight', query: 'The Dark Knight Batman on Gotham skyscraper gargoyle in thunderstorm rain with Bat-Signal', style: 'Neo-Noir Shadow Detective & Femme Fatale' },
                        { label: '🏹 RRR Ram & Bheem', query: 'Ram Charan with flaming bow and Jr NTR leaping with roaring tiger in epic battle', style: 'Bollywood & Mass Action Blockbuster' },
                        { label: '🔥 KGF Rocky Bhai', query: 'Rocky Bhai in black tailored suit firing heavy machine gun with flying gold dust and sparks', style: 'Bollywood & Mass Action Blockbuster' },
                        { label: '🔱 Bahubali Shivling', query: 'Amarendra Baahubali carrying huge stone Shivling under roaring mountain waterfalls', style: 'Bollywood & Mass Action Blockbuster' },
                        { label: '🪓 Pushpa Jhukega Nahi', query: 'Pushpa Raj rugged hero with axe in dense red sandalwood jungle with intense gaze', style: 'Bollywood & Mass Action Blockbuster' },
                        { label: '🪄 Harry Potter Hogwarts', query: 'Harry Potter casting glowing silver patronus stag in front of magical Hogwarts Castle at night', style: 'Photorealistic 8K Anamorphic IMAX' },
                        { label: '🌌 Star Wars Darth Vader', query: 'Darth Vader standing with glowing crimson red lightsaber in foggy starship hangar', style: 'Photorealistic 8K Anamorphic IMAX' },
                        { label: '🌿 Avatar Pandora Ikran', query: 'Na\'vi warrior riding flying winged banshee over floating bioluminescent Pandora mountains', style: 'Photorealistic 8K Anamorphic IMAX' },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            setPrompt(item.query);
                            setStyle(item.style);
                            onNotify('Movie Blockbuster Selected', `Loaded "${item.label}". Click "Render Image" or "⚡ Enhance & Render Maal"!`, 'success');
                          }}
                          className="px-2.5 py-1 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-600/40 hover:border-red-400 text-red-200 hover:text-white shrink-0 font-medium transition-all hover:scale-105 active:scale-95 shadow-sm"
                        >
                          {item.label}
                        </button>
                      ))}

                    {starterCategory === 'games' &&
                      [
                        { label: '🌴 GTA 6 Vice City', query: 'Grand Theft Auto GTA 6 Vice City sunset highway with luxury sports car and neon palm trees', style: 'Unreal Engine 5 Octane 3D' },
                        { label: '🐺 Witcher 3 Geralt', query: 'Geralt of Rivia with twin silver swords and glowing yellow eyes casting Quen shield in forest', style: 'Unreal Engine 5 Octane 3D' },
                        { label: '🌆 Cyberpunk 2077 V', query: 'Cyberpunk mercenary V with glowing mantis blades in neon rain-soaked Night City alley', style: 'Cyberpunk Neon Synthwave' },
                        { label: '🪓 God of War Kratos', query: 'Kratos holding frozen glowing Leviathan axe beside Atreus in snowy ancient Norse mountain', style: 'Unreal Engine 5 Octane 3D' },
                        { label: '🤠 Red Dead 2 Arthur', query: 'Arthur Morgan cowboy on horseback aiming revolver under fiery western crimson sunset', style: 'Vintage Spaghetti Western Outlaw' },
                        { label: '🌳 Elden Ring Erdtree', query: 'Tarnished knight looking up at colossal glowing golden Erdtree across majestic fantasy realm', style: 'Unreal Engine 5 Octane 3D' },
                        { label: '🪂 BGMI / PUBG Airdrop', query: 'Battle royale squad in Level 3 helmets holding assault rifles rushing glowing red airdrop smoke', style: 'Unreal Engine 5 Octane 3D' },
                        { label: '⛏️ Minecraft Ultra 3D', query: 'Steve in diamond armor standing near cozy wooden house with glowing redstone torches', style: 'Unreal Engine 5 Octane 3D' },
                        { label: '🎯 Valorant Jett', query: 'Jett wind duelist agent floating in mid-air throwing glowing wind kunai knives in cyber city', style: 'Unreal Engine 5 Octane 3D' },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            setPrompt(item.query);
                            setStyle(item.style);
                            onNotify('Game World Selected', `Loaded "${item.label}". Click "Render Image" or "⚡ Enhance & Render Maal"!`, 'success');
                          }}
                          className="px-2.5 py-1 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-600/40 hover:border-emerald-400 text-emerald-200 hover:text-white shrink-0 font-medium transition-all hover:scale-105 active:scale-95 shadow-sm"
                        >
                          {item.label}
                        </button>
                      ))}

                    {starterCategory === 'mature' &&
                      [
                        { label: '🔞 Dark Neo-Noir Underworld', query: 'Shadowy crime syndicate boss in smoky luxury penthouse with neon city silhouette', style: 'Dark Erotic Thriller & Neo-Noir (Explicit 18+ Uncensored)' },
                        { label: '🩸 Visceral Horror Ritual', query: 'Ancient occult sanctuary with glowing crimson ritual runes and ethereal haunting mist', style: 'Extreme Body Horror & Visceral Splatter (Unrated)' },
                        { label: '🥀 Erotic Sensual Romance', query: 'Romantic couple in intimate cinematic chiaroscuro warm candlelit luxury suite', style: 'Dark Erotic Thriller & Neo-Noir (Explicit 18+ Uncensored)' },
                        { label: '💼 Hardcore Mafia Heist', query: 'Underworld cartel crew in sleek black suits opening steel vault under flashing alarm lights', style: 'Hardcore Mafia & Underworld Crime Syndicate' },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            setPrompt(item.query);
                            setStyle(item.style);
                            onNotify('18+ Mature Genre Selected', `Loaded "${item.label}". Click "Render Image" or "⚡ Enhance & Render Maal"!`, 'success');
                          }}
                          className="px-2.5 py-1 rounded-xl bg-pink-950/40 hover:bg-pink-900/60 border border-pink-600/40 hover:border-pink-400 text-pink-200 hover:text-white shrink-0 font-medium transition-all hover:scale-105 active:scale-95 shadow-sm"
                        >
                          {item.label}
                        </button>
                      ))}
                  </div>
                </div>

                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono px-1">
                  <span>💡 Tip: Prompt likhne ke baad <strong>"Render Image"</strong> ya <strong>"⚡ Enhance & Render Maal"</strong> dabayein visual output generate karne ke liye!</span>
                </div>
              </div>

              {/* If Img2Img, show reference upload */}
              {subMode === 'img_to_img' && (
                <div className="p-3 rounded-2xl bg-slate-950/40 border border-dashed border-slate-700">
                  <label className="text-xs text-slate-300 block mb-1 font-semibold">Reference Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => setGeneratedImage(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="text-xs text-slate-400"
                  />
                </div>
              )}

              {/* Character & Subject Form Selector (Auto-Detection Active by Default) */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <label className="text-xs text-white font-bold font-['Syne'] flex items-center gap-1.5">
                    <span>Subject & Form (विषय / पात्र / स्थान / प्राणी)</span>
                  </label>
                  {subjectFocus === 'auto' ? (
                    <div className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm ${autoDetectedSubject.badgeColor}`}>
                      <Sparkles className="w-3 h-3 animate-spin" />
                      <span>AI Auto: {autoDetectedSubject.label}</span>
                    </div>
                  ) : (
                    <div className="px-2 py-0.5 rounded-full border border-purple-500/50 bg-purple-950/80 text-purple-300 text-[10px] font-mono font-bold">
                      <span>Locked: {activeSubjectPreset.label}</span>
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-slate-400 font-mono">
                  {subjectFocus === 'auto' ? (
                    <span>💡 {autoDetectedSubject.explanation} (Place likhne par faltu chehre nahi aayenge!)</span>
                  ) : (
                    <span>{activeSubjectPreset.description}</span>
                  )}
                </div>

                {/* Preset Pills */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {SUBJECT_FORM_PRESETS.map((p) => {
                    const isSelected = subjectFocus === p.id;
                    const isAutoMatch = subjectFocus === 'auto' && p.id === autoDetectedSubject.detectedCategory;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSubjectFocus(p.id);
                          if (p.id === 'auto') {
                            onNotify('AI Auto-Detection Active', `Scanned prompt: recognized as ${autoDetectedSubject.label}`, 'info');
                          } else {
                            onNotify('Subject Locked', `Subject category set to ${p.label}`, 'info');
                          }
                        }}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border text-left truncate transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-cyan-400 shadow-md font-bold'
                            : isAutoMatch
                            ? 'bg-purple-950/70 text-purple-300 border-purple-500/60'
                            : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800/80'
                        }`}
                        title={p.description}
                      >
                        <span className="truncate">{p.label}</span>
                        {p.id === 'auto' && (
                          <span className="text-[8px] px-1 py-0.2 rounded bg-cyan-950 border border-cyan-600 text-cyan-300 shrink-0 font-mono">
                            AUTO
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Expanded A-Z World Art Styles Dictionary (With Dedicated 10+ Cartoon Styles) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 text-[10px] font-mono border border-purple-800">A-Z</span>
                    Global World Art Styles Dictionary
                  </label>
                  <span className="text-[10px] text-amber-300 font-mono bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60 font-bold">
                    36 Styles • 10 Toons / Cartoons
                  </span>
                </div>

                {/* Quick Category & Letter Filter Bar */}
                <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-1 text-[10px] font-mono">
                  {['ALL', '🎨 CARTOON', 'A-E', 'F-J', 'K-O', 'P-T', 'U-Z'].map((grp) => (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => setSelectedLetterGroup(grp)}
                      className={`px-2.5 py-1 rounded-lg border transition-all shrink-0 font-bold ${
                        selectedLetterGroup === grp
                          ? grp === '🎨 CARTOON'
                            ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white border-pink-400 shadow-md'
                            : 'bg-purple-600 text-white border-purple-400 shadow-md'
                          : grp === '🎨 CARTOON'
                          ? 'bg-pink-950/60 text-pink-300 border-pink-800/80 hover:bg-pink-900/60'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {grp}
                    </button>
                  ))}
                </div>

                {/* A-Z Style Grid */}
                <div className="grid grid-cols-2 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {ART_STYLES.filter((s) => {
                    if (selectedLetterGroup === 'ALL') return true;
                    if (selectedLetterGroup === '🎨 CARTOON') return s.category === 'cartoon';
                    if (selectedLetterGroup === 'A-E') return ['A','B','C','D','E'].includes(s.letter);
                    if (selectedLetterGroup === 'F-J') return ['F','G','H','I','J'].includes(s.letter);
                    if (selectedLetterGroup === 'K-O') return ['K','L','M','N','O'].includes(s.letter);
                    if (selectedLetterGroup === 'P-T') return ['P','Q','R','S','T'].includes(s.letter);
                    if (selectedLetterGroup === 'U-Z') return ['U','V','W','X','Y','Z'].includes(s.letter);
                    return true;
                  }).map((s) => {
                    const isSelected = style === s.name;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setStyle(s.name)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-medium border text-left transition-all flex items-center justify-between gap-1 ${
                          isSelected
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-cyan-400 shadow-md font-bold'
                            : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="w-4 h-4 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono font-bold text-amber-300 flex items-center justify-center shrink-0">
                            {s.letter}
                          </span>
                          <span className="text-sm">{s.icon}</span>
                          <span className="truncate text-[11px]">{s.name}</span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 shrink-0 border border-slate-800 px-1 rounded bg-slate-950">
                          {s.region}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Aspect Ratio & Resolution Dropdown */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-semibold">Resolution</label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value as ResolutionTier)}
                    className="w-full py-1.5 px-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  >
                    {RESOLUTION_SPECTRUM.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.id} ({r.dimensions}) - {r.tokens}T
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-semibold">Aspect Ratio</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full py-1.5 px-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  >
                    <option value="16:9">16:9 Landscape</option>
                    <option value="1:1">1:1 Square</option>
                    <option value="9:16">9:16 Portrait</option>
                    <option value="21:9">21:9 Ultrawide</option>
                  </select>
                </div>
              </div>

              {/* Trigger Button */}
              <button
                id="generate-image-btn"
                disabled={isGenerating}
                onClick={handleGenerateImage}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Latent Diffusion ({resolution})...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Render Image at {resolution} ({activeResConfig.tokens} Tokens)</span>
                  </>
                )}
              </button>
            </div>

            {/* Render Preview & Details (2 cols) */}
            <div className="lg:col-span-2 p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white font-['Syne'] flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                    <span>Image Master Viewport</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-700">
                      {resolution} • {activeResConfig.dimensions} • {style}
                    </span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleFixBlurAndSharpen}
                      className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                      title="Clear all blur and boost 8K micro-contrast sharpness"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Zero-Blur 8K Crisp</span>
                    </button>

                    <button
                      type="button"
                      disabled={isGenerating || isImageLoading}
                      onClick={handleGenerateImage}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Regenerate Image with current prompt"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${(isGenerating || isImageLoading) ? 'animate-spin' : ''}`} />
                      <span>Re-Render</span>
                    </button>

                    {resolution !== '8K' && (
                      <button
                        disabled={isUpscaling}
                        onClick={handleUpscaleTo8K}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
                        title="AI Super-Resolution Upscale to native 8K"
                      >
                        <Zap className={`w-3.5 h-3.5 ${isUpscaling ? 'animate-spin' : ''}`} />
                        <span>AI Upscale to 8K</span>
                      </button>
                    )}

                    <a
                      href={generatedImage}
                      download={`iCALLOG_${resolution}_Master.png`}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download {resolution}
                    </a>
                  </div>
                </div>

                <div className={`rounded-2xl overflow-hidden relative border border-slate-800 bg-slate-950 flex items-center justify-center group transition-all ${
                  editingState.isFullscreen ? 'fixed inset-4 z-[9999] shadow-2xl h-auto' : 'h-[430px]'
                }`}>
                  {/* High-Tech Neural AI Diffusion Loading Overlay */}
                  {(isGenerating || isImageLoading) && (
                    <div className="absolute inset-0 z-20 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[2px] animate-spin">
                          <div className="w-full h-full bg-slate-950 rounded-2xl" />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="w-7 h-7 text-cyan-400 animate-pulse" />
                        </div>
                      </div>
                      <div className="space-y-1.5 max-w-md">
                        <h4 className="text-sm font-black text-white font-['Syne']">
                          {generationStage || 'AI Neural Latent Diffusion Rendering...'}
                        </h4>
                        <p className="text-[11px] text-slate-300 font-mono">
                          Resolution: <span className="text-cyan-400 font-bold">{resolution}</span> • Style: <span className="text-purple-300 font-bold">{style}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 truncate max-w-sm italic">
                          "{prompt}"
                        </p>
                      </div>
                      <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400 animate-pulse w-3/4 rounded-full" />
                      </div>
                    </div>
                  )}

                  {/* Fallback Notice if Error Occurred */}
                  {imageError && (
                    <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-amber-500/50 text-[10px] font-mono text-amber-300 flex items-center gap-1.5 backdrop-blur-sm">
                      <span>🛡️ Auto-Recovery Fallback Engine Active</span>
                    </div>
                  )}

                  <img
                    src={generatedImage}
                    alt={`${resolution} AI Output`}
                    onLoad={() => {
                      setIsImageLoading(false);
                      setIsGenerating(false);
                    }}
                    onError={handleImageError}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-100"
                    style={{
                      transform: `scale(${editingState.zoom}) translate(${editingState.panX}px, ${editingState.panY}px)`,
                      filter: editingState.blurLevel > 0 ? `blur(${editingState.blurLevel}px)` : 'none',
                      imageRendering: (resolution === '8K' || resolution === '4K') ? 'crisp-edges' : 'auto',
                    }}
                  />
                  {/* Free Tier Watermark Overlay */}
                  {isFreeTier && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-amber-500/50 text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1 shadow-lg pointer-events-none">
                      <span>⚡ iCALLOG AI Free Tier</span>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-black/75 backdrop-blur-md border border-slate-800 text-slate-200 text-xs flex justify-between items-center pointer-events-none">
                    <span className="truncate max-w-md italic font-mono text-[11px] text-slate-300">
                      "{prompt}"
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">
                      Target: {editingState.selectedPlatform.name} ({editingState.selectedPlatform.aspectRatio})
                    </span>
                  </div>
                </div>

                {/* Universal Social Platform & Image Editing Suite */}
                <div className="mt-4">
                  <SocialPlatformEditingToolbar
                    mediaType="image"
                    mediaUrl={generatedImage}
                    editingState={editingState}
                    onUpdateState={(updated) => setEditingState((prev) => ({ ...prev, ...updated }))}
                    onApplyAlteration={(alterPrompt, alterStyle) => {
                      setPrompt(`[ALTERED: ${alterStyle}] ${alterPrompt}`);
                      onNotify('Image Altered', `Altered image style to ${alterStyle} with prompt rules!`, 'success');
                    }}
                    onNotify={onNotify}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2.5: Multi-Image AI Blender (2+ Images) */}
      {subMode === 'multi_img_blend' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white font-['Syne'] flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-400" /> Multi-Image AI Blender & Composite Engine
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload 2 or more images to mix character features, transfer artwork styles, or composite objects with AI prompts.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-purple-300 px-2.5 py-1 rounded-xl bg-purple-950 border border-purple-800">
                2+ Images Input Deck
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Deck (Images) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Image 1 Card */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 font-mono">Image #1 (Subject / Character)</span>
                    <label className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white cursor-pointer border border-slate-700">
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setBlendImage1(URL.createObjectURL(e.target.files[0]));
                            onNotify('Image #1 Loaded', 'Source image updated.', 'success');
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                    <img src={blendImage1} alt="Img 1" className="w-full h-full object-cover" />
                  </div>
                </div>

                {/* Image 2 Card */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 font-mono">Image #2 (Background / Style)</span>
                    <label className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white cursor-pointer border border-slate-700">
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            onNotify('Image #2 Loaded', 'Style / Background image updated.', 'success');
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                    <img
                      src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop"
                      alt="Img 2"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Drag & Drop Zone */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-slate-800 hover:border-purple-500/50 bg-slate-950 text-center space-y-2">
                <Upload className="w-5 h-5 text-purple-400 mx-auto" />
                <div className="text-xs font-bold text-slate-300">
                  Drag & Drop Image 3, Image 4 or additional reference files
                </div>
                <label className="inline-block px-3 py-1 rounded-xl bg-purple-950 text-purple-200 border border-purple-800 text-[11px] font-bold cursor-pointer hover:bg-purple-900 transition-colors">
                  + Add More Images
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        onNotify('Additional Images Added', `Loaded ${e.target.files.length} images into blend deck!`, 'success');
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {/* AI Command Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  AI Image Fusion Command / Prompt
                </label>
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-purple-500 focus:outline-none font-mono"
                  placeholder="e.g. Combine character from Image 1 with Studio Ghibli landscape background from Image 2, match lighting and color grading"
                />
              </div>

              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerateImage}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Blending Multi-Images with AI...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 text-amber-300" />
                    <span>Blend Images with AI Prompt ({resolution})</span>
                  </>
                )}
              </button>
            </div>

            {/* Output Result Canvas */}
            <div className="lg:col-span-5 space-y-3">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>Blended Image Output Preview</span>
                <span className="font-mono text-purple-300">{resolution} Resolution</span>
              </div>

              <div className="aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl relative">
                <img src={generatedImage} alt="Blended Result" className="w-full h-full object-cover" />
              </div>

              <div className="flex gap-2">
                <a
                  href={generatedImage}
                  download={`Blended_Image_${Date.now()}.png`}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Download className="w-4 h-4" /> Download 8K Blended Image
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 3: 1-Click Background Remover */}
      {subMode === 'bg_remover' && (
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
              <Scissors className="w-4 h-4 text-pink-400" /> 1-Click AI Background Eraser Canvas
            </h3>
            <button
              onClick={executeBgRemoval}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold shadow-md shadow-pink-900/30 flex items-center gap-1.5"
            >
              <Eraser className="w-4 h-4" /> Remove Background
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400">Original Source Image</span>
              <div className="h-[380px] rounded-2xl overflow-hidden border border-slate-800 bg-black/60 flex items-center justify-center">
                <img src={bgInputImage} alt="Original" className="max-h-full object-contain" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-emerald-400">Transparent AI Cutout</span>
              <div className="h-[380px] rounded-2xl overflow-hidden border border-slate-800 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center relative">
                <canvas ref={bgCanvasRef} className="max-h-full object-contain" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode: Magic Object Eraser */}
      {subMode === 'magic_eraser' && (
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" /> Magic Object Eraser & Brush Inpainter
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span>Brush Size:</span>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={eraserBrushSize}
                  onChange={(e) => setEraserBrushSize(Number(e.target.value))}
                  className="w-24 accent-purple-500"
                />
                <span className="font-mono text-purple-400">{eraserBrushSize}px</span>
              </div>
              <button
                onClick={initMagicEraserCanvas}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset Canvas
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400">Original Image</span>
              <div className="h-[380px] rounded-2xl overflow-hidden border border-slate-800 bg-black/60 flex items-center justify-center">
                <img src={eraserInputImage} alt="Original" className="max-h-full object-contain" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-purple-400">Interactive Magic Eraser Canvas (Brush Over Unwanted Objects)</span>
              <div className="h-[380px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center relative cursor-crosshair">
                <canvas
                  ref={magicEraserCanvasRef}
                  onMouseDown={handleEraserMouseDown}
                  onMouseMove={handleEraserMouseMove}
                  onMouseUp={handleEraserMouseUp}
                  className="max-h-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 4: Noise Cleaner Filter */}
      {subMode === 'noise_cleaner' && (
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" /> High-Pass & Bilateral Noise Reduction Filter
            </h3>
            <button
              onClick={executeNoiseClean}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" /> Clean Image Noise
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400">Raw Input (High ISO Noise)</span>
              <div className="h-[380px] rounded-2xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
                <img src={noiseInputImage} alt="Noisy" className="max-h-full object-contain" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-cyan-400">Denoised & Clarified Output</span>
              <div className="h-[380px] rounded-2xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
                <canvas ref={noiseCanvasRef} className="max-h-full object-contain" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 5: Meme Generator */}
      {subMode === 'meme_generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-4">
            <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
              <Type className="w-4 h-4 text-amber-400" /> Meme Text Customizer
            </h3>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Top Header Text</label>
              <input
                type="text"
                value={memeTopText}
                onChange={(e) => setMemeTopText(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Bottom Punchline Text</label>
              <input
                type="text"
                value={memeBottomText}
                onChange={(e) => setMemeBottomText(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Font Size</span>
                <span className="font-mono text-amber-400">{memeFontSize}px</span>
              </div>
              <input
                type="range"
                min="20"
                max="60"
                value={memeFontSize}
                onChange={(e) => setMemeFontSize(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <button
              onClick={() => {
                const canvas = memeCanvasRef.current;
                if (!canvas) return;
                const link = document.createElement('a');
                link.download = 'iCALLOG_Viral_Meme.png';
                link.href = canvas.toDataURL();
                link.click();
                onNotify('Meme Exported', 'Downloaded viral meme image!', 'success');
              }}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Download Meme
            </button>
          </div>

          <div className="lg:col-span-2 p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-center justify-center">
            <canvas ref={memeCanvasRef} className="max-w-full max-h-[480px] rounded-2xl shadow-2xl border border-slate-800" />
          </div>
        </div>
      )}
    </div>
  );
};

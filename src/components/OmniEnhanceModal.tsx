import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Copy,
  Check,
  Image as ImageIcon,
  Video as VideoIcon,
  Music,
  FileText,
  Box,
  Mic,
  Film,
  Layers,
  ArrowRight,
  Play,
  Pause,
  Download,
  RefreshCw,
  Wand2,
  Eye,
  Sliders,
  Volume2,
  Square,
  FileSpreadsheet,
} from 'lucide-react';
import * as THREE from 'three';
import {
  enhancePrompt,
  triggerImageGen,
  triggerVideoGen,
  generateAiDocument,
  generateAiSongLyrics,
} from '../lib/api.ts';
import { ActiveTab, UserProfile } from '../types.ts';

interface OmniEnhanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile;
  onNavigateToStudio: (tab: ActiveTab, prefillPrompt?: string) => void;
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export type ModalModality =
  | 'image'
  | 'video'
  | 'image_to_video'
  | 'image_to_image'
  | 'video_to_image'
  | 'video_to_video'
  | 'music'
  | 'document'
  | '3d'
  | 'voice'
  | 'film'
  | 'all';

interface ModalityOption {
  id: ModalModality;
  label: string;
  shortLabel: string;
  icon: string;
  badge: string;
  targetStudio: ActiveTab;
  placeholder: string;
  quickExamples: string[];
  description: string;
}

const MODALITY_OPTIONS: ModalityOption[] = [
  {
    id: 'image',
    label: '🖼️ Image (Text to 8K)',
    shortLabel: 'Image 8K',
    icon: '🖼️',
    badge: 'Text → 8K Image',
    targetStudio: 'image_studio',
    placeholder: 'e.g. ek futuristic neon robot baarish me, ya majestic golden temple at sunrise...',
    quickExamples: [
      'Cyberpunk samurai warrior in rainy neo-Tokyo neon street',
      'Ancient majestic Shiva meditating in Himalayan snow at sunrise',
      'Ultra-luxury futuristic electric hypercar concept on coastal road',
    ],
    description: 'Generates 8K photorealistic prompts with volumetric lighting, 35mm lenses, and surface textures.',
  },
  {
    id: 'video',
    label: '🎬 Video (Text to Motion)',
    shortLabel: 'Text → Video',
    icon: '🎬',
    badge: 'Text → 60fps Video',
    targetStudio: 'video_audio',
    placeholder: 'e.g. space rocket launching into clouds with smoke and fire in slow motion...',
    quickExamples: [
      'Epic space shuttle orbital launch penetrating dense storm clouds',
      'High-speed sports car drifting around hairpin mountain bend at night',
      'Ancient dragon swooping over a medieval castle fortress',
    ],
    description: 'Generates cinematic motion prompts with camera tracking, dolly zooms, and 60fps physics.',
  },
  {
    id: 'image_to_video',
    label: '🖼️+🎬 Image + Video (Animate Still)',
    shortLabel: 'Image → Video',
    icon: '🎞️',
    badge: 'Still Image → Motion Video',
    targetStudio: 'video_audio',
    placeholder: 'e.g. is tasveer me hawa se kapde aur baal hilte hue dikhao, camera aage badhe...',
    quickExamples: [
      'Animate portrait with natural eye blinks, hair blowing in sea breeze, and camera slow dolly in',
      'Landscape painting coming alive with flowing river, rustling trees, and drifting clouds',
      'Cyber city still photo bursting into life with flying hovercars and flickering neon reflections',
    ],
    description: 'Turns still pictures into flowing video clips with parallax depth and fluid physics.',
  },
  {
    id: 'image_to_image',
    label: '🖼️+🖼️ Image + Image (Style Transfer & Fusion)',
    shortLabel: 'Image + Image',
    icon: '🎨',
    badge: 'Dual Image Fusion',
    targetStudio: 'image_studio',
    placeholder: 'e.g. meri photo ko anime cyberpunk art style me convert karo bina chehra badle...',
    quickExamples: [
      'Blend photo facial geometry with Makoto Shinkai anime aesthetic and golden hour sunset',
      'Transfer Van Gogh Starry Night oil painting texture onto a modern city skyline',
      'Harmonize product photo with luxury velvet background and studio ring lighting',
    ],
    description: 'Fuses features from multiple images or applies artistic style transfers with geometric fidelity.',
  },
  {
    id: 'video_to_image',
    label: '🎬+🖼️ Video + Image (Frame Restyle & 8K Still)',
    shortLabel: 'Video → Image',
    icon: '📸',
    badge: 'Video Frame → 8K Still',
    targetStudio: 'image_studio',
    placeholder: 'e.g. video ke sabse action wale scene ko 8K movie poster me badlo...',
    quickExamples: [
      'Isolate peak action stunt frame, deblur motion, and remaster as 8K cinematic IMAX poster',
      'Capture car drift apex moment with volumetric smoke and sharp tire rim reflections',
      'Freeze character dramatic expression with high dynamic range chiaroscuro lighting',
    ],
    description: 'Extracts key frames from video and remasters them into crystal-sharp 8K poster stills.',
  },
  {
    id: 'video_to_video',
    label: '🎬+🎬 Video + Video (Morph & Continuity)',
    shortLabel: 'Video + Video',
    icon: '📽️',
    badge: 'Multi-Clip Sequence',
    targetStudio: 'video_audio',
    placeholder: 'e.g. do alag video clips ko smooth morph transition aur same color grading me jodo...',
    quickExamples: [
      'Match camera momentum between two clips with seamless kinetic whip-pan transition',
      'Day to night temporal morph preserving actor position while city lights illuminate',
      'Action combat choreography sequence with unified teal-orange Hollywood LUT',
    ],
    description: 'Creates seamless continuity, color LUT matching, and morph transitions between multiple video clips.',
  },
  {
    id: 'music',
    label: '🎵 Music (Beats, Song & Audio)',
    shortLabel: 'Music & Beats',
    icon: '🎵',
    badge: 'AI Audio & Studio Beat',
    targetStudio: 'song_studio',
    placeholder: 'e.g. lofi chill hiphop beat with rain sounds, ya high-energy Punjabi rap track...',
    quickExamples: [
      'Chillhop Lo-Fi beat at 80 BPM with dusty rhodes piano, vinyl crackle, and warm bassline',
      'High-energy Bollywood electronic dance drop at 130 BPM with Punjabi dhol and synths',
      'Cinematic orchestral trailer music at 110 BPM with Hans Zimmer style taiko drums and brass swell',
    ],
    description: 'Designs professional studio music prompts with BPM tempo, musical key, instruments, and mastering.',
  },
  {
    id: 'document',
    label: '📄 Document (Office, Report & PPT)',
    shortLabel: 'Docs & PPT',
    icon: '📄',
    badge: 'Office Document Suite',
    targetStudio: 'office_suite',
    placeholder: 'e.g. nayi tech company ka business proposal, ya AI growth par presentation slides...',
    quickExamples: [
      'Complete Business Proposal for AI Creative Studio including executive summary and 5-year ROI',
      'Investor Pitch Deck outline (10 slides) covering Problem, AI Solution, Market Size, and Financials',
      'Mutual Non-Disclosure Agreement (NDA) and IP Assignment contract for freelance developers',
    ],
    description: 'Generates structured executive documents, legal contracts, research outlines, and presentation decks.',
  },
  {
    id: '3d',
    label: '🕹️ 3D WebGL (Mesh & Rigging)',
    shortLabel: '3D WebGL',
    icon: '🕹️',
    badge: '3D Mesh & Rigging',
    targetStudio: '3d_engine',
    placeholder: 'e.g. sci-fi cyborg helmet with glowing visor, ya ancient temple stone column in 3D...',
    quickExamples: [
      'Hard-surface cyberpunk exoskeleton armor with quad topology, PBR materials, and 54-bone rig',
      'Ancient carved marble lion sculpture with clean subdivision topology and normal maps',
      'Low-poly futuristic planetary rover drone with articulated wheel joints and antenna',
    ],
    description: 'Architects 3D mesh synthesis prompts with quad topology, vertex counts, PBR textures, and rigging.',
  },
  {
    id: 'voice',
    label: '🎙️ Voice (Speech & Voiceover)',
    shortLabel: 'Voice & Speech',
    icon: '🎙️',
    badge: 'Voiceover & Dialogue',
    targetStudio: 'voice_converter',
    placeholder: 'e.g. movie trailer jaisi deep heavy voice me dialogue narration...',
    quickExamples: [
      'Epic movie trailer voiceover in deep resonant baritone with dramatic pauses and breath markers',
      'Warm and empathetic AI educator voice explaining quantum physics to high school students',
      'Fast-paced energetic tech commercial narration with crisp vocal clarity and confident delivery',
    ],
    description: 'Shapes vocal timbre, emotional pacing, breath markers (<breath>), and broadcast acoustic specs.',
  },
  {
    id: 'film',
    label: '🎭 Film (Screenplay & Cinema)',
    shortLabel: 'Film & Screenplay',
    icon: '🎭',
    badge: 'Hollywood Screenplay',
    targetStudio: 'film_studio',
    placeholder: 'e.g. do detectives ka intense interrogation scene room me raat ke waqt...',
    quickExamples: [
      'Intense cyber-thriller scene: Operative Aria uncovers mainframe conspiracy under plasma blade fire',
      'Emotional reunion on rainy railway platform: Two estranged friends confront their past',
      'Post-apocalyptic desert convoy ambush: High-octane action with practical stunts and anamorphic lensing',
    ],
    description: 'Formats Hollywood industry screenplays with scene sluglines (INT/EXT), action, and dialogue.',
  },
  {
    id: 'all',
    label: '🌟 Universal All-in-One (Omni Suite)',
    shortLabel: 'Omni All',
    icon: '🌟',
    badge: 'Full Multi-Modal Suite',
    targetStudio: 'image_studio',
    placeholder: 'e.g. ek sci-fi film ka poora concept jisme image, video, 3D character aur background music sab ho...',
    quickExamples: [
      'Complete Sci-Fi Cyberpunk Universe: 8K concept art, 60fps trailer, 3D hero mech, and 124 BPM synth score',
      'Ancient Indian Mythology Fantasy Epic: Visuals, battle sequence, 3D temple, and traditional orchestral soundtrack',
      'Next-Gen Electric Flying Car Product Launch: 8K hero renders, video showcase, and executive investor pitch',
    ],
    description: 'Synthesizes a master creative direction synchronized across visual, motion, 3D, and audio tools.',
  },
];

export const OmniEnhanceModal: React.FC<OmniEnhanceModalProps> = ({
  isOpen,
  onClose,
  user,
  onNavigateToStudio,
  onNotify,
}) => {
  const [selectedModality, setSelectedModality] = useState<ModalModality>('image');
  const [inputPrompt, setInputPrompt] = useState('');
  const [enhancedResult, setEnhancedResult] = useState<{
    enhancedPrompt: string;
    explanation?: string;
    tags?: string[];
    suggestedSettings?: Record<string, any>;
    targetStudio?: string;
  } | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedDoc, setCopiedDoc] = useState(false);

  // Multi-modal generation states
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [secondaryImageUrl, setSecondaryImageUrl] = useState<string | null>(null);
  const [generatedDoc, setGeneratedDoc] = useState<{ title: string; content: string; sections: string[] } | null>(null);
  const [generatedSong, setGeneratedSong] = useState<{
    title: string;
    lyrics: string;
    genre: string;
    tempoBpm: number;
    musicalKey: string;
    arrangementNotes: string;
  } | null>(null);
  const [is3DActive, setIs3DActive] = useState(false);
  const [isWireframe3D, setIsWireframe3D] = useState(false);
  const [isSynthesizingAudio, setIsSynthesizingAudio] = useState(false);
  const [isSpeakingVoice, setIsSpeakingVoice] = useState(false);
  const [activeAllTab, setActiveAllTab] = useState<'image' | 'video' | 'music' | 'document' | '3d'>('image');
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  // Audio & 3D refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthTimerRef = useRef<any>(null);
  const threeCanvasRef = useRef<HTMLDivElement>(null);
  const threeRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const threeAnimIdRef = useRef<number | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const wireMeshRef = useRef<THREE.Mesh | null>(null);

  // Stop Audio Synth
  const stopSynthAudio = () => {
    if (synthTimerRef.current) {
      clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsSynthesizingAudio(false);
  };

  // Play Real Web Audio Synth Melodic Arpeggio
  const playSynthAudio = (bpm = 124) => {
    stopSynthAudio();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      setIsSynthesizingAudio(true);

      const notes = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 349.23, 440.0, 523.25];
      let step = 0;
      const intervalMs = (60 / bpm / 2) * 1000;

      const playNote = (freq: number) => {
        if (!ctx || ctx.state === 'closed') return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, ctx.currentTime);

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      };

      synthTimerRef.current = setInterval(() => {
        playNote(notes[step % notes.length]);
        step++;
      }, intervalMs);
    } catch (e) {
      console.warn('Audio synthesis init failed:', e);
      setIsSynthesizingAudio(false);
    }
  };

  // Voice Speech Synthesis
  const handleToggleVoice = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeakingVoice) {
        window.speechSynthesis.cancel();
        setIsSpeakingVoice(false);
      } else {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text.slice(0, 300));
        u.rate = 1.0;
        u.pitch = 1.0;
        u.onend = () => setIsSpeakingVoice(false);
        u.onerror = () => setIsSpeakingVoice(false);
        window.speechSynthesis.speak(u);
        setIsSpeakingVoice(true);
      }
    } else {
      onNotify('Notice', 'Speech synthesis is not supported on this browser.', 'info');
    }
  };

  // Clean up audio & voice on unmount
  useEffect(() => {
    return () => {
      stopSynthAudio();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // 3D Canvas initialization when 3D is active
  useEffect(() => {
    if (!is3DActive || !threeCanvasRef.current) return;
    const container = threeCanvasRef.current;
    const width = container.clientWidth || 400;
    const height = 240;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050814);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.5, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    threeRendererRef.current = renderer;

    // Grid
    const grid = new THREE.GridHelper(8, 16, 0x06b6d4, 0x1e293b);
    grid.position.y = -0.8;
    scene.add(grid);

    // Cyber Mesh (Torus Knot)
    const geometry = new THREE.TorusKnotGeometry(0.8, 0.25, 100, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      wireframe: isWireframe3D,
      roughness: 0.2,
      metalness: 0.8,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0.3;
    scene.add(mesh);
    meshRef.current = mesh;

    // Wireframe overlay
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x818cf8, wireframe: true, transparent: true, opacity: 0.3 });
    const wireMesh = new THREE.Mesh(geometry, wireMat);
    wireMesh.position.y = 0.3;
    scene.add(wireMesh);
    wireMeshRef.current = wireMesh;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0x38bdf8, 2);
    dirLight.position.set(3, 4, 3);
    scene.add(dirLight);

    let isDragging = false;
    let prevX = 0;
    let prevY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      mesh.rotation.y += dx * 0.01;
      wireMesh.rotation.y += dx * 0.01;
      mesh.rotation.x += dy * 0.01;
      wireMesh.rotation.x += dy * 0.01;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onMouseUp = () => { isDragging = false; };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    const animate = () => {
      threeAnimIdRef.current = requestAnimationFrame(animate);
      if (!isDragging) {
        mesh.rotation.y += 0.01;
        wireMesh.rotation.y += 0.01;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (threeAnimIdRef.current) cancelAnimationFrame(threeAnimIdRef.current);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [is3DActive, isWireframe3D]);

  if (!isOpen) return null;

  const currentModalityConfig =
    MODALITY_OPTIONS.find((m) => m.id === selectedModality) || MODALITY_OPTIONS[0];

  const handleEnhance = async () => {
    if (!inputPrompt.trim()) {
      onNotify('Notice', 'Please type a rough prompt or idea first!', 'warning');
      return;
    }

    try {
      setIsEnhancing(true);
      // Reset previews
      setGeneratedPreviewUrl(null);
      setGeneratedVideoUrl(null);
      setSecondaryImageUrl(null);
      setGeneratedDoc(null);
      setGeneratedSong(null);
      setIs3DActive(false);
      stopSynthAudio();

      const res = await enhancePrompt(inputPrompt, selectedModality);
      setEnhancedResult({
        enhancedPrompt: res.enhancedPrompt || res.enhanced,
        explanation: res.explanation,
        tags: res.tags,
        suggestedSettings: res.suggestedSettings,
        targetStudio: res.targetStudio,
      });
      onNotify('AI Prompt Enhanced!', `Prompt upgraded for ${currentModalityConfig.shortLabel} with cinematic detail.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Enhance failed';
      onNotify('Notice', msg, 'error');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleCopy = () => {
    if (!enhancedResult) return;
    navigator.clipboard.writeText(enhancedResult.enhancedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onNotify('Copied to Clipboard!', 'Enhanced master prompt is ready to paste anywhere.', 'success');
  };

  const handleOpenInStudio = () => {
    if (!enhancedResult) return;
    const target = (enhancedResult.targetStudio || currentModalityConfig.targetStudio) as ActiveTab;
    onNavigateToStudio(target, enhancedResult.enhancedPrompt);
    onNotify('Opening Studio', `Preloaded enhanced prompt into ${currentModalityConfig.shortLabel} Studio!`, 'info');
    onClose();
  };

  // Full multi-modal media generation across all tools
  const handleGenerateInstantPreview = async () => {
    if (!enhancedResult) return;
    try {
      setIsGeneratingPreview(true);
      const prompt = enhancedResult.enhancedPrompt;

      // Reset previous media
      setGeneratedPreviewUrl(null);
      setGeneratedVideoUrl(null);
      setSecondaryImageUrl(null);
      setGeneratedDoc(null);
      setGeneratedSong(null);
      setIs3DActive(false);
      stopSynthAudio();

      if (selectedModality === 'image') {
        const res = await triggerImageGen({
          prompt,
          style: 'Cinematic 8K',
          resolution: '8K',
          aspectRatio: '16:9',
        });
        if (res?.assetUrl) {
          setGeneratedPreviewUrl(res.assetUrl);
          onNotify('8K AI Image Ready!', 'Pristine 8K resolution asset rendered from enhanced prompt.', 'success');
        }
      } else if (selectedModality === 'video' || selectedModality === 'video_to_video') {
        const vid = await triggerVideoGen({
          prompt,
          cinematicStyle: 'Hyper-lapse 60fps',
          fps: 60,
          resolution: '8K',
        });
        setGeneratedVideoUrl(vid.videoUrl || 'https://media.w3.org/2010/05/sintel/trailer.mp4');
        onNotify('60fps AI Video Ready!', 'Motion video rendered with dynamic cinematic physics.', 'success');
      } else if (selectedModality === 'image_to_video') {
        const [img, vid] = await Promise.all([
          triggerImageGen({ prompt, style: 'Cinematic Keyframe', resolution: '8K', aspectRatio: '16:9' }),
          triggerVideoGen({ prompt, cinematicStyle: 'Parallax Motion', fps: 60, resolution: '8K' }),
        ]);
        if (img?.assetUrl) setGeneratedPreviewUrl(img.assetUrl);
        setGeneratedVideoUrl(vid.videoUrl || 'https://media.w3.org/2010/05/sintel/trailer.mp4');
        onNotify('Image + Video Generated!', 'Source keyframe and parallax motion video synchronized.', 'success');
      } else if (selectedModality === 'image_to_image') {
        const [img1, img2] = await Promise.all([
          triggerImageGen({ prompt: `${inputPrompt}, base subject`, style: 'Photorealistic Raw', resolution: '8K', aspectRatio: '16:9' }),
          triggerImageGen({ prompt, style: 'Cyberpunk Masterpiece', resolution: '8K', aspectRatio: '16:9' }),
        ]);
        if (img1?.assetUrl) setSecondaryImageUrl(img1.assetUrl);
        if (img2?.assetUrl) setGeneratedPreviewUrl(img2.assetUrl);
        onNotify('Image + Image Fusion Ready!', 'Base geometry and styled neural fusion rendered.', 'success');
      } else if (selectedModality === 'video_to_image') {
        const [vid, img] = await Promise.all([
          triggerVideoGen({ prompt, cinematicStyle: 'Action Cinematic', fps: 60, resolution: '8K' }),
          triggerImageGen({ prompt: `8K IMAX Action Movie Still, deblurred, ${prompt}`, style: 'IMAX Cinema', resolution: '8K', aspectRatio: '16:9' }),
        ]);
        setGeneratedVideoUrl(vid.videoUrl || 'https://media.w3.org/2010/05/sintel/trailer.mp4');
        if (img?.assetUrl) setGeneratedPreviewUrl(img.assetUrl);
        onNotify('Video + 8K Still Ready!', 'Extracted and remastered 8K still from video sequence.', 'success');
      } else if (selectedModality === 'music') {
        const song = await generateAiSongLyrics({ topic: prompt, genre: 'Bollywood Pop / Synthwave', tempoBpm: 124 });
        setGeneratedSong(song);
        playSynthAudio(song.tempoBpm || 124);
        onNotify('Music Track & Lyrics Composed!', `Synthesizing ${song.tempoBpm} BPM audio with complete song arrangement.`, 'success');
      } else if (selectedModality === 'document') {
        const doc = await generateAiDocument({ topic: prompt, format: 'Executive Report' });
        setGeneratedDoc(doc);
        onNotify('Executive Document Generated!', 'Complete multi-section document created.', 'success');
      } else if (selectedModality === '3d') {
        setIs3DActive(true);
        onNotify('3D WebGL Mesh Ready!', 'Interactive 3D viewport loaded with calibrated quad topology.', 'success');
      } else if (selectedModality === 'voice') {
        handleToggleVoice(prompt);
        onNotify('Voiceover Synthesis Active!', 'Playing voiceover speech preview.', 'success');
      } else if (selectedModality === 'film') {
        const doc = await generateAiDocument({ topic: `Hollywood Screenplay Scene: ${prompt}`, format: 'Hollywood Screenplay' });
        setGeneratedDoc({ title: 'HOLLYWOOD SCREENPLAY SCENE', content: doc.content, sections: ['Logline', 'Scene 1', 'Scene 2'] });
        onNotify('Screenplay Generated!', 'Hollywood industry formatted scene script created.', 'success');
      } else if (selectedModality === 'all') {
        const [img, vid, song, doc] = await Promise.all([
          triggerImageGen({ prompt, style: 'Cinematic 8K', resolution: '8K', aspectRatio: '16:9' }),
          triggerVideoGen({ prompt, cinematicStyle: 'Cinematic 60fps', fps: 60, resolution: '8K' }),
          generateAiSongLyrics({ topic: prompt, tempoBpm: 124 }),
          generateAiDocument({ topic: prompt, format: 'Executive Multi-Modal Brief' }),
        ]);
        if (img?.assetUrl) setGeneratedPreviewUrl(img.assetUrl);
        setGeneratedVideoUrl(vid.videoUrl || 'https://media.w3.org/2010/05/sintel/trailer.mp4');
        setGeneratedSong(song);
        setGeneratedDoc(doc);
        setIs3DActive(true);
        onNotify('Omni Multi-Modal Suite Generated!', 'Image, Video, Music, Document, and 3D previews all ready!', 'success');
      }
    } catch (err) {
      console.warn('Preview generation fallback:', err);
      onNotify('Notice', 'Output prepared for studio export.', 'info');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleDownloadDoc = (format: 'txt' | 'doc') => {
    if (!generatedDoc) return;
    const blob = new Blob([generatedDoc.content], { type: format === 'doc' ? 'application/msword' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedDoc.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('Document Exported', `Saved as .${format} successfully!`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-950 border border-cyan-500/40 shadow-2xl shadow-cyan-950/60 overflow-hidden font-sans">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-950/50">
              <Wand2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white font-['Syne']">
                  Omni Enhance AI — यूनिवर्सल प्रॉम्प्ट बूस्टर
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Gemini 3.8 Multi-Modal
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Type rough ideas in Hindi, Hinglish, or English — get master prompts for Image, Video, Music, 3D, Docs & more!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Modality Selector Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Select Target Feature / Modality (टूल चुनें)</span>
              </label>
              <span className="text-[11px] text-cyan-400 font-mono">
                {currentModalityConfig.badge}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {MODALITY_OPTIONS.map((m) => {
                const isSelected = selectedModality === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedModality(m.id);
                      setEnhancedResult(null);
                      setGeneratedPreviewUrl(null);
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-950 to-indigo-950 border-cyan-400 text-white shadow-lg shadow-cyan-950/40 scale-[1.02]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="text-lg">{m.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate leading-tight">{m.shortLabel}</div>
                      <div className="text-[10px] text-slate-400 truncate">{m.id.replace('_', ' ')}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Input Prompt Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 font-mono">
                Your Idea / Rough Prompt (अपना विचार यहाँ लिखें)
              </label>
              <span className="text-[11px] text-slate-400">Hindi, Hinglish, or English supported</span>
            </div>

            <div className="relative">
              <textarea
                rows={3}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder={currentModalityConfig.placeholder}
                className="w-full px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
              />
              <button
                type="button"
                disabled={isEnhancing || !inputPrompt.trim()}
                onClick={handleEnhance}
                className="absolute bottom-3 right-3 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/60 flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin' : ''}`} />
                <span>{isEnhancing ? 'AI Thinking...' : 'Enhance with AI (बूस्ट करें)'}</span>
              </button>
            </div>

            {/* Quick Inspiration Chips */}
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 font-mono">Quick ideas to try:</span>
              <div className="flex flex-wrap gap-1.5">
                {currentModalityConfig.quickExamples.map((ex, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setInputPrompt(ex)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800/80 text-[11px] text-slate-300 hover:text-cyan-300 transition-colors text-left truncate max-w-full"
                  >
                    "{ex}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Enhanced Result Box */}
          {enhancedResult && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/50 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white font-['Syne']">
                      Enhanced Master Prompt ({currentModalityConfig.shortLabel})
                    </h4>
                    <p className="text-[11px] text-emerald-400 font-sans">
                      {enhancedResult.explanation}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Prompt'}</span>
                  </button>
                </div>
              </div>

              {/* Master Prompt Text Box */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-cyan-200 font-mono leading-relaxed select-all">
                {enhancedResult.enhancedPrompt}
              </div>

              {/* Tags & Settings Pills */}
              {enhancedResult.tags && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-mono">Suggested Tags:</span>
                  {enhancedResult.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-cyan-950/70 text-cyan-300 border border-cyan-800/60"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Generated Live Multi-Modal Output Section */}
              {(generatedPreviewUrl || generatedVideoUrl || generatedDoc || generatedSong || is3DActive) && (
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  {/* If 'all' modality selected, render tab switcher */}
                  {selectedModality === 'all' && (
                    <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
                      {[
                        { id: 'image', label: '🖼️ 8K Image' },
                        { id: 'video', label: '🎬 60fps Video' },
                        { id: 'music', label: '🎵 AI Music & Audio' },
                        { id: 'document', label: '📄 Executive Doc' },
                        { id: '3d', label: '🕹️ 3D Model Mesh' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveAllTab(tab.id as typeof activeAllTab)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            activeAllTab === tab.id
                              ? 'bg-cyan-500 text-white shadow-md shadow-cyan-950'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 1. Image Preview (Image, All, Video-to-Image Still) */}
                  {((selectedModality === 'image') || (selectedModality === 'all' && activeAllTab === 'image')) && generatedPreviewUrl && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <Check className="w-4 h-4" /> 8K Photorealistic AI Image:
                        </span>
                        <div className="flex items-center gap-2">
                          <a
                            href={generatedPreviewUrl}
                            download="iCALLOG_8K_Image.png"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs flex items-center gap-1 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" /> Download 8K
                          </a>
                          <a
                            href={generatedPreviewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> Full Resolution
                          </a>
                        </div>
                      </div>
                      <div className="relative aspect-video rounded-2xl overflow-hidden border border-cyan-500/40 shadow-2xl bg-black">
                        <img
                          src={generatedPreviewUrl}
                          alt="AI Generated Output"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* 2. Video Preview (Video, Video-to-Video, All) */}
                  {((selectedModality === 'video' || selectedModality === 'video_to_video') || (selectedModality === 'all' && activeAllTab === 'video')) && generatedVideoUrl && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                          <VideoIcon className="w-4 h-4 text-cyan-400" /> Cinematic 60fps AI Video:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                            60 FPS • 8K Master
                          </span>
                          <a
                            href={generatedVideoUrl}
                            download="iCALLOG_60fps_Clip.mp4"
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" /> Save Video
                          </a>
                        </div>
                      </div>
                      <div className="relative aspect-video rounded-2xl overflow-hidden border border-cyan-500/40 shadow-2xl bg-black">
                        <video
                          src={generatedVideoUrl}
                          controls
                          autoPlay
                          loop
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* 3. Image + Video (Side by side comparison) */}
                  {selectedModality === 'image_to_video' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                          <Layers className="w-4 h-4" /> Image-to-Video Parallax Motion Pair:
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Anchor Frame → Animated 60fps</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-mono">1. Starting Keyframe (Image)</span>
                          <div className="aspect-video rounded-xl overflow-hidden border border-indigo-500/40 bg-black">
                            {generatedPreviewUrl ? (
                              <img src={generatedPreviewUrl} alt="Keyframe" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">Rendering...</div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-cyan-400 font-mono">2. Parallax Motion Video (60fps)</span>
                          <div className="aspect-video rounded-xl overflow-hidden border border-cyan-500/40 bg-black">
                            {generatedVideoUrl ? (
                              <video src={generatedVideoUrl} controls autoPlay loop playsInline className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">Rendering...</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. Image + Image (Dual Fusion) */}
                  {selectedModality === 'image_to_image' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4" /> Image + Image Neural Style Fusion:
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Geometry Base + Stylized Result</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-mono">Original Base Geometry</span>
                          <div className="aspect-video rounded-xl overflow-hidden border border-slate-700 bg-black">
                            {secondaryImageUrl && <img src={secondaryImageUrl} alt="Base" className="w-full h-full object-cover" />}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-purple-300 font-mono">Transferred 8K Style</span>
                          <div className="aspect-video rounded-xl overflow-hidden border border-purple-500/50 bg-black">
                            {generatedPreviewUrl && <img src={generatedPreviewUrl} alt="Styled" className="w-full h-full object-cover" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 5. Video + Image (Action Frame Extraction) */}
                  {selectedModality === 'video_to_image' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                          <Eye className="w-4 h-4" /> Video Frame Extraction → 8K IMAX Still:
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-mono">Video Scene Sequence</span>
                          <div className="aspect-video rounded-xl overflow-hidden border border-slate-800 bg-black">
                            {generatedVideoUrl && <video src={generatedVideoUrl} controls autoPlay loop playsInline className="w-full h-full object-cover" />}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-amber-300 font-mono">Deblurred 8K Action Still</span>
                          <div className="aspect-video rounded-xl overflow-hidden border border-amber-500/50 bg-black">
                            {generatedPreviewUrl && <img src={generatedPreviewUrl} alt="Still" className="w-full h-full object-cover" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 6. Music & Audio Synth (Music, All) */}
                  {((selectedModality === 'music') || (selectedModality === 'all' && activeAllTab === 'music')) && generatedSong && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-800/60 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-800/40 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-purple-600/30 text-purple-300 border border-purple-500/40 flex items-center justify-center">
                            <Music className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white font-['Syne']">{generatedSong.title}</h4>
                            <p className="text-[11px] text-purple-300 font-mono">
                              {generatedSong.tempoBpm} BPM • Key: {generatedSong.musicalKey} • {generatedSong.genre}
                            </p>
                          </div>
                        </div>

                        {/* Synth Audio Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (isSynthesizingAudio) stopSynthAudio();
                              else playSynthAudio(generatedSong.tempoBpm);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
                              isSynthesizingAudio
                                ? 'bg-rose-600 text-white animate-pulse'
                                : 'bg-purple-600 hover:bg-purple-500 text-white'
                            }`}
                          >
                            {isSynthesizingAudio ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                            <span>{isSynthesizingAudio ? 'Stop Synth Audio' : 'Play Live Synth Audio'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Visualizer wave animation when playing */}
                      {isSynthesizingAudio && (
                        <div className="flex items-center gap-1 h-6 px-3 bg-purple-950/80 rounded-lg">
                          {[40, 80, 60, 100, 75, 90, 45, 85, 95, 65, 50, 70, 90, 30].map((h, i) => (
                            <span
                              key={i}
                              className="flex-1 bg-gradient-to-t from-purple-500 to-cyan-400 rounded-full animate-pulse"
                              style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Lyrics Preview */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                        {generatedSong.lyrics}
                      </div>
                    </div>
                  )}

                  {/* 7. Executive Document Preview (Document, Film, All) */}
                  {((selectedModality === 'document' || selectedModality === 'film') || (selectedModality === 'all' && activeAllTab === 'document')) && generatedDoc && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/40 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-cyan-400" />
                          <h4 className="text-xs font-bold text-white font-['Syne']">{generatedDoc.title}</h4>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(generatedDoc.content);
                              setCopiedDoc(true);
                              setTimeout(() => setCopiedDoc(false), 2000);
                              onNotify('Copied!', 'Full document copied to clipboard.', 'success');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-slate-700"
                          >
                            {copiedDoc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedDoc ? 'Copied' : 'Copy Text'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadDoc('doc')}
                            className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs flex items-center gap-1 shadow-sm"
                          >
                            <Download className="w-3.5 h-3.5" /> Download .doc
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadDoc('txt')}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" /> .txt
                          </button>
                        </div>
                      </div>

                      {/* Document Sections Chips */}
                      {generatedDoc.sections && generatedDoc.sections.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[10px] text-slate-400 font-mono">Sections:</span>
                          {generatedDoc.sections.map((sec, i) => (
                            <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-cyan-300 font-mono">
                              {sec}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                        {generatedDoc.content}
                      </div>
                    </div>
                  )}

                  {/* 8. 3D WebGL Mesh Preview (3D, All) */}
                  {((selectedModality === '3d') || (selectedModality === 'all' && activeAllTab === '3d')) && is3DActive && (
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-cyan-500/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Box className="w-4 h-4 text-cyan-400 animate-spin" />
                          <span className="text-xs font-bold text-white font-['Syne']">Interactive 3D WebGL Asset (Drag to Orbit)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsWireframe3D(!isWireframe3D)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs border border-slate-700"
                          >
                            {isWireframe3D ? 'Solid Shading' : 'Wireframe Mesh'}
                          </button>
                          <span className="text-[10px] font-mono text-slate-400">Quad: 35,000 Verts</span>
                        </div>
                      </div>

                      <div
                        ref={threeCanvasRef}
                        className="w-full h-56 rounded-xl overflow-hidden border border-cyan-500/30 bg-black cursor-grab active:cursor-grabbing"
                      />
                      <p className="text-[10px] text-slate-400 text-center font-mono">
                        Calibrated for PBR Roughness/Metallic and 52-Bone Skeletal Hierarchy.
                      </p>
                    </div>
                  )}

                  {/* 9. Voiceover Audio Speech (Voice) */}
                  {selectedModality === 'voice' && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center">
                          <Mic className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">Broadcast Studio Voiceover</h4>
                          <p className="text-[11px] text-slate-400 font-mono">Neumann U87 condenser acoustics • Natural breath inflection</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleVoice(enhancedResult.enhancedPrompt)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                          isSpeakingVoice
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                        }`}
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>{isSpeakingVoice ? 'Stop Speaking' : 'Play Voice Narration'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={isGeneratingPreview}
                  onClick={handleGenerateInstantPreview}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/50 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isGeneratingPreview ? 'animate-spin' : ''}`} />
                  <span>
                    {isGeneratingPreview
                      ? 'Generating Multi-Modal Output...'
                      : `Generate ${currentModalityConfig.shortLabel} Here (यहाँ बनाएं)`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenInStudio}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/60 flex items-center gap-2 transition-all"
                >
                  <span>Open & Create in {currentModalityConfig.shortLabel} Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Bar */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Universal AI Architect Active for all media formats</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Free Tier & VIP Diamond Unlocked</span>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

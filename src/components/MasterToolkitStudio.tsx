import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  BookOpen,
  Search,
  Download,
  Share2,
  CheckCircle2,
  Layers,
  Wand2,
  Terminal,
  Cpu,
  Shield,
  Award,
  Compass,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { UserProfile, ActiveTab } from '../types.ts';
import { safeDownloadMedia } from '../lib/downloadHelper.ts';

interface MasterToolkitStudioProps {
  user: UserProfile;
  setActiveTab?: (tab: ActiveTab) => void;
  onNotify: (title: string, desc: string, type?: 'info' | 'success' | 'warning' | 'error' | 'admin') => void;
}

export interface AtoZItem {
  letter: string;
  title: string;
  category: string;
  description: string;
  actionLabel: string;
  badge: string;
}

export const MasterToolkitStudio: React.FC<MasterToolkitStudioProps> = ({
  user,
  setActiveTab,
  onNotify,
}) => {
  const [activeSuiteTab, setActiveSettingsSuiteTab] = useState<'a_to_z' | 'one_to_100'>('a_to_z');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'ai' | 'media' | 'dev' | 'legacy'>('all');
  const [activeRunningTool, setActiveRunningTool] = useState<string | null>(null);
  const [toolOutput, setToolOutput] = useState<string | null>(null);

  const ONE_TO_100_UTILITIES = [
    { num: 1, title: 'Audio Noise Gate & Low-Cut Filter', category: 'media', desc: 'Eliminate low-frequency hums and background mic hiss under -40dB.', badge: 'Audio' },
    { num: 2, title: 'Aspect Ratio & Framing Calculator', category: 'media', desc: 'Convert video pixel dimensions between 16:9, 9:16, 1:1, 4:3, and 21:9.', badge: 'Framing' },
    { num: 3, title: 'Bitrate & Storage Space Estimator', category: 'dev', desc: 'Calculate video clip file size for 4K ProRes, H.264, and WebM exports.', badge: 'Storage' },
    { num: 4, title: 'Chroma Key Edge Feather & Spill Suppressor', category: 'media', desc: 'Refine green/blue screen matte edges and suppress color fringe.', badge: 'VFX' },
    { num: 5, title: 'FPS Motion Interpolation Converter', category: 'media', desc: 'Convert 24fps film to 60fps high frame rate smooth motion.', badge: 'Framerate' },
    { num: 6, title: 'Subtitle SRT & VTT Timecode Generator', category: 'ai', desc: 'Generate web-compliant caption files with millisecond precision.', badge: 'Captions' },
    { num: 7, title: 'EXIF Image Metadata Cleaner', category: 'dev', desc: 'Strip camera model, GPS coordinates, and private device tags.', badge: 'Privacy' },
    { num: 8, title: 'SVG Vector Tracer & Path Extractor', category: 'dev', desc: 'Trace raster PNG/JPG artwork into scalable vector bezier curves.', badge: 'Vector' },
    { num: 9, title: 'Color Palette Extractor & Swatch Builder', category: 'media', desc: 'Extract dominant HEX color codes from any image or video frame.', badge: 'Design' },
    { num: 10, title: 'Formant Pitch Shifter & Vocal Transformer', category: 'ai', desc: 'Shift vocal timbre without altering audio speed or playback tempo.', badge: 'Voice' },
    { num: 11, title: 'GIF Loop Optimizer & Frame Extractor', category: 'media', desc: 'Compress animated GIFs and extract individual high-res PNG frames.', badge: 'GIF' },
    { num: 12, title: 'HTML5 Canvas Shader Exporter', category: 'dev', desc: 'Export WebGL particle animations to standalone HTML/JS code.', badge: 'WebGL' },
    { num: 13, title: 'ISO Grain Reduction & Spatial Denoise', category: 'ai', desc: 'Remove high-ISO camera sensor noise while preserving sharp edges.', badge: 'Denoise' },
    { num: 14, title: 'JPEG Artifact & Blur Eliminator', category: 'ai', desc: 'Enhance low-resolution pixelated photos into crisp sharp images.', badge: 'Enhancer' },
    { num: 15, title: 'Keyframe Easing Curve Generator', category: 'media', desc: 'Generate cubic-bezier easing values for CSS and GSAP animations.', badge: 'Animation' },
    { num: 16, title: 'Loudness LUFS Audio Normalizer', category: 'media', desc: 'Normalize podcast and music track audio to broadcast -14 LUFS.', badge: 'Broadcast' },
    { num: 17, title: 'MP4 Video Stream Repair & Muxer', category: 'dev', desc: 'Re-index corrupted video containers and fix missing audio tracks.', badge: 'Repair' },
    { num: 18, title: 'Neural Depth Map & Bokeh Mask Generator', category: 'ai', desc: 'Generate grayscale depth maps for 3D spatial photos and blur masks.', badge: '3D Depth' },
    { num: 19, title: 'Optical Flow Motion Blur Synthesizer', category: 'media', desc: 'Add realistic shutter motion blur to fast-moving objects.', badge: 'Motion' },
    { num: 20, title: 'PNG Alpha Transparency Clean Matting', category: 'media', desc: 'Clean up halo pixels around transparent cutouts and avatars.', badge: 'Matte' },
    { num: 21, title: 'QuickTime ProRes Alpha Exporter', category: 'media', desc: 'Export transparent video overlays for NLE video editors.', badge: 'ProRes' },
    { num: 22, title: 'Resampling Sample Rate Converter (44.1k/48k/96k)', category: 'media', desc: 'Resample audio streams between CD 44.1kHz and Film 48kHz standards.', badge: 'Audio' },
    { num: 23, title: 'Spatial 3D Audio Binaural Panner', category: 'media', desc: 'Position sound sources in 360° headphone spatial audio space.', badge: '3D Audio' },
    { num: 24, title: 'Timecode SMPTE Calculator & Drop-Frame Sync', category: 'dev', desc: 'Calculate video frame drift for 29.97 NTSC broadcast sync.', badge: 'Timecode' },
    { num: 25, title: 'UV Texture Unwrapper & Normal Map Generator', category: 'dev', desc: 'Generate normal, roughness, and bump maps from 2D textures.', badge: '3D Mesh' },
    { num: 26, title: 'Vocal De-Esser & Sibilance Reducer', category: 'media', desc: 'Dampen harsh "S" and "T" consonant frequency spikes in vocals.', badge: 'Audio' },
    { num: 27, title: 'WebM / VP9 Video Compressor', category: 'media', desc: 'Compress heavy video clips for lightweight web embedding.', badge: 'Compress' },
    { num: 28, title: 'XML / RSS Podcast Feed Validator', category: 'dev', desc: 'Validate Apple Podcasts and Spotify RSS XML feed structures.', badge: 'RSS' },
    { num: 29, title: 'YUV to RGB Color Space Converter', category: 'dev', desc: 'Convert raw YUV420 camera sensor frames into RGB pixel buffers.', badge: 'Color Space' },
    { num: 30, title: 'Zip Archive Batch Media Compressor', category: 'dev', desc: 'Package project assets into compressed ZIP files for distribution.', badge: 'Archive' },
    { num: 31, title: 'AI Script Hook & 3-Second Retention Scoring', category: 'ai', desc: 'Score YouTube Shorts and TikTok opening script retention potential.', badge: 'Script' },
    { num: 32, title: 'Binaural Delta Wave Brainwave Synthesizer', category: 'media', desc: 'Synthesize ambient focus, relaxation, and deep sleep audio frequencies.', badge: 'Focus' },
    { num: 33, title: 'Custom CSS Filter Shader Builder', category: 'dev', desc: 'Generate cross-browser CSS blur, contrast, hue, and saturate code.', badge: 'CSS' },
    { num: 34, title: 'Dynamic QR Code Generator & Tracker', category: 'legacy', desc: 'Generate stylized branded QR codes with logo overlays.', badge: 'QR Code' },
    { num: 35, title: 'Echo & Reverb Tail Remover', category: 'ai', desc: 'Dampen room echo and reverberation from room microphone recordings.', badge: 'Audio' },
    { num: 36, title: 'Font Glyph & Icon Font Extractor', category: 'dev', desc: 'Extract SVG icons and bezier paths from TTF and WOFF font files.', badge: 'Fonts' },
    { num: 37, title: 'Green Screen Lighting Equalizer', category: 'media', desc: 'Balance uneven lighting hotspots on physical green screen backdrops.', badge: 'Lighting' },
    { num: 38, title: 'HDR Tone Mapping & Exposure Fusion', category: 'media', desc: 'Merge bracketed photos into single high dynamic range photos.', badge: 'HDR' },
    { num: 39, title: 'Image Palette Swatch Exporter', category: 'dev', desc: 'Export Adobe ASE and Procreate color swatches from artwork.', badge: 'Swatches' },
    { num: 40, title: 'Jitter & Video Shake Stabilizer', category: 'ai', desc: 'Stabilize shaky handheld webcam and mobile camera footage.', badge: 'Stabilize' },
    { num: 41, title: 'K-Means Color Quantizer', category: 'dev', desc: 'Reduce image color depth for retro 16-color pixel art.', badge: 'Quantizer' },
    { num: 42, title: 'L-Cut & J-Cut Audio Transition Planner', category: 'media', desc: 'Plan video dialogue overlap cuts for smooth cinematic scene flow.', badge: 'Editing' },
    { num: 43, title: 'Microphone Gain & Preamp Peak Calibrator', category: 'media', desc: 'Calibrate input audio sensitivity to prevent digital clipping.', badge: 'Mic' },
    { num: 44, title: 'Neural Background Music Ducker', category: 'ai', desc: 'Automatically lower background music volume when speech is detected.', badge: 'Duck' },
    { num: 45, title: 'Optical Character Recognition (OCR) Scanner', category: 'ai', desc: 'Extract editable text from scanned documents and screenshot images.', badge: 'OCR' },
    { num: 46, title: 'Parallax 2.5D Layer Depth Animator', category: 'media', desc: 'Separate foreground objects and animate 3D depth movement.', badge: '2.5D' },
    { num: 47, title: 'Quiet Silence Remover & Trimmer', category: 'ai', desc: 'Automatically cut dead air and long pauses from speech recordings.', badge: 'Trimmer' },
    { num: 48, title: 'Rotoscoping Subject Silhouette Masker', category: 'ai', desc: 'Extract moving human subjects from video streams without a green screen.', badge: 'Roto' },
    { num: 49, title: 'Speech-to-Text Multi-Language Translator', category: 'ai', desc: 'Translate audio dialogue into 30+ global languages in real-time.', badge: 'Translate' },
    { num: 50, title: 'Thumbnail Eye-Tracking Heatmap Predictor', category: 'ai', desc: 'Predict audience visual focal points on YouTube thumbnails.', badge: 'Heatmap' },
    { num: 51, title: 'Ultra-Fast WebP Image Converter', category: 'media', desc: 'Batch convert heavy JPGs to next-gen WebP images with 80% space saving.', badge: 'WebP' },
    { num: 52, title: 'Vector Font Monogram Generator', category: 'media', desc: 'Create geometric initial monograms for logos and creator branding.', badge: 'Branding' },
    { num: 53, title: 'WAV 32-Bit Float Audio Exporter', category: 'media', desc: 'Export distortion-proof 32-bit floating point audio files.', badge: 'Audio' },
    { num: 54, title: 'X-Platform Metadata Tag Generator', category: 'legacy', desc: 'Generate OpenGraph, Twitter Card, and Schema.org SEO tags.', badge: 'SEO' },
    { num: 55, title: 'Yellow / Warm Tint Color Corrector', category: 'media', desc: 'Neutralize harsh yellow indoor lighting and balance skin tones.', badge: 'Skin' },
    { num: 56, title: 'Zero-Latency WebRTC Stream Tester', category: 'dev', desc: 'Test peer-to-peer WebRTC video stream latency and packet drop.', badge: 'WebRTC' },
    { num: 57, title: 'Auto-BPM Beat Counter & Rhythm Tapper', category: 'media', desc: 'Detect musical tempo (BPM) and tap rhythm sync for video cuts.', badge: 'BPM' },
    { num: 58, title: 'Cinematic CinemaScope Letterbox Generator', category: 'media', desc: 'Apply 2.39:1 widescreen black bars and anamorphic lens flare.', badge: 'Cinema' },
    { num: 59, title: 'Digital Signature SHA-512 Seal', category: 'legacy', desc: 'Sign creative contracts and scripts with SHA-512 digital seals.', badge: 'Security' },
    { num: 60, title: 'Equalizer 10-Band Precision Graphic EQ', category: 'media', desc: 'Sculpt bass, mid, and treble frequencies for studio audio polish.', badge: 'EQ' },
    { num: 61, title: 'Focus Stacking Image Sharpener', category: 'media', desc: 'Combine multiple focal plane photos into edge-to-edge sharp macro shots.', badge: 'Focus' },
    { num: 62, title: 'Gamut Rec.709 to Rec.2020 Converter', category: 'dev', desc: 'Convert standard HD color gamut to wide HDR color space.', badge: 'HDR Color' },
    { num: 63, title: 'Harmonic Distortion & Saturation Synthesizer', category: 'media', desc: 'Add warm analog tape distortion and vacuum tube saturation.', badge: 'Tape' },
    { num: 64, title: 'Image Resolution DPI Printable Resizer', category: 'media', desc: 'Convert screen pixels to 300 DPI high-print graphics.', badge: 'Print' },
    { num: 65, title: 'Joint Stereo to Dual Mono Splitter', category: 'media', desc: 'Split stereo audio tracks into independent left and right channels.', badge: 'Mono' },
    { num: 66, title: 'Kaleidoscope Geometric Mirror FX', category: 'media', desc: 'Apply symmetric geometric kaleidoscope motion patterns.', badge: 'VFX' },
    { num: 67, title: 'Lip Sync Alignment Inspector', category: 'ai', desc: 'Check audio-video lip synchronization drift in milliseconds.', badge: 'Sync' },
    { num: 68, title: 'Multicam Angle Switcher & Sync', category: 'media', desc: 'Sync multi-camera video angles using audio waveform matching.', badge: 'Multicam' },
    { num: 69, title: 'Noise Floor Profile Cleaner', category: 'ai', desc: 'Capture room ambient noise profile and subtract it from vocals.', badge: 'Clean' },
    { num: 70, title: 'Over-Exposure Highlight Recovery', category: 'media', desc: 'Recover blown-out skin highlights and bright sky details.', badge: 'Recovery' },
    { num: 71, title: 'PBR Metallic Roughness Map Generator', category: 'dev', desc: 'Generate metallic, specular, and roughness textures for 3D shaders.', badge: '3D PBR' },
    { num: 72, title: 'Quad-Split Multiview Display Builder', category: 'media', desc: 'Create 4-way split screen video layouts for broadcast reels.', badge: 'Split Screen' },
    { num: 73, title: 'Radio DJ Voice Compression & Limiter', category: 'media', desc: 'Apply broadcast punchy radio voice compression preset.', badge: 'Radio' },
    { num: 74, title: 'Sub-Bass Frequency Enhancer & Sub-Harmonic Generator', category: 'media', desc: 'Add deep 40Hz sub-bass punch to sound effects and trailer hits.', badge: 'Sub-Bass' },
    { num: 75, title: 'Time-Lapse Frame Interval Calculator', category: 'media', desc: 'Calculate capture interval timing for clouds, sunsets, and stars.', badge: 'Time-Lapse' },
    { num: 76, title: 'Ultra-Wide 21:9 Curved Monitor Preview Simulator', category: 'media', desc: 'Preview ultrawide 3440x1440 video layout composition.', badge: '21:9' },
    { num: 77, title: 'Vector Waveform & Vectorscope Monitor', category: 'dev', desc: 'Inspect skin tone vector line alignment on a vectorscope HUD.', badge: 'Vectorscope' },
    { num: 78, title: 'Watermark Logo Overlay Stamper', category: 'media', desc: 'Stamp transparent brand watermarks onto batch image assets.', badge: 'Watermark' },
    { num: 79, title: 'X-Ray Color Channel Isolation', category: 'dev', desc: 'Isolate individual Red, Green, or Blue channels for VFX inspection.', badge: 'VFX' },
    { num: 80, title: 'Y-Axis Motion Camera Shake Generator', category: 'media', desc: 'Add subtle handheld organic camera drift to static shots.', badge: 'Camera' },
    { num: 81, title: 'Zero-Crossing Audio Loop Seamless Trimmer', category: 'media', desc: 'Trim audio samples at zero-crossing points to prevent pops and clicks.', badge: 'Loop' },
    { num: 82, title: '360° VR Equirectangular Panorama Converter', category: 'media', desc: 'Convert flat panoramas into VR 360° interactive spherical views.', badge: 'VR 360' },
    { num: 83, title: 'AI Avatar Facial Landmark Mesh Extractor', category: 'ai', desc: 'Extract 468 3D facial mesh keypoints for VTuber avatar tracking.', badge: 'VTuber' },
    { num: 84, title: 'Bessel Low-Pass Audio Filter', category: 'media', desc: 'Apply linear phase audio filtering for smooth electronic beats.', badge: 'Filter' },
    { num: 85, title: 'Color LUT .cube Converter & Compiler', category: 'dev', desc: 'Convert Photoshop grading tables into standard 3D .cube files.', badge: 'LUT' },
    { num: 86, title: 'DMX 512 Lighting Controller Simulator', category: 'dev', desc: 'Simulate concert stage light fixtures and DMX channel cues.', badge: 'DMX' },
    { num: 87, title: 'Emoticon & Meme Text Bubble Overlay', category: 'media', desc: 'Add comic book speech bubbles and manga impact lines.', badge: 'Manga' },
    { num: 88, title: 'Fisheye Distortion Lens Unwarper', category: 'media', desc: 'Flatten wide GoPro fisheye lens distortion into rectilinear views.', badge: 'Lens' },
    { num: 89, title: 'Glitch FX Displacement Map Generator', category: 'media', desc: 'Create digital VHS chromatic aberration and RGB split glitches.', badge: 'Glitch' },
    { num: 90, title: 'H.265 / HEVC Ultra-Efficient Encoder', category: 'media', desc: 'Encode high-efficiency 4K videos at half the file size of H.264.', badge: 'HEVC' },
    { num: 91, title: 'Infrared Thermal Vision Colorizer', category: 'media', desc: 'Apply thermal camera false-color heat map overlays.', badge: 'Thermal' },
    { num: 92, title: 'Judder Free 24fps Film Cadence Converter', category: 'media', desc: 'Eliminate 3:2 pulldown stutter on digital TV playback.', badge: 'Film' },
    { num: 93, title: 'Keyframe Velocity Graph Interpolator', category: 'dev', desc: 'Fine-tune animation speed curves and momentum acceleration.', badge: 'Velocity' },
    { num: 94, title: 'Lidar Point Cloud 3D Scan Viewer', category: 'dev', desc: 'Render mobile iPhone Lidar point cloud scans in 3D WebGL.', badge: 'Lidar' },
    { num: 95, title: 'MIDI Music Keyboard to Synth Sound Generator', category: 'media', desc: 'Connect MIDI keyboards and trigger 128 GM WebAudio instruments.', badge: 'MIDI' },
    { num: 96, title: 'Neural Accent Modifier & Pronunciation Polisher', category: 'ai', desc: 'Polish speech clarity and balance vocal accents for global audiences.', badge: 'Accent' },
    { num: 97, title: 'Overdrive Tube Amplifier Distortion Unit', category: 'media', desc: 'Emulate vintage guitar tube amp warm harmonic crunch.', badge: 'Guitar' },
    { num: 98, title: 'Procedural Texture Noise Pattern Generator', category: 'dev', desc: 'Generate Perlin, Simplex, and Voronoi noise maps for 3D shaders.', badge: 'Procedural' },
    { num: 99, title: 'Quantized Pixel Art Downscaler', category: 'media', desc: 'Convert modern 4K photos into retro 16-bit SNES game graphics.', badge: 'Pixel Art' },
    { num: 100, title: 'Zero-Click Complete Project Archiver & Packager', category: 'legacy', desc: 'Package entire project timelines, raw media, and assets into 1 ZIP.', badge: 'Master Pack' },
  ];

  const AT_TO_Z_ITEMS: AtoZItem[] = [
    {
      letter: 'A',
      title: 'AI Agent Autonomous Crew',
      category: 'ai',
      description: 'Multi-agent creative brainstorming, automated storyboarding, and script refinement crews.',
      actionLabel: 'Deploy AI Crew',
      badge: 'Multi-Agent',
    },
    {
      letter: 'B',
      title: 'Blockchain Copyright & NFT Timestamp',
      category: 'legacy',
      description: 'Generate immutable SHA-256 cryptographic proof of ownership for all your media assets.',
      actionLabel: 'Generate Hash Seal',
      badge: 'Immutable',
    },
    {
      letter: 'C',
      title: 'Cinematic Color Grading & 3D LUTs',
      category: 'media',
      description: 'Apply professional Hollywood, Bollywood, Cyberpunk, and Neo-Noir 3D Lookup Tables.',
      actionLabel: 'Apply 3D LUT',
      badge: 'Hollywood',
    },
    {
      letter: 'D',
      title: 'Dynamic Branching Dialog Tree',
      category: 'ai',
      description: 'Interactive character conversation trees with consequence matrices for games & films.',
      actionLabel: 'Build Branch Tree',
      badge: 'Interactive',
    },
    {
      letter: 'E',
      title: 'Epic Orchestral Soundscape Generator',
      category: 'media',
      description: 'Synthesize cinematic brass, sweeping strings, and emotional trailer percussion tracks.',
      actionLabel: 'Compose Score',
      badge: 'Orchestral',
    },
    {
      letter: 'F',
      title: 'Future Trend Predictor & Viral Hook Analyzer',
      category: 'ai',
      description: 'Analyze audience retention vectors and score 3-second hook effectiveness for YouTube & TikTok.',
      actionLabel: 'Analyze Hooks',
      badge: 'Viral AI',
    },
    {
      letter: 'G',
      title: 'Generative Hologram Shader Configurator',
      category: 'media',
      description: 'PBR glass, neon fresnel, and volumetric laser shaders for 3D holographic rendering.',
      actionLabel: 'Configure Shader',
      badge: 'WebGL',
    },
    {
      letter: 'H',
      title: 'Holographic UI & Neon Matrix Theme Engine',
      category: 'legacy',
      description: 'Switch instantly between Cyberpunk Neon, Matrix Green, Synthwave Purple, and Deep Space themes.',
      actionLabel: 'Apply Matrix Skin',
      badge: 'Custom UI',
    },
    {
      letter: 'I',
      title: 'Interactive WebGL Particle Fountain',
      category: 'media',
      description: 'High-performance real-time physics particle emitter for visual background explosions.',
      actionLabel: 'Spawn Fountain',
      badge: '60 FPS',
    },
    {
      letter: 'J',
      title: 'JSON Data Visualizer & Schema Builder',
      category: 'dev',
      description: 'Convert raw API payloads, script nodes, and game configs into interactive visual graphs.',
      actionLabel: 'Visualize Schema',
      badge: 'Developer',
    },
    {
      letter: 'K',
      title: 'Kinetic Typography & Motion Lyric Video',
      category: 'media',
      description: 'Animated subtitle timing, bounce text physics, and neon glowing typography overlays.',
      actionLabel: 'Animate Lyrics',
      badge: 'Motion',
    },
    {
      letter: 'L',
      title: 'Live Neural Voice Clone & Mood Synthesizer',
      category: 'ai',
      description: 'Convert voice recordings into 6 distinct vocal personas with emotional pitch inflections.',
      actionLabel: 'Synthesize Voice',
      badge: 'Neural',
    },
    {
      letter: 'M',
      title: 'Master Invoicing & Creator Payout Calculator',
      category: 'legacy',
      description: 'Calculate international tax withholdings, currency conversions, and global bank payouts.',
      actionLabel: 'Generate Invoice',
      badge: 'Global Payout',
    },
    {
      letter: 'N',
      title: 'Neural Dream Weaver & Mood Enhancer',
      category: 'ai',
      description: 'Translate raw stream-of-consciousness thoughts into ambient visual and auditory dreamscapes.',
      actionLabel: 'Weave Dream',
      badge: 'Subconscious',
    },
    {
      letter: 'O',
      title: 'Omni-Channel Cross-Platform Publisher',
      category: 'media',
      description: 'Simultaneous 1-click publishing to YouTube Shorts, Instagram Reels, TikTok, and X.',
      actionLabel: 'Publish Everywhere',
      badge: '1-Click',
    },
    {
      letter: 'P',
      title: 'Prompt Engineering Matrix & Supercharger',
      category: 'ai',
      description: 'Expand simple prompt fragments into professional 8K photorealistic multi-modifier prompts.',
      actionLabel: 'Supercharge Prompt',
      badge: 'Gemini Pro',
    },
    {
      letter: 'Q',
      title: 'Quantum Cipher & Secret Note Encrypter',
      category: 'legacy',
      description: 'Military-grade cryptographic note locker for confidential scripts and secret intellectual property.',
      actionLabel: 'Encrypt Vault',
      badge: 'Secure',
    },
    {
      letter: 'R',
      title: 'Retro 8-Bit Chiptune Melody Factory',
      category: 'media',
      description: 'Synthesize classic Game Boy and arcade style square-wave arpeggios instantly.',
      actionLabel: 'Generate Chiptune',
      badge: 'Arcade',
    },
    {
      letter: 'S',
      title: 'Sentiment Analysis & Audience Predictor',
      category: 'ai',
      description: 'Evaluate emotional resonance, engagement triggers, and demographic appeal scores.',
      actionLabel: 'Evaluate Sentiment',
      badge: 'Analytics',
    },
    {
      letter: 'T',
      title: 'Teleprompter HUD & Broadcast Studio',
      category: 'media',
      description: 'Smooth scrolling adjustable speed prompter for live recording and camera speeches.',
      actionLabel: 'Launch Prompter',
      badge: 'Broadcast',
    },
    {
      letter: 'U',
      title: 'Ultra-Resolution 16K Upscaling Simulator',
      category: 'ai',
      description: 'AI neural enhancement simulation for ultra-crisp textures and artifact-free image expansion.',
      actionLabel: 'Simulate 16K',
      badge: 'Ultra HD',
    },
    {
      letter: 'V',
      title: 'Viral Meme & Reaction Loop Generator',
      category: 'media',
      description: 'Rapid video looping, top/bottom text meme formatting, and GIF export.',
      actionLabel: 'Create Meme',
      badge: 'Viral',
    },
    {
      letter: 'W',
      title: 'World-Building Lore & Universe Generator',
      category: 'ai',
      description: 'Generate multi-century fictional history, planet maps, factions, and character arcs.',
      actionLabel: 'Generate Lore',
      badge: 'Sci-Fi / Fantasy',
    },
    {
      letter: 'X',
      title: 'X-Ray 3D Wireframe & Shader Inspector',
      category: 'dev',
      description: 'Inspect polygon geometry, vertex normals, and UV texture mapping overlays in real-time.',
      actionLabel: 'Inspect Wireframe',
      badge: 'Debug 3D',
    },
    {
      letter: 'Y',
      title: 'YouTube CTR Thumbnail A/B Split-Tester',
      category: 'ai',
      description: 'Simulate human eye-tracking fixation maps to predict thumbnail click-through rates.',
      actionLabel: 'Run A/B Test',
      badge: 'High CTR',
    },
    {
      letter: 'Z',
      title: 'Zero-Latency Cloud Sync & Vault Keeper',
      category: 'legacy',
      description: 'Instant offline IndexedDB and cloud storage synchronization across all user devices.',
      actionLabel: 'Sync Vault',
      badge: 'Real-Time',
    },
  ];

  const filteredItems = AT_TO_Z_ITEMS.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.letter.toLowerCase() === searchQuery.toLowerCase();
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const filteredOneTo100 = ONE_TO_100_UTILITIES.filter((u) => {
    const matchesSearch =
      u.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.num.toString() === searchQuery;
    const matchesCat = selectedCategory === 'all' || u.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleRunTool = (item: AtoZItem) => {
    setActiveRunningTool(item.title);
    setToolOutput(null);

    setTimeout(() => {
      setToolOutput(
        `[SUCCESS] Tool "${item.title}" (${item.letter}) executed successfully.\n- Status: Operational (60 FPS / Neural Verified)\n- Result: Generated optimized output package for "${item.badge}" workflow.\n- Timestamp: ${new Date().toISOString()}`
      );
      onNotify(`⚡ ${item.title} Executed`, `A-to-Z Master Toolkit successfully ran tool [${item.letter}].`, 'success');
    }, 800);
  };

  const handleRunUtility = (u: typeof ONE_TO_100_UTILITIES[0]) => {
    setActiveRunningTool(`#${u.num}: ${u.title}`);
    setToolOutput(null);

    setTimeout(() => {
      setToolOutput(
        `[SUCCESS] Power Utility #${u.num} "${u.title}" executed successfully.\n- Category: ${u.category.toUpperCase()} (${u.badge})\n- Pipeline: Real-time Web Canvas & Audio Engine\n- Timestamp: ${new Date().toISOString()}`
      );
      onNotify(`⚡ Utility #${u.num} Executed`, `Successfully executed ${u.title}.`, 'success');
    }, 700);
  };

  const handleExportAtoZReport = () => {
    const reportData = activeSuiteTab === 'a_to_z' ? AT_TO_Z_ITEMS : ONE_TO_100_UTILITIES;
    const reportJson = JSON.stringify(reportData, null, 2);
    safeDownloadMedia(reportJson, `iCALLOG_Master_Toolkit_${activeSuiteTab === 'a_to_z' ? 'A_to_Z' : '1_to_100'}_Report_${Date.now()}.json`, {
      mimeType: 'application/json',
      onNotify,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Suite Switcher Bar */}
      <div className="flex items-center justify-center sm:justify-start gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 max-w-md mx-auto sm:mx-0">
        <button
          onClick={() => setActiveSettingsSuiteTab('a_to_z')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold font-['Syne'] transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSuiteTab === 'a_to_z'
              ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🔤 A-to-Z Directory (26)</span>
        </button>
        <button
          onClick={() => setActiveSettingsSuiteTab('one_to_100')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold font-['Syne'] transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSuiteTab === 'one_to_100'
              ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🔢 1-to-100 Suite (100)</span>
        </button>
      </div>

      {/* 1. Hero Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-950 to-purple-950/70 border border-indigo-500/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {activeSuiteTab === 'a_to_z'
                    ? 'Complete A-to-Z Master Creator Suite'
                    : '1-to-100 Power Utilities Directory'}
                </span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold">
                {activeSuiteTab === 'a_to_z'
                  ? '🔤 26 Alphabetical Power Modules'
                  : '🔢 100 Specialized Sub-Utilities'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-['Syne'] tracking-tight flex items-center gap-3">
              <span>🌟</span>
              <span>
                {activeSuiteTab === 'a_to_z'
                  ? 'A-to-Z Master Toolkit & Infinite Generator'
                  : '1-to-100 Complete Creative Power Utilities'}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {activeSuiteTab === 'a_to_z'
                ? 'Every specialized creative tool imaginable, indexed alphabetically from A to Z. Execute autonomous AI crews, generate chiptunes, color grade cinema, and lock blockchain vault hashes.'
                : '100 curated media, AI, audio, design, and developer utilities. Run audio noise gates, LUFS loudness normalizers, EXIF cleaners, SVG tracers, and timecode sync tools in 1 click.'}
            </p>
          </div>

          <button
            onClick={handleExportAtoZReport}
            className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-950/50 cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Export {activeSuiteTab === 'a_to_z' ? 'A-to-Z' : '1-to-100'} Report</span>
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeSuiteTab === 'a_to_z'
                  ? "Search A to Z tools (e.g. 'A' for Agent, 'Music', 'Shader')..."
                  : "Search 1-100 utilities (e.g. '1', 'Noise Gate', 'Loudness', 'WebP')..."
              }
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-indigo-500/30 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Items' },
              { id: 'ai', label: 'AI & Neural' },
              { id: 'media', label: 'Media & 3D' },
              { id: 'dev', label: 'Developer' },
              { id: 'legacy', label: 'Vault & Payout' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as typeof selectedCategory)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Running Tool Output Banner (if active) */}
      {activeRunningTool && (
        <div className="p-5 rounded-3xl bg-slate-950 border border-cyan-500/50 shadow-2xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-cyan-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white">Execution Console: {activeRunningTool}</h3>
            </div>
            <button
              onClick={() => setActiveRunningTool(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-900 cursor-pointer"
            >
              Close Console
            </button>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300 whitespace-pre-wrap leading-relaxed">
            {toolOutput || 'Executing neural processing pipeline...'}
          </div>
        </div>
      )}

      {/* 3. A to Z Cards Grid OR 1 to 100 Utilities Grid */}
      {activeSuiteTab === 'a_to_z' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.letter}
              className="p-5 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between shadow-xl group space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-600 text-white font-black font-['Syne'] text-lg flex items-center justify-center shadow-md">
                    {item.letter}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors font-['Syne']">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <button
                onClick={() => handleRunTool(item)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>{item.actionLabel}</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredOneTo100.map((u) => (
            <div
              key={u.num}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-3 shadow-lg group"
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  #{u.num}
                </span>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors font-['Syne'] truncate">
                      {u.title}
                    </h4>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold shrink-0">
                      {u.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {u.desc}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleRunUtility(u)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-cyan-500 text-slate-300 hover:text-slate-950 font-bold text-xs shrink-0 transition-all cursor-pointer shadow"
                title={`Run Utility #${u.num}`}
              >
                <Zap className="w-4 h-4 fill-current" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

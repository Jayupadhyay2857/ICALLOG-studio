import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Video,
  Mic,
  RotateCcw,
  FlipHorizontal,
  Sun,
  Zap,
  ZapOff,
  Sparkles,
  Layers,
  Download,
  Trash2,
  Share2,
  Check,
  Maximize2,
  Grid,
  Clock,
  Settings2,
  Film,
  Music,
  FileText,
  Palette,
  Image as ImageIcon,
  Play,
  Pause,
  Square,
  Volume2,
  Sliders,
  Compass,
  Smile,
  X,
  Plus,
  RefreshCw,
  Eye,
  Shield,
  UploadCloud,
  ChevronRight,
  Award,
  Radio,
  Copy,
  ExternalLink,
} from 'lucide-react';
import {
  ActiveTab,
  UserProfile,
  CameraCaptureMode,
  CameraAspectRatio,
  CameraLutFilter,
  CameraMediaItem,
} from '../types.ts';
import {
  playCameraSound,
  getLutFilterCss,
  saveVaultItem,
  getVaultItems,
  deleteVaultItem,
  clearVault,
} from '../lib/cameraVault.ts';
import { safeDownloadMedia } from '../lib/downloadHelper.ts';

interface CameraStudioProps {
  user: UserProfile;
  setActiveTab?: (tab: ActiveTab) => void;
  onNotify: (title: string, desc: string, type?: 'info' | 'success' | 'warning' | 'error' | 'admin') => void;
  onUpdateUser?: (updated: UserProfile) => void;
  isModal?: boolean;
  onCloseModal?: () => void;
  onMediaCaptured?: (media: CameraMediaItem) => void;
}

export const CameraStudio: React.FC<CameraStudioProps> = ({
  user,
  setActiveTab,
  onNotify,
  onUpdateUser,
  isModal = false,
  onCloseModal,
  onMediaCaptured,
}) => {
  // 1. Camera & Audio Stream State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryFileInputRef = useRef<HTMLInputElement | null>(null);

  // Smart Chroma Key & Dynamic WebGL Engine State
  const [smartChromaEnabled, setSmartChromaEnabled] = useState<boolean>(false);
  const [keyColorHex, setKeyColorHex] = useState<string>('#00FF00');
  const [keyTolerance, setKeyTolerance] = useState<number>(35);
  const [keySmoothness, setKeySmoothness] = useState<number>(15);
  const [spillSuppression, setSpillSuppression] = useState<number>(30);
  const [webglTexture, setWebglTexture] = useState<
    | 'cyber_grid'
    | 'matrix_rain'
    | 'starfield_tunnel'
    | 'plasma_energy'
    | 'synthwave_sun'
    | 'aurora_borealis'
    | 'lava_vortex'
  >('cyber_grid');
  const [webglAnimSpeed, setWebglAnimSpeed] = useState<number>(1.0);
  const [webglIntensity, setWebglIntensity] = useState<number>(1.0);
  const [detectedColorName, setDetectedColorName] = useState<string>('Green Screen (#00FF00)');

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string>('');
  const [virtualStudioMode, setVirtualStudioMode] = useState<boolean>(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // 2. Mode State
  const [mode, setMode] = useState<CameraCaptureMode>('photo');
  const [aspectRatio, setAspectRatio] = useState<CameraAspectRatio>('16:9');
  const [filter, setFilter] = useState<CameraLutFilter>('normal');
  const [hdrEnabled, setHdrEnabled] = useState<boolean>(true);

  // 3. Hardware / Visual Adjustments (A to Z features)
  const [zoom, setZoom] = useState<number>(1.0);
  const [maxZoomSupported, setMaxZoomSupported] = useState<number>(5.0);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [isMirrored, setIsMirrored] = useState<boolean>(false);
  const [exposureEv, setExposureEv] = useState<number>(0); // -3 to +3
  const [whiteBalance, setWhiteBalance] = useState<'auto' | 'daylight' | 'cloudy' | 'fluorescent' | 'incandescent'>('auto');

  // Composition Overlays
  const [gridMode, setGridMode] = useState<'none' | 'rule_of_thirds' | 'golden_ratio' | 'crosshair' | 'horizon'>('rule_of_thirds');
  const [timerSeconds, setTimerSeconds] = useState<0 | 3 | 5 | 10>(0);
  const [countdownRemaining, setCountdownRemaining] = useState<number | null>(null);
  const [watermarkEnabled, setWatermarkEnabled] = useState<boolean>(true);
  const [watermarkText, setWatermarkText] = useState<string>('ICALLOG PRO CAMERA 8K');
  const [showTimestamp, setShowTimestamp] = useState<boolean>(true);

  // Shutter & Flash Screen animation feedback
  const [screenFlash, setScreenFlash] = useState<boolean>(false);
  const [isCapturingBurst, setIsCapturingBurst] = useState<boolean>(false);

  // Video Recording State
  const [isRecordingVideo, setIsRecordingVideo] = useState<boolean>(false);
  const [videoRecordingTime, setVideoRecordingTime] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const videoTimerRef = useRef<number | null>(null);
  const [videoFps, setVideoFps] = useState<number>(30);
  const [videoResolution, setVideoResolution] = useState<'1080p' | '720p' | '4k'>('1080p');

  // Teleprompter (for Video Creators & Presentations)
  const [teleprompterOpen, setTeleprompterOpen] = useState<boolean>(false);
  const [teleprompterText, setTeleprompterText] = useState<string>(
    'Welcome to iCallog Pro Camera Studio! You can record 4K ultra cinematic clips, capture high-res HDR photography, and record crystal-clear audio podcasts with real-time effects.'
  );
  const [teleprompterSpeed, setTeleprompterSpeed] = useState<number>(2);

  // Sound / Mic Recording State
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [audioRecordingTime, setAudioRecordingTime] = useState<number>(0);
  const [audioFilter, setAudioFilter] = useState<'normal' | 'studio' | 'robot' | 'radio' | 'echo'>('studio');
  const [micVolume, setMicVolume] = useState<number>(1.0);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Storage / Vault State
  const [vaultItems, setVaultItems] = useState<CameraMediaItem[]>([]);
  const [selectedVaultItem, setSelectedVaultItem] = useState<CameraMediaItem | null>(null);
  const [isVaultGalleryOpen, setIsVaultGalleryOpen] = useState<boolean>(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    'lut' | 'virtual_bg' | 'studio_lighting' | 'zoom' | 'grid' | 'prompter' | 'adjust'
  >('lut');

  // Virtual 3-Point Studio Lighting Control State
  const [virtualLightingEnabled, setVirtualLightingEnabled] = useState<boolean>(false);
  const [lightingPreset, setLightingPreset] = useState<
    'studio_portrait' | 'cyber_neon' | 'dramatic_noir' | 'golden_sunset' | 'cool_broadcaster' | 'custom'
  >('studio_portrait');

  // Key Light (Primary Main Light)
  const [keyIntensity, setKeyIntensity] = useState<number>(75);
  const [keyColor, setKeyColor] = useState<string>('#FFF4EA');
  const [keyPosX, setKeyPosX] = useState<number>(25);
  const [keyPosY, setKeyPosY] = useState<number>(25);
  const [keyRadius, setKeyRadius] = useState<number>(65);

  // Fill Light (Secondary Soft Shadow Fill)
  const [fillIntensity, setFillIntensity] = useState<number>(45);
  const [fillColor, setFillColor] = useState<string>('#E0F2FE');
  const [fillPosX, setFillPosX] = useState<number>(75);
  const [fillPosY, setFillPosY] = useState<number>(45);
  const [fillRadius, setFillRadius] = useState<number>(75);

  // Rim Light (Backlight Hair Highlight)
  const [rimIntensity, setRimIntensity] = useState<number>(65);
  const [rimColor, setRimColor] = useState<string>('#38BDF8');
  const [rimPosX, setRimPosX] = useState<number>(50);
  const [rimPosY, setRimPosY] = useState<number>(10);
  const [rimRadius, setRimRadius] = useState<number>(45);

  // Composite Blend Mode & Active Stage Node
  const [lightingBlendMode, setLightingBlendMode] = useState<
    'soft-light' | 'overlay' | 'screen' | 'color-dodge' | 'hard-light'
  >('soft-light');
  const [activeLightNode, setActiveLightNode] = useState<'key' | 'fill' | 'rim'>('key');

  // AI Auto-Correction Layer State
  const [aiAutoCorrectionEnabled, setAiAutoCorrectionEnabled] = useState<boolean>(false);
  const [autoExposureGain, setAutoExposureGain] = useState<number>(1.0);
  const [autoWbGainR, setAutoWbGainR] = useState<number>(1.0);
  const [autoWbGainG, setAutoWbGainG] = useState<number>(1.0);
  const [autoWbGainB, setAutoWbGainB] = useState<number>(1.0);
  const [aiDenoiseThreshold, setAiDenoiseThreshold] = useState<number>(18);
  const [measuredLuma, setMeasuredLuma] = useState<number>(120);
  const [measuredColorTemp, setMeasuredColorTemp] = useState<number>(5800);
  const [histogramData, setHistogramData] = useState<number[]>(new Array(16).fill(0));
  const [aiAutoTuneActive, setAiAutoTuneActive] = useState<boolean>(false);

  // Virtual Background & Real-time Background Removal State
  const [virtualBg, setVirtualBg] = useState<'none' | 'blur' | 'cyberpunk_tokyo' | 'futuristic_studio' | 'space_nebula' | 'minimal_office' | 'neon_sunset' | 'green_screen' | 'custom'>('none');
  const [bgBlurAmount, setBgBlurAmount] = useState<number>(12); // 0 to 25px
  const [chromaSensitivity, setChromaSensitivity] = useState<number>(45); // 10 to 100
  const [customBgUrl, setCustomBgUrl] = useState<string>('');
  const customBgInputRef = useRef<HTMLInputElement | null>(null);

  // Export Format & Auto-Download Trigger State
  const [exportFormat, setExportFormat] = useState<'webm' | 'mp4'>('mp4');
  const [autoDownloadOnFinish, setAutoDownloadOnFinish] = useState<boolean>(true);

  // Floating Quick Action Effects Toggles
  const [aiDenoiseEnabled, setAiDenoiseEnabled] = useState<boolean>(true);
  const [realtimeColorGrading, setRealtimeColorGrading] = useState<boolean>(true);
  const [upscale4kEnabled, setUpscale4kEnabled] = useState<boolean>(true);
  const [beautyFilterEnabled, setBeautyFilterEnabled] = useState<boolean>(false);
  const [isQuickActionMenuOpen, setIsQuickActionMenuOpen] = useState<boolean>(false);

  // Voice Commands Listener State
  const [isListeningVoice, setIsListeningVoice] = useState<boolean>(false);
  const [lastVoiceCommand, setLastVoiceCommand] = useState<string>('');
  const [voiceHelpModalOpen, setVoiceHelpModalOpen] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Load Vault Items on Mount
  useEffect(() => {
    setVaultItems(getVaultItems());
  }, []);

  // Web Speech API Voice Recognition Handler
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (isListeningVoice) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const last = event.results.length - 1;
          const text = event.results[last][0].transcript.trim().toLowerCase();
          setLastVoiceCommand(text);

          if (text.includes('photo') || text.includes('snap') || text.includes('cheese') || text.includes('capture') || text.includes('click') || text.includes('khicho')) {
            handleShutterClick();
            onNotify('Voice Command Recognized', `📸 Triggered Photo Capture ("${text}")`, 'success');
          } else if (text.includes('record') || text.includes('start video') || text.includes('video shuru')) {
            if (mode !== 'video') setMode('video');
            if (!isRecordingVideo) handleToggleVideoRecording();
            onNotify('Voice Command Recognized', `🎬 Started Video Recording ("${text}")`, 'success');
          } else if (text.includes('stop') || text.includes('roko')) {
            if (isRecordingVideo) handleToggleVideoRecording();
            if (isRecordingAudio) handleToggleAudioRecording();
            onNotify('Voice Command Recognized', `⏹️ Stopped Recording ("${text}")`, 'info');
          } else if (text.includes('denoise') || text.includes('noise')) {
            setAiDenoiseEnabled((prev) => !prev);
            onNotify('Voice Command Recognized', `⚡ Toggled AI Denoise ("${text}")`, 'info');
          } else if (text.includes('color') || text.includes('grading')) {
            setRealtimeColorGrading((prev) => !prev);
            onNotify('Voice Command Recognized', `🎨 Toggled Real-time Color Grading ("${text}")`, 'info');
          } else if (text.includes('4k') || text.includes('upscale')) {
            setUpscale4kEnabled((prev) => !prev);
            setVideoResolution((prev) => prev === '4k' ? '1080p' : '4k');
            onNotify('Voice Command Recognized', `💎 Toggled 4K Upscaling ("${text}")`, 'info');
          } else if (text.includes('flip') || text.includes('camera') || text.includes('switch')) {
            handleFlipCamera();
            onNotify('Voice Command Recognized', `🔄 Switched Camera ("${text}")`, 'info');
          } else if (text.includes('flash') || text.includes('torch') || text.includes('light')) {
            toggleTorch();
            onNotify('Voice Command Recognized', `💡 Toggled Torch ("${text}")`, 'info');
          }
        };

        recognition.onerror = (err: any) => {
          console.warn('Speech recognition error:', err);
        };

        recognition.onend = () => {
          if (isListeningVoice) {
            try { recognition.start(); } catch {}
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('Failed to start speech recognition', e);
      }
    } else {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, [isListeningVoice, mode, isRecordingVideo, isRecordingAudio]);

  // Initialize Camera Stream with Progressive Fallbacks
  const initStream = async (camId?: string, currentFacing: 'user' | 'environment' = facingMode) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      let stream: MediaStream | null = null;
      try {
        // Attempt 1: Full ideal resolution video stream
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: camId ? { exact: camId } : undefined,
            facingMode: camId ? undefined : currentFacing,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch (err1) {
        console.warn('Attempt 1 failed, trying basic video:', err1);
        // Attempt 2: Minimal basic video stream
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      if (stream) {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setHasPermission(true);
        setPermissionError('');

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = (videoTrack.getCapabilities ? videoTrack.getCapabilities() : {}) as {
            zoom?: { min: number; max: number };
            torch?: boolean;
          };
          if (capabilities.zoom) {
            setMaxZoomSupported(capabilities.zoom.max || 5.0);
          }
          if (capabilities.torch) {
            setTorchSupported(true);
          }
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setAvailableCameras(videoDevices);
        if (videoDevices.length > 0 && !selectedCameraId) {
          setSelectedCameraId(videoDevices[0].deviceId);
        }
      }
    } catch (err: unknown) {
      console.warn('Camera access error:', err);
      setHasPermission(false);
      const errMsg = err instanceof Error ? err.message : 'Camera permission restricted in iframe';
      setPermissionError(errMsg);
    }
  };

  useEffect(() => {
    initStream();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Update Zoom Hardware Track if supported
  const applyHardwareZoom = async (newZoom: number) => {
    setZoom(newZoom);
    try {
      const videoTrack = streamRef.current?.getVideoTracks()[0];
      if (videoTrack && videoTrack.applyConstraints) {
        await videoTrack.applyConstraints({
          advanced: [{ zoom: newZoom } as unknown as MediaTrackConstraintSet],
        });
      }
    } catch {
      // Zoom fallback handled in CSS / canvas transform
    }
  };

  // Toggle Torch Hardware Track
  const toggleTorch = async () => {
    const nextTorch = !torchOn;
    playCameraSound('torch');
    setTorchOn(nextTorch);
    try {
      const videoTrack = streamRef.current?.getVideoTracks()[0];
      if (videoTrack && videoTrack.applyConstraints) {
        await videoTrack.applyConstraints({
          advanced: [{ torch: nextTorch } as unknown as MediaTrackConstraintSet],
        });
      }
    } catch {
      // Ignore if torch unavailable
    }
  };

  // Flip Camera (Front / Back)
  const handleFlipCamera = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    initStream(undefined, nextFacing);
    playCameraSound('beep');
    onNotify('Camera Switched', `Active sensor switched to ${nextFacing === 'user' ? 'Front Selfie Lens' : 'Rear Environment Lens'}.`, 'info');
  };

  // Live Audio Waveform Visualizer
  const startAudioVisualizer = (audioStream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(audioStream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      source.connect(analyser);

      const canvas = audioCanvasRef.current;
      if (!canvas) return;
      const canvasCtx = canvas.getContext('2d');
      if (!canvasCtx) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animationFrameRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          const grad = canvasCtx.createLinearGradient(0, canvas.height, 0, 0);
          grad.addColorStop(0, '#06b6d4');
          grad.addColorStop(0.5, '#6366f1');
          grad.addColorStop(1, '#ec4899');

          canvasCtx.fillStyle = grad;
          canvasCtx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }
      };

      draw();
    } catch (e) {
      console.warn('Audio visualizer error:', e);
    }
  };

  // --- SMART CHROMA KEY & DYNAMIC WEBGL ENGINE FUNCTIONS ---

  // 1. Auto-Detect Background Key Color from Webcam Stream Corners
  const handleAutoDetectKeyColor = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      onNotify('Auto Detect', 'Camera feed initializing... Please try again in a moment.', 'warning');
      return;
    }
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 160;
    sampleCanvas.height = 90;
    const sCtx = sampleCanvas.getContext('2d');
    if (!sCtx) return;

    sCtx.drawImage(video, 0, 0, 160, 90);
    const imgData = sCtx.getImageData(0, 0, 160, 90);
    const data = imgData.data;

    let sumR = 0, sumG = 0, sumB = 0, count = 0;
    const cornerSize = 15;

    for (let y = 0; y < 90; y++) {
      for (let x = 0; x < 160; x++) {
        const isTopLeft = x < cornerSize && y < cornerSize;
        const isTopRight = x > 160 - cornerSize && y < cornerSize;
        const isBottomLeft = x < cornerSize && y > 90 - cornerSize;
        const isBottomRight = x > 160 - cornerSize && y > 90 - cornerSize;

        if (isTopLeft || isTopRight || isBottomLeft || isBottomRight) {
          const idx = (y * 160 + x) * 4;
          sumR += data[idx];
          sumG += data[idx + 1];
          sumB += data[idx + 2];
          count++;
        }
      }
    }

    if (count === 0) return;
    const avgR = Math.round(sumR / count);
    const avgG = Math.round(sumG / count);
    const avgB = Math.round(sumB / count);

    const hex = `#${((1 << 24) + (avgR << 16) + (avgG << 8) + avgB).toString(16).slice(1)}`;
    setKeyColorHex(hex);

    let colorName = `Custom (#${hex.toUpperCase()})`;
    if (avgG > avgR * 1.15 && avgG > avgB * 1.15) colorName = `Auto Green Screen (${hex})`;
    else if (avgB > avgR * 1.15 && avgB > avgG * 1.15) colorName = `Auto Blue Screen (${hex})`;
    else if (avgR > avgG * 1.15 && avgB > avgG * 1.15) colorName = `Auto Magenta Screen (${hex})`;
    else if (avgR > 200 && avgG > 200 && avgB > 200) colorName = `Auto Bright White (${hex})`;
    else if (avgR < 60 && avgG < 60 && avgB < 60) colorName = `Auto Dark Backdrop (${hex})`;

    setDetectedColorName(colorName);
    playCameraSound('beep');
    onNotify('Smart Key Color Sampled', `Detected solid background: ${colorName}`, 'success');
  };

  // 2. Dynamic WebGL Engine Procedural Texture Generator
  const drawWebGlEngineTexture = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    textureType: string,
    timeSec: number,
    speed: number,
    intensity: number
  ) => {
    const t = timeSec * speed;

    if (textureType === 'cyber_grid') {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#030712');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#3b0764');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const horizY = h * 0.52;
      const hGlow = ctx.createRadialGradient(w / 2, horizY, 10, w / 2, horizY, w * 0.6);
      hGlow.addColorStop(0, `rgba(6, 182, 212, ${0.85 * intensity})`);
      hGlow.addColorStop(0.5, `rgba(168, 85, 247, ${0.45 * intensity})`);
      hGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = hGlow;
      ctx.fillRect(0, horizY - 120, w, 240);

      ctx.strokeStyle = `rgba(6, 182, 212, ${0.65 * intensity})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      const numVLines = 24;
      for (let i = 0; i <= numVLines; i++) {
        const xTop = (w / numVLines) * i;
        const xBottom = w / 2 + (xTop - w / 2) * 3;
        ctx.moveTo(xTop, horizY);
        ctx.lineTo(xBottom, h);
      }

      const numHLines = 14;
      const offset = (t * 45) % 30;
      for (let i = 0; i < numHLines; i++) {
        const progress = (i * 25 + offset) / (numHLines * 25);
        const y = horizY + Math.pow(progress, 2.2) * (h - horizY);
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

    } else if (textureType === 'matrix_rain') {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, w, h);

      ctx.font = '14px monospace';
      const cols = 35;
      const colW = w / cols;
      const chars = '0123456789ABCDEFｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ';

      for (let c = 0; c < cols; c++) {
        const colX = c * colW;
        const seed = Math.sin(c * 99 + 1);
        const colSpeed = (seed * 0.5 + 1.2) * speed;
        const dropY = ((t * 120 * colSpeed + seed * 500) % (h + 300)) - 100;

        for (let i = 0; i < 15; i++) {
          const charY = dropY - i * 18;
          if (charY > 0 && charY < h) {
            const char = chars[Math.floor(Math.abs(Math.sin(c + i + t)) * chars.length)];
            const alpha = (1 - i / 15) * intensity;
            ctx.fillStyle = i === 0 ? '#ffffff' : `rgba(34, 197, 94, ${alpha})`;
            ctx.fillText(char, colX, charY);
          }
        }
      }

    } else if (textureType === 'starfield_tunnel') {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const numStars = 120;

      for (let i = 0; i < numStars; i++) {
        const angle = (i * 137.5 * Math.PI) / 180;
        const distSeed = ((i * 37 + t * 250) % 1000) / 1000;
        const dist = Math.pow(distSeed, 2.5) * (w * 0.7);

        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;
        const prevX = cx + Math.cos(angle) * (dist * 0.85);
        const prevY = cy + Math.sin(angle) * (dist * 0.85);

        const size = Math.max(1, distSeed * 4 * intensity);
        const alpha = Math.min(1, distSeed * 1.5) * intensity;

        ctx.strokeStyle = i % 2 === 0 ? `rgba(6, 182, 212, ${alpha})` : `rgba(236, 72, 153, ${alpha})`;
        ctx.lineWidth = size;
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

    } else if (textureType === 'plasma_energy') {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      const p1 = Math.sin(t * 0.8);
      const p2 = Math.cos(t * 1.1);
      grad.addColorStop(0, `rgb(${Math.floor(80 + p1 * 50)}, ${Math.floor(20 + p2 * 20)}, 120)`);
      grad.addColorStop(0.5, `rgb(10, ${Math.floor(100 + p2 * 60)}, ${Math.floor(180 + p1 * 50)})`);
      grad.addColorStop(1, `rgb(${Math.floor(180 + p2 * 50)}, 20, ${Math.floor(80 + p1 * 40)})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      for (let r = 1; r <= 3; r++) {
        const rx = w / 2 + Math.sin(t * r * 0.5) * (w * 0.2);
        const ry = h / 2 + Math.cos(t * r * 0.6) * (h * 0.2);
        const rad = (w * 0.25) * (1 + Math.sin(t + r) * 0.2);
        const rGrad = ctx.createRadialGradient(rx, ry, 5, rx, ry, rad);
        rGrad.addColorStop(0, `rgba(255, 255, 255, ${0.4 * intensity})`);
        rGrad.addColorStop(0.5, `rgba(6, 182, 212, ${0.25 * intensity})`);
        rGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rGrad;
        ctx.fillRect(0, 0, w, h);
      }

    } else if (textureType === 'synthwave_sun') {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#1e1b4b');
      bgGrad.addColorStop(0.4, '#831843');
      bgGrad.addColorStop(0.6, '#be123c');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      const sunX = w / 2;
      const sunY = h * 0.45;
      const sunR = Math.min(w, h) * 0.22;
      const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
      sunGrad.addColorStop(0, '#fde047');
      sunGrad.addColorStop(0.5, '#f97316');
      sunGrad.addColorStop(1, '#ec4899');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e1b4b';
      for (let s = 1; s <= 6; s++) {
        const stripeY = sunY + (s * (sunR / 7));
        const stripeH = s * 1.8;
        ctx.fillRect(sunX - sunR, stripeY, sunR * 2, stripeH);
      }

      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const horizY = h * 0.6;
      for (let i = -10; i <= 20; i++) {
        const xTop = (w / 10) * i;
        const xBottom = w / 2 + (xTop - w / 2) * 2.8;
        ctx.moveTo(xTop, horizY);
        ctx.lineTo(xBottom, h);
      }
      const offset = (t * 30) % 20;
      for (let i = 0; i < 10; i++) {
        const y = horizY + Math.pow((i * 20 + offset) / 200, 2) * (h - horizY);
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

    } else if (textureType === 'aurora_borealis') {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, w, h);

      for (let wave = 0; wave < 3; wave++) {
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 20) {
          const y = h * 0.3 + Math.sin(x * 0.008 + t * (1 + wave * 0.3) + wave) * 80 + Math.cos(x * 0.004 - t) * 40;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();

        const aGrad = ctx.createLinearGradient(0, h * 0.2, 0, h);
        if (wave === 0) {
          aGrad.addColorStop(0, `rgba(34, 197, 94, ${0.45 * intensity})`);
          aGrad.addColorStop(0.5, `rgba(6, 182, 212, ${0.2 * intensity})`);
        } else if (wave === 1) {
          aGrad.addColorStop(0, `rgba(168, 85, 247, ${0.4 * intensity})`);
          aGrad.addColorStop(0.5, `rgba(236, 72, 153, ${0.2 * intensity})`);
        } else {
          aGrad.addColorStop(0, `rgba(56, 189, 248, ${0.35 * intensity})`);
          aGrad.addColorStop(0.5, `rgba(34, 197, 94, ${0.15 * intensity})`);
        }
        aGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = aGrad;
        ctx.fill();
      }

    } else if (textureType === 'lava_vortex') {
      const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.7);
      grad.addColorStop(0, '#f97316');
      grad.addColorStop(0.4, '#dc2626');
      grad.addColorStop(0.8, '#7f1d1d');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const numEmbers = 40;
      for (let i = 0; i < numEmbers; i++) {
        const ex = (w / 2) + Math.cos(i + t * 2) * (w * 0.35) * Math.sin(i);
        const ey = (h / 2) + Math.sin(i + t * 1.5) * (h * 0.35) * Math.cos(i);
        const er = (i % 4) + 1.5;
        ctx.fillStyle = `rgba(253, 224, 71, ${0.8 * intensity})`;
        ctx.beginPath();
        ctx.arc(ex, ey, er, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // 3. Real-Time Chroma Key Shader Processing Engine
  const applyChromaKeyFrame = (
    videoCtx: CanvasRenderingContext2D,
    targetCtx: CanvasRenderingContext2D,
    w: number,
    h: number,
    keyHex: string,
    tolerance: number,
    smoothness: number,
    spill: number
  ) => {
    const keyR = parseInt(keyHex.slice(1, 3), 16) || 0;
    const keyG = parseInt(keyHex.slice(3, 5), 16) || 255;
    const keyB = parseInt(keyHex.slice(5, 7), 16) || 0;

    const frameData = videoCtx.getImageData(0, 0, w, h);
    const data = frameData.data;
    const len = data.length;

    const tolSq = (tolerance * 2.2) ** 2;
    const smoothSq = ((tolerance + smoothness) * 2.2) ** 2;

    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const dr = r - keyR;
      const dg = g - keyG;
      const db = b - keyB;
      const distSq = dr * dr + dg * dg + db * db;

      if (distSq < tolSq) {
        data[i + 3] = 0;
      } else if (distSq < smoothSq) {
        const alphaNorm = (Math.sqrt(distSq) - tolerance * 2.2) / (smoothness * 2.2 || 1);
        data[i + 3] = Math.min(255, Math.max(0, Math.floor(alphaNorm * 255)));

        if (spill > 0 && keyG > keyR && keyG > keyB) {
          const maxRB = Math.max(r, b);
          if (g > maxRB) {
            data[i + 1] = Math.floor(g * (1 - spill / 100) + maxRB * (spill / 100));
          }
        }
      } else if (spill > 0 && keyG > keyR && keyG > keyB) {
        const maxRB = Math.max(r, b);
        if (g > maxRB) {
          const factor = (spill / 100) * 0.5;
          data[i + 1] = Math.floor(g * (1 - factor) + maxRB * factor);
        }
      }
    }

    targetCtx.putImageData(frameData, 0, 0);
  };

  // --- VIRTUAL 3-POINT STUDIO LIGHTING ENGINE ---
  const applyLightingPreset = (
    p: 'studio_portrait' | 'cyber_neon' | 'dramatic_noir' | 'golden_sunset' | 'cool_broadcaster'
  ) => {
    setLightingPreset(p);
    if (p === 'studio_portrait') {
      setKeyIntensity(80); setKeyColor('#FFF4EA'); setKeyPosX(25); setKeyPosY(25); setKeyRadius(65);
      setFillIntensity(45); setFillColor('#E0F2FE'); setFillPosX(75); setFillPosY(45); setFillRadius(75);
      setRimIntensity(55); setRimColor('#FDE047'); setRimPosX(50); setRimPosY(10); setRimRadius(45);
      setLightingBlendMode('soft-light');
    } else if (p === 'cyber_neon') {
      setKeyIntensity(90); setKeyColor('#EC4899'); setKeyPosX(20); setKeyPosY(30); setKeyRadius(60);
      setFillIntensity(65); setFillColor('#06B6D4'); setFillPosX(80); setFillPosY(50); setFillRadius(70);
      setRimIntensity(85); setRimColor('#A855F7'); setRimPosX(50); setRimPosY(5); setRimRadius(50);
      setLightingBlendMode('overlay');
    } else if (p === 'dramatic_noir') {
      setKeyIntensity(95); setKeyColor('#FFFFFF'); setKeyPosX(15); setKeyPosY(20); setKeyRadius(50);
      setFillIntensity(15); setFillColor('#334155'); setFillPosX(85); setFillPosY(60); setFillRadius(80);
      setRimIntensity(80); setRimColor('#F8FAFC'); setRimPosX(50); setRimPosY(10); setRimRadius(35);
      setLightingBlendMode('hard-light');
    } else if (p === 'golden_sunset') {
      setKeyIntensity(85); setKeyColor('#F97316'); setKeyPosX(30); setKeyPosY(30); setKeyRadius(70);
      setFillIntensity(40); setFillColor('#8B5CF6'); setFillPosX(70); setFillPosY(50); setFillRadius(75);
      setRimIntensity(75); setRimColor('#FDE047'); setRimPosX(50); setRimPosY(10); setRimRadius(45);
      setLightingBlendMode('soft-light');
    } else if (p === 'cool_broadcaster') {
      setKeyIntensity(75); setKeyColor('#FFFFFF'); setKeyPosX(30); setKeyPosY(20); setKeyRadius(60);
      setFillIntensity(50); setFillColor('#38BDF8'); setFillPosX(70); setFillPosY(40); setFillRadius(70);
      setRimIntensity(45); setRimColor('#E0F2FE'); setRimPosX(50); setRimPosY(15); setRimRadius(40);
      setLightingBlendMode('soft-light');
    }
  };

  const drawVirtualStudioLighting = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    if (!virtualLightingEnabled) return;

    ctx.save();

    // 1. Key Light (Primary Main Light)
    if (keyIntensity > 0) {
      const kx = (keyPosX / 100) * w;
      const ky = (keyPosY / 100) * h;
      const kr = (keyRadius / 100) * Math.max(w, h);
      const kGrad = ctx.createRadialGradient(kx, ky, 5, kx, ky, kr);

      const kR = parseInt(keyColor.slice(1, 3), 16) || 255;
      const kG = parseInt(keyColor.slice(3, 5), 16) || 255;
      const kB = parseInt(keyColor.slice(5, 7), 16) || 255;
      const kAlpha = (keyIntensity / 100) * 0.75;

      kGrad.addColorStop(0, `rgba(${kR}, ${kG}, ${kB}, ${kAlpha})`);
      kGrad.addColorStop(0.5, `rgba(${kR}, ${kG}, ${kB}, ${kAlpha * 0.35})`);
      kGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.globalCompositeOperation = lightingBlendMode as GlobalCompositeOperation;
      ctx.fillStyle = kGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Fill Light (Soft Shadow Diffuser)
    if (fillIntensity > 0) {
      const fx = (fillPosX / 100) * w;
      const fy = (fillPosY / 100) * h;
      const fr = (fillRadius / 100) * Math.max(w, h);
      const fGrad = ctx.createRadialGradient(fx, fy, 10, fx, fy, fr);

      const fR = parseInt(fillColor.slice(1, 3), 16) || 200;
      const fG = parseInt(fillColor.slice(3, 5), 16) || 220;
      const fB = parseInt(fillColor.slice(5, 7), 16) || 255;
      const fAlpha = (fillIntensity / 100) * 0.5;

      fGrad.addColorStop(0, `rgba(${fR}, ${fG}, ${fB}, ${fAlpha})`);
      fGrad.addColorStop(0.6, `rgba(${fR}, ${fG}, ${fB}, ${fAlpha * 0.2})`);
      fGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = fGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // 3. Rim Light (Backlight Edge Highlight)
    if (rimIntensity > 0) {
      const rx = (rimPosX / 100) * w;
      const ry = (rimPosY / 100) * h;
      const rr = (rimRadius / 100) * Math.max(w, h);
      const rGrad = ctx.createRadialGradient(rx, ry, 2, rx, ry, rr);

      const rR = parseInt(rimColor.slice(1, 3), 16) || 56;
      const rG = parseInt(rimColor.slice(3, 5), 16) || 189;
      const rB = parseInt(rimColor.slice(5, 7), 16) || 248;
      const rAlpha = (rimIntensity / 100) * 0.85;

      rGrad.addColorStop(0, `rgba(${rR}, ${rG}, ${rB}, ${rAlpha})`);
      rGrad.addColorStop(0.4, `rgba(${rR}, ${rG}, ${rB}, ${rAlpha * 0.45})`);
      rGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = rGrad;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();
  };

  // --- REAL-TIME AI AUTO-CORRECTION LAYER FUNCTIONS ---

  const runAiAutoTuneSceneAnalysis = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      onNotify('AI Auto-Tune', 'Camera feed initializing... Please try again in a moment.', 'warning');
      return;
    }

    setAiAutoTuneActive(true);
    playCameraSound('beep');

    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 160;
    sampleCanvas.height = 90;
    const sCtx = sampleCanvas.getContext('2d');
    if (!sCtx) return;

    sCtx.drawImage(video, 0, 0, 160, 90);
    const imgData = sCtx.getImageData(0, 0, 160, 90);
    const data = imgData.data;
    const len = data.length;

    let totalR = 0, totalG = 0, totalB = 0, totalLuma = 0;
    const pixels = len / 4;
    const bins = new Array(16).fill(0);

    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;

      totalR += r;
      totalG += g;
      totalB += b;
      totalLuma += luma;

      const binIdx = Math.min(15, Math.floor(luma / 16));
      bins[binIdx]++;
    }

    const avgR = totalR / pixels;
    const avgG = totalG / pixels;
    const avgB = totalB / pixels;
    const meanLuma = totalLuma / pixels;

    setMeasuredLuma(Math.round(meanLuma));
    setHistogramData(bins);

    // Auto-Exposure Gain Target = 128 (Neutral Midtone)
    const targetLuma = 128;
    let gain = targetLuma / (meanLuma || 1);
    gain = Math.max(0.6, Math.min(2.2, gain));
    setAutoExposureGain(parseFloat(gain.toFixed(2)));

    // Gray World Auto-White Balance Gains
    const avgAvg = (avgR + avgG + avgB) / 3;
    const gainR = Math.max(0.7, Math.min(1.4, avgAvg / (avgR || 1)));
    const gainG = Math.max(0.7, Math.min(1.4, avgAvg / (avgG || 1)));
    const gainB = Math.max(0.7, Math.min(1.4, avgAvg / (avgB || 1)));

    setAutoWbGainR(parseFloat(gainR.toFixed(2)));
    setAutoWbGainG(parseFloat(gainG.toFixed(2)));
    setAutoWbGainB(parseFloat(gainB.toFixed(2)));

    // Estimate Kelvin Temperature
    const rbRatio = avgR / (avgB || 1);
    const estKelvin = Math.round(5500 / (rbRatio * 0.9));
    setMeasuredColorTemp(Math.max(2800, Math.min(8500, estKelvin)));

    // Estimate Spatial Noise Reduction Level
    const noiseLevel = meanLuma < 70 ? 28 : meanLuma < 100 ? 18 : 10;
    setAiDenoiseThreshold(noiseLevel);

    setAiAutoCorrectionEnabled(true);
    setAiAutoTuneActive(false);

    onNotify(
      'AI Scene Auto-Corrected ⚡',
      `Exposure: ${gain.toFixed(2)}x, White Balance: ${estKelvin}K, Noise Reduction: ${noiseLevel}px.`,
      'success'
    );
  };

  const applyAiAutoCorrectionFrame = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number
  ) => {
    if (!aiAutoCorrectionEnabled) return;

    try {
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      const len = data.length;

      const exp = autoExposureGain;
      const wr = autoWbGainR;
      const wg = autoWbGainG;
      const wb = autoWbGainB;
      const denoise = aiDenoiseThreshold;

      for (let i = 0; i < len; i += 4) {
        let r = data[i] * exp * wr;
        let g = data[i + 1] * exp * wg;
        let b = data[i + 2] * exp * wb;

        // Highlight Compression
        if (r > 230) r = 230 + (r - 230) * 0.5;
        if (g > 230) g = 230 + (g - 230) * 0.5;
        if (b > 230) b = 230 + (b - 230) * 0.5;

        // Dark Shadow Denoising
        if (denoise > 0) {
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;
          if (luma < 65) {
            const avg = (r + g + b) / 3;
            r = r * 0.75 + avg * 0.3;
            g = g * 0.75 + avg * 0.3;
            b = b * 0.75 + avg * 0.3;
          }
        }

        data[i] = Math.min(255, Math.max(0, Math.floor(r)));
        data[i + 1] = Math.min(255, Math.max(0, Math.floor(g)));
        data[i + 2] = Math.min(255, Math.max(0, Math.floor(b)));
      }

      ctx.putImageData(imgData, 0, 0);
    } catch (e) {
      console.warn('AI Auto-Correction error:', e);
    }
  };

  // 4. Continuous Animation Frame Loop for Live Smart Chroma Keying, AI Auto-Correction & Virtual Studio Lighting
  useEffect(() => {
    let animId: number;
    const startTime = Date.now();

    const processFrame = () => {
      const video = videoRef.current;
      const liveCanvas = liveCanvasRef.current;
      const hiddenCanvas = canvasRef.current;

      if ((smartChromaEnabled || virtualLightingEnabled || aiAutoCorrectionEnabled) && video && video.readyState >= 2 && liveCanvas) {
        const w = video.videoWidth || 1280;
        const h = video.videoHeight || 720;

        if (liveCanvas.width !== w || liveCanvas.height !== h) {
          liveCanvas.width = w;
          liveCanvas.height = h;
        }

        const lCtx = liveCanvas.getContext('2d');
        if (lCtx) {
          const timeSec = (Date.now() - startTime) / 1000;

          if (smartChromaEnabled) {
            // Render WebGL Texture Background
            drawWebGlEngineTexture(lCtx, w, h, webglTexture, timeSec, webglAnimSpeed, webglIntensity);

            if (hiddenCanvas) {
              if (hiddenCanvas.width !== w || hiddenCanvas.height !== h) {
                hiddenCanvas.width = w;
                hiddenCanvas.height = h;
              }
              const hCtx = hiddenCanvas.getContext('2d');
              if (hCtx) {
                hCtx.save();
                if (isMirrored || facingMode === 'user') {
                  hCtx.translate(w, 0);
                  hCtx.scale(-1, 1);
                }
                hCtx.drawImage(video, 0, 0, w, h);
                hCtx.restore();

                // Apply Smart Chroma Key and composite subject over WebGL background
                applyChromaKeyFrame(hCtx, lCtx, w, h, keyColorHex, keyTolerance, keySmoothness, spillSuppression);
              }
            }
          } else {
            // Draw Video Feed directly to live canvas
            lCtx.save();
            if (isMirrored || facingMode === 'user') {
              lCtx.translate(w, 0);
              lCtx.scale(-1, 1);
            }
            lCtx.drawImage(video, 0, 0, w, h);
            lCtx.restore();
          }

          // Apply AI Auto-Correction Layer (Exposure, White Balance & Denoise)
          if (aiAutoCorrectionEnabled) {
            applyAiAutoCorrectionFrame(lCtx, w, h);
          }

          // Apply Virtual 3-Point Studio Lighting
          if (virtualLightingEnabled) {
            drawVirtualStudioLighting(lCtx, w, h);
          }
        }
      }

      animId = requestAnimationFrame(processFrame);
    };

    if (smartChromaEnabled || virtualLightingEnabled || aiAutoCorrectionEnabled) {
      animId = requestAnimationFrame(processFrame);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [
    smartChromaEnabled,
    virtualLightingEnabled,
    aiAutoCorrectionEnabled,
    webglTexture,
    webglAnimSpeed,
    webglIntensity,
    keyColorHex,
    keyTolerance,
    keySmoothness,
    spillSuppression,
    autoExposureGain,
    autoWbGainR,
    autoWbGainG,
    autoWbGainB,
    aiDenoiseThreshold,
    keyIntensity,
    keyColor,
    keyPosX,
    keyPosY,
    keyRadius,
    fillIntensity,
    fillColor,
    fillPosX,
    fillPosY,
    fillRadius,
    rimIntensity,
    rimColor,
    rimPosX,
    rimPosY,
    rimRadius,
    lightingBlendMode,
    isMirrored,
    facingMode,
  ]);

  // Click & Capture Still Photo with HDR, Shutter SFX & Watermark
  const capturePhoto = (isBurst = false) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Trigger visual screen flash
    setScreenFlash(true);
    setTimeout(() => setScreenFlash(false), 120);

    // Play Shutter audio
    playCameraSound(isBurst ? 'burst' : 'shutter');

    // Canvas sizing based on Aspect Ratio
    let targetWidth = video.videoWidth || 1920;
    let targetHeight = video.videoHeight || 1080;

    if (aspectRatio === '1:1') {
      const minDim = Math.min(targetWidth, targetHeight);
      targetWidth = minDim;
      targetHeight = minDim;
    } else if (aspectRatio === '9:16') {
      targetWidth = Math.floor((targetHeight * 9) / 16);
    } else if (aspectRatio === '4:3') {
      targetWidth = Math.floor((targetHeight * 4) / 3);
    } else if (aspectRatio === '21:9') {
      targetHeight = Math.floor((targetWidth * 9) / 21);
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();

    // 1. Transformations (Rotation & Mirror)
    if (rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    if (isMirrored || facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    // 2. Zoom transformation fallback
    if (zoom > 1.0) {
      const zoomFactor = zoom;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(zoomFactor, zoomFactor);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    // 3. Apply CSS Filter for LUTs and HDR
    const cssFilter = getLutFilterCss(filter, exposureEv, hdrEnabled);
    if (cssFilter && cssFilter !== 'none') {
      ctx.filter = cssFilter;
    }

    // 4. Draw Virtual Background, Smart Chroma Key or Video Frame
    if (smartChromaEnabled && liveCanvasRef.current) {
      ctx.drawImage(liveCanvasRef.current, 0, 0, canvas.width, canvas.height);
    } else {
      if (virtualBg !== 'none') {
        // Draw Virtual Background Scene first
        if (virtualBg === 'green_screen') {
          ctx.fillStyle = '#00ff00';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (virtualBg === 'blur') {
          ctx.filter = `blur(${bgBlurAmount}px)`;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          ctx.filter = 'none';
        } else if (virtualBg === 'custom' && customBgUrl) {
          const bgImg = new window.Image();
          bgImg.src = customBgUrl;
          if (bgImg.complete) {
            ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
          } else {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        } else if (virtualBg === 'cyberpunk_tokyo') {
          const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          grad.addColorStop(0, '#0f172a');
          grad.addColorStop(0.5, '#1e1b4b');
          grad.addColorStop(1, '#581c87');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (virtualBg === 'space_nebula') {
          const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 50, canvas.width / 2, canvas.height / 2, canvas.width);
          grad.addColorStop(0, '#2e1065');
          grad.addColorStop(0.6, '#090514');
          grad.addColorStop(1, '#020617');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (virtualBg === 'neon_sunset') {
          const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
          grad.addColorStop(0, '#831843');
          grad.addColorStop(0.5, '#be123c');
          grad.addColorStop(1, '#fb923c');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          grad.addColorStop(0, '#020617');
          grad.addColorStop(1, '#1e293b');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }

      // Draw Subject Video
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    ctx.restore();

    // 4a. Apply AI Auto-Correction Layer
    if (aiAutoCorrectionEnabled) {
      applyAiAutoCorrectionFrame(ctx, canvas.width, canvas.height);
    }

    // 4b. Apply Virtual 3-Point Studio Lighting
    if (virtualLightingEnabled) {
      drawVirtualStudioLighting(ctx, canvas.width, canvas.height);
    }

    // 5. Watermark & Date/Time Overlay
    if (watermarkEnabled || showTimestamp) {
      ctx.save();
      ctx.font = 'bold 20px Syne, Inter, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      const dateStr = new Date().toLocaleString();
      if (watermarkEnabled && showTimestamp) {
        ctx.fillText(`${watermarkText} • ${dateStr}`, 24, canvas.height - 24);
      } else if (watermarkEnabled) {
        ctx.fillText(watermarkText, 24, canvas.height - 24);
      } else if (showTimestamp) {
        ctx.fillText(dateStr, 24, canvas.height - 24);
      }
      ctx.restore();
    }

    // 6. Export Image Data & Save to Vault
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const newItem: CameraMediaItem = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: 'image',
      url: dataUrl,
      thumbnailUrl: dataUrl,
      title: `HDR_Photo_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '_')}.jpg`,
      timestamp: new Date().toLocaleTimeString(),
      resolution: `${canvas.width}x${canvas.height}`,
      filterUsed: filter,
      zoomLevel: zoom,
      rotation,
      mirrored: isMirrored,
      fileSizeBytes: Math.round((dataUrl.length * 3) / 4),
    };

    const updated = saveVaultItem(newItem);
    setVaultItems(updated);
    setSelectedVaultItem(newItem);

    if (onMediaCaptured) {
      onMediaCaptured(newItem);
    }

    onNotify('Image Captured', `Stored high-res ${canvas.width}x${canvas.height} photo in Camera Vault.`, 'success');
  };

  // Handle native camera capture or gallery file upload
  const handleNativeCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const newItem: CameraMediaItem = {
        id: `native_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type: isVideo ? 'video' : 'image',
        url: dataUrl,
        thumbnailUrl: dataUrl,
        title: file.name || (isVideo ? 'Device_Camera_Video.mp4' : 'Device_Camera_Photo.jpg'),
        timestamp: new Date().toLocaleTimeString(),
        resolution: isVideo ? '1080p HD' : '8K HDR',
        filterUsed: filter,
        zoomLevel: zoom,
        rotation,
        mirrored: isMirrored,
        fileSizeBytes: file.size,
      };

      const updated = saveVaultItem(newItem);
      setVaultItems(updated);
      setSelectedVaultItem(newItem);

      if (onMediaCaptured) {
        onMediaCaptured(newItem);
      }

      onNotify(
        isVideo ? 'Video Captured' : 'Photo Captured',
        `Successfully captured and stored ${file.name || 'media'} in Camera Vault!`,
        'success'
      );
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle Custom Virtual Background Image Upload
  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const url = evt.target?.result as string;
      if (url) {
        setCustomBgUrl(url);
        setVirtualBg('custom');
        onNotify('Virtual Background Active', 'Loaded custom image for real-time background compositing!', 'success');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Timer Countdown Controller
  const handleShutterClick = () => {
    if (mode === 'burst') {
      handleBurstCapture();
      return;
    }
    if (mode === 'video') {
      handleToggleVideoRecording();
      return;
    }
    if (mode === 'audio') {
      handleToggleAudioRecording();
      return;
    }

    if (timerSeconds > 0) {
      setCountdownRemaining(timerSeconds);
      playCameraSound('beep');
      const interval = setInterval(() => {
        setCountdownRemaining((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            setCountdownRemaining(null);
            capturePhoto();
            return null;
          }
          playCameraSound('beep');
          return prev - 1;
        });
      }, 1000);
    } else {
      capturePhoto();
    }
  };

  // 5x Burst Capture Mode
  const handleBurstCapture = () => {
    setIsCapturingBurst(true);
    let count = 0;
    const burstInterval = setInterval(() => {
      capturePhoto(true);
      count++;
      if (count >= 5) {
        clearInterval(burstInterval);
        setIsCapturingBurst(false);
        onNotify('Burst Complete', '5 rapid burst shots captured and saved to Camera Vault.', 'success');
      }
    }, 250);
  };

  // Start / Stop Video Recording with MediaRecorder API & Canvas Stream Fallback
  const handleToggleVideoRecording = () => {
    if (isRecordingVideo) {
      // STOP Recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecordingVideo(false);
      if (videoTimerRef.current) {
        clearInterval(videoTimerRef.current);
        videoTimerRef.current = null;
      }
      playCameraSound('record_stop');
      onNotify('Video Recorded', `Saved video clip (${videoRecordingTime}s) to Camera Vault via MediaRecorder API.`, 'success');
    } else {
      // START Recording using MediaRecorder API
      let activeStream: MediaStream | null = null;

      if ((smartChromaEnabled || virtualLightingEnabled || aiAutoCorrectionEnabled) && liveCanvasRef.current) {
        try {
          activeStream = liveCanvasRef.current.captureStream(30);
        } catch (e) {
          console.warn('Live canvas captureStream error:', e);
        }
      }

      if (!activeStream) {
        activeStream = streamRef.current;
      }

      // Fallback: If streamRef is not active, capture stream from canvas element
      if (!activeStream || activeStream.getVideoTracks().length === 0 || !activeStream.active) {
        if (canvasRef.current) {
          try {
            activeStream = canvasRef.current.captureStream(30);
          } catch (e) {
            console.warn('Canvas captureStream error:', e);
          }
        }
      }

      if (!activeStream) {
        onNotify('MediaRecorder Info', 'Webcam stream restricted in preview iframe. Opening Device Camera for video recording...', 'info');
        if (nativeCameraInputRef.current) {
          nativeCameraInputRef.current.setAttribute('accept', 'video/*');
          nativeCameraInputRef.current.click();
        }
        return;
      }

      playCameraSound('record_start');
      videoChunksRef.current = [];
      setVideoRecordingTime(0);

      try {
        const supportedTypes = [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm',
          'video/mp4',
        ];
        let mimeType = '';
        for (const type of supportedTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            mimeType = type;
            break;
          }
        }

        const recorder = new MediaRecorder(activeStream, {
          mimeType: mimeType || undefined,
          videoBitsPerSecond: videoResolution === '4k' ? 12000000 : 5000000,
        });

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            videoChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(videoChunksRef.current, { type: mimeType || 'video/webm' });
          const videoUrl = URL.createObjectURL(blob);
          const ext = exportFormat === 'mp4' ? 'mp4' : 'webm';
          const filename = `Pro_Camera_Clip_${Date.now()}.${ext}`;

          const newItem: CameraMediaItem = {
            id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            type: 'video',
            url: videoUrl,
            blob,
            title: filename,
            timestamp: new Date().toLocaleTimeString(),
            durationSec: videoRecordingTime,
            resolution: videoResolution === '4k' ? '3840x2160 (4K)' : '1920x1080 (FHD)',
            fileSizeBytes: blob.size,
          };

          const updated = saveVaultItem(newItem);
          setVaultItems(updated);
          setSelectedVaultItem(newItem);
          if (onMediaCaptured) onMediaCaptured(newItem);

          // Trigger Auto-Download upon recording completion
          if (autoDownloadOnFinish && blob) {
            safeDownloadMedia(blob, filename, { type: 'video', onNotify });
          }
        };

        recorder.start(1000);
        mediaRecorderRef.current = recorder;
        setIsRecordingVideo(true);

        videoTimerRef.current = window.setInterval(() => {
          setVideoRecordingTime((t) => t + 1);
        }, 1000);
      } catch (err) {
        console.error('Video recording failed:', err);
        onNotify('Recording Error', 'Failed to start MediaRecorder on this device/browser.', 'error');
      }
    }
  };

  // Start / Stop High-Fidelity Audio / Mic Recording
  const handleToggleAudioRecording = async () => {
    if (isRecordingAudio) {
      // STOP Audio
      if (audioRecorderRef.current && audioRecorderRef.current.state !== 'inactive') {
        audioRecorderRef.current.stop();
      }
      setIsRecordingAudio(false);
      if (audioTimerRef.current) {
        clearInterval(audioTimerRef.current);
        audioTimerRef.current = null;
      }
      playCameraSound('record_stop');
      onNotify('Audio Recorded', `Saved audio recording (${audioRecordingTime}s) to Camera Vault.`, 'success');
    } else {
      // START Audio
      playCameraSound('record_start');
      audioChunksRef.current = [];
      setAudioRecordingTime(0);

      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        startAudioVisualizer(audioStream);

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/webm';

        const recorder = new MediaRecorder(audioStream, { mimeType });

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          const audioUrl = URL.createObjectURL(blob);

          const newItem: CameraMediaItem = {
            id: `audio_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            type: 'audio',
            url: audioUrl,
            blob,
            title: `Pro_Vocal_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '_')}.wav`,
            timestamp: new Date().toLocaleTimeString(),
            durationSec: audioRecordingTime,
            fileSizeBytes: blob.size,
          };

          const updated = saveVaultItem(newItem);
          setVaultItems(updated);
          setSelectedVaultItem(newItem);
          if (onMediaCaptured) onMediaCaptured(newItem);
        };

        recorder.start(500);
        audioRecorderRef.current = recorder;
        setIsRecordingAudio(true);

        audioTimerRef.current = window.setInterval(() => {
          setAudioRecordingTime((t) => t + 1);
        }, 1000);
      } catch (err) {
        console.error('Audio recording failed:', err);
        onNotify('Mic Error', 'Failed to access microphone for recording.', 'error');
      }
    }
  };

  // Helper to Send Media to other Studios
  const handleSendToStudio = (item: CameraMediaItem, targetTab: ActiveTab, subTab?: string) => {
    if (setActiveTab) {
      setActiveTab(targetTab);
    }
    if (onCloseModal) {
      onCloseModal();
    }
    onNotify(
      'Media Sent',
      `Transferred ${item.title} to ${targetTab.replace('_', ' ').toUpperCase()} Studio workspace.`,
      'success'
    );
  };

  // Helper to Set as Profile Avatar
  const handleSetAsAvatar = (item: CameraMediaItem) => {
    if (onUpdateUser && user) {
      onUpdateUser({
        ...user,
        avatarUrl: item.url,
      });
      onNotify('Avatar Updated', 'Captured photo set as your account profile avatar.', 'success');
    }
  };

  // Download Media Helper
  const handleDownload = (item: CameraMediaItem) => {
    const a = document.createElement('a');
    a.href = item.url;
    a.download = item.title;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onNotify('Downloading', `Started download for ${item.title}`, 'info');
  };

  // Format Duration string
  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative ${isModal ? 'fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4 overflow-y-auto' : 'space-y-4'}`}>
      <div className={`w-full ${isModal ? 'max-w-6xl max-h-[95vh] bg-[#070b14] border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden' : 'space-y-4'}`}>
        
        {/* TOP HUD BAR */}
        <div className="p-3.5 sm:p-4 bg-slate-950/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-cyan-500/30">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold font-['Syne'] text-white text-sm tracking-wide">
                  PRO CAMERA & RECORDING STUDIO
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  8K HDR • WebGL Lens
                </span>
                {torchSupported && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Flash LED
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Optical Zoom, Dynamic HDR, Cinema LUTs, Video Recording, Sound Mic Analyzer & Vault Storage.
              </p>
            </div>
          </div>

          {/* Mode Selector Buttons & Direct Studio Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {setActiveTab && (
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-2xl p-1">
                <button
                  type="button"
                  onClick={() => { if (onCloseModal) onCloseModal(); setActiveTab('image_studio'); }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold transition-colors"
                  title="Image Suite"
                >
                  🎨 Image
                </button>
                <button
                  type="button"
                  onClick={() => { if (onCloseModal) onCloseModal(); setActiveTab('video_audio'); }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-bold transition-colors"
                  title="Video Suite"
                >
                  🎬 Video
                </button>
                <button
                  type="button"
                  onClick={() => { if (onCloseModal) onCloseModal(); setActiveTab('3d_engine'); }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-bold transition-colors"
                  title="3D Model"
                >
                  🧊 3D
                </button>
                <button
                  type="button"
                  onClick={() => { if (onCloseModal) onCloseModal(); setActiveTab('office_suite'); }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold transition-colors"
                  title="Document Scan"
                >
                  📄 Doc
                </button>
              </div>
            )}
            <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => {
                setMode('photo');
                playCameraSound('beep');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                mode === 'photo'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Photo</span>
            </button>

            <button
              onClick={() => {
                setMode('burst');
                playCameraSound('beep');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                mode === 'burst'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>5x Burst</span>
            </button>

            <button
              onClick={() => {
                setMode('video');
                playCameraSound('beep');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                mode === 'video'
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video</span>
            </button>

            <button
              onClick={() => {
                setMode('audio');
                playCameraSound('beep');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                mode === 'audio'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Sound Mic</span>
            </button>
          </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsVaultGalleryOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 font-bold flex items-center gap-1.5 shadow-sm"
              title="Open Media Vault & Gallery"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Vault ({vaultItems.length})</span>
            </button>

            {isModal && onCloseModal && (
              <button
                onClick={onCloseModal}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
                title="Close Camera Studio"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* MAIN VIEWPORT / VIEWFINDER */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-3 sm:p-4 flex-1">
          
          {/* LEFT 3 COLS: CAMERA VIEWFINDER & LIVE HUD */}
          <div className="lg:col-span-3 flex flex-col items-center justify-center">
            <div
              className={`relative w-full rounded-3xl overflow-hidden bg-black border border-slate-800 shadow-2xl flex items-center justify-center ${
                aspectRatio === '1:1'
                  ? 'aspect-square max-w-lg'
                  : aspectRatio === '9:16'
                  ? 'aspect-[9/16] max-w-sm'
                  : aspectRatio === '4:3'
                  ? 'aspect-[4/3] max-w-2xl'
                  : aspectRatio === '21:9'
                  ? 'aspect-[21/9] max-w-4xl'
                  : 'aspect-video max-w-4xl'
              }`}
            >
              {/* Screen Flash Feedback Overlay */}
              {screenFlash && (
                <div className="absolute inset-0 z-40 bg-white pointer-events-none animate-ping" />
              )}

              {/* Countdown Timer HUD Overlay */}
              {countdownRemaining !== null && (
                <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-8xl sm:text-9xl font-black font-['Syne'] text-cyan-400 animate-bounce">
                    {countdownRemaining}
                  </div>
                </div>
              )}

              {/* Live WebGL / Lighting / AI Canvas (rendered when Smart Chroma Key, Virtual Lighting, or AI Auto-Correction is active) */}
              {(smartChromaEnabled || virtualLightingEnabled || aiAutoCorrectionEnabled) && (
                <canvas
                  ref={liveCanvasRef}
                  className="w-full h-full object-cover transition-all duration-150 absolute inset-0 z-10"
                />
              )}

              {/* Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  transform: `rotate(${rotation}deg) scaleX(${isMirrored || facingMode === 'user' ? -1 : 1}) scale(${zoom})`,
                  filter: getLutFilterCss(filter, exposureEv, hdrEnabled, {
                    realtimeColorGrading,
                    aiDenoiseEnabled,
                    beautyFilterEnabled,
                  }),
                }}
                className={`w-full h-full object-cover transition-transform duration-150 ${smartChromaEnabled || virtualLightingEnabled || aiAutoCorrectionEnabled ? 'opacity-0 absolute pointer-events-none' : ''}`}
              />

              {/* Hidden Canvas for High-Res Processing */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Sound Recording Waveform Overlay (when in Audio Mode) */}
              {mode === 'audio' && (
                <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-purple-900/50 animate-pulse">
                    <Mic className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white font-['Syne']">
                      High-Definition Sound Studio Mic
                    </h3>
                    <p className="text-xs text-slate-400 max-w-md">
                      Real-time frequency visualizer with Studio Clarity, Echo, and Voice Synthesis filters.
                    </p>
                  </div>

                  <canvas
                    ref={audioCanvasRef}
                    width={400}
                    height={100}
                    className="w-full max-w-md h-24 rounded-2xl bg-slate-900/80 border border-slate-800"
                  />

                  {isRecordingAudio && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-mono font-bold animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      RECORDING: {formatDuration(audioRecordingTime)}
                    </div>
                  )}
                </div>
              )}

              {/* Composition Grid Overlays */}
              {gridMode === 'rule_of_thirds' && (
                <div className="absolute inset-0 z-10 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/20">
                  <div className="border-r border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-b border-white/20" />
                  <div className="border-r border-white/20" />
                  <div className="border-r border-white/20" />
                  <div />
                </div>
              )}

              {gridMode === 'crosshair' && (
                <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                  <div className="w-16 h-16 border-2 border-cyan-400/60 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                  </div>
                  <div className="absolute w-full h-[1px] bg-cyan-400/20" />
                  <div className="absolute h-full w-[1px] bg-cyan-400/20" />
                </div>
              )}

              {gridMode === 'horizon' && (
                <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-[2px] bg-emerald-400/80 shadow-[0_0_8px_#34d399]" />
                  <div className="absolute w-2 h-2 rounded-full bg-emerald-400" />
                </div>
              )}

              {/* Live Teleprompter HUD Overlay */}
              {teleprompterOpen && (
                <div className="absolute inset-x-4 top-16 z-20 p-4 rounded-2xl bg-black/75 backdrop-blur-md border border-cyan-500/40 text-center max-h-48 overflow-y-auto space-y-2">
                  <div className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider">
                    Teleprompter Speech HUD
                  </div>
                  <p className="text-base sm:text-lg font-medium text-white font-serif leading-relaxed">
                    {teleprompterText}
                  </p>
                </div>
              )}

              {/* Live Video Recording Red Pulse Timer Overlay */}
              {isRecordingVideo && (
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-600/90 text-white font-mono text-xs font-bold shadow-lg animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>REC {formatDuration(videoRecordingTime)}</span>
                  <span className="text-[10px] opacity-75">({videoResolution})</span>
                </div>
              )}

              {/* FLOATING QUICK ACTIONS MENU & VOICE CONTROL HUD */}
              <div className="absolute top-4 right-4 z-30 flex flex-col items-end space-y-2">
                {/* Floating Quick Action Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsQuickActionMenuOpen(!isQuickActionMenuOpen)}
                  className={`px-3 py-1.5 rounded-full backdrop-blur-md border font-mono text-xs font-bold shadow-xl transition-all flex items-center gap-2 hover:scale-105 active:scale-95 ${
                    isQuickActionMenuOpen
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_18px_rgba(6,182,212,0.6)]'
                      : 'bg-slate-950/80 hover:bg-slate-900 text-white border-slate-700/80'
                  }`}
                  title="Quick Recording Effects & Voice Controls"
                >
                  <Zap className={`w-3.5 h-3.5 ${isQuickActionMenuOpen ? 'fill-current' : 'text-cyan-400'}`} />
                  <span className="hidden sm:inline">Quick Actions</span>
                  <div className="flex items-center gap-1">
                    {aiDenoiseEnabled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Denoise ON" />}
                    {realtimeColorGrading && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" title="Grading ON" />}
                    {upscale4kEnabled && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" title="4K ON" />}
                    {isListeningVoice && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" title="Voice AI ON" />}
                  </div>
                </button>

                {/* Voice Listener Badge */}
                {isListeningVoice && (
                  <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-950/90 border border-rose-500/50 text-rose-300 font-mono text-[11px] font-bold shadow-lg animate-pulse">
                    <Radio className="w-3 h-3 text-rose-400 animate-bounce" />
                    <span>Voice AI Listening...</span>
                    {lastVoiceCommand && (
                      <span className="text-[10px] bg-rose-900/60 px-1.5 py-0.5 rounded text-white font-normal truncate max-w-[100px]">
                        "{lastVoiceCommand}"
                      </span>
                    )}
                  </div>
                )}

                {/* Floating Quick Actions Expanded Menu Card */}
                {isQuickActionMenuOpen && (
                  <div className="w-72 sm:w-80 p-3.5 rounded-2xl bg-slate-950/95 border border-cyan-500/40 backdrop-blur-2xl shadow-2xl space-y-3 text-left animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-cyan-400 fill-current" />
                        <span className="text-xs font-bold text-white font-['Syne']">
                          Quick Effects & Voice
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsQuickActionMenuOpen(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 1-Tap Toggle List */}
                    <div className="space-y-2 text-xs">
                      {/* AI Denoise */}
                      <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg ${aiDenoiseEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                            <Shield className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-[11px]">AI Denoise Filter</div>
                            <div className="text-[10px] text-slate-400">Audio ambient & low-light grain filter</div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={aiDenoiseEnabled}
                          onChange={(e) => {
                            setAiDenoiseEnabled(e.target.checked);
                            onNotify('Quick Action', `AI Denoise ${e.target.checked ? 'Enabled' : 'Disabled'}`, 'info');
                          }}
                          className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                        />
                      </label>

                      {/* Real-time Color Grading */}
                      <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg ${realtimeColorGrading ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-500'}`}>
                            <Palette className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-[11px]">Real-time Color Grading</div>
                            <div className="text-[10px] text-slate-400">Neural 8K dynamic contrast & saturation</div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={realtimeColorGrading}
                          onChange={(e) => {
                            setRealtimeColorGrading(e.target.checked);
                            onNotify('Quick Action', `Real-time Color Grading ${e.target.checked ? 'Enabled' : 'Disabled'}`, 'info');
                          }}
                          className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                        />
                      </label>

                      {/* 4K Upscaling */}
                      <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg ${upscale4kEnabled ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
                            <Maximize2 className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-[11px]">4K UHD Upscaling</div>
                            <div className="text-[10px] text-slate-400">3840x2160 UHD sensor upscaling</div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={upscale4kEnabled}
                          onChange={(e) => {
                            setUpscale4kEnabled(e.target.checked);
                            setVideoResolution(e.target.checked ? '4k' : '1080p');
                            onNotify('Quick Action', `4K Upscaling ${e.target.checked ? 'Enabled' : 'Disabled'}`, 'info');
                          }}
                          className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                        />
                      </label>

                      {/* AI Beauty Retouch */}
                      <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg ${beautyFilterEnabled ? 'bg-pink-500/20 text-pink-400' : 'bg-slate-800 text-slate-500'}`}>
                            <Smile className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-[11px]">AI Beauty Retouch</div>
                            <div className="text-[10px] text-slate-400">Skin smoothing & studio portrait glow</div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={beautyFilterEnabled}
                          onChange={(e) => {
                            setBeautyFilterEnabled(e.target.checked);
                            onNotify('Quick Action', `AI Beauty Retouch ${e.target.checked ? 'Enabled' : 'Disabled'}`, 'info');
                          }}
                          className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                        />
                      </label>

                      {/* Voice Command Hands-Free AI */}
                      <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-rose-500/30 hover:border-rose-500/50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg ${isListeningVoice ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-500'}`}>
                            <Radio className="w-3.5 h-3.5 animate-pulse" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-[11px]">Voice Commands AI</div>
                            <div className="text-[10px] text-rose-300">Hands-free 'Snap', 'Record', 'Stop'</div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isListeningVoice}
                          onChange={(e) => {
                            setIsListeningVoice(e.target.checked);
                            onNotify('Voice AI', `Voice Command Listener ${e.target.checked ? 'Activated (Say "Snap" or "Record")' : 'Deactivated'}`, 'info');
                          }}
                          className="w-4 h-4 rounded accent-rose-500 cursor-pointer"
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => setVoiceHelpModalOpen(true)}
                      className="w-full py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>View Voice Commands Guide</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Watermark & Live Timestamp HUD Preview */}
              <div className="absolute bottom-3 left-3 z-10 text-[11px] font-mono text-white/80 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10 pointer-events-none flex items-center gap-2">
                <span className="font-bold text-cyan-400">{watermarkText}</span>
                <span>•</span>
                <span>{new Date().toLocaleTimeString()}</span>
                {hdrEnabled && (
                  <span className="px-1 py-0.2 rounded bg-indigo-500/40 text-indigo-300 text-[9px] font-bold">
                    HDR
                  </span>
                )}
                <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-300">
                  {zoom.toFixed(1)}x
                </span>
              </div>

              {/* Hidden Inputs for Native Device Camera & Gallery Upload */}
              <input
                ref={nativeCameraInputRef}
                type="file"
                accept="image/*,video/*"
                capture="user"
                onChange={handleNativeCapture}
                className="hidden"
              />
              <input
                ref={galleryFileInputRef}
                type="file"
                accept="image/*,video/*,audio/*"
                onChange={handleNativeCapture}
                className="hidden"
              />

              {/* Permission Denied Fallback */}
              {hasPermission === false && !virtualStudioMode && (
                <div className="absolute inset-0 z-30 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <Shield className="w-12 h-12 text-cyan-400 animate-pulse" />
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white font-['Syne']">
                      Camera Permission Restricted in Browser Frame
                    </h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Browser preview restricted webcam access. Choose your preferred studio capture method below:
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-lg pt-2">
                    <button
                      onClick={() => {
                        window.open('https://ais-dev-z72lknvwt3vejxxrwes3rb-409805687062.asia-southeast1.run.app', '_blank');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold text-xs shadow-lg hover:brightness-110 flex items-center gap-2 transition-transform hover:scale-105"
                      title="Opens the app in a standalone tab where your browser will prompt Allow Camera Permission"
                    >
                      <ExternalLink className="w-4 h-4 text-cyan-200" />
                      <span>🌐 Open Standalone Tab (Unlocks Webcam)</span>
                    </button>

                    <button
                      onClick={() => nativeCameraInputRef.current?.click()}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-black text-xs shadow-lg hover:brightness-110 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
                    >
                      <Camera className="w-4 h-4 text-slate-950" />
                      <span>📸 Open Device Camera App</span>
                    </button>

                    <button
                      onClick={() => {
                        setVirtualStudioMode(true);
                        onNotify('Virtual Studio Active', '8K AI Virtual Viewfinder enabled with real-time LUT filters and shutter snapshot!', 'info');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
                    >
                      <Sparkles className="w-4 h-4 text-cyan-300" />
                      <span>✨ AI Virtual Studio Viewfinder</span>
                    </button>

                    <button
                      onClick={() => galleryFileInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all"
                    >
                      <UploadCloud className="w-4 h-4 text-cyan-400" />
                      <span>📁 Upload Media File</span>
                    </button>

                    <button
                      onClick={() => initStream()}
                      className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-800"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Retry Webcam
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* FLOATING ACTION SHUTTER & HARDWARE CONTROLS BAR */}
            <div className="w-full max-w-2xl mt-4 p-3 rounded-2xl bg-slate-950/90 border border-slate-800/80 backdrop-blur-xl flex items-center justify-between gap-3 shadow-xl">
              
              {/* Quick Lens Switcher & Torch */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleFlipCamera}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800 transition-all hover:scale-105"
                  title="Switch Front / Rear Camera"
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>

                <button
                  onClick={toggleTorch}
                  className={`p-2.5 rounded-xl border transition-all hover:scale-105 ${
                    torchOn
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_12px_#f59e0b]'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                  title="Toggle Flash / Hardware Torch"
                >
                  {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => {
                    const nextRot = (rotation + 90) % 360;
                    setRotation(nextRot);
                    playCameraSound('beep');
                  }}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800 transition-all hover:scale-105"
                  title={`Rotate Lens (${rotation}°)`}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* PRIMARY SHUTTER BUTTON */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleShutterClick}
                  disabled={isCapturingBurst}
                  className={`relative p-1 rounded-full border-4 transition-all transform active:scale-95 hover:scale-105 shadow-2xl flex items-center justify-center ${
                    mode === 'video'
                      ? isRecordingVideo
                        ? 'border-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.8)]'
                        : 'border-rose-500 shadow-rose-950/60'
                      : mode === 'audio'
                      ? isRecordingAudio
                        ? 'border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.8)]'
                        : 'border-purple-500 shadow-purple-950/60'
                      : mode === 'burst'
                      ? 'border-amber-400 shadow-amber-950/60'
                      : 'border-cyan-400 shadow-cyan-950/60'
                  }`}
                >
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white transition-all ${
                      mode === 'video'
                        ? isRecordingVideo
                          ? 'bg-rose-600 rounded-2xl w-10 h-10'
                          : 'bg-gradient-to-tr from-rose-600 to-pink-600'
                        : mode === 'audio'
                        ? isRecordingAudio
                          ? 'bg-purple-600 rounded-2xl w-10 h-10'
                          : 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                        : mode === 'burst'
                        ? 'bg-gradient-to-tr from-amber-500 to-orange-600'
                        : 'bg-gradient-to-tr from-cyan-500 to-indigo-600'
                    }`}
                  >
                    {mode === 'video' ? (
                      isRecordingVideo ? <Square className="w-6 h-6 fill-current" /> : <Video className="w-7 h-7" />
                    ) : mode === 'audio' ? (
                      isRecordingAudio ? <Square className="w-6 h-6 fill-current" /> : <Mic className="w-7 h-7" />
                    ) : mode === 'burst' ? (
                      <Sparkles className="w-7 h-7 animate-spin" />
                    ) : (
                      <Camera className="w-7 h-7" />
                    )}
                  </div>
                </button>
              </div>

              {/* Quick Thumbnail Preview & Gallery Launch */}
              <div className="flex items-center gap-2">
                {vaultItems.length > 0 ? (
                  <button
                    onClick={() => {
                      setSelectedVaultItem(vaultItems[0]);
                      setIsVaultGalleryOpen(true);
                    }}
                    className="relative group p-0.5 rounded-xl border border-cyan-500/50 overflow-hidden hover:scale-105 transition-transform"
                    title="Open Latest Captured Media"
                  >
                    {vaultItems[0].type === 'image' ? (
                      <img
                        src={vaultItems[0].url}
                        alt="Latest"
                        className="w-10 h-10 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-cyan-400">
                        {vaultItems[0].type === 'video' ? <Video className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </div>
                    )}
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-80" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
                    </span>
                  </button>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT 1 COL: A-to-Z PRO CONTROLS SIDEBAR */}
          <div className="space-y-3 bg-slate-950/80 p-3.5 rounded-3xl border border-slate-800/80 flex flex-col justify-between">
            <div className="space-y-3">
              
              {/* Settings Sub-Tab Navigation */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px]">
                <button
                  onClick={() => setActiveSettingsTab('lut')}
                  className={`pb-1 font-bold transition-colors ${activeSettingsTab === 'lut' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
                >
                  LUTs/HDR
                </button>
                <button
                  onClick={() => setActiveSettingsTab('virtual_bg')}
                  className={`pb-1 font-bold transition-colors ${activeSettingsTab === 'virtual_bg' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
                >
                  Virtual BG
                </button>
                <button
                  onClick={() => setActiveSettingsTab('studio_lighting')}
                  className={`pb-1 font-bold transition-colors ${activeSettingsTab === 'studio_lighting' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
                >
                  Lighting
                </button>
                <button
                  onClick={() => setActiveSettingsTab('adjust')}
                  className={`pb-1 font-bold transition-colors ${activeSettingsTab === 'adjust' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
                >
                  AI Auto ⚡
                </button>
                <button
                  onClick={() => setActiveSettingsTab('zoom')}
                  className={`pb-1 font-bold transition-colors ${activeSettingsTab === 'zoom' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
                >
                  Zoom
                </button>
                <button
                  onClick={() => setActiveSettingsTab('grid')}
                  className={`pb-1 font-bold transition-colors ${activeSettingsTab === 'grid' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setActiveSettingsTab('prompter')}
                  className={`pb-1 font-bold transition-colors ${activeSettingsTab === 'prompter' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
                >
                  Script
                </button>
              </div>

              {/* TAB 1: LUTs, HDR & EXPOSURE */}
              {activeSettingsTab === 'lut' && (
                <div className="space-y-3">
                  {/* Dynamic HDR Switch */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <div>
                        <div className="text-xs font-bold text-white">Dynamic HDR Mode</div>
                        <div className="text-[10px] text-slate-400">Boost dynamic range & shadow clarity</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setHdrEnabled(!hdrEnabled)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        hdrEnabled
                          ? 'bg-cyan-500 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {hdrEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {/* Exposure EV Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Exposure Compensation (EV)</span>
                      <span className="font-mono text-cyan-400 font-bold">{exposureEv > 0 ? `+${exposureEv}` : exposureEv} EV</span>
                    </div>
                    <input
                      type="range"
                      min="-3"
                      max="3"
                      step="0.5"
                      value={exposureEv}
                      onChange={(e) => setExposureEv(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  {/* Cinema Color LUTs Preset Grid */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] text-slate-400 font-bold">Cinema Color LUT Filters</div>
                    <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                      {(
                        [
                          { id: 'normal', label: 'Natural Standard', icon: '🌿' },
                          { id: 'hdr_cinema', label: 'HDR Cinema', icon: '🎬' },
                          { id: 'cyber_neon', label: 'Cyber Neon', icon: '🔮' },
                          { id: 'vivid', label: 'Vivid Pop', icon: '🌈' },
                          { id: 'warm_vintage', label: 'Warm Vintage', icon: '📼' },
                          { id: 'noir_bw', label: 'Noir B&W', icon: '🎞️' },
                          { id: 'golden_hour', label: 'Golden Hour', icon: '🌅' },
                          { id: 'cold_glacier', label: 'Cold Glacier', icon: '❄️' },
                          { id: 'dramatic_contrast', label: 'Dramatic Contrast', icon: '⚡' },
                        ] as { id: CameraLutFilter; label: string; icon: string }[]
                      ).map((lut) => (
                        <button
                          key={lut.id}
                          onClick={() => {
                            setFilter(lut.id);
                            playCameraSound('beep');
                          }}
                          className={`p-2 rounded-xl text-left text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            filter === lut.id
                              ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md border border-cyan-400/50'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          <span>{lut.icon}</span>
                          <span className="truncate">{lut.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: VIRTUAL BACKGROUND & REAL-TIME REMOVAL */}
              {activeSettingsTab === 'virtual_bg' && (
                <div className="space-y-3">
                  <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>Virtual Background & Removal</span>
                    <span className="text-[10px] text-cyan-400 font-mono">Real-Time Keyer</span>
                  </div>

                  {/* SMART CHROMA KEY & DYNAMIC WEBGL ENGINE SECTION */}
                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white font-['Syne']">
                            Smart Chroma Key Engine
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Auto solid-color removal & WebGL textures
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextState = !smartChromaEnabled;
                          setSmartChromaEnabled(nextState);
                          if (nextState) {
                            handleAutoDetectKeyColor();
                          }
                          onNotify(
                            'Smart Chroma Key',
                            `Real-time WebGL Chroma Engine ${nextState ? 'ACTIVATED' : 'DEACTIVATED'}`,
                            nextState ? 'success' : 'info'
                          );
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-md ${
                          smartChromaEnabled
                            ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {smartChromaEnabled ? 'ACTIVE ⚡' : 'OFF'}
                      </button>
                    </div>

                    {smartChromaEnabled && (
                      <div className="space-y-3 pt-1 border-t border-slate-800 text-xs">
                        {/* Auto-Detect Key Color Button & Status */}
                        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded-md border border-white/30 shadow-inner shrink-0"
                              style={{ backgroundColor: keyColorHex }}
                            />
                            <div>
                              <div className="text-[11px] font-bold text-white truncate max-w-[140px]">
                                {detectedColorName}
                              </div>
                              <div className="text-[9px] text-slate-400 font-mono">{keyColorHex}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleAutoDetectKeyColor}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold flex items-center gap-1 transition-all shrink-0"
                            title="Sample video feed corner pixels to auto-detect background color"
                          >
                            <RefreshCw className="w-3 h-3 animate-spin-slow" />
                            <span>Auto Detect</span>
                          </button>
                        </div>

                        {/* Color Preset Swatches & Custom Color Picker */}
                        <div className="space-y-1">
                          <div className="text-[10px] text-slate-400 font-bold">Key Color Preset Swatches</div>
                          <div className="flex items-center gap-1.5">
                            {[
                              { hex: '#00FF00', label: 'Green' },
                              { hex: '#0000FF', label: 'Blue' },
                              { hex: '#FF00FF', label: 'Magenta' },
                              { hex: '#FFFFFF', label: 'White' },
                              { hex: '#000000', label: 'Black' },
                            ].map((swatch) => (
                              <button
                                key={swatch.hex}
                                type="button"
                                onClick={() => {
                                  setKeyColorHex(swatch.hex);
                                  setDetectedColorName(`${swatch.label} (${swatch.hex})`);
                                }}
                                className={`flex-1 py-1 rounded-lg border text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${
                                  keyColorHex.toUpperCase() === swatch.hex.toUpperCase()
                                    ? 'border-cyan-400 ring-2 ring-cyan-400/50 bg-slate-800 text-white'
                                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                                }`}
                              >
                                <span
                                  className="w-3 h-3 rounded-full border border-white/20"
                                  style={{ backgroundColor: swatch.hex }}
                                />
                                <span className="text-[9px]">{swatch.label}</span>
                              </button>
                            ))}
                            <label className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:border-slate-700 cursor-pointer flex flex-col items-center justify-center text-[9px] text-slate-400 shrink-0">
                              <Palette className="w-3 h-3 text-cyan-400" />
                              <span>Picker</span>
                              <input
                                type="color"
                                value={keyColorHex}
                                onChange={(e) => {
                                  setKeyColorHex(e.target.value);
                                  setDetectedColorName(`Custom Picker (${e.target.value})`);
                                }}
                                className="w-0 h-0 opacity-0 pointer-events-none absolute"
                              />
                            </label>
                          </div>
                        </div>

                        {/* Keying Tolerance & Feathering Sliders */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>Tolerance</span>
                              <span className="font-mono text-cyan-400 font-bold">{keyTolerance}%</span>
                            </div>
                            <input
                              type="range"
                              min="5"
                              max="85"
                              step="2"
                              value={keyTolerance}
                              onChange={(e) => setKeyTolerance(parseInt(e.target.value))}
                              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>Edge Feather</span>
                              <span className="font-mono text-cyan-400 font-bold">{keySmoothness}px</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="40"
                              step="2"
                              value={keySmoothness}
                              onChange={(e) => setKeySmoothness(parseInt(e.target.value))}
                              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                            />
                          </div>
                        </div>

                        {/* Spill Suppression */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>Color Spill Suppression</span>
                            <span className="font-mono text-cyan-400 font-bold">{spillSuppression}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={spillSuppression}
                            onChange={(e) => setSpillSuppression(parseInt(e.target.value))}
                            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                          />
                        </div>

                        {/* Dynamic WebGL Background Engine Selector */}
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[10px] text-slate-300 font-bold flex items-center justify-between">
                            <span>Dynamic WebGL Engine Textures</span>
                            <span className="text-cyan-400 font-mono text-[9px]">60FPS Real-Time</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto">
                            {[
                              { id: 'cyber_grid', label: '3D Cyber Grid', icon: '🌐' },
                              { id: 'matrix_rain', label: 'Matrix Code Rain', icon: '💻' },
                              { id: 'starfield_tunnel', label: 'Warp Starfield', icon: '🚀' },
                              { id: 'plasma_energy', label: 'Plasma Waves', icon: '🔮' },
                              { id: 'synthwave_sun', label: '80s Retrowave', icon: '🌅' },
                              { id: 'aurora_borealis', label: 'Northern Lights', icon: '🌌' },
                              { id: 'lava_vortex', label: 'Lava Fire Vortex', icon: '🔥' },
                            ].map((tex) => (
                              <button
                                key={tex.id}
                                type="button"
                                onClick={() => {
                                  setWebglTexture(tex.id as any);
                                  onNotify('Engine Texture Active', `Rendering live ${tex.label} in WebGL engine.`, 'info');
                                }}
                                className={`p-2 rounded-xl text-left text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                                  webglTexture === tex.id
                                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white border border-cyan-300 font-bold shadow-md'
                                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                                }`}
                              >
                                <span>{tex.icon}</span>
                                <span className="truncate">{tex.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* WebGL Speed & Intensity Controls */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>Engine Speed</span>
                              <span className="font-mono text-cyan-400 font-bold">{webglAnimSpeed.toFixed(1)}x</span>
                            </div>
                            <input
                              type="range"
                              min="0.2"
                              max="3.0"
                              step="0.2"
                              value={webglAnimSpeed}
                              onChange={(e) => setWebglAnimSpeed(parseFloat(e.target.value))}
                              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>Glow Intensity</span>
                              <span className="font-mono text-cyan-400 font-bold">{webglIntensity.toFixed(1)}x</span>
                            </div>
                            <input
                              type="range"
                              min="0.4"
                              max="2.0"
                              step="0.2"
                              value={webglIntensity}
                              onChange={(e) => setWebglIntensity(parseFloat(e.target.value))}
                              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hidden Custom Background File Input */}
                  <input
                    ref={customBgInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCustomBgUpload}
                    className="hidden"
                  />

                  {/* Virtual Background Presets Grid */}
                  <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                    {[
                      { id: 'none', label: 'Original Feed', icon: '📷' },
                      { id: 'blur', label: 'Bokeh Blur', icon: '🔍' },
                      { id: 'cyberpunk_tokyo', label: 'Cyberpunk Tokyo', icon: '🌆' },
                      { id: 'futuristic_studio', label: '8K Cyber Studio', icon: '🎬' },
                      { id: 'space_nebula', label: 'Cosmic Nebula', icon: '🌌' },
                      { id: 'minimal_office', label: 'Modern Office', icon: '🏛️' },
                      { id: 'neon_sunset', label: 'Synthwave Sunset', icon: '🌅' },
                      { id: 'green_screen', label: 'Green Screen', icon: '🟩' },
                    ].map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => {
                          setVirtualBg(bg.id as any);
                          onNotify('Virtual BG Updated', `Applied ${bg.label} for real-time video compositing.`, 'info');
                        }}
                        className={`p-2 rounded-xl text-left text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          virtualBg === bg.id
                            ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md border border-cyan-400/50 font-bold'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        <span>{bg.icon}</span>
                        <span className="truncate">{bg.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Custom Background Upload Button */}
                  <button
                    onClick={() => customBgInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <UploadCloud className="w-4 h-4 text-cyan-400" />
                    <span>Upload Custom Background</span>
                  </button>

                  {/* Background Blur Slider */}
                  {virtualBg === 'blur' && (
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Bokeh Blur Depth</span>
                        <span className="font-mono text-cyan-400 font-bold">{bgBlurAmount}px</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="25"
                        step="1"
                        value={bgBlurAmount}
                        onChange={(e) => setBgBlurAmount(parseInt(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                    </div>
                  )}

                  {/* Chroma Key Sensitivity Slider */}
                  {virtualBg === 'green_screen' && (
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Chroma Sensitivity</span>
                        <span className="font-mono text-cyan-400 font-bold">{chromaSensitivity}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={chromaSensitivity}
                        onChange={(e) => setChromaSensitivity(parseInt(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* TAB: VIRTUAL 3-POINT STUDIO LIGHTING PANEL */}
              {activeSettingsTab === 'studio_lighting' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-cyan-500/30">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="text-xs font-bold text-white font-['Syne']">
                          3-Point Studio Lighting
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Key, Fill & Rim Backlight Simulation
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !virtualLightingEnabled;
                        setVirtualLightingEnabled(next);
                        onNotify(
                          'Studio Lighting',
                          `3-Point Lighting Simulation ${next ? 'ACTIVATED' : 'DEACTIVATED'}`,
                          next ? 'success' : 'info'
                        );
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-md ${
                        virtualLightingEnabled
                          ? 'bg-gradient-to-r from-amber-400 to-cyan-400 text-slate-950 font-black shadow-[0_0_12px_rgba(251,191,36,0.5)]'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {virtualLightingEnabled ? 'ACTIVE 💡' : 'OFF'}
                    </button>
                  </div>

                  {virtualLightingEnabled && (
                    <div className="space-y-3">
                      {/* Presets Grid */}
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-400 font-bold">Studio Lighting Presets</div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { id: 'studio_portrait', label: 'Studio Portrait', icon: '📸' },
                            { id: 'cyber_neon', label: 'Cyber Neon', icon: '🌆' },
                            { id: 'dramatic_noir', label: 'Dramatic Noir', icon: '🎬' },
                            { id: 'golden_sunset', label: 'Golden Sunset', icon: '🌅' },
                            { id: 'cool_broadcaster', label: 'Cool Broadcaster', icon: '🎙️' },
                          ].map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => applyLightingPreset(p.id as any)}
                              className={`p-1.5 rounded-xl text-left text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                                lightingPreset === p.id
                                  ? 'bg-gradient-to-r from-amber-500/80 to-cyan-600/80 text-white border border-amber-400/60 font-bold shadow'
                                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                              }`}
                            >
                              <span>{p.icon}</span>
                              <span className="truncate">{p.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Interactive 2D Stage Visualizer Box */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                          <span>Interactive Light Stage Position</span>
                          <span className="text-cyan-400 font-mono">Click to position {activeLightNode.toUpperCase()} Light</span>
                        </div>
                        <div
                          className="relative w-full h-32 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden cursor-crosshair shadow-inner"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                            const clickY = Math.round(((e.clientY - rect.top) / rect.height) * 100);
                            if (activeLightNode === 'key') {
                              setKeyPosX(clickX); setKeyPosY(clickY);
                            } else if (activeLightNode === 'fill') {
                              setFillPosX(clickX); setFillPosY(clickY);
                            } else if (activeLightNode === 'rim') {
                              setRimPosX(clickX); setRimPosY(clickY);
                            }
                            setLightingPreset('custom');
                          }}
                        >
                          {/* Subject Silhouette Center Circle */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/20 bg-slate-900/60 flex flex-col items-center justify-center text-[9px] text-slate-400 pointer-events-none">
                            <span>Subject</span>
                          </div>

                          {/* Key Light Node (K) */}
                          <div
                            className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shadow-lg transition-transform ${
                              activeLightNode === 'key' ? 'ring-2 ring-amber-300 scale-125 z-20' : 'opacity-80 z-10'
                            }`}
                            style={{
                              left: `${keyPosX}%`,
                              top: `${keyPosY}%`,
                              backgroundColor: keyColor,
                              color: '#000000',
                            }}
                            onClick={(e) => { e.stopPropagation(); setActiveLightNode('key'); }}
                            title="Key Light (Main Source)"
                          >
                            K
                          </div>

                          {/* Fill Light Node (F) */}
                          <div
                            className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shadow-lg transition-transform ${
                              activeLightNode === 'fill' ? 'ring-2 ring-sky-300 scale-125 z-20' : 'opacity-80 z-10'
                            }`}
                            style={{
                              left: `${fillPosX}%`,
                              top: `${fillPosY}%`,
                              backgroundColor: fillColor,
                              color: '#000000',
                            }}
                            onClick={(e) => { e.stopPropagation(); setActiveLightNode('fill'); }}
                            title="Fill Light (Soft Shadow Fill)"
                          >
                            F
                          </div>

                          {/* Rim Light Node (R) */}
                          <div
                            className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shadow-lg transition-transform ${
                              activeLightNode === 'rim' ? 'ring-2 ring-cyan-300 scale-125 z-20' : 'opacity-80 z-10'
                            }`}
                            style={{
                              left: `${rimPosX}%`,
                              top: `${rimPosY}%`,
                              backgroundColor: rimColor,
                              color: '#000000',
                            }}
                            onClick={(e) => { e.stopPropagation(); setActiveLightNode('rim'); }}
                            title="Rim Backlight (Hair Highlight)"
                          >
                            R
                          </div>
                        </div>
                      </div>

                      {/* Light Source Switcher Tabs */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveLightNode('key')}
                          className={`py-1.5 rounded-xl font-bold transition-all text-[10px] flex items-center justify-center gap-1 ${
                            activeLightNode === 'key'
                              ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}
                        >
                          <Sun className="w-3 h-3" /> Key Light
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveLightNode('fill')}
                          className={`py-1.5 rounded-xl font-bold transition-all text-[10px] flex items-center justify-center gap-1 ${
                            activeLightNode === 'fill'
                              ? 'bg-sky-400 text-slate-950 font-black shadow-md'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}
                        >
                          <Sun className="w-3 h-3" /> Fill Light
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveLightNode('rim')}
                          className={`py-1.5 rounded-xl font-bold transition-all text-[10px] flex items-center justify-center gap-1 ${
                            activeLightNode === 'rim'
                              ? 'bg-purple-400 text-slate-950 font-black shadow-md'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}
                        >
                          <Sun className="w-3 h-3" /> Rim Light
                        </button>
                      </div>

                      {/* Key Light Controls */}
                      {activeLightNode === 'key' && (
                        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-amber-400/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-300 text-[11px]">Key Light Settings (Main)</span>
                            <input
                              type="color"
                              value={keyColor}
                              onChange={(e) => { setKeyColor(e.target.value); setLightingPreset('custom'); }}
                              className="w-6 h-6 rounded border border-white/30 cursor-pointer"
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>Intensity</span>
                              <span className="font-mono text-amber-400 font-bold">{keyIntensity}%</span>
                            </div>
                            <input
                              type="range"
                              min="0" max="100" step="5"
                              value={keyIntensity}
                              onChange={(e) => { setKeyIntensity(parseInt(e.target.value)); setLightingPreset('custom'); }}
                              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>Spread Radius</span>
                              <span className="font-mono text-amber-400 font-bold">{keyRadius}%</span>
                            </div>
                            <input
                              type="range"
                              min="20" max="100" step="5"
                              value={keyRadius}
                              onChange={(e) => { setKeyRadius(parseInt(e.target.value)); setLightingPreset('custom'); }}
                              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                            />
                          </div>
                        </div>
                      )}

                      {/* Fill Light Controls */}
                      {activeLightNode === 'fill' && (
                        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-sky-400/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sky-300 text-[11px]">Fill Light Settings (Soft Shadow)</span>
                            <input
                              type="color"
                              value={fillColor}
                              onChange={(e) => { setFillColor(e.target.value); setLightingPreset('custom'); }}
                              className="w-6 h-6 rounded border border-white/30 cursor-pointer"
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>Intensity</span>
                              <span className="font-mono text-sky-400 font-bold">{fillIntensity}%</span>
                            </div>
                            <input
                              type="range"
                              min="0" max="100" step="5"
                              value={fillIntensity}
                              onChange={(e) => { setFillIntensity(parseInt(e.target.value)); setLightingPreset('custom'); }}
                              className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>Softness Radius</span>
                              <span className="font-mono text-sky-400 font-bold">{fillRadius}%</span>
                            </div>
                            <input
                              type="range"
                              min="20" max="100" step="5"
                              value={fillRadius}
                              onChange={(e) => { setFillRadius(parseInt(e.target.value)); setLightingPreset('custom'); }}
                              className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                            />
                          </div>
                        </div>
                      )}

                      {/* Rim Light Controls */}
                      {activeLightNode === 'rim' && (
                        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-purple-400/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-purple-300 text-[11px]">Rim Backlight Settings (Edge Glow)</span>
                            <input
                              type="color"
                              value={rimColor}
                              onChange={(e) => { setRimColor(e.target.value); setLightingPreset('custom'); }}
                              className="w-6 h-6 rounded border border-white/30 cursor-pointer"
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>Intensity</span>
                              <span className="font-mono text-purple-400 font-bold">{rimIntensity}%</span>
                            </div>
                            <input
                              type="range"
                              min="0" max="100" step="5"
                              value={rimIntensity}
                              onChange={(e) => { setRimIntensity(parseInt(e.target.value)); setLightingPreset('custom'); }}
                              className="w-full accent-purple-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>Halo Radius</span>
                              <span className="font-mono text-purple-400 font-bold">{rimRadius}%</span>
                            </div>
                            <input
                              type="range"
                              min="10" max="80" step="5"
                              value={rimRadius}
                              onChange={(e) => { setRimRadius(parseInt(e.target.value)); setLightingPreset('custom'); }}
                              className="w-full accent-purple-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                            />
                          </div>
                        </div>
                      )}

                      {/* Composite Blend Mode Selector */}
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-400 font-bold">Studio Blend Mode</div>
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            { id: 'soft-light', label: 'Soft Light' },
                            { id: 'overlay', label: 'Overlay' },
                            { id: 'color-dodge', label: 'Dodge Glow' },
                            { id: 'hard-light', label: 'Hard Light' },
                            { id: 'screen', label: 'Screen' },
                          ].map((b) => (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => setLightingBlendMode(b.id as any)}
                              className={`py-1 rounded-lg text-[10px] font-bold transition-all ${
                                lightingBlendMode === b.id
                                  ? 'bg-gradient-to-r from-amber-500 to-cyan-500 text-slate-950 font-black'
                                  : 'bg-slate-900 text-slate-400 border border-slate-800'
                              }`}
                            >
                              {b.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: AI AUTO-CORRECTION LAYER & HISTOGRAM HUD */}
              {activeSettingsTab === 'adjust' && (
                <div className="space-y-3 text-xs">
                  {/* AI Auto-Tune Hero Switch & Trigger */}
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-cyan-500/40 space-y-3 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                          <Zap className="w-4 h-4 fill-current animate-pulse" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white font-['Syne']">
                            AI Auto-Correction Engine
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Auto Exposure, Gray-World WB & Denoise
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = !aiAutoCorrectionEnabled;
                          setAiAutoCorrectionEnabled(next);
                          if (next) {
                            runAiAutoTuneSceneAnalysis();
                          }
                          onNotify(
                            'AI Auto-Correction',
                            `Real-time Canvas Auto-Correction ${next ? 'ACTIVATED' : 'DEACTIVATED'}`,
                            next ? 'success' : 'info'
                          );
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-md ${
                          aiAutoCorrectionEnabled
                            ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-black shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {aiAutoCorrectionEnabled ? 'ACTIVE ⚡' : 'OFF'}
                      </button>
                    </div>

                    {/* 1-Tap AI Auto-Tune Scene Analysis Trigger */}
                    <button
                      type="button"
                      onClick={runAiAutoTuneSceneAnalysis}
                      disabled={aiAutoTuneActive}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/40 transition-all hover:scale-[1.02] active:scale-98"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${aiAutoTuneActive ? 'animate-spin' : ''}`} />
                      <span>{aiAutoTuneActive ? 'Analyzing Feed Histogram...' : '⚡ 1-Tap AI Scene Auto-Tune'}</span>
                    </button>
                  </div>

                  {aiAutoCorrectionEnabled && (
                    <div className="space-y-3 pt-1">
                      {/* Live Luminance Histogram Mini-HUD */}
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-bold">Luminance Histogram HUD</span>
                          <span className="text-cyan-400 font-mono font-bold">
                            Luma: {measuredLuma} / 255 • {measuredColorTemp}K
                          </span>
                        </div>

                        {/* Bars Graph */}
                        <div className="w-full h-12 flex items-end gap-1 px-1 bg-slate-900/80 rounded-lg overflow-hidden border border-slate-800">
                          {histogramData.map((val, idx) => {
                            const maxVal = Math.max(...histogramData) || 1;
                            const hPct = Math.round((val / maxVal) * 100);
                            return (
                              <div
                                key={idx}
                                className="flex-1 rounded-t bg-gradient-to-t from-indigo-600 via-cyan-500 to-emerald-400 transition-all duration-300"
                                style={{ height: `${Math.max(8, hPct)}%` }}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Auto-Exposure Gain Adjustment */}
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-300 font-bold">Auto-Exposure Gain</span>
                          <span className="font-mono text-cyan-400 font-bold">{autoExposureGain.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="2.5"
                          step="0.05"
                          value={autoExposureGain}
                          onChange={(e) => setAutoExposureGain(parseFloat(e.target.value))}
                          className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                        />
                      </div>

                      {/* White Balance RGB Channel Gains */}
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="text-[10px] text-slate-300 font-bold flex items-center justify-between">
                          <span>Gray-World White Balance Gains</span>
                          <span className="text-emerald-400 font-mono text-[9px]">{measuredColorTemp}K Kelvin</span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[9px] text-slate-400">
                            <span className="text-rose-400 font-bold">Red Gain</span>
                            <span className="font-mono text-rose-300 font-bold">{autoWbGainR.toFixed(2)}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.6" max="1.6" step="0.02"
                            value={autoWbGainR}
                            onChange={(e) => setAutoWbGainR(parseFloat(e.target.value))}
                            className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[9px] text-slate-400">
                            <span className="text-emerald-400 font-bold">Green Gain</span>
                            <span className="font-mono text-emerald-300 font-bold">{autoWbGainG.toFixed(2)}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.6" max="1.6" step="0.02"
                            value={autoWbGainG}
                            onChange={(e) => setAutoWbGainG(parseFloat(e.target.value))}
                            className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[9px] text-slate-400">
                            <span className="text-cyan-400 font-bold">Blue Gain</span>
                            <span className="font-mono text-cyan-300 font-bold">{autoWbGainB.toFixed(2)}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.6" max="1.6" step="0.02"
                            value={autoWbGainB}
                            onChange={(e) => setAutoWbGainB(parseFloat(e.target.value))}
                            className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                          />
                        </div>
                      </div>

                      {/* Noise Reduction Threshold Slider */}
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-300 font-bold">Spatial Noise Reduction</span>
                          <span className="font-mono text-purple-400 font-bold">{aiDenoiseThreshold}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="40"
                          step="2"
                          value={aiDenoiseThreshold}
                          onChange={(e) => setAiDenoiseThreshold(parseInt(e.target.value))}
                          className="w-full accent-purple-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ZOOM & LENS */}
              {activeSettingsTab === 'zoom' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Smooth Lens Zoom</span>
                      <span className="font-mono text-cyan-400 font-bold text-sm">{zoom.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max={maxZoomSupported}
                      step="0.1"
                      value={zoom}
                      onChange={(e) => applyHardwareZoom(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                    />
                  </div>

                  {/* Zoom Presets */}
                  <div className="grid grid-cols-4 gap-2">
                    {[1.0, 2.0, 3.0, 5.0].map((zVal) => (
                      <button
                        key={zVal}
                        onClick={() => applyHardwareZoom(zVal)}
                        className={`py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                          zoom === zVal
                            ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {zVal.toFixed(1)}x
                      </button>
                    ))}
                  </div>

                  {/* Mirror Selfie Toggle */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-xs font-bold text-white">Mirror Selfie Mode</div>
                    <button
                      onClick={() => setIsMirrored(!isMirrored)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        isMirrored ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isMirrored ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: ASPECT RATIO & COMPOSITION GRIDS */}
              {activeSettingsTab === 'grid' && (
                <div className="space-y-3">
                  {/* Aspect Ratio Selector */}
                  <div className="space-y-1">
                    <div className="text-[11px] text-slate-400 font-bold">Framing Aspect Ratio</div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { id: '16:9', label: '16:9 Cinema' },
                          { id: '9:16', label: '9:16 Reels' },
                          { id: '1:1', label: '1:1 Square' },
                          { id: '4:3', label: '4:3 Classic' },
                          { id: '21:9', label: '21:9 Ultra' },
                        ] as { id: CameraAspectRatio; label: string }[]
                      ).map((ratio) => (
                        <button
                          key={ratio.id}
                          onClick={() => setAspectRatio(ratio.id)}
                          className={`p-2 rounded-xl text-xs font-bold transition-all ${
                            aspectRatio === ratio.id
                              ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {ratio.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Composition Grid Lines */}
                  <div className="space-y-1">
                    <div className="text-[11px] text-slate-400 font-bold">Framing Grid Overlay</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'none', label: 'No Grid' },
                        { id: 'rule_of_thirds', label: '3x3 Thirds' },
                        { id: 'crosshair', label: 'Center Target' },
                        { id: 'horizon', label: 'Level Horizon' },
                      ].map((g) => (
                        <button
                          key={g.id}
                          onClick={() => setGridMode(g.id as any)}
                          className={`p-2 rounded-xl text-xs font-bold transition-all ${
                            gridMode === g.id
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shutter Self-Timer */}
                  <div className="space-y-1">
                    <div className="text-[11px] text-slate-400 font-bold">Self-Timer Shutter Delay</div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {([0, 3, 5, 10] as (0 | 3 | 5 | 10)[]).map((sec) => (
                        <button
                          key={sec}
                          onClick={() => setTimerSeconds(sec)}
                          className={`p-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                            timerSeconds === sec
                              ? 'bg-cyan-500 text-slate-950 font-black'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {sec === 0 ? 'OFF' : `${sec}s`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: TELEPROMPTER & SCRIPT */}
              {activeSettingsTab === 'prompter' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-xs font-bold text-white">Teleprompter HUD</div>
                    <button
                      onClick={() => setTeleprompterOpen(!teleprompterOpen)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        teleprompterOpen ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {teleprompterOpen ? 'ACTIVE' : 'OFF'}
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-bold">Custom Creator Script</label>
                    <textarea
                      value={teleprompterText}
                      onChange={(e) => setTeleprompterText(e.target.value)}
                      rows={4}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                      placeholder="Paste your video speech script or presentation talking points here..."
                    />
                  </div>

                  {/* Video Export Format & Auto-Download Settings */}
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 pt-2">
                    <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                      <span>Video Export Format</span>
                      <span className="text-[10px] text-cyan-400 font-mono uppercase">{exportFormat}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => {
                          setExportFormat('mp4');
                          onNotify('Format Set', 'Recorded clips will export in MP4 video format.', 'info');
                        }}
                        className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                          exportFormat === 'mp4'
                            ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white border border-cyan-400/50 shadow-md font-black'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        🎥 MP4 Format
                      </button>
                      <button
                        onClick={() => {
                          setExportFormat('webm');
                          onNotify('Format Set', 'Recorded clips will export in WebM video format.', 'info');
                        }}
                        className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                          exportFormat === 'webm'
                            ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white border border-cyan-400/50 shadow-md font-black'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        📼 WebM Format
                      </button>
                    </div>

                    <label className="flex items-center justify-between pt-1 cursor-pointer">
                      <span className="text-[11px] text-slate-400 font-medium">Auto-Download Clip on Stop</span>
                      <input
                        type="checkbox"
                        checked={autoDownloadOnFinish}
                        onChange={(e) => setAutoDownloadOnFinish(e.target.checked)}
                        className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Vault Shortcut */}
            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsVaultGalleryOpen(true)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950/60 hover:from-slate-800 hover:to-indigo-900/60 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Open Media Vault & Gallery ({vaultItems.length})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MEDIA VAULT & GALLERY MODAL */}
      {isVaultGalleryOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-5xl bg-[#080d1a] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
            
            {/* Gallery Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-['Syne']">
                    Camera & Recording Media Vault
                  </h3>
                  <p className="text-xs text-slate-400">
                    {vaultItems.length} items captured locally. 1-click transfer to Film, Meme, Song, Video & Office Studios.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {vaultItems.length > 0 && (
                  <button
                    onClick={() => {
                      clearVault();
                      setVaultItems([]);
                      setSelectedVaultItem(null);
                      onNotify('Vault Cleared', 'All local captured media removed.', 'info');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-rose-400 border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear All
                  </button>
                )}
                <button
                  onClick={() => setIsVaultGalleryOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Gallery Content */}
            {vaultItems.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Camera className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No photos, video clips, or sound recordings saved in Vault yet.</p>
                <button
                  onClick={() => setIsVaultGalleryOpen(false)}
                  className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold shadow-md hover:bg-cyan-500"
                >
                  Start Capturing Media
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Thumbnails Grid */}
                <div className="md:col-span-1 max-h-96 overflow-y-auto space-y-2 pr-1">
                  {vaultItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedVaultItem(item)}
                      className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        selectedVaultItem?.id === item.id
                          ? 'bg-cyan-950/40 border-cyan-500 shadow-md'
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {item.type === 'image' ? (
                          <img
                            src={item.url}
                            alt={item.title}
                            className="w-12 h-12 object-cover rounded-xl shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 shrink-0">
                            {item.type === 'video' ? <Video className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                          </div>
                        )}
                        <div className="text-left overflow-hidden">
                          <div className="text-xs font-bold text-white truncate">{item.title}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                            <span className="uppercase text-cyan-400 font-bold">{item.type}</span>
                            <span>•</span>
                            <span>{item.timestamp}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = deleteVaultItem(item.id);
                          setVaultItems(updated);
                          if (selectedVaultItem?.id === item.id) {
                            setSelectedVaultItem(updated[0] || null);
                          }
                        }}
                        className="p-1 rounded-lg hover:bg-rose-950 text-slate-500 hover:text-rose-400 transition-colors shrink-0"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Selected Item Preview & Studio Send Hub */}
                <div className="md:col-span-2 bg-slate-900/80 rounded-2xl p-4 border border-slate-800 flex flex-col justify-between space-y-4">
                  {selectedVaultItem && (
                    <>
                      <div className="space-y-3">
                        <div className="w-full max-h-64 rounded-xl overflow-hidden bg-black flex items-center justify-center border border-slate-800">
                          {selectedVaultItem.type === 'image' ? (
                            <img
                              src={selectedVaultItem.url}
                              alt={selectedVaultItem.title}
                              className="max-h-64 w-auto object-contain"
                            />
                          ) : selectedVaultItem.type === 'video' ? (
                            <video
                              src={selectedVaultItem.url}
                              controls
                              className="max-h-64 w-full"
                            />
                          ) : (
                            <div className="p-8 text-center space-y-3">
                              <Mic className="w-12 h-12 text-purple-400 mx-auto animate-pulse" />
                              <audio src={selectedVaultItem.url} controls className="w-full max-w-sm" />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-bold text-white font-['Syne']">
                              {selectedVaultItem.title}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">
                              Captured: {selectedVaultItem.timestamp} • Resolution: {selectedVaultItem.resolution || 'Pro Audio Wave'}
                            </div>
                          </div>

                          {selectedVaultItem.type === 'video' ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  const name = selectedVaultItem.title.replace(/\.(mp4|webm)$/i, '') + '.mp4';
                                  safeDownloadMedia(selectedVaultItem.blob || selectedVaultItem.url, name, { type: 'video', onNotify });
                                }}
                                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                              >
                                <Download className="w-3.5 h-3.5" /> Download MP4
                              </button>
                              <button
                                onClick={() => {
                                  const name = selectedVaultItem.title.replace(/\.(mp4|webm)$/i, '') + '.webm';
                                  safeDownloadMedia(selectedVaultItem.blob || selectedVaultItem.url, name, { type: 'video', onNotify });
                                }}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5"
                              >
                                <Download className="w-3.5 h-3.5 text-cyan-400" /> Download WebM
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleDownload(selectedVaultItem)}
                              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                            >
                              <Download className="w-3.5 h-3.5" /> Download File
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 1-Click Multi-Studio Transfer Actions */}
                      <div className="space-y-2 pt-3 border-t border-slate-800">
                        <div className="text-[11px] font-bold text-slate-300">
                          1-Click Send to Workspace Studios:
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                          <button
                            onClick={() => handleSendToStudio(selectedVaultItem, 'film_studio')}
                            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white flex items-center gap-2 transition-all font-semibold"
                          >
                            <Film className="w-3.5 h-3.5 text-amber-400" />
                            <span>Film Studio</span>
                          </button>

                          <button
                            onClick={() => handleSendToStudio(selectedVaultItem, 'meme_gif_studio')}
                            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white flex items-center gap-2 transition-all font-semibold"
                          >
                            <Smile className="w-3.5 h-3.5 text-pink-400" />
                            <span>Meme & GIF</span>
                          </button>

                          <button
                            onClick={() => handleSendToStudio(selectedVaultItem, 'video_audio')}
                            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white flex items-center gap-2 transition-all font-semibold"
                          >
                            <Video className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Video Suite</span>
                          </button>

                          <button
                            onClick={() => handleSendToStudio(selectedVaultItem, 'image_studio')}
                            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white flex items-center gap-2 transition-all font-semibold"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Image Studio</span>
                          </button>

                          <button
                            onClick={() => handleSendToStudio(selectedVaultItem, 'office_suite')}
                            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white flex items-center gap-2 transition-all font-semibold"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Office Suite</span>
                          </button>

                          {selectedVaultItem.type === 'image' && (
                            <button
                              onClick={() => handleSetAsAvatar(selectedVaultItem)}
                              className="p-2 rounded-xl bg-gradient-to-r from-cyan-600/30 to-indigo-600/30 border border-cyan-500/40 text-cyan-300 hover:text-white flex items-center gap-2 transition-all font-semibold"
                            >
                              <Award className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Set as Avatar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Voice Commands Cheat Sheet Modal */}
      {voiceHelpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-5 rounded-3xl bg-slate-950 border border-cyan-500/40 shadow-2xl space-y-4 text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base font-['Syne']">
                    Voice Commands Guide
                  </h3>
                  <p className="text-xs text-slate-400">
                    Control CameraStudio hands-free with speech triggers (English & Hindi)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVoiceHelpModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <span>📸 Take Photo</span>
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  "Snap", "Take photo", "Capture", "Cheese", "Click", "Photo khicho"
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="font-bold text-rose-300 flex items-center gap-1.5">
                  <span>🎬 Start Video</span>
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  "Record", "Start video", "Video shuru karo"
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <span>⏹️ Stop Recording</span>
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  "Stop", "Stop video", "Recording roko"
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <span>⚡ AI Denoise</span>
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  "Denoise", "Noise reduction", "Noise off"
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="font-bold text-purple-300 flex items-center gap-1.5">
                  <span>🎨 Color Grading</span>
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  "Color grade", "Color grading", "Color boost"
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <span>🔄 Flip / Switch</span>
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  "Flip", "Switch camera", "Front camera", "Rear camera"
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 flex items-center justify-between">
              <span>Status: <b>{isListeningVoice ? '🎙️ Voice AI Active' : '⏸️ Voice AI Off'}</b></span>
              <button
                type="button"
                onClick={() => {
                  setIsListeningVoice(!isListeningVoice);
                  onNotify('Voice AI', `Voice Listener ${!isListeningVoice ? 'Enabled' : 'Disabled'}`, 'info');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                  isListeningVoice
                    ? 'bg-rose-500 hover:bg-rose-600 text-white'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                }`}
              >
                {isListeningVoice ? 'Turn Off' : 'Turn On Voice AI'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

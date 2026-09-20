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
  const audioCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string>('');
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
  const [activeSettingsTab, setActiveSettingsTab] = useState<'lut' | 'grid' | 'zoom' | 'audio' | 'prompter' | 'adjust'>('lut');

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

  // Initialize Camera Stream
  const initStream = async (camId?: string, currentFacing: 'user' | 'environment' = facingMode) => {
    try {
      // Stop previous tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: camId ? { exact: camId } : undefined,
          facingMode: camId ? undefined : currentFacing,
          width: { ideal: videoResolution === '4k' ? 3840 : videoResolution === '1080p' ? 1920 : 1280 },
          height: { ideal: videoResolution === '4k' ? 2160 : videoResolution === '1080p' ? 1080 : 720 },
          frameRate: { ideal: videoFps },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setHasPermission(true);
      setPermissionError('');

      // Check capabilities (zoom, torch)
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

      // Enumerate camera devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      if (videoDevices.length > 0 && !selectedCameraId) {
        setSelectedCameraId(videoDevices[0].deviceId);
      }
    } catch (err: unknown) {
      console.warn('Camera access error:', err);
      setHasPermission(false);
      const errMsg = err instanceof Error ? err.message : 'Camera permission denied or device not found';
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

    // 4. Draw Video Frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

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

  // Start / Stop Video Recording
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
      onNotify('Video Recorded', `Saved video clip (${videoRecordingTime}s) to Camera Vault.`, 'success');
    } else {
      // START Recording
      if (!streamRef.current) return;
      playCameraSound('record_start');
      videoChunksRef.current = [];
      setVideoRecordingTime(0);

      try {
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : MediaRecorder.isTypeSupported('video/mp4')
          ? 'video/mp4'
          : 'video/webm';

        const recorder = new MediaRecorder(streamRef.current, {
          mimeType,
          videoBitsPerSecond: videoResolution === '4k' ? 12000000 : 5000000,
        });

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            videoChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(videoChunksRef.current, { type: mimeType });
          const videoUrl = URL.createObjectURL(blob);

          const newItem: CameraMediaItem = {
            id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            type: 'video',
            url: videoUrl,
            blob,
            title: `Recorded_Video_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '_')}.mp4`,
            timestamp: new Date().toLocaleTimeString(),
            durationSec: videoRecordingTime,
            resolution: videoResolution === '4k' ? '3840x2160 (4K)' : '1920x1080 (FHD)',
            fileSizeBytes: blob.size,
          };

          const updated = saveVaultItem(newItem);
          setVaultItems(updated);
          setSelectedVaultItem(newItem);
          if (onMediaCaptured) onMediaCaptured(newItem);
        };

        recorder.start(1000);
        mediaRecorderRef.current = recorder;
        setIsRecordingVideo(true);

        videoTimerRef.current = window.setInterval(() => {
          setVideoRecordingTime((t) => t + 1);
        }, 1000);
      } catch (err) {
        console.error('Video recording failed:', err);
        onNotify('Recording Error', 'Failed to start video recording on this browser.', 'error');
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
                className="w-full h-full object-cover transition-transform duration-150"
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

              {/* Permission Denied Fallback */}
              {hasPermission === false && (
                <div className="absolute inset-0 z-30 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <Shield className="w-12 h-12 text-rose-400 animate-pulse" />
                  <h4 className="text-base font-bold text-white font-['Syne']">
                    Camera & Microphone Permission Needed
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm">
                    {permissionError || 'Please enable camera and audio access in browser settings to use live recording.'}
                  </p>
                  <button
                    onClick={() => initStream()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white text-xs font-bold shadow-lg hover:brightness-110 flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retry Camera Access
                  </button>
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
                  LUTs & HDR
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
                  Aspect/Grid
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

                          <button
                            onClick={() => handleDownload(selectedVaultItem)}
                            className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                          >
                            <Download className="w-3.5 h-3.5" /> Download File
                          </button>
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

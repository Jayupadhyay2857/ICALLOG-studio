import React, { useState, useRef } from 'react';
import { Camera, Video, Mic, Sparkles, FolderArchive, X, Play, Square, Check, RefreshCw, LayoutGrid, Film, Image as ImageIcon, Music, Box, FileText, Smile } from 'lucide-react';
import { UserProfile, CameraMediaItem, ActiveTab } from '../types.ts';
import { saveVaultItem, getVaultItems } from '../lib/cameraVault.ts';

interface UniversalMediaCaptureToolbarProps {
  user?: UserProfile;
  onNotify?: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  onOpenProCamera?: () => void;
  activeTab?: string;
  setActiveTab?: (tab: any) => void;
}

export function UniversalMediaCaptureToolbar({ user, onNotify, onOpenProCamera, setActiveTab }: UniversalMediaCaptureToolbarProps) {
  const [activeModal, setActiveModal] = useState<'none' | 'camera' | 'video' | 'audio' | 'vault'>('none');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [audioTimer, setAudioTimer] = useState(0);
  const audioTimerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Open Camera modal
  const startLiveCamera = async () => {
    setActiveModal('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: true });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      onNotify?.('Camera Access', 'Unable to access camera. Please check device permissions.', 'warning');
    }
  };

  const stopLiveCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    setActiveModal('none');
  };

  const capturePhotoFromStream = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      saveVaultItem({
        id: 'univ_cam_' + Date.now(),
        type: 'image',
        url: dataUrl,
        title: `Quick Snap (${new Date().toLocaleTimeString()})`,
        timestamp: new Date().toISOString(),
        resolution: `${canvas.width}x${canvas.height}`,
        filterUsed: 'normal',
        zoomLevel: 1,
        fileSizeBytes: Math.round((dataUrl.length * 3) / 4),
      });
      onNotify?.('Photo Captured', 'Successfully saved to Media Vault & Gallery!', 'success');
      stopLiveCamera();
    }
  };

  // Audio Recording
  const startAudioRecording = async () => {
    setActiveModal('audio');
    setRecordedBlobUrl(null);
    setAudioTimer(0);
    recordedChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedBlobUrl(url);
        saveVaultItem({
          id: 'univ_audio_' + Date.now(),
          type: 'audio',
          url,
          title: `Voice Recording (${new Date().toLocaleTimeString()})`,
          timestamp: new Date().toISOString(),
          durationSec: audioTimer,
          fileSizeBytes: blob.size,
        });
        onNotify?.('Audio Recorded', 'Voice note saved to Media Vault!', 'success');
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setIsRecording(true);
      audioTimerRef.current = setInterval(() => setAudioTimer(p => p + 1), 1000);
    } catch (err) {
      onNotify?.('Microphone Access', 'Unable to access microphone.', 'warning');
      setActiveModal('none');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    }
  };

  // Video Recording
  const startVideoRecording = async () => {
    setActiveModal('video');
    setRecordedBlobUrl(null);
    recordedChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: true });
      mediaStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedBlobUrl(url);
        saveVaultItem({
          id: 'univ_vid_' + Date.now(),
          type: 'video',
          url,
          title: `Video Recording (${new Date().toLocaleTimeString()})`,
          timestamp: new Date().toISOString(),
          resolution: '1280x720',
          fileSizeBytes: blob.size,
        });
        onNotify?.('Video Recorded', 'HD Video saved to Media Vault!', 'success');
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      onNotify?.('Camera/Mic Access', 'Unable to start video recording.', 'warning');
      setActiveModal('none');
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
    }
  };

  const vaultItems = getVaultItems();

  return (
    <>
      {/* Universal Quick Media & Studio Switcher Toolbar Bar */}
      <div className="w-full bg-slate-950/90 border border-slate-800/80 rounded-2xl p-3 mb-4 space-y-2.5 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-200 font-['Syne']">Quick Media & Capture:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={startLiveCamera}
              className="px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>Snap Photo</span>
            </button>

            <button
              type="button"
              onClick={startVideoRecording}
              className="px-3 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Video className="w-3.5 h-3.5 text-indigo-400" />
              <span>Record Video</span>
            </button>

            <button
              type="button"
              onClick={startAudioRecording}
              className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Mic className="w-3.5 h-3.5 text-purple-400" />
              <span>Record Audio</span>
            </button>

            {onOpenProCamera && (
              <button
                type="button"
                onClick={onOpenProCamera}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Full Pro Studio</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveModal('vault')}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <FolderArchive className="w-3.5 h-3.5 text-cyan-400" />
              <span>Vault ({vaultItems.length})</span>
            </button>
          </div>
        </div>

        {/* Direct Instant Studio Switcher Bar */}
        {setActiveTab && (
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono text-slate-400 mr-1">JUMP TO SUITE:</span>
            <button
              type="button"
              onClick={() => setActiveTab('image_studio')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 text-[11px] font-bold flex items-center gap-1 transition-all"
            >
              <ImageIcon className="w-3 h-3 text-cyan-400" /> Image
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('film_studio')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-rose-300 border border-slate-800 text-[11px] font-bold flex items-center gap-1 transition-all"
            >
              <Film className="w-3 h-3 text-rose-400" /> Film Making
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('media_mixer')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-800 text-[11px] font-bold flex items-center gap-1 transition-all"
            >
              <Video className="w-3 h-3 text-indigo-400" /> Img + Video
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('3d_engine')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-purple-300 border border-slate-800 text-[11px] font-bold flex items-center gap-1 transition-all"
            >
              <Box className="w-3 h-3 text-purple-400" /> 3D Model
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('song_studio')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 text-[11px] font-bold flex items-center gap-1 transition-all"
            >
              <Music className="w-3 h-3 text-amber-400" /> Music
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('meme_gif_studio')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-800 text-[11px] font-bold flex items-center gap-1 transition-all"
            >
              <Smile className="w-3 h-3 text-emerald-400" /> GIF & Meme
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('office_suite')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-blue-300 border border-slate-800 text-[11px] font-bold flex items-center gap-1 transition-all"
            >
              <FileText className="w-3 h-3 text-blue-400" /> Doc Scan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('projects_hub')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-[11px] font-bold flex items-center gap-1 transition-all"
            >
              <LayoutGrid className="w-3 h-3 text-slate-400" /> Hub
            </button>
          </div>
        )}
      </div>

      {/* Camera Live Modal */}
      {activeModal === 'camera' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white text-xs font-bold">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Instant Photo Capture</span>
              </div>
              <button onClick={stopLiveCamera} className="p-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-800">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={stopLiveCamera}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={capturePhotoFromStream}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-cyan-950 flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Snapshot</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Recording Modal */}
      {activeModal === 'video' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white text-xs font-bold">
                <Video className="w-4 h-4 text-indigo-400" />
                <span>HD Video Recorder</span>
              </div>
              <button onClick={stopVideoRecording} className="p-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-800">
              {recordedBlobUrl ? (
                <video src={recordedBlobUrl} controls className="w-full h-full object-cover" />
              ) : (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs font-mono text-cyan-400">
                {isRecording ? '🔴 Recording live HD video...' : recordedBlobUrl ? '✅ Video ready & saved' : 'Ready'}
              </div>
              <div className="flex items-center gap-2">
                {isRecording ? (
                  <button
                    onClick={stopVideoRecording}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Stop & Save</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveModal('none')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audio Recording Modal */}
      {activeModal === 'audio' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-center">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white text-xs font-bold">
                <Mic className="w-4 h-4 text-purple-400" />
                <span>Voice Recorder</span>
              </div>
              <button onClick={() => { stopAudioRecording(); setActiveModal('none'); }} className="p-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-6 flex flex-col items-center justify-center space-y-3">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isRecording ? 'bg-purple-600/30 border-2 border-purple-500 animate-pulse' : 'bg-slate-800'}`}>
                <Mic className={`w-8 h-8 ${isRecording ? 'text-purple-400' : 'text-slate-400'}`} />
              </div>
              <div className="text-lg font-mono font-bold text-white">
                {String(Math.floor(audioTimer / 60)).padStart(2, '0')}:{String(audioTimer % 60).padStart(2, '0')}
              </div>
              <div className="text-xs text-slate-400">
                {isRecording ? 'Listening & recording audio...' : recordedBlobUrl ? 'Voice recording saved successfully!' : 'Ready to record'}
              </div>
              {recordedBlobUrl && (
                <audio src={recordedBlobUrl} controls className="w-full mt-2" />
              )}
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              {isRecording ? (
                <button
                  onClick={stopAudioRecording}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop & Save to Vault</span>
                </button>
              ) : (
                <button
                  onClick={() => setActiveModal('none')}
                  className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vault Modal */}
      {activeModal === 'vault' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-5 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2 text-white text-xs font-bold">
                <FolderArchive className="w-4 h-4 text-cyan-400" />
                <span>Media Vault & Captured Items ({vaultItems.length})</span>
              </div>
              <button onClick={() => setActiveModal('none')} className="p-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {vaultItems.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">No media items in vault yet. Snap a photo or record video/audio!</div>
              ) : (
                vaultItems.map((item) => (
                  <div key={item.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {item.type === 'image' && <img src={item.url} alt="snap" className="w-12 h-12 rounded-xl object-cover bg-slate-900 shrink-0" />}
                      {item.type === 'video' && <video src={item.url} className="w-12 h-12 rounded-xl object-cover bg-slate-900 shrink-0" />}
                      {item.type === 'audio' && <div className="w-12 h-12 rounded-xl bg-purple-950/50 flex items-center justify-center text-purple-400 shrink-0"><Mic className="w-5 h-5" /></div>}
                      <div>
                        <div className="text-xs font-bold text-white">{item.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{new Date(item.timestamp).toLocaleString()} • {item.resolution || (item.durationSec ? `${item.durationSec}s` : '') || 'Media'}</div>
                      </div>
                    </div>
                    <a
                      href={item.url}
                      download={`media_${item.id}.${item.type === 'audio' ? 'webm' : item.type === 'video' ? 'webm' : 'jpg'}`}
                      className="px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 text-xs font-bold border border-cyan-800/40"
                    >
                      Download
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

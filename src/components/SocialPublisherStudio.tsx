import React, { useState } from 'react';
import {
  Share2,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  Send,
  Video,
  Image as ImageIcon,
  Copy,
  ExternalLink,
  Plus,
  RefreshCw,
  Trash2,
  Eye,
  Sliders,
} from 'lucide-react';
import { UserProfile } from '../types.ts';

interface SocialPublisherStudioProps {
  user?: UserProfile;
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

interface SocialAccount {
  id: string;
  name: string;
  platform: 'youtube' | 'instagram' | 'tiktok' | 'x' | 'linkedin';
  icon: string;
  handle: string;
  connected: boolean;
  color: string;
}

interface ScheduledPost {
  id: string;
  title: string;
  caption: string;
  hashtags: string[];
  platforms: string[];
  scheduledTime: string;
  status: 'scheduled' | 'published' | 'queued';
  mediaType: 'video_shorts' | 'image_reel' | 'carousel';
  mediaPreview: string;
}

export const SocialPublisherStudio: React.FC<SocialPublisherStudioProps> = ({ user, onNotify }) => {
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([
    { id: 'yt', name: 'YouTube Shorts', platform: 'youtube', icon: '▶️', handle: '@icallog_creator', connected: true, color: 'from-rose-600 to-red-700' },
    { id: 'ig', name: 'Instagram Reels', platform: 'instagram', icon: '📸', handle: '@icallog.studio', connected: true, color: 'from-pink-600 via-purple-600 to-amber-600' },
    { id: 'tt', name: 'TikTok Global', platform: 'tiktok', icon: '🎵', handle: '@icallog_official', connected: true, color: 'from-cyan-600 to-slate-900' },
    { id: 'tw', name: 'X / Twitter', platform: 'x', icon: '𝕏', handle: '@iCALLOG_AI', connected: true, color: 'from-slate-700 to-black' },
    { id: 'li', name: 'LinkedIn Video', platform: 'linkedin', icon: '💼', handle: 'iCALLOG Studio Productions', connected: false, color: 'from-blue-700 to-indigo-800' },
  ]);

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['yt', 'ig', 'tt']);
  const [postTitle, setPostTitle] = useState('Epic 3D Cyber Dragon Animation 60fps #viral');
  const [postCaption, setPostCaption] = useState(
    'Witness the full 8K cinematic render of the Ancient Cyber Dragon! Created in 100% real-time on iCALLOG Studio. Which animation move is your favorite? 🔥🚀'
  );
  const [hashtags, setHashtags] = useState('#3DAnimation #AIStudio #VFX #Cinematic #Shorts #Blender #ThreeJS #ViralReels');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [scheduledDate, setScheduledDate] = useState('2026-10-04');
  const [scheduledTime, setScheduledTime] = useState('18:00');
  const [isPublishing, setIsPublishing] = useState(false);

  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([
    {
      id: 'sp_1',
      title: 'Neon Cyberpunk Transit 60fps Loop',
      caption: 'High-speed neon night drive in Tokyo 2099! 🌃✨',
      hashtags: ['#Cyberpunk', '#Shorts', '#60fps', '#VFX'],
      platforms: ['yt', 'ig', 'tt'],
      scheduledTime: 'Today at 6:00 PM',
      status: 'scheduled',
      mediaType: 'video_shorts',
      mediaPreview: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'sp_2',
      title: 'Lofi Chillhop Studio Beats Drop',
      caption: 'Late night coding & creative flow session soundtrack 🎧☕',
      hashtags: ['#LofiBeats', '#MusicProducer', '#Chillhop'],
      platforms: ['yt', 'ig'],
      scheduledTime: 'Tomorrow at 10:00 AM',
      status: 'queued',
      mediaType: 'video_shorts',
      mediaPreview: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    },
  ]);

  const togglePlatform = (id: string) => {
    if (selectedPlatforms.includes(id)) {
      setSelectedPlatforms(selectedPlatforms.filter((p) => p !== id));
    } else {
      setSelectedPlatforms([...selectedPlatforms, id]);
    }
  };

  const handleGenerateAiCaption = () => {
    onNotify('AI Caption Generated', 'Created high-engagement multi-platform caption and viral hashtags!', 'success');
    setPostCaption(
      `🔥 Unleash next-gen creativity with 8K Real-Time 3D & 60fps Cinematic renders! Created with iCALLOG Universal Studio. Drop a comment below if you want the prompt pack! 🚀`
    );
    setHashtags('#AICreator #3DRender #CinematicAI #ViralTrends #ExplorePage #TechInnovation #FutureOfMedia');
  };

  const handlePublishNow = () => {
    if (selectedPlatforms.length === 0) {
      onNotify('No Platform Selected', 'Please select at least one social media channel to publish to.', 'warning');
      return;
    }

    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      const names = selectedPlatforms
        .map((p) => socialAccounts.find((a) => a.id === p)?.name)
        .filter(Boolean)
        .join(', ');

      const newPost: ScheduledPost = {
        id: `sp_${Date.now()}`,
        title: postTitle,
        caption: postCaption,
        hashtags: hashtags.split(' '),
        platforms: selectedPlatforms,
        scheduledTime: 'Just Now',
        status: 'published',
        mediaType: 'video_shorts',
        mediaPreview: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
      };

      setScheduledPosts([newPost, ...scheduledPosts]);
      onNotify(
        '🚀 Published Across All Channels!',
        `Successfully broadcasted video to: ${names} with auto-hashtags and 9:16 formatting.`,
        'success'
      );
    }, 1200);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/60 to-rose-950/40 border border-purple-500/40 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-600 to-rose-600 flex items-center justify-center text-white shadow-xl shadow-purple-950/50 text-2xl">
              📱
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white font-['Syne']">
                  1-Click Social Auto-Publisher & Schedule Hub
                </h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-400/40">
                  YouTube Shorts • Reels • TikTok • X
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-mono mt-1">
                Directly schedule and broadcast 3D clips, AI music, and viral videos to global social media algorithms.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Composer + Live Preview & Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Post Composer (6 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
            {/* Platform Selection Badges */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2">
                Target Broadcast Channels:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {socialAccounts.map((acc) => {
                  const isSelected = selectedPlatforms.includes(acc.id);
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => togglePlatform(acc.id)}
                      className={`p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-900/80 to-indigo-900/80 border-purple-400 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-xl">{acc.icon}</span>
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold truncate">{acc.name}</div>
                        <div className="text-[10px] text-purple-300 font-mono truncate">{acc.handle}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Post Title */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Post / Video Title</label>
              <input
                type="text"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Caption & Hashtag Generator */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">Social Caption & Hooks</label>
                <button
                  type="button"
                  onClick={handleGenerateAiCaption}
                  className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>AI Viral Hook Generator</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={postCaption}
                onChange={(e) => setPostCaption(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500 resize-none font-mono"
              />
            </div>

            {/* Hashtags */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Algorithm SEO Hashtags</label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-purple-300 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Aspect Ratio & Schedule Config */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Aspect Ratio Format</label>
                <div className="flex gap-1.5">
                  {(['9:16', '16:9', '1:1'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`flex-1 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                        aspectRatio === ratio
                          ? 'bg-purple-500 text-slate-950 border-purple-400 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {ratio} {ratio === '9:16' ? '(Shorts)' : ratio === '16:9' ? '(Cinema)' : '(Feed)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Scheduled Broadcast Time</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-24 px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={handlePublishNow}
                disabled={isPublishing}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs shadow-xl shadow-purple-950/50 flex items-center justify-center gap-2 transition-all hover:scale-102 cursor-pointer disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Broadcasting across {selectedPlatforms.length} networks...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-white" />
                    <span>Publish Instantly Now (1-Click)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Mobile Phone Mockup Preview & Queue (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" /> Active Broadcast & Scheduled Queue
            </h3>

            <div className="space-y-3">
              {scheduledPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={post.mediaPreview}
                        alt={post.title}
                        className="w-12 h-12 rounded-xl object-cover border border-purple-500/30 shrink-0"
                      />
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold text-white truncate">{post.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3 h-3 text-purple-400" />
                          <span>{post.scheduledTime}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider ${
                        post.status === 'published'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 line-clamp-2 font-mono">{post.caption}</p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5">
                      <span>Broadcast to: </span>
                      {post.platforms.map((p) => (
                        <span key={p} className="text-white font-bold">
                          {p.toUpperCase()}
                        </span>
                      ))}
                    </div>

                    <div className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Auto-Synced
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

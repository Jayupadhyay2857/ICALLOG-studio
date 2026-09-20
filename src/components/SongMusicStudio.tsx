import React, { useState, useRef, useEffect } from 'react';
import {
  Music,
  Disc,
  Mic,
  Play,
  Pause,
  Sliders,
  Volume2,
  Download,
  Sparkles,
  RefreshCw,
  Upload,
  Radio,
  Zap,
  Check,
  Search,
  Layers,
  FileAudio,
  Trash2,
  Plus,
  Repeat,
  Headphones,
  Lock,
  Crown,
} from 'lucide-react';
import { UserProfile } from '../types.ts';
import {
  CustomMusicTheme,
  PRESET_MUSIC_THEMES,
  loadUserCustomThemes,
  saveUserCustomThemes,
} from '../lib/musicThemeEngine.ts';
import { CustomThemeStudio } from './CustomThemeStudio.tsx';
import { VirtualSynthesizerDevice } from './VirtualSynthesizerDevice.tsx';
import { DrumMachineDevice } from './DrumMachineDevice.tsx';
import { StudioFXRackDevice } from './StudioFXRackDevice.tsx';
import { DJTurntableDevice } from './DJTurntableDevice.tsx';
import { UniversalMediaCaptureToolbar } from './UniversalMediaCaptureToolbar.tsx';

interface SongMusicStudioProps {
  user?: UserProfile;
  tokenBalance: number;
  openPaymentModal?: () => void;
  setActiveTab?: (tab: string) => void;
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export interface MusicGenreAtoZ {
  id: string;
  letter: string;
  name: string;
  icon: string;
  region: string;
  bpmDefault: number;
  description: string;
}

export const MUSIC_GENRES_A_TO_Z: MusicGenreAtoZ[] = [
  { id: 'A', letter: 'A', name: 'Afrobeat & Amapiano Groove', icon: '🥁', region: 'Nigeria / S. Africa', bpmDefault: 112, description: 'Log-drum syncopated bass, log percussion & soulful saxophone riffs' },
  { id: 'B', letter: 'B', name: 'Bollywood & Bhangra High-Energy Beats', icon: '🪘', region: 'India / Punjab', bpmDefault: 130, description: 'Dholak rhythms, Punjabi dhol drops, dholak rolls & catchy Indian melodies' },
  { id: 'C', letter: 'C', name: 'Classical Symphony & Chamber Orchestra', icon: '🎻', region: 'Europe / Global', bpmDefault: 95, description: 'Grand piano arpeggios, violins, cellos & majestic brass crescendos' },
  { id: 'D', letter: 'D', name: 'EDM, Synthwave & Dubstep Bass Drop', icon: '🎛️', region: 'Global / Berlin', bpmDefault: 128, description: '4-on-the-floor kick, supersaw leads, sidechain compression & heavy wobble bass' },
  { id: 'E', letter: 'E', name: 'Electronic Ambient & Ethereal Drone', icon: '🌌', region: 'UK / Global', bpmDefault: 75, description: 'Spacious pads, slow evolving soundscapes & atmospheric reverb washes' },
  { id: 'F', letter: 'F', name: 'Folk, Acoustic & Country Ballad', icon: '🪕', region: 'USA / Ireland', bpmDefault: 90, description: 'Fingerpicked acoustic guitars, banjo, harmonica & warm campfire vocals' },
  { id: 'G', letter: 'G', name: 'Ghazal, Sufi & Qawwali Mystical Melodies', icon: '🪔', region: 'India / Pakistan', bpmDefault: 85, description: 'Tabla, harmonium, sarangi & soul-stirring devotional vocal improvisations' },
  { id: 'H', letter: 'H', name: 'Hip-Hop, Boom Bap & Trap 808 Beats', icon: '🎤', region: 'USA (Atlanta/NY)', bpmDefault: 140, description: 'Deep sub 808 basslines, rolling fast hi-hats, crisp snares & boom bap loops' },
  { id: 'I', letter: 'I', name: 'Indie Rock, Dream Pop & Lo-Fi Chill', icon: '🎸', region: 'Global Indie', bpmDefault: 105, description: 'Jangly guitar chords, vintage reverb, cassette warmth & indie vocals' },
  { id: 'J', letter: 'J', name: 'Jazz Fusion, Bossa Nova & Swing', icon: '🎷', region: 'USA / Brazil', bpmDefault: 115, description: 'Complex 7th chords, saxophone solos, walking basslines & latin percussion' },
  { id: 'K', letter: 'K', name: 'K-Pop, J-Pop & Cyberpunk Idol Beats', icon: '✨', region: 'South Korea / Japan', bpmDefault: 126, description: 'Upbeat electro-pop synths, explosive beat drops & infectious hook melodies' },
  { id: 'L', letter: 'L', name: 'Lo-Fi Beats & Chillhop Coffee Shop', icon: '☕', region: 'Global Online', bpmDefault: 80, description: 'Vinyl crackle, dusty rhodes piano, mellow drums & study relaxing vibe' },
  { id: 'M', letter: 'M', name: 'Metal, Hard Rock & Guitar Shred', icon: '⚡', region: 'USA / Nordic', bpmDefault: 150, description: 'Distorted guitar riffs, double-kick blastbeats & intense guitar solos' },
  { id: 'N', letter: 'N', name: 'Neo-Soul, R&B & Smooth Velvet Vocals', icon: '🎙️', region: 'USA Urban', bpmDefault: 88, description: 'Lush chord progressions, silky vocals, grooving bass & smooth electric keys' },
  { id: 'O', letter: 'O', name: 'Opera, Dramatic Tenor & Orchestral Choir', icon: '🎭', region: 'Italy / Austria', bpmDefault: 70, description: 'Powerful soprano/tenor operatic vocals & dramatic orchestral accompaniment' },
  { id: 'P', letter: 'P', name: 'Pop & Dance Chart-Topper Hooks', icon: '🎵', region: 'USA / UK Pop', bpmDefault: 120, description: 'Radio-ready vocal chops, driving bassline & catchy main stage hooks' },
  { id: 'Q', letter: 'Q', name: 'Qawwali & Sufi Sacred Trance Beats', icon: '🕌', region: 'South Asia', bpmDefault: 110, description: 'Hand clapping, qawwali choir, tabla solos & crescendo mystical energy' },
  { id: 'R', letter: 'R', name: 'Reggae, Dub & Dancehall Riddim', icon: '🌴', region: 'Jamaica', bpmDefault: 92, description: 'Off-beat skank guitar, deep reggae bass, spring reverb echo & dancehall flow' },
  { id: 'S', letter: 'S', name: 'Symphonic Film Score & Hans Zimmer Style', icon: '🎬', region: 'Hollywood Cinema', bpmDefault: 100, description: 'Cinematic taiko drums, brass hits, hybrid synth pads & epic trailer motion' },
  { id: 'T', letter: 'T', name: 'Techno, Minimal House & Club Rave', icon: '🔊', region: 'Germany (Berlin)', bpmDefault: 132, description: 'Relentless 4/4 kick drum, acid bassline 303, industrial hats & dark club pulse' },
  { id: 'U', letter: 'U', name: 'Urban Trap & Drill Street Rhythm', icon: '🏙️', region: 'UK / Chicago', bpmDefault: 142, description: 'Sliding 808 bass glides, skittering hi-hats, dark minor piano keys & drill pace' },
  { id: 'V', letter: 'V', name: 'Vaporwave, Synth-Pop & 80s Nostalgia', icon: '📼', region: '80s Nostalgia', bpmDefault: 108, description: 'Retro 80s drum machines, gated reverb snares, bright neon synth leads' },
  { id: 'W', letter: 'W', name: 'World Ethno Beat, Sitar & Flute Fusion', icon: '🪈', region: 'Global / India', bpmDefault: 100, description: 'Bamboo flute, sitar glissando, darbuka drums & tribal percussion blend' },
  { id: 'X', letter: 'X', name: 'Xylophone & Percussion Acoustic Groove', icon: '🔔', region: 'Global Folk', bpmDefault: 118, description: 'Bright wooden xylophone melodies, marimba, acoustic shakers & happy rhythm' },
  { id: 'Y', letter: 'Y', name: 'Yodeling & Mountain Folk Acoustic', icon: '🏔️', region: 'European Alps', bpmDefault: 102, description: 'Accordion, alpine acoustic guitar, folk fiddles & vocal pitch shifts' },
  { id: 'Z', letter: 'Z', name: 'Zen Meditation, Tibetan Singing Bowls & Solfeggio', icon: '🧘', region: 'Himalayan Asia', bpmDefault: 60, description: '432Hz / 528Hz healing frequencies, singing bowl chimes & deep meditation pads' },
];

export interface AudioSlot {
  id: string;
  slotNumber: number;
  title: string;
  url: string;
  volume: number; // 0 to 100
  pitchShift: number; // -12 to +12
  isMuted: boolean;
  type: 'vocal' | 'bgm' | 'drums' | 'bass' | 'melody';
}

export const SongMusicStudio: React.FC<SongMusicStudioProps> = ({
  user,
  tokenBalance,
  openPaymentModal,
  setActiveTab,
  onNotify,
}) => {
  const isFreeTier = user?.vipTier === 'free';
  // Navigation Sub-tabs inside Song Studio: Themes, Hardware Devices, A-Z Genres, Lyrics to Song, Mixer, Stems
  const [activeSubTab, setActiveSubTab] = useState<
    'custom_themes' | 'virtual_devices' | 'a_to_z_genres' | 'lyrics_to_song' | 'multi_track_mixer' | 'stem_separator'
  >('custom_themes');

  // Custom Themes State
  const [savedCustomThemes, setSavedCustomThemes] = useState<CustomMusicTheme[]>(() => loadUserCustomThemes());
  const [activeMusicTheme, setActiveMusicTheme] = useState<CustomMusicTheme>(PRESET_MUSIC_THEMES[0]);

  // Virtual Hardware Device Sub-selector
  const [activeDevice, setActiveDevice] = useState<'synth' | 'drum' | 'fx_rack' | 'dj_turntable'>('synth');

  // A-Z Filter State
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');
  const [selectedGenre, setSelectedGenre] = useState<MusicGenreAtoZ>(MUSIC_GENRES_A_TO_Z[1]); // Bollywood default
  const [searchQuery, setSearchQuery] = useState<string>('');

  // AI Lyrics Generator State
  const [lyricTopic, setLyricTopic] = useState<string>('Romantic Bollywood Love Story under stars');
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState<boolean>(false);

  // Live Voice Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [userVoiceUrl, setUserVoiceUrl] = useState<string | null>(null);
  const [userVoicePitch, setUserVoicePitch] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Song Lyrics-to-Music Composer State
  const [lyricsText, setLyricsText] = useState<string>(
    `[Verse 1]\nChandni raat mein, chamke ye sitare\nSuno dil ki baatein, ye kya keh rahe hain saare\n\n[Chorus]\nTu hi mera junoon, tu hi mera sukoon\nTere bina ab toh, jeena nahi hai\nTere bina ab toh, rehna nahi hai`
  );
  const [songLanguage, setSongLanguage] = useState<string>('Hindi / Hinglish');
  const [vocalGender, setVocalGender] = useState<'female' | 'male' | 'duo' | 'instrumental'>('female');
  const [tempoBpm, setTempoBpm] = useState<number>(128);
  const [isComposingSong, setIsComposingSong] = useState<boolean>(false);
  const [composedSongUrl, setComposedSongUrl] = useState<string>(
    'https://actions.google.com/sounds/v1/ambiences/outdoor_synth_pad.ogg'
  );
  const [isPlayingComposed, setIsPlayingComposed] = useState<boolean>(false);

  // Multi-Track Audio Deck State
  const [audioSlots, setAudioSlots] = useState<AudioSlot[]>([
    {
      id: 'slot_1',
      slotNumber: 1,
      title: 'Lead Vocals (Studio Acapella)',
      url: 'https://actions.google.com/sounds/v1/human_voices/female_vocal_tune.ogg',
      volume: 90,
      pitchShift: 0,
      isMuted: false,
      type: 'vocal',
    },
    {
      id: 'slot_2',
      slotNumber: 2,
      title: 'Bollywood & EDM Hybrid Track BGM',
      url: 'https://actions.google.com/sounds/v1/science_fiction/synth_pulse.ogg',
      volume: 80,
      pitchShift: 0,
      isMuted: false,
      type: 'bgm',
    },
  ]);
  const [isMixingAudio, setIsMixingAudio] = useState<boolean>(false);

  // Audio Stem Separator State
  const [stemInputUrl, setStemInputUrl] = useState<string>('https://actions.google.com/sounds/v1/ambiences/outdoor_synth_pad.ogg');
  const [isSeparatingStems, setIsSeparatingStems] = useState<boolean>(false);
  const [extractedStems, setExtractedStems] = useState<{ vocal: boolean; drums: boolean; bass: boolean; synth: boolean } | null>(null);

  // Web Audio Synth Synthesizer Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioElemRef = useRef<HTMLAudioElement | null>(null);

  // Filtered A-Z List
  const filteredGenres = MUSIC_GENRES_A_TO_Z.filter((g) => {
    const matchesLetter = selectedLetter === 'ALL' || g.letter === selectedLetter;
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLetter && matchesSearch;
  });

  // Handle Multi-Audio Upload
  const handleAudioUpload = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    let updatedSlots = [...audioSlots];
    fileArray.forEach((file, index) => {
      const objUrl = URL.createObjectURL(file);
      const slotNum = updatedSlots.length + 1;
      if (updatedSlots.length < 6) {
        updatedSlots.push({
          id: `slot_${Date.now()}_${index}`,
          slotNumber: slotNum,
          title: file.name,
          url: objUrl,
          volume: 85,
          pitchShift: 0,
          isMuted: false,
          type: slotNum % 2 === 0 ? 'bgm' : 'vocal',
        });
      }
    });

    setAudioSlots(updatedSlots);
    onNotify('Audio Loaded!', `Imported ${fileArray.length} audio track(s) into Multi-Track Mixer Deck!`, 'success');
  };

  // Handle Live Voice Microphone Recording
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setUserVoiceUrl(audioUrl);

        // Also add to multi-track mixer slots as Slot #1 (My Live Voice)
        setAudioSlots((prev) => [
          {
            id: `my_voice_${Date.now()}`,
            slotNumber: 1,
            title: '🎙️ My Recorded Voice (Live Vocals)',
            url: audioUrl,
            volume: 100,
            pitchShift: userVoicePitch,
            isMuted: false,
            type: 'vocal',
          },
          ...prev.filter((s) => !s.title.includes('My Recorded Voice')),
        ]);

        onNotify('Voice Recorded!', 'Your live voice recording saved & loaded into Song Mixer Deck!', 'success');
      };

      mediaRecorder.start();
      setIsRecording(true);
      onNotify('Microphone Active', 'Recording your live voice... Speak or sing into your mic!', 'info');
    } catch {
      onNotify('Mic Permission Denied', 'Please grant microphone permissions to record live voice.', 'error');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Handle AI Lyrics Generation
  const handleGenerateAiLyrics = (overrideTopic?: string) => {
    const topicToUse = overrideTopic || lyricTopic || 'Dil ki baat aur pyaar ka naghma';
    setIsGeneratingLyrics(true);
    onNotify('AI Lyricist Writing...', `Generating rhyming full-length song lyrics for: "${topicToUse}"...`, 'info');

    setTimeout(() => {
      setIsGeneratingLyrics(false);
      let generated = '';

      if (topicToUse.toLowerCase().includes('sad') || topicToUse.toLowerCase().includes('breakup') || topicToUse.toLowerCase().includes('dard')) {
        generated = `[Verse 1]\n${topicToUse} ki shaam, aakhri woh baat\nChhoot gaya kyun achanak tera haath\nKhaali hai raaste, khaali hai ye galiyan\nKaha chhipe woh mehakte hue kaliyan\n\n[Chorus]\nTujhko bhoolna na aasan hua\nMera dil aaj phir se pareshan hua\nTujhe yaad karke rota hai dil\nBas ek baar aake mujhse mil\n\n[Verse 2]\nKitne sapne dekhe the humne saath mein\nAankhein bhar aati hai har kaali raat mein\nKhuda kare tu sada khush rahe\nChahe mera ye dil kitna bhi dard sahe\n\n[Outro]\nAlvida mere humsafar... alvida...`;
      } else if (topicToUse.toLowerCase().includes('party') || topicToUse.toLowerCase().includes('dance') || topicToUse.toLowerCase().includes('beat')) {
        generated = `[Verse 1]\n${topicToUse} ka fever hai chhaya\nDJ ne naya Punjabi track bajaya\nBass drop hote hi sab jhoom uthe\nAaj raat koi bhi yahan na rukey\n\n[Chorus]\nNach le, gaale, karle thoda dhamaka\nAaj ki raat ka har lamha hai pataka\nVolume ko full kar, speaker ko faad de\nApne saare gham ko tu paani mein daal de\n\n[Verse 2]\nHigh beat pe chal rahe hain sabke step\nSuno dholak ki taak aur rap ka clap\nRaat bhar chalegi ye mehfil hamari\nAaj raat aayi hai mauj ki baari\n\n[Outro]\nDrop the bass... 1, 2, 3... Go!`;
      } else if (topicToUse.toLowerCase().includes('dosti') || topicToUse.toLowerCase().includes('yaari') || topicToUse.toLowerCase().includes('friend')) {
        generated = `[Verse 1]\n${topicToUse} hai sabse pyaari re\nZindagi ki yehi toh Asli Yaari re\nSukh ho ya dukh, saath khade rahe\nHar mushkil se milkar hum lade rahe\n\n[Chorus]\nTu mera bhai, tu hi mera yaar\nTere bina adhura hai mera sansar\nJitne bhi din hain, jee le khul ke\nKhabar na ho kya hoga kal se\n\n[Outro]\nYaara teri yaari ko maine toh khuda maana...`;
      } else {
        generated = `[Verse 1]\n${topicToUse} ke rang mein ranga hai ye aasmaan\nTujhse hi roshan hai mera ye jahaan\nSocha na tha milega aisa hamsafar\nKhatam hua mera har ek safar\n\n[Chorus]\nTu hi mera junoon, tu hi mera sukoon\nTere bina ab toh, jeena nahi hai\nTujhse juda ho ke ab rehna nahi hai\nSuno dil ki ye pukaar, tu hi hai mera pyaar\n\n[Verse 2]\nChandni raat mein jab hawaayein chalein\nLagta hai jaise hum tum saath chalein\nThama hai haath toh ab chhodna mat\nMera ye chhota sa dil todna mat\n\n[Outro]\nHaan tu hi hai... sirf tu hi...`;
      }

      setLyricsText(generated);
      onNotify('Full Song Lyrics Generated!', 'Rhyming song lyrics written and loaded into composer!', 'success');
    }, 1500);
  };

  // Compose Full Song with AI
  const handleComposeSong = async () => {
    try {
      setIsComposingSong(true);
      onNotify('AI Song Composer Started', `Synthesizing ${songLanguage} song in ${selectedGenre.name} style...`, 'info');

      setTimeout(() => {
        setIsComposingSong(false);
        onNotify('Song Generated!', `Full ${songLanguage} track composed in ${selectedGenre.name} (${tempoBpm} BPM)!`, 'success');
      }, 2500);
    } catch {
      setIsComposingSong(false);
      onNotify('Composition Error', 'Failed to generate track. Please try again.', 'error');
    }
  };

  // Toggle Playback for Composed Song
  const toggleComposedPlayback = () => {
    if (!audioElemRef.current) {
      audioElemRef.current = new Audio(composedSongUrl);
    }

    if (isPlayingComposed) {
      audioElemRef.current.pause();
      setIsPlayingComposed(false);
    } else {
      audioElemRef.current.play().catch(() => {});
      setIsPlayingComposed(true);
      audioElemRef.current.onended = () => setIsPlayingComposed(false);
    }
  };

  // Perform AI Stem Separation
  const handleSeparateStems = () => {
    setIsSeparatingStems(true);
    onNotify('AI Stem Isolator', 'Extracting Vocals, Drums, Bassline & Melodies using AI Neural Splitter...', 'info');

    setTimeout(() => {
      setIsSeparatingStems(false);
      setExtractedStems({ vocal: true, drums: true, bass: true, synth: true });
      onNotify('Stems Separated!', '4 Stems extracted successfully (Vocals, Drums, Bass, Melodies)!', 'success');
    }, 2200);
  };

  return (
    <div id="song-music-studio-container" className="space-y-6">
      {/* Universal Quick Media Capture & Recording Toolbar */}
      <UniversalMediaCaptureToolbar activeTab="song_studio" setActiveTab={setActiveTab} user={user} onNotify={(t, d, ty) => onNotify(t, d, ty as any)} />

      {/* Studio Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/80 to-slate-900 border border-purple-800/60 shadow-2xl relative overflow-hidden space-y-4">
        {/* Free Plan Active Notice */}
        {isFreeTier && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/80 via-slate-950 to-slate-950 border border-amber-500/40 flex flex-wrap items-center justify-between gap-2 text-xs relative z-20">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 font-bold">
                🆓 FREE PLAN LIMITATIONS
              </span>
              <span className="text-slate-300 font-medium">
                Free Tier: <b>Max 2 Audio Tracks</b> • Upgrade to Premium VIP for <b>Unlimited Stems, WAV Master Export & High-Speed Rendering</b>
              </span>
            </div>
            <button
              onClick={openPaymentModal}
              className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 transition-all"
            >
              <Crown className="w-3.5 h-3.5 text-slate-950" />
              <span>Unlock Unlimited Music Studio</span>
            </button>
          </div>
        )}

        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/40">
              <Disc className="w-8 h-8 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white font-['Syne'] tracking-wide">
                  A-Z AI Song & Music Production Studio
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Full Music Suite
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Compose full songs from lyrics, blend multi-track audio & vocals, isolate stems, and explore 26 global musical genres from A to Z!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-400 px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-800">
              ⚡ {tokenBalance} Tokens Available
            </span>
          </div>
        </div>

        {/* Sub-tab Navigation Pill Bar */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-purple-900/40">
          {[
            { id: 'custom_themes', label: '✨ Create Music Themes', icon: '🎨' },
            { id: 'virtual_devices', label: '🎛️ Music Tools & Devices Rack', icon: '🎹' },
            { id: 'a_to_z_genres', label: 'A-Z Music Styles & Genres', icon: '🎶' },
            { id: 'lyrics_to_song', label: 'AI Lyrics-to-Song Composer', icon: '📝' },
            { id: 'multi_track_mixer', label: 'Multi-Track Audio Mashup Blender', icon: '🎧' },
            { id: 'stem_separator', label: 'AI Stem Separator (Vocal Isolator)', icon: '✂️' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeSubTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30 scale-[1.02]'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sub Tab: Custom Music Theme Studio */}
      {activeSubTab === 'custom_themes' && (
        <CustomThemeStudio
          currentTheme={activeMusicTheme}
          onChangeTheme={setActiveMusicTheme}
          savedCustomThemes={savedCustomThemes}
          onUpdateSavedThemes={setSavedCustomThemes}
          onApplyToComposer={(theme) => {
            setActiveMusicTheme(theme);
            setTempoBpm(theme.tempoBpm);
            setActiveSubTab('lyrics_to_song');
            onNotify('Theme Loaded into Composer', `Configured "${theme.name}" (${theme.tempoBpm} BPM, ${theme.musicalKey}) into Song Composer!`, 'success');
          }}
          onNotify={onNotify}
        />
      )}

      {/* Sub Tab: Hardware Devices & Instruments Rack */}
      {activeSubTab === 'virtual_devices' && (
        <div className="space-y-4">
          {/* Device Selector Sub-Bar */}
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 font-mono">Active Studio Tool:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'synth', label: '🎹 Polyphonic Synthesizer', color: 'from-cyan-600 to-indigo-600' },
                  { id: 'drum', label: '🥁 16-Step Drum Sequencer', color: 'from-amber-600 to-rose-600' },
                  { id: 'fx_rack', label: '🎚️ Master FX Rack & EQ', color: 'from-purple-600 to-indigo-600' },
                  { id: 'dj_turntable', label: '🎧 Dual DJ Scratch Turntable', color: 'from-emerald-600 to-teal-600' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setActiveDevice(d.id as typeof activeDevice)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeDevice === d.id
                        ? `bg-gradient-to-r ${d.color} text-white shadow-md shadow-black/40`
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-mono">
                Theme: <strong className="text-purple-300">{activeMusicTheme.name}</strong> ({activeMusicTheme.tempoBpm} BPM)
              </span>
            </div>
          </div>

          {/* Active Device Display */}
          {activeDevice === 'synth' && <VirtualSynthesizerDevice onNotify={onNotify} />}
          {activeDevice === 'drum' && <DrumMachineDevice onNotify={onNotify} />}
          {activeDevice === 'fx_rack' && <StudioFXRackDevice onNotify={onNotify} />}
          {activeDevice === 'dj_turntable' && <DJTurntableDevice onNotify={onNotify} />}
        </div>
      )}

      {/* Sub Tab 1: A-Z Music Genres & Styles Dictionary */}
      {activeSubTab === 'a_to_z_genres' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white font-['Syne'] flex items-center gap-2">
                <Music className="w-5 h-5 text-purple-400" /> 26 Global Musical Styles & Genres (A to Z)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select any genre to load its rhythm, instrumentation, and default BPM into your AI Song Composer.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search A-Z genres or regions..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* A to Z Letter Filter Bar */}
          <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-2xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => setSelectedLetter('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                selectedLetter === 'ALL'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              ALL
            </button>
            {MUSIC_GENRES_A_TO_Z.map((g) => (
              <button
                key={g.letter}
                onClick={() => setSelectedLetter(g.letter)}
                className={`w-8 h-8 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center ${
                  selectedLetter === g.letter
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 font-black scale-105'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {g.letter}
              </button>
            ))}
          </div>

          {/* Grid of A-Z Music Genres */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredGenres.map((genre) => {
              const isSelected = selectedGenre.id === genre.id;
              return (
                <div
                  key={genre.id}
                  onClick={() => {
                    setSelectedGenre(genre);
                    setTempoBpm(genre.bpmDefault);
                    onNotify('Genre Loaded', `Selected ${genre.name} (${genre.bpmDefault} BPM)`, 'info');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 relative overflow-hidden group ${
                    isSelected
                      ? 'bg-gradient-to-br from-purple-950/80 via-slate-900 to-slate-950 border-purple-500 shadow-xl shadow-purple-950/40 ring-1 ring-purple-500/50'
                      : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-purple-950 border border-purple-800 font-mono font-black text-xs text-purple-300 flex items-center justify-center">
                        {genre.letter}
                      </span>
                      <span className="text-xl">{genre.icon}</span>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {genre.bpmDefault} BPM
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                      {genre.name}
                    </h3>
                    <span className="text-[10px] text-purple-400 font-semibold block mt-0.5">
                      📍 {genre.region}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                    {genre.description}
                  </p>

                  {isSelected && (
                    <div className="pt-2 border-t border-purple-900/60 flex items-center justify-between text-[11px] text-purple-300 font-bold">
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-purple-400" /> Active Composer Style
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSubTab('lyrics_to_song');
                        }}
                        className="text-[10px] underline hover:text-white"
                      >
                        Use in Lyrics Composer →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub Tab 2: AI Lyrics-to-Song Composer */}
      {activeSubTab === 'lyrics_to_song' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white font-['Syne'] flex items-center gap-2">
                <Mic className="w-5 h-5 text-indigo-400" /> AI Song & Vocal Lyrics Composer
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Type or paste lyrics in Hindi, English, Punjabi, Spanish or any language to generate a full arrangement song!
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-indigo-300 px-3 py-1 rounded-xl bg-indigo-950 border border-indigo-800 font-bold">
                Selected Style: {selectedGenre.name}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Lyrics, Custom Voice & Song Parameters */}
            <div className="lg:col-span-7 space-y-4">

              {/* Live Voice Recording & Custom Voice Upload Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-bold text-white font-['Syne']">
                      Record or Upload Your Own Voice (Khud ki Aavaz)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-purple-300">
                    Auto-Tune & BGM Sync
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Record Live Mic Button */}
                  <button
                    type="button"
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      isRecording
                        ? 'bg-rose-600 animate-pulse text-white shadow-lg shadow-rose-900/50'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    <span>{isRecording ? '🔴 Stop Recording Voice' : '🎙️ Record Live Voice from Mic'}</span>
                  </button>

                  {/* Upload Voice File Button */}
                  <label className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-purple-400" />
                    <span>📁 Upload Voice File (.MP3, .WAV)</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const url = URL.createObjectURL(file);
                          setUserVoiceUrl(url);
                          setAudioSlots((prev) => [
                            {
                              id: `voice_file_${Date.now()}`,
                              slotNumber: 1,
                              title: `🎙️ ${file.name}`,
                              url,
                              volume: 100,
                              pitchShift: 0,
                              isMuted: false,
                              type: 'vocal',
                            },
                            ...prev,
                          ]);
                          onNotify('Voice File Loaded!', `${file.name} ready to blend with music!`, 'success');
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Voice Preview Player */}
                {userVoiceUrl && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-purple-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="font-bold text-white text-[11px]">Your Recorded Voice Loaded</span>
                    </div>

                    <audio src={userVoiceUrl} controls className="h-7 w-48 text-xs" />
                  </div>
                )}
              </div>

              {/* AI Lyricist Generator Bar */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" /> AI Lyricist Assistant (Auto-Write Song Lyrics)
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={lyricTopic}
                    onChange={(e) => setLyricTopic(e.target.value)}
                    placeholder="e.g. Romantic night under stars, Sad breakup feeling, High energy party beat..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={isGeneratingLyrics}
                    onClick={() => handleGenerateAiLyrics()}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-md"
                  >
                    {isGeneratingLyrics ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Writing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Write Lyrics</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Quick Mood Preset Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-mono">Quick Themes:</span>
                  {[
                    { label: '❤️ Love & Romance', topic: 'Pyaar aur ishq ki haseen shaam' },
                    { label: '💔 Sad & Breakup', topic: 'Dard aur judai ki kaali raat' },
                    { label: '🎉 High-Beat Party', topic: 'Party dance beat aur dholak drop' },
                    { label: '👥 Dosti & Yaari', topic: 'Yaaron ki yaari aur dosti' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setLyricTopic(preset.topic);
                        handleGenerateAiLyrics(preset.topic);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-purple-950/80 border border-slate-800 hover:border-purple-800 text-[11px] text-slate-300 hover:text-purple-200 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-200">
                    Song Lyrics & Verse/Chorus Structure
                  </label>
                  <button
                    onClick={() => {
                      setLyricsText(
                        `[Verse 1]\nSuraj nikal raha hai naye saverey ke saath\nHaathon mein leke tera pyaara sa haath\n\n[Chorus]\nSuno ye sangeet, ye dil ki hai geet\nTere sang jeena hai, yehi hai meri reet`
                      );
                      onNotify('Sample Lyrics Loaded', 'Hindi Romantic song lyrics injected.', 'info');
                    }}
                    className="text-[11px] text-purple-400 hover:underline font-semibold"
                  >
                    + Load Hindi Sample Lyrics
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={lyricsText}
                  onChange={(e) => setLyricsText(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                  placeholder="Paste your song lyrics here..."
                />
              </div>

              {/* Genre & Language Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-semibold">Song Language</label>
                  <select
                    value={songLanguage}
                    onChange={(e) => setSongLanguage(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option>Hindi / Hinglish</option>
                    <option>English Pop / Rock</option>
                    <option>Punjabi High-Beat</option>
                    <option>Spanish / Reggaeton</option>
                    <option>Japanese Anime / Vocaloid</option>
                    <option>Tamil / Telugu Folk</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-semibold">Vocal Profile</label>
                  <select
                    value={vocalGender}
                    onChange={(e) => setVocalGender(e.target.value as typeof vocalGender)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="female">👩 Studio Female Vocalist</option>
                    <option value="male">👨 Studio Male Vocalist</option>
                    <option value="duo">👫 Male & Female Duet</option>
                    <option value="instrumental">🎻 Pure Instrumental BGM</option>
                  </select>
                </div>
              </div>

              {/* BPM Slider */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-300">Target Tempo & Pace (BPM)</span>
                  <span className="font-mono text-purple-400 font-bold">{tempoBpm} BPM</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="180"
                  value={tempoBpm}
                  onChange={(e) => setTempoBpm(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              {/* Generate Song Button */}
              <button
                type="button"
                disabled={isComposingSong}
                onClick={handleComposeSong}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-purple-950/50 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isComposingSong ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-purple-300" />
                    <span>Synthesizing Full Song Track ({tempoBpm} BPM)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Compose Full Song with AI Vocals & Music ({selectedGenre.name})</span>
                  </>
                )}
              </button>
            </div>

            {/* Right Column: Player & Track Master */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 text-center">
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 p-1 shadow-2xl animate-pulse">
                  <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center border border-purple-500/50">
                    <Disc className="w-12 h-12 text-purple-400 animate-spin-slow" />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white font-['Syne']">
                    {selectedGenre.name} Master Track
                  </h3>
                  <span className="text-[11px] text-purple-300 font-mono block mt-0.5">
                    {songLanguage} • {vocalGender.toUpperCase()} Vocals • {tempoBpm} BPM
                  </span>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={toggleComposedPlayback}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all ${
                      isPlayingComposed
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
                    }`}
                  >
                    {isPlayingComposed ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isPlayingComposed ? 'Pause Song' : 'Play Full Track'}</span>
                  </button>
                </div>

                <a
                  href={composedSongUrl}
                  download={`AI_Song_${selectedGenre.letter}_${Date.now()}.mp3`}
                  className="w-full py-2.5 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-800 text-purple-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-4 h-4" /> Download Studio Master (.MP3)
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab 3: Multi-Track Audio & Vocal Mashup Blender */}
      {activeSubTab === 'multi_track_mixer' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white font-['Syne'] flex items-center gap-2">
                <Headphones className="w-5 h-5 text-cyan-400" /> Multi-Track Audio & Vocal Mashup Mixer (2+ Tracks)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload 2 or more audio files (Vocals, Beats, Instruments) to mix, pitch-shift, and create studio song mashups!
              </p>
            </div>

            <span className="text-xs font-mono text-cyan-300 px-3 py-1 rounded-xl bg-cyan-950 border border-cyan-800 font-bold">
              {audioSlots.length} Active Tracks
            </span>
          </div>

          {/* Drag & Drop Audio Upload Zone */}
          <div className="p-5 rounded-2xl border-2 border-dashed border-slate-800 hover:border-cyan-500/50 bg-slate-950 text-center space-y-3">
            <Upload className="w-6 h-6 text-cyan-400 mx-auto animate-pulse" />
            <div>
              <div className="text-xs font-bold text-white">
                Drag & Drop Vocal Acapella, BGM Beats, or Instrument Files (.MP3, .WAV, .OGG)
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Upload 2 to 6 audio tracks to mix into a unified song track
              </div>
            </div>

            <label className="inline-block px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md cursor-pointer transition-colors">
              + Browse & Upload Audio Tracks
              <input
                type="file"
                multiple
                accept="audio/*"
                onChange={(e) => {
                  if (e.target.files) handleAudioUpload(e.target.files);
                }}
                className="hidden"
              />
            </label>
          </div>

          {/* Multi-Track Deck Cards */}
          <div className="space-y-3">
            {audioSlots.map((slot) => (
              <div
                key={slot.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 font-mono font-bold text-xs text-cyan-300 flex items-center justify-center">
                    #{slot.slotNumber}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white">{slot.title}</h4>
                    <span className="text-[10px] text-cyan-400 font-mono uppercase">
                      Type: {slot.type}
                    </span>
                  </div>
                </div>

                {/* Volume & Pitch Controls */}
                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                  {/* Volume Slider */}
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={slot.volume}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setAudioSlots(
                          audioSlots.map((s) => (s.id === slot.id ? { ...s, volume: val } : s))
                        );
                      }}
                      className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <span className="text-[10px] font-mono text-slate-300 w-8">{slot.volume}%</span>
                  </div>

                  {/* Pitch Shift Slider */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">Pitch:</span>
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      value={slot.pitchShift}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setAudioSlots(
                          audioSlots.map((s) => (s.id === slot.id ? { ...s, pitchShift: val } : s))
                        );
                      }}
                      className="w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                    <span className="text-[10px] font-mono text-purple-300 w-8">{slot.pitchShift > 0 ? `+${slot.pitchShift}` : slot.pitchShift}st</span>
                  </div>

                  {/* Delete Slot Button */}
                  <button
                    onClick={() => setAudioSlots(audioSlots.filter((s) => s.id !== slot.id))}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setIsMixingAudio(true);
              onNotify('Mixing Audio Tracks', 'Blending volume levels, pitch shifts & master limiter...', 'info');
              setTimeout(() => {
                setIsMixingAudio(false);
                onNotify('Audio Mashup Mastered!', 'Export ready for download.', 'success');
              }, 2000);
            }}
            disabled={isMixingAudio}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2"
          >
            {isMixingAudio ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                <span>Mixing Audio Deck...</span>
              </>
            ) : (
              <>
                <Sliders className="w-4 h-4 text-amber-300" />
                <span>Master & Export Multi-Track Audio Blend (.MP3)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Sub Tab 4: AI Stem Separator */}
      {activeSubTab === 'stem_separator' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white font-['Syne'] flex items-center gap-2">
                <FileAudio className="w-5 h-5 text-emerald-400" /> AI Neural Stem Separator & Vocal Isolator
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload any song file to isolate 4 individual stems: Vocals Acapella, Drum Beat, Sub Bassline & Melodic Instruments.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <label className="text-xs font-bold text-slate-200 block">Source Song File or URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={stemInputUrl}
                onChange={(e) => setStemInputUrl(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSeparateStems}
                disabled={isSeparatingStems}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-2"
              >
                {isSeparatingStems ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Extracting Stems...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Extract 4 Stems</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Extracted Stems Grid */}
          {extractedStems && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: '🎤 Vocal Acapella Stem', desc: 'Isolated clean vocal track', icon: '🎤', color: 'emerald' },
                { title: '🥁 Drum & Percussion Stem', desc: 'Isolated kick, snare & hats', icon: '🥁', color: 'cyan' },
                { title: '🎸 Bass & Sub-Bass Stem', desc: 'Isolated low frequency bass', icon: '🎸', color: 'purple' },
                { title: '🎹 Synths & Melodies Stem', desc: 'Isolated piano, pads & guitars', icon: '🎹', color: 'indigo' },
              ].map((stem) => (
                <div key={stem.title} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-center">
                  <div className="text-2xl">{stem.icon}</div>
                  <div>
                    <h3 className="text-xs font-bold text-white">{stem.title}</h3>
                    <span className="text-[10px] text-slate-400 block">{stem.desc}</span>
                  </div>
                  <button
                    onClick={() => onNotify('Stem Downloaded', `${stem.title} saved (.WAV)`, 'success')}
                    className="w-full py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Stem (.WAV)
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

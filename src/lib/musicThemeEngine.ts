// Music Theme & Sound Engine with Real Web Audio Synthesis
export interface CustomMusicTheme {
  id: string;
  name: string;
  hindiName: string;
  icon: string;
  genreCategory: string; // EDM, Bollywood, Lo-Fi, Hip-Hop, Sufi, Rock, Ambient, Vedic, Cyberpunk, Metal, Folk, Classical
  tempoBpm: number;
  musicalKey: string; // C Major, A Minor, D Dorian, Raag Bhairavi, etc.
  scaleType: 'major' | 'minor' | 'dorian' | 'phrygian' | 'pentatonic' | 'ragas' | 'blues' | 'oriental';
  moodTag: string; // Energetic, Romantic, Melancholic, Mystical, Dark Cyber, Chill Euphoric
  leadInstrument: string; // Sitar, Supersaw Synth, Electric Guitar, Bansuri Flute, Acoustic Piano, Saxophone, Pluck
  bassType: string; // Deep 808 Sub, Acid 303, Slap Funk, Upright Acoustic, Reese Bass
  rhythmStyle: string; // Punjabi Dholak, 4-on-Floor EDM, Trap Roll, Lo-Fi Swing, Latin Congas, Taiko Drums
  atmosphereFx: string; // Vinyl Crackle, Rain Ambience, Tape Flutter, Cosmic Sweep, Vedic Drone
  colorGradient: string; // CSS gradient for visual identity
  description: string;
  isCustom: boolean;
  createdAt?: string;
}

export const PRESET_MUSIC_THEMES: CustomMusicTheme[] = [
  {
    id: 'theme_bollywood_edm',
    name: 'Bollywood Future EDM Fusion',
    hindiName: 'बॉलीवुड ईडीएम ड्रॉप',
    icon: '🪘',
    genreCategory: 'Bollywood & EDM',
    tempoBpm: 128,
    musicalKey: 'D Minor',
    scaleType: 'minor',
    moodTag: 'Energetic & Celebration',
    leadInstrument: 'Indian Shehnai & Supersaw Lead',
    bassType: 'Deep 808 Sub + Sidechain Bass',
    rhythmStyle: 'Punjabi Dholak + 4/4 EDM Kick',
    atmosphereFx: 'Crowd Cheers & Synth Laser Risers',
    colorGradient: 'from-amber-600 via-rose-600 to-purple-600',
    description: 'High octane fusion of Indian folk dholak groove with festival EDM drops and euphoric synth horns.',
    isCustom: false,
  },
  {
    id: 'theme_lofi_midnight',
    name: 'Lo-Fi Midnight Coffee Chai',
    hindiName: 'लो-फाई मिडनाइट कैफे',
    icon: '☕',
    genreCategory: 'Lo-Fi & Chillhop',
    tempoBpm: 82,
    musicalKey: 'F Major 7th',
    scaleType: 'pentatonic',
    moodTag: 'Peaceful & Relaxing Study',
    leadInstrument: 'Vintage Rhodes Electric Piano & Nylon Guitar',
    bassType: 'Warm Muffled Bassline',
    rhythmStyle: 'Dusty Boom-Bap Swing with Shaker',
    atmosphereFx: 'Cassette Tape Flutter & Raindrops on Window',
    colorGradient: 'from-emerald-700 via-teal-800 to-slate-900',
    description: 'Warm analog tape saturation with mellow jazzy keys and relaxing late-night atmosphere.',
    isCustom: false,
  },
  {
    id: 'theme_sufi_mystic',
    name: 'Sufi & Qawwali Mystic Soul',
    hindiName: 'सूफी कव्वाली रूहानी धुन',
    icon: '🪔',
    genreCategory: 'Sufi & Classical',
    tempoBpm: 92,
    musicalKey: 'Raag Bhairavi (C# Minor)',
    scaleType: 'ragas',
    moodTag: 'Deep Devotional & Soulful',
    leadInstrument: 'Harmonium & Sarangi Glissando',
    bassType: 'Acoustic Drone Tanpura Sub',
    rhythmStyle: 'Live Tabla Teentaal & Rhythmic Hand Claps',
    atmosphereFx: 'Temple Reverb Wash & Incense Smoke Drone',
    colorGradient: 'from-amber-700 via-orange-800 to-yellow-900',
    description: 'Transcendent Sufi trance with expressive harmonium sweeps, sarangi, and passionate rhythm.',
    isCustom: false,
  },
  {
    id: 'theme_cyber_synthwave',
    name: 'Cyberpunk Neon Outrun 1984',
    hindiName: 'साइबरपंक नियॉन 80s',
    icon: '⚡',
    genreCategory: 'Synthwave & Cyberpunk',
    tempoBpm: 120,
    musicalKey: 'A Minor',
    scaleType: 'minor',
    moodTag: 'Futuristic & Adrenaline Drive',
    leadInstrument: 'Analog Moog Lead & 80s Arpeggiator',
    bassType: 'Pumping Acid 303 Rolling Bass',
    rhythmStyle: 'Gated Reverb LinnDrum Snare & Kick',
    atmosphereFx: 'Laser Sweeps & Cyber City Ambience',
    colorGradient: 'from-cyan-600 via-purple-600 to-pink-600',
    description: 'Retro-futuristic analog synthesizers inspired by Blade Runner, neon highways, and 80s arcade drives.',
    isCustom: false,
  },
  {
    id: 'theme_punjabi_drill',
    name: 'Punjabi 808 Trap Drill Beat',
    hindiName: 'पंजाबी 808 ट्रैप ड्रिल',
    icon: '🎤',
    genreCategory: 'Hip-Hop & Trap',
    tempoBpm: 140,
    musicalKey: 'G Minor',
    scaleType: 'minor',
    moodTag: 'Aggressive & Street Gangsta',
    leadInstrument: 'Tumbi & Sitar Fast Stabs',
    bassType: 'Sliding 808 Sub-Bass Glides',
    rhythmStyle: 'Drill Snare, Skittering Triplets Hi-Hats & Dhol',
    atmosphereFx: 'Gun Cocking FX & Dark Reverb Plucks',
    colorGradient: 'from-red-700 via-zinc-900 to-neutral-950',
    description: 'Modern UK/Toronto Punjabi Drill rhythm combining traditional Tumbi hooks with heavy sliding sub-bass.',
    isCustom: false,
  },
  {
    id: 'theme_vedic_ambient',
    name: 'Vedic 432Hz Himalayan Solfeggio',
    hindiName: 'वैदिक 432Hz हीलिंग ध्यान',
    icon: '🧘',
    genreCategory: 'Ambient & Meditation',
    tempoBpm: 60,
    musicalKey: '432Hz Om Drone (D Sacred)',
    scaleType: 'pentatonic',
    moodTag: 'Chakra Balancing & Spiritual Peace',
    leadInstrument: 'Bansuri Flute & Tibetan Singing Bowls',
    bassType: 'Sub-Sonic Resonant Om Drone',
    rhythmStyle: 'Gentle Wind Chimes & Zero-Percussion Flow',
    atmosphereFx: 'Himalayan Breeze & Singing Bowl Harmonics',
    colorGradient: 'from-indigo-800 via-purple-900 to-slate-950',
    description: 'Sacred Solfeggio 432Hz and 528Hz healing frequencies with Indian bamboo flute and continuous meditation drones.',
    isCustom: false,
  },
  {
    id: 'theme_cinematic_score',
    name: 'Hollywood Epic Cinematic Trailer',
    hindiName: 'हॉलीवुड सिनेमैटिक स्कोर',
    icon: '🎬',
    genreCategory: 'Cinematic Orchestral',
    tempoBpm: 105,
    musicalKey: 'C Minor',
    scaleType: 'minor',
    moodTag: 'Grand, Heroic & Dramatic',
    leadInstrument: 'French Horns & Full Symphony Strings',
    bassType: 'Orchestral Taiko Sub-Impacts & Braam Hits',
    rhythmStyle: 'Marching Taiko Drums & Anvil Clangs',
    atmosphereFx: 'Sub-Drop Booms & Epic Trailer Risers',
    colorGradient: 'from-yellow-600 via-stone-800 to-stone-950',
    description: 'Hans Zimmer style massive trailer cues with explosive brass, ticking tension strings, and earth-shaking sub-hits.',
    isCustom: false,
  },
  {
    id: 'theme_afro_amapiano',
    name: 'Amapiano Log-Drum Lagos Groove',
    hindiName: 'अमापियानो लाग-ड्रम (अफ्रीकी ग्रूव)',
    icon: '🥁',
    genreCategory: 'Afrobeat & Amapiano',
    tempoBpm: 114,
    musicalKey: 'E Major',
    scaleType: 'major',
    moodTag: 'Vibrant, Danceable & Soulful',
    leadInstrument: 'Jazzy Saxophone & Upbeat Piano Stabs',
    bassType: 'Punchy South African Log-Drum Bass',
    rhythmStyle: 'Syncopated Shakers & Rimshot Woodblocks',
    atmosphereFx: 'Lagos Street Ambiance & Vocal Chants',
    colorGradient: 'from-orange-600 via-amber-600 to-emerald-800',
    description: 'Soulful deep house fusion from South Africa with iconic pitched log-drum bass drops and joyful melodies.',
    isCustom: false,
  },
  {
    id: 'theme_latin_reggaeton',
    name: 'Latin Reggaeton & Caribbean Dembow',
    hindiName: 'लैटिन रेगेटन व कैरेबियन डेमबो',
    icon: '🌴',
    genreCategory: 'Pop & Latin Dance',
    tempoBpm: 96,
    musicalKey: 'G Minor',
    scaleType: 'minor',
    moodTag: 'Carnival, Seductive & Party',
    leadInstrument: 'Nylon Flamenco Guitar & Synth Plucks',
    bassType: 'Heavy 808 Caribbean Sub Bass',
    rhythmStyle: 'Classic 3-3-2 Dembow Beat & Congas',
    atmosphereFx: 'Ocean Waves, Festival Air Horns & Shakers',
    colorGradient: 'from-rose-600 via-orange-600 to-amber-700',
    description: 'Energetic Puerto Rican & Colombian Latin urban groove featuring the infectious Dembow beat and acoustic Spanish guitars.',
    isCustom: false,
  },
  {
    id: 'theme_kpop_cyberpunk',
    name: 'K-Pop & Tokyo Cyber Idol Groove',
    hindiName: 'के-पॉप व टोक्यो साइबर आइडल',
    icon: '🌸',
    genreCategory: 'Pop & Latin Dance',
    tempoBpm: 126,
    musicalKey: 'C Major',
    scaleType: 'major',
    moodTag: 'Futuristic, High-Energy & Sweet',
    leadInstrument: 'Sparkling Digital Synth Chimes & Plucks',
    bassType: 'Future Bass Saw Pluck Bass & Punchy Sub',
    rhythmStyle: 'Dynamic Trap Rolls & 4/4 Pop Snare Drop',
    atmosphereFx: 'Shinjuku Neon Rain & Vocoder Chants',
    colorGradient: 'from-pink-500 via-purple-600 to-cyan-500',
    description: 'High-production Seoul and Tokyo chart sound with explosive drops, shimmering synth arpeggios, and cheerful melodies.',
    isCustom: false,
  },
  {
    id: 'theme_arabic_oud',
    name: 'Middle Eastern Desert Oud & Maqam',
    hindiName: 'अरबी ऊद व रेगिस्तानी मक़ाम',
    icon: '🕌',
    genreCategory: 'Custom Fusion',
    tempoBpm: 104,
    musicalKey: 'Maqam Bayati (D Half-Flat)',
    scaleType: 'oriental',
    moodTag: 'Mysterious, Royal & Exotic',
    leadInstrument: 'Oud Strings & Kanun Tremolo Solo',
    bassType: 'Deep Resonance Acoustic Frame Sub',
    rhythmStyle: 'Darbuka Riq Drum & Arabian Claps',
    atmosphereFx: 'Desert Wind Whistle & Caravan Chimes',
    colorGradient: 'from-amber-600 via-yellow-700 to-stone-900',
    description: 'Enchanting Arabian Desert landscape melodies using traditional microtonal Maqam scales, resonant Oud, and Darbuka percussion.',
    isCustom: false,
  },
  {
    id: 'theme_celtic_irish',
    name: 'Celtic Highland Fiddle & Irish Folk',
    hindiName: 'सेल्टिक आयरिश हाइलैंड लोकधुन',
    icon: '🍀',
    genreCategory: 'Custom Fusion',
    tempoBpm: 118,
    musicalKey: 'G Major / D Mixolydian',
    scaleType: 'major',
    moodTag: 'Joyful, Spirited & Epic',
    leadInstrument: 'Irish Tin Whistle, Fiddle & Celtic Harp',
    bassType: 'Acoustic Upright Folk Bass',
    rhythmStyle: 'Bodhrán Irish Frame Drum & Foot Stomp',
    atmosphereFx: 'Emerald Highland Mist & Pub Cheers',
    colorGradient: 'from-emerald-700 via-teal-800 to-green-950',
    description: 'Spirited Gaelic melodies with fast Irish tin whistle runs, rhythmic Bodhrán beats, and joyful dance jigs.',
    isCustom: false,
  },
  {
    id: 'theme_bossa_nova',
    name: 'Brazilian Bossa Nova & Ipanema Jazz',
    hindiName: 'ब्राज़ीलियन बोसा नोवा जैज़',
    icon: '🏖️',
    genreCategory: 'Lo-Fi & Chillhop',
    tempoBpm: 110,
    musicalKey: 'D Major 7th',
    scaleType: 'pentatonic',
    moodTag: 'Breezy, Sophisticated & Sunset',
    leadInstrument: 'Warm Nylon Guitar & Muted Trumpet',
    bassType: 'Acoustic Walking Jazz Double Bass',
    rhythmStyle: 'Syncopated Bossa Nova Brush Snare & Cabasa',
    atmosphereFx: 'Copacabana Beach Waves & Cafe Murmur',
    colorGradient: 'from-teal-600 via-yellow-600 to-emerald-900',
    description: 'Laid-back Rio de Janeiro jazz fusion featuring romantic nylon chord progressions, smooth flute, and seaside vibes.',
    isCustom: false,
  },
];

const LOCAL_STORAGE_KEY_CUSTOM_THEMES = 'ai_music_studio_custom_themes_v1';

export function loadUserCustomThemes(): CustomMusicTheme[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_CUSTOM_THEMES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveUserCustomThemes(themes: CustomMusicTheme[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOM_THEMES, JSON.stringify(themes));
  } catch (e) {
    console.error('Failed to save custom music themes', e);
  }
}

// Web Audio Synthesis Engine
let globalAudioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!globalAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    globalAudioCtx = new AudioContextClass();
  }
  if (globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().catch(() => {});
  }
  return globalAudioCtx;
}

// Frequency map for Musical Notes
export const NOTE_FREQUENCIES: Record<string, number> = {
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'A5': 880.00,
};

// Play a single Synth Tone with Custom Waveform & Envelope
export function playSynthNote(
  freq: number,
  type: OscillatorType = 'sawtooth',
  duration: number = 0.5,
  options?: { attack?: number; decay?: number; sustain?: number; release?: number; cutoff?: number; resonance?: number }
) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    const attack = options?.attack ?? 0.03;
    const decay = options?.decay ?? 0.15;
    const sustain = options?.sustain ?? 0.4;
    const release = options?.release ?? 0.3;
    const cutoff = options?.cutoff ?? 2500;
    const resonance = options?.resonance ?? 4;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, now);
    filter.Q.setValueAtTime(resonance, now);

    // ADSR Envelope
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.3 * sustain, now + attack + decay);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration + release);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + release + 0.05);
  } catch (err) {
    console.warn('Synth playback failed:', err);
  }
}

// Play a Chord (multiple notes)
export function playChord(notes: string[], type: OscillatorType = 'sawtooth', duration: number = 0.8) {
  notes.forEach((note) => {
    const freq = NOTE_FREQUENCIES[note];
    if (freq) {
      playSynthNote(freq, type, duration);
    }
  });
}

// Synthesize Drum Sounds using Web Audio
export function playDrumSound(drumType: 'kick' | 'snare' | 'hihat' | 'clap' | '808' | 'perc') {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    if (drumType === 'kick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.15);
      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (drumType === '808') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.25);
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.7);
    } else if (drumType === 'snare') {
      // Noise buffer + tone
      const bufferSize = ctx.sampleRate * 0.2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 1000;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.5, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);

      // Body tone
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
      oscGain.gain.setValueAtTime(0.4, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (drumType === 'hihat') {
      const bufferSize = ctx.sampleRate * 0.05;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7500;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } else if (drumType === 'clap') {
      const bufferSize = ctx.sampleRate * 0.15;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } else if (drumType === 'perc') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  } catch (e) {
    console.warn('Drum trigger failed', e);
  }
}

// AI Theme Generator logic based on prompt
export function generateThemeFromPrompt(prompt: string): CustomMusicTheme {
  const p = prompt.toLowerCase();
  const id = `custom_theme_${Date.now()}`;

  let genreCategory = 'Electro Pop Fusion';
  let tempoBpm = 124;
  let musicalKey = 'C Major';
  let scaleType: CustomMusicTheme['scaleType'] = 'major';
  let moodTag = 'Euphoric & Upbeat';
  let leadInstrument = 'Electric Synth & Acoustic Guitar';
  let bassType = '808 Sub-Bass';
  let rhythmStyle = 'Modern Electronic Beat';
  let atmosphereFx = 'Reverb Space Wash';
  let icon = '🎵';
  let colorGradient = 'from-purple-600 via-indigo-600 to-cyan-600';
  let hindiName = 'कस्टम संगीत थीम';

  if (p.includes('punjabi') || p.includes('bhangra') || p.includes('dhol')) {
    genreCategory = 'Punjabi Folk & Trap';
    tempoBpm = 136;
    musicalKey = 'F# Minor';
    scaleType = 'minor';
    moodTag = 'High-Voltage Bhangra Energy';
    leadInstrument = 'Tumbi, Sitar & Brass Horns';
    bassType = 'Heavy 808 Sliding Bass';
    rhythmStyle = 'Punjabi Dhol Beats with Triplets';
    atmosphereFx = 'Folk Whistles & Laser Drops';
    icon = '🪘';
    colorGradient = 'from-amber-600 via-red-600 to-yellow-600';
    hindiName = 'पंजाबी भांगड़ा ट्रैप थीम';
  } else if (p.includes('sufi') || p.includes('qawwali') || p.includes('spiritual') || p.includes('devotional')) {
    genreCategory = 'Sufi & Devotional Mysticism';
    tempoBpm = 88;
    musicalKey = 'Raag Yaman (E Minor)';
    scaleType = 'ragas';
    moodTag = 'Sacred, Soulful & Meditative';
    leadInstrument = 'Harmonium & Sitar Solo';
    bassType = 'Acoustic Tanpura Resonance';
    rhythmStyle = 'Live Tabla & Clap Percussion';
    atmosphereFx = 'Spiritual Temple Reverb & Incense Drone';
    icon = '🪔';
    colorGradient = 'from-amber-700 via-orange-800 to-yellow-900';
    hindiName = 'सूफी व रूहानी कव्वाली थीम';
  } else if (p.includes('cyber') || p.includes('synthwave') || p.includes('retro') || p.includes('80s')) {
    genreCategory = 'Retro Synthwave & Cyberpunk';
    tempoBpm = 126;
    musicalKey = 'A Minor';
    scaleType = 'minor';
    moodTag = 'Dark Neon Drive & High Tech';
    leadInstrument = 'Analog Supersaw & Synth Lead';
    bassType = 'Acid 303 Rolling Bassline';
    rhythmStyle = 'LinnDrum 80s Gated Snare Groove';
    atmosphereFx = 'Cyber Sirens & Hologram Sweeps';
    icon = '⚡';
    colorGradient = 'from-cyan-500 via-fuchsia-600 to-indigo-700';
    hindiName = 'साइबरपंक 80s रेट्रो थीम';
  } else if (p.includes('lofi') || p.includes('chill') || p.includes('relax') || p.includes('study') || p.includes('sleep')) {
    genreCategory = 'Lo-Fi Chillhop & Aesthetic Beats';
    tempoBpm = 78;
    musicalKey = 'Eb Major 7th';
    scaleType = 'pentatonic';
    moodTag = 'Cozy, Nostalgic & Mellow';
    leadInstrument = 'Dusty Rhodes Piano & Muted Trumpet';
    bassType = 'Sub-bass Warm Pluck';
    rhythmStyle = 'Swung Boom Bap & Vinyl Shaker';
    atmosphereFx = 'Vinyl Dust Crackle & Gentle Rain';
    icon = '☕';
    colorGradient = 'from-teal-700 via-emerald-800 to-slate-900';
    hindiName = 'लो-फाई चिलहॉप सुकून थीम';
  } else if (p.includes('metal') || p.includes('rock') || p.includes('guitar')) {
    genreCategory = 'Hard Rock & Heavy Metal Shred';
    tempoBpm = 152;
    musicalKey = 'Drop D Power Chords';
    scaleType = 'minor';
    moodTag = 'Raw Power & Moshpit Energy';
    leadInstrument = 'Distorted Electric Guitar Shred & Solo';
    bassType = 'Overdriven Slap Bass';
    rhythmStyle = 'Double-Kick Blast Beats & Crash Cymbals';
    atmosphereFx = 'Guitar Feedback & Thunder Roar';
    icon = '🎸';
    colorGradient = 'from-rose-800 via-neutral-900 to-red-950';
    hindiName = 'हार्ड रॉक व मेटल पावर थीम';
  } else if (p.includes('vedic') || p.includes('meditation') || p.includes('healing') || p.includes('432')) {
    genreCategory = 'Vedic 432Hz Sound Healing';
    tempoBpm = 60;
    musicalKey = '528Hz Solfeggio Love Frequency';
    scaleType = 'pentatonic';
    moodTag = 'Deep Bliss & Chakra Healing';
    leadInstrument = 'Indian Bansuri Flute & Singing Bowls';
    bassType = 'Sub-Sonic Om Resonator';
    rhythmStyle = 'Wind Chimes & Gentle Heartbeat Pulse';
    atmosphereFx = 'Tibetan Bells & Forest Waterfall';
    icon = '🧘';
    colorGradient = 'from-violet-800 via-purple-900 to-slate-950';
    hindiName = 'वैदिक 528Hz हीलिंग थीम';
  }

  return {
    id,
    name: prompt.length > 3 ? prompt.charAt(0).toUpperCase() + prompt.slice(1) : 'Custom Music Theme',
    hindiName,
    icon,
    genreCategory,
    tempoBpm,
    musicalKey,
    scaleType,
    moodTag,
    leadInstrument,
    bassType,
    rhythmStyle,
    atmosphereFx,
    colorGradient,
    description: `User-crafted musical theme blending ${leadInstrument} with ${rhythmStyle} at ${tempoBpm} BPM.`,
    isCustom: true,
    createdAt: new Date().toLocaleDateString(),
  };
}

// Real-Time Global Entertainment & Lore Search Aggregator
// Aggregates characters, anime, cartoons, global OTT web series, movies, games, 18+ mature media,
// and delivers multi-language subtitles in 20+ languages with direct 1-click studio reference injection.

export type EntertainmentMediaType =
  | 'anime'
  | 'cartoon'
  | 'ott_series'
  | 'movie'
  | 'game'
  | '18_plus_mature'
  | 'comic_manga';

export interface SubtitleQuote {
  time: string;
  speaker: string;
  text: string;
  translated: string;
}

export interface SubtitleTrack {
  languageCode: string;
  languageName: string;
  nativeName: string;
  flag: string;
  quotes: SubtitleQuote[];
  fullSrt: string;
}

export interface StudioPresets {
  imagePrompt: string;
  imageStyle: string;
  videoPrompt: string;
  filmScriptPrompt: string;
  threeModelArchetype: string;
  threePrompt: string;
  songThemePrompt: string;
  songGenre: string;
  dubbingDialogue: string;
  mangaStoryline: string;
  docBibleTitle: string;
  gameArchetype: string;
}

export interface EntertainmentItem {
  id: string;
  title: string;
  character: string;
  nativeName?: string;
  franchise: string;
  universe: string;
  mediaType: EntertainmentMediaType;
  genres: string[];
  ottPlatforms: string[];
  releaseYear: number | string;
  seasonsEpisodes: string;
  ageRating: string;
  rating: {
    score: number;
    max: number;
    source: string;
  };
  bannerImage: string;
  characterAvatar: string;
  studioOrCreator: string;
  originCountry: string;
  visualTraits: {
    outfit: string;
    features: string;
    iconicItem: string;
    hairAndEyes: string;
    colorPalette: string[];
  };
  abilitiesAndMoves: string[];
  voiceActor: string;
  synopsis: string;
  characterLore: string;
  subtitles: Record<string, SubtitleTrack>;
  studioPresets: StudioPresets;
  // Cross-Platform TMDB / OMDb / IMDb Metadata
  tmdbId?: number;
  imdbId?: string;
  omdbData?: {
    imdbRating?: string;
    imdbVotes?: string;
    awards?: string;
    boxOffice?: string;
    director?: string;
    writers?: string;
    metascore?: string;
    rottenTomatoes?: string;
    actors?: string;
    language?: string;
    country?: string;
  };
  mediaLinks?: {
    tmdbUrl?: string;
    imdbUrl?: string;
    trailerUrl?: string;
    trailerYoutubeId?: string;
    ottWatchUrl?: string;
    posterHighResUrl?: string;
    backdropHighResUrl?: string;
    galleryImages?: string[];
  };
  castAndCrew?: Array<{
    name: string;
    character: string;
    profileUrl?: string;
    role?: string;
    bio?: string;
  }>;
}

export const SUPPORTED_SUBTITLE_LANGUAGES = [
  { code: 'hi', name: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: 'Mandarin Chinese', native: '中文', flag: '🇨🇳' },
  { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', native: 'اردو', flag: '🇵🇰' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'it', name: 'Italian', native: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇧🇷' },
];

export function generateSrtContent(quotes: SubtitleQuote[]): string {
  return quotes
    .map((q, idx) => {
      const startSecond = idx * 4;
      const endSecond = startSecond + 3.5;
      const formatTime = (s: number) => {
        const mins = Math.floor(s / 60)
          .toString()
          .padStart(2, '0');
        const secs = Math.floor(s % 60)
          .toString()
          .padStart(2, '0');
        const ms = Math.floor((s % 1) * 1000)
          .toString()
          .padStart(3, '0');
        return `00:${mins}:${secs},${ms}`;
      };

      return `${idx + 1}\n${formatTime(startSecond)} --> ${formatTime(endSecond)}\n${q.speaker ? `[${q.speaker}] ` : ''}${q.translated || q.text}\n`;
    })
    .join('\n');
}

// Master Pre-Indexed Entertainment Catalog with Global Lore & Subtitles in 20+ Languages
export const MASTER_ENTERTAINMENT_CATALOG: EntertainmentItem[] = [
  // 1. MOTU PATLU (Indian / Global 3D Animation)
  {
    id: 'ent_motu_patlu',
    title: 'Motu Patlu',
    character: 'Motu & Patlu',
    nativeName: 'मोटू पतलू',
    franchise: 'Furfuri Nagar Universe (Lotpot Comics)',
    universe: 'Indian 3D Toon World',
    mediaType: 'cartoon',
    genres: ['3D CGI Cartoon', 'Comedy', 'Adventure', 'Slapstick Heroic'],
    ottPlatforms: ['Nickelodeon', 'JioCinema', 'Voot Kids', 'YouTube Animation'],
    releaseYear: '2012–Present',
    seasonsEpisodes: '1000+ Episodes & 25+ Feature Films',
    ageRating: 'All Ages (U/A)',
    rating: { score: 9.4, max: 10, source: 'Kids Choice Global' },
    bannerImage:
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1920&q=80',
    characterAvatar:
      'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80',
    studioOrCreator: 'Cosmos-Maya / Kripa Shankar Sharma (Lotpot)',
    originCountry: 'India',
    visualTraits: {
      outfit: 'Motu wears iconic red Kurta and blue pyjamas; Patlu wears yellow Kurta, blue trousers and spectacles.',
      features: 'Motu is stout, bald with a moustache; Patlu is tall, lean, bald with round black reading glasses.',
      iconicItem: 'Crispy Samosa (gives Motu superhuman strength and boundless energy), Chai, Samosa stall.',
      hairAndEyes: 'Bald heads with side tufts, expressive large animated eyes.',
      colorPalette: ['#EF4444', '#F59E0B', '#3B82F6', '#10B981'],
    },
    abilitiesAndMoves: [
      'Samosa Super-Power Surge (Unstoppable momentum)',
      'Patlus Brain Wave Idea ("Idea! Motu, mera dimaag chal raha hai!")',
      'Furfuri Nagar Whirlwind Punch',
      'Dr. Jhatka Tech Inventions Mastery',
    ],
    voiceActor: 'Saurav Chakraborty (Voice for Motu, Patlu, Dr. Jhatka, Ghasitaram, John the Don)',
    synopsis:
      'Set in the fictional town of Furfuri Nagar, Motu and Patlu are two inseparable best friends whose misadventures usually stem from Motus voracious craving for hot samosas. When trouble arises or villain John the Don plots chaos, Motu eats samosas to unlock instant superhuman strength while Patlu devises witty tactics.',
    characterLore:
      'Originating from Lotpot Hindi comic magazine in 1969, Motu Patlu evolved into the most watched 3D cartoon in South Asia. Known for Dr. Jhatkas eccentric inventions, Ghasitarams Bengal expertise, and Chingum police officer inspector.',
    subtitles: {
      hi: {
        languageCode: 'hi',
        languageName: 'Hindi',
        nativeName: 'हिंदी',
        flag: '🇮🇳',
        quotes: [
          { time: '00:01', speaker: 'Motu', text: 'Khaali pet mere dimaag ki batti nahi jalti!', translated: 'खाली पेट मेरे दिमाग की बत्ती नहीं जलती! मुझे समोसे चाहिए!' },
          { time: '00:05', speaker: 'Patlu', text: 'Idea! Motu, abhi John the Don ko sabak sikhana hoga!', translated: 'आईडिया! मोटू, संभल जाओ! अब जॉन द डॉन को सबक सिखाना ही होगा!' },
          { time: '00:10', speaker: 'Dr. Jhatka', text: 'Arey Motu, yeh mera naya formula injection hai!', translated: 'अरे मोटू, यह मेरा नया रॉकेट फॉर्मूला है, इससे तुम हवा में उड़ोगे!' },
        ],
        fullSrt: '',
      },
      en: {
        languageCode: 'en',
        languageName: 'English',
        nativeName: 'English',
        flag: '🇬🇧',
        quotes: [
          { time: '00:01', speaker: 'Motu', text: 'An empty stomach will not let the lightbulb of my brain ignite! Samosas now!', translated: 'An empty stomach will not let my brain work! Bring on the hot samosas!' },
          { time: '00:05', speaker: 'Patlu', text: 'Idea! Motu, we have a foolproof plan to stop John the Don!', translated: 'Idea! Motu, I have the master plan to outsmart John the Don!' },
          { time: '00:10', speaker: 'Dr. Jhatka', text: 'Look at my new ultra-gadget invention, it defies all gravity!', translated: 'Behold my latest invention! It will launch you straight across the town!' },
        ],
        fullSrt: '',
      },
      ja: {
        languageCode: 'ja',
        languageName: 'Japanese',
        nativeName: '日本語',
        flag: '🇯🇵',
        quotes: [
          { time: '00:01', speaker: 'Motu', text: 'お腹が空いて頭の電球がつかない！サモサをくれ！', translated: 'お腹が空いて頭の電球がつかない！サモサをくれ！' },
          { time: '00:05', speaker: 'Patlu', text: '閃いた！モトゥ、悪党ジョンを倒す完璧な作戦だ！', translated: '閃いた！モトゥ、悪党ジョンを倒す完璧な作戦だ！' },
        ],
        fullSrt: '',
      },
      es: {
        languageCode: 'es',
        languageName: 'Spanish',
        nativeName: 'Español',
        flag: '🇪🇸',
        quotes: [
          { time: '00:01', speaker: 'Motu', text: '¡Con el estómago vacío mi cerebro no funciona! ¡Tráiganme samosas!', translated: '¡Con el estómago vacío mi cerebro no funciona! ¡Tráiganme samosas!' },
          { time: '00:05', speaker: 'Patlu', text: '¡Tengo una idea! ¡Vamos a atrapar al villano!', translated: '¡Tengo una idea! ¡Vamos a atrapar al villano!' },
        ],
        fullSrt: '',
      },
    },
    studioPresets: {
      imagePrompt:
        '3D CGI Pixar style vibrant character render of Motu and Patlu eating golden crispy samosas in Furfuri Nagar marketplace, bright volumetric sunshine, cinematic 8k, detailed textures, expressive faces',
      imageStyle: '3D CGI Cartoon Animation (Pixar & DreamWorks)',
      videoPrompt:
        'Motu eating samosa and transforming into glowing superhero speed running through Furfuri Nagar, dodging Dr Jhatkas flying machine, 60fps dynamic camera orbit',
      filmScriptPrompt:
        'INT. FURFURI NAGAR CHAI SHOP - DAY\nMOTU collapses on the wooden bench, clutching his round belly dramatically.\nMOTU: "Patlu! Samosa bina meri zindagi andheri hai!"\nPATLU adjusts his spectacles with a sharp snap.',
      threeModelArchetype: 'Stylized 3D Dual Cartoon Character Rig (Stout Hero + Tall Strategist)',
      threePrompt: '3D stylized rigged mesh of Motu in red kurta with high-poly samosa accessory and bone kinematics',
      songThemePrompt: 'Upbeat Bhangra Fusion Cartoon Anthem with playful dhol rhythms and comedic brass horn drops',
      songGenre: 'Desi Pop & Animated Cartoon Electro-Bhangra',
      dubbingDialogue: 'Khaali pet mere dimaag ki batti nahi jalti! Samosa lao!',
      mangaStoryline: 'Panel 1: Motu fainting of hunger. Panel 2: Patlu spotting the tea stall. Panel 3: Samosa power explosion!',
      docBibleTitle: 'Motu Patlu: Furfuri Nagar Universal Character & Story Lore Bible',
      gameArchetype: 'Brawler & Samosa Power Collector Hero',
    },
  },

  // 2. CHHOTA BHEEM (Indian / Global Mythological Animation)
  {
    id: 'ent_chhota_bheem',
    title: 'Chhota Bheem',
    character: 'Chhota Bheem',
    nativeName: 'छोटा भीम',
    franchise: 'Dholakpur Kingdom Chronicles',
    universe: 'Vedic Fantasy Cartoon Realm',
    mediaType: 'cartoon',
    genres: ['Heroic Action', 'Mythology', 'Adventure', 'Children Fantasy'],
    ottPlatforms: ['Netflix', 'Pogo', 'YouTube Kids', 'Prime Video'],
    releaseYear: '2008–Present',
    seasonsEpisodes: '600+ Episodes, 18 Films',
    ageRating: 'All Ages (U)',
    rating: { score: 9.2, max: 10, source: 'Animation Guild' },
    bannerImage:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1920&q=80',
    characterAvatar:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    studioOrCreator: 'Green Gold Animations / Rajiv Chilaka',
    originCountry: 'India',
    visualTraits: {
      outfit: 'Orange dhoti, gold armlets (bajuband), red wristbands, tilak on forehead.',
      features: 'Muscular athletic 9-year-old child prodigy, brave smiling countenance.',
      iconicItem: 'Tuntun Masis Sweet Yellow Ladoos (unlocks massive superhuman strength).',
      hairAndEyes: 'Black spiky tuft hair, bold brown fearless eyes.',
      colorPalette: ['#F97316', '#FBBF24', '#B45309', '#1E3A8A'],
    },
    abilitiesAndMoves: [
      'Ladoo Power Boost (Titan strength multiplication)',
      'Gada / Mace Earth Shatter Shockwave',
      'Dholakpur Heroic Leaping Kick',
      'Lion Roar Defensive Aura',
    ],
    voiceActor: 'Parignya Pandya Shah / Sonal Kaushal',
    synopsis:
      'In the mythical kingdom of Dholakpur ruled by King Indraverma, young 9-year-old Bheem stands as the protector of innocent citizens, defeating dacoit Mangal Singh, evil sorcerer Kirmada, and rival demons alongside his friends Chutki, Raju, Jaggu the monkey, and Kalia.',
    characterLore:
      'Inspired by the legendary Pandava warrior Bhima of the Mahabharata, tailored into an inspiring virtuous hero who promotes courage, friendship, kindness, and righteousness.',
    subtitles: {
      hi: {
        languageCode: 'hi',
        languageName: 'Hindi',
        nativeName: 'हिंदी',
        flag: '🇮🇳',
        quotes: [
          { time: '00:01', speaker: 'Chhota Bheem', text: 'Dholakpur par koi aanch nahi aane dunga!', translated: 'ढोलकपुर पर कोई आंच नहीं आने दूंगा! टुनटुन मौसी के लड्डू खाकर सबको सबक सिखाऊंगा!' },
          { time: '00:06', speaker: 'Chutki', text: 'Bheem, yeh lo garam ladoo!', translated: 'भीम, ये लो ताज़ा लड्डू! अब इन दुष्टों को धूल चटा दो!' },
        ],
        fullSrt: '',
      },
      en: {
        languageCode: 'en',
        languageName: 'English',
        nativeName: 'English',
        flag: '🇬🇧',
        quotes: [
          { time: '00:01', speaker: 'Chhota Bheem', text: 'I will never let any harm come to the kingdom of Dholakpur!', translated: 'I will protect Dholakpur with all my strength! Bring on the magic ladoos!' },
          { time: '00:06', speaker: 'Chutki', text: 'Bheem, catch the fresh sweet ladoo and defeat them!', translated: 'Bheem, here is your power boost! Defeat the evil forces!' },
        ],
        fullSrt: '',
      },
    },
    studioPresets: {
      imagePrompt:
        'Chhota Bheem heroically standing atop ancient palace wall of Dholakpur, golden hour sunrise, wearing orange dhoti and gold bajuband, magical glowing ladoo in hand, 8k cinematic hyperrealism',
      imageStyle: 'Indian Mythological Cartoon (Chhota Bheem & Amar Chitra Katha)',
      videoPrompt:
        'Chhota Bheem leaping into the air over Dholakpur fortress, smashing through stone boulders with martial arts precision, 4k 60fps anime action shot',
      filmScriptPrompt:
        'EXT. DHOLAKPUR PALACE GATES - DUSK\nThe sky turns crimson. The sorcerer Kirmada unleashes dark shadow bolts.\nCHHOTA BHEEM steps forward fearlessly, eyes burning with golden light.',
      threeModelArchetype: 'Ancient Heroic Youth Male (Rigged Warrior Dhoti)',
      threePrompt: '3D stylized warrior mesh of Chhota Bheem with gold ornaments, rigged mace gada weapon and idle breathing emote',
      songThemePrompt: 'Epic Orchestral Folk Battle Theme with heavy Nagada drums, Shehnai melodies and victorious brass fanfare',
      songGenre: 'Epic Indian Cinema Symphony & Folk Hero Anthem',
      dubbingDialogue: 'Dholakpur ki raksha karna mera dharam hai!',
      mangaStoryline: 'Panel 1: Evil army invading. Panel 2: Chutki throws the sweet ladoo. Panel 3: Bheem catches it and unleashes thunder punch!',
      docBibleTitle: 'Chhota Bheem: Kingdom of Dholakpur Master World Lore Document',
      gameArchetype: 'Melee Heavy Bruiser with Ladoo Buff Stacks',
    },
  },

  // 3. SHINCHAN (Japanese Anime / Global Comedy Phenomenon)
  {
    id: 'ent_shinchan',
    title: 'Crayon Shin-chan',
    character: 'Shinnosuke Nohara (Shinchan)',
    nativeName: 'クレヨンしんちゃん (野原しんのすけ)',
    franchise: 'Kasukabe Defense Force',
    universe: 'Futaba Kindergarten / Tokyo Slice of Life',
    mediaType: 'anime',
    genres: ['Anime Comedy', 'Satire', 'Slice of Life', 'Slapstick Parody'],
    ottPlatforms: ['Disney+ Hotstar', 'Netflix', 'Amazon Prime', 'TV Asahi', 'Hungama'],
    releaseYear: '1992–Present',
    seasonsEpisodes: '1200+ Episodes, 32 Feature Films',
    ageRating: 'PG-13 / TV-14 / Comedy Satire',
    rating: { score: 9.6, max: 10, source: 'MyAnimeList Global' },
    bannerImage:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1920&q=80',
    characterAvatar:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    studioOrCreator: 'Shin-Ei Animation / Yoshito Usui',
    originCountry: 'Japan',
    visualTraits: {
      outfit: 'Signature bright red short-sleeve shirt and yellow shorts, white socks.',
      features: 'Wavy thick black eyebrows, chubby cheeky face, large playful eyes.',
      iconicItem: 'Chocobi (Crocodile star chocolate snacks), Action Kamen action figure, Shiro the white dog.',
      hairAndEyes: 'Short black buzz cut, round cheeky expressive eyes.',
      colorPalette: ['#EF4444', '#FACC15', '#1E293B', '#F8FAFC'],
    },
    abilitiesAndMoves: [
      'Buri Buri Dance (Legendary distraction move)',
      'Action Kamen Beam ("Action Beam! Wa-ha-ha-ha!")',
      'Misawa/Misae Iron Fist Evasion',
      'Kasukabe Defense Force Leadership Call',
    ],
    voiceActor: 'Akiko Yajima / Yumiko Kobayashi / Akanksha Sharma (Hindi)',
    synopsis:
      'Follows the hilarious, uninhibited 5-year-old Shinnosuke Nohara living in Kasukabe, Saitama with his fiery mother Misae, overworked father Hiroshi, baby sister Himawari, and clever dog Shiro. Shinchans deadpan humor, mischievous remarks to adults, and love for superhero Action Kamen make him a worldwide icon.',
    characterLore:
      'Created by Yoshito Usui in 1990 as a manga series, Crayon Shin-chan became a global cultural juggernaut, translated into 30+ languages. Beloved for poignant family loyalty wrapped in irreverent slapstick wit.',
    subtitles: {
      hi: {
        languageCode: 'hi',
        languageName: 'Hindi',
        nativeName: 'हिंदी',
        flag: '🇮🇳',
        quotes: [
          { time: '00:01', speaker: 'Shinchan', text: 'Mera naam Shinnosuke Nohara hai, main 5 saal ka hu!', translated: 'मेरा नाम शिनचैन है और मैं बहुत शरारती हूँ! क्या आप शिमला मिर्च खाएंगे?' },
          { time: '00:06', speaker: 'Misae', text: 'Shinchan! Apne joote theek se rakho!', translated: 'शिनचैन! फिर से तुमने चॉकलेट कुकीज़ खा ली और खिलौने फैला दिए!' },
          { time: '00:10', speaker: 'Shinchan', text: 'Action Kamen, meri madad karo! Buri Buri!', translated: 'एक्शन कामेन! मुझे अपनी जादुई किरण दो! वाह हा हा हा!' },
        ],
        fullSrt: '',
      },
      ja: {
        languageCode: 'ja',
        languageName: 'Japanese',
        nativeName: '日本語',
        flag: '🇯🇵',
        quotes: [
          { time: '00:01', speaker: 'Shinnosuke', text: 'オラ、野原しんのすけ５才！ピーマンは食べないゾ！', translated: 'オラ、野原しんのすけ５才！チョコビ大好きだゾ！' },
          { time: '00:06', speaker: 'Misae', text: 'しんのすけー！また散らかして！げんこつよ！', translated: 'しんのすけー！また脱ぎっぱなしにして！' },
          { time: '00:10', speaker: 'Shinnosuke', text: 'アクションビーム！ワハハハハ！', translated: 'アクションビーム！ワハハハハ！ブリブリざえもん参上！' },
        ],
        fullSrt: '',
      },
      en: {
        languageCode: 'en',
        languageName: 'English',
        nativeName: 'English',
        flag: '🇬🇧',
        quotes: [
          { time: '00:01', speaker: 'Shinchan', text: 'Im Shinnosuke Nohara, 5 years old and full of energy!', translated: 'Hey pretty lady, do you like green peppers? Because I certainly do not!' },
          { time: '00:06', speaker: 'Shinchan', text: 'Action Kamen Beam! Laugh with me, bwahahaha!', translated: 'Action Beam attack! Kasukabe Defense Force, assemble!' },
        ],
        fullSrt: '',
      },
    },
    studioPresets: {
      imagePrompt:
        'Crayon Shinchan anime style standing with white dog Shiro in suburban Tokyo Japanese house garden, colorful pastel manga aesthetic, holding Chocobi box, 8k crisp lineart',
      imageStyle: 'Anime & Studio Ghibli',
      videoPrompt:
        'Shinchan performing the iconic Buri Buri dance while Action Kamen poses in the background with golden explosion sparks, 24fps hand-drawn anime aesthetic',
      filmScriptPrompt:
        'INT. NOHARA LIVING ROOM - AFTERNOON\nMISAE boils water in the kettle.\nSHINCHAN slides in across the tatami mat on his belly wearing Action Kamen mask.\nSHINCHAN: "Okaeri! Uh, I mean... Tadaima!"',
      threeModelArchetype: 'Chibi Stylized 3D Anime Character Rig',
      threePrompt: '3D low-poly stylized mesh of Shinchan in red shirt and yellow shorts with comical eyebrow blendshapes',
      songThemePrompt: 'Quirky J-Pop Ska Punk Anime Opening Theme with fast horn section, whistle riffs and cheeky Japanese vocal adlibs',
      songGenre: 'J-Pop Anime Opening & Comedy Ska Punk',
      dubbingDialogue: 'Mera naam Shinnosuke Nohara hai! Buri Buri!',
      mangaStoryline: 'Panel 1: Shinchan sneaking into cookie cabinet. Panel 2: Misaes shadow looms. Panel 3: Comic head lump explosion!',
      docBibleTitle: 'Shin-chan & Kasukabe Defense Force Franchise Production Bible',
      gameArchetype: 'Trickster Speedster with Taunt & Stun Abilities',
    },
  },

  // 4. DORAEMON (Global Japanese Sci-Fi Anime)
  {
    id: 'ent_doraemon',
    title: 'Doraemon',
    character: 'Doraemon & Nobita Nobi',
    nativeName: 'ドラえもん (野比のび太)',
    franchise: '22nd Century Cat Robot Universe',
    universe: 'Fujiko F. Fujio Multiverse',
    mediaType: 'anime',
    genres: ['Sci-Fi Anime', 'Time Travel', 'Heartwarming Comedy', 'Invention Fantasy'],
    ottPlatforms: ['Disney+ Hotstar', 'Netflix', 'Amazon Prime Video', 'TV Asahi'],
    releaseYear: '1979–Present',
    seasonsEpisodes: '1800+ Episodes, 43 Feature Films',
    ageRating: 'All Ages (U)',
    rating: { score: 9.8, max: 10, source: 'All-Time Global Classic' },
    bannerImage:
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1920&q=80',
    characterAvatar:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    studioOrCreator: 'Fujiko F. Fujio / Shin-Ei Animation',
    originCountry: 'Japan',
    visualTraits: {
      outfit: 'Blue earless robotic cat with red nose, yellow bell collar, 4D dimensional pocket.',
      features: 'Round spherical hands, whisker marks, large smiling mouth.',
      iconicItem: 'Anywhere Door (Dokodemo Door), Bamboo Copter (Take-Copter), Time Machine, Dorayaki sweets.',
      hairAndEyes: 'Blue chrome metal casing, expressive cartoon eyes.',
      colorPalette: ['#3B82F6', '#EF4444', '#FBBF24', '#F8FAFC'],
    },
    abilitiesAndMoves: [
      '4th-Dimensional Pocket Gadget Summon (Infinite future tech)',
      'Anywhere Door Instant Spatial Teleportation',
      'Time-Cloth Restoration & Rewind',
      'Memory Bread Exam Memorization',
    ],
    voiceActor: 'Nobuyo Oyama / Wasabi Mizuta / Sonal Kaushal (Hindi)',
    synopsis:
      'Sent back in time from the 22nd century by Nobitas great-great-grandson Sewashi, the robotic cat Doraemon uses futuristic gadgets from his fourth-dimensional pocket to help the clumsy, kindhearted Nobita overcome school bullies Gian and Suneo, and build a brighter future with Shizuka.',
    characterLore:
      'Created by Fujiko F. Fujio in 1969, Doraemon was officially designated as Japans first "anime cultural ambassador" by the Ministry of Foreign Affairs. Represents endless human imagination and friendship.',
    subtitles: {
      hi: {
        languageCode: 'hi',
        languageName: 'Hindi',
        nativeName: 'हिंदी',
        flag: '🇮🇳',
        quotes: [
          { time: '00:01', speaker: 'Nobita', text: 'Doraemon! Gian aur Suneo ne mujhe fir se sataya!', translated: 'डोरेमोन! मेरी मदद करो! जियान और सुनियो ने फिर से मेरा खिलौना छीन लिया!' },
          { time: '00:06', speaker: 'Doraemon', text: 'Yeh lo Nobita, 22nd Century ka Anywhere Door!', translated: 'ये लो नोबिता! कहीं भी जाने वाला दरवाज़ा (Anywhere Door)! अब तुम जहाँ चाहो जा सकते हो!' },
        ],
        fullSrt: '',
      },
      ja: {
        languageCode: 'ja',
        languageName: 'Japanese',
        nativeName: '日本語',
        flag: '🇯🇵',
        quotes: [
          { time: '00:01', speaker: 'Nobita', text: 'ドラえも〜ん！ジャイアンにいじめられたよ〜！', translated: 'ドラえも〜ん！宿題が終わらないよ〜道具を出して！' },
          { time: '00:06', speaker: 'Doraemon', text: 'テッテレー！「どこでもドア〜」！', translated: 'テッテレー！「タケコプター」と「どこでもドア〜」！' },
        ],
        fullSrt: '',
      },
      en: {
        languageCode: 'en',
        languageName: 'English',
        nativeName: 'English',
        flag: '🇬🇧',
        quotes: [
          { time: '00:01', speaker: 'Nobita', text: 'Doraemon! Please save me, Gian took my comic book!', translated: 'Doraemon! Help me with a secret 22nd century gadget!' },
          { time: '00:06', speaker: 'Doraemon', text: 'Tada! The Anywhere Door! Step right through to anywhere on Earth!', translated: 'Here you go Nobita! The Bamboo Copter and the Anywhere Door!' },
        ],
        fullSrt: '',
      },
    },
    studioPresets: {
      imagePrompt:
        'Doraemon holding the pink Anywhere Door open revealing a starry futuristic galaxy nebula, Nobita with yellow shirt floating on Bamboo Copter, Studio Ghibli lush clouds, 8k render',
      imageStyle: 'Classic 2D Cartoon (Disney & Looney Tunes Vintage)',
      videoPrompt:
        'Doraemon pulling golden glowing gadgets out of his 4D pocket, camera zooming into the dimensional vortex with sparkles, 60fps anime VFX',
      filmScriptPrompt:
        'INT. NOBITA BEDROOM - DESK TIME MACHINE PORTAL - DAY\nThe wooden desk drawer rattles. Golden neon light floods the tatami mat.\nDORAEMON pops his blue head out, adjusting his yellow brass bell.',
      threeModelArchetype: 'Robotic Quad-Dimensional Mascot Character Rig',
      threePrompt: '3D smooth stylized mesh of Doraemon with functioning anywhere door prop and rotating bamboo copter',
      songThemePrompt: 'Heartwarming Whimsical Orchestral Anime Theme with acoustic guitar, glockenspiel bells and nostalgic strings',
      songGenre: 'Japanese Anime Pop & Whimsical Symphony',
      dubbingDialogue: 'Main hu ek udta robot, Doraemon!',
      mangaStoryline: 'Panel 1: Nobita crying over zero test score. Panel 2: Doraemon sighs and reaches into pocket. Panel 3: Memory Bread shines!',
      docBibleTitle: 'Doraemon 22nd Century Futuristic Sci-Fi Gadget Directory & Bible',
      gameArchetype: 'Support Enchanter with Infinite Gadget Utility',
    },
  },

  // 5. GOKU - DRAGON BALL Z / SUPER (Shonen Anime King)
  {
    id: 'ent_goku_dbz',
    title: 'Dragon Ball Z / Super',
    character: 'Son Goku (Kakarot)',
    nativeName: '孫悟空 (カカロット)',
    franchise: 'Dragon Ball Multiverse',
    universe: 'Universe 7 Saiyan Lore',
    mediaType: 'anime',
    genres: ['Shonen Anime', 'Martial Arts', 'Cosmic Action', 'Transformation Fantasy'],
    ottPlatforms: ['Crunchyroll', 'Netflix', 'Hulu', 'Toei Animation'],
    releaseYear: '1986–Present',
    seasonsEpisodes: '600+ Episodes, 21 Movies',
    ageRating: 'PG-13 / TV-14',
    rating: { score: 9.9, max: 10, source: 'Global Anime Hall of Fame' },
    bannerImage:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1920&q=80',
    characterAvatar:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
    studioOrCreator: 'Akira Toriyama / Toei Animation / Shueisha',
    originCountry: 'Japan',
    visualTraits: {
      outfit: 'Orange Turtle School Gi with dark blue undershirt, wristbands, and boots.',
      features: 'Muscular athletic Saiyan physique, spiky black hair (golden in Super Saiyan, silver in Ultra Instinct).',
      iconicItem: 'Flying Nimbus (Kintoun), Power Pole, 4-Star Dragon Ball, Senzu Beans.',
      hairAndEyes: 'Spiky palm-tree silhouette hair, fiery intense warrior eyes.',
      colorPalette: ['#EA580C', '#1E3A8A', '#FACC15', '#E2E8F0'],
    },
    abilitiesAndMoves: [
      'Kamehameha Wave (Concentrated Ki beam blast)',
      'Ultra Instinct (Autonomous divine dodging and counter-strikes)',
      'Spirit Bomb (Genki Dama cosmic energy sphere)',
      'Instant Transmission (Instantaneous Ki teleportation)',
      'Super Saiyan Forms 1, 2, 3, God, Blue, Mastered Ultra Instinct',
    ],
    voiceActor: 'Masako Nozawa / Sean Schemmel / Ankur Javeri (Hindi)',
    synopsis:
      'Sent to Earth as an infant Saiyan named Kakarot, Son Goku trains under Master Roshi, Kami, and Whis to become the strongest martial artist in the universe. Alongside Vegeta, Gohan, and Piccolo, Goku defends Earth and the multiverse from cosmic conquerors including Frieza, Cell, Majin Buu, and Jiren.',
    characterLore:
      'Created by master manga artist Akira Toriyama, Goku is the foundational archetype for modern anime shonen protagonists. Known for his cheerful appetite, unbreakable determination, and respect for noble adversaries.',
    subtitles: {
      hi: {
        languageCode: 'hi',
        languageName: 'Hindi',
        nativeName: 'हिंदी',
        flag: '🇮🇳',
        quotes: [
          { time: '00:01', speaker: 'Goku', text: 'Main Earth ka Saiyan Son Goku hu!', translated: 'मैं पृथ्वी पर पला-बढ़ा साइयन हूँ - सोन गोकू! अपनी सीमाओं को तोड़कर मैं और शक्तिशाली बनूंगा!' },
          { time: '00:06', speaker: 'Goku', text: 'Kaaaa-Meeee-Haaaa-Meeee-HAAAAA!', translated: 'का-मे-हा-मे-हा-हा-हा-हा-हा! ब्रह्मांडीय ऊर्जा विस्फोट!' },
        ],
        fullSrt: '',
      },
      ja: {
        languageCode: 'ja',
        languageName: 'Japanese',
        nativeName: '日本語',
        flag: '🇯🇵',
        quotes: [
          { time: '00:01', speaker: 'Goku', text: 'オッス！オラ悟空！強ぇヤツと戦うとワクワクすっぞ！', translated: 'オッス！オラ悟空！オラたちの限界を超えてみせる！' },
          { time: '00:06', speaker: 'Goku', text: 'か・め・は・め・波ーーーーーっ！！！！', translated: 'か・め・は・め・波ーーーーーっ！！！！身勝手の極意！' },
        ],
        fullSrt: '',
      },
      en: {
        languageCode: 'en',
        languageName: 'English',
        nativeName: 'English',
        flag: '🇬🇧',
        quotes: [
          { time: '00:01', speaker: 'Goku', text: 'Im Goku! And I am the hope of the universe!', translated: 'I am the answer to all living things that cry out for peace! I am Son Goku!' },
          { time: '00:06', speaker: 'Goku', text: 'KAAA-MEEE-HAAA-MEEE-HAAAAA!', translated: 'Ka-Me-Ha-Me-HAAAAA! Ultra Instinct unleashed!' },
        ],
        fullSrt: '',
      },
    },
    studioPresets: {
      imagePrompt:
        'Mastered Ultra Instinct Son Goku hovering in outer space tournament arena, silver hair and glowing ethereal silver aura with blue Ki lightning arcs, intense focused gaze, 8k Octane render',
      imageStyle: 'Anime & Studio Ghibli',
      videoPrompt:
        'Goku charging Kamehameha wave, camera whipping around him as terrain disintegrates into floating blue energy particles, 60fps anime battle cinematography',
      filmScriptPrompt:
        'EXT. TOURNAMENT OF POWER STAGE - VOID\nGOKUS body glows in blinding silver transcendence. The entire void shivers.\nVEGETA watches from the rubble, smirking.\nVEGETA: "He broke through his shell once more... Ultra Instinct."',
      threeModelArchetype: 'Superhuman Martial Arts Muscular Fighter Rig',
      threePrompt: '3D high-poly rigged Saiyan warrior mesh with dynamic Ki aura shader and interchangeable Super Saiyan hair geometry',
      songThemePrompt: 'High-Octane Heavy Metal Anime Rock Battle Theme with blistering electric guitar solos, thunderous double-kick drums and epic choir chants',
      songGenre: 'Anime Rock Battle Anthem & Symphonic Metal',
      dubbingDialogue: 'Ka-me-ha-me-haaaaa! Ultra Instinct active!',
      mangaStoryline: 'Panel 1: Gokus eyes close. Panel 2: Silver heat erupts. Panel 3: Instant punch shockwave cracks the page border!',
      docBibleTitle: 'Dragon Ball Multiverse: Saiyan Ki & Power Scaling Production Bible',
      gameArchetype: 'Legendary Rush Brawler with Transformation Triggers',
    },
  },

  // 6. CYBERPUNK EDGERUNNERS (Netflix 18+ Anime / Cyber Sci-Fi)
  {
    id: 'ent_cyberpunk_edgerunners',
    title: 'Cyberpunk: Edgerunners',
    character: 'David Martinez & Lucy',
    nativeName: 'サイバーパンク エッジランナーズ',
    franchise: 'Cyberpunk 2077 Night City Universe',
    universe: 'Night City Dystopia',
    mediaType: '18_plus_mature',
    genres: ['18+ Mature Cyberpunk', 'Sci-Fi Action', 'Tragic Romance', 'Body Mod Cybernetics'],
    ottPlatforms: ['Netflix', 'CD Projekt Red'],
    releaseYear: '2022',
    seasonsEpisodes: '10 Episodes (Completed Masterpiece)',
    ageRating: '18+ Explicit Mature (TV-MA / R)',
    rating: { score: 9.7, max: 10, source: 'Crunchyroll Anime of the Year' },
    bannerImage:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1920&q=80',
    characterAvatar:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    studioOrCreator: 'Studio Trigger / CD Projekt Red / Hiroyuki Imaishi',
    originCountry: 'Japan / Poland',
    visualTraits: {
      outfit: 'David wears his mothers yellow EMT paramedic jacket with neon cyan interior glow, military Sandevistan cyber-spine implant.',
      features: 'Lucy has iridescent rainbow pastel bob hair, deep violet eyes, sleek black netrunner monowire suit.',
      iconicItem: 'Military Sandevistan Spine Accelerator, Netrunner Monowire, BD Braindance headset, Moon rocket ticket.',
      hairAndEyes: 'Neon glowing cyberware lines, reflective chrome augmentations.',
      colorPalette: ['#FACC15', '#06B6D4', '#EC4899', '#0F172A'],
    },
    abilitiesAndMoves: [
      'Military Sandevistan (Time-dilation supersonic speed blitz)',
      'Lucys Deep Net Dive & Monowire Slice',
      'Cyberskeleton Gravity Compression Overdrive',
      'Gorilla Arms Kinetic Impact',
    ],
    voiceActor: 'KENN / Zach Aguilar / Aoi Yuuki / Emi Lo',
    synopsis:
      'In a dystopian Night City obsessed with cybernetic body modification and corporate greed, street kid David Martinez loses everything in a drive-by tragedy. Installing a military-grade Sandevistan cyberware spine, he joins Maines crew of mercenary Edgerunners alongside enigmatic netrunner Lucy, fighting to reach the Moon.',
    characterLore:
      'Created by Studio Trigger in collaboration with CD Projekt Red, Edgerunners revitalized the Cyberpunk universe, winning Anime of the Year 2023 for its hyper-kinetic animation and devastating emotional climax.',
    subtitles: {
      en: {
        languageCode: 'en',
        languageName: 'English',
        nativeName: 'English',
        flag: '🇬🇧',
        quotes: [
          { time: '00:01', speaker: 'David', text: 'I promise Lucy, I will take you to the Moon.', translated: 'I promise Lucy, I will take you to the Moon, no matter what happens to me.' },
          { time: '00:05', speaker: 'Lucy', text: 'Night City always wins, David. Dont make promises you cant keep.', translated: 'Night City consumes everyone in the end. Just stay with me.' },
        ],
        fullSrt: '',
      },
      ja: {
        languageCode: 'ja',
        languageName: 'Japanese',
        nativeName: '日本語',
        flag: '🇯🇵',
        quotes: [
          { time: '00:01', speaker: 'David', text: 'ルーシー、約束する。オレが絶対お前を月に連れて行く！', translated: 'ルーシー、約束する。オレが絶対お前を月に連れて行く！サンデヴィスタン起動！' },
          { time: '00:05', speaker: 'Lucy', text: 'デイビッド、あなたを死なせたくないの...', translated: 'デイビッド、あなたを死なせたくないの...ナイトシティなんかに負けないで。' },
        ],
        fullSrt: '',
      },
      hi: {
        languageCode: 'hi',
        languageName: 'Hindi',
        nativeName: 'हिंदी',
        flag: '🇮🇳',
        quotes: [
          { time: '00:01', speaker: 'David', text: 'Main vaada karta hu Lucy, main tumhe chaand par le jaunga!', translated: 'मैं वादा करता हूँ लूसी, चाहे मेरी जान चली जाए, मैं तुम्हें चाँद पर ले जाऊँगा!' },
        ],
        fullSrt: '',
      },
    },
    studioPresets: {
      imagePrompt:
        'David Martinez in yellow EMT jacket and Lucy with iridescent pastel hair looking at glowing Moon from Night City skyscraper rooftop, heavy neon rain, chromatic aberration, 8k cinematic hyperrealism',
      imageStyle: 'Cyberpunk Neon Synthwave',
      videoPrompt:
        'David activating Sandevistan in slow motion, cyan speed afterimages ripping through Arasaka corporate soldiers in rain-slick neon alleyway, 60fps anamorphic IMAX camera move',
      filmScriptPrompt:
        'EXT. NIGHT CITY MEGABUILDING ROOFTOP - NIGHT\nAcid rain falls in violet neon sheets.\nDAVID touches his titanium spinal implant. Green coolant steam hisses.\nLUCY looks up at the colossal holo-billboard of the Moon.',
      threeModelArchetype: 'Cybernetic Augmented Street Mercenary Rig',
      threePrompt: '3D high-fidelity mesh of David Martinez with glowing Sandevistan spinal cyberware and yellow jacket cloth physics',
      songThemePrompt: 'Melancholic Synthwave Cyberpunk Ballad with driving analog arpeggios, emotive electric guitar wails and haunting female vocal reverb (I Really Want to Stay at Your House vibes)',
      songGenre: 'Cyberpunk Darksynth & Retrowave Melodic',
      dubbingDialogue: 'I promise Lucy, I will take you to the Moon.',
      mangaStoryline: 'Panel 1: Sandevistan click. Panel 2: Golden lightning trail across panels. Panel 3: Lucys monowire glowing.',
      docBibleTitle: 'Cyberpunk Edgerunners: Night City Underworld & Cyberware Lore Bible',
      gameArchetype: 'High-Risk Supersonic Cybernetic Assassin',
    },
  },

  // 7. STRANGER THINGS (Global Netflix OTT Web Series)
  {
    id: 'ent_stranger_things',
    title: 'Stranger Things',
    character: 'Eleven (Jane Hopper) & Vecna',
    nativeName: 'ストレンジャー・シングス / स्ट्रेंजर थिंग्स',
    franchise: 'Hawkins & The Upside Down Multiverse',
    universe: 'Duffer Brothers 80s Sci-Fi Realm',
    mediaType: 'ott_series',
    genres: ['Sci-Fi Horror', '80s Nostalgia', 'Supernatural Mystery', 'OTT Global Thriller'],
    ottPlatforms: ['Netflix Original Worldwide'],
    releaseYear: '2016–2025',
    seasonsEpisodes: '5 Seasons (42 Episodes)',
    ageRating: 'TV-14 / TV-MA (18+ Elements)',
    rating: { score: 9.5, max: 10, source: 'Netflix #1 Global OTT Flagship' },
    bannerImage:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80',
    characterAvatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    studioOrCreator: 'The Duffer Brothers / 21 Laps Entertainment / Netflix',
    originCountry: 'USA',
    visualTraits: {
      outfit: 'Eleven wears 80s retro flannel/plaid, shaved head / curly brunette hair, bloody nose after telekinesis.',
      features: 'Intense piercing telekinetic stare, wrist tattoo "011", psychic sensory deprivation blindfold.',
      iconicItem: 'Eggo Waffles, Walkie-Talkies, Dungeons & Dragons Demogorgon figurine, grandfather clock chime.',
      hairAndEyes: 'Dark brown hair, determined psychic eyes.',
      colorPalette: ['#DC2626', '#1E1B4B', '#0284C7', '#0F172A'],
    },
    abilitiesAndMoves: [
      'Telekinesis & Gravitational Crush (Levitating vans, crushing gates)',
      'Void Astral Projection & Telepathic Eavesdropping',
      'Inter-Dimensional Upside Down Gate Manipulation',
      'Psychic Mind Blast & Memories Purification',
    ],
    voiceActor: 'Millie Bobby Brown / Jamie Campbell Bower',
    synopsis:
      'When young Will Byers vanishes in Hawkins, Indiana in 1983, his friends Mike, Dustin, and Lucas uncover a government conspiracy involving secret experiments and a telekinetic girl named Eleven. Together they fight terrifying dimensional monsters from the Upside Down including the Demogorgon, Mind Flayer, and Vecna.',
    characterLore:
      'A global pop-culture phenomenon that redefined binge-watching on streaming platforms. Filled with 80s synth music, Steven Spielberg-inspired adventure, and Stephen King-style supernatural horror.',
    subtitles: {
      en: {
        languageCode: 'en',
        languageName: 'English',
        nativeName: 'English',
        flag: '🇬🇧',
        quotes: [
          { time: '00:01', speaker: 'Eleven', text: 'Friends dont lie.', translated: 'Friends dont lie. I will protect you Mike.' },
          { time: '00:05', speaker: 'Vecna', text: 'It is time for your suffering to end, Eleven.', translated: 'Your friends are gone, Eleven. The Upside Down cannot be stopped.' },
        ],
        fullSrt: '',
      },
      hi: {
        languageCode: 'hi',
        languageName: 'Hindi',
        nativeName: 'हिंदी',
        flag: '🇮🇳',
        quotes: [
          { time: '00:01', speaker: 'Eleven', text: 'Dost kabhi jhooth nahi bolte!', translated: 'दोस्त कभी झूठ नहीं बोलते! मैं अपने दोस्तों को कुछ नहीं होने दूंगी!' },
          { time: '00:06', speaker: 'Vecna', text: 'Ab tumhara waqt khatam ho chuka hai.', translated: 'अब हॉकिन्स का अंत करीब है, इलेवन!' },
        ],
        fullSrt: '',
      },
    },
    studioPresets: {
      imagePrompt:
        'Eleven standing in front of the crimson glowing Upside Down rift portal in Hawkins High School hallway, levitating red spore particles, bloody nose, intense telekinetic pose, 8k cinematic lighting',
      imageStyle: 'Neo-Noir Shadow Detective & Femme Fatale',
      videoPrompt:
        'Eleven raising both hands as grandfather clock chimes echo, levitating stone tiles in slow motion while Vecnas shadow looms behind red thunder clouds, 4k 60fps',
      filmScriptPrompt:
        'INT. HAWKINS LAB VOID - DIMENSIONAL BLACK WATER - NIGHT\nELEVEN walks on the shallow infinite black mirror water.\nA single crimson grandfather clock ticks with booming resonance.\nVECNA emerges from the shadow vines.',
      threeModelArchetype: 'Psychic Telekinetic Female Hero Rig',
      threePrompt: '3D realistic character model of Eleven with blindfold accessory, telekinetic particle emitter shader, and Hawkins lab coat',
      songThemePrompt: 'Eerie 80s Analog Synth Darkwave Theme with pulsating Roland Juno basslines, chilling chime bells and retro arpeggiator builds',
      songGenre: '80s Retro Synthwave & Dark Cinematic Horror',
      dubbingDialogue: 'Friends dont lie. I can fight him.',
      mangaStoryline: 'Panel 1: The grandfather clock chimes. Panel 2: Blood drips from Elevens nose. Panel 3: Shockwave blasts Vecna back!',
      docBibleTitle: 'Stranger Things & The Upside Down World Production Pitch Bible',
      gameArchetype: 'Telekinetic Psychic Mage with Stun and Barrier Field',
    },
  },

  // 8. SACRED GAMES (Netflix 18+ Indian OTT Crime Masterpiece)
  {
    id: 'ent_sacred_games',
    title: 'Sacred Games',
    character: 'Ganesh Gaitonde & Sartaj Singh',
    nativeName: 'सेक्रेड गेम्स',
    franchise: 'Mumbai Underworld Chronicles',
    universe: 'Vikram Chandra Noir Mumbai',
    mediaType: '18_plus_mature',
    genres: ['18+ Gangster Noir', 'Crime Thriller', 'Political Satire', 'Mystery OTT'],
    ottPlatforms: ['Netflix Worldwide'],
    releaseYear: '2018–2019',
    seasonsEpisodes: '2 Seasons (16 Episodes)',
    ageRating: '18+ Uncensored Explicit (A)',
    rating: { score: 9.3, max: 10, source: 'International Emmy Nominee' },
    bannerImage:
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=80',
    characterAvatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    studioOrCreator: 'Anurag Kashyap / Vikramaditya Motwane / Netflix India',
    originCountry: 'India',
    visualTraits: {
      outfit: 'Gaitonde in 80s/90s silk printed shirts, gold rings, smoking cigarette; Sartaj in Mumbai police khaki / turban.',
      features: 'Gaitondes piercing arrogant gangster gaze, Sartajs weary troubled investigative eyes.',
      iconicItem: 'Black rotary telephone, Mandalas nuclear bunker schematic, revolver, red suitcase.',
      hairAndEyes: 'Rugged vintage Mumbai aesthetic.',
      colorPalette: ['#B91C1C', '#D97706', '#1E293B', '#F3F4F6'],
    },
    abilitiesAndMoves: [
      'Gaitondes Street Syndicate Dominance ("Kabhi kabhi lagta hai apun hi bhagwan hai")',
      'Sartajs Tenacious Code Cracking',
      'Mumbai Underworld Information Network',
      'Nuclear Apocalypse Countdown Mastery',
    ],
    voiceActor: 'Nawazuddin Siddiqui (Gaitonde) / Saif Ali Khan (Sartaj Singh)',
    synopsis:
      'Troubled Mumbai police officer Sartaj Singh receives an anonymous phone call from presumed-dead gangster overlord Ganesh Gaitonde, who gives him 25 days to save Mumbai from an impending catastrophic conspiracy.',
    characterLore:
      'Indias first Netflix Original series that revolutionized Indian OTT web entertainment, acclaimed internationally for raw writing, philosophical subtext, and powerhouse performances.',
    subtitles: {
      hi: {
        languageCode: 'hi',
        languageName: 'Hindi',
        nativeName: 'हिंदी',
        flag: '🇮🇳',
        quotes: [
          { time: '00:01', speaker: 'Gaitonde', text: 'Kabhi kabhi lagta hai apun hi bhagwan hai!', translated: 'कभी कभी लगता है अपुन ही भगवान है! 25 दिन हैं तेरे पास, बचा ले अपने शहर को!' },
          { time: '00:06', speaker: 'Sartaj', text: 'Kaun bol raha hai? Kisko bachana hai?', translated: 'कौन बोल रहा है? क्या होने वाला है पच्चीस दिन में?!' },
        ],
        fullSrt: '',
      },
      en: {
        languageCode: 'en',
        languageName: 'English',
        nativeName: 'English',
        flag: '🇬🇧',
        quotes: [
          { time: '00:01', speaker: 'Gaitonde', text: 'Sometimes I feel like I am God himself.', translated: 'Sometimes I feel like I am God himself. You have 25 days, save your city, Sartaj.' },
          { time: '00:06', speaker: 'Sartaj', text: 'Who is this speaking? What happens in 25 days?', translated: 'Who are you? Tell me what you are planning!' },
        ],
        fullSrt: '',
      },
    },
    studioPresets: {
      imagePrompt:
        'Ganesh Gaitonde standing in smoke-filled 1980s Mumbai docks warehouse, vintage silk shirt, holding glass of whiskey, neon yellow sodium streetlights, 8k cinematic hyperrealism',
      imageStyle: 'Hardcore Mafia & Underworld Crime Syndicate',
      videoPrompt:
        'Gaitonde talking into vintage red rotary phone while rain drenches Mumbai Marine Drive skyline, camera rotating dramatically around his face, 35mm film grain',
      filmScriptPrompt:
        'INT. ABANDONED BUNGALOW - MUMBAI - NIGHT\nThe rotary phone rings shrilly. SARTAJ picks up with trembling hands.\nGAITONDE (V.O.): "Sartaj Singh... Pehchana? Ya bhool gaya?"',
      threeModelArchetype: 'Vintage Noir Crime Protagonist Rig',
      threePrompt: '3D character model of Gaitonde with retro 80s outfit, vintage cigarette prop and realistic skin textures',
      songThemePrompt: 'Dark Gritty Mumbai Noir Sitar and Heavy Trap Beat with ominous brass horns and subterranean bass rumble',
      songGenre: 'Dark Desi Trap & Cinematic Gangster Noir',
      dubbingDialogue: 'Kabhi kabhi lagta hai apun hi bhagwan hai. 25 din hai tere paas.',
      mangaStoryline: 'Panel 1: The red phone rings. Panel 2: Sartaj picks up. Panel 3: Gaitondes shadow over Mumbai map.',
      docBibleTitle: 'Sacred Games: Mumbai Underworld & Nuclear Conspiracy Series Bible',
      gameArchetype: 'Crime Boss Mastermind with Intimidation Buffs',
    },
  },

  // 9. SPIDER-MAN & MILES MORALES (Marvel / Sony Blockbuster Universe)
  {
    id: 'ent_spiderman',
    title: 'Spider-Man / Spider-Verse',
    character: 'Peter Parker & Miles Morales',
    nativeName: 'スパイダーマン / स्पाइडर-मैन',
    franchise: 'Marvel Spider-Man Multiverse',
    universe: 'Earth-616 & Earth-1610 Spider-Verse',
    mediaType: 'movie',
    genres: ['Superhero Blockbuster', 'Comic Animation', 'Action Sci-Fi', 'Multiverse Adventure'],
    ottPlatforms: ['Disney+ Hotstar', 'Netflix', 'Sony Pictures Core', 'Amazon Prime'],
    releaseYear: '1962–Present',
    seasonsEpisodes: '10+ Live-Action Films, Spider-Verse Trilogy, 500+ Comics',
    ageRating: 'PG-13 / All Ages',
    rating: { score: 9.9, max: 10, source: 'Global Comic & Cinema Gold' },
    bannerImage:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
    characterAvatar:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    studioOrCreator: 'Stan Lee & Steve Ditko / Sony Pictures Animation / Marvel',
    originCountry: 'USA',
    visualTraits: {
      outfit: 'Red and blue webbed spandex suit with expressive white lenses; Miles in sleek black and crimson spray-paint graffiti suit.',
      features: 'Acrobatic agile physique, wrist web-shooters, signature spider emblem on chest and back.',
      iconicItem: 'Web Shooters, Web-Wings, Spider-Drone, Multiverse Dimension Watch.',
      hairAndEyes: 'Brown / Afro textured hair, glowing white animated eye lenses.',
      colorPalette: ['#EF4444', '#1D4ED8', '#111827', '#F3F4F6'],
    },
    abilitiesAndMoves: [
      'Web-Slinging & Supersonic Wall-Crawling',
      'Spider-Sense (Pre-cognitive danger warning)',
      'Venom Strike / Bio-Electric Shock (Miles Morales)',
      'Camouflage / Invisibility Cloaking',
      'Maximum Spider Multiverse Web-Kick',
    ],
    voiceActor: 'Shameik Moore / Tom Holland / Yuri Lowenthal / Tiger Shroff (Hindi Dub)',
    synopsis:
      'Bitten by a radioactive spider, teenager Peter Parker (and later Brooklyn kid Miles Morales) learns the ultimate truth that with great power comes great responsibility. Swinging through the skyscrapers of New York City and navigating the multiverse, Spider-Man protects both the everyday citizen and reality itself.',
    characterLore:
      'Marvels flagship hero and one of the three most popular fictional characters in world history. Groundbreaking for Spider-Verse animation style that merges comic halftone printing with 3D CGI.',
    subtitles: {
      en: {
        languageCode: 'en',
        languageName: 'English',
        nativeName: 'English',
        flag: '🇬🇧',
        quotes: [
          { time: '00:01', speaker: 'Spider-Man', text: 'With great power comes great responsibility.', translated: 'With great power comes great responsibility. Anyone can wear the mask.' },
          { time: '00:05', speaker: 'Miles Morales', text: 'Nah, Imma do my own thing.', translated: 'Everyone keeps telling me how my story is supposed to go. Nah, Imma do my own thing!' },
        ],
        fullSrt: '',
      },
      hi: {
        languageCode: 'hi',
        languageName: 'Hindi',
        nativeName: 'हिंदी',
        flag: '🇮🇳',
        quotes: [
          { time: '00:01', speaker: 'Spider-Man', text: 'Badi taakat ke saath badi zimmedari aati hai!', translated: 'बड़ी ताकत के साथ बड़ी ज़िम्मेदारी आती है! न्यू यॉर्क को मैं बचाऊंगा!' },
          { time: '00:05', speaker: 'Miles Morales', text: 'Main apna raasta khud banaunga!', translated: 'मैं अपनी कहानी खुद लिखूंगा! स्पाइडर-मैन कभी हार नहीं मानता!' },
        ],
        fullSrt: '',
      },
      ja: {
        languageCode: 'ja',
        languageName: 'Japanese',
        nativeName: '日本語',
        flag: '🇯🇵',
        quotes: [
          { time: '00:01', speaker: 'Spider-Man', text: '大いなる力には、大いなる責任が伴う。', translated: '大いなる力には、大いなる責任が伴う。親愛なる隣人スパイダーマン参上！' },
        ],
        fullSrt: '',
      },
    },
    studioPresets: {
      imagePrompt:
        'Miles Morales leaping backwards off a Manhattan skyscraper into neon rainy New York night, comic screentone halftones, spray-paint red spider logo, 8k Spider-Verse animation style',
      imageStyle: 'Manga & Comic Screentone',
      videoPrompt:
        'Spider-Man web-slinging at breakneck speed between skyscrapers, doing an acrobatic triple backflip in mid-air, dynamic drone camera chase 60fps',
      filmScriptPrompt:
        'EXT. MANHATTAN SKYLINE - MIDNIGHT - SNOWFALL\nMILES stands on the edge of the eagle gargoyle.\nHe lets himself fall backwards. The city inverts.\nMILES (V.O.): "Its a leap of faith. Thats all it is, Miles."',
      threeModelArchetype: 'Acrobatic Superhero Rig with Dynamic Cloth Web Physics',
      threePrompt: '3D rigged character mesh of Spider-Man with dual web-shooters, dynamic lens morph targets and comic shader',
      songThemePrompt: 'Electrifying Hip-Hop Superhero Anthem with booming 808s, soaring orchestral strings and high-energy vocal hooks (Sunflower / What’s Up Danger style)',
      songGenre: 'Cinematic Hip-Hop & Superhero Symphony',
      dubbingDialogue: 'With great power comes great responsibility. Im Spider-Man!',
      mangaStoryline: 'Panel 1: Falling upside down. Panel 2: Web shoot sound "THWIP!". Panel 3: Soaring through comic panel borders!',
      docBibleTitle: 'Spider-Man Multiverse Cinematic Production & Character Bible',
      gameArchetype: 'High-Mobility Aerial Acrobat with Web Crowd Control',
    },
  },

  // 10. ELDEN RING & SOULS LORE (AAA Gaming Legend)
  {
    id: 'ent_elden_ring',
    title: 'Elden Ring',
    character: 'The Tarnished & Malenia (Blade of Miquella)',
    nativeName: 'エルデンリング (マレニア)',
    franchise: 'Lands Between Mythos',
    universe: 'FromSoftware Dark Fantasy Universe',
    mediaType: 'game',
    genres: ['Dark Fantasy RPG', 'AAA Gaming', 'Epic Mythology', 'Boss Battle Action'],
    ottPlatforms: ['Bandai Namco', 'PlayStation', 'Xbox', 'Steam PC'],
    releaseYear: '2022–Present',
    seasonsEpisodes: 'Game of the Year 2022 + Shadow of the Erdtree',
    ageRating: '18+ Mature (ESRB M)',
    rating: { score: 9.9, max: 10, source: 'The Game Awards GOTY' },
    bannerImage:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
    characterAvatar:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    studioOrCreator: 'Hidetaka Miyazaki / George R. R. Martin / FromSoftware',
    originCountry: 'Japan',
    visualTraits: {
      outfit: 'Malenia in flowing gold prosthetic unalloyed armor, winged helmet, prosthetic sword arm; Tarnished in raging wolf armor.',
      features: 'Unalloyed gold prosthetics, scarlet rot butterfly wings, tall graceful warrior stance.',
      iconicItem: 'Waterfowl Dance Katana, Great Runes, Erdtree Grace, Spectral Steed Torrent.',
      hairAndEyes: 'Long fiery crimson red hair, blindfold golden winged helm.',
      colorPalette: ['#D97706', '#DC2626', '#1E293B', '#F59E0B'],
    },
    abilitiesAndMoves: [
      'Waterfowl Dance (Undodgeable multi-stage hurricane slash)',
      'Scarlet Aeonia (Exploding rot lotus bloom)',
      'Lifesteal on Hit (Heals upon delivering sword strikes)',
      'Erdtree Incantations & Elden Lord Sorceries',
    ],
    voiceActor: 'Pippa Bennett-Warner / Anthony Howell',
    synopsis:
      'In the Lands Between ruled by Queen Marika the Eternal, the shattering of the Elden Ring led to war between her demigod children. The Tarnished returns across the fog to gather the Great Runes, defeat the undefeated swordswoman Malenia, and become the Elden Lord.',
    characterLore:
      'Co-written by Hidetaka Miyazaki and George R. R. Martin, Elden Ring won over 400 Game of the Year awards, celebrated for legendary boss designs, deep world history, and unmatched atmospheric storytelling.',
    subtitles: {
      en: {
        languageCode: 'en',
        languageName: 'English',
        nativeName: 'English',
        flag: '🇬🇧',
        quotes: [
          { time: '00:01', speaker: 'Malenia', text: 'I am Malenia, Blade of Miquella.', translated: 'I am Malenia, Blade of Miquella. And I have never known defeat.' },
          { time: '00:05', speaker: 'Malenia', text: 'Let your flesh be consumed by the Scarlet Rot.', translated: 'Now, rot! Witness true horror as the Scarlet Aeonia blooms.' },
        ],
        fullSrt: '',
      },
      ja: {
        languageCode: 'ja',
        languageName: 'Japanese',
        nativeName: '日本語',
        flag: '🇯🇵',
        quotes: [
          { time: '00:01', speaker: 'Malenia', text: '我はミケラの刃、マレニア。', translated: '我はミケラの刃、マレニア。そして、敗れを知らぬ。腐敗の女神を見よ。' },
        ],
        fullSrt: '',
      },
      hi: {
        languageCode: 'hi',
        languageName: 'Hindi',
        nativeName: 'हिंदी',
        flag: '🇮🇳',
        quotes: [
          { time: '00:01', speaker: 'Malenia', text: 'Main Malenia hu, Blade of Miquella!', translated: 'मैं मलेनिया हूँ, और मैंने कभी हार का स्वाद नहीं चखा! अब तुम्हारा अंत तय है!' },
        ],
        fullSrt: '',
      },
    },
    studioPresets: {
      imagePrompt:
        'Malenia Blade of Miquella hovering in the air beneath colossal glowing golden Erdtree roots, scarlet rot butterflies fluttering around golden winged helmet, 8k Unreal Engine 5 masterpiece',
      imageStyle: 'Occult Dark Fantasy & Demonology',
      videoPrompt:
        'Malenia executing the Waterfowl Dance in slow motion, golden prosthetic blade carving glowing trails in the air before descending with lethal grace, 60fps',
      filmScriptPrompt:
        'INT. ROOTS OF THE HALIGTREE - CORAL DUNES - DAWN\nMALENIA rises slowly from the throne of dry rot roots.\nShe clicks her golden prosthetic blade into place.\nMALENIA: "I dreamt for so long... My flesh was dull gold... and my blood, rotted."',
      threeModelArchetype: 'Epic Armored Demigod Boss Rig with Dual Cloth & Sword Bones',
      threePrompt: '3D AAA game mesh of Malenia with gold prosthetic sword arm, flowing cape cloth dynamics and rot wing particles',
      songThemePrompt: 'Haunting Dark Souls Choral Requiem with ominous pipe organ, operatic soprano soloist, and explosive apocalyptic brass crescendo',
      songGenre: 'Epic Orchestral Dark Souls Choir & Gothic Symphony',
      dubbingDialogue: 'I am Malenia, Blade of Miquella. And I have never known defeat.',
      mangaStoryline: 'Panel 1: Footsteps in the rot dunes. Panel 2: Golden helmet reflects the Tarnished. Panel 3: Blade unsheathed!',
      docBibleTitle: 'Elden Ring: Lands Between Demigods & Mythic Lore Bible',
      gameArchetype: 'Lethal Boss Swordsman with Lifesteal & Aerial Finisher',
    },
  },
];

// Helper: Real-time search engine query processor
export function searchEntertainmentCatalog(
  query: string,
  filterType: 'all' | EntertainmentMediaType = 'all'
): EntertainmentItem[] {
  const q = query.trim().toLowerCase();

  let results = MASTER_ENTERTAINMENT_CATALOG;

  if (filterType !== 'all') {
    results = results.filter((item) => item.mediaType === filterType);
  }

  if (!q) {
    return results;
  }

  // Multi-term fuzzy matching against character name, title, universe, native name, genres, OTT platform, keywords
  const matched = results.filter((item) => {
    const matchName = item.character.toLowerCase().includes(q);
    const matchTitle = item.title.toLowerCase().includes(q);
    const matchNative = item.nativeName?.toLowerCase().includes(q);
    const matchUniverse = item.universe.toLowerCase().includes(q);
    const matchFranchise = item.franchise.toLowerCase().includes(q);
    const matchStudio = item.studioOrCreator.toLowerCase().includes(q);
    const matchGenres = item.genres.some((g) => g.toLowerCase().includes(q));
    const matchOtt = item.ottPlatforms.some((o) => o.toLowerCase().includes(q));
    const matchAbilities = item.abilitiesAndMoves.some((a) => a.toLowerCase().includes(q));

    return (
      matchName ||
      matchTitle ||
      matchNative ||
      matchUniverse ||
      matchFranchise ||
      matchStudio ||
      matchGenres ||
      matchOtt ||
      matchAbilities
    );
  });

  return matched;
}

// Generate dynamic entertainment metadata for ANY obscure or custom character / media if not found
export function generateDynamicEntertainmentItem(query: string): EntertainmentItem {
  const sanitized = query.trim();
  const titleCase = sanitized
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const defaultQuotes: SubtitleQuote[] = [
    { time: '00:01', speaker: titleCase, text: `I am ${titleCase}! Ready for action across the multiverse.`, translated: `मैं हूँ ${titleCase}! ब्रह्मांड में हर चुनौती का सामना करने के लिए तैयार!` },
    { time: '00:05', speaker: titleCase, text: `Witness the true power and signature move!`, translated: `देखो मेरी असली ताक़त और खास अंदाज़!` },
  ];

  const srtTrack = generateSrtContent(defaultQuotes);

  return {
    id: `ent_dyn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: `${titleCase} Universe`,
    character: titleCase,
    nativeName: titleCase,
    franchise: `${titleCase} Global Saga`,
    universe: 'Universal Worldwide Media Vault',
    mediaType: 'anime',
    genres: ['Global Entertainment', 'Action & Adventure', 'Worldwide Lore', 'Creative Media'],
    ottPlatforms: ['Netflix', 'Prime Video', 'Disney+ Hotstar', 'Crunchyroll', 'JioCinema', 'YouTube'],
    releaseYear: 'Worldwide Hit',
    seasonsEpisodes: 'Full Universal Anthology',
    ageRating: 'All Ages / Universal',
    rating: { score: 9.5, max: 10, source: 'Universal AI Aggregator' },
    bannerImage:
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1920&q=80',
    characterAvatar:
      'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80',
    studioOrCreator: 'Global Creative Entertainment Studios',
    originCountry: 'Worldwide',
    visualTraits: {
      outfit: `Iconic signature hero costume with distinct color theme, accessories, and styling tailored for ${titleCase}.`,
      features: `Distinctive facial structure, heroic expressive eyes, and dynamic posture.`,
      iconicItem: `Signature legendary weapon / artifact / accessory associated with ${titleCase}.`,
      hairAndEyes: 'High-definition stylized aesthetic matching the characters original media archetype.',
      colorPalette: ['#3B82F6', '#EF4444', '#F59E0B', '#10B981'],
    },
    abilitiesAndMoves: [
      `${titleCase} Signature Multi-Strike`,
      `Ultimate Multiverse Surge Attack`,
      `Defensive Energy Barrier Shield`,
      `Acrobatic Counter Technique`,
    ],
    voiceActor: `Original Voice Artist for ${titleCase}`,
    synopsis: `An iconic global entertainment figure celebrated worldwide. Known for gripping storyline arcs, loyal allies, unforgettable conflicts, and memorable dialogues that resonate with fans across the world.`,
    characterLore: `Extensive background lore and worldbuilding spanning animated series, movies, streaming web episodes, and interactive gaming experiences.`,
    subtitles: {
      hi: {
        languageCode: 'hi',
        languageName: 'Hindi',
        nativeName: 'हिंदी',
        flag: '🇮🇳',
        quotes: [
          { time: '00:01', speaker: titleCase, text: `Main hu ${titleCase}!`, translated: `मैं हूँ ${titleCase}! अपनी मंज़िल को हासिल करके रहूँगा!` },
          { time: '00:05', speaker: titleCase, text: `Yeh meri sabse badi taakat hai!`, translated: `यह है मेरी सबसे बड़ी ताक़त, कोई मुझे रोक नहीं सकता!` },
        ],
        fullSrt: srtTrack,
      },
      en: {
        languageCode: 'en',
        languageName: 'English',
        nativeName: 'English',
        flag: '🇬🇧',
        quotes: defaultQuotes,
        fullSrt: srtTrack,
      },
      ja: {
        languageCode: 'ja',
        languageName: 'Japanese',
        nativeName: '日本語',
        flag: '🇯🇵',
        quotes: [
          { time: '00:01', speaker: titleCase, text: `オレは${titleCase}だ！`, translated: `オレは${titleCase}だ！絶対に負けない！` },
        ],
        fullSrt: srtTrack,
      },
      es: {
        languageCode: 'es',
        languageName: 'Spanish',
        nativeName: 'Español',
        flag: '🇪🇸',
        quotes: [
          { time: '00:01', speaker: titleCase, text: `¡Soy ${titleCase}!`, translated: `¡Soy ${titleCase}! ¡Nada puede detenerme!` },
        ],
        fullSrt: srtTrack,
      },
    },
    studioPresets: {
      imagePrompt: `Photorealistic 8k cinematic render of ${titleCase}, dynamic pose, volumetric studio lighting, high resolution textures, sharp focus, masterpiece`,
      imageStyle: 'Photorealistic 8K Anamorphic IMAX',
      videoPrompt: `${titleCase} performing dynamic cinematic action sequence with camera orbiting around, 60fps 8k motion blur`,
      filmScriptPrompt: `INT. CINEMATIC ARENA - DAY\n${titleCase.toUpperCase()} emerges from the smoke, eyes glowing with determination.\n${titleCase.toUpperCase()}: "The journey begins now."`,
      threeModelArchetype: 'Stylized 3D Rigged Hero Character Model',
      threePrompt: `3D high-poly rigged character model of ${titleCase} with complete 17-bone skeleton kinematics`,
      songThemePrompt: `Epic Heroic Theme Song for ${titleCase} with driving beats, soaring synths and triumphant brass horns`,
      songGenre: 'Epic Superhero Orchestral & Cinematic Synthwave',
      dubbingDialogue: `I am ${titleCase}! The ultimate adventure awaits!`,
      mangaStoryline: `Panel 1: Close up on ${titleCase}. Panel 2: Power gathers. Panel 3: Huge splash page impact!`,
      docBibleTitle: `${titleCase} Universal Franchise Production Pitch Document`,
      gameArchetype: 'Balanced Hero Fighter with Special Ultimate Move',
    },
    mediaLinks: {
      imdbUrl: `https://www.imdb.com/find?q=${encodeURIComponent(titleCase)}`,
      tmdbUrl: `https://www.themoviedb.org/search?query=${encodeURIComponent(titleCase)}`,
      trailerUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(titleCase + ' trailer')}`,
      posterHighResUrl: `https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80`,
      backdropHighResUrl: `https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80`,
    },
  };
}

// Cross-Platform Live Search Aggregator (TMDB + OMDb + Offline Master Catalog + Dynamic Lore Generator)
export async function fetchCrossPlatformEntertainmentSearch(
  query: string,
  filterType: 'all' | EntertainmentMediaType = 'all',
  options?: { tmdbKey?: string; omdbKey?: string }
): Promise<{
  items: EntertainmentItem[];
  providersActive: { tmdb: boolean; omdb: boolean; catalog: boolean };
  source: 'live_api' | 'catalog_merge' | 'dynamic_lore';
}> {
  const q = query.trim();
  if (!q) {
    const catalogList = filterType === 'all'
      ? MASTER_ENTERTAINMENT_CATALOG
      : MASTER_ENTERTAINMENT_CATALOG.filter((i) => i.mediaType === filterType);
    return {
      items: catalogList,
      providersActive: { tmdb: false, omdb: false, catalog: true },
      source: 'catalog_merge',
    };
  }

  // 1. First search internal high-fidelity catalog
  const catalogMatches = searchEntertainmentCatalog(q, filterType);

  // 2. Fetch from backend cross-platform endpoint (/api/entertainment/search)
  let liveApiResults: EntertainmentItem[] = [];
  let tmdbActive = false;
  let omdbActive = false;

  try {
    const params = new URLSearchParams({
      q,
      type: filterType,
      ...(options?.tmdbKey ? { tmdbKey: options.tmdbKey } : {}),
      ...(options?.omdbKey ? { omdbKey: options.omdbKey } : {}),
    });

    const res = await fetch(`/api/entertainment/search?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.results) && data.results.length > 0) {
        tmdbActive = Boolean(data.providers?.tmdbActive);
        omdbActive = Boolean(data.providers?.omdbActive);

        liveApiResults = data.results.map((raw: any) => {
          // Enrich with full studio presets and multi-language subtitles
          const dynamicArchetype = generateDynamicEntertainmentItem(raw.title || raw.character || q);
          return {
            ...dynamicArchetype,
            ...raw,
            rating: raw.rating || dynamicArchetype.rating,
            mediaLinks: {
              ...dynamicArchetype.mediaLinks,
              ...(raw.mediaLinks || {}),
            },
            subtitles: dynamicArchetype.subtitles,
            studioPresets: {
              ...dynamicArchetype.studioPresets,
              ...(raw.studioPresets || {}),
            },
          } as EntertainmentItem;
        });
      }
    }
  } catch (err) {
    console.warn('[Entertainment Aggregator] Live API search failed, falling back to catalog:', err);
  }

  // Merge results without duplicates
  const seenIds = new Set<string>();
  const merged: EntertainmentItem[] = [];

  // Prioritize exact catalog matches first
  for (const item of catalogMatches) {
    if (!seenIds.has(item.id.toLowerCase())) {
      seenIds.add(item.id.toLowerCase());
      merged.push(item);
    }
  }

  // Then add live TMDB / OMDb hits
  for (const item of liveApiResults) {
    const key = (item.title || item.character).toLowerCase();
    if (!seenIds.has(key)) {
      seenIds.add(key);
      merged.push(item);
    }
  }

  // If still empty and user entered meaningful query, generate deep lore archetype
  if (merged.length === 0 && q.length >= 2) {
    const synthesized = generateDynamicEntertainmentItem(q);
    merged.push(synthesized);
    return {
      items: merged,
      providersActive: { tmdb: tmdbActive, omdb: omdbActive, catalog: true },
      source: 'dynamic_lore',
    };
  }

  return {
    items: merged,
    providersActive: {
      tmdb: tmdbActive || liveApiResults.some((i) => i.tmdbId),
      omdb: omdbActive || liveApiResults.some((i) => i.imdbId),
      catalog: catalogMatches.length > 0,
    },
    source: liveApiResults.length > 0 ? 'live_api' : 'catalog_merge',
  };
}

// 1-Click Import Entertainment Asset directly into Active Projects Hub
export async function importEntertainmentToActiveProject(
  item: EntertainmentItem,
  options?: {
    targetProjectId?: string;
    projectCategory?: 'film' | 'music' | 'office' | 'design' | '3d' | 'video' | 'general';
    customTitle?: string;
    saveAssetsToCloud?: boolean;
    userId?: string;
  }
): Promise<{ success: boolean; project: any; message: string }> {
  const userId = options?.userId || 'demo_user';
  const category = options?.projectCategory || (item.mediaType === 'game' ? '3d' : item.mediaType === 'anime' ? 'film' : 'film');
  const title = options?.customTitle || `${item.title}: ${item.character} Master Production Bible`;

  const projectContent = [
    `# =======================================================`,
    `# 🎬 PRODUCTION BIBLE: ${item.title.toUpperCase()}`,
    `# Character / Lead: ${item.character} | Universe: ${item.universe}`,
    `# Media: ${item.mediaType?.toUpperCase()} | Rating: ${item.rating?.score || '9.0'}/10 (${item.rating?.source || 'Cross-Platform API'})`,
    `# =======================================================\n`,
    `## 1. EXECUTIVE SYNOPSIS`,
    `${item.synopsis}\n`,
    `## 2. CHARACTER LORE & PSYCHOLOGY`,
    `${item.characterLore}\n`,
    `## 3. VISUAL SPECIFICATIONS & COSTUME DESIGN`,
    `- Signature Outfit: ${item.visualTraits?.outfit || 'Signature Hero Costume'}`,
    `- Key Features: ${item.visualTraits?.features || 'Distinctive Expressive Eyes'}`,
    `- Iconic Artifact: ${item.visualTraits?.iconicItem || 'Signature Weapon / Item'}`,
    `- Color Palette: ${(item.visualTraits?.colorPalette || []).join(', ') || '#3B82F6, #EF4444'}\n`,
    `## 4. STUDIO PRODUCTION PROMPTS`,
    `### 🎬 Cinematic Screenplay / Director Action:`,
    `${item.studioPresets?.filmScriptPrompt || 'INT. ARENA - DAY'}\n`,
    `### 🎨 8K Photorealistic Render Prompt:`,
    `${item.studioPresets?.imagePrompt || '8k high resolution cinematic portrait'}\n`,
    `### 🧊 3D WebGL Rigging Archetype:`,
    `Archetype: ${item.studioPresets?.threeModelArchetype || '3D Rigged Hero'}\nPrompt: ${item.studioPresets?.threePrompt || '3d high-poly model'}\n`,
    `### 🎙️ Dialogue Dubbing & Subtitle Script:`,
    `${item.studioPresets?.dubbingDialogue || 'Legendary dialogue sequence'}\n`,
    `## 5. CROSS-PLATFORM MEDIA & ASSET LINKS`,
    `- Poster URL: ${item.bannerImage || item.characterAvatar || 'N/A'}`,
    item.mediaLinks?.imdbUrl ? `- IMDb: ${item.mediaLinks.imdbUrl}` : '',
    item.mediaLinks?.tmdbUrl ? `- TMDB: ${item.mediaLinks.tmdbUrl}` : '',
    item.mediaLinks?.trailerUrl ? `- Official Trailer: ${item.mediaLinks.trailerUrl}` : '',
  ].filter(Boolean).join('\n');

  const newProject = {
    id: options?.targetProjectId || `proj_imported_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    title,
    description: item.synopsis || item.characterLore || `Cross-platform reference asset for ${item.title}`,
    category,
    isPinned: true,
    activeTool: item.mediaType === 'game' ? 'game_studio' : item.mediaType === 'anime' ? 'manga_storyboard' : 'film_studio',
    subTool: 'script',
    content: projectContent,
    tags: [
      'Imported',
      'Cross-Platform',
      item.franchise || item.title,
      item.mediaType || 'entertainment',
      ...(item.genres || []).slice(0, 3),
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Save to localStorage for instant client reactivity
  try {
    const existingStr = localStorage.getItem('icallog_user_projects_v1');
    const projects = existingStr ? JSON.parse(existingStr) : [];
    const index = projects.findIndex((p: any) => p.id === newProject.id);
    if (index >= 0) {
      projects[index] = newProject;
    } else {
      projects.unshift(newProject);
    }
    localStorage.setItem('icallog_user_projects_v1', JSON.stringify(projects));
    window.dispatchEvent(new CustomEvent('icallog_projects_updated', { detail: newProject }));
  } catch (err) {
    console.warn('[Entertainment Import] Local storage update failed:', err);
  }

  // 2. Call backend import endpoint to register cloud assets and SSE notification
  try {
    await fetch('/api/entertainment/import-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        item,
        targetProjectId: options?.targetProjectId,
        projectCategory: category,
        customTitle: title,
        saveAssetsToCloud: options?.saveAssetsToCloud !== false,
      }),
    });
  } catch (err) {
    console.warn('[Entertainment Import] Backend sync error:', err);
  }

  return {
    success: true,
    project: newProject,
    message: `"${item.title}" successfully imported into active projects!`,
  };
}

export interface TrendingMediaItem extends EntertainmentItem {
  rank?: number;
  popularityScore?: number;
  isTrending?: boolean;
  popularityTrend?: 'fire' | 'up' | 'down' | 'stable';
  timeWindow?: 'day' | 'week' | 'all_time';
}

/**
 * Fetch real-time Trending Media and Characters using TMDB API & Global Entertainment Hub
 */
export async function fetchTrendingMediaFromTMDB(options?: {
  timeWindow?: 'day' | 'week' | 'all_time';
  mediaType?: string;
  category?: string;
  language?: string;
  tmdbKey?: string;
  omdbKey?: string;
}): Promise<{
  items: TrendingMediaItem[];
  isLiveTmdb: boolean;
  total: number;
  timeWindow: string;
}> {
  const timeWindow = options?.timeWindow || 'day';
  const mediaType = options?.mediaType || 'all';
  const category = options?.category || 'all';
  const language = options?.language || 'en-US';

  try {
    const params = new URLSearchParams({
      timeWindow: timeWindow === 'all_time' ? 'week' : timeWindow,
      mediaType,
      category,
      language,
    });
    if (options?.tmdbKey) params.append('tmdbKey', options.tmdbKey);
    if (options?.omdbKey) params.append('omdbKey', options.omdbKey);

    const res = await fetch(`/api/entertainment/trending?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.results) && data.results.length > 0) {
        // Enforce full subtitle tracks & studio presets on any items returned
        const enhanced: TrendingMediaItem[] = data.results.map((item: any, idx: number) => {
          const baseItem = generateDynamicEntertainmentItem(item.title || 'Trending Hero');
          return {
            ...baseItem,
            ...item,
            rank: item.rank || idx + 1,
            popularityScore: item.popularityScore || 980 - idx * 30,
            isTrending: true,
            popularityTrend: idx < 3 ? 'fire' : idx < 8 ? 'up' : 'stable',
            subtitles: { ...baseItem.subtitles, ...(item.subtitles || {}) },
            studioPresets: { ...baseItem.studioPresets, ...(item.studioPresets || {}) },
          };
        });

        return {
          items: enhanced,
          isLiveTmdb: Boolean(data.isLiveTmdb),
          total: enhanced.length,
          timeWindow,
        };
      }
    }
  } catch (err) {
    console.warn('[Entertainment Aggregator] Failed to fetch trending from backend, generating live catalog:', err);
  }

  // Fallback / Standalone generator with top globally trending entities
  const catalogTrending = MASTER_ENTERTAINMENT_CATALOG.map((item, idx) => ({
    ...item,
    rank: idx + 1,
    popularityScore: 990 - idx * 25,
    isTrending: true,
    popularityTrend: idx < 3 ? ('fire' as const) : idx < 8 ? ('up' as const) : ('stable' as const),
    timeWindow: timeWindow,
  }));

  // Filter based on category or mediaType
  let filtered = catalogTrending;
  if (mediaType && mediaType !== 'all') {
    filtered = filtered.filter((i) => i.mediaType === mediaType);
  }
  if (category === 'anime') {
    filtered = catalogTrending.filter((i) => i.mediaType === 'anime');
  } else if (category === 'movies') {
    filtered = catalogTrending.filter((i) => i.mediaType === 'movie');
  } else if (category === 'tv_ott') {
    filtered = catalogTrending.filter((i) => i.mediaType === 'ott_series');
  }

  return {
    items: filtered.length > 0 ? filtered : catalogTrending,
    isLiveTmdb: false,
    total: filtered.length > 0 ? filtered.length : catalogTrending.length,
    timeWindow,
  };
}

/**
 * Real-time Multilingual Synchronizer for instant translated subtitles and character quotes
 */
export async function syncMultilingualEntertainment(
  item: EntertainmentItem,
  targetLangCode: string
): Promise<{ quotes: SubtitleQuote[]; srtContent: string; languageName: string }> {
  // Check if item already has native subtitle track
  if (item.subtitles && item.subtitles[targetLangCode]) {
    const track = item.subtitles[targetLangCode];
    return {
      quotes: track.quotes,
      srtContent: track.fullSrt,
      languageName: track.languageName,
    };
  }

  try {
    const res = await fetch('/api/entertainment/multilingual-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item, targetLanguage: targetLangCode }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          quotes: data.quotes,
          srtContent: data.srtContent,
          languageName: data.languageName,
        };
      }
    }
  } catch (err) {
    console.warn('[Multilingual Sync] Server translation failed, using fallback:', err);
  }

  // Local fallback
  const langObj = SUPPORTED_SUBTITLE_LANGUAGES.find((l) => l.code === targetLangCode);
  const quotes: SubtitleQuote[] = [
    {
      time: '00:00:04,500',
      speaker: item.character || item.title,
      text: `Let's make history together!`,
      translated: `${langObj?.native || langObj?.name || 'Local'}: Let's make history together!`,
    },
    {
      time: '00:00:15,000',
      speaker: 'Narrator',
      text: `The saga of ${item.title} unfolds across the multiverse.`,
      translated: `The epic saga of ${item.title} continues.`,
    },
  ];

  return {
    quotes,
    srtContent: generateSrtContent(quotes),
    languageName: langObj?.name || targetLangCode,
  };
}

/**
 * Instantly populate all studio assets across 8K Image Studio, Film Studio, 3D Engine, Music Studio, etc.
 */
export async function populateStudioAssets(
  item: EntertainmentItem,
  options?: {
    studioKey?: 'all' | 'image' | 'video' | 'film' | '3d' | 'music' | 'dubbing' | 'manga' | 'docs';
    userId?: string;
  }
): Promise<{
  success: boolean;
  message: string;
  payload: any;
}> {
  const userId = options?.userId || 'demo_user';
  const studioKey = options?.studioKey || 'all';

  // 1. Sync with server for cloud vault persistence
  let serverResult = null;
  try {
    const res = await fetch('/api/entertainment/populate-studio-assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item, studioKey, userId }),
    });
    if (res.ok) {
      serverResult = await res.json();
    }
  } catch (err) {
    console.warn('[Studio Asset Population] Server sync notice:', err);
  }

  // 2. Dispatch client-side events for immediate UI feedback in all studios
  const studioEventDetail = {
    entityId: item.id,
    title: item.title,
    character: item.character,
    presets: item.studioPresets,
    subtitles: item.subtitles,
    bannerImage: item.bannerImage,
    characterAvatar: item.characterAvatar,
    studioKey,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem('icallog_active_entertainment_reference', JSON.stringify(item));
    localStorage.setItem('icallog_populated_studio_payload', JSON.stringify(studioEventDetail));
    window.dispatchEvent(new CustomEvent('icallog_studio_populated', { detail: studioEventDetail }));
  } catch {
    // ignore
  }

  return {
    success: true,
    message: `Studio assets for "${item.title}" successfully populated!`,
    payload: serverResult?.populatedPayload || studioEventDetail,
  };
}

export interface CharacterVisualTraits {
  outfit: string;
  hairAndEyes: string;
  iconicItem: string;
  physicalBuild: string;
  expressionStyle: string;
  colorPalette: string[];
  aestheticArchetype: string;
}

export interface CharacterStudioPresets {
  imageStudioPrompt: string;
  imageStudioNegativePrompt?: string;
  imageStudioStyle: string;
  imageAspectRatio: string;
  filmStudioScriptPrompt: string;
  filmStudioCharacterBio: string;
  threeModelPrompt: string;
  voiceProfile: string;
  mangaStoryboard: string;
}

export interface CharacterFilmographyItem {
  title: string;
  year: string;
  role: string;
  poster?: string;
}

export interface CharacterQuote {
  time: string;
  text: string;
  translated?: string;
  context?: string;
}

export interface CharacterProfile {
  id: string;
  name: string;
  characterRole: string;
  originalName?: string;
  actorName: string;
  tmdbId?: number;
  franchise: string;
  universe: string;
  category: 'anime' | 'cartoon' | 'cinema' | 'superhero' | 'gaming' | 'scifi' | 'fantasy' | 'global';
  popularity: number;
  biography: string;
  characterLore: string;
  personality: string;
  avatarUrl: string;
  fullBodyArtworkUrl: string;
  backdropUrl?: string;
  visualTraits: CharacterVisualTraits;
  abilities: string[];
  keyQuotes: CharacterQuote[];
  filmography: CharacterFilmographyItem[];
  studioPresets: CharacterStudioPresets;
  isSavedToRepo?: boolean;
  isFavorite?: boolean;
  savedAt?: string;
  tags: string[];
}

export const MASTER_CHARACTER_REPOSITORY: CharacterProfile[] = [
  {
    id: 'char_goku_saiyan',
    name: 'Son Goku',
    characterRole: 'Legendary Super Saiyan Defender of Earth',
    originalName: '孫悟空 (カカロット)',
    actorName: 'Masako Nozawa / Sean Schemmel',
    franchise: 'Dragon Ball Z / Super',
    universe: 'Universe 7 Multiverse',
    category: 'anime',
    popularity: 998,
    biography: 'Son Goku, born Kakarot, is a pure-blooded Saiyan sent to Earth as an infant. Raised by Grandpa Gohan, Goku grew to become Earth\'s greatest martial artist, continuously shattering mortal and divine boundaries through sheer perseverance and joyful battle spirit.',
    characterLore: 'Master of Ultra Instinct, Super Saiyan Blue, and the ancient Turtle School martial arts. Goku has saved the multiverse across the Tournament of Power, defying gods of destruction and universal tyrants.',
    personality: 'Pure-hearted, cheerful, relentless martial artist, fiercely loyal to companions, always seeking self-improvement.',
    avatarUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    fullBodyArtworkUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
    visualTraits: {
      outfit: 'Signature Turtle School orange-red gi over navy blue undershirt, navy wristbands, and dark boots with red lining.',
      hairAndEyes: 'Iconic spiked jet-black hair with distinctive bangs; transforms to incandescent golden, azure, or silver aura with piercing luminous eyes.',
      iconicItem: 'Power Pole & 4-Star Dragon Ball',
      physicalBuild: 'Peak athletic martial arts physique, defined muscular definition with combat battle scars',
      expressionStyle: 'Warm confident grin in peace; fierce unshakeable laser-focus in combat',
      colorPalette: ['#EA580C', '#1E3A8A', '#FACC15', '#0284C7', '#FFFFFF'],
      aestheticArchetype: 'Shonen Anime God-Tier Warrior',
    },
    abilities: ['Kamehameha Wave', 'Ultra Instinct Auto-Reflex', 'Instant Transmission', 'Spirit Bomb (Genki Dama)', 'Kaioken Multiplier'],
    keyQuotes: [
      { time: '00:00:05,000', text: 'I am the hope of the universe. I am the answer to all living things that cry out for peace!', context: 'Super Saiyan Awakening' },
      { time: '00:00:15,000', text: 'Even a low-class warrior can surpass an elite if he trains hard enough!', context: 'Battle against Vegeta' },
    ],
    filmography: [
      { title: 'Dragon Ball Super: Super Hero', year: '2022', role: 'Son Goku' },
      { title: 'Dragon Ball Super: Broly', year: '2018', role: 'Son Goku / Kakarot' },
      { title: 'Dragon Ball Z: Battle of Gods', year: '2013', role: 'Son Goku' },
    ],
    studioPresets: {
      imageStudioPrompt: '8k ultra-detailed anime concept art of Son Goku in Mastered Ultra Instinct, silver hair flowing with celestial god ki aura, divine energy crackling, dynamic martial arts stance, Makoto Shinkai and Ufotable lighting, volumetric particle dust, Unreal Engine 5 render',
      imageStudioNegativePrompt: 'blurry, lowres, Western comic style, extra arms, bad anatomy, deformed eyes',
      imageStudioStyle: 'Anime Cinematic Masterpiece',
      imageAspectRatio: '3:4',
      filmStudioScriptPrompt: `EXT. TOURNAMENT OF POWER ARENA - ZERO REALM\n\nGOKU stands enveloped in silver celestial mist. Divine heat radiates across the cosmic void.\n\nGOKU\n(voice calm, echoing with divine harmonics)\n"This isn't about victory anymore. It's about protecting the universe we love."\n\nHe dashes forward faster than thought itself.`,
      filmStudioCharacterBio: 'Name: Son Goku | Archetype: Divine Martial Paragon | Visual Key: Silver Ultra Instinct Ki Aura | Tone: Resolute & Legendary',
      threeModelPrompt: 'High-poly 3D anime character model of Goku, anime cel-shaded PBR textures, fully rigged for martial arts high kicks and energy beam poses',
      voiceProfile: 'Passionate, energetic, clear heroic timbre with powerful resonant battle roars',
      mangaStoryboard: 'Panel 1: Ultra Instinct eye close up. Panel 2: Instant transmission particle flash. Panel 3: Full page 360-degree Kamehameha blast!',
    },
    tags: ['Anime', 'Dragon Ball', 'Ultra Instinct', 'Martial Arts', 'God Ki'],
  },
  {
    id: 'char_batman_darkknight',
    name: 'Bruce Wayne / The Batman',
    characterRole: 'The Dark Knight & Detective of Gotham',
    originalName: 'The Caped Crusader',
    actorName: 'Christian Bale / Robert Pattinson / Kevin Conroy',
    franchise: 'DC Comics / The Dark Knight Trilogy',
    universe: 'DC Cinematic Universe',
    category: 'superhero',
    popularity: 995,
    biography: 'Following the tragic murder of his parents in Crime Alley, billionaire Bruce Wayne dedicated his life, intellect, and vast fortune to waging a solitary war against the criminal underworld of Gotham City as the shadowed vigilante Batman.',
    characterLore: 'Master of 127 martial arts disciplines, forensic analysis, and advanced stealth technology. Operates from the subterranean Batcave, enforcing a strict moral code while inspiring hope and fear across the shadows of Gotham.',
    personality: 'Stoic, brilliant tactician, dark, brooding, incorruptible, driven by an unwavering vow to protect the innocent.',
    avatarUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    fullBodyArtworkUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1600&q=80',
    visualTraits: {
      outfit: 'Kevlar-weave tactical batsuit with carbon-fiber chest emblem, scallop-bladed gauntlets, and high-tensile memory-cloth cape.',
      hairAndEyes: 'Dark shadowed cowl with narrowed white lenses or piercing grim gaze behind dark eye makeup.',
      iconicItem: 'Batarang, Grapple Gun & Tactical Batmobile',
      physicalBuild: 'Broad-shouldered, intimidating heavyweight athletic build with tactical military conditioning',
      expressionStyle: 'Grim, observant, uncompromising stare from rain-slicked gargoyles',
      colorPalette: ['#09090B', '#1E293B', '#F59E0B', '#64748B', '#DC2626'],
      aestheticArchetype: 'Dark Neo-Noir Tactical Vigilante',
    },
    abilities: ['World\'s Greatest Detective Forensics', 'Peak Human Combat & Stealth', 'Sub-Zero Gadget Arsenal', 'Psychological Warfare & Fear Toxin Counter'],
    keyQuotes: [
      { time: '00:00:04,000', text: 'I am vengeance. I am the night. I am Batman!', context: 'Gotham Shadows' },
      { time: '00:00:14,000', text: 'It\'s not who I am underneath, but what I do that defines me.', context: 'Dark Knight Manifesto' },
    ],
    filmography: [
      { title: 'The Batman', year: '2022', role: 'Bruce Wayne / Batman' },
      { title: 'The Dark Knight', year: '2008', role: 'Bruce Wayne / Batman' },
      { title: 'Batman: Mask of the Phantasm', year: '1993', role: 'Bruce Wayne / Batman' },
    ],
    studioPresets: {
      imageStudioPrompt: '8k cinematic film still of Batman standing on a neo-gothic gargoyle over rain-soaked Gotham City, dramatic neon rim lighting, anamorphic lens flares, wet reflections on tactical armor, Christopher Nolan cinematography, IMAX 70mm grain',
      imageStudioNegativePrompt: 'bright daytime, cartoon, oversaturated, deformed cape, blurry',
      imageStudioStyle: 'Cinematic Hyper-Realistic Noir',
      imageAspectRatio: '3:4',
      filmStudioScriptPrompt: `EXT. GOTHAM ROOFTOP - RAINY MIDNIGHT\n\nRain hammers the stone gargoyles. BATMAN steps out of the impenetrable darkness.\n\nBATMAN\n(deep, gritty whisper)\n"You thought you owned this city. The shadows have a name."\n\nHe fires his grapple gun into the ascending storm.`,
      filmStudioCharacterBio: 'Name: Bruce Wayne / Batman | Archetype: Neo-Noir Tactical Detective | Visual Key: Matte Carbon Armor & Rain Drops | Tone: Gritty & Authoritative',
      threeModelPrompt: 'Detailed 3D mesh of Batman in tactical batsuit, modular armor plating, cloth-simulated cape, 4K PBR normal maps for Unreal Engine 5',
      voiceProfile: 'Low, gravelly, menacing, authoritative baritone with intense deliberate pacing',
      mangaStoryboard: 'Panel 1: Shadow silhouette on moonlit cloud. Panel 2: Batarang slice in mid-air. Panel 3: Cape sweep takedown in Crime Alley.',
    },
    tags: ['DC', 'Batman', 'Superhero', 'Gotham', 'Neo-Noir', 'Detective'],
  },
  {
    id: 'char_iron_man_stark',
    name: 'Tony Stark / Iron Man',
    characterRole: 'Genius Billionaire Inventor & Avenger',
    originalName: 'Anthony Edward Stark',
    actorName: 'Robert Downey Jr.',
    franchise: 'Marvel Cinematic Universe',
    universe: 'Earth-199999 Marvel Multiverse',
    category: 'superhero',
    popularity: 994,
    biography: 'Billionaire industrialist and genius engineer Tony Stark forged the revolutionary Arc Reactor and powered exoskeletons after surviving captivity in Afghanistan, becoming the armored Avenger Iron Man and defending humanity across the cosmos.',
    characterLore: 'Pioneered nanotechnology Mark 85 armor, time-space GPS navigation, and wielded the Infinity Stones to defeat Thanos, sacrificing himself to save half the universe.',
    personality: 'Razor-sharp witty, charismatic, visionary futurist, secretly self-sacrificing with a heart of gold.',
    avatarUrl: 'https://images.unsplash.com/photo-1635863138275-d9b33299680b?auto=format&fit=crop&w=800&q=80',
    fullBodyArtworkUrl: 'https://images.unsplash.com/photo-1635863138275-d9b33299680b?auto=format&fit=crop&w=1200&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1600&q=80',
    visualTraits: {
      outfit: 'Nanotech Mark 85 crimson and gold armor with glowing triangular chest Arc Reactor and holographic repulsor arrays.',
      hairAndEyes: 'Well-groomed goatee and sharp brown eyes framed by translucent holographic HUD interface.',
      iconicItem: 'Arc Reactor & Nano-Gauntlet',
      physicalBuild: 'Athletic, high-tech cybernetic armored silhouette with glowing blue light conduits',
      expressionStyle: 'Confident smirking genius transitioning into battle-hardened resolve',
      colorPalette: ['#DC2626', '#EAB308', '#0284C7', '#1E293B', '#FFFFFF'],
      aestheticArchetype: 'Futuristic Cyber-Hero & Tech Paragon',
    },
    abilities: ['Arc Reactor Repulsor Cannons', 'Nanotech Morphing Weaponry', 'JARVIS / FRIDAY AI Tactical Overdrive', 'Hypersonic Supersonic Flight'],
    keyQuotes: [
      { time: '00:00:05,000', text: 'I am Iron Man.', context: 'Endgame Climax' },
      { time: '00:00:15,000', text: 'Genius, billionaire, playboy, philanthropist.', context: 'The Avengers' },
    ],
    filmography: [
      { title: 'Avengers: Endgame', year: '2019', role: 'Tony Stark / Iron Man' },
      { title: 'Avengers: Infinity War', year: '2018', role: 'Tony Stark / Iron Man' },
      { title: 'Iron Man', year: '2008', role: 'Tony Stark' },
    ],
    studioPresets: {
      imageStudioPrompt: '8k cinematic masterpiece of Tony Stark in glowing nano-tech Iron Man suit, Mark 85 armor shining with metallic crimson gold reflections, blue Arc Reactor energy glow, HUD holographic particles floating, high detail Marvel Studios look',
      imageStudioNegativePrompt: 'blurry, rustic, broken armor, low resolution, flat colors',
      imageStudioStyle: 'Cinematic Hyper-Realistic Marvel',
      imageAspectRatio: '3:4',
      filmStudioScriptPrompt: `INT. AVENGERS COMPOUND LAB - NIGHT\n\nTONY STARK reviews spinning 3D holographic Mobius strip equations.\n\nTONY\n(pointing to FRIDAY)\n"Tell me that just inverted the eigenvalue."\n\nFRIDAY (V.O.)\n"Simulation successful, Boss."\n\nTony smiles, wiping grease from his forehead.`,
      filmStudioCharacterBio: 'Name: Tony Stark | Archetype: Tech Visionary Inventor | Visual Key: Glowing Arc Reactor & Gold Crimson Armor | Tone: Fast-talking & Brilliant',
      threeModelPrompt: 'PBR 4K textured 3D model of Iron Man Mark 85 nano-armor, emissive blue lights for chest and palms, metallic anodized finish',
      voiceProfile: 'Charismatic, quick-witted, sarcastic tenor with warm emotional depth',
      mangaStoryboard: 'Panel 1: Flight booster ignition. Panel 2: Target lock HUD graphic. Panel 3: Dual palm repulsor blast beam!',
    },
    tags: ['Marvel', 'Iron Man', 'Avengers', 'Sci-Fi', 'Tech Hero'],
  },
  {
    id: 'char_gojo_satoru',
    name: 'Satoru Gojo',
    characterRole: 'The Strongest Jujutsu Sorcerer',
    originalName: '五条 悟',
    actorName: 'Yuichi Nakamura / Kaiji Tang',
    franchise: 'Jujutsu Kaisen',
    universe: 'Jujutsu Sorcery World',
    category: 'anime',
    popularity: 997,
    biography: 'Satoru Gojo is the undisputed strongest special grade jujutsu sorcerer, the pride of the Gojo clan, and the teacher of Yuji Itadori and Megumi Fushiguro at Tokyo Jujutsu High. Possessor of the legendary Limitless Cursed Technique and Six Eyes.',
    characterLore: 'His Domain Expansion, Unlimited Void, inundates targets with infinite knowledge and sensory stimuli, immobilizing them in eternal cognition while he controls spatial infinity.',
    personality: 'Playful, cocky, irreverent with authorities, but fiercely protective of the younger generation of sorcerers.',
    avatarUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
    fullBodyArtworkUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1200&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    visualTraits: {
      outfit: 'High-collared midnight blue jujutsu uniform coat with matching slim trousers and polished dark boots; wears black blindfold or round sunglasses.',
      hairAndEyes: 'Pure snow-white spiked hair; Six Eyes reveal incandescent crystal-azure glowing irises resembling infinite galaxies.',
      iconicItem: 'Black Blindfold & Round Wire Sunglasses',
      physicalBuild: 'Tall, slender yet deceptively athletic sorcerer build (190cm)',
      expressionStyle: 'Carefree cocky smirk shifting into cold, god-like celestial authority when blindfold drops',
      colorPalette: ['#38BDF8', '#6366F1', '#0F172A', '#F8FAFC', '#EC4899'],
      aestheticArchetype: 'Modern Anime Deity Sorcerer',
    },
    abilities: ['Limitless Spatial Infinity', 'Cursed Technique Reversal: Red', 'Cursed Technique Lapse: Blue', 'Hollow Technique: Purple', 'Domain Expansion: Unlimited Void'],
    keyQuotes: [
      { time: '00:00:04,000', text: 'Throughout Heaven and Earth, I alone am the honored one.', context: 'Enlightenment Awakening' },
      { time: '00:00:12,000', text: 'Don\'t worry, I\'m the strongest.', context: 'Jujutsu High Battle' },
    ],
    filmography: [
      { title: 'Jujutsu Kaisen 0', year: '2021', role: 'Satoru Gojo' },
      { title: 'Jujutsu Kaisen Season 2 (Shibuya Incident)', year: '2023', role: 'Satoru Gojo' },
    ],
    studioPresets: {
      imageStudioPrompt: '8k masterpiece anime portrait of Satoru Gojo removing his black blindfold, revealing glowing sapphire Six Eyes galaxy irises, infinite spatial distortion energy around hands, snow white hair, Ufotable x MAPPA cinematic lighting, ultra sharp focus',
      imageStudioNegativePrompt: 'blurry, Western comic, low detail, deformed eyes, bad hair',
      imageStudioStyle: 'High-Octane Anime Masterpiece',
      imageAspectRatio: '3:4',
      filmStudioScriptPrompt: `INT. SHIBUYA METRO PLATFORM - NIGHT\n\nGOJO pulls down his blindfold with two fingers. His glowing blue Six Eyes illuminate the endless void.\n\nGOJO\n(whispering with nonchalant smile)\n"Domain Expansion: Unlimited Void."\n\nReality shatters into infinite cosmos.`,
      filmStudioCharacterBio: 'Name: Satoru Gojo | Archetype: Omnipotent Jujutsu Mentor | Visual Key: Snow White Hair & Crystal Blue Six Eyes | Tone: Playful yet God-like',
      threeModelPrompt: 'Stylized 3D anime model of Gojo Satoru, high fidelity cel-shading with glowing blue eye emission shader, animated spatial distortion particles',
      voiceProfile: 'Smooth, relaxed, teasing tenor that shifts to bone-chilling resonance in battle',
      mangaStoryboard: 'Panel 1: Blindfold slide down. Panel 2: Hand sign crossing fingers. Panel 3: Domain expansion cosmic fracture!',
    },
    tags: ['Anime', 'Jujutsu Kaisen', 'Gojo Satoru', 'Six Eyes', 'Shibuya'],
  },
  {
    id: 'char_geralt_rivia',
    name: 'Geralt of Rivia / The White Wolf',
    characterRole: 'Master Witcher & Butcher of Blaviken',
    originalName: 'Gwynbleidd',
    actorName: 'Henry Cavill / Doug Cockle',
    franchise: 'The Witcher / CD Projekt Red',
    universe: 'The Continent Dark Fantasy Universe',
    category: 'gaming',
    popularity: 989,
    biography: 'Mutated in the fortress of Kaer Morhen through the grueling Trial of the Grasses, Geralt of Rivia is an itinerant monster hunter for hire. Bound by the Law of Surprise to Princess Cirilla of Cintra, he battles destiny across the war-torn Continent.',
    characterLore: 'Wields twin silver and steel swords, Witcher Signs (Aard, Igni, Quen, Axii, Yrden), and alchemical decoctions, navigating moral gray areas in a world where monsters wear human faces.',
    personality: 'Dry humor, cynical on the surface, fundamentally empathetic, staunch defender of the helpless.',
    avatarUrl: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=800&q=80',
    fullBodyArtworkUrl: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=1200&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    visualTraits: {
      outfit: 'Studded leather Kaer Morhen witcher armor with chainmail reinforcement, dual scabbards across back, and Witcher wolf medallion.',
      hairAndEyes: 'Shoulder-length milk-white hair tied back; cat-like amber feline eyes with enhanced night vision.',
      iconicItem: 'Silver Sword for Monsters & Wolf School Medallion',
      physicalBuild: 'Muscular scarred warrior frame with potion-vein combat mutations',
      expressionStyle: 'Stoic grimace, observant hunter squint, wry sardonic half-smile',
      colorPalette: ['#475569', '#94A3B8', '#D97706', '#78350F', '#0F172A'],
      aestheticArchetype: 'Dark Gritty Medieval Fantasy Slayer',
    },
    abilities: ['Master Dual Swordplay', 'Witcher Magic Signs (Igni/Aard/Quen)', 'Toxic Mutagen Decoctions', 'Superhuman Witcher Senses'],
    keyQuotes: [
      { time: '00:00:04,000', text: 'Evil is evil. Lesser, greater, middling, it makes no difference.', context: 'Moral Philosophy' },
      { time: '00:00:14,000', text: 'Wind\'s howling... looks like rain.', context: 'Tracking on the Continent' },
    ],
    filmography: [
      { title: 'The Witcher 3: Wild Hunt', year: '2015', role: 'Geralt of Rivia' },
      { title: 'The Witcher: Nightmare of the Wolf', year: '2021', role: 'Geralt Lore' },
      { title: 'The Witcher Netflix Series', year: '2019', role: 'Geralt of Rivia' },
    ],
    studioPresets: {
      imageStudioPrompt: '8k cinematic dark fantasy portrait of Geralt of Rivia, white hair blowing in cold wind, glowing amber cat eyes, Witcher wolf medallion glinting in firelight, silver sword drawn with frost runes, misty dark forest background, Unreal Engine 5 high fidelity',
      imageStudioNegativePrompt: 'cartoon, smooth skin, clean clothes, bright pastel colors, low res',
      imageStudioStyle: 'Dark Gritty Fantasy Cinematic',
      imageAspectRatio: '3:4',
      filmStudioScriptPrompt: `EXT. SWAMP OF VELEN - DUSK\n\nMist clings to ancient gnarled roots. GERALT draws his silver sword with a distinct metallic chime.\n\nGERALT\n(whispering, amber eyes glowing)\n"Silver for monsters. Don't make me use steel."\n\nHe casts the Quen shield sign, an amber geometric aura enveloping him.`,
      filmStudioCharacterBio: 'Name: Geralt of Rivia | Archetype: Reluctant Monster Hunter | Visual Key: Silver Hair, Scarred Face, Amber Cat Eyes | Tone: Low Grumble & Cynical',
      threeModelPrompt: 'Highly detailed 3D game model of Witcher Geralt, PBR weathered leather and chainmail textures, rigged for combat animations',
      voiceProfile: 'Low, gravelly, dry baritone with calm and deliberate cadence',
      mangaStoryboard: 'Panel 1: Wolf medallion vibrating. Panel 2: Silver sword draw. Panel 3: Igni flame burst cone attack!',
    },
    tags: ['Witcher', 'Geralt', 'Gaming', 'Fantasy', 'RPG Legend'],
  },
  {
    id: 'char_pushpa_raj',
    name: 'Pushpa Raj',
    characterRole: 'Red Sanders Syndicate Kingpin & Folk Hero',
    originalName: 'పుష్ప రాజ్ (Jhukega Nahi)',
    actorName: 'Allu Arjun',
    franchise: 'Pushpa: The Rise / The Rule',
    universe: 'Indian Mass Action Cinema Universe',
    category: 'global',
    popularity: 992,
    biography: 'Rising from an impoverished daily laborer in the Seshachalam forests of Andhra Pradesh, Pushpa Raj climbed the treacherous ladder of the red sandalwood smuggling syndicate with sheer audacity, unmatched street intellect, and unwavering pride.',
    characterLore: 'Pushpa\'s defining motto "Jhukega Nahi" (I will never bow down) transformed him into a massive cultural phenomenon, embodying defiance against oppressive hierarchies with high-voltage screen power.',
    personality: 'Fearless, fiercely independent, intensely loyal to his mother and love Srivalli, unapologetic rebel.',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
    fullBodyArtworkUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1600&q=80',
    visualTraits: {
      outfit: 'Rustic lungi or cargo trousers with earthy button-up shirt, gold chains, and signature shoulder tilt posture.',
      hairAndEyes: 'Thick rugged wavy curls, heavy rustic beard, and intense fiery gaze with signature hand under beard gesture.',
      iconicItem: 'Red Sandalwood Log & Heavy Axe',
      physicalBuild: 'Muscular forest-hardened build with rugged asymmetrical shoulder stance',
      expressionStyle: 'Fierce defying smirk, sweeping beard stroke with thumb, magnetic screen charisma',
      colorPalette: ['#991B1B', '#78350F', '#B45309', '#1C1917', '#FBBF24'],
      aestheticArchetype: 'Indian Mass Blockbuster Alpha Protagonist',
    },
    abilities: ['Forest Survival & Smuggling Mastery', 'Unstoppable Hand-to-Hand Brawling', 'Street Intellect & Syndicate Strategy', 'High-Octane Dialogue Delivery'],
    keyQuotes: [
      { time: '00:00:04,000', text: 'Pushpa... Pushpa Raj! Main jhukega nahi saala!', context: 'Signature Punchline' },
      { time: '00:00:15,000', text: 'Pushpa naam sunke flower samjhe kya? Fire hai main!', context: 'The Fire Manifesto' },
    ],
    filmography: [
      { title: 'Pushpa: The Rule (Part 2)', year: '2024', role: 'Pushpa Raj' },
      { title: 'Pushpa: The Rise (Part 1)', year: '2021', role: 'Pushpa Raj' },
      { title: 'Ala Vaikunthapurramuloo', year: '2020', role: 'Bantu' },
    ],
    studioPresets: {
      imageStudioPrompt: '8k Indian blockbuster cinematic portrait of Pushpa Raj, rugged beard, sweeping hand under chin gesture, dramatic golden forest sunbeam backlighting in Seshachalam jungle, red dust particles, hyper-detailed skin texture, IMAX camera frame',
      imageStudioNegativePrompt: 'blurry, clean shaved, smooth skin, cartoon, western style',
      imageStudioStyle: 'Indian Mass Blockbuster 8K',
      imageAspectRatio: '3:4',
      filmStudioScriptPrompt: `EXT. SESHACHALAM DENSE FOREST - DAY\n\nRed dust swirls as PUSHPA RAJ walks forward with his iconic shoulder tilt. He slides his thumb under his beard.\n\nPUSHPA RAJ\n(booming voice, fiery smirk)\n"Pushpa naam sunkar flower samjhe kya? FIRE hai main!"\n\nHe slams his axe into the earth as high-octane background music erupts.`,
      filmStudioCharacterBio: 'Name: Pushpa Raj | Archetype: Forest Syndicate Alpha King | Visual Key: Beard Sweep Gesture, Red Sandalwood Aura | Tone: Defiant & Electric',
      threeModelPrompt: '3D character model of Indian cinema icon Pushpa Raj, detailed cloth physics for lungi and shirt, 4K skin normal maps',
      voiceProfile: 'Booming, rugged, intense baritone with rhythmic regional swagger and punchy cadence',
      mangaStoryboard: 'Panel 1: Hand brushing under beard. Panel 2: Forest axe swing. Panel 3: Dust explosion mass impact frame!',
    },
    tags: ['Indian Cinema', 'Pushpa', 'Allu Arjun', 'Mass Cinema', 'Global Entertainment'],
  },
  {
    id: 'char_paul_atreides',
    name: 'Paul Atreides / Muad\'Dib',
    characterRole: 'Duke of Arrakis & Kwisatz Haderach',
    originalName: 'Usul / Lisan al Gaib',
    actorName: 'Timothée Chalamet',
    franchise: 'Dune Cinematic Universe',
    universe: 'Known Universe Imperium',
    category: 'scifi',
    popularity: 991,
    biography: 'Paul Atreides is the scion of House Atreides and the Bene Gesserit breeding program\'s Kwisatz Haderach. Forced into the desert planet of Arrakis following the betrayal of the Padishah Emperor, Paul embraces the Fremen way of life to lead a holy war across the cosmos.',
    characterLore: 'Capable of prescient vision across all possible futures through spice immersion. Master of the Bene Gesserit Voice and the Prana-bindu combat technique, he rides the massive desert sandworms of Arrakis.',
    personality: 'Philosophical, tragic, intensely perceptive, burdened by destiny and prescient sight.',
    avatarUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    fullBodyArtworkUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1600&q=80',
    visualTraits: {
      outfit: 'Fremen desert stillsuit with filtration tubes, dark flowing desert cloak, and crysknife sheath at hip.',
      hairAndEyes: 'Dark unruly curls whipped by desert sandstorms; piercing luminous Spice-blue eyes (Eyes of Ibad).',
      iconicItem: 'Crysknife & Maker Hooks for Sandworm Riding',
      physicalBuild: 'Lean, agile desert warrior build trained in high-speed kinetic shields',
      expressionStyle: 'Haunted, piercing prescient gaze, supreme commanding messianic authority',
      colorPalette: ['#D97706', '#92400E', '#0284C7', '#1E293B', '#78350F'],
      aestheticArchetype: 'Epic Sci-Fi Messianic Desert Hero',
    },
    abilities: ['Prescient Multiverse Sight', 'Bene Gesserit Voice Command', 'Sandworm Riding (Grandfather Worm)', 'Crysknife Duel Mastery'],
    keyQuotes: [
      { time: '00:00:04,000', text: 'I see a holy war spreading across the universe like an unquenchable fire.', context: 'Spice Vision' },
      { time: '00:00:15,000', text: 'Lead them to paradise!', context: 'Arrakis Climax' },
    ],
    filmography: [
      { title: 'Dune: Part Two', year: '2024', role: 'Paul Atreides / Muad\'Dib' },
      { title: 'Dune: Part One', year: '2021', role: 'Paul Atreides' },
    ],
    studioPresets: {
      imageStudioPrompt: '8k cinematic IMAX shot of Paul Atreides standing on a monumental sand dune on Arrakis, eyes glowing intense spice-blue, desert cloak billowing in sandstorm, sunset casting golden red rays across endless dunes, Denis Villeneuve cinematography',
      imageStudioNegativePrompt: 'blurry, neon, city background, cartoon, smooth plastic skin',
      imageStudioStyle: 'Epic Sci-Fi IMAX Cinematography',
      imageAspectRatio: '3:4',
      filmStudioScriptPrompt: `EXT. ARRAKIS OPEN DESERT - DUSK\n\nPAUL ATREIDES stands at the crest of the colossal dune. The desert wind roars. His eyes glow deep spice-blue.\n\nPAUL\n(using The Voice, resonant reverberation)\n"Silence! He who can destroy a thing controls a thing."\n\nThe Fremen army kneels in awe.`,
      filmStudioCharacterBio: 'Name: Paul Atreides | Archetype: Tragic Prescient Messiah | Visual Key: Eyes of Ibad Luminous Blue & Stillsuit | Tone: Chilling & Poetic',
      threeModelPrompt: '3D model of Paul Atreides in Fremen stillsuit, cloth physics for cloak, emissive blue eyes shader, PBR sand weathered textures',
      voiceProfile: 'Soft, poetic, intense tenor that shifts to booming hypnotic resonance when using The Voice',
      mangaStoryboard: 'Panel 1: Thumper striking sand. Panel 2: Giant sandworm breaching dune. Panel 3: Paul leaping with Maker Hooks!',
    },
    tags: ['Dune', 'Sci-Fi', 'Paul Atreides', 'Arrakis', 'Kwisatz Haderach'],
  },
];

export const FAVORITE_CHARACTERS_STORAGE_KEY = 'icallog_favorite_characters_v1';

/**
 * Get all favorite character IDs stored in localStorage
 */
export function getFavoriteCharacterIds(): string[] {
  try {
    const stored = localStorage.getItem(FAVORITE_CHARACTERS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

/**
 * Check if a character is favorited
 */
export function isCharacterFavorite(characterId: string): boolean {
  const favorites = getFavoriteCharacterIds();
  return favorites.includes(characterId);
}

/**
 * Toggle Favorite status for a character profile with localStorage persistence and server sync
 */
export async function toggleCharacterFavorite(
  character: CharacterProfile,
  userId: string = 'demo_user'
): Promise<{ isFavorite: boolean; favorites: string[]; count: number }> {
  let favorites = getFavoriteCharacterIds();
  const exists = favorites.includes(character.id);
  let newIsFavorite = false;

  if (exists) {
    favorites = favorites.filter((id) => id !== character.id);
    newIsFavorite = false;
  } else {
    favorites.unshift(character.id);
    newIsFavorite = true;
  }

  try {
    localStorage.setItem(FAVORITE_CHARACTERS_STORAGE_KEY, JSON.stringify(favorites));
    window.dispatchEvent(
      new CustomEvent('icallog_character_favorite_toggled', {
        detail: { characterId: character.id, isFavorite: newIsFavorite, character },
      })
    );
  } catch (err) {
    console.warn('[Character Favorites] LocalStorage save notice:', err);
  }

  // Server sync
  try {
    await fetch('/api/entertainment/character/favorite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId: character.id, isFavorite: newIsFavorite, userId }),
    });
  } catch {
    // ignore
  }

  return {
    isFavorite: newIsFavorite,
    favorites,
    count: favorites.length,
  };
}

/**
 * Fetch characters from Character Repository & TMDB with favorite annotations
 */
export async function fetchCharacterRepository(options?: {
  query?: string;
  category?: string;
  filterSaved?: boolean;
  filterFavorites?: boolean;
  tmdbKey?: string;
  language?: string;
  userId?: string;
}): Promise<{
  characters: CharacterProfile[];
  savedCount: number;
  favoritesCount: number;
  isLiveTmdb: boolean;
  total: number;
}> {
  const query = options?.query || '';
  const category = options?.category || 'all';
  const filterSaved = Boolean(options?.filterSaved);
  const filterFavorites = Boolean(options?.filterFavorites);
  const userId = options?.userId || 'demo_user';
  const favIds = new Set(getFavoriteCharacterIds());

  let rawCharacters: CharacterProfile[] = [];
  let savedCount = 0;
  let isLiveTmdb = false;

  // 1. Try fetching from server API
  try {
    const params = new URLSearchParams({
      query,
      category,
      filterSaved: filterSaved.toString(),
      userId,
    });
    if (options?.tmdbKey) params.append('tmdbKey', options.tmdbKey);

    const res = await fetch(`/api/entertainment/character-repository?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.results) && data.results.length > 0) {
        rawCharacters = data.results;
        savedCount = data.savedCount || 0;
        isLiveTmdb = Boolean(data.isLiveTmdb);
      }
    }
  } catch (err) {
    console.warn('[Character Repository] Server fetch notice, loading local master catalog:', err);
  }

  // 2. Local fallback from master catalog & localStorage saved items if server didn't supply
  if (rawCharacters.length === 0) {
    let savedLocal: CharacterProfile[] = [];
    try {
      const stored = localStorage.getItem('icallog_character_repo_saved_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) savedLocal = parsed;
      }
    } catch {
      // ignore
    }

    savedCount = savedLocal.length;
    const combined = [...savedLocal];
    MASTER_CHARACTER_REPOSITORY.forEach((m) => {
      if (!combined.some((c) => c.name.toLowerCase() === m.name.toLowerCase())) {
        combined.push(m);
      }
    });

    let filtered = combined;
    if (filterSaved) {
      filtered = savedLocal;
    } else if (category && category !== 'all') {
      filtered = filtered.filter((c) => c.category === category || c.tags?.includes(category));
    }

    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.franchise.toLowerCase().includes(q) ||
        c.actorName.toLowerCase().includes(q) ||
        c.visualTraits?.outfit?.toLowerCase().includes(q)
      );
    }

    rawCharacters = filtered.length > 0 ? filtered : MASTER_CHARACTER_REPOSITORY;
  }

  // Annotate with isFavorite flag
  const annotated = rawCharacters.map((c) => ({
    ...c,
    isFavorite: favIds.has(c.id) || Boolean(c.isFavorite),
  }));

  // Apply filterFavorites if requested
  const finalResults = filterFavorites ? annotated.filter((c) => c.isFavorite) : annotated;

  return {
    characters: finalResults,
    savedCount,
    favoritesCount: favIds.size,
    isLiveTmdb,
    total: finalResults.length,
  };
}

/**
 * Generate fused crossover prompt for side-by-side Visual Comparison
 */
export function generateCrossoverPrompt(characters: CharacterProfile[]): {
  imageStudioPrompt: string;
  filmStudioScriptPrompt: string;
  summary: string;
} {
  if (!characters || characters.length < 2) {
    return {
      imageStudioPrompt: '',
      filmStudioScriptPrompt: '',
      summary: 'Select 2 or more characters for comparison & crossover generation.',
    };
  }

  const [charA, charB] = characters;
  const imageStudioPrompt = `8k ultra-cinematic concept art of a mythical crossover showdown between ${charA.name} and ${charB.name}. ${charA.name} wearing ${charA.visualTraits?.outfit || 'iconic battle gear'} on left, facing ${charB.name} with ${charB.visualTraits?.outfit || 'signature costume'} on right. Dynamic opposing color palettes (${charA.visualTraits?.colorPalette?.[0] || '#3b82f6'} vs ${charB.visualTraits?.colorPalette?.[0] || '#ef4444'}), volumetric particles, rim lighting, Unreal Engine 5 render, IMAX 70mm composition.`;

  const filmStudioScriptPrompt = `EXT. MULTIVERSE NEXUS - THE SHATTERED HORIZON - DUSK\n\nA crackling spatial rift separates two legendary worlds.\n\n${charA.name.toUpperCase()} stands braced, ${charA.visualTraits?.iconicItem || 'eyes focused'}.\n\n${charB.name.toUpperCase()} steps through the cosmic mist, exuding unwavering authority.\n\n${charA.name.toUpperCase()}\n"${charA.keyQuotes?.[0]?.text || "We don't yield here."}"\n\n${charB.name.toUpperCase()}\n"${charB.keyQuotes?.[0]?.text || "Then show me the strength of your universe."}"\n\nThe air superheats as their aura signatures ignite simultaneously.`;

  return {
    imageStudioPrompt,
    filmStudioScriptPrompt,
    summary: `Crossover Arena: ${charA.name} (${charA.franchise}) vs ${charB.name} (${charB.franchise})`,
  };
}

/**
 * Save / Bookmark Character Profile to Repository
 */
export async function saveCharacterToRepository(
  character: CharacterProfile,
  userId: string = 'demo_user'
): Promise<{ success: boolean; character: CharacterProfile; message: string }> {
  const charWithSave: CharacterProfile = {
    ...character,
    isSavedToRepo: true,
    savedAt: new Date().toISOString(),
  };

  // 1. Save to localStorage
  try {
    const stored = localStorage.getItem('icallog_character_repo_saved_v1');
    const list: CharacterProfile[] = stored ? JSON.parse(stored) : [];
    const existing = list.findIndex((c) => c.id === charWithSave.id || c.name.toLowerCase() === charWithSave.name.toLowerCase());
    if (existing >= 0) {
      list[existing] = charWithSave;
    } else {
      list.unshift(charWithSave);
    }
    localStorage.setItem('icallog_character_repo_saved_v1', JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('icallog_character_saved', { detail: charWithSave }));
  } catch (err) {
    console.warn('[Character Repo] LocalStorage save error:', err);
  }

  // 2. Call backend save
  try {
    await fetch('/api/entertainment/character-repository/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character: charWithSave, userId }),
    });
  } catch (err) {
    console.warn('[Character Repo] Server save notice:', err);
  }

  return {
    success: true,
    character: charWithSave,
    message: `"${charWithSave.name}" saved to Character Repository!`,
  };
}

/**
 * Remove Character Profile from Repository
 */
export async function removeCharacterFromRepository(
  characterId: string,
  userId: string = 'demo_user'
): Promise<{ success: boolean; message: string }> {
  try {
    const stored = localStorage.getItem('icallog_character_repo_saved_v1');
    if (stored) {
      const list: CharacterProfile[] = JSON.parse(stored);
      const filtered = list.filter((c) => c.id !== characterId);
      localStorage.setItem('icallog_character_repo_saved_v1', JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent('icallog_character_removed', { detail: { characterId } }));
    }
  } catch {
    // ignore
  }

  try {
    await fetch(`/api/entertainment/character-repository/${characterId}?userId=${userId}`, {
      method: 'DELETE',
    });
  } catch {
    // ignore
  }

  return {
    success: true,
    message: 'Character removed from repository',
  };
}

/**
 * Direct 1-Click Import Character to Studio Workspaces (ImageStudio, FilmStudio, 3D, Audio)
 */
export async function importCharacterToStudio(
  character: CharacterProfile,
  targetStudio: 'image_studio' | 'film_studio' | '3d_engine' | 'video_audio' | 'projects_hub',
  userId: string = 'demo_user'
): Promise<{ success: boolean; message: string; payload: any }> {
  const studioImportPayload = {
    targetStudio,
    character,
    presets: character.studioPresets,
    visualTraits: character.visualTraits,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem('icallog_active_character_studio_import', JSON.stringify(studioImportPayload));
    window.dispatchEvent(new CustomEvent('icallog_character_studio_imported', { detail: studioImportPayload }));
  } catch {
    // ignore
  }

  try {
    await fetch('/api/entertainment/character/import-to-studio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character, targetStudio, userId }),
    });
  } catch {
    // ignore
  }

  return {
    success: true,
    message: `Character "${character.name}" imported into ${targetStudio}!`,
    payload: studioImportPayload,
  };
}



export type SubjectFormCategory =
  | 'auto'
  | 'cartoon_toon'
  | 'superhero_comic'
  | 'anime_manga'
  | 'ott_webseries'
  | 'movie_cinema'
  | 'video_game'
  | 'gods_mythology'
  | 'celebrity_icon'
  | 'scifi_fantasy'
  | 'mature_18'
  | 'male'
  | 'female'
  | 'couple'
  | 'place'
  | 'creature'
  | 'world'
  | 'vehicle_prop'
  | 'group';

export interface SubjectDetectionResult {
  detectedCategory: SubjectFormCategory;
  label: string;
  icon: string;
  badgeColor: string;
  confidence: 'high' | 'medium' | 'low';
  matchedKeywords: string[];
  promptSuffix: string;
  explanation: string;
}

export interface SubjectPreset {
  id: SubjectFormCategory;
  label: string;
  icon: string;
  badge: string;
  description: string;
  promptSuffix: string;
}

export const SUBJECT_FORM_PRESETS: SubjectPreset[] = [
  {
    id: 'auto',
    label: '🤖 Auto-Detect (Global AI Smart Scanner)',
    icon: '🤖',
    badge: 'AI Smart',
    description: 'Universal AI Scanner: Auto-detects World Cartoons, Superheroes, Anime, Cinema, Games, Gods, Celebrities, 18+ Genres & Places',
    promptSuffix: '',
  },
  {
    id: 'cartoon_toon',
    label: '🧸 World Cartoons & Toons',
    icon: '🧸',
    badge: 'World Toon',
    description: 'Motu Patlu, Chhota Bheem, Doraemon, Shinchan, Tom & Jerry, Oggy, Disney, Pixar, Looney Tunes, Popeye, SpongeBob',
    promptSuffix: ', vibrant animated cartoon art style, expressive 3D toon features, dynamic animation pose, high quality character render, rich colorful animation lighting',
  },
  {
    id: 'superhero_comic',
    label: '🦸 Superheroes & Comic Icons',
    icon: '🦸',
    badge: 'Superhero',
    description: 'Iron Man, Batman, Spider-Man, Superman, Joker, Thor, Wolverine, Deadpool, Shaktimaan, Krrish, Marvel & DC Universe',
    promptSuffix: ', legendary superhero cinematic costume detailing, heroic powerful stance, volumetric rim lighting, photorealistic 8K IMAX blockbuster render',
  },
  {
    id: 'anime_manga',
    label: '⚔️ Anime, Manga & Manhwa',
    icon: '⚔️',
    badge: 'Anime World',
    description: 'Naruto, Dragon Ball Goku, One Piece Luffy, Zoro, Attack on Titan, Demon Slayer, Jujutsu Kaisen Gojo, Solo Leveling, Ghibli',
    promptSuffix: ', masterpiece anime aesthetic, dynamic Ufotable / MAPPA animation quality, cel-shaded high contrast, dramatic cinematic anime lighting, crisp lineart',
  },
  {
    id: 'gods_mythology',
    label: '🔱 Gods, Myth & Historical Legends',
    icon: '🔱',
    badge: 'Divine Myth',
    description: 'Lord Shiva, Lord Krishna, Lord Rama, Hanuman, Thor, Zeus, Odin, Cleopatra, Shivaji Maharaj, Maharana Pratap, Samurai, Spartans',
    promptSuffix: ', divine celestial majesty, radiant golden sacred aura, intricate mythological ornaments and weapons, glorious photorealistic 8K spiritual grandeur',
  },
  {
    id: 'ott_webseries',
    label: '📺 OTT Web Series & Shows',
    icon: '📺',
    badge: 'OTT Legend',
    description: 'Stranger Things, Sacred Games, Mirzapur, Breaking Bad, Money Heist, Squid Game, Game of Thrones, The Boys, Dark, Peaky Blinders',
    promptSuffix: ', prestige cinematic OTT series atmosphere, moody dramatic anamorphic depth of field, high-budget cinematography, authentic production design',
  },
  {
    id: 'movie_cinema',
    label: '🎬 Blockbuster Movies & Cinema',
    icon: '🎬',
    badge: 'Blockbuster',
    description: 'RRR, KGF Rocky Bhai, Bahubali, Pushpa, Avatar, Star Wars, Harry Potter, John Wick, Jack Sparrow, Interstellar',
    promptSuffix: ', Hollywood 8K IMAX blockbuster cinema scale, volumetric atmospheric lighting, photorealistic textures, dramatic epic cinematic angle',
  },
  {
    id: 'video_game',
    label: '🎮 Video Games & Gaming Legends',
    icon: '🎮',
    badge: 'Gaming AAA',
    description: 'GTA 5/6, Witcher Geralt, Cyberpunk 2077, God of War Kratos, Red Dead 2, Elden Ring, BGMI / PUBG, Minecraft, Free Fire, Valorant',
    promptSuffix: ', AAA next-gen Unreal Engine 5 render, ray-traced global illumination, octane 3D photorealistic shaders, ultra-detailed gaming character model',
  },
  {
    id: 'celebrity_icon',
    label: '👑 Celebrities, VIPs & Real Stars',
    icon: '👑',
    badge: 'Celebrity',
    description: 'Virat Kohli, Cristiano Ronaldo, Messi, Shah Rukh Khan, Salman Khan, Elon Musk, Taylor Swift, BTS, Rock Dwayne Johnson',
    promptSuffix: ', ultra-realistic red-carpet and arena lighting, authentic facial expressions and likeness, high-definition 8K photography, crystal sharp optics',
  },
  {
    id: 'scifi_fantasy',
    label: '🧙 Sci-Fi, Fantasy & Original Archetypes',
    icon: '🧙',
    badge: 'Fantasy Sci-Fi',
    description: 'Cyberpunk Hacker, Dark Knight, High Elf Sorceress, Steampunk Engineer, Space Marine, Vampire Lord, Werewolf, Celestial Angel',
    promptSuffix: ', intricate fantasy concept art detailing, volumetric glowing magic or cybernetic luminescence, hyper-detailed textures, cinematic composition',
  },
  {
    id: 'mature_18',
    label: '🔞 18+ Mature & Dark Neo-Noir',
    icon: '🔞',
    badge: '18+ Unrated',
    description: 'Explicit dark crime thrillers, uncensored neo-noir underworld, erotic drama, visceral extreme horror, mature R-rated visuals',
    promptSuffix: ', unrated gritty neo-noir cinematic tone, intense chiaroscuro shadows, visceral atmospheric tension, mature psychological depth, moody dark palette',
  },
  {
    id: 'male',
    label: '👨 Male Protagonist',
    icon: '👨',
    badge: 'Character',
    description: 'Handsome male hero, warrior, king, or character focus',
    promptSuffix: ', handsome male character protagonist, heroic posture, sharp masculine facial features, detailed attire',
  },
  {
    id: 'female',
    label: '👩 Female Heroine',
    icon: '👩',
    badge: 'Character',
    description: 'Beautiful female heroine, queen, or character focus',
    promptSuffix: ', beautiful female character heroine, expressive eyes, intricate facial details, graceful posture',
  },
  {
    id: 'couple',
    label: '👫 Duo / Romantic Couple',
    icon: '👫',
    badge: 'Duo',
    description: 'Male & female duo, romantic chemistry, or partnership',
    promptSuffix: ', male and female character duo standing together, romantic cinematic harmony, emotional chemistry',
  },
  {
    id: 'place',
    label: '🏛️ Place / Landscape / Environment',
    icon: '🏛️',
    badge: 'Environment',
    description: 'Scenery, cities, architecture, mountains, temples, or rooms (no random faces)',
    promptSuffix: ', breathtaking environment architecture, volumetric atmospheric depth, ultra-wide focal lens, pristine textures',
  },
  {
    id: 'creature',
    label: '🐉 Creature / Monster / Pet',
    icon: '🐉',
    badge: 'Biomorphic',
    description: 'Mythical beasts, dragons, animals, monsters, or robotic pets',
    promptSuffix: ', anatomical creature detailing, organic scales fur textures, dynamic posture, volumetric rim lighting',
  },
  {
    id: 'world',
    label: '🌌 World / Cosmos / Realm',
    icon: '🌌',
    badge: 'Universe',
    description: 'Cosmic space, nebulae, surreal dimensions, or fantasy universes',
    promptSuffix: ', vast cosmic scale, celestial nebula glow, intricate planetary rings, epic astronomical perspective',
  },
  {
    id: 'vehicle_prop',
    label: '🚀 Vehicle / Mech / Hardware',
    icon: '🚀',
    badge: 'Hardware',
    description: 'Cars, spaceships, robots, weapons, mechs, or futuristic gadgets',
    promptSuffix: ', precision industrial mechanical detailing, sleek aerodynamic reflections, photorealistic PBR materials',
  },
  {
    id: 'group',
    label: '👥 Group / Crowd / Army',
    icon: '👥',
    badge: 'Ensemble',
    description: 'Troops, crowd, festival, team of adventurers, or ensemble cast',
    promptSuffix: ', dynamic group ensemble composition, varied facial expressions, organized cinematic depth of field',
  },
];

// Comprehensive Universal Bilingual & Pop-Culture Keywords Dictionary
const KEYWORDS: Record<SubjectFormCategory, string[]> = {
  auto: [],

  cartoon_toon: [
    // Indian Famous Cartoons & Toons
    'motu patlu', 'motu', 'patlu', 'furfuri nagar', 'chhota bheem', 'chota bheem', 'bheem', 'dholakpur',
    'chutki', 'raju toon', 'jaggu', 'kalia', 'dholu bholu', 'shiva cartoon', 'super cycle shiva',
    'roll no 21', 'kris cartoon', 'kansh roll no 21', 'little singham', 'mighty raju', 'bal ganesh',
    'bal hanuman', 'tenali rama cartoon', 'akbar birbal cartoon', 'guru aur bhole', 'honey bunny',
    'vir the robot boy', 'gattu battu', 'tarak mehta cartoon', 'golmaal jr', 'chacha bhatija',
    'baahubali the lost legends',

    // Japanese Anime & Kids Toons
    'doraemon', 'nobita', 'shizuka', 'gian', 'suneo', 'dekisugi', 'shinchan', 'nohara', 'shiro dog',
    'ninja hattori', 'kenichi', 'amara', 'kemumaki', 'perman', 'kiteretsu', 'korosuke', 'kochira',
    'hello kitty', 'chibi mascot',

    // American & World Classic Cartoons
    'cartoon', 'toons', 'animation', 'animated', 'kartun', 'animated movie', 'animated series',
    'tom and jerry', 'tom & jerry', 'mickey mouse', 'donald duck', 'goofy', 'pluto dog', 'bugs bunny',
    'daffy duck', 'tweety', 'sylvester', 'popeye', 'olive oyl', 'bluto', 'scooby doo', 'shaggy',
    'pink panther', 'road runner', 'wile e coyote', 'flintstones', 'jetsons', 'woody woodpecker',
    'casper the friendly ghost', 'garfield',

    // Cartoon Network & 90s/2000s Pop Toons
    'spongebob', 'patrick star', 'squidward', 'mr krabs', 'plankton', 'bikini bottom', 'ben 10',
    'ben tennyson', 'omnitrix', 'heatblast', 'fourarms', 'oggy', 'oggy and the cockroaches',
    'cockroaches joey deedee marky', 'jack cat', 'dexter laboratory', 'dexters lab', 'dee dee',
    'johnny bravo', 'courage the cowardly dog', 'powerpuff girls', 'blossom', 'bubbles', 'buttercup',
    'samurai jack', 'ed edd n eddy', 'grim adventures of billy and mandy', 'phineas and ferb',
    'perry the platypus', 'dr doofenshmirtz', 'kim possible', 'danny phantom', 'teen titans',

    // Modern 3D CGI Animation & Global Favorites
    'disney cartoon', 'pixar', 'dreamworks', 'minions', 'gru', 'despicable me', 'kung fu panda',
    'po the panda', 'shrek', 'donkey shrek', 'madagascar toons', 'toy story', 'woody', 'buzz lightyear',
    'lightning mcqueen', 'incredibles', 'frozen elsa', 'frozen anna', 'olaf', 'peppa pig', 'paw patrol',
    'bluey', 'shaun the sheep', 'wallace and gromit', 'tintin', 'snowy dog', 'asterix', 'obelix',
    'mr bean cartoon', 'mr bean animated', 'simpsons', 'homer simpson', 'family guy'
  ],

  superhero_comic: [
    'superhero', 'comic', 'marvel', 'mcu', 'dc', 'avengers', 'justice league', 'iron man', 'tony stark',
    'batman', 'bruce wayne', 'dark knight', 'gotham', 'spider-man', 'spiderman', 'peter parker',
    'miles morales', 'superman', 'clark kent', 'man of steel', 'joker', 'thor', 'wolverine', 'logan',
    'deadpool', 'wade wilson', 'hulk', 'captain america', 'doctor strange', 'black panther', 'wakanda',
    'thanos', 'infinity gauntlet', 'wonder woman', 'flash', 'aquaman', 'green lantern', 'shaktimaan',
    'krrish', 'flying jatt', 'minnal murali', 'venom', 'magneto', 'daredevil', 'harley quinn'
  ],

  anime_manga: [
    'anime', 'manga', 'manhwa', 'otaku', 'naruto', 'sasuke', 'sakura', 'kakashi', 'itachi', 'akatsuki',
    'dragon ball', 'goku', 'vegeta', 'gohan', 'frieza', 'super saiyan', 'one piece', 'luffy', 'zoro',
    'sanji', 'nami', 'straw hat', 'attack on titan', 'eren yeager', 'levi ackerman', 'mikasa', 'titan',
    'demon slayer', 'tanjiro', 'nezuko', 'zenitsu', 'inosuke', 'rengoku', 'muzan', 'jujutsu kaisen',
    'gojo satoru', 'sukuna', 'itadori yuji', 'megumi', 'nobara', 'bleach', 'ichigo kurosaki', 'aizen',
    'death note', 'light yagami', 'ryuk', 'solo leveling', 'sung jin-woo', 'shadow monarch',
    'chainsaw man', 'denji', 'makima', 'my hero academia', 'deku', 'bakugo', 'all might',
    'tokyo ghoul', 'kaneki', 'hunter x hunter', 'gon', 'killua', 'hisoka', 'fullmetal alchemist',
    'edward elric', 'studio ghibli', 'spirited away', 'howls moving castle', 'totoro', 'princess mononoke',
    'sailor moon', 'one punch man', 'saitama', 'genos', 'mob psycho', 'vinland saga', 'berserk', 'guts',
    'sword art online', 'kirito', 'asuna', 'haikyuu', 'black clover', 'asta', 'code geass', 'lelouch',
    'jojos bizarre adventure', 'jotaro', 'dio brando', 'evangelion', 'shinji', 'asuka', 're zero'
  ],

  gods_mythology: [
    'shiva', 'mahadev', 'bholenath', 'kailash', 'trishul', 'krishna', 'radha krishna', 'vrindavan',
    'flute krishna', 'ram', 'shree ram', 'ayodhya', 'hanuman', 'bajrangbali', 'ganesh', 'ganpati',
    'durga', 'kali maa', 'vishnu', 'brahma', 'lakshmi', 'saraswati', 'zeus', 'olympus', 'poseidon',
    'hades', 'thor god', 'odin', 'asgard', 'loki', 'anubis', 'ra egyptian', 'cleopatra', 'hercules',
    'achilles', 'shivaji maharaj', 'chhatrapati', 'maharana pratap', 'prithviraj chauhan', 'samurai',
    'spartan', 'leonidas', 'viking warrior', 'valkyrie', 'knight templar', 'pharaoh'
  ],

  ott_webseries: [
    'web series', 'ott', 'netflix', 'prime video', 'amazon prime', 'hotstar', 'disney hotstar', 'hbo',
    'stranger things', 'eleven', 'demogorgon', 'upside down', 'hawkins', 'sacred games', 'gaitonde',
    'ganesh gaitonde', 'sartaj singh', 'mirzapur', 'kaleen bhaiya', 'guddu pandit', 'munna bhaiya',
    'tripathi', 'breaking bad', 'walter white', 'heisenberg', 'jesse pinkman', 'saul goodman',
    'better call saul', 'game of thrones', 'jon snow', 'daenerys targaryen', 'targaryen', 'house of the dragon',
    'winterfell', 'westeros', 'money heist', 'la casa de papel', 'professor', 'tokyo money heist', 'berlin',
    'squid game', 'red light green light', 'pink soldier', 'front man', 'the boys', 'homelander',
    'billy butcher', 'vought', 'dark series', 'jonas kahnwald', 'peaky blinders', 'thomas shelby',
    'arthur shelby', 'by order of the peaky blinders', 'panchayat', 'sachiv ji', 'pradhan ji', 'phulera',
    'the family man', 'srikant tiwari', 'farzi', 'sunny farzi', 'scam 1992', 'harshad mehta',
    'asur', 'shubh asur', 'paatal lok', 'hathi ram', 'euphoria', 'rue', 'wednesday addams', 'nevermore',
    'the crown', 'queen elizabeth', 'black mirror', 'vikings', 'ragnar lothbrok', 'the witcher series',
    'succession', 'logan roy', 'the last of us series', 'joel and ellie'
  ],

  movie_cinema: [
    'movie', 'cinema', 'blockbuster', 'film', 'hollywood', 'bollywood', 'tollywood', 'kollywood',
    'rrr', 'alluri sitarama raju', 'komaram bheem', 'kgf', 'rocky bhai', 'kgf chapter', 'salaar',
    'bahubali', 'amarendra baahubali', 'kattappa', 'bhallaladeva', 'pushpa', 'pushpa raj', 'srivalli',
    'jawan', 'pathaan', 'srk movie', 'dangal', 'kalki 2898 ad', 'bhairava', 'ashwatthama',
    'harry potter', 'hogwarts', 'voldemort', 'dumbledore', 'hermione', 'star wars', 'darth vader',
    'jedi', 'luke skywalker', 'lightsaber', 'yoda', 'mandalorian', 'baby yoda', 'lord of the rings',
    'lotr', 'frodo', 'gandalf', 'sauron', 'gollum', 'avatar movie', 'pandora', 'na vi', 'jake sully',
    'interstellar', 'oppenheimer', 'inception', 'matrix', 'neo', 'john wick', 'keanu reeves',
    'jack sparrow', 'pirates of the caribbean', 'gladiator', 'maximus', 'fast and furious', 'dom toretto'
  ],

  video_game: [
    'game', 'video game', 'gaming', 'gamer', 'aaa game', 'unreal engine', 'gta', 'gta 5', 'gta 6',
    'grand theft auto', 'michael de santa', 'trevor philips', 'franklin clinton', 'los santos', 'vice city',
    'the witcher', 'witcher 3', 'geralt of rivia', 'ciri', 'yennefer', 'cyberpunk 2077', 'cyberpunk game',
    'johnny silverhand', 'night city', 'god of war', 'kratos', 'atreus', 'leviathan axe', 'red dead redemption',
    'rdr2', 'arthur morgan', 'john marston', 'van der linde', 'elden ring', 'malenia', 'tarnished',
    'erdtree', 'dark souls', 'bloodborne', 'sekiro', 'assassins creed', 'ezio auditore', 'minecraft',
    'steve minecraft', 'creeper', 'fortnite', 'battle royale', 'pubg', 'bgmi', 'pochinki', 'airdrop',
    'free fire', 'dj alok', 'valorant', 'jett', 'reyna', 'phoenix valorant', 'sage valorant',
    'call of duty', 'cod', 'ghost modern warfare', 'captain price', 'soap mactavish', 'warzone',
    'resident evil', 'leon s kennedy', 'ada wong', 'nemesis', 'genshin impact', 'traveler', 'raiden shogun',
    'zhongli', 'final fantasy', 'cloud strife', 'sephiroth', 'tifa', 'mortal kombat', 'scorpion',
    'sub-zero', 'tekken', 'jin kazama', 'kazuya', 'street fighter', 'ryu', 'ken', 'apex legends',
    'overwatch', 'tracer', 'genji', 'league of legends', 'lol', 'jinx', 'arcane'
  ],

  celebrity_icon: [
    'virat kohli', 'kohli', 'ms dhoni', 'dhoni', 'rohit sharma', 'cristiano ronaldo', 'ronaldo',
    'cr7', 'siuu', 'lionel messi', 'messi', 'shah rukh khan', 'srk', 'salman khan', 'amitabh bachchan',
    'rajinikanth', 'allu arjun', 'prabhas', 'elon musk', 'taylor swift', 'bts', 'dwayne johnson',
    'the rock', 'keanu reeves', 'bruce lee', 'jackie chan', 'michael jackson', 'eminem'
  ],

  scifi_fantasy: [
    'cyberpunk hacker', 'neon samurai', 'steampunk engineer', 'high elf', 'elf sorceress',
    'dark knight', 'space marine', 'vampire lord', 'werewolf alpha', 'celestial angel',
    'demon king', 'android assassin', 'galactic bounty hunter', 'necromancer', 'sorcerer',
    'wizard fantasy', 'paladin', 'mech pilot'
  ],

  mature_18: [
    '18+', 'mature', 'uncensored', 'unrated', 'adult', 'erotic', 'sensual', 'dark thriller',
    'neo-noir', 'femme fatale', 'mafia underworld', 'syndicate', 'crime lord', 'visceral horror',
    'body horror', 'splatter', 'blood soaked', 'occult ritual', 'grindhouse', 'cult exploitation',
    'shock drama', 'underground cartel', 'interrogation', 'shadowy assassin', 'illicit romance',
    'forbidden passion', 'smoky noir room', 'detective thriller'
  ],

  couple: [
    'couple', 'duo', 'lovers', 'romantic', 'husband', 'wife', 'pair', 'boyfriend', 'girlfriend',
    'bride and groom', 'dono', 'jodi', 'premi', 'premika', 'pati patni', 'romance', 'two lovers',
    'holding hands', 'kissing', 'together'
  ],

  place: [
    'place', 'landscape', 'mountain', 'forest', 'river', 'city', 'temple', 'palace', 'room',
    'street', 'building', 'bridge', 'beach', 'sky', 'scenery', 'nature', 'architecture', 'mandir',
    'mahal', 'shehar', 'pahad', 'jungle', 'island', 'garden', 'cave', 'ruins', 'waterfall',
    'horizon', 'megacity', 'skyline', 'valley', 'desert', 'shrine', 'interior', 'cafe', 'castle',
    'meadow', 'cliff', 'harbor', 'village', 'town', 'cyber city', 'alley', 'road', 'ocean', 'lake',
    'sunset over', 'sunrise over', 'view of', 'dargah', 'fort', 'monument', 'park', 'khet', 'samundar',
    'jagah', 'ghar', 'kamra', 'rasta', 'furfuri nagar town', 'dholakpur village', 'los santos city',
    'night city skyline', 'hogwarts castle', 'westeros kingdom', 'pandora floating mountains'
  ],

  creature: [
    'creature', 'dragon', 'beast', 'monster', 'cat', 'dog', 'tiger', 'lion', 'wolf', 'bird',
    'eagle', 'dinosaur', 'alien', 'snake', 'serpent', 'phoenix', 'bear', 'fox', 'horse', 'elephant',
    'pet', 'billi', 'kutta', 'janwar', 'sher', 'bagh', 'saap', 'rakshas', 'demon', 'gargoyle',
    'griffin', 'hydra', 'kraken', 'chimera', 'cyber-hound', 'mecha-beast', 'beasts', 'monsters',
    'puppy', 'kitten', 'wildlife', 'animal', 'ghoda', 'bhediya', 'hathi', 'demogorgon'
  ],

  world: [
    'world', 'universe', 'galaxy', 'cosmos', 'nebula', 'planet', 'dimension', 'multiverse',
    'astral', 'black hole', 'wormhole', 'deep space', 'celestial', 'antariksh', 'duniya', 'brahmand',
    'milky way', 'solar system', 'stargate', 'quantum realm', 'void', 'astronomical', 'supernova',
    'exoplanet', 'fantasy realm', 'sansar', 'grah', 'upside down world'
  ],

  vehicle_prop: [
    'car', 'spaceship', 'robot', 'mech', 'cyborg armor', 'sword', 'weapon', 'gun', 'bike',
    'vehicle', 'tank', 'blade', 'gadi', 'talwar', 'hathiyar', 'bandook', 'motorcycle', 'supercar',
    'starship', 'aircraft', 'drone', 'armor', 'shield', 'gadget', 'blaster', 'helicopter',
    'submarine', 'mecha', 'pistol', 'rifle', 'katana', 'omnitrix', 'lightsaber', 'batmobile',
    'super-cycle', 'bamboo-copter'
  ],

  group: [
    'crowd', 'army', 'team', 'soldiers', 'group', 'warriors', 'squad', 'bheed', 'log', 'sena',
    'ensemble', 'gathering', 'clan', 'fleet', 'parade', 'rebels', 'audience', 'family', 'band',
    'orchestra', 'toli', 'dal', 'avengers team', 'straw hat pirates'
  ],

  female: [
    'girl', 'woman', 'female', 'lady', 'queen', 'princess', 'heroine', 'sister', 'mother',
    'goddess', 'witch', 'bride', 'maiden', 'ladki', 'aurat', 'mahila', 'rani', 'kanya', 'chhori',
    'she', 'her', 'actress', 'priestess', 'empress', 'sorceress', 'valkyrie', 'model', 'cyber-girl',
    'nari', 'dulhan'
  ],

  male: [
    'man', 'boy', 'male', 'king', 'warrior', 'samurai', 'prince', 'brother', 'father',
    'knight', 'ninja', 'monk', 'wizard', 'ladka', 'admi', 'purush', 'raja', 'veer', 'chhora',
    'he', 'him', 'actor', 'emperor', 'assassin', 'cyber-warrior', 'soldier', 'guy', 'dude',
    'gentleman', 'hero', 'priest', 'beta', 'pita'
  ],
};

// Global Encyclopedic Pop-Culture & Character Knowledge Dictionary
export const GLOBAL_POP_CULTURE_KNOWLEDGE_BASE: Record<string, string> = {
  // Cartoons & Animated Icons
  'motu patlu': 'Motu and Patlu iconic 3D animated comedy duo from Furfuri Nagar, Motu is a cheerful stout man with red tunic and mustache eating crispy hot samosas, Patlu is a slim smart bald man with round spectacles and yellow kurta, Furfuri Nagar background, vibrant 3D cartoon animation render',
  'motu': 'Motu from Motu Patlu cartoon, cheerful plump man with mustache wearing red tunic enjoying crispy samosas, 3D animated comedy cartoon style',
  'patlu': 'Patlu from Motu Patlu cartoon, thin intelligent bald man with round spectacles in yellow kurta, 3D animated comedy cartoon style',
  'chhota bheem': 'Chhota Bheem from Dholakpur, brave muscular young Indian animated hero wearing orange dhoti eating golden laddoos, energetic heroic pose, colorful Indian 2D/3D cartoon animation style',
  'chota bheem': 'Chhota Bheem from Dholakpur, brave young hero in orange dhoti with laddoos, vibrant cartoon animation style',
  'doraemon': 'Doraemon robotic blue earless cat with red nose, bell collar and 4D magic pocket standing with Nobita Nobi in Tokyo neighborhood, cheerful bright anime cartoon style',
  'shinchan': 'Shinchan Nohara, mischievous 5-year-old animated boy with thick eyebrows in iconic red t-shirt and yellow shorts with white puppy Shiro, funny cartoon anime style',
  'tom and jerry': 'Tom the blue-grey cat and Jerry the clever little brown mouse in a dynamic humorous slapstick cartoon chase, vibrant classic animation style',
  'mickey mouse': 'Mickey Mouse iconic Disney cartoon character with round black ears, white gloves, red shorts with white buttons, and yellow shoes, classic cheerful animation style',
  'oggy': 'Oggy the blue cat with red nose and white belly in funny cartoon battle against three cheeky cockroaches Joey, Dee Dee and Marky, vibrant colorful slapstick cartoon style',
  'ben 10': 'Ben 10 Tennyson hero activating the glowing green Omnitrix wristwatch with alien silhouettes in background, action-packed cartoon anime style',
  'spongebob': 'SpongeBob SquarePants joyful yellow sponge in white shirt, red tie and brown square trousers standing in underwater Bikini Bottom with jellyfish, vibrant cartoon style',
  'ninja hattori': 'Ninja Hattori Kanzo in blue ninja kimono with yellow sash, jumping across Tokyo rooftops with brother Shinzo and dog Shishimaru, classic anime cartoon style',
  'little singham': 'Little Singham the brave energetic kid super-cop in police uniform with sunglasses, roaring lion aura, Indian cartoon action style',
  'shiva cartoon': 'Shiva the brave young superhero boy riding his high-tech futuristic gadget super-cycle, action-packed 3D cartoon animation style',
  'roll no 21': 'Kris the modern blue-skinned incarnation of Krishna in school uniform using magical peacock feather flute against demon principal Kanishk, Roll No 21 animation style',
  'tintin': 'Tintin the young investigative reporter with blond quiff in brown trench coat and blue sweater with faithful white fox terrier Snowy, Franco-Belgian ligne claire cartoon art style',
  'asterix': 'Asterix the small Gaulish warrior with winged helmet holding magical potion flask with giant friend Obelix carrying menhir rock, classic cartoon comic style',
  'minions': 'Minions cute yellow pill-shaped creatures with one or two round goggles in blue denim overalls, laughing and holding bananas, 3D CGI animation style',
  'kung fu panda': 'Po the Giant Panda dragon warrior in martial arts kung fu pose with glowing chi energy, DreamWorks 3D animation style',

  // Anime & Manga
  'naruto': 'Naruto Uzumaki ninja in orange jumpsuit with spiky blonde hair and blue headband forming glowing blue Rasengan chakra, dynamic anime action scene',
  'goku': 'Goku Super Saiyan with golden spiky hair, intense aura and glowing blue Kamehameha energy blast, Dragon Ball Z anime masterpiece',
  'luffy': 'Monkey D. Luffy Straw Hat captain with red vest and straw hat using Gear 5 Sun God Nika laughing joyfully, One Piece vibrant anime style',
  'gojo': 'Gojo Satoru Jujutsu sorcerer with white spiky hair, blindfold lifted revealing glowing infinite blue eyes activating Domain Expansion Unlimited Void, Jujutsu Kaisen MAPPA anime style',
  'sung jin-woo': 'Sung Jin-Woo the Shadow Monarch with glowing purple eyes surrounded by shadowy soldier army, Solo Leveling dark manhwa action style',
  'eren': 'Eren Yeager Attack Titan with glowing green eyes and thunderous lightning strike, Attack on Titan cinematic anime style',
  'tanjiro': 'Tanjiro Kamado with checkered haori wielding black Nichirin blade with fiery Hinokami Kagura solar dragon breathing, Demon Slayer Ufotable style',

  // OTT Web Series
  'sacred games': 'Ganesh Gaitonde ruthless underworld crime lord in white kurta standing in smoky 1980s Mumbai underworld with Sartaj Singh cop in turban, Sacred Games gritty noir style',
  'mirzapur': 'Kaleen Bhaiya Akhandanand Tripathi seated on royal wooden chair with Guddu Pandit wielding shotgun in dusty Mirzapur rustic crime world, dramatic high-contrast OTT cinema style',
  'stranger things': 'Eleven with hand outstretched using telekinetic power in neon 1980s Hawkins with terrifying towering Demogorgon and red storm in Upside Down world, Stranger Things Netflix style',
  'breaking bad': 'Walter White Heisenberg in black pork pie hat and dark sunglasses standing in New Mexico desert beside yellow hazmat smoke with Jesse Pinkman, Breaking Bad cinematic AMC style',
  'game of thrones': 'Jon Snow in dark fur cloak holding Valyrian steel Longclaw sword with Daenerys Targaryen riding fire-breathing dragon over snow-covered Iron Throne, Game of Thrones HBO style',
  'money heist': 'The Professor in tailored suit with glasses orchestrating heist alongside crew wearing red jumpsuits and Salvador Dali masks holding banknotes in bank vault, Money Heist Netflix style',
  'squid game': 'Contestant 456 in green tracksuit standing on colorful playground with giant creepy robot doll and pink hooded guards with circle triangle square masks, Squid Game style',
  'the boys': 'Homelander in American flag cape with glowing red laser eyes smiling menacingly in Vought tower with Billy Butcher in black trench coat holding crowbar, The Boys gritty superhero style',
  'peaky blinders': 'Thomas Shelby in tailored tweed three-piece suit with flat cap smoking cigarette in moody misty 1920s Birmingham alleyway, Peaky Blinders BBC cinematic style',
  'panchayat': 'Abhishek Tripathi Sachiv Ji sitting on plastic chair outside Phulera Panchayat office with Pradhan Ji Vikas and Prahlad eating samosas in rural village, Panchayat heartwarming style',

  // Movies & Cinema
  'iron man': 'Iron Man Tony Stark in glowing red and gold nanotech armor with blue arc reactor repulsor blast, high-tech holographic HUD, Marvel MCU blockbuster style',
  'batman': 'The Dark Knight Batman in stealth black armored batsuit standing atop Gotham City gargoyle skyscraper in heavy rain with Bat-Signal glowing in cloudy sky, DC cinema style',
  'rrr': 'Ram Charan as Alluri Sitarama Raju with fiery bow and arrow beside Jr NTR as Komaram Bheem leaping with roaring tiger, epic Indian blockbuster RRR cinema style',
  'kgf': 'Rocky Bhai Yash in tailored suit smoking cigar holding heavy Browning machine gun with sparks and fire in gold mines, KGF cinematic high-contrast gold-tinted action style',
  'bahubali': 'Amarendra Baahubali lifting heavy stone Shivling with waterfalls of Mahishmati kingdom in background, epic Indian fantasy cinema style',
  'pushpa': 'Pushpa Raj Allu Arjun with folded beard and rugged red sandalwood forest attire, iconic Jhukega Nahi pose with axe, intense mass cinema style',
  'harry potter': 'Harry Potter with round glasses and lightning bolt scar holding glowing wand casting Expecto Patronum silver stag patronus in front of Hogwarts Castle at night, Harry Potter magical cinema style',
  'darth vader': 'Darth Vader dark Sith Lord in black helmet with glowing crimson red lightsaber in foggy Imperial Star Destroyer corridor, Star Wars iconic cinematic style',
  'avatar': 'Na\'vi warrior Neytiri with blue bioluminescent striped skin and glowing yellow eyes riding Banshee ikran over floating Hallelujah Mountains on Pandora, Avatar 8K IMAX style',

  // Video Games
  'gta': 'Grand Theft Auto GTA 6 neon-lit Vice City ocean drive with luxury sports cars, palm trees, golden sunset, and dynamic action protagonists, Rockstar Games AAA graphics',
  'witcher': 'Geralt of Rivia white-haired monster slayer with twin silver and steel swords on his back, glowing yellow Cat eyes, casting Quen sign in dark Velen forest, Witcher 3 AAA RPG style',
  'cyberpunk 2077': 'V cyberpunk mercenary with cybernetic glowing eye implants and mantis blades standing in rain-slicked neon Night City with flying aerodynes, Cyberpunk 2077 ray-traced style',
  'god of war': 'Kratos the Spartan Ghost of Sparta with glowing red war tattoo holding frozen Leviathan Axe with son Atreus in snowy Norse realm of Midgard, God of War AAA cinematic style',
  'red dead': 'Arthur Morgan rugged outlaw cowboy on horseback aiming revolver during blazing crimson sunset over western frontier valley, Red Dead Redemption 2 photorealistic style',
  'elden ring': 'Tarnished warrior in knight armor looking up at colossal glowing golden Erdtree spanning the sky of Lands Between, Elden Ring dark fantasy masterpiece',
  'bgmi': 'PUBG BGMI battle royale squad in level 3 helmets and ghillie suits rushing red flare gun smoke airdrop crate in Erangel with buggy, AAA shooter graphics',
  'minecraft': 'Steve with diamond armor and glowing enchanted sword standing near cozy wooden cabin with cubic landscape and glowing redstone lamps, ultra-realistic Minecraft shader style',
  'free fire': 'DJ Alok character with glowing music soundwave aura and dual pistols in Bermuda battle arena, Free Fire action style',
  'valorant': 'Jett Korean duelist agent floating mid-air throwing glowing wind kunai knives in neon futuristic cyber city site, Valorant stylized tactical shooter style',
};

/**
 * Universal Global Pop-Culture Prompt Expander:
 * Checks if prompt mentions ANY famous cartoon, anime, web series, movie, game, or franchise across the world
 * and enriches it with authentic high-fidelity visual context so the AI model renders accurate characters.
 */
export function expandUniversalPopCulturePrompt(promptText: string): string {
  const clean = promptText.toLowerCase();
  for (const [key, expansion] of Object.entries(GLOBAL_POP_CULTURE_KNOWLEDGE_BASE)) {
    const regex = new RegExp(`\\b${key}\\b`, 'i');
    if (regex.test(clean)) {
      return `${expansion}, ${promptText}`;
    }
  }
  return promptText;
}

// Backward-compatible alias
export const expandCartoonPromptIfNeeded = expandUniversalPopCulturePrompt;

/**
 * AI Universal Semantic Subject & Franchise Scanner
 * Automatically detects Cartoons, Anime, OTT Series, Movies, Games, 18+ Mature, Places, Creatures, or Props.
 */
export function detectSubjectFromPrompt(promptText: string): SubjectDetectionResult {
  if (!promptText || !promptText.trim()) {
    return {
      detectedCategory: 'place',
      label: '🏛️ Place / Landscape',
      icon: '🏛️',
      badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40',
      confidence: 'low',
      matchedKeywords: [],
      promptSuffix: ', breathtaking environment architecture, volumetric atmospheric depth, ultra-wide focal lens',
      explanation: 'Empty or general prompt, default balanced environment mode.',
    };
  }

  const clean = promptText.toLowerCase();

  // Score each category
  const scores: { category: SubjectFormCategory; score: number; matches: string[] }[] = [];

  const categoriesToCheck: SubjectFormCategory[] = [
    'cartoon_toon',
    'superhero_comic',
    'anime_manga',
    'gods_mythology',
    'celebrity_icon',
    'scifi_fantasy',
    'ott_webseries',
    'movie_cinema',
    'video_game',
    'mature_18',
    'couple',
    'creature',
    'vehicle_prop',
    'place',
    'world',
    'group',
    'female',
    'male',
  ];

  for (const cat of categoriesToCheck) {
    const words = KEYWORDS[cat];
    let score = 0;
    const matches: string[] = [];

    for (const kw of words) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(clean)) {
        const weight = kw.includes(' ') ? 4 : 2;
        score += weight;
        matches.push(kw);
      }
    }

    if (score > 0) {
      scores.push({ category: cat, score, matches });
    }
  }

  // Sort by highest score
  scores.sort((a, b) => b.score - a.score);

  if (scores.length > 0 && scores[0].score > 0) {
    const best = scores[0];
    const preset = SUBJECT_FORM_PRESETS.find((p) => p.id === best.category) || SUBJECT_FORM_PRESETS[1];

    const badgeColorMap: Record<SubjectFormCategory, string> = {
      auto: 'text-cyan-400 bg-cyan-950/70 border-cyan-500/50',
      cartoon_toon: 'text-amber-400 bg-amber-950/70 border-amber-500/60 shadow-amber-900/30',
      superhero_comic: 'text-sky-400 bg-sky-950/70 border-sky-500/60 shadow-sky-900/30',
      anime_manga: 'text-rose-400 bg-rose-950/70 border-rose-500/60 shadow-rose-900/30',
      gods_mythology: 'text-yellow-400 bg-yellow-950/70 border-yellow-500/60 shadow-yellow-900/30',
      celebrity_icon: 'text-emerald-300 bg-emerald-950/70 border-emerald-500/60 shadow-emerald-900/30',
      scifi_fantasy: 'text-teal-400 bg-teal-950/70 border-teal-500/60 shadow-teal-900/30',
      ott_webseries: 'text-purple-400 bg-purple-950/70 border-purple-500/60 shadow-purple-900/30',
      movie_cinema: 'text-red-400 bg-red-950/70 border-red-500/60 shadow-red-900/30',
      video_game: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/60 shadow-emerald-900/30',
      mature_18: 'text-pink-400 bg-pink-950/70 border-pink-500/60 shadow-pink-900/30',
      male: 'text-cyan-400 bg-cyan-950/70 border-cyan-500/50',
      female: 'text-fuchsia-400 bg-fuchsia-950/70 border-fuchsia-500/50',
      couple: 'text-rose-400 bg-rose-950/70 border-rose-500/50',
      place: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50',
      creature: 'text-orange-400 bg-orange-950/70 border-orange-500/50',
      world: 'text-violet-400 bg-violet-950/70 border-violet-500/50',
      vehicle_prop: 'text-blue-400 bg-blue-950/70 border-blue-500/50',
      group: 'text-indigo-400 bg-indigo-950/70 border-indigo-500/50',
    };

    return {
      detectedCategory: best.category,
      label: preset.label,
      icon: preset.icon,
      badgeColor: badgeColorMap[best.category] || 'text-cyan-400 bg-cyan-950/70 border-cyan-500/50',
      confidence: best.score >= 3 ? 'high' : 'medium',
      matchedKeywords: best.matches.slice(0, 4),
      promptSuffix: preset.promptSuffix,
      explanation: `AI detected keywords: [${best.matches.slice(0, 3).join(', ')}]`,
    };
  }

  const defaultPreset = SUBJECT_FORM_PRESETS.find((p) => p.id === 'place')!;
  return {
    detectedCategory: 'place',
    label: defaultPreset.label,
    icon: defaultPreset.icon,
    badgeColor: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50',
    confidence: 'low',
    matchedKeywords: ['context_scene'],
    promptSuffix: defaultPreset.promptSuffix,
    explanation: 'General cinematic scenic calibration active.',
  };
}

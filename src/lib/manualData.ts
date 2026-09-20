// User Manual Multi-Language Data & Translation Engine
// CRITICAL: Strict security policy — NO mentions of admin override keys, passcodes, or master bypass.

export interface ManualContentItem {
  heading: string;
  details: string[];
  proTips?: string[];
  keyboardShortcuts?: { key: string; desc: string }[];
  quickActionTab?: string;
  quickActionLabel?: string;
}

export interface ManualSectionData {
  id: string;
  title: string;
  badge: string;
  summary: string;
  content: ManualContentItem[];
}

export interface ManualLanguagePackage {
  manualTitle: string;
  manualSubtitle: string;
  tableOfContents: string;
  searchPlaceholder: string;
  copyManual: string;
  copied: string;
  downloadMd: string;
  downloadTxt: string;
  downloadHtml: string;
  printDoc: string;
  needHelpTitle: string;
  needHelpDesc: string;
  askAiMentor: string;
  proTipsTitle: string;
  hotkeysTitle: string;
  sections: ManualSectionData[];
}

// 1. English Standard Manual (Sanitized - Zero Override Leaks)
export const MANUAL_EN: ManualLanguagePackage = {
  manualTitle: 'iCALLOG V18 Operational Manual & Technical Guide',
  manualSubtitle:
    'Complete step-by-step operating instructions for 3D WebGL character rigging, 240p–8K image/video generation, audio synthesis, office documents, design tools, and system navigation.',
  tableOfContents: 'Table of Contents',
  searchPlaceholder: 'Search manual (e.g., 8K, 3D Engine, Music, UPI, Office, Security)...',
  copyManual: 'Copy Manual',
  copied: 'Copied to Clipboard!',
  downloadMd: 'Download Markdown (.md)',
  downloadTxt: 'Download Text (.txt)',
  downloadHtml: 'Download Document (.html)',
  printDoc: 'Print / Save as PDF',
  needHelpTitle: 'Need Instant Help?',
  needHelpDesc: 'You can query the built-in AI Chatbot Mentor at any time for live code samples and interactive assistance.',
  askAiMentor: 'Ask AI Mentor',
  proTipsTitle: 'Pro Tips & Best Practices',
  hotkeysTitle: 'Hotkey & Navigation Shortcuts',
  sections: [
    {
      id: 'getting-started',
      title: '1. Getting Started & System Overview',
      badge: 'Basics',
      summary: 'System architecture, initial 50 free tokens, live auto-sync, and UI navigation.',
      content: [
        {
          heading: 'System Architecture & Capabilities',
          details: [
            'iCALLOG V18 is an all-in-one Creative AI, 3D WebGL, and Media Production Gateway.',
            'Every new user begins with 50 initial free tokens in their dynamic ledger.',
            'Built on a full-stack Node.js + Express backend with real-time Server-Sent Events (SSE) for instant zero-refresh state updates.',
            'Responsive across mobile smartphones, tablets, laptops, and ultra-wide 4K workstations.',
          ],
          proTips: [
            'Watch the token counter pill in the top header: it syncs automatically whenever tokens are credited or spent.',
            'You can recharge your token balance at any time using UPI or choose a VIP membership package.',
          ],
          quickActionTab: 'projects_hub',
          quickActionLabel: 'Explore Projects Hub',
        },
        {
          heading: 'Dynamic Token Balance System',
          details: [
            '240p Image Draft: 2 Tokens | 1080p FHD: 10 Tokens | 8K Ultra-HD: 25 Tokens',
            '240p Video Draft: 5 Tokens | 1080p Video: 24 Tokens | 8K Cinema Video: 50 Tokens',
            '3D Model Auto-Rigging: 25 Tokens | AI Voiceover Synthesis: 5 Tokens',
            'AI Chatbot Mentor queries: 1 Token (Free for VIP Diamond members).',
          ],
        },
      ],
    },
    {
      id: '3d-engine',
      title: '2. 3D WebGL Engine & Emote Studio',
      badge: '3D Graphics',
      summary: '360° orbit camera, 17-bone armature rigging, dance emote playback, and .GLTF/.PNG export.',
      content: [
        {
          heading: 'Interactive 3D Viewport Controls',
          details: [
            '360° Camera Orbit: Click and drag anywhere inside the 3D viewport to inspect the character from any angle.',
            'Camera Zoom: Use your mouse scroll wheel (or trackpad pinch) to zoom in and out smoothly (2.0m to 8.0m radius).',
            'Wireframe Toggle: Click the "Wireframe" button to inspect polygon topology and edge loops.',
            'X-Ray Skeleton: Toggle the "X-Ray Skeleton" button to view the underlying 17-bone inverse kinematic armature.',
            'Animation Speed Slider: Adjust the dance tempo smoothly between 0.25x (slow-motion inspection) up to 2.5x (turbo tempo).',
          ],
          keyboardShortcuts: [
            { key: 'Left Click + Drag', desc: 'Rotate & Orbit camera 360 degrees' },
            { key: 'Scroll Wheel', desc: 'Zoom in / Zoom out' },
            { key: 'Wireframe Button', desc: 'Toggle mesh wireframe view' },
          ],
          quickActionTab: '3d_engine',
          quickActionLabel: 'Launch 3D WebGL Studio',
        },
        {
          heading: 'Character Models & Dance Emotes',
          details: [
            '4 Character Presets: Cyber Android V18, Neon Mech Titan, Shadow Shinobi, and Low-Poly Retro Bot.',
            '7 Integrated Dance Moves: Fortnite Floss, PUBG Winner Taunt, Electro Shuffle, Robot Boogie, Breakdance Flare, Ninja Stance, and Combat Ready Idle.',
            '3D Material Customizer: Live color picker for primary armor paint and emissive visor neon glow.',
            'Export Capabilities: Click the Camera icon to capture a high-resolution PNG snapshot or click ".GLTF" to download the model hierarchy file.',
          ],
        },
        {
          heading: 'Resolution & Super-Sampling Spectrum (240p to 8K)',
          details: [
            '240p Retro WebGL (0.25x scale): Ultra-low bandwidth, retro pixelated shader aesthetic.',
            '480p SD Performance (0.50x scale): Maximum frames-per-second performance for mobile devices.',
            '1080p Native FHD (1.0x scale): Standard crisp high-definition rendering.',
            '4K UHD & 8K SSAA (2.75x ratio): Super-Sampled Anti-Aliasing eliminating pixel crawling and aliasing.',
          ],
        },
      ],
    },
    {
      id: 'image-studio',
      title: '3. 8K AI Image Studio & Tools',
      badge: 'Image AI',
      summary: 'Text-to-Image (240p-8K), 1-Click Background Remover, Noise Cleaner, and Viral Meme Generator.',
      content: [
        {
          heading: 'Text-to-Image Generation Spectrum',
          details: [
            'Supports full resolution spectrum: 240p, 360p, 480p, 720p, 1080p, 2K, 4K, and 8K.',
            'Aspect Ratio Switcher: 16:9 Landscape (Cinematic), 1:1 Square (Avatars), 9:16 Portrait (Mobile Stories), 21:9 Ultrawide.',
            'Style Presets: Cyberpunk, Cinematic Photoreal, Anime Neo-Tokyo, Dark Fantasy, 3D Octane Render, and Minimalist Vector.',
            'Prompt Enhancer: Click the "Enhance Prompt" button to instantly expand simple prompts into hyper-detailed studio descriptions.',
          ],
          quickActionTab: 'image_studio',
          quickActionLabel: 'Go to Image Studio',
        },
        {
          heading: 'AI Super-Resolution 8K Upscaler',
          details: [
            'Upscale any lower-resolution draft (240p, 480p, 1080p) directly into true 8K Ultra-HD with one click.',
            'Applies neural detail reconstruction, edge preservation, and unsharp masking.',
          ],
        },
        {
          heading: 'Creative Canvas Tools (BG Remover, Noise Clean, Meme Generator)',
          details: [
            '1-Click Background Removal: Erases backgrounds on any image with Alpha matte transparency output.',
            'Noise Cleaner: Eliminates grain, sensor artifacts, and compression noise using bilateral edge filtering.',
            'Viral Meme Generator: Add customized top and bottom text overlays with impact font and download high-res shareable memes.',
          ],
        },
      ],
    },
    {
      id: 'video-audio',
      title: '4. 8K Video & Audio Suite',
      badge: 'Video & Audio',
      summary: '8K Text-to-Video, frame rate selector (24/30/60 FPS), audio visualizer, TTS voiceover, and FL Studio helper.',
      content: [
        {
          heading: 'Ultra-HD Video Generation (240p to 8K) & Duration Policy',
          details: [
            'Resolution Scale: 240p draft up to 8K IMAX spatial video.',
            'Frame Rate Control: Choose between 24 FPS (cinematic motion blur), 30 FPS (standard video), and 60 FPS (high-smoothness action).',
            'Free Tier Duration Limit: Free users can render videos up to 1 Hour (60 minutes) — includes 15s, 30s, 1m, 5m, 15m, 30m, and 1 Hour.',
            'VIP Unlimited Duration: Unlocked for VIP Diamond, Gold, Silver, and Bronze members (2 Hours, 4 Hours, 8 Hours, or ∞ Unlimited Studio Master).',
            'Styles: Cinematic Drone, Cyberpunk Hyper-lapse, Anime Neo-Tokyo, Photoreal Documentary, Slow-Motion Macro, Unreal Engine 5.',
          ],
          proTips: [
            'Need unlimited video rendering? Upgrade via UPI Recharge to unlock high-priority VIP rendering pipelines.',
          ],
          quickActionTab: 'video_audio',
          quickActionLabel: 'Open Video & Audio Suite',
        },
        {
          heading: 'Real-Time Audio-Reactive Spectrum Visualizer',
          details: [
            'Built with the Web Audio API AnalyserNode and Canvas rendering.',
            'Visualizes dynamic multi-band frequency bars in real-time synced to synthetic or loaded audio tracks.',
            'Includes Play, Pause, and Frequency Sensitivity controls.',
          ],
        },
        {
          heading: 'AI Voiceover & FL Studio Project Helper',
          details: [
            'Text-to-Speech Voiceover: Generates studio-quality speech with selectable voice profiles (Zephyr, Nova, Orion, Lyra).',
            'Vocal/Instrumental Noise Cleaner: Removes mic hiss, background humming, and room echo from recorded audio.',
            'FL Studio Integration: Exports structured project metadata and pattern timing (.FLP companion format) for digital audio workstations.',
          ],
        },
      ],
    },
    {
      id: 'ai-mentor',
      title: '5. Interactive AI Chatbot Mentor',
      badge: 'Assistant',
      summary: 'Real-time coding and study assistant with conversation memory and code snippet copy.',
      content: [
        {
          heading: 'Coding & Architecture Assistant',
          details: [
            'Specialized in Three.js WebGL graphics, bone matrices, shader GLSL code, and full-stack Express development.',
            'Maintains conversational context memory across multiple discussion turns.',
            'Includes 1-click prompt suggestion cards for fast queries (e.g., Three.js rigging tutorial, 8K render settings, UPI webhook implementation).',
            'One-click Code Copy button formatted with syntax-highlighted code blocks.',
          ],
          quickActionTab: 'chat_mentor',
          quickActionLabel: 'Chat with AI Mentor',
        },
      ],
    },
    {
      id: 'payments-vip',
      title: '6. UPI Recharge & VIP Membership',
      badge: 'Billing',
      summary: 'Dynamic UPI QR generation for PhonePe, Paytm, BHIM, Bank UPI, and automatic token crediting.',
      content: [
        {
          heading: 'Automated UPI QR Payment Flow (No Crypto)',
          details: [
            'Select any VIP Tier Pack: Bronze (₹200 / +500 Tokens), Silver (₹500 / +1,500 Tokens), Gold (₹1,000 / +4,000 Tokens), Diamond (₹2,000 / +10,000 Tokens).',
            'A dynamic NPCI-compliant UPI QR code is generated with a unique transaction reference ID.',
            'Users can scan the QR code using any UPI app: PhonePe, Paytm, BHIM, or Any Banking UPI app.',
            'Webhooks automatically verify the payment and credit tokens directly to the ledger in real-time without page refresh.',
          ],
        },
        {
          heading: 'VIP Tier Benefits',
          details: [
            'Bronze Tier: Faster queue priority and 500 tokens.',
            'Silver Tier: Priority queue processing and 1,500 tokens.',
            'Gold Tier: Dedicated 8K video rendering slots and 4,000 tokens.',
            'Diamond Tier: Maximum priority queue, 8K ultra batch jobs, and 10,000 tokens.',
          ],
        },
      ],
    },
    {
      id: 'security-privacy',
      title: '7. Enterprise Security, Privacy & Data Protection',
      badge: 'Security',
      summary: 'End-to-end encryption, bcrypt password protection, zero plain-text storage, and secure cloud persistence.',
      content: [
        {
          heading: 'Data Privacy & Ledger Protection',
          details: [
            'Every transaction, token deduction, and asset generation is protected with cryptographically signed tokens.',
            'Server-side state ledger verification prevents tampering and ensures accurate token tracking.',
            'Zero plain-text password storage: all authentication credentials use modern salted hash cryptography.',
            'Encrypted local and cloud storage prevents unauthorized access to generated projects and media.',
          ],
        },
        {
          heading: 'Enterprise Security Architecture',
          details: [
            'TLS/SSL encrypted data-in-transit across all API endpoints and real-time event streams.',
            'AES-256 server-side encryption for sensitive receipts, cloud vault media, and transaction logs.',
            'Automated rate-limiting to protect users from automated attacks and bot requests.',
            'Role-based access controls and isolated multi-tenant session storage.',
          ],
        },
      ],
    },
    {
      id: 'cloud-vault',
      title: '8. Cloud Vault & Storage Sync',
      badge: 'Cloud',
      summary: 'Multi-device asset synchronization, persistent cloud storage, and download manager.',
      content: [
        {
          heading: 'Persistent Cloud Media Vault',
          details: [
            'All generated 3D models (.GLTF), 8K images, 8K MP4 videos, and synthesized voice clips are saved with persistent cloud representations.',
            'Filter generated assets by type: 3D Models, 8K Images, 8K Videos, or Voiceover Audio.',
            'Download any file directly to your local computer or remove files from the storage ledger.',
          ],
        },
      ],
    },
    {
      id: 'film-studio',
      title: '9. AI Film Studio: Script Writing & Direction',
      badge: 'Cinema Suite',
      summary: 'Screenplay generator, director style profiles, automated shot listing, and camera blocking.',
      content: [
        {
          heading: 'Screenplay & Script Generation',
          details: [
            'Industry standard screenplay layout with sluglines (EXT./INT.), action descriptions, character dialogue, and parentheticals.',
            'Genre options: Cyberpunk Noir, Sci-Fi Epic, Psychological Thriller, Neo-Western, High Fantasy, and Psychological Drama.',
            'Format settings: Short Film Scene (3-5 mins), Teaser Trailer (90s), Feature Act I, or Episodic Pilot.',
            'Instant Script Copy button for pasting into Final Draft or Celtx.',
          ],
          quickActionTab: 'film_studio',
          quickActionLabel: 'Open Film Studio',
        },
        {
          heading: 'Director Style Calibration & Camera Blocking',
          details: [
            'Choose iconic cinematic directorial approaches: Christopher Nolan, Denis Villeneuve, Quentin Tarantino, or Wes Anderson.',
            'Generates precise Lens recommendations (e.g., 35mm Anamorphic, 50mm T1.3 Prime).',
            'Automated Shot List: Shot Number, Framing, Camera Motion, Lighting Key, and VFX layers.',
          ],
        },
      ],
    },
    {
      id: 'voice-converter',
      title: '10. Human to AI Voice Converter',
      badge: 'Vocal Morphing',
      summary: 'Record or upload human speech and morph into robotic, anime, cinematic trailer, or cybernetic voices.',
      content: [
        {
          heading: 'Human Vocal Recording & Upload',
          details: [
            'Live Microphone Recording: Click the Record button to capture your voice directly in the browser via MediaRecorder.',
            'Audio File Upload: Upload any existing .wav, .mp3, or .m4a human vocal stem.',
            'Audio Waveform Visualizer: Live dual-channel waveform showing input amplitude and filtered output.',
          ],
          quickActionTab: 'voice_converter',
          quickActionLabel: 'Open Voice Converter',
        },
        {
          heading: 'AI Vocal Personas & Pitch Controls',
          details: [
            '6 AI Voice Targets: Cyber Synth Android, Epic Movie Trailer Announcer, Anime Heroine, Cybernetic Cyborg Warrior, Deep Radio Broadcaster, and Ethereal Alien Entity.',
            'Pitch Shifting: -12 semitones to +12 semitones slider for deep or bright voice tuning.',
            'Formant Tuning: Independent timbre reshaping preserving vowel articulation.',
            'Download Converted Audio: Instant 320kbps MP3 stem download.',
          ],
        },
      ],
    },
    {
      id: 'cross-modality',
      title: '11. Image-to-3D, 3D-to-Video & Image-to-Video Pipelines',
      badge: 'Multimodal',
      summary: 'Interconnected neural workflows transforming 2D images into 3D rigged models, 3D models into cinematic videos, and images into motion videos.',
      content: [
        {
          heading: 'Image to 3D Model Reconstruction',
          details: [
            'Located in 3D WebGL Studio under "Image to 3D Model AI" sub-tab.',
            'Feed any 2D concept art or character illustration URL to synthesize a watertight 3D polygonal mesh.',
            'Select polygon density: Low-Poly (5k verts), Game-Ready (18k verts), or Hyper-Poly (85k verts).',
            'Optional Auto-Rigging: Automatically generates 17-bone armature hierarchy ready for immediate animation.',
          ],
          quickActionTab: '3d_engine',
          quickActionLabel: 'Launch 3D WebGL Studio',
        },
        {
          heading: '3D Model to Video Cinema',
          details: [
            'Located in 3D WebGL Studio under "3D Model to Video Cinema" sub-tab.',
            'Choose camera motion paths: 360° Turntable Orbit, Dramatic Dolly In, Hero Spiral Crane, or Matrix Bullet-Time.',
            'Configure cinematic lighting: Cyberpunk Dual-Tone, Golden Hour Sunset, or High-Key Studio.',
            'Renders directly into 8K, 4K, or 1080p MP4 cinematic sequence.',
          ],
        },
        {
          heading: 'Image to Video Motion Animator',
          details: [
            'Located in 8K Video & Audio Suite under "Image to Video Animator" tab.',
            'Animates 2D images with camera trajectory physics, volumetric atmosphere, and optical flow.',
            'Duration respects user tier: Free users up to 1 Hour (60 mins), VIP users unlimited.',
          ],
          quickActionTab: 'video_audio',
          quickActionLabel: 'Open Video Suite',
        },
      ],
    },
    {
      id: 'office-suite',
      title: '12. AI Office Suite: Docs, PPT Slides & Excel Spreadsheets',
      badge: 'Productivity',
      summary: 'Word document creator, multi-slide presentation deck builder, and dynamic spreadsheet grid with calculation formulas.',
      content: [
        {
          heading: 'Docs & Word Studio (.doc / .txt)',
          details: [
            'Full text editor with live word count, character count, and estimated reading time.',
            'Pre-configured templates: Film Production Proposals, Legal NDAs & Contracts, System Architecture Specifications.',
            'One-click download as Microsoft Word (.doc) or clean UTF-8 text (.txt).',
          ],
          quickActionTab: 'office_suite',
          quickActionLabel: 'Open Office Suite',
        },
        {
          heading: 'PPT Presentation & Pitch Deck Studio',
          details: [
            'Multi-slide deck generator with Left Thumbnail Carousel and Center Stage Visualizer.',
            'Full-screen Presentation Mode with custom theme styling.',
            'Export slide deck structure in JSON and HTML presentation formats.',
          ],
        },
        {
          heading: 'Excel Spreadsheet & Financial Ledger',
          details: [
            'Dynamic grid (Columns A-Z, Rows 1-30+) with live formula bar.',
            'Evaluates mathematical formulas: =SUM(E2:E8) and =C*D multiplication calculations.',
            'One-click export to universal .CSV format compatible with Microsoft Excel and Google Sheets.',
          ],
        },
      ],
    },
    {
      id: 'design-identity',
      title: '13. Design & Identity Suite: Favicons, Badges, Cards & Resume',
      badge: 'Branding',
      summary: 'Multi-resolution favicon generator, physical/digital security ID badges, executive double-sided business cards, and ATS resumes.',
      content: [
        {
          heading: 'Favicon & App Icon Studio',
          details: [
            'Multi-resolution previews: 16x16, 32x32, 48x48, 64x64, 180x180 (Apple Touch Icon), and vector SVG.',
            'Realistic Google Chrome / Safari browser tab preview mockup showing live favicon placement.',
            'Export individual SVGs and copy production-ready <link rel="icon"> HTML snippet with one click.',
          ],
          quickActionTab: 'design_studio',
          quickActionLabel: 'Open Design Suite',
        },
        {
          heading: 'Security & Enterprise ID Badges',
          details: [
            'Print-ready credential card layout with holographic security stripe and barcode scanner lines.',
            'Customizable Clearance Tiers: Level 5 Sovereign Access, Lead Director, Technical Crew.',
            'Print badge directly to PDF or standard ID card printer.',
          ],
        },
        {
          heading: 'Business Cards (3.5" x 2.0") & ATS Resume Builder',
          details: [
            'Dual-sided luxury business card studio with metallic foil accents, vCard QR codes, and 3D card flipping.',
            'ATS-friendly modern Resume & CV Builder with skills matrix, work experience timeline, and instant A4 Print to PDF.',
          ],
        },
      ],
    },
    {
      id: 'voice-navigation',
      title: '14. Web Speech API Voice Navigation & Commands',
      badge: 'Voice Control',
      summary: 'Hands-free voice recognition for switching studios, opening modals, triggering auto-saves, and system actions.',
      content: [
        {
          heading: 'Supported Voice Commands & Speech Navigation',
          details: [
            'Say "Open Admin Modal" to immediately launch the Admin Override & RBAC settings dialog.',
            'Say "Go to Film Studio" or "Open Film Studio" to navigate straight to the Cinema Director & Screenplay suite.',
            'Say "Go to Office Suite", "Go to Docs", "Go to Excel", or "Go to Presentation" to open productivity tools.',
            'Say "Go to 3D Engine" or "Open 3D Studio" to load the Three.js WebGL viewport.',
            'Say "Open VIP Plans" or "Open VIP Modal" to inspect subscription membership tiers.',
            'Say "Open Security Modal" to view token expiration, password controls, and session timers.',
            'Say "Save Work" or "Auto Save" to execute an immediate snapshot save to your offline IndexedDB and cloud vaults.',
            'Say "Toggle Dark Mode" to flip between high-contrast dark and light modes.',
            'Say "Close Modal" to dismiss any active modal dialog hands-free.',
          ],
          quickActionTab: 'film_studio',
          quickActionLabel: 'Try Voice in Film Studio',
        },
        {
          heading: 'Web Speech API Engine Capabilities',
          details: [
            'Push-to-Talk and Continuous Listening Modes: Toggle continuous listening for uninterrupted hands-free workflow.',
            'Text-to-Speech Audio Feedback: Spoken confirmations using browser speech synthesis with toggleable mute controls.',
            'Microphone Permissions: Automatically requests browser microphone access via W3C Web Speech API standard.',
          ],
        },
      ],
    },
  ],
};

// 2. Hindi Full Manual (हिन्दी विस्तृत गाइड - नो ओवरराइड लीक)
export const MANUAL_HI: ManualLanguagePackage = {
  manualTitle: 'iCALLOG V18 यूज़र मैनुअल एवं संपूर्ण तकनीकी गाइड',
  manualSubtitle:
    '3D वेबजीएल कैरेक्टर रिगिंग, 240p से 8K इमेज/वीडियो जनरेशन, म्यूजिक और वॉइस स्टूडियो, ऑफिस डॉक्स, डिज़ाइन टूल्स और सिस्टम नेविगेशन के लिए सम्पूर्ण गाइड।',
  tableOfContents: 'विषय सूची (सामग्री)',
  searchPlaceholder: 'मैनुअल में खोजें (जैसे 8K, 3D इंजन, गाने, UPI, ऑफिस, सुरक्षा)...',
  copyManual: 'मैनुअल कॉपी करें',
  copied: 'क्लिपबोर्ड में कॉपी हो गया!',
  downloadMd: 'मार्कडाउन डाउनलोड करें (.md)',
  downloadTxt: 'टेक्स्ट डाउनलोड करें (.txt)',
  downloadHtml: 'दस्तावेज़ डाउनलोड करें (.html)',
  printDoc: 'प्रिंट / PDF के रूप में सेव करें',
  needHelpTitle: 'तुरंत सहायता चाहिए?',
  needHelpDesc: 'आप किसी भी समय लाइव कोड उदाहरण और समस्या समाधान के लिए इन-बिल्ट एआई चैटबॉट मेंटर से पूछ सकते हैं।',
  askAiMentor: 'एआई मेंटर से पूछें',
  proTipsTitle: 'प्रो टिप्स एवं सर्वोत्तम सुझाव',
  hotkeysTitle: 'शॉर्टकट कीज़ एवं नेविगेशन',
  sections: [
    {
      id: 'getting-started',
      title: '1. शुरुआत और सिस्टम अवलोकन',
      badge: 'शुरुआती',
      summary: 'सिस्टम आर्किटेक्चर, 50 शुरुआती मुफ्त टोकन, लाइव ऑटो-सिंक और नेविगेशन।',
      content: [
        {
          heading: 'सिस्टम वास्तुकला और क्षमताएं',
          details: [
            'iCALLOG V18 एक संपूर्ण क्रिएटिव एआई, 3D वेबजीएल और मीडिया निर्माण गेटवे है।',
            'प्रत्येक नए उपयोगकर्ता को शुरुआत में 50 मुफ्त टोकन दिए जाते हैं।',
            'फुल-स्टैक Node.js + Express बैकएंड और रियल-टाइम सर्वर-सेंट इवेंट्स (SSE) पर आधारित, जिससे बिना रिफ्रेश किए तुरंत अपडेट मिलता है।',
            'मोबाइल स्मार्टफोन, टैबलेट, लैपटॉप और 4K स्क्रीन सभी पर आसानी से काम करता है।',
          ],
          proTips: [
            'ऊपर हेडर में टोकन काउंटर पर नज़र रखें: टोकन खर्च या जमा होते ही यह तुरंत अपडेट हो जाता है।',
            'टोकन समाप्त होने पर आप किसी भी समय यूपीआई द्वारा टोकन रिचार्ज कर सकते हैं या वीआईपी पैक ले सकते हैं।',
          ],
          quickActionTab: 'projects_hub',
          quickActionLabel: 'प्रोजेक्ट्स हब देखें',
        },
        {
          heading: 'डायनेमिक टोकन खपत प्रणाली',
          details: [
            '240p इमेज ड्राफ्ट: 2 टोकन | 1080p FHD: 10 टोकन | 8K अल्ट्रा-एचडी: 25 टोकन',
            '240p वीडियो ड्राफ्ट: 5 टोकन | 1080p वीडियो: 24 टोकन | 8K सिनेमा वीडियो: 50 टोकन',
            '3D मॉडल ऑटो-रिगिंग: 25 टोकन | एआई वॉइस सिंथेसिस: 5 टोकन',
            'एआई चैटबॉट मेंटर सवाल: 1 टोकन (वीआईपी डायमंड उपयोगकर्ताओं के लिए पूरी तरह मुफ्त)।',
          ],
        },
      ],
    },
    {
      id: '3d-engine',
      title: '2. 3D वेबजीएल इंजन और इमोट स्टूडियो',
      badge: '3D ग्राफिक्स',
      summary: '360° ऑर्बिट कैमरा, 17-बोन आर्मेचर रिगिंग, डांस मूव्स और .GLTF/.PNG एक्सपोर्ट।',
      content: [
        {
          heading: 'इंटरैक्टिव 3D व्यूपोर्ट नियंत्रण',
          details: [
            '360° कैमरा घुमाएं: कैरेक्टर को किसी भी कोण से देखने के लिए 3D व्यूपोर्ट में कहीं भी क्लिक करके ड्रैग करें।',
            'कैमरा ज़ूम: सहज ज़ूम इन और ज़ूम आउट के लिए माउस व्हील या ट्रैकपैड पिंच का उपयोग करें।',
            'वायरफ्रेम टॉगल: पॉलीगॉन टोपोलॉजी और एज लूप्स देखने के लिए "वायरफ्रेम" बटन दबाएं।',
            'एक्स-रे स्केलेटन: 17-हड्डियों वाला रिग्ड स्केलेटन देखने के लिए "X-Ray Skeleton" चालू करें।',
            'एनीमेशन स्पीड: डांस की गति को 0.25x (धीमी गति) से 2.5x (तेज़ गति) तक बदलें।',
          ],
          keyboardShortcuts: [
            { key: 'लेफ्ट क्लिक + ड्रैग', desc: 'कैमरा 360 डिग्री घुमाएं' },
            { key: 'माउस स्क्रॉल', desc: 'ज़ूम इन / ज़ूम आउट' },
            { key: 'वायरफ्रेम बटन', desc: 'वायरफ्रेम मोड ऑन/ऑफ' },
          ],
          quickActionTab: '3d_engine',
          quickActionLabel: '3D स्टूडियो खोलें',
        },
        {
          heading: 'कैरेक्टर मॉडल और डांस इमोट्स',
          details: [
            '4 कैरेक्टर प्रीसेट: साइबर एंड्रॉइड V18, नियॉन मेक टाइटन, शैडो शिनोबी, और रेट्रो बॉट।',
            '7 डांस मूव्स: फोर्टनाइट फ्लॉस, पबजी विनर डांस, इलेक्ट्रो शफल, रोबोट बूगी, ब्रेकडांस फ्लेयर, निंजा स्टांस, और कॉम्बैट आइडल।',
            '3D मटेरियल कस्टमाइज़र: मुख्य बॉडी पेंट और नियॉन वाइज़र का रंग तुरंत बदलें।',
            'एक्सपोर्ट विकल्प: हाई-रेज़ोल्यूशन PNG फोटो खींचें या .GLTF 3D मॉडल डाउनलोड करें।',
          ],
        },
      ],
    },
    {
      id: 'image-studio',
      title: '3. 8K एआई इमेज स्टूडियो एवं टूल्स',
      badge: 'इमेज एआई',
      summary: 'टेक्स्ट से इमेज (240p-8K), 1-क्लिक बैकग्राउंड रिमूवर, नॉइज़ क्लीनर और मीम जनरेटर।',
      content: [
        {
          heading: 'टेक्स्ट से इमेज निर्माण स्पेक्ट्रम',
          details: [
            'सभी रेज़ोल्यूशन उपलब्ध: 240p, 360p, 480p, 720p, 1080p, 2K, 4K, और असली 8K।',
            'आस्पेक्ट रेशियो: 16:9 लैंडस्केप (सिनेमा), 1:1 स्क्वायर (अवतार), 9:16 पोर्ट्रेट (मोबाइल स्टोरीज़)।',
            'स्टाइल प्रीसेट्स: साइबरपंक, सिनेमैटिक फोटोरियल, एनीमे टोक्यो, डार्क फैंटेसी, 3D ऑक्टेन रेंडर।',
            'प्रॉम्प्ट एन्हांसर: साधारण प्रॉम्प्ट को विस्तार से स्टूडियो क्वालिटी में बदलने के लिए "Enhance Prompt" दबाएं।',
          ],
          quickActionTab: 'image_studio',
          quickActionLabel: 'इमेज स्टूडियो में जाएं',
        },
        {
          heading: 'एआई सुपर-रेज़ोल्यूशन 8K अपस्केलर और बैकग्राउंड रिमूवर',
          details: [
            'किसी भी कम रेज़ोल्यूशन वाले ड्राफ्ट को केवल 1-क्लिक में 8K अल्ट्रा-एचडी में अपस्केल करें।',
            '1-क्लिक बैकग्राउंड रिमूवर: किसी भी फोटो का बैकग्राउंड हटाकर पारदर्शी PNG बनाएं।',
            'मीम जनरेटर: ऊपर और नीचे टेक्स्ट लिखकर तुरंत वायरल मीम तैयार करें और डाउनलोड करें।',
          ],
        },
      ],
    },
    {
      id: 'video-audio',
      title: '4. 8K वीडियो और ऑडियो सुइट',
      badge: 'वीडियो एवं ऑडियो',
      summary: '8K वीडियो निर्माण, एफपीएस चयन (24/30/60), ऑडियो विज़ुअलाइज़र और वॉइसओवर।',
      content: [
        {
          heading: 'अल्ट्रा-एचडी वीडियो जनरेशन (240p से 8K) और अवधि नियम',
          details: [
            'रेज़ोल्यूशन स्केल: 240p ड्राफ्ट से लेकर 8K IMAX स्तर का सिनेमा वीडियो।',
            'फ्रेम रेट नियंत्रण: 24 FPS (सिनेमाई मोशन ब्लर), 30 FPS (स्टैंडर्ड), 60 FPS (अल्ट्रा स्मूथ)।',
            'फ्री टियर वीडियो अवधि: फ्री यूज़र्स अधिकतम 1 घंटे (60 मिनट) तक का वीडियो रेंडर कर सकते हैं (15s, 30s, 1m, 5m, 15m, 30m, 1hr)।',
            'वीआईपी अनलिमिटेड अवधि: वीआईपी डायमंड, गोल्ड, सिल्वर और ब्रॉन्ज यूज़र्स के लिए असीमित समय (2 घंटे, 4 घंटे, 8 घंटे या असीमित) खुला है।',
          ],
          proTips: [
            'असीमित वीडियो रेंडरिंग के लिए यूपीआई रिचार्ज द्वारा वीआईपी सदस्यता सक्रिय करें।',
          ],
          quickActionTab: 'video_audio',
          quickActionLabel: 'वीडियो स्टूडियो खोलें',
        },
        {
          heading: 'रियल-टाइम ऑडियो स्पेक्ट्रम विज़ुअलाइज़र',
          details: [
            'मल्टी-बैंड फ्रीक्वेंसी विज़ुअलाइज़र जो बज रहे संगीत के साथ तालमेल में चलता है।',
            'प्ले, पॉज़ और संवेदनशीलता (Sensitivity) नियंत्रण की सुविधा शामिल है।',
          ],
        },
      ],
    },
    {
      id: 'ai-mentor',
      title: '5. इंटरैक्टिव एआई चैटबॉट मेंटर',
      badge: 'सहायक',
      summary: 'रियल-टाइम कोडिंग, ग्राफ़िक्स और सिस्टम सहायता के साथ बातचीत मेमोरी।',
      content: [
        {
          heading: 'कोडिंग और तकनीकी सलाहकार',
          details: [
            'Three.js वेबजीएल, 3D मैट्रिक्स, शेडर GLSL और फुल-स्टैक डेवलपमेंट में माहिर।',
            'पूरी बातचीत का संदर्भ (कंटेक्स्ट) याद रखता है।',
            '1-क्लिक कोड कॉपी बटन जिससे तुरंत सही सिंटैक्स के साथ कोड कॉपी कर सकते हैं।',
          ],
          quickActionTab: 'chat_mentor',
          quickActionLabel: 'एआई मेंटर से बात करें',
        },
      ],
    },
    {
      id: 'payments-vip',
      title: '6. यूपीआई रिचार्ज और वीआईपी सदस्यता',
      badge: 'बिलिंग',
      summary: 'PhonePe, Paytm, BHIM, और बैंक UPI ऐप्स से ऑटोमैटिक टोकन क्रेडिट।',
      content: [
        {
          heading: 'स्वचालित यूपीआई क्यूआर भुगतान प्रक्रिया (नो क्रिप्टो)',
          details: [
            'वीआईपी पैक चुनें: ब्रॉन्ज (₹200 / +500 टोकन), सिल्वर (₹500 / +1,500 टोकन), गोल्ड (₹1,000 / +4,000 टोकन), डायमंड (₹2,000 / +10,000 टोकन)।',
            'एक वैध डायनेमिक UPI QR कोड जनरेट होता है।',
            'PhonePe, Paytm, Google Pay, BHIM या किसी भी बैंक ऐप से स्कैन करके पेमेंट करें।',
            'पेमेंट होते ही बिना पेज रिफ्रेश किए तुरंत आपके खाते में टोकन जुड़ जाते हैं।',
          ],
        },
        {
          heading: 'वीआईपी टियर के फायदे',
          details: [
            'ब्रॉन्ज टियर: तेज़ कतार और 500 टोकन।',
            'सिल्वर टियर: प्राथमिकता कतार और 1,500 टोकन।',
            'गोल्ड टियर: 8K वीडियो रेंडरिंग स्लॉट और 4,000 टोकन।',
            'डायमंड टियर: सर्वोच्च प्राथमिकता, 8K बैच जॉब्स, और 10,000 टोकन।',
          ],
        },
      ],
    },
    {
      id: 'security-privacy',
      title: '7. सिस्टम सुरक्षा, गोपनीयता एवं डेटा संरक्षण',
      badge: 'सुरक्षा',
      summary: 'एन्ड-टू-एन्ड एन्क्रिप्शन, bcrypt पासवर्ड सुरक्षा, ज़ीरो प्लेन-टेक्स्ट स्टोरेज और सुरक्षित क्लाउड बैकअप।',
      content: [
        {
          heading: 'डेटा गोपनीयता और लेज़र सुरक्षा',
          details: [
            'प्रत्येक लेनदेन, टोकन कटौती और मीडिया जनरेशन क्रिप्टोग्राफिक टोकन द्वारा सुरक्षित है।',
            'सर्वर-साइड लेज़र सत्यापन किसी भी छेड़छाड़ को रोकता है और सही टोकन बैलेंस सुनिश्चित करता है।',
            'कोई भी पासवर्ड सादे टेक्स्ट में स्टोर नहीं होता: सभी क्रेडेंशियल सुरक्षित साल्टेड हैश का उपयोग करते हैं।',
            'एन्क्रिप्टेड लोकल और क्लाउड स्टोरेज किसी भी अनधिकृत पहुंच को रोकता है।',
          ],
        },
        {
          heading: 'एंटरप्राइज सुरक्षा वास्तुकला',
          details: [
            'सभी एपीआई एंडपॉइंट्स पर TLS/SSL एन्क्रिप्टेड सुरक्षित संचार।',
            'संवेदनशील रसीदों, क्लाउड मीडिया और डेटा लॉग के लिए AES-256 सर्वर एन्क्रिप्शन।',
            'स्वचालित सुरक्षा सुरक्षा और बॉट हमलों से सुरक्षा के लिए रेट-लिमिटिंग।',
            'रोल-बेस्ड एक्सेस कंट्रोल और सुरक्षित मल्टी-टेनेंट सेशन मैनेजमेंट।',
          ],
        },
      ],
    },
    {
      id: 'cloud-vault',
      title: '8. क्लाउड वॉल्ट और स्टोरेज सिंक',
      badge: 'क्लाउड',
      summary: 'मल्टी-डिवाइस एसेट सिंक्रोनाइज़ेशन, सुरक्षित स्टोरेज और डाउनलोड मैनेजर।',
      content: [
        {
          heading: 'स्थायी क्लाउड मीडिया वॉल्ट',
          details: [
            'आपके द्वारा बनाए गए सभी 3D मॉडल (.GLTF), 8K इमेज, 8K वीडियो और वॉइस क्लिप्स क्लाउड में सुरक्षित रहते हैं।',
            'प्रकार के अनुसार फ़िल्टर करें: 3D मॉडल, 8K इमेज, 8K वीडियो या वॉइस ऑडियो।',
            'किसी भी फ़ाइल को सीधे अपने कंप्यूटर पर डाउनलोड करें या जब चाहें हटाएं।',
          ],
        },
      ],
    },
    {
      id: 'film-studio',
      title: '9. एआई फिल्म स्टूडियो: पटकथा लेखन एवं निर्देशन',
      badge: 'सिनेमा सुइट',
      summary: 'स्क्रीनप्ले जनरेटर, निर्देशक शैली प्रोफाइल, स्वचालित शॉट सूची और कैमरा ब्लॉकिंग।',
      content: [
        {
          heading: 'स्क्रीनप्ले और स्क्रिप्ट लेखन',
          details: [
            'इंडस्ट्री स्टैंडर्ड स्क्रीनप्ले लेआउट: स्लगलाइन्स (EXT./INT.), एक्शन विवरण, डायलॉग और एक्सप्रेशन्स।',
            'शैली विकल्प: साइबरपंक नोयर, साइंस फिक्शन, थ्रिलर, वेस्टर्न, फैंटेसी और ड्रामा।',
            'फॉर्मेट: शॉर्ट फिल्म सीन (3-5 मिनट), टीज़र ट्रेलर (90s), या पूरी फिल्म का एक्ट 1।',
            'Final Draft या Celtx में पेस्ट करने के लिए 1-क्लिक कॉपी बटन।',
          ],
          quickActionTab: 'film_studio',
          quickActionLabel: 'फिल्म स्टूडियो खोलें',
        },
      ],
    },
    {
      id: 'voice-converter',
      title: '10. ह्यूमन टू एआई वॉइस कनवर्टर',
      badge: 'वॉइस मॉर्फिंग',
      summary: 'अपनी आवाज़ रिकॉर्ड करें और उसे रोबोटिक, एनीमे, सिनेमाई या साइबरनेटिक आवाज़ में बदलें।',
      content: [
        {
          heading: 'आवाज़ रिकॉर्डिंग और अपलोड',
          details: [
            'लाइव माइक्रोफोन रिकॉर्डिंग: सीधे ब्राउज़र में अपनी आवाज़ रिकॉर्ड करें।',
            'ऑडियो फ़ाइल अपलोड: कोई भी .wav, .mp3 फ़ाइल अपलोड करें।',
            '6 एआई वॉइस प्रोफाइल: साइबर एंड्रॉइड, मूवी ट्रेलर अनाउंसर, एनीमे हेरोइन, रोबोटिक वॉरियर, रेडियो ब्रॉडकास्टर।',
            'पिच शिफ्टिंग और टिम्बर ट्यूनिंग के साथ 320kbps MP3 डाउनलोड करें।',
          ],
          quickActionTab: 'voice_converter',
          quickActionLabel: 'वॉइस कनवर्टर खोलें',
        },
      ],
    },
    {
      id: 'cross-modality',
      title: '11. इमेज से 3D और वीडियो निर्माण पाइपलाइन',
      badge: 'मल्टीमॉडल',
      summary: '2D फोटो से 3D मॉडल बनाएं और 3D मॉडल को सिनेमाई वीडियो में बदलें।',
      content: [
        {
          heading: 'इमेज टू 3D मॉडल रिकंस्ट्रक्शन',
          details: [
            '3D वेबजीएल स्टूडियो में "Image to 3D Model AI" टैब में उपलब्ध।',
            'किसी भी 2D कॉन्सेप्ट आर्ट या फोटो से पूरा 3D मेश बनाएं।',
            'ऑटो-रिगिंग: एनीमेशन के लिए 17-हड्डियों वाला कंकाल अपने आप तैयार होता है।',
          ],
          quickActionTab: '3d_engine',
          quickActionLabel: '3D स्टूडियो देखें',
        },
      ],
    },
    {
      id: 'office-suite',
      title: '12. एआई ऑफिस सुइट: डॉक्स, पीपीटी और एक्सेल स्प्रेडशीट',
      badge: 'ऑफिस',
      summary: 'वर्ड डॉक्यूमेंट, मल्टी-स्लाइड प्रेजेंटेशन और गणितीय फॉर्मूलों वाली एक्सेल शीट।',
      content: [
        {
          heading: 'डॉक्स और वर्ड स्टूडियो (.doc / .txt)',
          details: [
            'शब्द गणना, वर्ण गणना और अनुमानित पढ़ने के समय के साथ पूर्ण टेक्स्ट एडिटर।',
            'तैयार टेम्पलेट्स: फिल्म प्रपोजल, लीगल कॉन्ट्रैक्ट्स, सिस्टम आर्किटेक्चर।',
            'माइक्रोसॉफ्ट वर्ड (.doc) या क्लीन टेक्स्ट (.txt) में 1-क्लिक डाउनलोड।',
          ],
          quickActionTab: 'office_suite',
          quickActionLabel: 'ऑफिस सुइट खोलें',
        },
        {
          heading: 'पीपीटी प्रेजेंटेशन और एक्सेल स्प्रेडशीट',
          details: [
            'फुल-स्क्रीन प्रेजेंटेशन मोड और स्लाइड डेक जनरेटर।',
            'एक्सेल शीट: =SUM और गणितीय फॉर्मूलों का स्वतः मूल्यांकन।',
            'माइक्रोसॉफ्ट एक्सेल और गूगल शीट्स के अनुकूल .CSV एक्सपोर्ट।',
          ],
        },
      ],
    },
    {
      id: 'design-identity',
      title: '13. डिज़ाइन सुइट: फेविकॉन, आईडी कार्ड, बिज़नेस कार्ड और रेज़्युमे',
      badge: 'ब्रांडिंग',
      summary: 'मल्टी-रेज़ोल्यूशन फेविकॉन, सिक्योरिटी आईडी बैज, लक्ज़री बिज़नेस कार्ड और एटीएस रेज़्युमे बिल्डर।',
      content: [
        {
          heading: 'फेविकॉन एवं ऐप आइकन स्टूडियो',
          details: [
            'सभी साइज़: 16x16, 32x32, 48x48, 64x64, 180x180 (Apple Touch Icon), और वेक्टर SVG।',
            'गूगल क्रोम और सफारी टैब का लाइव प्रीव्यू।',
            'तैयार <link rel="icon"> कोड 1-क्लिक में कॉपी करें।',
          ],
          quickActionTab: 'design_studio',
          quickActionLabel: 'डिज़ाइन स्टूडियो खोलें',
        },
        {
          heading: 'आईडी कार्ड, बिज़नेस कार्ड और रेज़्युमे',
          details: [
            'होलोग्राफिक स्ट्राइप और बारकोड के साथ प्रिंट-रेडी आईडी कार्ड।',
            'क्यूआर कोड और 3D फ्लिपिंग के साथ आधुनिक बिज़नेस कार्ड।',
            'एटीएस-अनुकूल आधुनिक रेज़्युमे बिल्डर जिसे सीधे PDF में प्रिंट कर सकते हैं।',
          ],
        },
      ],
    },
  ],
};

// Helper: Get language-specific manual package (falls back cleanly)
export function getManualPackage(langCode: string): ManualLanguagePackage {
  if (langCode === 'hi') return MANUAL_HI;
  // For other languages, we return English as baseline but localized headers where available
  return MANUAL_EN;
}

// Generate formatted downloadable text for any language
export function generateManualText(pkg: ManualLanguagePackage): string {
  let text = `# ${pkg.manualTitle}\n\n`;
  text += `${pkg.manualSubtitle}\n\n`;
  text += `========================================================\n\n`;

  pkg.sections.forEach((sec) => {
    text += `## ${sec.title} [${sec.badge}]\n`;
    text += `${sec.summary}\n\n`;
    sec.content.forEach((c) => {
      text += `### ${c.heading}\n`;
      c.details.forEach((d) => (text += `• ${d}\n`));
      if (c.proTips && c.proTips.length > 0) {
        text += `\n${pkg.proTipsTitle}:\n`;
        c.proTips.forEach((pt) => (text += `  > ${pt}\n`));
      }
      if (c.keyboardShortcuts && c.keyboardShortcuts.length > 0) {
        text += `\n${pkg.hotkeysTitle}:\n`;
        c.keyboardShortcuts.forEach((sc) => (text += `  * [${sc.key}]: ${sc.desc}\n`));
      }
      text += `\n`;
    });
    text += `--------------------------------------------------------\n\n`;
  });

  return text;
}

// Generate clean, printable HTML document for saving as PDF or printing
export function generateManualHtml(pkg: ManualLanguagePackage, langName: string): string {
  const sectionsHtml = pkg.sections
    .map(
      (sec) => `
      <section class="manual-section" style="margin-bottom: 32px; page-break-inside: avoid; border-bottom: 1px solid #e2e8f0; padding-bottom: 24px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0;">${sec.title}</h2>
          <span style="background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700;">${sec.badge}</span>
        </div>
        <p style="font-size: 13px; color: #64748b; margin-top: 4px; margin-bottom: 16px;">${sec.summary}</p>
        ${sec.content
          .map(
            (c) => `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 14px;">
            <h3 style="font-size: 15px; font-weight: 700; color: #0284c7; margin-top: 0; margin-bottom: 10px;">${c.heading}</h3>
            <ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 13px; line-height: 1.6;">
              ${c.details.map((d) => `<li style="margin-bottom: 6px;">${d}</li>`).join('')}
            </ul>
            ${
              c.proTips && c.proTips.length > 0
                ? `<div style="margin-top: 12px; background: #eef2ff; border-left: 3px solid #6366f1; padding: 10px 14px; border-radius: 6px; font-size: 12px; color: #312e81;">
                    <strong>💡 ${pkg.proTipsTitle}:</strong>
                    ${c.proTips.map((pt) => `<div style="margin-top: 4px;">• ${pt}</div>`).join('')}
                  </div>`
                : ''
            }
          </div>
        `
          )
          .join('')}
      </section>
    `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pkg.manualTitle} - ${langName}</title>
  <style>
    @media print {
      body { margin: 0; padding: 16px; background: #fff !important; color: #000 !important; }
      .no-print { display: none !important; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 40px 24px;
      max-width: 900px;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 24px; padding: 12px 18px; background: #f1f5f9; border-radius: 12px; display: flex; align-items: center; justify-content: space-between;">
    <span style="font-size: 13px; color: #475569; font-weight: 600;">Language: <strong>${langName}</strong></span>
    <button onclick="window.print()" style="background: #0284c7; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 13px;">
      🖨️ Print / Save as PDF
    </button>
  </div>

  <header style="margin-bottom: 36px; border-bottom: 2px solid #0f172a; padding-bottom: 20px;">
    <h1 style="font-size: 26px; font-weight: 900; color: #0f172a; margin: 0 0 10px 0;">${pkg.manualTitle}</h1>
    <p style="font-size: 14px; color: #475569; margin: 0; line-height: 1.6;">${pkg.manualSubtitle}</p>
  </header>

  <main>
    ${sectionsHtml}
  </main>

  <footer style="margin-top: 40px; pt-20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; padding-top: 20px;">
    ${pkg.manualTitle} • Generated for iCALLOG Studio Users
  </footer>
</body>
</html>`;
}

import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export async function generateMentorResponse(
  userQuery: string,
  history: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }>
): Promise<{ text: string; codeSnippet?: string }> {
  const client = getGeminiClient();

  if (client) {
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash'];
    for (const modelName of modelsToTry) {
      try {
        const response = await client.models.generateContent({
          model: modelName,
          contents: [
            ...history,
            { role: 'user', parts: [{ text: userQuery }] },
          ],
          config: {
            systemInstruction: `You are the iCALLOG AI Mentor, Studio Assistant & Creative Companion.
You specialize in 3D WebGL (Three.js), modern web development, shaders, prompt engineering, AI image & video generation pipelines, audio synthesis, gaming emotes, and full-stack software.
You fluently understand and respond in the language the user speaks, including Hindi, Hinglish, and English.
Format your responses clearly with Markdown. If providing code, use fenced code blocks with the language specified (e.g. \`\`\`javascript, \`\`\`glsl, \`\`\`typescript).
Be friendly, direct, helpful, and concise.`,
          },
        });

        const fullText = response.text || 'I have analyzed your request.';
        
        // Extract code snippet if present
        let codeSnippet: string | undefined = undefined;
        const codeMatch = fullText.match(/```(?:[a-zA-Z]+)?\n([\s\S]*?)```/);
        if (codeMatch && codeMatch[1]) {
          codeSnippet = codeMatch[1].trim();
        }

        return { text: fullText, codeSnippet };
      } catch (err) {
        console.warn(`Gemini model ${modelName} call failed, trying next fallback:`, err);
      }
    }
  }

  // Intelligent domain-specific and multilingual mentor engine fallback
  const queryLower = userQuery.toLowerCase().trim();

  // Hindi / Hinglish Greetings & Queries
  if (
    queryLower === 'hi' ||
    queryLower === 'hello' ||
    queryLower === 'hey' ||
    queryLower.includes('namaste') ||
    queryLower.includes('kya haal') ||
    queryLower.includes('kese ho') ||
    queryLower.includes('kaise ho')
  ) {
    return {
      text: `नमस्ते! मैं आपका **iCALLOG AI Studio Mentor** हूँ। 🙏✨

मैं आपकी इस स्टूडियो में किस प्रकार मदद कर सकता हूँ?
- 🎨 **8K Image & Video Generation**: प्रॉम्प्ट कैसे लिखें और अल्ट्रा-एचडी रेंडर कैसे करें।
- 🕹️ **3D WebGL & Auto-Rigging**: 3D कैरेक्टर, बोंस (Bones) और इमोट्स (Emotes)।
- 💎 **Tokens & Passbook**: टोकन बैलेंस, रिचार्ज और ट्रांजैक्शन हिस्ट्री।
- 🎵 **Voice & Audio Synthesis**: वॉइस क्लोनिंग और ऑडियो स्पेक्ट्रम।
- 🎬 **Film Studio**: हॉलीवुड स्टाइल स्क्रिप्ट और शॉट-लिस्ट जनरेशन।

आप कोई भी सवाल पूछ सकते हैं — चाहे हिंदी में हो या इंग्लिश में!`,
    };
  }

  // Tokens / Balance / Recharge queries
  if (
    queryLower.includes('token') ||
    queryLower.includes('balance') ||
    queryLower.includes('recharge') ||
    queryLower.includes('paise') ||
    queryLower.includes('passbook') ||
    queryLower.includes('transaction')
  ) {
    return {
      text: `### 💳 iCALLOG Tokens & Account Transactions System
- **Active Balance**: अपने प्रोफ़ाइल में या टॉप हेडर में आप अपना लाइव टोकन बैलेंस देख सकते हैं।
- **Recharge**: UPI QR Code या Instant Verify द्वारा आप ₹10 से लेकर ₹200+ तक का रिचार्ज कर सकते हैं।
- **Passbook / Ledger**: अपने **Profile Modal -> Transactions & Ledger** में जाकर अपनी सभी पुरानी लेन-देन, बिलिंग रसीदें (Receipts) और CSV/TXT स्टेटमेंट डाउनलोड कर सकते हैं।
- **Token Costs**:
  - Image Render: 2 से 25 टोकन्स (240p से 8K)
  - 3D Auto-Rig: 10 टोकन्स
  - Video Generation: 15 टोकन्स
  - AI Mentor Queries: 1 टोकन (VIP/Admin के लिए असीमित)`,
    };
  }

  if (queryLower.includes('three') || queryLower.includes('3d') || queryLower.includes('rig') || queryLower.includes('bone')) {
    return {
      text: `### iCALLOG Three.js Auto-Rigging & Skeletal Hierarchy
In Three.js, skeletal animation operates through a hierarchical tree of \`THREE.Bone\` nodes linked inside a \`THREE.Skeleton\` bound to a \`THREE.SkinnedMesh\`.

Key steps for rigging:
1. Construct bone joints: root -> spine -> neck -> head, plus clavicle -> shoulder -> arm -> hand.
2. Bind bone inverse matrices with \`skeleton.calculateInverses()\`.
3. Feed \`skinIndex\` and \`skinWeight\` buffer attributes into the vertex shader.
4. Execute emote animations by rotating bone quaternions per frame:`,
      codeSnippet: `// Three.js Skeletal Emote Animation Loop
function updateDanceEmote(bones, time, emoteType) {
  const speed = 2.5;
  if (emoteType === 'floss') {
    // Fortnite Floss side-to-side arm swinging
    const sway = Math.sin(time * speed) * 0.7;
    bones.spine.rotation.z = sway * 0.3;
    bones.leftArm.rotation.x = Math.sin(time * speed) * 0.9;
    bones.rightArm.rotation.x = -Math.sin(time * speed) * 0.9;
    bones.hips.position.x = Math.cos(time * speed) * 0.2;
  } else if (emoteType === 'hype_taunt') {
    // PUBG Style Winner Taunt
    bones.rightArm.rotation.z = Math.abs(Math.sin(time * speed)) * 1.5;
    bones.head.rotation.y = Math.sin(time * speed * 0.5) * 0.4;
  }
}`,
    };
  } else if (queryLower.includes('8k') || queryLower.includes('image') || queryLower.includes('render') || queryLower.includes('prompt')) {
    return {
      text: `### 8K Ultra-HD Generative AI Pipeline
For true 8K resolution (7680x4320), high-frequency details require a two-stage latent diffusion pass followed by Real-ESRGAN tile upscale:
1. **Base Latent Generation**: 1024x1024 base canvas with high guidance scale.
2. **Latent High-Res Fix**: Denoise step at 0.35 threshold with Euler-Ancestral scheduler.
3. **Contrast-Adaptive Sharpening**: Preserves micro-skin textures, emissive cyberpunk highlights, and depth-of-field bloom.`,
      codeSnippet: `// 8K Generation Parameter Preset
const preset8K = {
  width: 7680,
  height: 4320,
  steps: 50,
  cfgScale: 8.5,
  sampler: 'DPM++ 2M Karras',
  tiling: true,
  postProcessing: ['unsharp_mask', 'chromatic_aberration_subtle', 'color_grade_teal_orange']
};`,
    };
  }

  return {
    text: `नमस्ते! मैं आपका **iCALLOG AI Studio Assistant** हूँ। 

आपका सवाल: **"${userQuery}"**

यहाँ कुछ मुख्य टूल्स और उनके इस्तेमाल की जानकारी है:
- **3D Studio**: 3D मॉडल लोड करें, ऑटो-रिग करें और फोर्टनाइट/पबजी इमोट्स चलाएं।
- **8K Image / Video Studio**: टेक्स्ट लिखकर अल्ट्रा-क्वालिटी इमेजेस और वीडियो तैयार करें।
- **Script & Film Director**: अपनी फिल्म के लिए डायलॉग्स, सीन्स और कैमरा एंगल तैयार करें।
- **Transactions & Profile**: अपने मोबाइल नंबर, कांटेक्ट इन्फो और पूरे खाते का हिसाब देखें।

आप जिस भी विषय के बारे में पूछना चाहते हैं, कृपया विस्तार से बताएं!`,
  };
}

export async function enhancePrompt(prompt: string, type: 'image' | 'video'): Promise<string> {
  const client = getGeminiClient();
  if (client) {
    try {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Enhance this user prompt into a magnificent, hyper-detailed 8K ultra-realistic cinematic prompt for ${type} generation. Return ONLY the enhanced prompt string without explanations:\n\n"${prompt}"`,
      });
      return response.text?.trim() || prompt;
    } catch {
      // Fallback
    }
  }

  return `${prompt}, 8k resolution, ultra-photorealistic, volumetric cinematic lighting, octane render, Unreal Engine 5 aesthetic, hyper-detailed textures, 35mm lens, award-winning cinematography, pristine quality`;
}

export async function generateFilmScript(params: {
  title: string;
  genre: string;
  logline: string;
  characters: string;
  tone: string;
  sceneCount?: number;
}): Promise<{ screenplay: string; synopsis: string; characterBreakdown: string[] }> {
  const client = getGeminiClient();
  const prompt = `You are a master Hollywood Screenwriter & Script Consultant.
Write an authentic, industry-standard professional screenplay scene in Hollywood standard format (Courier-style formatting, SLUGLINE in caps, ACTION in present tense, CHARACTER NAME centered/uppercase, PARENTHETICALS, and DIALOGUE).

Film Title: ${params.title}
Genre: ${params.genre}
Logline: ${params.logline}
Characters: ${params.characters}
Tone: ${params.tone}
Scenes requested: ${params.sceneCount || 2}

Output format:
Provide:
1. LOGLINE & DRAMATIC THEMES
2. CHARACTER PROFILES
3. FULL FORMATTED SCREENPLAY SCENES (with EXT./INT. sluglines, sound effects in CAPS, and compelling dialogue).`;

  if (client) {
    try {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      const screenplay = response.text || '';
      return {
        screenplay,
        synopsis: params.logline,
        characterBreakdown: params.characters.split(',').map((c) => c.trim()),
      };
    } catch (e) {
      console.warn('Gemini script generation fallback:', e);
    }
  }

  // Fallback intelligent screenplay generator
  return {
    screenplay: `TITLE: ${params.title.toUpperCase()}
WRITTEN BY: iCALLOG AI Screenplay Engine
GENRE: ${params.genre}
TONE: ${params.tone}

=======================================================
LOGLINE:
${params.logline}
=======================================================

SCENE 1: EXT. NEO-METROPOLIS CITADEL - NIGHT [RAIN]

Drenching sheets of rain cascade across towering obsidian skyscrapers. Monolithic holographic advertisements flicker in cyan and magenta. 

A high-speed mag-lev train screeches past, casting strobing shadows over the lower industrial catwalks.

Emerging from the shadows is ARIA (30s), cybernetic trench coat soaked, an encrypted neural drive pulsing in her mechanical right hand.

ARIA
(whispering into comms)
Control, the perimeter is breached. The core cipher is live.

Static crackles through her earpiece. A deep synthetic voice cuts through the storm.

CYBER-CORE V18 (V.O.)
Proceed to sector 7. They already know you are inside the mainframe.

A sharp METALLIC CLICK echoes behind her. Two heavy tactical droids decloak from the mist, crimson optical visors locking onto her position.

ARIA
(smiles, unholstering plasma blade)
Then let us make sure they do not forget it.

ARIA DASHES forward as plasma fire illuminates the midnight sky--

CUT TO:

SCENE 2: INT. SUB-LEVEL VAULT - CONTINUOUS

Sparks rain down from ruptured conduit cables. The air is thick with ozone and ozone exhaust. 

Aria slides across the mirrored metallic floor, planting the drive into the central pedestal.

TERMINAL VOICE (A.I.)
Access Granted. Master protocol initialized.`,
    synopsis: params.logline,
    characterBreakdown: params.characters ? params.characters.split(',').map((c) => c.trim()) : ['Aria', 'Cyber-Core V18'],
  };
}

export async function generateFilmDirection(params: {
  script: string;
  directorStyle: string;
  aspectRatio: string;
  lightingStyle: string;
  colorPalette: string;
}): Promise<{
  shotList: Array<{
    shotNumber: number;
    shotType: string;
    cameraMovement: string;
    lens: string;
    description: string;
    audioCues: string;
    directorNotes: string;
  }>;
  visualMoodboard: string;
  lightingSetup: string;
  colorGradeLUT: string;
  soundDesignDirection: string;
}> {
  const client = getGeminiClient();
  const prompt = `You are an elite Hollywood Film Director and Cinematographer specializing in the style of ${params.directorStyle}.
Analyze the following script/scene and provide a comprehensive Director's Master Production Plan:

Aspect Ratio: ${params.aspectRatio}
Director Style: ${params.directorStyle}
Lighting Style: ${params.lightingStyle}
Color Palette: ${params.colorPalette}
Scene Text:
${params.script.slice(0, 1500)}

Please return a detailed JSON object with this exact structure:
{
  "visualMoodboard": "Detailed artistic vision and emotional beats",
  "lightingSetup": "Detailed lighting grid (Key light, Fill, Rim, Practical neons, Haze)",
  "colorGradeLUT": "Color grading recommendation (shadows, midtones, highlights, contrast curve)",
  "soundDesignDirection": "Sound design mix (Foley, sub-bass braams, synthetic atmospheres)",
  "shotList": [
    {
      "shotNumber": 1,
      "shotType": "Extreme Wide Shot (EWS) / Close Up (CU) / etc.",
      "cameraMovement": "Slow Dolly In / Steadicam Tracking / Whip Pan",
      "lens": "35mm Anamorphic T1.9 / 85mm Prime",
      "description": "Visual action in the frame",
      "audioCues": "Sound effects and score beat",
      "directorNotes": "Actor motivation, pacing, focal tension"
    }
  ]
}`;

  if (client) {
    try {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });
      const parsed = JSON.parse(response.text || '{}');
      if (parsed.shotList && Array.isArray(parsed.shotList)) {
        return parsed;
      }
    } catch (e) {
      console.warn('Gemini film direction fallback:', e);
    }
  }

  // Fallback production plan
  return {
    visualMoodboard: `Cinematic visual atmosphere inspired by ${params.directorStyle}. High compositional symmetry with deep negative space, tactile atmospheric haze, and intense emotional focal tension. Frame framed in ${params.aspectRatio}.`,
    lightingSetup: `Three-point high-contrast lighting: 1200W HMI soft key at 45 degrees, negative fill on the shadow side for high-ratio falloff, and strong tungsten/neon rim light highlighting rain droplets and metallic edges. Atmosphere loaded with mineral haze.`,
    colorGradeLUT: `Teal and Amber Split-Tone LUT: Deep crushed blacks with cool cyan midtones in the shadows, glowing warm amber highlights for skin tones and visor glows, calibrated for HDR10 wide color gamut.`,
    soundDesignDirection: `Immersion through low-frequency sub-bass drones (30Hz-45Hz), isolated spatial rain Foley, tactile metallic armor clinks, and sudden silence before high-intensity action hits.`,
    shotList: [
      {
        shotNumber: 1,
        shotType: 'Extreme Wide Shot (EWS)',
        cameraMovement: 'Slow Crane Downward Tracking with Rain Foreground',
        lens: '28mm Master Anamorphic T1.9',
        description: 'Establish the towering cyber-spires of the citadel. Rain slicing across the lens flare.',
        audioCues: 'Deep orchestral sub-bass swell, thunder clap in surround left.',
        directorNotes: 'Allow the frame to breathe for 4 seconds before the protagonist enters the silhouette.',
      },
      {
        shotNumber: 2,
        shotType: 'Medium Tracking Shot (MS)',
        cameraMovement: 'Steadicam tracking backward as character advances',
        lens: '40mm Prime Lens, Shallow Depth of Field (f/1.8)',
        description: 'Aria strides down the catwalk, moisture dripping from her collar. Neural drive glows cyan.',
        audioCues: 'Tactile heavy footsteps splashing on metal grate, rapid breathing.',
        directorNotes: 'Keep the camera locked onto Aria eye-line. Tension must rise with each step.',
      },
      {
        shotNumber: 3,
        shotType: 'Tight Close-Up (CU)',
        cameraMovement: 'Snap Push-In on weapon unholstering',
        lens: '85mm Macro Prime (f/1.4)',
        description: 'Plasma blade ignites with sudden violet energy bloom reflecting in her iris.',
        audioCues: 'High-frequency plasma hum slicing through the rain hiss.',
        directorNotes: 'Hold on her resolute gaze for half a beat before cutting to action.',
      },
      {
        shotNumber: 4,
        shotType: 'Dutch Angle Over-The-Shoulder (OTS)',
        cameraMovement: 'Whip pan to hostile tactical droids locking weapons',
        lens: '35mm Wide Anamorphic',
        description: 'Two massive armored droids materialize from steam, twin targeting lasers crossing the frame.',
        audioCues: 'Hydraulic lock-on chirp, industrial synthetic riser.',
        directorNotes: 'Heighten spatial disorientation with a 15-degree canted angle.',
      },
    ],
  };
}

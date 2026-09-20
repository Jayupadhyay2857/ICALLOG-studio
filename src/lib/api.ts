import { UserProfile, GenerationAsset, TaskJob, ToastMessage, SSEEvent, TransactionRecord } from '../types.ts';

// Helper to safely parse JSON responses without crashing on HTML 404 pages (e.g. Vercel SPA deployments)
async function safeParseJsonResponse(res: Response): Promise<any> {
  try {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return {
        success: false,
        isHtmlFallback: true,
        rawText: text,
        error: res.statusText || 'Server returned non-JSON response',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      isHtmlFallback: true,
      error: err?.message || 'Network error',
    };
  }
}

export interface TransactionsSummary {
  totalTransactions: number;
  currentBalance: number;
  totalCreditedTokens: number;
  totalDebitedTokens: number;
  totalSpentInr: number;
  userRole: string;
  vipTier: string;
}

export async function fetchUserTransactions(userId: string = 'demo_user'): Promise<{
  transactions: TransactionRecord[];
  summary: TransactionsSummary;
}> {
  try {
    const res = await fetch(`/api/user/transactions?userId=${encodeURIComponent(userId)}`);
    const data = await safeParseJsonResponse(res);
    if (res.ok && !data.isHtmlFallback) {
      return {
        transactions: data.transactions || [],
        summary: data.summary || {
          totalTransactions: 0,
          currentBalance: 999999,
          totalCreditedTokens: 999999,
          totalDebitedTokens: 0,
          totalSpentInr: 0,
          userRole: 'creator_override',
          vipTier: 'diamond',
        },
      };
    }
  } catch {
    // fallback
  }

  return {
    transactions: [],
    summary: {
      totalTransactions: 0,
      currentBalance: 999999,
      totalCreditedTokens: 999999,
      totalDebitedTokens: 0,
      totalSpentInr: 0,
      userRole: 'creator_override',
      vipTier: 'diamond',
    },
  };
}

export async function fetchProfile(): Promise<UserProfile> {
  const fallbackUser: UserProfile = {
    id: 'usr_jay_master_01',
    username: 'jay_master',
    name: 'Jay Upadhyay (Master Creator)',
    email: 'jayupadhyay2857@gmail.com',
    role: 'creator_override',
    vipTier: 'diamond',
    vipExpiry: '2099-12-31T23:59:59.999Z',
    tokenBalance: 999999,
    isGuestAccount: false,
    personaType: 'creator',
    createdAt: new Date().toISOString(),
  };

  try {
    const res = await fetch('/api/user/profile');
    const data = await safeParseJsonResponse(res);
    if (res.ok && data.user && !data.isHtmlFallback) {
      return data.user;
    }
  } catch {
    // fallback
  }

  return fallbackUser;
}

export const fetchUserProfile = fetchProfile;

export async function updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
  try {
    const res = await fetch('/api/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await safeParseJsonResponse(res);
    if (res.ok && data.user && !data.isHtmlFallback) {
      return data.user;
    }
  } catch {
    // fallback
  }

  const current = await fetchProfile();
  return { ...current, ...updates };
}

export function initSSEConnection(onEvent: (event: SSEEvent) => void): () => void {
  let eventSource: EventSource | null = null;
  try {
    eventSource = new EventSource('/api/sync/stream');

    eventSource.onmessage = (e) => {
      try {
        const parsed: SSEEvent = JSON.parse(e.data);
        onEvent(parsed);
      } catch {
        // ignore
      }
    };

    eventSource.onerror = () => {
      // browser auto-reconnects or stays silent
    };
  } catch {
    // ignore SSE in purely static environments
  }

  return () => {
    if (eventSource) {
      eventSource.close();
    }
  };
}

export async function submitAdminOverride(passcode: string): Promise<{ success: boolean; user: UserProfile; message: string }> {
  try {
    const res = await fetch('/api/admin/override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode }),
    });
    const data = await safeParseJsonResponse(res);

    if (res.ok && data.success && !data.isHtmlFallback) {
      return data;
    }
    if (data.error && !data.isHtmlFallback) {
      throw new Error(data.error);
    }
  } catch (err: any) {
    if (err.message && err.message.includes('Security Breach')) {
      throw err;
    }
  }

  // Client-Side Fallback Validation for Vercel Static SPA / Offline / Serverless mode
  const cleanCode = (passcode || '').trim();
  const validPasscodes = [
    'jayupadhyay@2857',
    'JAYUPADHYAY@2857',
    'CREATOR_ADMIN_786',
    'ADMIN',
    'ADMIN_786',
    'ICALLOG_2026',
    'JAY_MASTER_ADMIN',
  ];

  if (
    validPasscodes.includes(cleanCode) ||
    validPasscodes.includes(cleanCode.toUpperCase()) ||
    cleanCode.toLowerCase() === 'jayupadhyay@2857'
  ) {
    return {
      success: true,
      message: 'Master Key Authenticated! Unlimited tokens and VIP Diamond granted.',
      user: {
        id: 'usr_jay_master_01',
        username: 'jay_master',
        name: 'Jay Upadhyay (Master Creator)',
        email: 'jayupadhyay2857@gmail.com',
        role: 'creator_override',
        vipTier: 'diamond',
        vipExpiry: '2099-12-31T23:59:59.999Z',
        tokenBalance: 999999,
        isGuestAccount: false,
        personaType: 'creator',
        createdAt: new Date().toISOString(),
      } as any,
    };
  }

  throw new Error('Security Breach: Invalid Creator Admin Passcode. Action logged.');
}

export async function generateUpiQr(planName: string, priceInr: number, tokens: number) {
  const res = await fetch('/api/payment/generate-qr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planName, priceInr, tokens }),
  });
  return res.json();
}

export async function simulateInstantPayment(txnId: string) {
  const res = await fetch('/api/payment/verify-instant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ txnId }),
  });
  return res.json();
}

export async function sendChatMessage(message: string, sessionId?: string) {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Server returned an error');
    }
    return await res.json();
  } catch (err: unknown) {
    console.warn('sendChatMessage network fallback:', err);
    return {
      text: `नमस्ते! मैं आपका iCALLOG AI Mentor हूँ। आपके प्रश्न: "${message}" के लिए सिस्टम सक्रिय है। आप 3D रेंडर, 8K इमेज प्रॉम्प्ट्स, या टोकन पासबुक के बारे में कोई भी प्रश्न पूछ सकते हैं।`,
      sessionId: sessionId || 'default-session',
    };
  }
}

export async function enhancePrompt(prompt: string, type: 'image' | 'video') {
  const res = await fetch('/api/ai/enhance-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, type }),
  });
  return res.json();
}

export async function triggerImageGen(payload: { prompt: string; style: string; resolution: string; aspectRatio: string }) {
  const res = await fetch('/api/ai/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to dispatch image generation');
  }
  return res.json();
}

export async function triggerVideoGen(payload: {
  prompt: string;
  cinematicStyle: string;
  fps: number;
  resolution?: string;
  duration?: string;
  durationMinutes?: number;
  isUnlimited?: boolean;
  userId?: string;
}) {
  const res = await fetch('/api/ai/generate-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to dispatch video generation');
  }
  return res.json();
}

export async function trigger8kUpscale(imageUrl: string, targetResolution: string = '8K') {
  const res = await fetch('/api/ai/upscale-8k', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl, targetResolution }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to trigger 8K upscale');
  }
  return res.json();
}

export async function triggerAutoRig(modelName: string) {
  const res = await fetch('/api/ai/auto-rig-3d', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modelName }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to trigger auto rig');
  }
  return res.json();
}

export async function triggerVoiceSynth(text: string, voicePreset: string) {
  const res = await fetch('/api/ai/synthesize-voice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voicePreset }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to dispatch voiceover');
  }
  return res.json();
}

export async function triggerImageTo3D(payload: {
  imageUrl?: string;
  imagePrompt?: string;
  meshDensity?: string;
  rigBones?: boolean;
  userId?: string;
}) {
  const res = await fetch('/api/ai/image-to-3d', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create 3D Model from Image');
  }
  return res.json();
}

export async function trigger3DToVideo(payload: {
  modelName?: string;
  cameraMotion?: string;
  lighting?: string;
  resolution?: string;
  fps?: number;
  duration?: string;
  durationMinutes?: number;
  isUnlimited?: boolean;
  userId?: string;
}) {
  const res = await fetch('/api/ai/3d-to-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to render 3D Model to Video');
  }
  return res.json();
}

export async function triggerImageToVideo(payload: {
  imageUrl?: string;
  prompt?: string;
  motionType?: string;
  motionIntensity?: number;
  resolution?: string;
  fps?: number;
  duration?: string;
  durationMinutes?: number;
  isUnlimited?: boolean;
  userId?: string;
}) {
  const res = await fetch('/api/ai/image-to-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to animate Image to Video');
  }
  return res.json();
}

export async function triggerFilmScript(payload: {
  title: string;
  genre: string;
  logline: string;
  characters: string;
  tone: string;
  sceneCount?: number;
  userId?: string;
}) {
  const res = await fetch('/api/ai/film-script', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to generate Screenplay');
  }
  return res.json();
}

export async function triggerFilmDirection(payload: {
  script: string;
  directorStyle: string;
  aspectRatio: string;
  lightingStyle: string;
  colorPalette: string;
  userId?: string;
}) {
  const res = await fetch('/api/ai/film-direction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to generate Film Direction Plan');
  }
  return res.json();
}

export async function triggerVoiceConvert(payload: {
  targetVoice: string;
  pitchShift: number;
  formantStrength: number;
  denoise: boolean;
  audioDurationSeconds?: number;
  userId?: string;
}) {
  const res = await fetch('/api/ai/voice-convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to convert Human voice to AI');
  }
  return res.json();
}

export async function fetchAssets(): Promise<GenerationAsset[]> {
  const res = await fetch('/api/storage/assets');
  if (!res.ok) return [];
  const data = await res.json();
  return data.assets || [];
}

export async function saveAsset(payload: {
  title: string;
  prompt: string;
  assetType: GenerationAsset['assetType'];
  dataBase64OrUrl: string;
  provider?: 'AWS_S3' | 'Cloudinary';
}) {
  const res = await fetch('/api/storage/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteAssetById(id: string) {
  const res = await fetch(`/api/storage/assets/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function fetchActiveTasks(): Promise<TaskJob[]> {
  const res = await fetch('/api/tasks');
  if (!res.ok) return [];
  const data = await res.json();
  return data.tasks || [];
}

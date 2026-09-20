/**
 * iCALLOG V18 Backend Types & Interfaces
 */

export type PersonaType =
  | 'teacher'
  | 'student'
  | 'professional'
  | 'creator'
  | 'general'
  | 'guest';

export interface SubProfile {
  id: string;
  name: string;
  personaType: PersonaType;
  title?: string;
  avatarUrl?: string;
  bio?: string;
  badgeLabel?: string;
  badgeColor?: string;
  isGuest?: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name?: string;
  username: string;
  avatarUrl?: string;
  language?: string;
  email: string;
  phone?: string;
  contactEmail?: string;
  countryCode?: string;
  whatsapp?: string;
  address?: string;
  role: 'user' | 'vip' | 'admin' | 'creator_override';
  personaType?: PersonaType;
  activeProfileId?: string;
  subProfiles?: SubProfile[];
  tokenBalance: number;
  vipTier: 'free' | 'bronze' | 'silver' | 'gold' | 'diamond';
  vipExpiry: string | null;
  isExplicitUnlocked?: boolean;
  explicitAccessMode?: 'free_creator' | 'vip_unlocked' | 'locked';
  createdAt: string;
}

export interface TransactionRecord {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  category: 'recharge' | 'bonus' | 'generation' | 'refund' | 'admin_grant' | 'welcome';
  amountRupees?: number;
  tokenAmount: number;
  balanceAfter?: number;
  description: string;
  referenceId: string;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod?: 'UPI_QR' | 'CARD' | 'SYSTEM' | 'ADMIN';
  timestamp: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface TaskJob {
  id: string;
  userId: string;
  taskType:
    | '3d_auto_rig'
    | 'image_to_3d'
    | '3d_to_video'
    | 'image_to_video'
    | '8k_image_render'
    | '8k_video_encode'
    | 'voice_synthesize'
    | 'voice_convert'
    | 'film_script'
    | 'film_direction';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progressPercent: number;
  payload: Record<string, unknown>;
  resultUrl?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface PaymentTransaction {
  txnId: string;
  userId: string;
  amountInr: number;
  tokensCredited: number;
  paymentMethod: 'UPI_QR' | 'GPay' | 'PhonePe' | 'Paytm' | 'Cards';
  status: 'pending' | 'completed' | 'failed';
  qrPayload: string;
  createdAt: string;
}

export interface GenerationAsset {
  id: string;
  userId: string;
  assetType:
    | '3d_model'
    | 'image_8k'
    | 'video_8k'
    | 'voice_audio'
    | 'meme'
    | 'fl_project'
    | 'screenplay'
    | 'shotlist'
    | 'voice_cloned';
  title: string;
  prompt: string;
  outputUrl: string;
  cloudProvider: 'AWS_S3' | 'Cloudinary' | 'Edge_Storage';
  fileSizeBytes: number;
  tokensSpent: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'model' | 'system';
  content: string;
  codeSnippet?: string;
  timestamp: string;
}

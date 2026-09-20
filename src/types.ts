export type ActiveTab =
  | 'welcome_blog'
  | 'role_dashboard'
  | 'pro_camera'
  | 'projects_hub'
  | '3d_engine'
  | 'image_studio'
  | 'video_audio'
  | 'film_studio'
  | 'media_mixer'
  | 'song_studio'
  | 'voice_converter'
  | 'office_suite'
  | 'design_studio'
  | 'meme_gif_studio'
  | 'chat_mentor'
  | 'cloud_storage'
  | 'user_manual';

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  category: 'film' | 'music' | 'office' | 'design' | '3d' | 'video' | 'general';
  isPinned: boolean;
  activeTool: ActiveTab;
  subTool?: string;
  content?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

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
  username: string;
  name?: string;
  email: string;
  phone?: string;
  contactEmail?: string;
  countryCode?: string;
  whatsapp?: string;
  address?: string;
  role: 'user' | 'vip' | 'admin' | 'creator_override';
  personaType?: PersonaType;
  isGuestAccount?: boolean;
  activeProfileId?: string;
  subProfiles?: SubProfile[];
  tokenBalance: number;
  vipTier: 'free' | 'bronze' | 'silver' | 'gold' | 'diamond';
  vipExpiry: string | null;
  avatarUrl?: string;
  language?: string;
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

export interface SSEEvent {
  type: 'TOKEN_UPDATE' | 'TASK_UPDATE' | 'PAYMENT_CONFIRMED' | 'HEARTBEAT';
  data: Record<string, unknown>;
  timestamp: string;
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
  role: 'user' | 'model';
  content: string;
  codeSnippet?: string;
  timestamp: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'admin';
}

export type CameraCaptureMode = 'photo' | 'video' | 'audio' | 'burst';
export type CameraAspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '21:9';
export type CameraLutFilter =
  | 'normal'
  | 'hdr_cinema'
  | 'cyber_neon'
  | 'vivid'
  | 'warm_vintage'
  | 'noir_bw'
  | 'golden_hour'
  | 'cold_glacier'
  | 'dramatic_contrast';

export interface CameraMediaItem {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  blob?: Blob;
  thumbnailUrl?: string;
  title: string;
  timestamp: string;
  resolution?: string;
  durationSec?: number;
  fileSizeBytes?: number;
  filterUsed?: CameraLutFilter;
  zoomLevel?: number;
  rotation?: number;
  mirrored?: boolean;
}

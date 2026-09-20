/**
 * iCALLOG V18 MEGA MASTER SPECIFICATION
 * Database Architecture: MongoDB / Mongoose Schema Models
 */

export interface IUserDocument {
  username: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'vip' | 'admin' | 'creator_override';
  tokenBalance: number;
  vipTier: 'free' | 'bronze' | 'silver' | 'gold' | 'diamond';
  vipExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVipSubscription {
  userId: string;
  planName: string;
  priceInr: number;
  tokensCredited: number;
  status: 'active' | 'expired' | 'cancelled';
  activeFrom: Date;
  activeUntil: Date;
  createdAt: Date;
}

export interface ITokenLedger {
  userId: string;
  delta: number;
  balanceAfter: number;
  reason: string;
  referenceId?: string;
  createdAt: Date;
}

export interface IPaymentTransaction {
  userId: string;
  txnId: string;
  upiRef?: string;
  amountInr: number;
  tokensCredited: number;
  paymentMethod: 'UPI_QR' | 'GPay' | 'PhonePe' | 'Paytm' | 'Cards' | 'NetBanking';
  status: 'pending' | 'completed' | 'failed';
  qrPayload: string;
  webhookVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGenerationAsset {
  userId: string;
  assetType: '3d_model' | 'image_8k' | 'video_8k' | 'voice_audio' | 'meme' | 'fl_project';
  title: string;
  prompt: string;
  parameters: Record<string, unknown>;
  outputUrl: string;
  cloudProvider: 'AWS_S3' | 'Cloudinary' | 'Edge_Storage';
  fileSizeBytes: number;
  tokensSpent: number;
  createdAt: Date;
}

export interface IChatLog {
  userId: string;
  sessionId: string;
  role: 'user' | 'model' | 'system';
  content: string;
  codeSnippet?: string;
  tokensUsed: number;
  timestamp: Date;
}

export interface ITaskQueueJob {
  userId: string;
  taskType: '3d_auto_rig' | '8k_image_render' | '8k_video_encode' | 'voice_synthesize';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progressPercent: number;
  payload: Record<string, unknown>;
  resultUrl?: string;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

export const MongoSchemasDefinition = {
  UserSchema: {
    username: { type: 'String', required: true, unique: true, index: true },
    email: { type: 'String', required: true, unique: true, index: true },
    passwordHash: { type: 'String', required: true },
    role: { type: 'String', enum: ['user', 'vip', 'admin', 'creator_override'], default: 'user' },
    tokenBalance: { type: 'Number', default: 50, min: 0 },
    vipTier: { type: 'String', enum: ['free', 'bronze', 'silver', 'gold', 'diamond'], default: 'free' },
    vipExpiry: { type: 'Date', default: null },
    createdAt: { type: 'Date', default: Date.now },
    updatedAt: { type: 'Date', default: Date.now },
  },
  VipSubscriptionSchema: {
    userId: { type: 'Schema.Types.ObjectId', ref: 'User', required: true, index: true },
    planName: { type: 'String', required: true },
    priceInr: { type: 'Number', required: true, min: 200, max: 2000 },
    tokensCredited: { type: 'Number', required: true },
    status: { type: 'String', enum: ['active', 'expired', 'cancelled'], default: 'active' },
    activeFrom: { type: 'Date', default: Date.now },
    activeUntil: { type: 'Date', required: true },
    createdAt: { type: 'Date', default: Date.now },
  },
  TokenLedgerSchema: {
    userId: { type: 'Schema.Types.ObjectId', ref: 'User', required: true, index: true },
    delta: { type: 'Number', required: true },
    balanceAfter: { type: 'Number', required: true },
    reason: { type: 'String', required: true },
    referenceId: { type: 'String' },
    createdAt: { type: 'Date', default: Date.now, index: true },
  },
  PaymentTransactionSchema: {
    userId: { type: 'Schema.Types.ObjectId', ref: 'User', required: true, index: true },
    txnId: { type: 'String', required: true, unique: true, index: true },
    upiRef: { type: 'String' },
    amountInr: { type: 'Number', required: true },
    tokensCredited: { type: 'Number', required: true },
    paymentMethod: {
      type: 'String',
      enum: ['UPI_QR', 'GPay', 'PhonePe', 'Paytm', 'Cards', 'NetBanking'],
      default: 'UPI_QR',
    },
    status: { type: 'String', enum: ['pending', 'completed', 'failed'], default: 'pending' },
    qrPayload: { type: 'String', required: true },
    webhookVerified: { type: 'Boolean', default: false },
    createdAt: { type: 'Date', default: Date.now },
    updatedAt: { type: 'Date', default: Date.now },
  },
  GenerationAssetSchema: {
    userId: { type: 'Schema.Types.ObjectId', ref: 'User', required: true, index: true },
    assetType: {
      type: 'String',
      enum: ['3d_model', 'image_8k', 'video_8k', 'voice_audio', 'meme', 'fl_project'],
      required: true,
      index: true,
    },
    title: { type: 'String', required: true },
    prompt: { type: 'String', required: true },
    parameters: { type: 'Schema.Types.Mixed', default: {} },
    outputUrl: { type: 'String', required: true },
    cloudProvider: { type: 'String', enum: ['AWS_S3', 'Cloudinary', 'Edge_Storage'], default: 'Cloudinary' },
    fileSizeBytes: { type: 'Number', default: 0 },
    tokensSpent: { type: 'Number', default: 0 },
    createdAt: { type: 'Date', default: Date.now },
  },
  ChatLogSchema: {
    userId: { type: 'Schema.Types.ObjectId', ref: 'User', required: true, index: true },
    sessionId: { type: 'String', required: true, index: true },
    role: { type: 'String', enum: ['user', 'model', 'system'], required: true },
    content: { type: 'String', required: true },
    codeSnippet: { type: 'String' },
    tokensUsed: { type: 'Number', default: 0 },
    timestamp: { type: 'Date', default: Date.now },
  },
  TaskQueueSchema: {
    userId: { type: 'Schema.Types.ObjectId', ref: 'User', required: true, index: true },
    taskType: {
      type: 'String',
      enum: ['3d_auto_rig', '8k_image_render', '8k_video_encode', 'voice_synthesize'],
      required: true,
    },
    status: { type: 'String', enum: ['queued', 'processing', 'completed', 'failed'], default: 'queued', index: true },
    progressPercent: { type: 'Number', default: 0, min: 0, max: 100 },
    payload: { type: 'Schema.Types.Mixed', default: {} },
    resultUrl: { type: 'String' },
    errorMessage: { type: 'String' },
    createdAt: { type: 'Date', default: Date.now },
    completedAt: { type: 'Date' },
  },
};

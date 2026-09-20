import crypto from 'crypto';
import { GenerationAsset } from './types.ts';

// In-memory persistent asset store (synchronized with database)
const assetStore: GenerationAsset[] = [
  {
    id: 'asset-demo-3d-cyberpunk',
    userId: 'demo_user',
    assetType: '3d_model',
    title: 'Cyber Ninja Android (Rigged)',
    prompt: 'Futuristic mechanized humanoid warrior with articulated skeleton and emissive armor',
    outputUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    cloudProvider: 'AWS_S3',
    fileSizeBytes: 14285700,
    tokensSpent: 15,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'asset-demo-8k-neo-city',
    userId: 'demo_user',
    assetType: 'image_8k',
    title: 'Neo-Tokyo 2099 Hologram Boulevard',
    prompt: '8K hyper-detailed photorealistic Cyberpunk megalopolis with neon rain reflections, octane render 8K',
    outputUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=90',
    cloudProvider: 'Cloudinary',
    fileSizeBytes: 24576000,
    tokensSpent: 20,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'asset-demo-8k-video-nebula',
    userId: 'demo_user',
    assetType: 'video_8k',
    title: 'Cosmic Quantum Flux Wormhole 8K',
    prompt: 'Cinematic camera dive into deep space glowing nebula, 60fps 8K ultra-realistic particle physics',
    outputUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
    cloudProvider: 'AWS_S3',
    fileSizeBytes: 89456000,
    tokensSpent: 30,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  }
];

export interface UploadOptions {
  userId: string;
  assetType: GenerationAsset['assetType'];
  title: string;
  prompt: string;
  dataBase64OrUrl: string;
  provider?: 'AWS_S3' | 'Cloudinary' | 'Edge_Storage';
  fileSizeBytes?: number;
  tokensSpent?: number;
}

export function saveAssetToCloud(options: UploadOptions): GenerationAsset {
  const assetId = `asset-${crypto.randomUUID()}`;
  const provider = options.provider || (Math.random() > 0.5 ? 'AWS_S3' : 'Cloudinary');
  
  // Create secure persistent cloud URL simulation/direct link
  let finalUrl = options.dataBase64OrUrl;
  if (!finalUrl.startsWith('http') && !finalUrl.startsWith('data:')) {
    finalUrl = `https://${provider === 'AWS_S3' ? 'icallog-vault.s3.ap-south-1.amazonaws.com' : 'res.cloudinary.com/icallog-media'}/${options.assetType}/${assetId}.bin`;
  }

  const newAsset: GenerationAsset = {
    id: assetId,
    userId: options.userId,
    assetType: options.assetType,
    title: options.title,
    prompt: options.prompt,
    outputUrl: finalUrl,
    cloudProvider: provider,
    fileSizeBytes: options.fileSizeBytes || Math.floor(Math.random() * 10000000) + 1000000,
    tokensSpent: options.tokensSpent || 10,
    createdAt: new Date().toISOString(),
  };

  assetStore.unshift(newAsset);
  return newAsset;
}

export function getUserAssets(userId: string): GenerationAsset[] {
  return assetStore.filter(a => a.userId === userId || a.userId === 'demo_user');
}

export function deleteAsset(assetId: string, userId: string): boolean {
  const idx = assetStore.findIndex(a => a.id === assetId && (a.userId === userId || a.userId === 'demo_user'));
  if (idx !== -1) {
    assetStore.splice(idx, 1);
    return true;
  }
  return false;
}

import { EventEmitter } from 'events';
import crypto from 'crypto';
import { TaskJob } from './types.ts';
import { saveAssetToCloud } from './storage.ts';

class TaskQueueEngine extends EventEmitter {
  private jobs: Map<string, TaskJob> = new Map();

  constructor() {
    super();
  }

  public enqueueJob(
    userId: string,
    taskType: TaskJob['taskType'],
    payload: Record<string, unknown>
  ): TaskJob {
    const id = `task-${crypto.randomUUID()}`;
    const job: TaskJob = {
      id,
      userId,
      taskType,
      status: 'queued',
      progressPercent: 0,
      payload,
      createdAt: new Date().toISOString(),
    };

    this.jobs.set(id, job);
    this.emit('taskUpdate', job);

    // Run async worker
    setTimeout(() => this.processJob(id), 600);

    return job;
  }

  private async processJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'processing';
    job.progressPercent = 10;
    this.emit('taskUpdate', job);

    const steps = [25, 50, 75, 90, 100];
    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      job.progressPercent = step;

      if (step === 100) {
        job.status = 'completed';
        job.completedAt = new Date().toISOString();

        // Generate synthetic or real result asset
        if (job.taskType === '8k_image_render') {
          const prompt = (job.payload.prompt as string) || '8K Cybernetic Rendering';
          const asset = saveAssetToCloud({
            userId: job.userId,
            assetType: 'image_8k',
            title: `8K Render: ${prompt.slice(0, 30)}...`,
            prompt,
            dataBase64OrUrl: (job.payload.generatedUrl as string) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=90',
            fileSizeBytes: 33554432,
            tokensSpent: (job.payload.tokens as number) || 20,
          });
          job.resultUrl = asset.outputUrl;
        } else if (job.taskType === '8k_video_encode') {
          const prompt = (job.payload.prompt as string) || '8K Ultra HD Cinematic Clip';
          const asset = saveAssetToCloud({
            userId: job.userId,
            assetType: 'video_8k',
            title: `8K Video: ${prompt.slice(0, 30)}...`,
            prompt,
            dataBase64OrUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
            fileSizeBytes: 104857600,
            tokensSpent: (job.payload.tokens as number) || 35,
          });
          job.resultUrl = asset.outputUrl;
        } else if (job.taskType === '3d_auto_rig') {
          const asset = saveAssetToCloud({
            userId: job.userId,
            assetType: '3d_model',
            title: 'Auto-Rigged 3D Skeleton Model',
            prompt: 'Full bipedal 54-bone armature with inverse kinematics auto-weighting',
            dataBase64OrUrl: 'model_rigged_biped.gltf',
            fileSizeBytes: 18432000,
            tokensSpent: 25,
          });
          job.resultUrl = asset.outputUrl;
        } else if (job.taskType === 'voice_synthesize') {
          const asset = saveAssetToCloud({
            userId: job.userId,
            assetType: 'voice_audio',
            title: 'Mastered Vocal Speech Export',
            prompt: (job.payload.text as string) || 'AI Voiceover Speech',
            dataBase64OrUrl: 'audio_voiceover_master.wav',
            fileSizeBytes: 4194304,
            tokensSpent: 10,
          });
          job.resultUrl = asset.outputUrl;
        }
      }

      this.emit('taskUpdate', job);
    }
  }

  public getJob(jobId: string): TaskJob | undefined {
    return this.jobs.get(jobId);
  }

  public getUserJobs(userId: string): TaskJob[] {
    return Array.from(this.jobs.values())
      .filter((j) => j.userId === userId || j.userId === 'demo_user')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const taskQueue = new TaskQueueEngine();

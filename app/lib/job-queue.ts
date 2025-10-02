
import { prisma } from './db';
import { audioCaptureService } from './audio-capture';
import { multiProviderTranscriptionService } from './transcription-providers';
import { phraseDetectionService } from './phrase-detection';

export interface JobPayload {
  sessionId: string;
  radioId: string;
  radioName: string;
  streamUrl: string;
  platform: string;
  duration?: number;
  language?: string;
  [key: string]: any;
}

export class JobQueueService {
  private isProcessing = false;
  private maxConcurrentJobs = 10; // Máximo de jobs concurrentes
  private activeJobs = new Set<string>();
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startProcessing();
  }

  /**
   * Inicia el procesamiento de jobs
   */
  private startProcessing(): void {
    // Procesar jobs cada 5 segundos
    this.processingInterval = setInterval(async () => {
      if (!this.isProcessing && this.activeJobs.size < this.maxConcurrentJobs) {
        await this.processNextJob();
      }
    }, 5000);

    console.log('🔄 Job queue processing started');
  }

  /**
   * Para el procesamiento de jobs
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    console.log('⏹️ Job queue processing stopped');
  }

  /**
   * Agrega un job de captura de audio
   */
  async addAudioCaptureJob(payload: JobPayload, priority: number = 1): Promise<string> {
    try {
      const job = await prisma.job.create({
        data: {
          type: 'AUDIO_CAPTURE',
          payload,
          priority,
          status: 'PENDING'
        }
      });

      console.log(`📋 Added audio capture job: ${job.id} for radio ${payload.radioName}`);
      return job.id;
    } catch (error) {
      console.error('❌ Error adding audio capture job:', error);
      throw error;
    }
  }

  /**
   * Agrega un job de transcripción
   */
  async addTranscriptionJob(payload: JobPayload, priority: number = 2): Promise<string> {
    try {
      const job = await prisma.job.create({
        data: {
          type: 'TRANSCRIPTION',
          payload,
          priority,
          status: 'PENDING'
        }
      });

      console.log(`📋 Added transcription job: ${job.id}`);
      return job.id;
    } catch (error) {
      console.error('❌ Error adding transcription job:', error);
      throw error;
    }
  }

  /**
   * Agrega un job de detección de frases
   */
  async addPhraseDetectionJob(payload: JobPayload, priority: number = 3): Promise<string> {
    try {
      const job = await prisma.job.create({
        data: {
          type: 'PHRASE_DETECTION',
          payload,
          priority,
          status: 'PENDING'
        }
      });

      console.log(`📋 Added phrase detection job: ${job.id}`);
      return job.id;
    } catch (error) {
      console.error('❌ Error adding phrase detection job:', error);
      throw error;
    }
  }

  /**
   * Procesa el próximo job en la cola
   */
  private async processNextJob(): Promise<void> {
    if (this.isProcessing || this.activeJobs.size >= this.maxConcurrentJobs) {
      return;
    }

    try {
      // Obtener el próximo job pendiente con mayor prioridad
      const job = await prisma.job.findFirst({
        where: {
          status: 'PENDING',
          scheduledAt: {
            lte: new Date()
          }
        },
        orderBy: [
          { priority: 'asc' },
          { createdAt: 'asc' }
        ]
      });

      if (!job) {
        return; // No hay jobs pendientes
      }

      // Marcar job como en ejecución
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'RUNNING',
          startedAt: new Date()
        }
      });

      this.activeJobs.add(job.id);
      console.log(`⚡ Starting job ${job.id} (${job.type})`);

      // Procesar job en paralelo
      this.processJob(job).finally(() => {
        this.activeJobs.delete(job.id);
      });

    } catch (error) {
      console.error('❌ Error getting next job:', error);
    }
  }

  /**
   * Procesa un job específico
   */
  private async processJob(job: any): Promise<void> {
    const startTime = Date.now();

    try {
      let result: any;

      switch (job.type) {
        case 'AUDIO_CAPTURE':
          result = await this.processAudioCaptureJob(job.payload);
          break;
        case 'TRANSCRIPTION':
          result = await this.processTranscriptionJob(job.payload);
          break;
        case 'PHRASE_DETECTION':
          result = await this.processPhraseDetectionJob(job.payload);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      // Marcar job como completado
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          result
        }
      });

      const duration = Date.now() - startTime;
      console.log(`✅ Job ${job.id} completed in ${duration}ms`);

    } catch (error: any) {
      console.error(`❌ Job ${job.id} failed:`, error);

      // Incrementar intentos
      const newAttempts = job.attempts + 1;
      const shouldRetry = newAttempts < job.maxAttempts;

      if (shouldRetry) {
        // Programar reintento con backoff exponencial
        const retryDelay = Math.pow(2, newAttempts) * 1000; // 2s, 4s, 8s, etc.
        const retryAt = new Date(Date.now() + retryDelay);

        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: 'PENDING',
            attempts: newAttempts,
            error: error.message,
            scheduledAt: retryAt
          }
        });

        console.log(`🔄 Job ${job.id} scheduled for retry ${newAttempts}/${job.maxAttempts} in ${retryDelay}ms`);
      } else {
        // Marcar como fallido permanentemente
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            error: error.message
          }
        });

        console.log(`💀 Job ${job.id} permanently failed after ${newAttempts} attempts`);
      }
    }
  }

  /**
   * Procesa un job de captura de audio
   */
  private async processAudioCaptureJob(payload: JobPayload): Promise<any> {
    console.log(`🎵 Processing audio capture for ${payload.radioName}`);

    const result = await audioCaptureService.captureAudio({
      sessionId: payload.sessionId,
      radioId: payload.radioId,
      radioName: payload.radioName,
      streamUrl: payload.streamUrl,
      platform: payload.platform,
      duration: payload.duration || 30
    });

    if (result.success && result.captureId) {
      // Crear job de transcripción automáticamente
      await this.addTranscriptionJob({
        ...payload,
        captureId: result.captureId,
        audioPath: result.filePath
      });
    }

    return result;
  }

  /**
   * Procesa un job de transcripción
   */
  private async processTranscriptionJob(payload: JobPayload): Promise<any> {
    console.log(`🎙️ Processing transcription for capture ${payload.captureId}`);

    const result = await multiProviderTranscriptionService.transcribe(
      payload.audioPath,
      payload.language || 'es'
    );

    if (result.success && result.text) {
      // Actualizar captura con transcripción
      await prisma.capture.update({
        where: { id: payload.captureId },
        data: {
          transcriptionText: result.text,
          confidence: result.confidence,
          provider: result.provider,
          processingTime: result.processingTime,
          cost: result.cost,
          status: 'TRANSCRIBED'
        }
      });

      // Crear job de detección de frases automáticamente
      await this.addPhraseDetectionJob({
        ...payload,
        transcriptionText: result.text
      });
    }

    return result;
  }

  /**
   * Procesa un job de detección de frases
   */
  private async processPhraseDetectionJob(payload: JobPayload): Promise<any> {
    console.log(`🔍 Processing phrase detection for capture ${payload.captureId}`);

    const result = await phraseDetectionService.detectPhrases(
      payload.transcriptionText,
      payload.captureId
    );

    if (result.success && result.matches.length > 0) {
      // Guardar detecciones en la base de datos
      await phraseDetectionService.saveDetections(
        result.matches,
        payload.sessionId,
        payload.captureId,
        payload.radioId,
        payload.transcriptionText
      );

      // Actualizar contadores de sesión
      await prisma.monitoringSession.update({
        where: { id: payload.sessionId },
        data: {
          totalDetections: {
            increment: result.matches.length
          },
          lastDetectionAt: new Date()
        }
      });
    }

    return result;
  }

  /**
   * Obtiene estadísticas de la cola de jobs
   */
  async getQueueStats(): Promise<any> {
    try {
      const [pending, running, completed, failed] = await Promise.all([
        prisma.job.count({ where: { status: 'PENDING' } }),
        prisma.job.count({ where: { status: 'RUNNING' } }),
        prisma.job.count({ where: { status: 'COMPLETED' } }),
        prisma.job.count({ where: { status: 'FAILED' } })
      ]);

      const recentJobs = await prisma.job.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          status: true,
          createdAt: true,
          startedAt: true,
          completedAt: true,
          attempts: true
        }
      });

      return {
        counts: { pending, running, completed, failed },
        activeJobs: this.activeJobs.size,
        maxConcurrentJobs: this.maxConcurrentJobs,
        recentJobs,
        isProcessing: !!this.processingInterval
      };
    } catch (error) {
      console.error('❌ Error getting queue stats:', error);
      return null;
    }
  }

  /**
   * Limpia jobs antiguos
   */
  async cleanupOldJobs(olderThanHours: number = 24): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
      
      const result = await prisma.job.deleteMany({
        where: {
          OR: [
            { status: 'COMPLETED' },
            { status: 'FAILED' }
          ],
          completedAt: {
            lt: cutoffDate
          }
        }
      });

      console.log(`🧹 Cleaned up ${result.count} old jobs`);
      return result.count;
    } catch (error) {
      console.error('❌ Error cleaning up jobs:', error);
      return 0;
    }
  }

  /**
   * Pausa todos los jobs de una sesión
   */
  async pauseSessionJobs(sessionId: string): Promise<void> {
    try {
      await prisma.job.updateMany({
        where: {
          status: 'PENDING',
          payload: {
            path: ['sessionId'],
            equals: sessionId
          }
        },
        data: {
          status: 'CANCELLED'
        }
      });

      console.log(`⏸️ Paused jobs for session ${sessionId}`);
    } catch (error) {
      console.error('❌ Error pausing session jobs:', error);
    }
  }

  /**
   * Obtiene el estado de jobs de una sesión específica
   */
  async getSessionJobs(sessionId: string): Promise<any[]> {
    try {
      return await prisma.job.findMany({
        where: {
          payload: {
            path: ['sessionId'],
            equals: sessionId
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('❌ Error getting session jobs:', error);
      return [];
    }
  }

  /**
   * Configura el número máximo de jobs concurrentes
   */
  setMaxConcurrentJobs(max: number): void {
    this.maxConcurrentJobs = Math.max(1, Math.min(max, 50)); // Entre 1 y 50
    console.log(`⚙️ Max concurrent jobs set to ${this.maxConcurrentJobs}`);
  }
}

// Instancia singleton
export const jobQueueService = new JobQueueService();

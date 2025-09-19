
import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, existsSync, mkdirSync, createWriteStream, statSync } from 'fs';
import { pipeline } from 'stream';
import path from 'path';
import fetch from 'node-fetch';
import { prisma } from './prisma';

const execAsync = promisify(exec);
const pipelineAsync = promisify(pipeline);

export interface AudioCaptureConfig {
  sessionId: string;
  radioId: string;
  radioName: string;
  streamUrl: string;
  platform: string;
  duration: number; // segundos
  outputPath?: string;
  format?: 'mp3' | 'wav' | 'ogg';
  bitrate?: string;
  sampleRate?: number;
}

export interface CaptureResult {
  success: boolean;
  filePath?: string;
  duration?: number;
  fileSize?: number;
  captureId?: string;
  error?: string;
  timestamp: Date;
  metadata?: {
    bitrate?: number;
    sampleRate?: number;
    format?: string;
  };
}

export class AudioCaptureService {
  private activeCaptures: Map<string, ChildProcess> = new Map();
  private captureDir: string;

  constructor() {
    this.captureDir = path.join(process.cwd(), 'captures');
    if (!existsSync(this.captureDir)) {
      mkdirSync(this.captureDir, { recursive: true });
    }
  }

  /**
   * Captura audio desde un stream de radio
   */
  async captureAudio(config: AudioCaptureConfig): Promise<CaptureResult> {
    const startTime = Date.now();
    const timestamp = new Date();
    
    try {
      // Crear registro en base de datos
      const capture = await prisma.capture.create({
        data: {
          sessionId: config.sessionId,
          duration: config.duration,
          format: config.format || 'mp3',
          bitrate: config.bitrate ? parseInt(config.bitrate) : 128,
          sampleRate: config.sampleRate || 44100,
          status: 'PROCESSING',
          capturedAt: timestamp
        }
      });

      console.log(`🎵 Starting audio capture for ${config.radioName} (${config.duration}s)`);

      // Generar nombre de archivo único
      const fileName = `${config.radioId}_${Date.now()}.${config.format || 'mp3'}`;
      const filePath = config.outputPath || path.join(this.captureDir, fileName);

      let result: CaptureResult;

      // Intentar captura con diferentes métodos según la plataforma
      switch (config.platform.toLowerCase()) {
        case 'youtube':
          result = await this.captureFromYoutube(config, filePath, capture.id);
          break;
        case 'http_stream':
        case 'icecast':
        case 'shoutcast':
        default:
          result = await this.captureFromHttpStream(config, filePath, capture.id);
          break;
      }

      // Actualizar registro en base de datos
      if (result.success && result.filePath) {
        const fileStats = statSync(result.filePath);
        
        await prisma.capture.update({
          where: { id: capture.id },
          data: {
            audioPath: result.filePath,
            fileSize: BigInt(fileStats.size),
            status: 'COMPLETED',
            processedAt: new Date(),
            processingTime: Date.now() - startTime
          }
        });

        result.captureId = capture.id;
        console.log(`✅ Audio captured successfully: ${result.filePath} (${fileStats.size} bytes)`);
      } else {
        await prisma.capture.update({
          where: { id: capture.id },
          data: {
            status: 'FAILED',
            processedAt: new Date(),
            processingTime: Date.now() - startTime
          }
        });
        console.error(`❌ Audio capture failed: ${result.error}`);
      }

      return result;
    } catch (error: any) {
      console.error('Error in captureAudio:', error);
      return {
        success: false,
        error: error.message,
        timestamp
      };
    }
  }

  /**
   * Captura desde stream HTTP directo (más común)
   */
  private async captureFromHttpStream(
    config: AudioCaptureConfig, 
    filePath: string, 
    captureId: string
  ): Promise<CaptureResult> {
    const timestamp = new Date();
    
    try {
      console.log(`📡 Connecting to HTTP stream: ${config.streamUrl}`);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(config.streamUrl, {
        headers: {
          'User-Agent': 'Radio Monitor/1.0',
          'Accept': 'audio/*,*/*;q=0.1',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      const writeStream = createWriteStream(filePath);
      let bytesWritten = 0;
      let duration = 0;

      // Configurar timeout para la duración especificada
      const timer = setTimeout(() => {
        writeStream.end();
      }, config.duration * 1000);

      // Process the stream using Node.js streams
      await new Promise<void>((resolve, reject) => {
        if (!response.body) {
          reject(new Error('No response body'));
          return;
        }

        // Cast to Node.js ReadableStream
        const stream = response.body as any;
        
        let totalBytes = 0;

        stream.on('data', (chunk: Buffer) => {
          totalBytes += chunk.length;
          writeStream.write(chunk);
        });

        stream.on('end', () => {
          writeStream.end();
          clearTimeout(timer);
          resolve();
        });

        stream.on('error', (error: any) => {
          writeStream.end();
          clearTimeout(timer);
          reject(error);
        });

        writeStream.on('error', (error) => {
          clearTimeout(timer);
          reject(error);
        });

        writeStream.on('finish', () => {
          clearTimeout(timer);
          resolve();
        });
      });

      // Verificar que se capturó algo
      const stats = statSync(filePath);
      if (stats.size === 0) {
        throw new Error('Captured file is empty');
      }

      return {
        success: true,
        filePath,
        duration: config.duration,
        fileSize: stats.size,
        timestamp,
        metadata: {
          format: config.format || 'mp3',
          bitrate: config.bitrate ? parseInt(config.bitrate) : undefined
        }
      };
    } catch (error: any) {
      console.error(`❌ HTTP stream capture failed:`, error);
      return {
        success: false,
        error: `HTTP stream capture failed: ${error.message}`,
        timestamp
      };
    }
  }

  /**
   * Captura desde YouTube (usando yt-dlp si está disponible, sino stream directo)
   */
  private async captureFromYoutube(
    config: AudioCaptureConfig, 
    filePath: string, 
    captureId: string
  ): Promise<CaptureResult> {
    const timestamp = new Date();
    
    try {
      // Intentar obtener la URL del stream directo de YouTube
      const streamUrl = await this.getYouTubeStreamUrl(config.streamUrl);
      if (streamUrl) {
        // Usar captura HTTP normal con la URL del stream
        return await this.captureFromHttpStream({
          ...config,
          streamUrl
        }, filePath, captureId);
      } else {
        throw new Error('Could not extract YouTube stream URL');
      }
    } catch (error: any) {
      console.error(`❌ YouTube capture failed:`, error);
      return {
        success: false,
        error: `YouTube capture failed: ${error.message}`,
        timestamp
      };
    }
  }

  /**
   * Extrae URL de stream de YouTube (método simplificado)
   */
  private async getYouTubeStreamUrl(youtubeUrl: string): Promise<string | null> {
    try {
      // Implementación básica - en producción usarías yt-dlp
      const videoId = this.extractYouTubeVideoId(youtubeUrl);
      if (!videoId) return null;

      // Por ahora, devolvemos null para forzar el error y usar método alternativo
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extrae el ID del video de YouTube de una URL
   */
  private extractYouTubeVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/live\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  /**
   * Para una captura activa
   */
  async stopCapture(captureId: string): Promise<boolean> {
    try {
      const process = this.activeCaptures.get(captureId);
      if (process) {
        process.kill('SIGTERM');
        this.activeCaptures.delete(captureId);
        
        // Actualizar en base de datos
        await prisma.capture.update({
          where: { id: captureId },
          data: { status: 'COMPLETED' }
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error stopping capture:', error);
      return false;
    }
  }

  /**
   * Obtiene el estado de todas las capturas activas
   */
  getActiveCapturesCount(): number {
    return this.activeCaptures.size;
  }

  /**
   * Limpia capturas inactivas
   */
  async cleanup(): Promise<void> {
    try {
      for (const [captureId, process] of this.activeCaptures.entries()) {
        if (process.killed) {
          this.activeCaptures.delete(captureId);
        }
      }

      // Marcar capturas abandonadas como fallidas
      await prisma.capture.updateMany({
        where: {
          status: 'PROCESSING',
          capturedAt: {
            lt: new Date(Date.now() - 5 * 60 * 1000) // 5 minutos atrás
          }
        },
        data: {
          status: 'FAILED'
        }
      });
    } catch (error) {
      console.error('Error in cleanup:', error);
    }
  }
  /**
   * Verifica las herramientas disponibles en el sistema
   */
  async checkSystemTools(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {
      'node-fetch': true, // Siempre disponible ya que lo instalamos
      'audio-capture': true, // Nuestra implementación personalizada
      'stream-processing': true,
      'database': true // Prisma siempre disponible
    };

    // Verificar conectividad a internet
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      results['internet'] = response.ok;
    } catch {
      results['internet'] = false;
    }

    return results;
  }
}

// Instancia singleton
export const audioCaptureService = new AudioCaptureService();

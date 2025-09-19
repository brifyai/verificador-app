
import { audioCaptureService, AudioCaptureConfig, CaptureResult } from './audio-capture';
import { transcriptionService, AdvertisementAnalysis } from './transcription';
import { multiProviderTranscriptionService } from './transcription-providers';
import { phraseDetectionService } from './phrase-detection';
import { jobQueueService } from './job-queue';
import { prisma } from './prisma';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import path from 'path';

export interface MonitoringSession {
  id: string;
  radioId: string;
  radioName: string;
  streamUrl: string;
  platform: string;
  targetPhrases: string[];
  isActive: boolean;
  startTime: Date;
  captureInterval: number; // segundos entre capturas
  captureDuration: number; // duración de cada captura
  totalCaptures: number;
  advertisementsFound: number;
  lastCapture?: Date;
  lastAdvertisement?: Date;
}

export interface DetectionEvent {
  sessionId: string;
  radioName: string;
  timestamp: Date;
  transcription: string;
  analysis: AdvertisementAnalysis;
  audioFilePath?: string;
  confidence: number;
}

class MonitoringService {
  private activeSessions: Map<string, MonitoringSession> = new Map();
  private sessionIntervals: Map<string, NodeJS.Timeout> = new Map();
  private detectionEvents: DetectionEvent[] = [];
  private dataDir: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'monitoring-data');
    this.ensureDirectories();
    this.loadSessionsFromDatabase();
  }

  private ensureDirectories() {
    const dirs = [
      this.dataDir,
      path.join(this.dataDir, 'sessions'),
      path.join(this.dataDir, 'events'),
      path.join(process.cwd(), 'captures')
    ];

    dirs.forEach(dir => {
      if (!existsSync(dir)) {
        const fs = require('fs');
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Carga sesiones activas desde la base de datos
   */
  async loadSessionsFromDatabase(): Promise<void> {
    try {
      const sessions = await prisma.monitoringSession.findMany({
        where: {
          status: 'ACTIVE'
        },
        include: {
          radio: true,
          user: true
        }
      });

      for (const session of sessions) {
        const monitoringSession: MonitoringSession = {
          id: session.id,
          radioId: session.radioId,
          radioName: session.radio.name,
          streamUrl: session.radio.streamUrl,
          platform: session.radio.platform,
          targetPhrases: [], // Se cargan dinámicamente desde la tabla de frases
          isActive: session.status === 'ACTIVE',
          startTime: session.startTime,
          captureInterval: session.captureInterval,
          captureDuration: session.captureDuration,
          totalCaptures: session.totalCaptures,
          advertisementsFound: session.totalDetections,
          lastCapture: session.lastCaptureAt || undefined,
          lastAdvertisement: session.lastDetectionAt || undefined
        };

        this.activeSessions.set(session.id, monitoringSession);
        
        // Restaurar intervalos de captura
        if (session.status === 'ACTIVE') {
          this.scheduleCaptures(monitoringSession);
        }
      }

      console.log(`📡 Loaded ${sessions.length} active monitoring sessions from database`);
    } catch (error) {
      console.error('❌ Error loading sessions from database:', error);
    }
  }

  /**
   * Inicia el monitoreo de una radio
   */
  async startMonitoring(
    radioId: string, 
    userId: string, 
    captureInterval: number = 30, 
    captureDuration: number = 10
  ): Promise<string> {
    try {
      // Verificar si ya existe una sesión activa para esta radio
      const existingSession = await prisma.monitoringSession.findFirst({
        where: {
          radioId,
          status: 'ACTIVE'
        }
      });

      if (existingSession) {
        throw new Error(`Ya existe una sesión activa para esta radio: ${existingSession.id}`);
      }

      // Obtener información de la radio
      const radio = await prisma.radio.findUnique({
        where: { id: radioId }
      });

      if (!radio) {
        throw new Error(`Radio no encontrada: ${radioId}`);
      }

      // Crear sesión en la base de datos
      const session = await prisma.monitoringSession.create({
        data: {
          radioId,
          userId,
          status: 'ACTIVE',
          captureInterval,
          captureDuration,
          startTime: new Date(),
          configuration: {
            autoTranscribe: true,
            language: 'es',
            phraseDetection: true
          }
        }
      });

      // Crear sesión en memoria
      const monitoringSession: MonitoringSession = {
        id: session.id,
        radioId: radio.id,
        radioName: radio.name,
        streamUrl: radio.streamUrl,
        platform: radio.platform,
        targetPhrases: [], // Se cargan dinámicamente
        isActive: true,
        startTime: session.startTime,
        captureInterval,
        captureDuration,
        totalCaptures: 0,
        advertisementsFound: 0
      };

      this.activeSessions.set(session.id, monitoringSession);
      
      // Programar capturas automáticas
      this.scheduleCaptures(monitoringSession);

      console.log(`🎯 Started monitoring session ${session.id} for radio ${radio.name}`);
      return session.id;

    } catch (error: any) {
      console.error('❌ Error starting monitoring:', error);
      throw error;
    }
  }

  /**
   * Programa capturas automáticas para una sesión
   */
  private scheduleCaptures(session: MonitoringSession): void {
    // Limpiar intervalos existentes
    this.clearSessionInterval(session.id);

    // Crear nuevo intervalo
    const interval = setInterval(async () => {
      if (session.isActive) {
        await this.performCapture(session);
      }
    }, session.captureInterval * 1000);

    this.sessionIntervals.set(session.id, interval);
    console.log(`⏰ Scheduled captures for session ${session.id} every ${session.captureInterval}s`);
  }

  /**
   * Realiza una captura de audio y la procesa
   */
  private async performCapture(session: MonitoringSession): Promise<void> {
    try {
      console.log(`🎵 Performing capture for ${session.radioName}`);

      // Agregar job de captura de audio a la cola
      await jobQueueService.addAudioCaptureJob({
        sessionId: session.id,
        radioId: session.radioId,
        radioName: session.radioName,
        streamUrl: session.streamUrl,
        platform: session.platform,
        duration: session.captureDuration,
        language: 'es'
      }, 1); // Alta prioridad

      // Actualizar estadísticas de la sesión
      session.totalCaptures++;
      session.lastCapture = new Date();

      // Actualizar en base de datos
      await prisma.monitoringSession.update({
        where: { id: session.id },
        data: {
          totalCaptures: session.totalCaptures,
          lastCaptureAt: session.lastCapture
        }
      });

      console.log(`✅ Capture job queued for session ${session.id}`);

    } catch (error) {
      console.error(`❌ Error performing capture for session ${session.id}:`, error);
    }
  }

  /**
   * Para el monitoreo de una sesión
   */
  async stopMonitoring(sessionId: string): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Sesión no encontrada: ${sessionId}`);
      }

      // Marcar como inactiva
      session.isActive = false;
      this.clearSessionInterval(sessionId);

      // Cancelar jobs pendientes
      await jobQueueService.pauseSessionJobs(sessionId);

      // Actualizar en base de datos
      await prisma.monitoringSession.update({
        where: { id: sessionId },
        data: {
          status: 'STOPPED',
          endTime: new Date()
        }
      });

      // Remover de memoria
      this.activeSessions.delete(sessionId);

      console.log(`🛑 Stopped monitoring session ${sessionId}`);

    } catch (error: any) {
      console.error('❌ Error stopping monitoring:', error);
      throw error;
    }
  }

  /**
   * Pausa temporalmente una sesión
   */
  async pauseMonitoring(sessionId: string): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Sesión no encontrada: ${sessionId}`);
      }

      session.isActive = false;
      this.clearSessionInterval(sessionId);

      await prisma.monitoringSession.update({
        where: { id: sessionId },
        data: { status: 'PAUSED' }
      });

      console.log(`⏸️ Paused monitoring session ${sessionId}`);

    } catch (error: any) {
      console.error('❌ Error pausing monitoring:', error);
      throw error;
    }
  }

  /**
   * Reanuda una sesión pausada
   */
  async resumeMonitoring(sessionId: string): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Sesión no encontrada: ${sessionId}`);
      }

      session.isActive = true;
      this.scheduleCaptures(session);

      await prisma.monitoringSession.update({
        where: { id: sessionId },
        data: { status: 'ACTIVE' }
      });

      console.log(`▶️ Resumed monitoring session ${sessionId}`);

    } catch (error: any) {
      console.error('❌ Error resuming monitoring:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las sesiones activas
   */
  getActiveSessions(): MonitoringSession[] {
    return Array.from(this.activeSessions.values()).filter(s => s.isActive);
  }

  /**
   * Obtiene una sesión específica
   */
  getSession(sessionId: string): MonitoringSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Obtiene estadísticas del sistema de monitoreo
   */
  async getSystemStats(): Promise<any> {
    try {
      const activeSessions = this.getActiveSessions();
      const queueStats = await jobQueueService.getQueueStats();
      const phraseCount = phraseDetectionService.getActivePhraseCount();

      // Estadísticas de detecciones recientes
      const recentDetections = await prisma.detection.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: {
          phrase: true,
          radio: true
        }
      });

      // Estadísticas de transcripción
      const transcriptionStats = multiProviderTranscriptionService.getProviderStats();

      return {
        activeSessions: activeSessions.length,
        totalCaptures: activeSessions.reduce((sum, s) => sum + s.totalCaptures, 0),
        totalDetections: activeSessions.reduce((sum, s) => sum + s.advertisementsFound, 0),
        activePhrases: phraseCount,
        queueStats,
        transcriptionProviders: transcriptionStats,
        recentDetections: recentDetections.map(d => ({
          id: d.id,
          radioName: d.radio.name,
          phrase: d.phrase.phrase,
          brand: d.phrase.brand,
          confidence: d.confidence,
          timestamp: d.timestamp
        })),
        systemStatus: 'operational'
      };
    } catch (error) {
      console.error('❌ Error getting system stats:', error);
      return {
        activeSessions: this.activeSessions.size,
        totalCaptures: 0,
        totalDetections: 0,
        activePhrases: 0,
        systemStatus: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Obtiene detecciones recientes
   */
  async getRecentDetections(limit: number = 50): Promise<any[]> {
    try {
      const detections = await prisma.detection.findMany({
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          phrase: true,
          radio: true,
          session: {
            include: {
              user: true
            }
          }
        }
      });

      return detections.map(d => ({
        id: d.id,
        sessionId: d.sessionId,
        radioName: d.radio.name,
        phrase: d.phrase.phrase,
        brand: d.phrase.brand,
        campaign: d.phrase.campaign,
        detectedText: d.detectedText,
        confidence: d.confidence,
        similarity: d.similarity,
        timestamp: d.timestamp,
        cost: d.cost,
        verified: d.verified,
        user: d.session.user.name
      }));
    } catch (error) {
      console.error('❌ Error getting recent detections:', error);
      return [];
    }
  }

  /**
   * Limpia intervalos de una sesión
   */
  private clearSessionInterval(sessionId: string): void {
    const interval = this.sessionIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.sessionIntervals.delete(sessionId);
    }
  }

  /**
   * Limpia todas las sesiones y para el monitoreo
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up monitoring service...');

    // Parar todas las sesiones
    const sessionIds = Array.from(this.activeSessions.keys());
    for (const sessionId of sessionIds) {
      try {
        await this.stopMonitoring(sessionId);
      } catch (error) {
        console.error(`Error stopping session ${sessionId}:`, error);
      }
    }

    // Limpiar intervalos
    for (const [sessionId, interval] of this.sessionIntervals.entries()) {
      clearInterval(interval);
    }
    this.sessionIntervals.clear();

    // Parar procesamiento de jobs
    jobQueueService.stopProcessing();

    console.log('✅ Monitoring service cleanup completed');
  }

  /**
   * Verifica el estado de las herramientas del sistema
   */
  async checkSystemHealth(): Promise<any> {
    try {
      const audioTools = await audioCaptureService.checkSystemTools();
      const queueStats = await jobQueueService.getQueueStats();
      
      // Verificar proveedores de transcripción
      await multiProviderTranscriptionService.reloadConfiguration();
      const transcriptionProviders = multiProviderTranscriptionService.getProviderStats();
      
      // Verificar frases activas
      await phraseDetectionService.reloadPhrases();
      const activePhrases = phraseDetectionService.getActivePhraseCount();

      const enabledProviders = Object.values(transcriptionProviders).filter((p: any) => p.enabled && p.hasApiKey).length;

      return {
        audioCapture: audioTools,
        transcriptionProviders: {
          total: Object.keys(transcriptionProviders).length,
          enabled: enabledProviders,
          providers: transcriptionProviders
        },
        phraseDetection: {
          activePhrases,
          status: activePhrases > 0 ? 'ready' : 'no_phrases'
        },
        jobQueue: queueStats,
        systemReady: enabledProviders > 0 && activePhrases > 0,
        lastCheck: new Date()
      };
    } catch (error) {
      console.error('❌ Error checking system health:', error);
      return {
        systemReady: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date()
      };
    }
  }
}

// Instancia singleton
export const monitoringService = new MonitoringService();

// Cleanup automático al terminar el proceso
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, cleaning up...');
  await monitoringService.cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, cleaning up...');
  await monitoringService.cleanup();
  process.exit(0);
});


import { audioCaptureService, AudioCaptureConfig, CaptureResult } from './audio-capture';
import { transcriptionService, AdvertisementAnalysis } from './transcription';
import { multiProviderTranscriptionService } from './transcription-providers';
import { phraseDetectionService } from './phrase-detection';
import { jobQueueService } from './job-queue';
import { supabaseDirect } from './supabase-direct';
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
      // Obtener sesiones activas desde Supabase Direct
      const sessions = await supabaseDirect.request('monitoring_sessions?select=*&status=eq.ACTIVE');
      
      // Obtener radios relacionadas
      const radioIds = [...new Set(sessions.map((s: any) => s.radio_id).filter(Boolean))];
      const radios = radioIds.length > 0
        ? await supabaseDirect.request(`radios?id=in.(${radioIds.join(',')})`)
        : [];

      for (const session of sessions) {
        const radio = radios.find((r: any) => r.id === session.radio_id);
        
        if (!radio) {
          console.warn(`⚠️ Radio no encontrada para sesión ${session.id}`);
          continue;
        }

        const monitoringSession: MonitoringSession = {
          id: session.id,
          radioId: session.radio_id,
          radioName: radio.name,
          streamUrl: radio.stream_url,
          platform: radio.platform,
          targetPhrases: [], // Se cargan dinámicamente desde la tabla de frases
          isActive: session.status === 'ACTIVE',
          startTime: new Date(session.start_time),
          captureInterval: session.capture_interval,
          captureDuration: session.capture_duration,
          totalCaptures: session.total_captures || 0,
          advertisementsFound: session.total_detections || 0,
          lastCapture: session.last_capture_at ? new Date(session.last_capture_at) : undefined,
          lastAdvertisement: session.last_detection_at ? new Date(session.last_detection_at) : undefined
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
      const existingSessions = await supabaseDirect.request(
        `monitoring_sessions?select=*&radio_id=eq.${radioId}&status=eq.ACTIVE`
      );

      if (existingSessions.length > 0) {
        throw new Error(`Ya existe una sesión activa para esta radio: ${existingSessions[0].id}`);
      }

      // Obtener información de la radio
      const radios = await supabaseDirect.request(`radios?id=eq.${radioId}`);
      const radio = radios[0];

      if (!radio) {
        throw new Error(`Radio no encontrada: ${radioId}`);
      }

      // Crear sesión en la base de datos
      const sessionData = {
        radio_id: radioId,
        user_id: userId,
        status: 'ACTIVE',
        capture_interval: captureInterval,
        capture_duration: captureDuration,
        start_time: new Date().toISOString(),
        configuration: {
          autoTranscribe: true,
          language: 'es',
          phraseDetection: true
        },
        total_captures: 0,
        total_detections: 0
      };

      const session = await supabaseDirect.request('monitoring_sessions', {
        method: 'POST',
        body: JSON.stringify(sessionData)
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
      await supabaseDirect.request(`monitoring_sessions?id=eq.${session.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          total_captures: session.totalCaptures,
          last_capture_at: session.lastCapture?.toISOString()
        })
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
      await supabaseDirect.request(`monitoring_sessions?id=eq.${sessionId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'STOPPED',
          end_time: new Date().toISOString()
        })
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

      await supabaseDirect.request(`monitoring_sessions?id=eq.${sessionId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'PAUSED'
        })
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

      await supabaseDirect.request(`monitoring_sessions?id=eq.${sessionId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'ACTIVE'
        })
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
      const recentDetectionsRaw = await supabaseDirect.request(
        'detections?select=*&order=timestamp.desc&limit=10'
      );
      
      // Obtener datos relacionados
      const phraseIds = [...new Set(recentDetectionsRaw.map((d: any) => d.phrase_id).filter(Boolean))];
      const radioIds = [...new Set(recentDetectionsRaw.map((d: any) => d.radio_id).filter(Boolean))];
      
      const [phrases, radios] = await Promise.all([
        phraseIds.length > 0 ? supabaseDirect.request(`phrases?id=in.(${phraseIds.join(',')})`) : [],
        radioIds.length > 0 ? supabaseDirect.request(`radios?id=in.(${radioIds.join(',')})`) : []
      ]);

      const recentDetections = recentDetectionsRaw.map((d: any) => ({
        ...d,
        phrase: phrases.find((p: any) => p.id === d.phrase_id),
        radio: radios.find((r: any) => r.id === d.radio_id)
      }));

      // Estadísticas de transcripción
      const transcriptionStats = multiProviderTranscriptionService.getProviderStats();

      return {
        activeSessions: activeSessions.length,
        totalCaptures: activeSessions.reduce((sum, s) => sum + s.totalCaptures, 0),
        totalDetections: activeSessions.reduce((sum, s) => sum + s.advertisementsFound, 0),
        activePhrases: phraseCount,
        queueStats,
        transcriptionProviders: transcriptionStats,
        recentDetections: recentDetections.map((d: any) => ({
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
      const detectionsRaw = await supabaseDirect.request(
        `detections?select=*&order=timestamp.desc&limit=${limit}`
      );
      
      // Obtener datos relacionados
      const phraseIds = [...new Set(detectionsRaw.map((d: any) => d.phrase_id).filter(Boolean))];
      const radioIds = [...new Set(detectionsRaw.map((d: any) => d.radio_id).filter(Boolean))];
      const sessionIds = [...new Set(detectionsRaw.map((d: any) => d.session_id).filter(Boolean))];
      
      const [phrases, radios, sessions] = await Promise.all([
        phraseIds.length > 0 ? supabaseDirect.request(`phrases?id=in.(${phraseIds.join(',')})`) : [],
        radioIds.length > 0 ? supabaseDirect.request(`radios?id=in.(${radioIds.join(',')})`) : [],
        sessionIds.length > 0 ? supabaseDirect.request(`monitoring_sessions?id=in.(${sessionIds.join(',')})`) : []
      ]);

      // Obtener usuarios de las sesiones
      const userIds = [...new Set(sessions.map((s: any) => s.user_id).filter(Boolean))];
      const users = userIds.length > 0 ? await supabaseDirect.request(`users?id=in.(${userIds.join(',')})`) : [];

      const detections = detectionsRaw.map((d: any) => {
        const session = sessions.find((s: any) => s.id === d.session_id);
        const user = session ? users.find((u: any) => u.id === session.user_id) : null;
        
        return {
          ...d,
          phrase: phrases.find((p: any) => p.id === d.phrase_id),
          radio: radios.find((r: any) => r.id === d.radio_id),
          session: {
            ...session,
            user: user
          }
        };
      });

      return detections.map((d: any) => ({
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

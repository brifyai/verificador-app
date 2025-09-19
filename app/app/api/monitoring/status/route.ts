
import { NextResponse } from 'next/server';
import { monitoringService } from '@/lib/monitoring-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Obtener estado real del sistema
    const systemHealth = await monitoringService.checkSystemHealth();
    const systemStats = await monitoringService.getSystemStats();
    const activeSessions = monitoringService.getActiveSessions();
    const recentDetections = await monitoringService.getRecentDetections(5);

    const response = {
      // Estado de dependencias/herramientas
      dependencies: systemHealth.audioCapture || {
        'node-fetch': true,
        'audio-capture': true,
        'stream-processing': true,
        'database': true
      },
      
      // Proveedores de transcripción
      transcriptionProviders: systemHealth.transcriptionProviders || {
        total: 0,
        enabled: 0,
        providers: {}
      },
      
      // Estado general
      activeCaptures: systemStats.totalCaptures || 0,
      activeSessions: activeSessions,
      totalEvents: systemStats.totalDetections || 0,
      systemReady: systemHealth.systemReady || false,
      systemStatus: systemHealth.systemReady ? 'ready' : 'configuration_needed',
      
      // Detecciones recientes
      recentDetections: recentDetections.slice(0, 5),
      
      // Estadísticas adicionales
      queueStats: systemHealth.jobQueue,
      phraseCount: systemHealth.phraseDetection?.activePhrases || 0,
      lastCheck: systemHealth.lastCheck || new Date()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error en monitoring status:', error);
    return NextResponse.json({
      dependencies: {
        'node-fetch': true,
        'audio-capture': false,
        'stream-processing': false,
        'database': false
      },
      activeCaptures: 0,
      activeSessions: [],
      totalEvents: 0,
      systemReady: false,
      systemStatus: 'error',
      recentDetections: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { monitoringService } from '@/lib/monitoring-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { radioId, captureInterval = 30, captureDuration = 10 } = body;

    if (!radioId) {
      return NextResponse.json(
        { error: 'Radio ID es requerido' },
        { status: 400 }
      );
    }

    // TODO: Obtener userId de la sesión autenticada
    // Por ahora usamos un userId por defecto
    const userId = 'default-user'; // En producción, obtener de la sesión

    console.log(`🎯 Starting monitoring for radio ${radioId}`);

    // Iniciar monitoreo real
    const sessionId = await monitoringService.startMonitoring(
      radioId,
      userId,
      captureInterval,
      captureDuration
    );

    const response = {
      success: true,
      sessionId,
      message: `Monitoreo iniciado exitosamente para radio ${radioId}`,
      startTime: new Date().toISOString(),
      settings: {
        captureInterval,
        captureDuration,
        autoTranscription: true,
        phraseDetection: true,
        language: 'es'
      }
    };

    console.log(`✅ Monitoring session created: ${sessionId}`);
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ Error iniciando monitoreo:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

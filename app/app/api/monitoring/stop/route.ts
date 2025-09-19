
import { NextRequest, NextResponse } from 'next/server';
import { monitoringService } from '@/lib/monitoring-service';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, radioId } = body;

    // Si se envía sessionId, usar ese; si no, buscar sesión activa por radioId
    let targetSessionId = sessionId;
    
    if (!targetSessionId && radioId) {
      console.log(`🔍 Looking for active session for radio ${radioId}`);
      
      const activeSession = await prisma.monitoringSession.findFirst({
        where: {
          radioId,
          status: 'ACTIVE'
        }
      });
      
      if (activeSession) {
        targetSessionId = activeSession.id;
      } else {
        return NextResponse.json(
          { error: 'No hay sesión activa para esta radio' },
          { status: 404 }
        );
      }
    }

    if (!targetSessionId) {
      return NextResponse.json(
        { error: 'Session ID o Radio ID es requerido' },
        { status: 400 }
      );
    }

    console.log(`🛑 Stopping monitoring for session ${targetSessionId}`);

    // Obtener información de la sesión antes de pararla
    const session = monitoringService.getSession(targetSessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      );
    }

    // Parar monitoreo
    await monitoringService.stopMonitoring(targetSessionId);

    // Calcular estadísticas finales
    const duration = Date.now() - session.startTime.getTime();
    const durationMinutes = Math.round(duration / (1000 * 60));

    const response = {
      success: true,
      message: `Monitoreo detenido exitosamente para ${session.radioName}`,
      endTime: new Date().toISOString(),
      sessionId: targetSessionId,
      stats: {
        radioName: session.radioName,
        radioId: session.radioId,
        duration: `${durationMinutes} minutos`,
        totalCaptures: session.totalCaptures,
        detectionsFound: session.advertisementsFound,
        startTime: session.startTime.toISOString(),
        captureInterval: session.captureInterval,
        captureDuration: session.captureDuration
      }
    };

    console.log(`✅ Monitoring session ${targetSessionId} stopped successfully`);
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ Error stopping monitoring:', error);
    
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

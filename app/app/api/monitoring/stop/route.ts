
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Configuración de la VPS
const VPS_CONFIG = {
  host: process.env.VPS_HOST || '173.249.26.38',
  port: process.env.VPS_PORT || '3000',
  endpoint: '/api/stop-schedule'
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, radioId } = body;

    console.log(`🛑 Deteniendo y eliminando monitoreo - sessionId: ${sessionId}, radioId: ${radioId}`);

    // Si se envía sessionId, usar ese; si no, buscar sesión activa por radioId
    let targetSessionId = sessionId;
    
    if (!targetSessionId && radioId) {
      console.log(`🔍 Buscando sesión activa para radio ${radioId}`);
      
      const activeSession = await prisma.monitoringSession.findFirst({
        where: {
          radioId,
          status: { in: ['ACTIVE', 'PAUSED'] }
        }
      });
      
      if (activeSession) {
        targetSessionId = activeSession.id;
      } else {
        return NextResponse.json({
          success: false,
          error: 'No hay sesión activa para esta radio'
        }, { status: 404 });
      }
    }

    if (!targetSessionId) {
      return NextResponse.json({
        success: false,
        error: 'sessionId o radioId es requerido'
      }, { status: 400 });
    }

    // 1. Obtener información de la sesión antes de eliminarla
    const session = await prisma.monitoringSession.findUnique({
      where: { id: targetSessionId },
      include: {
        radio: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } }
      }
    });

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Sesión no encontrada en la base de datos'
      }, { status: 404 });
    }

    console.log(`📊 Sesión encontrada: ${session.radio.name}`);

    // 2. Calcular estadísticas finales
    const duration = Date.now() - new Date(session.startTime).getTime();
    const durationMinutes = Math.round(duration / (1000 * 60));

    // 3. Notificar a la VPS para detener el monitoreo
    let vpsNotified = false;
    try {
      const vpsUrl = `http://${VPS_CONFIG.host}:${VPS_CONFIG.port}${VPS_CONFIG.endpoint}`;
      console.log(`📡 Notificando detención a VPS: ${vpsUrl}`);

      const vpsResponse = await fetch(vpsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: targetSessionId,
          radioId: session.radioId,
          userId: session.userId,
          action: 'stop'
        }),
        signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
      });

      if (vpsResponse.ok) {
        const vpsData = await vpsResponse.json();
        console.log('✅ VPS notificado exitosamente:', vpsData);
        vpsNotified = true;
      } else {
        console.warn('⚠️ VPS no respondió correctamente');
      }
    } catch (vpsError: any) {
      console.warn('⚠️ Error notificando a VPS (no crítico):', vpsError.message);
    }

    // 4. Marcar la sesión como COMPLETED en lugar de eliminarla
    await prisma.monitoringSession.update({
      where: { id: targetSessionId },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
        totalCaptures: session.totalCaptures || 0,
        totalDetections: session.totalDetections || 0
      }
    });

    console.log(`✅ Sesión ${targetSessionId} marcada como COMPLETED`);

    const response = {
      success: true,
      message: `Monitoreo finalizado exitosamente para ${session.radio.name}`,
      endTime: new Date().toISOString(),
      sessionId: targetSessionId,
      vpsNotified,
      stats: {
        radioName: session.radio.name,
        radioId: session.radioId,
        duration: `${durationMinutes} minutos`,
        totalCaptures: session.totalCaptures || 0,
        totalDetections: session.totalDetections || 0,
        startTime: session.startTime.toISOString(),
        captureInterval: session.captureInterval,
        captureDuration: session.captureDuration
      }
    };

    console.log(`✅ Monitoreo detenido completamente: ${targetSessionId}`);
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

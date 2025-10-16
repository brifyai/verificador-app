import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Configuración de la VPS
const VPS_CONFIG = {
  host: process.env.VPS_HOST || '173.249.26.38',
  port: process.env.VPS_PORT || '3000',
  endpoint: '/api/pause-schedule'
};

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    console.log(`⏸️ Pausando sesión de monitoreo: ${sessionId}`);

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'sessionId es requerido'
      }, { status: 400 });
    }

    // 1. Actualizar estado en la base de datos local
    const session = await prisma.monitoringSession.update({
      where: { id: sessionId },
      data: { 
        status: 'PAUSED',
        endTime: new Date() // Registrar cuándo se pausó
      },
      include: {
        radio: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } }
      }
    });

    console.log(`✅ Sesión pausada en BD: ${session.id}`);

    // 2. Notificar a la VPS para pausar grabaciones
    try {
      const vpsUrl = `http://${VPS_CONFIG.host}:${VPS_CONFIG.port}${VPS_CONFIG.endpoint}`;
      console.log(`📡 Notificando pausa a VPS: ${vpsUrl}`);

      const vpsResponse = await fetch(vpsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          radioId: session.radioId,
          userId: session.userId,
          action: 'pause',
          status: 'PAUSED'
        }),
        signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
      });

      if (vpsResponse.ok) {
        const vpsData = await vpsResponse.json();
        console.log('✅ VPS notificado exitosamente:', vpsData);
      } else {
        console.warn('⚠️ VPS no respondió correctamente, pero sesión pausada en BD');
      }
    } catch (vpsError: any) {
      console.warn('⚠️ Error notificando a VPS (no crítico):', vpsError.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Monitoreo pausado correctamente',
      data: {
        sessionId: session.id,
        radioName: session.radio.name,
        status: session.status,
        pausedAt: session.endTime
      }
    });

  } catch (error: any) {
    console.error('❌ Error pausando monitoreo:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al pausar el monitoreo'
    }, { status: 500 });
  }
}

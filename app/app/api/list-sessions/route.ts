import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('📋 Listando todas las sesiones de monitoreo...');

    // Obtener todas las sesiones
    const sessions = await prisma.monitoringSession.findMany({
      orderBy: { startTime: 'desc' },
      include: {
        radio: {
          select: {
            id: true,
            name: true,
            region: true,
            streamUrl: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`✅ Total de sesiones encontradas: ${sessions.length}`);

    // Formatear para mostrar de forma clara
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      radio: {
        id: session.radio.id,
        name: session.radio.name,
        region: session.radio.region
      },
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email
      },
      status: session.status,
      startTime: session.startTime,
      endTime: session.endTime,
      recordingHours: `${session.recordingStartHour}:00 - ${session.recordingEndHour}:00`,
      captureInterval: session.captureInterval,
      captureDuration: session.captureDuration,
      totalCaptures: session.totalCaptures,
      totalDetections: session.totalDetections,
      lastCaptureAt: session.lastCaptureAt,
      lastDetectionAt: session.lastDetectionAt,
      configuration: session.configuration,
      metadata: session.metadata
    }));

    return NextResponse.json({
      success: true,
      total: sessions.length,
      sessions: formattedSessions,
      summary: {
        total: sessions.length,
        active: sessions.filter(s => s.status === 'ACTIVE').length,
        paused: sessions.filter(s => s.status === 'PAUSED').length,
        stopped: sessions.filter(s => s.status === 'STOPPED').length,
        totalCaptures: sessions.reduce((sum, s) => sum + (s.totalCaptures || 0), 0),
        totalDetections: sessions.reduce((sum, s) => sum + (s.totalDetections || 0), 0)
      }
    });

  } catch (error: any) {
    console.error('❌ Error listando sesiones:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

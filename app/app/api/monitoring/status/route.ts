
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'ALL';
    const limit = parseInt(url.searchParams.get('limit') || '50');

    console.log(`📊 API /monitoring/status - Consultando sesiones con filtro: ${status}, límite: ${limit}`);

    // Obtener sesiones de monitoreo desde la base de datos
    const activeSessions = await prisma.monitoringSession.findMany({
      where: status === 'ALL' ? {} : {
        status: status as any
      },
      include: {
        radio: {
          select: {
            id: true,
            name: true,
            region: true,
            platform: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        detections: {
          take: 5,
          orderBy: {
            timestamp: 'desc'
          },
          select: {
            id: true,
            confidence: true,
            timestamp: true,
            phraseId: true
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      },
      take: limit
    });

    console.log(`📋 Sesiones encontradas en la base de datos: ${activeSessions.length}`);
    if (activeSessions.length > 0) {
      console.log(`📝 Primera sesión:`, {
        id: activeSessions[0].id,
        radioName: (activeSessions[0] as any).radio?.name,
        status: activeSessions[0].status,
        startTime: activeSessions[0].startTime
      });
    }

    // Obtener estadísticas generales
    const totalSessions = await prisma.monitoringSession.count();
    const activeSessionsCount = await prisma.monitoringSession.count({
      where: { status: 'ACTIVE' }
    });
    const totalDetections = await prisma.detection.count();
    const recentDetections = await prisma.detection.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
        }
      }
    });

    // Obtener detecciones recientes con información completa
    const latestDetections = await prisma.detection.findMany({
      take: 10,
      orderBy: {
        timestamp: 'desc'
      },
      include: {
        session: {
          include: {
            radio: {
              select: {
                name: true,
                region: true
              }
            }
          }
        },
        phrase: {
          select: {
            phrase: true,
            brand: true,
            campaign: true
          }
        }
      }
    });

    const sessionsData = activeSessions.map(session => ({
      id: session.id,
      status: session.status,
      startTime: session.startTime,
      endTime: session.endTime,
      recordingStartHour: session.recordingStartHour,
      recordingEndHour: session.recordingEndHour,
      captureInterval: session.captureInterval,
      captureDuration: session.captureDuration,
      radio: (session as any).radio,
      user: (session as any).user,
      detectionsCount: (session as any).detections?.length || 0,
      recentDetections: (session as any).detections || [],
      configuration: session.configuration
    }));

    const response = {
      success: true,
      data: sessionsData,
      
      // Sesiones activas (para compatibilidad con dashboard principal)
      activeSessions: sessionsData,
      
      // Estadísticas
      stats: {
        totalSessions,
        activeSessions: activeSessionsCount,
        totalDetections,
        recentDetections,
        systemReady: true,
        systemStatus: 'ready'
      },
      
      // Detecciones recientes
      recentDetections: latestDetections.map(detection => ({
        id: detection.id,
        confidence: detection.confidence,
        timestamp: detection.timestamp,
        radio: (detection as any).session?.radio,
        phrase: (detection as any).phrase,
        detectedText: detection.detectedText,
        originalText: detection.originalText
      })),
      
      // Estado del sistema
      dependencies: {
        'database': true,
        'prisma': true,
        'monitoring': true
      },
      
      lastCheck: new Date().toISOString()
    };

    console.log(`✅ Enviando respuesta con ${sessionsData.length} sesiones`);
    console.log(`📊 Estadísticas: Total=${totalSessions}, Activas=${activeSessionsCount}, Detecciones=${totalDetections}`);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error obteniendo estado de monitoreo:', error);
    return NextResponse.json({
      success: false,
      data: [],
      activeSessions: [],
      stats: {
        totalSessions: 0,
        activeSessions: 0,
        totalDetections: 0,
        recentDetections: 0,
        systemReady: false,
        systemStatus: 'error'
      },
      recentDetections: [],
      dependencies: {
        'database': false,
        'prisma': false,
        'monitoring': false
      },
      error: error instanceof Error ? error.message : 'Error desconocido',
      lastCheck: new Date().toISOString()
    }, { status: 500 });
  }
}

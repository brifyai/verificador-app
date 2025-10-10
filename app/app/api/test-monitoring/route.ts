import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// API de prueba para crear sesiones de monitoreo directamente
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 API de prueba - Creando sesión de monitoreo de prueba...');

    // Obtener la primera radio disponible
    const firstRadio = await prisma.radio.findFirst({
      select: { id: true, name: true, region: true }
    });

    if (!firstRadio) {
      return NextResponse.json({
        success: false,
        error: 'No hay radios disponibles en la base de datos'
      }, { status: 400 });
    }

    // Obtener el primer usuario disponible
    const firstUser = await prisma.user.findFirst({
      select: { id: true, name: true, email: true }
    });

    if (!firstUser) {
      return NextResponse.json({
        success: false,
        error: 'No hay usuarios disponibles en la base de datos'
      }, { status: 400 });
    }

    // Crear sesión de prueba
    const testSession = await prisma.monitoringSession.create({
      data: {
        // Relaciones requeridas
        radio: {
          connect: { id: firstRadio.id }
        },
        user: {
          connect: { id: firstUser.id }
        },
        
        // Campos de la tabla
        status: 'ACTIVE',
        startTime: new Date(),
        endTime: null,
        captureInterval: 30,
        captureDuration: 10, // Según la tabla es 10
        totalCaptures: 0,
        totalDetections: 0,
        lastCaptureAt: null,
        lastDetectionAt: null,
        recordingStartHour: 9, // 9 AM
        recordingEndHour: 17,  // 5 PM
        
        configuration: {
          streamUrl: 'http://test-stream.example.com/radio',
          radioId: firstRadio.id,
          radioName: firstRadio.name,
          radioRegion: firstRadio.region,
          language: 'es',
          aiModel: 'estandar',
          autoTranscription: true,
          phraseDetection: true,
          phrase: {
            id: 'test-phrase',
            text: 'Frase de prueba',
            brand: 'Marca Test',
            campaign: 'Campaña Test'
          }
        },
        
        metadata: {
          createdFrom: 'test_api',
          testSession: true,
          createdAt: new Date().toISOString(),
          source: 'test_monitoring_api'
        }
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
        }
      }
    });

    console.log('✅ Sesión de prueba creada:', testSession.id);

    return NextResponse.json({
      success: true,
      message: 'Sesión de monitoreo de prueba creada exitosamente',
      data: {
        sessionId: testSession.id,
        radioName: testSession.radio.name,
        userName: testSession.user.name || testSession.user.email,
        status: testSession.status,
        recordingHours: `${testSession.recordingStartHour}:00 - ${testSession.recordingEndHour}:00`,
        createdAt: testSession.startTime
      }
    });

  } catch (error: any) {
    console.error('❌ Error creando sesión de prueba:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}

// API para obtener estadísticas de la base de datos
export async function GET() {
  try {
    console.log('📊 Consultando estadísticas de la base de datos...');

    const stats = {
      totalRadios: await prisma.radio.count(),
      totalUsers: await prisma.user.count(),
      totalSessions: await prisma.monitoringSession.count(),
      activeSessions: await prisma.monitoringSession.count({
        where: { status: 'ACTIVE' }
      }),
      totalDetections: await prisma.detection.count(),
      totalPhrases: await prisma.phrase.count()
    };

    // Obtener todas las sesiones con datos completos
    const allSessions = await prisma.monitoringSession.findMany({
      orderBy: { startTime: 'desc' },
      include: {
        radio: { select: { name: true, region: true } },
        user: { select: { name: true, email: true } }
      }
    });

    console.log('📋 Estadísticas obtenidas:', stats);
    console.log(`📊 Total de sesiones en la base de datos: ${allSessions.length}`);

    return NextResponse.json({
      success: true,
      stats,
      totalSessionsFound: allSessions.length,
      allSessions: allSessions.map(session => ({
        id: session.id,
        radioName: session.radio.name,
        radioRegion: session.radio.region,
        userName: session.user.name || session.user.email,
        status: session.status,
        startTime: session.startTime,
        endTime: session.endTime,
        recordingHours: `${session.recordingStartHour}:00 - ${session.recordingEndHour}:00`,
        captureInterval: session.captureInterval,
        captureDuration: session.captureDuration,
        hasConfiguration: !!session.configuration,
        hasMetadata: !!session.metadata,
        configurationKeys: session.configuration ? Object.keys(session.configuration as any) : [],
        metadataKeys: session.metadata ? Object.keys(session.metadata as any) : []
      }))
    });

  } catch (error: any) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}

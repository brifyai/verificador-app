import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🔍 DEBUG: Verificando tabla monitoring_sessions...');

    // Contar total de sesiones
    const totalSessions = await prisma.monitoringSession.count();
    console.log(`📊 Total de sesiones en la tabla: ${totalSessions}`);

    // Obtener las últimas 5 sesiones
    const recentSessions = await prisma.monitoringSession.findMany({
      take: 5,
      orderBy: { startTime: 'desc' },
      select: {
        id: true,
        userId: true,
        status: true,
        startTime: true,
        endTime: true,
        captureInterval: true,
        captureDuration: true,
        totalCaptures: true,
        totalDetections: true,
        recordingStartHour: true,
        recordingEndHour: true,
        configuration: true,
        metadata: true
      }
    });

    console.log(`📋 Sesiones recientes encontradas: ${recentSessions.length}`);

    // Verificar estructura de la tabla
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'monitoring_sessions' 
      ORDER BY ordinal_position;
    `;

    return NextResponse.json({
      success: true,
      debug: {
        totalSessions,
        recentSessionsCount: recentSessions.length,
        recentSessions: recentSessions.map(session => ({
          id: session.id,
          userId: session.userId,
          status: session.status,
          startTime: session.startTime,
          recordingHours: `${session.recordingStartHour}:00 - ${session.recordingEndHour}:00`,
          hasConfiguration: !!session.configuration,
          hasMetadata: !!session.metadata,
          configurationKeys: session.configuration ? Object.keys(session.configuration as any) : [],
          metadataKeys: session.metadata ? Object.keys(session.metadata as any) : []
        })),
        tableStructure: tableInfo
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error en debug-monitoring:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// POST para crear una sesión de prueba simple
export async function POST() {
  try {
    console.log('🧪 Creando sesión de prueba simple...');

    // Obtener primer usuario y radio
    const firstUser = await prisma.user.findFirst();
    const firstRadio = await prisma.radio.findFirst();

    if (!firstUser || !firstRadio) {
      return NextResponse.json({
        success: false,
        error: 'No hay usuarios o radios en la base de datos'
      }, { status: 400 });
    }

    // Crear sesión muy simple
    const testSession = await prisma.monitoringSession.create({
      data: {
        radio: { connect: { id: firstRadio.id } },
        user: { connect: { id: firstUser.id } },
        status: 'ACTIVE',
        startTime: new Date(),
        captureInterval: 30,
        captureDuration: 10,
        totalCaptures: 0,
        totalDetections: 0,
        recordingStartHour: 9,
        recordingEndHour: 17,
        configuration: {
          radioId: firstRadio.id,
          radioName: firstRadio.name,
          test: true
        },
        metadata: {
          createdFrom: 'debug_api',
          timestamp: new Date().toISOString()
        }
      }
    });

    console.log(`✅ Sesión de prueba creada: ${testSession.id}`);

    return NextResponse.json({
      success: true,
      message: 'Sesión de prueba creada exitosamente',
      sessionId: testSession.id,
      data: {
        id: testSession.id,
        userId: testSession.userId,
        status: testSession.status,
        startTime: testSession.startTime
      }
    });

  } catch (error: any) {
    console.error('❌ Error creando sesión de prueba:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

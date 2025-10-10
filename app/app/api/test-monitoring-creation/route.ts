import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('🧪 === PRUEBA DE CREACIÓN DE MONITOREO ===');
    
    // 1. Verificar que existan usuarios
    const users = await prisma.user.findMany();
    console.log(`👥 Usuarios encontrados: ${users.length}`);
    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No hay usuarios en la base de datos',
        step: 'verificar_usuarios'
      }, { status: 400 });
    }

    // 2. Verificar que existan radios
    const radios = await prisma.radio.findMany();
    console.log(`📻 Radios encontradas: ${radios.length}`);
    if (radios.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No hay radios en la base de datos',
        step: 'verificar_radios'
      }, { status: 400 });
    }

    // 3. Usar el primer usuario y primera radio
    const testUser = users[0];
    const testRadio = radios[0];
    
    console.log(`👤 Usuario de prueba: ${testUser.id} (${testUser.name})`);
    console.log(`📻 Radio de prueba: ${testRadio.id} (${testRadio.name})`);

    // 4. Crear sesión de monitoreo con datos mínimos
    console.log('💾 Creando sesión de monitoreo...');
    
    const sessionData = {
      radio: { connect: { id: testRadio.id } },
      user: { connect: { id: testUser.id } },
      status: 'ACTIVE' as any,
      startTime: new Date(),
      captureInterval: 30,
      captureDuration: 10,
      totalCaptures: 0,
      totalDetections: 0,
      recordingStartHour: 9,
      recordingEndHour: 17,
      configuration: {
        radioId: testRadio.id,
        radioName: testRadio.name,
        streamUrl: testRadio.streamUrl || 'http://test-stream.com',
        test: true,
        createdFrom: 'test_monitoring_creation'
      },
      metadata: {
        testSession: true,
        createdAt: new Date().toISOString(),
        source: 'test_monitoring_creation_api'
      }
    };

    console.log('📊 Datos de la sesión:', JSON.stringify(sessionData, null, 2));

    const session = await prisma.monitoringSession.create({
      data: sessionData,
      include: {
        radio: { select: { id: true, name: true, region: true } },
        user: { select: { id: true, name: true, email: true } }
      }
    });

    console.log(`✅ Sesión creada exitosamente: ${session.id}`);

    // 5. Verificar que se guardó correctamente
    const savedSession = await prisma.monitoringSession.findUnique({
      where: { id: session.id },
      include: {
        radio: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } }
      }
    });

    console.log('🔍 Sesión verificada en BD:', savedSession ? 'ENCONTRADA' : 'NO ENCONTRADA');

    return NextResponse.json({
      success: true,
      message: 'Sesión de monitoreo creada exitosamente',
      data: {
        sessionId: session.id,
        userId: session.userId,
        radioId: testRadio.id,
        radioName: testRadio.name,
        userName: testUser.name,
        status: session.status,
        startTime: session.startTime,
        verification: savedSession ? 'VERIFIED' : 'NOT_FOUND'
      },
      steps: {
        users_found: users.length,
        radios_found: radios.length,
        session_created: true,
        session_verified: !!savedSession
      }
    });

  } catch (error: any) {
    console.error('❌ Error en prueba de creación:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Obtener estadísticas rápidas
    const stats = {
      users: await prisma.user.count(),
      radios: await prisma.radio.count(),
      sessions: await prisma.monitoringSession.count(),
      activeSessions: await prisma.monitoringSession.count({
        where: { status: 'ACTIVE' }
      })
    };

    return NextResponse.json({
      success: true,
      stats,
      message: 'Estadísticas de la base de datos'
    });

  } catch (error: any) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

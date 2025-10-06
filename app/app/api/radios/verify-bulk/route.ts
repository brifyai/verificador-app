import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { verifyStreamStatus } from '@/lib/stream-verifier';
import { RadioStatus } from '@prisma/client';

/**
 * POST /api/radios/verify-bulk
 * Verifica el estado de todas las radios activas
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Obtener todas las radios activas
    const radios = await prisma.radio.findMany({
      where: {
        status: RadioStatus.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        streamUrl: true,
        region: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    if (radios.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay radios activas para verificar',
        data: {
          total: 0,
          online: 0,
          offline: 0,
          results: [],
        },
      });
    }

    logger.info(`Iniciando verificación masiva de ${radios.length} radios`);

    // Verificar todas las radios en paralelo con límite de concurrencia
    const BATCH_SIZE = 10; // Procesar de a 10 para no sobrecargar
    const results = [];
    let onlineCount = 0;
    let offlineCount = 0;

    for (let i = 0; i < radios.length; i += BATCH_SIZE) {
      const batch = radios.slice(i, i + BATCH_SIZE);
      
      const batchResults = await Promise.all(
        batch.map(async (radio) => {
          try {
            const verification = await verifyStreamStatus(radio.streamUrl);
            
            // Actualizar en la base de datos
            await prisma.radio.update({
              where: { id: radio.id },
              data: {
                lastVerificationStatus: verification.status,
                lastVerifiedAt: new Date(),
              },
            });

            // Contar resultados
            if (verification.status === 'ONLINE') {
              onlineCount++;
            } else {
              offlineCount++;
            }

            return {
              radioId: radio.id,
              radioName: radio.name,
              region: radio.region,
              status: verification.status,
              details: verification.details,
            };
          } catch (error: any) {
            logger.error(`Error verificando radio ${radio.name}:`, error);
            offlineCount++;
            return {
              radioId: radio.id,
              radioName: radio.name,
              region: radio.region,
              status: 'OFFLINE' as const,
              details: `Error: ${error.message}`,
            };
          }
        })
      );

      results.push(...batchResults);

      // Pequeña pausa entre batches para no sobrecargar
      if (i + BATCH_SIZE < radios.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    logger.info(
      `Verificación masiva completada: ${onlineCount} online, ${offlineCount} offline`
    );

    return NextResponse.json({
      success: true,
      message: `Verificación completada: ${onlineCount} online, ${offlineCount} offline`,
      data: {
        total: radios.length,
        online: onlineCount,
        offline: offlineCount,
        results,
      },
    });
  } catch (error: any) {
    logger.error('Error en verificación masiva:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

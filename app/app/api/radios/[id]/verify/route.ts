import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { verifyStreamStatus } from '@/lib/stream-verifier';

/**
 * POST /api/radios/[id]/verify
 * Verifica manualmente el estado de una radio específica
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = params;

    // Buscar la radio
    const radio = await prisma.radio.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        streamUrl: true,
        region: true,
      },
    });

    if (!radio) {
      return NextResponse.json(
        { success: false, error: 'Radio no encontrada' },
        { status: 404 }
      );
    }

    // Verificar el stream
    logger.info(`Manual verification requested for radio: ${radio.name} (${id})`);
    const verification = await verifyStreamStatus(radio.streamUrl);
    logger.info(
      `Verification result for ${radio.name}: ${verification.status} - ${verification.details}`
    );

    // Actualizar la base de datos con el resultado
    const updatedRadio = await prisma.radio.update({
      where: { id },
      data: {
        lastVerificationStatus: verification.status,
        lastVerifiedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        radioId: id,
        radioName: radio.name,
        status: verification.status,
        details: verification.details,
        verifiedAt: updatedRadio.lastVerifiedAt,
      },
    });
  } catch (error: any) {
    logger.error('Error en verificación manual de radio:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

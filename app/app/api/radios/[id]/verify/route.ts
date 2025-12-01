import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseDirect } from '@/lib/supabase-direct';
import { logger } from '@/lib/logger';
import { verifyStreamStatus } from '@/lib/stream-verifier-enhanced';

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
    const radios = await supabaseDirect.request(
      `radios?select=id,name,stream_url,region&id=eq.${id}`
    );

    if (radios.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Radio no encontrada' },
        { status: 404 }
      );
    }

    const radio = radios[0];

    // Verificar el stream
    logger.info(`Manual verification requested for radio: ${radio.name} (${id})`);
    const verification = await verifyStreamStatus(radio.stream_url);
    logger.info(
      `Verification result for ${radio.name}: ${verification.status} - ${verification.details}`
    );

    // Actualizar la base de datos con el resultado
    const updatedRadios = await supabaseDirect.request(`radios?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        last_verification_status: verification.status,
        last_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }),
      headers: { 'Prefer': 'return=representation' }
    });

    const updatedRadio = updatedRadios[0];

    return NextResponse.json({
      success: true,
      data: {
        radioId: id,
        radioName: radio.name,
        status: verification.status,
        details: verification.details,
        verifiedAt: updatedRadio.last_verified_at,
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

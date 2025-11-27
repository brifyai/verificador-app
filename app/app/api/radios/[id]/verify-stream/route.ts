import { NextRequest, NextResponse } from 'next/server';
import { supabaseDirect } from '@/lib/supabase-direct';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { logger } from '@/lib/logger';
import { streamVerifierVPS } from '@/lib/stream-verifier-vps';

/**
 * POST /api/radios/[id]/verify-stream
 * Verifica que el streaming de una radio esté funcionando antes de grabar
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Hacer esta ruta pública para que el botón "Escuchar" funcione sin autenticación
    // El botón necesita verificar el streaming antes de grabar
    const { id } = params;

    // Obtener datos de la radio desde Supabase
    const radios = await supabaseDirect.request(`radios?select=*&id=eq.${id}`);
    
    if (radios.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Radio no encontrada' 
      }, { status: 404 });
    }

    const radio = radios[0];
    
    // Verificar que la radio esté activa
    if (radio.status !== 'ACTIVE') {
      return NextResponse.json({ 
        success: false, 
        error: 'La radio debe estar activa para verificar su streaming' 
      }, { status: 400 });
    }

    // Verificar que tenga URL de stream
    if (!radio.stream_url) {
      return NextResponse.json({ 
        success: false, 
        error: 'La radio no tiene URL de stream configurada' 
      }, { status: 400 });
    }

    logger.info(`🔍 Verificando streaming para radio: ${radio.name} (${id})`);
    logger.info(`🔗 URL del stream: ${radio.stream_url}`);

    // Verificar el streaming usando el servicio de la VPS
    const verificationResult = await streamVerifierVPS.verifyStreamWithRetry(
      id,
      radio.stream_url,
      radio.name
    );

    logger.info(`📊 Resultado de verificación:`, verificationResult);

    if (verificationResult.status === 'ONLINE') {
      // Actualizar el estado de verificación en la base de datos
      const updateData = {
        last_verification_status: 'ONLINE',
        last_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await supabaseDirect.request(`radios?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });

      return NextResponse.json({
        success: true,
        message: 'Streaming verificado correctamente',
        data: {
          status: 'ONLINE',
          details: verificationResult.details,
          responseTime: verificationResult.responseTime,
          contentType: verificationResult.contentType,
          contentLength: verificationResult.contentLength,
          radio_name: radio.name,
          stream_url: radio.stream_url
        }
      });
    } else {
      // Actualizar estado como offline
      const updateData = {
        last_verification_status: 'OFFLINE',
        last_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await supabaseDirect.request(`radios?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });

      return NextResponse.json({
        success: false,
        error: 'Streaming no disponible',
        details: verificationResult.details,
        data: {
          status: 'OFFLINE',
          details: verificationResult.details,
          radio_name: radio.name,
          stream_url: radio.stream_url
        }
      }, { status: 400 });
    }

  } catch (error) {
    logger.error('❌ Error verificando streaming:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor al verificar streaming' 
    }, { status: 500 });
  }
}

/**
 * GET /api/radios/[id]/verify-stream
 * Obtiene el último estado de verificación del streaming
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Hacer esta ruta pública para que el botón "Escuchar" funcione sin autenticación
    const { id } = params;

    // Obtener datos de la radio desde Supabase
    const radios = await supabaseDirect.request(`radios?select=id,name,stream_url,last_verification_status,last_verified_at&id=eq.${id}`);
    
    if (radios.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Radio no encontrada' 
      }, { status: 404 });
    }

    const radio = radios[0];

    return NextResponse.json({
      success: true,
      data: {
        id: radio.id,
        name: radio.name,
        stream_url: radio.stream_url,
        last_verification_status: radio.last_verification_status,
        last_verified_at: radio.last_verified_at,
        is_verified: !!radio.last_verification_status,
        status_age: radio.last_verified_at ? 
          Math.floor((Date.now() - new Date(radio.last_verified_at).getTime()) / (1000 * 60)) + ' minutos' : 
          'Nunca verificado'
      }
    });

  } catch (error) {
    logger.error('❌ Error obteniendo estado de verificación:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}
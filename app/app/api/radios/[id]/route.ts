import { NextRequest, NextResponse } from 'next/server';
import { supabaseDirect } from '@/lib/supabase-direct';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { logger } from '@/lib/logger';
import { RadioUpdateSchema } from '@/lib/schemas/radio.schema';
import { z } from 'zod';
import { verifyStreamStatus } from '@/lib/stream-verifier';

// Función auxiliar para mapear plataformas a valores del enum de Supabase
const mapPlatformToEnum = (platform: string): string => {
  const platformMap: Record<string, string> = {
    youtube: 'YOUTUBE',
    twitch: 'TWITCH',
    facebook: 'FACEBOOK',
    icecast: 'ICECAST',
    shoutcast: 'SHOUTCAST',
    direct: 'HTTP_STREAM',
    http: 'HTTP_STREAM',
    rtmp: 'RTMP',
    centova: 'ICECAST',
    sonicpanel: 'ICECAST',
    azuracast: 'ICECAST',
  };
  return platformMap[platform.toLowerCase()] || 'OTHER';
};


// --- PUT: Actualizar una radio por ID (Versión Segura y Robusta) ---
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. AÑADIMOS LA VERIFICACIÓN DE SESIÓN (¡MUY IMPORTANTE!)
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Validar con Zod
    const validationResult = RadioUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Datos inválidos', 
        details: validationResult.error.errors 
      }, { status: 400 });
    }
    
    const validated = validationResult.data;

    // Verificar que la radio existe
    const existingRadios = await supabaseDirect.request(`radios?select=*&id=eq.${id}`);
    if (existingRadios.length === 0) {
      return NextResponse.json({ success: false, error: 'Radio no encontrada' }, { status: 404 });
    }
    
    const existingRadio = existingRadios[0];

    // 2. Verificar el stream SOLO si la URL cambió
    let verificationData = {};
    if (validated.streamUrl && validated.streamUrl !== existingRadio.stream_url) {
      const verification = await verifyStreamStatus(validated.streamUrl);
      logger.info(`Stream verification for ${validated.name || existingRadio.name}: ${verification.status} - ${verification.details}`);
      verificationData = {
        last_verification_status: verification.status === 'EXTERNAL' ? 'ONLINE' : verification.status,
        last_verified_at: new Date().toISOString(),
      };
    }

    // 3. Actualizar radio con datos validados
    const existingMetadata = existingRadio.metadata as Record<string, any> || {};
    
    const updateData = {
      ...(validated.name && { name: validated.name }),
      ...(validated.streamUrl && { stream_url: validated.streamUrl }),
      ...(validated.streamPlatform && { platform: mapPlatformToEnum(validated.streamPlatform) }),
      ...(validated.region && { region: validated.region }),
      ...(validated.isActive !== undefined && {
        status: validated.isActive ? 'ACTIVE' : 'INACTIVE'
      }),
      ...(validated.genre && { description: validated.genre }),
      ...verificationData,
      metadata: {
        programadora: validated.programadora || existingMetadata.programadora || '',
        frequency: validated.frequency || existingMetadata.frequency || '',
        city: validated.city || existingMetadata.city || '',
        website: validated.website || existingMetadata.website || '',
        streamPlatform: validated.streamPlatform || existingMetadata.streamPlatform || 'direct',
        lastMonitored: validated.lastMonitored || existingMetadata.lastMonitored || 'Nunca',
      },
      updated_at: new Date().toISOString()
    };

    const updatedRadios = await supabaseDirect.request(`radios?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
      headers: { 'Prefer': 'return=representation' }
    });

    const updatedRadio = updatedRadios[0];

    // 4. DEVOLVEMOS EL OBJETO REAL DE LA BASE DE DATOS
    // Es más consistente y predecible. El frontend puede adaptarlo si es necesario.
    const metadata = updatedRadio.metadata as Record<string, any> || {};
    const transformedRadio = {
      id: updatedRadio.id,
      name: updatedRadio.name,
      programadora: metadata.programadora || '',
      frequency: metadata.frequency || '',
      streamUrl: updatedRadio.stream_url,
      streamPlatform: metadata.streamPlatform || updatedRadio.platform.toLowerCase(),
      region: updatedRadio.region,
      city: metadata.city || '',
      website: metadata.website || '',
      isActive: updatedRadio.status === 'ACTIVE',
      genre: updatedRadio.description || 'Música',
      lastMonitored: metadata.lastMonitored || 'Nunca',
      lastVerificationStatus: updatedRadio.last_verification_status,
      lastVerifiedAt: updatedRadio.last_verified_at,
    };
    
    return NextResponse.json({ 
      success: true, 
      data: transformedRadio,
      message: 'Radio actualizada exitosamente' 
    });
  } catch (error) {
    logger.error('Error actualizando radio:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}


// --- DELETE: Eliminar una radio por ID (Versión Segura) ---
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. AÑADIMOS LA VERIFICACIÓN DE SESIÓN
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;

    // Verificar que la radio existe
    const existingRadios = await supabaseDirect.request(`radios?select=*&id=eq.${id}`);
    if (existingRadios.length === 0) {
      return NextResponse.json({ success: false, error: 'Radio no encontrada' }, { status: 404 });
    }

    // 2. ELIMINAMOS LA RADIO
    await supabaseDirect.request(`radios?id=eq.${id}`, {
      method: 'DELETE'
    });
    return NextResponse.json({ 
      success: true, 
      message: 'Radio eliminada exitosamente' 
    });
  } catch (error: any) {
    logger.error('Error eliminando radio:', error);
    // Manejo de error por si la radio tiene relaciones que impiden borrarla
    if (error.message?.includes('foreign key constraint') || error.message?.includes('violates foreign key')) {
        return NextResponse.json({ success: false, error: 'No se puede eliminar la radio porque tiene sesiones de monitoreo asociadas.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
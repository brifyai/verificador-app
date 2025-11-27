import { NextRequest, NextResponse } from 'next/server';
import { supabaseDirect } from '@/lib/supabase-direct';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { logger } from '@/lib/logger';
import { RadioUpdateSchema } from '@/lib/schemas/radio.schema';
import { verifyStreamStatus } from '@/lib/stream-verifier';

// Función auxiliar
const mapPlatformToEnum = (platform: string): string => {
  const platformMap: Record<string, string> = {
    youtube: 'YOUTUBE',
    twitch: 'TWITCH',
    facebook: 'FACEBOOK',
    icecast: 'ICECAST',
    shoutcast: 'ICECAST',
    direct: 'HTTP_STREAM',
    http: 'HTTP_STREAM',
    rtmp: 'RTMP',
    centova: 'ICECAST',
    sonicpanel: 'ICECAST',
    azuracast: 'ICECAST',
  };
  return platformMap[platform.toLowerCase()] || 'OTHER';
};

// GET: Obtener una radio específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;

    const radios = await supabaseDirect.request(`radios?select=*&id=eq.${id}`);
    
    if (radios.length === 0) {
      return NextResponse.json({ success: false, error: 'Radio no encontrada' }, { status: 404 });
    }

    const radio = radios[0];
    const metadata = radio.metadata || {};

    const transformedRadio = {
      id: radio.id,
      name: radio.name,
      programadora: metadata.programadora || '',
      frequency: metadata.frequency || '',
      streamUrl: radio.stream_url,
      streamPlatform: metadata.stream_platform || radio.platform.toLowerCase(),
      region: radio.region,
      city: metadata.city || '',
      website: metadata.website || '',
      isActive: radio.status === 'ACTIVE',
      genre: radio.description || 'Música',
      priority: radio.priority || 1,
      costPerHour: radio.cost_per_hour || 0.0,
      lastMonitored: metadata.lastMonitored || 'Nunca',
      lastVerificationStatus: radio.last_verification_status || null,
      lastVerifiedAt: radio.last_verified_at || null,
      createdAt: radio.created_at,
      updatedAt: radio.updated_at,
    };

    return NextResponse.json({ success: true, data: transformedRadio });
  } catch (error) {
    logger.error('Error obteniendo radio:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT: Actualizar una radio por ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Verificar el stream SOLO si la URL cambió
    let verificationData = {};
    if (validated.streamUrl && validated.streamUrl !== existingRadio.stream_url) {
      const verification = await verifyStreamStatus(validated.streamUrl);
      logger.info(`Stream verification for ${validated.name || existingRadio.name}: ${verification.status} - ${verification.details}`);
      verificationData = {
        last_verification_status: verification.status,
        last_verified_at: new Date().toISOString(),
      };
    }

    // Preparar datos de actualización
    const existingMetadata = existingRadio.metadata || {};
    
    const updateData: any = {
      ...(validated.name && { name: validated.name }),
      ...(validated.streamUrl && { stream_url: validated.streamUrl }),
      ...(validated.streamPlatform && { platform: mapPlatformToEnum(validated.streamPlatform) }),
      ...(validated.region && { region: validated.region }),
      ...(validated.isActive !== undefined && {
        status: validated.isActive ? 'ACTIVE' : 'INACTIVE'
      }),
      ...(validated.genre && { description: validated.genre }),
      ...((validated as any).priority && { priority: (validated as any).priority }),
      ...((validated as any).costPerHour !== undefined && { cost_per_hour: (validated as any).costPerHour }),
      ...verificationData,
      metadata: {
        programadora: validated.programadora || existingMetadata.programadora || '',
        frequency: validated.frequency || existingMetadata.frequency || '',
        city: validated.city || existingMetadata.city || '',
        website: validated.website || existingMetadata.website || '',
        stream_platform: validated.streamPlatform || existingMetadata.stream_platform || 'direct',
        lastMonitored: validated.lastMonitored || existingMetadata.lastMonitored || 'Nunca',
      },
      updated_at: new Date().toISOString()
    };

    // Actualizar radio
    const updatedRadios = await supabaseDirect.request(
      `radios?id=eq.${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updateData),
        headers: { 'Prefer': 'return=representation' }
      }
    );

    const updatedRadio = updatedRadios[0];
    const metadata = updatedRadio.metadata || {};

    const transformedRadio = {
      id: updatedRadio.id,
      name: updatedRadio.name,
      programadora: metadata.programadora || '',
      frequency: metadata.frequency || '',
      streamUrl: updatedRadio.stream_url,
      streamPlatform: metadata.stream_platform || updatedRadio.platform.toLowerCase(),
      region: updatedRadio.region,
      city: metadata.city || '',
      website: metadata.website || '',
      isActive: updatedRadio.status === 'ACTIVE',
      genre: updatedRadio.description || 'Música',
      priority: updatedRadio.priority,
      costPerHour: updatedRadio.cost_per_hour,
      lastMonitored: metadata.lastMonitored || 'Nunca',
      lastVerificationStatus: updatedRadio.last_verification_status,
      lastVerifiedAt: updatedRadio.last_verified_at,
      createdAt: updatedRadio.created_at,
      updatedAt: updatedRadio.updated_at,
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

// DELETE: Eliminar una radio por ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;

    // Verificar que la radio existe
    const existingRadios = await supabaseDirect.request(`radios?select=id&status=eq.${id}`);
    
    if (existingRadios.length === 0) {
      return NextResponse.json({ success: false, error: 'Radio no encontrada' }, { status: 404 });
    }

    // Eliminar la radio
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
    if (error?.code === '23503') { // Foreign key violation
        return NextResponse.json({ success: false, error: 'No se puede eliminar la radio porque tiene sesiones de monitoreo asociadas.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { supabaseDirect } from '@/lib/supabase-direct';
import { logger } from '@/lib/logger';
import { verifyJWT } from '@/lib/jwt-simple';
import { mapPlatformToDbSmart, mapPlatformFromDbSmart } from '@/lib/platform-mapping-smart';

// GET: Obtener una radio específica por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificación de autenticación JWT
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (!token) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 });
    }

    const user = await verifyJWT(token);
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
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
      streamPlatform: metadata.stream_platform || mapPlatformFromDbSmart(radio.platform, metadata),
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificación de autenticación JWT
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (!token) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 });
    }

    const user = await verifyJWT(token);
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Verificar que la radio existe
    const existingRadios = await supabaseDirect.request(`radios?select=*&id=eq.${id}`);
    if (existingRadios.length === 0) {
      return NextResponse.json({ success: false, error: 'Radio no encontrada' }, { status: 404 });
    }
    
    const existingRadio = existingRadios[0];

    // Actualizar radio con datos validados
    const updateData: any = {
      ...(body.name && { name: body.name }),
      ...(body.streamUrl && { stream_url: body.streamUrl }),
      ...(body.region && { region: body.region }),
      ...(body.isActive !== undefined && {
        status: body.isActive ? 'ACTIVE' : 'INACTIVE'
      }),
      ...(body.genre && { description: body.genre }),
      updated_at: new Date().toISOString()
    };

    // Manejar plataforma con el sistema inteligente
    if (body.streamPlatform) {
      const platformMapping = mapPlatformToDbSmart(body.streamPlatform);
      updateData.platform = platformMapping.platform;
      
      // Si hay plataforma original que guardar en metadata
      if (platformMapping.originalPlatform) {
        updateData.metadata = updateData.metadata || {};
        updateData.metadata.original_platform = platformMapping.originalPlatform;
      }
    }

    // Actualizar metadata si hay campos adicionales
    const hasMetadataFields = body.programadora !== undefined ||
                             body.frequency !== undefined ||
                             body.city !== undefined ||
                             body.website !== undefined ||
                             body.streamPlatform !== undefined;

    if (hasMetadataFields) {
      const existingMetadata = existingRadio.metadata as Record<string, any> || {};
      updateData.metadata = {
        ...(existingMetadata || {}),
        ...(body.programadora !== undefined && { programadora: body.programadora }),
        ...(body.frequency !== undefined && { frequency: body.frequency }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.website !== undefined && { website: body.website }),
        ...(body.streamPlatform !== undefined && { stream_platform: body.streamPlatform }),
      };
    }

    const updatedRadios = await supabaseDirect.request(`radios?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
      headers: { 'Prefer': 'return=representation' }
    });

    const updatedRadio = updatedRadios[0];

    // Devolver objeto transformado
    const metadata = updatedRadio.metadata as Record<string, any> || {};
    const transformedRadio = {
      id: updatedRadio.id,
      name: updatedRadio.name,
      programadora: metadata.programadora || '',
      frequency: metadata.frequency || '',
      streamUrl: updatedRadio.stream_url,
      streamPlatform: mapPlatformFromDbSmart(updatedRadio.platform, updatedRadio.metadata as Record<string, any>),
      region: updatedRadio.region,
      city: metadata.city || '',
      website: metadata.website || '',
      isActive: updatedRadio.status === 'ACTIVE',
      genre: updatedRadio.description || 'Música',
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificación de autenticación JWT
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (!token) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 });
    }

    const user = await verifyJWT(token);
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { id } = params;

    // Verificar que la radio existe
    const existingRadios = await supabaseDirect.request(`radios?select=*&id=eq.${id}`);
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
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
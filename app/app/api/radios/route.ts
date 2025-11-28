import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseDirect } from '@/lib/supabase-direct';
import { logger } from '@/lib/logger';
import { RadioCreateSchema } from '@/lib/schemas/radio.schema';
import { z } from 'zod';
import { verifyStreamStatus } from '@/lib/stream-verifier';

// Función de utilidad para mapear plataformas a valores del enum de Supabase
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
  return platformMap[platform] || 'OTHER';
};


// --- GET: OBTENER RADIOS (VERSIÓN CORREGIDA Y FLEXIBLE) ---
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const context = searchParams.get('context');

    // CASO 1: Para la página "Configurar Nuevo Análisis"
    if (context === 'setup') {
      const radiosForSetup = await supabaseDirect.request(
        'radios?select=id,name,region&status=eq.ACTIVE&order=name.asc'
      );
      return NextResponse.json({ success: true, data: radiosForSetup });
    }

    // CASO 2: Para cualquier otra página
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Construir query para Supabase
    let query = 'radios?select=*&order=region.asc,name.asc';
    query += `&limit=${limit}&offset=${(page - 1) * limit}`;
    
    const radios = await supabaseDirect.request(query);

    // Obtener total de radios
    const countResult = await supabaseDirect.request('radios?select=count');
    const totalRadios = countResult[0]?.count || 0;

    const transformedRadios = radios.map((radio: any) => {
      const metadata = radio.metadata || {};
      return {
        id: radio.id,
        name: radio.name,
        programadora: metadata.programadora || '',
        frequency: metadata.frequency || '',
        streamUrl: radio.stream_url,
        streamPlatform: metadata.streamPlatform || radio.platform.toLowerCase(),
        region: radio.region,
        city: metadata.city || '',
        website: metadata.website || '',
        isActive: radio.status === 'ACTIVE',
        genre: radio.description || 'Música',
        lastMonitored: metadata.lastMonitored || 'Nunca',
        lastVerificationStatus: radio.last_verification_status || null,
        lastVerifiedAt: radio.last_verified_at || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedRadios,
      pagination: { total: totalRadios, page, limit, pages: Math.ceil(totalRadios / limit) }
    });

  } catch (error) {
    console.error('Error obteniendo radios:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}


// --- POST: CREAR UNA NUEVA RADIO (VERSIÓN CON AUTENTICACIÓN FLEXIBLE) ---
export async function POST(request: NextRequest) {
  try {
    // Intentar obtener sesión de NextAuth
    const session = await getServerSession(authOptions);
    
    // Si no hay sesión, verificar si hay API key en el header
    if (!session) {
      const apiKey = request.headers.get('x-api-key');
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      // Si no hay API key o no coincide con el service key, denegar acceso
      if (!apiKey || apiKey !== serviceKey) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    const body = await request.json();

    // Validar con Zod
    const validationResult = RadioCreateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Datos inválidos', 
        details: validationResult.error.errors 
      }, { status: 400 });
    }
    
    const validated = validationResult.data;

    // Verificar el stream antes de crear la radio (heurística unificada)
    const verification = await verifyStreamStatus(validated.streamUrl);
    logger.info(`Stream verification for ${validated.name}: ${verification.status} (${verification.streamType}) - ${verification.details}`);

    // Crear radio en Supabase
    const radioData = {
      name: validated.name,
      stream_url: validated.streamUrl,
      platform: validated.streamPlatform ? mapPlatformToEnum(validated.streamPlatform) : 'OTHER',
      region: validated.region,
      status: validated.isActive ? 'ACTIVE' : 'INACTIVE',
      description: validated.genre || 'Música',
      priority: (validated as any).priority || 1,
      cost_per_hour: (validated as any).costPerHour || 0.0,
      last_verification_status: verification.status === 'EXTERNAL' ? 'ONLINE' : verification.status,
      last_verified_at: new Date().toISOString(),
      metadata: {
        programadora: validated.programadora === null ? '' : (validated.programadora || validated.name),
        frequency: validated.frequency === null ? '' : (validated.frequency || ''),
        city: validated.city || validated.region,
        website: validated.website === null ? '' : (validated.website || ''),
        streamPlatform: validated.streamPlatform || 'direct',
        verification: {
          status: verification.status,
          streamType: verification.streamType,
          httpStatus: verification.httpStatus ?? null,
          contentType: verification.contentType ?? null,
          usedProxy: verification.usedProxy,
          method: verification.method,
          details: verification.details,
        }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newRadios = await supabaseDirect.request('radios', {
      method: 'POST',
      body: JSON.stringify(radioData),
      headers: { 'Prefer': 'return=representation' }
    });

    const newRadio = newRadios[0];

    // Transformar datos antes de devolver
    const metadata = newRadio.metadata || {};
    const transformedRadio = {
      id: newRadio.id,
      name: newRadio.name,
      programadora: metadata.programadora || '',
      frequency: metadata.frequency || '',
      streamUrl: newRadio.stream_url,
      streamPlatform: metadata.streamPlatform || newRadio.platform.toLowerCase(),
      region: newRadio.region,
      city: metadata.city || '',
      website: metadata.website || '',
      isActive: newRadio.status === 'ACTIVE',
      genre: newRadio.description || 'Música',
      lastMonitored: metadata.lastMonitored || 'Nunca',
      lastVerificationStatus: newRadio.last_verification_status,
      lastVerifiedAt: newRadio.last_verified_at,
    };

    return NextResponse.json({ success: true, data: transformedRadio }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creando radio:', error);
    // Verificar error de duplicado (constraint violation)
    if (error.message?.includes('duplicate') || error.message?.includes('already exists')) {
        return NextResponse.json({ success: false, error: 'Ya existe una radio con ese nombre y región.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}

// --- PUT: ACTUALIZAR UNA RADIO EXISTENTE ---
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID de radio requerido'
      }, { status: 400 });
    }

    // Validar con Zod (usando RadioUpdateSchema que ya existe)
    const { RadioUpdateSchema } = await import('@/lib/schemas/radio.schema');
    const validationResult = RadioUpdateSchema.safeParse(updateData);
    
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Datos inválidos',
        details: validationResult.error.errors
      }, { status: 400 });
    }
    
    const validated = validationResult.data;

    // Si se actualiza el streamUrl, verificar el stream
    let verification = null;
    if (validated.streamUrl) {
      verification = await verifyStreamStatus(validated.streamUrl);
      logger.info(`Stream verification for update: ${verification.status} (${verification.streamType}) - ${verification.details}`);
    }

    // Preparar datos para actualizar
    const updateFields: any = {};
    
    if (validated.name !== undefined) updateFields.name = validated.name;
    if (validated.streamUrl !== undefined) updateFields.stream_url = validated.streamUrl;
    if (validated.streamPlatform !== undefined) {
      updateFields.platform = validated.streamPlatform ? mapPlatformToEnum(validated.streamPlatform) : 'OTHER';
    }
    if (validated.region !== undefined) updateFields.region = validated.region;
    if (validated.isActive !== undefined) updateFields.status = validated.isActive ? 'ACTIVE' : 'INACTIVE';
    if (validated.genre !== undefined) updateFields.description = validated.genre;
    if ((validated as any).priority !== undefined) updateFields.priority = (validated as any).priority;
    if ((validated as any).costPerHour !== undefined) updateFields.cost_per_hour = (validated as any).costPerHour;
    
    // Actualizar metadata - siempre incluir campos opcionales para permitir borrado
    const metadataUpdates: any = {};
    
    // Si el campo está en el request, actualizarlo (preservar null para borrado real)
    if ('programadora' in validated) {
      metadataUpdates.programadora = validated.programadora; // Puede ser null, string o undefined
    }
    if ('frequency' in validated) {
      metadataUpdates.frequency = validated.frequency; // Puede ser null, string o undefined
    }
    if ('city' in validated) {
      metadataUpdates.city = validated.city;
    }
    if ('website' in validated) {
      metadataUpdates.website = validated.website; // Puede ser null, string o undefined
    }
    if ('streamPlatform' in validated) {
      metadataUpdates.streamPlatform = validated.streamPlatform;
    }
    
    if (verification) {
      metadataUpdates.verification = {
        status: verification.status,
        streamType: verification.streamType,
        httpStatus: verification.httpStatus ?? null,
        contentType: verification.contentType ?? null,
        usedProxy: verification.usedProxy,
        method: verification.method,
        details: verification.details,
      };
      updateFields.last_verification_status = verification.status === 'EXTERNAL' ? 'ONLINE' : verification.status;
      updateFields.last_verified_at = new Date().toISOString();
    }
    
    if (Object.keys(metadataUpdates).length > 0) {
      // Obtener metadata actual primero
      const currentRadio = await supabaseDirect.request(`radios?id=eq.${id}&select=metadata`);
      const currentMetadata = currentRadio[0]?.metadata || {};
      updateFields.metadata = { ...currentMetadata, ...metadataUpdates };
    }
    
    updateFields.updated_at = new Date().toISOString();

    const updatedRadios = await supabaseDirect.request(`radios?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateFields),
      headers: { 'Prefer': 'return=representation' }
    });

    if (!updatedRadios || updatedRadios.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Radio no encontrada'
      }, { status: 404 });
    }

    const updatedRadio = updatedRadios[0];
    const metadata = updatedRadio.metadata || {};

    // Transformar datos antes de devolver - preservar null/undefined para campos opcionales
    const transformedRadio = {
      id: updatedRadio.id,
      name: updatedRadio.name,
      programadora: metadata.programadora ?? null,
      frequency: metadata.frequency ?? null,
      streamUrl: updatedRadio.stream_url,
      streamPlatform: metadata.streamPlatform ?? updatedRadio.platform.toLowerCase(),
      region: updatedRadio.region,
      city: metadata.city ?? null,
      website: metadata.website ?? null,
      isActive: updatedRadio.status === 'ACTIVE',
      genre: updatedRadio.description ?? 'Música',
      priority: updatedRadio.priority ?? 1,
      costPerHour: updatedRadio.cost_per_hour ?? 0.0,
      lastMonitored: metadata.lastMonitored ?? 'Nunca',
      lastVerificationStatus: updatedRadio.last_verification_status,
      lastVerifiedAt: updatedRadio.last_verified_at,
      createdAt: updatedRadio.created_at,
      updatedAt: updatedRadio.updated_at,
    };

    return NextResponse.json({ success: true, data: transformedRadio });
  } catch (error: any) {
    logger.error('Error actualizando radio:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}


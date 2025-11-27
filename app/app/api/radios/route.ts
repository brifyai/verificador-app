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


// --- POST: CREAR UNA NUEVA RADIO (VERSIÓN CORREGIDA) ---
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
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
      last_verification_status: verification.status === 'EXTERNAL' ? 'ONLINE' : verification.status,
      last_verified_at: new Date().toISOString(),
      metadata: {
        programadora: validated.programadora || validated.name,
        frequency: validated.frequency || '',
        city: validated.city || validated.region,
        website: validated.website || '',
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


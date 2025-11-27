import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseDirect } from '@/lib/supabase-direct';
import { logger } from '@/lib/logger';
import { verifyStreamStatus } from '@/lib/stream-verifier';
import { RadioCreateSchema } from '@/lib/schemas/radio.schema';

// Función de utilidad
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
  return platformMap[platform] || 'OTHER';
};

// GET: Obtener radios
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
      const radios = await supabaseDirect.request(
        'radios?select=id,name,region&status=eq.ACTIVE&order=name.asc'
      );
      return NextResponse.json({ success: true, data: radios });
    }

    // CASO 2: Para cualquier otra página
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Obtener total de radios
    const allRadios = await supabaseDirect.request('radios?select=id');
    const totalRadios = allRadios.length;

    // Obtener radios paginadas
    const radios = await supabaseDirect.request(
      `radios?order=region.asc,name.asc&limit=${limit}&offset=${(page - 1) * limit}`
    );

    const transformedRadios = radios.map((radio: any) => {
      const metadata = radio.metadata || {};
      return {
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
        lastMonitored: metadata.last_monitored || 'Nunca',
        lastVerificationStatus: radio.last_verification_status || null,
        lastVerifiedAt: radio.last_verified_at || null,
        createdAt: radio.created_at,
        updatedAt: radio.updated_at,
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

// POST: Crear una nueva radio
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

    // Verificar el stream antes de crear la radio
    const verification = await verifyStreamStatus(validated.streamUrl);
    logger.info(`Stream verification for ${validated.name}: ${verification.status} (${verification.streamType}) - ${verification.details}`);

    // Crear metadata
    const metadata = {
      programadora: validated.programadora || validated.name,
      frequency: validated.frequency || '',
      city: validated.city || validated.region,
      website: validated.website || '',
      stream_platform: validated.streamPlatform || 'direct',
      verification: {
        status: verification.status,
        stream_type: verification.streamType,
        http_status: verification.httpStatus ?? null,
        content_type: verification.contentType ?? null,
        used_proxy: verification.usedProxy,
        method: verification.method,
        details: verification.details,
      }
    };

    const newRadioData = {
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
      metadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newRadio = await supabaseDirect.request('radios', {
      method: 'POST',
      body: JSON.stringify(newRadioData),
      headers: { 'Prefer': 'return=representation' }
    });

    // Transformar datos antes de devolver
    const transformedRadio = {
      id: newRadio[0].id,
      name: newRadio[0].name,
      programadora: metadata.programadora,
      frequency: metadata.frequency,
      streamUrl: newRadio[0].stream_url,
      streamPlatform: metadata.stream_platform,
      region: newRadio[0].region,
      city: metadata.city,
      website: metadata.website,
      isActive: newRadio[0].status === 'ACTIVE',
      genre: newRadio[0].description,
      priority: newRadio[0].priority,
      costPerHour: newRadio[0].cost_per_hour,
      lastMonitored: (metadata as any).lastMonitored || 'Nunca',
      lastVerificationStatus: newRadio[0].last_verification_status,
      lastVerifiedAt: newRadio[0].last_verified_at,
      createdAt: newRadio[0].created_at,
      updatedAt: newRadio[0].updated_at,
    };

    return NextResponse.json({ success: true, data: transformedRadio }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creando radio:', error);
    if (error?.code === '23505') { // Unique violation en PostgreSQL
        return NextResponse.json({ success: false, error: 'Ya existe una radio con ese nombre y región.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
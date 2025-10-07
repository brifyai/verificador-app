import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { Platform, RadioStatus } from '@prisma/client';
import { RadioCreateSchema } from '@/lib/schemas/radio.schema';
import { z } from 'zod';
import { verifyStreamStatus } from '@/lib/stream-verifier';

// Función de utilidad (sin cambios)
const mapPlatformToEnum = (platform: string): Platform => {
  const platformMap: Record<string, Platform> = {
    youtube: Platform.YOUTUBE,
    twitch: Platform.TWITCH,
    facebook: Platform.FACEBOOK,
    icecast: Platform.ICECAST,
    shoutcast: Platform.ICECAST,
    direct: Platform.HTTP_STREAM,
    http: Platform.HTTP_STREAM,
    rtmp: Platform.RTMP,
    centova: Platform.ICECAST,
    sonicpanel: Platform.ICECAST,
    azuracast: Platform.ICECAST,
  };
  return platformMap[platform] || Platform.OTHER;
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
      const radiosForSetup = await prisma.radio.findMany({
        where: { status: RadioStatus.ACTIVE },
        select: {
          id: true,   // Devuelve el CUID real y correcto de la base de datos
          name: true,
          region: true,
        },
        orderBy: { name: 'asc' },
      });
      return NextResponse.json({ success: true, data: radiosForSetup });
    }

    // CASO 2: Para cualquier otra página (la lógica que ya tenías)
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    // ... aquí puedes volver a añadir tus otros filtros (search, region, etc.)
    const where = {};
    
    const totalRadios = await prisma.radio.count({ where });
    const radios = await prisma.radio.findMany({
      where,
      orderBy: [{ region: 'asc' }, { name: 'asc' }],
      skip: (page - 1) * limit,
      take: limit
    });

    const transformedRadios = radios.map((radio) => {
      const metadata = radio.metadata as Record<string, any> || {};
      return {
        id: radio.id,
        name: radio.name,
        programadora: metadata.programadora || '',
        frequency: metadata.frequency || '',
        streamUrl: radio.streamUrl,
        streamPlatform: metadata.streamPlatform || radio.platform.toLowerCase(),
        region: radio.region,
        city: metadata.city || '',
        website: metadata.website || '',
        isActive: radio.status === RadioStatus.ACTIVE,
        genre: radio.description || 'Música',
        lastMonitored: metadata.lastMonitored || 'Nunca',
        lastVerificationStatus: (radio as any).lastVerificationStatus || null,
        lastVerifiedAt: (radio as any).lastVerifiedAt || null,
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

    const newRadio = await prisma.radio.create({
      data: {
        name: validated.name,
        streamUrl: validated.streamUrl,
        platform: validated.streamPlatform ? mapPlatformToEnum(validated.streamPlatform) : Platform.OTHER,
        region: validated.region,
        status: validated.isActive ? RadioStatus.ACTIVE : RadioStatus.INACTIVE,
        description: validated.genre || 'Música',
        lastVerificationStatus: verification.status === 'EXTERNAL' ? 'ONLINE' : verification.status,
        lastVerifiedAt: new Date(),
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
      },
    });

    // ✅ CORRECCIÓN: Transformar datos antes de devolver
    const metadata = newRadio.metadata as Record<string, any> || {};
    const transformedRadio = {
      id: newRadio.id,
      name: newRadio.name,
      programadora: metadata.programadora || '',
      frequency: metadata.frequency || '',
      streamUrl: newRadio.streamUrl,
      streamPlatform: metadata.streamPlatform || newRadio.platform.toLowerCase(),
      region: newRadio.region,
      city: metadata.city || '',
      website: metadata.website || '',
      isActive: newRadio.status === RadioStatus.ACTIVE,
      genre: newRadio.description || 'Música',
      lastMonitored: metadata.lastMonitored || 'Nunca',
      lastVerificationStatus: newRadio.lastVerificationStatus,
      lastVerifiedAt: newRadio.lastVerifiedAt,
    };

    return NextResponse.json({ success: true, data: transformedRadio }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creando radio:', error);
    if (error?.code === 'P2002') {
        return NextResponse.json({ success: false, error: 'Ya existe una radio con ese nombre y región.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}


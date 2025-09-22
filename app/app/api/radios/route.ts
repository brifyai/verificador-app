import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Platform, RadioStatus } from '@prisma/client';
import { mockRadios } from '@/lib/mock-data';

const prisma = new PrismaClient();

// Variable para controlar el uso de datos mock
const USE_MOCK = process.env.USE_MOCK_DATA === 'true';

// Mapear plataformas del frontend al enum de Prisma
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

// GET - Obtener todas las radios
export async function GET(request: NextRequest) {
  try {
    if (USE_MOCK) {
      return NextResponse.json({
        success: true,
        data: mockRadios,
        count: mockRadios.length,
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const region = searchParams.get('region');
    const platformFilter = searchParams.get('platform');
    const active = searchParams.get('active');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (region && region !== 'all') where.region = region;
    if (platformFilter && platformFilter !== 'all') {
      where.platform = mapPlatformToEnum(platformFilter);
    }
    if (active !== null) {
      where.status =
        active === 'true' ? RadioStatus.ACTIVE : RadioStatus.INACTIVE;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { region: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Obtener el total de registros para la paginación
    const totalRadios = await prisma.radio.count({
      where
    });

    const radios = await prisma.radio.findMany({
      where,
      orderBy: [{ region: 'asc' }, { name: 'asc' }],
      skip,
      take: limit
    });

    const transformedRadios = radios.map((radio) => ({
      id: radio.id,
      name: radio.name,
      programadora: radio.metadata?.programadora || '',
      frequency: radio.metadata?.frequency || '',
      streamUrl: radio.streamUrl,
      streamPlatform:
        radio.metadata?.streamPlatform || radio.platform.toLowerCase(),
      region: radio.region,
      city: radio.metadata?.city || '',
      website: radio.metadata?.website || '',
      isActive: radio.status === RadioStatus.ACTIVE,
      lastMonitored: radio.metadata?.lastMonitored || 'Nunca',
      genre: radio.metadata?.genre || 'Música',
      pricePerDetection: radio.metadata?.pricePerDetection || 0,
      pricingRuleId: radio.metadata?.pricingRuleId || null,
      priceHistory: radio.metadata?.priceHistory || [],
      createdAt: radio.createdAt
    }));

    return NextResponse.json({
      success: true,
      data: transformedRadios,
      count: transformedRadios.length,
      pagination: {
        total: totalRadios,
        page,
        limit,
        pages: Math.ceil(totalRadios / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo radios:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

// POST - Crear radio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id || !body.name || !body.streamUrl) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios: id, name, streamUrl' },
        { status: 400 },
      );
    }

    const newRadio = await prisma.radio.create({
      data: {
        id: body.id,
        name: body.name,
        streamUrl: body.streamUrl,
        platform: body.streamPlatform
          ? mapPlatformToEnum(body.streamPlatform)
          : Platform.OTHER,
        region: body.region,
        city: body.city,
        status: body.isActive ? RadioStatus.ACTIVE : RadioStatus.INACTIVE,
        description: body.genre || '',
        metadata: {
          programadora: body.programadora,
          frequency: body.frequency,
          platformData: body.platformData,
          lastMonitored: body.lastMonitored,
        },
      },
    });

    return NextResponse.json({ success: true, data: newRadio }, { status: 201 });
  } catch (error) {
    console.error('Error creando radio:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

// PUT - Editar radio
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Falta el campo obligatorio: id' },
        { status: 400 },
      );
    }

    const updatedRadio = await prisma.radio.update({
      where: { id: body.id },
      data: {
        name: body.name,
        streamUrl: body.streamUrl,
        platform: body.streamPlatform
          ? mapPlatformToEnum(body.streamPlatform)
          : undefined,
        region: body.region,
        city: body.city,
        status:
          body.isActive !== undefined
            ? body.isActive
              ? RadioStatus.ACTIVE
              : RadioStatus.INACTIVE
            : undefined,
        description: body.genre,
        metadata: {
          programadora: body.programadora,
          frequency: body.frequency,
          platformData: body.platformData,
          lastMonitored: body.lastMonitored,
        },
      },
    });

    return NextResponse.json({ success: true, data: updatedRadio });
  } catch (error) {
    console.error('Error actualizando radio:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

// DELETE - Eliminar radio
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Falta el parámetro: id' },
        { status: 400 },
      );
    }

    await prisma.radio.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Radio eliminada' });
  } catch (error) {
    console.error('Error eliminando radio:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

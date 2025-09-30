import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient, Platform, RadioStatus } from '@prisma/client';
import { mockRadios } from '@/lib/mock-data';
const prisma = new PrismaClient();

// Variable para controlar el uso de datos mock (por defecto false para usar datos reales)
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


// En app/api/radios/route.ts

// ... (tus imports y la función mapPlatformToEnum se mantienen igual)

// GET - Obtener todas las radios (VERSIÓN FLEXIBLE Y CORREGIDA)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const context = searchParams.get('context');

    // --- NUEVA LÓGICA ---
    // Si la URL es /api/radios?context=setup, entra aquí
    if (context === 'setup') {
      const radiosForSetup = await prisma.radio.findMany({
        where: { status: RadioStatus.ACTIVE },
        select: {
          id: true,   // El CUID real de la base de datos
          name: true,
          region: true,
        },
        orderBy: { name: 'asc' },
      });
      // Devolvemos solo los datos básicos y correctos para la página de configuración
      return NextResponse.json({ success: true, data: radiosForSetup });
    }
    // --- FIN DE LA NUEVA LÓGICA ---


    // --- LÓGICA ORIGINAL (para la otra página) ---
    // Si la URL no tiene ?context=setup, el código continúa ejecutándose como antes.
    if (USE_MOCK) {
      // ... tu lógica de mock
    }

    // ... toda tu lógica original de filtros y paginación ...
    const region = searchParams.get('region');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    // ... etc.
    
    const where: any = { /* ... tus filtros ... */ };
    
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
        id: radio.id, // MUY IMPORTANTE: Asegurarnos de que el ID real siempre se envíe
        name: radio.name,
        // ... el resto de tu transformación original ...
        programadora: metadata.programadora || '',
        frequency: metadata.frequency || '',
        streamUrl: radio.streamUrl,
        streamPlatform: metadata.streamPlatform || radio.platform.toLowerCase(),
        region: radio.region,
        city: metadata.city || '',
        website: metadata.website || '',
        isActive: radio.status === RadioStatus.ACTIVE,
        // ... etc.
      };
    });

    // Devolvemos la data compleja que la otra página necesita
    return NextResponse.json({
      success: true,
      data: transformedRadios,
      pagination: { /* ... */ }
    });

  } catch (error) {
    console.error('Error obteniendo radios:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}

// ... Las funciones POST, PUT y DELETE se mantienen por ahora ...

// POST - Crear radio
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

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
        status: body.isActive ? RadioStatus.ACTIVE : RadioStatus.INACTIVE,
        description: body.genre || '',
        metadata: {
          programadora: body.programadora,
          frequency: body.frequency,
          city: body.city,
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
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

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
          city: body.city,
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
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

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

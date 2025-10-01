import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db'; // CORRECTO: Usar la instancia centralizada de Prisma
import { Platform, RadioStatus } from '@prisma/client';

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
        id: radio.id, // Siempre devolvemos el CUID real
        name: radio.name,
        programadora: metadata.programadora || '',
        frequency: metadata.frequency || '',
        streamUrl: radio.streamUrl,
        streamPlatform: metadata.streamPlatform || radio.platform.toLowerCase(),
        region: radio.region,
        city: metadata.city || '',
        website: metadata.website || '',
        isActive: radio.status === RadioStatus.ACTIVE,
        // ... el resto de campos que necesites
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

    // CORRECCIÓN: Ya no pedimos un 'id'. Solo los datos necesarios.
    if (!body.name || !body.streamUrl) {
      return NextResponse.json({ success: false, error: 'Faltan campos obligatorios: name y streamUrl' }, { status: 400 });
    }

    const newRadio = await prisma.radio.create({
      data: {
        // CORRECCIÓN: No hay 'id' aquí. Prisma lo generará automáticamente.
        name: body.name,
        streamUrl: body.streamUrl,
        platform: body.streamPlatform ? mapPlatformToEnum(body.streamPlatform) : Platform.OTHER,
        region: body.region,
        status: body.isActive ? RadioStatus.ACTIVE : RadioStatus.INACTIVE,
        description: body.genre || '',
        metadata: {
          programadora: body.programadora,
          frequency: body.frequency,
          city: body.city,
        },
      },
    });

    return NextResponse.json({ success: true, data: newRadio }, { status: 201 });
  } catch (error) {
    console.error('Error creando radio:', error);
    if (error.code === 'P2002') {
        return NextResponse.json({ success: false, error: 'Ya existe una radio con ese nombre y región.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}


// --- PUT: ACTUALIZAR UNA RADIO (VERSIÓN CORREGIDA) ---
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Falta el campo obligatorio: id' }, { status: 400 });
    }

    // Separamos el 'id' para asegurar que no se intente modificar
    const { id, ...updateData } = body;

    const updatedRadio = await prisma.radio.update({
      where: { id: id },
      data: {
        name: updateData.name,
        streamUrl: updateData.streamUrl,
        platform: updateData.streamPlatform ? mapPlatformToEnum(updateData.streamPlatform) : undefined,
        region: updateData.region,
        status: updateData.isActive !== undefined ? (updateData.isActive ? RadioStatus.ACTIVE : RadioStatus.INACTIVE) : undefined,
        description: updateData.genre,
        metadata: {
          programadora: updateData.programadora,
          frequency: updateData.frequency,
          city: updateData.city,
        },
      },
    });

    return NextResponse.json({ success: true, data: updatedRadio });
  } catch (error) {
    console.error('Error actualizando radio:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}


// --- DELETE: ELIMINAR UNA RADIO (Sin cambios necesarios) ---
export async function DELETE(request: NextRequest) {
    // Tu código DELETE original puede permanecer aquí, ya es correcto.
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Falta el parámetro: id' }, { status: 400 });
    }

    await prisma.radio.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Radio eliminada' });
  } catch (error) {
    console.error('Error eliminando radio:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
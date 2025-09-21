import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE - Eliminar radio por ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Falta el parámetro: id' },
        { status: 400 },
      );
    }

    // Verificar si la radio existe
    const existingRadio = await prisma.radio.findUnique({
      where: { id }
    });

    if (!existingRadio) {
      return NextResponse.json(
        { success: false, error: 'Radio no encontrada' },
        { status: 404 },
      );
    }

    // Eliminar la radio
    await prisma.radio.delete({ where: { id } });

    return NextResponse.json({ 
      success: true, 
      message: 'Radio eliminada exitosamente' 
    });
  } catch (error) {
    console.error('Error eliminando radio:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

// PUT - Actualizar radio por ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Falta el parámetro: id' },
        { status: 400 },
      );
    }

    // Verificar si la radio existe
    const existingRadio = await prisma.radio.findUnique({
      where: { id }
    });

    if (!existingRadio) {
      return NextResponse.json(
        { success: false, error: 'Radio no encontrada' },
        { status: 404 },
      );
    }

    // Preparar los metadatos actualizados
    const currentMetadata = existingRadio.metadata || {};
    const updatedMetadata = {
      ...currentMetadata,
      programadora: body.programadora,
      frequency: body.frequency,
      streamPlatform: body.streamPlatform,
      lastMonitored: body.lastMonitored || currentMetadata.lastMonitored,
      genre: body.genre,
      website: body.website,
      city: body.city, // Aseguramos que city esté en metadata también
    };

    // Actualizar la radio
    const updatedRadio = await prisma.radio.update({
      where: { id },
      data: {
        name: body.name,
        streamUrl: body.streamUrl,
        platform: body.streamPlatform ? mapPlatformToEnum(body.streamPlatform) : existingRadio.platform,
        region: body.region,
        status: body.isActive !== undefined ? (body.isActive ? 'ACTIVE' : 'INACTIVE') : existingRadio.status,
        description: body.genre || existingRadio.description,
        metadata: updatedMetadata,
      },
    });

    // Transformar la respuesta para el frontend
    const transformedRadio = {
      id: updatedRadio.id,
      name: updatedRadio.name,
      programadora: updatedRadio.metadata?.programadora || '',
      frequency: updatedRadio.metadata?.frequency || '',
      streamUrl: updatedRadio.streamUrl,
      streamPlatform: updatedRadio.metadata?.streamPlatform || updatedRadio.platform.toLowerCase(),
      region: updatedRadio.region,
      city: updatedRadio.metadata?.city || '',
      website: updatedRadio.metadata?.website || '',
      isActive: updatedRadio.status === 'ACTIVE',
      lastMonitored: updatedRadio.metadata?.lastMonitored || 'Nunca',
      genre: updatedRadio.metadata?.genre || 'Música',
    };

    return NextResponse.json({ 
      success: true, 
      data: transformedRadio,
      message: 'Radio actualizada exitosamente' 
    });
  } catch (error) {
    console.error('Error actualizando radio:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

// Función auxiliar para mapear plataformas
const mapPlatformToEnum = (platform: string) => {
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
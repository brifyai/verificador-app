import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Platform } from '@prisma/client';

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
    const currentMetadata = existingRadio.metadata as Record<string, any> || {};
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
    const metadata = updatedRadio.metadata as Record<string, any> || {};
    const transformedRadio = {
      id: updatedRadio.id,
      name: updatedRadio.name,
      programadora: metadata.programadora || '',
      frequency: metadata.frequency || '',
      streamUrl: updatedRadio.streamUrl,
      streamPlatform: metadata.streamPlatform || updatedRadio.platform.toLowerCase(),
      region: updatedRadio.region,
      city: metadata.city || '',
      website: metadata.website || '',
      isActive: updatedRadio.status === 'ACTIVE',
      lastMonitored: metadata.lastMonitored || 'Nunca',
      genre: metadata.genre || 'Música',
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
  return platformMap[platform.toLowerCase()] || Platform.OTHER;
};
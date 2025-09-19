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

    // Actualizar la radio
    const updatedRadio = await prisma.radio.update({
      where: { id },
      data: {
        name: body.name,
        streamUrl: body.streamUrl,
        region: body.region,
        city: body.city,
        status: body.isActive ? 'ACTIVE' : 'INACTIVE',
        description: body.genre,
        metadata: {
          programadora: body.programadora,
          frequency: body.frequency,
          streamPlatform: body.streamPlatform,
          lastMonitored: body.lastMonitored,
          genre: body.genre,
          website: body.website,
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: updatedRadio,
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
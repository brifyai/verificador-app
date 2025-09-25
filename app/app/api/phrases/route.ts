
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};
    
    if (search) {
      where.OR = [
        { phrase: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { campaign: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.category = category;
    }

    if (status === 'active') {
      where.active = true;
    } else if (status === 'inactive') {
      where.active = false;
    }

    // Obtener frases con paginación
    const [phrases, totalCount] = await Promise.all([
      prisma.phrase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { detections: true }
          }
        }
      }),
      prisma.phrase.count({ where })
    ]);

    // Formatear datos para compatibilidad con el frontend
    const formattedPhrases = phrases.map(phrase => ({
      id: phrase.id,
      phrase: phrase.phrase,
      marca: phrase.brand,
      campaña: phrase.campaign || 'Sin campaña',
      categoria: phrase.category.toLowerCase(),
      descripcion: phrase.description || '',
      uploaded: phrase.createdAt.toLocaleDateString('es-CL'),
      active: phrase.active,
      detections: phrase._count.detections,
      priority: phrase.priority,
      confidence: phrase.confidence
    }));

    // Obtener estadísticas
    const stats = await prisma.phrase.groupBy({
      by: ['active'],
      _count: true
    });

    const totalPhrases = totalCount;
    const activePhrases = stats.find(s => s.active === true)?._count || 0;
    const inactivePhrases = stats.find(s => s.active === false)?._count || 0;

    return NextResponse.json({
      success: true,
      phrases: formattedPhrases,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      stats: {
        total: totalPhrases,
        active: activePhrases,
        inactive: inactivePhrases
      }
    });
  } catch (error) {
    console.error('Error getting phrases:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phrase, marca, campaña, categoria, descripcion } = body;

    // Validación básica
    if (!phrase?.trim() || !marca?.trim()) {
      return NextResponse.json(
        { error: 'Frase y marca son requeridos' },
        { status: 400 }
      );
    }

    // Mapear categoría del frontend al enum de Prisma
    const categoryMap: { [key: string]: string } = {
      'producto': 'PRODUCT',
      'servicio': 'SERVICE',
      'promocion': 'PROMOTION',
      'evento': 'EVENT',
      'marca': 'BRAND',
      'institucional': 'INSTITUTIONAL'
    };

    const mappedCategory = categoryMap[categoria?.toLowerCase()] || 'PRODUCT';

    // Crear nueva frase en la base de datos
    const newPhrase = await prisma.phrase.create({
      data: {
        phrase: phrase.trim(),
        brand: marca.trim(),
        campaign: campaña?.trim() || null,
        category: mappedCategory as any,
        description: descripcion?.trim() || null,
        active: true,
        confidence: 0.85,
        priority: 1
      }
    });

    console.log(`📝 Nueva frase agregada: "${newPhrase.phrase}" - Marca: ${newPhrase.brand}`);

    // Formatear respuesta para compatibilidad con el frontend
    const formattedPhrase = {
      id: newPhrase.id,
      phrase: newPhrase.phrase,
      marca: newPhrase.brand,
      campaña: newPhrase.campaign || 'Sin campaña',
      categoria: newPhrase.category.toLowerCase(),
      descripcion: newPhrase.description || '',
      uploaded: newPhrase.createdAt.toLocaleDateString('es-CL'),
      active: newPhrase.active
    };

    return NextResponse.json({
      success: true,
      message: 'Frase agregada exitosamente',
      phrase: formattedPhrase
    });
  } catch (error) {
    console.error('Error adding phrase:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, active, phrase, brand, campaign, category, description } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de frase es requerido' },
        { status: 400 }
      );
    }

    // Preparar datos para actualizar
    const updateData: any = {};
    
    // Si solo se está actualizando el estado active
    if (active !== undefined && Object.keys(body).length === 2) {
      updateData.active = active;
    } else {
      // Actualización completa de la frase
      if (phrase !== undefined) updateData.phrase = phrase;
      if (brand !== undefined) updateData.brand = brand;
      if (campaign !== undefined) updateData.campaign = campaign;
      if (category !== undefined) updateData.category = category.toUpperCase();
      if (description !== undefined) updateData.description = description;
      if (active !== undefined) updateData.active = active;
    }

    // Buscar y actualizar la frase en la base de datos
    const updatedPhrase = await prisma.phrase.update({
      where: { id },
      data: updateData
    });

    if (!updatedPhrase) {
      return NextResponse.json(
        { error: 'Frase no encontrada' },
        { status: 404 }
      );
    }
    
    const isToggleOnly = active !== undefined && Object.keys(body).length === 2;
    const logMessage = isToggleOnly 
      ? `🔄 Frase ${active ? 'activada' : 'desactivada'}: "${updatedPhrase.phrase}"`
      : `✏️ Frase editada: "${updatedPhrase.phrase}"`;
    
    console.log(logMessage);

    // Formatear respuesta para compatibilidad con el frontend
    const formattedPhrase = {
      id: updatedPhrase.id,
      phrase: updatedPhrase.phrase,
      marca: updatedPhrase.brand,
      campaña: updatedPhrase.campaign || 'Sin campaña',
      categoria: updatedPhrase.category.toLowerCase(),
      descripcion: updatedPhrase.description || '',
      uploaded: updatedPhrase.createdAt.toLocaleDateString('es-CL'),
      active: updatedPhrase.active
    };

    const successMessage = isToggleOnly 
      ? `Frase ${active ? 'activada' : 'desactivada'} exitosamente`
      : 'Frase editada exitosamente';

    return NextResponse.json({
      success: true,
      message: successMessage,
      phrase: formattedPhrase
    });
  } catch (error) {
    console.error('Error updating phrase:', error);
    
    // Manejar error específico de registro no encontrado
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Frase no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Agregar método DELETE para eliminar frases
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de frase es requerido' },
        { status: 400 }
      );
    }

    // Eliminar la frase de la base de datos
    const deletedPhrase = await prisma.phrase.delete({
      where: { id }
    });

    console.log(`🗑️ Frase eliminada: "${deletedPhrase.phrase}"`);

    return NextResponse.json({
      success: true,
      message: 'Frase eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting phrase:', error);
    
    // Manejar error específico de registro no encontrado
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Frase no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

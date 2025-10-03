import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET no necesita cambios, ya funciona bien.


// En /api/phrases/route.ts

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // ... (la lógica de paginación y filtros se mantiene igual)
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { phrase: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { campaign: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (category && category !== 'all') where.category = category;
    if (status === 'active') where.active = true;
    else if (status === 'inactive') where.active = false;

    // FIX: Crear un mapa para traducir el ENUM de la DB al valor del Frontend
    const categoryEnumMap: { [key: string]: string } = {
        'PRODUCT': 'producto',
        'SERVICE': 'servicio',
        'PROMOTION': 'promocion',
        'EVENT': 'evento',
        'BRAND': 'marca',
        'INSTITUTIONAL': 'institucional'
    };

    const [phrases, totalCount] = await prisma.$transaction([
      prisma.phrase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { detections: true } } }
      }),
      prisma.phrase.count({ where })
    ]);

    const formattedPhrases = phrases.map(p => ({
      id: p.id,
      phrase: p.phrase,
      marca: p.brand,
      campaña: p.campaign || '',
      // FIX: Usar el mapa para obtener el valor correcto en español
      categoria: categoryEnumMap[p.category] || 'producto',
      descripcion: p.description || '',
      uploaded: new Date(p.createdAt).toLocaleDateString('es-CL'),
      active: p.active,
      detections: p._count.detections
    }));

    const [activeCount, inactiveCount] = await prisma.$transaction([
        prisma.phrase.count({ where: { active: true } }),
        prisma.phrase.count({ where: { active: false } })
    ]);

    return NextResponse.json({
      success: true,
      phrases: formattedPhrases,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      stats: {
        total: activeCount + inactiveCount,
        active: activeCount,
        inactive: inactiveCount,
      }
    });
  } catch (error) {
    console.error('Error getting phrases:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST está mayormente bien, solo ajustamos la respuesta.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phrase, marca, campaña, categoria, descripcion } = body;

    if (!phrase?.trim() || !marca?.trim()) {
      return NextResponse.json({ success: false, error: 'Frase y marca son requeridos' }, { status: 400 });
    }
    
    // FIX: Mapeo de categoría consistente.
    const categoryMap: { [key: string]: string } = {
      'producto': 'PRODUCT', 'servicio': 'SERVICE', 'promocion': 'PROMOTION',
      'evento': 'EVENT', 'marca': 'BRAND', 'institucional': 'INSTITUTIONAL'
    };
    const mappedCategory = categoryMap[categoria?.toLowerCase()] || 'PRODUCT';

    const newPhrase = await prisma.phrase.create({
      data: {
        phrase: phrase.trim(),
        brand: marca.trim(),
        campaign: campaña?.trim() || null,
        category: mappedCategory as any,
        description: descripcion?.trim() || null,
      }
    });

    return NextResponse.json({ success: true, phrase: newPhrase }, { status: 201 });
  } catch (error) {
    console.error('Error adding phrase:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}

// FIX: Creamos una función PUT dedicada para la edición.
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, phrase, marca, campaña, categoria, descripcion } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de frase es requerido' }, { status: 400 });
    }

    const categoryMap: { [key: string]: string } = {
      'producto': 'PRODUCT', 'servicio': 'SERVICE', 'promocion': 'PROMOTION',
      'evento': 'EVENT', 'marca': 'BRAND', 'institucional': 'INSTITUTIONAL'
    };
    const mappedCategory = categoryMap[categoria?.toLowerCase()] || 'PRODUCT';

    const updatedPhrase = await prisma.phrase.update({
      where: { id },
      data: {
        phrase: phrase.trim(),
        brand: marca.trim(),
        campaign: campaña?.trim() || null,
        category: mappedCategory as any,
        description: descripcion?.trim() || null,
      }
    });

    return NextResponse.json({ success: true, phrase: updatedPhrase });
  } catch (error) {
    console.error('Error updating phrase:', error);
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Frase no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}

// FIX: Simplificamos PATCH para que SOLO cambie el estado active.
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, active } = body;

    if (!id || typeof active !== 'boolean') {
      return NextResponse.json({ success: false, error: 'ID y estado active son requeridos' }, { status: 400 });
    }

    const updatedPhrase = await prisma.phrase.update({
      where: { id },
      data: { active }
    });

    return NextResponse.json({ success: true, phrase: updatedPhrase });
  } catch (error) {
    console.error('Error toggling phrase status:', error);
    if ((error as any).code === 'P2025') {
        return NextResponse.json({ success: false, error: 'Frase no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE no necesita cambios, ya funciona bien.
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de frase es requerido' }, { status: 400 });
    }

    await prisma.phrase.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Frase eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting phrase:', error);
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Frase no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
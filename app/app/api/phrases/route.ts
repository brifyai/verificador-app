import { NextRequest, NextResponse } from 'next/server';
import { supabaseDirect } from '@/lib/supabase-direct';

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

    // Construir query para Supabase
    let query = `phrases?select=*&order=created_at.desc&limit=${limit}&offset=${skip}`;
    
    if (search) {
      query += `&or=(phrase.ilike.*${search}*,brand.ilike.*${search}*,campaign.ilike.*${search}*)`;
    }
    if (category && category !== 'all') {
      // Mapear categoría del frontend a la base de datos
      const categoryMap: { [key: string]: string } = {
        'producto': 'PRODUCT',
        'servicio': 'SERVICE',
        'promocion': 'PROMOTION',
        'evento': 'EVENT',
        'marca': 'BRAND',
        'institucional': 'INSTITUTIONAL'
      };
      query += `&category=eq.${categoryMap[category] || 'PRODUCT'}`;
    }
    if (status === 'active') query += '&active=eq.true';
    else if (status === 'inactive') query += '&active=eq.false';

    // Obtener frases y conteo total
    const [phrases, countResult] = await Promise.all([
      supabaseDirect.request(query),
      supabaseDirect.request(`phrases?select=count${search ? `&or=(phrase.ilike.*${search}*,brand.ilike.*${search}*,campaign.ilike.*${search}*)` : ''}${category && category !== 'all' ? `&category=eq.${category}` : ''}${status ? `&active=eq.${status === 'active'}` : ''}`)
    ]);
    
    const totalCount = countResult[0]?.count || 0;

    // FIX: Crear un mapa para traducir el ENUM de la DB al valor del Frontend
    const categoryEnumMap: { [key: string]: string } = {
        'PRODUCT': 'producto',
        'SERVICE': 'servicio',
        'PROMOTION': 'promocion',
        'EVENT': 'evento',
        'BRAND': 'marca',
        'INSTITUTIONAL': 'institucional'
    };

    // Obtener conteo de detecciones para cada frase
    const phraseIds = phrases.map((p: any) => p.id).filter(Boolean);
    const detectionCounts = phraseIds.length > 0 ?
      await supabaseDirect.request(`detections?select=phrase_id,count&phrase_id=in.(${phraseIds.join(',')})`) : [];
    
    const detectionCountMap = new Map();
    detectionCounts.forEach((dc: any) => {
      detectionCountMap.set(dc.phrase_id, dc.count);
    });

    const formattedPhrases = phrases.map((p: any) => ({
      id: p.id,
      phrase: p.phrase,
      marca: p.brand,
      campaña: p.campaign || '',
      // FIX: Usar el mapa para obtener el valor correcto en español
      categoria: categoryEnumMap[p.category] || 'producto',
      descripcion: p.description || '',
      uploaded: new Date(p.created_at).toLocaleDateString('es-CL'),
      active: p.active,
      detections: detectionCountMap.get(p.id) || 0
    }));

    const [activeCount, inactiveCount] = await Promise.all([
        supabaseDirect.request('phrases?select=count&active=eq.true'),
        supabaseDirect.request('phrases?select=count&active=eq.false')
    ]);

    return NextResponse.json({
      success: true,
      phrases: formattedPhrases,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      stats: {
        total: (activeCount[0]?.count || 0) + (inactiveCount[0]?.count || 0),
        active: activeCount[0]?.count || 0,
        inactive: inactiveCount[0]?.count || 0,
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

    const phraseData = {
      phrase: phrase.trim(),
      brand: marca.trim(),
      campaign: campaña?.trim() || null,
      category: mappedCategory,
      description: descripcion?.trim() || null,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newPhrases = await supabaseDirect.request('phrases', {
      method: 'POST',
      body: JSON.stringify(phraseData),
      headers: { 'Prefer': 'return=representation' }
    });

    const newPhrase = newPhrases[0];

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

    const updateData = {
      phrase: phrase.trim(),
      brand: marca.trim(),
      campaign: campaña?.trim() || null,
      category: mappedCategory,
      description: descripcion?.trim() || null,
      updated_at: new Date().toISOString()
    };

    const updatedPhrases = await supabaseDirect.request(`phrases?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
      headers: { 'Prefer': 'return=representation' }
    });

    const updatedPhrase = updatedPhrases[0];

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

    const updatedPhrases = await supabaseDirect.request(`phrases?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        active,
        updated_at: new Date().toISOString()
      }),
      headers: { 'Prefer': 'return=representation' }
    });

    const updatedPhrase = updatedPhrases[0];

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

    await supabaseDirect.request(`phrases?id=eq.${id}`, {
      method: 'DELETE'
    });

    return NextResponse.json({ success: true, message: 'Frase eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting phrase:', error);
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Frase no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
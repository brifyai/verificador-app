import { NextRequest, NextResponse } from 'next/server';
import { supabaseDirect } from '@/lib/supabase-direct';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';

    console.log('🔍 Obteniendo frases con filtros:', { page, limit, search, status, category });

    // Obtener todas las frases primero
    const phrases = await supabaseDirect.getPhrases();
    
    // Aplicar filtros manualmente
    let filteredPhrases = phrases;
    
    if (search) {
      filteredPhrases = filteredPhrases.filter((p: any) =>
        p.text?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (status) {
      filteredPhrases = filteredPhrases.filter((p: any) => p.status === status);
    }
    if (category) {
      filteredPhrases = filteredPhrases.filter((p: any) => p.category === category);
    }

    // Aplicar paginación
    const from = (page - 1) * limit;
    const to = from + limit;
    const paginatedPhrases = filteredPhrases.slice(from, to);

    console.log(`✅ ${filteredPhrases.length} frases filtradas, ${paginatedPhrases.length} en página ${page}`);
    
    return NextResponse.json({
      items: paginatedPhrases,
      total: filteredPhrases.length,
      page,
      limit,
      totalPages: Math.ceil(filteredPhrases.length / limit)
    });

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 Creando nueva frase:', body);

    const data = await supabaseDirect.createPhrase({
      text: body.text,
      category: body.category || 'general',
      status: body.status || 'active',
      priority: body.priority || 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    console.log('✅ Frase creada exitosamente');
    return NextResponse.json(data[0], { status: 201 });

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
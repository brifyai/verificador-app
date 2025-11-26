import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseDirect } from '@/lib/supabase-direct';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const radioId = searchParams.get('radioId');
    const phraseId = searchParams.get('phraseId');
    const verified = searchParams.get('verified');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Construir filtros
    let query = 'detections?select=*&order=timestamp.desc';
    
    if (radioId) {
      query += `&radio_id=eq.${radioId}`;
    }
    if (phraseId) {
      query += `&phrase_id=eq.${phraseId}`;
    }
    if (verified !== null) {
      query += `&verified=eq.${verified}`;
    }
    if (dateFrom) {
      query += `&timestamp=gte.${dateFrom}`;
    }
    if (dateTo) {
      query += `&timestamp=lte.${dateTo}`;
    }

    // Aplicar paginación
    const skip = (page - 1) * limit;
    query += `&limit=${limit}&offset=${skip}`;

    // Obtener detecciones
    const detections = await supabaseDirect.request(query);

    // Obtener total para paginación
    const countQuery = query.replace(/&order=.*&limit=.*&offset=.*/, '').replace('&select=*', '&select=id');
    const countResult = await supabaseDirect.request(countQuery);
    const total = countResult ? countResult.length : 0;

    // Obtener datos relacionados
    const phraseIds = [...new Set(detections.map((d: any) => d.phrase_id).filter(Boolean))];
    const radioIds = [...new Set(detections.map((d: any) => d.radio_id).filter(Boolean))];

    const [phrases, radios] = await Promise.all([
      phraseIds.length > 0 ? supabaseDirect.request(`phrases?id=in.(${phraseIds.join(',')})&select=*`) : [],
      radioIds.length > 0 ? supabaseDirect.request(`radios?id=in.(${radioIds.join(',')})&select=*`) : []
    ]);

    // Combinar datos
    const detectionsWithRelations = detections.map((detection: any) => ({
      ...detection,
      phrase: phrases.find((p: any) => p.id === detection.phrase_id),
      radio: radios.find((r: any) => r.id === detection.radio_id)
    }));

    return NextResponse.json({
      detections: detectionsWithRelations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo detecciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Crear nueva detección
    const detectionData = {
      session_id: body.sessionId,
      capture_id: body.captureId,
      radio_id: body.radioId,
      phrase_id: body.phraseId,
      detected_text: body.detectedText,
      original_text: body.originalText,
      confidence: body.confidence,
      similarity: body.similarity,
      audio_timestamp: body.audioTimestamp || null,
      metadata: body.metadata || {}
    };

    const detection = await supabaseDirect.request('detections', {
      method: 'POST',
      body: JSON.stringify(detectionData)
    });

    return NextResponse.json(detection, { status: 201 });
  } catch (error) {
    console.error('Error creando detección:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Actualizar detección
    const updateData = {
      detected_text: body.detectedText,
      original_text: body.originalText,
      confidence: body.confidence,
      similarity: body.similarity,
      verified: body.verified,
      false_positive: body.falsePositive,
      metadata: body.metadata || {}
    };

    const detection = await supabaseDirect.request(
      `detections?id=eq.${body.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      }
    );

    return NextResponse.json(detection);
  } catch (error) {
    console.error('Error actualizando detección:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID es requerido' },
        { status: 400 }
      );
    }

    await supabaseDirect.request(`detections?id=eq.${id}`, {
      method: 'DELETE'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando detección:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
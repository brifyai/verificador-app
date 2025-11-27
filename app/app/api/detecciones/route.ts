import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseDirect } from '@/lib/supabase-direct';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    
    // Filtros opcionales
    const radioId = searchParams.get('radioId');
    const phraseId = searchParams.get('phraseId');
    const verified = searchParams.get('verified');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const brand = searchParams.get('brand');
    const campaign = searchParams.get('campaign');

    // Construir query para Supabase
    let query = `detections?select=*&order=timestamp.desc&limit=${limit}&offset=${skip}`;
    
    if (radioId) query += `&radio_id=eq.${radioId}`;
    if (phraseId) query += `&phrase_id=eq.${phraseId}`;
    if (verified !== null && verified !== undefined) {
      query += `&verified=eq.${verified === 'true'}`;
    }
    if (dateFrom) query += `&timestamp=gte.${new Date(dateFrom).toISOString()}`;
    if (dateTo) query += `&timestamp=lte.${new Date(dateTo).toISOString()}`;

    // Para filtros de brand y campaign, necesitamos hacer join con phrases
    let additionalFilters = '';
    if (brand || campaign) {
      if (brand) additionalFilters += `&brand.ilike.*${brand}*`;
      if (campaign) additionalFilters += `&campaign.ilike.*${campaign}*`;
    }

    // Obtener el total de registros para la paginación
    let countQuery = `detections?select=count${query.includes('?') ? query.split('?')[1] : ''}`;
    const countResult = await supabaseDirect.request(countQuery);
    const totalDetections = countResult[0]?.count || 0;

    // Obtener las detecciones
    const detections = await supabaseDirect.request(query);

    // Obtener datos relacionados
    const phraseIds = [...new Set(detections.map((d: any) => d.phrase_id).filter(Boolean))];
    const radioIds = [...new Set(detections.map((d: any) => d.radio_id).filter(Boolean))];
    const captureIds = [...new Set(detections.map((d: any) => d.capture_id).filter(Boolean))];
    const sessionIds = [...new Set(detections.map((d: any) => d.session_id).filter(Boolean))];

    const [phrases, radios, captures, sessions] = await Promise.all([
      phraseIds.length > 0 ? supabaseDirect.request(`phrases?select=*&id=in.(${phraseIds.join(',')})`) : [],
      radioIds.length > 0 ? supabaseDirect.request(`radios?select=*&id=in.(${radioIds.join(',')})`) : [],
      captureIds.length > 0 ? supabaseDirect.request(`captures?select=*&id=in.(${captureIds.join(',')})`) : [],
      sessionIds.length > 0 ? supabaseDirect.request(`sessions?select=*&id=in.(${sessionIds.join(',')})`) : []
    ]);

    // Aplicar filtros adicionales de brand/campaign si es necesario
    let filteredDetections = detections;
    if (brand || campaign) {
      filteredDetections = detections.filter((detection: any) => {
        const phrase = phrases.find((p: any) => p.id === detection.phrase_id);
        if (!phrase) return false;
        if (brand && !phrase.brand?.toLowerCase().includes(brand.toLowerCase())) return false;
        if (campaign && !phrase.campaign?.toLowerCase().includes(campaign.toLowerCase())) return false;
        return true;
      });
    }

    // Enriquecer detecciones con datos relacionados
    const enrichedDetections = filteredDetections.map((detection: any) => ({
      ...detection,
      phrase: phrases.find((p: any) => p.id === detection.phrase_id),
      radio: radios.find((r: any) => r.id === detection.radio_id),
      capture: captures.find((c: any) => c.id === detection.capture_id),
      session: sessions.find((s: any) => s.id === detection.session_id)
    }));

    // Transformar los datos al formato esperado por el frontend
    const transformedDetections = enrichedDetections.map((detection: any) => {
      const radio = detection.radio;
      const phrase = detection.phrase;
      const capture = detection.capture;
      const metadata = radio?.metadata || {};
      
      return {
        id: detection.id,
        date: new Date(detection.timestamp).toLocaleDateString('es-CL'),
        time: new Date(detection.timestamp).toLocaleTimeString('es-CL'),
        programadora: metadata.programadora || 'No especificada',
        radio: radio?.name || 'Radio desconocida',
        region: radio?.region || 'No especificada',
        comuna: metadata.city || 'No especificada',
        marca: phrase?.brand || 'No especificada',
        campaña: phrase?.campaign || 'No especificada',
        status: detection.verified ? 'Finalizada' : (detection.false_positive ? 'Solucionado' : 'Pendiente'),
        detectedText: detection.detected_text,
        confidence: detection.confidence,
        similarity: detection.similarity,
        cost: detection.cost,
        audioPath: capture?.audio_path,
        timestamp: detection.timestamp,
        verified: detection.verified,
        falsePositive: detection.false_positive
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedDetections,
      pagination: {
        total: totalDetections,
        page,
        limit,
        pages: Math.ceil(totalDetections / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo detecciones:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();

    // Validar campos requeridos
    if (!body.phraseId || !body.radioId || !body.sessionId || !body.captureId) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios: phraseId, radioId, sessionId, captureId' },
        { status: 400 }
      );
    }

    // Crear nueva detección
    const detectionData = {
      phrase_id: body.phraseId,
      radio_id: body.radioId,
      session_id: body.sessionId,
      capture_id: body.captureId,
      detected_text: body.detectedText || '',
      confidence: body.confidence || 0.75,
      similarity: body.similarity || 0.8,
      cost: body.cost || 0,
      verified: body.verified || false,
      false_positive: body.falsePositive || false,
      timestamp: body.timestamp ? new Date(body.timestamp).toISOString() : new Date().toISOString(),
      metadata: body.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newDetections = await supabaseDirect.request('detections', {
      method: 'POST',
      body: JSON.stringify(detectionData),
      headers: { 'Prefer': 'return=representation' }
    });

    const newDetection = newDetections[0];

    // Obtener datos relacionados para la respuesta
    const [phraseData, radioData, captureData, sessionData] = await Promise.all([
      supabaseDirect.request(`phrases?select=*&id=eq.${body.phraseId}`),
      supabaseDirect.request(`radios?select=*&id=eq.${body.radioId}`),
      supabaseDirect.request(`captures?select=*&id=eq.${body.captureId}`),
      supabaseDirect.request(`sessions?select=*&id=eq.${body.sessionId}`)
    ]);

    // Enriquecer la respuesta
    newDetection.phrase = phraseData[0];
    newDetection.radio = radioData[0];
    newDetection.capture = captureData[0];
    newDetection.session = sessionData[0];

    return NextResponse.json({ 
      success: true, 
      data: newDetection 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creando detección:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

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
        { status: 400 }
      );
    }

    const updateData = {
      detected_text: body.detectedText,
      confidence: body.confidence,
      similarity: body.similarity,
      cost: body.cost,
      verified: body.verified,
      false_positive: body.falsePositive,
      metadata: body.metadata,
      updated_at: new Date().toISOString()
    };

    const updatedDetections = await supabaseDirect.request(`detections?id=eq.${body.id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
      headers: { 'Prefer': 'return=representation' }
    });

    const updatedDetection = updatedDetections[0];

    // Obtener datos relacionados para la respuesta
    const [phraseData, radioData, captureData, sessionData] = await Promise.all([
      supabaseDirect.request(`phrases?select=*&id=eq.${updatedDetection.phrase_id}`),
      supabaseDirect.request(`radios?select=*&id=eq.${updatedDetection.radio_id}`),
      supabaseDirect.request(`captures?select=*&id=eq.${updatedDetection.capture_id}`),
      supabaseDirect.request(`sessions?select=*&id=eq.${updatedDetection.session_id}`)
    ]);

    // Enriquecer la respuesta
    updatedDetection.phrase = phraseData[0];
    updatedDetection.radio = radioData[0];
    updatedDetection.capture = captureData[0];
    updatedDetection.session = sessionData[0];

    return NextResponse.json({ 
      success: true, 
      data: updatedDetection 
    });

  } catch (error) {
    console.error('Error actualizando detección:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

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
        { status: 400 }
      );
    }

    await supabaseDirect.request(`detections?id=eq.${id}`, {
      method: 'DELETE'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Detección eliminada' 
    });

  } catch (error) {
    console.error('Error eliminando detección:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
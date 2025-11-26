import { NextRequest, NextResponse } from 'next/server';
import { supabaseDirect } from '@/lib/supabase-direct';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

    // Construir filtros para Supabase
    const filters: any = {};
    
    if (radioId) filters.radioId = radioId;
    if (phraseId) filters.phraseId = phraseId;
    if (verified !== null && verified !== undefined) {
      filters.verified = verified === 'true';
    }
    if (dateFrom || dateTo) {
      filters.timestamp = {};
      if (dateFrom) filters.timestamp.gte = dateFrom;
      if (dateTo) filters.timestamp.lte = dateTo;
    }

    console.log('🔍 Obteniendo detecciones con filtros:', filters);

    // Obtener detecciones desde Supabase
    const { data: detections, error, count } = await supabaseDirect.getDetections({
      filters,
      limit,
      offset: skip,
      orderBy: { field: 'timestamp', direction: 'desc' }
    });

    if (error) {
      console.error('❌ Error obteniendo detecciones:', error);
      return NextResponse.json(
        { success: false, error: 'Error obteniendo detecciones', details: error.message },
        { status: 500 }
      );
    }

    // Transformar los datos al formato esperado por el frontend
    const transformedDetections = (detections || []).map((detection: any) => ({
      id: detection.id,
      date: new Date(detection.timestamp).toLocaleDateString('es-CL'),
      time: new Date(detection.timestamp).toLocaleTimeString('es-CL'),
      programadora: detection.radio?.metadata?.programadora || 'No especificada',
      radio: detection.radio?.name || 'Radio desconocida',
      region: detection.radio?.region || 'No especificada',
      comuna: detection.radio?.metadata?.city || 'No especificada',
      marca: detection.phrase?.brand || 'No especificada',
      campaña: detection.phrase?.campaign || 'No especificada',
      status: detection.verified ? 'Finalizada' : (detection.falsePositive ? 'Solucionado' : 'Pendiente'),
      detectedText: detection.detectedText,
      confidence: detection.confidence,
      similarity: detection.similarity,
      cost: detection.cost,
      audioPath: detection.capture?.audioPath,
      timestamp: detection.timestamp,
      verified: detection.verified,
      falsePositive: detection.falsePositive
    }));

    console.log(`✅ ${transformedDetections.length} detecciones obtenidas`);

    return NextResponse.json({
      success: true,
      data: transformedDetections,
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo detecciones:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
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

    console.log('📝 Creando nueva detección:', body);

    // Crear nueva detección en Supabase
    const newDetection = await supabaseDirect.createDetection({
      phraseId: body.phraseId,
      radioId: body.radioId,
      sessionId: body.sessionId,
      captureId: body.captureId,
      detectedText: body.detectedText || '',
      confidence: body.confidence || 0.75,
      similarity: body.similarity || 0.8,
      cost: body.cost || 0,
      verified: body.verified || false,
      falsePositive: body.falsePositive || false,
      timestamp: body.timestamp || new Date().toISOString(),
      metadata: body.metadata || {}
    });

    if (!newDetection) {
      return NextResponse.json(
        { success: false, error: 'Error creando detección' },
        { status: 500 }
      );
    }

    console.log('✅ Detección creada:', newDetection.id);

    return NextResponse.json({ 
      success: true, 
      data: newDetection 
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creando detección:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
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

    console.log('✏️ Actualizando detección:', body.id);

    // Actualizar detección en Supabase
    const updatedDetection = await supabaseDirect.updateDetection(body.id, {
      detectedText: body.detectedText,
      confidence: body.confidence,
      similarity: body.similarity,
      cost: body.cost,
      verified: body.verified,
      falsePositive: body.falsePositive,
      metadata: body.metadata
    });

    if (!updatedDetection) {
      return NextResponse.json(
        { success: false, error: 'Error actualizando detección' },
        { status: 500 }
      );
    }

    console.log('✅ Detección actualizada:', updatedDetection.id);

    return NextResponse.json({ 
      success: true, 
      data: updatedDetection 
    });

  } catch (error) {
    console.error('❌ Error actualizando detección:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
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

    console.log('🗑️ Eliminando detección:', id);

    // Eliminar detección en Supabase
    const deleted = await supabaseDirect.deleteDetection(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Error eliminando detección' },
        { status: 500 }
      );
    }

    console.log('✅ Detección eliminada:', id);

    return NextResponse.json({ 
      success: true, 
      message: 'Detección eliminada' 
    });

  } catch (error) {
    console.error('❌ Error eliminando detección:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

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
    const falsePositive = searchParams.get('falsePositive');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const brand = searchParams.get('brand');
    const campaign = searchParams.get('campaign');
    const search = searchParams.get('search');
    const region = searchParams.get('region');

    const where: any = {};

    if (radioId) where.radioId = radioId;
    if (phraseId) where.phraseId = phraseId;
    
    // Filtros de estado - asegurar que sean mutuamente exclusivos
    if (verified !== null && verified !== undefined) {
      where.verified = verified === 'true';
    }
    if (falsePositive !== null && falsePositive !== undefined) {
      where.falsePositive = falsePositive === 'true';
    }
    
    // Filtro de fechas
    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = new Date(dateFrom);
      if (dateTo) where.timestamp.lte = new Date(dateTo);
    }
    
    // Filtro de región
    if (region && region !== 'all') {
      where.radio = {
        ...where.radio,
        region: { contains: region, mode: 'insensitive' }
      };
    }
    
    // Filtros de marca y campaña
    if (brand || campaign) {
      where.phrase = {
        ...where.phrase
      };
      if (brand) where.phrase.brand = { contains: brand, mode: 'insensitive' };
      if (campaign) where.phrase.campaign = { contains: campaign, mode: 'insensitive' };
    }
    
    // Filtro de búsqueda general (busca en programadora, radio, marca)
    if (search && search.trim() !== '') {
      where.OR = [
        {
          radio: {
            name: { contains: search, mode: 'insensitive' }
          }
        },
        {
          phrase: {
            brand: { contains: search, mode: 'insensitive' }
          }
        },
        {
          phrase: {
            campaign: { contains: search, mode: 'insensitive' }
          }
        },
        {
          detectedText: { contains: search, mode: 'insensitive' }
        }
      ];
    }

    // Obtener el total de registros para la paginación
    const totalDetections = await prisma.detection.count({ where });

    // Obtener las detecciones con relaciones
    const detections = await prisma.detection.findMany({
      where,
      include: {
        phrase: true,
        radio: true,
        capture: true,
        session: true
      },
      orderBy: {
        timestamp: 'desc'
      },
      skip,
      take: limit
    });

    // Calcular estadísticas globales (no solo de la página actual)
    const allDetectionsForStats = await prisma.detection.findMany({
      where,
      select: {
        id: true,
        verified: true,
        falsePositive: true,
        cost: true,
        confidence: true
      }
    });

    const stats = {
      totalDetections: totalDetections,
      totalValue: allDetectionsForStats.reduce((sum, d) => sum + (d.cost || 0), 0),
      averageConfidence: allDetectionsForStats.length > 0 
        ? allDetectionsForStats.reduce((sum, d) => sum + d.confidence, 0) / allDetectionsForStats.length 
        : 0,
      completedDetections: allDetectionsForStats.filter(d => d.verified).length,
      pendingDetections: allDetectionsForStats.filter(d => !d.verified && !d.falsePositive).length,
      falsePositives: allDetectionsForStats.filter(d => d.falsePositive).length
    };

    // Transformar los datos al formato esperado por el frontend
    const transformedDetections = detections.map((detection) => {
      const metadata = detection.radio?.metadata as any;
      return {
        id: detection.id,
        date: detection.timestamp.toLocaleDateString('es-CL'),
        time: detection.timestamp.toLocaleTimeString('es-CL'),
        programadora: metadata?.programadora || 'No especificada',
        radio: detection.radio?.name || 'Radio desconocida',
        region: detection.radio?.region || 'No especificada',
        comuna: metadata?.city || 'No especificada',
        marca: detection.phrase?.brand || 'No especificada',
        campaña: detection.phrase?.campaign || 'No especificada',
        status: detection.verified ? 'Verificado' : (detection.falsePositive ? 'Falso Positivo' : 'Pendiente'),
        detectedText: detection.detectedText,
        originalText: detection.originalText,
        confidence: detection.confidence,
        similarity: detection.similarity,
        cost: detection.cost,
        audioPath: detection.capture?.audioPath,
        timestamp: detection.timestamp,
        verified: detection.verified,
        falsePositive: detection.falsePositive
      };
    });

    // Obtener regiones únicas para los filtros
    const uniqueRegions = await prisma.radio.findMany({
      where: {
        detections: {
          some: {}
        }
      },
      select: {
        region: true
      },
      distinct: ['region']
    });

    const regions = uniqueRegions
      .map(r => r.region)
      .filter(Boolean) as string[];

    return NextResponse.json({
      success: true,
      data: transformedDetections,
      pagination: {
        total: totalDetections,
        page,
        limit,
        pages: Math.ceil(totalDetections / limit)
      },
      stats,
      filters: {
        regions
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
    const newDetection = await prisma.detection.create({
      data: {
        phraseId: body.phraseId,
        radioId: body.radioId,
        sessionId: body.sessionId,
        captureId: body.captureId,
        detectedText: body.detectedText || '',
        originalText: body.originalText || body.detectedText || '',
        confidence: body.confidence || 0.75,
        similarity: body.similarity || 0.8,
        cost: body.cost || 0,
        verified: body.verified || false,
        falsePositive: body.falsePositive || false,
        timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
        metadata: body.metadata || {}
      },
      include: {
        phrase: true,
        radio: true,
        capture: true,
        session: true
      }
    });

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

    // Actualizar detección
    const updatedDetection = await prisma.detection.update({
      where: { id: body.id },
      data: {
        detectedText: body.detectedText,
        confidence: body.confidence,
        similarity: body.similarity,
        cost: body.cost,
        verified: body.verified,
        falsePositive: body.falsePositive,
        metadata: body.metadata
      },
      include: {
        phrase: true,
        radio: true,
        capture: true,
        session: true
      }
    });

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

    await prisma.detection.delete({ where: { id } });

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

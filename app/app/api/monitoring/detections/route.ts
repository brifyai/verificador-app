
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parámetros de paginación
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    
    // Parámetros de filtrado
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const regionFilter = searchParams.get('region') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Construir filtros dinámicos
    const where: any = {};
    
    // Filtro por texto de búsqueda
    if (search) {
      where.OR = [
        { detectedText: { contains: search, mode: 'insensitive' } },
        { phrase: { phrase: { contains: search, mode: 'insensitive' } } },
        { phrase: { brand: { contains: search, mode: 'insensitive' } } },
        { radio: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    // Filtro por estado
    if (status !== 'all') {
      switch (status) {
        case 'verified':
          where.verified = true;
          break;
        case 'pending':
          where.verified = false;
          where.falsePositive = false;
          break;
        case 'false_positive':
          where.falsePositive = true;
          break;
      }
    }
    
    // Filtro por región
    if (regionFilter !== 'all') {
      where.radio = { region: regionFilter };
    }
    
    // Filtro por fechas
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }
    
    // Obtener detecciones con relaciones
    const [detections, total] = await Promise.all([
      prisma.detection.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          phrase: true,
          radio: true,
          session: {
            include: {
              user: true
            }
          },
          capture: true
        }
      }),
      prisma.detection.count({ where })
    ]);
    
    // Formatear datos para la respuesta
    const formattedDetections = detections.map(detection => ({
      id: detection.id,
      date: detection.timestamp.toLocaleDateString('es-CL'),
      time: detection.timestamp.toLocaleTimeString('es-CL', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      programadora: detection.phrase.brand,
      radio: detection.radio.name,
      region: detection.radio.region || 'No especificada',
      comuna: detection.radio.metadata?.city || 'No especificada',
      marca: detection.phrase.brand,
      campaña: detection.phrase.campaign || 'Sin campaña',
      status: detection.verified 
        ? 'Verificado' 
        : detection.falsePositive 
          ? 'Falso Positivo' 
          : 'Pendiente',
      detectedText: detection.detectedText,
      originalText: detection.originalText,
      confidence: detection.confidence,
      similarity: detection.similarity,
      cost: detection.cost,
      timestamp: detection.timestamp.toISOString(),
      audioPath: detection.capture?.audioPath,
      sessionId: detection.sessionId,
      userId: detection.session.user.name
    }));
    
    // Obtener estadísticas adicionales
    const stats = await prisma.detection.aggregate({
      where,
      _count: { id: true },
      _sum: { cost: true },
      _avg: { confidence: true }
    });
    
    // Obtener regiones únicas para filtros
    const regions = await prisma.radio.findMany({
      select: { region: true },
      distinct: ['region'],
      where: { region: { not: null } }
    });
    
    return NextResponse.json({
      detections: formattedDetections,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        totalDetections: stats._count.id,
        totalValue: stats._sum.cost || 0,
        averageConfidence: stats._avg.confidence || 0,
        completedDetections: await prisma.detection.count({ 
          where: { ...where, verified: true } 
        }),
        pendingDetections: await prisma.detection.count({ 
          where: { ...where, verified: false, falsePositive: false } 
        })
      },
      filters: {
        regions: regions.map(r => r.region).filter(Boolean)
      }
    });
    
  } catch (error) {
    console.error('Error getting detections:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

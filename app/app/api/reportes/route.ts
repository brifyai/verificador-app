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
    const type = searchParams.get('type') || 'summary'; // summary, detections, costs, performance
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const radioId = searchParams.get('radioId');
    const brand = searchParams.get('brand');
    const campaign = searchParams.get('campaign');

    // Configurar filtros de fecha
    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);

    // Configurar filtros adicionales
    const whereDetections: any = {};
    if (Object.keys(dateFilter).length > 0) whereDetections.timestamp = dateFilter;
    if (radioId) whereDetections.radioId = radioId;
    if (brand || campaign) {
      whereDetections.phrase = {};
      if (brand) whereDetections.phrase.brand = { contains: brand, mode: 'insensitive' };
      if (campaign) whereDetections.phrase.campaign = { contains: campaign, mode: 'insensitive' };
    }

    switch (type) {
      case 'summary':
        return await getSummaryReport(whereDetections, dateFilter);
      case 'detections':
        return await getDetectionsReport(whereDetections);
      case 'costs':
        return await getCostsReport(whereDetections, dateFilter);
      case 'performance':
        return await getPerformanceReport(whereDetections, dateFilter);
      default:
        return NextResponse.json(
          { success: false, error: 'Tipo de reporte no válido' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error generando reporte:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

async function getSummaryReport(whereDetections: any, dateFilter: any) {
  // Estadísticas generales
  const totalDetections = await prisma.detection.count({ where: whereDetections });
  const verifiedDetections = await prisma.detection.count({ 
    where: { ...whereDetections, verified: true } 
  });
  const falsePositives = await prisma.detection.count({ 
    where: { ...whereDetections, falsePositive: true } 
  });
  const pendingDetections = await prisma.detection.count({ 
    where: { ...whereDetections, verified: false, falsePositive: false } 
  });

  // Costos totales
  const costsResult = await prisma.detection.aggregate({
    where: whereDetections,
    _sum: { cost: true }
  });
  const totalCosts = costsResult._sum.cost || 0;

  // Radios más activas
  const topRadios = await prisma.detection.groupBy({
    by: ['radioId'],
    where: whereDetections,
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5
  });

  const topRadiosWithNames = await Promise.all(
    topRadios.map(async (radio) => {
      const radioData = await prisma.radio.findUnique({
        where: { id: radio.radioId },
        select: { name: true, region: true }
      });
      return {
        radioId: radio.radioId,
        name: radioData?.name || 'Radio desconocida',
        region: radioData?.region || 'No especificada',
        detections: radio._count.id
      };
    })
  );

  // Marcas más detectadas
  const topBrands = await prisma.detection.groupBy({
    by: ['phraseId'],
    where: whereDetections,
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5
  });

  const topBrandsWithNames = await Promise.all(
    topBrands.map(async (phrase) => {
      const phraseData = await prisma.phrase.findUnique({
        where: { id: phrase.phraseId },
        select: { brand: true, campaign: true }
      });
      return {
        phraseId: phrase.phraseId,
        brand: phraseData?.brand || 'Marca desconocida',
        campaign: phraseData?.campaign || 'Campaña desconocida',
        detections: phrase._count.id
      };
    })
  );

  // Detecciones por día (últimos 30 días)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyDetections = await prisma.$queryRaw`
    SELECT 
      DATE(timestamp) as date,
      COUNT(*) as count
    FROM "Detection"
    WHERE timestamp >= ${thirtyDaysAgo}
    GROUP BY DATE(timestamp)
    ORDER BY date DESC
    LIMIT 30
  `;

  return NextResponse.json({
    success: true,
    data: {
      summary: {
        totalDetections,
        verifiedDetections,
        falsePositives,
        pendingDetections,
        totalCosts,
        verificationRate: totalDetections > 0 ? (verifiedDetections / totalDetections * 100).toFixed(1) : 0
      },
      topRadios: topRadiosWithNames,
      topBrands: topBrandsWithNames,
      dailyDetections
    }
  });
}

async function getDetectionsReport(whereDetections: any) {
  const detections = await prisma.detection.findMany({
    where: whereDetections,
    include: {
      phrase: { select: { brand: true, campaign: true, phrase: true } },
      radio: { select: { name: true, region: true } },
      capture: { select: { audioPath: true, duration: true } }
    },
    orderBy: { timestamp: 'desc' },
    take: 1000 // Limitar para evitar sobrecarga
  });

  const transformedDetections = detections.map(detection => ({
    id: detection.id,
    timestamp: detection.timestamp,
    radio: detection.radio?.name,
    region: detection.radio?.region,
    brand: detection.phrase?.brand,
    campaign: detection.phrase?.campaign,
    phrase: detection.phrase?.phrase,
    detectedText: detection.detectedText,
    confidence: detection.confidence,
    similarity: detection.similarity,
    cost: detection.cost,
    verified: detection.verified,
    falsePositive: detection.falsePositive,
    audioPath: detection.capture?.audioPath,
    duration: detection.capture?.duration
  }));

  return NextResponse.json({
    success: true,
    data: {
      detections: transformedDetections,
      total: transformedDetections.length
    }
  });
}

async function getCostsReport(whereDetections: any, dateFilter: any) {
  // Costos por radio
  const costsByRadio = await prisma.detection.groupBy({
    by: ['radioId'],
    where: whereDetections,
    _sum: { cost: true },
    _count: { id: true },
    orderBy: { _sum: { cost: 'desc' } }
  });

  const costsByRadioWithNames = await Promise.all(
    costsByRadio.map(async (radio) => {
      const radioData = await prisma.radio.findUnique({
        where: { id: radio.radioId },
        select: { name: true, region: true }
      });
      return {
        radioId: radio.radioId,
        name: radioData?.name || 'Radio desconocida',
        region: radioData?.region || 'No especificada',
        totalCost: radio._sum.cost || 0,
        detections: radio._count.id
      };
    })
  );

  // Costos por marca
  const costsByBrand = await prisma.detection.groupBy({
    by: ['phraseId'],
    where: whereDetections,
    _sum: { cost: true },
    _count: { id: true },
    orderBy: { _sum: { cost: 'desc' } }
  });

  const costsByBrandWithNames = await Promise.all(
    costsByBrand.map(async (phrase) => {
      const phraseData = await prisma.phrase.findUnique({
        where: { id: phrase.phraseId },
        select: { brand: true, campaign: true }
      });
      return {
        phraseId: phrase.phraseId,
        brand: phraseData?.brand || 'Marca desconocida',
        campaign: phraseData?.campaign || 'Campaña desconocida',
        totalCost: phrase._sum.cost || 0,
        detections: phrase._count.id
      };
    })
  );

  // Costos por mes
  const monthlyCosts = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('month', timestamp) as month,
      SUM(cost) as total_cost,
      COUNT(*) as detections
    FROM "Detection"
    WHERE timestamp >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', timestamp)
    ORDER BY month DESC
  `;

  return NextResponse.json({
    success: true,
    data: {
      costsByRadio: costsByRadioWithNames,
      costsByBrand: costsByBrandWithNames,
      monthlyCosts
    }
  });
}

async function getPerformanceReport(whereDetections: any, dateFilter: any) {
  // Tiempo promedio de verificación
  const verificationTimes = await prisma.$queryRaw`
    SELECT 
      AVG(EXTRACT(EPOCH FROM (metadata->>'verifiedAt')::timestamp - timestamp)) as avg_verification_time
    FROM "Detection"
    WHERE verified = true 
    AND metadata->>'verifiedAt' IS NOT NULL
  `;

  // Precisión por radio
  const accuracyByRadio = await prisma.$queryRaw`
    SELECT 
      r.name,
      r.region,
      COUNT(*) as total_detections,
      SUM(CASE WHEN verified = true THEN 1 ELSE 0 END) as verified_detections,
      SUM(CASE WHEN "falsePositive" = true THEN 1 ELSE 0 END) as false_positives,
      ROUND(
        (SUM(CASE WHEN verified = true THEN 1 ELSE 0 END)::float / COUNT(*)) * 100, 
        2
      ) as accuracy_rate
    FROM "Detection" d
    JOIN "Radio" r ON d."radioId" = r.id
    GROUP BY r.id, r.name, r.region
    HAVING COUNT(*) >= 10
    ORDER BY accuracy_rate DESC
  `;

  // Confianza promedio por proveedor
  const confidenceByProvider = await prisma.$queryRaw`
    SELECT 
      c.provider,
      AVG(d.confidence) as avg_confidence,
      COUNT(*) as detections
    FROM "Detection" d
    JOIN "Capture" c ON d."captureId" = c.id
    WHERE c.provider IS NOT NULL
    GROUP BY c.provider
    ORDER BY avg_confidence DESC
  `;

  return NextResponse.json({
    success: true,
    data: {
      verificationTimes,
      accuracyByRadio,
      confidenceByProvider
    }
  });
}
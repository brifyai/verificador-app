import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today'; // today, week, month

    // Calcular rango de fechas
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    // 1. Resumen general
    const [
      totalDetections,
      todayDetections,
      weekDetections,
      monthDetections,
      activeSessions,
      pausedSessions,
      completedSessions,
      totalRadios,
      totalPhrases,
      totalCaptures
    ] = await Promise.all([
      prisma.detection.count(),
      prisma.detection.count({
        where: { timestamp: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }
      }),
      prisma.detection.count({
        where: { timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
      }),
      prisma.detection.count({
        where: { timestamp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
      }),
      prisma.monitoringSession.count({
        where: { status: 'ACTIVE' }
      }),
      prisma.monitoringSession.count({
        where: { status: 'PAUSED' }
      }),
      prisma.monitoringSession.count({
        where: { status: 'COMPLETED' }
      }),
      prisma.radio.count({ where: { status: 'ACTIVE' } }),
      prisma.phrase.count({ where: { active: true } }),
      prisma.capture.count()
    ]);

    // 2. Detecciones por hora (últimas 24 horas)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const detectionsByHour = await prisma.$queryRaw<Array<{ hour: number; count: bigint }>>`
      SELECT 
        EXTRACT(HOUR FROM timestamp) as hour,
        COUNT(*) as count
      FROM detections
      WHERE timestamp >= ${last24Hours}
      GROUP BY EXTRACT(HOUR FROM timestamp)
      ORDER BY hour
    `;

    // 3. Top 5 radios con más detecciones
    const topRadios = await prisma.detection.groupBy({
      by: ['radioId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });

    const topRadiosWithDetails = await Promise.all(
      topRadios.map(async (item) => {
        const radio = await prisma.radio.findUnique({
          where: { id: item.radioId },
          select: { id: true, name: true, region: true }
        });
        return {
          ...radio,
          detectionCount: item._count.id
        };
      })
    );

    // 4. Top 5 frases más detectadas
    const topPhrases = await prisma.detection.groupBy({
      by: ['phraseId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });

    const topPhrasesWithDetails = await Promise.all(
      topPhrases.map(async (item) => {
        const phrase = await prisma.phrase.findUnique({
          where: { id: item.phraseId },
          select: { id: true, phrase: true, brand: true }
        });
        return {
          ...phrase,
          detectionCount: item._count.id
        };
      })
    );

    // 5. Detecciones por región
    const detectionsByRegion = await prisma.$queryRaw<Array<{ region: string; count: bigint }>>`
      SELECT 
        r.region,
        COUNT(d.id) as count
      FROM detections d
      JOIN radios r ON d."radioId" = r.id
      WHERE r.region IS NOT NULL
      GROUP BY r.region
      ORDER BY count DESC
    `;

    // 6. Sesiones activas con detalles
    const activeSessionsDetails = await prisma.monitoringSession.findMany({
      where: { status: 'ACTIVE' },
      include: {
        radio: {
          select: { id: true, name: true, region: true }
        }
      },
      orderBy: { startTime: 'desc' },
      take: 10
    });

    // 7. Últimas 10 detecciones
    const recentDetections = await prisma.detection.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        radio: {
          select: { name: true, region: true }
        },
        phrase: {
          select: { phrase: true, brand: true }
        }
      }
    });

    // 8. Calcular costos del mes
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const detectionCosts = await prisma.detection.aggregate({
      where: { timestamp: { gte: monthStart } },
      _sum: { cost: true }
    });

    const captureCosts = await prisma.capture.aggregate({
      where: { capturedAt: { gte: monthStart } },
      _sum: { cost: true }
    });

    const totalCosts = (detectionCosts._sum.cost || 0) + (captureCosts._sum.cost || 0);

    // 9. Tasa de verificación
    const verifiedDetections = await prisma.detection.count({
      where: { verified: true }
    });
    const verificationRate = totalDetections > 0 ? (verifiedDetections / totalDetections) * 100 : 0;

    // 10. Alertas (detecciones de alta confianza sin verificar)
    const unverifiedHighConfidence = await prisma.detection.count({
      where: {
        verified: false,
        confidence: { gte: 0.9 }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalDetections,
          todayDetections,
          weekDetections,
          monthDetections,
          activeSessions,
          pausedSessions,
          completedSessions,
          totalRadios,
          totalPhrases,
          totalCaptures,
          verificationRate: verificationRate.toFixed(1),
          monthCosts: totalCosts
        },
        detectionsByHour: detectionsByHour.map(d => ({
          hour: Number(d.hour),
          count: Number(d.count)
        })),
        topRadios: topRadiosWithDetails,
        topPhrases: topPhrasesWithDetails,
        detectionsByRegion: detectionsByRegion.map(d => ({
          region: d.region,
          count: Number(d.count)
        })),
        activeSessions: activeSessionsDetails,
        recentDetections,
        alerts: {
          unverifiedHighConfidence
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Error getting dashboard stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error obteniendo estadísticas'
      },
      { status: 500 }
    );
  }
}

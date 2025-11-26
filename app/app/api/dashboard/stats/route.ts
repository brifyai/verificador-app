import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all detections for time-based filtering
    const allDetections = await prisma.detection.findMany({
      include: {
        radio: true,
        phrase: true,
      },
    });

    // Time-based detection counts
    const todayDetections = allDetections.filter(d => new Date(d.timestamp) >= today).length;
    const weekDetections = allDetections.filter(d => new Date(d.timestamp) >= weekAgo).length;
    const monthDetectionsCount = allDetections.filter(d => new Date(d.timestamp) >= monthAgo).length;

    // Total counts
    const totalDetections = allDetections.length;
    const totalRadios = await prisma.radio.count();
    const totalPhrases = await prisma.phrase.count();

    // Recent activity (last 24 hours)
    const recent24hDetections = allDetections.filter(d => new Date(d.timestamp) >= last24Hours);
    
    // Hourly distribution for last 24 hours
    const hourlyData = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).getHours();
      const hourStart = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
      hourStart.setMinutes(0, 0, 0);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
      
      return {
        hour,
        detections: recent24hDetections.filter(d => {
          const detectionTime = new Date(d.timestamp);
          return detectionTime >= hourStart && detectionTime < hourEnd;
        }).length,
      };
    });

    // Top phrases (last 7 days)
    const weekAgoDetections = allDetections.filter(d => new Date(d.timestamp) >= weekAgo);
    const phraseCounts = new Map();
    
    weekAgoDetections.forEach(detection => {
      const phraseId = detection.phraseId;
      phraseCounts.set(phraseId, (phraseCounts.get(phraseId) || 0) + 1);
    });

    const topPhrases = Array.from(phraseCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([phraseId, count]) => {
        const phrase = weekAgoDetections.find(d => d.phraseId === phraseId)?.phrase;
        return {
          id: phraseId,
          phrase: phrase?.phrase || 'Unknown',
          count,
        };
      });

    // Top radios (last 7 days)
    const radioCounts = new Map();
    const radios = await prisma.radio.findMany();
    const radioRegionMap = new Map(radios.map(r => [r.id, r.region]));

    weekAgoDetections.forEach(detection => {
      const radioId = detection.radioId;
      radioCounts.set(radioId, (radioCounts.get(radioId) || 0) + 1);
    });

    const topRadios = Array.from(radioCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([radioId, count]) => {
        const radio = radios.find(r => r.id === radioId);
        return {
          id: radioId,
          name: radio?.name || 'Unknown',
          region: radio?.region || 'Unknown',
          count,
        };
      });

    // Regional distribution (last 7 days)
    const regionCountMap = new Map();
    weekAgoDetections.forEach(detection => {
      const region = radioRegionMap.get(detection.radioId) || 'Unknown';
      regionCountMap.set(region, (regionCountMap.get(region) || 0) + 1);
    });

    const regionData = Array.from(regionCountMap.entries()).map(([region, count]) => ({
      region,
      count,
    }));

    // Recent detections (last 10)
    const recentDetections = await prisma.detection.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        radio: true,
        phrase: true,
      },
    });

    // Cost calculations (current month)
    const monthDetectionsList = allDetections.filter(d => new Date(d.timestamp) >= monthStart);
    const detectionCosts = monthDetectionsList.reduce((sum, d) => sum + (d.cost || 0), 0);
    
    const captures = await prisma.capture.findMany({
      where: {
        capturedAt: {
          gte: monthStart,
        },
      },
    });
    
    const captureCosts = captures.reduce((sum, c) => sum + (c.cost || 0), 0);
    const totalCosts = detectionCosts + captureCosts;

    // Verification stats
    const verifiedDetectionsCount = allDetections.filter(d => d.verified).length;
    const unverifiedHighConfidence = allDetections.filter(
      d => !d.verified && d.confidence >= 0.8
    ).length;

    return NextResponse.json({
      overview: {
        totalDetections,
        todayDetections,
        weekDetections,
        monthDetections: monthDetectionsCount,
        totalRadios,
        totalPhrases,
      },
      activity: {
        hourlyData,
        recentDetections: recentDetections.map(d => ({
          id: d.id,
          phrase: d.phrase?.phrase || 'Unknown',
          radio: d.radio?.name || 'Unknown',
          timestamp: d.timestamp,
          confidence: d.confidence,
          verified: d.verified,
        })),
      },
      rankings: {
        topPhrases,
        topRadios,
        regionData,
      },
      costs: {
        totalCosts,
        detectionCosts,
        captureCosts,
        costPerDetection: totalDetections > 0 ? totalCosts / totalDetections : 0,
      },
      verification: {
        verifiedDetections: verifiedDetectionsCount,
        unverifiedHighConfidence,
        verificationRate: totalDetections > 0 ? (verifiedDetectionsCount / totalDetections) * 100 : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}

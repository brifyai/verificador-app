import { NextRequest, NextResponse } from 'next/server';
import { supabaseDirect } from '@/lib/supabase-direct';

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
    const allDetections = await supabaseDirect.request('detections?select=*&limit=10000');

    // Time-based detection counts
    const todayDetections = allDetections.filter((d: any) => new Date(d.timestamp) >= today).length;
    const weekDetections = allDetections.filter((d: any) => new Date(d.timestamp) >= weekAgo).length;
    const monthDetectionsCount = allDetections.filter((d: any) => new Date(d.timestamp) >= monthAgo).length;

    // Total counts
    const totalDetections = allDetections.length;
    const radiosCount = await supabaseDirect.request('radios?select=count');
    const totalRadios = radiosCount[0]?.count || 0;
    const phrasesCount = await supabaseDirect.request('phrases?select=count');
    const totalPhrases = phrasesCount[0]?.count || 0;

    // Recent activity (last 24 hours)
    const recent24hDetections = allDetections.filter((d: any) => new Date(d.timestamp) >= last24Hours);
    
    // Hourly distribution for last 24 hours
    const hourlyData = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).getHours();
      const hourStart = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
      hourStart.setMinutes(0, 0, 0);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
      
      return {
        hour,
        detections: recent24hDetections.filter((d: any) => {
          const detectionTime = new Date(d.timestamp);
          return detectionTime >= hourStart && detectionTime < hourEnd;
        }).length,
      };
    });

    // Top phrases (last 7 days)
    const weekAgoDetections = allDetections.filter((d: any) => new Date(d.timestamp) >= weekAgo);
    const phraseCounts = new Map();
    
    weekAgoDetections.forEach((detection: any) => {
      const phraseId = detection.phrase_id;
      phraseCounts.set(phraseId, (phraseCounts.get(phraseId) || 0) + 1);
    });

    const topPhrases = Array.from(phraseCounts.entries())
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([phraseId, count]) => {
        const phrase = weekAgoDetections.find((d: any) => d.phrase_id === phraseId);
        return {
          id: phraseId,
          phrase: phrase?.phrase || 'Unknown',
          count,
        };
      });

    // Top radios (last 7 days)
    const radioCounts = new Map();
    const radiosData = await supabaseDirect.request('radios?select=id,region&limit=1000');
    const radioRegionMap = new Map(radiosData.map((r: any) => [r.id, r.region]));

    weekAgoDetections.forEach((detection: any) => {
      const radioId = detection.radio_id;
      radioCounts.set(radioId, (radioCounts.get(radioId) || 0) + 1);
    });

    const topRadios = Array.from(radioCounts.entries())
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([radioId, count]) => {
        const radio = radiosData.find((r: any) => r.id === radioId);
        return {
          id: radioId,
          name: radio?.name || 'Unknown',
          region: radio?.region || 'Unknown',
          count,
        };
      });

    // Regional distribution (last 7 days)
    const regionCountMap = new Map();
    weekAgoDetections.forEach((detection: any) => {
      const region = radioRegionMap.get(detection.radio_id) || 'Unknown';
      regionCountMap.set(region, (regionCountMap.get(region) || 0) + 1);
    });

    const regionData = Array.from(regionCountMap.entries()).map(([region, count]) => ({
      region,
      count,
    }));

    // Recent detections (last 10)
    const recentDetectionsRaw = await supabaseDirect.request('detections?select=*&order=timestamp.desc&limit=10');
    
    // Get related data for recent detections
    const phraseIds = [...new Set(recentDetectionsRaw.map((d: any) => d.phrase_id).filter(Boolean))];
    const radioIds = [...new Set(recentDetectionsRaw.map((d: any) => d.radio_id).filter(Boolean))];
    
    const [phrases, radiosList] = await Promise.all([
      phraseIds.length > 0 ? supabaseDirect.request(`phrases?select=*&id=in.(${phraseIds.join(',')})`) : [],
      radioIds.length > 0 ? supabaseDirect.request(`radios?select=*&id=in.(${radioIds.join(',')})`) : []
    ]);
    
    const recentDetections = recentDetectionsRaw.map((detection: any) => ({
      ...detection,
      phrase: phrases.find((p: any) => p.id === detection.phrase_id),
      radio: radiosList.find((r: any) => r.id === detection.radio_id)
    }));

    // Cost calculations (current month)
    const monthDetectionsList = allDetections.filter(d => new Date(d.timestamp) >= monthStart);
    const detectionCosts = monthDetectionsList.reduce((sum, d) => sum + (d.cost || 0), 0);
    
    const captures = await supabaseDirect.request(`captures?select=*&captured_at=gte.${monthStart.toISOString()}&limit=10000`);
    
    const captureCosts = captures.reduce((sum: number, c: any) => sum + (c.cost || 0), 0);
    const totalCosts = detectionCosts + captureCosts;

    // Verification stats
    const verifiedDetectionsCount = allDetections.filter((d: any) => d.verified).length;
    const unverifiedHighConfidence = allDetections.filter(
      (d: any) => !d.verified && d.confidence >= 0.8
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
        recentDetections: recentDetections.map((d: any) => ({
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

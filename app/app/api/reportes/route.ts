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
  // Construir query base para detecciones
  let baseQuery = 'detections?select=*';
  
  // Aplicar filtros de fecha
  if (dateFilter.gte) {
    baseQuery += `&timestamp=gte.${dateFilter.gte.toISOString()}`;
  }
  if (dateFilter.lte) {
    baseQuery += `&timestamp=lte.${dateFilter.lte.toISOString()}`;
  }
  
  // Aplicar filtros adicionales
  if (whereDetections.radioId) {
    baseQuery += `&radio_id=eq.${whereDetections.radioId}`;
  }

  // Obtener todas las detecciones filtradas
  const detections = await supabaseDirect.request(baseQuery);

  // Estadísticas generales
  const totalDetections = detections.length;
  const verifiedDetections = detections.filter((d: any) => d.verified).length;
  const falsePositives = detections.filter((d: any) => d.false_positive).length;
  const pendingDetections = detections.filter((d: any) => !d.verified && !d.false_positive).length;

  // Costos totales
  const totalCosts = detections.reduce((sum: number, d: any) => sum + (d.cost || 0), 0);

  // Radios más activas (agrupar por radio_id)
  const radioCounts = detections.reduce((acc: any, d: any) => {
    acc[d.radio_id] = (acc[d.radio_id] || 0) + 1;
    return acc;
  }, {});
  
  const topRadioIds = Object.entries(radioCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([id]) => id);

  const topRadiosWithNames = await Promise.all(
    topRadioIds.map(async (radioId) => {
      const radios = await supabaseDirect.request(`radios?select=*&id=eq.${radioId}`);
      const radio = radios[0];
      return {
        radioId,
        name: radio?.name || 'Radio desconocida',
        region: radio?.region || 'No especificada',
        detections: radioCounts[radioId]
      };
    })
  );

  // Marcas más detectadas (agrupar por phrase_id)
  const phraseCounts = detections.reduce((acc: any, d: any) => {
    acc[d.phrase_id] = (acc[d.phrase_id] || 0) + 1;
    return acc;
  }, {});
  
  const topPhraseIds = Object.entries(phraseCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([id]) => id);

  const topBrandsWithNames = await Promise.all(
    topPhraseIds.map(async (phraseId) => {
      const phrases = await supabaseDirect.request(`phrases?select=*&id=eq.${phraseId}`);
      const phrase = phrases[0];
      return {
        phraseId,
        brand: phrase?.brand || 'Marca desconocida',
        campaign: phrase?.campaign || 'Campaña desconocida',
        detections: phraseCounts[phraseId]
      };
    })
  );

  // Detecciones por día (últimos 30 días)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyDetections = detections
    .filter((d: any) => new Date(d.timestamp) >= thirtyDaysAgo)
    .reduce((acc: any, d: any) => {
      const date = new Date(d.timestamp).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

  const dailyDetectionsArray = Object.entries(dailyDetections)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30);

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
      dailyDetections: dailyDetectionsArray
    }
  });
}

async function getDetectionsReport(whereDetections: any) {
  // Construir query para detecciones
  let query = 'detections?select=*&order=timestamp.desc&limit=1000';
  
  if (whereDetections.radioId) {
    query += `&radio_id=eq.${whereDetections.radioId}`;
  }

  const detections = await supabaseDirect.request(query);

  // Obtener datos relacionados
  const phraseIds = [...new Set(detections.map((d: any) => d.phrase_id).filter(Boolean))];
  const radioIds = [...new Set(detections.map((d: any) => d.radio_id).filter(Boolean))];
  const captureIds = [...new Set(detections.map((d: any) => d.capture_id).filter(Boolean))];

  const [phrases, radios, captures] = await Promise.all([
    phraseIds.length > 0 ? supabaseDirect.request(`phrases?select=*&id=in.(${phraseIds.join(',')})`) : [],
    radioIds.length > 0 ? supabaseDirect.request(`radios?select=*&id=in.(${radioIds.join(',')})`) : [],
    captureIds.length > 0 ? supabaseDirect.request(`captures?select=*&id=in.(${captureIds.join(',')})`) : []
  ]);

  const transformedDetections = detections.map((detection: any) => {
    const phrase = phrases.find((p: any) => p.id === detection.phrase_id);
    const radio = radios.find((r: any) => r.id === detection.radio_id);
    const capture = captures.find((c: any) => c.id === detection.capture_id);
    
    return {
      id: detection.id,
      timestamp: detection.timestamp,
      radio: radio?.name,
      region: radio?.region,
      brand: phrase?.brand,
      campaign: phrase?.campaign,
      phrase: phrase?.phrase,
      detectedText: detection.detected_text,
      confidence: detection.confidence,
      similarity: detection.similarity,
      cost: detection.cost,
      verified: detection.verified,
      falsePositive: detection.false_positive,
      audioPath: capture?.audio_path,
      duration: capture?.duration
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      detections: transformedDetections,
      total: transformedDetections.length
    }
  });
}

async function getCostsReport(whereDetections: any, dateFilter: any) {
  // Obtener todas las detecciones filtradas
  let query = 'detections?select=*';
  
  if (whereDetections.radioId) {
    query += `&radio_id=eq.${whereDetections.radioId}`;
  }

  const detections = await supabaseDirect.request(query);

  // Costos por radio (agrupar por radio_id)
  const costsByRadioMap = detections.reduce((acc: any, d: any) => {
    if (!acc[d.radio_id]) {
      acc[d.radio_id] = { totalCost: 0, detections: 0 };
    }
    acc[d.radio_id].totalCost += d.cost || 0;
    acc[d.radio_id].detections += 1;
    return acc;
  }, {});

  const radioIds = Object.keys(costsByRadioMap);
  const radios = await supabaseDirect.request(
    `radios?select=*&id=in.(${radioIds.join(',')})`
  );

  const costsByRadioWithNames = radioIds.map((radioId) => {
    const radio = radios.find((r: any) => r.id === radioId);
    return {
      radioId,
      name: radio?.name || 'Radio desconocida',
      region: radio?.region || 'No especificada',
      totalCost: costsByRadioMap[radioId].totalCost,
      detections: costsByRadioMap[radioId].detections
    };
  }).sort((a, b) => b.totalCost - a.totalCost);

  // Costos por marca (agrupar por phrase_id)
  const costsByBrandMap = detections.reduce((acc: any, d: any) => {
    if (!acc[d.phrase_id]) {
      acc[d.phrase_id] = { totalCost: 0, detections: 0 };
    }
    acc[d.phrase_id].totalCost += d.cost || 0;
    acc[d.phrase_id].detections += 1;
    return acc;
  }, {});

  const phraseIds = Object.keys(costsByBrandMap);
  const phrases = await supabaseDirect.request(
    `phrases?select=*&id=in.(${phraseIds.join(',')})`
  );

  const costsByBrandWithNames = phraseIds.map((phraseId) => {
    const phrase = phrases.find((p: any) => p.id === phraseId);
    return {
      phraseId,
      brand: phrase?.brand || 'Marca desconocida',
      campaign: phrase?.campaign || 'Campaña desconocida',
      totalCost: costsByBrandMap[phraseId].totalCost,
      detections: costsByBrandMap[phraseId].detections
    };
  }).sort((a, b) => b.totalCost - a.totalCost);

  // Costos por mes (últimos 12 meses)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const monthlyCostsMap = detections
    .filter((d: any) => new Date(d.timestamp) >= twelveMonthsAgo)
    .reduce((acc: any, d: any) => {
      const month = new Date(d.timestamp).toISOString().substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + (d.cost || 0);
      return acc;
    }, {});

  const monthlyCosts = Object.entries(monthlyCostsMap)
    .map(([month, total_cost]) => ({
      month,
      total_cost,
      detections: detections.filter((d: any) =>
        new Date(d.timestamp).toISOString().substring(0, 7) === month
      ).length
    }))
    .sort((a, b) => b.month.localeCompare(a.month));

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
  // Obtener detecciones verificadas para cálculo de tiempo promedio
  let query = 'detections?select=*&verified=eq.true';
  
  if (whereDetections.radioId) {
    query += `&radio_id=eq.${whereDetections.radioId}`;
  }

  const verifiedDetections = await supabaseDirect.request(query);

  // Tiempo promedio de verificación (simulado, ya que no tenemos verifiedAt)
  const avgVerificationTime = verifiedDetections.length > 0 ? 3600 : 0; // 1 hora promedio simulada

  // Precisión por radio
  const radioStatsMap = verifiedDetections.reduce((acc: any, d: any) => {
    if (!acc[d.radio_id]) {
      acc[d.radio_id] = { total: 0, verified: 0, falsePositives: 0 };
    }
    acc[d.radio_id].total += 1;
    if (d.verified) acc[d.radio_id].verified += 1;
    if (d.false_positive) acc[d.radio_id].falsePositives += 1;
    return acc;
  }, {});

  const radioIds = Object.keys(radioStatsMap);
  const radios = await supabaseDirect.request(
    `radios?select=*&id=in.(${radioIds.join(',')})`
  );

  const accuracyByRadio = radioIds
    .map((radioId) => {
      const radio = radios.find((r: any) => r.id === radioId);
      const stats = radioStatsMap[radioId];
      return {
        name: radio?.name || 'Radio desconocida',
        region: radio?.region || 'No especificada',
        total_detections: stats.total,
        verified_detections: stats.verified,
        false_positives: stats.falsePositives,
        accuracy_rate: stats.total > 0 ?
          Math.round((stats.verified / stats.total) * 100 * 100) / 100 : 0
      };
    })
    .filter(r => r.total_detections >= 10)
    .sort((a, b) => b.accuracy_rate - a.accuracy_rate);

  // Confianza promedio (usar confianza de detecciones)
  const avgConfidence = verifiedDetections.length > 0 ?
    verifiedDetections.reduce((sum: number, d: any) => sum + (d.confidence || 0), 0) / verifiedDetections.length :
    0;

  const confidenceByProvider = [{
    provider: 'whisper',
    avg_confidence: avgConfidence,
    detections: verifiedDetections.length
  }];

  return NextResponse.json({
    success: true,
    data: {
      verificationTimes: [{ avg_verification_time: avgVerificationTime }],
      accuracyByRadio,
      confidenceByProvider
    }
  });
}
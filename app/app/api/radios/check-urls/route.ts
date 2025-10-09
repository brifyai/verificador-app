import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🔍 Verificando URLs de radios en la base de datos...');
    
    // Obtener todas las radios de la base de datos
    const radios = await prisma.radio.findMany({
      select: {
        id: true,
        name: true,
        streamUrl: true,
        region: true,
        metadata: true,
        active: true
      }
    });

    console.log(`📻 Encontradas ${radios.length} radios en la base de datos`);

    // Procesar cada radio para extraer URLs
    const radioStatus = radios.map((radio: any) => {
      let actualStreamUrl = radio.streamUrl;
      let urlSource = 'streamUrl';
      
      // Si no hay streamUrl directo, buscar en metadata
      if (!actualStreamUrl && radio.metadata && typeof radio.metadata === 'object') {
        const metadata = radio.metadata as any;
        
        // Buscar en platformData
        if (metadata.platformData && metadata.platformData.url) {
          actualStreamUrl = metadata.platformData.url.replace(/`/g, '').trim();
          urlSource = 'metadata.platformData.url';
        }
        // Buscar en otros campos posibles
        else if (metadata.url) {
          actualStreamUrl = metadata.url.replace(/`/g, '').trim();
          urlSource = 'metadata.url';
        }
        else if (metadata.stream_url) {
          actualStreamUrl = metadata.stream_url.replace(/`/g, '').trim();
          urlSource = 'metadata.stream_url';
        }
      }
      
      return {
        id: radio.id,
        name: radio.name,
        region: radio.region,
        active: radio.active,
        streamUrl: actualStreamUrl,
        urlSource: urlSource,
        hasValidUrl: !!actualStreamUrl,
        metadata: radio.metadata
      };
    });

    // Estadísticas
    const activeRadios = radioStatus.filter(r => r.active);
    const radiosWithUrl = radioStatus.filter(r => r.hasValidUrl);
    const activeRadiosWithUrl = activeRadios.filter(r => r.hasValidUrl);

    const stats = {
      total: radios.length,
      active: activeRadios.length,
      withUrl: radiosWithUrl.length,
      activeWithUrl: activeRadiosWithUrl.length,
      readyForMonitoring: activeRadiosWithUrl.length
    };

    // Radios problemáticas
    const problematicRadios = activeRadios.filter(r => !r.hasValidUrl);

    return NextResponse.json({
      success: true,
      stats,
      radios: radioStatus,
      readyForMonitoring: activeRadiosWithUrl,
      problematicRadios: problematicRadios.map(r => ({
        id: r.id,
        name: r.name,
        region: r.region,
        issue: 'No tiene URL de stream configurada'
      })),
      recommendations: generateRecommendations(stats, problematicRadios),
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error verificando URLs de radios:', error);
    return NextResponse.json({
      success: false,
      error: 'Error verificando URLs de radios',
      details: error.message
    }, { status: 500 });
  }
}

function generateRecommendations(stats: any, problematicRadios: any[]): string[] {
  const recommendations = [];
  
  if (stats.activeWithUrl === 0) {
    recommendations.push('❌ No hay radios activas con URLs válidas. El sistema no puede funcionar.');
  } else if (stats.activeWithUrl < 3) {
    recommendations.push('⚠️ Pocas radios disponibles para monitoreo. Considera agregar más radios.');
  } else {
    recommendations.push(`✅ ${stats.activeWithUrl} radios listas para monitoreo.`);
  }
  
  if (problematicRadios.length > 0) {
    recommendations.push(`🔧 ${problematicRadios.length} radios activas necesitan configuración de URL.`);
  }
  
  if (stats.active < stats.total) {
    recommendations.push(`💡 ${stats.total - stats.active} radios inactivas podrían reactivarse.`);
  }
  
  return recommendations;
}

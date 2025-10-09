import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🔍 Verificando radios en la base de datos...');
    
    // Obtener todas las radios
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

    if (radios.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No hay radios en la base de datos',
        radios: [],
        stats: { total: 0, active: 0, withUrl: 0, ready: 0 }
      });
    }

    // Analizar cada radio
    const radioAnalysis = radios.map((radio: any) => {
      let actualStreamUrl = radio.streamUrl;
      let urlSource = 'streamUrl';
      
      // Si no hay streamUrl directo, buscar en metadata
      if (!actualStreamUrl && radio.metadata && typeof radio.metadata === 'object') {
        const metadata = radio.metadata;
        
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
        ready: radio.active && !!actualStreamUrl,
        metadata: radio.metadata
      };
    });

    // Estadísticas
    const stats = {
      total: radios.length,
      active: radioAnalysis.filter(r => r.active).length,
      withUrl: radioAnalysis.filter(r => r.hasValidUrl).length,
      ready: radioAnalysis.filter(r => r.ready).length
    };

    // Radios listas para usar
    const readyRadios = radioAnalysis.filter(r => r.ready);
    const problematicRadios = radioAnalysis.filter(r => !r.ready);

    // Verificar frases también
    const phrases = await prisma.phrase.findMany({
      where: { active: true },
      select: {
        id: true,
        phrase: true,
        brand: true,
        active: true
      },
      take: 10
    });

    return NextResponse.json({
      success: true,
      message: `Encontradas ${radios.length} radios, ${stats.ready} listas para monitoreo`,
      stats,
      radios: radioAnalysis,
      readyRadios,
      problematicRadios,
      phrases,
      recommendations: [
        stats.ready > 0 ? `✅ ${stats.ready} radios listas para monitoreo` : '❌ No hay radios listas',
        problematicRadios.length > 0 ? `⚠️ ${problematicRadios.length} radios necesitan configuración` : '✅ Todas las radios están configuradas',
        phrases.length > 0 ? `✅ ${phrases.length} frases disponibles` : '❌ No hay frases configuradas'
      ],
      exampleUsage: readyRadios.length > 0 ? {
        radioIds: readyRadios.slice(0, 3).map(r => r.id),
        phraseId: phrases.length > 0 ? phrases[0].id : 'phrase_example',
        message: 'Usa estos IDs en el dashboard para probar el monitoreo'
      } : null,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error verificando base de datos:', error);
    return NextResponse.json({
      success: false,
      error: 'Error verificando base de datos',
      details: error.message
    }, { status: 500 });
  }
}

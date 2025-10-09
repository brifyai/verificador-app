import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🔍 Verificando datos en la base de datos...');
    
    // Obtener todas las radios
    const radios = await prisma.radio.findMany({
      select: {
        id: true,
        name: true,
        streamUrl: true,
        region: true,
        status: true,
        platform: true,
        metadata: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Obtener todas las frases
    const phrases = await prisma.phrase.findMany({
      select: {
        id: true,
        phrase: true,
        brand: true,
        campaign: true,
        category: true,
        active: true,
        confidence: true,
        priority: true
      },
      orderBy: {
        brand: 'asc'
      }
    });

    // Estadísticas de radios
    const radioStats = {
      total: radios.length,
      active: radios.filter(r => r.status === 'ACTIVE').length,
      withStreamUrl: radios.filter(r => !!r.streamUrl).length,
      readyForMonitoring: radios.filter(r => r.status === 'ACTIVE' && !!r.streamUrl).length
    };

    // Estadísticas de frases
    const phraseStats = {
      total: phrases.length,
      active: phrases.filter(p => p.active).length,
      byBrand: phrases.reduce((acc: any, phrase) => {
        acc[phrase.brand] = (acc[phrase.brand] || 0) + 1;
        return acc;
      }, {})
    };

    // Radios listas para usar
    const readyRadios = radios.filter(r => r.status === 'ACTIVE' && !!r.streamUrl);
    const activePhrase = phrases.filter(p => p.active);

    // Generar ejemplo de uso
    const exampleUsage = readyRadios.length > 0 && activePhrase.length > 0 ? {
      radioIds: readyRadios.slice(0, 3).map(r => r.id),
      phraseId: activePhrase[0].id,
      days: [1, 2, 3, 4, 5], // Lunes a Viernes
      startTime: "08:00",
      endTime: "09:00",
      aiModel: "estandar",
      description: "Ejemplo de monitoreo desde la base de datos"
    } : null;

    return NextResponse.json({
      success: true,
      message: `Base de datos verificada: ${radioStats.readyForMonitoring} radios y ${phraseStats.active} frases listas`,
      
      // Estadísticas
      stats: {
        radios: radioStats,
        phrases: phraseStats
      },
      
      // Datos completos
      data: {
        radios: radios.map(radio => ({
          id: radio.id,
          name: radio.name,
          region: radio.region,
          status: radio.status,
          platform: radio.platform,
          hasStreamUrl: !!radio.streamUrl,
          streamUrl: radio.streamUrl ? radio.streamUrl.substring(0, 50) + '...' : null,
          ready: radio.status === 'ACTIVE' && !!radio.streamUrl
        })),
        
        phrases: phrases.map(phrase => ({
          id: phrase.id,
          phrase: phrase.phrase,
          brand: phrase.brand,
          campaign: phrase.campaign,
          category: phrase.category,
          active: phrase.active,
          confidence: phrase.confidence,
          priority: phrase.priority
        }))
      },
      
      // Radios y frases listas para usar
      readyForMonitoring: {
        radios: readyRadios.map(r => ({
          id: r.id,
          name: r.name,
          region: r.region,
          platform: r.platform
        })),
        phrases: activePhrase.map(p => ({
          id: p.id,
          phrase: p.phrase,
          brand: p.brand
        }))
      },
      
      // Ejemplo de uso
      exampleUsage,
      
      // Recomendaciones
      recommendations: [
        radioStats.readyForMonitoring > 0 ? 
          `✅ ${radioStats.readyForMonitoring} radios listas para monitoreo` : 
          '❌ No hay radios listas. Verifica que tengan streamUrl y estén ACTIVE',
        
        phraseStats.active > 0 ? 
          `✅ ${phraseStats.active} frases activas disponibles` : 
          '❌ No hay frases activas. Agrega frases para detectar',
        
        exampleUsage ? 
          '✅ Sistema listo para usar. Usa el exampleUsage en el dashboard' : 
          '❌ Sistema no está listo. Necesitas radios y frases configuradas'
      ],
      
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error verificando base de datos:', error);
    return NextResponse.json({
      success: false,
      error: 'Error verificando base de datos',
      details: error.message,
      suggestions: [
        'Verifica que la base de datos esté corriendo',
        'Ejecuta: npx prisma generate',
        'Ejecuta: npx prisma db push',
        'Verifica la variable DATABASE_URL en .env'
      ]
    }, { status: 500 });
  }
}

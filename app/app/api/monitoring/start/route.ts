import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Configuración de la VPS
const VPS_CONFIG = {
  host: process.env.VPS_HOST || '173.249.26.38',
  port: process.env.VPS_PORT || '3000',
  endpoint: '/api/schedule'
};

// Función para verificar si la VPS está disponible
async function checkVPSHealth() {
  try {
    const healthUrl = `http://${VPS_CONFIG.host}:${VPS_CONFIG.port}/`;
    const response = await fetch(healthUrl, { 
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 segundos timeout
    });
    return response.ok;
  } catch (error: any) {
    console.error('❌ VPS no disponible:', error.message);
    return false;
  }
}

// Enviar programación de grabación al VPS
async function sendScheduleToVPS(scheduleData: any) {
  try {
    const vpsUrl = `http://${VPS_CONFIG.host}:${VPS_CONFIG.port}${VPS_CONFIG.endpoint}`;
    
    console.log('📡 Enviando programación a VPS:', vpsUrl);
    console.log('📋 Datos:', JSON.stringify(scheduleData, null, 2));

    const response = await fetch(vpsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData),
      signal: AbortSignal.timeout(10000) // 10 segundos timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`VPS respondió con error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ VPS respondió correctamente:', result);
    return result;

  } catch (error: any) {
    console.error('❌ Error enviando a VPS:', error.message);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📥 Request recibido:', JSON.stringify(body, null, 2));

    // Validar datos requeridos para programación
    const { 
      userId, 
      radioIds, 
      phraseId, 
      days, 
      startTime, 
      endTime, 
      aiModel,
      description 
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId es requerido' }, { status: 400 });
    }

    if (!radioIds || !Array.isArray(radioIds) || radioIds.length === 0) {
      return NextResponse.json({ error: 'Debe seleccionar al menos una radio' }, { status: 400 });
    }

    if (!phraseId) {
      return NextResponse.json({ error: 'Debe seleccionar una frase a detectar' }, { status: 400 });
    }

    if (!days || !Array.isArray(days) || days.length === 0) {
      return NextResponse.json({ error: 'Debe seleccionar al menos un día' }, { status: 400 });
    }

    if (!startTime || !endTime) {
      return NextResponse.json({ error: 'Horario de inicio y fin son requeridos' }, { status: 400 });
    }

    // Obtener datos de las radios y la frase desde la base de datos
    const [radios, phrase] = await Promise.all([
      prisma.radio.findMany({
        where: {
          id: { in: radioIds },
          status: 'ACTIVE'
        },
        select: {
          id: true,
          name: true,
          streamUrl: true,
          region: true,
          metadata: true
        }
      }),
      prisma.phrase.findUnique({
        where: { id: phraseId },
        select: {
          id: true,
          phrase: true,
          brand: true,
          campaign: true,
          category: true,
          description: true,
          active: true
        }
      })
    ]);

    if (radios.length === 0) {
      return NextResponse.json({ error: 'No se encontraron radios válidas' }, { status: 404 });
    }

    if (!phrase || !phrase.active) {
      return NextResponse.json({ error: 'Frase no encontrada o inactiva' }, { status: 404 });
    }

    console.log(`📻 Procesando ${radios.length} radios para programación`);
    console.log(`🔍 Frase a detectar: "${phrase.phrase}" de ${phrase.brand}`);

    // Preparar datos de las radios para la VPS
    const radiosForVPS = radios.map(radio => {
      // Extraer streamUrl desde platformData o usar el campo directo como fallback
      let actualStreamUrl = radio.streamUrl;
      
      if (radio.metadata && typeof radio.metadata === 'object') {
        const metadata = radio.metadata as any;
        if (metadata.platformData && metadata.platformData.url) {
          actualStreamUrl = metadata.platformData.url.replace(/`/g, '').trim();
        }
      }
      
      return {
        id: radio.id,
        name: radio.name,
        streamUrl: actualStreamUrl,
        region: radio.region || 'No especificada',
        metadata: radio.metadata
      };
    });

    // Calcular duración en segundos
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    let durationMinutes = endMinutes - startMinutes;
    
    // Manejar horarios que cruzan medianoche (ej: 22:00 - 02:00)
    if (durationMinutes <= 0) {
      durationMinutes = (24 * 60) + durationMinutes;
    }
    
    const durationSeconds = durationMinutes * 60;

    // Preparar datos completos para enviar a la VPS
    const scheduleData = {
      userId: userId,
      radios: radiosForVPS,
      days: days,
      schedule: {
        startTime: startTime,
        endTime: endTime,
        duration: durationSeconds
      },
      phrase: {
        id: phrase.id,
        text: phrase.phrase,
        brand: phrase.brand,
        campaign: phrase.campaign || 'Sin campaña',
        category: phrase.category,
        description: phrase.description || ''
      },
      detection: {
        aiModel: aiModel || 'estandar',
        language: 'es',
        autoTranscription: true,
        phraseDetection: true
      },
      metadata: {
        description: description || `Monitoreo de "${phrase.phrase}" en ${radios.length} radio(s)`,
        createdAt: new Date().toISOString(),
        totalRadios: radios.length,
        source: 'monitoring_start',
        estimatedCost: calculateEstimatedCost(radios.length, durationMinutes, aiModel || 'estandar')
      }
    };

    // Función para calcular costo estimado
    function calculateEstimatedCost(radioCount: number, minutes: number, model: string) {
      const modelPrices = { estandar: 10, premium: 25, empresarial: 50 };
      const basePrice = modelPrices[model as keyof typeof modelPrices] || 10;
      return radioCount * Math.ceil(minutes / 60) * basePrice;
    }

    // Verificar que la VPS esté disponible antes de enviar
    console.log('🔍 Verificando estado de la VPS...');
    const vpsHealthy = await checkVPSHealth();
    
    if (!vpsHealthy) {
      console.error('❌ VPS no está disponible');
      return NextResponse.json({
        success: false,
        error: 'VPS no disponible',
        details: `No se puede conectar con la VPS en ${VPS_CONFIG.host}:${VPS_CONFIG.port}. Verifique que el servidor esté corriendo.`,
        vpsConfig: {
          host: VPS_CONFIG.host,
          port: VPS_CONFIG.port,
          endpoint: VPS_CONFIG.endpoint
        }
      }, { status: 503 });
    }

    // Enviar programación a la VPS
    try {
      console.log('✅ VPS disponible, enviando programación...');
      const vpsResponse = await sendScheduleToVPS(scheduleData);

      return NextResponse.json({
        success: true,
        message: 'Programación de monitoreo enviada correctamente a la VPS',
        data: {
          // Información de programación
          scheduledRadios: radios.length,
          days: days,
          timeRange: `${startTime} - ${endTime}`,
          duration: `${durationMinutes} minutos`,
          
          // Información de la frase a detectar
          phrase: {
            text: phrase.phrase,
            brand: phrase.brand,
            campaign: phrase.campaign || 'Sin campaña'
          },
          
          // Información de las radios
          radios: radiosForVPS.map(r => ({ 
            id: r.id, 
            name: r.name, 
            region: r.region,
            hasValidUrl: !!r.streamUrl
          })),
          
          // Configuración de detección
          detection: {
            aiModel: aiModel || 'estandar',
            language: 'es'
          },
          
          // Costos estimados
          estimatedCost: scheduleData.metadata.estimatedCost,
          
          // Respuesta de la VPS
          vpsResponse
        },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ Error enviando programación a VPS:', error);
      return NextResponse.json({
        success: false,
        error: 'Error al enviar programación a la VPS',
        details: error.message
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Error iniciando monitoreo:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

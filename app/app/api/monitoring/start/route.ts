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
<<<<<<< HEAD
      const errorText = await response.text();
      throw new Error(`VPS respondió con error ${response.status}: ${errorText}`);
=======
      const errorBody = await response.text(); 
      console.error(`❌ El VPS respondió con un error: ${response.status} ${response.statusText}`);
      console.error(`❌ Cuerpo de la respuesta del VPS:`, errorBody);
      throw new Error(`Error al enviar señal al VPS: ${response.statusText}`);
>>>>>>> origin/feature/mzurita
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
    
<<<<<<< HEAD
    console.log('📥 Request recibido:', JSON.stringify(body, null, 2));
=======
    // Detectar si es una solicitud individual o masiva
    const isIndividualRequest = body.radioId && !body.radioIds;
    // Extraer horarios de grabación (por defecto 5 AM - 2 AM)
    const recordingStartHour = body.recordingStartHour ?? 5;
    const recordingEndHour = body.recordingEndHour ?? 2;
    
    console.log('📥 Request recibido:', JSON.stringify(body, null, 2));
    console.log('🔍 Tipo de solicitud:', isIndividualRequest ? 'Individual' : 'Masiva');
    console.log(`⏰ Horarios de grabación: ${recordingStartHour}:00 - ${recordingEndHour}:00`);
>>>>>>> origin/feature/mzurita

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

<<<<<<< HEAD
    if (!days || !Array.isArray(days)) {
      return NextResponse.json({ error: 'El parámetro days debe ser un array' }, { status: 400 });
    }

    if (!startTime || !endTime) {
      return NextResponse.json({ error: 'Horario de inicio y fin son requeridos' }, { status: 400 });
    }

    // Obtener datos completos de las radios seleccionadas desde la base de datos
    console.log(`🔍 Buscando radios con IDs: ${radioIds.join(', ')}`);
    
    const radios = await prisma.radio.findMany({
      where: {
        id: {
          in: radioIds
        },
        status: 'ACTIVE' // Solo radios activas
      },
      select: {
        id: true,
        name: true,
        streamUrl: true,
        region: true,
        metadata: true,
        status: true,
        platform: true
      }
    });

    console.log(`📻 Encontradas ${radios.length} radios activas de ${radioIds.length} solicitadas`);

    if (radios.length === 0) {
      return NextResponse.json({ 
        error: 'No se encontraron radios válidas o activas',
        details: `Se buscaron las radios con IDs: ${radioIds.join(', ')}. Verifica que existan y estén activas.`
      }, { status: 404 });
    }

    // Obtener datos de la frase desde la base de datos
    console.log(`🔍 Buscando frase con ID: ${phraseId}`);
    
    const phrase = await prisma.phrase.findUnique({
      where: { 
        id: phraseId,
        active: true // Solo frases activas
      },
      select: {
        id: true,
        phrase: true,
        brand: true,
        campaign: true,
        category: true,
        description: true,
        active: true,
        confidence: true,
        priority: true
      }
    });

    if (!phrase) {
      return NextResponse.json({ 
        error: 'Frase no encontrada o inactiva',
        details: `Se buscó la frase con ID: ${phraseId}. Verifica que exista y esté activa.`
      }, { status: 404 });
    }

    console.log(`🔍 Frase encontrada: "${phrase.phrase}" de ${phrase.brand}`);

    console.log(`📻 Procesando ${radios.length} radios para programación`);
    console.log(`🔍 Frase a detectar: "${phrase.phrase}" de ${phrase.brand}`);

    // Preparar datos de las radios para la VPS
    const radiosForVPS = radios.map((radio: any) => {
      // Extraer streamUrl desde diferentes fuentes posibles
      let actualStreamUrl = radio.streamUrl;
      
      // Si no hay streamUrl directo, buscar en metadata
      if (!actualStreamUrl && radio.metadata && typeof radio.metadata === 'object') {
        const metadata = radio.metadata as any;
=======
    // Intentar obtener userId válido (sesión aún no integrada: usar primer usuario como fallback)
    let userId: string | null = null;
    try {
      const firstUser = await prisma.user.findFirst({ select: { id: true } });
      if (firstUser) userId = firstUser.id;
    } catch (e) {
      console.warn('⚠️ No se pudo obtener un usuario por defecto.');
    }

    if (!userId) {
      // Si no hay usuario, abortar para evitar violar el esquema (MonitoringSession.userId es requerido)
      return NextResponse.json({
        success: false,
        error: 'No existe un usuario en la base de datos para asociar la sesión. Crea al menos un usuario o configura autenticación.'
      }, { status: 400 });
    }

    // Enviar señal al VPS y crear sesión por cada radio
    const results = [] as Array<{ radioId: string; radioName: string; sessionId?: string; success: boolean; message?: string; error?: string; streamUrl?: string; recordingHours?: string }>;
    for (const radio of radiosToProcess) {
      try {
        console.log(`🚀 Iniciando grabación para ${radio.name} (${radio.id})`);
        console.log(`📊 Datos completos de la radio:`, JSON.stringify(radio, null, 2));
>>>>>>> origin/feature/mzurita
        
        // Buscar en platformData
        if (metadata.platformData && metadata.platformData.url) {
          actualStreamUrl = metadata.platformData.url.replace(/`/g, '').trim();
        }
        // Buscar en otros campos posibles
        else if (metadata.url) {
          actualStreamUrl = metadata.url.replace(/`/g, '').trim();
        }
        else if (metadata.stream_url) {
          actualStreamUrl = metadata.stream_url.replace(/`/g, '').trim();
        }
<<<<<<< HEAD
=======
        
        // 1) Crear sesión de monitoreo en la base de datos con horarios
        const session = await prisma.monitoringSession.create({
          data: {
            radioId: radio.id,
            userId: userId,
            status: 'ACTIVE',
            captureInterval: 30,
            captureDuration: 600, // 10 minutos
            recordingStartHour: recordingStartHour,
            recordingEndHour: recordingEndHour,
            configuration: {
              streamUrl: actualStreamUrl,
              language: 'es',
              autoTranscription: true,
              phraseDetection: true
            }
          }
        });

        console.log(`✅ Sesión de monitoreo creada: ${session.id}`);

        // 2) Enviar señal al VPS
        await sendSignalToVPS(radio.id, actualStreamUrl);

        // 3) Resumen
        results.push({
          radioId: radio.id,
          radioName: radio.name,
          sessionId: session.id,
          success: true,
          message: 'Grabación iniciada exitosamente',
          streamUrl: actualStreamUrl,
          recordingHours: `${recordingStartHour}:00 - ${recordingEndHour}:00`
        });
      } catch (error: any) {
        console.error(`❌ Error con radio ${radio.name}:`, error.message);
        results.push({
          radioId: radio.id,
          radioName: radio.name,
          success: false,
          error: error.message
        });
>>>>>>> origin/feature/mzurita
      }
      
      // Log para debugging
      console.log(`📻 Radio ${radio.name}:`);
      console.log(`   🔗 Stream URL: ${actualStreamUrl}`);
      console.log(`   📍 Región: ${radio.region}`);
      
      return {
        id: radio.id,
        name: radio.name,
        streamUrl: actualStreamUrl,
        region: radio.region || 'No especificada',
        hasValidUrl: !!actualStreamUrl
      };
    });

    // Verificar que todas las radios tengan URLs válidas
    const radiosWithoutUrl = radiosForVPS.filter(radio => !radio.streamUrl);
    if (radiosWithoutUrl.length > 0) {
      console.warn('⚠️ Radios sin URL de stream:', radiosWithoutUrl.map(r => r.name));
      return NextResponse.json({ 
        error: `Las siguientes radios no tienen URL de stream configurada: ${radiosWithoutUrl.map(r => r.name).join(', ')}`,
        details: 'Verifique la configuración de las radios en la base de datos'
      }, { status: 400 });
    }

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

<<<<<<< HEAD
    // Procesar días: si está vacío o contiene nulls, usar todos los días
    const processedDays = days.length === 0 || days.some(day => day === null) 
      ? [1, 2, 3, 4, 5, 6, 0] // Todos los días (Lun-Dom)
      : days.filter(day => day !== null && typeof day === 'number'); // Filtrar días válidos

    console.log(`📅 Días originales: ${JSON.stringify(days)}`);
    console.log(`📅 Días procesados: ${JSON.stringify(processedDays)}`);
    
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const selectedDayNames = processedDays.map(day => dayNames[day]).join(', ');
    console.log(`📅 Días seleccionados: ${selectedDayNames}`);

    // Preparar datos completos para enviar a la VPS
    const scheduleData = {
      userId: userId,
      radios: radiosForVPS,
      days: processedDays,
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
=======
    // Respuesta diferente para solicitudes individuales vs masivas
    if (isIndividualRequest) {
      const result = results[0];
      if (result.success) {
        return NextResponse.json({
          success: true,
          sessionId: result.sessionId,
          message: result.message,
          radioName: result.radioName,
          streamUrl: result.streamUrl,
          recordingHours: result.recordingHours
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.error
        }, { status: 400 });
>>>>>>> origin/feature/mzurita
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
          days: processedDays,
          timeRange: `${startTime} - ${endTime}`,
          duration: `${durationMinutes} minutos`,
          
          // Información de la frase a detectar
          phrase: {
            text: phrase.phrase,
            brand: phrase.brand,
            campaign: phrase.campaign || 'Sin campaña'
          },
          
          // Información de las radios
          radios: radiosForVPS.map((r: any) => ({ 
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

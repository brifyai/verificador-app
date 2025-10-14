import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      body: JSON.stringify(scheduleData)
    });
    if (!response.ok) {
      const errorBody = await response.text(); 
      console.error(`❌ El VPS respondió con un error: ${response.status} ${response.statusText}`);
      console.error(`❌ Cuerpo de la respuesta del VPS:`, errorBody);
      throw new Error(`Error al enviar señal al VPS: ${response.statusText}`);
    }
    const result = await response.json();
    console.log('✅ VPS respondió correctamente:', result);
    return result;

  } catch (error: any) {
    console.error('❌ Error enviando a VPS:', error.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('\n\n');
    console.log('🚀 ========================================');
    console.log('🚀 === INICIANDO PROCESO DE MONITOREO ===');
    console.log('🚀 ========================================');
    console.log('📅 Timestamp:', new Date().toISOString());
    
    const body = await request.json();
    console.log('📥 ===== DATOS RECIBIDOS DEL DASHBOARD =====');
    console.log(JSON.stringify(body, null, 2));
    console.log('📥 ========================================');
    console.log('📊 Resumen de datos:', {
      userId: body.userId,
      radioIds: body.radioIds?.length || 0,
      phraseId: body.phraseId,
      days: body.days,
      startTime: body.startTime,
      endTime: body.endTime
    });

    // CHECKPOINT 1: Verificar que lleguen los datos básicos
    if (!body.userId) {
      console.error('❌ CHECKPOINT 1 FAILED: userId faltante');
      return NextResponse.json({
        success: false,
        error: 'userId es requerido',
        checkpoint: 'userId_validation'
      }, { status: 400 });
    }

    if (!body.radioIds || body.radioIds.length === 0) {
      console.error('❌ CHECKPOINT 1 FAILED: radioIds faltante o vacío');
      return NextResponse.json({
        success: false,
        error: 'Debe seleccionar al menos una radio',
        checkpoint: 'radioIds_validation'
      }, { status: 400 });
    }

    console.log('✅ CHECKPOINT 1 PASSED: Datos básicos recibidos correctamente');

    // CHECKPOINT 2: Verificar conexión a la base de datos y usuario
    try {
      const dbTest = await prisma.user.findFirst();
      console.log('✅ CHECKPOINT 2 PASSED: Conexión a BD exitosa');
      
      // Verificar que el usuario existe
      const userExists = await prisma.user.findUnique({
        where: { id: body.userId }
      });
      
      if (!userExists) {
        console.error(`❌ Usuario no encontrado: ${body.userId}`);
        console.log('🔍 Buscando o creando usuario por defecto...');
        
        // Buscar el primer usuario disponible o crear uno por defecto
        let defaultUser = await prisma.user.findFirst();
        
        if (!defaultUser) {
          console.log('⚠️ No hay usuarios en la BD, creando usuario por defecto...');
          defaultUser = await prisma.user.create({
            data: {
              email: 'admin@ondaverificada.com',
              password: 'temp-password-change-me', // Contraseña temporal
              name: 'Administrador Sistema',
              role: 'ADMIN'
            }
          });
          console.log(`✅ Usuario por defecto creado: ${defaultUser.id}`);
        }
        
        // Actualizar el userId en el body
        body.userId = defaultUser.id;
        console.log(`✅ Usando usuario: ${defaultUser.name} (${defaultUser.id})`);
      } else {
        console.log(`✅ Usuario verificado: ${userExists.name} (${userExists.id})`);
      }
      
    } catch (dbError: any) {
      console.error('❌ CHECKPOINT 2 FAILED: Error de conexión a BD:', dbError.message);
      return NextResponse.json({
        success: false,
        error: 'Error de conexión a la base de datos',
        details: dbError.message,
        checkpoint: 'database_connection'
      }, { status: 500 });
    }

    // Validar datos requeridos para programación
    const { 
      userId, 
      radioIds, 
      phraseId, 
      days, 
      startTime, 
      endTime, 
      aiModel,
      aiProvider,
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
      aiProvider: aiProvider || null, // Proveedor de IA seleccionado por el usuario
      radios: radiosForVPS,
      days: processedDays,
      status: 'ACTIVE', // Estado inicial del monitoreo
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
        aiProvider: aiProvider || null,
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

    // CHECKPOINT 3: Antes de crear sesiones
    // NOTA: Creamos las sesiones PRIMERO, luego intentamos enviar al VPS
    // Esto asegura que los datos se guarden incluso si el VPS no está disponible
    console.log('🚀 CHECKPOINT 3: Iniciando creación de sesiones en BD');
    console.log(`📊 Datos para crear sesiones:`, {
      totalRadios: radios.length,
      userId: userId,
      phraseId: phraseId,
      startTime: startTime,
      endTime: endTime
    });

    // 1. Crear sesiones de monitoreo en la base de datos local
    console.log('💾 Creando sesiones de monitoreo en la base de datos...');
    console.log(`🔍 Verificando conexión a BD - Total radios a procesar: ${radios.length}`);
    
    // Verificar conexión a la base de datos
    try {
      const testConnection = await prisma.user.findFirst();
      console.log(`✅ Conexión a BD exitosa - Usuario de prueba: ${testConnection?.id || 'No encontrado'}`);
    } catch (dbError: any) {
      console.error('❌ Error de conexión a la base de datos:', dbError.message);
      return NextResponse.json({
        success: false,
        error: 'Error de conexión a la base de datos',
        details: dbError.message
      }, { status: 500 });
    }
    
    const createdSessions = [];
    
    for (const radio of radios) {
      try {
        console.log(`📝 Creando sesión para radio: ${radio.name}`);
        
        const session = await prisma.monitoringSession.create({
          data: {
            // Relaciones requeridas
            radio: {
              connect: { id: radio.id }
            },
            user: {
              connect: { id: userId }
            },
            
            // Campos exactos de la tabla monitoring_sessions
            status: 'ACTIVE',
            startTime: new Date(), // timestamp with time zone
            endTime: null, // Se establecerá cuando termine
            captureInterval: 30, // integer - segundos entre capturas
            captureDuration: 10, // integer - duración de cada captura (según la tabla es 10, no 600)
            totalCaptures: 0, // integer - inicia en 0
            totalDetections: 0, // integer - inicia en 0
            lastCaptureAt: null, // timestamp - se establecerá con la primera captura
            lastDetectionAt: null, // timestamp - se establecerá con la primera detección
            recordingStartHour: parseInt(startTime.split(':')[0]), // integer - hora de inicio (5 por defecto)
            recordingEndHour: parseInt(endTime.split(':')[0]), // integer - hora de fin (2 por defecto)
            
            // JSON fields - información completa
            configuration: {
              // Información del stream y radio
              streamUrl: radiosForVPS.find(r => r.id === radio.id)?.streamUrl || '',
              radioId: radio.id, // Guardamos el radioId en configuration
              radioName: radio.name,
              radioRegion: radio.region,
              
              // Configuración de IA y detección
              language: 'es',
              aiModel: aiModel || 'estandar',
              aiProvider: aiProvider || null, // Proveedor de IA seleccionado
              autoTranscription: true,
              phraseDetection: true,
              
              // Información completa de la frase
              phrase: {
                id: phrase.id,
                text: phrase.phrase,
                brand: phrase.brand,
                campaign: phrase.campaign || 'Sin campaña',
                category: phrase.category,
                description: phrase.description
              },
              
              // Configuración de horarios
              schedule: {
                startTime: startTime,
                endTime: endTime,
                days: processedDays,
                duration: durationSeconds,
                durationMinutes: durationMinutes
              }
            },
            
            metadata: {
              // Request original completo
              originalRequest: {
                userId: userId,
                radioIds: radioIds,
                phraseId: phraseId,
                days: days,
                startTime: startTime,
                endTime: endTime,
                aiModel: aiModel,
                aiProvider: aiProvider,
                description: description
              },
              
              // Datos para el VPS
              vpsData: {
                scheduleData: scheduleData,
                vpsScheduleId: `schedule_${userId}_${Date.now()}`,
                estimatedCost: scheduleData.metadata.estimatedCost
              },
              
              // Información de creación
              creation: {
                createdFrom: 'monitoring_start_api',
                createdAt: new Date().toISOString(),
                source: 'dashboard_monitoring',
                totalRadios: radios.length
              }
            }
          }
        });

        console.log(`✅ CHECKPOINT 4 PASSED: Sesión creada exitosamente: ${session.id}`);
        console.log(`📊 Datos guardados en monitoring_sessions:`, {
          id: session.id,
          userId: session.userId,
          status: session.status,
          startTime: session.startTime,
          captureInterval: session.captureInterval,
          captureDuration: session.captureDuration,
          recordingStartHour: session.recordingStartHour,
          recordingEndHour: session.recordingEndHour,
          hasConfiguration: !!session.configuration,
          hasMetadata: !!session.metadata
        });
        
        // Verificar que se guardó correctamente
        const verifySession = await prisma.monitoringSession.findUnique({
          where: { id: session.id }
        });
        console.log(`🔍 VERIFICACIÓN: Sesión ${session.id} ${verifySession ? 'ENCONTRADA' : 'NO ENCONTRADA'} en BD`);
        
        createdSessions.push(session);
        
      } catch (error: any) {
        console.error(`❌ Error creando sesión para ${radio.name}:`, error.message);
        console.error(`❌ Error completo:`, {
          message: error.message,
          code: error.code,
          meta: error.meta,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    }

    console.log('\n');
    console.log('✅ ========================================');
    console.log(`✅ RESULTADO: ${createdSessions.length} SESIONES CREADAS Y GUARDADAS EN BD`);
    console.log('✅ ========================================');
    
    if (createdSessions.length > 0) {
      console.log('📋 IDs de sesiones creadas:');
      createdSessions.forEach((session: any, index: number) => {
        console.log(`   ${index + 1}. ${session.id}`);
      });
    }
    console.log('\n');

    // 2. Intentar enviar programación a la VPS (OPCIONAL - no bloquea si falla)
    let vpsResponse = null;
    let vpsSuccess = false;
    
    try {
      console.log('📡 Verificando estado de la VPS...');
      const vpsHealthy = await checkVPSHealth();
      
      if (vpsHealthy) {
        console.log('📡 VPS disponible, enviando programación...');
        
        // Agregar los sessionIds al scheduleData
        const scheduleDataWithSessions = {
          ...scheduleData,
          sessions: createdSessions.map((session: any) => ({
            sessionId: session.id,
            radioId: session.radioId,
            radioName: radios.find(r => r.id === session.radioId)?.name || 'Unknown'
          }))
        };
        
        vpsResponse = await sendScheduleToVPS(scheduleDataWithSessions);
        vpsSuccess = true;
        console.log('✅ Programación enviada exitosamente al VPS');
      } else {
        console.log('⚠️ VPS no disponible, pero las sesiones ya fueron creadas en BD');
      }
    } catch (vpsError: any) {
      console.error('⚠️ Error al enviar al VPS (no crítico):', vpsError.message);
      console.log('✅ Las sesiones fueron creadas correctamente en la BD local');
    }

    // SIEMPRE retornar éxito si las sesiones se crearon, independientemente del VPS
    return NextResponse.json({
      success: true,
      message: vpsSuccess 
        ? `Monitoreo iniciado correctamente. ${createdSessions.length} sesiones creadas y programación enviada al VPS.`
        : `Monitoreo creado correctamente. ${createdSessions.length} sesiones guardadas en BD. (VPS no disponible)`,
        data: {
          // Sesiones creadas en la base de datos
          createdSessions: createdSessions.map((session: any) => ({
            id: session.id,
            radioId: session.radioId,
            radioName: radios.find(r => r.id === session.radioId)?.name || 'Radio desconocida',
            status: session.status,
            startTime: session.startTime,
            recordingHours: `${session.recordingStartHour}:00 - ${session.recordingEndHour}:00`
          })),
          
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
            aiProvider: aiProvider || null,
            language: 'es'
          },
          
          // Costos estimados
          estimatedCost: scheduleData.metadata.estimatedCost,
          
          // Respuesta de la VPS
          vpsResponse
        },
        timestamp: new Date().toISOString(),
        vpsAvailable: vpsSuccess
      });

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

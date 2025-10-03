import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import fetch from 'node-fetch';

export const dynamic = 'force-dynamic';

// Enviar señal al VPS con streamUrl real
async function sendSignalToVPS(id: string, streamUrl: string) {
  try {
    if (!process.env.VPS_HOST || !process.env.VPS_USER || !process.env.VPS_PASSWORD) {
      throw new Error('Faltan variables de entorno necesarias para el VPS');
    }

    const vpsData = {
      ip: process.env.VPS_HOST,
      user: process.env.VPS_USER,
      password: process.env.VPS_PASSWORD,
      action: 'start_recording',
      id,
      streamUrl,
      captureDuration: 600, // 10 minutos fijos
      timestamp: new Date().toISOString()
    };

    const vpsEndpoint = `http://${process.env.VPS_HOST}${process.env.VPS_API_ENDPOINT || '/api/recording'}`;

    console.log(`📡 Enviando señal al VPS para radio ${id}`);

    const response = await fetch(vpsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${vpsData.user}:${vpsData.password}`).toString('base64')}`
      },
      body: JSON.stringify(vpsData)
    });

    if (!response.ok) {
      throw new Error(`Error al enviar señal al VPS: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ VPS respondió correctamente: ${JSON.stringify(result)}`);
    return result;
  } catch (error: any) {
    console.error(`❌ Error enviando señal al VPS: ${error.message}`);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Detectar si es una solicitud individual o masiva
    const isIndividualRequest = body.radioId && !body.radioIds;
    
    console.log('📥 Request recibido:', JSON.stringify(body, null, 2));
    console.log('🔍 Tipo de solicitud:', isIndividualRequest ? 'Individual' : 'Masiva');

    // Determinar qué radios procesar
    let radiosToProcess = [];

    if (isIndividualRequest) {
      // Solicitud individual desde el componente MonitoringControl
      const { radioId } = body;
      
      const radio = await prisma.radio.findUnique({
        where: { id: radioId },
        select: { id: true, name: true, streamUrl: true, metadata: true }
      });
      
      if (!radio) {
        return NextResponse.json({ error: 'Radio no encontrada' }, { status: 404 });
      }
      
      radiosToProcess = [radio];
    } else {
      // Solicitud masiva desde la página de monitoreo
      const { radioIds, filterType, selectedRegion, selectedCity } = body;

      if (filterType === 'all') {
        // Obtener todas las radios activas
        const allRadios = await prisma.radio.findMany({
          where: { status: 'ACTIVE' },
          select: { id: true, name: true, streamUrl: true, metadata: true }
        });
        radiosToProcess = allRadios;
      } else if (filterType === 'region' && selectedRegion) {
        // Obtener radios por región
        const regionRadios = await prisma.radio.findMany({
          where: { 
            status: 'ACTIVE',
            region: selectedRegion
          },
          select: { id: true, name: true, streamUrl: true, metadata: true }
        });
        radiosToProcess = regionRadios;
      } else if (filterType === 'custom' && radioIds && radioIds.length > 0) {
        // Obtener radios específicas seleccionadas
        const customRadios = await prisma.radio.findMany({
          where: { 
            id: { in: radioIds },
            status: 'ACTIVE'
          },
          select: { id: true, name: true, streamUrl: true, metadata: true }
        });
        radiosToProcess = customRadios;
      } else {
        return NextResponse.json({ error: 'Configuración de filtro inválida' }, { status: 400 });
      }
    }

    if (radiosToProcess.length === 0) {
      return NextResponse.json({ error: 'No se encontraron radios para procesar' }, { status: 400 });
    }

    console.log(`📻 Procesando ${radiosToProcess.length} radios`);

    // Enviar señal al VPS para cada radio
    const results = [];
    for (const radio of radiosToProcess) {
      try {
        console.log(`🚀 Iniciando grabación para ${radio.name} (${radio.id})`);
        console.log(`📊 Datos completos de la radio:`, JSON.stringify(radio, null, 2));
        
        // Extraer streamUrl desde platformData o usar el campo directo como fallback
        let actualStreamUrl = radio.streamUrl;
        console.log(`🔗 streamUrl directo:`, actualStreamUrl);
        
        if (radio.metadata && typeof radio.metadata === 'object') {
          const metadata = radio.metadata as any;
          console.log(`📋 Metadata completo:`, JSON.stringify(metadata, null, 2));
          
          if (metadata.platformData && metadata.platformData.url) {
            actualStreamUrl = metadata.platformData.url.replace(/`/g, '').trim();
            console.log(`📡 Usando URL desde platformData: ${actualStreamUrl}`);
          } else {
            console.log(`⚠️ No se encontró platformData.url en metadata`);
          }
        } else {
          console.log(`⚠️ No hay metadata o no es un objeto`);
        }
        
        console.log(`✅ URL final a usar: ${actualStreamUrl}`);
        
        if (!actualStreamUrl) {
          throw new Error('No se encontró URL de stream válida');
        }
        
        await sendSignalToVPS(radio.id, actualStreamUrl);
        results.push({
          radioId: radio.id,
          radioName: radio.name,
          success: true,
          message: 'Grabación iniciada exitosamente',
          streamUrl: actualStreamUrl
        });
      } catch (error: any) {
        console.error(`❌ Error con radio ${radio.name}:`, error.message);
        results.push({
          radioId: radio.id,
          radioName: radio.name,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    // Respuesta diferente para solicitudes individuales vs masivas
    if (isIndividualRequest) {
      const result = results[0];
      if (result.success) {
        return NextResponse.json({
          success: true,
          sessionId: `session_${result.radioId}_${Date.now()}`,
          message: result.message,
          radioName: result.radioName,
          streamUrl: result.streamUrl
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.error
        }, { status: 400 });
      }
    } else {
      // Respuesta para solicitudes masivas
      return NextResponse.json({
        success: true,
        message: `Monitoreo iniciado: ${successCount} exitosas, ${failureCount} fallidas`,
        startTime: new Date().toISOString(),
        results,
        summary: {
          total: radiosToProcess.length,
          successful: successCount,
          failed: failureCount
        },
        settings: {
          captureDuration: 600,
          autoTranscription: true,
          phraseDetection: true,
          language: 'es',
          vpsRecording: true
        }
      });
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

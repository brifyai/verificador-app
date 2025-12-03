import { NextRequest, NextResponse } from 'next/server';

// Configuración del VPS
const VPS_CONFIG = {
  baseUrl: 'http://213.199.39.147:5000',
  endpoints: {
    startRecording: '/api/start-recording',
    activeRecordings: '/api/active-recordings',
    recordings: '/api/recordings'
  }
};

/**
 * Endpoint DIRECTO al VPS para grabaciones
 * No usa simulación local, solo comunicación real con el VPS
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🎙️ [RECORDING-VPS-DIRECT] Iniciando grabación directa en VPS...');

    // Obtener datos de la solicitud
    const body = await request.json();
    const { radio_id, stream_url, duration = 3600 } = body;

    // Validar datos
    if (!radio_id || !stream_url) {
      return NextResponse.json({
        success: false,
        message: 'Faltan datos requeridos: radio_id y stream_url son obligatorios',
        status: 'error'
      }, { status: 400 });
    }

    console.log(`📡 Enviando a VPS: radio_id=${radio_id}, stream_url=${stream_url}`);

    // Preparar payload para el VPS
    const payload = {
      radio_id: radio_id.toString(),
      stream_url,
      duration
    };

    // Realizar petición DIRECTA al VPS
    const response = await fetch(`${VPS_CONFIG.baseUrl}${VPS_CONFIG.endpoints.startRecording}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mi-token-secreto' // Token fijo del VPS
      },
      body: JSON.stringify(payload)
    });

    console.log(`📥 Respuesta del VPS: ${response.status} ${response.statusText}`);

    // Leer respuesta del VPS
    let vpsData;
    try {
      vpsData = await response.json();
    } catch (e) {
      vpsData = { message: await response.text() };
    }

    console.log('📄 Datos del VPS:', vpsData);

    // Manejar respuesta del VPS
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: `Error del VPS: ${response.status}`,
        error: vpsData.message || 'Error desconocido del VPS',
        vps_response: vpsData
      }, { status: response.status });
    }

    // Si el VPS devuelve error de "Radio no encontrada"
    if (vpsData.status === 'error' && vpsData.message === 'Radio no encontrada') {
      console.error('❌ VPS devolvió "Radio no encontrada"');
      
      // Devolver error específico para que el frontend lo maneje
      return NextResponse.json({
        success: false,
        message: 'Radio no encontrada en el VPS',
        error: 'RADIO_NOT_FOUND',
        status: 'error',
        vps_response: vpsData,
        radio_id: radio_id,
        debug_info: {
          payload_sent: payload,
          vps_url: VPS_CONFIG.baseUrl + VPS_CONFIG.endpoints.startRecording
        }
      }, { status: 404 });
    }

    // Éxito - Formatear respuesta para el frontend
    if (vpsData.status === 'success' || response.status === 200) {
      console.log('✅ Grabación iniciada exitosamente en el VPS');
      
      return NextResponse.json({
        success: true,
        message: 'Grabación iniciada exitosamente en el VPS',
        status: 'recording',
        recording_id: vpsData.recording_id || radio_id.toString(),
        vps_response: vpsData,
        mode: 'vps_direct',
        started_at: new Date().toISOString(),
        radio_id: radio_id,
        stream_url: stream_url
      });
    }

    // Respuesta inesperada del VPS
    return NextResponse.json({
      success: false,
      message: 'Respuesta inesperada del VPS',
      error: 'VPS_UNEXPECTED_RESPONSE',
      vps_response: vpsData
    }, { status: 500 });

  } catch (error) {
    console.error('💥 Error en recording-vps-direct:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error de conexión con el VPS',
      error: error instanceof Error ? error.message : 'Error desconocido',
      status: 'error'
    }, { status: 500 });
  }
}

/**
 * GET: Obtener grabaciones activas del VPS
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 [RECORDING-VPS-DIRECT] Obteniendo grabaciones activas del VPS...');

    // Realizar petición al VPS
    const response = await fetch(`${VPS_CONFIG.baseUrl}${VPS_CONFIG.endpoints.activeRecordings}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mi-token-secreto'
      }
    });

    if (!response.ok) {
      console.error(`❌ Error del VPS: ${response.status}`);
      return NextResponse.json({
        success: false,
        active_recordings: {},
        count: 0,
        status: 'error',
        message: `Error del VPS: ${response.status}`
      });
    }

    const vpsData = await response.json();
    console.log('✅ Grabaciones activas obtenidas del VPS:', vpsData);

    // Formatear respuesta para ser compatible con el frontend
    return NextResponse.json({
      success: true,
      active_recordings: vpsData.active_recordings || {},
      count: vpsData.count || 0,
      status: 'success',
      source: 'vps_direct'
    });

  } catch (error) {
    console.error('💥 Error obteniendo grabaciones del VPS:', error);
    
    return NextResponse.json({
      success: false,
      active_recordings: {},
      count: 0,
      status: 'error',
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}
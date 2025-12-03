import { NextRequest, NextResponse } from 'next/server';

/**
 * API PROXY PARA GRABACIÓN CON AUTENTICACIÓN VPS
 * 
 * Este endpoint actúa como proxy para comunicarse con el VPS
 * y maneja la autenticación requerida para grabaciones.
 */

const VPS_URL = 'http://213.199.39.147:5000';
const VPS_AUTH_TOKEN = process.env.VPS_AUTH_TOKEN || 'default-recording-token-2024';

export async function POST(request: NextRequest) {
  try {
    console.log('🎙️ [VPS-RECORDING] Iniciando proceso de grabación');
    
    // Obtener datos de la grabación
    const body = await request.json();
    const { radio_id, stream_url, duration = 3600 } = body;
    
    console.log(`📻 [VPS-RECORDING] Radio ID: ${radio_id}`);
    console.log(`🌐 [VPS-RECORDING] Stream URL: ${stream_url}`);
    console.log(`⏱️ [VPS-RECORDING] Duración: ${duration}s`);
    
    // Validar datos requeridos
    if (!radio_id || !stream_url) {
      console.error('❌ [VPS-RECORDING] Faltan datos requeridos');
      return NextResponse.json(
        { error: 'Faltan datos requeridos: radio_id y stream_url son obligatorios' },
        { status: 400 }
      );
    }
    
    // Preparar payload para VPS
    const recordingPayload = {
      radio_id: radio_id,
      stream_url: stream_url,
      duration: duration
    };
    
    console.log(`📤 [VPS-RECORDING] Enviando payload al VPS:`, recordingPayload);
    
    // Realizar petición al VPS con autenticación
    const response = await fetch(`${VPS_URL}/api/start-recording`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_AUTH_TOKEN}`,
        'User-Agent': 'RadioRecorder-Proxy/1.0'
      },
      body: JSON.stringify(recordingPayload)
    });
    
    console.log(`📥 [VPS-RECORDING] VPS Response: ${response.status} ${response.statusText}`);
    
    // Leer respuesta del VPS
    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = { message: await response.text() };
    }
    
    console.log(`📄 [VPS-RECORDING] VPS Data:`, responseData);
    
    // Manejar diferentes códigos de respuesta
    if (response.status === 401) {
      console.error('🔒 [VPS-RECORDING] Autenticación fallida con el VPS');
      return NextResponse.json(
        { 
          error: 'Autenticación fallida con el VPS. Verifica el token de autenticación.',
          details: responseData
        },
        { status: 401 }
      );
    }
    
    if (response.status === 404) {
      console.error('🔍 [VPS-RECORDING] Radio no encontrada en el VPS');
      return NextResponse.json(
        { 
          error: 'Radio no encontrada en el VPS. Verifica el ID de la radio.',
          details: responseData
        },
        { status: 404 }
      );
    }
    
    // Verificar si el VPS devolvió un error en su respuesta
    if (responseData.status === 'error' || responseData.error) {
      console.error(`❌ [VPS-RECORDING] Error del VPS en respuesta:`, responseData);
      
      // Mensaje específico para "Radio no encontrada"
      if (responseData.message === 'Radio no encontrada') {
        return NextResponse.json({
          success: false,
          error: 'La radio no está registrada en el sistema de grabación del VPS',
          details: {
            radio_id: body.radio_id,
            stream_url: body.stream_url,
            vps_response: responseData,
            suggestion: 'Esta radio debe ser registrada manualmente en el VPS antes de poder grabarla'
          },
          vps_status: responseData.status,
          error_type: 'RADIO_NOT_REGISTERED'
        }, { status: 400 });
      }
      
      return NextResponse.json(
        {
          success: false,
          error: responseData.message || 'Error del VPS',
          details: responseData,
          vps_status: responseData.status
        },
        { status: 400 }
      );
    }
    
    if (!response.ok) {
      console.error(`❌ [VPS-RECORDING] Error del VPS: ${response.status}`);
      return NextResponse.json(
        {
          success: false,
          error: `Error del VPS: ${response.statusText}`,
          details: responseData,
          status: response.status
        },
        { status: response.status }
      );
    }
    
    // Éxito
    console.log('✅ [VPS-RECORDING] Grabación iniciada exitosamente');
    return NextResponse.json({
      success: true,
      message: 'Grabación iniciada exitosamente',
      data: responseData,
      recording_id: responseData.recording_id || `recording_${Date.now()}`
    });
    
  } catch (error) {
    console.error('💥 [VPS-RECORDING] Error en el proxy:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📊 [VPS-RECORDING] Consultando estado de grabaciones');
    
    // Consultar grabaciones activas del VPS
    const response = await fetch(`${VPS_URL}/api/active-recordings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VPS_AUTH_TOKEN}`,
        'User-Agent': 'RadioRecorder-Proxy/1.0'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ [VPS-RECORDING] Error al obtener grabaciones activas: ${response.status}`);
      return NextResponse.json(
        { error: 'Error al obtener grabaciones activas del VPS' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`✅ [VPS-RECORDING] Grabaciones activas obtenidas: ${data.count || 0}`);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('💥 [VPS-RECORDING] Error al consultar grabaciones:', error);
    return NextResponse.json(
      { 
        error: 'Error al consultar grabaciones activas',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('⏹️ [VPS-RECORDING] Deteniendo grabación');
    
    const body = await request.json();
    const { radio_id } = body;
    
    if (!radio_id) {
      return NextResponse.json(
        { error: 'radio_id es requerido para detener la grabación' },
        { status: 400 }
      );
    }
    
    console.log(`🎙️ [VPS-RECORDING] Deteniendo grabación para radio_id: ${radio_id}`);
    
    // 1. Primero consultar grabaciones activas para verificar que existe
    const activeResponse = await fetch(`${VPS_URL}/api/active-recordings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VPS_AUTH_TOKEN}`,
        'User-Agent': 'RadioRecorder-Proxy/1.0'
      }
    });
    
    if (!activeResponse.ok) {
      console.error(`❌ [VPS-RECORDING] Error al consultar grabaciones activas: ${activeResponse.status}`);
      return NextResponse.json(
        { error: 'Error al consultar grabaciones activas del VPS' },
        { status: activeResponse.status }
      );
    }
    
    const activeData = await activeResponse.json();
    console.log(`📊 [VPS-RECORDING] Grabaciones activas encontradas: ${Object.keys(activeData.active_recordings || {}).length}`);
    
    // Verificar si la radio está grabando
    const isRecording = activeData.active_recordings && activeData.active_recordings[radio_id];
    
    if (!isRecording) {
      console.log(`ℹ️ [VPS-RECORDING] No se encontró grabación activa para radio ${radio_id}`);
      return NextResponse.json({
        success: true,
        message: 'No se encontró grabación activa para esta radio',
        status: 'not_recording',
        radio_id: radio_id
      });
    }
    
    console.log(`✅ [VPS-RECORDING] Grabación encontrada para radio ${radio_id}, procediendo a detener...`);
    
    // 2. Llamar al VPS para detener la grabación
    const stopResponse = await fetch(`${VPS_URL}/api/stop-recording`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_AUTH_TOKEN}`,
        'User-Agent': 'RadioRecorder-Proxy/1.0'
      },
      body: JSON.stringify({ radio_id: radio_id })
    });
    
    console.log(`📥 [VPS-RECORDING] Respuesta del VPS al detener: ${stopResponse.status} ${stopResponse.statusText}`);
    
    let stopData;
    try {
      stopData = await stopResponse.json();
    } catch (e) {
      stopData = { message: await stopResponse.text() };
    }
    
    console.log(`📄 [VPS-RECORDING] Datos de respuesta al detener:`, stopData);
    
    if (!stopResponse.ok) {
      console.error(`❌ [VPS-RECORDING] Error del VPS al detener: ${stopResponse.status}`);
      return NextResponse.json(
        {
          success: false,
          error: `Error del VPS al detener grabación: ${stopResponse.statusText}`,
          details: stopData,
          status: stopResponse.status
        },
        { status: stopResponse.status }
      );
    }
    
    // Verificar si el VPS devolvió error en su respuesta
    if (stopData.status === 'error' || stopData.error) {
      console.error(`❌ [VPS-RECORDING] Error en respuesta del VPS:`, stopData);
      return NextResponse.json(
        {
          success: false,
          error: stopData.message || 'Error del VPS al detener grabación',
          details: stopData
        },
        { status: 400 }
      );
    }
    
    console.log(`✅ [VPS-RECORDING] Grabación detenida exitosamente para radio ${radio_id}`);
    
    return NextResponse.json({
      success: true,
      message: 'Grabación detenida exitosamente',
      data: stopData,
      radio_id: radio_id,
      status: 'stopped'
    });
    
  } catch (error) {
    console.error('💥 [VPS-RECORDING] Error al detener grabación:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno al detener grabación',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
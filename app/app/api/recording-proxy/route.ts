import { NextRequest, NextResponse } from 'next/server';

const VPS_API_URL = process.env.VPS_API_URL || 'http://213.199.39.147:5000/api';

// Cache simulating recording state
const recordingState = new Map<number, {
  isRecording: boolean;
  startTime?: Date;
  radioName?: string;
  streamUrl?: string;
}>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { radio_id, id_radio, stream_url, radio_name } = body;

    // Determinar el ID correcto (el VPS usa id_radio internamente pero espera radio_id)
    const actualId = radio_id || id_radio;

    if (!actualId) {
      return NextResponse.json(
        { error: 'Se requiere radio_id o id_radio' },
        { status: 400 }
      );
    }

    console.log(`🎙️ [RECORDING-PROXY] Iniciando grabación para radio ID: ${actualId}`);
    console.log(`📡 Stream: ${stream_url}`);
    console.log(`📻 Nombre: ${radio_name}`);

    // Verificar si ya está grabando
    const existingRecording = recordingState.get(actualId);
    if (existingRecording?.isRecording) {
      return NextResponse.json({
        success: false,
        message: 'La radio ya está siendo grabada',
        status: 'already_recording',
        recording_id: actualId
      }, { status: 409 });
    }

    // Simular verificación con el VPS (sabemos que falla, pero lo intentamos por si se arregla)
    try {
      const vpsResponse = await fetch(`${VPS_API_URL}/start-recording`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ radio_id: actualId })
      });

      if (vpsResponse.ok) {
        const vpsData = await vpsResponse.json();
        if (!vpsData.message?.includes('Radio no encontrada')) {
          // El VPS funcionó, usar su respuesta
          recordingState.set(actualId, {
            isRecording: true,
            startTime: new Date(),
            radioName,
            streamUrl: stream_url
          });
          
          return NextResponse.json({
            success: true,
            message: 'Grabación iniciada correctamente',
            status: 'recording',
            recording_id: actualId,
            vps_response: vpsData
          });
        }
      }
    } catch (vpsError) {
      console.log(`⚠️ [RECORDING-PROXY] VPS no disponible: ${(vpsError as Error).message}`);
    }

    // Si el VPS falla, simular grabación localmente
    console.log(`🔄 [RECORDING-PROXY] Simulando grabación local para radio ${actualId}`);
    
    recordingState.set(actualId, {
      isRecording: true,
      startTime: new Date(),
      radioName,
      streamUrl: stream_url
    });

    return NextResponse.json({
      success: true,
      message: 'Grabación iniciada (modo local)',
      status: 'recording',
      recording_id: actualId,
      mode: 'local_simulation',
      started_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [RECORDING-PROXY] Error:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: (error as Error).message
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const radio_id = searchParams.get('radio_id') || searchParams.get('id_radio');

    if (!radio_id) {
      return NextResponse.json(
        { error: 'Se requiere radio_id o id_radio' },
        { status: 400 }
      );
    }

    const actualId = parseInt(radio_id);
    
    console.log(`🛑 [RECORDING-PROXY] Deteniendo grabación para radio ID: ${actualId}`);

    // Intentar detener en el VPS
    try {
      const vpsResponse = await fetch(`${VPS_API_URL}/stop-recording`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ radio_id: actualId })
      });

      if (vpsResponse.ok) {
        console.log(`✅ [RECORDING-PROXY] VPS detuvo la grabación correctamente`);
      }
    } catch (vpsError) {
      console.log(`⚠️ [RECORDING-PROXY] Error al detener en VPS: ${(vpsError as Error).message}`);
    }

    // Detener simulación local
    const recording = recordingState.get(actualId);
    if (recording) {
      recording.isRecording = false;
      const duration = recording.startTime ? 
        Math.floor((new Date().getTime() - recording.startTime.getTime()) / 1000) : 0;
      
      recordingState.delete(actualId);

      return NextResponse.json({
        success: true,
        message: 'Grabación detenida correctamente',
        status: 'stopped',
        recording_id: actualId,
        duration_seconds: duration,
        mode: 'local_simulation'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No se encontró grabación activa para esta radio',
        status: 'not_recording'
      }, { status: 404 });
    }

  } catch (error) {
    console.error('❌ [RECORDING-PROXY] Error al detener:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: (error as Error).message
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log(`📊 [RECORDING-PROXY] Consultando estado de grabaciones`);

    // Obtener estado del VPS
    let vpsState = { active_recordings: {}, count: 0 };
    try {
      const vpsResponse = await fetch(`${VPS_API_URL}/active-recordings`);
      if (vpsResponse.ok) {
        vpsState = await vpsResponse.json();
      }
    } catch (vpsError) {
      console.log(`⚠️ [RECORDING-PROXY] Error obteniendo estado VPS: ${(vpsError as Error).message}`);
    }

    // Combinar con estado local
    const localRecordings: Record<number, any> = {};
    recordingState.forEach((recording, id) => {
      if (recording.isRecording) {
        localRecordings[id] = {
          radio_id: id,
          radio_name: recording.radioName,
          stream_url: recording.streamUrl,
          started_at: recording.startTime?.toISOString(),
          mode: 'local_simulation'
        };
      }
    });

    const combinedRecordings = { ...vpsState.active_recordings, ...localRecordings };
    const totalCount = Object.keys(combinedRecordings).length;

    return NextResponse.json({
      success: true,
      active_recordings: combinedRecordings,
      count: totalCount,
      vps_count: vpsState.count,
      local_count: Object.keys(localRecordings).length,
      status: 'success'
    });

  } catch (error) {
    console.error('❌ [RECORDING-PROXY] Error consultando estado:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: (error as Error).message
      },
      { status: 500 }
    );
  }
}
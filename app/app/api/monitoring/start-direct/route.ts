import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseDirect } from '@/lib/supabase-direct';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { radioIds, phraseId, captureInterval, captureDuration, apiConfigId } = body;

    // Validaciones
    if (!radioIds || !Array.isArray(radioIds) || radioIds.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere al menos una radio' },
        { status: 400 }
      );
    }

    if (!phraseId) {
      return NextResponse.json(
        { error: 'Se requiere una frase para monitorear' },
        { status: 400 }
      );
    }

    // Verificar que las radios existen y están activas
    const radios = await supabaseDirect.request(
      `radios?id=in.(${radioIds.join(',')})&status=eq.ACTIVE&select=*`
    );

    if (!radios || radios.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron radios activas' },
        { status: 404 }
      );
    }

    // Verificar que la frase existe
    const phrases = await supabaseDirect.request(`phrases?id=eq.${phraseId}&select=*`);
    if (!phrases || phrases.length === 0) {
      return NextResponse.json(
        { error: 'Frase no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la configuración de API existe
    const apiConfigs = await supabaseDirect.request(
      `api_configurations?id=eq.${apiConfigId}&enabled=eq.true&select=*`
    );
    if (!apiConfigs || apiConfigs.length === 0) {
      return NextResponse.json(
        { error: 'Configuración de API no encontrada o deshabilitada' },
        { status: 404 }
      );
    }

    // Crear sesiones de monitoreo para cada radio
    const sessions = [];
    for (const radioId of radioIds) {
      const radio = radios.find((r: any) => r.id === radioId);
      if (!radio) continue;

      // Verificar si ya existe una sesión activa para esta radio
      const existingSessions = await supabaseDirect.request(
        `monitoring_sessions?radio_id=eq.${radioId}&status=eq.ACTIVE&select=id`
      );

      if (existingSessions && existingSessions.length > 0) {
        console.log(`⚠️ Ya existe una sesión activa para la radio ${radioId}, saltando...`);
        continue;
      }

      // Crear sesión
      const sessionData = {
        radio_id: radioId,
        user_id: session.user.id,
        status: 'ACTIVE',
        capture_interval: captureInterval || 30,
        capture_duration: captureDuration || 10,
        start_time: new Date().toISOString(),
        configuration: {
          phraseId,
          apiConfigId,
          autoTranscribe: true,
          language: 'es',
          phraseDetection: true
        },
        total_captures: 0,
        total_detections: 0
      };

      const newSession = await supabaseDirect.request('monitoring_sessions', {
        method: 'POST',
        body: JSON.stringify(sessionData)
      });

      sessions.push({
        id: newSession.id,
        radioId: radioId,
        radioName: radio.name,
        status: 'ACTIVE'
      });
    }

    if (sessions.length === 0) {
      return NextResponse.json(
        { error: 'No se pudieron crear sesiones de monitoreo' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        sessions,
        message: `Monitoreo iniciado para ${sessions.length} radio(s)`
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error iniciando monitoreo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
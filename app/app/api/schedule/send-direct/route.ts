import { NextRequest, NextResponse } from 'next/server';
import { supabaseDirect } from '@/lib/supabase-direct';

// Configuración de la VPS
const VPS_CONFIG = {
  host: process.env.VPS_HOST || '173.249.26.38',
  port: process.env.VPS_PORT || '3000',
  endpoint: '/api/schedule'
};

interface ScheduleRequest {
  userId: string;
  radioIds: string[];
  days: number[]; // 0=Domingo, 1=Lunes, ..., 6=Sábado
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  description?: string;
}

interface RadioData {
  id: string;
  name: string;
  streamUrl: string;
}

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
    const body: ScheduleRequest = await request.json();
    
    console.log('📥 Solicitud de programación recibida:', JSON.stringify(body, null, 2));

    // Validar datos requeridos
    if (!body.userId || !body.radioIds || !Array.isArray(body.radioIds) || body.radioIds.length === 0) {
      return NextResponse.json(
        { error: 'userId y radioIds son requeridos' },
        { status: 400 }
      );
    }

    if (!body.days || !Array.isArray(body.days) || body.days.length === 0) {
      return NextResponse.json(
        { error: 'Debe seleccionar al menos un día' },
        { status: 400 }
      );
    }

    if (!body.startTime || !body.endTime) {
      return NextResponse.json(
        { error: 'startTime y endTime son requeridos' },
        { status: 400 }
      );
    }

    // Obtener datos de las radios desde Supabase
    const radios = await supabaseDirect.request(
      `radios?select=id,name,stream_url&id=in.(${body.radioIds.join(',')})`
    );

    if (radios.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron radios válidas' },
        { status: 404 }
      );
    }

    // Calcular duración en segundos
    const [startHour, startMin] = body.startTime.split(':').map(Number);
    const [endHour, endMin] = body.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const durationMinutes = endMinutes - startMinutes;
    const durationSeconds = durationMinutes * 60;

    // Preparar datos para enviar a la VPS
    const scheduleData = {
      userId: body.userId,
      radios: radios.map((radio: any) => ({
        id: radio.id,
        name: radio.name,
        streamUrl: radio.stream_url
      })),
      days: body.days,
      schedule: {
        startTime: body.startTime,
        endTime: body.endTime,
        duration: durationSeconds
      },
      metadata: {
        description: body.description || `Grabación programada para ${radios.length} radio(s)`,
        createdAt: new Date().toISOString(),
        totalRadios: radios.length
      }
    };

    // Enviar a la VPS
    const vpsResponse = await sendScheduleToVPS(scheduleData);

    // Guardar en base de datos local (opcional)
    // Aquí puedes guardar la programación en tu BD si lo necesitas

    return NextResponse.json({
      success: true,
      message: 'Programación enviada correctamente a la VPS',
      data: {
        scheduledRadios: radios.length,
        days: body.days,
        timeRange: `${body.startTime} - ${body.endTime}`,
        duration: `${durationMinutes} minutos`,
        vpsResponse
      }
    });

  } catch (error: any) {
    console.error('❌ Error en endpoint de programación:', error);
    
    return NextResponse.json(
      { 
        error: 'Error al procesar la programación',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
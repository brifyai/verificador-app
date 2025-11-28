import { NextRequest, NextResponse } from 'next/server';

const VPS_API_BASE = 'http://213.199.39.147:5000/api';

export async function GET(request: NextRequest) {
  try {
    // Obtener grabaciones del VPS
    const response = await fetch(`${VPS_API_BASE}/recordings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const vpsData = await response.json();

    // Normalizar el formato de las grabaciones
    if (vpsData.status === 'success' && vpsData.recordings) {
      const normalizedRecordings = vpsData.recordings.map((recording: any) => ({
        filename: recording.filename,
        size: recording.size,
        created_at: recording.created_at || recording.created, // Normalizar campo de fecha
        path: recording.path,
        created: recording.created || recording.created_at, // Mantener compatibilidad
      }));

      return NextResponse.json({
        status: 'success',
        count: normalizedRecordings.length,
        recordings: normalizedRecordings,
      });
    }

    // Si el VPS devuelve un formato diferente, devolverlo tal cual pero con count
    return NextResponse.json({
      status: vpsData.status || 'success',
      count: vpsData.recordings ? vpsData.recordings.length : 0,
      recordings: vpsData.recordings || [],
      message: vpsData.message,
    });

  } catch (error) {
    console.error('Error obteniendo grabaciones del VPS:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Error de conexión con el VPS',
        count: 0,
        recordings: [],
      },
      { status: 500 }
    );
  }
}
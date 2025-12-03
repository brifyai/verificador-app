import { NextRequest, NextResponse } from 'next/server';

const VPS_API_URL = process.env.VPS_API_URL || 'http://213.199.39.147:5000/api';

export async function GET(request: NextRequest) {
  try {
    console.log('📡 API Local: Obteniendo grabaciones desde VPS...');
    
    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const radioId = searchParams.get('radioId');
    
    // Construir URL con parámetros
    let vpsUrl = `${VPS_API_URL}/recordings`;
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (radioId) params.append('radioId', radioId);
    
    if (params.toString()) {
      vpsUrl += `?${params.toString()}`;
    }
    
    console.log(`📡 URL VPS: ${vpsUrl}`);
    
    const response = await fetch(vpsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error VPS API: ${response.status} - ${errorText}`);
      throw new Error(`Error al obtener grabaciones: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Grabaciones obtenidas: ${data.recordings?.length || 0} archivos`);
    
    // Formatear respuesta para el frontend
    return NextResponse.json({
      status: 'success',
      count: data.count || 0,
      recordings: data.recordings || []
    });
    
  } catch (error) {
    console.error('❌ Error en API local /api/recordings:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Error desconocido',
        recordings: []
      },
      { status: 500 }
    );
  }
}
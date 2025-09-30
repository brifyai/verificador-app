import { NextRequest, NextResponse } from 'next/server';

// Configuración de la VPS
const VPS_CONFIG = {
  host: '173.249.26.38',
  port: 80
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');
    
    if (!fileId) {
      return NextResponse.json({
        success: false,
        error: 'ID de archivo no proporcionado'
      }, { status: 400 });
    }
    
    // Validar el nombre del archivo para evitar inyección de comandos
    if (!/^[a-zA-Z0-9_\-\.]+\.wav$/.test(fileId)) {
      return NextResponse.json({
        success: false,
        error: 'Nombre de archivo inválido'
      }, { status: 400 });
    }
    
    // URL para descargar el archivo desde la VPS
    const audioUrl = `http://${VPS_CONFIG.host}:${VPS_CONFIG.port}/audio/${encodeURIComponent(fileId)}`;
    
    // Hacer la solicitud a la VPS
    const response = await fetch(audioUrl);
    
    if (!response.ok) {
      throw new Error(`Error en la respuesta de la VPS: ${response.status}`);
    }
    
    // Obtener el contenido del archivo
    const fileBuffer = await response.arrayBuffer();
    
    // Configurar los headers para la descarga
    const headers = new Headers();
    headers.set('Content-Type', 'audio/wav');
    headers.set('Content-Disposition', `attachment; filename="${fileId}"`);
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('❌ Error descargando audio de la VPS:', error);
    return NextResponse.json({
      success: false,
      error: 'Error descargando archivo de la VPS'
    }, { status: 500 });
  }
}
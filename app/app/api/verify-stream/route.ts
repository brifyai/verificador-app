import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route para verificar streams sin problemas de CORS
 * Actúa como proxy para evitar errores de política de mismo origen
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stream_url, timeout = 10000, detailed = false } = body;

    if (!stream_url) {
      return NextResponse.json(
        { error: 'stream_url es requerido' },
        { status: 400 }
      );
    }

    console.log(`Verificando stream: ${stream_url}`);

    // Configurar timeout para la petición
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Intentar hacer HEAD request primero (más eficiente)
      const headResponse = await fetch(stream_url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
        }
      });

      clearTimeout(timeoutId);

      if (headResponse.ok) {
        const result = {
          status: 'success',
          accessible: true,
          status_code: headResponse.status,
          response_time: Date.now() - Date.now() // Simplificado para este ejemplo
        };

        if (detailed) {
          return NextResponse.json(result);
        } else {
          return NextResponse.json({
            status: 'success',
            accessible: true
          });
        }
      }
    } catch (headError) {
      console.log('HEAD request falló, intentando GET...');
    }

    // Si HEAD falla, intentar GET con rango limitado
    const controller2 = new AbortController();
    const timeoutId2 = setTimeout(() => controller2.abort(), timeout);

    try {
      const getResponse = await fetch(stream_url, {
        method: 'GET',
        signal: controller2.signal,
        headers: {
          'Range': 'bytes=0-1024', // Solo pedir primeros 1KB
          'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
        }
      });

      clearTimeout(timeoutId2);

      const isAccessible = getResponse.ok || getResponse.status === 206; // 206 Partial Content es válido

      if (detailed) {
        return NextResponse.json({
          status: 'success',
          accessible: isAccessible,
          status_code: getResponse.status,
          response_time: Date.now() - Date.now()
        });
      } else {
        return NextResponse.json({
          status: 'success',
          accessible: isAccessible
        });
      }

    } catch (getError) {
      clearTimeout(timeoutId2);
      
      if (getError instanceof Error) {
        if (getError.name === 'AbortError') {
          return NextResponse.json({
            status: 'error',
            accessible: false,
            error: 'Timeout al verificar el stream'
          });
        }
      }

      return NextResponse.json({
        status: 'error',
        accessible: false,
        error: 'Stream no accesible'
      });
    }

  } catch (error) {
    console.error('Error en verify-stream:', error);
    
    return NextResponse.json(
      { 
        status: 'error',
        accessible: false,
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}

// Opcional: Agregar método OPTIONS para preflight requests
export async function OPTIONS() {
  return NextResponse.json(
    { message: 'Método permitido' },
    { 
      status: 200,
      headers: {
        'Allow': 'POST, OPTIONS'
      }
    }
  );
}
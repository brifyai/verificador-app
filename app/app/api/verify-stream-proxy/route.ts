import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import http from 'http';

/**
 * API Route PROXY para verificar streams con manejo de certificados SSL
 * Esta versión maneja certificados SSL no verificados usando Node.js directamente
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stream_url, timeout = 10000, detailed = false, radioName } = body;

    if (!stream_url) {
      return NextResponse.json(
        { error: 'stream_url es requerido' },
        { status: 400 }
      );
    }

    console.log(`[PROXY] Verificando stream: ${stream_url} (Radio: ${radioName || 'Desconocida'})`);

    const result = await verificarStreamConNode(stream_url, timeout, radioName);
    
    if (detailed) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json({
        success: result.success,
        status: result.status,
        message: result.message,
        url: result.url,
        verifiedAt: result.verifiedAt
      });
    }

  } catch (error) {
    console.error('[PROXY] Error en verify-stream-proxy:', error);
    
    return NextResponse.json(
      {
        success: false,
        status: 'error',
        message: 'Error interno del servidor proxy',
        url: 'unknown',
        verifiedAt: new Date().toISOString(),
        error: 'Error interno del servidor proxy'
      },
      { status: 500 }
    );
  }
}

// Función para verificar stream usando Node.js directamente
async function verificarStreamConNode(streamUrl: string, timeout: number, radioName?: string) {
  return new Promise((resolve) => {
    const urlObj = new URL(streamUrl);
    const isHttps = urlObj.protocol === 'https:';
    const options = {
      method: 'HEAD',
      timeout: timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
      }
    };

    // 🔧 SOLUCIÓN: Configurar agente HTTPS para aceptar certificados no verificados
    if (isHttps) {
      // @ts-ignore - Node.js specific
      options.agent = new https.Agent({
        rejectUnauthorized: false
      });
    }

    const protocol = isHttps ? https : http;
    
    console.log(`[PROXY] Intentando HEAD request a: ${streamUrl}`);

    const req = protocol.request(streamUrl, options, (res) => {
      console.log(`[PROXY] HEAD Response: ${res.statusCode} ${res.statusMessage}`);
      
      const success = res.statusCode >= 200 && res.statusCode < 400;
      
      const result = {
        success: success,
        status: success ? 'available' : 'unavailable',
        message: success ? 'Stream disponible' : 'Stream no accesible',
        statusCode: res.statusCode,
        url: streamUrl,
        verifiedAt: new Date().toISOString(),
        accessible: success,
        status_code: res.statusCode,
        response_time: Date.now() - Date.now(),
        method: 'HEAD_PROXY'
      };

      if (success) {
        console.log(`[PROXY] ✅ Stream verificado exitosamente: ${radioName}`);
        resolve(result);
      } else {
        console.log(`[PROXY] ⚠️ HEAD falló, intentando GET...`);
        intentarGetFallback(streamUrl, timeout, radioName).then(resolve);
      }
    });

    req.on('error', (error) => {
      console.log(`[PROXY] ❌ HEAD Error: ${error.message}`);
      
      // Si es error de certificado, intentar GET como fallback
      if (error.message.includes('certificate') || error.message.includes('UNABLE_TO_VERIFY_LEAF_SIGNATURE')) {
        console.log(`[PROXY] 🔧 Error de certificado detectado, intentando GET con certificados no verificados...`);
        intentarGetFallback(streamUrl, timeout, radioName).then(resolve);
      } else {
        resolve({
          success: false,
          status: 'error',
          message: `Stream no accesible: ${error.message}`,
          url: streamUrl,
          verifiedAt: new Date().toISOString(),
          accessible: false,
          error: error.message,
          method: 'HEAD_PROXY'
        });
      }
    });

    req.on('timeout', () => {
      console.log(`[PROXY] ⏰ HEAD Timeout`);
      req.destroy();
      intentarGetFallback(streamUrl, timeout, radioName).then(resolve);
    });

    req.end();
  });
}

// Función fallback con GET request
async function intentarGetFallback(streamUrl: string, timeout: number, radioName?: string) {
  return new Promise((resolve) => {
    const urlObj = new URL(streamUrl);
    const isHttps = urlObj.protocol === 'https:';
    const options = {
      method: 'GET',
      timeout: timeout,
      headers: {
        'Range': 'bytes=0-1024', // Solo pedir primeros 1KB
        'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
      }
    };

    // 🔧 SOLUCIÓN: Configurar agente HTTPS para GET también
    if (isHttps) {
      // @ts-ignore - Node.js specific
      options.agent = new https.Agent({
        rejectUnauthorized: false
      });
    }

    const protocol = isHttps ? https : http;
    
    console.log(`[PROXY] Intentando GET request a: ${streamUrl}`);

    const req = protocol.request(streamUrl, options, (res) => {
      console.log(`[PROXY] GET Response: ${res.statusCode} ${res.statusMessage}`);
      
      const success = res.statusCode === 206 || (res.statusCode >= 200 && res.statusCode < 400);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
        // Solo necesitamos los primeros bytes
        if (data.length > 1024) {
          res.destroy();
        }
      });
      
      res.on('end', () => {
        console.log(`[PROXY] 📄 Datos recibidos: ${data.length} bytes`);
        
        const result = {
          success: success,
          status: success ? 'available' : 'unavailable',
          message: success ? 'Stream disponible' : 'Stream no accesible',
          statusCode: res.statusCode,
          url: streamUrl,
          verifiedAt: new Date().toISOString(),
          accessible: success,
          status_code: res.statusCode,
          response_time: Date.now() - Date.now(),
          dataSize: data.length,
          method: 'GET_PROXY'
        };

        console.log(`[PROXY] ✅ Resultado final: ${success ? 'DISPONIBLE' : 'NO DISPONIBLE'}`);
        resolve(result);
      });
    });

    req.on('error', (error) => {
      console.log(`[PROXY] ❌ GET Error: ${error.message}`);
      resolve({
        success: false,
        status: 'error',
        message: `Stream no accesible: ${error.message}`,
        url: streamUrl,
        verifiedAt: new Date().toISOString(),
        accessible: false,
        error: error.message,
        method: 'GET_PROXY'
      });
    });

    req.on('timeout', () => {
      console.log(`[PROXY] ⏰ GET Timeout`);
      req.destroy();
      resolve({
        success: false,
        status: 'timeout',
        message: 'Timeout al verificar el stream',
        url: streamUrl,
        verifiedAt: new Date().toISOString(),
        accessible: false,
        error: 'Timeout',
        method: 'GET_PROXY'
      });
    });

    req.end();
  });
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
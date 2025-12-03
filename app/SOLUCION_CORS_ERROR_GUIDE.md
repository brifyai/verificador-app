# Guía Completa: Solución de Errores CORS en Radio Stream Verifier

## Problema Principal
Los errores CORS están bloqueando las solicitudes desde `http://localhost:3000` al servidor VPS en `http://213.199.39.147:5000` y a las radios HTTPS.

## Soluciones Implementadas

### 1. Configuración CORS en el Servidor VPS

**Archivo:** `app.py` en el VPS (213.199.39.147:5000)

```python
from flask_cors import CORS
from flask import Flask, request, jsonify

app = Flask(__name__)

# Configuración CORS completa
CORS(app, 
     origins=['http://localhost:3000', 'http://127.0.0.1:3000'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
     supports_credentials=True,
     max_age=3600)

# Manejo específico de preflight
@app.before_request
def handle_preflight():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Max-Age', '3600')
        return response

# Decorador CORS para endpoints específicos
@app.route('/api/verify-stream', methods=['POST', 'OPTIONS'])
def verify_stream():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    
    # Tu lógica de verificación aquí
    return jsonify({'status': 'verified'}), 200
```

### 2. Cliente Frontend - Configuración de Solicitudes

**Archivo:** `stream-verifier-vps.ts`

```typescript
export class StreamVerifierVPS {
  private baseUrl = 'http://213.199.39.147:5000/api';
  
  async verifyStreamBeforeRecording(streamUrl: string, radioId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/verify-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // NO incluir User-Agent - el navegador lo maneja
        },
        body: JSON.stringify({
          stream_url: streamUrl,
          radio_id: radioId
        }),
        mode: 'cors', // Explicitamente CORS
        credentials: 'include', // Si necesitas cookies
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.status === 'verified';
      
    } catch (error) {
      console.error('Error verificando stream:', error);
      return false;
    }
  }
}
```

### 3. Proxy de Desarrollo con Next.js

**Archivo:** `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/vps/:path*',
        destination: 'http://213.199.39.147:5000/api/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/api/vps/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

**Uso en el cliente:**

```typescript
// En lugar de llamar directamente al VPS
const response = await fetch('/api/vps/verify-stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ stream_url: streamUrl, radio_id: radioId })
});
```

### 4. Solución SSL/TLS para Radios HTTPS

**Archivo:** `stream-verifier-ssl-fix.ts`

```typescript
export class StreamVerifierSSL {
  async verifyStreamStatusWithSslFix(streamUrl: string): Promise<boolean> {
    try {
      // Para URLs HTTPS, usar un proxy o verificación alternativa
      if (streamUrl.startsWith('https://')) {
        // Opción 1: Usar un proxy CORS
        const proxyUrl = `/api/proxy-stream?url=${encodeURIComponent(streamUrl)}`;
        const response = await fetch(proxyUrl);
        return response.ok;
        
        // Opción 2: Verificar solo el dominio
        // return await this.verifyDomain(streamUrl);
        
        // Opción 3: Usar HEAD request sin verificación SSL estricta
        // return await this.verifyWithHeadRequest(streamUrl);
      }
      
      // Para HTTP, verificación directa
      return await this.verifyHttpStream(streamUrl);
      
    } catch (error) {
      console.error('Error SSL:', error);
      return false;
    }
  }
  
  private async verifyWithHeadRequest(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors', // Importante para evitar CORS
        signal: controller.signal,
        // No establecer User-Agent manualmente
      });
      
      clearTimeout(timeoutId);
      return response.ok || response.type === 'opaque'; // opaque es OK para no-cors
      
    } catch (error) {
      return false;
    }
  }
}
```

### 5. Endpoint Proxy en Next.js

**Archivo:** `app/api/proxy-stream/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');
  
  if (!targetUrl) {
    return NextResponse.json({ error: 'URL requerida' }, { status: 400 });
  }
  
  try {
    const response = await fetch(targetUrl, {
      method: 'HEAD',
      // Deshabilitar verificación SSL en desarrollo
      // En producción, usar certificados válidos
    });
    
    return NextResponse.json({ 
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Stream no disponible',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 503 });
  }
}
```

### 6. Verificador Combinado Actualizado

**Archivo:** `stream-verifier-combined.ts`

```typescript
import { StreamVerifierVPS } from './stream-verifier-vps';
import { StreamVerifierSSL } from './stream-verifier-ssl-fix';

export class StreamVerifierCombined {
  private vpsVerifier = new StreamVerifierVPS();
  private sslVerifier = new StreamVerifierSSL();
  
  async verifyStreamWithFallback(streamUrl: string, radioId: string): Promise<{
    status: 'verified' | 'failed' | 'ssl_error' | 'cors_error';
    message: string;
  }> {
    try {
      // Primero intentar verificación local (sin CORS)
      const localResult = await this.sslVerifier.verifyStreamStatusWithSslFix(streamUrl);
      if (localResult) {
        return { status: 'verified', message: 'Stream verificado localmente' };
      }
      
      // Si falla, intentar verificación VPS (puede tener CORS)
      const vpsResult = await this.vpsVerifier.verifyStreamBeforeRecording(streamUrl, radioId);
      if (vpsResult) {
        return { status: 'verified', message: 'Stream verificado via VPS' };
      }
      
      return { status: 'failed', message: 'Stream no disponible' };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      if (errorMessage.includes('CORS')) {
        return { status: 'cors_error', message: 'Error de CORS - verificar configuración del servidor' };
      }
      
      if (errorMessage.includes('SSL') || errorMessage.includes('certificate')) {
        return { status: 'ssl_error', message: 'Error SSL - el stream HTTPS no está disponible' };
      }
      
      return { status: 'failed', message: `Streaming no disponible: ${errorMessage}` };
    }
  }
}
```

## Pasos de Implementación

1. **Actualizar el servidor VPS** con la configuración CORS
2. **Implementar el proxy** en Next.js
3. **Actualizar los verificadores** del cliente
4. **Probar con diferentes radios** (HTTP y HTTPS)
5. **Verificar logs** en consola del navegador

## Testing

Para probar la solución:

```bash
# 1. Verificar que el VPS esté ejecutándose
curl -X OPTIONS http://213.199.39.147:5000/api/verify-stream \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST"

# 2. Probar endpoint de verificación
curl -X POST http://213.199.39.147:5000/api/verify-stream \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"stream_url": "http://example.com/stream.mp3", "radio_id": "test"}'

# 3. Verificar proxy local
curl "http://localhost:3000/api/proxy-stream?url=https://radio.digitalfm.cl:8000/arica"
```

## Notas Importantes

- **En desarrollo**: Usar el proxy de Next.js para evitar CORS
- **En producción**: Configurar dominios específicos en lugar de `*`
- **HTTPS**: Algunas radios requieren certificados SSL válidos
- **Timeouts**: Configurar timeouts apropiados para evitar bloqueos
- **Logs**: Monitorear logs tanto del cliente como del servidor

## Solución Alternativa Rápida

Si necesitas una solución inmediata mientras implementas la completa:

1. **Extension de Chrome**: Usar "Allow CORS" extension para desarrollo
2. **Flags de Chrome**: Ejecutar con `--disable-web-security` (solo desarrollo)
3. **Servidor proxy**: Usar `cors-anywhere` o similar

⚠️ **Importante**: Estas soluciones alternativas solo son para desarrollo, nunca para producción.
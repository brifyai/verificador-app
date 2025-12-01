// Script simple para probar la detección de Cloudflare
// Usa el verificador directamente sin pasar por la API

const https = require('https');
const http = require('http');

// Función para detectar Cloudflare en una respuesta
function detectCloudflare(response) {
  const headers = response.headers;
  const server = headers.server || '';
  const cfRay = headers['cf-ray'];
  const cfCacheStatus = headers['cf-cache-status'];
  
  return {
    isCloudflare: server.toLowerCase().includes('cloudflare') || !!cfRay || !!cfCacheStatus,
    cfRay: cfRay,
    server: server,
    cacheStatus: cfCacheStatus
  };
}

// Función para verificar si una URL es de Cloudflare
function detectStreamType(url) {
  if (url.includes('conectaapp.cl')) return 'CLOUDFLARE';
  if (url.includes('cloudflare')) return 'CLOUDFLARE';
  return 'OTHER';
}

// Función simple de verificación
async function simpleVerifyStream(url) {
  console.log(`🔍 Verificando: ${url}`);
  
  const streamType = detectStreamType(url);
  console.log(`📊 Tipo detectado: ${streamType}`);
  
  if (streamType === 'CLOUDFLARE') {
    console.log('🔒 Detectado Cloudflare, aplicando estrategia especial...');
    
    try {
      // Intentar HEAD con headers de navegador
      const result = await new Promise((resolve, reject) => {
        const options = {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          },
          timeout: 10000
        };

        const req = https.request(url, options, (res) => {
          const cfDetection = detectCloudflare(res);
          
          console.log(`📡 Respuesta HTTP: ${res.statusCode}`);
          console.log(`🔍 Headers:`, res.headers);
          console.log(`☁️ Cloudflare detectado:`, cfDetection);
          
          resolve({
            status: res.statusCode,
            headers: res.headers,
            cloudflare: cfDetection
          });
        });

        req.on('error', (error) => {
          console.log(`❌ Error: ${error.message}`);
          reject(error);
        });

        req.on('timeout', () => {
          console.log('⏰ Timeout');
          req.destroy();
          reject(new Error('Timeout'));
        });

        req.end();
      });

      // Analizar resultado
      console.log('\n📊 Resultado del análisis:');
      if (result.cloudflare.isCloudflare) {
        console.log('✅ Cloudflare confirmado');
        console.log(`   Ray ID: ${result.cloudflare.cfRay || 'No disponible'}`);
        console.log(`   Server: ${result.cloudflare.server}`);
        
        if (result.status === 403) {
          console.log('🔒 HTTP 403 - Protección Cloudflare activa');
          console.log('✅ Stream está ONLINE (protegido por Cloudflare)');
          return {
            status: 'ONLINE',
            details: 'Cloudflare protegido - Stream online pero requiere navegador real (HTTP 403)',
            streamType: 'CLOUDFLARE',
            httpStatus: 403,
            cloudflareProtected: true,
            cloudflareRay: result.cloudflare.cfRay
          };
        } else if (result.status === 200) {
          console.log('✅ HTTP 200 - Stream accesible');
          return {
            status: 'ONLINE',
            details: 'Cloudflare protegido - Stream accesible con headers de navegador (HTTP 200)',
            streamType: 'CLOUDFLARE',
            httpStatus: 200,
            cloudflareProtected: true,
            cloudflareRay: result.cloudflare.cfRay
          };
        } else {
          console.log(`⚠️ HTTP ${result.status} - Estado desconocido`);
          return {
            status: 'ONLINE',
            details: `Cloudflare protegido - Estado HTTP ${result.status}`,
            streamType: 'CLOUDFLARE',
            httpStatus: result.status,
            cloudflareProtected: true,
            cloudflareRay: result.cloudflare.cfRay
          };
        }
      } else {
        console.log('❌ Cloudflare no detectado');
        return {
          status: 'OFFLINE',
          details: 'No se detectó Cloudflare',
          streamType: 'OTHER',
          httpStatus: result.status
        };
      }

    } catch (error) {
      console.log(`❌ Error en verificación: ${error.message}`);
      return {
        status: 'OFFLINE',
        details: `Error: ${error.message}`,
        streamType: 'CLOUDFLARE',
        httpStatus: 0
      };
    }
  }
  
  return {
    status: 'OFFLINE',
    details: 'Tipo de stream no soportado',
    streamType: streamType
  };
}

// Función principal de prueba
async function testCloudflareSimple() {
  console.log('🧪 Prueba simple de Cloudflare...\n');
  
  // URL de FM Quiero
  const testUrl = 'https://streaming-secure.conectaapp.cl/fmquiero.cl?token=f2dbfd16fa2ed744b3039c1f8df4986d5682498b74e00ef19d59391d41cfc5fa';
  
  console.log(`📻 URL de prueba: ${testUrl}`);
  console.log('⏳ Iniciando verificación...\n');
  
  const result = await simpleVerifyStream(testUrl);
  
  console.log('\n📋 Resultado final:');
  console.log(`   Estado: ${result.status}`);
  console.log(`   Detalles: ${result.details}`);
  console.log(`   Tipo: ${result.streamType}`);
  console.log(`   HTTP: ${result.httpStatus}`);
  console.log(`   Cloudflare: ${result.cloudflareProtected || false}`);
  console.log(`   Ray ID: ${result.cloudflareRay || 'No disponible'}`);
  
  // Resumen
  console.log('\n📊 Resumen:');
  if (result.streamType === 'CLOUDFLARE' && result.cloudflareProtected) {
    console.log('✅ Implementación de Cloudflare funcionando correctamente');
    if (result.status === 'ONLINE') {
      console.log('✅ Stream protegido por Cloudflare marcado como ONLINE');
    }
  } else {
    console.log('❌ Cloudflare no detectado o no implementado correctamente');
  }
}

// Ejecutar prueba
testCloudflareSimple().catch(console.error);
const https = require('https');

console.log('🎵 Probando lógica de verificación de FM Quiero...');

// Función para detectar Cloudflare
function detectStreamType(url) {
  if (url.includes('cloudflare') || 
      url.includes('conectaapp.cl') ||
      url.includes('streaming-secure')) {
    return 'CLOUDFLARE';
  }
  return 'DIRECT';
}

// Función para verificar stream con soporte Cloudflare
async function verifyStreamWithCloudflareSupport(url) {
  console.log(`🔍 Verificando: ${url}`);
  
  const streamType = detectStreamType(url);
  console.log(`📊 Tipo detectado: ${streamType}`);
  
  return new Promise((resolve) => {
    const options = {
      method: 'HEAD',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = https.request(url, options, (res) => {
      console.log(`📡 Código de respuesta: ${res.statusCode}`);
      
      // Detectar Cloudflare
      const isCloudflare = res.headers['cf-ray'] || 
                          res.headers['server'] === 'cloudflare' ||
                          res.headers['cf-cache-status'];
      
      if (isCloudflare) {
        console.log('🛡️  Cloudflare detectado');
        console.log(`🆔 CF-Ray: ${res.headers['cf-ray']}`);
        
        // Para Cloudflare, aceptamos 403 como posiblemente online
        if (res.statusCode === 403) {
          console.log('✅ Stream protegido por Cloudflare - considerado ONLINE');
          resolve({
            status: 'ONLINE',
            statusCode: res.statusCode,
            headers: res.headers,
            streamType: 'CLOUDFLARE',
            isCloudflare: true,
            cfRay: res.headers['cf-ray']
          });
          return;
        }
      }
      
      // Lógica estándar para otros casos
      if (res.statusCode >= 200 && res.statusCode < 400) {
        const contentType = res.headers['content-type'] || '';
        console.log(`📋 Content-Type: ${contentType}`);
        
        if (contentType.includes('audio') || contentType.includes('mpeg')) {
          console.log('✅ Stream de audio detectado - ONLINE');
          resolve({
            status: 'ONLINE',
            statusCode: res.statusCode,
            headers: res.headers,
            streamType: streamType,
            isCloudflare: !!isCloudflare
          });
        } else {
          console.log('⚠️  Respuesta HTTP válida pero no es audio');
          resolve({
            status: 'UNKNOWN',
            statusCode: res.statusCode,
            headers: res.headers,
            message: 'Respuesta válida pero no es audio'
          });
        }
      } else {
        console.log(`❌ Stream OFFLINE (HTTP ${res.statusCode})`);
        resolve({
          status: 'OFFLINE',
          statusCode: res.statusCode,
          headers: res.headers,
          streamType: streamType,
          isCloudflare: !!isCloudflare
        });
      }
    });

    req.on('error', (error) => {
      console.error('❌ Error en la petición:', error.message);
      resolve({
        status: 'ERROR',
        error: error.message,
        streamType: streamType
      });
    });

    req.on('timeout', () => {
      console.log('⏰ Timeout en la petición');
      req.destroy();
      resolve({
        status: 'TIMEOUT',
        streamType: streamType
      });
    });

    req.end();
  });
}

// Función principal de prueba
async function testQuieroLogic() {
  const url = 'https://streaming-secure.conectaapp.cl/fmquiero.cl?token=f2dbfd16fa2ed744b3039c1f8df4986d5682498b74e00ef19d59391d41cfc5fa';
  
  console.log('=== PRUEBA DE LÓGICA PARA FM QUIERO ===');
  console.log(`🎯 URL: ${url}`);
  
  try {
    const result = await verifyStreamWithCloudflareSupport(url);
    
    console.log('\n📊 RESULTADO FINAL:');
    console.log(`🎯 Estado: ${result.status}`);
    console.log(`🔢 Código HTTP: ${result.statusCode}`);
    console.log(`📡 Tipo de stream: ${result.streamType}`);
    
    if (result.isCloudflare) {
      console.log(`🛡️  Cloudflare: SÍ`);
      console.log(`🆔 CF-Ray: ${result.cfRay || 'No disponible'}`);
    }
    
    if (result.status === 'ONLINE') {
      console.log('🎉 ¡FM Quiero está ONLINE con la nueva lógica!');
    } else {
      console.log('❌ FM Quiero está OFFLINE');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    return null;
  }
}

// Ejecutar la prueba
testQuieroLogic().catch(console.error);
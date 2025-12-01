const https = require('https');

console.log('🎵 Probando verificación de FM Quiero de Antofagasta...');

// Función para verificar el stream de FM Quiero
async function verifyQuieroStream() {
  const url = 'https://streaming-secure.conectaapp.cl/fmquiero.cl?token=f2dbfd16fa2ed744b3039c1f8df4986d5682498b74e00ef19d59391d41cfc5fa';
  
  console.log(`🔍 Verificando stream: ${url}`);
  
  return new Promise((resolve, reject) => {
    const options = {
      method: 'HEAD',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };

    const req = https.request(url, options, (res) => {
      console.log(`📊 Código de respuesta: ${res.statusCode}`);
      console.log(`📄 Headers de respuesta:`, res.headers);
      
      // Detectar Cloudflare
      const isCloudflare = res.headers['cf-ray'] || 
                          res.headers['server'] === 'cloudflare' ||
                          res.headers['cf-cache-status'];
      
      if (isCloudflare) {
        console.log('🛡️  ¡Detectado Cloudflare!');
        console.log('📝 CF-Ray:', res.headers['cf-ray']);
      }
      
      // Para Cloudflare, aceptamos 403 como posiblemente online
      if (isCloudflare && res.statusCode === 403) {
        console.log('✅ Stream protegido por Cloudflare - considerado ONLINE');
        resolve({
          status: 'ONLINE',
          statusCode: res.statusCode,
          headers: res.headers,
          isCloudflare: true,
          cfRay: res.headers['cf-ray']
        });
        return;
      }
      
      // Para otros casos
      if (res.statusCode >= 200 && res.statusCode < 400) {
        const contentType = res.headers['content-type'] || '';
        console.log(`📋 Content-Type: ${contentType}`);
        
        if (contentType.includes('audio') || contentType.includes('mpeg')) {
          console.log('✅ Stream de audio detectado - ONLINE');
          resolve({
            status: 'ONLINE',
            statusCode: res.statusCode,
            headers: res.headers,
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
          isCloudflare: !!isCloudflare
        });
      }
    });

    req.on('error', (error) => {
      console.error('❌ Error en la petición:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      console.log('⏰ Timeout en la petición');
      req.destroy();
      reject(new Error('Timeout en la verificación'));
    });

    req.end();
  });
}

// Ejecutar la prueba
async function runTest() {
  try {
    const result = await verifyQuieroStream();
    console.log('\n📊 RESUMEN FINAL:');
    console.log(`🎯 Estado: ${result.status}`);
    console.log(`🔢 Código HTTP: ${result.statusCode}`);
    if (result.isCloudflare) {
      console.log(`🛡️  Cloudflare: SÍ`);
      console.log(`🆔 CF-Ray: ${result.cfRay || 'No disponible'}`);
    }
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

runTest();
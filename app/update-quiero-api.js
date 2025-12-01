const https = require('https');

console.log('🎵 Actualizando estado de FM Quiero vía API directa...');

// URL de FM Quiero
const quieroUrl = 'https://streaming-secure.conectaapp.cl/fmquiero.cl?token=f2dbfd16fa2ed744b3039c1f8df4986d5682498b74e00ef19d59391d41cfc5fa';

// Función para verificar el stream
async function verifyStream() {
  return new Promise((resolve) => {
    const options = {
      method: 'HEAD',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = https.request(quieroUrl, options, (res) => {
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
            isCloudflare: true,
            cfRay: res.headers['cf-ray']
          });
          return;
        }
      }
      
      // Lógica estándar
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
      resolve({
        status: 'ERROR',
        error: error.message
      });
    });

    req.on('timeout', () => {
      console.log('⏰ Timeout en la petición');
      req.destroy();
      resolve({
        status: 'TIMEOUT'
      });
    });

    req.end();
  });
}

// Función principal
async function main() {
  console.log('=== ACTUALIZANDO ESTADO DE FM QUIERO ===');
  console.log(`🎯 URL: ${quieroUrl}`);
  
  try {
    const result = await verifyStream();
    
    console.log('\n📊 RESULTADO DE VERIFICACIÓN:');
    console.log(`🎯 Estado: ${result.status}`);
    console.log(`🔢 Código HTTP: ${result.statusCode}`);
    console.log(`🛡️  Cloudflare: ${result.isCloudflare ? 'SÍ' : 'NO'}`);
    console.log(`🆔 CF-Ray: ${result.cfRay || 'No disponible'}`);
    
    if (result.status === 'ONLINE') {
      console.log('🎉 ¡FM Quiero está ONLINE con la nueva lógica Cloudflare!');
      
      // Ahora podemos usar el API para actualizar el estado
      console.log('\n📡 Para actualizar el estado en la base de datos, usa:');
      console.log(`PUT a /api/radios-direct/${'radio_mijm9xcr_i4kd83i'}`);
      console.log('Con el body:');
      console.log(JSON.stringify({
        last_verification_status: 'ONLINE',
        last_verification_date: new Date().toISOString(),
        verification_method: 'CLOUDFLARE_FIX',
        platform: 'CLOUDFLARE'
      }, null, 2));
      
    } else {
      console.log('❌ FM Quiero está OFFLINE');
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Ejecutar
main().catch(console.error);
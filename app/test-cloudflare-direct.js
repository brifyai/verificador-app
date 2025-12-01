const https = require('https');
const http = require('http');

// Token de admin generado
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLTEiLCJlbWFpbCI6ImFkbWluQHZlcmlmaWNhZG9yLmNvbSIsIm5hbWUiOiJBZG1pbmlzdHJhZG9yIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzY0NTUyMDE2LCJleHAiOjE3NjQ2Mzg0MTZ9.gQqW2UqnEa2WoQIKFDq-N4xQSWH9o5BNIWS4MdY-0XE';

async function testCloudflareDirect() {
  console.log('🧪 Probando Cloudflare directamente con token de admin...\n');
  
  // ID de FM Quiero
  const quieroRadioId = 'radio_mijm9xcr_i4kd83i';
  console.log(`📻 Verificando FM Quiero (ID: ${quieroRadioId})...`);
  
  const verifyOptions = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/radios-direct/${quieroRadioId}/verify`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const verifyResult = await new Promise((resolve, reject) => {
      const req = http.request(verifyOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      });
      req.on('error', reject);
      req.end();
    });

    console.log(`📊 Resultado de verificación (HTTP ${verifyResult.status}):`);
    console.log('Respuesta:', JSON.stringify(verifyResult.data, null, 2));
    
    if (verifyResult.status === 200 && verifyResult.data) {
      const result = verifyResult.data;
      console.log('\n📈 Análisis del resultado:');
      console.log(`   Estado: ${result.status}`);
      console.log(`   Detalles: ${result.details}`);
      console.log(`   Tipo de stream: ${result.streamType}`);
      console.log(`   HTTP Status: ${result.httpStatus}`);
      console.log(`   Content-Type: ${result.contentType}`);
      console.log(`   Método usado: ${result.method}`);
      console.log(`   Protegido por Cloudflare: ${result.cloudflareProtected}`);
      console.log(`   Cloudflare Ray ID: ${result.cloudflareRay || 'No disponible'}`);
      
      if (result.streamType === 'CLOUDFLARE' && result.cloudflareProtected) {
        console.log('✅ ¡Cloudflare detectado correctamente!');
        if (result.status === 'ONLINE') {
          console.log('✅ Stream marcado como ONLINE (protegido pero accesible)');
        } else {
          console.log('⚠️ Stream marcado como OFFLINE');
        }
      } else {
        console.log('❌ Cloudflare no detectado correctamente');
      }
    } else {
      console.log('❌ Error en verificación:', verifyResult.data);
    }

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  }
}

// Ejecutar prueba
testCloudflareDirect().catch(console.error);
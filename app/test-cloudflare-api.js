const https = require('https');
const http = require('http');

async function testCloudflareThroughAPI() {
  console.log('🧪 Probando Cloudflare a través de la API del servidor...\n');
  
  // Primero necesitamos obtener un token de autenticación
  const loginData = JSON.stringify({
    email: 'admin@ondaverificada.cl',
    password: 'Admin123!'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login-direct',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };

  console.log('🔑 Obteniendo token de autenticación...');
  
  try {
    // Hacer login
    const loginResult = await new Promise((resolve, reject) => {
      const req = http.request(loginOptions, (res) => {
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
      req.write(loginData);
      req.end();
    });

    if (loginResult.status !== 200) {
      console.log('❌ Error en login:', loginResult.data);
      return;
    }

    const token = loginResult.data.token;
    console.log('✅ Login exitoso, token obtenido');
    
    // Ahora probar la verificación de FM Quiero
    const quieroRadioId = 'radio_mijm9xcr_i4kd83i';
    console.log(`\n📻 Verificando FM Quiero (ID: ${quieroRadioId})...`);
    
    const verifyOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/radios-direct/${quieroRadioId}/verify`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

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
        }
      }
    } else {
      console.log('❌ Error en verificación:', verifyResult.data);
    }

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  }
}

// Ejecutar prueba
testCloudflareThroughAPI().catch(console.error);
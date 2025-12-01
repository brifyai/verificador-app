const https = require('https');
const http = require('http');

console.log('🎵 Probando verificación de FM Quiero via API...');

// Función para obtener el token de las cookies del navegador
function getTokenFromBrowser() {
  // Simulamos un token válido (esto normalmente vendría de las cookies)
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQHZlcmlmaWNhZG9yLmNvbSIsIm5hbWUiOiJBZG1pbmlzdHJhZG9yIiwiaWQiOiI2NzQ4OTFkNS1kYjlkLTRmMTYtOTBhOS04NmVlMDQ5YmU2ZGEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MzMwNjQ0MDN9.4zD7y3_8Fz8Y3z8Y3z8Y3z8Y3z8Y3z8Y3z8Y3z8Y3z8';
}

async function testQuieroVerification() {
  const token = getTokenFromBrowser();
  const radioId = 'radio_mijm9xcr_i4kd83i';
  
  console.log(`📡 Verificando radio ID: ${radioId}`);
  console.log(`🔑 Usando token de autenticación`);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/radios-direct/${radioId}/verify`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Cookie': `auth-token=${token}`
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`📊 Código de respuesta: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            console.log('✅ Resultado de verificación:', result);
            
            if (result.status === 'success' && result.radio) {
              console.log(`📻 Radio: ${result.radio.name}`);
              console.log(`🎯 Estado: ${result.radio.status}`);
              console.log(`🕐 Última verificación: ${result.radio.last_verification_status}`);
              console.log(`🔗 URL: ${result.radio.stream_url}`);
              
              if (result.radio.last_verification_status === 'ONLINE') {
                console.log('🎉 ¡FM Quiero está ONLINE en el sistema!');
              } else {
                console.log('❌ FM Quiero aparece como OFFLINE en el sistema');
              }
            }
            
            resolve(result);
          } catch (e) {
            console.log('📄 Respuesta cruda:', data);
            resolve(data);
          }
        } else if (res.statusCode === 401) {
          console.log('❌ No autorizado - token inválido o expirado');
          console.log('📄 Respuesta:', data);
          reject(new Error('No autorizado'));
        } else {
          console.log('❌ Error en la respuesta:', data);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error en la petición:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      console.log('⏰ Timeout en la petición');
      req.destroy();
      reject(new Error('Timeout en la petición'));
    });

    req.setTimeout(30000); // 30 segundos de timeout
    req.end();
  });
}

// Ejecutar la prueba
async function runTest() {
  try {
    await testQuieroVerification();
  } catch (error) {
    console.log('❌ Error en la prueba:', error.message);
    console.log('💡 Sugerencia: Asegúrate de que el servidor esté ejecutándose y el token sea válido');
  }
}

runTest();
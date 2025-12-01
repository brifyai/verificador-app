const http = require('http');
const crypto = require('crypto');

// Generar un nuevo token JWT válido
const header = {
  alg: 'HS256',
  typ: 'JWT'
};

const payload = {
  email: 'admin@example.com',
  name: 'Administrador',
  id: '674891d5-db9d-4f16-90a9-86ee049be6da',
  role: 'admin',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
};

// Función para codificar base64url
function base64urlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Crear el token
const encodedHeader = base64urlEncode(JSON.stringify(header));
const encodedPayload = base64urlEncode(JSON.stringify(payload));

// Para la firma, necesitamos el SECRET_KEY (esto es solo para prueba)
const signatureInput = `${encodedHeader}.${encodedPayload}`;
const secret = 'your-secret-key-here'; // Este debería ser el mismo que usa tu app

// Crear firma HMAC-SHA256
const signature = crypto
  .createHmac('sha256', secret)
  .update(signatureInput)
  .digest('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=/g, '');

const token = `${encodedHeader}.${encodedPayload}.${signature}`;

console.log('🎵 Probando verificación de FM Quiero de Antofagasta...');
console.log('📡 Usando token JWT generado...');

// Probar el stream directamente con el verificador principal
const { verifyStreamStatus } = require('./lib/stream-verifier');

async function testQuieroStream() {
  const url = 'https://streaming-secure.conectaapp.cl/fmquiero.cl?token=f2dbfd16fa2ed744b3039c1f8df4986d5682498b74e00ef19d59391d41cfc5fa';
  
  console.log(`🔍 Verificando stream: ${url}`);
  
  try {
    const result = await verifyStreamStatus(url);
    console.log('✅ Resultado de verificación:', result);
    
    if (result.status === 'ONLINE') {
      console.log('🎉 ¡FM Quiero está ONLINE!');
    } else {
      console.log('❌ FM Quiero está OFFLINE');
    }
  } catch (error) {
    console.error('❌ Error al verificar:', error.message);
  }
}

// Probar con el API local
async function testQuieroAPI() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/radios-direct/radio_mijm9xcr_i4kd83i/verify',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
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
        console.log(`📄 Respuesta: ${data}`);
        
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            console.log('✅ Resultado API:', result);
            resolve(result);
          } catch (e) {
            console.log('✅ Respuesta cruda:', data);
            resolve(data);
          }
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

    req.end();
  });
}

// Ejecutar las pruebas
async function runTests() {
  console.log('\n=== PRUEBA 1: Verificador Directo ===');
  await testQuieroStream();
  
  console.log('\n=== PRUEBA 2: API Local ===');
  try {
    await testQuieroAPI();
  } catch (error) {
    console.log('❌ Falló la prueba API, pero el verificador directo debería funcionar');
  }
}

runTests().catch(console.error);
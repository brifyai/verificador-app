// Script para probar el endpoint de radios con autenticación
const https = require('https');
const http = require('http');

// Función fetch simple usando http/https nativo
function simpleFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    
    if (options.body) {
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
    }
    
    const req = client.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            json: async () => jsonData
          });
        } catch (e) {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            json: async () => ({ success: false, error: data })
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testRadiosEndpoint() {
  console.log('🧪 Probando endpoint de radios...\n');
  
  try {
    // 1. Primero hacer login para obtener el token
    console.log('1. Obteniendo token de autenticación...');
    const loginResponse = await simpleFetch('http://localhost:3000/api/auth/login-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@verificador.com',
        password: 'admin'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login falló: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login exitoso');
    console.log('Token:', loginData.token.substring(0, 50) + '...');
    
    // 2. Probar endpoint de radios con el token
    console.log('\n2. Probando endpoint /api/radios-direct...');
    const radiosResponse = await simpleFetch('http://localhost:3000/api/radios-direct?limit=10', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });
    
    if (!radiosResponse.ok) {
      throw new Error(`Radios endpoint falló: ${radiosResponse.status}`);
    }
    
    const radiosData = await radiosResponse.json();
    console.log('✅ Radios endpoint funcionando');
    console.log(`📊 Total de radios: ${radiosData.pagination.total}`);
    console.log(`📋 Radios en esta página: ${radiosData.data.length}`);
    
    // 3. Verificar algunas radios
    console.log('\n3. Muestra de radios:');
    radiosData.data.slice(0, 3).forEach((radio, index) => {
      console.log(`${index + 1}. ${radio.name} (${radio.region} - ${radio.city})`);
      console.log(`   URL: ${radio.streamUrl}`);
      console.log(`   Plataforma: ${radio.streamPlatform}`);
      console.log(`   Estado: ${radio.lastVerificationStatus}`);
    });
    
    // 4. Probar sin autenticación (debe fallar)
    console.log('\n4. Probando sin autenticación...');
    const noAuthResponse = await simpleFetch('http://localhost:3000/api/radios-direct?limit=10');
    console.log(`Sin auth - Status: ${noAuthResponse.status} ${noAuthResponse.statusText}`);
    
    if (noAuthResponse.status === 401) {
      console.log('✅ Correctamente rechazado sin autenticación');
    } else {
      console.log('⚠️  Debería haber rechazado con 401');
    }
    
    console.log('\n✅ Todas las pruebas completadas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    process.exit(1);
  }
}

// Ejecutar la prueba
testRadiosEndpoint();
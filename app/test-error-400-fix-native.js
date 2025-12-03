#!/usr/bin/env node

/**
 * Test nativo de Node.js para verificar que el error HTTP 400 se haya resuelto
 * Usa el módulo https nativo en lugar de fetch
 */

const https = require('https');
const http = require('http');

function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            data: data,
            parseError: e.message
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

async function testVerifyStreamPublic() {
  console.log('🧪 Test de solución de error HTTP 400 (Nativo Node.js)');
  console.log('=====================================================');
  
  // URLs de prueba reales
  const testUrls = [
    {
      name: 'Radio Digital FM Arica',
      streamUrl: 'https://radio.digitalfm.cl:8000/arica',
      expected: 'HTTPS con SSL'
    },
    {
      name: 'Radio Contagio - HTTP',
      streamUrl: 'http://stream5.eltelar.com:8064/stream',
      expected: 'HTTP normal'
    },
    {
      name: 'Radio Pilmaiquen',
      streamUrl: 'https://stream5.eltelar.com:8062/stream',
      expected: 'HTTPS alternativo'
    }
  ];

  for (const test of testUrls) {
    console.log(`\n📻 Probando: ${test.name}`);
    console.log(`🌐 URL: ${test.streamUrl}`);
    console.log(`📝 Tipo: ${test.expected}`);
    
    try {
      const response = await makeRequest('http://localhost:3000/api/verify-stream-public', {
        streamUrl: test.streamUrl,
        radioName: test.name
      });

      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.status >= 400) {
        console.log(`❌ Error HTTP: ${response.status}`);
        console.log(`📄 Response data:`, response.data);
        continue;
      }

      console.log(`✅ Resultado:`, {
        available: response.data.available,
        status: response.data.status,
        statusText: response.data.statusText,
        error: response.data.error,
        message: response.data.message
      });

      if (response.data.available) {
        console.log(`🎉 ¡STREAM DISPONIBLE!`);
      } else {
        console.log(`⚠️ Stream no disponible: ${response.data.error || response.data.statusText}`);
      }

    } catch (error) {
      console.log(`💥 Error de conexión: ${error.message}`);
    }
    
    // Esperar entre pruebas
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Ejecutar el test
if (require.main === module) {
  testVerifyStreamPublic()
    .then(() => {
      console.log('\n✅ Test completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error en test:', error);
      process.exit(1);
    });
}

module.exports = { testVerifyStreamPublic };
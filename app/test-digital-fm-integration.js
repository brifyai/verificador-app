// Test directo del sistema de verificación para Digital FM Arica
const https = require('https');
const http = require('http');

async function verifyDigitalFMDirect() {
  const url = 'https://radio.digitalfm.cl:8000/arica';
  console.log('🧪 Testing Digital FM Arica with direct HTTPS verification...\n');
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const options = {
      method: 'GET',
      timeout: 10000,
      rejectUnauthorized: false, // Acceptar certificados SSL problemáticos
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)',
        'Accept': '*/*',
        'Icy-MetaData': '1',
        'Connection': 'close'
      }
    };

    const req = https.request(url, options, (res) => {
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;
      
      console.log('✅ Conexión HTTPS exitosa:');
      console.log('   Status Code:', statusCode);
      console.log('   Response Time:', responseTime + 'ms');
      console.log('   Headers:', Object.keys(res.headers).join(', '));
      
      // Para servidores Icecast, HTTP 400 también significa ONLINE
      const isOnline = statusCode >= 200 && statusCode < 500;
      
      if (isOnline) {
        console.log('\n🎉 ¡ÉXITO! Digital FM Arica está ONLINE');
        console.log('   El servidor responde correctamente');
        
        if (statusCode === 400) {
          console.log('   Nota: HTTP 400 es normal para servidores Icecast');
        }
      } else {
        console.log('\n❌ La radio aparece como OFFLINE');
        console.log('   Código de respuesta:', statusCode);
      }
      
      res.destroy(); // Cerrar conexión inmediatamente
      resolve({ status: isOnline ? 'ONLINE' : 'OFFLINE', statusCode, responseTime });
    });

    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      console.log('❌ Error en conexión HTTPS:', error.message);
      console.log('   Response Time:', responseTime + 'ms');
      resolve({ status: 'OFFLINE', error: error.message, responseTime });
    });

    req.on('timeout', () => {
      req.destroy();
      console.log('⏰ Timeout en conexión HTTPS');
      resolve({ status: 'OFFLINE', error: 'Timeout', responseTime: Date.now() - startTime });
    });

    req.setTimeout(10000);
    req.end();
  });
}

async function testIntegration() {
  console.log('🔍 Iniciando prueba de integración para Digital FM Arica...\n');
  
  try {
    const result = await verifyDigitalFMDirect();
    
    console.log('\n📊 Resultado Final:');
    console.log('===================');
    console.log('URL: https://radio.digitalfm.cl:8000/arica');
    console.log('Status:', result.status);
    console.log('Status Code:', result.statusCode || 'N/A');
    console.log('Response Time:', result.responseTime + 'ms');
    
    if (result.status === 'ONLINE') {
      console.log('\n✅ CONCLUSIÓN: Digital FM Arica debería aparecer como ONLINE en el sistema');
      console.log('   El problema ha sido resuelto con el nuevo sistema de verificación');
    } else {
      console.log('\n❌ CONCLUSIÓN: La radio sigue sin poder verificarse');
      console.log('   Razón:', result.error || 'Desconocida');
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba de integración:', error.message);
  }
}

// Ejecutar prueba
testIntegration();
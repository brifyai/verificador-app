#!/usr/bin/env node

/**
 * Test para verificar que el error HTTP 400 se haya resuelto
 * Este script prueba el endpoint /api/verify-stream-public directamente
 */

const fetch = require('node-fetch');

async function testVerifyStreamPublic() {
  console.log('🧪 Test de solución de error HTTP 400');
  console.log('========================================');
  
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
      const response = await fetch('http://localhost:3000/api/verify-stream-public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streamUrl: test.streamUrl,
          radioName: test.name
        }),
      });

      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ Error response: ${errorText}`);
        continue;
      }

      const result = await response.json();
      console.log(`✅ Resultado:`, {
        available: result.available,
        status: result.status,
        statusText: result.statusText,
        error: result.error,
        message: result.message
      });

      if (result.available) {
        console.log(`🎉 ¡STREAM DISPONIBLE!`);
      } else {
        console.log(`⚠️ Stream no disponible: ${result.error || result.statusText}`);
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
const { verifyStreamStatus } = require('./lib/stream-verifier');

async function testDigitalFMFinal() {
  const url = 'https://radio.digitalfm.cl:8000/arica';
  
  console.log('🧪 Testing Digital FM Arica with integrated verification system...\n');
  
  try {
    const result = await verifyStreamStatus(url);
    
    console.log('✅ Resultado final del sistema integrado:');
    console.log('   URL:', url);
    console.log('   Status:', result.status);
    console.log('   Details:', result.details);
    console.log('   Stream Type:', result.streamType);
    console.log('   Method Used:', result.method);
    console.log('   Used Proxy:', result.usedProxy);
    console.log('   Response Code:', result.responseCode);
    console.log('   Response Time:', result.responseTime + 'ms');
    console.log('   Timestamp:', result.timestamp);
    
    if (result.status === 'ONLINE') {
      console.log('\n🎉 ¡ÉXITO! Digital FM Arica ahora aparece como ONLINE');
      console.log('   El sistema de verificación integrado está funcionando correctamente');
    } else {
      console.log('\n❌ La radio sigue apareciendo como OFFLINE');
      console.log('   Razón:', result.details);
    }
    
  } catch (error) {
    console.error('❌ Error en la verificación final:', error.message);
  }
}

// Ejecutar la prueba
testDigitalFMFinal();
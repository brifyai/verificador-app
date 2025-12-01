const https = require('https');
const crypto = require('crypto');

console.log('🎵 Probando verificación de FM Quiero de Antofagasta...');

// Probar el stream directamente con el verificador mejorado
const { verifyStream } = require('./lib/stream-verifier-legacy');

async function testQuieroStream() {
  const url = 'https://streaming-secure.conectaapp.cl/fmquiero.cl?token=f2dbfd16fa2ed744b3039c1f8df4986d5682498b74e00ef19d59391d41cfc5fa';
  
  console.log(`🔍 Verificando stream: ${url}`);
  
  try {
    const result = await verifyStream(url);
    console.log('✅ Resultado de verificación:', result);
    
    if (result.isOnline) {
      console.log('🎉 ¡FM Quiero está ONLINE!');
      console.log(`📊 Status: ${result.status}`);
      console.log(`🌐 Headers:`, result.headers);
    } else {
      console.log('❌ FM Quiero está OFFLINE');
      console.log(`📊 Status: ${result.status}`);
    }
  } catch (error) {
    console.error('❌ Error al verificar:', error.message);
  }
}

// Ejecutar la prueba
testQuieroStream().catch(console.error);
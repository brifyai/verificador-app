// Test para verificar cómo el sistema actual maneja chiloestreaming.com:10989
const { verifyStreamStatus } = require('./lib/stream-verifier.ts');

async function testCurrentSystem() {
  const testUrl = 'https://streaming.chiloestreaming.com:10989/';
  
  console.log('🧪 Probando URL con el sistema actual de verificación...');
  console.log(`📡 URL: ${testUrl}`);
  
  try {
    const result = await verifyStreamStatus(testUrl);
    
    console.log('\n📊 Resultado de la verificación:');
    console.log(`   Estado: ${result.status}`);
    console.log(`   Detalles: ${result.details}`);
    console.log(`   Tipo de stream: ${result.streamType}`);
    console.log(`   Código HTTP: ${result.httpStatus || 'N/A'}`);
    console.log(`   Método usado: ${result.method}`);
    console.log(`   Tipo de contenido: ${result.contentType || 'N/A'}`);
    
    // Análisis del resultado
    console.log('\n🔍 Análisis:');
    if (result.status === 'OFFLINE' && result.httpStatus === 404) {
      console.log('   ❌ El sistema marca como OFFLINE porque devuelve HTTP 404');
      console.log('   💡 Sin embargo, el servidor está respondiendo (no es un error de conexión)');
      console.log('   💡 Esto podría indicar que el servidor está online pero el recurso no existe');
    } else if (result.status === 'ONLINE') {
      console.log('   ✅ El sistema considera este stream como ONLINE');
    } else {
      console.log(`   ⚠️ Estado: ${result.status} - ${result.details}`);
    }
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
  }
}

// Ejecutar el test
testCurrentSystem().catch(console.error);
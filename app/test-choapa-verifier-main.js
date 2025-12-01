// Test script para verificar que el verificador principal maneje Tunzilla correctamente
const { verifyStream } = require('./lib/stream-verifier.ts');

async function testChoapaWithMainVerifier() {
  const url = 'https://cast.tunzilla.com/http://sonic.portalfoxmix.club:8106/stream';
  
  console.log('🧪 Probando Radio Choapa con el verificador principal...');
  console.log('URL:', url);
  console.log('');

  try {
    const result = await verifyStream(url);
    
    console.log('✅ Resultado del verificador principal:');
    console.log('Status:', result.status);
    console.log('Details:', result.details);
    console.log('Stream Type:', result.streamType);
    console.log('HTTP Status:', result.httpStatus);
    console.log('Content Type:', result.contentType);
    console.log('Method:', result.method);
    console.log('SSL Error:', result.sslError);
    console.log('SSL Error Fixed:', result.sslErrorFixed);
    
    if (result.status === 'ONLINE') {
      console.log('\n🎉 ¡ÉXITO! El verificador principal ahora detecta Tunzilla como ONLINE');
    } else {
      console.log('\n❌ El verificador principal aún detecta como OFFLINE');
      console.log('Detalles:', result.details);
    }
    
  } catch (error) {
    console.error('❌ Error al verificar con el verificador principal:', error);
  }
}

// Ejecutar prueba
testChoapaWithMainVerifier().catch(console.error);
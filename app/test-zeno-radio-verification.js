// Test script para verificar la radio Zeno.fm directamente
const { verifyStream } = require('./lib/stream-verifier.ts');

async function testZenoRadioVerification() {
  const zenoUrl = 'https://stream-59.zeno.fm/sg1ck0dchenvv?zs=B4GK2z5uSv26lB1uYHksHA';
  
  console.log('🔍 Verificando radio Zeno.fm:', zenoUrl);
  console.log('⏳ Esto puede tomar unos segundos...\n');
  
  try {
    const result = await verifyStream(zenoUrl);
    
    console.log('✅ Resultado de verificación:');
    console.log('- URL:', result.url);
    console.log('- Estado:', result.status);
    console.log('- Tipo de stream:', result.streamType);
    console.log('- Código HTTP:', result.httpStatus);
    console.log('- Tipo de contenido:', result.contentType);
    console.log('- Mensaje:', result.message);
    console.log('- Tiempo de respuesta:', result.responseTime + 'ms');
    
    if (result.error) {
      console.log('- Error:', result.error);
    }
    
    console.log('\n📊 Resumen:');
    if (result.status === 'ONLINE') {
      console.log('✅ La radio está ONLINE');
    } else {
      console.log('❌ La radio está OFFLINE');
    }
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    console.error('Stack:', error.stack);
  }
}

testZenoRadioVerification();
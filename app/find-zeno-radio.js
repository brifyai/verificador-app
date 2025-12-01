const { verifyStreamStatus } = require('./lib/stream-verifier.ts');

async function findZenoRadio() {
  const zenoUrl = 'https://stream-59.zeno.fm/sg1ck0dchenvv?zs=B4GK2z5uSv26lB1uYHksHA';
  
  console.log('🔍 Testing Zeno.fm stream with our verifier...');
  console.log('URL:', zenoUrl);
  
  try {
    // Verificar el stream directamente
    console.log('🧪 Verificando stream con nuestro verificador...');
    const result = await verifyStreamStatus(zenoUrl);
    
    console.log('✅ Resultado de verificación:');
    console.log('- Estado:', result.status);
    console.log('- Detalles:', result.details);
    console.log('- Tipo de stream:', result.streamType);
    console.log('- Código de estado:', result.httpStatus);
    console.log('- Content-Type:', result.contentType);
    console.log('- Método usado:', result.method);
    console.log('- SSL Error:', result.sslError);
    console.log('- SSL Arreglado:', result.sslErrorFixed);
    
    if (result.error) {
      console.log('- Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error al verificar:', error.message);
  }
}

findZenoRadio();
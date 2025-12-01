import { verifyStreamStatus } from './lib/stream-verifier';

async function testZenoStream() {
  const url = 'https://stream-59.zeno.fm/sg1ck0dchenvv?zs=B4GK2z5uSv26lB1uYHksHA';
  
  console.log('🧪 Probando stream de Zeno FM...');
  console.log(`📡 URL: ${url}`);
  
  try {
    const result = await verifyStreamStatus(url);
    
    console.log('\n📊 Resultado de la verificación:');
    console.log(`✅ Estado: ${result.status}`);
    console.log(`📋 Detalles: ${result.details}`);
    console.log(`🎵 Tipo de Stream: ${result.streamType}`);
    console.log(`📊 HTTP Status: ${result.httpStatus}`);
    console.log(`🎶 Content Type: ${result.contentType}`);
    console.log(`🔧 Método usado: ${result.method}`);
    console.log(`🔒 SSL Error: ${result.sslError}`);
    console.log(`🔧 SSL Fixed: ${result.sslErrorFixed}`);
    
    console.log('\n🎉 ¡Prueba completada!');
    
  } catch (error) {
    console.error('💥 Error durante la verificación:', error);
  }
}

testZenoStream();
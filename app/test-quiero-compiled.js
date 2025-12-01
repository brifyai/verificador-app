// Script para probar el verificador compilado con FM Quiero
const { verifyStreamStatus } = require('./lib/stream-verifier');

console.log('🎵 Probando verificador compilado con FM Quiero...');

const url = 'https://streaming-secure.conectaapp.cl/fmquiero.cl?token=f2dbfd16fa2ed744b3039c1f8df4986d5682498b74e00ef19d59391d41cfc5fa';

async function testQuieroCompiled() {
  console.log('=== PRUEBA CON VERIFICADOR COMPILADO ===');
  console.log(`🎯 URL: ${url}`);
  
  try {
    console.log('⏳ Verificando stream...');
    const result = await verifyStreamStatus(url);
    
    console.log('\n📊 RESULTADO FINAL:');
    console.log(`🎯 Estado: ${result.status}`);
    console.log(`📡 Tipo de stream: ${result.streamType}`);
    console.log(`🔢 Código HTTP: ${result.httpStatus}`);
    console.log(`📋 Content-Type: ${result.contentType}`);
    console.log(`🛡️  Cloudflare protegido: ${result.cloudflareProtected ? 'SÍ' : 'NO'}`);
    console.log(`🆔 CF-Ray: ${result.cloudflareRay || 'No disponible'}`);
    console.log(`🔍 Detalles: ${result.details}`);
    console.log(`📍 Método usado: ${result.method}`);
    console.log(`🔐 SSL Error: ${result.sslError ? 'SÍ' : 'NO'}`);
    console.log(`🔧 SSL Arreglado: ${result.sslErrorFixed ? 'SÍ' : 'NO'}`);
    
    if (result.status === 'ONLINE') {
      console.log('🎉 ¡FM Quiero está ONLINE con el verificador compilado!');
    } else {
      console.log('❌ FM Quiero está OFFLINE');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    return null;
  }
}

// Ejecutar la prueba
testQuieroCompiled().catch(console.error);
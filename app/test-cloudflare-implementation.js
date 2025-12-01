const { verifyStreamStatus } = require('./lib/stream-verifier.ts');

async function testCloudflareImplementation() {
  console.log('🧪 Probando implementación de Cloudflare...\n');
  
  // URL de FM Quiero que sabemos que está protegida por Cloudflare
  const testUrl = 'https://streaming-secure.conectaapp.cl/fmquiero.cl?token=f2dbfd16fa2ed744b3039c1f8df4986d5682498b74e00ef19d59391d41cfc5fa';
  
  console.log(`📻 URL de prueba: ${testUrl}`);
  console.log('⏳ Verificando stream...\n');
  
  try {
    const result = await verifyStreamStatus(testUrl);
    
    console.log('✅ Resultado de verificación:');
    console.log(`   Estado: ${result.status}`);
    console.log(`   Detalles: ${result.details}`);
    console.log(`   Tipo de stream: ${result.streamType}`);
    console.log(`   HTTP Status: ${result.httpStatus}`);
    console.log(`   Content-Type: ${result.contentType}`);
    console.log(`   Método usado: ${result.method}`);
    console.log(`   Protegido por Cloudflare: ${result.cloudflareProtected}`);
    console.log(`   Cloudflare Ray ID: ${result.cloudflareRay || 'No disponible'}`);
    console.log(`   SSL Error: ${result.sslError}`);
    console.log(`   SSL Error Fixed: ${result.sslErrorFixed}`);
    
    // Análisis del resultado
    console.log('\n📊 Análisis:');
    if (result.streamType === 'CLOUDFLARE' && result.cloudflareProtected) {
      console.log('✅ Cloudflare detectado correctamente');
      if (result.status === 'ONLINE') {
        console.log('✅ Stream marcado como ONLINE (protegido pero accesible)');
      } else {
        console.log('⚠️ Stream marcado como OFFLINE');
      }
    } else {
      console.log('❌ Cloudflare no detectado correctamente');
    }
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
  }
}

// Ejecutar prueba
testCloudflareImplementation().catch(console.error);
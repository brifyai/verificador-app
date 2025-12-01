// Test del verificador principal con FM Quiero (Cloudflare)
const { verifyStreamStatus } = require('./lib/stream-verifier.ts');

async function testQuieroMainVerifier() {
  console.log('🧪 Probando verificador principal con FM Quiero (Cloudflare)...\n');

  const url = 'https://streaming-secure.conectaapp.cl/fmquiero.cl?token=f2dbfd16fa2ed744b3039c1f8df4986d5682498b74e00ef19d59391d41cfc5fa';
  
  console.log(`📻 URL: ${url}`);
  console.log('⏳ Iniciando verificación...\n');

  try {
    const result = await verifyStreamStatus(url);
    
    console.log('📊 Resultado de la verificación:');
    console.log(`   Estado: ${result.status}`);
    console.log(`   Tipo: ${result.streamType}`);
    console.log(`   HTTP: ${result.httpStatus || 'N/A'}`);
    console.log(`   Método: ${result.method}`);
    console.log(`   Detalles: ${result.details}`);
    
    if (result.cloudflareProtected) {
      console.log(`   Cloudflare: ✅ Protegido (Ray: ${result.cloudflareRay || 'N/A'})`);
    }
    
    if (result.sslError) {
      console.log(`   SSL Error: ${result.sslError} (Fixed: ${result.sslErrorFixed})`);
    }
    
    console.log('\n📋 Resumen completo:');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n✅ Verificación completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en la verificación:', error.message);
  }
}

testQuieroMainVerifier();
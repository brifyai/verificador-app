// Script para debuggear la verificación de FM Quiero
const { verifyStreamStatus } = require('./lib/stream-verifier');

async function debugFMQuiero() {
  console.log('🔍 Debuggeando FM Quiero...\n');
  
  const quieroUrl = 'https://streaming-secure.conectaapp.cl/fmquiero.cl?token=f2dbfd16fa2ed744b3039c1f8df4986d5682498b74e00ef19d59391d41cfc5fa';
  
  try {
    console.log('📻 URL:', quieroUrl);
    console.log('🕐 Iniciando verificación...\n');
    
    const result = await verifyStreamStatus(quieroUrl);
    
    console.log('✅ Resultado de verificación:');
    console.log('- Status:', result.status);
    console.log('- Detalles:', result.details);
    console.log('- Tipo de stream:', result.streamType);
    console.log('- HTTP Status:', result.httpStatus);
    console.log('- Content-Type:', result.contentType);
    console.log('- Método usado:', result.method);
    console.log('- SSL Error:', result.sslError);
    console.log('- SSL Error Fixed:', result.sslErrorFixed);
    console.log('- Cloudflare Protected:', result.cloudflareProtected);
    console.log('- Cloudflare Ray:', result.cloudflareRay);
    
    console.log('\n🔍 Análisis detallado:');
    
    if (result.status === 'ONLINE') {
      console.log('✅ FM Quiero está ONLINE');
      if (result.cloudflareProtected) {
        console.log('🔒 Está protegido por Cloudflare');
      }
    } else {
      console.log('❌ FM Quiero está OFFLINE');
      console.log('📋 Razón:', result.details);
      
      if (result.httpStatus === 403) {
        console.log('🔒 HTTP 403 indica protección activa');
        if (result.cloudflareProtected) {
          console.log('✅ Cloudflare detectado correctamente');
        } else {
          console.log('⚠️ Cloudflare NO fue detectado');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
  }
}

// Ejecutar el debug
debugFMQuiero();
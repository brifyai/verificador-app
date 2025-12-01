// Test script para verificar la radio Zeno.fm directamente
import { verifyStreamStatus } from './lib/stream-verifier';

async function testZenoRadioVerification() {
  const zenoUrl = 'https://stream-59.zeno.fm/sg1ck0dchenvv?zs=B4GK2z5uSv26lB1uYHksHA';
  
  console.log('🔍 Verificando radio Zeno.fm:', zenoUrl);
  console.log('⏳ Esto puede tomar unos segundos...\n');
  
  try {
    const result = await verifyStreamStatus(zenoUrl);
    
    console.log('✅ Resultado de verificación:');
    console.log('- Estado:', result.status);
    console.log('- Tipo de stream:', result.streamType);
    console.log('- Código HTTP:', result.httpStatus);
    console.log('- Tipo de contenido:', result.contentType);
    console.log('- Detalles:', result.details);
    console.log('- Método usado:', result.method);
    console.log('- Usó proxy:', result.usedProxy);
    
    if (result.sslError) {
      console.log('- Error SSL:', result.sslError);
    }
    
    if (result.sslErrorFixed) {
      console.log('- SSL arreglado:', result.sslErrorFixed);
    }
    
    console.log('\n📊 Resumen:');
    if (result.status === 'ONLINE') {
      console.log('✅ La radio está ONLINE');
    } else {
      console.log('❌ La radio está OFFLINE');
    }
    
  } catch (error: any) {
    console.error('❌ Error durante la verificación:', error.message);
    console.error('Stack:', error.stack);
  }
}

testZenoRadioVerification();
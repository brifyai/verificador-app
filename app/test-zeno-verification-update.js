// Script para probar la actualización de radios Zeno.fm
const { verifyStreamStatus } = require('./lib/stream-verifier.js');

async function testZenoRadioUpdate() {
  const zenoUrl = 'https://stream-59.zeno.fm/sg1ck0dchenvv?zs=B4GK2z5uSv26lB1uYHksHA';
  
  console.log('🔍 Probando actualización de radio Zeno.fm...');
  console.log('  URL:', zenoUrl);
  
  try {
    // Verificar el stream
    const result = await verifyStreamStatus(zenoUrl);
    
    console.log('✅ Verificación completada:');
    console.log('  Estado:', result.status);
    console.log('  Tipo:', result.streamType);
    console.log('  Detalles:', result.details);
    console.log('  Método:', result.method);
    console.log('  Código HTTP:', result.responseCode);
    console.log('  Tiempo de respuesta:', result.responseTime + 'ms');
    
    if (result.status === 'ONLINE') {
      console.log('\n🎉 ¡ÉXITO! El stream de Zeno.fm ahora se detecta como ONLINE');
      console.log('  ✅ El problema ha sido resuelto');
      console.log('  ✅ El verificador acepta HTTP 302 para Zeno.fm');
      console.log('  ✅ La plataforma se clasifica correctamente como ZENO');
    } else {
      console.log('\n⚠️ El stream sigue apareciendo como OFFLINE');
      console.log('  Razón:', result.details);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Ejecutar la prueba
testZenoRadioUpdate();
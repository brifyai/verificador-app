/**
 * Script para probar Digital FM Arica directamente con TypeScript
 */

import { verifyStreamStatus } from './lib/stream-verifier';

async function testDigitalFMArica() {
  console.log('🧪 Probando Digital FM Arica con el verificador actualizado...');
  
  const url = 'https://radio.digitalfm.cl:8000/arica';
  
  try {
    const result = await verifyStreamStatus(url);
    
    console.log('📊 Resultado de la verificación:');
    console.log(`✅ Estado: ${result.status}`);
    console.log(`📋 Detalles: ${result.details}`);
    console.log(`🎵 Tipo de Stream: ${result.streamType}`);
    console.log(`📊 HTTP Status: ${result.httpStatus || 'N/A'}`);
    console.log(`🎶 Content Type: ${result.contentType || 'N/A'}`);
    console.log(`🔧 Método usado: ${result.method}`);
    console.log(`🔒 SSL Error: ${result.sslError || false}`);
    console.log(`🔧 SSL Fixed: ${result.sslErrorFixed || false}`);
    
    if (result.status === 'ONLINE') {
      console.log('\n🎉 ¡ÉXITO! Digital FM Arica ahora se detecta como ONLINE');
    } else {
      console.log('\n❌ Aún aparece como OFFLINE - necesitamos más ajustes');
    }
    
  } catch (error: any) {
    console.error('❌ Error durante la verificación:', error.message);
  }
}

// Ejecutar la prueba
testDigitalFMArica();
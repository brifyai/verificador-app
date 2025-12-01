// Script para probar el verificador actualizado con FM Quiero
const path = require('path');

// Importar el verificador principal actualizado
const { verifyStreamStatus } = require('./lib/stream-verifier.ts');

console.log('🎵 Probando verificación de FM Quiero con el verificador actualizado...');

async function testQuieroWithUpdatedVerifier() {
  const url = 'https://streaming-secure.conectaapp.cl/fmquiero.cl?token=f2dbfd16fa2ed744b3039c1f8df4986d5682498b74e00ef19d59391d41cfc5fa';
  
  console.log(`🔍 Verificando stream: ${url}`);
  console.log(`📡 Usando verificador actualizado con soporte Cloudflare...`);
  
  try {
    const result = await verifyStreamStatus(url);
    
    console.log('✅ Resultado de verificación:', JSON.stringify(result, null, 2));
    
    if (result.status === 'ONLINE') {
      console.log('🎉 ¡FM Quiero está ONLINE con el verificador actualizado!');
      console.log(`🎯 Tipo de stream detectado: ${result.streamType}`);
      console.log(`🔢 Código HTTP: ${result.statusCode}`);
      if (result.isCloudflare) {
        console.log(`🛡️  Cloudflare detectado: SÍ`);
        console.log(`🆔 CF-Ray: ${result.cfRay || 'No disponible'}`);
      }
    } else {
      console.log('❌ FM Quiero está OFFLINE con el verificador actualizado');
      console.log(`📊 Estado: ${result.status}`);
      console.log(`🔢 Código HTTP: ${result.statusCode}`);
      if (result.error) {
        console.log(`❌ Error: ${result.error}`);
      }
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error al verificar con el verificador actualizado:', error.message);
    console.error('📋 Stack:', error.stack);
    return null;
  }
}

// Función para probar la detección de Cloudflare
async function testCloudflareDetection() {
  const url = 'https://streaming-secure.conectaapp.cl/fmquiero.cl?token=f2dbfd16fa2ed744b3039c1f8df4986d5682498b74e00ef19d59391d41cfc5fa';
  
  console.log('\n🔍 Probando detección de Cloudflare...');
  
  try {
    // Importar la función de detección
    const { detectStreamType } = require('./lib/stream-verifier');
    
    const streamType = detectStreamType(url);
    console.log(`📊 Tipo de stream detectado: ${streamType}`);
    
    if (streamType === 'CLOUDFLARE') {
      console.log('✅ ¡Cloudflare detectado correctamente!');
    } else {
      console.log(`⚠️  Se detectó como: ${streamType}`);
    }
    
    return streamType;
  } catch (error) {
    console.error('❌ Error en detección:', error.message);
    return null;
  }
}

// Ejecutar las pruebas
async function runTests() {
  console.log('=== PRUEBA 1: Detección de Cloudflare ===');
  await testCloudflareDetection();
  
  console.log('\n=== PRUEBA 2: Verificación completa ===');
  await testQuieroWithUpdatedVerifier();
}

runTests().catch(console.error);
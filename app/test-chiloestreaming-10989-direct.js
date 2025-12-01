#!/usr/bin/env node

// Script para probar la verificación de streaming.chiloestreaming.com:10989
// usando el sistema de verificación real del proyecto

const { verifyStreamStatus } = require('./lib/stream-verifier-enhanced');

async function testChiloeStreaming() {
  console.log('🧪 Testeando streaming.chiloestreaming.com:10989 con el verificador del sistema...\n');
  
  const url = 'https://streaming.chiloestreaming.com:10989/';
  
  try {
    console.log(`📡 Verificando: ${url}`);
    console.log('⏳ Esperando respuesta del verificador...\n');
    
    const result = await verifyStreamStatus(url);
    
    console.log('✅ Verificación completada!\n');
    console.log('📊 Resultados:');
    console.log(`   Status: ${result.status}`);
    console.log(`   Detalles: ${result.details}`);
    
    if (result.status === 'ONLINE') {
      console.log(`   Tiempo de respuesta: ${result.responseTime}ms`);
      if (result.headers) {
        console.log(`   Headers:`, result.headers);
      }
    }
    
    console.log('\n🔍 Análisis:');
    if (result.status === 'ONLINE') {
      console.log('   ✅ El stream está respondiendo correctamente');
      console.log('   ✅ El servidor está online y sirviendo contenido');
    } else {
      console.log('   ❌ El stream aparece como offline');
      console.log('   ⚠️  Esto puede deberse a:');
      console.log('      - El servidor responde pero con error 404');
      console.log('      - El endpoint específico no existe');
      console.log('      - Problemas de red o timeout');
    }
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar el test
testChiloeStreaming().catch(console.error);
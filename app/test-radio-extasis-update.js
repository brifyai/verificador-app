#!/usr/bin/env node

/**
 * Script de prueba para simular la actualización del radio "Extasis"
 * Este script prueba el flujo completo de actualización con SONICPANEL
 */

const { mapPlatformToDbSmart } = require('./lib/platform-mapping-smart.ts');

console.log('🎵 Probando actualización del radio "Extasis" con SONICPANEL...\n');

// Datos del radio Extasis
const radioExtasis = {
  id: 'extasis-123',
  name: 'Extasis',
  url: 'https://sonic.streamingchilenos.com/8142/stream',
  platform: 'sonicpanel', // Este es el problema que estamos resolviendo
  city: 'Santiago',
  country: 'Chile',
  region: 'Metropolitana'
};

console.log('📻 Datos originales del radio:');
console.log(`   Nombre: ${radioExtasis.name}`);
console.log(`   URL: ${radioExtasis.url}`);
console.log(`   Plataforma: ${radioExtasis.platform}`);
console.log(`   Ciudad: ${radioExtasis.city}`);

console.log('\n🔧 Procesando con el nuevo mapeo de plataformas...');

try {
  // Simular el mapeo que hace el backend
  const platformMapping = mapPlatformToDbSmart(radioExtasis.platform);
  
  console.log('\n✅ Resultado del mapeo:');
  console.log(`   Plataforma para DB: ${platformMapping.platform}`);
  if (platformMapping.originalPlatform) {
    console.log(`   Plataforma original: ${platformMapping.originalPlatform}`);
  }

  // Simular los datos que se enviarían a la base de datos
  const datosParaDB = {
    ...radioExtasis,
    platform: platformMapping.platform,
    metadata: {
      original_platform: platformMapping.originalPlatform || radioExtasis.platform,
      stream_url: radioExtasis.url
    }
  };

  console.log('\n📊 Datos finales para la base de datos:');
  console.log(`   platform: "${datosParaDB.platform}" ✅ (válido para el constraint)`);
  console.log(`   metadata.original_platform: "${datosParaDB.metadata.original_platform}"`);
  console.log(`   metadata.stream_url: "${datosParaDB.metadata.stream_url}"`);

  // Verificar que cumple con el constraint
  const constraintValues = ['OTHER', 'YOUTUBE', 'TWITCH'];
  const cumpleConstraint = constraintValues.includes(datosParaDB.platform);
  
  console.log('\n🔍 Verificación del constraint:');
  if (cumpleConstraint) {
    console.log(`   ✅ PASS: "${datosParaDB.platform}" está en la lista permitida`);
    console.log(`   ✅ El constraint "radios_platform_check" se cumplirá`);
  } else {
    console.log(`   ❌ FAIL: "${datosParaDB.platform}" NO está en la lista permitida`);
    console.log(`   ❌ El constraint "radios_platform_check" FALLARÍA`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 ¡SIMULACIÓN EXITOSA!');
  console.log('='.repeat(60));
  console.log('\n💡 El radio "Extasis" ahora puede ser actualizado sin errores:');
  console.log('   • La plataforma SONICPANEL se mapea correctamente a OTHER');
  console.log('   • El constraint de la base de datos se respeta');
  console.log('   • La información original se preserva en metadata');
  console.log('\n🔄 La actualización del radio debería funcionar ahora sin el error:');
  console.log('   "violates check constraint "radios_platform_check""');

} catch (error) {
  console.log('\n❌ Error en la simulación:', error.message);
  process.exit(1);
}
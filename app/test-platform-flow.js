// Script para verificar el flujo completo de plataformas
// Desde el formulario hasta la base de datos

const { mapPlatformToDbSmart, mapDbToPlatformSmart } = require('./lib/platform-mapping-smart');

console.log('🧪 TEST DE FLUJO DE PLATAFORMAS');
console.log('=====================================\n');

// Test 1: Verificar mapeo de plataformas
console.log('1. Mapeo de plataformas frontend → backend → DB:');
const testPlatforms = ['direct', 'youtube', 'twitch', 'facebook', 'custom'];

testPlatforms.forEach(platform => {
  const dbValue = mapPlatformToDbSmart(platform);
  const backToFrontend = mapDbToPlatformSmart(dbValue);
  console.log(`   '${platform}' → '${dbValue}' → '${backToFrontend}'`);
});

console.log('\n2. Valores problemáticos que podrían causar error:');
const problematicValues = ['DIRECT', 'Direct', 'DIRECT ', 'direct', ''];
problematicValues.forEach(value => {
  const dbValue = mapPlatformToDbSmart(value);
  console.log(`   '${value}' → '${dbValue}' (tipo: ${typeof dbValue})`);
});

console.log('\n3. Verificación de constraint de DB:');
const dbPlatforms = ['YOUTUBE', 'TWITCH', 'FACEBOOK', 'INSTAGRAM', 'SPOTIFY', 'SOUNDCLOUD', 'MIXCLOUD', 'OTHER'];
dbPlatforms.forEach(platform => {
  console.log(`   ✅ '${platform}' es válido para DB`);
});

console.log('\n4. Casos que causarían error de constraint:');
const invalidPlatforms = ['DIRECT', 'direct', 'youtube', 'YOUTUBE', ''];
invalidPlatforms.forEach(platform => {
  const isValid = dbPlatforms.includes(platform);
  console.log(`   ${isValid ? '✅' : '❌'} '${platform}' ${isValid ? 'válido' : 'INVALIDO'} para DB`);
});

console.log('\n5. Conclusión:');
console.log('   - El frontend envía valores en minúsculas (direct, youtube, etc.)');
console.log('   - El backend debe mapear estos valores a mayúsculas para DB');
console.log('   - Si llega "DIRECT" al backend, el mapeo falla y se envía "DIRECT" a DB');
console.log('   - La constraint rechaza "DIRECT" porque no está en la lista permitida');
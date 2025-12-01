#!/usr/bin/env node

/**
 * Script de prueba para verificar el fix de SONICPANEL
 * Este script prueba que el mapeo de plataformas ahora respeta el constraint de la base de datos
 */

const { mapPlatformToDbSmart } = require('./lib/platform-mapping-smart.ts');

console.log('🧪 Probando fix de mapeo de plataformas...\n');

// Casos de prueba
const testCases = [
  { input: 'sonicpanel', expected: 'OTHER', description: 'SONICPANEL debe mapear a OTHER' },
  { input: 'SONICPANEL', expected: 'OTHER', description: 'SONICPANEL (mayúsculas) debe mapear a OTHER' },
  { input: 'youtube', expected: 'YOUTUBE', description: 'YOUTUBE debe permanecer como YOUTUBE' },
  { input: 'YOUTUBE', expected: 'YOUTUBE', description: 'YOUTUBE (mayúsculas) debe permanecer como YOUTUBE' },
  { input: 'twitch', expected: 'TWITCH', description: 'TWITCH debe permanecer como TWITCH' },
  { input: 'TWITCH', expected: 'TWITCH', description: 'TWITCH (mayúsculas) debe permanecer como TWITCH' },
  { input: 'centova', expected: 'OTHER', description: 'CENTOVA debe mapear a OTHER' },
  { input: 'azuracast', expected: 'OTHER', description: 'AZURACAST debe mapear a OTHER' },
  { input: 'unknown', expected: 'OTHER', description: 'Plataforma desconocida debe mapear a OTHER' },
];

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.description}`);
  
  try {
    const result = mapPlatformToDbSmart(testCase.input);
    const success = result.platform === testCase.expected;
    
    if (success) {
      console.log(`   ✅ PASS: "${testCase.input}" → "${result.platform}"`);
      if (result.originalPlatform) {
        console.log(`      ℹ️  Plataforma original guardada: "${result.originalPlatform}"`);
      }
      passed++;
    } else {
      console.log(`   ❌ FAIL: "${testCase.input}" → "${result.platform}" (esperado: "${testCase.expected}")`);
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    failed++;
  }
});

console.log('\n' + '='.repeat(50));
console.log(`📊 Resultados: ${passed} pasadas, ${failed} fallidas`);
console.log('='.repeat(50));

if (failed === 0) {
  console.log('🎉 ¡Todas las pruebas pasaron! El fix está funcionando correctamente.');
  console.log('\n💡 Resumen del fix:');
  console.log('   • SONICPANEL ahora se mapea a OTHER (respeta el constraint)');
  console.log('   • Solo YOUTUBE y TWITCH se guardan con su valor original');
  console.log('   • Todas las demás plataformas se mapean a OTHER');
  console.log('   • La plataforma original se guarda en metadata.original_platform');
} else {
  console.log('⚠️  Algunas pruebas fallaron. Revisa el fix.');
  process.exit(1);
}
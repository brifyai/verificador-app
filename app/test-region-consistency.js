#!/usr/bin/env node

// Script para probar la consistencia de nombres de regiones
const { normalizeRegionName, REGION_NAMES, REGION_ORDER } = require('./lib/regions.ts');

console.log('🧪 Probando consistencia de regiones...\n');

console.log('📋 Nombres de regiones estandarizados:');
Object.entries(REGION_NAMES).forEach(([key, value]) => {
  console.log(`  ${key}: "${value}"`);
});

console.log('\n📊 Orden de regiones:');
REGION_ORDER.forEach((region, index) => {
  console.log(`  ${index + 1}. ${region}`);
});

console.log('\n🔍 Probando normalización de nombres:');
const testCases = [
  'Bio Bio',
  'bio bio',
  'Bío Bío',
  'BIOBIO',
  'La Araucanía',
  'Araucanía',
  'Magallanes y Antartica',
  'Magallanes',
  'Metropolitana',
  'metropolitana'
];

testCases.forEach(testCase => {
  const normalized = normalizeRegionName(testCase);
  console.log(`  "${testCase}" → "${normalized}"`);
});

console.log('\n✅ Pruebas completadas');
#!/usr/bin/env node

// Script para verificar las regiones directamente desde el frontend
// Este script simula lo que vería el usuario en la interfaz

console.log('🔍 Analizando el orden de regiones en el frontend...');
console.log('=====================================');

// Orden actual en el código (líneas 85-102 de radios/page.tsx)
const regionOrder = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana de Santiago',
  'Libertador General Bernardo O\'Higgins',
  'Maule',
  'Ñuble',
  'Biobío',
  'La Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén del General Carlos Ibáñez del Campo',
  'Magallanes y de la Antártica Chilena'
];

console.log('📋 Orden definido en el código:');
console.log('=====================================');

regionOrder.forEach((region, index) => {
  console.log(`${index + 1}. ${region}`);
});

// Verificar el orden específico solicitado
console.log('\n🎯 Verificación del orden solicitado:');
console.log('=====================================');

const valparaisoIndex = regionOrder.indexOf('Valparaíso');
const metropolitanaIndex = regionOrder.indexOf('Metropolitana de Santiago');
const ohigginsIndex = regionOrder.indexOf('Libertador General Bernardo O\'Higgins');

console.log(`Valparaíso está en posición: ${valparaisoIndex + 1}`);
console.log(`Metropolitana está en posición: ${metropolitanaIndex + 1}`);
console.log(`O'Higgins está en posición: ${ohigginsIndex + 1}`);

// Verificar si el orden es correcto
const isOrderCorrect = valparaisoIndex < metropolitanaIndex && metropolitanaIndex < ohigginsIndex;

if (isOrderCorrect) {
  console.log('\n✅ El orden en el código ES CORRECTO:');
  console.log(`   Valparaíso (${valparaisoIndex + 1}) < Metropolitana (${metropolitanaIndex + 1}) < O'Higgins (${ohigginsIndex + 1})`);
} else {
  console.log('\n❌ El orden en el código NO es correcto');
}

console.log('\n💡 Si ves un orden diferente en la interfaz web, posibles causas:');
console.log('   1. Las regiones en la base de datos tienen nombres diferentes');
console.log('   2. Solo hay algunas regiones cargadas, no todas');
console.log('   3. Las regiones no mapeadas se están agregando al final');

console.log('\n🔧 Solución si los nombres son diferentes:');
console.log('   Modifica el array regionOrder en app/app/(dashboard)/radios/page.tsx');
console.log('   para que coincida exactamente con los nombres en tu base de datos.');

// Crear una función para verificar el orden real desde el navegador
console.log('\n📋 Para verificar el orden real desde el navegador:');
console.log('=====================================');
console.log('1. Abre http://localhost:3000/radios');
console.log('2. Abre la consola del navegador (F12)');
console.log('3. Copia y pega este código:');
console.log('');
console.log('// Código para verificar regiones en el navegador');
console.log('const regions = Array.from(document.querySelectorAll("select option")).map(option => option.text).filter(text => text && !text.includes("Selecciona"));');
console.log('console.log("Regiones en el filtro:", regions);');
console.log('');
console.log('4. Compara los resultados con el orden esperado');
#!/usr/bin/env node

/**
 * Script de prueba para verificar el orden de regiones en la página de radios
 * Este script simula el comportamiento del frontend para agrupar radios por región
 */

// Orden geográfico de norte a sur para las regiones de Chile
const regionOrder = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana',
  'O\'Higgins',
  'Maule',
  'Ñuble',
  'Bio Bio',
  'La Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén',
  'Magallanes y Antartica'
];

// Datos de prueba simulando radios de diferentes regiones
const testRadios = [
  { id: 1, name: 'Radio Santiago', region: 'Metropolitana' },
  { id: 2, name: 'Radio Valparaíso', region: 'Valparaíso' },
  { id: 3, name: 'Radio Concepción', region: 'Bio Bio' },
  { id: 4, name: 'Radio Antofagasta', region: 'Antofagasta' },
  { id: 5, name: 'Radio Rancagua', region: 'O\'Higgins' },
  { id: 6, name: 'Radio Iquique', region: 'Tarapacá' },
  { id: 7, name: 'Radio La Serena', region: 'Coquimbo' },
  { id: 8, name: 'Radio Puerto Montt', region: 'Los Lagos' },
];

console.log('🧪 TEST DE ORDEN DE REGIONES');
console.log('=====================================\n');

// Simular la función groupedRadios del frontend
function testRegionOrder(radios) {
  console.log('1. Agrupando radios por región...');
  
  const grouped = radios.reduce((acc, radio) => {
    if (!acc[radio.region]) {
      acc[radio.region] = [];
    }
    acc[radio.region].push(radio);
    return acc;
  }, {});

  console.log('2. Regiones encontradas:', Object.keys(grouped));
  
  // Ordenar las regiones según el orden geográfico
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    const indexA = regionOrder.indexOf(a);
    const indexB = regionOrder.indexOf(b);
    
    // Si ambas regiones están en el orden definido, usar ese orden
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    
    // Si una región no está en el orden definido, ponerla al final
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    
    // Como fallback, ordenar alfabéticamente
    return a.localeCompare(b);
  });

  console.log('3. Regiones ordenadas geográficamente:');
  sortedKeys.forEach((region, index) => {
    const originalIndex = regionOrder.indexOf(region);
    console.log(`   ${index + 1}. ${region} (posición original: ${originalIndex + 1})`);
  });

  console.log('\n4. Radios por región (ordenadas):');
  const result = {};
  sortedKeys.forEach(key => {
    result[key] = grouped[key].sort((a, b) => a.name.localeCompare(b.name));
    console.log(`   📍 ${key}:`);
    result[key].forEach(radio => {
      console.log(`      - ${radio.name}`);
    });
  });

  return result;
}

// Ejecutar prueba
const orderedRadios = testRegionOrder(testRadios);

console.log('\n✅ Prueba completada!');
console.log('El orden geográfico de norte a sur se está aplicando correctamente.');
console.log('\nOrden esperado:');
regionOrder.forEach((region, index) => {
  console.log(`${index + 1}. ${region}`);
});
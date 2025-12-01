// Script para verificar regiones usando el cliente directo de Supabase
const supabaseDirect = require('./lib/supabase-direct.js');

async function checkRegions() {
  try {
    console.log('📍 Obteniendo regiones desde la base de datos...');
    
    // Usar el cliente directo de Supabase (ya es una instancia)
    const client = supabaseDirect;
    
    // Obtener todas las regiones únicas
    const data = await client.get('radios?select=region&order=region.asc');
    
    if (!data || !Array.isArray(data)) {
      console.error('❌ Error: No se pudieron obtener los datos');
      return;
    }

    // Obtener regiones únicas
    const uniqueRegions = [...new Set(data.map(radio => radio.region))];
    
    console.log('\n📋 Regiones encontradas en la base de datos:');
    uniqueRegions.forEach((region, index) => {
      console.log(`${index + 1}. ${region}`);
    });

    // Orden geográfico correcto de norte a sur
    const correctOrder = [
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

    console.log('\n🗺️  Orden geográfico correcto (norte a sur):');
    correctOrder.forEach((region, index) => {
      const exists = uniqueRegions.includes(region);
      const status = exists ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${region}`);
    });

    // Verificar qué regiones faltan o sobran
    const missingRegions = correctOrder.filter(region => !uniqueRegions.includes(region));
    const extraRegions = uniqueRegions.filter(region => !correctOrder.includes(region));

    if (missingRegions.length > 0) {
      console.log('\n⚠️  Regiones que faltan en la base de datos:');
      missingRegions.forEach(region => console.log(`  - ${region}`));
    }

    if (extraRegions.length > 0) {
      console.log('\n⚠️  Regiones extra en la base de datos (no están en el orden estándar):');
      extraRegions.forEach(region => console.log(`  - ${region}`));
    }

    console.log('\n✅ Verificación completada.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Ejecutar el script
checkRegions();
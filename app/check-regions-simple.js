// Script simple para verificar regiones usando el cliente directo de Supabase
const { createClient } = require('@supabase/supabase-js');

// Cargar variables de entorno
require('dotenv').config();

async function checkRegionsSimple() {
  try {
    console.log('📍 Obteniendo regiones desde Supabase directamente...');
    
    // Verificar credenciales
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Faltan credenciales de Supabase');
      console.log('URL:', supabaseUrl ? '✅ Presente' : '❌ Ausente');
      console.log('KEY:', supabaseKey ? '✅ Presente' : '❌ Ausente');
      return;
    }

    // Crear cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener todas las radios
    const { data: radios, error } = await supabase
      .from('radios')
      .select('*')
      .limit(500);

    if (error) {
      console.error('❌ Error obteniendo radios:', error.message);
      return;
    }

    if (!radios || radios.length === 0) {
      console.log('⚠️  No se encontraron radios en la base de datos');
      return;
    }

    // Obtener regiones únicas
    const uniqueRegions = [...new Set(radios.map(radio => radio.region))];
    
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
    console.log(`📊 Total de radios: ${radios.length}`);
    console.log(`🗺️  Total de regiones únicas: ${uniqueRegions.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Ejecutar el script
checkRegionsSimple();
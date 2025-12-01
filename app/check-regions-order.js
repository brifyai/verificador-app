#!/usr/bin/env node

// Script para verificar el orden actual de las regiones en la base de datos
const { createClient } = require('@supabase/supabase-js');

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Falta configuración de Supabase');
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en tu archivo .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRegionsOrder() {
  try {
    console.log('🔍 Obteniendo regiones desde la base de datos...');
    
    // Obtener todas las regiones únicas de la tabla radios
    const { data, error } = await supabase
      .from('radios')
      .select('region')
      .not('region', 'is', null);
    
    if (error) {
      console.error('❌ Error al obtener regiones:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️  No hay radios en la base de datos');
      return;
    }

    // Obtener regiones únicas
    const uniqueRegions = [...new Set(data.map(radio => radio.region))];
    
    console.log(`\n📍 Se encontraron ${uniqueRegions.length} regiones únicas:`);
    console.log('=====================================');
    
    uniqueRegions.forEach((region, index) => {
      console.log(`${index + 1}. ${region}`);
    });

    // Orden geográfico esperado
    const expectedOrder = [
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

    console.log('\n🗺️  Orden geográfico esperado (norte a sur):');
    console.log('=====================================');
    
    expectedOrder.forEach((region, index) => {
      const exists = uniqueRegions.includes(region);
      const status = exists ? '✅' : '❌';
      console.log(`${index + 1}. ${region} ${status}`);
    });

    // Verificar coincidencias
    console.log('\n🔍 Análisis de coincidencias:');
    console.log('=====================================');
    
    const matchedRegions = uniqueRegions.filter(region => expectedOrder.includes(region));
    const unmatchedRegions = uniqueRegions.filter(region => !expectedOrder.includes(region));
    
    console.log(`✅ Regiones que coinciden: ${matchedRegions.length}`);
    matchedRegions.forEach(region => {
      const expectedIndex = expectedOrder.indexOf(region) + 1;
      console.log(`   ${expectedIndex}. ${region}`);
    });
    
    if (unmatchedRegions.length > 0) {
      console.log(`\n⚠️  Regiones no mapeadas: ${unmatchedRegions.length}`);
      unmatchedRegions.forEach(region => {
        console.log(`   - ${region}`);
      });
    }

    // Sugerir ajustes si hay diferencias
    if (unmatchedRegions.length > 0) {
      console.log('\n💡 Sugerencia:');
      console.log('Agrega estas regiones no mapeadas al array regionOrder en app/app/(dashboard)/radios/page.tsx');
      console.log('en la posición geográfica correcta.');
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Ejecutar el script
checkRegionsOrder();
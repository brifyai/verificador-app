// Script para verificar los nombres reales de regiones en la base de datos
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

async function checkRegionsInDatabase() {
  console.log('🔍 Verificando nombres de regiones en la base de datos...');
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Obtener todas las regiones únicas de la tabla radios
    const { data, error } = await supabase
      .from('radios')
      .select('region')
      .not('region', 'is', null)
      .order('region', { ascending: true });
    
    if (error) {
      console.error('❌ Error al obtener regiones:', error);
      return;
    }
    
    // Obtener regiones únicas
    const uniqueRegions = [...new Set(data.map(radio => radio.region))];
    
    console.log('\n📋 Regiones encontradas en la base de datos:');
    console.log('=====================================');
    uniqueRegions.forEach((region, index) => {
      console.log(`${index + 1}. "${region}"`);
    });
    
    console.log('\n🎯 Comparación con el orden esperado:');
    console.log('=====================================');
    
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
    
    expectedOrder.forEach((expectedRegion, index) => {
      const foundIndex = uniqueRegions.findIndex(region => 
        region.toLowerCase().includes(expectedRegion.toLowerCase().split(' ')[0])
      );
      const status = foundIndex !== -1 ? '✅' : '❌';
      console.log(`${status} ${index + 1}. "${expectedRegion}"`);
    });
    
    console.log('\n💡 Recomendaciones:');
    console.log('=====================================');
    console.log('1. Si los nombres no coinciden, necesitarás modificar el array regionOrder');
    console.log('2. Si faltan regiones, solo se mostrarán las que tienen radios');
    console.log('3. Puedes copiar los nombres exactos de arriba para actualizar el código');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkRegionsInDatabase();
}

module.exports = { checkRegionsInDatabase };
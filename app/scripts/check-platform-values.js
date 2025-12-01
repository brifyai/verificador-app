const { supabaseDirect } = require('../lib/supabase-direct.js');

async function checkPlatformValues() {
  try {
    console.log('🔍 Obteniendo valores de platform de la base de datos...\n');
    
    // Obtener valores únicos de platform
    const radios = await supabaseDirect.getRadios({ limit: 1000 });
    
    const platformValues = new Set();
    const platformExamples = {};
    
    radios.forEach(radio => {
      if (radio.platform) {
        platformValues.add(radio.platform);
        if (!platformExamples[radio.platform]) {
          platformExamples[radio.platform] = {
            name: radio.name,
            id: radio.id,
            stream_url: radio.stream_url
          };
        }
      }
    });
    
    console.log('✅ Valores válidos de platform encontrados:');
    console.log('==========================================');
    
    const sortedValues = Array.from(platformValues).sort();
    sortedValues.forEach(value => {
      const example = platformExamples[value];
      console.log(`• "${value}"`);
      console.log(`  Ejemplo: ${example.name} (ID: ${example.id})`);
      console.log(`  URL: ${example.stream_url || 'N/A'}`);
      console.log('');
    });
    
    console.log(`\n📊 Total de valores únicos: ${platformValues.size}`);
    
    // También verificar si hay alguna restricción en el esquema
    console.log('\n🔍 Verificando ejemplos de URLs por plataforma...');
    sortedValues.forEach(value => {
      const examples = radios.filter(r => r.platform === value && r.stream_url).slice(0, 2);
      if (examples.length > 0) {
        console.log(`\n${value}:`);
        examples.forEach(ex => {
          console.log(`  - ${ex.stream_url}`);
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Error al obtener valores de platform:', error);
  }
}

checkPlatformValues();
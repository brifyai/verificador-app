const { SupabaseDirectClient } = require('../lib/supabase-direct');

async function checkRadioIdsFormat() {
  console.log('🔍 Verificando formato de IDs de radio en Supabase...');
  
  try {
    const supabase = new SupabaseDirectClient();
    
    // Obtener todas las radios
    const radios = await supabase.request('GET', '/radios?select=id,name,region&order=id.asc');
    
    console.log(`📊 Total de radios encontradas: ${radios.length}`);
    console.log('\n📋 Primeras 10 radios:');
    
    radios.slice(0, 10).forEach((radio, index) => {
      console.log(`${index + 1}. ID: "${radio.id}" | Nombre: "${radio.name}" | Región: "${radio.region}"`);
    });
    
    // Buscar específicamente las radios mijm9xci y mijm9xsi
    console.log('\n🔍 Buscando radios específicas:');
    const targetRadios = radios.filter(r => r.id === 'mijm9xci' || r.id === 'mijm9xsi');
    
    if (targetRadios.length > 0) {
      targetRadios.forEach(radio => {
        console.log(`✅ Encontrada: ID="${radio.id}" | Nombre="${radio.name}"`);
      });
    } else {
      console.log('❌ No se encontraron las radios mijm9xci o mijm9xsi');
      
      // Buscar radios similares
      const similarRadios = radios.filter(r => 
        r.id.includes('mijm9xci') || 
        r.id.includes('mijm9xsi') ||
        r.name.includes('MiJM9XCI') ||
        r.name.includes('MiJM9XSI')
      );
      
      if (similarRadios.length > 0) {
        console.log('\n🔍 Radios similares encontradas:');
        similarRadios.forEach(radio => {
          console.log(`   ID: "${radio.id}" | Nombre: "${radio.name}"`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error verificando radios:', error.message);
  }
}

checkRadioIdsFormat();
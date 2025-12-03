// Script para debuggear la búsqueda de radios específicas
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase (usando las credenciales del entorno)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Faltan credenciales de Supabase en el entorno');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Presente' : '❌ Ausente');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Presente' : '❌ Ausente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugRadioSearch() {
  console.log('🔍 Debuggeando búsqueda de radios específicas...\n');
  
  try {
    // 1. Buscar radios específicas
    const targetIds = ['mijm9xci', 'mijm9xsi'];
    
    for (const radioId of targetIds) {
      console.log(`\n--- Buscando radio: "${radioId}" ---`);
      
      // Intentar diferentes formatos de búsqueda
      const searches = [
        `id=eq.${radioId}`,
        `id=like.*${radioId}*`,
        `name=like.*${radioId}*`,
        `id=eq.radio_${radioId}`,
        `name=eq.Radio ${radioId.toUpperCase()}`
      ];
      
      for (const search of searches) {
        try {
          console.log(`  Buscando con: ${search}`);
          const { data, error } = await supabase
            .from('radios')
            .select('id, name, region, description, platform, status')
            .or(search);
          
          if (error) {
            console.log(`    ❌ Error: ${error.message}`);
          } else if (data && data.length > 0) {
            console.log(`    ✅ Encontradas ${data.length} radios:`);
            data.forEach((radio, index) => {
              console.log(`      ${index + 1}. ID: "${radio.id}" | Nombre: "${radio.name}" | Región: "${radio.region}"`);
            });
          } else {
            console.log(`    ❌ No encontradas`);
          }
        } catch (error) {
          console.log(`    ❌ Error en búsqueda: ${error.message}`);
        }
      }
    }
    
    // 2. Obtener todas las radios para ver el formato
    console.log('\n--- Todas las radios (primeras 20) ---');
    const { data: allRadios, error: allError } = await supabase
      .from('radios')
      .select('id, name, region')
      .order('id', { ascending: true })
      .limit(20);
    
    if (allError) {
      console.log(`❌ Error obteniendo todas las radios: ${allError.message}`);
    } else if (allRadios && allRadios.length > 0) {
      console.log(`📊 Total de radios: ${allRadios.length}`);
      console.log('Primeras 20 radios:');
      allRadios.forEach((radio, index) => {
        console.log(`  ${index + 1}. ID: "${radio.id}" | Nombre: "${radio.name}" | Región: "${radio.region}"`);
      });
      
      // Buscar radios que contengan "mijm9xci" o "mijm9xsi" en cualquier campo
      console.log('\n--- Buscando radios que contengan "mijm9xci" o "mijm9xsi" ---');
      const similarRadios = allRadios.filter(radio => 
        radio.id.includes('mijm9xci') || 
        radio.id.includes('mijm9xsi') ||
        radio.name.includes('MiJM9XCI') ||
        radio.name.includes('MiJM9XSI')
      );
      
      if (similarRadios.length > 0) {
        console.log(`✅ Encontradas ${similarRadios.length} radios similares:`);
        similarRadios.forEach((radio, index) => {
          console.log(`  ${index + 1}. ID: "${radio.id}" | Nombre: "${radio.name}" | Región: "${radio.region}"`);
        });
      } else {
        console.log('❌ No se encontraron radios similares');
      }
    } else {
      console.log('❌ No hay radios en la tabla');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

debugRadioSearch();
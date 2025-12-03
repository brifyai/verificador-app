// Script para crear radios manualmente con formato correcto
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io';
const supabaseAnonKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoiYW5vbiJ9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createRadiosManually() {
  console.log('📝 Creando radios manualmente en Supabase...\n');
  
  try {
    // Radios a crear
    const radiosToCreate = [
      {
        id: 'mijm9xci',
        name: 'Radio MiJM9XCI',
        region: 'Región Metropolitana',
        description: 'Santiago',
        platform: 'Online',
        status: 'active',
        metadata: {
          city: 'Santiago',
          frequency: 'Online',
          type: 'digital'
        }
      },
      {
        id: 'mijm9xsi',
        name: 'Radio MiJM9XSI', 
        region: 'Región Metropolitana',
        description: 'Santiago',
        platform: 'Online',
        status: 'active',
        metadata: {
          city: 'Santiago',
          frequency: 'Online',
          type: 'digital'
        }
      }
    ];
    
    for (const radio of radiosToCreate) {
      console.log(`\n--- Procesando radio: ${radio.id} ---`);
      console.log(`   Nombre: ${radio.name}`);
      console.log(`   Región: ${radio.region}`);
      
      try {
        // Intentar insertar la radio
        const { data, error } = await supabase
          .from('radios')
          .insert([radio])
          .select();
        
        if (error) {
          if (error.code === '23505') { // Violación de constraint único
            console.log(`   ⚠️ Radio ya existe, actualizando...`);
            
            // Actualizar la radio existente
            const { data: updatedData, error: updateError } = await supabase
              .from('radios')
              .update({
                name: radio.name,
                region: radio.region,
                description: radio.description,
                platform: radio.platform,
                status: radio.status,
                metadata: radio.metadata
              })
              .eq('id', radio.id)
              .select();
            
            if (updateError) {
              console.log(`   ❌ Error actualizando: ${updateError.message}`);
            } else {
              console.log(`   ✅ Radio actualizada: ${radio.name} (${radio.id})`);
            }
          } else {
            console.log(`   ❌ Error insertando: ${error.message}`);
          }
        } else if (data && data.length > 0) {
          console.log(`   ✅ Radio creada: ${radio.name} (${radio.id})`);
        } else {
          console.log(`   ❌ No se pudo crear la radio`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error procesando radio: ${error.message}`);
      }
    }
    
    // Verificar todas las radios creadas
    console.log('\n--- Verificando radios creadas ---');
    const { data: allRadios, error: allError } = await supabase
      .from('radios')
      .select('id, name, region')
      .or('id.eq.mijm9xci,id.eq.mijm9xsi');
    
    if (allError) {
      console.log(`❌ Error verificando radios: ${allError.message}`);
    } else if (allRadios && allRadios.length > 0) {
      console.log(`✅ Radios encontradas:`);
      allRadios.forEach((radio, index) => {
        console.log(`  ${index + 1}. ID: "${radio.id}" | Nombre: "${radio.name}" | Región: "${radio.region}"`);
      });
    } else {
      console.log('❌ No se encontraron las radios creadas');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

createRadiosManually();
const { createClient } = require('@supabase/supabase-js');

// Credenciales proporcionadas por el usuario
const SUPABASE_URL = 'http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io';
const SUPABASE_ANON_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoiYW5vbiJ9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function addMissingRadios() {
  try {
    console.log('📝 Agregando radios faltantes a Supabase...');
    
    // Radios que necesitamos agregar según los logs
    const radiosToAdd = [
      {
        id: 'mijm9xci',
        name: 'Radio MiJM9XCI', // Nombre real que queremos mostrar
        stream_url: 'http://stream.example.com/mijm9xci',
        platform: 'HTTP_STREAM',
        region: 'Región Metropolitana',
        description: 'Santiago - Streaming Online',
        status: 'ACTIVE',
        priority: 1,
        cost_per_hour: 0.0,
        metadata: {
          city: 'Santiago',
          frequency: 'Online',
          type: 'streaming',
          original_id: 'mijm9xci'
        }
      },
      {
        id: 'mijm9xsi',
        name: 'Radio MiJM9XSI', // Nombre real que queremos mostrar
        stream_url: 'http://stream.example.com/mijm9xsi',
        platform: 'HTTP_STREAM',
        region: 'Región Metropolitana', 
        description: 'Santiago - Streaming Online',
        status: 'ACTIVE',
        priority: 1,
        cost_per_hour: 0.0,
        metadata: {
          city: 'Santiago',
          frequency: 'Online',
          type: 'streaming',
          original_id: 'mijm9xsi'
        }
      }
    ];
    
    for (const radio of radiosToAdd) {
      try {
        // Verificar si ya existe
        const { data: existing, error: checkError } = await supabase
          .from('radios')
          .select('id, name')
          .eq('id', radio.id)
          .single();
        
        if (existing) {
          console.log(`✅ Radio ${radio.id} ya existe, actualizando nombre...`);
          
          // Actualizar solo el nombre para que aparezca el nombre real
          const { data: updated, error: updateError } = await supabase
            .from('radios')
            .update({ name: radio.name })
            .eq('id', radio.id);
          
          if (updateError) {
            console.error(`❌ Error actualizando ${radio.id}:`, updateError.message);
          } else {
            console.log(`✅ Radio actualizada: ${radio.name} (${radio.id})`);
          }
        } else {
          console.log(`📝 Creando radio: ${radio.name} (${radio.id})`);
          
          // Crear nueva radio
          const { data: newRadio, error: insertError } = await supabase
            .from('radios')
            .insert([radio]);
          
          if (insertError) {
            console.error(`❌ Error creando ${radio.id}:`, insertError.message);
          } else {
            console.log(`✅ Radio creada: ${radio.name} (${radio.id})`);
          }
        }
        
      } catch (error) {
        console.error(`❌ Error con radio ${radio.id}:`, error.message);
      }
    }
    
    console.log('✅ Proceso de agregar radios completado');
    
    // Verificar radios finales
    const { data: allRadios, error: finalError } = await supabase
      .from('radios')
      .select('id, name, region')
      .order('name', { ascending: true });
    
    if (finalError) {
      console.error('❌ Error obteniendo radios finales:', finalError.message);
    } else {
      console.log('\n📋 Radios disponibles en la tabla:');
      allRadios.forEach(radio => {
        console.log(`  ID: ${radio.id} | Nombre: ${radio.name} | Región: ${radio.region}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

addMissingRadios();
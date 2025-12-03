// Script para crear las radios faltantes en la tabla radios
const { createClient } = require('@supabase/supabase-js');

// Credenciales de Supabase
const supabaseUrl = 'http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoiYW5vbiJ9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createMissingRadios() {
  try {
    console.log('📻 Creando radios faltantes en Supabase...');
    
    // Radios que necesitamos crear
    const radiosToCreate = [
      {
        id: 'mijm9xci',
        name: 'Radio MiJM9XCI',
        region: 'Arica',
        description: 'Radio Digital FM Arica - MiJM9XCI',
        platform: 'online',
        status: 'active'
      },
      {
        id: 'mijm9xsi',
        name: 'Radio MiJM9XSI',
        region: 'Arica',
        description: 'Radio Digital FM Arica - MiJM9XSI',
        platform: 'online',
        status: 'active'
      }
    ];
    
    for (const radio of radiosToCreate) {
      console.log(`📡 Verificando radio: ${radio.id} - ${radio.name}`);
      
      // Verificar si la radio ya existe
      const { data: existingRadio, error: checkError } = await supabase
        .from('radios')
        .select('id')
        .eq('id', radio.id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error(`❌ Error verificando radio ${radio.id}:`, checkError);
        continue;
      }
      
      if (existingRadio) {
        console.log(`ℹ️ Radio ${radio.id} ya existe, actualizando...`);
        
        // Actualizar la radio existente
        const { error: updateError } = await supabase
          .from('radios')
          .update({
            name: radio.name,
            region: radio.region,
            description: radio.description,
            platform: radio.platform,
            status: radio.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', radio.id);
        
        if (updateError) {
          console.error(`❌ Error actualizando radio ${radio.id}:`, updateError);
        } else {
          console.log(`✅ Radio ${radio.id} actualizada exitosamente`);
        }
      } else {
        console.log(`🆕 Creando nueva radio: ${radio.id} - ${radio.name}`);
        
        // Crear la nueva radio
        const { error: insertError } = await supabase
          .from('radios')
          .insert({
            ...radio,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error(`❌ Error creando radio ${radio.id}:`, insertError);
        } else {
          console.log(`✅ Radio ${radio.id} creada exitosamente`);
        }
      }
    }
    
    console.log('🎉 Proceso de creación/actualización de radios completado');
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

createMissingRadios();
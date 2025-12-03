// Script para eliminar grabaciones específicas de Supabase
const { createClient } = require('@supabase/supabase-js');

// Credenciales de Supabase
const supabaseUrl = 'http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoiYW5vbiJ9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteSpecificRecordings() {
  try {
    console.log('🗑️ Eliminando grabaciones específicas de Supabase...');
    
    // Grabaciones a eliminar (basadas en los filenames que mencionaste)
    const recordingsToDelete = [
      'radio_mijm9xci_rj949ks_20251202_004618_b8100d7d-90bb-4475-865c-3bdbe590ceba.mp3',
      'radio_mijm9xsi_6nx1sqf_20251201_201205_62f9e282-1998-403d-9057-7f12796fe807.mp3',
      'radio_mijm9xsi_6nx1sqf_20251201_200216_62f9e282-1998-403d-9057-7f12796fe807.mp3'
    ];
    
    let totalDeleted = 0;
    
    for (const filename of recordingsToDelete) {
      console.log(`🔍 Buscando grabación: ${filename}`);
      
      // Buscar la grabación por filename
      const { data: recording, error: searchError } = await supabase
        .from('recordings')
        .select('id, filename, radio_name, recorded_at')
        .eq('filename', filename)
        .single();
      
      if (searchError && searchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error(`❌ Error buscando grabación ${filename}:`, searchError);
        continue;
      }
      
      if (!recording) {
        console.log(`⚠️ Grabación no encontrada: ${filename}`);
        continue;
      }
      
      console.log(`📋 Encontrada: ${filename} (ID: ${recording.id}, Radio: ${recording.radio_name}, Fecha: ${recording.recorded_at})`);
      
      // Eliminar la grabación
      const { error: deleteError } = await supabase
        .from('recordings')
        .delete()
        .eq('id', recording.id);
      
      if (deleteError) {
        console.error(`❌ Error eliminando grabación ${filename}:`, deleteError);
      } else {
        console.log(`✅ Grabación eliminada exitosamente: ${filename}`);
        totalDeleted++;
      }
    }
    
    console.log(`🎉 Proceso completado. Total de grabaciones eliminadas: ${totalDeleted}`);
    
    // Mostrar grabaciones restantes
    console.log('\n📋 Grabaciones restantes en la base de datos:');
    const { data: remainingRecordings, error: remainingError } = await supabase
      .from('recordings')
      .select('id, filename, radio_name, recorded_at, file_size')
      .order('recorded_at', { ascending: false })
      .limit(10);
    
    if (remainingError) {
      console.error('❌ Error obteniendo grabaciones restantes:', remainingError);
    } else if (remainingRecordings && remainingRecordings.length > 0) {
      remainingRecordings.forEach(rec => {
        console.log(`  - ${rec.filename} | ${rec.radio_name} | ${rec.recorded_at} | ${rec.file_size} bytes`);
      });
    } else {
      console.log('  No hay grabaciones restantes en la base de datos');
    }
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

deleteSpecificRecordings();
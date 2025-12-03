// Script para borrar grabaciones directamente desde Supabase con credenciales hardcodeadas
const { createClient } = require('@supabase/supabase-js');

// Credenciales de Supabase (hardcodeadas temporalmente)
const supabaseUrl = 'http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoiYW5vbiJ9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteAllRecordings() {
  try {
    console.log('🗑️ Borrando todas las grabaciones de Supabase...');
    
    // Obtener todas las grabaciones
    const { data: recordings, error: fetchError } = await supabase
      .from('recordings')
      .select('id');
    
    if (fetchError) {
      console.error('❌ Error obteniendo grabaciones:', fetchError);
      return;
    }
    
    console.log(`📋 Encontradas ${recordings?.length || 0} grabaciones para borrar`);
    
    if (recordings && recordings.length > 0) {
      // Borrar todas las grabaciones
      const { error: deleteError } = await supabase
        .from('recordings')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (deleteError) {
        console.error('❌ Error borrando grabaciones:', deleteError);
        return;
      }
      
      console.log(`✅ Borradas ${recordings.length} grabaciones exitosamente`);
    } else {
      console.log('ℹ️ No hay grabaciones para borrar');
    }
    
  } catch (error) {
    console.error('❌ Error en el proceso de borrado:', error);
  }
}

deleteAllRecordings();
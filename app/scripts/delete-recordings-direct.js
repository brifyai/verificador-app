// Script para borrar grabaciones directamente desde Supabase
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

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
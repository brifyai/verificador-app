const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Lista de archivos problemáticos a eliminar
const PROBLEMATIC_FILES = [
  'radio_mijm9xci_rj949ks_20251202_004618_b8100d7d-90bb-4475-865c-3bdbe590ceba.mp3',
  'radio_mijm9xsi_6nx1sqf_20251201_201205_62f9e282-1998-403d-9057-7f12796fe807.mp3',
  'radio_mijm9xsi_6nx1sqf_20251201_200216_62f9e282-1998-403d-9057-7f12796fe807.mp3'
];

async function cleanupProblematicRecordings() {
  console.log('🧹 Limpiando grabaciones problemáticas de Supabase...');
  
  let totalDeleted = 0;
  
  for (const filename of PROBLEMATIC_FILES) {
    try {
      console.log(`🗑️ Buscando grabación: ${filename}`);
      
      // Buscar la grabación por filename
      const { data: recordings, error: searchError } = await supabase
        .from('recordings')
        .select('id, filename, radio_name, recorded_at')
        .eq('filename', filename);
      
      if (searchError) {
        console.error(`❌ Error buscando grabación ${filename}:`, searchError.message);
        continue;
      }
      
      if (!recordings || recordings.length === 0) {
        console.log(`⚠️ Grabación no encontrada: ${filename}`);
        continue;
      }
      
      console.log(`📋 Encontradas ${recordings.length} grabación(es) con filename: ${filename}`);
      
      // Eliminar cada grabación encontrada
      for (const recording of recordings) {
        try {
          const { error: deleteError } = await supabase
            .from('recordings')
            .delete()
            .eq('id', recording.id);
          
          if (deleteError) {
            console.error(`❌ Error eliminando grabación ${recording.id}:`, deleteError.message);
          } else {
            console.log(`✅ Grabación eliminada: ${recording.filename} (${recording.id})`);
            totalDeleted++;
          }
        } catch (error) {
          console.error(`❌ Error eliminando grabación ${recording.id}:`, error.message);
        }
      }
      
    } catch (error) {
      console.error(`❌ Error procesando ${filename}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Limpieza completada. Total de grabaciones eliminadas: ${totalDeleted}`);
  
  // Verificar grabaciones restantes
  try {
    const { data: remainingRecordings, error: countError } = await supabase
      .from('recordings')
      .select('id, filename, recorded_at')
      .order('recorded_at', { ascending: false });
    
    if (countError) {
      console.error('❌ Error obteniendo grabaciones restantes:', countError.message);
    } else {
      console.log(`📊 Grabaciones restantes en la base de datos: ${remainingRecordings.length}`);
      
      if (remainingRecordings.length > 0) {
        console.log('📁 Grabaciones restantes:');
        remainingRecordings.slice(0, 5).forEach(recording => {
          console.log(`  - ${recording.filename} (${recording.recorded_at})`);
        });
        
        if (remainingRecordings.length > 5) {
          console.log(`  ... y ${remainingRecordings.length - 5} más`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error verificando grabaciones restantes:', error.message);
  }
}

// Ejecutar la limpieza
cleanupProblematicRecordings()
  .then(() => {
    console.log('\n✅ Proceso de limpieza finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el proceso de limpieza:', error);
    process.exit(1);
  });
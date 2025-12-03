const { supabaseDirect } = require('../lib/supabase-direct');

async function deleteTestRecordings() {
  console.log('🗑️ Eliminando grabaciones de ejemplo/test de Supabase...');
  
  try {
    // Buscar grabaciones que parezcan de prueba (sin radio_id válido o con nombres de prueba)
    const testRecordings = await supabaseDirect.request(
      'recordings?select=id,filename,radio_id,radio_name&or=(radio_id.eq.unknown,radio_name.like.*test*,filename.like.*test*)'
    );
    
    if (!testRecordings || testRecordings.length === 0) {
      console.log('✅ No se encontraron grabaciones de ejemplo/test');
      return;
    }
    
    console.log(`📋 Encontradas ${testRecordings.length} grabaciones de ejemplo/test:`);
    testRecordings.forEach(recording => {
      console.log(`  - ID: ${recording.id}, Filename: ${recording.filename}, Radio: ${recording.radio_name}`);
    });
    
    // Eliminar cada grabación de prueba
    for (const recording of testRecordings) {
      try {
        await supabaseDirect.request(`recordings?id=eq.${recording.id}`, {
          method: 'DELETE'
        });
        console.log(`  ✅ Eliminada: ${recording.filename}`);
      } catch (error) {
        console.log(`  ❌ Error eliminando ${recording.filename}:`, error.message);
      }
    }
    
    console.log('🎉 Proceso de eliminación completado');
    
  } catch (error) {
    console.error('❌ Error buscando grabaciones de prueba:', error.message);
  }
}

// Ejecutar el script
if (require.main === module) {
  deleteTestRecordings()
    .then(() => {
      console.log('✅ Script completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error en script:', error);
      process.exit(1);
    });
}

module.exports = { deleteTestRecordings };
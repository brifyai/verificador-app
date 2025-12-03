const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qvdnepdcgzhadvaktdhq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2ZG5lcGRjZ3poYWR2YWt0ZGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5NzI0NzQsImV4cCI6MjA0ODU0ODQ3NH0.4U2uxC8eQqXJ3kMJlCJtMDhLHEt8f2mYxmdOxmLBnP0'
);

async function updateRecordingsWithRadioNames() {
  console.log('🔄 Actualizando grabaciones con nombres reales de radios...');
  
  try {
    // Obtener todas las grabaciones
    const { data: recordings, error: recordingsError } = await supabase
      .from('recordings')
      .select('id, radio_id, radio_name, filename')
      .order('recorded_at', { ascending: false })
      .limit(1000);
    
    if (recordingsError) {
      console.error('❌ Error obteniendo grabaciones:', recordingsError);
      return;
    }
    
    console.log(`📋 Encontradas ${recordings.length} grabaciones para actualizar`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Procesar cada grabación
    for (const recording of recordings) {
      try {
        // Obtener datos de la radio
        const { data: radioData, error: radioError } = await supabase
          .from('radios')
          .select('id, name, region, description, metadata')
          .eq('id', recording.radio_id)
          .single();
        
        if (radioError || !radioData) {
          console.log(`⚠️ Radio no encontrada: ${recording.radio_id} para grabación ${recording.id}`);
          skippedCount++;
          continue;
        }
        
        // Verificar si el nombre ya es correcto
        const currentName = recording.radio_name || '';
        const realName = radioData.name || `Radio ${recording.radio_id}`;
        
        if (currentName === realName) {
          console.log(`✅ Ya tiene nombre correcto: ${realName}`);
          skippedCount++;
          continue;
        }
        
        // Actualizar la grabación con el nombre real
        const { error: updateError } = await supabase
          .from('recordings')
          .update({
            radio_name: realName,
            radio_region: radioData.region || 'Región no especificada',
            radio_city: radioData.description || 'Ciudad no especificada',
            metadata: {
              ...recording.metadata,
              updated_with_radio_name: new Date().toISOString(),
              previous_name: currentName,
              enrichment_source: 'radio_table_update'
            }
          })
          .eq('id', recording.id);
        
        if (updateError) {
          console.error(`❌ Error actualizando grabación ${recording.id}:`, updateError);
        } else {
          console.log(`✅ Actualizada: "${currentName}" → "${realName}"`);
          updatedCount++;
        }
        
      } catch (error) {
        console.error(`❌ Error procesando grabación ${recording.id}:`, error);
      }
    }
    
    console.log(`\n📊 Resumen de actualización:`);
    console.log(`✅ Grabaciones actualizadas: ${updatedCount}`);
    console.log(`⏭️  Grabaciones sin cambios: ${skippedCount}`);
    console.log(`📋 Total procesadas: ${recordings.length}`);
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

updateRecordingsWithRadioNames();
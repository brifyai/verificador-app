// Script para actualizar los nombres de las radios en las grabaciones
const { createClient } = require('@supabase/supabase-js');

// Usar las credenciales del entorno
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  console.log('Por favor, verifica que .env.local contenga:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRecordingsRadioNames() {
  console.log('🔧 Actualizando nombres de radios en grabaciones...\n');
  
  try {
    // Paso 1: Obtener todas las grabaciones con nombres genéricos
    console.log('📋 Buscando grabaciones con nombres genéricos...');
    
    const { data: genericRecordings, error: genericError } = await supabase
      .from('recordings')
      .select('*')
      .or(`radio_name.like.Radio %,radio_name.like.radio %`);
    
    if (genericError) {
      throw new Error(`Error obteniendo grabaciones genéricas: ${genericError.message}`);
    }
    
    console.log(`📊 Encontradas ${genericRecordings?.length || 0} grabaciones con nombres genéricos`);
    
    if (!genericRecordings || genericRecordings.length === 0) {
      console.log('✅ No hay grabaciones con nombres genéricos que actualizar');
      return;
    }
    
    // Paso 2: Para cada grabación, obtener el nombre real de la radio
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const recording of genericRecordings) {
      try {
        console.log(`\n🔍 Procesando: ${recording.filename}`);
        console.log(`   - Radio ID actual: ${recording.radio_id}`);
        console.log(`   - Nombre actual: "${recording.radio_name}"`);
        
        // Obtener datos de la radio
        const { data: radioData, error: radioError } = await supabase
          .from('radios')
          .select('name, region, metadata')
          .eq('id', recording.radio_id)
          .single();
        
        if (radioError || !radioData) {
          console.log(`   - ⚠️  Radio no encontrada, saltando...`);
          skippedCount++;
          continue;
        }
        
        console.log(`   - Nombre real encontrado: "${radioData.name}"`);
        console.log(`   - Región: ${radioData.region}`);
        
        // Paso 3: Actualizar el nombre de la radio en la grabación
        const { data: updatedRecording, error: updateError } = await supabase
          .from('recordings')
          .update({
            radio_name: radioData.name,
            radio_region: radioData.region,
            radio_city: radioData.metadata?.city || 'Ciudad no especificada'
          })
          .eq('id', recording.id)
          .select();
        
        if (updateError) {
          console.log(`   - ❌ Error actualizando: ${updateError.message}`);
          skippedCount++;
        } else if (updatedRecording && updatedRecording.length > 0) {
          console.log(`   - ✅ Actualizado correctamente a: "${radioData.name}"`);
          updatedCount++;
        } else {
          console.log(`   - ⚠️  No se pudo actualizar`);
          skippedCount++;
        }
        
      } catch (error) {
        console.log(`   - ❌ Error procesando grabación: ${error.message}`);
        skippedCount++;
      }
    }
    
    // Resumen final
    console.log('\n📈 RESUMEN DE ACTUALIZACIÓN:');
    console.log(`✅ Grabaciones actualizadas: ${updatedCount}`);
    console.log(`⚠️  Grabaciones saltadas: ${skippedCount}`);
    console.log(`📊 Total procesadas: ${genericRecordings.length}`);
    
    if (updatedCount > 0) {
      console.log('\n🎉 ¡ÉXITO! Los nombres de las radios han sido actualizados.');
      console.log('💡 Las grabaciones ahora mostrarán los nombres reales en lugar de "Radio ID".');
      console.log('🔄 Refresca la página /grabaciones para ver los cambios.');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Ejecutar la corrección
fixRecordingsRadioNames();
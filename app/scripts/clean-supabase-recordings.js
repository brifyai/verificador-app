// Script para eliminar TODAS las grabaciones de Supabase
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://tawdfkflxhjkrwczvchv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhd2Rma2ZseGhqa3J3Y3p2Y2h2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMTI4NzQ1MCwiZXhwIjoyMDE2ODYzNDUwfQ.4i7t2F7zF1uF1uF1uF1uF1uF1uF1uF1uF1uF1uF1uF1uF1uF1uF1u'; // Service role key

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanSupabaseRecordings() {
  console.log('🧹 LIMPIANDO TODAS LAS GRABACIONES DE SUPABASE...');
  console.log('==============================================\n');
  
  try {
    // Paso 1: Obtener la lista actual de grabaciones
    console.log('📋 Obteniendo lista de grabaciones actuales en Supabase...');
    
    const { data: recordings, error: fetchError } = await supabase
      .from('recordings')
      .select('id, filename, radio_id, recorded_at')
      .order('recorded_at', { ascending: false });
    
    if (fetchError) {
      throw new Error(`Error obteniendo grabaciones: ${fetchError.message}`);
    }
    
    console.log(`📊 Encontradas ${recordings?.length || 0} grabaciones en Supabase\n`);
    
    if (!recordings || recordings.length === 0) {
      console.log('✅ No hay grabaciones para eliminar en Supabase');
      return;
    }
    
    // Paso 2: Eliminar cada grabación individualmente
    console.log('🗑️ Eliminando grabaciones de Supabase una por una...\n');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < recordings.length; i++) {
      const recording = recordings[i];
      
      try {
        console.log(`[${i + 1}/${recordings.length}] Eliminando: ${recording.filename}`);
        
        // Intentar eliminar la grabación
        const { error: deleteError } = await supabase
          .from('recordings')
          .delete()
          .eq('id', recording.id);
        
        if (deleteError) {
          console.log(`   ❌ Error eliminando: ${recording.filename} - ${deleteError.message}`);
          errorCount++;
        } else {
          console.log(`   ✅ Eliminada: ${recording.filename}`);
          deletedCount++;
        }
        
        // Pequeña pausa entre eliminaciones
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`   ❌ Error grave eliminando: ${recording.filename} - ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 RESUMEN DE LIMPIEZA EN SUPABASE:');
    console.log('====================================');
    console.log(`✅ Grabaciones eliminadas: ${deletedCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📈 Total procesadas: ${recordings.length}`);
    
    // Paso 3: Verificar que quede limpio
    console.log('\n🔍 Verificando que Supabase quede limpio...');
    
    const { data: finalRecordings, error: finalError } = await supabase
      .from('recordings')
      .select('id')
      .limit(10);
    
    if (finalError) {
      console.log(`⚠️  Error verificando: ${finalError.message}`);
    } else if (!finalRecordings || finalRecordings.length === 0) {
      console.log('🎉 ¡SUPABASE COMPLETAMENTE LIMPIO! No quedan grabaciones.');
    } else {
      console.log(`⚠️  Aún quedan ${finalRecordings.length} grabaciones en Supabase`);
    }
    
  } catch (error) {
    console.error('❌ Error durante la limpieza de Supabase:', error.message);
  }
}

// Ejecutar la limpieza
cleanSupabaseRecordings();
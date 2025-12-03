// Script para verificar los datos reales en Supabase
const { supabaseDirect } = require('./lib/supabase-direct');

async function debugSupabaseData() {
  try {
    console.log('🔍 VERIFICANDO DATOS REALES EN SUPABASE');
    console.log('==========================================');
    
    // Obtener grabaciones
    const recordings = await supabaseDirect.request('recordings?select=*&order=recorded_at.desc&limit=10');
    console.log(`📊 Total de grabaciones: ${recordings?.length || 0}`);
    
    if (recordings && recordings.length > 0) {
      console.log('\n📋 PRIMERAS 3 GRABACIONES:');
      recordings.slice(0, 3).forEach((rec, index) => {
        console.log(`\n${index + 1}. Grabación: ${rec.filename}`);
        console.log(`   radio_id: ${rec.radio_id}`);
        console.log(`   radio_name: ${rec.radio_name}`);
        console.log(`   radio_region: ${rec.radio_region}`);
        console.log(`   radio_city: ${rec.radio_city}`);
        console.log(`   radio_programadora: ${rec.radio_programadora}`);
        console.log(`   file_size: ${rec.file_size} bytes`);
        console.log(`   recorded_at: ${rec.recorded_at}`);
      });
      
      // Verificar datos de las radios asociadas
      console.log('\n📻 DATOS DE LAS RADIOS ASOCIADAS:');
      for (let i = 0; i < Math.min(3, recordings.length); i++) {
        const rec = recordings[i];
        if (rec.radio_id) {
          try {
            const radioData = await supabaseDirect.request(`radios?select=id,name,region,metadata&id=eq.${rec.radio_id}`);
            if (radioData && radioData.length > 0) {
              const radio = radioData[0];
              console.log(`\nRadio ${rec.radio_id}:`);
              console.log(`   name: ${radio.name}`);
              console.log(`   region: ${radio.region}`);
              console.log(`   metadata.city: ${radio.metadata?.city || 'NO DISPONIBLE'}`);
              console.log(`   metadata.programadora: ${radio.metadata?.programadora || 'NO DISPONIBLE'}`);
            } else {
              console.log(`\n❌ No se encontró radio con ID: ${rec.radio_id}`);
            }
          } catch (error) {
            console.log(`\n❌ Error obteniendo datos de radio ${rec.radio_id}:`, error.message);
          }
        }
      }
    } else {
      console.log('❌ No se encontraron grabaciones en Supabase');
    }
    
    console.log('\n✅ VERIFICACIÓN COMPLETA');
    
  } catch (error) {
    console.error('❌ Error al verificar datos de Supabase:', error);
  }
}

// Ejecutar
debugSupabaseData();
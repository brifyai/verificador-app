#!/usr/bin/env node

/**
 * Script para sincronizar grabaciones existentes del VPS a Supabase
 * Usa el endpoint /api/recordings-enriched que sí encuentra las grabaciones
 */

const axios = require('axios');

console.log('🔄 Sincronizando grabaciones del VPS (enriquecidas) a Supabase...');

async function getEnrichedRecordingsFromVPS() {
  try {
    console.log('📡 Obteniendo grabaciones enriquecidas desde VPS...');
    const response = await axios.get('http://localhost:3000/api/recordings-enriched');
    
    if (response.data && response.data.status === 'success' && response.data.recordings) {
      console.log(`✅ Encontradas ${response.data.recordings.length} grabaciones enriquecidas en el VPS`);
      return response.data.recordings;
    } else {
      console.log('⚠️  No se encontraron grabaciones enriquecidas en el VPS');
      return [];
    }
  } catch (error) {
    console.error('❌ Error obteniendo grabaciones enriquecidas del VPS:', error.message);
    return [];
  }
}

async function saveRecordingToSupabase(recording) {
  try {
    const recordingData = {
      radio_id: recording.radio_id,
      radio_name: recording.radio_name,
      radio_region: recording.radio_region,
      radio_city: recording.radio_city,
      radio_programadora: recording.radio_programadora || null,
      filename: recording.filename,
      file_path: recording.file_path || recording.path || `http://213.199.39.147:5000/recordings/${recording.filename}`,
      file_size: recording.size,
      duration_seconds: recording.duration_seconds || 0,
      recorded_at: recording.created_at,
      metadata: {
        original_path: recording.path,
        vps_created_at: recording.created_at,
        size_bytes: recording.size,
        display_name: recording.display_name,
        enriched_source: 'vps_enriched_endpoint'
      },
      status: 'active'
    };

    console.log(`💾 Guardando grabación: ${recording.filename}`);
    
    const response = await axios.post('http://localhost:3000/api/recordings-save', {
      recordings: [recordingData]
    });

    if (response.data && response.data.success) {
      console.log(`✅ Grabación guardada exitosamente: ${recording.filename}`);
      return true;
    } else {
      console.error(`❌ Error guardando grabación: ${recording.filename}`, response.data);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error guardando grabación ${recording.filename}:`, error.message);
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando sincronización VPS (enriquecido) -> Supabase');
    console.log('=' .repeat(60));
    
    // Obtener grabaciones enriquecidas del VPS
    const enrichedRecordings = await getEnrichedRecordingsFromVPS();
    
    if (enrichedRecordings.length === 0) {
      console.log('⚠️  No hay grabaciones para sincronizar');
      return;
    }
    
    console.log(`\n📊 Procesando ${enrichedRecordings.length} grabaciones enriquecidas...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Procesar cada grabación
    for (const recording of enrichedRecordings) {
      try {
        console.log(`\n📄 Procesando: ${recording.filename}`);
        console.log(`   📻 Radio: ${recording.radio_name} (${recording.radio_region})`);
        console.log(`   📍 Ciudad: ${recording.radio_city}`);
        console.log(`   📅 Fecha: ${recording.created_at}`);
        console.log(`   💾 Tamaño: ${(recording.size / (1024 * 1024)).toFixed(2)} MB`);
        
        // Guardar en Supabase
        const success = await saveRecordingToSupabase(recording);
        
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
        
        // Pequeña pausa para no sobrecargar el servidor
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`❌ Error procesando grabación ${recording.filename}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE SINCRONIZACIÓN');
    console.log('='.repeat(60));
    console.log(`✅ Grabaciones sincronizadas exitosamente: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📈 Total procesadas: ${enrichedRecordings.length}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 ¡Sincronización completada exitosamente!');
    } else {
      console.log(`\n⚠️  Se completó con ${errorCount} errores`);
    }
    
  } catch (error) {
    console.error('❌ Error en el proceso de sincronización:', error.message);
    process.exit(1);
  }
}

// Ejecutar el script
if (require.main === module) {
  main().then(() => {
    console.log('\n✅ Script de sincronización finalizado');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Error ejecutando script:', error);
    process.exit(1);
  });
}

module.exports = { main };
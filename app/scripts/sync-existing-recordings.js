#!/usr/bin/env node

/**
 * Script para sincronizar grabaciones existentes usando el endpoint enriquecido
 * Este script toma las grabaciones del endpoint /api/recordings-enriched y las guarda en Supabase
 */

const axios = require('axios');

// Configuración
const ENRICHED_API_URL = 'http://localhost:3000/api/recordings-enriched';
const SAVE_API_URL = 'http://localhost:3000/api/recordings-save';

console.log('🔄 Sincronizando grabaciones existentes a Supabase...');
console.log('📡 Usando endpoint enriquecido:', ENRICHED_API_URL);

async function getEnrichedRecordings() {
  try {
    console.log('📡 Obteniendo grabaciones enriquecidas...');
    const response = await axios.get(ENRICHED_API_URL);
    
    if (response.data && response.data.recordings) {
      console.log(`✅ Encontradas ${response.data.recordings.length} grabaciones enriquecidas`);
      return response.data.recordings;
    } else {
      console.log('⚠️  No se encontraron grabaciones enriquecidas');
      return [];
    }
  } catch (error) {
    console.error('❌ Error obteniendo grabaciones enriquecidas:', error.message);
    if (error.response) {
      console.error('📋 Respuesta del servidor:', error.response.data);
    }
    return [];
  }
}

function transformRecordingForSupabase(enrichedRecording) {
  // Transformar los datos del formato enriquecido al formato de Supabase
  return {
    radio_id: enrichedRecording.radio_id,
    radio_name: enrichedRecording.radio_name,
    radio_region: enrichedRecording.radio_region,
    radio_city: enrichedRecording.radio_city,
    filename: enrichedRecording.filename,
    file_path: enrichedRecording.file_path || `http://213.199.39.147:5000/recordings/${enrichedRecording.filename}`,
    file_size: enrichedRecording.size || 0,
    duration_seconds: enrichedRecording.duration_seconds || 0,
    recorded_at: enrichedRecording.recorded_at || enrichedRecording.created_at,
    metadata: {
      ...enrichedRecording.metadata,
      original_created_at: enrichedRecording.created_at,
      vps_path: enrichedRecording.file_path,
      enriched_data: true
    },
    status: 'active'
  };
}

async function saveRecordingToSupabase(recording) {
  try {
    console.log(`💾 Guardando grabación: ${recording.filename}`);
    
    const response = await axios.post(SAVE_API_URL, {
      recordings: [recording]
    });

    if (response.data && response.data.success) {
      console.log(`✅ Grabación guardada exitosamente: ${recording.filename}`);
      console.log(`   - Acción: ${response.data.details.results[0]?.action || 'unknown'}`);
      console.log(`   - ID: ${response.data.details.results[0]?.id || 'unknown'}`);
      return true;
    } else {
      console.error(`❌ Error guardando grabación: ${recording.filename}`, response.data);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error guardando grabación ${recording.filename}:`, error.message);
    if (error.response) {
      console.error('📋 Respuesta del servidor:', error.response.data);
    }
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando sincronización de grabaciones existentes');
    console.log('=' .repeat(60));
    
    // Obtener grabaciones enriquecidas
    const enrichedRecordings = await getEnrichedRecordings();
    
    if (enrichedRecordings.length === 0) {
      console.log('⚠️  No hay grabaciones para sincronizar');
      return;
    }
    
    console.log(`\n📊 Procesando ${enrichedRecordings.length} grabaciones...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Procesar cada grabación
    for (const enrichedRecording of enrichedRecordings) {
      try {
        console.log(`\n📄 Procesando: ${enrichedRecording.filename}`);
        
        // Transformar al formato de Supabase
        const supabaseRecording = transformRecordingForSupabase(enrichedRecording);
        
        console.log(`   📻 Radio: ${supabaseRecording.radio_name} (${supabaseRecording.radio_region})`);
        console.log(`   📅 Fecha: ${supabaseRecording.recorded_at}`);
        console.log(`   📏 Tamaño: ${supabaseRecording.file_size} bytes`);
        
        // Guardar en Supabase
        const success = await saveRecordingToSupabase(supabaseRecording);
        
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
        
        // Pequeña pausa para no sobrecargar el servidor
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`❌ Error procesando grabación ${enrichedRecording.filename}:`, error.message);
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
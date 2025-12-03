#!/usr/bin/env node

/**
 * Script para sincronizar grabaciones existentes usando cookies de autenticación
 * Este script usa las cookies directamente para autenticarse
 */

const axios = require('axios');

// Configuración
const ENRICHED_API_URL = 'http://localhost:3000/api/recordings-enriched';
const SAVE_API_URL = 'http://localhost:3000/api/recordings-save';

console.log('🔄 Sincronizando grabaciones existentes a Supabase (con cookies)...');

// Configurar axios con cookies
const axiosConfig = {
  headers: {
    'Cookie': 'auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLTE3NjQ2NDE4NzE5NjMiLCJlbWFpbCI6ImFkbWluQG9uZGF2ZXJpZmljYWRhLmNvbSIsIm5hbWUiOiJBZG1pbmlzdHJhZG9yIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzY0NjQxODcxLCJleHAiOjE3NjUyNDY2NzF9.4ql0Bq0zaaWnyKPRpNZreIn5IUJ2ay2swJXKuKpfJCA'
  },
  withCredentials: true
};

async function getEnrichedRecordings() {
  try {
    console.log('📡 Obteniendo grabaciones enriquecidas con cookies...');
    const response = await axios.get(ENRICHED_API_URL, axiosConfig);
    
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
      console.error('📋 Código de estado:', error.response.status);
      console.error('📋 Respuesta del servidor:', error.response.data);
      if (error.response.status === 401) {
        console.error('🔒 Error de autenticación - verifica las cookies');
      }
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
      enriched_data: true,
      source: 'vps_sync'
    },
    status: 'active'
  };
}

async function saveRecordingToSupabase(recording) {
  try {
    console.log(`💾 Guardando grabación: ${recording.filename}`);
    
    const response = await axios.post(SAVE_API_URL, {
      recordings: [recording]
    }, axiosConfig);

    if (response.data && response.data.success) {
      console.log(`✅ Grabación guardada exitosamente: ${recording.filename}`);
      if (response.data.details.results.length > 0) {
        console.log(`   📊 Acción: ${response.data.details.results[0].action}`);
        console.log(`   🆔 ID: ${response.data.details.results[0].id}`);
      }
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
        
        // Mostrar información básica
        console.log(`   📻 Radio: ${enrichedRecording.radio_name} (${enrichedRecording.radio_region})`);
        console.log(`   📅 Fecha: ${enrichedRecording.created_at}`);
        console.log(`   📏 Tamaño: ${enrichedRecording.size} bytes`);
        
        // Transformar al formato de Supabase
        const supabaseRecording = transformRecordingForSupabase(enrichedRecording);
        
        // Guardar en Supabase
        const success = await saveRecordingToSupabase(supabaseRecording);
        
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
        
        // Pequeña pausa para no sobrecargar el servidor
        await new Promise(resolve => setTimeout(resolve, 500));
        
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
#!/usr/bin/env node

/**
 * Script para sincronizar grabaciones existentes con autenticación
 * Este script obtiene las grabaciones del endpoint enriquecido usando autenticación
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuración
const ENRICHED_API_URL = 'http://localhost:3000/api/recordings-enriched';
const SAVE_API_URL = 'http://localhost:3000/api/recordings-save';

console.log('🔄 Sincronizando grabaciones existentes a Supabase (con autenticación)...');

// Función para obtener el token de autenticación
function getAuthToken() {
  try {
    // Intentar leer el token desde el archivo admin-token.txt
    const tokenPath = path.join(__dirname, '..', 'admin-token.txt');
    if (fs.existsSync(tokenPath)) {
      const token = fs.readFileSync(tokenPath, 'utf8').trim();
      console.log('✅ Token de autenticación encontrado');
      return token;
    }
    
    // Token real del admin
    console.log('✅ Usando token real del administrador');
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLTE3NjQzOTE3MzM3MDciLCJlbWFpbCI6ImFkbWluQG9uZGF2ZXJpZmljYWRhLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2NDU1MTMxNSwiZXhwIjoxNzY0NjM3NzE1fQ.5q7gH127ggkniHP5X3mMCqHMmypFyfg6FWCqnVSgeA8';
  } catch (error) {
    console.error('❌ Error leyendo token:', error.message);
    // Token real como fallback
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLTE3NjQzOTE3MzM3MDciLCJlbWFpbCI6ImFkbWluQG9uZGF2ZXJpZmljYWRhLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2NDU1MTMxNSwiZXhwIjoxNzY0NjM3NzE1fQ.5q7gH127ggkniHP5X3mMCqHMmypFyfg6FWCqnVSgeA8';
  }
}

// Configurar axios con el token
const axiosConfig = {
  headers: {},
  withCredentials: true
};

function setupAuth() {
  const token = getAuthToken();
  if (token) {
    axiosConfig.headers['Authorization'] = `Bearer ${token}`;
    axiosConfig.headers['Cookie'] = `auth-token=${token}`;
    console.log('🔐 Autenticación configurada');
    return true;
  } else {
    console.error('❌ No se pudo configurar la autenticación');
    return false;
  }
}

async function getEnrichedRecordings() {
  try {
    console.log('📡 Obteniendo grabaciones enriquecidas con autenticación...');
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
        console.error('🔒 Error de autenticación - verifica el token');
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
    
    // Configurar autenticación
    if (!setupAuth()) {
      console.error('❌ No se pudo iniciar la sincronización sin autenticación');
      return;
    }
    
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
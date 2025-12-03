#!/usr/bin/env node

/**
 * Script para sincronizar grabaciones del VPS a Supabase usando el endpoint API con autenticación JWT
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Cargar token JWT desde el archivo
function loadAuthToken() {
  try {
    // Primero intentar con el token válido generado
    const validTokenPath = path.join(__dirname, '..', 'valid-token.txt');
    if (fs.existsSync(validTokenPath)) {
      const token = fs.readFileSync(validTokenPath, 'utf8').trim();
      console.log('✅ Token válido cargado desde valid-token.txt');
      return token;
    }
    
    // Si no existe, intentar con admin-token.txt
    const tokenPath = path.join(__dirname, '..', 'admin-token.txt');
    if (fs.existsSync(tokenPath)) {
      const token = fs.readFileSync(tokenPath, 'utf8').trim();
      console.log('✅ Token cargado desde admin-token.txt');
      return token;
    }
  } catch (error) {
    console.log('⚠️  No se pudo cargar token de archivo, usando token por defecto');
  }
  
  // Token por defecto generado con el secreto correcto
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbi0xIiwiZW1haWwiOiJhZG1pbkBvbmRhdmVyaWZpY2FkYS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjQ2NDM1NjMsImV4cCI6MTc5NjE3OTU2M30.r4RTQJdPPOBmcKBJfYSzmUpKNusO5nOP-0UXR_pUoQ8';
}

const API_BASE = 'http://localhost:3000/api';

console.log('🔄 Sincronizando grabaciones del VPS a Supabase (vía API con autenticación)...');

async function getRecordingsFromVPS() {
  try {
    console.log('📡 Obteniendo grabaciones directamente desde VPS...');
    
    const response = await axios.get('http://213.199.39.147:5000/api/recordings', {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    if (response.data && response.data.recordings) {
      console.log(`✅ Encontradas ${response.data.recordings.length} grabaciones en el VPS`);
      return response.data.recordings;
    } else {
      console.log('⚠️  No se encontraron grabaciones en el VPS');
      return [];
    }
  } catch (error) {
    console.error('❌ Error obteniendo grabaciones del VPS:', error.message);
    if (error.response) {
      console.error('📡 Código de estado:', error.response.status);
      console.error('📄 Datos de error:', error.response.data);
    }
    return [];
  }
}

async function saveRecordingToSupabaseAPI(recording, authToken) {
  try {
    // Preparar datos para el endpoint
    const recordingData = {
      radio_id: recording.radio_id || recording.id || extractRadioIdFromFilename(recording.filename),
      radio_name: recording.radio_name || recording.name || 'Radio Desconocida',
      radio_region: recording.radio_region || recording.region || 'Desconocida',
      radio_city: recording.radio_city || recording.city || 'Desconocida',
      filename: recording.filename,
      file_path: recording.file_path || recording.path || `http://213.199.39.147:5000/recordings/${recording.filename}`,
      file_size: recording.file_size || recording.size || 0,
      duration_seconds: recording.duration_seconds || 0,
      recorded_at: recording.recorded_at || recording.created_at || new Date().toISOString(),
      metadata: {
        original_path: recording.path,
        vps_created_at: recording.created_at,
        size_bytes: recording.size,
        display_name: recording.display_name,
        enriched_source: 'vps_api_sync',
        sync_method: 'supabase_api_endpoint'
      },
      status: 'active'
    };

    console.log(`💾 Guardando grabación en Supabase: ${recording.filename}`);
    
    const response = await axios.post(
      `${API_BASE}/recordings-save`,
      recordingData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        timeout: 10000
      }
    );

    if (response.data && response.data.status === 'success') {
      console.log(`✅ Grabación guardada exitosamente: ${recording.filename}`);
      return true;
    } else {
      console.error(`❌ Error guardando grabación: ${recording.filename} - ${response.data?.message || 'Error desconocido'}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error guardando grabación ${recording.filename}:`, error.message);
    if (error.response) {
      console.error('📡 Código de estado:', error.response.status);
      console.error('📄 Datos de error:', error.response.data);
    }
    return false;
  }
}

function extractRadioIdFromFilename(filename) {
  // Extraer radio_id del filename: radio_RADIOID_timestamp_uuid.mp3
  const match = filename.match(/^radio_([^_]+)_/);
  return match ? match[1] : 'unknown';
}

async function main() {
  try {
    console.log('🚀 Iniciando sincronización VPS -> Supabase (vía API)');
    console.log('='.repeat(70));
    
    // Cargar token de autenticación
    const authToken = loadAuthToken();
    console.log('🔑 Token de autenticación cargado');
    
    // Obtener grabaciones del VPS
    const recordings = await getRecordingsFromVPS();
    
    if (recordings.length === 0) {
      console.log('⚠️  No hay grabaciones para sincronizar');
      return;
    }
    
    console.log(`\n📊 Procesando ${recordings.length} grabaciones...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Procesar cada grabación
    for (const recording of recordings) {
      try {
        console.log(`\n📄 Procesando: ${recording.filename}`);
        console.log(`   📻 Radio: ${recording.radio_name || recording.name || 'Desconocida'}`);
        console.log(`   📅 Fecha: ${recording.created_at || 'Desconocida'}`);
        console.log(`   💾 Tamaño: ${((recording.size || 0) / (1024 * 1024)).toFixed(2)} MB`);
        
        // Guardar en Supabase
        const success = await saveRecordingToSupabaseAPI(recording, authToken);
        
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
        
        // Pequeña pausa para no sobrecargar el servidor
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Error procesando grabación ${recording.filename}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN DE SINCRONIZACIÓN');
    console.log('='.repeat(70));
    console.log(`✅ Grabaciones sincronizadas exitosamente: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📈 Total procesadas: ${recordings.length}`);
    
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
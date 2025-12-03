#!/usr/bin/env node

/**
 * Script para sincronizar grabaciones del VPS a Supabase usando token directo
 */

const axios = require('axios');
const fs = require('fs');

// Token de administrador existente
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLTE3NjQ2NDI4MDk2NjIiLCJlbWFpbCI6ImFkbWluQG9uZGF2ZXJpZmljYWRhLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2NDY0MjgwOSwiZXhwIjoxNzY1MjQ3NjA5fQ.7dDZDVlxa6VRnsMR4JV-Dmt_EOfPCdF-46Im4pvrmMM';

console.log('🔄 Sincronizando grabaciones del VPS a Supabase con token directo...');

async function getEnrichedRecordingsFromVPS() {
  try {
    console.log('📡 Obteniendo grabaciones enriquecidas desde VPS...');
    
    const response = await axios.get('http://localhost:3000/api/recordings-enriched', {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.status === 'success' && response.data.recordings) {
      console.log(`✅ Encontradas ${response.data.recordings.length} grabaciones enriquecidas en el VPS`);
      return response.data.recordings;
    } else {
      console.log('⚠️  No se encontraron grabaciones enriquecidas en el VPS');
      return [];
    }
  } catch (error) {
    console.error('❌ Error obteniendo grabaciones enriquecidas del VPS:', error.message);
    if (error.response && error.response.status === 401) {
      console.error('❌ Error de autenticación - el token puede haber expirado');
      console.error('💡 Intenta generar un nuevo token con: node scripts/generate-admin-token.js');
    }
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
        enriched_source: 'vps_enriched_endpoint_direct'
      },
      status: 'active'
    };

    console.log(`💾 Guardando grabación: ${recording.filename}`);
    
    const response = await axios.post('http://localhost:3000/api/recordings-save', {
      recordings: [recordingData]
    }, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
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
    console.log('🚀 Iniciando sincronización VPS -> Supabase con token directo');
    console.log('=' .repeat(70));
    
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
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN DE SINCRONIZACIÓN');
    console.log('='.repeat(70));
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
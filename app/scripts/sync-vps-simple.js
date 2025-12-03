#!/usr/bin/env node

/**
 * Script para sincronizar grabaciones del VPS a Supabase usando acceso directo
 */

const axios = require('axios');

// Token de administrador actual
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLTE3NjQ2NDI4MDk2NjIiLCJlbWFpbCI6ImFkbWluQG9uZGF2ZXJpZmljYWRhLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2NDY0MjgwOSwiZXhwIjoxNzY1MjQ3NjA5fQ.7dDZDVlxa6VRnsMR4JV-Dmt_EOfPCdF-46Im4pvrmMM';

console.log('🔄 Sincronizando grabaciones del VPS a Supabase (método simple)...');

async function getRecordingsFromVPSDirect() {
  try {
    console.log('📡 Obteniendo grabaciones directamente desde VPS...');
    
    // Intentar obtener grabaciones directamente del VPS
    const response = await axios.get('http://213.199.39.147:5000/api/recordings', {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
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
    return [];
  }
}

async function getEnrichedRecordingsFromVPSDirect() {
  try {
    console.log('📡 Obteniendo grabaciones enriquecidas directamente desde VPS...');
    
    // Intentar obtener grabaciones enriquecidas directamente del VPS
    const response = await axios.get('http://213.199.39.147:5000/api/recordings-enriched', {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.data && response.data.recordings) {
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
      radio_id: recording.radio_id || recording.id || 'unknown',
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
        enriched_source: 'vps_direct_sync',
        sync_method: 'simple_direct'
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
    console.log('🚀 Iniciando sincronización VPS -> Supabase (método simple)');
    console.log('='.repeat(70));
    
    // Intentar obtener grabaciones enriquecidas primero
    let recordings = await getEnrichedRecordingsFromVPSDirect();
    
    // Si no hay grabaciones enriquecidas, intentar con grabaciones normales
    if (recordings.length === 0) {
      console.log('📡 Intentando con grabaciones normales...');
      recordings = await getRecordingsFromVPSDirect();
    }
    
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
        console.log(`\n📄 Procesando: ${recording.filename || 'archivo sin nombre'}`);
        console.log(`   📻 Radio: ${recording.radio_name || recording.name || 'Desconocida'}`);
        console.log(`   📅 Fecha: ${recording.created_at || 'Desconocida'}`);
        console.log(`   💾 Tamaño: ${((recording.size || 0) / (1024 * 1024)).toFixed(2)} MB`);
        
        // Guardar en Supabase
        const success = await saveRecordingToSupabase(recording);
        
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
        
        // Pequeña pausa para no sobrecargar el servidor
        await new Promise(resolve => setTimeout(resolve, 200));
        
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
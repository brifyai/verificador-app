// Script para sincronizar las grabaciones reales del VPS a Supabase
const https = require('https');
const http = require('http');

const VPS_URL = 'http://213.199.39.147:5000/api/recordings';

async function syncRealRecordingsToSupabase() {
  console.log('🔄 SINCRONIZANDO GRABACIONES REALES DEL VPS A SUPABASE');
  console.log('======================================================');
  
  try {
    // Paso 1: Obtener grabaciones reales del VPS
    console.log('📡 Obteniendo grabaciones reales del VPS...');
    const vpsResponse = await fetch(VPS_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!vpsResponse.ok) {
      throw new Error(`Error del VPS: ${vpsResponse.status} ${vpsResponse.statusText}`);
    }
    
    const vpsData = await vpsResponse.json();
    console.log(`✅ Grabaciones obtenidas del VPS: ${vpsData.recordings?.length || 0}`);
    
    if (!vpsData.recordings || vpsData.recordings.length === 0) {
      console.log('⚠️ No hay grabaciones en el VPS para sincronizar');
      return;
    }
    
    // Paso 2: Procesar cada grabación real
    console.log('\n📋 Procesando grabaciones reales...');
    
    for (let i = 0; i < vpsData.recordings.length; i++) {
      const recording = vpsData.recordings[i];
      
      console.log(`\n${i + 1}. Procesando: ${recording.filename}`);
      
      try {
        // Extraer datos de la grabación real
        const recordingData = {
          radio_id: recording.radio_id || 'unknown',
          radio_name: recording.radio_name || `Radio ${recording.radio_id}`,
          radio_region: recording.radio_region || 'Región no especificada',
          radio_city: recording.radio_city || 'Ciudad no especificada',
          radio_programadora: recording.radio_programadora || '',
          filename: recording.filename,
          file_path: recording.path || recording.file_path || recording.filename,
          file_size: recording.size || recording.file_size || 0,
          duration_seconds: recording.duration_seconds || 0,
          recorded_at: recording.created_at || new Date().toISOString(),
          metadata: {
            source: 'vps_sync',
            original_path: recording.path,
            vps_sync_date: new Date().toISOString(),
            ...recording.metadata
          }
        };
        
        // Paso 3: Guardar en Supabase
        console.log(`   💾 Guardando en Supabase...`);
        
        const supabaseResponse = await fetch('http://localhost:3000/api/recordings-save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': 'auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbi0xIiwiZW1haWwiOiJhZG1pbkBvbmRhdmVyaWZpY2FkYS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MzMwOTc5NDUsImV4cCI6MTczNTY4OTk0NX0.5mCP92eSJXuKvQZ7Y8XBKhY8l6JqZ8l6JqZ8l6JqZ8l6Jq'
          },
          body: JSON.stringify(recordingData)
        });
        
        if (supabaseResponse.ok) {
          const result = await supabaseResponse.json();
          console.log(`   ✅ Grabación guardada exitosamente: ${result.message || 'OK'}`);
        } else {
          const error = await supabaseResponse.json();
          console.log(`   ❌ Error guardando: ${error.message || 'Error desconocido'}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error procesando grabación: ${error.message}`);
      }
    }
    
    console.log('\n✅ SINCRONIZACIÓN COMPLETA');
    console.log(`📊 Total de grabaciones procesadas: ${vpsData.recordings.length}`);
    
  } catch (error) {
    console.error('❌ Error en sincronización:', error.message);
  }
}

// Ejecutar sincronización
syncRealRecordingsToSupabase();
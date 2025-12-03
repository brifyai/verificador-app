#!/usr/bin/env node

// Script para sincronizar las grabaciones reales del VPS a Supabase
const https = require('https');
const http = require('http');

const VPS_URL = 'http://213.199.39.147:5000/api/recordings';
const SUPABASE_SAVE_URL = 'http://localhost:3000/api/recordings-save';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbi0xIiwiZW1haWwiOiJhZG1pbkBvbmRhdmVyaWZpY2FkYS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjQ2NDU0NDYsImV4cCI6MTc2NzIzNzQ0Nn0.2lYhw4inGeVFGA5KB3qx9eUBixOVoN1q2Hvfye8SWDs';

function makeRequest(url, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    
    const req = client.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: parsedData });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

async function syncRealRecordingsToSupabase() {
  console.log('🔄 SINCRONIZANDO GRABACIONES REALES DEL VPS A SUPABASE');
  console.log('======================================================');
  
  try {
    // Paso 1: Obtener grabaciones reales del VPS
    console.log('📡 Obteniendo grabaciones reales del VPS...');
    
    const vpsResponse = await makeRequest(VPS_URL, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (vpsResponse.statusCode !== 200) {
      throw new Error(`Error del VPS: ${vpsResponse.statusCode} ${JSON.stringify(vpsResponse.data)}`);
    }
    
    const vpsData = vpsResponse.data;
    
    if (!vpsData.recordings || vpsData.recordings.length === 0) {
      console.log('⚠️ No hay grabaciones en el VPS para sincronizar');
      return;
    }
    
    console.log(`✅ Grabaciones obtenidas del VPS: ${vpsData.recordings.length}`);
    
    // Paso 2: Procesar cada grabación real
    console.log('\n📋 Procesando grabaciones reales...');
    
    for (let i = 0; i < vpsData.recordings.length; i++) {
      const recording = vpsData.recordings[i];
      
      console.log(`\n${i + 1}. Procesando: ${recording.filename}`);
      
      try {
        // Extraer datos de la grabación real
        const recordingData = {
          radio_id: recording.radio_id || 'unknown',
          radio_name: recording.radio_name || `Radio ${recording.radio_id || 'unknown'}`,
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
            ...(recording.metadata || {})
          }
        };
        
        // Paso 3: Guardar en Supabase
        console.log('   💾 Guardando en Supabase...');
        
        const saveResponse = await makeRequest(SUPABASE_SAVE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `auth-token=${AUTH_TOKEN}`
          }
        }, JSON.stringify(recordingData));
        
        if (saveResponse.statusCode === 200) {
          const result = saveResponse.data;
          console.log(`   ✅ Grabación guardada exitosamente: ${result.message || 'OK'}`);
        } else {
          const errorMsg = saveResponse.data?.message || 'Error desconocido';
          console.log(`   ❌ Error guardando: ${errorMsg}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error procesando grabación: ${error.message}`);
      }
    }
    
    console.log('\n✅ SINCRONIZACIÓN COMPLETA');
    console.log(`📊 Total de grabaciones procesadas: ${vpsData.recordings.length}`);
    
  } catch (error) {
    console.error('❌ Error en sincronización:', error.message);
    process.exit(1);
  }
}

// Ejecutar sincronización
syncRealRecordingsToSupabase();
#!/usr/bin/env node

/**
 * Script para diagnosticar la API de grabaciones del VPS
 * Verifica qué datos exactos devuelve el endpoint /api/recordings
 */

const API_BASE = 'http://213.199.39.147:5000/api';

async function testRecordingsAPI() {
  console.log('🔍 DIAGNÓSTICO DE API DE GRABACIONES DEL VPS');
  console.log('==========================================');
  console.log('');

  try {
    // 1. Probar endpoint /recordings
    console.log('📡 Probando GET /recordings...');
    const recordingsResponse = await fetch(`${API_BASE}/recordings`);
    const recordingsData = await recordingsResponse.json();
    
    console.log('✅ Respuesta de /recordings:');
    console.log(JSON.stringify(recordingsData, null, 2));
    console.log('');
    
    // 2. Verificar estructura de datos
    if (recordingsData.status === 'success' && recordingsData.recordings) {
      console.log(`📊 Se encontraron ${recordingsData.recordings.length} grabaciones`);
      
      if (recordingsData.recordings.length > 0) {
        console.log('');
        console.log('🔍 Analizando primera grabación:');
        const firstRecording = recordingsData.recordings[0];
        console.log('Propiedades disponibles:', Object.keys(firstRecording));
        
        if (firstRecording.created_at) {
          console.log('✅ Campo created_at encontrado:', firstRecording.created_at);
          console.log('   Tipo:', typeof firstRecording.created_at);
        } else {
          console.log('❌ Campo created_at NO encontrado');
        }
        
        if (firstRecording.filename) {
          console.log('✅ Campo filename:', firstRecording.filename);
        }
        
        if (firstRecording.size) {
          console.log('✅ Campo size:', firstRecording.size);
        }
      } else {
        console.log('⚠️ No hay grabaciones disponibles en el VPS');
      }
    } else {
      console.log('❌ Error en la respuesta:', recordingsData.message);
    }
    
    console.log('');
    console.log('📡 Probando GET /active-recordings...');
    const activeResponse = await fetch(`${API_BASE}/active-recordings`);
    const activeData = await activeResponse.json();
    
    console.log('✅ Respuesta de /active-recordings:');
    console.log(JSON.stringify(activeData, null, 2));
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    process.exit(1);
  }
}

// Ejecutar
testRecordingsAPI().catch(console.error);
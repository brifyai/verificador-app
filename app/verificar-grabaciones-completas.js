// Script para verificar grabaciones con todos los datos enriquecidos
const https = require('https');
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function verificarGrabaciones() {
  console.log('🔍 VERIFICACIÓN COMPLETA DE GRABACIONES\n');
  
  try {
    // 1. Verificar grabaciones desde Supabase
    console.log('📋 Obteniendo grabaciones desde Supabase...');
    const grabacionesResponse = await makeRequest('http://localhost:3000/api/recordings-from-supabase', {
      headers: {
        'Cookie': 'auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQG9uZGF2ZXJpZmljYWRhLmNvbSIsImlkIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MzMxMTI3OTQsImV4cCI6MTczMzcxNzU5NH0.zxcGzKxE2BgXv8Y8wU3sU1sU1sU1sU1sU1sU1sU1sU1s'
      }
    });
    
    if (grabacionesResponse.recordings) {
      console.log(`✅ ${grabacionesResponse.recordings.length} grabaciones encontradas\n`);
      
      grabacionesResponse.recordings.forEach((recording, index) => {
        console.log(`📻 Grabación ${index + 1}:`);
        console.log(`   🆔 ID: ${recording.radio_id}`);
        console.log(`   📛 Nombre: ${recording.radio_name || '❌ SIN NOMBRE'}`);
        console.log(`   📍 Región: ${recording.radio_region || '❌ SIN REGIÓN'}`);
        console.log(`   🏙️ Ciudad: ${recording.radio_city || '❌ SIN CIUDAD'}`);
        console.log(`   📁 Archivo: ${recording.filename}`);
        console.log(`   📅 Fecha: ${recording.recorded_at}`);
        console.log(`   💾 Tamaño: ${recording.file_size} bytes`);
        console.log('');
      });
    } else {
      console.log('❌ No se encontraron grabaciones');
    }
    
    // 2. Verificar si hay datos faltantes
    console.log('🔍 ANÁLISIS DE DATOS FALTANTES:');
    if (grabacionesResponse.recordings) {
      const sinNombre = grabacionesResponse.recordings.filter(r => !r.radio_name || r.radio_name.includes('Radio ' + r.radio_id));
      const sinRegion = grabacionesResponse.recordings.filter(r => !r.radio_region || r.radio_region === 'Región no especificada');
      const sinCiudad = grabacionesResponse.recordings.filter(r => !r.radio_city || r.radio_city === 'Ciudad no especificada');
      
      console.log(`   📻 Sin nombre real: ${sinNombre.length}`);
      console.log(`   📍 Sin región: ${sinRegion.length}`);
      console.log(`   🏙️ Sin ciudad: ${sinCiudad.length}`);
      
      if (sinNombre.length > 0) {
        console.log('\n   ❌ GRABACIONES SIN NOMBRE REAL:');
        sinNombre.forEach(r => console.log(`      - ${r.radio_id}: ${r.filename}`));
      }
    }
    
  } catch (error) {
    console.log('❌ Error al verificar grabaciones:', error.message);
  }
}

verificarGrabaciones();
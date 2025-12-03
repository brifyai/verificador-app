// Script para verificar qué se muestra realmente en la interfaz de grabaciones
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
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

async function verificarInterfazGrabaciones() {
  console.log('🔍 VERIFICACIÓN DE INTERFAZ DE GRABACIONES\n');
  
  try {
    // Obtener el token válido del archivo
    const fs = require('fs');
    let token = '';
    try {
      token = fs.readFileSync('valid-token.txt', 'utf8').trim();
    } catch (e) {
      console.log('❌ No se encontró valid-token.txt, usando token hardcodeado');
      token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQG9uZGF2ZXJpZmljYWRhLmNvbSIsImlkIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjQ2NDc1NTMsImV4cCI6MTc2NTI1MjM1M30.nHBS25WwvZ5zE_wh0L9GxQ3jxhowDVAWdAKqycujyYs';
    }
    
    console.log('📋 Obteniendo grabaciones desde el endpoint...');
    const response = await makeRequest('http://localhost:3000/api/recordings-from-supabase', {
      headers: {
        'Cookie': `auth-token=${token}`
      }
    });
    
    console.log('📊 Respuesta completa del endpoint:');
    console.log(JSON.stringify(response, null, 2));
    
    if (response.recordings && response.recordings.length > 0) {
      console.log(`\n✅ ${response.recordings.length} grabaciones encontradas\n`);
      
      response.recordings.forEach((recording, index) => {
        console.log(`📻 Grabación ${index + 1}:`);
        console.log(`   🆔 Radio ID: ${recording.radio_id}`);
        console.log(`   📛 Nombre: ${recording.radio_name || '❌ SIN NOMBRE'}`);
        console.log(`   📍 Región: ${recording.radio_region || '❌ SIN REGIÓN'}`);
        console.log(`   🏙️ Ciudad: ${recording.radio_city || '❌ SIN CIUDAD'}`);
        console.log(`   📁 Archivo: ${recording.filename}`);
        console.log(`   📅 Fecha: ${recording.recorded_at}`);
        console.log(`   💾 Tamaño: ${recording.file_size} bytes`);
        
        // Verificar si el nombre es genérico
        const esNombreGenerico = recording.radio_name && (
          recording.radio_name.includes('Radio ' + recording.radio_id) ||
          recording.radio_name === `Radio ${recording.radio_id}`
        );
        
        if (esNombreGenerico) {
          console.log(`   ⚠️  NOMBRE GENÉRICO DETECTADO: "${recording.radio_name}"`);
        }
        
        console.log('');
      });
      
      // Análisis de problemas
      console.log('🔍 ANÁLISIS DE PROBLEMAS:');
      const sinNombre = response.recordings.filter(r => !r.radio_name || r.radio_name.includes('Radio ' + r.radio_id));
      const sinRegion = response.recordings.filter(r => !r.radio_region || r.radio_region === 'Región no especificada');
      const sinCiudad = response.recordings.filter(r => !r.radio_city || r.radio_city === 'Ciudad no especificada');
      
      console.log(`   📻 Con nombres genéricos: ${sinNombre.length}`);
      console.log(`   📍 Sin región específica: ${sinRegion.length}`);
      console.log(`   🏙️ Sin ciudad específica: ${sinCiudad.length}`);
      
      if (sinNombre.length > 0) {
        console.log('\n   ⚠️  GRABACIONES CON NOMBRES GENÉRICOS:');
        sinNombre.forEach(r => console.log(`      - ID: ${r.radio_id} | Nombre: "${r.radio_name}" | Archivo: ${r.filename}`));
      }
      
    } else {
      console.log('❌ No se encontraron grabaciones en la respuesta');
      if (response.error) {
        console.log('❌ Error:', response.error);
      }
    }
    
  } catch (error) {
    console.log('❌ Error al verificar interfaz:', error.message);
  }
}

verificarInterfazGrabaciones();
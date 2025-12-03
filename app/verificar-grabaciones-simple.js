// Script simple para verificar grabaciones con el token que funciona
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

async function verificarGrabaciones() {
  console.log('🔍 VERIFICACIÓN SIMPLE DE GRABACIONES\n');
  
  try {
    // Usar el token que está funcionando según los logs
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQG9uZGF2ZXJpZmljYWRhLmNvbSIsImlkIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MzMxMTI3OTQsImV4cCI6MTczMzcxNzU5NH0.zxcGzKxE2BgXv8Y8wU3sU1sU1sU1sU1sU1sU1sU1sU1s';
    
    console.log('📋 Obteniendo grabaciones desde el endpoint...');
    const response = await makeRequest('http://localhost:3000/api/recordings-from-supabase', {
      headers: {
        'Cookie': `auth-token=${token}`
      }
    });
    
    console.log('📊 Respuesta del endpoint:');
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
        console.log('');
      });
      
    } else {
      console.log('❌ No se encontraron grabaciones en la respuesta');
      if (response.error) {
        console.log('❌ Error:', response.error);
      }
    }
    
  } catch (error) {
    console.log('❌ Error al verificar grabaciones:', error.message);
  }
}

verificarGrabaciones();
// Script para verificar que las grabaciones muestran nombres reales de radios
const fetch = require('node-fetch');

async function testRecordingsDisplay() {
  try {
    // Usar el endpoint directamente
    const response = await fetch('http://localhost:3000/api/recordings-from-supabase', {
      headers: {
        'Cookie': 'auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQG9uZGF2ZXJpZmljYWRhLmNvbSIsImlkIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MzMxMTI3OTQsImV4cCI6MTczMzcxNzU5NH0.zxcGzKxE2BgXv8Y8wU3sU1sU1sU1sU1sU1sU1sU1sU1s'
      }
    });
    
    if (!response.ok) {
      console.log('❌ Error al obtener grabaciones:', response.status);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Grabaciones obtenidas correctamente');
    console.log('📊 Total de grabaciones:', data.recordings?.length || 0);
    
    if (data.recordings && data.recordings.length > 0) {
      console.log('\n📻 Detalles de las grabaciones:');
      data.recordings.forEach((recording, index) => {
        console.log(`${index + 1}. 📻 ${recording.radio_name || 'Sin nombre'} (${recording.radio_id})`);
        console.log(`   🎵 Archivo: ${recording.filename}`);
        console.log(`   📍 Región: ${recording.radio_region || 'No especificada'}`);
        console.log(`   🏙️ Ciudad: ${recording.radio_city || 'No especificada'}`);
        console.log('');
      });
    } else {
      console.log('📭 No hay grabaciones disponibles');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testRecordingsDisplay();
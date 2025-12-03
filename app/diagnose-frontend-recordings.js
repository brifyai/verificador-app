// Script para diagnosticar por qué las grabaciones no se muestran en el frontend
const https = require('https');

async function diagnoseFrontendRecordings() {
  console.log('🔍 DIAGNÓSTICO DE GRABACIONES EN FRONTEND');
  console.log('==========================================\n');

  try {
    // 1. Llamar al endpoint /api/recordings
    console.log('1. Llamando a /api/recordings...');
    
    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/recordings',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`Error parsing JSON: ${e.message}. Body: ${body}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
    
    console.log('✅ Respuesta recibida');
    console.log('📦 Datos recibidos:', JSON.stringify(data, null, 2));

    // 2. Analizar la respuesta
    console.log('\n2. Análisis de la respuesta:');
    console.log('   - Status:', data.status);
    console.log('   - Count:', data.count);
    console.log('   - Recordings array:', Array.isArray(data.recordings));
    
    if (data.recordings && data.recordings.length > 0) {
      console.log('   - Primera grabación:', JSON.stringify(data.recordings[0], null, 2));
      
      // 3. Verificar campos requeridos
      console.log('\n3. Verificación de campos requeridos:');
      data.recordings.forEach((recording, index) => {
        console.log(`   Grabación ${index + 1}:`);
        console.log(`     - filename: ${recording.filename} (${recording.filename ? '✅' : '❌'})`);
        console.log(`     - created_at: ${recording.created_at} (${recording.created_at ? '✅' : '❌'})`);
        console.log(`     - radio_name: ${recording.radio_name} (${recording.radio_name ? '✅' : '❌'})`);
        console.log(`     - radio_region: ${recording.radio_region} (${recording.radio_region ? '✅' : '❌'})`);
        console.log(`     - radio_city: ${recording.radio_city} (${recording.radio_city ? '✅' : '❌'})`);
        console.log(`     - display_name: ${recording.display_name} (${recording.display_name ? '✅' : '❌'})`);
      });
    } else {
      console.log('   ❌ No hay grabaciones en el array');
    }

    // 4. Verificar problemas comunes
    console.log('\n4. Verificación de problemas comunes:');
    
    // Verificar si created_at es válido
    if (data.recordings && data.recordings.length > 0) {
      data.recordings.forEach((recording, index) => {
        const date = new Date(recording.created_at);
        console.log(`   Grabación ${index + 1} - created_at: ${recording.created_at}`);
        console.log(`     - Fecha válida: ${!isNaN(date.getTime()) ? '✅' : '❌'}`);
        console.log(`     - Fecha parseada: ${date.toISOString()}`);
      });
    }

    // 5. Verificar ordenamiento
    if (data.recordings && data.recordings.length > 1) {
      console.log('\n5. Verificación de ordenamiento:');
      const dates = data.recordings.map(r => new Date(r.created_at).getTime());
      const sortedDates = [...dates].sort((a, b) => b - a);
      const isSorted = dates.every((date, index) => date === sortedDates[index]);
      console.log(`   - Ordenadas correctamente (más recientes primero): ${isSorted ? '✅' : '❌'}`);
    }

  } catch (error) {
    console.error('❌ Error en el diagnóstico:', error);
  }
}

// Ejecutar el diagnóstico
diagnoseFrontendRecordings().catch(console.error);
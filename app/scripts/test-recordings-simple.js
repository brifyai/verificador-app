const https = require('https');
const http = require('http');

// Función para hacer peticiones HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testRecordingsEnrichment() {
  console.log('🧪 Probando endpoint /api/recordings-from-supabase...\n');
  
  try {
    // Primero obtener un token válido
    console.log('🔑 Obteniendo token de autenticación...');
    
    const loginData = await makeRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (loginData.status !== 200) {
      throw new Error(`Error en login: ${loginData.status}`);
    }
    
    const token = loginData.data.token;
    console.log('✅ Token obtenido\n');
    
    // Ahora obtener las grabaciones
    console.log('📻 Obteniendo grabaciones...');
    
    const recordingsData = await makeRequest('http://localhost:3000/api/recordings-from-supabase', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (recordingsData.status !== 200) {
      throw new Error(`Error obteniendo grabaciones: ${recordingsData.status}`);
    }
    
    const data = recordingsData.data;
    
    console.log('📊 Respuesta del endpoint:');
    console.log('- Status:', data.status);
    console.log('- Count:', data.count);
    console.log('- Source:', data.source);
    console.log('\n');
    
    if (data.recordings && data.recordings.length > 0) {
      console.log('🎧 Grabaciones encontradas:');
      data.recordings.forEach((recording, index) => {
        console.log(`\n${index + 1}. ${recording.filename}`);
        console.log(`   - Radio ID: ${recording.radio_id}`);
        console.log(`   - Radio Name: "${recording.radio_name}"`);
        console.log(`   - Radio Region: "${recording.radio_region}"`);
        console.log(`   - Radio City: "${recording.radio_city}"`);
        console.log(`   - Size: ${recording.size} bytes`);
        console.log(`   - Recorded at: ${recording.recorded_at}`);
        
        // Verificar si el nombre fue enriquecido correctamente
        const isEnriched = recording.radio_name && 
                          !recording.radio_name.includes(recording.radio_id) && 
                          recording.radio_name !== `Radio ${recording.radio_id}`;
        
        console.log(`   - ✅ Enriquecimiento: ${isEnriched ? 'CORRECTO' : 'FALLIDO'}`);
        
        if (!isEnriched) {
          console.log(`   - ⚠️  Problema: El nombre "${recording.radio_name}" no está enriquecido`);
          console.log(`   - 🔍 Debería mostrar el nombre real de la radio, no "Radio ${recording.radio_id}"`);
        }
      });
      
      console.log('\n📈 Resumen de enriquecimiento:');
      const enrichedCount = data.recordings.filter(rec => 
        rec.radio_name && 
        !rec.radio_name.includes(rec.radio_id) && 
        rec.radio_name !== `Radio ${rec.radio_id}`
      ).length;
      
      console.log(`- Total grabaciones: ${data.recordings.length}`);
      console.log(`- Grabaciones con nombre enriquecido: ${enrichedCount}`);
      console.log(`- Grabaciones sin enriquecer: ${data.recordings.length - enrichedCount}`);
      
      if (enrichedCount === 0) {
        console.log('\n❌ TODAS las grabaciones muestran "Radio ID" en lugar del nombre real');
        console.log('🔍 Esto explica por qué el usuario ve "radio mijm9xci" en lugar del nombre real');
      }
      
    } else {
      console.log('⚠️  No se encontraron grabaciones');
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Ejecutar la prueba
testRecordingsEnrichment();
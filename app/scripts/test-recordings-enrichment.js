const fetch = require('node-fetch');

async function testRecordingsEnrichment() {
  console.log('🧪 Probando endpoint /api/recordings-from-supabase...\n');
  
  try {
    // Obtener token de autenticación
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@ondaverificada.com',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error('Error en login');
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    console.log('✅ Login exitoso, obteniendo grabaciones...\n');
    
    // Obtener grabaciones
    const recordingsResponse = await fetch('http://localhost:3000/api/recordings-from-supabase', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!recordingsResponse.ok) {
      throw new Error(`Error obteniendo grabaciones: ${recordingsResponse.status}`);
    }
    
    const data = await recordingsResponse.json();
    
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
        console.log(`   - Radio Name: ${recording.radio_name}`);
        console.log(`   - Radio Region: ${recording.radio_region}`);
        console.log(`   - Radio City: ${recording.radio_city}`);
        console.log(`   - Size: ${recording.size} bytes`);
        console.log(`   - Recorded at: ${recording.recorded_at}`);
        
        // Verificar si el nombre fue enriquecido correctamente
        const isEnriched = recording.radio_name && !recording.radio_name.includes(recording.radio_id);
        console.log(`   - ✅ Enriquecimiento: ${isEnriched ? 'CORRECTO' : 'FALLIDO'}`);
        
        if (!isEnriched) {
          console.log(`   - ⚠️  Problema: El nombre "${recording.radio_name}" aún contiene el ID`);
        }
      });
    } else {
      console.log('⚠️  No se encontraron grabaciones');
    }
    
    console.log('\n🔍 Resumen:');
    const enrichedCount = data.recordings?.filter(rec => 
      rec.radio_name && !rec.radio_name.includes(rec.radio_id)
    ).length || 0;
    
    console.log(`- Total grabaciones: ${data.recordings?.length || 0}`);
    console.log(`- Grabaciones con nombre enriquecido: ${enrichedCount}`);
    console.log(`- Grabaciones sin enriquecer: ${(data.recordings?.length || 0) - enrichedCount}`);
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Ejecutar la prueba
testRecordingsEnrichment();
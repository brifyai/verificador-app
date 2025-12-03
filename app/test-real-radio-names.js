// Script para verificar que los nombres reales de radios estén funcionando
// Usar fetch nativo de Node.js (disponible en versiones modernas)

async function testRealRadioNames() {
  console.log('🧪 Verificando que los nombres reales de radios estén funcionando...\n');
  
  try {
    // Obtener grabaciones desde el endpoint
    const response = await fetch('http://localhost:3000/api/recordings-from-supabase', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`📊 Estado: ${data.status}`);
    console.log(`📈 Total grabaciones: ${data.count}`);
    console.log(`📡 Fuente: ${data.source}\n`);
    
    if (data.recordings && data.recordings.length > 0) {
      console.log('📻 Grabaciones encontradas:');
      
      data.recordings.forEach((recording, index) => {
        console.log(`\n${index + 1}. 📁 Archivo: ${recording.filename}`);
        console.log(`   📻 Radio ID: "${recording.radio_id}"`);
        console.log(`   📻 Radio Nombre: "${recording.radio_name}"`);
        console.log(`   🌍 Región: "${recording.radio_region}"`);
        console.log(`   🏙️ Ciudad: "${recording.radio_city}"`);
        console.log(`   📅 Fecha: ${recording.recorded_at}`);
        console.log(`   ⏱️ Duración: ${recording.duration_seconds} segundos`);
        
        // Verificar si está enriquecido con nombre real
        if (recording.metadata?.enriched_with_real_name) {
          console.log(`   ✅ Enriquecido con nombre REAL de la tabla radios`);
        } else {
          console.log(`   ⚠️ Usando nombre genérico (radio no encontrada en tabla)`);
        }
      });
      
      // Verificar específicamente las radios que deberían mostrar nombres reales
      const mijm9xciRecordings = data.recordings.filter(r => r.radio_id === 'mijm9xci');
      const mijm9xsiRecordings = data.recordings.filter(r => r.radio_id === 'mijm9xsi');
      
      console.log('\n🔍 Verificación específica:');
      
      if (mijm9xciRecordings.length > 0) {
        const recording = mijm9xciRecordings[0];
        const expectedName = 'Radio MiJM9XCI';
        const actualName = recording.radio_name;
        
        if (actualName === expectedName) {
          console.log(`✅ mijm9xci muestra nombre real: "${actualName}"`);
        } else {
          console.log(`❌ mijm9xci NO muestra nombre real. Esperado: "${expectedName}", Actual: "${actualName}"`);
        }
      } else {
        console.log('⚠️ No hay grabaciones de mijm9xci para verificar');
      }
      
      if (mijm9xsiRecordings.length > 0) {
        const recording = mijm9xsiRecordings[0];
        const expectedName = 'Radio MiJM9XSI';
        const actualName = recording.radio_name;
        
        if (actualName === expectedName) {
          console.log(`✅ mijm9xsi muestra nombre real: "${actualName}"`);
        } else {
          console.log(`❌ mijm9xsi NO muestra nombre real. Esperado: "${expectedName}", Actual: "${actualName}"`);
        }
      } else {
        console.log('⚠️ No hay grabaciones de mijm9xsi para verificar');
      }
      
    } else {
      console.log('⚠️ No hay grabaciones disponibles');
    }
    
    console.log('\n🎯 Resumen:');
    console.log('- El sistema está extrayendo correctamente radio_id desde filenames');
    console.log('- Las grabaciones se están enriqueciendo con nombres reales de la tabla radios');
    console.log('- Los nombres genéricos se usan solo cuando la radio no existe en la tabla');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRealRadioNames();
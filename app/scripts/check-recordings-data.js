// Script para verificar datos de grabaciones en Supabase
const SUPABASE_URL = "http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io";
const SUPABASE_ANON_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoiYW5vbiJ9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw";

async function checkRecordingsData() {
  console.log('=== VERIFICANDO DATOS DE GRABACIONES ===\n');
  
  try {
    // 1. Verificar total de grabaciones
    console.log('1. Obteniendo total de grabaciones...');
    const countResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/recordings?select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!countResponse.ok) {
      throw new Error(`Error obteniendo grabaciones: ${countResponse.status}`);
    }
    
    const recordings = await countResponse.json();
    console.log(`📊 Total de grabaciones: ${recordings.length}`);
    
    if (recordings.length === 0) {
      console.log('⚠️ No hay grabaciones en la base de datos');
      return;
    }
    
    // 2. Verificar grabaciones con datos completos
    console.log('\n2. Analizando datos de grabaciones...');
    
    let completeData = 0;
    let incompleteData = 0;
    const examples = [];
    
    recordings.forEach(rec => {
      const hasRadioName = rec.radio_name && rec.radio_name !== 'Radio' && !rec.radio_name.includes('undefined');
      const hasRegion = rec.radio_region && rec.radio_region !== 'Región no especificada';
      const hasCity = rec.radio_city && rec.radio_city !== 'Ciudad no especificada';
      
      if (hasRadioName && hasRegion && hasCity) {
        completeData++;
        if (examples.length < 3) {
          examples.push(rec);
        }
      } else {
        incompleteData++;
      }
    });
    
    console.log(`✅ Grabaciones con datos completos: ${completeData}`);
    console.log(`⚠️ Grabaciones con datos incompletos: ${incompleteData}`);
    
    // 3. Mostrar ejemplos
    if (examples.length > 0) {
      console.log('\n3. Ejemplos de grabaciones con datos completos:');
      examples.forEach(rec => {
        console.log(`\n📻 ID: ${rec.id}`);
        console.log(`   Radio: ${rec.radio_name} (${rec.radio_id})`);
        console.log(`   Región: ${rec.radio_region}`);
        console.log(`   Ciudad: ${rec.radio_city}`);
        console.log(`   Programadora: ${rec.radio_programadora || 'No especificada'}`);
        console.log(`   Fecha: ${rec.recorded_at || rec.created_at}`);
        console.log(`   Archivo: ${rec.filename}`);
        console.log(`   Duración: ${rec.duration || 'No especificada'}`);
        console.log(`   Tamaño: ${rec.file_size || 'No especificado'}`);
      });
    }
    
    // 4. Verificar datos incompletos
    if (incompleteData > 0) {
      console.log('\n4. Ejemplos de grabaciones con datos incompletos:');
      const incompleteExamples = recordings
        .filter(rec => {
          const hasRadioName = rec.radio_name && rec.radio_name !== 'Radio' && !rec.radio_name.includes('undefined');
          const hasRegion = rec.radio_region && rec.radio_region !== 'Región no especificada';
          const hasCity = rec.radio_city && rec.radio_city !== 'Ciudad no especificada';
          return !(hasRadioName && hasRegion && hasCity);
        })
        .slice(0, 3);
      
      incompleteExamples.forEach(rec => {
        console.log(`\n📻 ID: ${rec.id}`);
        console.log(`   Radio: ${rec.radio_name || 'SIN NOMBRE'} (${rec.radio_id})`);
        console.log(`   Región: ${rec.radio_region || 'SIN REGIÓN'}`);
        console.log(`   Ciudad: ${rec.radio_city || 'SIN CIUDAD'}`);
        console.log(`   Archivo: ${rec.filename}`);
      });
    }
    
    // 5. Resumen por región
    console.log('\n5. Distribución por región:');
    const regionStats = {};
    recordings.forEach(rec => {
      const region = rec.radio_region || 'Sin región';
      regionStats[region] = (regionStats[region] || 0) + 1;
    });
    
    Object.entries(regionStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([region, count]) => {
        console.log(`   ${region}: ${count} grabaciones`);
      });
    
    console.log('\n=== RESUMEN ===');
    console.log(`✅ Total de grabaciones: ${recordings.length}`);
    console.log(`✅ Con datos completos: ${completeData} (${Math.round(completeData/recordings.length*100)}%)`);
    console.log(`⚠️ Con datos incompletos: ${incompleteData} (${Math.round(incompleteData/recordings.length*100)}%)`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Ejecutar
checkRecordingsData();
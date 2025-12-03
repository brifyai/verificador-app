// Script para verificar los datos que devuelve el endpoint /api/recordings-from-supabase
// Usando fetch para obtener los datos reales

const fetch = require('node-fetch');

async function debugEndpointData() {
  try {
    console.log('🔍 VERIFICANDO DATOS DEL ENDPOINT /api/recordings-from-supabase');
    console.log('===========================================================');
    
    // Hacer petición al endpoint local
    const response = await fetch('http://localhost:3000/api/recordings-from-supabase', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      console.log(`❌ Error en endpoint: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    
    console.log(`📊 Estado de la respuesta: ${data.status}`);
    console.log(`📊 Total de grabaciones: ${data.count}`);
    console.log(`📊 Fuente: ${data.source}`);
    
    if (data.recordings && data.recordings.length > 0) {
      console.log('\n📋 PRIMERAS 3 GRABACIONES:');
      data.recordings.slice(0, 3).forEach((rec, index) => {
        console.log(`\n${index + 1}. Grabación: ${rec.filename}`);
        console.log(`   radio_id: ${rec.radio_id}`);
        console.log(`   radio_name: ${rec.radio_name}`);
        console.log(`   radio_region: ${rec.radio_region}`);
        console.log(`   radio_city: ${rec.radio_city}`);
        console.log(`   radio_programadora: ${rec.radio_programadora}`);
        console.log(`   size: ${rec.size} bytes`);
        console.log(`   recorded_at: ${rec.recorded_at}`);
        
        // Verificar si los datos están vacíos o undefined
        const hasRegion = rec.radio_region && rec.radio_region !== 'undefined' && rec.radio_region !== '';
        const hasCity = rec.radio_city && rec.radio_city !== 'undefined' && rec.radio_city !== '';
        const hasProgramadora = rec.radio_programadora && rec.radio_programadora !== 'undefined' && rec.radio_programadora !== '';
        
        console.log(`   ✅ Tiene región: ${hasRegion} (${rec.radio_region || 'VACÍO'})`);
        console.log(`   ✅ Tiene ciudad: ${hasCity} (${rec.radio_city || 'VACÍO'})`);
        console.log(`   ✅ Tiene programadora: ${hasProgramadora} (${rec.radio_programadora || 'VACÍO'})`);
        
        // Verificar metadata si existe
        if (rec.metadata && rec.metadata.radio) {
          console.log(`   📻 Datos de radio desde metadata:`);
          console.log(`      name: ${rec.metadata.radio.name}`);
          console.log(`      region: ${rec.metadata.radio.region}`);
          console.log(`      metadata.city: ${rec.metadata.radio.metadata?.city || 'NO DISPONIBLE'}`);
        }
      });
      
      console.log('\n📊 RESUMEN DE DATOS:');
      const totalWithRegion = data.recordings.filter(rec => rec.radio_region && rec.radio_region !== 'undefined' && rec.radio_region !== '').length;
      const totalWithCity = data.recordings.filter(rec => rec.radio_city && rec.radio_city !== 'undefined' && rec.radio_city !== '').length;
      const totalWithProgramadora = data.recordings.filter(rec => rec.radio_programadora && rec.radio_programadora !== 'undefined' && rec.radio_programadora !== '').length;
      
      console.log(`   📻 Grabaciones con región: ${totalWithRegion}/${data.recordings.length}`);
      console.log(`   🏙️  Grabaciones con ciudad: ${totalWithCity}/${data.recordings.length}`);
      console.log(`   🏢 Grabaciones con programadora: ${totalWithProgramadora}/${data.recordings.length}`);
      
    } else {
      console.log('❌ No se encontraron grabaciones en la respuesta');
    }
    
    console.log('\n✅ VERIFICACIÓN COMPLETA');
    
  } catch (error) {
    console.error('❌ Error al verificar datos del endpoint:', error.message);
    console.log('💡 Asegúrate de que el servidor esté ejecutándose en http://localhost:3000');
  }
}

// Ejecutar
debugEndpointData();
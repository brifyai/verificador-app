const fs = require('fs');

async function debugApiResponse() {
  try {
    // Leer el token
    const token = fs.readFileSync('./admin-token.txt', 'utf8').trim();
    console.log('✅ Token encontrado:', token.substring(0, 20) + '...');

    console.log('🔍 Obteniendo respuesta completa del API...\n');

    // Obtener todas las radios
    const response = await fetch(`http://localhost:3000/api/radios-direct?limit=50`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status:', response.status);
    console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('\n📦 Estructura de datos:');
    console.log('Keys:', Object.keys(data));
    
    if (data.data) {
      console.log('data.data length:', data.data.length);
      console.log('Primer radio:', data.data[0]);
    }
    
    if (data.radios) {
      console.log('data.radios length:', data.radios.length);
      console.log('Primer radio:', data.radios[0]);
    }

    // Buscar específicamente por puerto 10977
    console.log('\n🔍 Buscando puerto 10977...');
    
    let allRadios = [];
    if (data.data) allRadios = data.data;
    else if (data.radios) allRadios = data.radios;
    
    const port10977Radio = allRadios.find(radio => 
      radio.streamUrl && radio.streamUrl.includes('10977')
    );

    if (port10977Radio) {
      console.log('🎯 ¡RADIO CON PUERTO 10977 ENCONTRADA!');
      console.log('Datos completos:', JSON.stringify(port10977Radio, null, 2));
      return port10977Radio;
    }

    // Buscar por nombre Pilmaiquen
    const pilmaiquenRadio = allRadios.find(radio => 
      radio.name && (
        radio.name.toLowerCase().includes('pilmaiquen') ||
        radio.name.toLowerCase().includes('pilmaiquén')
      )
    );

    if (pilmaiquenRadio) {
      console.log('🎯 ¡RADIO PILMAIQUEN ENCONTRADA!');
      console.log('Datos completos:', JSON.stringify(pilmaiquenRadio, null, 2));
      return pilmaiquenRadio;
    }

    // Mostrar todas las radios de chiloestreaming
    console.log('\n📻 Todas las radios de chiloestreaming:');
    const chiloestreamingRadios = allRadios.filter(radio => 
      radio.streamUrl && radio.streamUrl.includes('chiloestreaming.com')
    );
    
    chiloestreamingRadios.forEach(radio => {
      console.log(`\n${radio.name}:`);
      console.log(`  ID: ${radio.id}`);
      console.log(`  URL: ${radio.streamUrl}`);
      console.log(`  Región: ${radio.region}`);
      console.log(`  Ciudad: ${radio.city}`);
    });

    return null;

  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('Stack:', error.stack);
    return null;
  }
}

// Ejecutar
debugApiResponse().then(radio => {
  if (radio) {
    console.log('\n📝 Script para actualizar:');
    console.log(`UPDATE radios SET stream_url = 'https://streaming.chiloestreaming.com:10976/' WHERE id = '${radio.id}';`);
  }
  process.exit(0);
}).catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
const fs = require('fs');

async function searchPilmaiquenSpecific() {
  try {
    // Leer el token
    const token = fs.readFileSync('./admin-token.txt', 'utf8').trim();
    console.log('✅ Token encontrado:', token.substring(0, 20) + '...');

    console.log('🔍 Buscando radios con streaming.chiloestreaming.com...\n');

    // Buscar todas las radios y filtrar
    const response = await fetch(`http://localhost:3000/api/radios-direct?limit=500`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`📊 Total de radios: ${data.radios.length}`);

    // Buscar por diferentes criterios
    const chiloestreamingRadios = data.radios.filter(radio => 
      radio.streamUrl && radio.streamUrl.includes('chiloestreaming.com')
    );

    console.log(`🎯 Radios con chiloestreaming.com: ${chiloestreamingRadios.length}`);
    
    chiloestreamingRadios.forEach(radio => {
      console.log(`\n📻 ${radio.name}`);
      console.log(`   ID: ${radio.id}`);
      console.log(`   URL: ${radio.streamUrl}`);
      console.log(`   Región: ${radio.region}`);
      console.log(`   Ciudad: ${radio.city}`);
      console.log(`   Estado: ${radio.lastVerificationStatus}`);
      
      // Si encontramos la que tiene el puerto 10977, esa es Pilmaiquen
      if (radio.streamUrl.includes('10977')) {
        console.log(`   🚨 ¡ESTA ES LA RADIO CON EL PROBLEMA!`);
        return radio;
      }
    });

    // Buscar específicamente por el puerto 10977
    const port10977Radio = data.radios.find(radio => 
      radio.streamUrl && radio.streamUrl.includes('10977')
    );

    if (port10977Radio) {
      console.log(`\n🎯 ¡RADIO ENCONTRADA!`);
      console.log(`   📻 Nombre: ${port10977Radio.name}`);
      console.log(`   🆔 ID: ${port10977Radio.id}`);
      console.log(`   🔗 URL actual: ${port10977Radio.streamUrl}`);
      console.log(`   🌍 Región: ${port10977Radio.region}`);
      console.log(`   📊 Estado: ${port10977Radio.lastVerificationStatus}`);
      
      return port10977Radio;
    }

    // Buscar por nombre similar a Pilmaiquen
    const pilmaiquenRadio = data.radios.find(radio => 
      radio.name.toLowerCase().includes('pilmaiquen') ||
      radio.name.toLowerCase().includes('pilmaiquén')
    );

    if (pilmaiquenRadio) {
      console.log(`\n🎯 ¡RADIO PILMAIQUEN ENCONTRADA!`);
      console.log(`   📻 Nombre: ${pilmaiquenRadio.name}`);
      console.log(`   🆔 ID: ${pilmaiquenRadio.id}`);
      console.log(`   🔗 URL: ${pilmaiquenRadio.streamUrl}`);
      console.log(`   🌍 Región: ${pilmaiquenRadio.region}`);
      console.log(`   📊 Estado: ${pilmaiquenRadio.lastVerificationStatus}`);
      
      return pilmaiquenRadio;
    }

    console.log('\n❌ No se encontró Radio Pilmaiquen con el puerto 10977');
    return null;

  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

// Ejecutar
searchPilmaiquenSpecific().then(radio => {
  if (radio) {
    console.log('\n📝 Script para actualizar:');
    console.log(`UPDATE radios SET stream_url = 'https://streaming.chiloestreaming.com:10976/' WHERE id = '${radio.id}';`);
    
    console.log('\n🔄 O actualiza directamente con:');
    console.log(`curl -X PUT http://localhost:3000/api/radios/${radio.id} \\`);
    console.log(`  -H "Authorization: Bearer $(cat admin-token.txt)" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"stream_url": "https://streaming.chiloestreaming.com:10976/"}'`);
  }
  process.exit(0);
}).catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
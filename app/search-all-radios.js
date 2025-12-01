const fs = require('fs');

async function searchAllRadios() {
  try {
    // Leer el token
    const token = fs.readFileSync('./admin-token.txt', 'utf8').trim();
    console.log('✅ Token encontrado:', token.substring(0, 20) + '...');

    console.log('🔍 Buscando Radio Pilmaiquen en todas las páginas...\n');

    let allRadios = [];
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    // Obtener todas las radios paginadas
    while (hasMore) {
      console.log(`📄 Obteniendo página ${Math.floor(offset / limit) + 1} (offset: ${offset})...`);
      
      const response = await fetch(`http://localhost:3000/api/radios-direct?limit=${limit}&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        allRadios = allRadios.concat(data.data);
        console.log(`   Encontradas ${data.data.length} radios en esta página`);
        
        // Buscar Pilmaiquen en esta página
        const pilmaiquenInPage = data.data.find(radio => 
          radio.name && (
            radio.name.toLowerCase().includes('pilmaiquen') ||
            radio.name.toLowerCase().includes('pilmaiquén') ||
            radio.name.toLowerCase().includes('rem futaleufu') ||
            radio.name.toLowerCase().includes('futaleufu')
          )
        );
        
        if (pilmaiquenInPage) {
          console.log('🎯 ¡RADIO PILMAIQUEN ENCONTRADA EN PÁGINA ACTUAL!');
          console.log('Datos:', JSON.stringify(pilmaiquenInPage, null, 2));
          return pilmaiquenInPage;
        }
        
        // Buscar por puerto 10977
        const port10977InPage = data.data.find(radio => 
          radio.streamUrl && radio.streamUrl.includes('10977')
        );
        
        if (port10977InPage) {
          console.log('🎯 ¡RADIO CON PUERTO 10977 ENCONTRADA EN PÁGINA ACTUAL!');
          console.log('Datos:', JSON.stringify(port10977InPage, null, 2));
          return port10977InPage;
        }
        
        offset += limit;
      } else {
        hasMore = false;
      }
    }

    console.log(`\n✅ Búsqueda completada. Total de radios: ${allRadios.length}`);
    
    // Búsqueda final en todos los datos
    console.log('\n🔍 Búsqueda final en todos los datos...');
    
    // Buscar por nombre Pilmaiquen
    const pilmaiquenRadio = allRadios.find(radio => 
      radio.name && (
        radio.name.toLowerCase().includes('pilmaiquen') ||
        radio.name.toLowerCase().includes('pilmaiquén') ||
        radio.name.toLowerCase().includes('rem futaleufu') ||
        radio.name.toLowerCase().includes('futaleufu')
      )
    );
    
    if (pilmaiquenRadio) {
      console.log('🎯 ¡RADIO PILMAIQUEN ENCONTRADA!');
      console.log('Datos completos:', JSON.stringify(pilmaiquenRadio, null, 2));
      return pilmaiquenRadio;
    }
    
    // Buscar por puerto 10977
    const port10977Radio = allRadios.find(radio => 
      radio.streamUrl && radio.streamUrl.includes('10977')
    );
    
    if (port10977Radio) {
      console.log('🎯 ¡RADIO CON PUERTO 10977 ENCONTRADA!');
      console.log('Datos completos:', JSON.stringify(port10977Radio, null, 2));
      return port10977Radio;
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
    
    // Buscar radios de Aysén (región de Pilmaiquen)
    console.log('\n📻 Radios de la región de Aysén (donde está Pilmaiquen):');
    const aysenRadios = allRadios.filter(radio => 
      radio.region && radio.region.toLowerCase().includes('aysén')
    );
    
    aysenRadios.forEach(radio => {
      console.log(`\n${radio.name}:`);
      console.log(`  ID: ${radio.id}`);
      console.log(`  URL: ${radio.streamUrl}`);
      console.log(`  Región: ${radio.region}`);
      console.log(`  Ciudad: ${radio.city}`);
    });
    
    return null;

  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

// Ejecutar
searchAllRadios().then(radio => {
  if (radio) {
    console.log('\n📝 Script para actualizar:');
    console.log(`UPDATE radios SET stream_url = 'https://streaming.chiloestreaming.com:10976/' WHERE id = '${radio.id}';`);
  } else {
    console.log('\n❌ No se encontró Radio Pilmaiquen ni ninguna radio con puerto 10977');
  }
  process.exit(0);
}).catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
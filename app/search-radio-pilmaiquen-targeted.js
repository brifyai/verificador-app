const fs = require('fs');

async function searchRadioPilmaiquenTargeted() {
  try {
    // Leer el token del archivo correcto
    const token = fs.readFileSync('./admin-token.txt', 'utf8').trim();
    console.log('✅ Token encontrado:', token.substring(0, 20) + '...');

    console.log('🔍 Buscando Radio Pilmaiquen específicamente...\n');

    // Buscar directamente por nombre usando el endpoint de búsqueda
    const searchResponse = await fetch(`http://localhost:3000/api/radios-direct?search=pilmaiquen&limit=100`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!searchResponse.ok) {
      throw new Error(`HTTP error! status: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    
    if (searchData.data && searchData.data.length > 0) {
      console.log(`✅ Encontradas ${searchData.data.length} radios con "pilmaiquen" en el nombre`);
      
      // Buscar la radio específica
      const pilmaiquenRadio = searchData.data.find(radio => 
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
        
        // Verificar el stream actual
        console.log('\n🔍 Verificando el stream actual...');
        console.log(`URL actual: ${pilmaiquenRadio.streamUrl}`);
        
        // Probar diferentes puertos de chiloestreaming
        const baseUrl = 'https://streaming.chiloestreaming.com:';
        const ports = ['10976', '10977', '10978', '10979', '10980', '10981', '10982', '10983', '10984', '10985', '10986', '10987', '10988', '10989', '10990', '10991', '10992', '10993', '10994', '10995'];
        
        console.log('\n🧪 Probando diferentes puertos...');
        
        for (const port of ports) {
          const testUrl = baseUrl + port + '/';
          try {
            const response = await fetch(testUrl, {
              method: 'HEAD',
              timeout: 5000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });
            
            if (response.ok) {
              console.log(`✅ Puerto ${port}: ONLINE (${response.status})`);
              
              // Si encontramos el puerto correcto, verificar si es el de Pilmaiquen
              if (pilmaiquenRadio.streamUrl !== testUrl) {
                console.log(`\n📝 Script para actualizar:`);
                console.log(`UPDATE radios SET stream_url = '${testUrl}' WHERE id = '${pilmaiquenRadio.id}';`);
                return pilmaiquenRadio;
              }
            } else {
              console.log(`❌ Puerto ${port}: ${response.status}`);
            }
          } catch (error) {
            console.log(`❌ Puerto ${port}: Error - ${error.message}`);
          }
        }
        
        return pilmaiquenRadio;
      }
    }
    
    console.log('❌ No se encontró Radio Pilmaiquen con búsqueda directa');
    
    // Si no se encontró con búsqueda directa, buscar en radios de Aysén
    console.log('\n🔍 Buscando radios de la región de Aysén...');
    
    const aysenResponse = await fetch(`http://localhost:3000/api/radios-direct?region=aysén&limit=200`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const aysenData = await aysenResponse.json();
    
    if (aysenData.data && aysenData.data.length > 0) {
      console.log(`✅ Encontradas ${aysenData.data.length} radios en la región de Aysén`);
      
      // Buscar Pilmaiquen en estas radios
      const pilmaiquenInAysen = aysenData.data.find(radio => 
        radio.name && (
          radio.name.toLowerCase().includes('pilmaiquen') ||
          radio.name.toLowerCase().includes('pilmaiquén') ||
          radio.name.toLowerCase().includes('rem futaleufu') ||
          radio.name.toLowerCase().includes('futaleufu')
        )
      );
      
      if (pilmaiquenInAysen) {
        console.log('🎯 ¡RADIO PILMAIQUEN ENCONTRADA EN AYSÉN!');
        console.log('Datos completos:', JSON.stringify(pilmaiquenInAysen, null, 2));
        return pilmaiquenInAysen;
      }
      
      // Mostrar todas las radios de Aysén
      console.log('\n📻 Todas las radios de Aysén:');
      aysenData.data.forEach(radio => {
        console.log(`\n${radio.name}:`);
        console.log(`  ID: ${radio.id}`);
        console.log(`  URL: ${radio.streamUrl}`);
        console.log(`  Ciudad: ${radio.city}`);
      });
    }
    
    return null;

  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

// Ejecutar
searchRadioPilmaiquenTargeted().then(radio => {
  if (radio) {
    console.log('\n✅ Búsqueda completada. Radio Pilmaiquen encontrada.');
  } else {
    console.log('\n❌ No se encontró Radio Pilmaiquen');
  }
  process.exit(0);
}).catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
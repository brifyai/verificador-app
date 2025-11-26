
import PocketBase from 'pocketbase';

const POCKETBASE_URL = 'https://pocket.brifyai.com';
const POCKETBASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN0aW9uSWQiOiJwYmNfMzE0MjYzNTgyMyIsImV4cCI6MTc2NDE4NzgyMiwiaWQiOiJ2c2Zyd2Jnb2QzMjJoN3QiLCJyZWZyZXNoYWJsZSI6dHJ1ZSwidHlwZSI6ImF1dGgifQ.sF7q2oCIizka6DyaTcGwCYfDL3JkRv0zwj_x5Lwbe0w';

async function testCollections() {
  const pb = new PocketBase(POCKETBASE_URL);
  pb.authStore.save(POCKETBASE_API_KEY, null);
  
  console.log('🧪 Probando colecciones de PocketBase...\n');
  
  try {
    // 1. Probar obtener radios sin filtro
    console.log('1. Probando radios sin filtro...');
    try {
      const radios = await pb.collection('radios').getFullList();
      console.log(`✅ Radios sin filtro: ${radios.length} registros`);
      
      // Mostrar primer radio para verificar estructura
      if (radios.length > 0) {
        console.log('   Primer radio:', {
          id: radios[0].id,
          name: radios[0].name,
          status: radios[0].status,
          region: radios[0].region
        });
      }
    } catch (error) {
      console.log(`❌ Error radios sin filtro: ${error.message}`);
    }

    // 2. Probar obtener radios con filtro
    console.log('\n2. Probando radios con filtro...');
    try {
      const radiosFiltered = await pb.collection('radios').getFullList({
        filter: 'status = "active"'
      });
      console.log(`✅ Radios con filtro: ${radiosFiltered.length} registros`);
    } catch (error) {
      console.log(`❌ Error radios con filtro: ${error.message}`);
    }

    // 3. Probar obtener frases
    console.log('\n3. Probando frases...');
    try {
      const phrases = await pb.collection('phrases').getFullList();
      console.log(`✅ Frases: ${phrases.length} registros`);
      
      if (phrases.length > 0) {
        console.log('   Primera frase:', {
          id: phrases[0].id,
          phrase: phrases[0].phrase,
          brand: phrases[0].brand,
          active: phrases[0].active
        });
      }
    } catch (error) {
      console.log(`❌ Error frases: ${error.message}`);
    }

    // 4. Probar obtener detecciones
    console.log('\n4. Probando detecciones...');
    try {
      const detections = await pb.collection('detections').getFullList();
      console.log(`✅ Detecciones: ${detections.length} registros`);
      
      if (detections.length > 0) {
        console.log('   Primera detección:', {
          id: detections[0].id,
          radio: detections[0].radio,
          phrase: detections[0].phrase,
          confidence: detections[0].confidence,
          timestamp: detections[0].timestamp
        });
      }
    } catch (error) {
      console.log(`❌ Error detecciones: ${error.message}`);
    }

    // 5. Probar obtener capturas
    console.log('\n5. Probando capturas...');
    try {
      const captures = await pb.collection('captures').getFullList();
      console.log(`✅ Capturas: ${captures.length} registros`);
    } catch (error) {
      console.log(`❌ Error capturas: ${error.message}`);
    }

    console.log('\n✅ Pruebas completadas');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testCollections();
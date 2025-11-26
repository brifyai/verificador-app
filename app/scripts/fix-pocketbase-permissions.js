import PocketBase from 'pocketbase';

const POCKETBASE_URL = 'https://pocket.brifyai.com';
const POCKETBASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN0aW9uSWQiOiJwYmNfMzE0MjYzNTgyMyIsImV4cCI6MTc2NDE4NzgyMiwiaWQiOiJ2c2Zyd2Jnb2QzMjJoN3QiLCJyZWZyZXNoYWJsZSI6dHJ1ZSwidHlwZSI6ImF1dGgifQ.sF7q2oCIizka6DyaTcGwCYfDL3JkRv0zwj_x5Lwbe0w';

async function fixPermissions() {
  const pb = new PocketBase(POCKETBASE_URL);
  pb.authStore.save(POCKETBASE_API_KEY, null);
  
  console.log('🔧 Corrigiendo permisos de colecciones...\n');
  
  try {
    // Obtener todas las colecciones
    const collections = await pb.collections.getFullList();
    
    for (const collection of collections) {
      if (['radios', 'phrases', 'detections', 'captures'].includes(collection.name)) {
        console.log(`📝 Actualizando permisos de ${collection.name}...`);
        
        try {
          // Actualizar permisos para permitir lectura a través de API Key
          await pb.collections.update(collection.id, {
            name: collection.name,
            type: collection.type,
            schema: collection.schema,
            // Permisos de lectura para anyone (podemos restringir después)
            listRule: '1 = 1', // anyone can list
            viewRule: '1 = 1', // anyone can view
            createRule: '@request.auth.id != ""', // solo authenticated
            updateRule: '@request.auth.id != ""', // solo authenticated
            deleteRule: '@request.auth.id != ""', // solo authenticated
          });
          
          console.log(`   ✅ ${collection.name} actualizado`);
        } catch (error) {
          console.log(`   ❌ Error actualizando ${collection.name}: ${error.message}`);
        }
      }
    }
    
    console.log('\n🧪 Verificando datos después de corregir permisos...');
    
    // Verificar radios
    const radios = await pb.collection('radios').getFullList();
    console.log(`📻 Radios: ${radios.length} registros`);
    if (radios.length > 0) {
      console.log('   Primer radio:', {
        id: radios[0].id,
        name: radios[0].name,
        status: radios[0].status,
        region: radios[0].region
      });
    }
    
    // Verificar frases
    const phrases = await pb.collection('phrases').getFullList();
    console.log(`🎯 Frases: ${phrases.length} registros`);
    if (phrases.length > 0) {
      console.log('   Primera frase:', {
        id: phrases[0].id,
        phrase: phrases[0].phrase,
        brand: phrases[0].brand,
        active: phrases[0].active
      });
    }
    
    // Verificar detecciones
    const detections = await pb.collection('detections').getFullList();
    console.log(`🔍 Detecciones: ${detections.length} registros`);
    if (detections.length > 0) {
      console.log('   Primera detección:', {
        id: detections[0].id,
        confidence: detections[0].confidence,
        timestamp: detections[0].timestamp
      });
    }
    
    console.log('\n✅ Permisos corregidos exitosamente!');
    
  } catch (error) {
    console.error('❌ Error corrigiendo permisos:', error);
  }
}

fixPermissions();
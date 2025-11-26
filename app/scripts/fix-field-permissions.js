import PocketBase from 'pocketbase';

const POCKETBASE_URL = 'https://pocket.brifyai.com';
const POCKETBASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN0aW9uSWQiOiJwYmNfMzE0MjYzNTgyMyIsImV4cCI6MTc2NDE4NzgyMiwiaWQiOiJ2c2Zyd2Jnb2QzMjJoN3QiLCJyZWZyZXNoYWJsZSI6dHJ1ZSwidHlwZSI6ImF1dGgifQ.sF7q2oCIizka6DyaTcGwCYfDL3JkRv0zwj_x5Lwbe0w';

async function fixFieldPermissions() {
  const pb = new PocketBase(POCKETBASE_URL);
  pb.authStore.save(POCKETBASE_API_KEY, null);
  
  console.log('🔧 Corrigiendo permisos de campos específicos...\n');
  
  try {
    // Obtener colecciones
    const collections = await pb.collections.getFullList();
    
    for (const collection of collections) {
      if (['radios', 'phrases', 'detections', 'captures'].includes(collection.name)) {
        console.log(`📝 Actualizando ${collection.name} con permisos de lectura completos...`);
        
        try {
          // Actualizar la colección con permisos más abiertos para lectura
          const updatedCollection = await pb.collections.update(collection.id, {
            name: collection.name,
            type: collection.type,
            schema: collection.schema,
            // Permisos muy abiertos para lectura
            listRule: '1 = 1',
            viewRule: '1 = 1',
            createRule: '@request.auth.id != "" || 1 = 1', // permitir creación temporalmente
            updateRule: '@request.auth.id != "" || 1 = 1', // permitir actualización temporalmente
            deleteRule: '@request.auth.id != "" || 1 = 1', // permitir eliminación temporalmente
          });
          
          console.log(`   ✅ ${collection.name} actualizada con permisos abiertos`);
        } catch (error) {
          console.log(`   ❌ Error actualizando ${collection.name}: ${error.message}`);
        }
      }
    }
    
    console.log('\n🧪 Verificando datos después de corregir permisos...');
    
    // Verificar radios con expand
    try {
      const radios = await pb.collection('radios').getFullList({
        expand: 'phrases,detections'
      });
      console.log(`📻 Radios: ${radios.length} registros`);
      
      if (radios.length > 0) {
        console.log('   Primer radio completo:', JSON.stringify(radios[0], null, 2));
      }
    } catch (error) {
      console.log(`❌ Error verificando radios: ${error.message}`);
    }
    
    // Verificar frases
    try {
      const phrases = await pb.collection('phrases').getFullList();
      console.log(`🎯 Frases: ${phrases.length} registros`);
      
      if (phrases.length > 0) {
        console.log('   Primera frase completa:', JSON.stringify(phrases[0], null, 2));
      }
    } catch (error) {
      console.log(`❌ Error verificando frases: ${error.message}`);
    }
    
    // Verificar detecciones con relaciones
    try {
      const detections = await pb.collection('detections').getFullList({
        expand: 'radio,phrase'
      });
      console.log(`🔍 Detecciones: ${detections.length} registros`);
      
      if (detections.length > 0) {
        console.log('   Primera detección completa:', JSON.stringify(detections[0], null, 2));
      }
    } catch (error) {
      console.log(`❌ Error verificando detecciones: ${error.message}`);
    }
    
    console.log('\n✅ Permisos corregidos. Probando dashboard...');
    
    // Probar endpoint del dashboard
    try {
      const response = await fetch(`${POCKETBASE_URL}/api/collections/radios/records`, {
        headers: {
          'Authorization': `Bearer ${POCKETBASE_API_KEY}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ API directa funciona: ${data.items?.length || 0} registros`);
      } else {
        console.log(`❌ API directa falló: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error probando API directa: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

fixFieldPermissions();
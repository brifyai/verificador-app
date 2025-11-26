const PocketBase = require('pocketbase');

const POCKETBASE_URL = 'https://pocket.brifyai.com';
const POCKETBASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN0aW9uSWQiOiJwYmNfMzE0MjYzNTgyMyIsImV4cCI6MTc2NDE4NzgyMiwiaWQiOiJ2c2Zyd2Jnb2QzMjJoN3QiLCJyZWZyZXNoYWJsZSI6dHJ1ZSwidHlwZSI6ImF1dGgifQ.sF7q2oCIizka6DyaTcGwCYfDL3JkRv0zwj_x5Lwbe0w';

async function verifyCollections() {
  const pb = new PocketBase(POCKETBASE_URL);
  
  // Autenticar con API Key
  pb.authStore.save(POCKETBASE_API_KEY, null);
  
  try {
    console.log('🔍 Verificando colecciones en PocketBase...\n');
    
    // Lista de colecciones esperadas
    const expectedCollections = [
      'users',
      'accounts',
      'sessions',
      'verification_tokens',
      'radios',
      'phrases',
      'detections',
      'captures',
      'monitoring_sessions',
      'api_configurations',
      'billing_profiles',
      'subscriptions',
      'invoices',
      'payment_methods',
      'payment_history',
      'pricing_rules',
      'alerts',
      'user_roles'
    ];
    
    const existingCollections = [];
    const missingCollections = [];
    
    for (const collectionName of expectedCollections) {
      try {
        // Intentar obtener la lista de registros (si falla, la colección no existe)
        await pb.collection(collectionName).getList(1, 1);
        existingCollections.push(collectionName);
        console.log(`✅ ${collectionName}`);
      } catch (error) {
        missingCollections.push(collectionName);
        console.log(`❌ ${collectionName} - No existe`);
      }
    }
    
    console.log('\n📊 RESUMEN:');
    console.log(`Colecciones existentes: ${existingCollections.length}`);
    console.log(`Colecciones faltantes: ${missingCollections.length}`);
    
    if (missingCollections.length > 0) {
      console.log('\n⚠️  Colecciones faltantes:');
      missingCollections.forEach(name => console.log(`   - ${name}`));
    }
    
    // Verificar cuáles colecciones tienen datos
    console.log('\n📈 Verificando datos en colecciones existentes:');
    for (const collectionName of existingCollections) {
      try {
        const records = await pb.collection(collectionName).getFullList();
        console.log(`   ${collectionName}: ${records.length} registros`);
      } catch (error) {
        console.log(`   ${collectionName}: Error al contar registros`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error al verificar colecciones:', error);
  }
}

verifyCollections();
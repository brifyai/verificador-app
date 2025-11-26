const PocketBase = require('pocketbase');

const POCKETBASE_URL = 'https://pocket.brifyai.com';
const POCKETBASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN0aW9uSWQiOiJwYmNfMzE0MjYzNTgyMyIsImV4cCI6MTc2NDE4NzgyMiwiaWQiOiJ2c2Zyd2Jnb2QzMjJoN3QiLCJyZWZyZXNoYWJsZSI6dHJ1ZSwidHlwZSI6ImF1dGgifQ.sF7q2oCIizka6DyaTcGwCYfDL3JkRv0zwj_x5Lwbe0w';

async function checkExistingCollections() {
  const pb = new PocketBase(POCKETBASE_URL);
  pb.authStore.save(POCKETBASE_API_KEY, null);
  
  console.log('🔍 Verificando colecciones existentes...\n');
  
  const collectionsToCheck = [
    'radios', 'phrases', 'detections', 'captures', 'monitoring_sessions',
    'api_configurations', 'billing_profiles', 'subscriptions', 'invoices'
  ];
  
  const existing = [];
  const missing = [];
  
  for (const name of collectionsToCheck) {
    try {
      await pb.collection(name).getList(1, 1);
      existing.push(name);
      console.log(`✅ ${name}`);
    } catch (error) {
      missing.push(name);
      console.log(`❌ ${name} - ${error.message}`);
    }
  }
  
  console.log('\n📊 RESUMEN:');
  console.log(`Existentes: ${existing.length} - ${existing.join(', ')}`);
  console.log(`Faltantes: ${missing.length} - ${missing.join(', ')}`);
  
  // Verificar si hay datos en las colecciones existentes
  console.log('\n📈 Datos en colecciones:');
  for (const name of existing) {
    try {
      const records = await pb.collection(name).getFullList();
      console.log(`   ${name}: ${records.length} registros`);
    } catch (error) {
      console.log(`   ${name}: Error al leer`);
    }
  }
}

checkExistingCollections();
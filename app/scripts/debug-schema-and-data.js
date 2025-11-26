import PocketBase from 'pocketbase';

const POCKETBASE_URL = 'https://pocket.brifyai.com';
const POCKETBASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN0aW9uSWQiOiJwYmNfMzE0MjYzNTgyMyIsImV4cCI6MTc2NDE4NzgyMiwiaWQiOiJ2c2Zyd2Jnb2QzMjJoN3QiLCJyZWZyZXNoYWJsZSI6dHJ1ZSwidHlwZSI6ImF1dGgifQ.sF7q2oCIizka6DyaTcGwCYfDL3JkRv0zwj_x5Lwbe0w';

async function debugSchemaAndData() {
  const pb = new PocketBase(POCKETBASE_URL);
  pb.authStore.save(POCKETBASE_API_KEY, null);
  
  console.log('🔍 Depurando schema y datos de PocketBase...\n');
  
  try {
    // 1. Verificar schema de la colección radios
    console.log('📋 Verificando schema de radios...');
    const radiosCollection = await pb.collections.getFullList({
      filter: 'name = "radios"'
    });
    
    if (radiosCollection.length > 0) {
      console.log('Schema de radios:', JSON.stringify(radiosCollection[0].schema, null, 2));
    }
    
    // 2. Intentar crear un registro de prueba con todos los campos
    console.log('\n🧪 Creando registro de prueba con todos los campos...');
    try {
      const testRadio = await pb.collection('radios').create({
        name: "Radio Test",
        url: "https://test.com/stream",
        region: "Test Region",
        city: "Test City",
        status: "active",
        format: "Test Format",
        frequency: "Test FM",
        coverage: "test",
        reliability: 99,
        notes: "Test notes"
      });
      
      console.log('✅ Radio de prueba creada:', JSON.stringify(testRadio, null, 2));
      
      // 3. Intentar leer el registro recién creado
      console.log('\n📖 Leyendo registro recién creado...');
      const readRadio = await pb.collection('radios').getOne(testRadio.id);
      console.log('Radio leída:', JSON.stringify(readRadio, null, 2));
      
      // 4. Eliminar registro de prueba
      await pb.collection('radios').delete(testRadio.id);
      console.log('🗑️ Registro de prueba eliminado');
      
    } catch (error) {
      console.log(`❌ Error creando/leyendo registro de prueba: ${error.message}`);
    }
    
    // 5. Verificar datos existentes con fields específicos
    console.log('\n📊 Verificando datos existentes con fields específicos...');
    try {
      const radios = await pb.collection('radios').getFullList({
        fields: 'id,name,url,region,city,status,format,frequency,coverage,reliability,notes,created,updated'
      });
      
      console.log(`✅ Radios con fields específicos: ${radios.length} registros`);
      if (radios.length > 0) {
        console.log('Primer radio con fields:', JSON.stringify(radios[0], null, 2));
      }
    } catch (error) {
      console.log(`❌ Error con fields específicos: ${error.message}`);
    }
    
    // 6. Probar con diferentes parámetros
    console.log('\n🔄 Probando diferentes parámetros de consulta...');
    try {
      // Sin parámetros
      const radios1 = await pb.collection('radios').getFullList();
      console.log(`Sin parámetros: ${Object.keys(radios1[0] || {}).length} campos`);
      
      // Con perPage pequeño
      const radios2 = await pb.collection('radios').getList(1, 1);
      console.log(`Con perPage=1: ${Object.keys(radios2.items[0] || {}).length} campos`);
      
      // Con sort
      const radios3 = await pb.collection('radios').getFullList({
        sort: 'created'
      });
      console.log(`Con sort: ${Object.keys(radios3[0] || {}).length} campos`);
      
    } catch (error) {
      console.log(`❌ Error probando parámetros: ${error.message}`);
    }
    
    console.log('\n✅ Depuración completada');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

debugSchemaAndData();
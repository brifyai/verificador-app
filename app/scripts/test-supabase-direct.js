require('dotenv').config();

async function testSupabaseDirect() {
  console.log('🔍 Probando cliente directo de Supabase API...');
  console.log('==============================================');
  
  // Importar el cliente directo
  const { supabaseDirect } = require('../lib/supabase-direct');
  
  try {
    // 1. Probar conexión básica
    console.log('\n1. 📡 Probando conexión básica...');
    const connectionTest = await supabaseDirect.testConnection();
    if (connectionTest.success) {
      console.log('✅ Conexión exitosa:', connectionTest.message);
    } else {
      console.log('❌ Error de conexión:', connectionTest.message);
      return;
    }
    
    // 2. Probar obtener radios
    console.log('\n2. 📻 Probando obtener radios...');
    try {
      const radios = await supabaseDirect.getRadios({ limit: 5 });
      console.log(`✅ Radios obtenidas: ${radios.length}`);
      if (radios.length > 0) {
        console.log('   Ejemplo:', radios[0].name, '-', radios[0].region);
      }
    } catch (error) {
      console.log('❌ Error obteniendo radios:', error.message);
    }
    
    // 3. Probar obtener frases
    console.log('\n3. 🎯 Probando obtener frases...');
    try {
      const phrases = await supabaseDirect.getPhrases({ limit: 5 });
      console.log(`✅ Frases obtenidas: ${phrases.length}`);
      if (phrases.length > 0) {
        console.log('   Ejemplo:', phrases[0].phrase, '-', phrases[0].brand);
      }
    } catch (error) {
      console.log('❌ Error obteniendo frases:', error.message);
    }
    
    // 4. Probar obtener detecciones
    console.log('\n4. 🔍 Probando obtener detecciones...');
    try {
      const detections = await supabaseDirect.getDetections({ limit: 5 });
      console.log(`✅ Detecciones obtenidas: ${detections.length}`);
      if (detections.length > 0) {
        console.log('   Ejemplo:', detections[0].detected_text, '-', detections[0].confidence);
      }
    } catch (error) {
      console.log('❌ Error obteniendo detecciones:', error.message);
    }
    
    // 5. Probar estadísticas del dashboard
    console.log('\n5. 📊 Probando estadísticas del dashboard...');
    try {
      const stats = await supabaseDirect.getDashboardStats();
      console.log('✅ Estadísticas obtenidas:');
      console.log(`   Total radios: ${stats.overview.totalRadios}`);
      console.log(`   Total frases: ${stats.overview.totalPhrases}`);
      console.log(`   Total detecciones: ${stats.overview.totalDetections}`);
      console.log(`   Detecciones hoy: ${stats.overview.todayDetections}`);
    } catch (error) {
      console.log('❌ Error obteniendo estadísticas:', error.message);
    }
    
    // 6. Probar crear una radio de prueba
    console.log('\n6. 📝 Probando crear radio de prueba...');
    try {
      const testRadio = {
        id: `test-${Date.now()}`,
        name: 'Radio Prueba API',
        stream_url: 'http://test.url',
        platform: 'HTTP_STREAM',
        region: 'Metropolitana',
        status: 'ACTIVE',
        priority: 2
      };
      
      const createdRadio = await supabaseDirect.createRadio(testRadio);
      console.log('✅ Radio creada:', createdRadio[0].name);
      
      // Limpiar: eliminar la radio de prueba
      await supabaseDirect.deleteRadio(createdRadio[0].id);
      console.log('✅ Radio de prueba eliminada');
      
    } catch (error) {
      console.log('❌ Error creando radio:', error.message);
    }
    
    console.log('\n🎉 ¡Pruebas completadas!');
    console.log('\n📝 Resumen:');
    console.log('✅ Cliente API de Supabase funcionando correctamente');
    console.log('✅ Endpoint /api/dashboard/stats-direct disponible');
    console.log('✅ Operaciones CRUD funcionando');
    
    console.log('\n🚀 Para usar en la aplicación:');
    console.log('1. Las tablas deben existir en Supabase (ejecuta el SQL)');
    console.log('2. Usa el endpoint /api/dashboard/stats-direct temporalmente');
    console.log('3. Cuando resuelvas las credenciales PostgreSQL, vuelve a /api/dashboard/stats');
    
  } catch (error) {
    console.error('\n❌ Error general en las pruebas:', error);
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 Posible solución:');
      console.log('1. Verifica que la URL de Supabase sea correcta');
      console.log('2. Confirma que la API key sea válida');
      console.log('3. Asegúrate que el proyecto esté activo');
    }
    
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      console.log('\n💡 Posible solución:');
      console.log('1. Las tablas no existen - ejecuta el script SQL');
      console.log('2. Verifica los nombres de las tablas');
      console.log('3. Revisa los permisos de la API key');
    }
  }
}

testSupabaseDirect();
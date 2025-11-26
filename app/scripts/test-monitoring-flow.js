// Script de prueba para flujo completo de monitoreo
const { supabaseDirect } = require('./lib/supabase-direct');
const { monitoringService } = require('./lib/monitoring-service');
const { phraseDetectionService } = require('./lib/phrase-detection');
const { multiProviderTranscriptionService } = require('./lib/transcription-providers');

async function testMonitoringFlow() {
  console.log('🧪 INICIANDO TEST DE FLUJO COMPLETO DE MONITOREO\n');
  
  try {
    // 1. Verificar conexión a Supabase
    console.log('1️⃣  Verificando conexión a Supabase...');
    const connectionTest = await supabaseDirect.testConnection();
    console.log(connectionTest.success ? '✅ Conexión exitosa' : '❌ Error de conexión');
    
    // 2. Verificar radios disponibles
    console.log('\n2️⃣  Verificando radios configuradas...');
    const radios = await supabaseDirect.getRadios();
    console.log(`✅ ${radios.length} radios encontradas`);
    if (radios.length > 0) {
      radios.slice(0, 3).forEach(radio => {
        console.log(`   📻 ${radio.name} - ${radio.stream_url || 'No URL'}`);
      });
    }
    
    // 3. Verificar frases activas
    console.log('\n3️⃣  Verificando frases activas...');
    await phraseDetectionService.loadPhrasesFromDatabase();
    const phraseCount = phraseDetectionService.getActivePhraseCount();
    console.log(`✅ ${phraseCount} frases activas para detección`);
    
    // 4. Verificar proveedores de transcripción
    console.log('\n4️⃣  Verificando proveedores de transcripción...');
    await multiProviderTranscriptionService.reloadConfiguration();
    const providerStats = multiProviderTranscriptionService.getProviderStats();
    const enabledProviders = Object.values(providerStats).filter(p => p.enabled && p.hasApiKey);
    console.log(`✅ ${enabledProviders.length} proveedores habilitados con API keys`);
    
    // 5. Verificar estado del sistema de monitoreo
    console.log('\n5️⃣  Verificando estado del sistema...');
    const systemHealth = await monitoringService.checkSystemHealth();
    console.log(`✅ Sistema listo: ${systemHealth.systemReady}`);
    console.log(`   📊 Sesiones activas: ${systemHealth.activeSessions || 0}`);
    console.log(`   🎯 Frases activas: ${systemHealth.phraseDetection?.activePhrases || 0}`);
    console.log(`   🔧 Proveedores habilitados: ${systemHealth.transcriptionProviders?.enabled || 0}`);
    
    // 6. Probar detección de frases (simulada)
    console.log('\n6️⃣  Probando detección de frases...');
    if (phraseCount > 0) {
      const testText = "Oferta especial en productos de la marca Samsung, visítanos hoy mismo";
      const detectionResult = await phraseDetectionService.detectPhrases(testText);
      console.log(`✅ Detección completada: ${detectionResult.matches.length} coincidencias encontradas`);
      if (detectionResult.matches.length > 0) {
        detectionResult.matches.forEach(match => {
          console.log(`   🎯 "${match.phrase}" - Confianza: ${Math.round(match.confidence * 100)}%`);
        });
      }
    }
    
    // 7. Resumen final
    console.log('\n📋 RESUMEN DEL TEST:');
    console.log('====================');
    console.log(`✅ Conexión a Supabase: ${connectionTest.success ? 'OK' : 'FALLIDA'}`);
    console.log(`✅ Radios configuradas: ${radios.length}`);
    console.log(`✅ Frases activas: ${phraseCount}`);
    console.log(`✅ Proveedores habilitados: ${enabledProviders.length}`);
    console.log(`✅ Sistema de monitoreo: ${systemHealth.systemReady ? 'LISTO' : 'NO LISTO'}`);
    
    if (connectionTest.success && radios.length > 0 && phraseCount > 0 && enabledProviders.length > 0 && systemHealth.systemReady) {
      console.log('\n🎉 ¡TODO EL SISTEMA ESTÁ FUNCIONANDO CORRECTAMENTE!');
      console.log('\n📝 Para iniciar monitoreo real:');
      console.log('   1. Ve a /dashboard/monitoreo');
      console.log('   2. Selecciona una radio');
      console.log('   3. Configura los parámetros de captura');
      console.log('   4. Haz clic en "Iniciar Monitoreo"');
    } else {
      console.log('\n⚠️  ALGUNOS COMPONENTES NECESITAN ATENCIÓN:');
      if (radios.length === 0) console.log('   ❌ No hay radios configuradas');
      if (phraseCount === 0) console.log('   ❌ No hay frases activas');
      if (enabledProviders.length === 0) console.log('   ❌ No hay proveedores de transcripción configurados');
      if (!systemHealth.systemReady) console.log('   ❌ El sistema no está listo');
    }
    
  } catch (error) {
    console.error('❌ Error en el test:', error);
  }
}

// Ejecutar el test
testMonitoringFlow().catch(console.error);
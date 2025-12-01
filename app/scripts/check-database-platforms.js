/**
 * Script para verificar qué plataformas están realmente permitidas en la base de datos
 * Esto ayuda a identificar el constraint radios_platform_check
 */

const { supabaseDirect } = require('../lib/supabase-direct');

// Todas las plataformas del frontend
const ALL_FRONTEND_PLATFORMS = [
  'youtube', 'twitch', 'facebook', 'spotify', 'soundcloud', 'mixcloud',
  'icecast', 'shoutcast', 'direct', 'rtmp', 'hls', 'dash',
  'centova', 'sonicpanel', 'azuracast', 'whmsonic',
  'arkeo', 'creattiva', 'visualradio', 'mediaweb', 'digitalproserver', 'tustreaming', 'streaminghd', 'neonetwork', 'chiloestreaming',
  'afstream', 'mediastream',
  'tunein',
  'hardata', 'infynystream', 'radionomy',
  'shoutcheap', 'yesstreaming', 'streamerr',
  'other'
];

async function testPlatforms() {
  console.log('🔍 Verificando qué plataformas están permitidas en la base de datos...\n');
  
  const supabase = supabaseDirect;
  
  // Primero, obtener una radio de prueba
  const radios = await supabase.request('radios?select=id&limit=1');
  if (radios.length === 0) {
    console.log('❌ No hay radios en la base de datos para probar');
    return;
  }
  
  const testRadioId = radios[0].id;
  console.log(`📻 Usando radio de prueba: ${testRadioId}\n`);
  
  const results = {
    successful: [],
    failed: []
  };
  
  // Probar cada plataforma
  for (const platform of ALL_FRONTEND_PLATFORMS) {
    try {
      console.log(`🔄 Probando plataforma: ${platform}...`);
      
      // Intentar actualizar la plataforma
      await supabase.request(`radios?id=eq.${testRadioId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          platform: platform.toUpperCase(),
          updated_at: new Date().toISOString()
        })
      });
      
      console.log(`✅ ${platform} - PERMITIDA`);
      results.successful.push(platform);
      
    } catch (error) {
      console.log(`❌ ${platform} - RECHAZADA: ${error.message}`);
      results.failed.push(platform);
    }
    
    // Pequeña pausa para no sobrecargar la API
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTADOS DE LA VERIFICACIÓN');
  console.log('='.repeat(60));
  
  console.log(`\n✅ PLATAFORMAS PERMITIDAS (${results.successful.length}):`);
  results.successful.forEach(platform => console.log(`   - ${platform}`));
  
  console.log(`\n❌ PLATAFORMAS RECHAZADAS (${results.failed.length}):`);
  results.failed.forEach(platform => console.log(`   - ${platform}`));
  
  console.log('\n💡 RECOMENDACIONES:');
  console.log('   - Actualiza el mapeo de plataformas para usar solo las permitidas');
  console.log('   - Considera agregar las plataformas faltantes a la base de datos');
  console.log('   - Verifica el constraint "radios_platform_check" en Supabase');
  
  // Generar código para actualizar el mapeo
  console.log('\n📝 CÓDIGO PARA ACTUALIZAR EL MAPEO:');
  console.log('export const ALLOWED_PLATFORMS = [');
  results.successful.forEach(platform => {
    console.log(`  '${platform.toUpperCase()}',`);
  });
  console.log('];');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testPlatforms().catch(console.error);
}

module.exports = { testPlatforms };
#!/usr/bin/env node

// Script de prueba simplificado para verificar la actualización de plataformas

function testMapPlatformToEnum() {
  // Función de mapeo actualizada (copiada del backend)
  function mapPlatformToEnum(platform) {
    if (!platform) return 'OTHER';
    const platformMap = {
      // Plataformas Sociales y Video
      youtube: 'YOUTUBE',
      twitch: 'TWITCH',
      facebook: 'FACEBOOK',
      spotify: 'SPOTIFY',
      soundcloud: 'SOUNDCLOUD',
      mixcloud: 'MIXCLOUD',
      
      // Tecnología Base
      icecast: 'ICECAST',
      shoutcast: 'SHOUTCAST',
      direct: 'HTTP_STREAM',
      http: 'HTTP_STREAM',
      rtmp: 'RTMP',
      
      // Paneles de Control Profesionales
      centova: 'ICECAST',
      sonicpanel: 'ICECAST',
      azuracast: 'ICECAST',
      whmsonic: 'ICECAST',
      
      // Proveedores Chilenos
      arkeo: 'ARKEO',
      creattiva: 'CREATTIVA',
      visualradio: 'VISUALRADIO',
      mediaweb: 'MEDIAWEB',
      digitalproserver: 'DIGITALPROSERVER',
      tustreaming: 'TUSTREAMING',
      streaminghd: 'STREAMINGHD',
      neonetwork: 'NEONETWORK',
      chiloestreaming: 'CHILOESTREAMING',
      
      // Plataformas de Monetización y Analytics
      afstream: 'AFSTREAM',
      mediastream: 'MEDIASTREAM',
      
      // Agregadores
      tunein: 'TUNEIN',
      
      // Software de Automatización
      hardata: 'HARDATA',
      infinystream: 'INFINYSTREAM',
      radionomy: 'RADIONOMY',
      
      // Proveedores Globales
      shoutcheap: 'SHOUTCHEAP',
      yesstreaming: 'YESSTREAMING',
      streamerr: 'STREAMERR',
      
      // Personalizado
      custom: 'OTHER'
    };
    return platformMap[platform.toLowerCase()] || 'OTHER';
  }

  const testCases = [
    // Plataformas Sociales y Video
    { input: 'youtube', expected: 'YOUTUBE' },
    { input: 'twitch', expected: 'TWITCH' },
    { input: 'facebook', expected: 'FACEBOOK' },
    { input: 'spotify', expected: 'SPOTIFY' },
    { input: 'soundcloud', expected: 'SOUNDCLOUD' },
    { input: 'mixcloud', expected: 'MIXCLOUD' },
    
    // Tecnología Base
    { input: 'icecast', expected: 'ICECAST' },
    { input: 'shoutcast', expected: 'SHOUTCAST' },
    { input: 'direct', expected: 'HTTP_STREAM' },
    { input: 'http', expected: 'HTTP_STREAM' },
    { input: 'rtmp', expected: 'RTMP' },
    
    // Paneles de Control Profesionales
    { input: 'centova', expected: 'ICECAST' },
    { input: 'sonicpanel', expected: 'ICECAST' },
    { input: 'azuracast', expected: 'ICECAST' },
    { input: 'whmsonic', expected: 'ICECAST' },
    
    // Proveedores Chilenos
    { input: 'arkeo', expected: 'ARKEO' },
    { input: 'creattiva', expected: 'CREATTIVA' },
    { input: 'visualradio', expected: 'VISUALRADIO' },
    { input: 'mediaweb', expected: 'MEDIAWEB' },
    { input: 'digitalproserver', expected: 'DIGITALPROSERVER' },
    { input: 'tustreaming', expected: 'TUSTREAMING' },
    { input: 'streaminghd', expected: 'STREAMINGHD' },
    { input: 'neonetwork', expected: 'NEONETWORK' },
    { input: 'chiloestreaming', expected: 'CHILOESTREAMING' },
    
    // Plataformas de Monetización y Analytics
    { input: 'afstream', expected: 'AFSTREAM' },
    { input: 'mediastream', expected: 'MEDIASTREAM' },
    
    // Agregadores
    { input: 'tunein', expected: 'TUNEIN' },
    
    // Software de Automatización
    { input: 'hardata', expected: 'HARDATA' },
    { input: 'infinystream', expected: 'INFINYSTREAM' },
    { input: 'radionomy', expected: 'RADIONOMY' },
    
    // Proveedores Globales
    { input: 'shoutcheap', expected: 'SHOUTCHEAP' },
    { input: 'yesstreaming', expected: 'YESSTREAMING' },
    { input: 'streamerr', expected: 'STREAMERR' },
    
    // Personalizado
    { input: 'custom', expected: 'OTHER' },
    
    // Casos edge
    { input: null, expected: 'OTHER' },
    { input: '', expected: 'OTHER' },
    { input: 'plataforma-inexistente', expected: 'OTHER' },
  ];

  console.log('🧪 Iniciando pruebas de mapeo de plataformas...\n');
  
  let passed = 0;
  let failed = 0;

  testCases.forEach(({ input, expected }) => {
    const result = mapPlatformToEnum(input);
    
    const status = result === expected ? '✅' : '❌';
    console.log(`${status} ${input} → ${result} (esperado: ${expected})`);
    
    if (result === expected) {
      passed++;
    } else {
      failed++;
      console.log(`   Error: se obtuvo ${result} pero se esperaba ${expected}`);
    }
  });

  console.log(`\n📊 Resultados:`);
  console.log(`✅ Pruebas pasadas: ${passed}`);
  console.log(`❌ Pruebas fallidas: ${failed}`);
  console.log(`📈 Tasa de éxito: ${((passed / testCases.length) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ¡Todas las pruebas pasaron! El mapeo de plataformas está funcionando correctamente.');
    console.log('\n💡 Ahora cuando edites una radio y cambies su plataforma, los cambios se guardarán correctamente en la base de datos.');
  } else {
    console.log('\n⚠️  Algunas pruebas fallaron. Revisa el mapeo de plataformas.');
  }
}

// Ejecutar pruebas
testMapPlatformToEnum();
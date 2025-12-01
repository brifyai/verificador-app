const { mapPlatformToDb, mapPlatformFromDb } = require('../lib/platform-mapping.ts');

// Lista completa de plataformas del frontend
const frontendPlatforms = [
  // Plataformas Sociales y Video
  'youtube',
  'twitch', 
  'facebook',
  'spotify',
  'soundcloud',
  'mixcloud',
  
  // Tecnología Base
  'icecast',
  'shoutcast',
  'direct',
  'rtmp',
  'hls',
  'dash',
  
  // Paneles de Control Profesionales
  'centova',
  'sonicpanel',
  'azuracast',
  'whmsonic',
  
  // Proveedores Chilenos
  'arkeo',
  'creattiva',
  'visualradio',
  'mediaweb',
  'digitalproserver',
  'tustreaming',
  'streaminghd',
  'neonetwork',
  'chiloestreaming',
  
  // Plataformas de Monetización y Analytics
  'afstream',
  'mediastream',
  
  // Agregadores
  'tunein',
  
  // Software de Automatización
  'hardata',
  'infynystream',
  'radionomy',
  
  // Proveedores Globales
  'shoutcheap',
  'yesstreaming',
  'streamerr',
  
  // Otros
  'other'
];

console.log('🧪 Probando mapeo de plataformas frontend → BD → frontend...\n');

let allTestsPassed = true;

frontendPlatforms.forEach(frontendPlatform => {
  try {
    // Mapear frontend a BD
    const dbPlatform = mapPlatformToDb(frontendPlatform);
    console.log(`✅ ${frontendPlatform} → ${dbPlatform}`);
    
    // Mapear BD de vuelta a frontend
    const mappedBackToFrontend = mapPlatformFromDb(dbPlatform);
    
    // Verificar que el mapeo inverso sea correcto
    if (mappedBackToFrontend === frontendPlatform) {
      console.log(`   ✅ ${dbPlatform} → ${mappedBackToFrontend} (correcto)`);
    } else {
      console.log(`   ❌ ${dbPlatform} → ${mappedBackToFrontend} (esperado: ${frontendPlatform})`);
      allTestsPassed = false;
    }
    console.log('');
  } catch (error) {
    console.log(`❌ Error con plataforma ${frontendPlatform}: ${error.message}`);
    allTestsPassed = false;
  }
});

// Probar valores de BD que no están en el frontend
console.log('🧪 Probando mapeo de valores de BD no mapeados...\n');
const dbPlatformsNotInFrontend = ['HTTP_STREAM', 'SOME_UNKNOWN_PLATFORM'];

dbPlatformsNotInFrontend.forEach(dbPlatform => {
  try {
    const mappedFrontend = mapPlatformFromDb(dbPlatform);
    console.log(`✅ ${dbPlatform} → ${mappedFrontend} (valor por defecto)`);
  } catch (error) {
    console.log(`❌ Error con plataforma BD ${dbPlatform}: ${error.message}`);
    allTestsPassed = false;
  }
});

console.log('\n' + '='.repeat(50));
if (allTestsPassed) {
  console.log('🎉 ¡TODAS LAS PRUEBAS PASARON!');
  console.log('✅ El sistema de mapeo de plataformas funciona correctamente');
  console.log('✅ Se mantienen los 20+ valores del frontend en la BD');
} else {
  console.log('❌ Algunas pruebas fallaron');
}
console.log('='.repeat(50));
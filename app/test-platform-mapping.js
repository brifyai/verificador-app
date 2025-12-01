// Script de prueba para verificar el mapeo de plataformas

// Función auxiliar para mapear plataformas a valores del enum de Supabase
const mapPlatformToEnum = (platform) => {
  if (!platform) return 'OTHER';
  const platformMap = {
    // Plataformas Sociales y Video
    youtube: 'YOUTUBE',
    twitch: 'TWITCH',
    facebook: 'FACEBOOK',
    instagram: 'OTHER',
    tiktok: 'OTHER',
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
};

// Función inversa para mapear valores del enum de Supabase a plataformas del frontend
const mapEnumToPlatform = (enumValue) => {
  const reverseMap = {
    'YOUTUBE': 'youtube',
    'TWITCH': 'twitch',
    'FACEBOOK': 'facebook',
    'SPOTIFY': 'spotify',
    'SOUNDCLOUD': 'soundcloud',
    'MIXCLOUD': 'mixcloud',
    'ICECAST': 'icecast',
    'SHOUTCAST': 'shoutcast',
    'HTTP_STREAM': 'direct',
    'RTMP': 'rtmp',
    'ARKEO': 'arkeo',
    'CREATTIVA': 'creattiva',
    'VISUALRADIO': 'visualradio',
    'MEDIAWEB': 'mediaweb',
    'DIGITALPROSERVER': 'digitalproserver',
    'TUSTREAMING': 'tustreaming',
    'STREAMINGHD': 'streaminghd',
    'NEONETWORK': 'neonetwork',
    'CHILOESTREAMING': 'chiloestreaming',
    'AFSTREAM': 'afstream',
    'MEDIASTREAM': 'mediastream',
    'TUNEIN': 'tunein',
    'HARDATA': 'hardata',
    'INFINYSTREAM': 'infinystream',
    'RADIONOMY': 'radionomy',
    'SHOUTCHEAP': 'shoutcheap',
    'YESSTREAMING': 'yesstreaming',
    'STREAMERR': 'streamerr',
    'OTHER': 'custom'
  };
  return reverseMap[enumValue] || 'custom';
};

// Pruebas
console.log('=== PRUEBAS DE MAPEO DE PLATAFORMAS ===\n');

// Prueba 1: Mapeo de plataforma frontend a enum
console.log('1. Mapeo Frontend → Enum Supabase:');
const testPlatforms = ['youtube', 'icecast', 'arkeo', 'shoutcast', 'direct'];
testPlatforms.forEach(platform => {
  const enumValue = mapPlatformToEnum(platform);
  console.log(`  ${platform} → ${enumValue}`);
});

console.log('\n2. Mapeo Enum Supabase → Frontend:');
const testEnums = ['YOUTUBE', 'ICECAST', 'ARKEO', 'SHOUTCAST', 'HTTP_STREAM'];
testEnums.forEach(enumValue => {
  const platform = mapEnumToPlatform(enumValue);
  console.log(`  ${enumValue} → ${platform}`);
});

console.log('\n3. Prueba de ciclo completo:');
const originalPlatform = 'youtube';
const enumValue = mapPlatformToEnum(originalPlatform);
const recoveredPlatform = mapEnumToPlatform(enumValue);
console.log(`  ${originalPlatform} → ${enumValue} → ${recoveredPlatform}`);
console.log(`  ¿Recuperado correctamente? ${originalPlatform === recoveredPlatform ? '✅ SÍ' : '❌ NO'}`);

console.log('\n4. Prueba con plataforma no mapeada:');
const unknownEnum = 'UNKNOWN_PLATFORM';
const unknownPlatform = mapEnumToPlatform(unknownEnum);
console.log(`  ${unknownEnum} → ${unknownPlatform} (debería ser 'custom')`);

console.log('\n=== FIN DE PRUEBAS ===');
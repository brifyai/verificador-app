// Simulación del flujo completo de actualización de radios

// Funciones de mapeo (copiadas del backend)
const mapPlatformToEnum = (platform) => {
  if (!platform) return 'OTHER';
  const platformMap = {
    youtube: 'YOUTUBE',
    icecast: 'ICECAST',
    arkeo: 'ARKEO',
    shoutcast: 'SHOUTCAST',
    direct: 'HTTP_STREAM',
    rtmp: 'RTMP',
    spotify: 'SPOTIFY',
    soundcloud: 'SOUNDCLOUD',
    facebook: 'FACEBOOK',
    twitch: 'TWITCH',
    custom: 'OTHER'
  };
  return platformMap[platform.toLowerCase()] || 'OTHER';
};

const mapEnumToPlatform = (enumValue) => {
  const reverseMap = {
    'YOUTUBE': 'youtube',
    'TWITCH': 'twitch',
    'FACEBOOK': 'facebook',
    'SPOTIFY': 'spotify',
    'SOUNDCLOUD': 'soundcloud',
    'ICECAST': 'icecast',
    'SHOUTCAST': 'shoutcast',
    'HTTP_STREAM': 'direct',
    'RTMP': 'rtmp',
    'ARKEO': 'arkeo',
    'OTHER': 'custom'
  };
  return reverseMap[enumValue] || 'custom';
};

// Simulación del flujo de actualización
console.log('=== SIMULACIÓN DE FLUJO DE ACTUALIZACIÓN DE RADIO ===\n');

// Paso 1: Datos enviados desde el frontend
const frontendData = {
  name: "Radio Test",
  streamUrl: "http://example.com/stream",
  streamPlatform: "youtube"  // Plataforma seleccionada en el formulario
};

console.log('1. Datos enviados desde el frontend:');
console.log(`   streamPlatform: "${frontendData.streamPlatform}"`);

// Paso 2: Backend mapea la plataforma al enum de Supabase
const platformEnum = mapPlatformToEnum(frontendData.streamPlatform);
console.log(`\n2. Backend mapea a enum de Supabase:`);
console.log(`   "${frontendData.streamPlatform}" → "${platformEnum}"`);

// Paso 3: Simulación de guardado en base de datos (éxito)
const databaseResult = {
  id: 123,
  name: frontendData.name,
  streamUrl: frontendData.streamUrl,
  platform: platformEnum,  // Valor guardado en la BD
  metadata: {
    streamPlatform: frontendData.streamPlatform  // También guardado en metadata
  }
};

console.log(`\n3. Datos guardados en base de datos:`);
console.log(`   platform: "${databaseResult.platform}"`);
console.log(`   metadata.streamPlatform: "${databaseResult.metadata.streamPlatform}"`);

// Paso 4: Backend prepara la respuesta para el frontend
// ANTES (con el bug):
const oldResponse = {
  ...databaseResult,
  streamPlatform: databaseResult.metadata.streamPlatform || databaseResult.platform.toLowerCase()
};

// DESPUÉS (con la corrección):
const newResponse = {
  ...databaseResult,
  streamPlatform: databaseResult.metadata.streamPlatform || mapEnumToPlatform(databaseResult.platform)
};

console.log(`\n4. Respuesta del backend al frontend:`);
console.log(`   ANTES (con bug): streamPlatform = "${oldResponse.streamPlatform}"`);
console.log(`   DESPUÉS (corregido): streamPlatform = "${newResponse.streamPlatform}"`);

// Paso 5: Frontend recibe la respuesta
console.log(`\n5. Resultado final en el frontend:`);
console.log(`   Plataforma esperada: "${frontendData.streamPlatform}"`);
console.log(`   Plataforma recibida (ANTES): "${oldResponse.streamPlatform}" → ${oldResponse.streamPlatform === frontendData.streamPlatform ? '✅ CORRECTO' : '❌ INCORRECTO'}`);
console.log(`   Plataforma recibida (DESPUÉS): "${newResponse.streamPlatform}" → ${newResponse.streamPlatform === frontendData.streamPlatform ? '✅ CORRECTO' : '❌ INCORRECTO'}`);

// Prueba con diferentes plataformas
console.log(`\n=== PRUEBAS CON DIFERENTES PLATAFORMAS ===`);

const testPlatforms = ['icecast', 'arkeo', 'shoutcast', 'direct', 'youtube', 'spotify'];
testPlatforms.forEach(platform => {
  const enumValue = mapPlatformToEnum(platform);
  const oldResult = platform; // metadata.streamPlatform siempre estaría presente
  const newResult = mapEnumToPlatform(enumValue);
  
  console.log(`\nPlataforma: ${platform}`);
  console.log(`  Enum en BD: ${enumValue}`);
  console.log(`  Recuperado (corregido): ${newResult}`);
  console.log(`  ¿Correcto? ${platform === newResult ? '✅' : '❌'}`);
});

console.log(`\n=== CONCLUSIÓN ===`);
console.log(`El problema estaba en que cuando metadata.streamPlatform no estaba presente,`);
console.log(`el código usaba platform.toLowerCase() que convertía 'YOUTUBE' a 'youtube',`);
console.log(`pero 'ICECAST' a 'icecast' (correcto), 'ARKEO' a 'arkeo' (correcto), etc.`);
console.log(`La corrección usa mapEnumToPlatform() para hacer el mapeo inverso correctamente.`);
// Sistema de Mapeo de Plataformas
// Convierte 20+ plataformas del frontend a 20+ valores de BD
// Ahora los valores se almacenan directamente sin reducción

export const PLATFORM_MAPPING_TO_DB: Record<string, string> = {
  // Plataformas Sociales y Video
  'youtube': 'YOUTUBE',
  'twitch': 'TWITCH', 
  'facebook': 'FACEBOOK',
  'spotify': 'SPOTIFY',
  'soundcloud': 'SOUNDCLOUD',
  'mixcloud': 'MIXCLOUD',
  
  // Tecnología Base
    'icecast': 'ICECAST',
    'shoutcast': 'SHOUTCAST',
    'direct': 'HTTP_STREAM',
    'rtmp': 'RTMP',
    'hls': 'HLS',
    'dash': 'DASH',
  
  // Paneles de Control Profesionales
  'centova': 'CENTOVA',
  'sonicpanel': 'SONICPANEL',
  'azuracast': 'AZURACAST',
  'whmsonic': 'WHMSONIC',
  
  // Proveedores Chilenos
  'arkeo': 'ARKEO',
  'creattiva': 'CREATTIVA',
  'visualradio': 'VISUALRADIO',
  'mediaweb': 'MEDIAWEB',
  'digitalproserver': 'DIGITALPROSERVER',
  'tustreaming': 'TUSTREAMING',
  'streaminghd': 'STREAMINGHD',
  'neonetwork': 'NEONETWORK',
  'chiloestreaming': 'CHILOESTREAMING',
  
  // Plataformas de Monetización y Analytics
  'afstream': 'AFSTREAM',
  'mediastream': 'MEDIASTREAM',
  
  // Agregadores
  'tunein': 'TUNEIN',
  
  // Software de Automatización
  'hardata': 'HARDATA',
  'infynystream': 'INFINYSTREAM',
  'radionomy': 'RADIONOMY',
  
  // Proveedores Globales
  'shoutcheap': 'SHOUTCHEAP',
  'yesstreaming': 'YESSTREAMING',
  'streamerr': 'STREAMERR',
  
  // Otros
  'other': 'OTHER'
};

// Mapeo inverso de valores de base de datos a plataformas del frontend
export const PLATFORM_MAPPING_FROM_DB: Record<string, string> = {
  // Plataformas Sociales y Video
  'YOUTUBE': 'youtube',
  'TWITCH': 'twitch',
  'FACEBOOK': 'facebook',
  'SPOTIFY': 'spotify',
  'SOUNDCLOUD': 'soundcloud',
  'MIXCLOUD': 'mixcloud',
  
  // Tecnología Base
    'ICECAST': 'icecast',
    'SHOUTCAST': 'shoutcast',
    'HTTP_STREAM': 'direct',
    'RTMP': 'rtmp',
    'HLS': 'hls',
    'DASH': 'dash',
  
  // Paneles de Control Profesionales
  'CENTOVA': 'centova',
  'SONICPANEL': 'sonicpanel',
  'AZURACAST': 'azuracast',
  'WHMSONIC': 'whmsonic',
  
  // Proveedores Chilenos
  'ARKEO': 'arkeo',
  'CREATTIVA': 'creattiva',
  'VISUALRADIO': 'visualradio',
  'MEDIAWEB': 'mediaweb',
  'DIGITALPROSERVER': 'digitalproserver',
  'TUSTREAMING': 'tustreaming',
  'STREAMINGHD': 'streaminghd',
  'NEONETWORK': 'neonetwork',
  'CHILOESTREAMING': 'chiloestreaming',
  
  // Plataformas de Monetización y Analytics
  'AFSTREAM': 'afstream',
  'MEDIASTREAM': 'mediastream',
  
  // Agregadores
  'TUNEIN': 'tunein',
  
  // Software de Automatización
  'HARDATA': 'hardata',
  'INFINYSTREAM': 'infynystream',
  'RADIONOMY': 'radionomy',
  
  // Proveedores Globales
  'SHOUTCHEAP': 'shoutcheap',
  'YESSTREAMING': 'yesstreaming',
  'STREAMERR': 'streamerr',
  
  // Otros
  'OTHER': 'other'
};

// Plataformas que realmente funcionan en la base de datos (según pruebas)
const ALLOWED_PLATFORMS = [
  'YOUTUBE', 'TWITCH', 'FACEBOOK', 'ICECAST', 'SHOUTCAST',
  'HTTP_STREAM', 'RTMP', 'TUNEIN', 'OTHER'
];

export function mapPlatformToDb(frontendPlatform: string): string {
  const dbPlatform = PLATFORM_MAPPING_TO_DB[frontendPlatform];
  // Solo permitir plataformas que realmente funcionan en la BD
  if (dbPlatform && ALLOWED_PLATFORMS.includes(dbPlatform)) {
    return dbPlatform;
  }
  console.warn(`Plataforma '${frontendPlatform}' no está permitida en la base de datos. Usando 'OTHER'`);
  return 'OTHER';
}

export function mapPlatformFromDb(dbPlatform: string): string {
  const frontendPlatform = PLATFORM_MAPPING_FROM_DB[dbPlatform];
  if (frontendPlatform) {
    return frontendPlatform;
  }
  console.warn(`Plataforma de BD '${dbPlatform}' no tiene mapeo al frontend. Usando 'direct'`);
  return 'direct';
}
/**
 * Sistema de mapeo inteligente para plataformas
 * Maneja las limitaciones de la base de datos guardando plataformas no soportadas en metadata
 */

// Plataformas que la base de datos REALMENTE acepta (basado en enum Platform de Prisma)
export const SUPPORTED_PLATFORMS = [
  // Plataformas Sociales y Video
  'YOUTUBE',
  'TWITCH',
  'FACEBOOK',
  'SPOTIFY',
  'SOUNDCLOUD',
  'MIXCLOUD',
  
  // Tecnología Base
  'ICECAST',
  'SHOUTCAST',
  'HTTP_STREAM',
  'RTMP',
  'HLS',
  'DASH',
  
  // Paneles de Control Profesionales
  'CENTOVA',
  'SONICPANEL',
  'AZURACAST',
  'WHMSONIC',
  
  // Proveedores Chilenos
  'ARKEO',
  'CREATTIVA',
  'VISUALRADIO',
  'MEDIAWEB',
  'DIGITALPROSERVER',
  'TUSTREAMING',
  'STREAMINGHD',
  'NEONETWORK',
  'CHILOESTREAMING',
  
  // Plataformas de Monetización y Analytics
  'AFSTREAM',
  'MEDIASTREAM',
  
  // Agregadores
  'TUNEIN',
  
  // Software de Automatización
  'HARDATA',
  'INFINYSTREAM',
  'RADIONOMY',
  
  // Proveedores Globales
  'SHOUTCHEAP',
  'YESSTREAMING',
  'STREAMERR',
  
  // Otros
  'OTHER'
] as const;

export type SupportedPlatform = typeof SUPPORTED_PLATFORMS[number];

// Mapeo de plataformas del frontend a valores de base de datos
const FRONTEND_TO_DB_MAPPING: Record<string, SupportedPlatform> = {
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
  'http-stream': 'HTTP_STREAM',
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
  'neonetwor': 'NEONETWORK',
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
  
  // Plataformas no soportadas - mapear a OTHER
  'vimeo': 'OTHER',
  'dailymotion': 'OTHER',
  'rumble': 'OTHER',
  'odysee': 'OTHER',
  'bitchute': 'OTHER',
  'direct': 'OTHER',
  'rtsp': 'OTHER',
  'm3u8': 'OTHER',
  'twitch-vod': 'OTHER',
  'facebook-vod': 'OTHER',
  'instagram': 'OTHER',
  'tiktok': 'OTHER',
  'twitter': 'OTHER',
  'linkedin': 'OTHER',
  'snapchat': 'OTHER',
  'reddit': 'OTHER',
  'discord': 'OTHER',
  'telegram': 'OTHER',
  'whatsapp': 'OTHER',
  'signal': 'OTHER',
  'apple-music': 'OTHER',
  'amazon-music': 'OTHER',
  'deezer': 'OTHER',
  'tidal': 'OTHER',
  'pandora': 'OTHER',
  'bandcamp': 'OTHER',
  'hearthis': 'OTHER',
  'radiojavan': 'OTHER',
  'azura': 'OTHER',
  'airtime': 'OTHER',
  'radio-co': 'OTHER',
  'live365': 'OTHER',
  'streema': 'OTHER',
  'iheartradio': 'OTHER',
  'radio-com': 'OTHER',
  'radio-de': 'OTHER',
  'radio-fr': 'OTHER',
  'radio-es': 'OTHER',
  'radio-it': 'OTHER',
  'radio-pt': 'OTHER',
  'radio-nl': 'OTHER',
  'radio-be': 'OTHER',
  'radio-ch': 'OTHER',
  'radio-at': 'OTHER',
  'radio-se': 'OTHER',
  'radio-no': 'OTHER',
  'radio-dk': 'OTHER',
  'radio-fi': 'OTHER',
  'radio-ie': 'OTHER',
  'radio-uk': 'OTHER',
  'other': 'OTHER'
};

// Mapeo inverso de base de datos a frontend
const DB_TO_FRONTEND_MAPPING: Record<SupportedPlatform, string> = {
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
  'HTTP_STREAM': 'http-stream',
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
  'NEONETWORK': 'neonetwor',
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

/**
 * Mapea una plataforma del frontend a un valor de base de datos soportado
 * Si la plataforma no está soportada, usa OTHER y guarda la original en metadata
 */
export function mapPlatformToDbSmart(frontendPlatform: string): {
  platform: SupportedPlatform;
  originalPlatform?: string;
} {
  const normalizedPlatform = frontendPlatform.toLowerCase();
  const dbPlatform = FRONTEND_TO_DB_MAPPING[normalizedPlatform];
  
  if (dbPlatform) {
    // Plataforma soportada por nuestro mapeo
    // Pero necesitamos verificar si está permitida por el constraint de la base de datos
    if (dbPlatform === 'YOUTUBE' || dbPlatform === 'TWITCH') {
      return { platform: dbPlatform };
    } else {
      // Cualquier otra plataforma debe mapearse a OTHER por el constraint
      return {
        platform: 'OTHER',
        originalPlatform: normalizedPlatform
      };
    }
  } else {
    // Plataforma no soportada - usar OTHER y guardar original
    return {
      platform: 'OTHER',
      originalPlatform: normalizedPlatform
    };
  }
}

/**
 * Mapea una plataforma de base de datos al frontend
 * Si viene de metadata una plataforma original, la usa
 */
export function mapPlatformFromDbSmart(
  dbPlatform: string | null | undefined, 
  metadata?: Record<string, any>
): string {
  if (!dbPlatform) {
    return metadata?.stream_platform || 'direct';
  }

  const normalizedDbPlatform = dbPlatform.toUpperCase() as SupportedPlatform;
  
  // Si hay una plataforma original guardada en metadata, usarla
  if (metadata?.original_platform) {
    return metadata.original_platform;
  }
  
  // Si la plataforma de DB está en el mapeo, usarla
  if (DB_TO_FRONTEND_MAPPING[normalizedDbPlatform]) {
    return DB_TO_FRONTEND_MAPPING[normalizedDbPlatform];
  }
  
  // Si es OTHER pero no hay original_platform, usar 'other'
  if (normalizedDbPlatform === 'OTHER') {
    return 'other';
  }
  
  // Fallback a direct
  return 'direct';
}

/**
 * Verifica si una plataforma está soportada por la base de datos
 */
export function isPlatformSupported(platform: string): boolean {
  const normalizedPlatform = platform.toLowerCase();
  const mapped = FRONTEND_TO_DB_MAPPING[normalizedPlatform];
  return mapped !== undefined && mapped !== 'OTHER';
}

/**
 * Obtiene la lista de todas las plataformas del frontend
 */
export function getAllFrontendPlatforms(): string[] {
  return Object.keys(FRONTEND_TO_DB_MAPPING);
}

/**
 * Obtiene solo las plataformas soportadas por la base de datos
 */
export function getSupportedFrontendPlatforms(): string[] {
  return Object.entries(FRONTEND_TO_DB_MAPPING)
    .filter(([_, dbPlatform]) => dbPlatform !== 'OTHER')
    .map(([frontendPlatform, _]) => frontendPlatform);
}
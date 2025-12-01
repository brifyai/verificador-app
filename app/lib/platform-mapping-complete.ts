/**
 * Mapeo COMPLETO de plataformas - Solución híbrida
 * Mantiene todas las plataformas del frontend pero las mapea a las válidas en BD
 */

// Todas las plataformas del frontend (como las quiere el usuario)
export const ALL_FRONTEND_PLATFORMS = [
  'youtube', 'twitch', 'facebook', 'instagram', 'tiktok', 'twitter', 'linkedin',
  'vimeo', 'dailymotion', 'rumble', 'odysee', 'bitchute', 'kick', 'dlive', 'trovo',
  'streamable', 'wistia', 'brightcove', 'jwplayer', 'soundcloud', 'spotify',
  'apple-music', 'amazon-music', 'tidal', 'deezer', 'pandora', 'iheartradio', 'tunein',
  'shoutcast', 'icecast', 'hls', 'dash', 'rtmp', 'rtsp', 'm3u8', 'mp4', 'mp3', 'aac',
  'ogg', 'flac', 'wav', 'm4a', 'direct'
] as const;

export type FrontendPlatform = typeof ALL_FRONTEND_PLATFORMS[number];

// Plataformas que REALMENTE acepta la base de datos (según verify-real-platforms.js)
const VALID_DB_PLATFORMS = [
  'youtube', 'twitch', 'facebook', 'tunein', 'shoutcast', 'icecast', 'rtmp', 'direct'
] as const;

export type ValidDbPlatform = typeof VALID_DB_PLATFORMS[number];

// Mapeo de plataformas del frontend a plataformas válidas de BD
const PLATFORM_NORMALIZATION_MAP: Record<FrontendPlatform, ValidDbPlatform | 'other'> = {
  // Plataformas principales - mapeo directo
  'youtube': 'youtube',
  'twitch': 'twitch',
  'facebook': 'facebook',
  'tunein': 'tunein',
  'shoutcast': 'shoutcast',
  'icecast': 'icecast',
  'rtmp': 'rtmp',
  'direct': 'direct',
  
  // Plataformas sociales -> otras válidas
  'instagram': 'facebook', // Misma categoría social
  'tiktok': 'facebook',    // Misma categoría social
  'twitter': 'facebook',   // Misma categoría social
  'linkedin': 'facebook',  // Misma categoría social
  
  // Plataformas de video -> YouTube (similar)
  'vimeo': 'youtube',
  'dailymotion': 'youtube',
  'rumble': 'youtube',
  'odysee': 'youtube',
  'bitchute': 'youtube',
  'kick': 'youtube',
  'dlive': 'youtube',
  'trovo': 'youtube',
  'streamable': 'youtube',
  'wistia': 'youtube',
  'brightcove': 'youtube',
  'jwplayer': 'youtube',
  
  // Plataformas de audio -> tunein (similar)
  'soundcloud': 'tunein',
  'spotify': 'tunein',
  'apple-music': 'tunein',
  'amazon-music': 'tunein',
  'tidal': 'tunein',
  'deezer': 'tunein',
  'pandora': 'tunein',
  'iheartradio': 'tunein',
  
  // Tecnologías de streaming -> direct (genérico)
  'hls': 'direct',
  'dash': 'direct',
  'rtsp': 'direct',
  'm3u8': 'direct',
  'mp4': 'direct',
  'mp3': 'direct',
  'aac': 'direct',
  'ogg': 'direct',
  'flac': 'direct',
  'wav': 'direct',
  'm4a': 'direct'
};

// Mapeo frontend -> backend (formato de BD)
const FRONTEND_TO_BACKEND_MAP: Record<ValidDbPlatform, string> = {
  'youtube': 'YOUTUBE',
  'twitch': 'TWITCH',
  'facebook': 'FACEBOOK',
  'tunein': 'TUNEIN',
  'shoutcast': 'SHOUTCAST',
  'icecast': 'ICECAST',
  'rtmp': 'RTMP',
  'direct': 'DIRECT'
};

// Mapeo backend -> frontend
const BACKEND_TO_FRONTEND_MAP: Record<string, FrontendPlatform | 'other'> = {
  'YOUTUBE': 'youtube',
  'TWITCH': 'twitch',
  'FACEBOOK': 'facebook',
  'TUNEIN': 'tunein',
  'SHOUTCAST': 'shoutcast',
  'ICECAST': 'icecast',
  'RTMP': 'rtmp',
  'DIRECT': 'direct',
  'OTHER': 'other'
};

/**
 * Convierte cualquier plataforma del frontend a una válida para BD
 * Mantiene la plataforma original en metadata para referencia futura
 */
export function normalizePlatformForDb(platform: FrontendPlatform): {
  dbPlatform: string;
  originalPlatform: FrontendPlatform;
  normalizedTo: ValidDbPlatform | 'other';
} {
  if (!platform) {
    return {
      dbPlatform: 'OTHER',
      originalPlatform: 'direct' as FrontendPlatform,
      normalizedTo: 'other'
    };
  }

  const normalizedPlatform = PLATFORM_NORMALIZATION_MAP[platform] || 'other';
  const dbPlatform = normalizedPlatform === 'other' ? 'OTHER' : FRONTEND_TO_BACKEND_MAP[normalizedPlatform] || 'OTHER';

  return {
    dbPlatform,
    originalPlatform: platform,
    normalizedTo: normalizedPlatform
  };
}

/**
 * Convierte de vuelta de BD al frontend
 * Si fue normalizada, muestra la original desde metadata
 */
export function denormalizePlatformFromDb(
  dbPlatform: string,
  originalPlatform?: FrontendPlatform
): FrontendPlatform | 'other' {
  if (originalPlatform && ALL_FRONTEND_PLATFORMS.includes(originalPlatform)) {
    return originalPlatform;
  }

  const frontendPlatform = BACKEND_TO_FRONTEND_MAP[dbPlatform];
  return frontendPlatform || 'other';
}

/**
 * Verifica si una plataforma es válida en el frontend
 */
export function isValidFrontendPlatform(platform: string): platform is FrontendPlatform {
  return ALL_FRONTEND_PLATFORMS.includes(platform as FrontendPlatform);
}

/**
 * Obtiene todas las plataformas del frontend
 */
export function getAllFrontendPlatforms(): FrontendPlatform[] {
  return [...ALL_FRONTEND_PLATFORMS];
}

/**
 * Obtiene solo las plataformas que funcionan directamente en BD
 */
export function getValidDbPlatforms(): ValidDbPlatform[] {
  return [...VALID_DB_PLATFORMS];
}

/**
 * Obtiene información de normalización para debugging
 */
export function getPlatformNormalizationInfo(platform: FrontendPlatform) {
  const result = normalizePlatformForDb(platform);
  return {
    original: platform,
    normalized: result.normalizedTo,
    dbValue: result.dbPlatform,
    willWorkInDb: result.normalizedTo !== 'other'
  };
}
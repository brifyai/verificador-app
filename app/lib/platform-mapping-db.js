/**
 * Mapeo de plataformas permitidas por la base de datos
 * Basado en los errores de constraint, solo ciertas plataformas están permitidas
 */

// Plataformas que realmente funcionan en la base de datos (según pruebas)
const ALLOWED_PLATFORMS = [
  'YOUTUBE',
  'TWITCH', 
  'FACEBOOK',
  'ICECAST',
  'SHOUTCAST',
  'HTTP_STREAM',  // Esto es "direct" en el frontend
  'RTMP',
  'TUNEIN',
  'OTHER'
];

// Mapeo frontend -> backend (solo plataformas permitidas)
const FRONTEND_TO_DB = {
  'youtube': 'YOUTUBE',
  'twitch': 'TWITCH',
  'facebook': 'FACEBOOK',
  'icecast': 'ICECAST',
  'shoutcast': 'SHOUTCAST',
  'direct': 'HTTP_STREAM',  // Mapeo especial
  'rtmp': 'RTMP',
  'tunein': 'TUNEIN',
  'other': 'OTHER'
};

// Mapeo backend -> frontend
const DB_TO_FRONTEND = {
  'YOUTUBE': 'youtube',
  'TWITCH': 'twitch',
  'FACEBOOK': 'facebook',
  'ICECAST': 'icecast',
  'SHOUTCAST': 'shoutcast',
  'HTTP_STREAM': 'direct',  // Mapeo especial inverso
  'RTMP': 'rtmp',
  'TUNEIN': 'tunein',
  'OTHER': 'other'
};

/**
 * Convierte plataforma del frontend a formato de base de datos
 * Solo permite plataformas que realmente funcionan
 */
function frontendToDbPlatform(frontendPlatform) {
  const dbPlatform = FRONTEND_TO_DB[frontendPlatform];
  if (!dbPlatform) {
    console.warn(`Plataforma '${frontendPlatform}' no está permitida en la base de datos. Usando 'OTHER'`);
    return 'OTHER';
  }
  return dbPlatform;
}

/**
 * Convierte plataforma de la base de datos a formato del frontend
 */
function dbToFrontendPlatform(dbPlatform) {
  const frontendPlatform = DB_TO_FRONTEND[dbPlatform];
  if (!frontendPlatform) {
    console.warn(`Plataforma de BD '${dbPlatform}' no tiene mapeo al frontend. Usando 'other'`);
    return 'other';
  }
  return frontendPlatform;
}

/**
 * Verifica si una plataforma del frontend está permitida en la base de datos
 */
function isPlatformAllowed(frontendPlatform) {
  return frontendPlatform in FRONTEND_TO_DB;
}

/**
 * Obtiene lista de plataformas permitidas para el frontend
 */
function getAllowedFrontendPlatforms() {
  return Object.keys(FRONTEND_TO_DB);
}

module.exports = {
  frontendToDbPlatform,
  dbToFrontendPlatform,
  isPlatformAllowed,
  getAllowedFrontendPlatforms,
  ALLOWED_PLATFORMS,
  FRONTEND_TO_DB,
  DB_TO_FRONTEND
};
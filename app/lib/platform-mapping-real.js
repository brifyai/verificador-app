/**
 * Mapeo REAL de plataformas - Solo incluye las que la base de datos acepta
 * Basado en los resultados de verify-real-platforms.js
 */

// Plataformas que REALMENTE funcionan en la base de datos
const PLATFORMAS_VALIDAS = [
  'youtube',
  'twitch', 
  'facebook',
  'tunein',
  'shoutcast',
  'icecast',
  'rtmp',
  'direct'
];

// Mapeo frontend -> backend (solo plataformas válidas)
const FRONTEND_TO_BACKEND = {
  'youtube': 'YOUTUBE',
  'twitch': 'TWITCH',
  'facebook': 'FACEBOOK',
  'tunein': 'TUNEIN',
  'shoutcast': 'SHOUTCAST',
  'icecast': 'ICECAST',
  'rtmp': 'RTMP',
  'direct': 'DIRECT'
};

// Mapeo backend -> frontend (solo plataformas válidas)
const BACKEND_TO_FRONTEND = {
  'YOUTUBE': 'youtube',
  'TWITCH': 'twitch',
  'FACEBOOK': 'facebook',
  'TUNEIN': 'tunein',
  'SHOUTCAST': 'shoutcast',
  'ICECAST': 'icecast',
  'RTMP': 'rtmp',
  'DIRECT': 'direct',
  'OTHER': 'other' // Para plataformas no válidas que ya están en la BD
};

/**
 * Convierte plataforma del frontend al backend
 * Si no es válida, retorna 'OTHER'
 */
function mapFrontendToBackend(platform) {
  if (!platform) return 'OTHER';
  
  const normalizedPlatform = platform.toLowerCase();
  
  if (PLATFORMAS_VALIDAS.includes(normalizedPlatform)) {
    return FRONTEND_TO_BACKEND[normalizedPlatform] || 'OTHER';
  }
  
  console.log(`Plataforma '${platform}' no está permitida en la base de datos. Usando 'OTHER'`);
  return 'OTHER';
}

/**
 * Convierte plataforma del backend al frontend
 */
function mapBackendToFrontend(platform) {
  if (!platform) return 'other';
  
  const normalizedPlatform = platform.toUpperCase();
  return BACKEND_TO_FRONTEND[normalizedPlatform] || 'other';
}

/**
 * Verifica si una plataforma es válida
 */
function isValidPlatform(platform) {
  if (!platform) return false;
  return PLATFORMAS_VALIDAS.includes(platform.toLowerCase());
}

/**
 * Obtiene lista de plataformas válidas
 */
function getValidPlatforms() {
  return [...PLATFORMAS_VALIDAS];
}

module.exports = {
  mapFrontendToBackend,
  mapBackendToFrontend,
  isValidPlatform,
  getValidPlatforms,
  PLATFORMAS_VALIDAS
};
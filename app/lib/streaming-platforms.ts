
// Utilidades para manejo de diferentes plataformas de streaming

export interface PlatformConfig {
  name: string;
  description: string;
  urlPattern: RegExp;
  extractId: (url: string) => string | null;
  embedUrl?: (id: string) => string;
  apiSupport?: boolean;
  requiresAuth?: boolean;
}

export const STREAMING_PLATFORMS: Record<string, PlatformConfig> = {
  // Plataformas Sociales y Video
  youtube: {
    name: 'YouTube',
    description: 'Transmisión en vivo de YouTube',
    urlPattern: /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
    extractId: (url) => {
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
      return match ? match[1] : null;
    },
    embedUrl: (id) => `https://www.youtube.com/embed/${id}`,
    apiSupport: true,
    requiresAuth: false
  },
  
  twitch: {
    name: 'Twitch',
    description: 'Stream de Twitch',
    urlPattern: /twitch\.tv\/([a-zA-Z0-9_]+)/,
    extractId: (url) => {
      const match = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
      return match ? match[1] : null;
    },
    embedUrl: (id) => `https://player.twitch.tv/?channel=${id}&parent=localhost`,
    apiSupport: true,
    requiresAuth: false
  },
  
  facebook: {
    name: 'Facebook Live',
    description: 'Transmisión de Facebook',
    urlPattern: /facebook\.com\/([^\/]+)\/live/,
    extractId: (url) => {
      const match = url.match(/facebook\.com\/([^\/]+)\/live/);
      return match ? match[1] : null;
    },
    apiSupport: false,
    requiresAuth: true
  },
  
  instagram: {
    name: 'Instagram Live',
    description: 'Live de Instagram',
    urlPattern: /instagram\.com\/([^\/]+)\/live/,
    extractId: (url) => {
      const match = url.match(/instagram\.com\/([^\/]+)\/live/);
      return match ? match[1] : null;
    },
    apiSupport: false,
    requiresAuth: true
  },
  
  tiktok: {
    name: 'TikTok Live',
    description: 'Transmisión de TikTok',
    urlPattern: /tiktok\.com\/@([^\/]+)\/live/,
    extractId: (url) => {
      const match = url.match(/tiktok\.com\/@([^\/]+)\/live/);
      return match ? match[1] : null;
    },
    apiSupport: false,
    requiresAuth: true
  },
  
  spotify: {
    name: 'Spotify',
    description: 'Podcast o show de Spotify',
    urlPattern: /spotify\.com\/show\/([a-zA-Z0-9]+)/,
    extractId: (url) => {
      const match = url.match(/spotify\.com\/show\/([a-zA-Z0-9]+)/);
      return match ? match[1] : null;
    },
    embedUrl: (id) => `https://open.spotify.com/embed/show/${id}`,
    apiSupport: true,
    requiresAuth: true
  },
  
  soundcloud: {
    name: 'SoundCloud',
    description: 'Stream de SoundCloud',
    urlPattern: /soundcloud\.com\/([^\/]+)\/([^\/]+)/,
    extractId: (url) => {
      const match = url.match(/soundcloud\.com\/([^\/]+)\/([^\/]+)/);
      return match ? `${match[1]}/${match[2]}` : null;
    },
    apiSupport: true,
    requiresAuth: false
  },
  
  mixcloud: {
    name: 'Mixcloud',
    description: 'Show de Mixcloud',
    urlPattern: /mixcloud\.com\/([^\/]+)\/([^\/]+)/,
    extractId: (url) => {
      const match = url.match(/mixcloud\.com\/([^\/]+)\/([^\/]+)/);
      return match ? `${match[1]}/${match[2]}` : null;
    },
    embedUrl: (id) => `https://www.mixcloud.com/widget/iframe/?hide_cover=1&feed=${encodeURIComponent(`/${id}/`)}`,
    apiSupport: true,
    requiresAuth: false
  },
  
  icecast: {
    name: 'Icecast/Shoutcast',
    description: 'Servidor Icecast o Shoutcast',
    urlPattern: /https?:\/\/[^\/]+:[0-9]+\//,
    extractId: (url) => url,
    apiSupport: false,
    requiresAuth: false
  },
  
  direct: {
    name: 'Stream Directo',
    description: 'URL directa de audio',
    urlPattern: /https?:\/\/.+\.(mp3|aac|ogg|m3u8|pls)/i,
    extractId: (url) => url,
    apiSupport: false,
    requiresAuth: false
  },
  
  // Paneles de Control y Streaming Profesional
  centova: {
    name: 'Centova Cast',
    description: 'Panel de control profesional para streaming',
    urlPattern: /centova\.[^\/]+.*\/stream/i,
    extractId: (url) => url,
    apiSupport: true,
    requiresAuth: false
  },

  sonicpanel: {
    name: 'SonicPanel',
    description: 'Panel de control interactivo para radio',
    urlPattern: /sonic[^\/]*\.[^\/]+/i,
    extractId: (url) => url,
    apiSupport: true,
    requiresAuth: false
  },

  azuracast: {
    name: 'AzuraCast',
    description: 'Suite de gestión open source todo-en-uno',
    urlPattern: /azura[^\/]*\.[^\/]+/i,
    extractId: (url) => url,
    apiSupport: true,
    requiresAuth: false
  },

  whmsonic: {
    name: 'WHMSonic',
    description: 'Plugin de streaming para cPanel/WHM',
    urlPattern: /whmsonic|cpanel.*stream/i,
    extractId: (url) => url,
    apiSupport: true,
    requiresAuth: false
  },

  // Proveedores Chilenos Especializados
  arkeo: {
    name: 'Arkeo Streaming',
    description: 'Proveedor chileno con app Android incluida',
    urlPattern: /arkeo[^\/]*\.[^\/]+/i,
    extractId: (url) => url,
    apiSupport: true,
    requiresAuth: false
  },

  creattiva: {
    name: 'Creattiva Datacenter',
    description: 'Datacenter chileno para radios de alto tráfico',
    urlPattern: /creattiva[^\/]*\.[^\/]+/i,
    extractId: (url) => url,
    apiSupport: true,
    requiresAuth: false
  },

  visualradio: {
    name: 'Visual Radio',
    description: 'Solución integral desde Temuco',
    urlPattern: /visual.*radio[^\/]*\.[^\/]+/i,
    extractId: (url) => url,
    apiSupport: true,
    requiresAuth: false
  },

  mediaweb: {
    name: 'Mediaweb Chile',
    description: 'Reproductor propio y grabación automática',
    urlPattern: /mediaweb[^\/]*\.[^\/]+/i,
    extractId: (url) => url,
    apiSupport: true,
    requiresAuth: false
  },

  digitalproserver: {
    name: 'Digitalproserver',
    description: 'Infraestructura para radios informativas',
    urlPattern: /digitalproserver[^\/]*\.[^\/]+/i,
    extractId: (url) => url,
    apiSupport: true,
    requiresAuth: false
  },

  tustreaming: {
    name: 'Tu Streaming',
    description: 'Proveedor con soporte en video tutoriales',
    urlPattern: /tustreaming[^\/]*\.[^\/]+|tu.*streaming[^\/]*\.[^\/]+/i,
    extractId: (url) => url,
    apiSupport: true,
    requiresAuth: false
  },

  streaminghd: {
    name: 'StreamingHD',
    description: 'Proveedor premium con AWS/Oracle',
    urlPattern: /streaminghd[^\/]*\.[^\/]+|streaming.*hd[^\/]*\.[^\/]+/i,
    extractId: (url) => url,
    apiSupport: true,
    requiresAuth: false
  },

  neonetwork: {
    name: 'NeoNetwork',
    description: 'Proveedor regional con Centova Cast',
    urlPattern: /neonetwork[^\/]*\.[^\/]+/i,
    extractId: (url) => url,
    apiSupport: true,
    requiresAuth: false
  },

  chiloestreaming: {
    name: 'Chiloé Streaming',
    description: 'Proveedor hiperlocal para el archipiélago',
    urlPattern: /chiloe.*streaming[^\/]*\.[^\/]+/i,
    extractId: (url) => url,
    apiSupport: true,
    requiresAuth: false
  },

  // Plataformas de Monetización y Analytics
  afstream: {
    name: 'AF Stream',
    description: 'Inserción de publicidad y Audiometrix',
    urlPattern: /afstream[^\/]*\.[^\/]+|af.*stream[^\/]*\.[^\/]+/i,
    extractId: (url) => url,
    apiSupport: true,
    requiresAuth: true
  },

  mediastream: {
    name: 'Mediastream',
    description: 'Plataforma end-to-end para conglomerados',
    urlPattern: /mediastream[^\/]*\.[^\/]+|media.*stream[^\/]*\.[^\/]+/i,
    extractId: (url) => url,
    apiSupport: true,
    requiresAuth: true
  },

  // Agregadores y Distribución
  tunein: {
    name: 'TuneIn',
    description: 'Agregador internacional de radio',
    urlPattern: /tunein\.com/i,
    extractId: (url) => {
      const match = url.match(/tunein\.com\/radio\/([^\/]+)/);
      return match ? match[1] : url;
    },
    apiSupport: true,
    requiresAuth: false
  },

  // Tecnologías de Automatización
  hardata: {
    name: 'Hardata AutoDJ',
    description: 'Software de automatización profesional',
    urlPattern: /hardata[^\/]*\.[^\/]+/i,
    extractId: (url) => url,
    apiSupport: true,
    requiresAuth: false
  },

  infinystream: {
    name: 'InfinyStream',
    description: 'DVR para radio (pausar, retroceder)',
    urlPattern: /infiny.*stream[^\/]*\.[^\/]+/i,
    extractId: (url) => url,
    apiSupport: true,
    requiresAuth: false
  },

  // Radionomy (propietario de Shoutcast)
  radionomy: {
    name: 'Radionomy',
    description: 'Plataforma global propietaria de Shoutcast',
    urlPattern: /radionomy[^\/]*\.[^\/]+/i,
    extractId: (url) => url,
    apiSupport: true,
    requiresAuth: true
  },

  // Proveedores Globales Económicos
  shoutcheap: {
    name: 'Shoutcheap',
    description: 'Hosting global económico para Shoutcast/Icecast',
    urlPattern: /shoutcheap[^\/]*\.[^\/]+/i,
    extractId: (url) => url,
    apiSupport: false,
    requiresAuth: false
  },

  yesstreaming: {
    name: 'YesStreaming',
    description: 'Proveedor global de hosting de radio',
    urlPattern: /yesstreaming[^\/]*\.[^\/]+/i,
    extractId: (url) => url,
    apiSupport: false,
    requiresAuth: false
  },

  streamerr: {
    name: 'Streamerr',
    description: 'Proveedor internacional de streaming',
    urlPattern: /streamerr[^\/]*\.[^\/]+/i,
    extractId: (url) => url,
    apiSupport: false,
    requiresAuth: false
  },

  custom: {
    name: 'Plataforma Propia',
    description: 'Player o plataforma personalizada',
    urlPattern: /.+/,
    extractId: (url) => url,
    apiSupport: false,
    requiresAuth: false
  }
};

// Función para detectar automáticamente la plataforma desde una URL
export function detectPlatform(url: string): string | null {
  for (const [platform, config] of Object.entries(STREAMING_PLATFORMS)) {
    if (config.urlPattern.test(url)) {
      return platform;
    }
  }
  return null;
}

// Función para validar URL según la plataforma
export function validatePlatformUrl(platform: string, url: string): boolean {
  const config = STREAMING_PLATFORMS[platform];
  if (!config) return false;
  
  return config.urlPattern.test(url);
}

// Función para extraer información de la URL
export function extractPlatformData(platform: string, url: string): Record<string, string> | null {
  const config = STREAMING_PLATFORMS[platform];
  if (!config) return null;
  
  const id = config.extractId(url);
  if (!id) return null;
  
  const data: Record<string, string> = {};
  
  switch (platform) {
    case 'youtube':
      data.embedId = id;
      data.channelId = ''; // Se puede extraer del API de YouTube
      break;
    case 'twitch':
      data.channelId = id;
      break;
    case 'facebook':
    case 'instagram':
    case 'tiktok':
      data.userId = id;
      break;
    case 'spotify':
      data.showId = id;
      break;
    case 'soundcloud':
    case 'mixcloud':
      data.trackId = id;
      break;
    default:
      data.url = url;
  }
  
  return data;
}

// Función para generar URL embebida si está soportada
export function getEmbedUrl(platform: string, id: string): string | null {
  const config = STREAMING_PLATFORMS[platform];
  if (!config || !config.embedUrl) return null;
  
  return config.embedUrl(id);
}

// Capacidades de monitoreo por plataforma
export const MONITORING_CAPABILITIES = {
  // Plataformas Sociales y Video
  youtube: {
    audioCapture: true,
    apiAccess: true,
    realTimeMetrics: true,
    chatMonitoring: true,
    viewerCount: true,
    monetization: true,
    autoDJ: false
  },
  twitch: {
    audioCapture: true,
    apiAccess: true,
    realTimeMetrics: true,
    chatMonitoring: true,
    viewerCount: true,
    monetization: true,
    autoDJ: false
  },
  facebook: {
    audioCapture: false, // Requiere autorización especial
    apiAccess: true,
    realTimeMetrics: false,
    chatMonitoring: false,
    viewerCount: false,
    monetization: false,
    autoDJ: false
  },
  instagram: {
    audioCapture: false,
    apiAccess: false,
    realTimeMetrics: false,
    chatMonitoring: false,
    viewerCount: false,
    monetization: false,
    autoDJ: false
  },
  tiktok: {
    audioCapture: false,
    apiAccess: false,
    realTimeMetrics: false,
    chatMonitoring: false,
    viewerCount: false,
    monetization: false,
    autoDJ: false
  },
  spotify: {
    audioCapture: false, // Solo para partners
    apiAccess: true,
    realTimeMetrics: false,
    chatMonitoring: false,
    viewerCount: false,
    monetization: false,
    autoDJ: false
  },
  soundcloud: {
    audioCapture: true,
    apiAccess: true,
    realTimeMetrics: true,
    chatMonitoring: false,
    viewerCount: true,
    monetization: false,
    autoDJ: false
  },
  mixcloud: {
    audioCapture: true,
    apiAccess: true,
    realTimeMetrics: true,
    chatMonitoring: false,
    viewerCount: true,
    monetization: false,
    autoDJ: false
  },
  
  // Tecnología Base
  icecast: {
    audioCapture: true,
    apiAccess: true,
    realTimeMetrics: true,
    chatMonitoring: false,
    viewerCount: true,
    monetization: false,
    autoDJ: true
  },
  direct: {
    audioCapture: true,
    apiAccess: false,
    realTimeMetrics: false,
    chatMonitoring: false,
    viewerCount: false,
    monetization: false,
    autoDJ: false
  },
  
  // Paneles de Control Profesionales
  centova: {
    audioCapture: true,
    apiAccess: true,
    realTimeMetrics: true,
    chatMonitoring: false,
    viewerCount: true,
    monetization: true,
    autoDJ: true
  },
  sonicpanel: {
    audioCapture: true,
    apiAccess: true,
    realTimeMetrics: true,
    chatMonitoring: false,
    viewerCount: true,
    monetization: false,
    autoDJ: true
  },
  azuracast: {
    audioCapture: true,
    apiAccess: true,
    realTimeMetrics: true,
    chatMonitoring: false,
    viewerCount: true,
    monetization: false,
    autoDJ: true
  },
  whmsonic: {
    audioCapture: true,
    apiAccess: true,
    realTimeMetrics: true,
    chatMonitoring: false,
    viewerCount: true,
    monetization: false,
    autoDJ: true
  },
  
  // Proveedores Chilenos - Capacidades Premium
  arkeo: {
    audioCapture: true,
    apiAccess: true,
    realTimeMetrics: true,
    chatMonitoring: false,
    viewerCount: true,
    monetization: false,
    autoDJ: true
  },
  creattiva: {
    audioCapture: true,
    apiAccess: true,
    realTimeMetrics: true,
    chatMonitoring: false,
    viewerCount: true,
    monetization: false,
    autoDJ: true
  },
  visualradio: {
    audioCapture: true,
    apiAccess: true,
    realTimeMetrics: true,
    chatMonitoring: false,
    viewerCount: true,
    monetization: false,
    autoDJ: true
  },
  mediaweb: {
    audioCapture: true,
    apiAccess: true,
    realTimeMetrics: true,
    chatMonitoring: false,
    viewerCount: true,
    monetization: false,
    autoDJ: true
  },
  digitalproserver: {
    audioCapture: true,
    apiAccess: true,
    realTimeMetrics: true,
    chatMonitoring: false,
    viewerCount: true,
    monetization: false,
    autoDJ: true
  },
  tustreaming: {
    audioCapture: true,
    apiAccess: true,
    realTimeMetrics: true,
    chatMonitoring: false,
    viewerCount: true,
    monetization: false,
    autoDJ: true
  },
  streaminghd: {
    audioCapture: true,
    apiAccess: true,
    realTimeMetrics: true,
    chatMonitoring: false,
    viewerCount: true,
    monetization: false,
    autoDJ: true
  },
  neonetwork: {
    audioCapture: true,
    apiAccess: true,
    realTimeMetrics: true,
    chatMonitoring: false,
    viewerCount: true,
    monetization: false,
    autoDJ: true
  },
  chiloestreaming: {
    audioCapture: true,
    apiAccess: true,
    realTimeMetrics: true,
    chatMonitoring: false,
    viewerCount: true,
    monetization: false,
    autoDJ: true
  },
  
  // Plataformas de Monetización Avanzada
  afstream: {
    audioCapture: true,
    apiAccess: true,
    realTimeMetrics: true,
    chatMonitoring: false,
    viewerCount: true,
    monetization: true, // Su especialidad
    autoDJ: true
  },
  mediastream: {
    audioCapture: true,
    apiAccess: true,
    realTimeMetrics: true,
    chatMonitoring: false,
    viewerCount: true,
    monetization: true,
    autoDJ: true
  },
  
  // Agregadores
  tunein: {
    audioCapture: false, // Solo distribución
    apiAccess: true,
    realTimeMetrics: true,
    chatMonitoring: false,
    viewerCount: true,
    monetization: false,
    autoDJ: false
  },
  
  // Software de Automatización
  hardata: {
    audioCapture: true,
    apiAccess: true,
    realTimeMetrics: true,
    chatMonitoring: false,
    viewerCount: false,
    monetization: false,
    autoDJ: true
  },
  infinystream: {
    audioCapture: true,
    apiAccess: true,
    realTimeMetrics: true,
    chatMonitoring: false,
    viewerCount: true,
    monetization: false,
    autoDJ: true
  },
  radionomy: {
    audioCapture: true,
    apiAccess: true,
    realTimeMetrics: true,
    chatMonitoring: false,
    viewerCount: true,
    monetization: true,
    autoDJ: true
  },
  
  // Proveedores Globales Básicos
  shoutcheap: {
    audioCapture: true,
    apiAccess: false,
    realTimeMetrics: false,
    chatMonitoring: false,
    viewerCount: false,
    monetization: false,
    autoDJ: true
  },
  yesstreaming: {
    audioCapture: true,
    apiAccess: false,
    realTimeMetrics: false,
    chatMonitoring: false,
    viewerCount: false,
    monetization: false,
    autoDJ: true
  },
  streamerr: {
    audioCapture: true,
    apiAccess: false,
    realTimeMetrics: false,
    chatMonitoring: false,
    viewerCount: false,
    monetization: false,
    autoDJ: true
  },
  
  custom: {
    audioCapture: false, // Depende de la implementación
    apiAccess: false,
    realTimeMetrics: false,
    chatMonitoring: false,
    viewerCount: false,
    monetization: false,
    autoDJ: false
  }
};

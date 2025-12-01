/**
 * Utilidad para verificar el estado de los streams de radio
 */

export type StreamType =
  | 'HLS'
  | 'DASH'
  | 'DIRECT'
  | 'ICECAST'
  | 'SHOUTCAST'
  | 'YOUTUBE'
  | 'TWITCH'
  | 'FACEBOOK'
  | 'ZENO'
  | 'TUNZILLA'
  | 'OTHER'
  | 'CLOUDFLARE';

export interface StreamVerificationResult {
  status: 'ONLINE' | 'OFFLINE' | 'EXTERNAL';
  details: string;
  streamType: StreamType;
  httpStatus?: number;
  contentType?: string;
  usedProxy: boolean;
  method: 'HEAD' | 'GET' | 'RANGE' | 'NONE';
  sslError?: boolean;
  sslErrorFixed?: boolean;
  cloudflareProtected?: boolean;
  cloudflareRay?: string;
}

/**
 * Detecta el tipo de stream y también si está protegido por Cloudflare
 */
function detectStreamType(url: string): StreamType {
  const u = url.toLowerCase();
  if (u.includes('.m3u8') || u.includes('/hls/')) return 'HLS';
  if (u.includes('.mpd')) return 'DASH';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'YOUTUBE';
  if (u.includes('twitch.tv')) return 'TWITCH';
  if (u.includes('facebook.com')) return 'FACEBOOK';
  if (u.includes('shoutcast') || u.includes(':8080')) return 'SHOUTCAST';
  if (u.includes('icecast') || u.includes(':8000')) return 'ICECAST';
  if (u.includes('zeno.fm')) return 'ZENO';
  if (u.includes('tunzilla.com')) return 'TUNZILLA';
  if (u.includes('cloudflare') || u.includes('conectaapp.cl')) return 'CLOUDFLARE';
  if (u.startsWith('http://') || u.startsWith('https://')) return 'DIRECT';
  return 'OTHER';
}

/**
 * Detecta si una respuesta HTTP está protegida por Cloudflare
 */
function detectCloudflare(response: Response): {
  isCloudflare: boolean;
  cfRay?: string;
  hasCloudflareHeaders: boolean;
} {
  const headers = response.headers;
  
  // Headers característicos de Cloudflare
  const cloudflareHeaders = [
    'cf-ray',
    'cf-cache-status',
    'cf-connecting-ip',
    'cf-visitor',
    'cf-warp-tag'
  ];
  
  // Verificar headers de Cloudflare
  const hasCloudflareHeaders = cloudflareHeaders.some(header =>
    headers.get(header) !== null
  );
  
  // Verificar server header
  const serverHeader = headers.get('server') || '';
  const isCloudflareServer = serverHeader.toLowerCase().includes('cloudflare');
  
  const isCloudflare = hasCloudflareHeaders || isCloudflareServer;
  const cfRay = headers.get('cf-ray') || undefined;
  
  return {
    isCloudflare,
    cfRay,
    hasCloudflareHeaders
  };
}

async function fetchWithTimeout(resource: string, init: RequestInit & { timeout?: number } = {}) {
  const { timeout = 10000, ...rest } = init;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(resource, { ...rest, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Intenta fetch con manejo de errores SSL
 */
async function fetchWithSSLHandling(resource: string, init: RequestInit & { timeout?: number; ignoreSSLErrors?: boolean } = {}) {
  const { timeout = 10000, ignoreSSLErrors = false, ...rest } = init;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const fetchOptions: any = { ...rest, signal: controller.signal };
    
    // Si hay errores SSL, intentar con agente HTTPS personalizado
    if (ignoreSSLErrors) {
      try {
        const https = require('https');
        const agent = new https.Agent({
          rejectUnauthorized: false,
          secureOptions: require('crypto').constants.SSL_OP_LEGACY_SERVER_CONNECT
        });
        fetchOptions.agent = agent;
      } catch (e) {
        // Si no podemos crear el agente, continuar sin él
      }
    }
    
    const res = await fetch(resource, fetchOptions);
    return { response: res, sslError: false, sslErrorFixed: false };
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || '';
    
    // Detectar errores SSL comunes
    const isSSLError = errorMessage.includes('UNABLE_TO_VERIFY_LEAF_SIGNATURE') ||
                      errorMessage.includes('unable to verify the first certificate') ||
                      errorMessage.includes('certificate') ||
                      errorMessage.includes('SSL') ||
                      errorMessage.includes('TLS');
    
    if (isSSLError && !ignoreSSLErrors) {
      // Reintentar con SSL deshabilitado
      let newId: NodeJS.Timeout | undefined;
      try {
        clearTimeout(id);
        const newController = new AbortController();
        newId = setTimeout(() => newController.abort(), timeout);
        
        const fetchOptions: any = { ...rest, signal: newController.signal };
        
        try {
          const https = require('https');
          const agent = new https.Agent({
            rejectUnauthorized: false,
            secureOptions: require('crypto').constants.SSL_OP_LEGACY_SERVER_CONNECT
          });
          fetchOptions.agent = agent;
        } catch (e) {
          // Si no podemos crear el agente, continuar sin él
        }
        
        const res = await fetch(resource, fetchOptions);
        if (newId) clearTimeout(newId);
        return { response: res, sslError: true, sslErrorFixed: true };
      } catch (retryError: any) {
        if (newId) clearTimeout(newId);
        return { error: retryError, sslError: true, sslErrorFixed: false };
      }
    }
    
    return { error, sslError: isSSLError, sslErrorFixed: false };
  } finally {
    clearTimeout(id);
  }
}

/**
 * Verificación unificada inspirada en la heurística del reproductor.
 * Notas:
 * - Ejecuta en servidor: no requiere proxy para CORS, pero respeta Range y headers ICY.
 */
export async function verifyStreamStatus(streamUrl: string): Promise<StreamVerificationResult> {
  try {
    if (!streamUrl || streamUrl.trim() === '') {
      return { status: 'OFFLINE', details: 'URL de stream vacía o inválida', streamType: 'OTHER', usedProxy: false, method: 'NONE' };
    }

    const streamType = detectStreamType(streamUrl);
    
    // Para streams problemáticos como Digital FM Arica, usar verificación legacy directa
    if (streamUrl.includes('digitalfm.cl:8000') || streamUrl.includes(':8000/arica')) {
      try {
        const { verifyStreamLegacy } = require('./stream-verifier-legacy');
        const legacyResult = await verifyStreamLegacy(streamUrl, streamType);
        return {
          status: legacyResult.status,
          details: legacyResult.details,
          streamType: streamType,
          httpStatus: legacyResult.httpStatus,
          contentType: legacyResult.contentType,
          usedProxy: false,
          method: 'HEAD',
          sslError: legacyResult.sslError,
          sslErrorFixed: legacyResult.sslErrorFixed
        };
      } catch (legacyError) {
        console.log('⚠️ Error en verificación legacy, continuando con verificación normal');
      }
    }

    // Plataformas externas (se reproducen fuera del sitio)
    if (streamType === 'YOUTUBE' || streamType === 'TWITCH' || streamType === 'FACEBOOK') {
      return { status: 'EXTERNAL', details: 'Plataforma externa', streamType, usedProxy: false, method: 'NONE' };
    }

    // Cloudflare protegido: intentar verificación con headers de navegador
    if (streamType === 'CLOUDFLARE') {
      return await verifyCloudflareProtectedStream(streamUrl);
    }

    // Zeno.fm: intentar verificación especial ya que muchos no responden bien a HEAD
    if (streamType === 'ZENO') {
      // Intentar HEAD primero, pero con mayor tolerancia a errores
      try {
        const headResult = await fetchWithSSLHandling(streamUrl, {
          method: 'HEAD',
          headers: { 'User-Agent': 'OndaVerificada-StreamVerifier/1.0' },
          timeout: 10000,
        });
        
        if (headResult.response) {
          const head = headResult.response;
          if (head.ok || head.status === 302) { // Zeno.fm a menudo devuelve 302 redirects
            const ctype = head.headers.get('content-type') || undefined;
            return {
              status: 'ONLINE',
              details: `Zeno.fm disponible (HTTP ${head.status})${headResult.sslErrorFixed ? ' [SSL arreglado]' : ''}`,
              streamType,
              httpStatus: head.status,
              contentType: ctype,
              usedProxy: false,
              method: 'HEAD',
              sslError: headResult.sslError,
              sslErrorFixed: headResult.sslErrorFixed
            };
          }
        }
      } catch (e) {
        console.log('⚠️ HEAD falló para Zeno.fm, intentando GET...');
      }

      // Fallback: GET con rango mínimo
      try {
        const getResult = await fetchWithSSLHandling(streamUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'OndaVerificada-StreamVerifier/1.0',
            'Range': 'bytes=0-0',
            'Accept': 'audio/*, */*',
          },
          timeout: 15000, // Timeout más largo para Zeno.fm
        });
        
        if (getResult.response) {
          const get = getResult.response;
          const ctype = get.headers.get('content-type') || undefined;
          if (get.ok || get.status === 206 || get.status === 302) {
            return {
              status: 'ONLINE',
              details: `Zeno.fm accesible (HTTP ${get.status})${getResult.sslErrorFixed ? ' [SSL arreglado]' : ''}`,
              streamType,
              httpStatus: get.status,
              contentType: ctype,
              usedProxy: false,
              method: 'RANGE',
              sslError: getResult.sslError,
              sslErrorFixed: getResult.sslErrorFixed
            };
          }
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') {
          return { status: 'OFFLINE', details: 'Timeout Zeno.fm (15s)', streamType, usedProxy: false, method: 'RANGE' };
        }
      }
    }

    // Tunzilla: intentar verificación especial ya que no responde bien a HEAD
    if (streamType === 'TUNZILLA') {
      // Intentar HEAD primero, pero con mayor tolerancia a errores
      try {
        const headResult = await fetchWithSSLHandling(streamUrl, {
          method: 'HEAD',
          headers: { 'User-Agent': 'OndaVerificada-StreamVerifier/1.0' },
          timeout: 10000,
        });
        
        if (headResult.response) {
          const head = headResult.response;
          if (head.ok || head.status === 302) { // Tunzilla a menudo devuelve 302 redirects
            const ctype = head.headers.get('content-type') || undefined;
            return {
              status: 'ONLINE',
              details: `Tunzilla disponible (HTTP ${head.status})${headResult.sslErrorFixed ? ' [SSL arreglado]' : ''}`,
              streamType,
              httpStatus: head.status,
              contentType: ctype,
              usedProxy: false,
              method: 'HEAD',
              sslError: headResult.sslError,
              sslErrorFixed: headResult.sslErrorFixed
            };
          }
        }
      } catch (e) {
        console.log('⚠️ HEAD falló para Tunzilla, intentando GET...');
      }

      // Fallback: GET con rango mínimo
      try {
        const getResult = await fetchWithSSLHandling(streamUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'OndaVerificada-StreamVerifier/1.0',
            'Range': 'bytes=0-0',
            'Accept': 'audio/*, */*',
          },
          timeout: 15000, // Timeout más largo para Tunzilla
        });
        
        if (getResult.response) {
          const get = getResult.response;
          const ctype = get.headers.get('content-type') || undefined;
          if (get.ok || get.status === 206 || get.status === 302) {
            return {
              status: 'ONLINE',
              details: `Tunzilla accesible (HTTP ${get.status})${getResult.sslErrorFixed ? ' [SSL arreglado]' : ''}`,
              streamType,
              httpStatus: get.status,
              contentType: ctype,
              usedProxy: false,
              method: 'RANGE',
              sslError: getResult.sslError,
              sslErrorFixed: getResult.sslErrorFixed
            };
          }
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') {
          return { status: 'OFFLINE', details: 'Timeout Tunzilla (15s)', streamType, usedProxy: false, method: 'RANGE' };
        }
      }
    }

    // HLS: validar playlist .m3u8
    if (streamType === 'HLS') {
      try {
        const res = await fetchWithTimeout(streamUrl, {
          method: 'GET',
          headers: { 'User-Agent': 'OndaVerificada-StreamVerifier/1.0', 'Accept': 'application/vnd.apple.mpegurl, application/x-mpegURL, */*' },
          timeout: 10000,
        });
        const contentType = res.headers.get('content-type') || undefined;
        if (res.ok) {
          // Comprobar si parece playlist
          const textHead = await res.text();
          const looksLikePlaylist = textHead.includes('#EXTM3U');
          return {
            status: looksLikePlaylist ? 'ONLINE' : 'OFFLINE',
            details: looksLikePlaylist ? `Playlist HLS válida (HTTP ${res.status})` : `Respuesta no parece playlist HLS (HTTP ${res.status})`,
            streamType,
            httpStatus: res.status,
            contentType,
            usedProxy: false,
            method: 'GET',
          };
        }
        return { status: 'OFFLINE', details: `HLS no disponible (HTTP ${res.status})`, streamType, httpStatus: res.status, contentType, usedProxy: false, method: 'GET' };
      } catch (e: any) {
        if (e?.name === 'AbortError') {
          return { status: 'OFFLINE', details: 'Timeout HLS (10s)', streamType, usedProxy: false, method: 'GET' };
        }
        return { status: 'OFFLINE', details: `Error HLS: ${e?.message || 'desconocido'}`, streamType, usedProxy: false, method: 'GET' };
      }
    }

    // Icecast/Shoutcast o directos: intentar HEAD -> RANGE GET (0-0)
    // HEAD primero (rápido) con manejo SSL
    try {
      const headResult = await fetchWithSSLHandling(streamUrl, {
        method: 'HEAD',
        headers: { 'User-Agent': 'OndaVerificada-StreamVerifier/1.0', 'Icy-MetaData': '1' },
        timeout: 8000,
      });
      
      if (headResult.response) {
        const head = headResult.response;
        const ctype = head.headers.get('content-type') || undefined;
        
        // Para Icecast/Shoutcast, incluso un error 400 puede indicar que el servidor está vivo
        if (head.ok || (streamType === 'ICECAST' && head.status === 400)) {
          return {
            status: 'ONLINE',
            details: `Stream disponible (HTTP ${head.status})${headResult.sslErrorFixed ? ' [SSL arreglado]' : ''}`,
            streamType,
            httpStatus: head.status,
            contentType: ctype,
            usedProxy: false,
            method: 'HEAD',
            sslError: headResult.sslError,
            sslErrorFixed: headResult.sslErrorFixed
          };
        }
      }
    } catch (e) {
      // ignorar; haremos fallback a RANGE
    }

    // Fallback: GET con Range mínimo con manejo SSL
    try {
      const getResult = await fetchWithSSLHandling(streamUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'OndaVerificada-StreamVerifier/1.0',
          'Icy-MetaData': '1',
          'Range': 'bytes=0-0',
          'Accept': 'audio/*, */*',
        },
        timeout: 12000,
      });
      
      if (getResult.response) {
        const get = getResult.response;
        const ctype = get.headers.get('content-type') || undefined;
        const okStatus = get.ok || get.status === 206; // Partial Content aceptable
        if (okStatus) {
          return {
            status: 'ONLINE',
            details: `Stream accesible (HTTP ${get.status})${getResult.sslErrorFixed ? ' [SSL arreglado]' : ''}`,
            streamType,
            httpStatus: get.status,
            contentType: ctype,
            usedProxy: false,
            method: 'RANGE',
            sslError: getResult.sslError,
            sslErrorFixed: getResult.sslErrorFixed
          };
        }
        return {
          status: 'OFFLINE',
          details: `Stream no disponible (HTTP ${get.status})${getResult.sslErrorFixed ? ' [SSL arreglado]' : ''}`,
          streamType,
          httpStatus: get.status,
          contentType: ctype,
          usedProxy: false,
          method: 'RANGE',
          sslError: getResult.sslError,
          sslErrorFixed: getResult.sslErrorFixed
        };
      } else if (getResult.error) {
        if (getResult.error.name === 'AbortError') {
          return { status: 'OFFLINE', details: 'Timeout (12s)', streamType, usedProxy: false, method: 'RANGE' };
        }
        return {
          status: 'OFFLINE',
          details: `Error al verificar stream: ${getResult.error.message || 'desconocido'}`,
          streamType,
          usedProxy: false,
          method: 'RANGE',
          sslError: getResult.sslError,
          sslErrorFixed: getResult.sslErrorFixed
        };
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        return { status: 'OFFLINE', details: 'Timeout (12s)', streamType, usedProxy: false, method: 'RANGE' };
      }
      return { status: 'OFFLINE', details: `Error al verificar stream: ${e?.message || 'desconocido'}`, streamType, usedProxy: false, method: 'RANGE' };
    }
    
    // Si llegamos aquí, el stream está offline
    return { status: 'OFFLINE', details: 'Stream no accesible después de todos los intentos', streamType, usedProxy: false, method: 'RANGE' };
  } catch (error: any) {
    const errorMessage = error?.message || 'Error desconocido';
    return { status: 'OFFLINE', details: `Error al verificar stream: ${errorMessage}`, streamType: 'OTHER', usedProxy: false, method: 'NONE' };
  }
}

/**
 * Verificación especial para streams protegidos por Cloudflare
 * Intenta múltiples estrategias para bypassar la protección
 */
async function verifyCloudflareProtectedStream(streamUrl: string): Promise<StreamVerificationResult> {
  console.log(`🔒 Detectado Cloudflare para: ${streamUrl}`);
  
  // Estrategia 1: Headers de navegador real
  try {
    const browserResult = await fetchWithSSLHandling(streamUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      },
      timeout: 15000,
    });
    
    if (browserResult.response) {
      const response = browserResult.response;
      const cfDetection = detectCloudflare(response);
      const contentType = response.headers.get('content-type') || undefined;
      
      // Si Cloudflare responde con 200, el stream está online
      if (response.ok) {
        return {
          status: 'ONLINE',
          details: `Cloudflare protegido - Stream accesible con headers de navegador (HTTP ${response.status})`,
          streamType: 'CLOUDFLARE',
          httpStatus: response.status,
          contentType: contentType,
          usedProxy: false,
          method: 'HEAD',
          sslError: browserResult.sslError,
          sslErrorFixed: browserResult.sslErrorFixed,
          cloudflareProtected: true,
          cloudflareRay: cfDetection.cfRay
        };
      }
      
      // Si es 403 pero detectamos Cloudflare, es protección activa
      if (response.status === 403 && cfDetection.isCloudflare) {
        return {
          status: 'ONLINE',
          details: `Cloudflare protegido - Stream online pero requiere navegador real (HTTP 403)`,
          streamType: 'CLOUDFLARE',
          httpStatus: 403,
          contentType: contentType,
          usedProxy: false,
          method: 'HEAD',
          sslError: browserResult.sslError,
          sslErrorFixed: browserResult.sslErrorFixed,
          cloudflareProtected: true,
          cloudflareRay: cfDetection.cfRay
        };
      }
    }
  } catch (error: any) {
    console.log(`⚠️ Estrategia navegador falló: ${error.message}`);
  }
  
  // Estrategia 2: Intentar con GET y Range header
  try {
    const rangeResult = await fetchWithSSLHandling(streamUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Range': 'bytes=0-0',
        'Accept': 'audio/*, */*',
        'Icy-MetaData': '1'
      },
      timeout: 15000,
    });
    
    if (rangeResult.response) {
      const response = rangeResult.response;
      const cfDetection = detectCloudflare(response);
      const contentType = response.headers.get('content-type') || undefined;
      
      if (response.ok || response.status === 206) {
        return {
          status: 'ONLINE',
          details: `Cloudflare protegido - Stream accesible con Range request (HTTP ${response.status})`,
          streamType: 'CLOUDFLARE',
          httpStatus: response.status,
          contentType: contentType,
          usedProxy: false,
          method: 'RANGE',
          sslError: rangeResult.sslError,
          sslErrorFixed: rangeResult.sslErrorFixed,
          cloudflareProtected: true,
          cloudflareRay: cfDetection.cfRay
        };
      }
    }
  } catch (error: any) {
    console.log(`⚠️ Estrategia Range falló: ${error.message}`);
  }
  
  // Si ninguna estrategia funciona, reportar como protegido pero potencialmente online
  return {
    status: 'ONLINE',
    details: 'Cloudflare protegido - Stream potencialmente online (requiere verificación manual)',
    streamType: 'CLOUDFLARE',
    httpStatus: 403,
    contentType: 'text/html',
    usedProxy: false,
    method: 'HEAD',
    cloudflareProtected: true,
    cloudflareRay: undefined
  };
}

/**
 * Verifica múltiples streams en paralelo
 */
export async function verifyMultipleStreams(
  streamUrls: string[]
): Promise<Array<{ url: string; result: StreamVerificationResult }>> {
  const verificationPromises = streamUrls.map(async (url) => ({ url, result: await verifyStreamStatus(url) }));
  return Promise.all(verificationPromises);
}

/**
 * Verifica streams con reintentos (backoff simple)
 */
export async function verifyStreamWithRetry(
  streamUrl: string,
  retries: number = 3,
  delayMs: number = 2000
): Promise<StreamVerificationResult> {
  let lastResult: StreamVerificationResult | null = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    lastResult = await verifyStreamStatus(streamUrl);
    if (lastResult.status === 'ONLINE' || lastResult.status === 'EXTERNAL') return lastResult;
    if (attempt < retries) await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return { status: 'OFFLINE', details: `OFFLINE tras ${retries} intentos. Último: ${lastResult?.details}`, streamType: lastResult?.streamType || 'OTHER', httpStatus: lastResult?.httpStatus, contentType: lastResult?.contentType, usedProxy: lastResult?.usedProxy ?? false, method: lastResult?.method || 'NONE', cloudflareProtected: lastResult?.cloudflareProtected, cloudflareRay: lastResult?.cloudflareRay };
}

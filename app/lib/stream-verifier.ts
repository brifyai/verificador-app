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
  | 'OTHER';

export interface StreamVerificationResult {
  status: 'ONLINE' | 'OFFLINE' | 'EXTERNAL';
  details: string;
  streamType: StreamType;
  httpStatus?: number;
  contentType?: string;
  usedProxy: boolean;
  method: 'HEAD' | 'GET' | 'RANGE' | 'NONE';
}

function detectStreamType(url: string): StreamType {
  const u = url.toLowerCase();
  if (u.includes('.m3u8') || u.includes('/hls/')) return 'HLS';
  if (u.includes('.mpd')) return 'DASH';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'YOUTUBE';
  if (u.includes('twitch.tv')) return 'TWITCH';
  if (u.includes('facebook.com')) return 'FACEBOOK';
  if (u.includes('shoutcast') || u.includes(':8080')) return 'SHOUTCAST';
  if (u.includes('icecast') || u.includes(':8000')) return 'ICECAST';
  if (u.startsWith('http://') || u.startsWith('https://')) return 'DIRECT';
  return 'OTHER';
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

    // Plataformas externas (se reproducen fuera del sitio)
    if (streamType === 'YOUTUBE' || streamType === 'TWITCH' || streamType === 'FACEBOOK') {
      return { status: 'EXTERNAL', details: 'Plataforma externa', streamType, usedProxy: false, method: 'NONE' };
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
    // HEAD primero (rápido)
    try {
      const head = await fetchWithTimeout(streamUrl, {
        method: 'HEAD',
        headers: { 'User-Agent': 'OndaVerificada-StreamVerifier/1.0', 'Icy-MetaData': '1' },
        timeout: 8000,
      });
      const ctype = head.headers.get('content-type') || undefined;
      if (head.ok) {
        return { status: 'ONLINE', details: `Stream disponible (HTTP ${head.status})`, streamType, httpStatus: head.status, contentType: ctype, usedProxy: false, method: 'HEAD' };
      }
    } catch (e) {
      // ignorar; haremos fallback a RANGE
    }

    // Fallback: GET con Range mínimo
    try {
      const get = await fetchWithTimeout(streamUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'OndaVerificada-StreamVerifier/1.0',
          'Icy-MetaData': '1',
          'Range': 'bytes=0-0',
          'Accept': 'audio/*, */*',
        },
        timeout: 12000,
      });
      const ctype = get.headers.get('content-type') || undefined;
      const okStatus = get.ok || get.status === 206; // Partial Content aceptable
      if (okStatus) {
        return { status: 'ONLINE', details: `Stream accesible (HTTP ${get.status})`, streamType, httpStatus: get.status, contentType: ctype, usedProxy: false, method: 'RANGE' };
      }
      return { status: 'OFFLINE', details: `Stream no disponible (HTTP ${get.status})`, streamType, httpStatus: get.status, contentType: ctype, usedProxy: false, method: 'RANGE' };
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        return { status: 'OFFLINE', details: 'Timeout (12s)', streamType, usedProxy: false, method: 'RANGE' };
      }
      return { status: 'OFFLINE', details: `Error al verificar stream: ${e?.message || 'desconocido'}`, streamType, usedProxy: false, method: 'RANGE' };
    }
  } catch (error: any) {
    const errorMessage = error?.message || 'Error desconocido';
    return { status: 'OFFLINE', details: `Error al verificar stream: ${errorMessage}`, streamType: 'OTHER', usedProxy: false, method: 'NONE' };
  }
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
  return { status: 'OFFLINE', details: `OFFLINE tras ${retries} intentos. Último: ${lastResult?.details}`, streamType: lastResult?.streamType || 'OTHER', httpStatus: lastResult?.httpStatus, contentType: lastResult?.contentType, usedProxy: lastResult?.usedProxy ?? false, method: lastResult?.method || 'NONE' };
}

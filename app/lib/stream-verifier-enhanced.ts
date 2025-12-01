import { logger } from './logger';

export interface StreamVerificationResult {
  status: 'ONLINE' | 'OFFLINE';
  details: string;
  streamType: 'ICECAST' | 'SHOUTCAST' | 'HLS' | 'ZENO' | 'TUNZILLA' | 'CLOUDFLARE' | 'TECNOERA' | 'OTHER';
  usedProxy: boolean;
  method: string;
  responseCode?: number;
  responseTime?: number;
  timestamp: string;
}

function detectStreamType(url: string): 'ICECAST' | 'SHOUTCAST' | 'HLS' | 'ZENO' | 'TUNZILLA' | 'CLOUDFLARE' | 'TECNOERA' | 'OTHER' {
  const lowerUrl = url.toLowerCase();
  
  // Detectar Zeno.fm streams
  if (lowerUrl.includes('zeno.fm')) {
    return 'ZENO';
  }
  
  if (lowerUrl.includes('tunzilla.com')) {
    return 'TUNZILLA';
  }
  
  // Detectar Tecnoera servers
  if (lowerUrl.includes('tecnoera.com')) {
    return 'TECNOERA';
  }
  
  // Detectar Cloudflare protegido
  if (lowerUrl.includes('conectaapp.cl') || lowerUrl.includes('cloudflare')) {
    return 'CLOUDFLARE';
  }
  // Detectar servidores Icecast, Digital Pro Server y Digital FM
  if (lowerUrl.includes(':8000') ||
      lowerUrl.includes(':8001') ||
      lowerUrl.includes(':8002') ||
      lowerUrl.includes('digitalproserver.com') ||
      lowerUrl.includes('digitalfm.cl') || // Agregar detección para Digital FM
      lowerUrl.includes('.aac') ||
      lowerUrl.includes('.mp3')) {
    return 'ICECAST';
  }
  if (lowerUrl.includes('/stream') || lowerUrl.includes(':80')) {
    return 'SHOUTCAST';
  }
  if (lowerUrl.includes('.m3u8') || lowerUrl.includes('/hls/')) {
    return 'HLS';
  }
  return 'OTHER';
}

async function verifyWithHttpsModule(url: string, streamType: 'ICECAST' | 'SHOUTCAST' | 'HLS' | 'ZENO' | 'TUNZILLA' | 'CLOUDFLARE' | 'TECNOERA' | 'OTHER'): Promise<StreamVerificationResult> {
  const https = require('https');
  const http = require('http');
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const module = isHttps ? https : http;
    
    const options = {
      method: 'GET',
      timeout: 20000, // Aumentar timeout a 20s para servidores lentos
      rejectUnauthorized: false, // Aceptar certificados SSL problemáticos
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)',
        'Accept': '*/*',
        'Icy-MetaData': '1',
        'Connection': 'close'
      }
    };

    const req = module.request(url, options, (res: any) => {
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;
      
      logger.info(`HTTPS verification for ${url}: Status ${statusCode}, Time: ${responseTime}ms`);
      
      // Aceptar HTTP 400 como ONLINE para servidores Icecast y Digital Pro Server
      const isIcecastServer = detectStreamType(url) === 'ICECAST' ||
                             url.includes('digitalproserver.com') ||
                             url.includes(':8000') ||
                             url.includes('.aac');
      
      const isZenoServer = streamType === 'ZENO';
      
      const isOnline = (statusCode >= 200 && statusCode < 300) ||
                       (statusCode === 302 && isZenoServer) || // Zeno.fm a menudo devuelve 302 redirects
                       (statusCode === 302 && streamType === 'TUNZILLA') || // Tunzilla también puede devolver 302
                       (statusCode === 302 && streamType === 'TECNOERA') || // Tecnoera/Shoutcast devuelve 302 redirects
                       (statusCode === 400 && isIcecastServer) ||
                       (statusCode >= 200 && statusCode < 500 && isIcecastServer) ||
                       (statusCode === 403 && streamType === 'CLOUDFLARE'); // Cloudflare protegido con 403 sigue siendo ONLINE
      
      res.destroy(); // Cerrar conexión inmediatamente
      
      resolve({
        status: isOnline ? 'ONLINE' : 'OFFLINE',
        details: isOnline 
          ? `Stream verificado exitosamente (HTTP ${statusCode})` 
          : `Stream no responde correctamente (HTTP ${statusCode})`,
        streamType: streamType,
        usedProxy: false,
        method: 'HTTPS_MODULE',
        responseCode: statusCode,
        responseTime,
        timestamp: new Date().toISOString()
      });
    });

    req.on('error', (error: any) => {
      const responseTime = Date.now() - startTime;
      logger.error(`HTTPS verification error for ${url}:`, error.message);
      
      resolve({
        status: 'OFFLINE',
        details: `Error de conexión: ${error.message}`,
        streamType: streamType,
        usedProxy: false,
        method: 'HTTPS_MODULE_ERROR',
        responseTime,
        timestamp: new Date().toISOString()
      });
    });

    req.on('timeout', () => {
      req.destroy();
      logger.warn(`HTTPS verification timeout for ${url}`);
      
      resolve({
        status: 'OFFLINE',
        details: 'Timeout en la conexión',
        streamType: streamType,
        usedProxy: false,
        method: 'HTTPS_MODULE_TIMEOUT',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
    });

    req.setTimeout(20000); // Aumentar timeout a 20s para servidores lentos
    req.end();
  });
}

async function verifyWithFetch(url: string, streamType: 'ICECAST' | 'SHOUTCAST' | 'HLS' | 'ZENO' | 'TUNZILLA' | 'CLOUDFLARE' | 'TECNOERA' | 'OTHER'): Promise<StreamVerificationResult> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // Aumentar timeout a 20s para servidores lentos
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)',
        'Accept': '*/*',
        'Icy-MetaData': '1',
        'Connection': 'close'
      }
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    const statusCode = response.status;
    
    logger.info(`Fetch verification for ${url}: Status ${statusCode}, Time: ${responseTime}ms`);
    
    // Aceptar HTTP 400 para servidores Icecast y Digital Pro Server
    const isIcecastServer = detectStreamType(url) === 'ICECAST' ||
                           url.includes('digitalproserver.com') ||
                           url.includes(':8000') ||
                           url.includes('.aac');
    
    const isZenoServer = streamType === 'ZENO';
    
    const isOnline = (statusCode >= 200 && statusCode < 300) ||
                     (statusCode === 302 && isZenoServer) || // Zeno.fm a menudo devuelve 302 redirects
                     (statusCode === 400 && isIcecastServer) ||
                     (statusCode >= 200 && statusCode < 500 && isIcecastServer);
    
    return {
      status: isOnline ? 'ONLINE' : 'OFFLINE',
      details: isOnline 
        ? `Stream verificado exitosamente (HTTP ${statusCode})` 
        : `Stream no responde correctamente (HTTP ${statusCode})`,
      streamType: streamType,
      usedProxy: false,
      method: 'FETCH',
      responseCode: statusCode,
      responseTime,
      timestamp: new Date().toISOString()
    };
    
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    logger.error(`Fetch verification error for ${url}:`, error.message);
    
    // Si fetch falla, intentar con HTTPS module como fallback
    if (error.message.includes('fetch failed') || error.message.includes('network')) {
      logger.info(`Fetch failed for ${url}, trying HTTPS module fallback`);
      return await verifyWithHttpsModule(url, streamType);
    }
    
    return {
      status: 'OFFLINE',
      details: `Error: ${error.message}`,
      streamType: streamType,
      usedProxy: false,
      method: 'FETCH_ERROR',
      responseTime,
      timestamp: new Date().toISOString()
    };
  }
}

export async function verifyStreamStatus(streamUrl: string): Promise<StreamVerificationResult> {
  try {
    if (!streamUrl || streamUrl.trim() === '') {
      return {
        status: 'OFFLINE',
        details: 'URL de stream vacía o inválida',
        streamType: 'OTHER',
        usedProxy: false,
        method: 'NONE',
        timestamp: new Date().toISOString()
      };
    }

    const streamType = detectStreamType(streamUrl);
    
    // Zeno.fm: usar verificación especial ya que no responde bien a HEAD
    if (streamType === 'ZENO') {
      logger.info(`Using special Zeno.fm verification for: ${streamUrl}`);
      return await verifyWithHttpsModule(streamUrl, streamType);
    }
    
    // Tunzilla: usar verificación especial ya que no responde a HEAD
    if (streamType === 'TUNZILLA') {
      logger.info(`Using special Tunzilla verification for: ${streamUrl}`);
      return await verifyWithHttpsModule(streamUrl, streamType);
    }
    
    // Tecnoera: usar verificación especial ya que es un servidor Shoutcast
    if (streamType === 'TECNOERA') {
      logger.info(`Using special Tecnoera verification for: ${streamUrl}`);
      return await verifyWithHttpsModule(streamUrl, streamType);
    }
    
    // Cloudflare protegido: usar verificación especial
    if (streamType === 'CLOUDFLARE') {
      logger.info(`Using special Cloudflare verification for: ${streamUrl}`);
      return await verifyWithHttpsModule(streamUrl, streamType);
    }
    // Para streams problemáticos como Digital FM Arica, usar verificación HTTPS directa
    if (streamUrl.includes('digitalfm.cl:8000') ||
        streamUrl.includes(':8000/arica') ||
        streamType === 'ICECAST') {
      logger.info(`Using HTTPS module for problematic stream: ${streamUrl}`);
      return await verifyWithHttpsModule(streamUrl, streamType);
    }
    
    // Para otros streams, intentar fetch primero
    return await verifyWithFetch(streamUrl, streamType);
    
  } catch (error: any) {
    logger.error(`Unexpected error verifying stream ${streamUrl}:`, error);
    
    return {
      status: 'OFFLINE',
      details: `Error inesperado: ${error.message}`,
      streamType: 'OTHER',
      usedProxy: false,
      method: 'UNEXPECTED_ERROR',
      timestamp: new Date().toISOString()
    };
  }
}
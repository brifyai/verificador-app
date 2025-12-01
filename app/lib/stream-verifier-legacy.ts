/**
 * Verificador alternativo usando módulo https directo para casos donde fetch falla
 */

import { StreamVerificationResult, StreamType } from './stream-verifier';

const https = require('https');
const http = require('http');

interface LegacyVerificationResult {
  status: 'ONLINE' | 'OFFLINE';
  details: string;
  httpStatus?: number;
  contentType?: string;
  sslError?: boolean;
  sslErrorFixed?: boolean;
}

/**
 * Verificación usando módulo https/http directo cuando fetch falla
 */
export async function verifyStreamLegacy(
  streamUrl: string, 
  streamType: StreamType
): Promise<LegacyVerificationResult> {
  return new Promise((resolve) => {
    try {
      const url = new URL(streamUrl);
      const isHttps = url.protocol === 'https:';
      const module = isHttps ? https : http;
      
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: 'HEAD',
        headers: {
          'User-Agent': 'OndaVerificada-StreamVerifier/1.0',
          'Icy-MetaData': '1',
          'Accept': 'audio/*, */*',
          'Connection': 'close'
        },
        timeout: 8000,
        rejectUnauthorized: false, // Aceptar certificados SSL inválidos
        secureOptions: require('crypto')?.constants?.SSL_OP_LEGACY_SERVER_CONNECT
      };

      const req = module.request(options, (res: any) => {
        const statusCode = res.statusCode;
        const contentType = res.headers['content-type'];
        
        // Para Icecast/Shoutcast, incluso un error 400 puede indicar que el servidor está vivo
        const isOnline = statusCode && (statusCode < 400 || (streamType === 'ICECAST' && statusCode === 400));
        
        if (isOnline) {
          resolve({
            status: 'ONLINE',
            details: `Stream disponible (HTTP ${statusCode}) [verificación legacy]`,
            httpStatus: statusCode,
            contentType: contentType,
            sslError: false,
            sslErrorFixed: true
          });
        } else {
          resolve({
            status: 'OFFLINE',
            details: `Stream no disponible (HTTP ${statusCode}) [verificación legacy]`,
            httpStatus: statusCode,
            contentType: contentType
          });
        }
      });

      req.on('error', (error: any) => {
        const errorMessage = error.message || 'Error desconocido';
        
        // Detectar errores SSL
        const isSSLError = errorMessage.includes('certificate') || 
                          errorMessage.includes('SSL') || 
                          errorMessage.includes('TLS') ||
                          errorMessage.includes('UNABLE_TO_VERIFY_LEAF_SIGNATURE');
        
        resolve({
          status: 'OFFLINE',
          details: `Error legacy: ${errorMessage}`,
          sslError: isSSLError,
          sslErrorFixed: false
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          status: 'OFFLINE',
          details: 'Timeout (8s) [verificación legacy]'
        });
      });

      req.end();
      
    } catch (error: any) {
      resolve({
        status: 'OFFLINE',
        details: `Error configurando verificación legacy: ${error.message}`
      });
    }
  });
}

/**
 * Verificación completa con fallback a legacy
 */
export async function verifyStreamWithFallback(
  streamUrl: string,
  streamType: StreamType
): Promise<StreamVerificationResult> {
  // Intentar primero con el verificador normal
  try {
    // Importar dinámicamente para evitar círculos de dependencia
    const { verifyStreamStatus } = require('./stream-verifier');
    const result = await verifyStreamStatus(streamUrl);
    
    // Si el resultado es OFFLINE y hay indicios de que podría ser un problema de conexión,
    // intentar con el verificador legacy
    if (result.status === 'OFFLINE' && 
        (result.details.includes('fetch failed') || 
         result.details.includes('ECONNREFUSED') ||
         result.details.includes('ENOTFOUND'))) {
      
      console.log(`🔄 Intentando verificación legacy para: ${streamUrl}`);
      const legacyResult = await verifyStreamLegacy(streamUrl, streamType);
      
      // Si el legacy tiene éxito, usar ese resultado
      if (legacyResult.status === 'ONLINE') {
        return {
          status: 'ONLINE',
          details: legacyResult.details,
          streamType: streamType,
          httpStatus: legacyResult.httpStatus,
          contentType: legacyResult.contentType,
          usedProxy: false,
          method: 'HEAD',
          sslError: legacyResult.sslError,
          sslErrorFixed: legacyResult.sslErrorFixed
        };
      }
    }
    
    return result;
  } catch (error: any) {
    console.log(`🔄 Error en verificador normal, intentando legacy: ${error.message}`);
    
    // Si el verificador normal falla completamente, intentar con legacy
    try {
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
    } catch (legacyError: any) {
      return {
        status: 'OFFLINE',
        details: `Error en ambos verificadores: ${legacyError.message}`,
        streamType: streamType,
        usedProxy: false,
        method: 'NONE'
      };
    }
  }
}
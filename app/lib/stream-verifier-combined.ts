// Servicio combinado que usa VPS como primera opción y navegador como respaldo
import { streamVerifierVPS } from './stream-verifier-vps';
import { streamVerifierBrowser } from './stream-verifier-browser';
import { verifyStreamStatusWithSslFix } from './stream-verifier-ssl-fix';
import { logger } from './logger';

export interface StreamVerificationResult {
  status: 'ONLINE' | 'OFFLINE' | 'ERROR';
  details: string;
  responseTime?: number;
  contentType?: string;
  contentLength?: number;
  method?: 'VPS' | 'BROWSER' | 'SSL_FIX' | 'FALLBACK';
  sslError?: string;
}

export class StreamVerifierCombined {
  /**
   * Verifica el streaming usando el mejor método disponible
   * 1. Primero intenta con la VPS
   * 2. Si falla, intenta desde el navegador
   * 3. Si ambos fallan, permite grabación con advertencia
   */
  async verifyStreamWithFallback(radioId: string, streamUrl: string, radioName: string): Promise<StreamVerificationResult> {
    logger.info(`🔍 Iniciando verificación combinada para: ${radioName} (${radioId})`);
    logger.info(`🔗 URL: ${streamUrl}`);

    // Método 1: Intentar con VPS (método preferido)
    logger.info('🎯 Intentando verificación con VPS...');
    try {
      const vpsResult = await streamVerifierVPS.verifyStreamBeforeRecording(radioId, streamUrl, radioName);
      
      if (vpsResult.status === 'ONLINE') {
        logger.info('✅ Verificación con VPS exitosa');
        return {
          ...vpsResult,
          method: 'VPS'
        };
      } else if (vpsResult.status === 'OFFLINE') {
        logger.info('⚠️ Streaming offline según VPS');
        return {
          ...vpsResult,
          method: 'VPS'
        };
      }
      // Si es ERROR, continuar con el siguiente método
      
    } catch (vpsError) {
      logger.warn('❌ Falló verificación con VPS:', vpsError);
      console.log('🔄 VPS no disponible, intentando verificación SSL...');
    }

    // Método 2: Intentar verificación mejorada con manejo SSL
    logger.info('🎯 Intentando verificación mejorada con manejo SSL...');
    try {
      const sslResult = await verifyStreamStatusWithSslFix(streamUrl);
      
      if (sslResult.status === 'online') {
        logger.info('✅ Verificación SSL exitosa');
        return {
          status: 'ONLINE',
          details: sslResult.details,
          responseTime: 0,
          contentType: sslResult.contentType,
          method: 'SSL_FIX'
        };
      } else if (sslResult.status === 'ssl_error') {
        logger.info('⚠️ Error SSL detectado, intentando navegador...');
        // Si hay error SSL, intentar con navegador
      } else if (sslResult.status === 'offline') {
        logger.info('⚠️ Streaming offline según verificación SSL');
        return {
          status: 'OFFLINE',
          details: sslResult.details,
          responseTime: 0,
          contentType: sslResult.contentType,
          method: 'SSL_FIX'
        };
      }
      
    } catch (sslError) {
      logger.error('❌ Falló verificación SSL:', sslError);
      console.log('🔄 SSL también falló, intentando desde navegador...');
    }

    // Método 3: Intentar desde el navegador (método de respaldo)
    logger.info('🎯 Intentando verificación desde navegador...');
    try {
      const browserResult = await streamVerifierBrowser.verifyStreamFromBrowser(radioId, streamUrl, radioName);
      
      if (browserResult.status === 'ONLINE') {
        logger.info('✅ Verificación desde navegador exitosa');
        return {
          ...browserResult,
          method: 'BROWSER'
        };
      } else if (browserResult.status === 'OFFLINE') {
        logger.info('⚠️ Streaming offline según navegador');
        return {
          ...browserResult,
          method: 'BROWSER'
        };
      }
      // Si es ERROR, continuar con fallback
      
    } catch (browserError) {
      logger.error('❌ Falló verificación desde navegador:', browserError);
      console.log('🔄 Navegador también falló, usando modo fallback...');
    }

    // Método 4: Fallback - Permitir grabación con advertencia
    logger.warn('⚠️ Ningún método de verificación funcionó, usando fallback');
    
    // Verificar conectividad básica del navegador
    const hasConnectivity = await streamVerifierBrowser.checkBrowserConnectivity();
    
    if (hasConnectivity) {
      return {
        status: 'ONLINE',
        details: 'No se pudo verificar el streaming técnicamente, pero se permite grabación por conectividad básica',
        responseTime: 0,
        method: 'FALLBACK'
      };
    } else {
      return {
        status: 'ERROR',
        details: 'Sin conectividad de red - no se puede verificar ni grabar',
        responseTime: 0,
        method: 'FALLBACK'
      };
    }
  }

  /**
   * Verifica con reintento usando el método combinado
   */
  async verifyStreamWithRetry(radioId: string, streamUrl: string, radioName: string, maxRetries: number = 2): Promise<StreamVerificationResult> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      logger.info(`🔄 Intento ${attempt}/${maxRetries} de verificación combinada para ${radioName}`);
      
      const result = await this.verifyStreamWithFallback(radioId, streamUrl, radioName);
      
      if (result.status === 'ONLINE') {
        logger.info(`✅ Streaming verificado exitosamente en intento ${attempt} usando ${result.method}`);
        return result;
      }
      
      if (attempt < maxRetries) {
        logger.warn(`⚠️ Intento ${attempt} fallido, reintentando en 3 segundos...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    logger.error(`❌ Todos los intentos de verificación fallaron para ${radioName}`);
    return {
      status: 'OFFLINE',
      details: `Streaming no disponible después de ${maxRetries} intentos con todos los métodos`,
      method: 'FALLBACK'
    };
  }

  /**
   * Obtiene un mensaje amigable para el usuario basado en el método usado
   */
  getUserFriendlyMessage(result: StreamVerificationResult): string {
    switch (result.method) {
      case 'VPS':
        return result.status === 'ONLINE'
          ? '✅ Streaming verificado exitosamente desde el servidor'
          : '❌ Streaming no disponible (verificado desde servidor)';
      
      case 'SSL_FIX':
        return result.status === 'ONLINE'
          ? '✅ Streaming verificado (con corrección SSL)'
          : '❌ Streaming no disponible (error SSL)';
      
      case 'BROWSER':
        return result.status === 'ONLINE'
          ? '✅ Conectividad verificada desde tu navegador'
          : '❌ Sin conectividad (verificado desde navegador)';
      
      case 'FALLBACK':
        return result.status === 'ONLINE'
          ? '⚠️ No se pudo verificar técnicamente, pero se permite grabación'
          : '❌ Sin conectividad de red - grabación no disponible';
      
      default:
        return result.details;
    }
  }
}

// Exportar instancia global
export const streamVerifierCombined = new StreamVerifierCombined();
export default StreamVerifierCombined;
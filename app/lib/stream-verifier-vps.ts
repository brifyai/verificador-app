// Servicio para verificar el estado del streaming antes de grabar
import { logger } from '@/lib/logger';

export interface StreamVerificationResult {
  status: 'ONLINE' | 'OFFLINE' | 'ERROR';
  details: string;
  responseTime?: number;
  contentType?: string;
  contentLength?: number;
}

export class StreamVerifierVPS {
  private API_BASE: string;

  constructor(baseURL: string = 'http://213.199.39.147:5000/api') {
    this.API_BASE = baseURL;
  }

  /**
   * Verifica si el streaming de una radio está funcionando correctamente
   * antes de iniciar la grabación
   */
  async verifyStreamBeforeRecording(radioId: string, streamUrl: string, radioName: string): Promise<StreamVerificationResult> {
    logger.info(`🔍 Verificando streaming antes de grabar: ${radioName} (${radioId})`);
    logger.info(`🔗 URL del stream: ${streamUrl}`);

    try {
      // Verificar conectividad básica
      const startTime = Date.now();
      
      // Intentar conectar al stream
      const response = await fetch(`${this.API_BASE}/verify-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          radio_id: radioId,
          stream_url: streamUrl,
          radio_name: radioName
        }),
        // Agregar timeout para evitar errores de conexión prolongada
        signal: AbortSignal.timeout(10000) // 10 segundos de timeout
      });

      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        logger.warn(`⚠️ Respuesta no exitosa del servidor: ${response.status} ${response.statusText}`);
        return {
          status: 'OFFLINE',
          details: `Servidor de verificación respondió con error: ${response.status}`,
          responseTime
        };
      }

      const result = await response.json();

      logger.info(`📊 Resultado de verificación:`, {
        status: result.status,
        responseTime: `${responseTime}ms`,
        details: result.message || result.details
      });

      if (result.status === 'success') {
        return {
          status: 'ONLINE',
          details: `Streaming funcionando correctamente (${responseTime}ms)`,
          responseTime,
          contentType: result.content_type,
          contentLength: result.content_length
        };
      } else {
        return {
          status: 'OFFLINE',
          details: `Streaming no disponible: ${result.message || 'Error desconocido'}`,
          responseTime
        };
      }

    } catch (error) {
      logger.error('❌ Error verificando streaming:', error);
      
      // Manejar diferentes tipos de errores
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            status: 'ERROR',
            details: 'Tiempo de espera agotado al verificar streaming (timeout)'
          };
        } else if (error.message.includes('Failed to fetch')) {
          return {
            status: 'ERROR',
            details: 'No se pudo conectar con el servidor de verificación. El servidor podría estar caído o tener problemas de red.'
          };
        } else if (error.message.includes('CORS')) {
          return {
            status: 'ERROR',
            details: 'Problema de CORS al conectar con el servidor de verificación'
          };
        } else {
          return {
            status: 'ERROR',
            details: `Error al verificar streaming: ${error.message}`
          };
        }
      } else {
        return {
          status: 'ERROR',
          details: 'Error desconocido al verificar streaming'
        };
      }
    }
  }

  /**
   * Verifica rápidamente si el servidor de grabación está disponible
   */
  async checkServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/status`);
      const result = await response.json();
      return result.status === 'success';
    } catch (error) {
      logger.error('❌ Servidor de grabación no disponible:', error);
      return false;
    }
  }

  /**
   * Realiza una verificación completa del streaming con múltiples intentos
   */
  async verifyStreamWithRetry(radioId: string, streamUrl: string, radioName: string, maxRetries: number = 3): Promise<StreamVerificationResult> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      logger.info(`🔄 Intento ${attempt}/${maxRetries} de verificación para ${radioName}`);
      
      const result = await this.verifyStreamBeforeRecording(radioId, streamUrl, radioName);
      
      if (result.status === 'ONLINE') {
        logger.info(`✅ Streaming verificado exitosamente en intento ${attempt}`);
        return result;
      }
      
      if (attempt < maxRetries) {
        logger.warn(`⚠️ Intento ${attempt} fallido, reintentando en 2 segundos...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    logger.error(`❌ Todos los intentos de verificación fallaron para ${radioName}`);
    return {
      status: 'OFFLINE',
      details: `Streaming no disponible después de ${maxRetries} intentos`
    };
  }

  /**
   * Verifica múltiples radios simultáneamente
   */
  async verifyMultipleStreams(radios: Array<{id: string, name: string, streamUrl: string}>): Promise<Map<string, StreamVerificationResult>> {
    const results = new Map<string, StreamVerificationResult>();
    
    logger.info(`🎯 Verificando ${radios.length} radios simultáneamente`);
    
    const promises = radios.map(async (radio) => {
      const result = await this.verifyStreamWithRetry(radio.id, radio.streamUrl, radio.name);
      results.set(radio.id, result);
      return result;
    });
    
    await Promise.allSettled(promises);
    
    const onlineCount = Array.from(results.values()).filter(r => r.status === 'ONLINE').length;
    logger.info(`✅ Verificación completa: ${onlineCount}/${radios.length} radios online`);
    
    return results;
  }
}

// Exportar instancia global
export const streamVerifierVPS = new StreamVerifierVPS();
export default StreamVerifierVPS;
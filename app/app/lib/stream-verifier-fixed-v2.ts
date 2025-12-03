import { logger } from './logger';

/**
 * StreamVerifierFixedV2 - Versión mejorada del verificador de streams
 * Utiliza el endpoint público /api/verify-stream-public para evitar errores de autenticación
 */
export class StreamVerifierFixedV2 {
  private maxRetries: number;
  private retryDelay: number;
  private timeout: number;

  constructor(maxRetries = 2, retryDelay = 1000, timeout = 10000) {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
    this.timeout = timeout;
  }

  /**
   * Verifica si un stream está accesible usando el proxy API local
   */
  async verifyStream(streamUrl: string): Promise<{ accessible: boolean; status?: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      logger.log('[StreamVerifierFixedV2] Verificando stream:', streamUrl);
      
      const response = await fetch('/api/verify-stream-public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stream_url: streamUrl,
          timeout: this.timeout,
          detailed: true
        })
      });

      const responseTime = Date.now() - startTime;
      logger.log('[StreamVerifierFixedV2] Respuesta recibida en', responseTime, 'ms, status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('[StreamVerifierFixedV2] Error HTTP:', response.status, '-', errorText);
        throw new Error('HTTP error! status: ' + response.status);
      }

      const result = await response.json();
      logger.log('[StreamVerifierFixedV2] Resultado:', result);

      return {
        accessible: result.accessible || false,
        status: result.status_code,
        error: result.error
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('[StreamVerifierFixedV2] Error en verificación (' + responseTime + 'ms):', error);
      
      return {
        accessible: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Verifica el stream con reintentos
   */
  async verifyStreamWithRetries(streamUrl: string): Promise<{ accessible: boolean; status?: number; error?: string }> {
    logger.log('[StreamVerifierFixedV2] Iniciando verificación con', this.maxRetries, 'intentos');

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      logger.log('[StreamVerifierFixedV2] Intento', attempt + '/' + this.maxRetries);
      
      const result = await this.verifyStream(streamUrl);
      
      if (result.accessible) {
        logger.log('[StreamVerifierFixedV2] Stream accesible en intento', attempt);
        return result;
      }

      if (attempt < this.maxRetries) {
        logger.log('[StreamVerifierFixedV2] Reintentando en', this.retryDelay, 'ms...');
        await this.delay(this.retryDelay);
      }
    }

    logger.error('[StreamVerifierFixedV2] Stream no accesible después de', this.maxRetries, 'intentos');
    return {
      accessible: false,
      error: 'Stream no accesible después de ' + this.maxRetries + ' intentos'
    };
  }

  /**
   * Verifica el stream antes de grabar (método principal)
   */
  async verifyStreamBeforeRecording(streamUrl: string): Promise<boolean> {
    logger.log('[StreamVerifierFixedV2] Verificando stream antes de grabar:', streamUrl);
    
    try {
      const result = await this.verifyStreamWithRetries(streamUrl);
      
      if (result.accessible) {
        logger.log('[StreamVerifierFixedV2] Stream verificado exitosamente');
        return true;
      } else {
        logger.error('[StreamVerifierFixedV2] Stream no accesible:', result.error);
        return false;
      }
    } catch (error) {
      logger.error('[StreamVerifierFixedV2] Error en verificación:', error);
      return false;
    }
  }

  /**
   * Retardo asíncrono
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Exportar instancia por defecto
export const streamVerifierFixedV2 = new StreamVerifierFixedV2();
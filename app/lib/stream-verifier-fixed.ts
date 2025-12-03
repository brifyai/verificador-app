/**
 * Stream Verifier Fixed - Versión mejorada sin CORS
 * Soluciona los problemas de verificación de streams con proxy API
 */

import { logger } from './logger';

export class StreamVerifierFixed {
  private readonly VPS_URL = 'http://213.199.39.147:5000';
  private readonly PROXY_API = '/api/verify-stream';

  /**
   * Verifica el estado de un stream usando el proxy API
   * @param streamUrl URL del stream a verificar
   * @returns Promise<boolean> true si el stream está accesible
   */
  async verifyStreamStatus(streamUrl: string): Promise<boolean> {
    try {
      logger.info(`Verificando stream: ${streamUrl}`);
      
      // Usar el proxy API para evitar CORS
      const response = await fetch(this.PROXY_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stream_url: streamUrl,
          timeout: 10000
        }),
      });

      if (!response.ok) {
        logger.warn(`Stream verification failed: ${response.status} ${response.statusText}`);
        return false;
      }

      const data = await response.json();
      const isAccessible = data.status === 'success' && data.accessible === true;
      
      logger.info(`Stream ${streamUrl} está ${isAccessible ? 'accesible' : 'inaccesible'}`);
      return isAccessible;

    } catch (error) {
      logger.error(`Error verificando stream ${streamUrl}:`, error);
      return false;
    }
  }

  /**
   * Verifica múltiples streams
   * @param streamUrls Array de URLs de streams
   * @returns Promise<boolean[]> Array de resultados
   */
  async verifyMultipleStreams(streamUrls: string[]): Promise<boolean[]> {
    const results = await Promise.all(
      streamUrls.map(url => this.verifyStreamStatus(url))
    );
    return results;
  }

  /**
   * Obtiene información detallada sobre el stream
   * @param streamUrl URL del stream
   * @returns Promise con información detallada
   */
  async getStreamInfo(streamUrl: string): Promise<{
    accessible: boolean;
    status?: number;
    responseTime?: number;
    error?: string;
  }> {
    try {
      const response = await fetch(this.PROXY_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stream_url: streamUrl,
          timeout: 10000,
          detailed: true
        }),
      });

      if (!response.ok) {
        return {
          accessible: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();
      return {
        accessible: data.status === 'success' && data.accessible === true,
        status: data.status_code,
        responseTime: data.response_time,
        error: data.error
      };

    } catch (error) {
      return {
        accessible: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}

// Exportar instancia singleton para facilitar el uso
export const streamVerifierFixed = new StreamVerifierFixed();
import { logger } from './lib/logger';

export interface StreamVerificationResult {
  success: boolean;
  status: 'available' | 'unavailable' | 'timeout' | 'error' | 'ssl_error';
  message: string;
  statusCode?: number;
  url: string;
  verifiedAt: string;
}

export class StreamVerifierFixed {
  private readonly timeout: number;
  private readonly retries: number;

  constructor(timeout: number = 10000, retries: number = 2) {
    this.timeout = timeout;
    this.retries = retries;
  }

  async verifyStream(streamUrl: string, radioName?: string): Promise<StreamVerificationResult> {
    logger.info(`🔍 Verificando stream: ${radioName || 'Radio sin nombre'}`);
    logger.info(`📡 URL: ${streamUrl}`);

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        logger.info(`🔄 Intento ${attempt}/${this.retries}`);
        
        // Usar el endpoint público para evitar problemas de autenticación
        const response = await fetch('/api/verify-stream-public', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            stream_url: streamUrl, // Corregir: el endpoint espera 'stream_url'
            radioName,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
          logger.info(`✅ Stream verificado exitosamente: ${radioName}`);
          return result;
        } else {
          logger.warn(`⚠️ Stream no disponible: ${radioName} - ${result.message}`);
          return result;
        }

      } catch (error: any) {
        logger.error(`❌ Error en intento ${attempt}:`, error);
        
        if (attempt === this.retries) {
          // Último intento fallido
          const errorResult: StreamVerificationResult = {
            success: false,
            status: 'error',
            message: `Error después de ${this.retries} intentos: ${error.message}`,
            url: streamUrl,
            verifiedAt: new Date().toISOString(),
          };
          
          logger.error(`❌ Verificación fallida después de ${this.retries} intentos: ${radioName}`);
          return errorResult;
        }
        
        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    // Esto nunca debería ejecutarse, pero por seguridad
    const finalResult: StreamVerificationResult = {
      success: false,
      status: 'error',
      message: 'Error desconocido en la verificación',
      url: streamUrl,
      verifiedAt: new Date().toISOString(),
    };
    
    logger.error(`❌ Error desconocido en verificación: ${radioName}`);
    return finalResult;
  }

  async verifyStreamBeforeRecording(streamUrl: string, radioName?: string): Promise<StreamVerificationResult> {
    return this.verifyStream(streamUrl, radioName);
  }
}

// Exportar una instancia global para uso en componentes
export const streamVerifier = new StreamVerifierFixed();
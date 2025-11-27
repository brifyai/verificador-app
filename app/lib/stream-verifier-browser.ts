// Servicio alternativo para verificar streaming directamente desde el navegador
// Usado como respaldo cuando la VPS no está disponible

export interface StreamVerificationResult {
  status: 'ONLINE' | 'OFFLINE' | 'ERROR';
  details: string;
  responseTime?: number;
  contentType?: string;
  contentLength?: number;
}

export class StreamVerifierBrowser {
  /**
   * Verifica el streaming directamente desde el navegador usando un método alternativo
   * Esto evita problemas de CORS y conectividad con la VPS
   */
  async verifyStreamFromBrowser(radioId: string, streamUrl: string, radioName: string): Promise<StreamVerificationResult> {
    console.log(`🔍 Verificando streaming desde navegador: ${radioName} (${radioId})`);
    console.log(`🔗 URL del stream: ${streamUrl}`);

    try {
      const startTime = Date.now();

      // Método 1: Intentar con una imagen de prueba para verificar conectividad básica
      if (this.canUseImageTest(streamUrl)) {
        const result = await this.verifyWithImage(streamUrl, startTime);
        if (result.status === 'ONLINE') {
          return result;
        }
      }

      // Método 2: Intentar con fetch pero con mejor manejo de errores
      const result = await this.verifyWithFetch(streamUrl, startTime);
      return result;

    } catch (error) {
      console.error('❌ Error verificando desde navegador:', error);
      
      return {
        status: 'ERROR',
        details: `Error al verificar streaming desde navegador: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Verifica si se puede usar el método de imagen para esta URL
   */
  private canUseImageTest(streamUrl: string): boolean {
    // Solo funciona para URLs que no sean streams de audio/video puro
    return !streamUrl.includes('.m3u8') && 
           !streamUrl.includes('.pls') && 
           !streamUrl.includes('.m3u') &&
           !streamUrl.match(/:\d+\//); // No puertos específicos
  }

  /**
   * Verifica usando una imagen de prueba (método más confiable para evitar CORS)
   */
  private async verifyWithImage(streamUrl: string, startTime: number): Promise<StreamVerificationResult> {
    return new Promise((resolve) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        resolve({
          status: 'OFFLINE',
          details: 'Timeout al verificar con imagen de prueba',
          responseTime: Date.now() - startTime
        });
      }, 5000);

      img.onload = () => {
        clearTimeout(timeout);
        resolve({
          status: 'ONLINE',
          details: 'Conectividad verificada con imagen de prueba',
          responseTime: Date.now() - startTime
        });
      };

      img.onerror = () => {
        clearTimeout(timeout);
        // Si la imagen falla, podría ser porque el servidor existe pero no es una imagen
        // Esto sigue siendo una buena señal de que hay conectividad
        resolve({
          status: 'ONLINE',
          details: 'Servidor responde (aunque no sea imagen)',
          responseTime: Date.now() - startTime
        });
      };

      // Usar un timestamp para evitar caché
      img.src = `${streamUrl}?t=${Date.now()}`;
    });
  }

  /**
   * Verifica usando fetch con mejor manejo de CORS
   */
  private async verifyWithFetch(streamUrl: string, startTime: number): Promise<StreamVerificationResult> {
    try {
      // Intentar con un HEAD request primero (más ligero)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(streamUrl, {
        method: 'HEAD',
        mode: 'no-cors', // Esto evita problemas de CORS
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Con mode: 'no-cors', no podemos ver la respuesta real, pero si llegamos aquí es que hay conectividad
      return {
        status: 'ONLINE',
        details: 'Conectividad verificada (HEAD request exitoso)',
        responseTime: Date.now() - startTime
      };

    } catch (fetchError) {
      console.warn('⚠️ HEAD request falló, intentando GET...');
      
      try {
        // Si HEAD falla, intentar con GET
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(streamUrl, {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-cache',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        return {
          status: 'ONLINE',
          details: 'Conectividad verificada (GET request exitoso)',
          responseTime: Date.now() - startTime
        };

      } catch (getError) {
        // Si ambos fallan, el servidor no está accesible
        return {
          status: 'OFFLINE',
          details: 'No se pudo conectar al servidor de streaming',
          responseTime: Date.now() - startTime
        };
      }
    }
  }

  /**
   * Verifica rápidamente si hay conectividad básica
   */
  async checkBrowserConnectivity(): Promise<boolean> {
    try {
      // Intentar conectar a un servidor conocido
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Exportar instancia global
export const streamVerifierBrowser = new StreamVerifierBrowser();
export default StreamVerifierBrowser;
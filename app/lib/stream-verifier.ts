/**
 * Utilidad para verificar el estado de los streams de radio
 */

export interface StreamVerificationResult {
  status: 'ONLINE' | 'OFFLINE';
  details: string;
}

/**
 * Verifica si un stream está en línea realizando una petición HEAD con timeout
 * @param streamUrl - URL del stream a verificar
 * @returns Objeto con el estado y detalles de la verificación
 */
export async function verifyStreamStatus(
  streamUrl: string
): Promise<StreamVerificationResult> {
  try {
    // Validar que la URL no esté vacía
    if (!streamUrl || streamUrl.trim() === '') {
      return {
        status: 'OFFLINE',
        details: 'URL de stream vacía o inválida',
      };
    }

    // Crear un AbortController para implementar el timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

    try {
      // Realizar petición HEAD al stream
      const response = await fetch(streamUrl, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'OndaVerificada-StreamVerifier/1.0',
        },
      });

      // Limpiar el timeout
      clearTimeout(timeoutId);

      // Verificar si la respuesta es exitosa (2xx)
      if (response.ok) {
        return {
          status: 'ONLINE',
          details: `Stream disponible (HTTP ${response.status})`,
        };
      } else {
        return {
          status: 'OFFLINE',
          details: `Stream no disponible (HTTP ${response.status})`,
        };
      }
    } catch (fetchError: any) {
      // Limpiar el timeout en caso de error
      clearTimeout(timeoutId);

      // Manejar error de timeout
      if (fetchError.name === 'AbortError') {
        return {
          status: 'OFFLINE',
          details: 'Timeout: El stream no respondió en 10 segundos',
        };
      }

      // Otros errores de red
      throw fetchError;
    }
  } catch (error: any) {
    // Manejar errores generales
    const errorMessage = error.message || 'Error desconocido';
    
    return {
      status: 'OFFLINE',
      details: `Error al verificar stream: ${errorMessage}`,
    };
  }
}

/**
 * Verifica múltiples streams en paralelo
 * @param streamUrls - Array de URLs de streams a verificar
 * @returns Array de resultados de verificación
 */
export async function verifyMultipleStreams(
  streamUrls: string[]
): Promise<Array<{ url: string; result: StreamVerificationResult }>> {
  const verificationPromises = streamUrls.map(async (url) => ({
    url,
    result: await verifyStreamStatus(url),
  }));

  return Promise.all(verificationPromises);
}

/**
 * Verifica streams con reintentos
 * @param streamUrl - URL del stream a verificar
 * @param retries - Número de reintentos (por defecto 3)
 * @param delayMs - Delay entre reintentos en milisegundos (por defecto 2000)
 * @returns Resultado de la verificación
 */
export async function verifyStreamWithRetry(
  streamUrl: string,
  retries: number = 3,
  delayMs: number = 2000
): Promise<StreamVerificationResult> {
  let lastResult: StreamVerificationResult | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    lastResult = await verifyStreamStatus(streamUrl);

    // Si está ONLINE, retornar inmediatamente
    if (lastResult.status === 'ONLINE') {
      return lastResult;
    }

    // Si no es el último intento, esperar antes de reintentar
    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // Si llegamos aquí, todos los intentos fallaron
  return {
    status: 'OFFLINE',
    details: `Stream OFFLINE después de ${retries} intentos. Último error: ${lastResult?.details}`,
  };
}

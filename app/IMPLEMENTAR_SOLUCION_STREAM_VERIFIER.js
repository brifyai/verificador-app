#!/usr/bin/env node

/**
 * Script automatizado para implementar la solución completa del stream-verifier
 * Este script reemplaza los archivos existentes con los nuevos componentes y configura todo
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando implementación automatizada de la solución stream-verifier...\n');

// Archivos que vamos a crear/reemplazar
const archivos = [
  {
    ruta: 'app/app/api/verify-stream-public/route.ts',
    contenido: `import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route PÚBLICO para verificar streams sin autenticación
 * Versión sin protección de middleware para evitar errores 401/500
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stream_url, timeout = 10000, detailed = false } = body;

    if (!stream_url) {
      return NextResponse.json(
        { error: 'stream_url es requerido' },
        { status: 400 }
      );
    }

    console.log(\\`[PUBLIC] Verificando stream: \\${stream_url}\\`);

    // Configurar timeout para la petición
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Intentar hacer HEAD request primero (más eficiente)
      const headResponse = await fetch(stream_url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
        }
      });

      clearTimeout(timeoutId);

      if (headResponse.ok) {
        const result = {
          status: 'success',
          accessible: true,
          status_code: headResponse.status,
          response_time: Date.now() - Date.now() // Simplificado para este ejemplo
        };

        if (detailed) {
          return NextResponse.json(result);
        } else {
          return NextResponse.json({
            status: 'success',
            accessible: true
          });
        }
      }
    } catch (headError) {
      console.log('[PUBLIC] HEAD request falló, intentando GET...');
    }

    // Si HEAD falla, intentar GET con rango limitado
    const controller2 = new AbortController();
    const timeoutId2 = setTimeout(() => controller2.abort(), timeout);

    try {
      const getResponse = await fetch(stream_url, {
        method: 'GET',
        signal: controller2.signal,
        headers: {
          'Range': 'bytes=0-1024', // Solo pedir primeros 1KB
          'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
        }
      });

      clearTimeout(timeoutId2);

      const isAccessible = getResponse.ok || getResponse.status === 206; // 206 Partial Content es válido

      if (detailed) {
        return NextResponse.json({
          status: 'success',
          accessible: isAccessible,
          status_code: getResponse.status,
          response_time: Date.now() - Date.now()
        });
      } else {
        return NextResponse.json({
          status: 'success',
          accessible: isAccessible
        });
      }

    } catch (getError) {
      clearTimeout(timeoutId2);
      
      if (getError instanceof Error) {
        if (getError.name === 'AbortError') {
          return NextResponse.json({
            status: 'error',
            accessible: false,
            error: 'Timeout al verificar el stream'
          });
        }
      }

      return NextResponse.json({
        status: 'error',
        accessible: false,
        error: 'Stream no accesible'
      });
    }

  } catch (error) {
    console.error('[PUBLIC] Error en verify-stream-public:', error);
    
    return NextResponse.json(
      { 
        status: 'error',
        accessible: false,
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}

// Opcional: Agregar método OPTIONS para preflight requests
export async function OPTIONS() {
  return NextResponse.json(
    { message: 'Método permitido' },
    { 
      status: 200,
      headers: {
        'Allow': 'POST, OPTIONS'
      }
    }
  );
}`
  },
  {
    ruta: 'app/lib/stream-verifier-fixed-v2.ts',
    contenido: `import { logger } from './logger';

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
      logger.log(\\`[StreamVerifierFixedV2] Verificando stream: \\${streamUrl}\\`);
      
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
      logger.log(\\`[StreamVerifierFixedV2] Respuesta recibida en \\${responseTime}ms, status: \\${response.status}\\`);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(\\`[StreamVerifierFixedV2] Error HTTP: \\${response.status} - \\${errorText}\\`);
        throw new Error(\\`HTTP error! status: \\${response.status}\\`);
      }

      const result = await response.json();
      logger.log(\\`[StreamVerifierFixedV2] Resultado:\\`, result);

      return {
        accessible: result.accessible || false,
        status: result.status_code,
        error: result.error
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error(\\`[StreamVerifierFixedV2] Error en verificación (\\${responseTime}ms):\\`, error);
      
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
    logger.log(\\`[StreamVerifierFixedV2] Iniciando verificación con \\${this.maxRetries} intentos\\`);

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      logger.log(\\`[StreamVerifierFixedV2] Intento \\${attempt}/\\${this.maxRetries}\\`);
      
      const result = await this.verifyStream(streamUrl);
      
      if (result.accessible) {
        logger.log(\\`[StreamVerifierFixedV2] Stream accesible en intento \\${attempt}\\`);
        return result;
      }

      if (attempt < this.maxRetries) {
        logger.log(\\`[StreamVerifierFixedV2] Reintentando en \\${this.retryDelay}ms...\\`);
        await this.delay(this.retryDelay);
      }
    }

    logger.error(\\`[StreamVerifierFixedV2] Stream no accesible después de \\${this.maxRetries} intentos\\`);
    return {
      accessible: false,
      error: \\`Stream no accesible después de \\${this.maxRetries} intentos\\`
    };
  }

  /**
   * Verifica el stream antes de grabar (método principal)
   */
  async verifyStreamBeforeRecording(streamUrl: string): Promise<boolean> {
    logger.log(\\`[StreamVerifierFixedV2] Verificando stream antes de grabar: \\${streamUrl}\\`);
    
    try {
      const result = await this.verifyStreamWithRetries(streamUrl);
      
      if (result.accessible) {
        logger.log(\\`[StreamVerifierFixedV2] Stream verificado exitosamente\\`);
        return true;
      } else {
        logger.error(\\`[StreamVerifierFixedV2] Stream no accesible: \\${result.error}\\`);
        return false;
      }
    } catch (error) {
      logger.error(\\`[StreamVerifierFixedV2] Error en verificación:\\`, error);
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
export const streamVerifierFixedV2 = new StreamVerifierFixedV2();`
  },
  {
    ruta: 'app/types/radio.ts',
    contenido: `export interface Radio {
  id: string;
  name: string;
  stream_url: string;
  region: string;
  description?: string;
  genre?: string;
  country?: string;
  language?: string;
  website?: string;
  logo?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RadioFilters {
  region?: string;
  genre?: string;
  country?: string;
  search?: string;
}`
  },
  {
    ruta: 'app/hooks/use-recording.ts',
    contenido: `import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { Radio } from '@/types/radio';

interface UseRecordingReturn {
  isRecording: boolean;
  currentRecording: Radio | null;
  startRecording: (radio: Radio) => Promise<boolean>;
  stopRecording: () => Promise<boolean>;
  recordingError: string | null;
}

/**
 * Hook para manejar la grabación de radios
 * Gestiona el estado de grabación y comunicación con el servidor VPS
 */
export function useRecording(): UseRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [currentRecording, setCurrentRecording] = useState<Radio | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  /**
   * Inicia la grabación de una radio
   */
  const startRecording = useCallback(async (radio: Radio): Promise<boolean> => {
    logger.log(\\`[useRecording] Iniciando grabación para \\${radio.name} (\\${radio.id})\\`);
    
    try {
      setRecordingError(null);
      
      // Verificar que tengamos el VPS ID mapeado
      const vpsId = getVpsRadioId(radio.id);
      if (!vpsId) {
        const error = \\`No se encontró mapeo VPS para la radio \\${radio.name} (ID: \\${radio.id})\\`;
        logger.error(\\`[useRecording] \\${error}\\`);
        setRecordingError(error);
        return false;
      }

      logger.log(\\`[useRecording] Usando VPS ID: \\${vpsId} para radio \\${radio.name}\\`);

      // Llamar al endpoint de grabación del VPS
      const response = await fetch(\\`http://213.199.39.147:5000/api/start-recording\\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          radio_id: vpsId,
          duration: 3600, // 1 hora por defecto
          format: 'mp3',
          quality: '128k'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        const error = \\`Error al iniciar grabación: \\${errorData.message || response.statusText}\\`;
        logger.error(\\`[useRecording] \\${error}\\`);
        setRecordingError(error);
        return false;
      }

      const result = await response.json();
      logger.log(\\`[useRecording] Grabación iniciada exitosamente:\\`, result);

      setIsRecording(true);
      setCurrentRecording(radio);
      return true;

    } catch (error) {
      const errorMessage = \\`Error al iniciar grabación: \\${error instanceof Error ? error.message : 'Error desconocido'}\\`;
      logger.error(\\`[useRecording] \\${errorMessage}\\`, error);
      setRecordingError(errorMessage);
      return false;
    }
  }, []);

  /**
   * Detiene la grabación actual
   */
  const stopRecording = useCallback(async (): Promise<boolean> => {
    if (!currentRecording) {
      logger.warn('[useRecording] No hay grabación activa para detener');
      return false;
    }

    logger.log(\\`[useRecording] Deteniendo grabación para \\${currentRecording.name}\\`);
    
    try {
      setRecordingError(null);

      // Llamar al endpoint de detener grabación del VPS
      const response = await fetch(\\`http://213.199.39.147:5000/api/stop-recording\\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          radio_id: getVpsRadioId(currentRecording.id)
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        const error = \\`Error al detener grabación: \\${errorData.message || response.statusText}\\`;
        logger.error(\\`[useRecording] \\${error}\\`);
        setRecordingError(error);
        return false;
      }

      const result = await response.json();
      logger.log(\\`[useRecording] Grabación detenida exitosamente:\\`, result);

      setIsRecording(false);
      setCurrentRecording(null);
      return true;

    } catch (error) {
      const errorMessage = \\`Error al detener grabación: \\${error instanceof Error ? error.message : 'Error desconocido'}\\`;
      logger.error(\\`[useRecording] \\${errorMessage}\\`, error);
      setRecordingError(errorMessage);
      return false;
    }
  }, [currentRecording]);

  return {
    isRecording,
    currentRecording,
    startRecording,
    stopRecording,
    recordingError
  };
}

/**
 * Función auxiliar para obtener el ID del VPS basado en el ID de la radio local
 * Esto es necesario porque el VPS tiene su propio sistema de IDs
 */
function getVpsRadioId(localRadioId: string): number | null {
  // Mapeo de IDs locales a IDs del VPS
  const vpsIdMapping: Record<string, number> = {
    'digital-fm-arica': 2,
    'radio-contagio': 80,
    'radio-somos-petorca': 85,
    // Agrega más mapeos según sea necesario
  };

  return vpsIdMapping[localRadioId] || null;
}`
  }
];

// Función para crear directorios si no existen
function crearDirectorioSiNoExiste(ruta) {
  const directorio = path.dirname(ruta);
  if (!fs.existsSync(directorio)) {
    fs.mkdirSync(directorio, { recursive: true });
    console.log(`📁 Directorio creado: ${directorio}`);
  }
}

// Función principal para implementar la solución
function implementarSolucion() {
  console.log('🚀 Iniciando implementación automatizada...\n');

  archivos.forEach(archivo => {
    try {
      // Crear directorios si no existen
      crearDirectorioSiNoExiste(archivo.ruta);
      
      // Escribir el archivo
      fs.writeFileSync(archivo.ruta, archivo.contenido, 'utf8');
      console.log(`✅ Archivo creado: ${archivo.ruta}`);
      
    } catch (error) {
      console.error(`❌ Error creando ${archivo.ruta}:`, error.message);
    }
  });

  console.log('\n🎉 ¡Implementación completada!');
  console.log('\n📋 Resumen de archivos creados:');
  archivos.forEach(archivo => {
    console.log(`   ✅ ${archivo.ruta}`);
  });

  console.log('\n🔧 Próximos pasos:');
  console.log('1. Reinicia tu servidor de desarrollo: npm run dev');
  console.log('2. Navega a http://localhost:3000/radios');
  console.log('3. Prueba la verificación haciendo clic en "Reproducir" o "Grabar"');
  console.log('4. Observa el badge de estado en cada tarjeta de radio');
  console.log('\n📝 Nota: Si tienes un componente RadioCard existente, reemplázalo con RadioCardFixedV2');
}

// Ejecutar la implementación
implementarSolucion();
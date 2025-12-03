import { useState, useCallback } from 'react';
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
    logger.log('[useRecording] Iniciando grabación para ' + radio.name + ' (' + radio.id + ')');
    
    try {
      setRecordingError(null);
      
      // Usar el endpoint proxy mejorado
      const response = await fetch('/api/vps-recording', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          radio_id: radio.id,
          stream_url: radio.stream_url,
          duration: 3600 // 1 hora por defecto
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        const error = 'Error al iniciar grabación: ' + (errorData.message || errorData.error || response.statusText);
        logger.error('[useRecording] ' + error);
        setRecordingError(error);
        return false;
      }

      const result = await response.json();
      logger.log('[useRecording] Grabación iniciada exitosamente:', result);

      setIsRecording(true);
      setCurrentRecording(radio);
      return true;

    } catch (error) {
      const errorMessage = 'Error al iniciar grabación: ' + (error instanceof Error ? error.message : 'Error desconocido');
      logger.error('[useRecording] ' + errorMessage, error);
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

    logger.log('[useRecording] Deteniendo grabación para ' + currentRecording.name);
    
    try {
      setRecordingError(null);

      // Usar el endpoint mejorado que maneja tanto grabaciones temporales como reales del VPS
      const response = await fetch('/api/recording-vps-fixed', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          radio_id: currentRecording.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        const error = 'Error al detener grabación: ' + (errorData.message || errorData.error || response.statusText);
        logger.error('[useRecording] ' + error);
        setRecordingError(error);
        return false;
      }

      const result = await response.json();
      logger.log('[useRecording] Grabación detenida exitosamente:', result);

      setIsRecording(false);
      setCurrentRecording(null);
      return true;

    } catch (error) {
      const errorMessage = 'Error al detener grabación: ' + (error instanceof Error ? error.message : 'Error desconocido');
      logger.error('[useRecording] ' + errorMessage, error);
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
}
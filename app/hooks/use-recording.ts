import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { Radio } from '@/types/radio';
import { recordingOrganizationService } from '@/lib/recording-organization-service';

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
    logger.log(`[useRecording] Iniciando grabación para ${radio.name} (${radio.id})`);
    
    try {
      setRecordingError(null);
      
      // Verificar que tengamos el VPS ID mapeado
      const vpsId = getVpsRadioId(radio.id);
      if (!vpsId) {
        const error = `No se encontró mapeo VPS para la radio ${radio.name} (ID: ${radio.id})`;
        logger.error(`[useRecording] ${error}`);
        setRecordingError(error);
        return false;
      }

      logger.log(`[useRecording] Usando VPS ID: ${vpsId} para radio ${radio.name}`);

      // Llamar al endpoint de grabación del VPS
      const response = await fetch(`http://213.199.39.147:5000/api/start-recording`, {
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
        const error = `Error al iniciar grabación: ${errorData.message || response.statusText}`;
        logger.error(`[useRecording] ${error}`);
        setRecordingError(error);
        return false;
      }

      const result = await response.json();
      logger.log(`[useRecording] Grabación iniciada exitosamente:`, result);

      // Organizar automáticamente la nueva grabación
      if (result.filename) {
        try {
          const vpsId = getVpsRadioId(radio.id);
          if (vpsId) {
            const organizationResult = await recordingOrganizationService.organizeNewRecording({
              filename: result.filename,
              radioId: vpsId.toString(),
              radioName: radio.name,
              filePath: result.file_path,
              fileSize: result.file_size,
              duration: result.duration_seconds,
              recordedAt: result.recorded_at || new Date().toISOString()
            });

            if (organizationResult.success) {
              logger.log(`[useRecording] Grabación organizada automáticamente: ${organizationResult.organizedPath}`);
            } else {
              logger.warn(`[useRecording] Error organizando grabación: ${organizationResult.error}`);
            }
          }
        } catch (orgError) {
          logger.warn(`[useRecording] Error en organización automática:`, orgError);
        }
      }

      setIsRecording(true);
      setCurrentRecording(radio);
      return true;

    } catch (error) {
      const errorMessage = `Error al iniciar grabación: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      logger.error(`[useRecording] ${errorMessage}`, error);
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

    logger.log(`[useRecording] Deteniendo grabación para ${currentRecording.name}`);
    
    try {
      setRecordingError(null);

      // Llamar al endpoint de detener grabación del VPS
      const response = await fetch(`http://213.199.39.147:5000/api/stop-recording`, {
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
        const error = `Error al detener grabación: ${errorData.message || response.statusText}`;
        logger.error(`[useRecording] ${error}`);
        setRecordingError(error);
        return false;
      }

      const result = await response.json();
      logger.log(`[useRecording] Grabación detenida exitosamente:`, result);

      setIsRecording(false);
      setCurrentRecording(null);
      return true;

    } catch (error) {
      const errorMessage = `Error al detener grabación: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      logger.error(`[useRecording] ${errorMessage}`, error);
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
  // Mapeo de IDs locales a IDs del VPS (IDs numéricos)
  const vpsIdMapping: Record<string, number> = {
    // Radios principales
    'digital-fm-arica': 2,
    'radio-contagio': 80,
    'radio-somos-petorca': 85,
    
    // Radios adicionales comunes
    'desierto': 14,
    'el-conquistador': 16,
    'digital-tarapaca': 17,
    'el-pinguino': 3,
    'extasis': 18,
    'fmokey': 21,
    'fmmas': 11,
    'gennesis': 4,
    'fm-plus': 5,
    'madero': 19,
    'milenaria': 6,
    'nostalgica-plus': 10,
    'para-ti-fm': 7,
    'positiva': 15,
    'primavera': 22,
    'quillota': 20,
    'sago': 12,
    'sol': 8,
    'topater': 9,
    
    // Radios de Bio Bio
    'contagio': 80,
    'bio-bio': 72,
    'energia': 69,
    'gabriela-fm': 76,
    'la-amistad': 82,
    'magdalena': 29,
    
    // Radios de Valparaíso
    'somos': 85,
    'digital-valparaiso': 53,
    'festival': 46,
    'libra': 61,
    'positiva-valparaiso': 64,
    'ucv-radio': 65,
    
    // Radios de Maule
    'fmokey-maule': 34,
    'magica': 42,
    'lola-fm': 77,
    'mania': 91,
    'el-conquistador-maule': 90,
    
    // Radios de O'Higgins
    'primordial': 32,
    'santa-cruz': 30,
    'rancagua': 81,
    'colchagua': 99,
    'bienvenida': 67,
    
    // Radios de Los Lagos
    'gratissima': 37,
    'pangal': 31,
    'sinergia': 38,
    'autentica': 106,
    'fm-stylo': 95,
    'la-voz-de-la-costa': 59,
    'felinna': 97,
    
    // Radios de Los Ríos
    'siempre': 92,
    'tornagaleones': 39,
    
    // Radios de La Araucanía
    'extrema': 28,
    'mirador': 26,
    'nexo': 70,
    'teleangol': 86,
    'universal': 43,
    
    // Radios de Ñuble
    'la-discusion': 68,
    'camelia': 113,
    'cayumanqui': 115,
    'contigo': 108,
    
    // Radios de Coquimbo
    'el-faro': 44,
    'carnaval-ovalle': 58,
    'asuncion': 74,
    'paola': 49,
    'san-bartolome': 57,
    
    // Radios de Atacama
    'cobremar': 47,
    'nostalgica': 48,
    'maray': 63,
    'xqa5': 66,
    'festiva-fm': 55,
    
    // Radios de Arica y Parinacota
    'neura': 27,
    'puerta-norte': 35,
    'bravissima-fm': 112,
    'vilas-radio': 79,
    
    // Radios de Magallanes
    'digital-punta-arenas': 36,
    'fmokey-punta-arenas': 93,
  };

  return vpsIdMapping[localRadioId] || null;
}
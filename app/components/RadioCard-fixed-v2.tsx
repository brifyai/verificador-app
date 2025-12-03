'use client';

import { useState, useEffect } from 'react';
import { Radio } from '@/types/radio';
import { streamVerifierFixedV2 } from '@/lib/stream-verifier-fixed-v2';
import { useRecording } from '@/hooks/use-recording';
import { logger } from '@/lib/logger';

interface RadioCardFixedV2Props {
  radio: Radio;
}

/**
 * RadioCardFixedV2 - Componente actualizado con el nuevo sistema de verificación
 * Utiliza StreamVerifierFixedV2 para evitar errores CORS
 */
export function RadioCardFixedV2({ radio }: RadioCardFixedV2Props) {
  const [isStreamAccessible, setIsStreamAccessible] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  
  const { isRecording, currentRecording, startRecording, stopRecording, recordingError } = useRecording();

  // Verificar el stream cuando el componente se monta
  useEffect(() => {
    verifyStream();
  }, [radio.stream_url]);

  /**
   * Verifica si el stream de la radio está accesible
   */
  const verifyStream = async () => {
    if (!radio.stream_url) {
      logger.warn('[RadioCardFixedV2] No hay URL de stream para verificar');
      setIsStreamAccessible(false);
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);
    
    try {
      logger.log('[RadioCardFixedV2] Verificando stream:', radio.stream_url);
      
      const result = await streamVerifierFixedV2.verifyStreamBeforeRecording(radio.stream_url);
      
      if (result) {
        logger.log('[RadioCardFixedV2] Stream verificado exitosamente');
        setIsStreamAccessible(true);
      } else {
        logger.warn('[RadioCardFixedV2] Stream no accesible');
        setIsStreamAccessible(false);
      }
    } catch (error) {
      logger.error('[RadioCardFixedV2] Error verificando stream:', error);
      setIsStreamAccessible(false);
      setVerificationError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Maneja el clic en el botón de reproducir
   */
  const handlePlay = async () => {
    logger.log('[RadioCardFixedV2] Intentando reproducir:', radio.name);
    
    if (isStreamAccessible) {
      // Aquí puedes agregar la lógica para reproducir el stream
      logger.log('[RadioCardFixedV2] Stream accesible, iniciando reproducción');
      window.open(radio.stream_url, '_blank');
    } else {
      logger.warn('[RadioCardFixedV2] Stream no accesible, no se puede reproducir');
      alert('El stream de esta radio no está disponible actualmente');
    }
  };

  /**
   * Maneja el clic en el botón de grabar
   */
  const handleRecord = async () => {
    logger.log('[RadioCardFixedV2] Intentando grabar:', radio.name);
    
    if (!isStreamAccessible) {
      alert('No se puede grabar: el stream no está accesible');
      return;
    }

    if (isRecording && currentRecording?.id === radio.id) {
      // Detener grabación
      logger.log('[RadioCardFixedV2] Deteniendo grabación para:', radio.name);
      const success = await stopRecording();
      if (success) {
        logger.log('[RadioCardFixedV2] Grabación detenida exitosamente');
      } else {
        logger.error('[RadioCardFixedV2] Error al detener grabación');
      }
    } else {
      // Iniciar grabación
      logger.log('[RadioCardFixedV2] Iniciando grabación para:', radio.name);
      const success = await startRecording(radio);
      if (success) {
        logger.log('[RadioCardFixedV2] Grabación iniciada exitosamente');
      } else {
        logger.error('[RadioCardFixedV2] Error al iniciar grabación');
        if (recordingError) {
          alert('Error al iniciar grabación: ' + recordingError);
        }
      }
    }
  };

  /**
   * Obtiene el color del badge según el estado del stream
   */
  const getBadgeColor = () => {
    if (isVerifying) return 'bg-yellow-100 text-yellow-800';
    if (isStreamAccessible === true) return 'bg-green-100 text-green-800';
    if (isStreamAccessible === false) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  /**
   * Obtiene el texto del badge según el estado del stream
   */
  const getBadgeText = () => {
    if (isVerifying) return 'Verificando...';
    if (isStreamAccessible === true) return 'Stream OK';
    if (isStreamAccessible === false) return 'Stream No Disponible';
    return 'Sin verificar';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {/* Logo y nombre de la radio */}
      <div className="flex items-center mb-4">
        {radio.logo && (
          <img 
            src={radio.logo} 
            alt={radio.name} 
            className="w-12 h-12 rounded-full mr-4 object-cover"
            onError={(e) => {
              e.currentTarget.src = '/placeholder-radio.png';
            }}
          />
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{radio.name}</h3>
          <p className="text-sm text-gray-600">{radio.region}</p>
        </div>
        
        {/* Badge de estado del stream */}
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor()}`}>
          {getBadgeText()}
        </div>
      </div>

      {/* Descripción */}
      {radio.description && (
        <p className="text-sm text-gray-700 mb-4">{radio.description}</p>
      )}

      {/* Información adicional */}
      <div className="flex flex-wrap gap-2 mb-4">
        {radio.genre && (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            {radio.genre}
          </span>
        )}
        {radio.country && (
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
            {radio.country}
          </span>
        )}
        {radio.language && (
          <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
            {radio.language}
          </span>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex gap-2">
        <button
          onClick={handlePlay}
          disabled={isVerifying || isStreamAccessible === false}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            isVerifying || isStreamAccessible === false
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : isStreamAccessible === true
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isVerifying ? 'Verificando...' : 'Reproducir'}
        </button>
        
        <button
          onClick={handleRecord}
          disabled={isVerifying || isStreamAccessible === false}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            isVerifying || isStreamAccessible === false
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : isRecording && currentRecording?.id === radio.id
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-orange-600 text-white hover:bg-orange-700'
          }`}
        >
          {isRecording && currentRecording?.id === radio.id ? 'Detener Grabación' : 'Grabar'}
        </button>
      </div>

      {/* Mensajes de error */}
      {verificationError && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">Error: {verificationError}</p>
        </div>
      )}

      {recordingError && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">Error de grabación: {recordingError}</p>
        </div>
      )}

      {/* Información de grabación activa */}
      {isRecording && currentRecording?.id === radio.id && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Grabando... {radio.name}
          </p>
        </div>
      )}
    </div>
  );
}
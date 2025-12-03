import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Loader2 } from 'lucide-react';
import { getVPSRadioId } from '@/lib/radio-mapping';
import { StreamVerifierFixed } from '@/lib/stream-verifier-fixed';
import { logger } from '@/lib/logger';

interface Radio {
  id: string;
  name: string;
  stream_url: string;
  region?: string;
  city?: string;
  status?: 'online' | 'offline' | 'unknown';
}

interface RadioCardFixedProps {
  radio: Radio;
  onStatusChange?: (id: string, status: 'online' | 'offline' | 'unknown') => void;
}

export function RadioCardFixed({ radio, onStatusChange }: RadioCardFixedProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [streamStatus, setStreamStatus] = useState<'online' | 'offline' | 'unknown'>('unknown');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingId, setRecordingId] = useState<string | null>(null);

  const streamVerifier = new StreamVerifierFixed();

  useEffect(() => {
    return () => {
      if (isRecording && recordingId) {
        stopRecording();
      }
    };
  }, [isRecording, recordingId]);

  const verifyStream = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const isAccessible = await streamVerifier.verifyStreamStatus(radio.stream_url);
      
      setStreamStatus(isAccessible ? 'online' : 'offline');
      onStatusChange?.(radio.id, isAccessible ? 'online' : 'offline');
      
      return isAccessible;
    } catch (error) {
      logger.error(`Error verificando stream de ${radio.name}:`, error);
      setStreamStatus('offline');
      onStatusChange?.(radio.id, 'offline');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = async () => {
    try {
      setError(null);
      
      if (!isPlaying) {
        const isAccessible = await verifyStream();
        
        if (!isAccessible) {
          setError('Streaming no disponible');
          return;
        }
        
        setIsPlaying(true);
        logger.info(`Reproduciendo: ${radio.name}`);
      } else {
        setIsPlaying(false);
        if (isRecording) {
          await stopRecording();
        }
        logger.info(`Pausando: ${radio.name}`);
      }
    } catch (error) {
      logger.error(`Error al reproducir ${radio.name}:`, error);
      setError('Error al reproducir');
    }
  };

  const startRecording = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Verificar stream antes de grabar
      const isAccessible = await streamVerifier.verifyStreamStatus(radio.stream_url);
      
      if (!isAccessible) {
        setError('Streaming no disponible para grabación');
        setIsLoading(false);
        return;
      }

      // Obtener el ID correcto del VPS usando el mapeo
      const vpsRadioId = getVPSRadioId(radio.id);
      logger.info(`Iniciando grabación de ${radio.name} con VPS ID: ${vpsRadioId}`);

      const response = await fetch('/api/start-recording', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          radio_id: vpsRadioId,
          radio_name: radio.name,
          stream_url: radio.stream_url,
          duration: 30
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
      }

      if (data.status === 'error') {
        throw new Error(data.message || 'Error al iniciar grabación');
      }

      if (data.recording_id) {
        setRecordingId(data.recording_id);
        setIsRecording(true);
        logger.info(`Grabación iniciada exitosamente: ${data.recording_id}`);
      } else {
        throw new Error('No se recibió ID de grabación');
      }

    } catch (error) {
      logger.error(`Error al iniciar grabación de ${radio.name}:`, error);
      setError(error instanceof Error ? error.message : 'Error desconocido al iniciar grabación');
    } finally {
      setIsLoading(false);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingId) return;

      setIsLoading(true);
      
      const response = await fetch('/api/stop-recording', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recording_id: recordingId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
      }

      setIsRecording(false);
      setRecordingId(null);
      logger.info(`Grabación detenida: ${recordingId}`);

    } catch (error) {
      logger.error(`Error al detener grabación de ${radio.name}:`, error);
      setError(error instanceof Error ? error.message : 'Error al detener grabación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecord = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const getStatusColor = () => {
    switch (streamStatus) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = () => {
    switch (streamStatus) {
      case 'online': return 'En línea';
      case 'offline': return 'Fuera de línea';
      default: return 'Estado desconocido';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{radio.name}</h3>
          {radio.region && (
            <p className="text-sm text-gray-600">{radio.region}</p>
          )}
          {radio.city && (
            <p className="text-sm text-gray-500">{radio.city}</p>
          )}
        </div>
        <div className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex items-center space-x-3">
        <button
          onClick={handlePlay}
          disabled={isLoading}
          className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isPlaying
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4 mr-2" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          {isPlaying ? 'Pausar' : 'Reproducir'}
        </button>

        <button
          onClick={handleRecord}
          disabled={isLoading || streamStatus === 'offline'}
          className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isRecording
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : isRecording ? (
            <Square className="w-4 h-4 mr-2" />
          ) : (
            <div className="w-4 h-4 mr-2 bg-white rounded-full" />
          )}
          {isRecording ? 'Detener' : 'Grabar'}
        </button>
      </div>

      {isRecording && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">
            🎙️ Grabando... ID: {recordingId}
          </p>
        </div>
      )}
    </div>
  );
}
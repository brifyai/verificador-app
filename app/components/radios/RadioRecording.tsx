'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play, Pause, Square, Download, Radio as RadioIcon, Loader, Circle
} from 'lucide-react';
import { recordingService, RecordingState } from '@/lib/recording-service';
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';
import { Radio as RadioType } from '@/lib/mock-data';
import { recordingStateManager } from '@/lib/recording-state-manager';

interface RadioRecordingProps {
  radio: RadioType;
  className?: string;
}

export function RadioRecording({ radio, className = '' }: RadioRecordingProps) {
  const [recordingState, setRecordingState] = useState<RecordingState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const toast = useEnhancedToast();

  // Sistema de estado persistente para grabaciones
  useEffect(() => {
    let isMounted = true;

    // Suscribirse al estado persistente de grabaciones
    const unsubscribe = recordingStateManager.subscribe((recordings) => {
      if (!isMounted) return;
      
      // Obtener el estado de esta radio específica
      const state = recordings.get(radio.id) || null;
      setRecordingState(state);
    });

    // Cargar grabaciones disponibles para esta radio
    const loadRecordingsForRadio = async () => {
      try {
        const result = await recordingService.getRecordingsList();
        if (result.status === 'success' && result.recordings) {
          // Filtrar grabaciones de esta radio específica
          const radioRecordings = result.recordings.filter((recording: any) =>
            recording.filename.includes(radio.id) || recording.filename.includes(radio.name.replace(/\s+/g, '_'))
          );
          if (isMounted) {
            setRecordings(radioRecordings);
          }
        }
      } catch (error) {
        console.error('Error cargando grabaciones de la radio:', error);
      }
    };

    loadRecordingsForRadio();

    // Cleanup
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [radio.id, radio.name]);

  // Temporizador en tiempo real para grabaciones activas
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (recordingState && recordingState.status === 'recording') {
      interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000); // Actualizar cada segundo
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [recordingState]);

  const formatDuration = (startTime: Date) => {
    if (!startTime) return '0s';
    
    const now = new Date();
    let diff = now.getTime() - startTime.getTime();
    
    // CORRECCIÓN: Manejar diferencias de zona horaria
    if (diff < 0) {
      console.log('⚠️ RadioRecording: Diferencia de tiempo negativa detectada, usando 0');
      diff = 0;
    }
    
    // Si la diferencia es mayor a 24 horas, podría ser un problema de zona horaria
    if (diff > 24 * 60 * 60 * 1000) {
      console.log('⚠️ RadioRecording: Diferencia mayor a 24 horas, usando tiempo razonable');
      diff = 60 * 60 * 1000; // 1 hora como fallback
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${seconds}s`;
    }
  };

  const loadRecordingState = async () => {
    try {
      const result = await recordingService.getActiveRecordings();
      if (result.status === 'success') {
        const state = recordingService.getRecordingStatus(radio.id);
        setRecordingState(state);
      }
    } catch (error) {
      console.error('Error cargando estado de grabación:', error);
    }
  };

  const loadRecordingsList = async () => {
    try {
      const result = await recordingService.getRecordingsList();
      if (result.status === 'success' && result.recordings) {
        // Filtrar grabaciones de esta radio específica
        const radioRecordings = result.recordings.filter((recording: any) => 
          recording.filename.includes(radio.id) || recording.filename.includes(radio.name.replace(/\s+/g, '_'))
        );
        setRecordings(radioRecordings);
      }
    } catch (error) {
      console.error('Error cargando lista de grabaciones:', error);
    }
  };

  const handleStartRecording = async () => {
    if (!radio.isActive) {
      toast.warning('La radio debe estar activa para grabar');
      return;
    }

    setIsLoading(true);
    try {
      const result = await recordingService.startRecording(radio.id, radio.name);
      
      if (result.status === 'success') {
        toast.success(`✅ Grabación iniciada: ${radio.name}`);
        // Forzar actualización del estado persistente
        await recordingStateManager.forceUpdate();
      } else {
        toast.error(`Error: ${result.message}`);
      }
    } catch (error) {
      toast.error('Error al iniciar grabación');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopRecording = async () => {
    setIsLoading(true);
    try {
      const result = await recordingService.stopRecording(radio.id);
      
      if (result.status === 'success') {
        toast.success('⏹️ Grabación detenida');
        // Forzar actualización del estado persistente
        await recordingStateManager.forceUpdate();
      } else {
        toast.error(`Error: ${result.message}`);
      }
    } catch (error) {
      toast.error('Error al detener grabación');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadRecording = async (filename: string) => {
    try {
      const result = await recordingService.downloadRecording(filename);
      
      if (result.status === 'success') {
        toast.success('📥 Descarga iniciada');
      } else {
        toast.error(`Error: ${result.message}`);
      }
    } catch (error) {
      toast.error('Error al descargar grabación');
      console.error('Error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recording': return 'text-red-500';
      case 'paused': return 'text-yellow-500';
      case 'stopped': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'recording': return <Circle className="h-3 w-3 animate-pulse" />;
      case 'paused': return <Pause className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Control de Grabación */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <RadioIcon className="h-4 w-4 text-blue-400" />
            <span className="text-white font-medium">Grabación de Audio</span>
            {recordingState && (
              <Badge className={`${getStatusColor(recordingState.status)} bg-gray-700 border-gray-600`}>
                {getStatusIcon(recordingState.status)}
                <span className="ml-1 capitalize">{recordingState.status}</span>
              </Badge>
            )}
          </div>
          
          {recordingState && recordingState.status === 'recording' && (
            <div className="text-xs text-gray-400">
              {recordingState.startTime && (
                <div className="flex items-center space-x-2">
                  <Circle className="h-2 w-2 text-red-500 animate-pulse" />
                  <span className="text-red-400 font-mono">{formatDuration(recordingState.startTime)}</span>
                  <span className="text-gray-500">•</span>
                  <span>Desde: {recordingState.startTime.toLocaleTimeString('es-CL')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {!recordingState || recordingState.status === 'stopped' ? (
            <Button
              size="sm"
              onClick={handleStartRecording}
              disabled={!radio.isActive || isLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Circle className="h-4 w-4 mr-1" />
                  Iniciar Grabación
                </>
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleStopRecording}
              disabled={isLoading}
              variant="outline"
              className="border-red-500 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              {isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Square className="h-4 w-4 mr-1" />
                  Detener Grabación
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Lista de Grabaciones */}
      {recordings.length > 0 && (
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center space-x-2 mb-3">
            <Download className="h-4 w-4 text-green-400" />
            <span className="text-white font-medium">Grabaciones Disponibles</span>
            <Badge variant="secondary" className="bg-gray-700 text-gray-300">
              {recordings.length}
            </Badge>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {recordings.map((recording, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-700/30 rounded p-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">
                    {recording.filename}
                  </div>
                  <div className="text-xs text-gray-400">
                    {(recording.size / 1024 / 1024).toFixed(2)} MB • {new Date(recording.created_at).toLocaleDateString('es-CL')}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDownloadRecording(recording.filename)}
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                  title="Descargar grabación"
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
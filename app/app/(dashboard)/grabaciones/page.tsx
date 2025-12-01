'use client';

// Desactivar caching estático para esta página
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Radio, Download, Play, Square, Circle, Loader, RefreshCw, Clock, Volume2
} from 'lucide-react';
import { recordingService } from '@/lib/recording-service';
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { getPlatformIcon, getPlatformName } from '@/lib/platform-utils';
import { recordingStateManager } from '@/lib/recording-state-manager';
import { RadioRecordingsGroup } from '@/components/radios/RadioRecordingsGroup';

interface RecordingSession {
  radioId: string;
  radioName: string;
  status: 'recording' | 'paused' | 'stopped';
  startTime: Date;
  recordingId?: string;
}

interface EnrichedRecording {
  filename: string;
  size: number;
  created_at: string;
  radio_id: string;
  radio_name: string;
  radio_region: string;
  radio_city: string;
  radio_programadora: string;
  display_name: string;
}

export default function GrabacionesPage() {
  const [activeRecordings, setActiveRecordings] = useState<RecordingSession[]>([]);
  const [availableRecordings, setAvailableRecordings] = useState<EnrichedRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useEnhancedToast();
  const { playingRadio, isLoading, handlePlay } = useAudioPlayer();

  // Sistema de estado persistente para grabaciones
  useEffect(() => {
    let isMounted = true;
    
    // Suscribirse al estado persistente de grabaciones
    const unsubscribe = recordingStateManager.subscribe((recordings) => {
      if (!isMounted) return;
      
      // Convertir Map a array de sesiones
      const sessions: RecordingSession[] = Array.from(recordings.entries()).map(([radioId, data]) => ({
        radioId,
        radioName: data.radioName || `Radio ${radioId}`,
        status: data.status,
        startTime: data.startTime || new Date(),
        recordingId: data.recording_id
      }));
      
      setActiveRecordings(sessions);
    });

    // Cargar datos iniciales
    const loadInitialData = async () => {
      try {
        await Promise.all([
          recordingStateManager.forceUpdate(),
          loadAvailableRecordings()
        ]);
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        toast.error('Error al cargar datos de grabaciones');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitialData();
    
    // Sistema de polling automático: verificar nuevas grabaciones cada 30 segundos
    const pollingInterval = setInterval(() => {
      if (!isMounted) return;
      loadAvailableRecordings();
    }, 30000); // 30 segundos
    
    // Cleanup
    return () => {
      isMounted = false;
      unsubscribe();
      clearInterval(pollingInterval);
    };
  }, []);

  const loadAvailableRecordings = async () => {
    try {
      const result = await recordingService.getRecordingsList();
      if (result.status === 'success' && result.recordings) {
        // Ordenar por fecha (más recientes primero)
        const sorted = result.recordings.sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setAvailableRecordings(sorted as EnrichedRecording[]);
      }
    } catch (error) {
      console.error('Error cargando grabaciones disponibles:', error);
    }
  };

  const handleStopRecording = async (radioId: string) => {
    try {
      const result = await recordingService.stopRecording(radioId);
      if (result.status === 'success') {
        toast.success('⏹️ Grabación detenida');
        await recordingStateManager.forceUpdate();
        await loadAvailableRecordings();
      } else {
        toast.error(`Error: ${result.message}`);
      }
    } catch (error) {
      toast.error('Error al detener grabación');
      console.error('Error:', error);
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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Borrar caché del navegador completamente
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('✅ Caché del navegador borrada');
      }
      
      // Limpiar localStorage y sessionStorage si existen datos de grabaciones
      const keysToRemove = Object.keys(localStorage).filter(key =>
        key.includes('recording') || key.includes('grabacion')
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Forzar recarga completa desde el servidor
      toast.success('🔄 Borrando caché y recargando...');
      
      // Pequeña pausa para que el usuario vea el mensaje
      setTimeout(() => {
        window.location.reload(); // Recarga desde servidor
      }, 500);
      
    } catch (error) {
      console.error('Error borrando caché:', error);
      toast.error('Error al borrar caché');
      setRefreshing(false);
    }
  };

  const formatDuration = (startTime: Date) => {
    const now = new Date();
    let diff = now.getTime() - startTime.getTime();
    
    // CORRECCIÓN: Manejar diferencias de zona horaria
    // Si la diferencia es negativa (tiempo futuro), usar 0
    if (diff < 0) {
      console.log('⚠️ Diferencia de tiempo negativa detectada, usando 0');
      diff = 0;
    }
    
    // Si la diferencia es mayor a 24 horas, podría ser un problema de zona horaria
    if (diff > 24 * 60 * 60 * 1000) {
      console.log('⚠️ Diferencia de tiempo mayor a 24 horas, podría ser problema de zona horaria');
      // Usar una diferencia razonable (1 hora) como fallback
      diff = 60 * 60 * 1000;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recording': return 'bg-red-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'recording': return 'Grabando';
      case 'paused': return 'Pausada';
      default: return 'Detenida';
    }
  };

  // Agrupar grabaciones por radio usando useMemo para mejor performance
  const groupedRecordings = useMemo(() => {
    return availableRecordings.reduce((acc, recording) => {
      const radioKey = `${recording.radio_name} (${recording.radio_region})`;
      if (!acc[radioKey]) {
        acc[radioKey] = {
          name: recording.radio_name,
          region: recording.radio_region,
          city: recording.radio_city,
          programadora: recording.radio_programadora,
          recordings: []
        };
      }
      acc[radioKey].recordings.push(recording);
      return acc;
    }, {} as Record<string, {
      name: string;
      region: string;
      city: string;
      programadora: string;
      recordings: EnrichedRecording[];
    }>);
  }, [availableRecordings]);

  const formatDateTime = (dateValue: any): string => {
    // Manejar diferentes formatos de fecha que pueden venir del servidor
    if (!dateValue) {
      return 'Fecha no disponible';
    }

    let date: Date;
    
    // Si ya es un objeto Date válido
    if (dateValue instanceof Date) {
      date = dateValue;
    }
    // Si es un timestamp numérico (milisegundos)
    else if (typeof dateValue === 'number') {
      date = new Date(dateValue);
    }
    // Si es un string de fecha
    else if (typeof dateValue === 'string') {
      // El servidor devuelve fechas en formato ISO 8601 UTC
      // Ej: "2025-11-27T20:50:07.300530"
      date = new Date(dateValue);
      
      // Si la fecha es inválida, intentar con formato alternativo
      if (isNaN(date.getTime())) {
        // Intentar parsear formato: "2024-01-15 14:30:00" (sin T)
        const parts = dateValue.split(' ');
        if (parts.length === 2) {
          const [datePart, timePart] = parts;
          const dateParts = datePart.split('-');
          const timeParts = timePart.split(':');
          
          if (dateParts.length === 3 && timeParts.length === 3) {
            date = new Date(
              parseInt(dateParts[0]),
              parseInt(dateParts[1]) - 1, // Los meses son 0-indexed
              parseInt(dateParts[2]),
              parseInt(timeParts[0]),
              parseInt(timeParts[1]),
              parseInt(timeParts[2])
            );
          } else {
            return 'Fecha inválida';
          }
        } else {
          return 'Fecha inválida';
        }
      }
    } else {
      return 'Formato de fecha desconocido';
    }

    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }

    // ✅ CORRECCIÓN: El VPS guarda fechas en UTC
    // Aplicar conversión UTC → UTC-4 (una hora menos que UTC-3)
    const chileTime = new Date(date.getTime() - (4 * 60 * 60 * 1000));
    
    try {
      // Formatear usando la hora convertida
      const day = String(chileTime.getDate()).padStart(2, '0');
      const month = String(chileTime.getMonth() + 1).padStart(2, '0');
      const year = chileTime.getFullYear();
      const hours = String(chileTime.getHours()).padStart(2, '0');
      const minutes = String(chileTime.getMinutes()).padStart(2, '0');
      const seconds = String(chileTime.getSeconds()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Error en formato de fecha';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <Loader className="h-8 w-8 animate-spin text-blue-400" />
          <span className="ml-2 text-gray-400">Cargando grabaciones...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Centro de Grabaciones</h2>
          <p className="text-muted-foreground">
            Monitorea y gestiona las grabaciones de audio desde tu VPS
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
        >
          {refreshing ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2">Actualizar</span>
        </Button>
      </div>

      {/* Grabaciones Activas */}
      {activeRecordings.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Circle className="h-5 w-5 text-red-500 animate-pulse" />
              <span>Grabaciones Activas</span>
              <Badge variant="secondary" className="bg-red-500/20 text-red-400">
                {activeRecordings.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Estas radios están siendo grabadas en tiempo real
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeRecordings.map((session) => (
                <div
                  key={session.radioId}
                  className="flex items-center justify-between bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(session.status)} animate-pulse`} />
                    <div>
                      <div className="text-white font-medium">{session.radioName}</div>
                      <div className="text-sm text-gray-400 flex items-center space-x-2">
                        <Clock className="h-3 w-3" />
                        <span>{formatDuration(session.startTime)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePlay({ id: session.radioId, name: session.radioName } as any)}
                      className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleStopRecording(session.radioId)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Square className="h-4 w-4 mr-1" />
                      Detener
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grabaciones Disponibles - Agrupadas por Radio */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Download className="h-5 w-5 text-green-400" />
            <span>Grabaciones Disponibles</span>
            <Badge variant="secondary" className="bg-green-500/20 text-green-400">
              {availableRecordings.length}
            </Badge>
          </CardTitle>
          <CardDescription className="text-gray-400">
            Archivos de audio grabados y listos para descargar, organizados por radio
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableRecordings.length === 0 ? (
            <div className="text-center py-8">
              <Radio className="mx-auto h-12 w-12 mb-4 text-gray-500" />
              <p className="text-gray-400">No hay grabaciones disponibles</p>
              <p className="text-sm text-gray-500 mt-2">
                Las grabaciones aparecerán aquí cuando se completen las sesiones de grabación
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Renderizar grupos de radios con grabaciones */}
              {Object.entries(groupedRecordings).map(([radioKey, data]) => (
                <RadioRecordingsGroup
                  key={radioKey}
                  radioName={radioKey}
                  recordings={data.recordings}
                  itemsPerPage={10}
                  onDownload={handleDownloadRecording}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estado del Servidor */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span>Estado del Servidor de Grabación</span>
          </CardTitle>
          <CardDescription className="text-gray-400">
            Conexión con VPS: {recordingService['API_BASE'] || 'http://213.199.39.147:5000/api'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{activeRecordings.length}</div>
              <div className="text-sm text-gray-400">Grabaciones Activas</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{availableRecordings.length}</div>
              <div className="text-sm text-gray-400">Archivos Disponibles</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">
                {(availableRecordings.reduce((total, rec) => total + (rec.size || 0), 0) / (1024 * 1024)).toFixed(1)} MB
              </div>
              <div className="text-sm text-gray-400">Espacio Total</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
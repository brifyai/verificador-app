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
  path?: string; // Ruta relativa
  download_url?: string; // URL completa para descargar
}

export default function GrabacionesPage() {
  const [activeRecordings, setActiveRecordings] = useState<RecordingSession[]>([]);
  const [availableRecordings, setAvailableRecordings] = useState<EnrichedRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date()); // Para actualizar cronómetro
  const toast = useEnhancedToast();
  const { playingRadio, isLoading, handlePlay } = useAudioPlayer();

  // Actualizar tiempo cada segundo para el cronómetro
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Actualizar cada segundo
    
    return () => clearInterval(timer);
  }, []);

  // Sistema de estado persistente para grabaciones
  useEffect(() => {
    let isMounted = true;
    
    // Cargar datos iniciales
    const loadInitialData = async () => {
      try {
        await Promise.all([
          loadActiveRecordings(),
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
    
    // Sistema de polling automático: verificar nuevas grabaciones cada 5 segundos
    const pollingInterval = setInterval(() => {
      if (!isMounted) return;
      loadActiveRecordings();
      loadAvailableRecordings();
    }, 5000); // 5 segundos para actualizaciones más frecuentes
    
    // Cleanup
    return () => {
      isMounted = false;
      clearInterval(pollingInterval);
    };
  }, []);

  const loadActiveRecordings = async () => {
    try {
      // Obtener grabaciones activas directamente del VPS
      const response = await fetch('/api/recording-vps-fixed', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });
      
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      
      const data = await response.json();
      
      if (data.status === 'success' && data.active_recordings) {
        // Convertir grabaciones del VPS al formato RecordingSession
        const sessions: RecordingSession[] = Object.entries(data.active_recordings).map(([radioId, recording]: [string, any]) => ({
          radioId: recording.radio_id || radioId,
          radioName: recording.radio_name || `Radio ${radioId}`,
          status: recording.status === 'recording' ? 'recording' as const : 'stopped' as const,
          startTime: new Date(recording.start_time),
          recordingId: recording.recording_id
        }));
        
        console.log('📊 Grabaciones activas cargadas:', sessions);
        setActiveRecordings(sessions);
      } else {
        console.log('No se encontraron grabaciones activas en el VPS');
        setActiveRecordings([]);
      }
    } catch (error) {
      console.error('❌ Error cargando grabaciones activas:', error);
      setActiveRecordings([]);
    }
  };

  const loadAvailableRecordings = async () => {
    try {
      // Primero obtener la metadata de las grabaciones desde Supabase
      const response = await fetch('/api/recordings-from-supabase', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });
      
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      
      const data = await response.json();
      
      if (data.status === 'success' && data.recordings && data.recordings.length > 0) {
        // Convertir los datos de Supabase al formato EnrichedRecording
        const enrichedRecordings: EnrichedRecording[] = data.recordings.map((rec: any) => ({
          filename: rec.filename,
          size: rec.file_size,
          created_at: new Date(rec.recorded_at).toLocaleString('es-CL', {
            timeZone: 'America/Santiago'
          }),
          radio_id: rec.radio_id,
          radio_name: rec.radio_name,
          radio_region: rec.radio_region,
          radio_city: rec.radio_city,
          radio_programadora: rec.radio_programadora || '',
          display_name: rec.radio_name,
          path: rec.file_path,
          download_url: rec.download_url
        }));
        
        setAvailableRecordings(enrichedRecordings);
      } else {
        // Si no hay grabaciones en Supabase, mostrar mensaje
        console.log('No se encontraron grabaciones en Supabase');
        setAvailableRecordings([]);
        
        // Opcional: Mostrar mensaje al usuario
        if (data.recordings && data.recordings.length === 0) {
          toast.info('No hay grabaciones almacenadas en la base de datos');
        }
      }
    } catch (error) {
      console.error('❌ Error cargando grabaciones desde Supabase:', error);
      toast.error('Error al cargar grabaciones desde la base de datos');
      setAvailableRecordings([]);
    }
  };

  const handleStopRecording = async (radioId: string) => {
    try {
      const response = await fetch('/api/recording-vps-fixed', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ radio_id: radioId })
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success('⏹️ Grabación detenida');
        // Recargar grabaciones activas
        await loadActiveRecordings();
        await loadAvailableRecordings();
      } else {
        toast.error('Error al detener grabación');
      }
    } catch (error) {
      toast.error('Error al detener grabación');
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
    let diff = currentTime.getTime() - startTime.getTime();
    
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

  // Función para extraer fecha del path o filename
  const extractDateFromPath = (recording: EnrichedRecording): string => {
    // Primero intentar extraer del path si existe
    if (recording.path) {
      // Path formato: "2025-12-01/20/filename.mp3" o "2025-12-01/radio_id/filename.mp3"
      const pathParts = recording.path.split('/');
      if (pathParts.length >= 2) {
        const datePart = pathParts[0];
        // Validar formato de fecha YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
          return datePart;
        }
      }
    }
    
    // Fallback: extraer fecha del filename usando regex
    // Filename formato: radio_id_YYYYMMDD_HHMMSS_*.mp3
    const match = recording.filename.match(/_(\d{4})(\d{2})(\d{2})_\d{6}_/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    
    // Último fallback: usar created_at
    const date = new Date(recording.created_at);
    return date.toISOString().split('T')[0];
  };

  // Función para extraer radio_id del recording (ahora viene enriquecido del endpoint)
  const extractRadioIdFromRecording = (recording: EnrichedRecording): string => {
    // El radio_id ya viene en el objeto recording desde el endpoint /api/recordings-enriched
    return recording.radio_id || 'unknown';
  };

  // Agrupar grabaciones por DÍA y luego por RADIO
  const groupedByDateAndRadio = useMemo(() => {
    // Primero agrupar por fecha
    const byDate = availableRecordings.reduce((dateAcc, recording) => {
      const date = extractDateFromPath(recording);
      
      if (!dateAcc[date]) {
        dateAcc[date] = {};
      }
      
      // Dentro de cada fecha, agrupar por radio usando solo el nombre
      // El radio_id ya viene en el objeto recording desde el endpoint enriquecido
      const radioKey = recording.radio_name;
      
      if (!dateAcc[date][radioKey]) {
        dateAcc[date][radioKey] = {
          name: recording.radio_name,
          radioId: recording.radio_id || 'unknown',
          region: recording.radio_region,
          city: recording.radio_city,
          programadora: recording.radio_programadora,
          recordings: []
        };
      }
      
      dateAcc[date][radioKey].recordings.push(recording);
      return dateAcc;
    }, {} as Record<string, Record<string, {
      name: string;
      radioId: string;
      region: string;
      city: string;
      programadora: string;
      recordings: EnrichedRecording[];
    }>>);
    
    // Ordenar fechas (más recientes primero)
    const sortedDates = Object.keys(byDate).sort((a, b) =>
      new Date(b).getTime() - new Date(a).getTime()
    );
    
    // Ordenar grabaciones dentro de cada radio por fecha (más recientes primero)
    sortedDates.forEach(date => {
      Object.keys(byDate[date]).forEach(radioKey => {
        byDate[date][radioKey].recordings.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
    });
    
    return { byDate, sortedDates };
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
              {Object.entries(groupedByDateAndRadio.byDate).map(([date, radios]) => (
                <div key={date} className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">{date}</h3>
                  <div className="space-y-3">
                    {Object.entries(radios).map(([radioKey, data]) => (
                      <RadioRecordingsGroup
                        key={`${date}-${radioKey}`}
                        radioName={radioKey}
                        recordings={data.recordings.map(rec => ({
                          ...rec,
                          radio_region: data.region || rec.radio_region,
                          radio_city: data.city || rec.radio_city,
                          radio_programadora: data.programadora || rec.radio_programadora
                        }))}
                        itemsPerPage={10}
                      />
                    ))}
                  </div>
                </div>
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
            Conexión con VPS: http://213.199.39.147:5000/api
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
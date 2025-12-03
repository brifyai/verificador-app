'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, ChevronDown, ChevronUp, Clock, Calendar, AlertCircle, Loader } from 'lucide-react';
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';
import { recordingStateManager } from '@/lib/recording-state-manager';

// Interfaz mejorada para grabaciones con soporte para rutas relativas
interface Recording {
  filename: string;
  size: number;
  created_at: string;
  radio_name: string;
  radio_region: string;
  radio_city: string;
  radio_programadora: string;
  display_name: string;
  path?: string; // Ruta relativa (ej: "2025-12-01/radio_id/filename.mp3")
  download_url?: string; // URL completa para descargar
  radio_id?: string;
}

interface RadioRecordingsGroupProps {
  radioName: string;
  recordings: Recording[];
  itemsPerPage?: number;
}

export function RadioRecordingsGroup({
  radioName,
  recordings,
  itemsPerPage = 10,
}: RadioRecordingsGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDownloading, setIsDownloading] = useState<Set<string>>(new Set());
  const [activeRecordings, setActiveRecordings] = useState<Map<string, any>>(new Map());
  const toast = useEnhancedToast();

  // DEBUG: Verificar valores de los metadatos
  useEffect(() => {
    if (recordings.length > 0) {
      console.log('🔍 DEBUG RadioRecordingsGroup - Valores recibidos:', {
        radioName,
        region: recordings[0]?.radio_region,
        city: recordings[0]?.radio_city,
        programadora: recordings[0]?.radio_programadora,
        hasRegion: !!recordings[0]?.radio_region,
        hasCity: !!recordings[0]?.radio_city,
        hasProgramadora: !!recordings[0]?.radio_programadora,
        regionIsUndefinedString: recordings[0]?.radio_region === 'undefined',
        cityIsUndefinedString: recordings[0]?.radio_city === 'undefined',
        programadoraIsUndefinedString: recordings[0]?.radio_programadora === 'undefined'
      });
    }
  }, [recordings, radioName]);

  // Suscribirse a RecordingStateManager para sincronización en tiempo real
  useEffect(() => {
    const unsubscribe = recordingStateManager.subscribe((recordings) => {
      setActiveRecordings(new Map(recordings));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Verificar si alguna grabación de esta radio está activa
  const hasActiveRecording = useMemo(() => {
    const radioId = recordings[0]?.radio_id;
    return radioId ? recordingStateManager.isRecording(radioId) : false;
  }, [recordings, activeRecordings]);

  const totalRecordings = recordings.length;
  const totalPages = Math.ceil(totalRecordings / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  // Ordenar grabaciones por fecha (más recientes primero)
  const sortedRecordings = useMemo(() => {
    return [...recordings].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [recordings]);

  const visibleRecordings = sortedRecordings.slice(startIndex, endIndex);

  // Formatear fecha y hora con manejo de errores mejorado
  const formatDateTime = useCallback((dateValue: string): string => {
    if (!dateValue) return 'Fecha no disponible';

    try {
      // El dateValue ya viene en formato UTC desde el filename
      // Ejemplo: "2025-12-02T00:46:18Z"
      const date = new Date(dateValue);
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        console.warn('Fecha inválida:', dateValue);
        return 'Fecha inválida';
      }

      // ✅ CORRECCIÓN: Usar conversión automática de zona horaria
      // En lugar de restar manualmente, usar toLocaleString con timezone de Chile
      // Esto maneja automáticamente UTC-3 o UTC-4 según horario de verano/invierno
      const chileTime = new Date(date.toLocaleString("en-US", {timeZone: "America/Santiago"}));
      
      const day = String(chileTime.getDate()).padStart(2, '0');
      const month = String(chileTime.getMonth() + 1).padStart(2, '0');
      const year = chileTime.getFullYear();
      const hours = String(chileTime.getHours()).padStart(2, '0');
      const minutes = String(chileTime.getMinutes()).padStart(2, '0');
      const seconds = String(chileTime.getSeconds()).padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Error en fecha';
    }
  }, []);

  // Formatear tamaño de archivo
  const formatFileSize = useCallback((bytes: number): string => {
    if (!bytes || bytes <= 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }, []);

  // Estimar duración del audio basado en tamaño (asumiendo 128 kbps)
  const formatDuration = useCallback((bytes: number): string => {
    if (!bytes || bytes <= 0) return '0s';
    
    const kilobytes = bytes / 1024;
    const seconds = Math.round(kilobytes / 16); // 16 KB/s aproximadamente
    
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }, []);

  // Manejar descarga con soporte para rutas relativas
  const handleDownload = useCallback(async (recording: Recording) => {
    if (isDownloading.has(recording.filename)) return;

    setIsDownloading(prev => new Set(prev).add(recording.filename));
    
    try {
      if (!recording.download_url) {
        toast.error('No hay URL de descarga disponible');
        return;
      }
      const a = document.createElement('a');
      a.href = recording.download_url;
      a.download = recording.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('📥 Descarga iniciada');
    } catch (error) {
      console.error('Error en descarga:', error);
      toast.error('Error al descargar archivo');
    } finally {
      setIsDownloading(prev => {
        const newSet = new Set(prev);
        newSet.delete(recording.filename);
        return newSet;
      });
    }
  }, [isDownloading, toast]);

  // Resetear a la primera página cuando cambian las grabaciones
  useEffect(() => {
    setCurrentPage(1);
  }, [recordings.length]);

  // Calcular información de paginación
  const paginationInfo = useMemo(() => {
    const start = totalRecordings > 0 ? startIndex + 1 : 0;
    const end = Math.min(endIndex, totalRecordings);
    return { start, end };
  }, [startIndex, endIndex, totalRecordings]);

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800/50 transition-all duration-200 hover:border-gray-600">
      {/* Header del acordeón */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700/50 transition-colors group"
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
          )}
          <div className="text-left flex-1 min-w-0">
            <div className="text-white font-medium truncate group-hover:text-blue-300 transition-colors">
              {radioName}
            </div>
            <div className="text-sm text-gray-400 flex items-center space-x-2">
              {recordings[0]?.radio_region && recordings[0]?.radio_region !== 'undefined' && (
                <span className="truncate">{recordings[0]?.radio_region}</span>
              )}
              {recordings[0]?.radio_region && recordings[0]?.radio_region !== 'undefined' &&
               recordings[0]?.radio_city && recordings[0]?.radio_city !== 'undefined' && (
                <span>•</span>
              )}
              {recordings[0]?.radio_city && recordings[0]?.radio_city !== 'undefined' && (
                <span className="truncate">{recordings[0]?.radio_city}</span>
              )}
              {recordings[0]?.radio_programadora && recordings[0]?.radio_programadora !== 'undefined' && (
                <>
                  <span>•</span>
                  <span className="truncate">{recordings[0]?.radio_programadora}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
          {hasActiveRecording && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-400">Grabando</span>
            </div>
          )}
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
            {totalRecordings} archivos
          </Badge>
        </div>
      </button>

      {/* Contenido desplegable */}
      {isExpanded && (
        <div className="border-t border-gray-700 animate-in fade-in duration-200">
          {/* Lista de grabaciones */}
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {visibleRecordings.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-gray-500 mb-2" />
                <p className="text-gray-400 text-sm">No hay grabaciones en esta página</p>
              </div>
            ) : (
              visibleRecordings.map((recording) => (
                <div
                  key={`${recording.filename}-${recording.created_at}`}
                  className="px-4 py-3 border-b border-gray-700/50 last:border-b-0 hover:bg-gray-700/30 transition-colors group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 group-hover:bg-green-400 transition-colors" />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate group-hover:text-blue-300 transition-colors">
                          {recording.display_name || recording.filename}
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1 flex-wrap">
                          <div className="flex items-center space-x-1" title="Fecha de creación">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span>{formatDateTime(recording.created_at)}</span>
                          </div>
                          <div className="flex items-center space-x-1" title="Tamaño del archivo">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span>{formatFileSize(recording.size)}</span>
                          </div>
                          <div className="flex items-center space-x-1" title="Duración estimada">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span>{formatDuration(recording.size)}</span>
                          </div>
                          {recording.path && (
                            <div className="text-xs text-gray-500 truncate" title="Ruta relativa">
                              {recording.path}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(recording)}
                      disabled={isDownloading.has(recording.filename)}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 flex-shrink-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={recording.path ? `Descargar desde: ${recording.path}` : 'Descargar grabación'}
                    >
                      {isDownloading.has(recording.filename) ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-700 bg-gray-800/70 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Mostrando {paginationInfo.start}-{paginationInfo.end} de {totalRecordings}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </Button>
                <div className="text-sm text-gray-400 px-2 min-w-[60px] text-center">
                  {currentPage} / {totalPages}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
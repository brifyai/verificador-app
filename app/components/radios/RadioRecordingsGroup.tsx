'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, ChevronDown, ChevronUp, Clock, Calendar } from 'lucide-react';
import { recordingService } from '@/lib/recording-service';
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';

interface Recording {
  filename: string;
  size: number;
  created_at: string;
  radio_name: string;
  radio_region: string;
  radio_city: string;
  radio_programadora: string;
  display_name: string;
}

interface RadioRecordingsGroupProps {
  radioName: string;
  recordings: Recording[];
  itemsPerPage?: number;
  onDownload: (filename: string) => void;
}

export function RadioRecordingsGroup({
  radioName,
  recordings,
  itemsPerPage = 10,
  onDownload
}: RadioRecordingsGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const toast = useEnhancedToast();

  const totalRecordings = recordings.length;
  const totalPages = Math.ceil(totalRecordings / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const visibleRecordings = recordings.slice(startIndex, endIndex);

  const formatDateTime = (dateValue: string): string => {
    try {
      const date = new Date(dateValue);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      return dateValue;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDuration = (bytes: number): string => {
    // Estimación de duración basada en tamaño de archivo MP3
    // Asumiendo bitrate promedio de 128 kbps (16 KB/s)
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
      const remainingSeconds = seconds % 60;
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      await onDownload(filename);
    } catch (error) {
      toast.error('Error al descargar archivo');
    }
  };

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800/50">
      {/* Header del acordeón */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
          <div className="text-left">
            <div className="text-white font-medium">{radioName}</div>
            <div className="text-sm text-gray-400">
              {recordings[0]?.radio_region} • {recordings[0]?.radio_city}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
            {totalRecordings} archivos
          </Badge>
        </div>
      </button>

      {/* Contenido desplegable */}
      {isExpanded && (
        <div className="border-t border-gray-700">
          {/* Lista de grabaciones */}
          <div className="max-h-96 overflow-y-auto">
            {visibleRecordings.map((recording, index) => (
              <div
                key={`${recording.filename}-${index}`}
                className="px-4 py-3 border-b border-gray-700/50 last:border-b-0 hover:bg-gray-700/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">
                        {recording.display_name || recording.filename}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDateTime(recording.created_at)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatFileSize(recording.size)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(recording.size)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownload(recording.filename)}
                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 flex-shrink-0"
                    title="Descargar grabación"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-700 bg-gray-800/70 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Mostrando {startIndex + 1}-{Math.min(endIndex, totalRecordings)} de {totalRecordings}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  Anterior
                </Button>
                <div className="text-sm text-gray-400 px-2">
                  Página {currentPage} de {totalPages}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
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
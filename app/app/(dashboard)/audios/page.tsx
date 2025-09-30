
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AudioPlayer from '@/components/audio-player';
import { 
  FileAudio, 
  Search, 
  Filter, 
  Download, 
  Play, 
  Pause,
  Calendar,
  Radio,
  HardDrive,
  Cloud,
  RefreshCw
} from 'lucide-react';

interface AudioFile {
  id: string;
  name: string;
  radioName: string;
  phrase: string;
  timestamp: string;
  duration: number;
  size: number;
  audioUrl: string;
  downloadUrl: string;
  transcription?: string;
}

interface StorageStats {
  totalFiles: number;
  totalSize: number;
  usedStorage: string;
}

export default function AudiosPage() {
  const [audios, setAudios] = useState<AudioFile[]>([]);
  const [filteredAudios, setFilteredAudios] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<AudioFile | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRadio, setSelectedRadio] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Estados de la página
  const [activeTab, setActiveTab] = useState('browse');

  // Cargar datos iniciales
  useEffect(() => {
    loadAudios();
    loadStorageStats();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [audios, searchTerm, selectedRadio, dateRange, sortBy]);

  // Modificar la función loadAudios
  // Modificar la función loadAudios para usar las URLs correctas
  const loadAudios = async () => {
  try {
    setLoading(true);
    console.log('🔄 Cargando audios desde Express...');
  
    // Cambiá esta URL por la IP o dominio real de tu VPS si es distinto
    const BASE = 'http://173.249.26.38'; // <- reemplazá si procede
    const response = await fetch(`${BASE}/api/audios?limit=200`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
  
    console.log('📡 fetch -> url:', response.url, 'status:', response.status, 'content-type:', response.headers.get('content-type'));
  
    const text = await response.text();
    console.log('📦 body start:', text.slice(0, 400));
  
    // intentar parsear JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error('❌ JSON parse failed, response is not JSON:', err);
      return;
    }
  
    const audiosTransformados = (data.audios || []).map((audio: any) => ({
      id: audio.name,
      name: audio.name,
      radioName: 'Desconocida',
      phrase: '',
      timestamp: audio.createdAt || audio.timestamp,
      duration: audio.duration || 0,
      size: Math.round((parseFloat(audio.sizeMB || '0') || 0) * 1024 * 1024),
      audioUrl: `${BASE}${audio.url}`,         // URL absoluta al archivo servido por Express
      downloadUrl: `${BASE}${audio.url}`,
      transcription: undefined
    }));
  
    console.log(`✅ Audios transformados: ${audiosTransformados.length}`);
    setAudios(audiosTransformados);
  } catch (error) {
    console.error('❌ Error cargando audios:', error);
  } finally {
    setLoading(false);
  }
};

  
  // Modificar useEffect para recargar automáticamente
  useEffect(() => {
    loadAudios();
    loadStorageStats();
    
    // Configurar una recarga automática cada 2 minutos
    const intervalId = setInterval(() => {
      loadAudios();
      loadStorageStats();
    }, 2 * 60 * 1000);
    
    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(intervalId);
  }, []);

  const loadStorageStats = async () => {
    try {
      const response = await fetch('/api/audios/stats');
      if (response.ok) {
        const data = await response.json();
        setStorageStats(data.stats);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...audios];

    // Filtro de búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter(audio =>
        audio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        audio.phrase.toLowerCase().includes(searchTerm.toLowerCase()) ||
        audio.radioName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (audio.transcription && audio.transcription.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtro por radio
    if (selectedRadio !== 'all') {
      filtered = filtered.filter(audio => audio.radioName === selectedRadio);
    }

    // Filtro por fecha
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter(audio => 
        new Date(audio.timestamp) >= startDate
      );
    }

    // Ordenamiento
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        break;
      case 'radio':
        filtered.sort((a, b) => a.radioName.localeCompare(b.radioName));
        break;
      case 'duration':
        filtered.sort((a, b) => b.duration - a.duration);
        break;
    }

    setFilteredAudios(filtered);
  };

  // Modificar la función handleDownload para que funcione con las URLs de la VPS
  // Modificar la función handleDownload para realizar una descarga automática
  const handleDownload = async (audio: AudioFile) => {
    try {
      console.log('🔄 Descargando audio:', audio.downloadUrl);
      
      // Realizar una solicitud fetch para obtener el archivo como blob
      const response = await fetch(audio.downloadUrl);
      if (!response.ok) {
        throw new Error(`Error al descargar: ${response.status} ${response.statusText}`);
      }
      
      // Convertir la respuesta a blob
      const blob = await response.blob();
      
      // Crear una URL para el blob
      const url = window.URL.createObjectURL(blob);
      
      // Crear un elemento de enlace para la descarga
      const a = document.createElement('a');
      a.href = url;
      a.download = audio.name; // Nombre del archivo para la descarga
      a.style.display = 'none';
      
      // Añadir el enlace al documento, hacer clic y luego eliminarlo
      document.body.appendChild(a);
      a.click();
      
      // Limpiar después de la descarga
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      console.log('✅ Descarga completada');
    } catch (error) {
      console.error('❌ Error descargando audio:', error);
      alert('Error al descargar el archivo. Por favor, inténtalo de nuevo.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uniqueRadios = Array.from(new Set(audios.map(audio => audio.radioName))).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Biblioteca de Audios</h1>
          <p className="text-slate-400 mt-1">
            Respaldo completo de detecciones publicitarias
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={loadAudios}
            variant="outline"
            className="text-slate-300 border-slate-600 hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      {storageStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/20 rounded">
                  <FileAudio className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total Archivos</p>
                  <p className="text-xl font-bold text-white">{storageStats.totalFiles.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600/20 rounded">
                  <Cloud className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Almacenamiento Usado</p>
                  <p className="text-xl font-bold text-white">{storageStats.usedStorage}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600/20 rounded">
                  <HardDrive className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Promedio por Archivo</p>
                  <p className="text-xl font-bold text-white">
                    {storageStats.totalFiles > 0 
                      ? formatFileSize(storageStats.totalSize / storageStats.totalFiles)
                      : '0 B'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-md bg-slate-700">
          <TabsTrigger value="browse">Explorar</TabsTrigger>
          <TabsTrigger value="player">Reproductor</TabsTrigger>
        </TabsList>

        {/* Pestaña Explorar */}
        <TabsContent value="browse" className="space-y-4">
          {/* Controles de filtrado */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros y Búsqueda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-slate-300 text-sm">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar por frase, radio..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300 text-sm">Radio</Label>
                  <Select value={selectedRadio} onValueChange={setSelectedRadio}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="all" className="text-white hover:bg-slate-600 focus:bg-slate-600">Todas las radios</SelectItem>
                      {uniqueRadios.map(radio => (
                        <SelectItem key={radio} value={radio} className="text-white hover:bg-slate-600 focus:bg-slate-600">{radio}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-300 text-sm">Período</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="all" className="text-white hover:bg-slate-600 focus:bg-slate-600">Todo el tiempo</SelectItem>
                      <SelectItem value="today" className="text-white hover:bg-slate-600 focus:bg-slate-600">Hoy</SelectItem>
                      <SelectItem value="week" className="text-white hover:bg-slate-600 focus:bg-slate-600">Última semana</SelectItem>
                      <SelectItem value="month" className="text-white hover:bg-slate-600 focus:bg-slate-600">Último mes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-300 text-sm">Ordenar por</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="newest" className="text-white hover:bg-slate-600 focus:bg-slate-600">Más reciente</SelectItem>
                      <SelectItem value="oldest" className="text-white hover:bg-slate-600 focus:bg-slate-600">Más antiguo</SelectItem>
                      <SelectItem value="radio" className="text-white hover:bg-slate-600 focus:bg-slate-600">Por radio</SelectItem>
                      <SelectItem value="duration" className="text-white hover:bg-slate-600 focus:bg-slate-600">Por duración</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="text-sm text-slate-400">
                Mostrando {filteredAudios.length} de {audios.length} archivos
              </div>
            </CardContent>
          </Card>

          {/* Lista de audios */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
              </div>
            ) : filteredAudios.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="text-center p-8">
                  <FileAudio className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400">No se encontraron audios</p>
                </CardContent>
              </Card>
            ) : (
              filteredAudios.map(audio => (
                <Card key={audio.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <FileAudio className="h-4 w-4 text-blue-400" />
                          <h3 className="text-white font-medium truncate">{audio.name}</h3>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant="outline" className="text-blue-300 border-blue-500">
                            <Radio className="h-3 w-3 mr-1" />
                            {audio.radioName}
                          </Badge>
                          <Badge variant="outline" className="text-green-300 border-green-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(audio.timestamp).toLocaleDateString('es-CL')}
                          </Badge>
                          <Badge variant="outline" className="text-orange-300 border-orange-500">
                            {Math.floor(audio.duration / 60)}:{(audio.duration % 60).toString().padStart(2, '0')}
                          </Badge>
                          <Badge variant="outline" className="text-purple-300 border-purple-500">
                            {formatFileSize(audio.size)}
                          </Badge>
                        </div>

                        <p className="text-sm text-slate-300 bg-slate-700/50 p-2 rounded mb-2">
                          <strong>Frase:</strong> "{audio.phrase}"
                        </p>

                        {audio.transcription && (
                          <p className="text-xs text-slate-400 truncate">
                            <strong>Transcripción:</strong> {audio.transcription}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => {
                            setSelectedAudio(audio);
                            setActiveTab('player');
                          }}
                          variant="outline"
                          size="sm"
                          className="text-slate-300 border-slate-600 hover:bg-slate-700"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDownload(audio)}
                          variant="outline"
                          size="sm"
                          className="text-slate-300 border-slate-600 hover:bg-slate-700"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Pestaña Reproductor */}
        <TabsContent value="player">
          {selectedAudio ? (
            <AudioPlayer
              audioUrl={selectedAudio.audioUrl}
              title={selectedAudio.name}
              radioName={selectedAudio.radioName}
              phrase={selectedAudio.phrase}
              timestamp={selectedAudio.timestamp}
              duration={selectedAudio.duration}
              transcription={selectedAudio.transcription}
              onDownload={() => handleDownload(selectedAudio)}
            />
          ) : (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="text-center p-8">
                <FileAudio className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400">Selecciona un audio para reproducir</p>
                <Button 
                  onClick={() => setActiveTab('browse')}
                  className="mt-4"
                >
                  Explorar Audios
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

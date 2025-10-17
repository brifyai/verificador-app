
'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, MessageCircle, Filter, Download, DollarSign, BarChart3, CheckCircle, Clock, X, Volume2, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';

interface Detection {
  id: string;
  date: string;
  time: string;
  programadora: string;
  radio: string;
  region: string;
  comuna: string;
  marca: string;
  campaña: string;
  status: string;
  detectedText: string;
  confidence: number;
  similarity: number;
  cost: number;
  timestamp: string;
  audioPath?: string;
  verified: boolean;
  falsePositive: boolean;
}

interface DetectionStats {
  totalDetections: number;
  totalValue: number;
  averageConfidence: number;
  completedDetections: number;
  pendingDetections: number;
}

interface DetectionResponse {
  detections: Detection[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats: DetectionStats;
  filters: {
    regions: string[];
  };
}

export default function Reportes() {
  const toast = useEnhancedToast();
  const [detections, setDetections] = useState<Detection[]>([]);
  const [stats, setStats] = useState<DetectionStats>({
    totalDetections: 0,
    totalValue: 0,
    averageConfidence: 0,
    completedDetections: 0,
    pendingDetections: 0
  });
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDetections, setTotalDetections] = useState(0);
  
  // Estados para las acciones
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Función para cargar datos
  const loadDetections = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50'
      });
      
      // Agregar filtros solo si tienen valores
      if (searchTerm) params.append('search', searchTerm);
      if (regionFilter && regionFilter !== 'all') params.append('region', regionFilter);
      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'Verificado') params.append('verified', 'true');
        else if (statusFilter === 'Falso Positivo') params.append('falsePositive', 'true');
        else if (statusFilter === 'Pendiente') {
          params.append('verified', 'false');
          params.append('falsePositive', 'false');
        }
      }
      if (dateRange.start) params.append('dateFrom', dateRange.start);
      if (dateRange.end) params.append('dateTo', dateRange.end);
      
      const response = await fetch(`/api/detecciones?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar las detecciones');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error al cargar detecciones');
      }
      
      // Usar los datos directamente de la API
      setDetections(data.data);
      
      // Usar las estadísticas calculadas por la API (ya incluyen todos los registros filtrados, no solo la página actual)
      if (data.stats) {
        setStats(data.stats);
      }
      
      // Usar las regiones proporcionadas por la API
      if (data.filters && data.filters.regions) {
        setAvailableRegions(data.filters.regions);
      }
      
      setTotalPages(data.pagination.pages);
      setTotalDetections(data.pagination.total);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error loading detections:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente y cuando cambien los filtros
  useEffect(() => {
    loadDetections();
  }, [currentPage, searchTerm, statusFilter, regionFilter, dateRange]);

  const filteredDetections = detections;
  const uniqueStatuses = ['Verificado', 'Pendiente', 'Falso Positivo'];
  const uniqueRegions = availableRegions;

  // Calcular KPIs
  const calculateDetectionValue = (detection: Detection) => {
    return detection.cost || 0;
  };

  const totalValue = stats.totalValue;
  const completedDetections = stats.completedDetections;
  const pendingDetections = stats.pendingDetections;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Verificado':
        return 'bg-green-600';
      case 'Pendiente':
        return 'bg-yellow-600';
      case 'Falso Positivo':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  if (loading && detections.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-white text-lg">Cargando reportes...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-red-400 text-lg">Error: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  // Función para exportar datos
  const exportToCSV = () => {
    const headers = [
      'Fecha',
      'Hora', 
      'Programadora',
      'Radio',
      'Región',
      'Comuna',
      'Marca',
      'Campaña',
      'Estado',
      'Texto Detectado',
      'Confianza',
      'Valor (CLP)'
    ];
    
    const csvData = detections.map(detection => [
      detection.date,
      detection.time,
      detection.programadora,
      detection.radio,
      detection.region,
      detection.comuna,
      detection.marca,
      detection.campaña,
      detection.status,
      `"${detection.detectedText}"`,
      (detection.confidence * 100).toFixed(1) + '%',
      detection.cost.toLocaleString()
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reportes_detecciones_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para reproducir audio
  const handlePlayAudio = (detectionId: string) => {
    if (currentlyPlaying === detectionId) {
      // Si ya está reproduciendo, pausar
      if (audioRef.current) {
        audioRef.current.pause();
        setCurrentlyPlaying(null);
        toast.info('Audio pausado');
      }
    } else {
      // Pausar cualquier audio anterior
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      // Buscar la detección específica para obtener su audioPath
      const detection = detections.find(d => d.id === detectionId);
      
      if (!detection?.audioPath) {
        toast.audioError('No hay archivo de audio disponible para esta detección.');
        return;
      }
      
      // Usar el endpoint de API para servir el audio
      // Esto permite acceder a archivos tanto locales como desde la VPS
      let audioPath = detection.audioPath;
      
      // Limpiar la ruta del audio
      // Remover prefijos comunes
      audioPath = audioPath.replace(/^\/+/, ''); // Remover / al inicio
      audioPath = audioPath.replace(/^captures\//, ''); // Remover captures/ al inicio si existe
      audioPath = audioPath.replace(/^public\/captures\//, ''); // Remover public/captures/ si existe
      audioPath = audioPath.replace(/^app\/captures\//, ''); // Remover app/captures/ si existe
      
      // Construir la URL del endpoint de audio
      const audioUrl = `/api/audio/${audioPath}`;
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onplay = () => {
        setCurrentlyPlaying(detectionId);
        toast.success('Reproduciendo audio de detección');
      };
      
      audio.onended = () => {
        setCurrentlyPlaying(null);
        toast.info('Reproducción finalizada');
      };
      
      audio.onerror = (error) => {
        setCurrentlyPlaying(null);
        console.error('Error playing audio:', error);
        toast.audioError(`No se pudo reproducir el archivo de audio: ${audioUrl}. Verifique que el archivo existe.`);
      };
      
      audio.play().catch((error) => {
        setCurrentlyPlaying(null);
        console.error('Error playing audio:', error);
        toast.audioError('Error al iniciar la reproducción. Verifique los permisos del navegador.');
      });
    }
  };

  // Función para mostrar detalles
  const handleShowDetails = (detection: Detection) => {
    setSelectedDetection(detection);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Reportes</h1>
          <p className="text-slate-400 mt-1">
            Gestión y seguimiento de detecciones publicitarias
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={exportToCSV} disabled={loading}>
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Detecciones</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalDetections}</div>
            <p className="text-xs text-slate-400">detecciones filtradas</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Valor Total $</CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">${stats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-slate-400">CLP en detecciones</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.completedDetections}</div>
            <p className="text-xs text-slate-400">finalizadas/solucionadas</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{stats.pendingDetections}</div>
            <p className="text-xs text-slate-400">por procesar</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por programadora, radio, marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all" className="text-white hover:bg-gray-700">Todos los estados</SelectItem>
                {uniqueStatuses.map(status => (
                  <SelectItem key={status} value={status} className="text-white hover:bg-gray-700">{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isAdvancedFiltersOpen} onOpenChange={setIsAdvancedFiltersOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-white">Filtros Avanzados</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="region-filter" className="text-white">Región</Label>
                    <Select value={regionFilter} onValueChange={setRegionFilter}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Todas las regiones" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="all" className="text-white hover:bg-gray-700">Todas las regiones</SelectItem>
                        {uniqueRegions.map(region => (
                          <SelectItem key={region} value={region} className="text-white hover:bg-gray-700">{region}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date-start" className="text-white">Fecha inicio</Label>
                      <Input
                        id="date-start"
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date-end" className="text-white">Fecha fin</Label>
                      <Input
                        id="date-end"
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => {
                      setRegionFilter('all');
                      setDateRange({ start: '', end: '' });
                    }}>
                      Limpiar
                    </Button>
                    <Button onClick={() => setIsAdvancedFiltersOpen(false)}>
                      Aplicar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-700/50 border-b border-slate-600">
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Fecha/Hora
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Programadora
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Radio
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Región
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Comuna
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Marca
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Campaña
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Valor $
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-600">
              {filteredDetections.map((detection) => (
                <tr key={detection.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{detection.date}</div>
                    <div className="text-xs text-slate-400">{detection.time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {detection.programadora}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {detection.radio}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {detection.region}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {detection.comuna}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                    {detection.marca}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {detection.campaña}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full text-white ${getStatusColor(detection.status)}`}>
                      {detection.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400 font-medium">
                    ${detection.cost.toLocaleString()} CLP
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className={`${detection.audioPath ? 'text-blue-400 hover:text-blue-300' : 'text-gray-500 cursor-not-allowed'}`}
                        onClick={() => detection.audioPath && handlePlayAudio(detection.id)}
                        disabled={!detection.audioPath}
                        title={detection.audioPath ? 'Reproducir audio' : 'Audio no disponible'}
                      >
                        {currentlyPlaying === detection.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-slate-400 hover:text-slate-300"
                        onClick={() => handleShowDetails(detection)}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDetections.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400">No se encontraron resultados</p>
          </div>
        )}
      </div>

      {/* Summary and Pagination */}
      <div className="flex justify-between items-center text-sm text-slate-400">
        <div>
          Mostrando {detections.length} de {totalDetections} detecciones
        </div>
        
        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
              className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
            >
              Anterior
            </Button>
            
            <span className="text-white">
              Página {currentPage} de {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || loading}
              className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Detalles de la Detección</DialogTitle>
          </DialogHeader>
          {selectedDetection && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Fecha y Hora</Label>
                  <p className="text-white">{selectedDetection.date} {selectedDetection.time}</p>
                </div>
                <div>
                  <Label className="text-slate-300">Estado</Label>
                  <p className={`inline-flex px-2 py-1 text-xs font-medium rounded-full text-white ${getStatusColor(selectedDetection.status)}`}>
                    {selectedDetection.status}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-300">Programadora</Label>
                  <p className="text-white">{selectedDetection.programadora}</p>
                </div>
                <div>
                  <Label className="text-slate-300">Radio</Label>
                  <p className="text-white">{selectedDetection.radio}</p>
                </div>
                <div>
                  <Label className="text-slate-300">Región</Label>
                  <p className="text-white">{selectedDetection.region}</p>
                </div>
                <div>
                  <Label className="text-slate-300">Comuna</Label>
                  <p className="text-white">{selectedDetection.comuna}</p>
                </div>
                <div>
                  <Label className="text-slate-300">Marca</Label>
                  <p className="text-white font-medium">{selectedDetection.marca}</p>
                </div>
                <div>
                  <Label className="text-slate-300">Campaña</Label>
                  <p className="text-white">{selectedDetection.campaña}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-slate-300">Texto Detectado</Label>
                <p className="text-white bg-slate-800 p-3 rounded-lg mt-1">{selectedDetection.detectedText}</p>
              </div>
              
              <div>
                <Label className="text-slate-300">Texto Original</Label>
                <p className="text-white bg-slate-800 p-3 rounded-lg mt-1">{(selectedDetection as any).originalText || selectedDetection.detectedText}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-slate-300">Confianza</Label>
                  <p className="text-white">{(selectedDetection.confidence * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <Label className="text-slate-300">Similitud</Label>
                  <p className="text-white">{(selectedDetection.similarity * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <Label className="text-slate-300">Valor</Label>
                  <p className="text-green-400 font-medium">${selectedDetection.cost.toLocaleString()} CLP</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => selectedDetection.audioPath && handlePlayAudio(selectedDetection.id)}
                  disabled={!selectedDetection.audioPath}
                  className={`${selectedDetection.audioPath ? 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700' : 'bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed'}`}
                  title={selectedDetection.audioPath ? 'Reproducir audio' : 'Audio no disponible'}
                >
                  <Volume2 className="w-4 h-4 mr-2" />
                  {selectedDetection.audioPath 
                    ? (currentlyPlaying === selectedDetection.id ? 'Pausar Audio' : 'Reproducir Audio')
                    : 'Audio no disponible'
                  }
                </Button>
                <Button onClick={() => setIsDetailsModalOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

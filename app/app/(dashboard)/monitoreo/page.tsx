
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Activity, 
  Radio as RadioIcon, 
  Volume2, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Clock,
  Users,
  Target,
  PlayCircle,
  Square,
  Search,
  RefreshCw,
  Settings,
  Filter,
  MapPin,
  Building
} from 'lucide-react';

interface Radio {
  id: string;
  name: string;
  region: string;
  streamUrl: string;
  platform: string;
  isActive: boolean;
  metadata?: {
    city?: string;
    frequency?: string;
    website?: string;
  };
}

interface MonitoringSession {
  id: string;
  radioId: string;
  radioName: string;
  streamUrl: string;
  platform: string;
  targetPhrases: string[];
  isActive: boolean;
  startTime: string;
  captureInterval: number;
  captureDuration: number;
  totalCaptures: number;
  advertisementsFound: number;
  lastCapture?: string;
  lastAdvertisement?: string;
}

interface DetectionEvent {
  sessionId: string;
  radioName: string;
  timestamp: string;
  transcription: string;
  analysis: {
    isAdvertisement: boolean;
    confidence: number;
    advertisementType: string;
    detectedPhrases: string[];
    brandMentions: string[];
    summary: string;
  };
  confidence: number;
}

interface SystemStatus {
  dependencies: { [tool: string]: boolean };
  activeCaptures: number;
  activeSessions: number;
  totalEvents: number;
  systemReady: boolean;
}

export default function MonitoreoPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [activeSessions, setActiveSessions] = useState<MonitoringSession[]>([]);
  const [recentDetections, setRecentDetections] = useState<DetectionEvent[]>([]);
  const [overallStats, setOverallStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para el inicio de análisis
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [selectedRadios, setSelectedRadios] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'region' | 'custom'>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  
  // Estados para datos reales de la BD
  const [radios, setRadios] = useState<Radio[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingRadios, setLoadingRadios] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    loadMonitoringData();
    loadRadiosFromDatabase();
    const interval = setInterval(loadMonitoringData, 10000); // Cada 10 segundos
    return () => clearInterval(interval);
  }, []);

  // Cargar ciudades cuando cambia la región
  useEffect(() => {
    if (selectedRegion) {
      const regionCities = radios
        .filter(radio => radio.region === selectedRegion)
        .map(radio => radio.metadata?.city || '')
        .filter(city => city !== '')
        .filter((city, index, arr) => arr.indexOf(city) === index);
      setCities(regionCities);
    } else {
      setCities([]);
    }
  }, [selectedRegion, radios]);

  const loadMonitoringData = async () => {
    try {
      const response = await fetch('/api/monitoring/status');
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data.systemStatus);
        setActiveSessions(data.activeSessions);
        setRecentDetections(data.recentDetections);
        setOverallStats(data.overallStats);
      }
    } catch (error) {
      console.error('Error cargando datos de monitoreo:', error);
    }
  };

  const loadRadiosFromDatabase = async () => {
    setLoadingRadios(true);
    try {
      const response = await fetch('/api/radios?active=true');
      if (response.ok) {
        const data = await response.json();
        console.log('Datos de radios recibidos:', data);
        if (data.success) {
          setRadios(data.data);
          console.log('Radios cargadas:', data.data.length);
          
          // Extraer regiones únicas
          const uniqueRegions = [...new Set(data.data.map((radio: Radio) => radio.region))];
          setRegions(uniqueRegions);
          console.log('Regiones encontradas:', uniqueRegions);
        }
      }
    } catch (error) {
      console.error('Error cargando radios desde la BD:', error);
    } finally {
      setLoadingRadios(false);
    }
  };

  const stopMonitoring = async (sessionId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/monitoring/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        loadMonitoringData(); // Recargar datos
      }
    } catch (error) {
      console.error('Error deteniendo monitoreo:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = activeSessions.filter(session =>
    session.radioName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.platform.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSystemReady = systemStatus?.systemReady ?? false;

  // Funciones auxiliares para filtros usando datos reales
  const getUniqueRegions = () => {
    return regions;
  };

  const getCitiesByRegion = (region: string) => {
    return radios
      .filter(radio => radio.region === region)
      .map(radio => radio.metadata?.city || '')
      .filter(city => city !== '')
      .filter((city, index, arr) => arr.indexOf(city) === index);
  };

  const getFilteredRadios = () => {
    let filtered = radios.filter(radio => radio.isActive);
    
    if (filterType === 'region' && selectedRegion) {
      filtered = filtered.filter(radio => radio.region === selectedRegion);
      if (selectedCity) {
        filtered = filtered.filter(radio => radio.metadata?.city === selectedCity);
      }
    }
    
    return filtered;
  };

  const handleRadioSelection = (radioId: string, checked: boolean) => {
    if (checked) {
      setSelectedRadios([...selectedRadios, radioId]);
    } else {
      setSelectedRadios(selectedRadios.filter(id => id !== radioId));
    }
  };

  const handleSelectAllRadios = () => {
    const filteredRadios = getFilteredRadios();
    setSelectedRadios(filteredRadios.map(radio => radio.id));
  };

  const handleDeselectAllRadios = () => {
    setSelectedRadios([]);
  };

  const startMonitoring = async () => {
    console.log('🚀 Iniciando monitoreo...');
    console.log('📻 Radios seleccionadas:', selectedRadios);
    console.log('🔧 Configuración:', { filterType, selectedRegion, selectedCity });
    
    if (selectedRadios.length === 0) {
      console.log('❌ No hay radios seleccionadas');
      alert('Por favor selecciona al menos una radio para monitorear');
      return;
    }

    setLoading(true);
    console.log('⏳ Enviando solicitud al servidor...');
    
    try {
      const requestBody = { 
        radioIds: selectedRadios,
        filterType,
        selectedRegion,
        selectedCity 
      };
      
      console.log('📤 Datos enviados:', requestBody);
      
      const response = await fetch('/api/monitoring/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Respuesta del servidor:', response.status, response.statusText);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Monitoreo iniciado exitosamente:', responseData);
        
        setShowStartDialog(false);
        setSelectedRadios([]);
        setFilterType('all');
        setSelectedRegion('');
        setSelectedCity('');
        loadMonitoringData(); // Recargar datos
      } else {
        const errorData = await response.text();
        console.error('❌ Error en la respuesta:', errorData);
        alert(`Error al iniciar monitoreo: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('💥 Error iniciando monitoreo:', error);
      alert('Error de conexión al iniciar monitoreo');
    } finally {
      setLoading(false);
      console.log('🏁 Proceso de inicio completado');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Monitoreo en Tiempo Real</h1>
          <p className="text-white mt-1">Captura y análisis automático de publicidad</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={() => setShowStartDialog(true)} 
            variant="default" 
            className="bg-green-600 hover:bg-green-700"
            disabled={false}
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            Iniciar Análisis
          </Button>
          <Button onClick={loadMonitoringData} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Panel de Inicio de Análisis */}
      {showStartDialog && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-400" />
              Configurar Nuevo Análisis
            </CardTitle>
            <p className="text-slate-300 text-sm">
              Selecciona las radios y regiones que deseas monitorear para detectar publicidad automáticamente
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filtros de Selección */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-white mb-2 block">Tipo de Selección:</label>
                <Select value={filterType} onValueChange={(value: 'all' | 'region' | 'custom') => {
                  setFilterType(value);
                  setSelectedRegion('');
                  setSelectedCity('');
                  setSelectedRadios([]);
                }}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all" className="text-white hover:bg-slate-600 focus:bg-slate-600">
                      <div className="flex items-center gap-2">
                        <RadioIcon className="h-4 w-4" />
                        Todas las Radios Activas
                      </div>
                    </SelectItem>
                    <SelectItem value="region" className="text-white hover:bg-slate-600 focus:bg-slate-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Filtrar por Región/Ciudad
                      </div>
                    </SelectItem>
                    <SelectItem value="custom" className="text-white hover:bg-slate-600 focus:bg-slate-600">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Selección Personalizada
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filterType === 'region' && (
                <>
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Región:</label>
                    <Select value={selectedRegion} onValueChange={(value) => {
                      setSelectedRegion(value);
                      setSelectedCity('');
                      setSelectedRadios([]);
                    }}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Seleccionar región..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {getUniqueRegions().map((region) => (
                          <SelectItem key={region} value={region} className="text-white hover:bg-slate-600 focus:bg-slate-600">
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedRegion && (
                    <div>
                      <label className="text-sm font-medium text-white mb-2 block">Ciudad (Opcional):</label>
                      <Select value={selectedCity} onValueChange={(value) => {
                        setSelectedCity(value);
                        setSelectedRadios([]);
                      }}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Todas las ciudades..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="all" className="text-white hover:bg-slate-600 focus:bg-slate-600">
                            Todas las ciudades
                          </SelectItem>
                          {getCitiesByRegion(selectedRegion).map((city) => (
                            <SelectItem key={city} value={city} className="text-white hover:bg-slate-600 focus:bg-slate-600">
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Lista de Radios */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-medium">
                  Radios Disponibles ({getFilteredRadios().length})
                </h4>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSelectAllRadios}
                    variant="outline"
                    size="sm"
                    className="bg-green-500 border-green-500 text-white hover:bg-green-600 hover:border-green-600 hover:text-white"
                  >
                    Seleccionar Todas
                  </Button>
                  <Button
                    onClick={handleDeselectAllRadios}
                    variant="outline"
                    size="sm"
                    className="bg-red-500 text-white border-red-500 hover:bg-red-700 hover:text-white hover:border-red-700  "
                  >
                    Deseleccionar Todas
                  </Button>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto bg-slate-800/50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {getFilteredRadios().map((radio) => (
                    <div key={radio.id} className="flex items-center space-x-3 p-2 rounded hover:bg-slate-700/50">
                      <Checkbox
                        id={`radio-${radio.id}`}
                        checked={selectedRadios.includes(radio.id)}
                        className="data-[state=checked]:bg-white data-[state=checked]:text-black border-white"
                        onCheckedChange={(checked) => handleRadioSelection(radio.id, checked as boolean)}
                      />
                      <label 
                        htmlFor={`radio-${radio.id}`} 
                        className="flex-1 cursor-pointer text-sm text-white"
                      >
                        <div className="font-medium">{radio.name}</div>
                        <div className="text-xs text-slate-400">{radio.region} — {radio.metadata?.city || 'N/A'}</div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Resumen y Acciones */}
            <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-lg">
              <div className="text-sm text-slate-300">
                <strong className="text-white">{selectedRadios.length}</strong> radios seleccionadas
                {filterType === 'region' && selectedRegion && (
                  <span> • Región: <strong className="text-white">{selectedRegion}</strong></span>
                )}
                {selectedCity && (
                  <span> • Ciudad: <strong className="text-white">{selectedCity}</strong></span>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowStartDialog(false)}
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={startMonitoring}
                  disabled={selectedRadios.length === 0 || loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  {loading ? 'Iniciando...' : 'Iniciar Monitoreo'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado del Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Estado del Sistema</p>
                <p className={`text-2xl font-bold mt-2 ${isSystemReady ? 'text-green-400' : 'text-yellow-400'}`}>
                  {isSystemReady ? 'Operativo' : 'Parcial'}
                </p>
              </div>
              {isSystemReady ? (
                <CheckCircle className="h-8 w-8 text-green-400" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-yellow-400" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Radios Monitoreando</p>
                <p className="text-2xl font-bold text-blue-400 mt-2">
                  {systemStatus?.activeSessions || 0}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Detecciones Hoy</p>
                <p className="text-2xl font-bold text-green-400 mt-2">
                  {overallStats?.detectionsToday || 0}
                </p>
              </div>
              <Target className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Detecciones</p>
                <p className="text-2xl font-bold text-purple-400 mt-2">
                  {overallStats?.totalDetections || 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sesiones Activas */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Monitoreo Activo</span>
                </CardTitle>
                <Badge variant="secondary">
                  {filteredSessions.length} sesiones
                </Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Buscar por radio o plataforma..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <RadioIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-white">No hay sesiones de monitoreo activas</p>
                  <p className="text-sm mt-2 text-white">Ve a la sección de Radios para iniciar el monitoreo</p>
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <Card key={session.id} className="bg-slate-700/30 border-slate-600">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <div>
                            <h3 className="font-medium text-white">{session.radioName}</h3>
                            <p className="text-xs text-slate-400">{session.platform}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => stopMonitoring(session.id)}
                          disabled={loading}
                        >
                          <Square className="h-3 w-3 mr-1" />
                          Detener
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 mb-3">
                        <div>
                          <span className="font-medium">Inicio:</span>{' '}
                          {new Date(session.startTime).toLocaleString('es-CL')}
                        </div>
                        <div>
                          <span className="font-medium">Intervalo:</span> {session.captureInterval}s
                        </div>
                        <div>
                          <span className="font-medium">Capturas:</span> {session.totalCaptures}
                        </div>
                        <div>
                          <span className="font-medium">Publicidad:</span>{' '}
                          <span className="text-green-400">{session.advertisementsFound}</span>
                        </div>
                      </div>

                      {session.targetPhrases.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-slate-400 mb-2">Frases objetivo:</p>
                          <div className="flex flex-wrap gap-1">
                            {session.targetPhrases.map((phrase, i) => (
                              <Badge key={i} variant="outline" className="text-[10px]">
                                {phrase}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {session.lastAdvertisement && (
                        <div className="text-xs text-green-400">
                          <Target className="h-3 w-3 inline mr-1" />
                          Última detección: {new Date(session.lastAdvertisement).toLocaleString('es-CL')}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel Lateral */}
        <div className="space-y-4">
          {/* Estado de Herramientas */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-sm">Herramientas del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {systemStatus && systemStatus.dependencies ? (
                Object.entries(systemStatus.dependencies).map(([tool, available]) => (
                  <div key={tool} className="flex items-center justify-between">
                    <span className="text-sm">{tool}</span>
                    {available ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                ))
              ) : (
                <div className="text-sm text-white">Verificando herramientas...</div>
              )}
            </CardContent>
          </Card>

          {/* Detecciones Recientes */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-sm flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Detecciones Recientes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-80 overflow-y-auto">
              {recentDetections.length === 0 ? (
                <div className="text-center py-4 text-slate-400">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-white">No hay detecciones recientes</p>
                </div>
              ) : (
                recentDetections.map((detection, index) => (
                  <div key={index} className="border border-slate-600 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-white">
                        {detection.radioName}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(detection.confidence * 100)}%
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-slate-400 mb-2">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {new Date(detection.timestamp).toLocaleString('es-CL')}
                    </div>

                    <p className="text-xs text-slate-300 mb-2 line-clamp-2">
                      {detection.analysis.summary}
                    </p>

                    {detection.analysis.brandMentions.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {detection.analysis.brandMentions.slice(0, 3).map((brand, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] px-1 py-0">
                            {brand}
                          </Badge>
                        ))}
                        {detection.analysis.brandMentions.length > 3 && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            +{detection.analysis.brandMentions.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
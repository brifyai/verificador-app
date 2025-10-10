'use client';

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Waves, TextSelect, Bot, Calculator, CalendarDays, Search, Clock, CheckCircle, XCircle, AlertTriangle, Eye, Pause, Play, StopCircle, Activity, Radio as RadioIcon, User, Calendar, Timer, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// --- Interfaces para los datos que vienen de la API ---
interface Radio {
  id: string;
  name: string;
  region: string | null;
  isActive?: boolean;
  lastVerificationStatus?: 'ONLINE' | 'OFFLINE' | null;
  lastVerifiedAt?: string | null;
  streamPlatform?: string;
}

interface Phrase {
  id: string;
  phrase: string;
  marca: string;
}

interface ApiConfiguration {
  id: string;
  provider: string;
  model: string | null;
  enabled: boolean;
  priority: number;
  costPerUnit: number;
  rateLimit: number | null;
  metadata: any;
}

// --- Constantes de configuración ---
const PRICE_PER_RADIO = 15; // $15 por radio/mes

export default function ConfigurarAnalisisPage() {
  const router = useRouter();

  // --- Estados del componente ---
  const [radios, setRadios] = useState<Radio[]>([]);
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [apiConfigurations, setApiConfigurations] = useState<ApiConfiguration[]>([]);
  const [selectedRadioIds, setSelectedRadioIds] = useState<Set<string>>(new Set());
  const [selectedPhraseId, setSelectedPhraseId] = useState<string>('');
  const [selectedApiConfigId, setSelectedApiConfigId] = useState<string>('');
  const [scheduleDays, setScheduleDays] = useState<string[]>([]);
  const [recordingStartHour, setRecordingStartHour] = useState<number>(5);  // 5 AM por defecto
  const [recordingEndHour, setRecordingEndHour] = useState<number>(2);      // 2 AM por defecto
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'new' | 'active'>('new');
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loadingActive, setLoadingActive] = useState<boolean>(false);
  
  // ✅ NUEVOS ESTADOS PARA FILTROS
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  
  // ✅ ESTADO PARA MODAL DE CONFIRMACIÓN
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ✅ NUEVOS ESTADOS PARA MODAL DE DETALLES
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Carga de datos inicial (radios, frases y APIs)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [radiosRes, phrasesRes, apiConfigsRes] = await Promise.all([
          fetch("/api/radios?limit=1000"),
          fetch("/api/phrases"),
          fetch("/api/api-configurations?enabled=true"), // Solo APIs habilitadas
        ]);
        if (!radiosRes.ok || !phrasesRes.ok || !apiConfigsRes.ok) {
          throw new Error("Error al cargar datos iniciales");
        }
        
        const radiosData = await radiosRes.json();
        const phrasesData = await phrasesRes.json();
        const apiConfigsData = await apiConfigsRes.json();
        
        setRadios(radiosData.data || []);
        setPhrases(phrasesData.phrases || []);
        setApiConfigurations(apiConfigsData.data || []);
        
        // Auto-seleccionar la primera API habilitada
        if (apiConfigsData.data && apiConfigsData.data.length > 0) {
          setSelectedApiConfigId(apiConfigsData.data[0].id);
        }

      } catch (error) {
        toast.error("Error al cargar los datos necesarios para la configuración.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Cargar sesiones (todas o activas) cuando cambie la pestaña
  useEffect(() => {
    let interval: any;
    const load = async () => {
      try {
        setLoadingActive(true);
        const url = activeTab === 'active' 
          ? '/api/monitoring/sessions?status=ACTIVE&limit=100'
          : '/api/monitoring/sessions?status=ALL&limit=100';
        const res = await fetch(url);
        const data = await res.json();
        if (data && data.success) {
          setActiveSessions(data.data || []);
        } else if (activeTab === 'active') {
          // fallback a status
          const res2 = await fetch('/api/monitoring/status');
          const d2 = await res2.json();
          setActiveSessions(Array.isArray(d2.activeSessions) ? d2.activeSessions : []);
        } else {
          setActiveSessions([]);
        }
      } catch (e) {
        // noop
      } finally {
        setLoadingActive(false);
      }
    };
    if (activeTab === 'active' || activeTab === 'new') {
      load();
      interval = setInterval(load, 20000);
    }
    return () => interval && clearInterval(interval);
  }, [activeTab]);

  // Funciones para manejar la selección de radios
  const handleRadioToggle = (radioId: string) => {
    setSelectedRadioIds(prev => {
      const newSet = new Set(prev);
      newSet.has(radioId) ? newSet.delete(radioId) : newSet.add(radioId);
      return newSet;
    });
  };
  
  const selectAllRadios = () => setSelectedRadioIds(new Set(radios.map(r => r.id)));
  const deselectAllRadios = () => setSelectedRadioIds(new Set());

  // ✅ NUEVA FUNCIÓN: Filtrar radios según criterios
  const filteredRadios = useMemo(() => {
    let result = radios;

    // Filtrar por búsqueda
    if (searchTerm) {
      result = result.filter(radio =>
        radio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (radio.region && radio.region.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtrar por región
    if (filterRegion !== 'all') {
      result = result.filter(radio => radio.region === filterRegion);
    }

    return result;
  }, [radios, searchTerm, filterRegion]);

  // ✅ Obtener regiones únicas para el filtro
  const uniqueRegions = useMemo(() => {
    const regions = radios
      .map(r => r.region)
      .filter((region): region is string => region !== null);
    return Array.from(new Set(regions)).sort();
  }, [radios]);

  // Cálculo de costos
  const { radioCost, aiCost, totalCost } = useMemo(() => {
    const radioCost = selectedRadioIds.size * PRICE_PER_RADIO;
    const selectedConfig = apiConfigurations.find(c => c.id === selectedApiConfigId);
    const aiCost = selectedConfig ? selectedConfig.costPerUnit : 0;
    return { radioCost, aiCost, totalCost: radioCost + aiCost };
  }, [selectedRadioIds.size, selectedApiConfigId, apiConfigurations]);

  // ✅ VALIDAR Y MOSTRAR MODAL DE CONFIRMACIÓN
  const handleValidateAndShowConfirm = () => {
    // ✅ Validaciones separadas para mejor feedback
    if (selectedRadioIds.size === 0) {
      toast.warning("⚠️ Debes seleccionar al menos una radio.");
      return;
    }

    if (!selectedPhraseId) {
      toast.warning("⚠️ Debes seleccionar una frase para monitorear.");
      return;
    }

    // ✅ Validar horarios
    if (recordingStartHour === recordingEndHour) {
      toast.warning("⚠️ El horario de inicio y fin no pueden ser iguales.");
      return;
    }

    // Mostrar modal de confirmación
    setShowConfirmModal(true);
  };

  // ✅ FUNCIÓN MEJORADA: Iniciar Monitoreo con TODOS los datos
  const handleStartMonitoring = async () => {
    setIsSubmitting(true);
    setShowConfirmModal(false);
    
    try {
      console.log('🚀 Iniciando monitoreo con:', {
        radios: selectedRadioIds.size,
        phraseId: selectedPhraseId,
        apiConfigId: selectedApiConfigId,
        scheduleDays
      });

      // Convertir horas a formato HH:MM
      const startTime = `${recordingStartHour.toString().padStart(2, '0')}:00`;
      const endTime = `${recordingEndHour.toString().padStart(2, '0')}:00`;
      
      // Convertir días de string a números (0=Domingo, 1=Lunes, etc.)
      const daysAsNumbers = scheduleDays.map(day => {
        const dayMap: { [key: string]: number } = {
          'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 
          'friday': 5, 'saturday': 6, 'sunday': 0
        };
        return dayMap[day.toLowerCase()] ?? null;
      }).filter(day => day !== null); // Filtrar valores null

      const selectedConfig = apiConfigurations.find(c => c.id === selectedApiConfigId);

      const requestData = {
        userId: 'user123', // TODO: Obtener del contexto de autenticación
        radioIds: Array.from(selectedRadioIds),
        phraseId: selectedPhraseId,
        days: daysAsNumbers.length > 0 ? daysAsNumbers : [1, 2, 3, 4, 5, 6, 0], // Si no hay días, usar todos
        startTime: startTime,
        endTime: endTime,
        apiConfigId: selectedApiConfigId,
        aiModel: selectedConfig?.model || null,
        description: `Monitoreo programado desde dashboard - ${new Date().toLocaleDateString()}`
      };

      console.log('📤 Enviando datos:', requestData);

      const response = await fetch("/api/monitoring/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
<<<<<<< HEAD
<<<<<<< HEAD
        body: JSON.stringify(requestData),
=======
        body: JSON.stringify({
          filterType: 'custom',
          radioIds: Array.from(selectedRadioIds),
          phraseId: selectedPhraseId,
          apiConfigId: selectedApiConfigId,     // ✅ ID de configuración de API
          scheduleDays: scheduleDays,
          recordingStartHour,
          recordingEndHour,
        }),
>>>>>>> origin/feature/mzurita
=======
        body: JSON.stringify(requestData),
>>>>>>> origin/feature/mzurita
      });

      const data = await response.json();
      console.log('📥 Respuesta recibida:', data);

      if (!response.ok) {
        throw new Error(data.error || "Error al iniciar el monitoreo");
      }
      
      // ✅ Mensaje de éxito detallado con información de la respuesta
      if (data.success && data.data) {
        const { scheduledRadios, phrase, timeRange, duration, estimatedCost } = data.data;
        
        toast.success(
          `✅ ¡Monitoreo programado exitosamente!
          
📻 ${scheduledRadios} radio${scheduledRadios > 1 ? 's' : ''}
🔍 Frase: "${phrase.text}" (${phrase.brand})
⏰ Horario: ${timeRange}
⏱️ Duración: ${duration}
💰 Costo estimado: $${estimatedCost}`,
          { duration: 8000 }
        );
      } else {
        toast.success(
          `✅ ¡Monitoreo iniciado correctamente!`,
          { duration: 5000 }
        );
      }

      // ✅ Limpiar formulario después del éxito
      setSelectedRadioIds(new Set());
      setSelectedPhraseId('');
      setScheduleDays([]);
      
      // ✅ Redirigir al dashboard principal
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Error al iniciar monitoreo:', error);
      toast.error(
        `❌ Error: ${error.message || 'No se pudo iniciar el monitoreo'}`,
        { duration: 6000 }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Vista: Monitoreos (Activos)
  if (activeTab === 'active') {
    return (
      <div className="space-y-8">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 mb-2">
            <TabsTrigger value="new" className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">Configurar Nuevo</TabsTrigger>
            <TabsTrigger value="active" className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">Activos</TabsTrigger>
          </TabsList>
        </Tabs>

        <div>
          <h1 className="text-3xl font-bold text-white">Monitoreos Activos</h1>
          <p className="text-slate-400 mt-1">Listado de sesiones actualmente en ejecución</p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Sesiones</CardTitle>
            <CardDescription>Actualiza automáticamente cada 20s</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingActive ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-slate-300">
                  <Activity className="h-5 w-5 animate-pulse" />
                  <span>Cargando sesiones activas...</span>
                </div>
              </div>
            ) : activeSessions.length === 0 ? (
              <div className="text-center py-12 bg-slate-700/20 rounded-lg border-2 border-dashed border-slate-600">
                <RadioIcon className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400 text-lg font-medium mb-2">No hay monitoreos activos</p>
                <p className="text-slate-500 text-sm">Las sesiones aparecerán aquí cuando estén en ejecución</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {activeSessions.map((s: any) => {
                  const sessionId = s.id || s.sessionId;
                  const radioName = s.radioName || s.radio?.name || 'Radio';
                  const userName = s.userName || s.user?.name;
                  const startTime = new Date(s.startTime || s.startedAt || Date.now());
                  const status = s.status || 'ACTIVE';
                  const isPaused = status === 'PAUSED';
                  
                  return (
                    <div key={sessionId} className="group relative overflow-hidden rounded-xl border border-slate-700 bg-gradient-to-r from-slate-900/60 to-slate-800/40 backdrop-blur-sm hover:border-slate-600 transition-all duration-300">
                      {/* Header con indicador de estado */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
                      
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          {/* Información principal */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <div className="relative">
                                  <RadioIcon className="h-5 w-5 text-blue-400" />
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                                </div>
                                <h3 className="text-lg font-semibold text-white">{radioName}</h3>
                              </div>
                              <Badge 
                                variant={isPaused ? "secondary" : "default"} 
                                className={`${isPaused ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'} border`}
                              >
                                {isPaused ? (
                                  <><Pause className="h-3 w-3 mr-1" />Pausado</>
                                ) : (
                                  <><Activity className="h-3 w-3 mr-1" />Activo</>
                                )}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center gap-2 text-slate-300">
                                <Timer className="h-4 w-4 text-slate-400" />
                                <span>Inicio: {startTime.toLocaleString('es-CL', { 
                                  day: '2-digit', 
                                  month: '2-digit', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}</span>
                              </div>
                              
                              {userName && (
                                <div className="flex items-center gap-2 text-slate-300">
                                  <User className="h-4 w-4 text-slate-400" />
                                  <span>{userName}</span>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2 text-slate-300">
                                <Zap className="h-4 w-4 text-slate-400" />
                                <span>ID: {sessionId.slice(0, 8)}...</span>
                              </div>
                            </div>
                            
                            {/* Información adicional si está disponible */}
                            {(s.phrase || s.detections) && (
                              <div className="pt-2 border-t border-slate-700/50">
                                <div className="flex items-center gap-4 text-xs text-slate-400">
                                  {s.phrase && (
                                    <span>Frase: "{s.phrase}"</span>
                                  )}
                                  {s.detections && (
                                    <span>Detecciones: {s.detections}</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Botones de acción */}
                          <div className="flex items-center gap-2 ml-4">
                            {/* Botón Ver Detalles */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400"
                              onClick={async () => {
                                setSelectedSession(s);
                                setShowDetailsModal(true);
                                setLoadingDetails(true);
                                try {
                                  const res = await fetch(`/api/monitoring/sessions/${sessionId}`);
                                  const data = await res.json();
                                  setSessionDetails(data.success ? data.data : null);
                                } catch (error) {
                                  console.error('Error loading session details:', error);
                                  setSessionDetails(null);
                                } finally {
                                  setLoadingDetails(false);
                                }
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Detalles
                            </Button>
                            
                            {/* Botón Pausar/Reanudar */}
                            <Button
                              variant="outline"
                              size="sm"
                              className={`${
                                isPaused 
                                  ? 'border-green-500/50 text-green-400 hover:bg-green-500/10 hover:border-green-400'
                                  : 'border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-400'
                              }`}
                              onClick={async () => {
                                try {
                                  const action = isPaused ? 'resume' : 'pause';
                                  await fetch(`/api/monitoring/${action}`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ sessionId })
                                  });
                                  
                                  // Actualizar estado local
                                  setActiveSessions(prev => prev.map(session => 
                                    (session.id || session.sessionId) === sessionId 
                                      ? { ...session, status: isPaused ? 'ACTIVE' : 'PAUSED' }
                                      : session
                                  ));
                                  
                                  toast.success(`Monitoreo ${isPaused ? 'reanudado' : 'pausado'} correctamente`);
                                } catch (error) {
                                  toast.error(`No se pudo ${isPaused ? 'reanudar' : 'pausar'} el monitoreo`);
                                }
                              }}
                            >
                              {isPaused ? (
                                <><Play className="h-4 w-4 mr-1" />Reanudar</>
                              ) : (
                                <><Pause className="h-4 w-4 mr-1" />Pausar</>
                              )}
                            </Button>
                            
                            {/* Botón Detener */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400"
                              onClick={async () => {
                                try {
                                  await fetch('/api/monitoring/stop', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ sessionId })
                                  });
                                  setActiveSessions(prev => prev.filter(p => (p.id || p.sessionId) !== sessionId));
                                  toast.success('Monitoreo detenido correctamente');
                                } catch (error) {
                                  toast.error('No se pudo detener el monitoreo');
                                }
                              }}
                            >
                              <StopCircle className="h-4 w-4 mr-1" />
                              Detener
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2 bg-gray-800 mb-2">
          <TabsTrigger value="new" className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">Configurar Nuevo</TabsTrigger>
          <TabsTrigger value="active" className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">Activos</TabsTrigger>
        </TabsList>
      </Tabs>
      <div>
        <h1 className="text-3xl font-bold text-white">Configurar Nuevo Análisis</h1>
        <p className="text-slate-400 mt-1">
          Selecciona las radios y frases que deseas monitorear para detectar publicidad automáticamente.
        </p>
      </div>

      {/* ✅ SELECCIÓN DE RADIOS CON FILTROS MEJORADOS */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center">
              <Waves className="h-6 w-6 mr-3 text-blue-400" />
              <div>
                <CardTitle className="text-lg text-white">Selecciona las Radios</CardTitle>
                <CardDescription className="text-slate-400">
                  {radios.length} radios totales • {filteredRadios.length} mostradas • {selectedRadioIds.size} seleccionadas
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => setSelectedRadioIds(new Set(filteredRadios.map(r => r.id)))} 
                className="bg-green-600 hover:bg-green-700"
              >
                Seleccionar Mostradas
              </Button>
              <Button size="sm" variant="destructive" onClick={deselectAllRadios}>
                Ninguna
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* ✅ BARRA DE FILTROS */}
          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Búsqueda */}
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Buscar radio</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Nombre o región..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Filtro por Región */}
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Filtrar por región</label>
                <Select value={filterRegion} onValueChange={setFilterRegion}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Todas las regiones" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600 text-white max-h-80">
                    <SelectItem value="all" className="focus:bg-slate-600">
                      Todas las regiones ({radios.length})
                    </SelectItem>
                    {uniqueRegions.map(region => {
                      const count = radios.filter(r => r.region === region).length;
                      return (
                        <SelectItem key={region} value={region} className="focus:bg-slate-600">
                          {region} ({count})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Botón Limpiar Filtros */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterRegion('all');
                  }}
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                  disabled={searchTerm === '' && filterRegion === 'all'}
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </div>

          {/* ✅ LISTA DE RADIOS FILTRADAS */}
          {filteredRadios.length === 0 ? (
            <div className="text-center py-12 bg-slate-700/30 rounded-lg">
              <p className="text-slate-400 mb-2">No se encontraron radios con los filtros aplicados</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterRegion('all');
                }}
                className="border-slate-600 text-slate-300"
              >
                Limpiar filtros
              </Button>
            </div>
          ) : (
            <>
              {/* Scroll container con altura máxima */}
              <div className="max-h-[500px] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredRadios.map(radio => {
                    const isOnline = radio.lastVerificationStatus === 'ONLINE';
                    const isOffline = radio.lastVerificationStatus === 'OFFLINE';
                    const isInactive = radio.isActive === false;
                    
                    return (
                      <div
                        key={radio.id}
                        onClick={() => handleRadioToggle(radio.id)}
                        className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          selectedRadioIds.has(radio.id)
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox checked={selectedRadioIds.has(radio.id)} className="pointer-events-none mt-1" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-white truncate">{radio.name}</p>
                              {isOnline && (
                                <span title="Stream online">
                                  <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                                </span>
                              )}
                              {isOffline && (
                                <span title="Stream offline">
                                  <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                                </span>
                              )}
                              {isInactive && (
                                <span title="Radio inactiva">
                                  <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-400 truncate">{radio.region || 'Sin región'}</p>
                            {radio.streamPlatform && (
                              <p className="text-xs text-slate-500 mt-1">{radio.streamPlatform}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Contador de resultados */}
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-sm text-slate-400 text-center">
                  Mostrando {filteredRadios.length} de {radios.length} radios
                  {selectedRadioIds.size > 0 && ` • ${selectedRadioIds.size} seleccionadas`}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* --- Selección de Frase --- */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center">
            <TextSelect className="h-6 w-6 mr-3 text-purple-400" />
            <div>
              <CardTitle className="text-lg text-white">Seleccionar Frase para Monitoreo</CardTitle>
              <CardDescription className="text-slate-400">
                {phrases.length} frases disponibles
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {phrases.length === 0 ? (
            <p className="text-slate-400">No hay frases configuradas. <a href="/frases" className="text-blue-400 underline">Crear una frase</a></p>
          ) : (
            <Select value={selectedPhraseId} onValueChange={setSelectedPhraseId}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Selecciona una frase de tu lista..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600 text-white">
                {phrases.map(phrase => (
                  <SelectItem key={phrase.id} value={phrase.id} className="focus:bg-slate-600">
                    <span className="font-semibold">{phrase.marca}:</span> "{phrase.phrase}"
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* --- API de Transcripción --- */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center">
            <Bot className="h-6 w-6 mr-3 text-emerald-400" />
            <div>
              <CardTitle className="text-lg text-white">API de Transcripción</CardTitle>
              <CardDescription className="text-slate-400">
                {apiConfigurations.length > 0 
                  ? `${apiConfigurations.length} API${apiConfigurations.length !== 1 ? 's' : ''} configurada${apiConfigurations.length !== 1 ? 's' : ''} y habilitada${apiConfigurations.length !== 1 ? 's' : ''}`
                  : 'No hay APIs configuradas'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {apiConfigurations.length === 0 ? (
            <div className="text-center py-8 bg-slate-700/30 rounded-lg">
              <p className="text-slate-400 mb-2">No hay APIs de transcripción habilitadas</p>
              <p className="text-sm text-slate-500">Configura al menos una API en la sección de Configuración</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {apiConfigurations.map(config => (
                <div
                  key={config.id}
                  onClick={() => setSelectedApiConfigId(config.id)}
                  className={`p-6 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedApiConfigId === config.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold text-white capitalize">{config.provider}</h3>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Activa</span>
                  </div>
                  <p className="text-slate-400 text-sm mb-3">{config.model || 'Modelo por defecto'}</p>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-white">
                      ${config.costPerUnit.toFixed(2)}
                      <span className="text-sm font-normal text-slate-400">/unidad</span>
                    </p>
                    {config.rateLimit && (
                      <p className="text-xs text-slate-500">Límite: {config.rateLimit} req/min</p>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-600">
                    <p className="text-xs text-slate-500">Prioridad: {config.priority}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* --- Nueva Sección de Horario de Grabación --- */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center">
            <Clock className="h-6 w-6 mr-3 text-orange-400" />
            <div>
              <CardTitle className="text-lg text-white">Horario de Grabación</CardTitle>
              <CardDescription className="text-slate-400">
                Define el rango horario en el que se realizarán las grabaciones. Por defecto: 5 AM - 2 AM.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hora de Inicio */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Hora de Inicio</label>
              <Select 
                value={recordingStartHour.toString()} 
                onValueChange={(value) => setRecordingStartHour(parseInt(value))}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 text-white max-h-80">
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()} className="focus:bg-slate-600">
                      {i.toString().padStart(2, '0')}:00 {i < 12 ? 'AM' : 'PM'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">Comenzar grabaciones desde esta hora cada día</p>
            </div>

            {/* Hora de Fin */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Hora de Fin</label>
              <Select 
                value={recordingEndHour.toString()} 
                onValueChange={(value) => setRecordingEndHour(parseInt(value))}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 text-white max-h-80">
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()} className="focus:bg-slate-600">
                      {i.toString().padStart(2, '0')}:00 {i < 12 ? 'AM' : 'PM'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">Detener grabaciones a esta hora cada día</p>
            </div>
          </div>

          {/* Indicador de horas activas */}
          <div className="mt-4 p-4 bg-slate-700/30 rounded-lg">
            <p className="text-sm text-slate-300">
              <span className="font-semibold">Rango activo:</span>{' '}
              {recordingStartHour.toString().padStart(2, '0')}:00 - {recordingEndHour.toString().padStart(2, '0')}:00
              {recordingStartHour > recordingEndHour && (
                <span className="ml-2 text-yellow-400">(cruza medianoche)</span>
              )}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {recordingStartHour > recordingEndHour 
                ? `Grabará desde las ${recordingStartHour}:00 hasta las ${recordingEndHour}:00 del día siguiente`
                : `Grabará ${recordingEndHour - recordingStartHour} horas diarias`
              }
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* --- Nueva Sección de Programación por Días --- */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center">
            <CalendarDays className="h-6 w-6 mr-3 text-cyan-400" />
            <div>
              <CardTitle className="text-lg text-white">Programación del Monitoreo (Opcional)</CardTitle>
              <CardDescription className="text-slate-400">
                Selecciona días específicos para el monitoreo. Si no seleccionas ninguno, se monitoreará todos los días.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ToggleGroup
            type="multiple"
            variant="outline"
            value={scheduleDays}
            onValueChange={(value) => setScheduleDays(value)}
            className="grid grid-cols-4 sm:grid-cols-7 gap-2"
          >
            <ToggleGroupItem value="monday" aria-label="Lunes" className="data-[state=on]:bg-blue-500/20 data-[state=on]:text-white border-slate-600 hover:bg-slate-700 bg-slate-600">Lun</ToggleGroupItem>
            <ToggleGroupItem value="tuesday" aria-label="Martes" className="data-[state=on]:bg-blue-500/20 data-[state=on]:text-white border-slate-600 hover:bg-slate-700 bg-slate-600">Mar</ToggleGroupItem>
            <ToggleGroupItem value="wednesday" aria-label="Miércoles" className="data-[state=on]:bg-blue-500/20 data-[state=on]:text-white border-slate-600 hover:bg-slate-700 bg-slate-600">Mié</ToggleGroupItem>
            <ToggleGroupItem value="thursday" aria-label="Jueves" className="data-[state=on]:bg-blue-500/20 data-[state=on]:text-white border-slate-600 hover:bg-slate-700 bg-slate-600">Jue</ToggleGroupItem>
            <ToggleGroupItem value="friday" aria-label="Viernes" className="data-[state=on]:bg-blue-500/20 data-[state=on]:text-white border-slate-600 hover:bg-slate-700 bg-slate-600">Vie</ToggleGroupItem>
            <ToggleGroupItem value="saturday" aria-label="Sábado" className="data-[state=on]:bg-blue-500/20 data-[state=on]:text-white border-slate-600 hover:bg-slate-700 bg-slate-600">Sáb</ToggleGroupItem>
            <ToggleGroupItem value="sunday" aria-label="Domingo" className="data-[state=on]:bg-blue-500/20 data-[state=on]:text-white border-slate-600 hover:bg-slate-700 bg-slate-600">Dom</ToggleGroupItem>
          </ToggleGroup>
        </CardContent>
      </Card>
      
      {/* --- Calculadora y Acciones --- */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center">
            <Calculator className="h-6 w-6 mr-3 text-yellow-400" />
            <div>
              <CardTitle className="text-lg text-white">Calculadora de Precio</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-slate-300">
              <p>Radios seleccionadas ({selectedRadioIds.size})</p>
              <p>${radioCost.toFixed(2)}</p>
            </div>
            <div className="flex justify-between text-slate-300">
              <p>
                API de Transcripción (
                {apiConfigurations.find(c => c.id === selectedApiConfigId)?.provider || 'Ninguna'}
                )
              </p>
              <p>${aiCost.toFixed(2)}</p>
            </div>
            <Separator className="bg-slate-700 my-4" />
            <div className="flex justify-between items-center text-xl font-bold text-white">
              <p>Precio mensual estimado</p>
              <p className="text-2xl text-emerald-400">${totalCost.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4 pt-4">
        <Button variant="outline" onClick={() => router.back()} className="border-slate-600 text-slate-300 hover:bg-slate-700">Cancelar</Button>
        <Button 
          onClick={handleValidateAndShowConfirm} 
          disabled={isSubmitting || selectedRadioIds.size === 0 || !selectedPhraseId || !selectedApiConfigId} 
          size="lg" 
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Iniciando...' : 'Revisar y Confirmar'}
        </Button>
      </div>

      {/* ✅ MODAL DE CONFIRMACIÓN */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Confirmar Inicio de Monitoreo</DialogTitle>
            <DialogDescription className="text-slate-400">
              Revisa la configuración antes de iniciar el monitoreo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            {/* Resumen de Radios */}
            <div className="bg-slate-700/30 p-4 rounded-lg">
              <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Waves className="h-5 w-5 text-blue-400" />
                Radios Seleccionadas
              </h4>
              <p className="text-slate-300">
                <span className="font-bold text-blue-400">{selectedRadioIds.size}</span> radio{selectedRadioIds.size !== 1 ? 's' : ''}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {Array.from(selectedRadioIds).map(id => {
                  const radio = radios.find(r => r.id === id);
                  return radio ? (
                    <span key={id} className="text-xs bg-slate-600 px-2 py-1 rounded">
                      {radio.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            {/* Resumen de Frase */}
            <div className="bg-slate-700/30 p-4 rounded-lg">
              <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                <TextSelect className="h-5 w-5 text-purple-400" />
                Frase a Detectar
              </h4>
              <p className="text-slate-300">
                {phrases.find(p => p.id === selectedPhraseId)?.phrase || 'No seleccionada'}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Marca: {phrases.find(p => p.id === selectedPhraseId)?.marca}
              </p>
            </div>

            {/* Resumen de API */}
            <div className="bg-slate-700/30 p-4 rounded-lg">
              <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Bot className="h-5 w-5 text-emerald-400" />
                API de Transcripción
              </h4>
              {(() => {
                const selectedConfig = apiConfigurations.find(c => c.id === selectedApiConfigId);
                return selectedConfig ? (
                  <>
                    <p className="text-slate-300 capitalize">
                      {selectedConfig.provider} - {selectedConfig.model || 'Modelo por defecto'}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      ${selectedConfig.costPerUnit}/unidad
                      {selectedConfig.rateLimit && ` • Límite: ${selectedConfig.rateLimit} req/min`}
                    </p>
                  </>
                ) : (
                  <p className="text-slate-400">No seleccionada</p>
                );
              })()}
            </div>

            {/* Resumen de Horario */}
            <div className="bg-slate-700/30 p-4 rounded-lg">
              <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-400" />
                Horario de Grabación
              </h4>
              <p className="text-slate-300">
                {recordingStartHour.toString().padStart(2, '0')}:00 - {recordingEndHour.toString().padStart(2, '0')}:00
                {recordingStartHour > recordingEndHour && (
                  <span className="ml-2 text-yellow-400">(cruza medianoche)</span>
                )}
              </p>
            </div>

            {/* Resumen de Programación */}
            {scheduleDays.length > 0 && (
              <div className="bg-slate-700/30 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-cyan-400" />
                  Días Programados
                </h4>
                <p className="text-slate-300">
                  {scheduleDays.length} día{scheduleDays.length !== 1 ? 's' : ''} seleccionado{scheduleDays.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* Costo Total */}
            <div className="bg-emerald-900/20 border-2 border-emerald-500/30 p-4 rounded-lg">
              <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-yellow-400" />
                Costo Mensual Estimado
              </h4>
              <p className="text-3xl font-bold text-emerald-400">
                ${totalCost.toFixed(2)}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {selectedRadioIds.size} radio{selectedRadioIds.size !== 1 ? 's' : ''} (${radioCost}) + IA (${aiCost})
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Volver a Editar
            </Button>
            <Button
              onClick={handleStartMonitoring}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Iniciando...' : 'Confirmar e Iniciar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ MODAL DE DETALLES DE SESIÓN */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Activity className="h-6 w-6 text-blue-400" />
              Detalles de Sesión de Monitoreo
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Información detallada y estadísticas de la sesión activa
            </DialogDescription>
          </DialogHeader>
          
          {loadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-slate-300">
                <Activity className="h-5 w-5 animate-spin" />
                <span>Cargando detalles...</span>
              </div>
            </div>
          ) : selectedSession ? (
            <div className="space-y-6 my-4">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-700/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <RadioIcon className="h-5 w-5 text-blue-400" />
                    Radio
                  </h4>
                  <p className="text-lg text-slate-200 mb-1">
                    {selectedSession.radioName || selectedSession.radio?.name || 'Radio'}
                  </p>
                  <p className="text-sm text-slate-400">
                    ID: {selectedSession.radioId || selectedSession.radio?.id || 'N/A'}
                  </p>
                  {selectedSession.radio?.region && (
                    <p className="text-sm text-slate-400">
                      Región: {selectedSession.radio.region}
                    </p>
                  )}
                </div>
                
                <div className="bg-slate-700/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Timer className="h-5 w-5 text-emerald-400" />
                    Estado y Tiempo
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={selectedSession.status === 'PAUSED' ? "secondary" : "default"}
                        className={`${
                          selectedSession.status === 'PAUSED' 
                            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        } border`}
                      >
                        {selectedSession.status || 'ACTIVE'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-300">
                      Inicio: {new Date(selectedSession.startTime || selectedSession.startedAt || Date.now()).toLocaleString('es-CL')}
                    </p>
                    {selectedSession.endTime && (
                      <p className="text-sm text-slate-300">
                        Fin: {new Date(selectedSession.endTime).toLocaleString('es-CL')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Usuario y configuración */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-700/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <User className="h-5 w-5 text-purple-400" />
                    Usuario
                  </h4>
                  <p className="text-slate-200">
                    {selectedSession.userName || selectedSession.user?.name || 'Usuario desconocido'}
                  </p>
                  {selectedSession.user?.email && (
                    <p className="text-sm text-slate-400">
                      {selectedSession.user.email}
                    </p>
                  )}
                </div>
                
                <div className="bg-slate-700/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    Configuración
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-slate-300">
                      ID de Sesión: <span className="font-mono text-slate-200">{selectedSession.id || selectedSession.sessionId}</span>
                    </p>
                    {selectedSession.phraseId && (
                      <p className="text-slate-300">
                        Frase ID: <span className="font-mono text-slate-200">{selectedSession.phraseId}</span>
                      </p>
                    )}
                    {selectedSession.apiConfigId && (
                      <p className="text-slate-300">
                        API Config: <span className="font-mono text-slate-200">{selectedSession.apiConfigId}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Estadísticas si están disponibles */}
              {sessionDetails && (
                <div className="bg-slate-700/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-cyan-400" />
                    Estadísticas
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-emerald-400">
                        {sessionDetails.detections || 0}
                      </p>
                      <p className="text-xs text-slate-400">Detecciones</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-400">
                        {sessionDetails.recordings || 0}
                      </p>
                      <p className="text-xs text-slate-400">Grabaciones</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-400">
                        {sessionDetails.transcriptions || 0}
                      </p>
                      <p className="text-xs text-slate-400">Transcripciones</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-400">
                        {sessionDetails.duration || '0h'}
                      </p>
                      <p className="text-xs text-slate-400">Duración</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Información adicional */}
              {(selectedSession.phrase || selectedSession.description) && (
                <div className="bg-slate-700/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <TextSelect className="h-5 w-5 text-orange-400" />
                    Información Adicional
                  </h4>
                  {selectedSession.phrase && (
                    <div className="mb-3">
                      <p className="text-sm text-slate-400 mb-1">Frase monitoreada:</p>
                      <p className="text-slate-200 bg-slate-800/50 p-2 rounded font-mono text-sm">
                        "{selectedSession.phrase}"
                      </p>
                    </div>
                  )}
                  {selectedSession.description && (
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Descripción:</p>
                      <p className="text-slate-200">{selectedSession.description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400">No se pudo cargar la información de la sesión</p>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDetailsModal(false);
                setSelectedSession(null);
                setSessionDetails(null);
              }}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente de esqueleto de carga para mejorar la UX inicial
const LoadingSkeleton = () => (
  <div className="space-y-8">
    <div>
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-4 w-1/2 mt-2" />
    </div>
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-20" />)}
      </CardContent>
    </Card>
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
      <CardContent><Skeleton className="h-12 w-full" /></CardContent>
    </Card>
  </div>
);

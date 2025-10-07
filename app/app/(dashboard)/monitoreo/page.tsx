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
import { Waves, TextSelect, Bot, Calculator, CalendarDays, Search, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

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
  
  // ✅ NUEVOS ESTADOS PARA FILTROS
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  
  // ✅ ESTADO PARA MODAL DE CONFIRMACIÓN
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
          'lunes': 1, 'martes': 2, 'miercoles': 3, 'jueves': 4, 
          'viernes': 5, 'sabado': 6, 'domingo': 0
        };
        return dayMap[day.toLowerCase()] ?? parseInt(day);
      });

      const requestData = {
        userId: 'user123', // TODO: Obtener del contexto de autenticación
        radioIds: Array.from(selectedRadioIds),
        phraseId: selectedPhraseId,
        days: daysAsNumbers.length > 0 ? daysAsNumbers : [1, 2, 3, 4, 5, 6, 0], // Si no hay días, usar todos
        startTime: startTime,
        endTime: endTime,
        aiModel: selectedAiModel,
        description: `Monitoreo programado desde dashboard - ${new Date().toLocaleDateString()}`
      };

      console.log('📤 Enviando datos:', requestData);

      const response = await fetch("/api/monitoring/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
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

  return (
    <div className="space-y-8">
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

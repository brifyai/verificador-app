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
import { Waves, TextSelect, Bot, Calculator, CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// --- Interfaces para los datos que vienen de la API ---
interface Radio {
  id: string;
  name: string;
  region: string | null;
}

interface Phrase {
  id: string;
  phrase: string;
  marca: string;
}

type AiModelType = 'estandar' | 'premium' | 'empresarial';

// --- Constantes de configuración ---
const AI_MODELS = {
  estandar: { name: 'Estándar', description: 'Precisión básica', price: 10 },
  premium: { name: 'Premium', description: 'Alta precisión', price: 25 },
  empresarial: { name: 'Empresarial', description: 'Máxima precisión', price: 50 },
};
const PRICE_PER_RADIO = 0;

export default function ConfigurarAnalisisPage() {
  const router = useRouter();

  // --- Estados del componente ---
  const [radios, setRadios] = useState<Radio[]>([]);
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [selectedRadioIds, setSelectedRadioIds] = useState<Set<string>>(new Set());
  const [selectedPhraseId, setSelectedPhraseId] = useState<string>('');
  const [selectedAiModel, setSelectedAiModel] = useState<AiModelType>('estandar');
  const [scheduleDays, setScheduleDays] = useState<string[]>([]); // Estado para los días
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carga de datos inicial (radios y frases)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [radiosRes, phrasesRes] = await Promise.all([
          fetch("/api/radios"),
          fetch("/api/phrases"),
        ]);
        if (!radiosRes.ok || !phrasesRes.ok) throw new Error("Error al cargar datos iniciales");
        
        const radiosData = await radiosRes.json();
        const phrasesData = await phrasesRes.json();
        
        setRadios(radiosData.data || []);
        setPhrases(phrasesData.phrases || []);

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

  // Cálculo de costos
  const { radioCost, aiCost, totalCost } = useMemo(() => {
    const radioCost = selectedRadioIds.size * PRICE_PER_RADIO;
    const aiCost = AI_MODELS[selectedAiModel].price;
    return { radioCost, aiCost, totalCost: radioCost + aiCost };
  }, [selectedRadioIds.size, selectedAiModel]);

  // Función para enviar el formulario al hacer clic en "Iniciar Monitoreo"
  const handleStartMonitoring = async () => {
    if (selectedRadioIds.size === 0 || !selectedPhraseId) {
      toast.warning("Debes seleccionar al menos una radio y una frase.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          radioIds: Array.from(selectedRadioIds),
          configuration: {
            phraseId: selectedPhraseId,
            aiModel: selectedAiModel,
            // Se incluyen los días seleccionados
            scheduleDays: scheduleDays.length > 0 ? scheduleDays : undefined,
          },
        }),
      });

      if (!response.ok) throw new Error("La respuesta del servidor no fue exitosa.");
      
      toast.success("¡Monitoreo iniciado correctamente!");
      router.push("/dashboard/monitoreo");
    } catch (error) {
      toast.error("No se pudo iniciar el monitoreo. Inténtalo de nuevo.");
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

      {/* --- Selección de Radios --- */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center">
            <Waves className="h-6 w-6 mr-3 text-blue-400" />
            <div>
<<<<<<< HEAD
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-medium">
                  Radios Disponibles ({getFilteredRadios().length})
                </h4>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSelectAllRadios}
                    variant="outline"
                    size="sm"
                    className="text-gray-400 border-gray-400 hover:bg-gray-400/10"
                  >
                    Seleccionar Todas
                  </Button>
                  <Button
                    onClick={handleDeselectAllRadios}
                    variant="outline"
                    size="sm"
                    className="text-red-400 border-red-400 hover:bg-red-400/10"
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
                        onCheckedChange={(checked) => handleRadioSelection(radio.id, checked as boolean)}
                      />
                      <label 
                        htmlFor={`radio-${radio.id}`} 
                        className="flex-1 cursor-pointer text-sm text-white"
                      >
                        <div className="font-medium">{radio.name}</div>
                        <div className="text-xs text-slate-400">{radio.region} • {radio.city}</div>
                      </label>
                    </div>
                  ))}
=======
              <CardTitle className="text-lg text-white">Selecciona las Radios</CardTitle>
              <CardDescription className="text-slate-400">Radios Disponibles ({radios.length})</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end gap-2 mb-4">
            <Button size="sm" onClick={selectAllRadios} className="bg-green-600 hover:bg-green-700">Seleccionar Todas</Button>
            <Button size="sm" variant="destructive" onClick={deselectAllRadios}>Deseleccionar Todas</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {radios.map(radio => (
              <div
                key={radio.id}
                onClick={() => handleRadioToggle(radio.id)}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer flex items-center gap-3 ${
                  selectedRadioIds.has(radio.id)
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 hover:border-slate-500'
                }`}
              >
                <Checkbox checked={selectedRadioIds.has(radio.id)} className="pointer-events-none" />
                <div>
                  <p className="font-semibold text-white">{radio.name}</p>
                  <p className="text-sm text-slate-400">{radio.region || 'Región no especificada'}</p>
>>>>>>> origin/feature/mzurita
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* --- Selección de Frase --- */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
             <div className="flex items-center">
            <TextSelect className="h-6 w-6 mr-3 text-purple-400" />
            <div>
              <CardTitle className="text-lg text-white">Seleccionar Frase para Monitoreo</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* --- Modelo de IA --- */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
           <div className="flex items-center">
            <Bot className="h-6 w-6 mr-3 text-emerald-400" />
            <div>
              <CardTitle className="text-lg text-white">Modelo de IA</CardTitle>
               <CardDescription className="text-slate-400">Elige la precisión del análisis.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(AI_MODELS) as AiModelType[]).map(modelKey => (
            <div
              key={modelKey}
              onClick={() => setSelectedAiModel(modelKey)}
              className={`p-6 rounded-lg border-2 transition-all cursor-pointer ${
                selectedAiModel === modelKey
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-700 hover:border-slate-500'
              }`}
            >
              <h3 className="text-xl font-bold text-white">{AI_MODELS[modelKey].name}</h3>
              <p className="text-slate-400 mt-1">{AI_MODELS[modelKey].description}</p>
              <p className="text-2xl font-bold text-white mt-4">${AI_MODELS[modelKey].price}<span className="text-sm font-normal text-slate-400">/mes</span></p>
            </div>
          ))}
        </CardContent>
      </Card>
      
      {/* --- Nueva Sección de Programación --- */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center">
            <CalendarDays className="h-6 w-6 mr-3 text-cyan-400" />
            <div>
              <CardTitle className="text-lg text-white">Programación del Monitoreo (Opcional)</CardTitle>
              <CardDescription className="text-slate-400">
                Selecciona días específicos para el monitoreo. Si no seleccionas ninguno, se monitoreará 24/7.
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
            <ToggleGroupItem value="monday" aria-label="Lunes" className="data-[state=on]:bg-blue-500/20 data-[state=on]:text-white border-slate-600 hover:bg-slate-700">Lun</ToggleGroupItem>
            <ToggleGroupItem value="tuesday" aria-label="Martes" className="data-[state=on]:bg-blue-500/20 data-[state=on]:text-white border-slate-600 hover:bg-slate-700">Mar</ToggleGroupItem>
            <ToggleGroupItem value="wednesday" aria-label="Miércoles" className="data-[state=on]:bg-blue-500/20 data-[state=on]:text-white border-slate-600 hover:bg-slate-700">Mié</ToggleGroupItem>
            <ToggleGroupItem value="thursday" aria-label="Jueves" className="data-[state=on]:bg-blue-500/20 data-[state=on]:text-white border-slate-600 hover:bg-slate-700">Jue</ToggleGroupItem>
            <ToggleGroupItem value="friday" aria-label="Viernes" className="data-[state=on]:bg-blue-500/20 data-[state=on]:text-white border-slate-600 hover:bg-slate-700">Vie</ToggleGroupItem>
            <ToggleGroupItem value="saturday" aria-label="Sábado" className="data-[state=on]:bg-blue-500/20 data-[state=on]:text-white border-slate-600 hover:bg-slate-700">Sáb</ToggleGroupItem>
            <ToggleGroupItem value="sunday" aria-label="Domingo" className="data-[state=on]:bg-blue-500/20 data-[state=on]:text-white border-slate-600 hover:bg-slate-700">Dom</ToggleGroupItem>
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
              <p>Modelo de IA ({AI_MODELS[selectedAiModel].name})</p>
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

<<<<<<< HEAD
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sesiones Activas */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2 text-gray-500">
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
              <CardTitle className="text-sm text-gray-500">Herramientas del Sistema</CardTitle>
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
                <Zap className="h-4 w-4 text-gray-500" />
                <span className="text-gray-500">Detecciones Recientes</span>
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
=======
      <div className="flex justify-end gap-4 pt-4">
        <Button variant="outline" onClick={() => router.back()} className="border-slate-600 text-slate-300 hover:bg-slate-700">Cancelar</Button>
        <Button onClick={handleStartMonitoring} disabled={isSubmitting} size="lg" className="bg-blue-600 hover:bg-blue-700">
          {isSubmitting ? 'Iniciando...' : 'Iniciar Monitoreo'}
        </Button>
>>>>>>> origin/feature/mzurita
      </div>
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
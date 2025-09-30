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

      <div className="flex justify-end gap-4 pt-4">
        <Button variant="outline" onClick={() => router.back()} className="border-slate-600 text-slate-300 hover:bg-slate-700">Cancelar</Button>
        <Button onClick={handleStartMonitoring} disabled={isSubmitting} size="lg" className="bg-blue-600 hover:bg-blue-700">
          {isSubmitting ? 'Iniciando...' : 'Iniciar Monitoreo'}
        </Button>
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
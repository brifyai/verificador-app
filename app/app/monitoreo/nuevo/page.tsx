"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Check, Radio as RadioIcon } from "lucide-react";

// Tipos
interface Radio {
  id: string;
  name: string;
  location: string;
}

interface Phrase {
  id: string;
  phrase: string;
  brand: string;
  campaign?: string;
}

interface AIModel {
  id: string;
  name: string;
  description: string;
  priceMultiplier: number;
}

// Modelos de IA disponibles
const AI_MODELS: AIModel[] = [
  {
    id: "estandar",
    name: "Estándar",
    description: "Precisión básica",
    priceMultiplier: 1.0
  },
  {
    id: "premium",
    name: "Premium",
    description: "Alta precisión",
    priceMultiplier: 1.5
  },
  {
    id: "empresarial",
    name: "Empresarial",
    description: "Máxima precisión",
    priceMultiplier: 2.0
  }
];

// Precio base por radio (por mes)
const BASE_PRICE_PER_RADIO = 10;

export default function NuevoMonitoreoPage() {
  const router = useRouter();
  
  // Estados
  const [radios, setRadios] = useState<Radio[]>([]);
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [selectedRadioIds, setSelectedRadioIds] = useState<string[]>([]);
  const [selectedPhraseId, setSelectedPhraseId] = useState<string>("");
  const [selectedAiModel, setSelectedAiModel] = useState<string>("estandar");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Cálculo de precio
  const totalPrice = selectedRadioIds.length * BASE_PRICE_PER_RADIO * 
    AI_MODELS.find(model => model.id === selectedAiModel)?.priceMultiplier || 0;
  
  // Cargar datos al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar radios
        const radiosResponse = await fetch("/api/radios");
        if (!radiosResponse.ok) throw new Error("Error al cargar radios");
        const radiosData = await radiosResponse.json();
        setRadios(radiosData);
        
        // Cargar frases
        const phrasesResponse = await fetch("/api/phrases");
        if (!phrasesResponse.ok) throw new Error("Error al cargar frases");
        const phrasesData = await phrasesResponse.json();
        setPhrases(phrasesData);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos necesarios",
          variant: "destructive"
        });
      }
    };
    
    fetchData();
  }, []);
  
  // Manejar selección de radios
  const handleRadioToggle = (radioId: string) => {
    setSelectedRadioIds(prev => 
      prev.includes(radioId) 
        ? prev.filter(id => id !== radioId) 
        : [...prev, radioId]
    );
  };
  
  // Iniciar monitoreo
  const handleStartMonitoring = async () => {
    // Validaciones
    if (selectedRadioIds.length === 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar al menos una radio",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedPhraseId) {
      toast({
        title: "Error",
        description: "Debes seleccionar una frase para monitorear",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          radioIds: selectedRadioIds,
          configuration: {
            phraseId: selectedPhraseId,
            aiModel: selectedAiModel
          }
        })
      });
      
      if (!response.ok) {
        throw new Error("Error al crear las sesiones de monitoreo");
      }
      
      toast({
        title: "Éxito",
        description: "Monitoreo iniciado correctamente",
      });
      
      // Redirigir al dashboard o a la página de monitoreo
      router.push("/monitoreo");
    } catch (error) {
      console.error("Error al iniciar monitoreo:", error);
      toast({
        title: "Error",
        description: "No se pudo iniciar el monitoreo",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Nuevo Monitoreo</h1>
      
      {/* Selección de Radios */}
      <Card>
        <CardHeader>
          <CardTitle>Radios Disponibles ({radios.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {radios.map((radio) => (
              <div 
                key={radio.id} 
                className={`border rounded-lg p-4 flex items-center space-x-3 cursor-pointer ${
                  selectedRadioIds.includes(radio.id) ? "border-primary bg-primary/10" : "border-border"
                }`}
                onClick={() => handleRadioToggle(radio.id)}
              >
                <Checkbox 
                  checked={selectedRadioIds.includes(radio.id)}
                  onCheckedChange={() => handleRadioToggle(radio.id)}
                />
                <div>
                  <div className="font-medium">{radio.name}</div>
                  <div className="text-sm text-muted-foreground">{radio.location}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setSelectedRadioIds([])}
            >
              Deseleccionar Todos
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setSelectedRadioIds(radios.map(r => r.id))}
            >
              Seleccionar Todos
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Selección de Frase */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Frase para Monitoreo</CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={selectedPhraseId} 
            onValueChange={setSelectedPhraseId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar frase a monitorear..." />
            </SelectTrigger>
            <SelectContent>
              {phrases.map((phrase) => (
                <SelectItem key={phrase.id} value={phrase.id}>
                  <div>
                    <div>{phrase.phrase}</div>
                    <div className="text-sm text-muted-foreground">
                      {phrase.brand} {phrase.campaign && `- ${phrase.campaign}`}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      
      {/* Modelo de IA */}
      <Card>
        <CardHeader>
          <CardTitle>Modelo de IA</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={selectedAiModel} 
            onValueChange={setSelectedAiModel}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {AI_MODELS.map((model) => (
              <div 
                key={model.id}
                className={`border rounded-lg p-4 cursor-pointer ${
                  selectedAiModel === model.id ? "border-primary bg-primary/10" : "border-border"
                }`}
              >
                <RadioGroupItem 
                  value={model.id} 
                  id={model.id} 
                  className="sr-only" 
                />
                <Label 
                  htmlFor={model.id} 
                  className="flex flex-col h-full cursor-pointer"
                >
                  <span className="font-medium text-lg">{model.name}</span>
                  <span className="text-sm text-muted-foreground">{model.description}</span>
                  <span className="mt-2 text-sm">
                    Multiplicador: x{model.priceMultiplier}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
      
      {/* Calculadora de Precio */}
      <Card>
        <CardHeader>
          <CardTitle>Calculadora de Precio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Radios seleccionadas ({selectedRadioIds.length})</span>
              <span>${selectedRadioIds.length * BASE_PRICE_PER_RADIO}</span>
            </div>
            <div className="flex justify-between">
              <span>Modelo de IA ({AI_MODELS.find(m => m.id === selectedAiModel)?.name})</span>
              <span>x{AI_MODELS.find(m => m.id === selectedAiModel)?.priceMultiplier}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold">
              <span>Precio mensual estimado</span>
              <span className="text-green-600">${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Botones de Acción */}
      <div className="flex justify-end space-x-4">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleStartMonitoring}
          disabled={isLoading || selectedRadioIds.length === 0 || !selectedPhraseId}
        >
          {isLoading ? "Iniciando..." : "Iniciar Monitoreo"}
        </Button>
      </div>
    </div>
  );
}
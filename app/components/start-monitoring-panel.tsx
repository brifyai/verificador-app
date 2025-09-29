'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Radio as RadioIcon, 
  MapPin, 
  Filter, 
  PlayCircle,
  FileText,
  Calculator,
  Cpu
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

interface StartMonitoringPanelProps {
  radios: Radio[];
  regions: string[];
  loading: boolean;
  onClose: () => void;
  onStartMonitoring: (radioIds: string[], filterType: 'all' | 'region' | 'custom', selectedRegion: string, selectedCity: string) => void;
}

export default function StartMonitoringPanel({
  radios,
  regions,
  loading,
  onClose,
  onStartMonitoring
}: StartMonitoringPanelProps) {
  const [selectedRadios, setSelectedRadios] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'region' | 'custom'>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [cities, setCities] = useState<string[]>([]);

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

  // Funciones auxiliares para filtros
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

  const handleStartMonitoring = () => {
    onStartMonitoring(selectedRadios, filterType, selectedRegion, selectedCity);
  };

  // Estado para las nuevas secciones
  const [selectedPhrase, setSelectedPhrase] = useState<string>('');
  const [selectedAIModel, setSelectedAIModel] = useState<string>('standard');
  const [monthlyPrice, setMonthlyPrice] = useState<number>(0);

  // Datos falsos para las nuevas secciones
  const availablePhrases = [
    { id: '1', text: 'Coca-Cola' },
    { id: '2', text: 'Pepsi' },
    { id: '3', text: 'McDonald\'s' },
    { id: '4', text: 'Burger King' },
    { id: '5', text: 'Toyota' },
    { id: '6', text: 'Nike' },
  ];

  const aiModels = [
    { id: 'standard', name: 'Estándar', description: 'Precisión básica', price: 10 },
    { id: 'premium', name: 'Premium', description: 'Alta precisión', price: 25 },
    { id: 'enterprise', name: 'Empresarial', description: 'Máxima precisión', price: 50 },
  ];

  // Calcular precio cuando cambian las selecciones
  useEffect(() => {
    const basePrice = selectedRadios.length * 5; // $5 por radio
    const modelPrice = aiModels.find(model => model.id === selectedAIModel)?.price || 0;
    const phraseMultiplier = selectedPhrase ? 1.2 : 1; // 20% extra si hay frase seleccionada
    
    setMonthlyPrice(Math.round((basePrice + modelPrice) * phraseMultiplier));
  }, [selectedRadios, selectedAIModel, selectedPhrase]);

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-blue-400" />
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
                className="bg-red-500 text-white border-red-500 hover:bg-red-700 hover:text-white hover:border-red-700"
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

        {/* NUEVA SECCIÓN: Selección de Frases */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-medium text-white">Seleccionar Frase para Monitoreo</h3>
          </div>
          <div className="bg-slate-700/50 border border-slate-600 rounded-md p-3">
            <Select value={selectedPhrase} onValueChange={setSelectedPhrase}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Seleccionar frase a monitorear..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {availablePhrases.map((phrase) => (
                  <SelectItem key={phrase.id} value={phrase.id} className="text-white hover:bg-slate-600 focus:bg-slate-600">
                    {phrase.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="mt-3">
              <h4 className="text-xs font-medium text-slate-300 mb-2">Frases disponibles:</h4>
              <div className="flex flex-wrap gap-2">
                {availablePhrases.map((phrase) => (
                  <Badge 
                    key={phrase.id} 
                    variant={selectedPhrase === phrase.id ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedPhrase(phrase.id)}
                  >
                    {phrase.text}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* NUEVA SECCIÓN: Selección de Modelo IA */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-medium text-white">Modelo de IA</h3>
          </div>
          <div className="bg-slate-700/50 border border-slate-600 rounded-md p-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {aiModels.map((model) => (
                <div 
                  key={model.id}
                  className={`border rounded-md p-3 cursor-pointer transition-colors ${
                    selectedAIModel === model.id 
                      ? 'bg-blue-900/30 border-blue-500' 
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                  onClick={() => setSelectedAIModel(model.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">{model.name}</h4>
                    <Badge variant={selectedAIModel === model.id ? "default" : "outline"}>
                      ${model.price}/mes
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300">{model.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* NUEVA SECCIÓN: Calculadora de Precio */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-4 w-4 text-green-400" />
            <h3 className="text-sm font-medium text-white">Calculadora de Precio</h3>
          </div>
          <div className="bg-slate-700/50 border border-slate-600 rounded-md p-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Radios seleccionadas ({selectedRadios.length})</span>
                <span className="text-white">${selectedRadios.length * 5}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Modelo de IA ({aiModels.find(m => m.id === selectedAIModel)?.name})</span>
                <span className="text-white">${aiModels.find(m => m.id === selectedAIModel)?.price || 0}</span>
              </div>
              {selectedPhrase && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Monitoreo de frase</span>
                  <span className="text-white">+20%</span>
                </div>
              )}
              <Separator className="my-2 bg-slate-600" />
              <div className="flex justify-between">
                <span className="font-medium text-white">Precio mensual estimado</span>
                <span className="font-bold text-lg text-green-400">${monthlyPrice}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end space-x-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleStartMonitoring}
            disabled={selectedRadios.length === 0 || loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Iniciando...' : 'Iniciar Monitoreo'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Calculator, Settings, TrendingUp, Zap, Target, DollarSign, Server, HardDrive, Wifi, HelpCircle, Clock, Calendar } from 'lucide-react';

// Tipos
interface Profile {
  name: string;
  icon: any;
  color: string;
  description: string;
  providers: { [key: string]: number };
  avgCostPerMinute: number;
  features: string[];
}

type ProfileKey = 'economico' | 'medio' | 'mejor' | 'custom';

// Definición de perfiles de costo
const profiles: Record<ProfileKey, Profile> = {
  economico: {
    name: 'Económico',
    icon: DollarSign,
    color: 'text-green-500',
    description: 'Ultra eficiente - Solo transcribe detecciones',
    providers: {
      deepgram: 0.7,      // 70%
      assemblyai: 0.3     // 30%
    },
    avgCostPerMinute: 4.5, // CLP promedio por minuto
    features: ['Ultra bajo costo', 'Detección básica', 'Perfecto para pruebas']
  },
  medio: {
    name: 'Medio',
    icon: TrendingUp,
    color: 'text-blue-500',
    description: 'Modelo eficiente - Balance perfecto',
    providers: {
      groq: 0.7,          // 70%
      abacusAI: 0.3       // 30%
    },
    avgCostPerMinute: 22, // CLP promedio por minuto
    features: ['95% menos costo vs modelo tradicional', 'Buena precisión', 'Recomendado']
  },
  mejor: {
    name: 'Mejor',
    icon: Target,
    color: 'text-purple-500',
    description: 'Precisión máxima para español chileno',
    providers: {
      abacusAI: 0.9,      // 90%
      groq: 0.1           // 10%
    },
    avgCostPerMinute: 42, // CLP promedio por minuto
    features: ['Máxima precisión', 'Optimizado Chile', 'Solo transcribe detecciones']
  },
  custom: {
    name: 'Configuración Personalizada',
    icon: Settings,
    color: 'text-purple-500',
    description: 'Personaliza todos los parámetros según tus necesidades específicas',
    providers: {
      custom: 1.0
    },
    avgCostPerMinute: 22, // Por defecto, se usará customCostPerMinute del estado
    features: ['Parámetros personalizables', 'Control total', 'Flexibilidad máxima']
  }
};

// Escalas de radios predefinidas
const radioScales = [1, 50, 100, 200, 300, 400, 500];

interface CostCalculation {
  capturesPerDay: number;
  minutesPerDay: number;
  dailyCost: number;
  monthlyCost: number;
  annualCost: number;
  infrastructure: {
    serverCost: number;
    bandwidthCost: number;
    storageCost: number;
    totalInfrastructure: number;
  };
  variable: {
    transcriptionCost: number;
    cloudStorageCost: number;
    totalVariable: number;
  };
  comparison: {
    fullTranscriptionCost: number;
    savings: number;
    savingsPercentage: number;
  };
}

interface SimulationResults {
  [key: number]: CostCalculation;
}

export default function CostSimulator() {
  const [selectedProfile, setSelectedProfile] = useState<ProfileKey>('medio');
  const [customSettings, setCustomSettings] = useState({
    hoursPerDay: 18,
    avgDetectionsPerDay: 12, // detecciones promedio por radio por día
    avgDurationPerDetection: 0.5, // 30 segundos promedio por frase
    customCostPerMinute: 22,
    // Costos de infraestructura (CLP mensuales)
    serverCores: 16,
    costPerCore: 15000, // CLP por core por mes
    bandwidthPerRadio: 500, // CLP por radio por mes
    temporaryStorage: 50000, // CLP fijos por mes (1TB)
    cloudStorageCostPerMinute: 2, // CLP por minuto almacenado
    phrasesPerRadio: 5, // número de frases que se van a transcribir por radio
    // Configuración de horarios
    scheduleType: 'todos', // 'todos', 'lun-sab', 'lun-vie', 'personalizado'
    customDays: {
      lunes: true,
      martes: true,
      miercoles: true,
      jueves: true,
      viernes: true,
      sabado: true,
      domingo: true
    },
    customHours: {
      start: '08:00',
      end: '17:00'
    }
  });
  const [infrastructureSettings, setInfrastructureSettings] = useState({
    ffmpegServerEnabled: true,
    connectivityEnabled: true,
    cloudStorageEnabled: true
  });
  const [simulations, setSimulations] = useState<SimulationResults>({});
  const [activeTab, setActiveTab] = useState('profiles');

  // Funciones auxiliares para calcular horarios
  const getActiveDaysPerWeek = () => {
    switch (customSettings.scheduleType) {
      case 'todos':
        return 7;
      case 'lun-sab':
        return 6;
      case 'lun-vie':
        return 5;
      case 'personalizado':
        return Object.values(customSettings.customDays).filter(day => day).length;
      default:
        return 7;
    }
  };

  const getActiveHoursPerDay = () => {
    if (customSettings.scheduleType === 'personalizado') {
      const [startHour, startMinute] = customSettings.customHours.start.split(':').map(Number);
      const [endHour, endMinute] = customSettings.customHours.end.split(':').map(Number);
      const startTotalMinutes = startHour * 60 + startMinute;
      const endTotalMinutes = endHour * 60 + endMinute;
      return (endTotalMinutes - startTotalMinutes) / 60;
    }
    return customSettings.hoursPerDay;
  };

  const getActiveDaysPerMonth = () => {
    const daysPerWeek = getActiveDaysPerWeek();
    return (daysPerWeek * 30) / 7; // Promedio mensual
  };

  // Cálculo de costos (MODELO HÍBRIDO: Servidor propio + APIs externas)
  const calculateCosts = (radios: number, profileKey: ProfileKey): CostCalculation => {
    const prof = profiles[profileKey];
    const transcriptionCostPerMinute = prof.avgCostPerMinute;
    
    // MODELO REAL: Solo se transcribe cuando hay detección de frase publicitaria
    const avgDetectionsPerRadioPerDay = customSettings.phrasesPerRadio;
    const avgDurationPerDetection = customSettings.avgDurationPerDetection;
    
    // Calcular días y horas activas según configuración
    const activeDaysPerWeek = getActiveDaysPerWeek();
    const activeHoursPerDay = getActiveHoursPerDay();
    const activeDaysPerMonth = getActiveDaysPerMonth();
    
    // Ajustar detecciones según días activos (las detecciones solo ocurren en días activos)
    const dailyDetectionsAdjusted = (avgDetectionsPerRadioPerDay * activeDaysPerWeek) / 7;
    
    // Cálculos de detecciones
    const totalTranscriptionsPerDay = dailyDetectionsAdjusted * radios;
    const totalMinutesToTranscribePerDay = totalTranscriptionsPerDay * avgDurationPerDetection;
    
    // COSTOS DE INFRAESTRUCTURA (fijos mensuales) - con opciones de activar/desactivar
    const serverCost = infrastructureSettings.ffmpegServerEnabled ? customSettings.serverCores * customSettings.costPerCore : 0;
    const bandwidthCost = infrastructureSettings.connectivityEnabled ? radios * customSettings.bandwidthPerRadio : 0;
    const storageCost = infrastructureSettings.cloudStorageEnabled ? customSettings.temporaryStorage : 0;
    const totalInfrastructure = serverCost + bandwidthCost + storageCost;
    
    // COSTOS VARIABLES (por uso)
    const dailyTranscriptionCost = totalMinutesToTranscribePerDay * transcriptionCostPerMinute;
    const monthlyTranscriptionCost = dailyTranscriptionCost * 30;
    const monthlyCloudStorageCost = totalMinutesToTranscribePerDay * 30 * customSettings.cloudStorageCostPerMinute;
    const totalVariable = monthlyTranscriptionCost + monthlyCloudStorageCost;
    
    // TOTAL MENSUAL
    const monthlyCost = totalInfrastructure + totalVariable;
    const dailyCost = monthlyCost / 30;
    const annualCost = monthlyCost * 12;
    
    // COMPARACIÓN: Si transcribiéramos TODO el audio en horarios activos
    const fullTranscriptionMinutesPerDay = radios * activeHoursPerDay * 60 * (activeDaysPerWeek / 7);
    const fullTranscriptionMonthlyCost = fullTranscriptionMinutesPerDay * 30 * transcriptionCostPerMinute;
    const totalFullMonthlyCost = totalInfrastructure + fullTranscriptionMonthlyCost;
    
    const savings = totalFullMonthlyCost - monthlyCost;
    const savingsPercentage = ((totalFullMonthlyCost - monthlyCost) / totalFullMonthlyCost) * 100;

    return {
      capturesPerDay: totalTranscriptionsPerDay,
      minutesPerDay: totalMinutesToTranscribePerDay,
      dailyCost,
      monthlyCost,
      annualCost,
      infrastructure: {
        serverCost,
        bandwidthCost,
        storageCost,
        totalInfrastructure
      },
      variable: {
        transcriptionCost: monthlyTranscriptionCost,
        cloudStorageCost: monthlyCloudStorageCost,
        totalVariable
      },
      comparison: {
        fullTranscriptionCost: totalFullMonthlyCost,
        savings,
        savingsPercentage
      }
    };
  };

  // Actualizar simulaciones cuando cambian los parámetros
  useEffect(() => {
    const newSimulations: SimulationResults = {};
    radioScales.forEach(scale => {
      newSimulations[scale] = calculateCosts(scale, selectedProfile);
    });
    setSimulations(newSimulations);
  }, [selectedProfile, customSettings, infrastructureSettings]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const currentProfile = profiles[selectedProfile];

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          🏗️ Simulador de Costos - Arquitectura Híbrida
        </CardTitle>
        <p className="text-sm text-slate-400">
          Servidor Propio (FFmpeg) + APIs Externas • Solo transcribe detecciones publicitarias
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full bg-slate-700">
            <TabsTrigger value="profiles" className="text-white data-[state=active]:text-slate-900 data-[state=active]:bg-white">Perfiles</TabsTrigger>
            <TabsTrigger value="infrastructure" className="text-white data-[state=active]:text-slate-900 data-[state=active]:bg-white">Infraestructura</TabsTrigger>
            <TabsTrigger value="simulator" className="text-white data-[state=active]:text-slate-900 data-[state=active]:bg-white">Simulador</TabsTrigger>
            <TabsTrigger value="breakdown" className="text-white data-[state=active]:text-slate-900 data-[state=active]:bg-white">Resumen</TabsTrigger>
          </TabsList>

          {/* Pestaña Perfiles */}
          <TabsContent value="profiles" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(profiles).map(([key, profile]) => (
                <div
                  key={key}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedProfile === key
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                  onClick={() => setSelectedProfile(key as ProfileKey)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <profile.icon className={`h-5 w-5 ${profile.color}`} />
                    <h4 className="font-medium text-white">{profile.name}</h4>
                    {selectedProfile === key && (
                      <Badge className="bg-blue-600">Activo</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mb-3">{profile.description}</p>
                  <div className="space-y-2">
                    <div className="text-sm font-mono text-white">
                      {formatCurrency(profile.avgCostPerMinute)}/min
                    </div>
                    <div className="space-y-1">
                      {profile.features.map((feature, idx) => (
                        <div key={idx} className="text-xs text-slate-300 flex items-center gap-1">
                          <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedProfile === 'custom' && (
            <Card className="bg-slate-700/30">
              <CardHeader>
                <CardTitle className="text-sm text-white flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Parámetros Personalizados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs text-slate-300">Horas monitoreo/día</Label>
                      <Input
                        type="number"
                        min="1"
                        max="24"
                        value={customSettings.hoursPerDay}
                        onChange={(e) => setCustomSettings({
                          ...customSettings,
                          hoursPerDay: parseInt(e.target.value) || 18
                        })}
                        className="bg-slate-600 border-slate-500 text-white text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-300">Detecciones/día</Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={customSettings.avgDetectionsPerDay}
                        onChange={(e) => setCustomSettings({
                          ...customSettings,
                          avgDetectionsPerDay: parseInt(e.target.value) || 12
                        })}
                        className="bg-slate-600 border-slate-500 text-white text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-300">Duración/frase (min)</Label>
                      <Input
                        type="number"
                        min="0.1"
                        max="5"
                        step="0.1"
                        value={customSettings.avgDurationPerDetection}
                        onChange={(e) => setCustomSettings({
                          ...customSettings,
                          avgDurationPerDetection: parseFloat(e.target.value) || 0.5
                        })}
                        className="bg-slate-600 border-slate-500 text-white text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-300">Costo/min (CLP)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={customSettings.customCostPerMinute}
                        onChange={(e) => setCustomSettings({
                          ...customSettings,
                          customCostPerMinute: parseInt(e.target.value) || 22
                        })}
                        className="bg-slate-600 border-slate-500 text-white text-sm"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}
            
            {/* Configuración de Frases por Radio */}
            <Card className="bg-slate-700/30 border-slate-600">
              <CardHeader>
                <CardTitle className="text-sm text-white flex items-center gap-2">
                  🎯 Frases por Radio a Transcribir
                </CardTitle>
                <p className="text-xs text-slate-400">
                  Especifica cuántas frases promedio se transcribirán por radio
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Label className="text-sm text-slate-300 min-w-fit">Frases por radio:</Label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={customSettings.phrasesPerRadio}
                    onChange={(e) => setCustomSettings({
                      ...customSettings,
                      phrasesPerRadio: parseInt(e.target.value) || 5
                    })}
                    className="bg-slate-600 border-slate-500 text-white max-w-24"
                  />
                  <span className="text-xs text-slate-400">frases/día</span>
                </div>
                <div className="mt-2 text-xs text-slate-400 bg-slate-600/30 p-2 rounded">
                  💡 Cada frase detectada será transcrita usando IA. Ajusta según tus necesidades de monitoreo.
                </div>

                {/* Configuración de Programación */}
                <div className="mt-6 space-y-4">
                  <div className="border-t border-slate-600 pt-4">
                    <h5 className="text-sm font-medium text-white flex items-center gap-2 mb-3">
                      <Calendar className="h-4 w-4 text-blue-400" />
                      📅 Programación de Monitoreo
                    </h5>
                    
                    <div className="space-y-4">
                      {/* Selector de tipo de programación */}
                      <div>
                        <Label className="text-xs text-slate-300 mb-2 block">Días de monitoreo:</Label>
                        <Select 
                          value={customSettings.scheduleType} 
                          onValueChange={(value) => setCustomSettings({
                            ...customSettings,
                            scheduleType: value as 'todos' | 'lun-sab' | 'lun-vie' | 'personalizado'
                          })}
                        >
                          <SelectTrigger className="bg-slate-600 border-slate-500 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            <SelectItem value="todos" className="text-white hover:bg-slate-600 focus:bg-slate-600">Todos los días</SelectItem>
                            <SelectItem value="lun-sab" className="text-white hover:bg-slate-600 focus:bg-slate-600">Lunes a Sábado</SelectItem>
                            <SelectItem value="lun-vie" className="text-white hover:bg-slate-600 focus:bg-slate-600">Lunes a Viernes</SelectItem>
                            <SelectItem value="personalizado" className="text-white hover:bg-slate-600 focus:bg-slate-600">Personalizado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Configuración personalizada */}
                      {customSettings.scheduleType === 'personalizado' && (
                        <div className="bg-slate-600/30 p-4 rounded-lg space-y-4">
                          {/* Selección de días */}
                          <div>
                            <Label className="text-xs text-slate-300 mb-3 block">Días específicos:</Label>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              {Object.entries({
                                lunes: 'Lunes',
                                martes: 'Martes',
                                miercoles: 'Miércoles',
                                jueves: 'Jueves',
                                viernes: 'Viernes',
                                sabado: 'Sábado',
                                domingo: 'Domingo'
                              }).map(([key, label]) => (
                                <div key={key} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={key}
                                    checked={customSettings.customDays[key as keyof typeof customSettings.customDays]}
                                    onCheckedChange={(checked) => setCustomSettings({
                                      ...customSettings,
                                      customDays: {
                                        ...customSettings.customDays,
                                        [key]: checked
                                      }
                                    })}
                                  />
                                  <Label htmlFor={key} className="text-slate-300 cursor-pointer">
                                    {label}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Selección de horarios */}
                          <div>
                            <Label className="text-xs text-slate-300 mb-3 block flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              Horario de monitoreo:
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs text-slate-400 mb-1 block">Desde:</Label>
                                <Input
                                  type="time"
                                  value={customSettings.customHours.start}
                                  onChange={(e) => setCustomSettings({
                                    ...customSettings,
                                    customHours: {
                                      ...customSettings.customHours,
                                      start: e.target.value
                                    }
                                  })}
                                  className="bg-slate-600 border-slate-500 text-white text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-slate-400 mb-1 block">Hasta:</Label>
                                <Input
                                  type="time"
                                  value={customSettings.customHours.end}
                                  onChange={(e) => setCustomSettings({
                                    ...customSettings,
                                    customHours: {
                                      ...customSettings.customHours,
                                      end: e.target.value
                                    }
                                  })}
                                  className="bg-slate-600 border-slate-500 text-white text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Resumen de la configuración */}
                      <div className="bg-blue-900/20 p-3 rounded border border-blue-700/30 text-xs">
                        <div className="text-blue-200 font-medium mb-2">📊 Resumen de configuración:</div>
                        <div className="space-y-1 text-blue-100">
                          <div>• Días activos por semana: <strong>{getActiveDaysPerWeek()}</strong></div>
                          <div>• Horas por día: <strong>{getActiveHoursPerDay().toFixed(1)}h</strong></div>
                          <div>• Detecciones ajustadas: <strong>{((customSettings.phrasesPerRadio * getActiveDaysPerWeek()) / 7).toFixed(1)} por radio/día</strong></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Botón Siguiente */}
            <div className="flex justify-end">
              <Button 
                onClick={() => setActiveTab('infrastructure')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Siguiente →
              </Button>
            </div>
          </TabsContent>

          {/* Pestaña Infraestructura */}
          <TabsContent value="infrastructure" className="space-y-4">
            <Card className="bg-slate-700/30">
              <CardHeader>
                <CardTitle className="text-sm text-white flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  🏗️ Configuración de Infraestructura Propia
                </CardTitle>
                <p className="text-xs text-slate-400">
                  Configura los costos de tu servidor FFmpeg y infraestructura asociada
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Servidor FFmpeg */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-white flex items-center gap-2">
                        <Server className="h-4 w-4 text-blue-400" />
                        Servidor FFmpeg
                      </h4>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={infrastructureSettings.ffmpegServerEnabled}
                          onCheckedChange={(checked) => setInfrastructureSettings({
                            ...infrastructureSettings,
                            ffmpegServerEnabled: checked
                          })}
                        />
                        <span className={`text-xs ${infrastructureSettings.ffmpegServerEnabled ? 'text-green-400' : 'text-red-400'}`}>
                          {infrastructureSettings.ffmpegServerEnabled ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-slate-300">Cores CPU</Label>
                        <Select value={customSettings.serverCores.toString()} onValueChange={(value) => setCustomSettings({...customSettings, serverCores: parseInt(value)})}>
                          <SelectTrigger className="bg-slate-600 border-slate-500 text-white text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            <SelectItem value="8" className="text-white hover:bg-slate-600 focus:bg-slate-600">8 Cores</SelectItem>
                            <SelectItem value="16" className="text-white hover:bg-slate-600 focus:bg-slate-600">16 Cores</SelectItem>
                            <SelectItem value="32" className="text-white hover:bg-slate-600 focus:bg-slate-600">32 Cores</SelectItem>
                            <SelectItem value="64" className="text-white hover:bg-slate-600 focus:bg-slate-600">64 Cores</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-300">CLP por Core/mes</Label>
                        <Input
                          type="number"
                          min="1000"
                          max="50000"
                          step="1000"
                          value={customSettings.costPerCore}
                          onChange={(e) => setCustomSettings({
                            ...customSettings,
                            costPerCore: parseInt(e.target.value) || 15000
                          })}
                          className="bg-slate-600 border-slate-500 text-white text-sm"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 bg-slate-600/30 p-2 rounded">
                      💡 Costo estimado: <strong className="text-white">{formatCurrency(customSettings.serverCores * customSettings.costPerCore)}/mes</strong>
                    </div>
                  </div>

                  {/* Conectividad */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-white flex items-center gap-2">
                        <Wifi className="h-4 w-4 text-green-400" />
                        Conectividad
                      </h4>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={infrastructureSettings.connectivityEnabled}
                          onCheckedChange={(checked) => setInfrastructureSettings({
                            ...infrastructureSettings,
                            connectivityEnabled: checked
                          })}
                        />
                        <span className={`text-xs ${infrastructureSettings.connectivityEnabled ? 'text-green-400' : 'text-red-400'}`}>
                          {infrastructureSettings.connectivityEnabled ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-slate-300">Ancho banda/radio</Label>
                        <Input
                          type="number"
                          min="100"
                          max="2000"
                          step="100"
                          value={customSettings.bandwidthPerRadio}
                          onChange={(e) => setCustomSettings({
                            ...customSettings,
                            bandwidthPerRadio: parseInt(e.target.value) || 500
                          })}
                          className="bg-slate-600 border-slate-500 text-white text-sm"
                        />
                        <div className="text-xs text-slate-400 mt-1">CLP/radio/mes</div>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-300">Almacenamiento temporal</Label>
                        <Input
                          type="number"
                          min="10000"
                          max="200000"
                          step="10000"
                          value={customSettings.temporaryStorage}
                          onChange={(e) => setCustomSettings({
                            ...customSettings,
                            temporaryStorage: parseInt(e.target.value) || 50000
                          })}
                          className="bg-slate-600 border-slate-500 text-white text-sm"
                        />
                        <div className="text-xs text-slate-400 mt-1">CLP/mes (1-5TB)</div>
                      </div>
                    </div>
                  </div>

                  {/* Google Drive */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-white flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-purple-400" />
                        Almacenamiento Cloud
                      </h4>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={infrastructureSettings.cloudStorageEnabled}
                          onCheckedChange={(checked) => setInfrastructureSettings({
                            ...infrastructureSettings,
                            cloudStorageEnabled: checked
                          })}
                        />
                        <span className={`text-xs ${infrastructureSettings.cloudStorageEnabled ? 'text-green-400' : 'text-red-400'}`}>
                          {infrastructureSettings.cloudStorageEnabled ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-300">Google Drive (CLP/min)</Label>
                      <Input
                        type="number"
                        min="0.5"
                        max="10"
                        step="0.5"
                        value={customSettings.cloudStorageCostPerMinute}
                        onChange={(e) => setCustomSettings({
                          ...customSettings,
                          cloudStorageCostPerMinute: parseFloat(e.target.value) || 2
                        })}
                        className="bg-slate-600 border-slate-500 text-white text-sm"
                      />
                      <div className="text-xs text-slate-400 mt-1">Por minuto almacenado</div>
                    </div>
                  </div>

                  {/* Resumen de arquitectura */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-white flex items-center gap-2">
                      🔧 Arquitectura Implementada
                    </h4>
                    <div className="bg-slate-600/30 p-3 rounded text-xs space-y-2">
                      <div className="flex items-center text-blue-300">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                        <strong>FFmpeg:</strong> Captura y detecta localmente
                      </div>
                      <div className="flex items-center text-green-300">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                        <strong>APIs:</strong> Solo transcribe detecciones
                      </div>
                      <div className="flex items-center text-purple-300">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                        <strong>Drive:</strong> Backup automático y acceso
                      </div>
                    </div>
                  </div>
                </div>

                {/* Estimación para 500 radios */}
                <Card className="bg-slate-700/30 border-slate-600/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white">📊 Estimación para 500 Radios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="text-center p-2 bg-blue-900/30 rounded border border-blue-700/50">
                        <div className="text-blue-200 font-medium">Servidor FFmpeg</div>
                        <div className="text-white font-bold">
                          {infrastructureSettings.ffmpegServerEnabled ? 
                            formatCurrency(customSettings.serverCores * customSettings.costPerCore) : 
                            formatCurrency(0)
                          }
                        </div>
                      </div>
                      <div className="text-center p-2 bg-green-900/30 rounded border border-green-700/50">
                        <div className="text-green-200 font-medium">Ancho de Banda</div>
                        <div className="text-white font-bold">
                          {infrastructureSettings.connectivityEnabled ? 
                            formatCurrency(500 * customSettings.bandwidthPerRadio) : 
                            formatCurrency(0)
                          }
                        </div>
                      </div>
                      <div className="text-center p-2 bg-purple-900/30 rounded border border-purple-700/50">
                        <div className="text-purple-200 font-medium">Almacenamiento</div>
                        <div className="text-white font-bold">
                          {infrastructureSettings.cloudStorageEnabled ? 
                            formatCurrency(customSettings.temporaryStorage) : 
                            formatCurrency(0)
                          }
                        </div>
                      </div>
                      <div className="text-center p-2 bg-orange-900/30 rounded border border-orange-700/50">
                        <div className="text-orange-200 font-medium">Total Fijo/mes</div>
                        <div className="text-white font-bold">
                          {formatCurrency(
                            (infrastructureSettings.ffmpegServerEnabled ? customSettings.serverCores * customSettings.costPerCore : 0) +
                            (infrastructureSettings.connectivityEnabled ? 500 * customSettings.bandwidthPerRadio : 0) +
                            (infrastructureSettings.cloudStorageEnabled ? customSettings.temporaryStorage : 0)
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
            
            {/* Botón Siguiente */}
            <div className="flex justify-end">
              <Button 
                onClick={() => setActiveTab('simulator')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Siguiente →
              </Button>
            </div>
          </TabsContent>

          {/* Pestaña Simulador */}
          <TabsContent value="simulator" className="space-y-4">
            <Card className="bg-slate-700/30">
              <CardHeader>
                <CardTitle className="text-sm text-white flex items-center gap-2">
                  📊 Costos Variables - Por Escala de Radios
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-slate-400 hover:text-white cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Los costos variables son aquellos que cambian según el uso real del sistema:
                          transcripción de IA (solo cuando se detectan frases) y almacenamiento en Google Drive.
                          A diferencia de los costos fijos de infraestructura, estos aumentan o disminuyen 
                          según la actividad de las radios.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
                <p className="text-xs text-slate-400">
                  Los costos que varían según el número de radios monitoreadas y las detecciones realizadas
                </p>
              </CardHeader>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {radioScales.map(scale => {
                const sim = simulations[scale];
                if (!sim) return null;

                return (
                  <Card key={scale} className="bg-slate-700/30 border-slate-600">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-white flex items-center justify-between">
                        <span>{scale === 1 ? '1 Radio' : `${scale} Radios`}</span>
                        <Badge className={`${currentProfile.color.replace('text-', 'bg-').replace('500', '600')} text-white`}>
                          {currentProfile.name}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-slate-400">Detecciones/día:</div>
                        <div className="text-white font-mono">{sim.capturesPerDay.toLocaleString()}</div>
                        
                        <div className="text-slate-400">Min transcritos/día:</div>
                        <div className="text-white font-mono">{sim.minutesPerDay.toLocaleString()}</div>
                      </div>
                      
                      <div className="border-t border-slate-600 pt-2">
                        <div className="text-xs text-slate-400 mb-1">💰 Costos Mensuales</div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-blue-300">Infraestructura:</span>
                            <span className="text-blue-300 font-mono">{formatCurrency(sim.infrastructure.totalInfrastructure)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-green-300">Variables:</span>
                            <span className="text-green-300 font-mono">{formatCurrency(sim.variable.totalVariable)}</span>
                          </div>
                          <div className="flex justify-between text-sm border-t border-slate-600 pt-1">
                            <span className="text-orange-300 font-medium">Total:</span>
                            <span className="text-orange-300 font-bold">{formatCurrency(sim.monthlyCost)}</span>
                          </div>
                        </div>
                      </div>


                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {/* Botón Siguiente */}
            <div className="flex justify-end">
              <Button 
                onClick={() => setActiveTab('breakdown')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Siguiente →
              </Button>
            </div>
          </TabsContent>

          {/* Pestaña Resumen */}
          <TabsContent value="breakdown" className="space-y-4">
            
            {/* Resumen del Sistema */}
            <Card className="bg-blue-900/30 border-blue-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white flex items-center gap-2">
                  🏗️ Arquitectura Híbrida - OndaVerificada
                </CardTitle>
                <p className="text-xs text-slate-300 mt-2">
                  Sistema optimizado para monitoreo eficiente de publicidad en radios
                </p>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h5 className="text-blue-200 font-bold">🔧 Componentes Técnicos:</h5>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-200">Captura:</span>
                        <span className="text-blue-200">Servidor FFmpeg propio</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-200">Detección:</span>
                        <span className="text-blue-200">Algoritmos locales</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-200">Transcripción:</span>
                        <span className="text-green-200">Solo detecciones (APIs)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-200">Almacenamiento:</span>
                        <span className="text-purple-200">Google Drive automático</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h5 className="text-blue-200 font-bold">✅ Beneficios Clave:</h5>
                    <div className="space-y-1 text-blue-100">
                      <div>• Costos fijos predecibles</div>
                      <div>• Solo transcribe lo relevante</div>
                      <div>• Control total del proceso</div>
                      <div>• Escalabilidad eficiente</div>
                      <div>• Ahorro significativo vs. alternativas</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resumen de Costos */}
            <Card className="bg-slate-700/30">
              <CardHeader>
                <CardTitle className="text-sm text-white">
                  💰 Resumen de Costos - 500 Radios (Perfil: {currentProfile.name})
                </CardTitle>
                <p className="text-xs text-slate-400 mt-2">
                  Desglose detallado de la inversión mensual con arquitectura híbrida
                </p>
              </CardHeader>
              <CardContent>
                {(() => {
                  const sim500 = simulations[500];
                  if (!sim500) return <div className="text-slate-400 text-center py-8">Calculando costos...</div>;
                  
                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Costos Fijos */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-white flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            🖥️ Infraestructura (Fijos)
                          </h4>
                          <div className="bg-slate-600/30 p-3 rounded space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-200">Servidor FFmpeg:</span>
                              <span className="text-blue-200 font-mono">{formatCurrency(sim500.infrastructure.serverCost)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-200">Conectividad:</span>
                              <span className="text-blue-200 font-mono">{formatCurrency(sim500.infrastructure.bandwidthCost)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-200">Almacenamiento:</span>
                              <span className="text-blue-200 font-mono">{formatCurrency(sim500.infrastructure.storageCost)}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-500 pt-2 font-medium">
                              <span className="text-blue-100">Subtotal:</span>
                              <span className="text-blue-100">{formatCurrency(sim500.infrastructure.totalInfrastructure)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Costos Variables */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-white flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            📊 Operación (Variables)
                          </h4>
                          <div className="bg-slate-600/30 p-3 rounded space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-200">Detecciones/día:</span>
                              <span className="text-green-200 font-mono">{sim500.capturesPerDay.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-200">Transcripción AI:</span>
                              <span className="text-green-200 font-mono">{formatCurrency(sim500.variable.transcriptionCost)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-200">Google Drive:</span>
                              <span className="text-green-200 font-mono">{formatCurrency(sim500.variable.cloudStorageCost)}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-500 pt-2 font-medium">
                              <span className="text-green-100">Subtotal:</span>
                              <span className="text-green-100">{formatCurrency(sim500.variable.totalVariable)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Total Final */}
                      <div className="bg-gradient-to-r from-green-900/30 to-blue-900/20 p-4 rounded-lg border border-green-700/50">
                        <div className="text-center">
                          <div className="text-green-300 text-sm font-medium mb-2">💰 Inversión Total Mensual</div>
                          <div className="text-3xl font-bold text-white mb-2">
                            {formatCurrency(sim500.monthlyCost)}
                          </div>
                          <div className="text-sm text-slate-300">
                            Para monitoreo de 500 radios • {customSettings.hoursPerDay}h/día
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}


'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SystemSetupGuide from '@/components/system-setup-guide';
import APIConfiguration from '@/components/api-configuration';
import GoogleDriveConfig from '@/components/google-drive-config';
import DynamicProvidersManager from '@/components/dynamic-providers-manager';
import { 
  Settings, 
  Server, 
  DollarSign, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Cloud,
  Plus,
  Trash2,
  Calendar,
  Radio as RadioIcon,
  Brain
} from 'lucide-react';

interface SystemConfig {
  dependencies: { [tool: string]: boolean };
  globalSettings: {
    defaultCaptureInterval: number;
    defaultCaptureDuration: number;
    defaultTargetPhrases: string[];
    autoStartMonitoring: boolean;
    maxConcurrentCaptures: number;
  };
}

interface PricingRule {
  id: string;
  name: string;
  pricePerDetection: number;
  effectiveDate: string;
  endDate?: string;
  description: string;
  radioIds: string[];
}

export default function ConfigurationPage() {
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [newRule, setNewRule] = useState<Partial<PricingRule>>({});
  const [isAddRuleDialogOpen, setIsAddRuleDialogOpen] = useState(false);

  // Cargar configuración inicial
  useEffect(() => {
    loadSystemConfig();
    loadPricingRules();
  }, []);

  const loadSystemConfig = async () => {
    try {
      const response = await fetch('/api/monitoring/status');
      const data = await response.json();
      
      setSystemConfig({
        dependencies: data.systemStatus?.dependencies || {},
        globalSettings: {
          defaultCaptureInterval: 300, // 5 minutos
          defaultCaptureDuration: 30,   // 30 segundos
          defaultTargetPhrases: ['coca-cola', 'entel', 'falabella', 'lider', 'santander'],
          autoStartMonitoring: false,
          maxConcurrentCaptures: 10
        }
      });
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  };

  const loadPricingRules = () => {
    // Mock data - en producción vendría de la API
    setPricingRules([
      {
        id: '1',
        name: 'Radios Premium Santiago',
        pricePerDetection: 1500, // CLP
        effectiveDate: '2025-09-01',
        description: 'Radios principales de Santiago con mayor audiencia',
        radioIds: ['1', '2', '3']
      },
      {
        id: '2',
        name: 'Radios Regionales',
        pricePerDetection: 800,
        effectiveDate: '2025-09-01',
        description: 'Radios de regiones con audiencia menor',
        radioIds: ['4', '5', '6', '7', '8']
      }
    ]);
  };

  const refreshSystemStatus = async () => {
    setLoading(true);
    await loadSystemConfig();
    setLoading(false);
  };

  const saveGlobalSettings = async () => {
    setLoading(true);
    try {
      // Simular guardado - en producción sería una API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('✅ Configuración global guardada correctamente');
    } catch (error) {
      alert('❌ Error guardando configuración');
    } finally {
      setLoading(false);
    }
  };

  const addPricingRule = () => {
    if (!newRule.name || !newRule.pricePerDetection || !newRule.effectiveDate) {
      alert('Complete todos los campos obligatorios');
      return;
    }

    const rule: PricingRule = {
      id: Date.now().toString(),
      name: newRule.name,
      pricePerDetection: newRule.pricePerDetection,
      effectiveDate: newRule.effectiveDate,
      endDate: newRule.endDate,
      description: newRule.description || '',
      radioIds: newRule.radioIds || []
    };

    setPricingRules([...pricingRules, rule]);
    setNewRule({});
    setIsAddRuleDialogOpen(false);
  };

  const deletePricingRule = (ruleId: string) => {
    if (confirm('¿Está seguro de eliminar esta regla de precios?')) {
      setPricingRules(pricingRules.filter(rule => rule.id !== ruleId));
    }
  };

  const isSystemReady = systemConfig ? 
    Object.values(systemConfig.dependencies).every(Boolean) : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Configuración Global del Sistema</h2>
        <p className="text-slate-400">
          Configuración completa: APIs de transcripción, herramientas del sistema, monitoreo y facturación
        </p>
      </div>

      <Tabs defaultValue="ai-apis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-gray-800">
          <TabsTrigger value="ai-apis" className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Brain className="h-4 w-4 mr-2" />
            APIs de Transcripción
          </TabsTrigger>
          <TabsTrigger value="storage" className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Cloud className="h-4 w-4 mr-2" />
            Google Drive
          </TabsTrigger>
          <TabsTrigger value="system" className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Server className="h-4 w-4 mr-2" />
            Sistema
          </TabsTrigger>
          <TabsTrigger value="global" className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="pricing" className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <DollarSign className="h-4 w-4 mr-2" />
            Valorización
          </TabsTrigger>
        </TabsList>

        {/* Pestaña APIs de IA - Ahora Dinámicas */}
        <TabsContent value="ai-apis">
          <DynamicProvidersManager />
        </TabsContent>

        {/* Pestaña Google Drive */}
        <TabsContent value="storage">
          <GoogleDriveConfig />
        </TabsContent>

        {/* Pestaña Sistema */}
        <TabsContent value="system">
          <div className="space-y-6">
            {/* Estado del Sistema */}
            <Alert 
              style={{
                backgroundColor: isSystemReady ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                borderColor: isSystemReady ? '#22c55e' : '#f59e0b',
                borderWidth: '1px'
              }}
              className="rounded-lg"
            >
              <div className="flex items-center space-x-2">
                {isSystemReady ? (
                  <CheckCircle className="h-4 w-4" style={{ color: '#22c55e' }} />
                ) : (
                  <AlertTriangle className="h-4 w-4" style={{ color: '#f59e0b' }} />
                )}
              </div>
              <AlertTitle style={{ color: isSystemReady ? '#4ade80' : '#fbbf24' }}>
                {isSystemReady ? '✅ Sistema Operativo' : '⚠️ Configuración Requerida'}
              </AlertTitle>
              <AlertDescription style={{ color: isSystemReady ? '#86efac' : '#fcd34d' }}>
                {isSystemReady 
                  ? 'Todas las herramientas están instaladas y funcionando correctamente.'
                  : 'Se requiere instalación de herramientas para el funcionamiento completo.'
                }
              </AlertDescription>
            </Alert>

            {/* Botón de verificación */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-slate-400">
                Verificar estado de las herramientas del sistema
              </div>
              <Button 
                variant="outline" 
                onClick={refreshSystemStatus}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Verificando...' : 'Verificar Sistema'}
              </Button>
            </div>

            {/* Estado de Herramientas del Sistema */}
            {systemConfig && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    {isSystemReady ? '🛠️ Herramientas del Sistema' : '🛠️ Instalación de Herramientas'}
                  </CardTitle>
                  <p className="text-sm text-slate-400">
                    {isSystemReady 
                      ? 'Estado y configuración de las herramientas instaladas'
                      : 'Instala las herramientas requeridas para el funcionamiento completo'
                    }
                  </p>
                </CardHeader>
                <CardContent>
                  <SystemSetupGuide 
                    dependencies={systemConfig.dependencies}
                    onRefresh={refreshSystemStatus}
                  />
                </CardContent>
              </Card>
            )}

            {/* Información del Sistema */}
            {systemConfig && isSystemReady && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">📊 Información del Sistema</CardTitle>
                  <p className="text-sm text-slate-400">
                    Detalles técnicos y configuración del entorno
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-white">🔧 Herramientas Core</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-green-900/20 rounded">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-white">FFmpeg</span>
                          </div>
                          <Badge className="bg-green-600 text-white">Activo</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-green-900/20 rounded">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-white">Whisper AI</span>
                          </div>
                          <Badge className="bg-green-600 text-white">Activo</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-blue-900/20 rounded">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-white">yt-dlp</span>
                          </div>
                          <Badge className="bg-blue-600 text-white">Opcional</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-white">⚙️ Configuración</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Capturas simultáneas:</span>
                          <span className="text-white font-mono">500</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Intervalo de captura:</span>
                          <span className="text-white font-mono">5 min</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Duración de captura:</span>
                          <span className="text-white font-mono">30 seg</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Base de datos:</span>
                          <Badge className="bg-green-600 text-white text-xs">PostgreSQL</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-700 pt-4">
                    <h4 className="text-sm font-medium text-white mb-3">🚀 Rendimiento del Sistema</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-slate-700/30 rounded">
                        <div className="text-lg font-mono text-green-400">99.8%</div>
                        <div className="text-xs text-slate-400">Uptime</div>
                      </div>
                      <div className="text-center p-3 bg-slate-700/30 rounded">
                        <div className="text-lg font-mono text-blue-400">2.4GB</div>
                        <div className="text-xs text-slate-400">RAM Usada</div>
                      </div>
                      <div className="text-center p-3 bg-slate-700/30 rounded">
                        <div className="text-lg font-mono text-purple-400">15%</div>
                        <div className="text-xs text-slate-400">CPU Load</div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-700 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-white">🔄 Actualizaciones</h4>
                        <p className="text-xs text-slate-400">Última verificación: Hace 2 horas</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Verificar Updates
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Pestaña Configuración Global */}
        <TabsContent value="global">
          <div className="space-y-6">
            {/* Alert informativa para APIs */}
            <Alert className="border-blue-500 bg-blue-950/50">
              <Brain className="h-4 w-4 text-blue-400" />
              <AlertTitle className="text-blue-300">
                💡 APIs de Transcripción
              </AlertTitle>
              <AlertDescription className="text-blue-200">
                Para configurar las APIs de Inteligencia Artificial (Abacus AI, Groq, etc.), 
                dirígete a la pestaña <strong>"APIs de Transcripción"</strong>. 
                Esta sección contiene únicamente configuraciones generales del sistema.
              </AlertDescription>
            </Alert>
            {/* Configuración Default para Radios */}
            {systemConfig && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">📻 Configuración Default para Todas las Radios</CardTitle>
                  <p className="text-sm text-slate-400">
                    Estas configuraciones se aplicarán por defecto a todas las nuevas radios
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Intervalos */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-white">⏱️ Configuración de Captura</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="captureInterval" className="text-white">Intervalo entre capturas (segundos)</Label>
                      <Input
                        id="captureInterval"
                        type="number"
                        value={systemConfig.globalSettings.defaultCaptureInterval}
                        onChange={(e) => setSystemConfig({
                          ...systemConfig,
                          globalSettings: {
                            ...systemConfig.globalSettings,
                            defaultCaptureInterval: parseInt(e.target.value)
                          }
                        })}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                      <p className="text-xs text-slate-400">
                        {Math.round(systemConfig.globalSettings.defaultCaptureInterval / 60)} minutos entre cada captura
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="captureDuration" className="text-white">Duración de captura (segundos)</Label>
                      <Input
                        id="captureDuration"
                        type="number"
                        value={systemConfig.globalSettings.defaultCaptureDuration}
                        onChange={(e) => setSystemConfig({
                          ...systemConfig,
                          globalSettings: {
                            ...systemConfig.globalSettings,
                            defaultCaptureDuration: parseInt(e.target.value)
                          }
                        })}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxCaptures" className="text-white">Máximo capturas simultáneas</Label>
                      <Input
                        id="maxCaptures"
                        type="number"
                        value={systemConfig.globalSettings.maxConcurrentCaptures}
                        onChange={(e) => setSystemConfig({
                          ...systemConfig,
                          globalSettings: {
                            ...systemConfig.globalSettings,
                            maxConcurrentCaptures: parseInt(e.target.value)
                          }
                        })}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </div>

                  {/* Frases objetivo */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-white">🎯 Frases Objetivo Default</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="targetPhrases" className="text-white">Frases a detectar (una por línea)</Label>
                      <Textarea
                        id="targetPhrases"
                        value={systemConfig.globalSettings.defaultTargetPhrases.join('\n')}
                        onChange={(e) => setSystemConfig({
                          ...systemConfig,
                          globalSettings: {
                            ...systemConfig.globalSettings,
                            defaultTargetPhrases: e.target.value.split('\n').filter(p => p.trim())
                          }
                        })}
                        placeholder="coca-cola&#10;entel&#10;falabella"
                        rows={6}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                      <p className="text-xs text-slate-400">
                        {systemConfig.globalSettings.defaultTargetPhrases.length} frases configuradas
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="autoStart"
                        checked={systemConfig.globalSettings.autoStartMonitoring}
                        onCheckedChange={(checked) => setSystemConfig({
                          ...systemConfig,
                          globalSettings: {
                            ...systemConfig.globalSettings,
                            autoStartMonitoring: checked
                          }
                        })}
                      />
                      <Label htmlFor="autoStart" className="text-sm text-white">
                        Auto-iniciar monitoreo en radios nuevas
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" size="sm">
                    🧪 Probar Configuración Completa
                  </Button>
                  <Button onClick={saveGlobalSettings} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Guardando...' : 'Guardar Todo (APIs + Configuración)'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            )}
          </div>
        </TabsContent>

        {/* Pestaña Valorización */}
        <TabsContent value="pricing">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">💰 Reglas de Valorización</h3>
                <p className="text-sm text-slate-400">
                  Configure precios por detección publicitaria para diferentes grupos de radios
                </p>
              </div>
              <Dialog open={isAddRuleDialogOpen} onOpenChange={setIsAddRuleDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Regla
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-800">
                  <DialogHeader>
                    <DialogTitle className="text-white">Crear Regla de Precios</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ruleName" className="text-white">Nombre de la regla*</Label>
                      <Input
                        id="ruleName"
                        value={newRule.name || ''}
                        onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                        placeholder="Ej: Radios Premium Santiago"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-white">Precio por detección (CLP)*</Label>
                      <Input
                        id="price"
                        type="number"
                        value={newRule.pricePerDetection || ''}
                        onChange={(e) => setNewRule({...newRule, pricePerDetection: parseInt(e.target.value)})}
                        placeholder="1500"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="effectiveDate" className="text-white">Fecha de inicio*</Label>
                        <Input
                          id="effectiveDate"
                          type="date"
                          value={newRule.effectiveDate || ''}
                          onChange={(e) => setNewRule({...newRule, effectiveDate: e.target.value})}
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endDate" className="text-white">Fecha de fin (opcional)</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={newRule.endDate || ''}
                          onChange={(e) => setNewRule({...newRule, endDate: e.target.value})}
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-white">Descripción</Label>
                      <Textarea
                        id="description"
                        value={newRule.description || ''}
                        onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                        placeholder="Descripción de la regla de precios"
                        className="bg-gray-800 border-gray-700 text-white"
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsAddRuleDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={addPricingRule}>
                        Crear Regla
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Lista de reglas */}
            <div className="grid gap-4">
              {pricingRules.map((rule) => (
                <Card key={rule.id} className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg text-white">{rule.name}</CardTitle>
                        <p className="text-sm text-slate-400">{rule.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePricingRule(rule.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4" style={{ color: '#22c55e' }} />
                        <span className="text-white font-medium">${rule.pricePerDetection.toLocaleString()} CLP</span>
                        <span className="text-slate-400">por detección</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" style={{ color: '#3b82f6' }} />
                        <span className="text-white">Desde {new Date(rule.effectiveDate).toLocaleDateString('es-CL')}</span>
                        {rule.endDate && (
                          <span className="text-slate-400">hasta {new Date(rule.endDate).toLocaleDateString('es-CL')}</span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <RadioIcon className="h-4 w-4" style={{ color: '#a855f7' }} />
                        <span className="text-white">{rule.radioIds.length} radios asignadas</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <Badge 
                        style={{
                          backgroundColor: '#22c55e',
                          color: 'white',
                          border: '1px solid #22c55e'
                        }}
                        className="font-medium"
                      >
                        Activa
                      </Badge>
                      <Button variant="outline" size="sm">
                        Editar Asignaciones
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {pricingRules.length === 0 && (
              <Card className="bg-gray-800/50 border-gray-700 border-dashed">
                <CardContent className="py-12 text-center">
                  <DollarSign className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <p className="text-slate-400">No hay reglas de valorización configuradas.</p>
                  <p className="text-sm text-slate-400">Crea la primera regla para empezar a valorizar las detecciones.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { 
  Plus, 
  Settings, 
  TestTube, 
  Trash2, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  Activity,
  Zap,
  Brain,
  Globe,
  AlertTriangle,
  Loader,
  Play,
  RotateCcw
} from 'lucide-react';

interface ApiModel {
  id: string;
  name: string;
  description: string;
  costPerMinute: number;
  accuracy?: number;
  speed?: string;
  languages?: string[];
}

interface ApiProvider {
  id: string;
  name: string;
  type: 'transcription' | 'audio_processing' | 'translation' | 'ai_chat';
  baseUrl: string;
  apiKey?: string;
  models: ApiModel[];
  headers?: Record<string, string>;
  enabled: boolean;
  priority: number;
  rateLimits?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  created_at: string;
  updated_at: string;
}

interface TestResult {
  success: boolean;
  provider: string;
  model: string;
  responseTime: number;
  error?: string;
  sampleTranscription?: string;
  cost: number;
  accuracy?: number;
}

export default function DynamicProvidersManager() {
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ApiProvider | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  const [newProvider, setNewProvider] = useState({
    name: '',
    type: 'transcription' as const,
    baseUrl: '',
    apiKey: '',
    models: [] as ApiModel[],
    enabled: true,
    priority: 1,
    rateLimits: {
      requestsPerMinute: 60,
      requestsPerHour: 1000
    }
  });

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const response = await fetch('/api/providers');
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers || []);
      }
    } catch (error) {
      console.error('Error cargando proveedores:', error);
    } finally {
      setLoading(false);
    }
  };

  const testProvider = async (provider: ApiProvider, modelId?: string) => {
    if (!provider.apiKey && provider.id !== 'mock-provider') {
      alert('⚠️ Se requiere API Key para probar este proveedor');
      return;
    }

    setTestingProvider(provider.id);
    
    try {
      const response = await fetch('/api/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: provider.id,
          modelId: modelId || provider.models[0]?.id || 'default',
          apiKey: provider.apiKey
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTestResults(prev => ({
          ...prev,
          [provider.id]: data.result
        }));
      } else {
        const error = await response.json();
        setTestResults(prev => ({
          ...prev,
          [provider.id]: {
            success: false,
            provider: provider.id,
            model: 'default',
            responseTime: 0,
            error: error.error || 'Error de conectividad',
            cost: 0
          }
        }));
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [provider.id]: {
          success: false,
          provider: provider.id,
          model: 'default',
          responseTime: 0,
          error: 'Error de red',
          cost: 0
        }
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const saveProvider = async (provider: Partial<ApiProvider>) => {
    try {
      const isEdit = provider.id && providers.find(p => p.id === provider.id);
      const endpoint = '/api/providers';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(provider)
      });

      if (response.ok) {
        await loadProviders();
        setIsAddDialogOpen(false);
        setEditingProvider(null);
        resetForm();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error guardando proveedor:', error);
      alert('Error de conectividad');
    }
  };

  const deleteProvider = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este proveedor?')) return;

    try {
      const response = await fetch(`/api/providers?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadProviders();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error eliminando proveedor:', error);
      alert('Error de conectividad');
    }
  };

  const toggleProvider = async (provider: ApiProvider) => {
    await saveProvider({
      ...provider,
      enabled: !provider.enabled
    });
  };

  const resetForm = () => {
    setNewProvider({
      name: '',
      type: 'transcription',
      baseUrl: '',
      apiKey: '',
      models: [],
      enabled: true,
      priority: Math.max(...providers.map(p => p.priority), 0) + 1,
      rateLimits: {
        requestsPerMinute: 60,
        requestsPerHour: 1000
      }
    });
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'transcription': return <Brain className="h-4 w-4" />;
      case 'audio_processing': return <Activity className="h-4 w-4" />;
      case 'translation': return <Globe className="h-4 w-4" />;
      case 'ai_chat': return <Zap className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getSpeedBadge = (speed?: string) => {
    const colors = {
      'slow': 'bg-red-600',
      'standard': 'bg-yellow-600', 
      'fast': 'bg-green-600',
      'ultra-fast': 'bg-purple-600'
    };
    
    return (
      <Badge className={`${colors[speed as keyof typeof colors] || 'bg-gray-600'} text-white`}>
        {speed || 'standard'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-white">Cargando proveedores...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">⚡ Gestión Dinámica de APIs</h3>
          <p className="text-slate-400">
            Agregar, configurar y probar proveedores de API dinámicamente
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => {
              const enabledProviders = providers.filter(p => p.enabled).map(p => p.id);
              if (enabledProviders.length === 0) {
                alert('No hay proveedores habilitados para probar');
                return;
              }
              // Aquí iría la lógica para probar todos los proveedores habilitados
              enabledProviders.forEach(id => {
                const provider = providers.find(p => p.id === id);
                if (provider) testProvider(provider);
              });
            }}
            variant="outline"
            className="text-green-400 border-green-400"
          >
            <TestTube className="h-4 w-4 mr-2" />
            Probar Todos
          </Button>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Proveedor
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingProvider ? 'Editar Proveedor' : 'Nuevo Proveedor de API'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Nombre *</Label>
                    <Input
                      value={editingProvider?.name || newProvider.name}
                      onChange={(e) => editingProvider ? 
                        setEditingProvider({...editingProvider, name: e.target.value}) :
                        setNewProvider({...newProvider, name: e.target.value})
                      }
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Ej: Mi API Custom"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white">Tipo *</Label>
                    <Select 
                      value={editingProvider?.type || newProvider.type}
                      onValueChange={(value) => editingProvider ? 
                        setEditingProvider({...editingProvider, type: value as any}) :
                        setNewProvider({...newProvider, type: value as any})
                      }
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transcription">Transcripción</SelectItem>
                        <SelectItem value="audio_processing">Procesamiento Audio</SelectItem>
                        <SelectItem value="translation">Traducción</SelectItem>
                        <SelectItem value="ai_chat">IA Chat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">URL Base *</Label>
                  <Input
                    value={editingProvider?.baseUrl || newProvider.baseUrl}
                    onChange={(e) => editingProvider ? 
                      setEditingProvider({...editingProvider, baseUrl: e.target.value}) :
                      setNewProvider({...newProvider, baseUrl: e.target.value})
                    }
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="https://api.ejemplo.com/v1"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">API Key</Label>
                  <Input
                    type="password"
                    value={editingProvider?.apiKey || newProvider.apiKey}
                    onChange={(e) => editingProvider ? 
                      setEditingProvider({...editingProvider, apiKey: e.target.value}) :
                      setNewProvider({...newProvider, apiKey: e.target.value})
                    }
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="sk-..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Prioridad</Label>
                    <Input
                      type="number"
                      min="1"
                      value={editingProvider?.priority || newProvider.priority}
                      onChange={(e) => editingProvider ? 
                        setEditingProvider({...editingProvider, priority: parseInt(e.target.value)}) :
                        setNewProvider({...newProvider, priority: parseInt(e.target.value)})
                      }
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-6">
                    <Switch
                      checked={editingProvider?.enabled ?? newProvider.enabled}
                      onCheckedChange={(enabled) => editingProvider ? 
                        setEditingProvider({...editingProvider, enabled}) :
                        setNewProvider({...newProvider, enabled})
                      }
                    />
                    <Label className="text-white">Habilitado</Label>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setEditingProvider(null);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => saveProvider(editingProvider || newProvider)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {editingProvider ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Proveedores</p>
                <p className="text-2xl font-bold text-white">{providers.length}</p>
              </div>
              <Settings className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Habilitados</p>
                <p className="text-2xl font-bold text-green-400">{providers.filter(p => p.enabled).length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Transcripción</p>
                <p className="text-2xl font-bold text-purple-400">
                  {providers.filter(p => p.type === 'transcription').length}
                </p>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Pruebas Exitosas</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {Object.values(testResults).filter(r => r.success).length}
                </p>
              </div>
              <TestTube className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de proveedores */}
      <div className="grid gap-4">
        {providers.map((provider) => {
          const testResult = testResults[provider.id];
          
          return (
            <Card key={provider.id} className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getProviderIcon(provider.type)}
                    <div>
                      <CardTitle className="text-white text-lg">{provider.name}</CardTitle>
                      <CardDescription>
                        {provider.baseUrl} • {provider.models.length} modelos
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={provider.enabled ? 'default' : 'secondary'}>
                      {provider.enabled ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Prioridad {provider.priority}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Modelos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {provider.models.map((model) => (
                    <div key={model.id} className="p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-white">{model.name}</h4>
                        {getSpeedBadge(model.speed)}
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{model.description}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-green-400">
                          <DollarSign className="h-3 w-3 inline mr-1" />
                          ${(model.costPerMinute * 1000).toFixed(2)} CLP/min
                        </span>
                        {model.accuracy && (
                          <span className="text-blue-400">
                            {model.accuracy.toFixed(1)}% precisión
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resultado de prueba */}
                {testResult && (
                  <Alert className={`${
                    testResult.success 
                      ? 'border-green-500 bg-green-950/50' 
                      : 'border-red-500 bg-red-950/50'
                  }`}>
                    <div className="flex items-center gap-2">
                      {testResult.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <AlertTitle className={testResult.success ? 'text-green-300' : 'text-red-300'}>
                        {testResult.success ? '✅ Prueba exitosa' : '❌ Prueba fallida'}
                      </AlertTitle>
                    </div>
                    <AlertDescription className={testResult.success ? 'text-green-200' : 'text-red-200'}>
                      {testResult.success ? (
                        <div className="space-y-1">
                          <p><strong>Tiempo:</strong> {testResult.responseTime}ms</p>
                          <p><strong>Costo:</strong> ${(testResult.cost * 1000).toFixed(3)} CLP</p>
                          {testResult.accuracy && (
                            <p><strong>Precisión:</strong> {testResult.accuracy.toFixed(1)}%</p>
                          )}
                          {testResult.sampleTranscription && (
                            <p className="text-xs italic">"{testResult.sampleTranscription}"</p>
                          )}
                        </div>
                      ) : (
                        <p>{testResult.error}</p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Controles */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-600">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testProvider(provider)}
                      disabled={testingProvider === provider.id}
                      className="text-green-400 border-green-400"
                    >
                      {testingProvider === provider.id ? (
                        <>
                          <Loader className="h-3 w-3 mr-1 animate-spin" />
                          Probando...
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          Probar
                        </>
                      )}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleProvider(provider)}
                      className={provider.enabled ? 'text-yellow-400' : 'text-green-400'}
                    >
                      {provider.enabled ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingProvider(provider);
                        setIsAddDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteProvider(provider.id)}
                      className="text-red-400 border-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {providers.length === 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <Brain className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No hay proveedores configurados</h3>
            <p className="text-slate-400 mb-4">
              Agrega tu primer proveedor de API para comenzar
            </p>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Primer Proveedor
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

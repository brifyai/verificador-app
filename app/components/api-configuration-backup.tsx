
'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Settings, 
  Zap, 
  Brain,
  TestTube,
  Save,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

interface APIConfig {
  abacusAI: {
    apiKey: string;
    baseUrl: string;
    model: string;
    enabled: boolean;
  };
  groq: {
    apiKey: string;
    model: string;
    enabled: boolean;
  };
  openai: {
    apiKey: string;
    model: string;
    enabled: boolean;
  };
  assemblyai: {
    apiKey: string;
    model: string;
    enabled: boolean;
  };
  revai: {
    apiKey: string;
    enabled: boolean;
  };
  deepgram: {
    apiKey: string;
    model: string;
    enabled: boolean;
  };
  speechmatics: {
    apiKey: string;
    enabled: boolean;
  };
  googleCloud: {
    apiKey: string;
    model: string;
    enabled: boolean;
  };
  awsTranscribe: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    enabled: boolean;
  };
  azureSpeech: {
    subscriptionKey: string;
    region: string;
    enabled: boolean;
  };
  elevenlabs: {
    apiKey: string;
    model: string;
    enabled: boolean;
  };
  settings: {
    defaultProvider: string;
    maxRetries: number;
    timeout: number;
    enableFallback: boolean;
    costLimit: number;
    priorityOrder: string[];
  };
}

interface ProviderStatus {
  status: 'healthy' | 'unhealthy' | 'testing';
  latency?: number;
  error?: string;
  lastTested?: string;
}

const APIConfiguration = () => {
  const [config, setConfig] = useState<APIConfig>({
    abacusAI: {
      apiKey: '',
      baseUrl: 'https://api.abacus.ai',
      model: 'whisper-large-v3',
      enabled: true
    },
    groq: {
      apiKey: '',
      model: 'whisper-large-v3',
      enabled: true
    },
    openai: {
      apiKey: '',
      model: 'whisper-1',
      enabled: false
    },
    assemblyai: {
      apiKey: '',
      model: 'best',
      enabled: false
    },
    revai: {
      apiKey: '',
      enabled: false
    },
    deepgram: {
      apiKey: '',
      model: 'nova-2',
      enabled: false
    },
    speechmatics: {
      apiKey: '',
      enabled: false
    },
    googleCloud: {
      apiKey: '',
      model: 'latest_long',
      enabled: false
    },
    awsTranscribe: {
      accessKeyId: '',
      secretAccessKey: '',
      region: 'us-east-1',
      enabled: false
    },
    azureSpeech: {
      subscriptionKey: '',
      region: 'eastus',
      enabled: false
    },
    elevenlabs: {
      apiKey: '',
      model: 'eleven_multilingual_v2',
      enabled: false
    },
    settings: {
      defaultProvider: 'auto',
      maxRetries: 3,
      timeout: 30000,
      enableFallback: true,
      costLimit: 100, // USD per month
      priorityOrder: ['groq', 'abacusAI', 'deepgram', 'assemblyai', 'openai']
    }
  });

  const [status, setStatus] = useState<{
    [key: string]: ProviderStatus;
  }>({
    abacus: { status: 'unhealthy' },
    groq: { status: 'unhealthy' },
    openai: { status: 'unhealthy' },
    assemblyai: { status: 'unhealthy' },
    revai: { status: 'unhealthy' },
    deepgram: { status: 'unhealthy' },
    speechmatics: { status: 'unhealthy' },
    googleCloud: { status: 'unhealthy' },
    awsTranscribe: { status: 'unhealthy' },
    azureSpeech: { status: 'unhealthy' },
    elevenlabs: { status: 'unhealthy' }
  });

  const [showKeys, setShowKeys] = useState({
    abacus: false,
    groq: false,
    openai: false,
    assemblyai: false,
    revai: false,
    deepgram: false,
    speechmatics: false,
    googleCloud: false,
    awsTranscribe: false,
    azureSpeech: false,
    elevenlabs: false
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadConfiguration();
    loadStatus();
  }, []);

  const loadConfiguration = async () => {
    try {
      const response = await fetch('/api/config/ai-apis');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  };

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/transcription/providers');
      if (response.ok) {
        const data = await response.json();
        setStatus(prev => ({
          ...prev,
          abacus: data.providers?.abacus || { status: 'unhealthy' },
          groq: data.providers?.groq || { status: 'unhealthy' },
          openai: data.providers?.openai || { status: 'unhealthy' },
          assemblyai: data.providers?.assemblyai || { status: 'unhealthy' },
          revai: data.providers?.revai || { status: 'unhealthy' },
          deepgram: data.providers?.deepgram || { status: 'unhealthy' },
          speechmatics: data.providers?.speechmatics || { status: 'unhealthy' },
          googleCloud: data.providers?.googleCloud || { status: 'unhealthy' },
          awsTranscribe: data.providers?.awsTranscribe || { status: 'unhealthy' },
          azureSpeech: data.providers?.azureSpeech || { status: 'unhealthy' },
          elevenlabs: data.providers?.elevenlabs || { status: 'unhealthy' }
        }));
      }
    } catch (error) {
      console.error('Error loading status:', error);
    }
  };

  const saveConfiguration = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      const response = await fetch('/api/config/ai-apis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setSaveMessage('✅ Configuración guardada exitosamente');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        throw new Error('Error al guardar configuración');
      }
    } catch (error) {
      setSaveMessage('❌ Error al guardar configuración');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const testConnections = async () => {
    setIsTesting(true);
    
    // Set all enabled providers to testing status
    const testingStatus = Object.keys(status).reduce((acc, key) => {
      acc[key] = { status: 'testing' as const };
      return acc;
    }, {} as { [key: string]: ProviderStatus });
    
    setStatus(testingStatus);

    try {
      const response = await fetch('/api/config/test-ai-apis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error testing connections:', error);
      const errorStatus = Object.keys(status).reduce((acc, key) => {
        acc[key] = { status: 'unhealthy' as const, error: 'Error al probar conexión' };
        return acc;
      }, {} as { [key: string]: ProviderStatus });
      setStatus(errorStatus);
    } finally {
      setIsTesting(false);
    }
  };

  const updateConfig = (section: keyof APIConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const getStatusIcon = (providerStatus: ProviderStatus) => {
    switch (providerStatus.status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'testing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (providerStatus: ProviderStatus) => {
    const variant = providerStatus.status === 'healthy' ? 'default' : 
                   providerStatus.status === 'testing' ? 'secondary' : 'destructive';
    
    return (
      <Badge variant={variant as any} className="ml-2">
        {providerStatus.status === 'healthy' ? 'Conectado' :
         providerStatus.status === 'testing' ? 'Probando...' : 'Desconectado'}
      </Badge>
    );
  };

  const maskApiKey = (key: string) => {
    if (!key || key.length < 8) return key;
    return key.substring(0, 8) + '•'.repeat(20);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <div>
            <CardTitle>Configuración de APIs de IA</CardTitle>
            <CardDescription>
              Configura las integraciones con Abacus AI y Groq para transcripción de audio
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="providers" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="providers">Premium</TabsTrigger>
            <TabsTrigger value="budget">Económicos</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
            <TabsTrigger value="test">Pruebas</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-6">
            {/* Abacus AI Configuration */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    <CardTitle className="text-lg">Abacus AI</CardTitle>
                    {getStatusIcon(status.abacus)}
                    {getStatusBadge(status.abacus)}
                  </div>
                  <Switch
                    checked={config.abacusAI.enabled}
                    onCheckedChange={(checked) => 
                      updateConfig('abacusAI', 'enabled', checked)
                    }
                  />
                </div>
                <CardDescription>
                  Máxima precisión para español chileno - $0.02-0.05 por minuto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="abacus-api-key">API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="abacus-api-key"
                      type={showKeys.abacus ? "text" : "password"}
                      value={showKeys.abacus ? config.abacusAI.apiKey : maskApiKey(config.abacusAI.apiKey)}
                      onChange={(e) => updateConfig('abacusAI', 'apiKey', e.target.value)}
                      placeholder="abacus_xxxxxxxxxxxxxxxx"
                      disabled={!config.abacusAI.enabled}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowKeys(prev => ({ ...prev, abacus: !prev.abacus }))}
                    >
                      {showKeys.abacus ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="abacus-base-url">Base URL</Label>
                  <Input
                    id="abacus-base-url"
                    value={config.abacusAI.baseUrl}
                    onChange={(e) => updateConfig('abacusAI', 'baseUrl', e.target.value)}
                    disabled={!config.abacusAI.enabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="abacus-model">Modelo</Label>
                  <select
                    id="abacus-model"
                    className="w-full px-3 py-2 border rounded-md"
                    value={config.abacusAI.model}
                    onChange={(e) => updateConfig('abacusAI', 'model', e.target.value)}
                    disabled={!config.abacusAI.enabled}
                  >
                    <option value="whisper-large-v3">Whisper Large V3 (Máxima precisión)</option>
                    <option value="whisper-medium">Whisper Medium (Balance)</option>
                    <option value="custom-chile-model">Modelo Chile (Español chileno)</option>
                  </select>
                </div>

                {status.abacus.latency && (
                  <div className="text-sm text-muted-foreground">
                    Latencia: {status.abacus.latency}ms
                  </div>
                )}

                {status.abacus.error && (
                  <Alert variant="destructive">
                    <AlertDescription>{status.abacus.error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Groq Configuration */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-orange-500" />
                    <CardTitle className="text-lg">Groq API</CardTitle>
                    {getStatusIcon(status.groq)}
                    {getStatusBadge(status.groq)}
                  </div>
                  <Switch
                    checked={config.groq.enabled}
                    onCheckedChange={(checked) => 
                      updateConfig('groq', 'enabled', checked)
                    }
                  />
                </div>
                <CardDescription>
                  Ultra-rápido con chips Groq - $0.008-0.01 por minuto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="groq-api-key">API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="groq-api-key"
                      type={showKeys.groq ? "text" : "password"}
                      value={showKeys.groq ? config.groq.apiKey : maskApiKey(config.groq.apiKey)}
                      onChange={(e) => updateConfig('groq', 'apiKey', e.target.value)}
                      placeholder="gsk_xxxxxxxxxxxxxxxx"
                      disabled={!config.groq.enabled}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowKeys(prev => ({ ...prev, groq: !prev.groq }))}
                    >
                      {showKeys.groq ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="groq-model">Modelo</Label>
                  <select
                    id="groq-model"
                    className="w-full px-3 py-2 border rounded-md"
                    value={config.groq.model}
                    onChange={(e) => updateConfig('groq', 'model', e.target.value)}
                    disabled={!config.groq.enabled}
                  >
                    <option value="whisper-large-v3">Whisper Large V3 (Balance óptimo)</option>
                    <option value="distil-whisper-large-v3">Distil-Whisper (Máxima velocidad)</option>
                  </select>
                </div>

                {status.groq.latency && (
                  <div className="text-sm text-muted-foreground">
                    Latencia: {status.groq.latency}ms
                  </div>
                )}

                {status.groq.error && (
                  <Alert variant="destructive">
                    <AlertDescription>{status.groq.error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración General</CardTitle>
                <CardDescription>
                  Ajustes globales para el sistema de transcripción
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="default-provider">Proveedor por Defecto</Label>
                  <select
                    id="default-provider"
                    className="w-full px-3 py-2 border rounded-md"
                    value={config.settings.defaultProvider}
                    onChange={(e) => updateConfig('settings', 'defaultProvider', e.target.value)}
                  >
                    <option value="auto">Automático (Balanceador inteligente)</option>
                    <option value="groq">Groq (Velocidad)</option>
                    <option value="abacus">Abacus AI (Precisión)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-retries">Máximo Reintentos</Label>
                  <Input
                    id="max-retries"
                    type="number"
                    min="1"
                    max="10"
                    value={config.settings.maxRetries}
                    onChange={(e) => updateConfig('settings', 'maxRetries', parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (ms)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    min="5000"
                    max="120000"
                    step="1000"
                    value={config.settings.timeout}
                    onChange={(e) => updateConfig('settings', 'timeout', parseInt(e.target.value))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable-fallback"
                    checked={config.settings.enableFallback}
                    onCheckedChange={(checked) => 
                      updateConfig('settings', 'enableFallback', checked)
                    }
                  />
                  <Label htmlFor="enable-fallback">
                    Habilitar Fallback Automático
                  </Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Pruebas de Conexión
                </CardTitle>
                <CardDescription>
                  Verifica que las APIs estén funcionando correctamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium flex items-center gap-2">
                        <Brain className="h-4 w-4 text-purple-500" />
                        Abacus AI
                      </h3>
                      {getStatusIcon(status.abacus)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Estado: {status.abacus.status}
                    </p>
                    {status.abacus.latency && (
                      <p className="text-sm text-muted-foreground">
                        Latencia: {status.abacus.latency}ms
                      </p>
                    )}
                    {status.abacus.error && (
                      <p className="text-sm text-red-500 mt-2">
                        Error: {status.abacus.error}
                      </p>
                    )}
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium flex items-center gap-2">
                        <Zap className="h-4 w-4 text-orange-500" />
                        Groq API
                      </h3>
                      {getStatusIcon(status.groq)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Estado: {status.groq.status}
                    </p>
                    {status.groq.latency && (
                      <p className="text-sm text-muted-foreground">
                        Latencia: {status.groq.latency}ms
                      </p>
                    )}
                    {status.groq.error && (
                      <p className="text-sm text-red-500 mt-2">
                        Error: {status.groq.error}
                      </p>
                    )}
                  </div>
                </div>

                <Button 
                  onClick={testConnections} 
                  disabled={isTesting}
                  className="w-full"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Probando Conexiones...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Probar Conexiones
                    </>
                  )}
                </Button>

                {(status.abacus.status === 'healthy' || status.groq.status === 'healthy') && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      ✅ Al menos un proveedor está funcionando correctamente.
                      El sistema puede procesar transcripciones.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div>
            {saveMessage && (
              <span className={`text-sm ${saveMessage.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                {saveMessage}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadConfiguration}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Recargar
            </Button>
            <Button onClick={saveConfiguration} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Configuración
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default APIConfiguration;

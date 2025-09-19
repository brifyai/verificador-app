
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
  EyeOff,
  Cloud,
  Mic,
  Star,
  DollarSign,
  Timer
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

interface ProviderConfig {
  name: string;
  icon: any;
  color: string;
  pricing: string;
  description: string;
  features: string[];
}

const providerConfigs: { [key: string]: ProviderConfig } = {
  abacusAI: {
    name: 'Abacus AI',
    icon: Brain,
    color: 'text-purple-500',
    pricing: '$20-50/min',
    description: 'Máxima precisión para español chileno - Modelo especializado',
    features: ['Español chileno optimizado', 'Máxima precisión', 'Soporte 24/7']
  },
  groq: {
    name: 'Groq API',
    icon: Zap,
    color: 'text-orange-500',
    pricing: '$8-10/min',
    description: 'Ultra-rápido con chips Groq - Ideal para tiempo real',
    features: ['Velocidad extrema', 'Bajo costo', 'Baja latencia']
  },
  openai: {
    name: 'OpenAI Whisper',
    icon: Brain,
    color: 'text-green-500',
    pricing: '$6/min',
    description: 'El estándar de oro en transcripción - Whisper API oficial',
    features: ['Máxima calidad', 'Múltiples idiomas', 'Modelo líder']
  },
  assemblyai: {
    name: 'AssemblyAI',
    icon: Mic,
    color: 'text-blue-500',
    pricing: '$2-7/min',
    description: 'Especializado en conversación - Detección de hablantes',
    features: ['Detección de hablantes', 'Análisis de sentimientos', 'Español nativo']
  },
  deepgram: {
    name: 'Deepgram',
    icon: Timer,
    color: 'text-cyan-500',
    pricing: '$4-6/min',
    description: 'Streaming en tiempo real - Ultra bajo costo',
    features: ['Tiempo real', 'Súper económico', 'API simple']
  },
  revai: {
    name: 'Rev.ai',
    icon: Star,
    color: 'text-yellow-500',
    pricing: '$20/min',
    description: 'Calidad humana - Precisión profesional garantizada',
    features: ['Calidad humana', 'Garantía precisión', 'Soporte premium']
  },
  speechmatics: {
    name: 'Speechmatics',
    icon: Cloud,
    color: 'text-indigo-500',
    pricing: '$5-10/min',
    description: 'IA conversacional avanzada - Comprensión contextual',
    features: ['Comprensión contextual', 'Auto-puntuación', 'Múltiples acentos']
  },
  googleCloud: {
    name: 'Google Cloud Speech',
    icon: Cloud,
    color: 'text-red-500',
    pricing: '$4-16/min',
    description: 'Integración Google - Reconocimiento avanzado',
    features: ['Integración Google', 'Machine Learning', 'Escalabilidad']
  },
  awsTranscribe: {
    name: 'AWS Transcribe',
    icon: Cloud,
    color: 'text-yellow-600',
    pricing: '$0.4-24/min',
    description: 'Infraestructura Amazon - Máxima escalabilidad',
    features: ['Infraestructura AWS', 'Escalabilidad masiva', 'Integración completa']
  },
  azureSpeech: {
    name: 'Azure Speech',
    icon: Cloud,
    color: 'text-blue-600',
    pricing: '$5-15/min',
    description: 'Microsoft Azure - Empresarial y seguro',
    features: ['Seguridad empresarial', 'Compliance', 'Integración Office']
  },
  elevenlabs: {
    name: 'ElevenLabs',
    icon: Mic,
    color: 'text-violet-500',
    pricing: '$3-24/min',
    description: 'IA de voz avanzada - Transcripción y síntesis',
    features: ['IA de voz avanzada', 'Transcripción+Síntesis', 'Calidad premium']
  }
};

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
      costLimit: 100000,
      priorityOrder: ['groq', 'deepgram', 'assemblyai', 'abacusAI', 'openai']
    }
  });

  const [status, setStatus] = useState<{ [key: string]: ProviderStatus }>({
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

  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({
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
          ...data.providers
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
        headers: { 'Content-Type': 'application/json' },
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
    
    const testingStatus = Object.keys(status).reduce((acc, key) => {
      acc[key] = { status: 'testing' as const };
      return acc;
    }, {} as { [key: string]: ProviderStatus });
    
    setStatus(testingStatus);

    try {
      const response = await fetch('/api/config/test-ai-apis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const renderProviderCard = (providerId: string, configSection: keyof APIConfig) => {
    const providerConfig = providerConfigs[providerId];
    const providerData = config[configSection] as any;
    const providerStatus = status[providerId === 'abacusAI' ? 'abacus' : providerId] || { status: 'unhealthy' };

    if (!providerConfig) return null;

    const Icon = providerConfig.icon;

    return (
      <Card key={providerId} className="bg-slate-700/50 border-slate-600">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${providerConfig.color}`} />
              <div>
                <CardTitle className="text-lg text-white">{providerConfig.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {providerConfig.pricing}
                  </Badge>
                  {getStatusIcon(providerStatus)}
                  {getStatusBadge(providerStatus)}
                </div>
              </div>
            </div>
            <Switch
              checked={providerData?.enabled || false}
              onCheckedChange={(checked) => updateConfig(configSection, 'enabled', checked)}
            />
          </div>
          <CardDescription className="text-slate-300">{providerConfig.description}</CardDescription>
          <div className="flex flex-wrap gap-1 mt-2">
            {providerConfig.features.map((feature, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Key Input */}
          {providerId !== 'awsTranscribe' ? (
            <div className="space-y-2">
              <Label className="text-white">{providerId === 'azureSpeech' ? 'Subscription Key' : 'API Key'}</Label>
              <div className="flex gap-2">
                <Input
                  type={showKeys[providerId] ? "text" : "password"}
                  value={showKeys[providerId] ? (providerId === 'azureSpeech' ? providerData?.subscriptionKey || '' : providerData?.apiKey || '') : 
                         maskApiKey(providerId === 'azureSpeech' ? providerData?.subscriptionKey || '' : providerData?.apiKey || '')}
                  onChange={(e) => updateConfig(configSection, providerId === 'azureSpeech' ? 'subscriptionKey' : 'apiKey', e.target.value)}
                  placeholder={`${providerId}_xxxxxxxxxxxxxxxx`}
                  disabled={!providerData?.enabled}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowKeys(prev => ({ ...prev, [providerId]: !prev[providerId] }))}
                >
                  {showKeys[providerId] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ) : (
            // AWS specific fields
            <>
              <div className="space-y-2">
                <Label className="text-white">Access Key ID</Label>
                <div className="flex gap-2">
                  <Input
                    type={showKeys[providerId] ? "text" : "password"}
                    value={showKeys[providerId] ? (providerData?.accessKeyId || '') : maskApiKey(providerData?.accessKeyId || '')}
                    onChange={(e) => updateConfig(configSection, 'accessKeyId', e.target.value)}
                    placeholder="AKIAXXXXXXXXXXXXXXXX"
                    disabled={!providerData?.enabled}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowKeys(prev => ({ ...prev, [providerId]: !prev[providerId] }))}
                  >
                    {showKeys[providerId] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Secret Access Key</Label>
                <Input
                  type="password"
                  value={providerData?.secretAccessKey || ''}
                  onChange={(e) => updateConfig(configSection, 'secretAccessKey', e.target.value)}
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  disabled={!providerData?.enabled}
                />
              </div>
            </>
          )}

          {/* Region for cloud providers */}
          {(providerId === 'awsTranscribe' || providerId === 'azureSpeech') && (
            <div className="space-y-2">
              <Label className="text-white">Región</Label>
              <select
                className="w-full px-3 py-2 border rounded-md bg-slate-700 border-slate-600 text-white"
                value={providerData?.region || ''}
                onChange={(e) => updateConfig(configSection, 'region', e.target.value)}
                disabled={!providerData?.enabled}
              >
                {providerId === 'awsTranscribe' ? (
                  <>
                    <option value="us-east-1">US East (N. Virginia)</option>
                    <option value="us-west-2">US West (Oregon)</option>
                    <option value="eu-west-1">Europe (Ireland)</option>
                    <option value="sa-east-1">South America (São Paulo)</option>
                  </>
                ) : (
                  <>
                    <option value="eastus">East US</option>
                    <option value="westus2">West US 2</option>
                    <option value="brazilsouth">Brazil South</option>
                    <option value="westeurope">West Europe</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Base URL for Abacus AI */}
          {providerId === 'abacusAI' && (
            <div className="space-y-2">
              <Label className="text-white">Base URL</Label>
              <Input
                value={providerData?.baseUrl || ''}
                onChange={(e) => updateConfig(configSection, 'baseUrl', e.target.value)}
                disabled={!providerData?.enabled}
              />
            </div>
          )}

          {/* Model selection for providers that support it */}
          {providerData?.model !== undefined && (
            <div className="space-y-2">
              <Label className="text-white">Modelo</Label>
              <select
                className="w-full px-3 py-2 border rounded-md bg-slate-700 border-slate-600 text-white"
                value={providerData?.model || ''}
                onChange={(e) => updateConfig(configSection, 'model', e.target.value)}
                disabled={!providerData?.enabled}
              >
                {providerId === 'abacusAI' && (
                  <>
                    <option value="whisper-large-v3">Whisper Large V3 (Máxima precisión)</option>
                    <option value="whisper-medium">Whisper Medium (Balance)</option>
                    <option value="custom-chile-model">Modelo Chile (Español chileno)</option>
                  </>
                )}
                {providerId === 'groq' && (
                  <>
                    <option value="whisper-large-v3">Whisper Large V3 (Balance óptimo)</option>
                    <option value="distil-whisper-large-v3">Distil-Whisper (Máxima velocidad)</option>
                  </>
                )}
                {providerId === 'openai' && (
                  <option value="whisper-1">Whisper-1 (Estándar)</option>
                )}
                {providerId === 'assemblyai' && (
                  <>
                    <option value="best">Best (Máxima precisión)</option>
                    <option value="nano">Nano (Máxima velocidad)</option>
                  </>
                )}
                {providerId === 'deepgram' && (
                  <>
                    <option value="nova-2">Nova-2 (Última generación)</option>
                    <option value="enhanced">Enhanced (Mejorado)</option>
                    <option value="base">Base (Económico)</option>
                  </>
                )}
                {providerId === 'googleCloud' && (
                  <>
                    <option value="latest_long">Latest Long (Audio largo)</option>
                    <option value="latest_short">Latest Short (Audio corto)</option>
                    <option value="command_and_search">Command and Search</option>
                  </>
                )}
                {providerId === 'elevenlabs' && (
                  <>
                    <option value="eleven_multilingual_v2">Multilingual V2 (Último)</option>
                    <option value="eleven_english_v1">English V1 (Inglés)</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Status info */}
          {providerStatus.latency && (
            <div className="text-sm text-slate-400">
              Latencia: {providerStatus.latency}ms
            </div>
          )}

          {providerStatus.error && (
            <Alert variant="destructive">
              <AlertDescription>{providerStatus.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  const premiumProviders = ['abacusAI', 'groq', 'openai', 'revai'];
  const budgetProviders = ['deepgram', 'assemblyai', 'speechmatics', 'googleCloud', 'awsTranscribe', 'azureSpeech', 'elevenlabs'];

  const configMapping: { [key: string]: keyof APIConfig } = {
    abacusAI: 'abacusAI',
    groq: 'groq',
    openai: 'openai',
    assemblyai: 'assemblyai',
    revai: 'revai',
    deepgram: 'deepgram',
    speechmatics: 'speechmatics',
    googleCloud: 'googleCloud',
    awsTranscribe: 'awsTranscribe',
    azureSpeech: 'azureSpeech',
    elevenlabs: 'elevenlabs'
  };

  return (
    <Card className="w-full bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-400" />
          <div>
            <CardTitle className="text-white">Configuración de APIs de IA</CardTitle>
            <CardDescription className="text-slate-300">
              Configura múltiples proveedores de transcripción de audio para máxima confiabilidad y ahorro de costos
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="providers" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-700/50">
            <TabsTrigger value="providers" className="text-white data-[state=active]:bg-slate-600 data-[state=active]:text-white">Premium</TabsTrigger>
            <TabsTrigger value="budget" className="text-white data-[state=active]:bg-slate-600 data-[state=active]:text-white">Económicos</TabsTrigger>
            <TabsTrigger value="settings" className="text-white data-[state=active]:bg-slate-600 data-[state=active]:text-white">Configuración</TabsTrigger>
            <TabsTrigger value="test" className="text-white data-[state=active]:bg-slate-600 data-[state=active]:text-white">Pruebas</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-white">Proveedores Premium</h3>
              <p className="text-sm text-slate-400">
                Alta calidad y características avanzadas - Ideal para casos críticos
              </p>
            </div>
            {premiumProviders.map(providerId => 
              renderProviderCard(providerId, configMapping[providerId])
            )}
          </TabsContent>

          <TabsContent value="budget" className="space-y-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-white">Proveedores Económicos</h3>
              <p className="text-sm text-slate-400">
                Excelente relación calidad-precio - Perfecto para volúmenes altos
              </p>
            </div>
            {budgetProviders.map(providerId => 
              renderProviderCard(providerId, configMapping[providerId])
            )}
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
                  <Label className="text-white">Proveedor por Defecto</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md bg-slate-700 border-slate-600 text-white"
                    value={config?.settings?.defaultProvider || 'auto'}
                    onChange={(e) => updateConfig('settings', 'defaultProvider', e.target.value)}
                  >
                    <option value="auto">Automático (Balanceador inteligente)</option>
                    <option value="groq">Groq (Velocidad)</option>
                    <option value="deepgram">Deepgram (Económico)</option>
                    <option value="abacusAI">Abacus AI (Precisión)</option>
                    <option value="openai">OpenAI (Calidad)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Límite de Costo Mensual (CLP)</Label>
                  <Input
                    type="number"
                    min="10000"
                    max="1000000"
                    step="1000"
                    value={config?.settings?.costLimit || 100000}
                    onChange={(e) => updateConfig('settings', 'costLimit', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    El sistema pausará cuando se alcance este límite
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Máximo Reintentos</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={config?.settings?.maxRetries || 3}
                    onChange={(e) => updateConfig('settings', 'maxRetries', parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Timeout (ms)</Label>
                  <Input
                    type="number"
                    min="5000"
                    max="120000"
                    step="1000"
                    value={config?.settings?.timeout || 30000}
                    onChange={(e) => updateConfig('settings', 'timeout', parseInt(e.target.value))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config?.settings?.enableFallback || true}
                    onCheckedChange={(checked) => updateConfig('settings', 'enableFallback', checked)}
                  />
                  <Label className="text-white">Habilitar Fallback Automático</Label>
                </div>

                <div className="mt-6">
                  <Label className="text-white">Orden de Prioridad</Label>
                  <p className="text-xs text-slate-400 mb-2">
                    El sistema intentará usar los proveedores en este orden
                  </p>
                  <div className="space-y-2">
                    {(config?.settings?.priorityOrder || ['groq', 'deepgram', 'assemblyai', 'abacusAI', 'openai']).map((provider, index) => (
                      <div key={provider} className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span>{providerConfigs[provider]?.name || provider}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cost Estimation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Estimación de Costos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Para 100 horas/mes con Groq:</span>
                    <span className="font-mono">~$48,000-60,000 CLP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Para 100 horas/mes con Deepgram:</span>
                    <span className="font-mono">~$23,000-35,000 CLP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Para 100 horas/mes con AssemblyAI:</span>
                    <span className="font-mono">~$13,000-39,000 CLP</span>
                  </div>
                  <div className="border-t pt-2 mt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Ahorro vs. servicios premium:</span>
                      <span className="text-green-600">-70% a -85%</span>
                    </div>
                  </div>
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(providerConfigs).map(([providerId, provider]) => {
                    const statusKey = providerId === 'abacusAI' ? 'abacus' : providerId;
                    const providerStatus = status[statusKey] || { status: 'unhealthy' };
                    const Icon = provider.icon;
                    
                    return (
                      <div key={providerId} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${provider.color}`} />
                            {provider.name}
                          </h3>
                          {getStatusIcon(providerStatus)}
                        </div>
                        <p className="text-sm text-slate-400 mb-2">
                          Estado: {providerStatus.status}
                        </p>
                        {providerStatus.latency && (
                          <p className="text-sm text-slate-400">
                            Latencia: {providerStatus.latency}ms
                          </p>
                        )}
                        {providerStatus.error && (
                          <p className="text-sm text-red-500 mt-2">
                            Error: {providerStatus.error}
                          </p>
                        )}
                      </div>
                    );
                  })}
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
                      Probar Todas las Conexiones
                    </>
                  )}
                </Button>

                {Object.values(status).some(s => s.status === 'healthy') && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      ✅ {Object.values(status).filter(s => s.status === 'healthy').length} proveedores funcionando correctamente.
                      El sistema puede procesar transcripciones con redundancia.
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


'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  ChevronDown, 
  ChevronRight, 
  Download, 
  Terminal, 
  FileText, 
  Zap,
  Copy,
  ExternalLink
} from 'lucide-react';

interface SystemSetupGuideProps {
  dependencies: { [tool: string]: boolean };
  onRefresh?: () => void;
}

export default function SystemSetupGuide({ dependencies, onRefresh }: SystemSetupGuideProps) {
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({});
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const copyCommand = async (command: string, label: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(label);
      setTimeout(() => setCopiedCommand(null), 2000);
    } catch (error) {
      console.error('Error copiando comando:', error);
    }
  };

  const missingDeps = Object.entries(dependencies).filter(([, available]) => !available);
  const isSystemReady = Object.values(dependencies).every(Boolean);

  const installationSteps = {
    ffmpeg: {
      title: '🎵 FFmpeg (OBLIGATORIO)',
      description: 'Herramienta principal para capturar audio de streams',
      priority: 'high',
      commands: {
        ubuntu: 'sudo apt update && sudo apt install -y ffmpeg',
        centos: 'sudo yum install -y ffmpeg',
        macos: 'brew install ffmpeg'
      },
      verify: 'ffmpeg -version'
    },
    whisper: {
      title: '🤖 Whisper (OBLIGATORIO)', 
      description: 'OpenAI Whisper para transcripción de audio a texto',
      priority: 'high',
      commands: {
        ubuntu: 'pip3 install openai-whisper',
        centos: 'pip3 install openai-whisper',
        macos: 'pip3 install openai-whisper'
      },
      verify: 'python3 -c "import whisper; print(\'Whisper OK\')"'
    },
    'yt-dlp': {
      title: '📺 yt-dlp (OPCIONAL)',
      description: 'Para streams de YouTube y plataformas similares',
      priority: 'medium',
      commands: {
        ubuntu: 'pip3 install yt-dlp',
        centos: 'pip3 install yt-dlp', 
        macos: 'pip3 install yt-dlp'
      },
      verify: 'yt-dlp --version'
    },
    streamlink: {
      title: '📡 Streamlink (OPCIONAL)',
      description: 'Para streams de Twitch y otras plataformas',
      priority: 'low',
      commands: {
        ubuntu: 'sudo apt install -y streamlink',
        centos: 'pip3 install streamlink',
        macos: 'pip3 install streamlink'
      },
      verify: 'streamlink --version'
    }
  };

  return (
    <div className="space-y-4">
      {/* Estado general */}
      <Alert 
        style={{
          backgroundColor: isSystemReady ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
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
        <AlertTitle style={{ color: isSystemReady ? '#22c55e' : '#ffffff' }}>
          {isSystemReady ? '✅ Sistema Completo' : '⚠️ Configuración Requerida'}
        </AlertTitle>
        <AlertDescription style={{ color: isSystemReady ? '#86efac' : '#e5e7eb' }}>
          {isSystemReady 
            ? 'Todas las herramientas están instaladas. ¡Listo para monitorear radios!'
            : `Faltan ${missingDeps.length} herramientas para el funcionamiento completo.`
          }
        </AlertDescription>
      </Alert>

      {/* Botón de guía completa */}
      <div className="flex items-center justify-between">
        <div className="text-sm" style={{ color: '#ffffff' }}>
          Instala las herramientas necesarias para capturar y procesar audio de radios
        </div>
        <div className="flex items-center space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Guía Completa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>🛠️ Guía de Instalación Completa</DialogTitle>
              </DialogHeader>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="space-y-6">
                  <Alert className="border-blue-500/50 bg-blue-900/20">
                    <Zap className="h-4 w-4 text-blue-400" />
                    <AlertTitle className="text-blue-300">Instalación Rápida (Ubuntu/Debian)</AlertTitle>
                    <AlertDescription className="text-blue-200">
                      <div className="mt-2 p-3 bg-gray-900 rounded font-mono text-sm text-green-400">
                        sudo apt update && sudo apt install -y ffmpeg python3-pip<br/>
                        pip3 install openai-whisper yt-dlp streamlink
                      </div>
                    </AlertDescription>
                  </Alert>
                  
                  <div className="text-xs text-muted-foreground">
                    Para otras distribuciones o instalación detallada, consulta la documentación completa.
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <Download className="h-4 w-4 mr-2" />
            Verificar
          </Button>
        </div>
      </div>

      {/* Lista de herramientas */}
      <div className="grid gap-3">
        {Object.entries(installationSteps).map(([tool, config]) => {
          const isInstalled = dependencies[tool] || false;
          const isOpen = openSections[tool] || false;
          
          return (
            <Card 
              key={tool} 
              className="bg-gray-800 border-gray-600"
              style={{
                backgroundColor: '#1f2937',
                borderColor: isInstalled ? 'rgba(34, 197, 94, 0.3)' : '#4b5563'
              }}
            >
              <Collapsible open={isOpen} onOpenChange={() => toggleSection(tool)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-3 cursor-pointer hover:bg-gray-700/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {isInstalled ? (
                          <CheckCircle className="h-4 w-4" style={{ color: '#22c55e' }} />
                        ) : (
                          <AlertTriangle className="h-4 w-4" style={{ color: '#f59e0b' }} />
                        )}
                        <div>
                          <CardTitle className="text-sm text-white">{config.title}</CardTitle>
                          <div className="text-xs" style={{ color: '#9ca3af' }}>{config.description}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge 
                          style={{
                            backgroundColor: isInstalled ? '#22c55e' : '#ef4444',
                            color: 'white',
                            border: isInstalled ? '1px solid #22c55e' : '1px solid #ef4444'
                          }}
                          className="text-xs font-medium"
                        >
                          {isInstalled ? 'Instalado' : 'Faltante'}
                        </Badge>
                        <Badge 
                          style={{
                            backgroundColor: config.priority === 'high' ? '#dc2626' 
                              : config.priority === 'medium' ? '#2563eb' 
                              : '#6b7280',
                            color: 'white',
                            border: config.priority === 'high' ? '1px solid #dc2626'
                              : config.priority === 'medium' ? '1px solid #2563eb' 
                              : '1px solid #6b7280'
                          }}
                          className="text-xs font-medium"
                        >
                          {config.priority === 'high' ? 'Obligatorio' : config.priority === 'medium' ? 'Recomendado' : 'Opcional'}
                        </Badge>
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 text-white" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-white" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0" style={{ backgroundColor: '#1f2937' }}>
                    {!isInstalled && (
                      <div className="space-y-4">
                        <div className="text-xs" style={{ color: '#9ca3af' }}>
                          Comandos de instalación:
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-white">Ubuntu/Debian:</div>
                          <div className="relative">
                            <pre 
                              className="p-3 rounded text-xs font-mono overflow-x-auto"
                              style={{ 
                                backgroundColor: '#111827',
                                color: '#22c55e',
                                border: '1px solid #374151'
                              }}
                            >
                              {config.commands.ubuntu}
                            </pre>
                            <Button
                              size="sm"
                              variant="ghost" 
                              className="absolute top-1 right-1 h-6 w-6 p-0 hover:bg-gray-600"
                              onClick={() => copyCommand(config.commands.ubuntu, tool)}
                            >
                              <Copy className="h-3 w-3 text-gray-300" />
                            </Button>
                          </div>
                          {copiedCommand === tool && (
                            <div className="text-xs" style={{ color: '#22c55e' }}>✓ Copiado al portapapeles</div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="text-xs font-medium text-white">Verificar instalación:</div>
                          <div className="relative">
                            <pre 
                              className="p-3 rounded text-xs font-mono overflow-x-auto"
                              style={{ 
                                backgroundColor: '#111827',
                                color: '#3b82f6',
                                border: '1px solid #374151'
                              }}
                            >
                              {config.verify}
                            </pre>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute top-1 right-1 h-6 w-6 p-0 hover:bg-gray-600"
                              onClick={() => copyCommand(config.verify, `${tool}-verify`)}
                            >
                              <Copy className="h-3 w-3 text-gray-300" />
                            </Button>
                          </div>
                          {copiedCommand === `${tool}-verify` && (
                            <div className="text-xs" style={{ color: '#22c55e' }}>✓ Copiado al portapapeles</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {isInstalled && (
                      <div className="flex items-center space-x-2 text-sm" style={{ color: '#22c55e' }}>
                        <CheckCircle className="h-4 w-4" />
                        <span>Herramienta instalada correctamente</span>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Próximos pasos */}
      {isSystemReady && (
        <Alert className="border-blue-500/50 bg-blue-900/20">
          <Zap className="h-4 w-4 text-blue-400" />
          <AlertTitle className="text-blue-300">🎉 ¡Sistema Listo!</AlertTitle>
          <AlertDescription className="text-blue-200">
            <div className="mt-2 space-y-1">
              <div>• Ve a una radio y haz clic en "Iniciar Monitoreo"</div>
              <div>• El sistema capturará audio cada 5 minutos</div>
              <div>• La IA detectará automáticamente publicidad</div>
              <div>• Revisa las detecciones en tiempo real</div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

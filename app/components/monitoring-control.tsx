
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Play, Square, Zap, Volume2, AlertTriangle, CheckCircle, Clock, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Radio } from '@/lib/mock-data';
import SystemSetupGuide from './system-setup-guide';

interface MonitoringSession {
  id: string;
  radioId: string;
  radioName: string;
  streamUrl: string;
  platform: string;
  targetPhrases: string[];
  isActive: boolean;
  startTime: string;
  captureInterval: number;
  captureDuration: number;
  totalCaptures: number;
  advertisementsFound: number;
  lastCapture?: string;
  lastAdvertisement?: string;
}

interface DetectionEvent {
  sessionId: string;
  radioName: string;
  timestamp: string;
  transcription: string;
  analysis: {
    isAdvertisement: boolean;
    confidence: number;
    advertisementType: string;
    detectedPhrases: string[];
    brandMentions: string[];
    summary: string;
  };
  confidence: number;
}

interface SystemStatus {
  dependencies: { [tool: string]: boolean };
  activeCaptures: number;
  activeSessions: number;
  totalEvents: number;
  systemReady: boolean;
}

interface MonitoringControlProps {
  radio: Radio;
  onStatusChange?: (isMonitoring: boolean) => void;
}

export default function MonitoringControl({ radio, onStatusChange }: MonitoringControlProps) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [recentDetections, setRecentDetections] = useState<DetectionEvent[]>([]);
  
  // Estado para colapsar/expandir las secciones
  const [isSystemStatusCollapsed, setIsSystemStatusCollapsed] = useState(true);
  const [isSystemConfigCollapsed, setIsSystemConfigCollapsed] = useState(true);
  
  // Configuración del monitoreo
  const [targetPhrases, setTargetPhrases] = useState('');
  const [captureInterval, setCaptureInterval] = useState(300); // 5 minutos
  const [captureDuration, setCaptureDuration] = useState(30);  // 30 segundos

  // Verificar estado del sistema al cargar
  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000); // Cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const checkSystemStatus = async () => {
    try {
      const response = await fetch('/api/monitoring/status');
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data.systemStatus);
        setRecentDetections(data.recentDetections || []);
        
        // Verificar si esta radio está siendo monitoreada
        const activeSession = data.activeSessions.find(
          (session: MonitoringSession) => session.radioId === radio.id
        );
        
        if (activeSession && !isMonitoring) {
          setIsMonitoring(true);
          setSessionId(activeSession.id);
        } else if (!activeSession && isMonitoring) {
          setIsMonitoring(false);
          setSessionId(null);
        }
      }
    } catch (error) {
      console.error('Error obteniendo estado:', error);
    }
  };

  const startMonitoring = async () => {
    setLoading(true);
    try {
      const phrases = targetPhrases
        .split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      const response = await fetch('/api/monitoring/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          radioId: radio.id,
          radioName: radio.name,
          streamUrl: radio.streamUrl,
          platform: radio.streamPlatform,
          targetPhrases: phrases,
          captureInterval,
          captureDuration
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsMonitoring(true);
        setSessionId(data.sessionId);
        onStatusChange?.(true);
        console.log(`✅ Monitoreo iniciado: ${radio.name}`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error iniciando monitoreo:', error);
      alert('Error iniciando monitoreo');
    } finally {
      setLoading(false);
    }
  };

  const stopMonitoring = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/monitoring/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (data.success) {
        setIsMonitoring(false);
        setSessionId(null);
        onStatusChange?.(false);
        console.log(`🛑 Monitoreo detenido: ${radio.name}`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deteniendo monitoreo:', error);
      alert('Error deteniendo monitoreo');
    } finally {
      setLoading(false);
    }
  };

  const isSystemReady = systemStatus?.systemReady ?? false;

  return (
    <div className="space-y-4">
      {/* Estado del Sistema - Colapsible */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader 
          className="pb-2 cursor-pointer hover:bg-gray-750 transition-colors rounded-t-lg"
          onClick={() => setIsSystemStatusCollapsed(!isSystemStatusCollapsed)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center space-x-2 text-white">
              {systemStatus ? (
                <>
                  {isSystemReady ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                  )}
                  <span className="text-white">Sistema {isSystemReady ? 'Listo' : 'Parcial'}</span>
                  <div className="flex items-center space-x-1 ml-2">
                    <Users className="h-3 w-3 text-blue-500" />
                    <span className="text-xs text-white">{systemStatus.activeSessions} Monitoreando</span>
                  </div>
                </>
              ) : (
                <span className="text-white">Estado del Sistema</span>
              )}
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 hover:bg-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                setIsSystemStatusCollapsed(!isSystemStatusCollapsed);
              }}
            >
              {isSystemStatusCollapsed ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronUp className="h-3 w-3" />
              )}
            </Button>
          </div>
        </CardHeader>
        
        {!isSystemStatusCollapsed && (
          <CardContent className="pt-2 animate-in slide-in-from-top-2 duration-200">
            {systemStatus ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="flex items-center space-x-2">
                    {isSystemReady ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    )}
                    <span className="text-white">Sistema {isSystemReady ? 'Listo' : 'Parcial'}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Users className="h-3 w-3 text-blue-500" />
                    <span className="text-white">{systemStatus.activeSessions} Monitoreando</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] font-medium text-white">Herramientas del Sistema:</div>
                  <div className="grid grid-cols-1 gap-1">
                    {systemStatus.dependencies && Object.entries(systemStatus.dependencies).map(([tool, available]) => (
                      <div key={tool} className="flex items-center space-x-2 px-2 py-1 rounded" style={{ backgroundColor: 'rgba(31, 41, 55, 0.5)' }}>
                        {available ? (
                          <CheckCircle className="h-2 w-2 flex-shrink-0" style={{ color: '#22c55e' }} />
                        ) : (
                          <AlertTriangle className="h-2 w-2 flex-shrink-0" style={{ color: '#ef4444' }} />
                        )}
                        <span 
                          className="text-xs"
                          style={{ color: available ? '#22c55e' : '#ef4444' }}
                        >
                          {tool}
                        </span>
                        <div className="flex-1"></div>
                        <Badge 
                          style={{
                            backgroundColor: available ? '#22c55e' : '#ef4444',
                            color: 'white',
                            border: available ? '1px solid #22c55e' : '1px solid #ef4444'
                          }}
                          className="text-[9px] px-1 py-0 h-4 font-medium"
                        >
                          {available ? 'OK' : 'Error'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {systemStatus.totalEvents > 0 && (
                  <div className="pt-2 border-t border-gray-700">
                    <div className="text-[10px]" style={{ color: '#9ca3af' }}>
                      Total eventos procesados: <span className="font-medium text-white">{systemStatus.totalEvents}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs animate-pulse" style={{ color: '#9ca3af' }}>Cargando estado del sistema...</div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Guía de Configuración del Sistema - Solo cuando es crítico */}
      {systemStatus && systemStatus.dependencies && !isSystemReady && Object.values(systemStatus.dependencies).filter(Boolean).length === 0 && (
        <Card className="bg-gray-800 border-red-500/50"
          style={{ backgroundColor: 'rgba(185, 28, 28, 0.1)' }}
        >
          <CardHeader 
            className="pb-2 cursor-pointer hover:bg-red-900/20 transition-colors rounded-t-lg"
            onClick={() => setIsSystemConfigCollapsed(!isSystemConfigCollapsed)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-red-400 flex items-center space-x-2">
                <span>🚨 Sistema No Configurado</span>
                <Badge 
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: '1px solid #ef4444'
                  }}
                  className="text-xs animate-pulse font-medium"
                >
                  {systemStatus.dependencies ? Object.values(systemStatus.dependencies).filter(dep => !dep).length : 0} Faltantes
                </Badge>
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 hover:bg-red-600/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSystemConfigCollapsed(!isSystemConfigCollapsed);
                }}
              >
                {isSystemConfigCollapsed ? (
                  <ChevronDown className="h-3 w-3 text-red-400" />
                ) : (
                  <ChevronUp className="h-3 w-3 text-red-400" />
                )}
              </Button>
            </div>
          </CardHeader>
          
          {!isSystemConfigCollapsed && (
            <CardContent className="pt-2 animate-in slide-in-from-top-2 duration-200">
              <div className="text-xs mb-3" style={{ color: '#fca5a5' }}>
                Se requiere configuración inicial para funcionar.
              </div>
              <SystemSetupGuide 
                dependencies={systemStatus.dependencies || {}}
                onRefresh={checkSystemStatus}
              />
            </CardContent>
          )}
        </Card>
      )}

      {/* Control de Monitoreo */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center space-x-2 text-white">
            <Volume2 className="h-4 w-4" />
            <span>Monitoreo en Tiempo Real</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!isMonitoring ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  className="w-full" 
                  size="sm"
                  disabled={!isSystemReady || loading}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar Monitoreo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configurar Monitoreo - {radio.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="targetPhrases">Frases Objetivo (opcional)</Label>
                    <Textarea
                      id="targetPhrases"
                      placeholder="Una frase por línea...&#10;Ejemplo: Coca-Cola&#10;Descuento especial"
                      value={targetPhrases}
                      onChange={(e) => setTargetPhrases(e.target.value)}
                      rows={4}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="interval">Intervalo (segundos)</Label>
                      <Input
                        id="interval"
                        type="number"
                        value={captureInterval}
                        onChange={(e) => setCaptureInterval(Number(e.target.value))}
                        min={60}
                        max={3600}
                      />
                      <div className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                        Tiempo entre capturas
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="duration">Duración (segundos)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={captureDuration}
                        onChange={(e) => setCaptureDuration(Number(e.target.value))}
                        min={15}
                        max={120}
                      />
                      <div className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                        Duración de cada captura
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={startMonitoring} 
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? 'Iniciando...' : 'Iniciar Monitoreo'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge 
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: '1px solid #ef4444'
                  }}
                  className="animate-pulse font-medium"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Monitoreando
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={stopMonitoring}
                  disabled={loading}
                >
                  <Square className="h-4 w-4 mr-2" />
                  Detener
                </Button>
              </div>
              
              <div className="text-xs" style={{ color: '#9ca3af' }}>
                <div>Intervalo: {captureInterval}s | Duración: {captureDuration}s</div>
                <div>Sesión: {sessionId?.slice(-8)}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detecciones Recientes */}
      {recentDetections && recentDetections.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white">Detecciones Recientes</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {(recentDetections || []).slice(0, 3).map((detection, index) => (
                <div key={index} className="border border-gray-600 bg-gray-700/50 rounded p-2 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{detection.radioName}</span>
                    <Badge 
                      style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: '1px solid #3b82f6'
                      }}
                      className="text-[10px] font-medium"
                    >
                      {Math.round(detection.confidence * 100)}%
                    </Badge>
                  </div>
                  <div className="text-[10px] mb-1" style={{ color: '#9ca3af' }}>
                    <Clock className="h-2 w-2 inline mr-1" />
                    {new Date(detection.timestamp).toLocaleString('es-CL')}
                  </div>
                  <div className="text-[10px]">
                    {detection.analysis?.summary?.slice(0, 100) || 'Sin resumen disponible'}...
                  </div>
                  {detection.analysis?.brandMentions && detection.analysis.brandMentions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {detection.analysis.brandMentions.map((brand, i) => (
                        <Badge 
                          key={i} 
                          style={{
                            backgroundColor: 'transparent',
                            color: '#9ca3af',
                            border: '1px solid #6b7280'
                          }}
                          className="text-[9px] px-1 py-0 font-medium"
                        >
                          {brand}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

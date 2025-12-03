'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Radio } from '@/lib/mock-data';
import { MONITORING_CAPABILITIES } from '@/lib/streaming-platforms';
import { recordingService } from '@/lib/recording-service';
import { recordingStateManager } from '@/lib/recording-state-manager';
import { streamVerifierVPS } from '@/lib/stream-verifier-vps';
import { streamVerifierBrowser } from '@/lib/stream-verifier-browser';
import { streamVerifierCombined } from '@/lib/stream-verifier-combined';
import { streamVerifier } from '@/stream-verifier-fixed';
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';
import { useState, useEffect } from 'react';
import {
  Play, Pause, Edit, Trash2, Globe, MapPin, Zap, Clock,
  Volume2, Settings, DollarSign, Loader, RefreshCw, Circle, Square
} from 'lucide-react';

interface RadioCardProps {
  radio: Radio;
  isPlaying: boolean;
  isLoading: boolean;
  onToggleStatus: () => void;
  onPlay: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onVerify?: (radioId: string) => void;
  isVerifying?: boolean;
  getPlatformIcon: (platform: string) => JSX.Element;
  getPlatformName: (platform: string) => string;
  isSelected?: boolean;
  onSelect?: (radioId: string) => void;
}

export function RadioCard({
  radio,
  isPlaying,
  isLoading,
  onToggleStatus,
  onPlay,
  onEdit,
  onDelete,
  onVerify,
  isVerifying = false,
  getPlatformIcon,
  getPlatformName,
  isSelected = false,
  onSelect,
}: RadioCardProps) {
  const [recordingLoading, setRecordingLoading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState('00:00');
  const [recordingUpdateCounter, setRecordingUpdateCounter] = useState(0);
  const [localRecordingStart, setLocalRecordingStart] = useState<Date | null>(null);
  const toast = useEnhancedToast();

  // ✅ CORRECCIÓN: Usar RecordingStateManager en lugar de estado local
  const isRecording = recordingStateManager?.isRecording(radio.id.toString()) || false;
  const recordingData = recordingStateManager?.getRecordingStatus(radio.id.toString());
  const recordingStartTime = recordingData?.start_time ? new Date(recordingData.start_time) : null;
  
  // ✅ PRIORIDAD: Usar tiempo local si está disponible, sino usar tiempo del VPS
  const effectiveStartTime = localRecordingStart || recordingStartTime;
  
  // ✅ SOLUCIÓN TEMPORAL: Forzar actualización inmediata del cronómetro
  const [forceUpdate, setForceUpdate] = useState(0);

  // ✅ CORRECCIÓN: Suscribirse a cambios del RecordingStateManager
  useEffect(() => {
    if (!recordingStateManager) return;
    
    const unsubscribe = recordingStateManager.subscribe(() => {
      // Force re-render when recording state changes
      console.log('🔄 RadioCard: Estado de grabación actualizado para radio:', radio.id);
      setRecordingUpdateCounter(prev => prev + 1);
      
      // Si la radio comenzó a grabar, forzar actualización inmediata del cronómetro
      const newRecordingStatus = recordingStateManager?.isRecording(radio.id.toString());
      if (newRecordingStatus && !isRecording) {
        console.log('🎬 RadioCard: Nueva grabación detectada, forzando actualización del cronómetro');
        setRecordingUpdateCounter(prev => prev + 1);
      }
    });
    
    return unsubscribe;
  }, [radio.id, isRecording]);

  // Temporizador para actualizar duración de grabación
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // ✅ PRIORIDAD: Usar tiempo local si está disponible, sino usar tiempo del VPS
    const effectiveStartTime = localRecordingStart || recordingStartTime;
    
    if (isRecording && effectiveStartTime) {
      const updateDuration = () => {
        try {
          const now = new Date();
          const startTime = new Date(effectiveStartTime);
          
          // Validar que el tiempo de inicio sea válido
          if (isNaN(startTime.getTime())) {
            console.warn('❌ Tiempo de inicio de grabación inválido:', effectiveStartTime);
            setRecordingDuration('00:00');
            return;
          }
          
          // Calcular diferencia en milisegundos
          const diffMs = now.getTime() - startTime.getTime();
          
          // Validar que la diferencia sea positiva y razonable
          if (diffMs < 0) {
            console.warn('❌ Tiempo transcurrido negativo:', diffMs);
            setRecordingDuration('00:00');
            return;
          }
          
          // Limitar duración máxima a 24 horas
          const maxDuration = 24 * 60 * 60 * 1000; // 24 horas en ms
          const validDiffMs = Math.min(diffMs, maxDuration);
          
          // Convertir a minutos y segundos
          const totalSeconds = Math.floor(validDiffMs / 1000);
          const minutes = Math.floor(totalSeconds / 60);
          const seconds = totalSeconds % 60;
          
          const newDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          
          // Siempre actualizar para asegurar que el cronómetro funcione
          setRecordingDuration(newDuration);
          
          console.log(`⏱️ Cronómetro actualizado para radio ${radio.id}: ${newDuration} (inicio: ${startTime.toISOString()}, local: ${!!localRecordingStart})`);
          
        } catch (error) {
          console.error('❌ Error calculando duración de grabación:', error);
          setRecordingDuration('00:00');
        }
      };

      // Actualizar inmediatamente
      updateDuration();
      
      // Actualizar cada segundo
      interval = setInterval(updateDuration, 1000);
      
      console.log('⏱️ Cronómetro iniciado para radio:', radio.id, 'Inicio:', effectiveStartTime, 'Local:', !!localRecordingStart);
    } else {
      setRecordingDuration('00:00');
      console.log('⏱️ Cronómetro detenido para radio:', radio.id);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording, effectiveStartTime, recordingDuration, radio.id, recordingUpdateCounter, localRecordingStart]);

  const handleStopRecording = async () => {
    if (!isRecording) return;
    
    setRecordingLoading(true);
    try {
      const result = await recordingService.stopRecording(radio.id);
      
      if (result.success) {
        toast.success('⏹️ Grabación detenida');
      } else {
        toast.error(`Error al detener grabación: ${result.message}`);
      }
    } catch (error) {
      toast.error('Error al detener grabación');
      console.error('Error:', error);
    } finally {
      setRecordingLoading(false);
    }
  };

  const handlePlayWithRecording = async () => {
    console.log('🎯 === INICIO handlePlayWithRecording ===');
    console.log('🎵 Botón Grabar presionado:', {
      radioId: radio.id,
      radioName: radio.name,
      isActive: radio.isActive,
      isRecording,
      isPlaying,
      hasStreamUrl: !!radio.streamUrl,
      streamUrl: radio.streamUrl,
      timestamp: new Date().toISOString(),
      recordingServiceAvailable: !!recordingService,
      streamVerifierAvailable: !!streamVerifier,
      onPlayAvailable: !!onPlay,
      onPlayFunction: typeof onPlay,
      onPlayToString: onPlay.toString()
    });

    try {
      console.log('🎵 Funcionalidad de reproducción de audio deshabilitada. Solo grabación.');
      
      // 1. Manejar grabación (independiente de la reproducción de audio)
      if (radio.isActive && !isRecording) {
        console.log('🔍 Condiciones para grabar cumplidas, procediendo...');
        setRecordingLoading(true);
        
        // Verificar el streaming primero
        console.log('🔍 Verificando streaming antes de grabar...');
        console.log('🔍 Llamando a streamVerifier.verifyStreamBeforeRecording con:', {
          radioId: radio.id,
          streamUrl: radio.streamUrl,
          radioName: radio.name
        });
        
        let verificationResult;
        
        try {
          // Usar el nuevo verificador sin errores CORS
          const streamResult = await streamVerifier.verifyStreamBeforeRecording(
            radio.streamUrl,
            radio.name
          );
          
          console.log('✅ Verificación exitosa con nuevo verificador');
          console.log('📊 Resultado:', streamResult);
          
          // Convertir el resultado del nuevo verificador al formato esperado
          verificationResult = {
            status: streamResult.success ? 'ONLINE' as const : 'OFFLINE' as const,
            details: streamResult.message,
            responseTime: 0,
            method: 'PROXY' as const
          };
          
        } catch (error) {
          console.error('❌ Falló verificación:', error);
          
          // Si todo falla, permitir grabación con advertencia
          verificationResult = {
            status: 'ONLINE' as const,
            details: 'No se pudo verificar técnicamente, pero se permite grabación',
            responseTime: 0,
            method: 'FALLBACK' as const
          };
          
          console.log('⚠️ Usando modo fallback por seguridad');
          toast.warning('No se pudo verificar el streaming, pero se iniciará la grabación');
        }
        
        console.log('🔍 Resultado de verificación de streaming:', verificationResult);
        
        if (verificationResult.status === 'ONLINE') {
          console.log('✅ Streaming verificado, iniciando grabación...');
          
          // Mostrar mensaje amigable al usuario
          const userMessage = `✅ Streaming verificado: ${radio.name} está online`;
          toast.info(userMessage);
          
          // Si el streaming está online, iniciar grabación
          console.log('🔍 Llamando a recordingService.startRecording con:', {
            radioId: radio.id,
            radioName: radio.name,
            streamUrl: radio.streamUrl
          });
          
          const result = await recordingService.startRecording({
            radio_id: radio.id,
            stream_url: radio.streamUrl,
            duration: 3600 // 1 hora por defecto
          });
          
          console.log('🔴 Resultado de grabación:', result);
          
          if (result.success) {
            console.log('✅ Grabación iniciada exitosamente');
            toast.success(`🔴 Grabación iniciada: ${radio.name}`);
            
            // ✅ SOLUCIÓN INMEDIATA: Iniciar cronómetro local inmediatamente
            setLocalRecordingStart(new Date());
            setRecordingDuration('00:00');
            
            // Actualizar estado de grabaciones inmediatamente
            recordingStateManager?.forceUpdate();
          } else {
            console.log('❌ Error al iniciar grabación:', result.message);
            
            // Manejo específico para errores del VPS
            if ((result as any).details?.error_type === 'RADIO_NOT_REGISTERED') {
              toast.error(`🚫 ${radio.name} no está registrada en el sistema de grabación`, {
                description: 'Esta radio debe ser configurada manualmente en el servidor de grabación VPS',
                action: {
                  label: 'Más información',
                  onClick: () => {
                    console.log('Detalles del error:', (result as any).details);
                  }
                }
              });
            } else {
              toast.error(`Error al iniciar grabación: ${result.message}`);
            }
          }
        } else {
          console.log('❌ Streaming no disponible:', verificationResult.details);
          toast.error(`Streaming no disponible: ${verificationResult.details}`);
        }
        
        setRecordingLoading(false);
      } else if (isRecording) {
        // Si ya está grabando, detener la grabación
        console.log('⏹️ Deteniendo grabación...');
        setRecordingLoading(true);
        
        console.log('🔍 Llamando a recordingService.stopRecording con:', {
          radioId: radio.id
        });
        
        const result = await recordingService.stopRecording(radio.id);
        
        console.log('⏹️ Resultado de detener grabación:', result);
        
        if (result.success) {
          console.log('✅ Grabación detenida exitosamente');
          toast.success('⏹️ Grabación detenida');
          // Actualizar estado de grabaciones inmediatamente
          recordingStateManager?.forceUpdate();
        } else {
          console.log('❌ Error al detener grabación:', result.message);
          toast.error(`Error al detener grabación: ${result.message}`);
        }
        setRecordingLoading(false);
      } else {
        console.log('ℹ️ No se puede grabar: radio inactiva o ya grabando');
      }
    } catch (error) {
      console.error('💥 Error en handlePlayWithRecording:', error);
      console.error('💥 Stack del error:', error instanceof Error ? error.stack : 'Sin stack trace');
      toast.error('Error al controlar grabación');
      setRecordingLoading(false);
    }
  };

  // Función para capitalizar el nombre de la ciudad correctamente
  const capitalizeCity = (city: string | null | undefined): string => {
    if (!city) return '';
    
    // Convertir a minúsculas primero
    const lowerCase = city.toLowerCase();
    
    // Capitalizar la primera letra
    return lowerCase.charAt(0).toUpperCase() + lowerCase.slice(1);
  };

  return (
    <Card
      className={`h-full bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 relative group flex flex-col ${
        isPlaying ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20' : ''
      } ${isSelected ? 'ring-2 ring-green-500 shadow-lg shadow-green-500/20' : ''}`}
    >
      {/* Botón de eliminar en la esquina superior derecha */}
      <Button
        size="sm"
        variant="ghost"
        onClick={onDelete}
        className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 hover:text-white z-10"
        title="Eliminar radio"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
      
      <CardHeader className="pb-4 pr-12">
        <div className="flex items-center space-x-4">
          {/* Checkbox de selección blanco a la izquierda */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect?.(radio.id)}
            className="w-5 h-5 text-green-600 bg-white border-gray-300 rounded focus:ring-green-500 focus:ring-2"
            title={isSelected ? 'Radio seleccionada' : 'Seleccionar radio'}
          />
          
          {/* Círculo de estado en el centro */}
          <div
            className={`w-4 h-4 rounded-full ${
              radio.last_verification_status === 'ONLINE' ? 'bg-green-500' :
              radio.last_verification_status === 'OFFLINE' ? 'bg-red-500' :
              radio.last_verification_status === 'UNKNOWN' ? 'bg-yellow-500' :
              'bg-gray-400'
            }`}
            title={`Estado: ${radio.last_verification_status || 'DESCONOCIDO'}`}
          />
          
          {/* Nombre de la radio a la derecha */}
          <div className="flex-1">
            <CardTitle className="text-lg text-white leading-tight font-semibold">{radio.name}</CardTitle>
            <CardDescription className="text-gray-400 font-medium">
              {radio.programadora}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 flex flex-col flex-1 flex-grow">
        {/* Información básica */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center space-x-2 bg-gray-700/30 rounded-lg px-3 py-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <span className="text-white font-medium">{radio.frequency}</span>
          </div>
          <div className="flex items-center space-x-2 bg-gray-700/30 rounded-lg px-3 py-2">
            <MapPin className="h-4 w-4 text-emerald-400" />
            <span className="text-white font-medium">{capitalizeCity(radio.city)}</span>
          </div>
        </div>
        
        {/* Información adicional - Género y plataforma */}
        
        {/* Género y plataforma */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 font-medium px-3 py-1">
              {radio.genre}
            </Badge>
            <div className="flex items-center space-x-2 bg-gray-700/50 px-3 py-1 rounded-lg">
              {getPlatformIcon(radio.streamPlatform)}
              <span className="text-gray-300 text-sm font-medium">{getPlatformName(radio.streamPlatform)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Switch para activar/desactivar radio */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400 font-medium">
                {radio.isActive ? 'Activa' : 'Inactiva'}
              </span>
              <Switch
                checked={radio.isActive}
                onCheckedChange={onToggleStatus}
                className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-600"
              />
            </div>
            {radio.website && (
              <a 
                href={radio.website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-400 hover:text-blue-300 transition-colors p-2 hover:bg-blue-500/10 rounded-lg"
              >
                <Globe className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
        
        
        
        <Separator className="bg-gray-600" />
        
        {/* Botones de acción */}
        <div className="flex items-center justify-between">
          <Button
            size="sm"
            variant={isPlaying ? "default" : "outline"}
            onClick={handlePlayWithRecording}
            className={`${
              isPlaying
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                : "bg-blue-500/20 text-white hover:bg-blue-600/10 hover:text-white"
            } transition-all duration-200`}
            disabled={!radio.isActive || isLoading || recordingLoading}
          >
            {isLoading || recordingLoading ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                {recordingLoading ? 'Procesando...' : 'Cargando...'}
              </>
            ) : isPlaying ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                {isRecording ? 'Detener Grabación' : 'Detener'}
              </>
            ) : (
              <>
                {isRecording ? (
                  <>
                    <Circle className="h-4 w-4 mr-2 text-red-500 animate-pulse" />
                    <span className="flex items-center space-x-1">
                      <span>Grabando</span>
                      <span className="text-xs bg-red-500/20 px-1 rounded font-mono">
                        {recordingDuration}
                      </span>
                    </span>
                  </>
                ) : (
                  <>
                    <Circle className="h-4 w-4 mr-2 text-red-500" />
                    Grabar
                  </>
                )}
              </>
            )}
          </Button>
          
          <div className="flex items-center space-x-2">
            {onVerify && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onVerify(radio.id)}
                disabled={isVerifying}
                className="text-blue-500 bg-gray-700 hover:text-white hover:bg-blue-500/10 border-blue-600/50 transition-all duration-200"
                title="Verificar stream"
              >
                {isVerifying ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            )}
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onEdit} 
              className="text-yellow-500 bg-gray-700 hover:text-white hover:bg-yellow-500/10 border-yellow-600/50 transition-all duration-200"
            >
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
            
          </div>
        </div>
        
        {/* Stream URL - Se mantiene en la parte inferior */}
        <div className="bg-gray-700/20 rounded-lg p-3 mt-auto flex-shrink-0">
          <div className="text-xs text-gray-400 mb-2 font-medium">Stream URL:</div>
          <div className="text-xs text-gray-300 truncate font-mono bg-gray-800/50 px-2 py-1 rounded">
            {radio.streamUrl}
          </div>
        </div>
        
        {/* Capacidades de monitoreo - Se mantiene en la parte inferior */}
        <div className="flex flex-wrap gap-2 mt-auto flex-shrink-0">
          {MONITORING_CAPABILITIES[radio.streamPlatform]?.audioCapture && (
            <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
              <Volume2 className="h-3 w-3" />
              <span>Audio</span>
            </span>
          )}
          {MONITORING_CAPABILITIES[radio.streamPlatform]?.apiAccess && (
            <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Settings className="h-3 w-3" />
              <span>API</span>
            </span>
          )}
          {MONITORING_CAPABILITIES[radio.streamPlatform]?.realTimeMetrics && (
            <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Zap className="h-3 w-3" />
              <span>Métricas</span>
            </span>
          )}
          {MONITORING_CAPABILITIES[radio.streamPlatform]?.monetization && (
            <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <DollarSign className="h-3 w-3" />
              <span>Monetización</span>
            </span>
          )}
          {MONITORING_CAPABILITIES[radio.streamPlatform]?.autoDJ && (
            <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Play className="h-3 w-3" />
              <span>AutoDJ</span>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

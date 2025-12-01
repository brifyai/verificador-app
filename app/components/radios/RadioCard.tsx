'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Radio } from '@/lib/mock-data';
import { MONITORING_CAPABILITIES } from '@/lib/streaming-platforms';
import { recordingService } from '@/lib/recording-service';
import { streamVerifierVPS } from '@/lib/stream-verifier-vps';
import { streamVerifierBrowser } from '@/lib/stream-verifier-browser';
import { streamVerifierCombined } from '@/lib/stream-verifier-combined';
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';
import { fixVpsTimezone } from '@/lib/timer-fix-improved';
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
}: RadioCardProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingLoading, setRecordingLoading] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null);
  const [recordingDuration, setRecordingDuration] = useState('00:00');
  const [lastRecordingStart, setLastRecordingStart] = useState<Date | null>(null);
  const toast = useEnhancedToast();

  // Función para capitalizar el nombre de la ciudad correctamente
  const capitalizeCity = (city: string | null | undefined): string => {
    if (!city) return '';
    
    // Convertir a minúsculas primero
    const lowerCase = city.toLowerCase();
    
    // Capitalizar la primera letra
    return lowerCase.charAt(0).toUpperCase() + lowerCase.slice(1);
  };

  // Verificar estado de grabación al montar (solo una vez)
  useEffect(() => {
    checkRecordingStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar el componente


  // Temporizador para actualizar duración de grabación
  useEffect(() => {
    console.log('⏰ Temporizador useEffect ejecutado:', {
      isRecording,
      recordingStartTime,
      hasStartTime: !!recordingStartTime
    });

    let interval: NodeJS.Timeout;
    
    if (isRecording && recordingStartTime) {
      console.log('⏰ Iniciando temporizador con startTime:', recordingStartTime);
      
      // Actualizar inmediatamente antes de iniciar el intervalo
      const updateDuration = () => {
        const now = new Date();
        let diff = now.getTime() - recordingStartTime.getTime();
        
        console.log('⏰ DEBUG Temporizador:', {
          now: now.toISOString(),
          nowTime: now.getTime(),
          recordingStartTime: recordingStartTime.toISOString(),
          recordingStartTimeTime: recordingStartTime.getTime(),
          diff: diff,
          diffSeconds: diff / 1000
        });
        
        // SOLUCIÓN MEJORADA: Ser más permisivo con los desfases
        
        // Caso 1: Solo corregir diferencias MUY negativas (más de 30 segundos en el futuro)
        if (diff < -30000) {
          console.warn('⚠️ Diferencia MUY negativa detectada (>30s):', diff);
          console.log('🔧 Usando tiempo actual del navegador');
          // Crear un nuevo tiempo de inicio basado en el tiempo actual
          const correctedStartTime = new Date(now.getTime() - 1000); // 1 segundo atrás para que empiece en 00:01
          setRecordingStartTime(correctedStartTime);
          diff = 1000; // 1 segundo de diferencia
        }
        // Caso 2: Pequeñas diferencias negativas (hasta 30 segundos) - PERMITIR que avancen
        else if (diff < 0 && diff >= -30000) {
          console.log('ℹ️ Pequeña diferencia negativa permitida:', diff);
          // Convertir a positivo para que el tiempo avance desde 0
          diff = Math.abs(diff);
          console.log('🔧 Convertido a positivo:', diff);
        }
        // Caso 3: Diferencias normales (positivas) - procesar normalmente
        else if (diff >= 0) {
          console.log('✅ Diferencia normal, procesando:', diff);
          // No hacer nada, procesar normalmente
        }
        
        // Caso 4: Diferencia demasiado grande (más de 24 horas) - limitar
        if (diff > 24 * 60 * 60 * 1000) {
          console.warn('⚠️ Diferencia demasiado grande (>24h), limitando a 24h');
          diff = 24 * 60 * 60 * 1000;
        }
        
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        const newDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        console.log('⏰ Actualizando duración:', newDuration, { now, diff, minutes, seconds });
        setRecordingDuration(newDuration);
      };

      // Actualizar inmediatamente
      updateDuration();
      
      // Luego iniciar el intervalo
      interval = setInterval(updateDuration, 1000);
      
      console.log('⏰ Temporizador iniciado con intervalo de 1 segundo');
    } else {
      console.log('⏰ Temporizador detenido o condiciones no cumplidas');
      setRecordingDuration('00:00');
    }
    
    return () => {
      if (interval) {
        console.log('⏰ Limpiando temporizador');
        clearInterval(interval);
      }
    };
  }, [isRecording, recordingStartTime]);

  const handleStopRecording = async () => {
    if (!isRecording) return;
    
    setRecordingLoading(true);
    try {
      const result = await recordingService.stopRecording(radio.id);
      
      if (result.status === 'success') {
        setIsRecording(false);
        setRecordingStartTime(null);
        setRecordingDuration('00:00');
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

  // Detener grabación cuando la radio se desactiva
  useEffect(() => {
    if (!radio.isActive && isRecording) {
      handleStopRecording();
    }
  }, [radio.isActive, isRecording]);


  const checkRecordingStatus = async () => {
    console.log('🔍 Verificando estado de grabación para radio:', radio.id);
    
    try {
      const result = await recordingService.getActiveRecordings();
      console.log('🔍 Resultado de grabaciones activas:', result);
      
      const status = recordingService.isRecording(radio.id);
      const recordingData = recordingService.getRecordingStatus(radio.id);
      
      console.log('🔍 Estado de grabación para esta radio:', {
        radioId: radio.id,
        isRecording: status,
        recordingData: recordingData,
        allRecordings: recordingService.getLocalRecordingState()
      });
      
      setIsRecording(status);
      
      if (status && recordingData?.startTime) {
        console.log('🔍 Estableciendo tiempo de inicio:', recordingData.startTime);
        console.log('🔍 Tipo de startTime:', typeof recordingData.startTime);
        console.log('🔍 Valor de startTime:', recordingData.startTime);
        
        // Asegurarse de que sea un objeto Date válido
        let startTimeDate: Date;
        if (recordingData.startTime instanceof Date) {
          startTimeDate = recordingData.startTime;
        } else if (typeof recordingData.startTime === 'string') {
          // CORRECCIÓN: Aplicar fix de zona horaria para el VPS
          startTimeDate = fixVpsTimezone(recordingData.startTime);
        } else if (typeof recordingData.startTime === 'number') {
          startTimeDate = new Date(recordingData.startTime);
        } else {
          console.warn('⚠️ Tipo de startTime no reconocido, usando fecha actual');
          startTimeDate = new Date();
        }
        
        console.log('🔍 Fecha final establecida:', startTimeDate.toISOString());
        setRecordingStartTime(startTimeDate);
      } else {
        // IMPORTANTE: No limpiar si acabamos de iniciar grabación recientemente
        const timeSinceLastStart = lastRecordingStart ? new Date().getTime() - lastRecordingStart.getTime() : Infinity;
        const isRecentStart = timeSinceLastStart < 5000; // 5 segundos
        
        if (!isRecentStart) {
          console.log('🔍 Limpiando tiempo de inicio (no es inicio reciente)');
          setRecordingStartTime(null);
          setRecordingDuration('00:00');
        } else {
          console.log('🔍 Manteniendo tiempo de inicio (inicio reciente detectado)');
        }
      }
    } catch (error) {
      console.error('❌ Error verificando estado de grabación:', error);
    }
  };

  // Detener grabación cuando la radio se desactiva
  useEffect(() => {
    if (!radio.isActive && isRecording) {
      handleStopRecording();
    }
  }, [radio.isActive, isRecording]);

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
      streamVerifierAvailable: !!streamVerifierVPS,
      onPlayAvailable: !!onPlay,
      onPlayFunction: typeof onPlay,
      onPlayToString: onPlay.toString()
    });

    try {
      // Solo manejar grabación, eliminar reproducción de audio
      console.log('🎵 Funcionalidad de reproducción de audio deshabilitada. Solo grabación.');
      
      // 1. Manejar grabación (independiente de la reproducción de audio)
      if (radio.isActive && !isRecording) {
        console.log('🔍 Condiciones para grabar cumplidas, procediendo...');
        setRecordingLoading(true);
        
        // Verificar el streaming primero
        console.log('🔍 Verificando streaming antes de grabar...');
        console.log('🔍 Llamando a streamVerifierCombined.verifyStreamWithFallback con:', {
          radioId: radio.id,
          streamUrl: radio.streamUrl,
          radioName: radio.name
        });
        
        let verificationResult;
        
        try {
          // Usar el verificador combinado (VPS + navegador + fallback)
          verificationResult = await streamVerifierCombined.verifyStreamWithFallback(
            radio.id,
            radio.streamUrl,
            radio.name
          );
          
          console.log('✅ Verificación combinada exitosa');
          console.log('📊 Método usado:', verificationResult.method);
          console.log('📊 Resultado:', verificationResult.status);
          
        } catch (error) {
          console.error('❌ Falló verificación combinada:', error);
          
          // Si todo falla, permitir grabación con advertencia
          verificationResult = {
            status: 'ONLINE' as const,
            details: 'No se pudo verificar técnincamente, pero se permite grabación',
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
          const userMessage = streamVerifierCombined.getUserFriendlyMessage(verificationResult);
          toast.info(userMessage);
          
          // Si el streaming está online, iniciar grabación
          console.log('🔍 Llamando a recordingService.startRecording con:', {
            radioId: radio.id,
            radioName: radio.name
          });
          
          const result = await recordingService.startRecording(radio.id, radio.name);
          
          console.log('🔴 Resultado de grabación:', result);
          
          if (result.status === 'success') {
            console.log('✅ Grabación iniciada exitosamente');
            setIsRecording(true);
            
            // ESTABLECER TIEMPO DE INICIO CORRECTO DESDE LA RESPUESTA
            if (result.start_time) {
              const startTime = new Date(result.start_time);
              console.log('⏰ Estableciendo tiempo de inicio desde respuesta:', startTime.toISOString());
              setRecordingStartTime(startTime);
              setLastRecordingStart(startTime);
            } else {
              // Fallback a tiempo actual si no hay start_time
              const now = new Date();
              console.log('⏰ Usando tiempo actual como fallback');
              setRecordingStartTime(now);
              setLastRecordingStart(now);
            }
            
            // Forzar actualización del estado después de un delay para sincronizar con servidor
            setTimeout(() => {
              console.log('🔄 Forzando actualización de estado después de inicio');
              checkRecordingStatus();
            }, 2000);
            
            toast.success(`🔴 Grabación iniciada: ${radio.name}`);
          } else {
            console.log('❌ Error al iniciar grabación:', result.message);
            toast.error(`Error al iniciar grabación: ${result.message}`);
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
        
        if (result.status === 'success') {
          console.log('✅ Grabación detenida exitosamente');
          setIsRecording(false);
          toast.success('⏹️ Grabación detenida');
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
  return (
    <Card
      className={`bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 relative group ${
        isPlaying ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20' : ''
      }`}
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
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center space-x-2">
              {(() => {
                const verificationStatus = (radio as any).lastVerificationStatus as 'ONLINE' | 'OFFLINE' | undefined;
                const isOnline = verificationStatus === 'ONLINE';
                const isOffline = verificationStatus === 'OFFLINE';
                const hasVerification = !!verificationStatus;
                const dotClass = hasVerification
                  ? (isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500')
                  : (radio.isActive ? 'bg-yellow-500 animate-pulse' : 'bg-white');
                const title = hasVerification
                  ? (isOnline ? 'Online' : 'Offline')
                  : (radio.isActive ? 'Activo' : 'Inactivo');
                return (
                  <div
                    className={`w-3 h-3 rounded-full ${dotClass}`}
                    title={title}
                  />
                );
              })()}
              <CardTitle className="text-lg text-white leading-tight font-semibold">{radio.name}</CardTitle>
              {/* Eliminado indicador duplicado de verificación para mantener un solo punto */}
            </div>
            <CardDescription className="text-gray-400 font-medium">
              {radio.programadora}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-3">
            <Switch
              checked={radio.isActive}
              onCheckedChange={onToggleStatus}
              className="data-[state=checked]:bg-green-600"
            />
            <Badge
              className={`font-medium px-3 py-1 ${
                radio.isActive
                  ? 'bg-green-500/20 text-green-400 border-green-500/50'
                  : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
              }`}
            >
              {radio.isActive ? 'Activa' : 'Inactiva'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
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
        
        {/* Stream URL */}
        <div className="bg-gray-700/20 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-2 font-medium">Stream URL:</div>
          <div className="text-xs text-gray-300 truncate font-mono bg-gray-800/50 px-2 py-1 rounded">
            {radio.streamUrl}
          </div>
        </div>
        
        {/* Capacidades de monitoreo */}
        <div className="flex flex-wrap gap-2">
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

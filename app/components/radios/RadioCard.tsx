'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Radio } from '@/lib/mock-data';
import { MONITORING_CAPABILITIES } from '@/lib/streaming-platforms';
import { 
  Play, Pause, Edit, Trash2, Globe, MapPin, Zap, Clock, 
  Volume2, Settings, DollarSign, Loader, RefreshCw 
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
  return (
    <Card 
      className={`bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 ${
        isPlaying ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20' : ''
      }`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${radio.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
              <CardTitle className="text-lg text-white leading-tight font-semibold">{radio.name}</CardTitle>
              {/* Indicador de verificación de stream */}
              {(radio as any).lastVerificationStatus && (
                <div 
                  className={`w-2 h-2 rounded-full ${
                    (radio as any).lastVerificationStatus === 'ONLINE' 
                      ? 'bg-green-400' 
                      : 'bg-red-400'
                  }`}
                  title={`Stream ${(radio as any).lastVerificationStatus === 'ONLINE' ? 'en línea' : 'fuera de línea'}`}
                />
              )}
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
            <span className="text-white font-medium">{radio.city}</span>
          </div>
        </div>
        
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
        
        {/* Último monitoreo y verificación */}
        <div className="space-y-2">
          {radio.lastMonitored && (
            <div className="flex items-center space-x-2 text-sm bg-gray-700/20 rounded-lg px-3 py-2">
              <Clock className="h-3 w-3 text-gray-400" />
              <span className="text-gray-400">Último monitoreo: {radio.lastMonitored}</span>
            </div>
          )}
          {(radio as any).lastVerifiedAt && (
            <div className="flex items-center justify-between text-sm bg-gray-700/20 rounded-lg px-3 py-2">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  (radio as any).lastVerificationStatus === 'ONLINE' 
                    ? 'bg-green-400 animate-pulse' 
                    : 'bg-red-400'
                }`} />
                <span className="text-gray-400">
                  Stream: {
                    (radio as any).lastVerificationStatus === 'ONLINE' 
                      ? 'Online' 
                      : 'Offline'
                  }
                </span>
              </div>
              <span className="text-gray-500 text-xs">
                {new Date((radio as any).lastVerifiedAt).toLocaleString('es-CL', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          )}
        </div>
        
        <Separator className="bg-gray-600" />
        
        {/* Botones de acción */}
        <div className="flex items-center justify-between">
          <Button
            size="sm"
            variant={isPlaying ? "default" : "outline"}
            onClick={onPlay}
            className={`${
              isPlaying 
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg" 
                : "bg-blue-500/20 text-white hover:bg-blue-600/10 hover:text-white"
            } transition-all duration-200`}
            disabled={!radio.isActive || isLoading}
          >
            {isLoading ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Cargando...
              </>
            ) : isPlaying ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Detener
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Escuchar
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
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onDelete} 
              className="text-red-500 hover:text-white bg-gray-700 hover:bg-red-500/10 border-red-600/50 transition-all duration-200"
            >
              <Trash2 className="h-4 w-4" />
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

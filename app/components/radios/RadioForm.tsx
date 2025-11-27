'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Radio } from '@/lib/mock-data';
import { detectPlatform, validatePlatformUrl, extractPlatformData, STREAMING_PLATFORMS } from '@/lib/streaming-platforms';
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';
import { getPlatformIcon } from '@/lib/platform-utils';

interface RadioFormProps {
  radio?: Radio;
  onSubmit: (radio: any) => void;
  onClose?: () => void;
}

const CHILEAN_REGIONS = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
  'Valparaíso', 'Metropolitana', 'O\'Higgins', 'Maule', 'Ñuble',
  'Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'
];

const GENRES = ['Noticias', 'Música', 'Cultural', 'Deportes', 'Religioso', 'Popular'];

const URL_PLACEHOLDERS: Record<string, string> = {
  'youtube': 'https://www.youtube.com/watch?v=ID_DEL_VIDEO',
  'twitch': 'https://www.twitch.tv/nombre_del_canal',
  'facebook': 'https://www.facebook.com/pagina/live',
  'instagram': 'https://www.instagram.com/usuario/live',
  'tiktok': 'https://www.tiktok.com/@usuario/live',
  'spotify': 'https://open.spotify.com/show/id_del_show',
  'soundcloud': 'https://soundcloud.com/usuario/sets/playlist',
  'mixcloud': 'https://mixcloud.com/usuario/show',
  'icecast': 'http://servidor.com:8000/stream.mp3',
  'direct': 'http://radio.com/stream.mp3',
  'centova': 'https://centova.proveedor.com:2199/stream',
  'sonicpanel': 'https://sonic.proveedor.com:8000/stream',
  'azuracast': 'https://azura.radio.com/radio/8000/radio.mp3',
  'whmsonic': 'https://cpanel.proveedor.com/stream',
  'arkeo': 'https://centova.arkeo.cl:8443/stream',
  'creattiva': 'https://server.creattiva.cl:8000/radio',
  'visualradio': 'https://stream.visualradio.cl/live',
  'mediaweb': 'https://servidor.mediaweb.cl/radio.mp3',
  'digitalproserver': 'https://archi-us.digitalproserver.com/radio.aac',
  'tustreaming': 'https://sonic.tustreaming.cl:8000/stream',
  'streaminghd': 'https://server.streaminghd.cl/radio',
  'neonetwork': 'https://centova.neonetwork.cl:9172/stream',
  'chiloestreaming': 'https://streaming.chiloestreaming.com:10997/',
  'afstream': 'https://stream.afstream.com/radio-id',
  'mediastream': 'https://api.mediastream.com/stream/radio',
  'tunein': 'https://tunein.com/radio/radio-nombre-s123456/',
  'hardata': 'https://servidor.com/hardata/stream',
  'infinystream': 'https://infiny.proveedor.com/radio/live',
  'radionomy': 'https://streaming.radionomy.com/radio-name',
  'shoutcheap': 'http://stream.shoutcheap.com:8000/live',
  'yesstreaming': 'http://streaming.yesstreaming.com:8000/radio',
  'streamerr': 'http://radio.streamerr.com:8000/stream',
  'custom': 'https://radio.com/player o embed URL'
};

export function RadioForm({ radio, onSubmit, onClose }: RadioFormProps) {
  const isEditing = !!radio;
  const toast = useEnhancedToast();
  
  const [formData, setFormData] = useState<Omit<Radio, 'id'> & { priority?: number; costPerHour?: number }>({
    name: radio?.name || '',
    programadora: radio?.programadora || '',
    frequency: radio?.frequency || '',
    streamUrl: radio?.streamUrl || '',
    streamPlatform: radio?.streamPlatform || 'direct',
    platformData: radio?.platformData || {},
    region: radio?.region || '',
    city: radio?.city || '',
    website: radio?.website || '',
    isActive: radio?.isActive ?? true,
    genre: radio?.genre || 'Música',
    lastMonitored: radio?.lastMonitored || 'Nunca',
    priority: (radio as any)?.priority || 1,
    costPerHour: (radio as any)?.costPerHour || 0.0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const platforms = Object.entries(STREAMING_PLATFORMS).map(([key, config]) => ({
    value: key,
    label: config.name,
    description: config.description
  })).sort((a, b) => {
    const priority = ['direct', 'icecast', 'centova', 'sonicpanel', 'youtube', 'twitch'];
    const aIndex = priority.indexOf(a.value);
    const bIndex = priority.indexOf(b.value);
    
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    
    return a.label.localeCompare(b.label);
  });

  const getUrlPlaceholder = (platform: string) => {
    return URL_PLACEHOLDERS[platform] || 'URL del stream de la radio';
  };

  const handleUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, streamUrl: url }));
    
    if (url.trim()) {
      const detectedPlatform = detectPlatform(url);
      if (detectedPlatform && detectedPlatform !== formData.streamPlatform) {
        const platformData = extractPlatformData(detectedPlatform, url);
        setFormData(prev => ({
          ...prev,
          streamPlatform: detectedPlatform as any,
          platformData: platformData || {}
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePlatformUrl(formData.streamPlatform, formData.streamUrl)) {
      toast.warning('La URL no es válida para la plataforma seleccionada');
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ Estructura correcta para el backend
      const radioData = {
        ...(isEditing && radio ? { id: radio.id } : {}),
        name: formData.name,
        streamUrl: formData.streamUrl,
        streamPlatform: formData.streamPlatform,
        region: formData.region,
        isActive: formData.isActive,
        genre: formData.genre,
        programadora: formData.programadora,
        frequency: formData.frequency,
        city: formData.city,
        website: formData.website,
        priority: formData.priority,
        costPerHour: formData.costPerHour,
      };
      
      onSubmit(radioData);
      
      if (onClose) onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Error al ${isEditing ? 'actualizar' : 'agregar'} la radio. Por favor, intenta de nuevo.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-white">Nombre de la Radio</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="programadora" className="text-white">Programadora</Label>
          <Input
            id="programadora"
            value={formData.programadora}
            onChange={(e) => setFormData(prev => ({ ...prev, programadora: e.target.value }))}
            className="bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="frequency" className="text-white">Frecuencia</Label>
          <Input
            id="frequency"
            placeholder="Ej: 94.5 FM"
            value={formData.frequency}
            onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
            className="bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="genre" className="text-white">Género</Label>
          <Select value={formData.genre} onValueChange={(value) => setFormData(prev => ({ ...prev, genre: value }))}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {GENRES.map(genre => (
                <SelectItem key={genre} value={genre} className="text-white hover:bg-gray-700">{genre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="streamPlatform" className="text-white">Plataforma de Streaming</Label>
        <Select value={formData.streamPlatform} onValueChange={(value) => setFormData(prev => ({
          ...prev,
          streamPlatform: value as any,
          streamUrl: ''
        }))}>
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
            <SelectValue>
              <div className="flex items-center space-x-2">
                {getPlatformIcon(formData.streamPlatform)}
                <span>{platforms.find(p => p.value === formData.streamPlatform)?.label}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {platforms.map(platform => (
              <SelectItem key={platform.value} value={platform.value} className="text-white hover:bg-gray-700">
                <div className="flex items-center space-x-2">
                  {getPlatformIcon(platform.value)}
                  <div>
                    <div className="text-white">{platform.label}</div>
                    <div className="text-xs text-gray-400">{platform.description}</div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="streamUrl" className="text-white">URL del Stream</Label>
        <Input
          id="streamUrl"
          placeholder={getUrlPlaceholder(formData.streamPlatform)}
          value={formData.streamUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
          className={`bg-gray-800 border-gray-700 text-white ${
            formData.streamUrl && !validatePlatformUrl(formData.streamPlatform, formData.streamUrl)
              ? 'border-red-500' : ''
          }`}
          required
        />
        <p className="text-xs text-gray-400">
          {platforms.find(p => p.value === formData.streamPlatform)?.description}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="region" className="text-white">Región</Label>
          <Select value={formData.region} onValueChange={(value) => setFormData(prev => ({ ...prev, region: value }))}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Seleccionar región" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {CHILEAN_REGIONS.map(region => (
                <SelectItem key={region} value={region} className="text-white hover:bg-gray-700">{region}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="city" className="text-white">Ciudad</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            className="bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority" className="text-white">Prioridad (1-10)</Label>
          <Input
            id="priority"
            type="number"
            min="1"
            max="10"
            placeholder="1"
            value={formData.priority}
            onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
            className="bg-gray-800 border-gray-700 text-white"
          />
          <p className="text-xs text-gray-400">Mayor número = mayor prioridad en el monitoreo</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="costPerHour" className="text-white">Costo por Hora (USD)</Label>
          <Input
            id="costPerHour"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={formData.costPerHour}
            onChange={(e) => setFormData(prev => ({ ...prev, costPerHour: parseFloat(e.target.value) || 0.0 }))}
            className="bg-gray-800 border-gray-700 text-white"
          />
          <p className="text-xs text-gray-400">Costo operativo por hora de monitoreo</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website" className="text-white">Sitio Web (opcional)</Label>
        <Input
          id="website"
          placeholder="https://www.radio.cl"
          value={formData.website}
          onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
          className="bg-gray-800 border-gray-700 text-white"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
        />
        <Label className="text-white">Activar monitoreo inmediatamente</Label>
      </div>

      <div className="flex justify-end space-x-2">
        {onClose && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 border-gray-600"
          >
            Cancelar
          </Button>
        )}
        <Button 
          type="submit" 
          className="bg-blue-600 hover:bg-blue-700"
          disabled={isSubmitting}
        >
          {isSubmitting 
            ? (isEditing ? 'Actualizando...' : 'Agregando...') 
            : (isEditing ? 'Actualizar Radio' : 'Agregar Radio')
          }
        </Button>
      </div>
    </form>
  );
}

export default RadioForm;

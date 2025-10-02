import { 
  Youtube, Twitch, Facebook, Instagram, Music, Headphones, Mic, Cast, 
  Server, Database, Cpu, Cloud, Shield, DollarSign, BarChart3, Wrench, 
  Zap, Globe, MapPin, Settings, Radio as RadioIcon 
} from 'lucide-react';
import { STREAMING_PLATFORMS } from './streaming-platforms';

export const getPlatformIcon = (platform: string) => {
  switch (platform) {
    // Plataformas Sociales y Video
    case 'youtube': return <Youtube className="h-4 w-4 text-red-500" />;
    case 'twitch': return <Twitch className="h-4 w-4 text-purple-500" />;
    case 'facebook': return <Facebook className="h-4 w-4 text-blue-500" />;
    case 'instagram': return <Instagram className="h-4 w-4 text-pink-500" />;
    case 'spotify': return <Music className="h-4 w-4 text-green-500" />;
    case 'soundcloud': return <Headphones className="h-4 w-4 text-orange-500" />;
    case 'mixcloud': return <Mic className="h-4 w-4 text-blue-400" />;
    case 'tiktok': return <Cast className="h-4 w-4 text-black" />;
    
    // Tecnología Base
    case 'icecast': return <Server className="h-4 w-4 text-gray-500" />;
    case 'direct': return <RadioIcon className="h-4 w-4 text-blue-500" />;
    
    // Paneles de Control Profesionales
    case 'centova': return <Database className="h-4 w-4 text-blue-600" />;
    case 'sonicpanel': return <Cpu className="h-4 w-4 text-green-600" />;
    case 'azuracast': return <Cloud className="h-4 w-4 text-indigo-500" />;
    case 'whmsonic': return <Server className="h-4 w-4 text-orange-600" />;
    
    // Proveedores Chilenos
    case 'arkeo': return <Shield className="h-4 w-4 text-red-600" />;
    case 'creattiva': return <Cpu className="h-4 w-4 text-blue-700" />;
    case 'visualradio': return <RadioIcon className="h-4 w-4 text-green-700" />;
    case 'mediaweb': return <Cloud className="h-4 w-4 text-purple-600" />;
    case 'digitalproserver': return <Server className="h-4 w-4 text-gray-700" />;
    case 'tustreaming': return <Settings className="h-4 w-4 text-orange-700" />;
    case 'streaminghd': return <Shield className="h-4 w-4 text-blue-800" />;
    case 'neonetwork': return <Globe className="h-4 w-4 text-teal-600" />;
    case 'chiloestreaming': return <MapPin className="h-4 w-4 text-cyan-600" />;
    
    // Monetización y Analytics
    case 'afstream': return <DollarSign className="h-4 w-4 text-green-600" />;
    case 'mediastream': return <BarChart3 className="h-4 w-4 text-purple-700" />;
    
    // Agregadores
    case 'tunein': return <Globe className="h-4 w-4 text-blue-500" />;
    
    // Automatización
    case 'hardata': return <Wrench className="h-4 w-4 text-gray-600" />;
    case 'infinystream': return <Zap className="h-4 w-4 text-yellow-600" />;
    case 'radionomy': return <RadioIcon className="h-4 w-4 text-red-700" />;
    
    // Proveedores Globales
    case 'shoutcheap': return <DollarSign className="h-4 w-4 text-green-400" />;
    case 'yesstreaming': return <Server className="h-4 w-4 text-blue-400" />;
    case 'streamerr': return <Cast className="h-4 w-4 text-purple-400" />;
    
    // Personalizado
    case 'custom': return <Settings className="h-4 w-4 text-yellow-500" />;
    default: return <RadioIcon className="h-4 w-4 text-gray-500" />;
  }
};

export const getPlatformName = (platform: string) => {
  const config = STREAMING_PLATFORMS[platform];
  return config ? config.name : 'Desconocido';
};

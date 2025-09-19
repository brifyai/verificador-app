'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { mockRadios, Radio } from '@/lib/mock-data';
import { detectPlatform, validatePlatformUrl, extractPlatformData, STREAMING_PLATFORMS, MONITORING_CAPABILITIES } from '@/lib/streaming-platforms';
import MonitoringControl from '@/components/monitoring-control';
import RadioPricing from '@/components/radio-pricing';
import { Plus, Radio as RadioIcon, Volume2, VolumeX, Search, MapPin, Globe, Zap, Settings, Play, Pause, Youtube, Twitch, Facebook, Instagram, Music, Headphones, Mic, Cast, Server, Database, Cpu, Cloud, Shield, DollarSign, BarChart3, Users, Wrench, Loader, Upload, FileSpreadsheet, Download, CheckCircle, AlertTriangle, Edit, Trash2, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

const getPlatformIcon = (platform: string) => {
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

const getPlatformName = (platform: string) => {
  const config = STREAMING_PLATFORMS[platform];
  return config ? config.name : 'Desconocido';
};

export default function RadiosPage() {
  // const [radios, setRadios] = useState<Radio[]>(mockRadios); // Datos Prueba
  const [radios, setRadios] = useState<Radio[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRadio, setEditingRadio] = useState<Radio | null>(null);
  const [playingRadio, setPlayingRadio] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const regions = [...new Set(radios.map(r => r.region))];
  const genres = [...new Set(radios.map(r => r.genre))];
  const platforms = [...new Set(radios.map(r => r.streamPlatform))];

  const [loading, setLoading] = useState(true);

  // Limpiar audio al desmontar el componente
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  useEffect(() => {
    const fetchRadios = async () => {
      try {
        const res = await fetch('/api/radios');
        if (!res.ok) throw new Error('Error al cargar radios');
        const json = await res.json();
        setRadios(json.data); // 👈 aquí va el array
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRadios();
  }, []);






  const filteredRadios = useMemo(() => {
    return radios.filter(radio => {
      const matchesSearch = radio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          radio.programadora.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          radio.city.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRegion = selectedRegion === 'all' || radio.region === selectedRegion;
      const matchesGenre = selectedGenre === 'all' || radio.genre === selectedGenre;
      const matchesPlatform = selectedPlatform === 'all' || radio.streamPlatform === selectedPlatform;
      
      return matchesSearch && matchesRegion && matchesGenre && matchesPlatform;
    });
  }, [radios, searchTerm, selectedRegion, selectedGenre, selectedPlatform]);

  const groupedRadios = useMemo(() => {
    const grouped = filteredRadios.reduce((acc, radio) => {
      if (!acc[radio.region]) {
        acc[radio.region] = [];
      }
      acc[radio.region].push(radio);
      return acc;
    }, {} as Record<string, Radio[]>);

    // Sort by region name
    const sortedKeys = Object.keys(grouped).sort();
    const result: Record<string, Radio[]> = {};
    sortedKeys.forEach(key => {
      result[key] = grouped[key].sort((a, b) => a.name.localeCompare(b.name));
    });
    return result;
  }, [filteredRadios]);

  const toggleRadioStatus = (radioId: string) => {
    setRadios(prev => prev.map(radio =>
      radio.id === radioId ? { ...radio, isActive: !radio.isActive } : radio
    ));
  };

  const handlePlay = async (radioId: string) => {
    const radio = radios.find(r => r.id === radioId);
    if (!radio) return;

    // Si ya está reproduciendo esta radio, detener
    if (playingRadio === radioId) {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
      setPlayingRadio(null);
      setIsLoading(null);
      return;
    }

    // Si hay otro audio reproduciéndose, detenerlo
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
    }

    // Verificar si la radio está activa
    if (!radio.isActive) {
      toast.warn('Esta radio no está activa. Actívala primero para poder escucharla.', {
        position: "top-right",
        autoClose: 4000,
      });
      return;
    }

    setIsLoading(radioId);
    console.log(`🎵 Intentando reproducir: ${radio.name}`);
    console.log(`🔗 URL: ${radio.streamUrl}`);

    try {
      // Crear nuevo elemento de audio
      const audio = new Audio();
      
      // Configurar propiedades ANTES de los eventos
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      audio.volume = 0.7;
      
      // Timeout simple
      const timeout = setTimeout(() => {
        toast.error(`⏰ Tiempo agotado cargando ${radio.name}`, {
          position: "top-right",
          autoClose: 5000,
        });
        setIsLoading(null);
        audio.src = '';
      }, 15000);

      // Evento de éxito - cuando puede empezar a reproducir
      const onCanPlay = () => {
        clearTimeout(timeout);
        setIsLoading(null);
        setPlayingRadio(radioId);
        audio.play()
          .then(() => {
            console.log(`✅ Reproduciendo: ${radio.name}`);
          })
          .catch(error => {
            console.error('❌ Error reproduciendo:', error);
            toast.error(`No se pudo reproducir ${radio.name}`, {
              position: "top-right",
              autoClose: 4000,
            });
            setPlayingRadio(null);
          });
      };

      // Evento de error
      const onError = (event: any) => {
        clearTimeout(timeout);
        console.error(`❌ Error cargando ${radio.name}:`, event);
        setIsLoading(null);
        setPlayingRadio(null);
        toast.error(`Error: No se pudo cargar ${radio.name}`, {
          position: "top-right",
          autoClose: 4000,
        });
      };

      // Evento de finalización
      const onEnded = () => {
        setPlayingRadio(null);
        console.log(`🔚 Stream finalizado: ${radio.name}`);
      };

      // Agregar event listeners
      audio.addEventListener('canplay', onCanPlay, { once: true });
      audio.addEventListener('error', onError, { once: true });
      audio.addEventListener('ended', onEnded);

      // Establecer URL y cargar
      audio.src = radio.streamUrl;
      audio.load();
      
      setAudioElement(audio);
      
    } catch (error) {
      console.error('❌ Error configurando audio:', error);
      toast.error(`Error configurando reproductor para ${radio.name}`, {
        position: "top-right",
        autoClose: 4000,
      });
      setIsLoading(null);
      setPlayingRadio(null);
    }
  };

  const totalActive = radios.filter(r => r.isActive).length;
  const totalInactive = radios.filter(r => !r.isActive).length;
  const platformDistribution = radios.reduce((acc, radio) => {
    acc[radio.streamPlatform] = (acc[radio.streamPlatform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Función para eliminar radio
  const handleDelete = async (radioId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta radio?')) {
      return;
    }

    try {
      const response = await fetch(`/api/radios/${radioId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Actualizar la lista de radios eliminando la radio
        setRadios(prevRadios => prevRadios.filter(radio => radio.id !== radioId));
        toast.success('Radio eliminada exitosamente', {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        const error = await response.json();
        toast.error(`Error eliminando radio: ${error.message}`, {
          position: "top-right",
          autoClose: 4000,
        });
      }
    } catch (error) {
      console.error('Error eliminando radio:', error);
      toast.error('Error eliminando radio', {
        position: "top-right",
        autoClose: 4000,
      });
    }
  };

  // Función para editar radio
  const handleEdit = (radio: Radio) => {
    setEditingRadio(radio);
  };

  const handleImportFromFile = async () => {
    setImportLoading(true);
    try {
      // Cargar las radios del archivo JSON generado
      const response = await fetch('/radios_para_importar.json');
      const radiosData = await response.json();
      
      // Importar a través de la API
      const importResponse = await fetch('/api/radios/import-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          radios: radiosData,
          replaceAll: true // Reemplazar todas las radios actuales
        })
      });

      if (importResponse.ok) {
        const result = await importResponse.json();
        setImportResult(result);
        
        // Actualizar la lista de radios en el frontend
        const newRadios = radiosData.map((radio: any, index: number) => ({
          id: `imported-${index}`,
          name: radio.name,
          region: radio.region,
          city: radio.city,
          streamUrl: radio.streamUrl,
          streamPlatform: detectPlatform(radio.streamUrl) || 'direct',
          genre: 'General', // Valor por defecto
          frequency: radio.frequency || '',
          isActive: radio.status === 'active',
          isMonitoring: false,
          listeners: Math.floor(Math.random() * 1000),
          description: radio.description || `Radio ${radio.name} de ${radio.city}`,
          website: radio.website || '',
          phone: radio.phone || '',
          email: radio.email || '',
          address: radio.address || '',
          logo: radio.logo || '/images/radio-placeholder.png'
        }));
        
        setRadios(newRadios);
        console.log(`✅ ${result.stats.total} radios importadas exitosamente`);
      } else {
        const error = await importResponse.json();
        console.error('❌ Error en importación:', error);
        setImportResult({ 
          success: false, 
          error: error.error || 'Error desconocido' 
        });
      }
    } catch (error) {
      console.error('❌ Error:', error);
      setImportResult({ 
        success: false, 
        error: 'Error de conectividad o archivo no encontrado' 
      });
    } finally {
      setImportLoading(false);
    }
  };

  const resetImport = () => {
    setImportResult(null);
    setImportDialogOpen(false);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Gestión de Radios</h2>
          <p className="text-muted-foreground">
            Administra las radios monitoreadas en todo Chile
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Upload className="h-4 w-4 mr-2" />
                Importar 358 Radios
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">
                  <FileSpreadsheet className="h-5 w-5 mr-2 inline" />
                  Importación Masiva de Radios
                </DialogTitle>
              </DialogHeader>
              
              {!importResult ? (
                <div className="space-y-4">
                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <h4 className="text-white font-medium mb-2">📊 Datos a Importar</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Total de radios:</span>
                        <span className="text-white ml-2 font-bold">358</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Con streaming URL:</span>
                        <span className="text-green-400 ml-2 font-bold">347 (97%)</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Sin streaming URL:</span>
                        <span className="text-yellow-400 ml-2 font-bold">11 (3%)</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Regiones:</span>
                        <span className="text-blue-400 ml-2 font-bold">16</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-900/30 border border-yellow-800 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
                      <div className="text-sm">
                        <p className="text-yellow-300 font-medium mb-1">⚠️ Acción Irreversible</p>
                        <p className="text-yellow-200">
                          Esta acción <strong>reemplazará completamente</strong> todas las radios actuales 
                          con las 358 radios del archivo Excel. Los datos actuales se perderán.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setImportDialogOpen(false)}
                      disabled={importLoading}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleImportFromFile}
                      disabled={importLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {importLoading ? (
                        <>
                          <Loader className="h-4 w-4 mr-2 animate-spin" />
                          Importando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Confirmar Importación
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {importResult.success ? (
                    <div className="bg-green-900/30 border border-green-800 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                        <h4 className="text-green-300 font-medium">✅ Importación Exitosa</h4>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-slate-400">Total importadas:</span>
                          <span className="text-white ml-2 font-bold">{importResult.stats.total}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Activas:</span>
                          <span className="text-green-400 ml-2 font-bold">{importResult.stats.active}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Inactivas:</span>
                          <span className="text-yellow-400 ml-2 font-bold">{importResult.stats.inactive}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Regiones:</span>
                          <span className="text-blue-400 ml-2 font-bold">{importResult.stats.regions}</span>
                        </div>
                      </div>
                      
                      <p className="text-green-200 text-sm">
                        Las radios se han importado correctamente y ya están disponibles en el sistema.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-red-900/30 border border-red-800 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                        <h4 className="text-red-300 font-medium">❌ Error en Importación</h4>
                      </div>
                      <p className="text-red-200 text-sm">
                        {importResult.error}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <Button onClick={resetImport} className="bg-blue-600 hover:bg-blue-700">
                      Cerrar
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Radio
              </Button>
            </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Agregar Nueva Radio</DialogTitle>
            </DialogHeader>
            <AddRadioForm 
              onSubmit={(newRadio) => {
                setRadios(prev => {
                  const newId = `radio_${prev.length + 1}_${Date.now()}`;
                  return [...prev, { ...newRadio, id: newId }];
                });
                setIsAddDialogOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Radios</CardTitle>
            <RadioIcon className="h-4 w-4" style={{ color: '#3b82f6' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{radios.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Activas</CardTitle>
            <Volume2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{totalActive}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Inactivas</CardTitle>
            <VolumeX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{totalInactive}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Regiones</CardTitle>
            <MapPin className="h-4 w-4" style={{ color: '#10b981' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{regions.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">Plataformas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {Object.entries(platformDistribution)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([platform, count]) => (
              <div key={platform} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1">
                  {getPlatformIcon(platform)}
                  <span className="text-white truncate">{getPlatformName(platform).split(' ')[0]}</span>
                </div>
                <span className="text-muted-foreground">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4" style={{ color: '#9ca3af' }} />
          <Input
            placeholder="Buscar radios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
          <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="Todas las regiones" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all" className="text-white hover:bg-gray-700">Todas las regiones</SelectItem>
            {regions.map(region => (
              <SelectItem key={region} value={region} className="text-white hover:bg-gray-700">{region}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedGenre} onValueChange={setSelectedGenre}>
          <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="Todos los géneros" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all" className="text-white hover:bg-gray-700">Todos los géneros</SelectItem>
            {genres.map(genre => (
              <SelectItem key={genre} value={genre} className="text-white hover:bg-gray-700">{genre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
          <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="Todas las plataformas" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all" className="text-white hover:bg-gray-700">Todas las plataformas</SelectItem>
            {platforms.map(platform => (
              <SelectItem key={platform} value={platform} className="text-white hover:bg-gray-700">
                <div className="flex items-center space-x-2">
                  {getPlatformIcon(platform)}
                  <span className="text-white">{getPlatformName(platform)}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Radios por Región */}
      <div className="space-y-6">
        {Object.entries(groupedRadios).map(([region, regionRadios]) => (
          <div key={region} className="space-y-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-semibold text-white">{region}</h3>
              <Badge 
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: '1px solid #9ca3af'
                }}
                className="font-medium"
              >
                {regionRadios.length} radios
              </Badge>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {regionRadios.map((radio) => (
                <RadioCard
                  key={radio.id}
                  radio={radio}
                  isPlaying={playingRadio === radio.id}
                  isLoading={isLoading === radio.id}
                  onToggleStatus={() => toggleRadioStatus(radio.id)}
                  onPlay={() => handlePlay(radio.id)}
                  onEdit={() => setEditingRadio(radio)}
                  onDelete={() => handleDelete(radio.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredRadios.length === 0 && (
        <div className="text-center py-8">
          <RadioIcon className="mx-auto h-12 w-12 mb-4" style={{ color: '#6b7280' }} />
          <p style={{ color: '#9ca3af' }}>No se encontraron radios con los filtros aplicados.</p>
        </div>
      )}

      {/* Diálogo de Edición */}
      <Dialog open={!!editingRadio} onOpenChange={() => setEditingRadio(null)}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              <Edit className="h-5 w-5 mr-2 inline" />
              Editar Radio: {editingRadio?.name}
            </DialogTitle>
          </DialogHeader>
          {editingRadio && (
            <EditRadioForm 
              radio={editingRadio}
              onClose={() => setEditingRadio(null)}
              onUpdate={(updatedRadio) => {
                setRadios(prev => prev.map(radio => 
                  radio.id === updatedRadio.id ? { ...radio, ...updatedRadio } : radio
                ))
                setEditingRadio(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RadioCard(props: { 
  radio: Radio;
  isPlaying: boolean;
  isLoading: boolean;
  onToggleStatus: () => void;
  onPlay: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { radio, isPlaying, isLoading, onToggleStatus, onPlay, onEdit, onDelete } = props;
  
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
        {/* Información básica con mejor diseño */}
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
        
        {/* Género y plataforma con mejor diseño */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge 
              className="bg-blue-500/20 text-blue-400 border-blue-500/50 font-medium px-3 py-1"
            >
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
        
        {/* Último monitoreo con mejor estilo */}
        {radio.lastMonitored && (
          <div className="flex items-center space-x-2 text-sm bg-gray-700/20 rounded-lg px-3 py-2">
            <Clock className="h-3 w-3 text-gray-400" />
            <span className="text-gray-400">Último monitoreo: {radio.lastMonitored}</span>
          </div>
        )}
        
        <Separator className="bg-gray-600" />
        
        {/* Botones de acción con mejor diseño */}
        <div className="flex items-center justify-between">
          <Button
            size="sm"
            variant={isPlaying ? "default" : "outline"}
            onClick={onPlay}
            className={`  ${
              isPlaying 
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg" 
                : "bg-blue-500/20 text-white hover:bg-blue-600/10 hover:text-white"
            }transition-all duration-200`}
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
        
        {/* Stream URL con mejor diseño */}
        <div className="bg-gray-700/20 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-2 font-medium">Stream URL:</div>
          <div className="text-xs text-gray-300 truncate font-mono bg-gray-800/50 px-2 py-1 rounded">
            {radio.streamUrl}
          </div>
        </div>
        
        {/* Capacidades de monitoreo con mejor diseño */}
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

        <Separator className="bg-gray-700" />
        
        <div className="space-y-4">
          {/* Valorización */}
          <RadioPricing radio={radio} />

          <Separator className="bg-gray-600" />
          
          {/* Control de Monitoreo en Tiempo Real */}
          <MonitoringControl radio={radio} />
        </div>
      </CardContent>
    </Card>
  );
}

function AddRadioForm({ onSubmit }: { onSubmit: (radio: Omit<Radio, 'id'>) => void }) {
  const [formData, setFormData] = useState<Omit<Radio, 'id'>>({
    name: '',
    programadora: '',
    frequency: '',
    streamUrl: '',
    streamPlatform: 'direct',
    platformData: {},
    region: '',
    city: '',
    website: '',
    isActive: true,
    genre: 'Música'
  });

  const regions = [
    'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
    'Valparaíso', 'Metropolitana', 'O\'Higgins', 'Maule', 'Ñuble',
    'Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'
  ];

  const genres = ['Noticias', 'Música', 'Cultural', 'Deportes', 'Religioso', 'Popular'];

  const platforms = Object.entries(STREAMING_PLATFORMS).map(([key, config]) => ({
    value: key,
    label: config.name,
    description: config.description
  })).sort((a, b) => {
    // Priorizar las plataformas más comunes
    const priority = ['direct', 'icecast', 'centova', 'sonicpanel', 'youtube', 'twitch'];
    const aIndex = priority.indexOf(a.value);
    const bIndex = priority.indexOf(b.value);
    
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    
    return a.label.localeCompare(b.label);
  });

  const getUrlPlaceholder = (platform: string) => {
    const examples: Record<string, string> = {
      // Plataformas Sociales
      'youtube': 'https://www.youtube.com/watch?v=ID_DEL_VIDEO',
      'twitch': 'https://www.twitch.tv/nombre_del_canal',
      'facebook': 'https://www.facebook.com/pagina/live',
      'instagram': 'https://www.instagram.com/usuario/live',
      'tiktok': 'https://www.tiktok.com/@usuario/live',
      'spotify': 'https://open.spotify.com/show/id_del_show',
      'soundcloud': 'https://soundcloud.com/usuario/sets/playlist',
      'mixcloud': 'https://mixcloud.com/usuario/show',
      
      // Tecnología Base
      'icecast': 'http://servidor.com:8000/stream.mp3',
      'direct': 'http://radio.com/stream.mp3',
      
      // Paneles Profesionales
      'centova': 'https://centova.proveedor.com:2199/stream',
      'sonicpanel': 'https://sonic.proveedor.com:8000/stream',
      'azuracast': 'https://azura.radio.com/radio/8000/radio.mp3',
      'whmsonic': 'https://cpanel.proveedor.com/stream',
      
      // Proveedores Chilenos
      'arkeo': 'https://centova.arkeo.cl:8443/stream',
      'creattiva': 'https://server.creattiva.cl:8000/radio',
      'visualradio': 'https://stream.visualradio.cl/live',
      'mediaweb': 'https://servidor.mediaweb.cl/radio.mp3',
      'digitalproserver': 'https://archi-us.digitalproserver.com/radio.aac',
      'tustreaming': 'https://sonic.tustreaming.cl:8000/stream',
      'streaminghd': 'https://server.streaminghd.cl/radio',
      'neonetwork': 'https://centova.neonetwork.cl:9172/stream',
      'chiloestreaming': 'https://streaming.chiloestreaming.com:10997/',
      
      // Monetización
      'afstream': 'https://stream.afstream.com/radio-id',
      'mediastream': 'https://api.mediastream.com/stream/radio',
      
      // Agregadores
      'tunein': 'https://tunein.com/radio/radio-nombre-s123456/',
      
      // Automatización
      'hardata': 'https://servidor.com/hardata/stream',
      'infinystream': 'https://infiny.proveedor.com/radio/live',
      'radionomy': 'https://streaming.radionomy.com/radio-name',
      
      // Globales
      'shoutcheap': 'http://stream.shoutcheap.com:8000/live',
      'yesstreaming': 'http://streaming.yesstreaming.com:8000/radio',
      'streamerr': 'http://radio.streamerr.com:8000/stream',
      
      'custom': 'https://radio.com/player o embed URL'
    };
    
    return examples[platform] || 'URL del stream de la radio';
  };

  const handleUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, streamUrl: url }));
    
    // Auto-detectar plataforma
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar URL antes de enviar
    if (!validatePlatformUrl(formData.streamPlatform, formData.streamUrl)) {
      toast.error('La URL no es válida para la plataforma seleccionada', {
        position: "top-right",
        autoClose: 4000,
      });
      return;
    }
    
    // Extraer datos de plataforma
    const platformData = extractPlatformData(formData.streamPlatform, formData.streamUrl);
    
    onSubmit({
      ...formData,
      platformData: platformData || {},
      lastMonitored: 'Nunca'
    });
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
              {genres.map(genre => (
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
          streamUrl: '' // Reset URL when platform changes
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
              {regions.map(region => (
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
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          Agregar Radio
        </Button>
      </div>
    </form>
  );
}


// Componente EditRadioForm
const EditRadioForm = ({ radio, onClose, onUpdate }: { 
  radio: any, 
  onClose: () => void, 
  onUpdate: (updatedRadio: any) => void 
}) => {
  const [formData, setFormData] = useState({
    name: radio.name || '',
    stream_url: radio.stream_url || '',
    platform: radio.platform || 'icecast',
    region: radio.region || '',
    city: radio.city || '',
    website: radio.website || '',
    genre: radio.genre || '',
    monitoring_enabled: radio.monitoring_enabled || false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const regions = [
    'Región de Arica y Parinacota',
    'Región de Tarapacá',
    'Región de Antofagasta',
    'Región de Atacama',
    'Región de Coquimbo',
    'Región de Valparaíso',
    'Región Metropolitana',
    'Región del Libertador General Bernardo O\'Higgins',
    'Región del Maule',
    'Región de Ñuble',
    'Región del Biobío',
    'Región de La Araucanía',
    'Región de Los Ríos',
    'Región de Los Lagos',
    'Región Aysén del General Carlos Ibáñez del Campo',
    'Región de Magallanes y de la Antártica Chilena'
  ];

  const genres = [
    'Música', 'Noticias', 'Deportes', 'Talk Show', 'Religiosa',
    'Educativa', 'Cultural', 'Juvenil', 'Clásica', 'Rock',
    'Pop', 'Folclórica', 'Electrónica', 'Jazz', 'Reggaeton',
    'Cumbia', 'Salsa', 'Bachata', 'Merengue', 'Baladas'
  ];

  const platformMappings = {
    icecast: { name: 'Icecast/Shoutcast', placeholder: 'http://streaming.example.com:8000/stream' },
    youtube: { name: 'YouTube Live', placeholder: 'https://www.youtube.com/watch?v=VIDEO_ID' },
    facebook: { name: 'Facebook Live', placeholder: 'https://www.facebook.com/username/videos/VIDEO_ID' },
    twitch: { name: 'Twitch', placeholder: 'https://www.twitch.tv/username' },
    other: { name: 'Otro', placeholder: 'URL del stream' }
  };

  const validateUrl = (url: string, platform: string) => {
    if (!url) return false;
    
    try {
      new URL(url);
      
      switch (platform) {
        case 'youtube':
          return url.includes('youtube.com') || url.includes('youtu.be');
        case 'facebook':
          return url.includes('facebook.com');
        case 'twitch':
          return url.includes('twitch.tv');
        case 'icecast':
          return url.startsWith('http://') || url.startsWith('https://');
        default:
          return true;
      }
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateUrl(formData.stream_url, formData.platform)) {
      toast.error('Por favor, ingresa una URL válida para la plataforma seleccionada.', {
        position: "top-right",
        autoClose: 4000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/radios/${radio.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedRadio = await response.json();
        onUpdate(updatedRadio);
        onClose();
      } else {
        throw new Error('Error al actualizar la radio');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar la radio. Por favor, intenta de nuevo.', {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Nombre de la Radio
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Plataforma de Stream
        </label>
        <select
          value={formData.platform}
          onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Object.entries(platformMappings).map(([key, value]) => (
            <option key={key} value={key}>
              {value.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          URL del Stream
        </label>
        <input
          type="url"
          value={formData.stream_url}
          onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
          placeholder={platformMappings[formData.platform as keyof typeof platformMappings]?.placeholder}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Región
        </label>
        <select
          value={formData.region}
          onChange={(e) => setFormData({ ...formData, region: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Selecciona una región</option>
          {regions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Ciudad
        </label>
        <input
          type="text"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Género
        </label>
        <select
          value={formData.genre}
          onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Selecciona un género</option>
          {genres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Sitio Web (opcional)
        </label>
        <input
          type="url"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          placeholder="https://www.ejemplo.com"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="monitoring_enabled_edit"
          checked={formData.monitoring_enabled}
          onChange={(e) => setFormData({ ...formData, monitoring_enabled: e.target.checked })}
          className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="monitoring_enabled_edit" className="text-sm text-gray-300">
          Activar monitoreo inmediatamente
        </label>
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          {isSubmitting ? 'Actualizando...' : 'Actualizar Radio'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};
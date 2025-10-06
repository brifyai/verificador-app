'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Radio as RadioIcon, Plus, Upload, FileSpreadsheet, Loader, CheckCircle, AlertTriangle, Edit } from 'lucide-react';
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';
import { Radio } from '@/lib/mock-data';
import { getPlatformIcon, getPlatformName } from '@/lib/platform-utils';
import { RadioCard } from '@/components/radios/RadioCard';
import { RadioCardSkeleton } from '@/components/radios/RadioCardSkeleton';
import { RadioMetrics } from '@/components/radios/RadioMetrics';
import { RadioFilters } from '@/components/radios/RadioFilters';
import RadioForm from '@/components/radios/RadioForm';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

export default function RadiosPage() {
  const { confirm, ConfirmationDialog } = useConfirmationDialog();
  const toast = useEnhancedToast();
  const { playingRadio, isLoading, handlePlay } = useAudioPlayer();
  
  // Estados principales
  const [radios, setRadios] = useState<Radio[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  
  // Estados de diálogos
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRadio, setEditingRadio] = useState<Radio | null>(null);
  
  // Estados de importación
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar radios al montar
  useEffect(() => {
    const fetchRadios = async () => {
      try {
        const res = await fetch('/api/radios?limit=500');
        if (!res.ok) throw new Error('Error al cargar radios');
        const json = await res.json();
        if (Array.isArray(json.data)) {
          setRadios(json.data);
        } else {
          console.error('Formato de datos incorrecto:', json);
          toast.error('Error en el formato de datos recibidos');
          setRadios([]);
        }
      } catch (err) {
        console.error('Error al cargar radios:', err);
        toast.error('No se pudieron cargar las radios');
      } finally {
        setLoading(false);
      }
    };

    fetchRadios();
  }, []);

  // Extraer datos únicos para filtros
  const regions = useMemo(() => {
    const uniqueRegions = Array.from(new Set(radios.map(radio => radio.region)));
    return uniqueRegions.sort();
  }, [radios]);
  
  const genres = useMemo(() => {
    const uniqueGenres = Array.from(new Set(radios.flatMap(radio => radio.genre ? [radio.genre] : [])));
    return uniqueGenres.sort();
  }, [radios]);
  
  const platforms = useMemo(() => {
    const uniquePlatforms = Array.from(new Set(radios.map(radio => radio.streamPlatform)));
    return uniquePlatforms.sort();
  }, [radios]);

  // Filtrar radios
  const filteredRadios = useMemo(() => {
    return radios.filter(radio => {
      const matchesSearch = radio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          radio.programadora.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          radio.city.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRegion = selectedRegion === '' || selectedRegion === 'all' || radio.region === selectedRegion;
      const matchesGenre = selectedGenre === 'all' || radio.genre === selectedGenre;
      const matchesPlatform = selectedPlatform === 'all' || radio.streamPlatform === selectedPlatform;
      
      return matchesSearch && matchesRegion && matchesGenre && matchesPlatform;
    });
  }, [radios, searchTerm, selectedRegion, selectedGenre, selectedPlatform]);

  // Agrupar radios por región
  const groupedRadios = useMemo(() => {
    const grouped = filteredRadios.reduce((acc, radio) => {
      if (!acc[radio.region]) {
        acc[radio.region] = [];
      }
      acc[radio.region].push(radio);
      return acc;
    }, {} as Record<string, Radio[]>);

    const sortedKeys = Object.keys(grouped).sort();
    const result: Record<string, Radio[]> = {};
    sortedKeys.forEach(key => {
      result[key] = grouped[key].sort((a, b) => a.name.localeCompare(b.name));
    });
    return result;
  }, [filteredRadios]);

  // Calcular métricas
  const totalActive = radios.filter(r => r.isActive).length;
  const totalInactive = radios.filter(r => !r.isActive).length;
  const platformDistribution = radios.reduce((acc, radio) => {
    acc[radio.streamPlatform] = (acc[radio.streamPlatform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Handlers
  const toggleRadioStatus = (radioId: string) => {
    setRadios(prev => prev.map(radio =>
      radio.id === radioId ? { ...radio, isActive: !radio.isActive } : radio
    ));
  };

  const handleDelete = async (radioId: string) => {
    const confirmed = await confirm({
      title: '¿Eliminar radio?',
      description: '¿Estás seguro de que quieres eliminar esta radio? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive',
      onConfirm: () => {},
      onCancel: () => {}
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/radios/${radioId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRadios(prevRadios => prevRadios.filter(radio => radio.id !== radioId));
        toast.deleteSuccess('Radio eliminada exitosamente');
      } else {
        const error = await response.json();
        toast.deleteError(`Error eliminando radio: ${error.message}`);
      }
    } catch (error) {
      console.error('Error eliminando radio:', error);
      toast.deleteError('Error eliminando radio');
    }
  };

  const handleSaveRadio = async (radioData: any) => {
    try {
      let method = 'POST';
      let url = '/api/radios';
      
      if (editingRadio) {
        method = 'PUT';
        url = `/api/radios/${editingRadio.id}`;
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(radioData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar la radio');
      }

      const result = await response.json();
      
      if (editingRadio) {
        setRadios(prev => prev.map(r => r.id === editingRadio.id ? result.data : r));
        toast.updateSuccess('Radio actualizada exitosamente');
      } else {
        setRadios(prev => [...prev, result.data]);
        toast.createSuccess('Radio creada exitosamente');
      }
      
      setIsAddDialogOpen(false);
      setEditingRadio(null);
      
    } catch (error) {
      console.error('Error guardando radio:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  // Handlers de importación
  const validateFile = (file: File): boolean => {
    const validTypes = [
      'application/json',
      'text/json',
      'text/csv',
      'application/csv',
      'text/comma-separated-values'
    ];
    
    const fileName = file.name.toLowerCase();
    const isJsonExtension = fileName.endsWith('.json');
    const isCsvExtension = fileName.endsWith('.csv');
    
    if (!validTypes.includes(file.type) && !isJsonExtension && !isCsvExtension) {
      setImportError(`Tipo de archivo no válido. Por favor, sube un archivo JSON (.json) o CSV (.csv)`);
      return false;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setImportError(`El archivo es demasiado grande. El tamaño máximo es 10MB.`);
      return false;
    }
    
    return true;
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('El archivo CSV debe tener al menos una fila de encabezados y una fila de datos');
    }

    const parseCSVLine = (line: string): string[] => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
    
    const fieldMapping: Record<string, string> = {
      'nombre': 'name', 'name': 'name', 'radio': 'name',
      'region': 'region', 'región': 'region',
      'ciudad': 'city', 'city': 'city',
      'url': 'streamUrl', 'streamurl': 'streamUrl', 'stream_url': 'streamUrl', 'enlace': 'streamUrl', 'link': 'streamUrl',
      'frecuencia': 'frequency', 'frequency': 'frequency', 'freq': 'frequency',
      'descripcion': 'description', 'description': 'description', 'desc': 'description',
      'sitio': 'website', 'website': 'website', 'web': 'website',
      'telefono': 'phone', 'phone': 'phone', 'tel': 'phone',
      'email': 'email', 'correo': 'email',
      'direccion': 'address', 'address': 'address',
      'logo': 'logo',
      'programadora': 'programadora',
      'genero': 'genre', 'genre': 'genre', 'tipo': 'genre'
    };

    const radios = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0 || values.every(v => !v.trim())) continue;
      
      const radio: any = {};
      
      headers.forEach((header, index) => {
        const standardField = fieldMapping[header] || header;
        const value = values[index] ? values[index].trim() : '';
        
        if (value) {
          radio[standardField] = value;
        }
      });
      
      if (!radio.name || !radio.region) {
        console.warn(`Fila ${i + 1}: Faltan campos requeridos (name, region)`, radio);
        continue;
      }
      
      radio.city = radio.city || radio.region;
      radio.programadora = radio.programadora || radio.name;
      
      radios.push(radio);
    }
    
    if (radios.length === 0) {
      throw new Error('No se encontraron radios válidas en el archivo CSV');
    }
    
    return radios;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setImportError(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setImportFile(file);
        toast.createSuccess(`Archivo "${file.name}" seleccionado correctamente`);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setImportFile(file);
        toast.createSuccess(`Archivo "${file.name}" seleccionado correctamente`);
      }
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFromFile = async () => {
    if (!importFile) {
      setImportError("Por favor, selecciona un archivo JSON o CSV para importar.");
      return;
    }

    setImportLoading(true);
    setImportError(null);
    
    try {
      const fileContent = await importFile.text();
      let jsonData;
      
      const isCSV = importFile.name.toLowerCase().endsWith('.csv') || 
                   importFile.type.includes('csv');
      
      if (isCSV) {
        try {
          const radiosArray = parseCSV(fileContent);
          jsonData = { radios: radiosArray };
        } catch (error: any) {
          setImportError(`Error al procesar el archivo CSV: ${error.message}`);
          setImportLoading(false);
          return;
        }
      } else {
        try {
          const parsedData = JSON.parse(fileContent);
          
          if (Array.isArray(parsedData)) {
            jsonData = { radios: parsedData };
          } else if (parsedData.radios && Array.isArray(parsedData.radios)) {
            jsonData = parsedData;
          } else {
            setImportError("El archivo JSON debe contener un array de radios o un objeto con una propiedad 'radios' que sea un array.");
            setImportLoading(false);
            return;
          }
        } catch (error) {
          setImportError("El archivo no contiene JSON válido.");
          setImportLoading(false);
          return;
        }
      }
      
      const importResponse = await fetch('/api/radios/import-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData)
      });

      if (importResponse.ok) {
        const result = await importResponse.json();
        setImportResult(result);
        setImportDialogOpen(false);
        
        // Recargar radios
        setLoading(true);
        try {
          const res = await fetch('/api/radios?limit=500');
          if (!res.ok) throw new Error('Error al cargar radios');
          const json = await res.json();
          if (Array.isArray(json.data)) {
            setRadios(json.data);
          } else {
            console.error('Formato de datos incorrecto:', json);
            toast.error('Error en el formato de datos recibidos');
          }
        } catch (err) {
          console.error('Error al recargar radios:', err);
          toast.error('No se pudieron cargar las radios importadas');
        } finally {
          setLoading(false);
        }
        
        toast.createSuccess(`✅ ${result.stats?.total || 'Múltiples'} radios importadas exitosamente`);
      } else {
        const error = await importResponse.json();
        console.error('❌ Error en importación:', error);
        setImportResult({ 
          success: false, 
          error: error.error || 'Error desconocido en el servidor' 
        });
      }
    } catch (error: any) {
      console.error('❌ Error:', error);
      setImportResult({ 
        success: false, 
        error: error.message || 'Error de conectividad o formato de archivo incorrecto' 
      });
    } finally {
      setImportLoading(false);
    }
  };

  const resetImport = () => {
    setImportResult(null);
    setImportFile(null);
    setImportError(null);
    setImportDialogOpen(false);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Gestión de Radios</h2>
          <p className="text-muted-foreground">
            Administra las radios monitoreadas en todo Chile
          </p>
        </div>
        <div className="flex gap-2">
          {/* Botón Importar */}
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Upload className="h-4 w-4 mr-2" />
                Importar Radios
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
                  <div 
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragActive 
                        ? "border-green-500 bg-green-500/10" 
                        : importFile 
                          ? "border-blue-500 bg-blue-500/10" 
                          : "border-gray-600 hover:border-gray-500"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,.csv"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    
                    <FileSpreadsheet className={`h-12 w-12 mx-auto mb-4 ${
                      importFile ? "text-blue-400" : "text-gray-400"
                    }`} />
                    
                    {importFile ? (
                      <div className="space-y-2">
                        <p className="text-blue-300 font-medium">
                          ✅ Archivo seleccionado: <span className="font-bold">{importFile.name}</span>
                        </p>
                        <p className="text-gray-400 text-sm">
                          {(importFile.size / 1024).toFixed(2)} KB • {new Date().toLocaleDateString()}
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setImportFile(null);
                            setImportError(null);
                          }}
                        >
                          Cambiar archivo
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-gray-300 font-medium">
                          Arrastra y suelta un archivo JSON o CSV aquí
                        </p>
                        <p className="text-gray-400 text-sm">o</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleFileButtonClick}
                        >
                          Seleccionar archivo
                        </Button>
                        <p className="text-gray-500 text-xs mt-2">
                          Formatos soportados: .json, .csv (máx. 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {importError && (
                    <div className="bg-red-900/30 border border-red-800 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                        <p className="text-red-300 text-sm">{importError}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-yellow-900/30 border border-yellow-800 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
                      <div className="text-sm">
                        <p className="text-yellow-300 font-medium mb-1">⚠️ Importante</p>
                        <p className="text-yellow-200">
                          Esta acción <strong>actualizará o creará</strong> radios desde el archivo. 
                          Las radios existentes con el mismo nombre y región se actualizarán. 
                          No se eliminarán radios existentes.
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
                      disabled={importLoading || !importFile}
                      className={`${importFile ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 cursor-not-allowed"}`}
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
                          <span className="text-white ml-2 font-bold">{importResult.stats?.total}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Activas:</span>
                          <span className="text-green-400 ml-2 font-bold">{importResult.stats?.active}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Inactivas:</span>
                          <span className="text-yellow-400 ml-2 font-bold">{importResult.stats?.inactive}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Regiones:</span>
                          <span className="text-blue-400 ml-2 font-bold">{importResult.stats?.regions}</span>
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
          
          {/* Botón Agregar */}
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
              <RadioForm onSubmit={handleSaveRadio} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Métricas */}
      <RadioMetrics
        totalRadios={radios.length}
        totalActive={totalActive}
        totalInactive={totalInactive}
        totalRegions={regions.length}
        platformDistribution={platformDistribution}
        getPlatformIcon={getPlatformIcon}
        getPlatformName={getPlatformName}
      />

      {/* Filtros */}
      <RadioFilters
        searchTerm={searchTerm}
        selectedRegion={selectedRegion}
        selectedGenre={selectedGenre}
        selectedPlatform={selectedPlatform}
        regions={regions}
        genres={genres}
        platforms={platforms}
        onSearchChange={setSearchTerm}
        onRegionChange={setSelectedRegion}
        onGenreChange={setSelectedGenre}
        onPlatformChange={setSelectedPlatform}
        getPlatformIcon={getPlatformIcon}
        getPlatformName={getPlatformName}
      />

      {/* Lista de Radios */}
      <div className="space-y-6">
        {loading ? (
          // Skeleton loaders mientras carga
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-7 w-40 bg-gray-700 rounded animate-pulse"></div>
              <div className="h-6 w-20 bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, index) => (
                <RadioCardSkeleton key={index} />
              ))}
            </div>
          </div>
        ) : selectedRegion === '' ? (
          <div className="text-center py-12">
            <RadioIcon className="mx-auto h-16 w-16 mb-4" style={{ color: '#6b7280' }} />
            <h3 className="text-xl font-semibold text-white mb-2">Selecciona una región</h3>
            <p style={{ color: '#9ca3af' }}>
              Para ver las radios disponibles, por favor selecciona una región del filtro de arriba.
            </p>
            <p style={{ color: '#9ca3af' }} className="text-sm mt-2">
              Esto permite cargar hasta 500 radios de manera más eficiente.
            </p>
          </div>
        ) : (
          Object.entries(groupedRadios).map(([region, regionRadios]) => (
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
                    onPlay={() => handlePlay(radio)}
                    onEdit={() => setEditingRadio(radio)}
                    onDelete={() => handleDelete(radio.id)}
                    getPlatformIcon={getPlatformIcon}
                    getPlatformName={getPlatformName}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedRegion !== '' && filteredRadios.length === 0 && (
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
            <RadioForm 
              radio={editingRadio}
              onClose={() => setEditingRadio(null)}
              onSubmit={handleSaveRadio}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog />
    </div>
  );
}

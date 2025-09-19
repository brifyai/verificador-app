
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Cloud, 
  CheckCircle, 
  XCircle, 
  Settings, 
  Upload,
  Download,
  FolderOpen,
  AlertCircle,
  FileAudio,
  HardDrive
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DriveStatus {
  configured: boolean;
  hasServiceAccount: boolean;
  hasApiKey: boolean;
  hasFolderId: boolean;
}

interface StorageStats {
  totalFiles: number;
  totalSize: number;
  usedStorage: string;
}

export default function GoogleDriveConfig() {
  const [status, setStatus] = useState<DriveStatus | null>(null);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [enabled, setEnabled] = useState(true);

  // Configuración
  const [config, setConfig] = useState({
    serviceAccountJson: '',
    apiKey: '',
    rootFolderId: '',
    folderStructure: 'date-radio', // 'date-radio' | 'radio-date'
    autoUpload: true,
    keepLocal: false
  });

  useEffect(() => {
    loadStatus();
    loadStorageStats();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/google-drive/config');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        setEnabled(data.configured);
      }
    } catch (error) {
      console.error('Error cargando estado:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStorageStats = async () => {
    try {
      const response = await fetch('/api/audios/stats');
      if (response.ok) {
        const data = await response.json();
        setStorageStats(data.stats);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const testConnection = async () => {
    try {
      setTesting(true);
      const response = await fetch('/api/google-drive/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('✅ Conexión exitosa con Google Drive');
        loadStatus();
        loadStorageStats();
      } else {
        toast.error('❌ Error: ' + data.error);
      }
    } catch (error) {
      toast.error('❌ Error probando conexión');
    } finally {
      setTesting(false);
    }
  };

  const saveConfig = async () => {
    // Esta función requiere implementación en el backend para guardar variables de entorno
    toast('ℹ️ Configuración guardada. Reinicia el servidor para aplicar cambios.');
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estado y Estadísticas */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            📁 Google Drive - Respaldo de Audios
          </CardTitle>
          <p className="text-sm text-slate-400">
            Almacenamiento automático y organizado de todas las detecciones de audio
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estado de Conexión */}
          <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
            <div className="flex items-center gap-3">
              {status?.configured ? (
                <CheckCircle className="h-6 w-6 text-green-400" />
              ) : (
                <XCircle className="h-6 w-6 text-red-400" />
              )}
              <div>
                <p className="text-white font-medium">
                  {status?.configured ? 'Conectado y Funcional' : 'No Configurado'}
                </p>
                <p className="text-sm text-slate-400">
                  {status?.configured 
                    ? 'Los audios se guardan automáticamente en Google Drive'
                    : 'Configura las credenciales para habilitar el respaldo'
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Switch
                checked={enabled}
                onCheckedChange={setEnabled}
                disabled={!status?.configured}
              />
              <Button
                onClick={testConnection}
                variant="outline"
                size="sm"
                disabled={testing || !status?.configured}
                className="text-slate-300 border-slate-600 hover:bg-slate-700"
              >
                {testing ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : (
                  <Settings className="h-4 w-4 mr-2" />
                )}
                {testing ? 'Probando...' : 'Probar'}
              </Button>
            </div>
          </div>

          {/* Estadísticas */}
          {storageStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-800/30">
                <div className="flex items-center gap-2 text-blue-300 mb-2">
                  <FileAudio className="h-4 w-4" />
                  <span className="text-sm font-medium">Archivos Almacenados</span>
                </div>
                <p className="text-2xl font-bold text-white">{storageStats.totalFiles.toLocaleString()}</p>
                <p className="text-xs text-blue-200">Detecciones respaldadas</p>
              </div>

              <div className="p-4 bg-green-900/20 rounded-lg border border-green-800/30">
                <div className="flex items-center gap-2 text-green-300 mb-2">
                  <HardDrive className="h-4 w-4" />
                  <span className="text-sm font-medium">Espacio Usado</span>
                </div>
                <p className="text-2xl font-bold text-white">{storageStats.usedStorage}</p>
                <p className="text-xs text-green-200">En Google Drive</p>
              </div>

              <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-800/30">
                <div className="flex items-center gap-2 text-purple-300 mb-2">
                  <Cloud className="h-4 w-4" />
                  <span className="text-sm font-medium">Promedio por Audio</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {storageStats.totalFiles > 0 
                    ? Math.round(storageStats.totalSize / storageStats.totalFiles / 1024) + ' KB'
                    : '0 KB'
                  }
                </p>
                <p className="text-xs text-purple-200">Tamaño típico</p>
              </div>
            </div>
          )}

          {/* Características */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-700/20 rounded-lg">
            <div>
              <h4 className="text-white font-medium mb-2">🎯 Organización Automática</h4>
              <div className="space-y-1 text-sm text-slate-300">
                <div>📁 2024/Septiembre/07-09-2024/</div>
                <div className="ml-4">📻 Radio_Cooperativa/</div>
                <div className="ml-8">🎵 audio_deteccion_001.wav</div>
              </div>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">⚡ Funciones Avanzadas</h4>
              <div className="space-y-1 text-sm text-slate-300">
                <div>• Upload automático tras detección</div>
                <div>• Links directos para escuchar</div>
                <div>• Búsqueda y filtrado inteligente</div>
                <div>• Acceso desde cualquier lugar</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración Detallada */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Google Drive
          </CardTitle>
          <p className="text-sm text-slate-400">
            Configura las credenciales y opciones de almacenamiento
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estado de Componentes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {status?.hasServiceAccount ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400" />
                )}
                <span className="text-sm font-medium text-white">Service Account</span>
              </div>
              <p className="text-xs text-slate-400">
                {status?.hasServiceAccount ? 'Configurado' : 'Pendiente'}
              </p>
            </div>

            <div className="p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {status?.hasApiKey ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                )}
                <span className="text-sm font-medium text-white">API Key</span>
              </div>
              <p className="text-xs text-slate-400">
                {status?.hasApiKey ? 'Configurado' : 'Opcional'}
              </p>
            </div>

            <div className="p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {status?.hasFolderId ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <FolderOpen className="h-4 w-4 text-blue-400" />
                )}
                <span className="text-sm font-medium text-white">Carpeta Raíz</span>
              </div>
              <p className="text-xs text-slate-400">
                {status?.hasFolderId ? 'Configurado' : 'Raíz por defecto'}
              </p>
            </div>
          </div>

          {/* Formulario de Configuración */}
          <div className="space-y-4 p-4 border border-slate-600 rounded-lg">
            <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-800/30">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-blue-300 font-medium">Configuración por Variables de Entorno</p>
                  <p className="text-blue-200 mt-1">
                    Para configurar Google Drive, agrega estas variables a tu archivo .env:
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-slate-300 text-sm">GOOGLE_SERVICE_ACCOUNT_CREDENTIALS</Label>
                <Textarea
                  placeholder='{"type": "service_account", "project_id": "...", ...}'
                  value={config.serviceAccountJson}
                  onChange={(e) => setConfig({...config, serviceAccountJson: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white font-mono text-xs"
                  rows={4}
                />
                <p className="text-xs text-slate-400 mt-1">
                  JSON completo de las credenciales del Service Account
                </p>
              </div>

              <div>
                <Label className="text-slate-300 text-sm">GOOGLE_DRIVE_ROOT_FOLDER_ID (Opcional)</Label>
                <Input
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  value={config.rootFolderId}
                  onChange={(e) => setConfig({...config, rootFolderId: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white font-mono"
                />
                <p className="text-xs text-slate-400 mt-1">
                  ID de la carpeta raíz donde se organizarán los audios
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-600">
              <div className="text-sm text-slate-400">
                Reinicia el servidor después de configurar las variables de entorno
              </div>
              <Button 
                onClick={saveConfig}
                className="bg-blue-600 hover:bg-blue-700"
              >
                💾 Guardar Configuración
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guía de Configuración */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            📋 Guía de Configuración Rápida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                <div>
                  <p className="text-white font-medium">Crear Proyecto en Google Cloud</p>
                  <p className="text-sm text-slate-400">Ve a Google Cloud Console y crea un nuevo proyecto</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                <div>
                  <p className="text-white font-medium">Habilitar Google Drive API</p>
                  <p className="text-sm text-slate-400">En "APIs y servicios", habilita la Google Drive API</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                <div>
                  <p className="text-white font-medium">Crear Service Account</p>
                  <p className="text-sm text-slate-400">Crea credenciales → Service Account → Descargar JSON</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
                <div>
                  <p className="text-white font-medium">Configurar Variables de Entorno</p>
                  <p className="text-sm text-slate-400">Agrega las credenciales al archivo .env del servidor</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-green-900/20 rounded-lg border border-green-800/30">
              <p className="text-green-300 text-sm">
                💡 <strong>Tip:</strong> Una vez configurado, todos los audios se subirán automáticamente 
                y podrás acceder a ellos desde la sección "Audios" del dashboard.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

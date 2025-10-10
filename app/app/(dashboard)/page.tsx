'use client';

import { BarChart3, CheckCircle, Radio, TrendingUp, RefreshCw, Clock, Play, Pause } from 'lucide-react';
import { useEffect, useState } from 'react';
import CostSimulator from '@/components/cost-simulator';

interface MonitoringStats {
  activeSessions: any[];
  stats: {
    totalSessions: number;
    activeSessions: number;
    totalDetections: number;
    recentDetections: number;
    systemReady: boolean;
    systemStatus: string;
  };
  recentDetections: any[];
  lastCheck: string;
}

export default function Dashboard() {
  const [monitoringData, setMonitoringData] = useState<MonitoringStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchMonitoringData = async () => {
    try {
      setIsLoading(true);
      console.log(`🔄 Consultando datos de monitoreo con filtro: ${statusFilter}`);
      
      const response = await fetch(`/api/monitoring/status?status=${statusFilter}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        console.log(`📊 Datos recibidos:`, {
          success: data.success,
          totalSessions: data.activeSessions?.length || 0,
          stats: data.stats
        });
        
        setMonitoringData(data);
        setLastUpdate(new Date());
      } else {
        console.error('❌ Error en respuesta:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error fetching monitoring data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
  }, [statusFilter]);

  useEffect(() => {
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchMonitoringData, 30000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Monitoreo en tiempo real de detecciones publicitarias
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">Última actualización</div>
          <div className="text-white font-medium flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {formatTime(lastUpdate)}
          </div>
          <button
            onClick={async () => {
              try {
                console.log('🧪 Creando sesión de prueba...');
                const response = await fetch('/api/test-monitoring', { method: 'POST' });
                const data = await response.json();
                if (data.success) {
                  console.log('✅ Sesión de prueba creada:', data.data);
                  // Refrescar datos
                  fetchMonitoringData();
                } else {
                  console.error('❌ Error creando sesión de prueba:', data.error);
                }
              } catch (error) {
                console.error('❌ Error:', error);
              }
            }}
            className="mt-2 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            🧪 Crear Prueba
          </button>
        </div>
      </div>

      {/* Metrics cards con datos reales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-lg border" style={{
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(51, 65, 85, 0.3)'
        }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Monitoreos Activos</p>
              <p className="text-2xl font-bold text-white">
                {isLoading ? '...' : monitoringData?.stats.activeSessions || 0}
              </p>
            </div>
            <Radio className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="p-6 rounded-lg border" style={{
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(51, 65, 85, 0.3)'
        }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Detecciones Hoy</p>
              <p className="text-2xl font-bold text-white">
                {isLoading ? '...' : monitoringData?.stats.recentDetections || 0}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="p-6 rounded-lg border" style={{
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(51, 65, 85, 0.3)'
        }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Total Detecciones</p>
              <p className="text-2xl font-bold text-white">
                {isLoading ? '...' : monitoringData?.stats.totalDetections || 0}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-400" />
          </div>
        </div>

        <div className="p-6 rounded-lg border" style={{
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(51, 65, 85, 0.3)'
        }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Estado Sistema</p>
              <p className="text-2xl font-bold text-white">
                {isLoading ? '...' : monitoringData?.stats.systemReady ? '✓' : '⚠️'}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Sección de Todos los Monitoreos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Monitoreos Activos</h2>
          <p className="text-sm text-slate-400">
            Listado de todas las sesiones creadas
          </p>
        </div>

        <div className="p-6 rounded-lg border" style={{
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(51, 65, 85, 0.3)'
        }}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Sesiones</h3>
              <div className="flex items-center gap-2">
                <p className="text-sm text-slate-400 mr-4">
                  Actualiza automáticamente cada 30s
                </p>
                <div className="flex gap-1">
                  {['ALL', 'ACTIVE', 'PAUSED', 'STOPPED', 'COMPLETED'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        statusFilter === status
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {status === 'ALL' ? 'TODOS' : status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
                <span className="ml-2 text-slate-400">Cargando monitoreos...</span>
              </div>
            ) : monitoringData?.activeSessions && monitoringData.activeSessions.length > 0 ? (
              <div className="space-y-3">
                {monitoringData.activeSessions.map((session) => {
                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case 'ACTIVE': return { bg: 'bg-green-500/20', text: 'text-green-400', icon: Play };
                      case 'PAUSED': return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Pause };
                      case 'STOPPED': return { bg: 'bg-red-500/20', text: 'text-red-400', icon: Pause };
                      case 'COMPLETED': return { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: CheckCircle };
                      case 'ERROR': return { bg: 'bg-red-500/20', text: 'text-red-400', icon: TrendingUp };
                      default: return { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: Radio };
                    }
                  };
                  
                  const statusConfig = getStatusColor(session.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <div key={session.id} className="flex items-center justify-between p-4 rounded-lg border" style={{
                      backgroundColor: 'rgba(30, 41, 59, 0.5)',
                      borderColor: 'rgba(71, 85, 105, 0.3)'
                    }}>
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${statusConfig.bg}`}>
                          <StatusIcon className={`h-4 w-4 ${statusConfig.text}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white">{session.radio?.name || 'Radio desconocida'}</p>
                            <span className={`px-2 py-1 text-xs rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                              {session.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400">
                            {session.radio?.region || 'Sin región'} • 
                            Horario: {session.recordingStartHour || 5}:00 - {session.recordingEndHour || 2}:00
                          </p>
                          <p className="text-xs text-slate-500">
                            Usuario: {session.user?.name || session.user?.email || 'Desconocido'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">
                          {session.detectionsCount || 0} detecciones
                        </p>
                        <p className="text-xs text-slate-400">
                          <Clock className="inline h-3 w-3 mr-1" />
                          Inicio: {new Date(session.startTime).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit'
                          })} {new Date(session.startTime).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {session.endTime && (
                          <p className="text-xs text-slate-400">
                            Fin: {new Date(session.endTime).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit'
                            })} {new Date(session.endTime).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Radio className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No hay monitoreos creados</p>
                <p className="text-sm text-slate-500 mt-1">
                  Crea tu primer monitoreo desde la sección "Monitoreo"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
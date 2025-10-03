'use client';

import { useEffect, useState } from 'react';
import { BarChart3, CheckCircle, Radio, TrendingUp, DollarSign, RefreshCw } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/metric-card';
import { DetectionsChart } from '@/components/dashboard/detections-chart';
import { TopRadiosWidget } from '@/components/dashboard/top-radios-widget';
import { TopPhrasesWidget } from '@/components/dashboard/top-phrases-widget';
import { RegionMapWidget } from '@/components/dashboard/region-map-widget';
import { ActiveSessionsWidget } from '@/components/dashboard/active-sessions-widget';
import { RecentDetectionsWidget } from '@/components/dashboard/recent-detections-widget';
import { CostWidget } from '@/components/dashboard/cost-widget';
import { AlertsWidget } from '@/components/dashboard/alerts-widget';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  summary: {
    totalDetections: number;
    todayDetections: number;
    weekDetections: number;
    monthDetections: number;
    activeSessions: number;
    totalRadios: number;
    totalPhrases: number;
    verificationRate: string;
    monthCosts: number;
  };
  detectionsByHour: Array<{ hour: number; count: number }>;
  topRadios: Array<any>;
  topPhrases: Array<any>;
  detectionsByRegion: Array<{ region: string; count: number }>;
  activeSessions: Array<any>;
  recentDetections: Array<any>;
  alerts: {
    unverifiedHighConfidence: number;
  };
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !stats) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Monitoreo en tiempo real de detecciones publicitarias
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-slate-400">Última actualización</div>
            <div className="text-white font-medium text-sm">
              {lastUpdate.toLocaleTimeString('es-CL')}
            </div>
          </div>
          <Button
            onClick={fetchStats}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Radios Activas"
          value={stats.summary.activeSessions}
          icon={Radio}
          iconColor="bg-blue-500/20 text-blue-400"
          subtitle={`De ${stats.summary.totalRadios} totales`}
        />
        <MetricCard
          title="Detecciones Hoy"
          value={stats.summary.todayDetections}
          icon={CheckCircle}
          iconColor="bg-green-500/20 text-green-400"
          subtitle={`${stats.summary.weekDetections} esta semana`}
        />
        <MetricCard
          title="Tasa de Verificación"
          value={`${stats.summary.verificationRate}%`}
          icon={TrendingUp}
          iconColor="bg-yellow-500/20 text-yellow-400"
          subtitle={`${stats.summary.totalDetections} totales`}
        />
        <MetricCard
          title="Costos del Mes"
          value={`$${stats.summary.monthCosts.toFixed(2)}`}
          icon={DollarSign}
          iconColor="bg-purple-500/20 text-purple-400"
          subtitle="Gasto acumulado"
        />
      </div>

      {/* Gráfico de detecciones por hora */}
      <DetectionsChart data={stats.detectionsByHour} />

      {/* Top Radios y Top Frases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopRadiosWidget radios={stats.topRadios} />
        <TopPhrasesWidget phrases={stats.topPhrases} />
      </div>

      {/* Mapa de Regiones y Costos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RegionMapWidget regions={stats.detectionsByRegion} />
        <CostWidget currentMonthCost={stats.summary.monthCosts} />
      </div>

      {/* Sesiones Activas */}
      <ActiveSessionsWidget sessions={stats.activeSessions} />

      {/* Últimas Detecciones y Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentDetectionsWidget detections={stats.recentDetections} />
        <AlertsWidget unverifiedHighConfidence={stats.alerts.unverifiedHighConfidence} />
      </div>
    </div>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-96" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}
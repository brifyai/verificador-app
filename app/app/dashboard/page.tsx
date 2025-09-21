import { BarChart3, CheckCircle, Radio, TrendingUp } from 'lucide-react';
import CostSimulator from '@/components/cost-simulator';

export default function Dashboard() {
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
          <div className="text-white font-medium">
            Sistema funcionando
          </div>
        </div>
      </div>

      {/* Metrics cards simplificadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-lg border" style={{
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(51, 65, 85, 0.3)'
        }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Radios Activas</p>
              <p className="text-2xl font-bold text-white">24</p>
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
              <p className="text-2xl font-bold text-white">156</p>
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
              <p className="text-sm font-medium text-slate-400">Efectividad</p>
              <p className="text-2xl font-bold text-white">94.2%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        <div className="p-6 rounded-lg border" style={{
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          borderColor: 'rgba(51, 65, 85, 0.3)'
        }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Ingresos</p>
              <p className="text-2xl font-bold text-white">$24,890</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Simulador de Costos */}
      <div className="p-6 rounded-lg border" style={{
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderColor: 'rgba(51, 65, 85, 0.3)'
      }}>
        <h2 className="text-xl font-bold text-white mb-4">Simulador de Costos</h2>
        <CostSimulator />
      </div>
    </div>
  );
}
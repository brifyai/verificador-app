
'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { chartData } from '@/lib/mock-data';
import { TrendingUp, Target, Activity, BarChart3 } from 'lucide-react';
import MetricCard from '@/components/metric-card';

export default function Inteligencia() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Inteligencia y Modelos de IA</h1>
          <p className="text-slate-400 mt-1">
            Configuración avanzada de modelos, análisis de precisión y optimización de transcripciones
          </p>
        </div>
      </div>

      {/* Intelligence metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Precisión IA"
          value="98.5%"
          icon={Target}
          trend={{ value: 2.1, isPositive: true }}
        />
        <MetricCard
          title="Detecciones/Hora"
          value="24"
          icon={Activity}
          trend={{ value: 5.2, isPositive: true }}
        />
        <MetricCard
          title="Efectividad"
          value="94.2%"
          icon={TrendingUp}
          trend={{ value: 1.8, isPositive: true }}
        />
        <MetricCard
          title="Cobertura Total"
          value="87%"
          icon={BarChart3}
          trend={{ value: 3.4, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Region Analysis Bar Chart */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            Detecciones por Región
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData.regionAnalysis} 
                layout="horizontal"
                margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
              >
                <XAxis 
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                />
                <YAxis 
                  dataKey="region" 
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#f1f5f9' }}
                  width={80}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                    fontSize: '12px'
                  }}
                  formatter={(value) => [`${value} detecciones`, 'Detecciones']}
                />
                <Bar 
                  dataKey="detecciones" 
                  fill="#60B5FF"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            Estado de Verificaciones
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                    fontSize: '11px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {chartData.statusDistribution.map((entry, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-slate-300">{entry.name}</span>
                <span className="text-slate-400">({entry.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trends Analysis */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">
          Tendencias de Detección (Últimos 9 meses)
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.pressureAnalysis}>
              <XAxis 
                dataKey="month" 
                tickLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
              />
              <YAxis 
                tickLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="detecciones" 
                stroke="#FF9149" 
                strokeWidth={4}
                dot={{ fill: '#FF9149', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#FF9149', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="completadas" 
                stroke="#60B5FF" 
                strokeWidth={4}
                dot={{ fill: '#60B5FF', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#60B5FF', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-900/50 to-slate-800/50 rounded-xl p-6 border border-blue-700/50">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Target className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Insight Clave</h3>
          </div>
          <p className="text-slate-300 text-sm">
            Las detecciones aumentaron 15% en horario prime (18:00-22:00) comparado con la semana anterior.
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-900/50 to-slate-800/50 rounded-xl p-6 border border-green-700/50">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Tendencia</h3>
          </div>
          <p className="text-slate-300 text-sm">
            Región Metropolitana lidera con 45% más detecciones que el promedio nacional.
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-900/50 to-slate-800/50 rounded-xl p-6 border border-purple-700/50">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Predicción</h3>
          </div>
          <p className="text-slate-300 text-sm">
            Se espera un incremento del 12% en detecciones para la próxima semana.
          </p>
        </div>
      </div>

      {/* Configuración Avanzada de Modelos de IA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Target className="w-5 h-5 text-blue-400 mr-2" />
            Optimización de Modelos
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 px-3 bg-slate-700/50 rounded-lg">
              <span className="text-sm text-slate-300">Umbral de Confianza</span>
              <span className="text-sm font-mono text-green-400">85%</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-slate-700/50 rounded-lg">
              <span className="text-sm text-slate-300">Precisión Promedio</span>
              <span className="text-sm font-mono text-blue-400">94.2%</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-slate-700/50 rounded-lg">
              <span className="text-sm text-slate-300">Tiempo de Respuesta</span>
              <span className="text-sm font-mono text-purple-400">1.2s</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-slate-700/50 rounded-lg">
              <span className="text-sm text-slate-300">Modelo Activo</span>
              <span className="text-sm font-mono text-yellow-400">Whisper-Large-v3</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 text-green-400 mr-2" />
            Configuración Avanzada
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 px-3 bg-slate-700/50 rounded-lg">
              <span className="text-sm text-slate-300">Balance de Carga</span>
              <span className="text-sm font-mono text-green-400">Round-Robin</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-slate-700/50 rounded-lg">
              <span className="text-sm text-slate-300">Fallback Automático</span>
              <span className="text-sm font-mono text-green-400">Activo</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-slate-700/50 rounded-lg">
              <span className="text-sm text-slate-300">Cache de Modelos</span>
              <span className="text-sm font-mono text-blue-400">2GB / 8GB</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-slate-700/50 rounded-lg">
              <span className="text-sm text-slate-300">Pre-procesamiento</span>
              <span className="text-sm font-mono text-purple-400">Normalización</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nota informativa */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <div className="p-1">
            <Target className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-300 mb-1">
              Configuración vs Inteligencia
            </h4>
            <p className="text-xs text-blue-200/80">
              • <strong>Configuración Global:</strong> APIs básicas, claves de acceso, activación/desactivación de proveedores<br/>
              • <strong>Inteligencia:</strong> Optimización de modelos, análisis de precisión, configuraciones avanzadas de IA
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

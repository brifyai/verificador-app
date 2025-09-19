
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { chartData } from '@/lib/mock-data';
import { useState, useEffect } from 'react';

export default function DashboardCharts() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pressure Analysis Loading */}
        <div className="lg:col-span-2 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            Análisis de Presión Publicitaria
          </h3>
          <div className="h-80 flex items-center justify-center">
            <div className="text-slate-400">Cargando gráfico...</div>
          </div>
        </div>

        {/* Status Distribution Loading */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            Distribución por Estados
          </h3>
          <div className="h-80 flex items-center justify-center">
            <div className="text-slate-400">Cargando gráfico...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Pressure Analysis Line Chart */}
      <div className="lg:col-span-2 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">
          Análisis de Presión Publicitaria
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData?.pressureAnalysis || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis 
                dataKey="month" 
                tickLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
              />
              <YAxis 
                tickLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }} 
              />
              <Legend 
                wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
              />
              <Line 
                type="monotone" 
                dataKey="detecciones" 
                stroke="#60B5FF" 
                strokeWidth={3}
                name="Detecciones"
                dot={{ fill: '#60B5FF', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="completadas" 
                stroke="#FF9149" 
                strokeWidth={3}
                name="Completadas"
                dot={{ fill: '#FF9149', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Distribution Pie Chart */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">
          Distribución por Estados
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData?.statusDistribution || []}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {(chartData?.statusDistribution || []).map((entry, index) => (
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
      </div>
    </div>
  );
}

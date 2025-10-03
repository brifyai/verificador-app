'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface DetectionsChartProps {
  data: Array<{ hour: number; count: number }>;
}

export function DetectionsChart({ data }: DetectionsChartProps) {
  // Completar horas faltantes con 0
  const fullData = Array.from({ length: 24 }, (_, i) => {
    const existing = data.find(d => d.hour === i);
    return {
      hour: i,
      count: existing?.count || 0,
      label: `${i.toString().padStart(2, '0')}:00`
    };
  });

  const totalDetections = data.reduce((sum, d) => sum + d.count, 0);
  const avgPerHour = totalDetections / 24;
  const peakHour = fullData.reduce((max, d) => d.count > max.count ? d : max, fullData[0]);

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              Detecciones por Hora (Últimas 24h)
            </CardTitle>
            <CardDescription className="text-slate-400 mt-1">
              Total: {totalDetections} detecciones | Promedio: {avgPerHour.toFixed(1)}/hora | Pico: {peakHour.label} ({peakHour.count})
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={fullData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="label" 
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8' }}
              interval={1}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff'
              }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Bar 
              dataKey="count" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]}
              name="Detecciones"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

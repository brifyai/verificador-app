'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Radio, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface TopRadio {
  id: string;
  name: string | null;
  region: string | null;
  detectionCount: number;
}

interface TopRadiosWidgetProps {
  radios: TopRadio[];
}

export function TopRadiosWidget({ radios }: TopRadiosWidgetProps) {
  const maxCount = radios[0]?.detectionCount || 1;

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Radio className="h-5 w-5 text-purple-400" />
          Top 5 Radios
        </CardTitle>
        <CardDescription className="text-slate-400">
          Radios con más detecciones
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {radios.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No hay datos disponibles
          </div>
        ) : (
          radios.map((radio, index) => (
            <div key={radio.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                    index === 1 ? 'bg-slate-500/20 text-slate-400' :
                    index === 2 ? 'bg-orange-500/20 text-orange-400' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{radio.name || 'Sin nombre'}</p>
                    <p className="text-xs text-slate-400">{radio.region || 'Sin región'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{radio.detectionCount}</span>
                  <TrendingUp className="h-4 w-4 text-green-400" />
                </div>
              </div>
              <Progress 
                value={(radio.detectionCount / maxCount) * 100} 
                className="h-2 bg-slate-700"
              />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

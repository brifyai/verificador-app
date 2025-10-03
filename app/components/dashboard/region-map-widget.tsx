'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface RegionData {
  region: string;
  count: number;
}

interface RegionMapWidgetProps {
  regions: RegionData[];
}

export function RegionMapWidget({ regions }: RegionMapWidgetProps) {
  const maxCount = Math.max(...regions.map(r => r.count), 1);
  const totalCount = regions.reduce((sum, r) => sum + r.count, 0);

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <MapPin className="h-5 w-5 text-red-400" />
          Detecciones por Región
        </CardTitle>
        <CardDescription className="text-slate-400">
          Distribución geográfica de detecciones
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {regions.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No hay datos por región
          </div>
        ) : (
          regions.slice(0, 8).map((region) => {
            const percentage = ((region.count / totalCount) * 100).toFixed(1);
            return (
              <div key={region.region} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{region.region}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">{percentage}%</span>
                    <span className="text-sm font-bold text-white">({region.count})</span>
                  </div>
                </div>
                <Progress 
                  value={(region.count / maxCount) * 100} 
                  className="h-2 bg-slate-700"
                />
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

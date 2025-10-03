'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Radio as RadioIcon, Volume2, VolumeX, MapPin } from 'lucide-react';

interface RadioMetricsProps {
  totalRadios: number;
  totalActive: number;
  totalInactive: number;
  totalRegions: number;
  platformDistribution: Record<string, number>;
  getPlatformIcon: (platform: string) => JSX.Element;
  getPlatformName: (platform: string) => string;
}

export function RadioMetrics({
  totalRadios,
  totalActive,
  totalInactive,
  totalRegions,
  platformDistribution,
  getPlatformIcon,
  getPlatformName,
}: RadioMetricsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">Total Radios</CardTitle>
          <RadioIcon className="h-4 w-4" style={{ color: '#3b82f6' }} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{totalRadios}</div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">Activas</CardTitle>
          <Volume2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">{totalActive}</div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">Inactivas</CardTitle>
          <VolumeX className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">{totalInactive}</div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">Regiones</CardTitle>
          <MapPin className="h-4 w-4" style={{ color: '#10b981' }} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{totalRegions}</div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-white">Plataformas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {Object.entries(platformDistribution)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([platform, count]) => (
            <div key={platform} className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1">
                {getPlatformIcon(platform)}
                <span className="text-white truncate">{getPlatformName(platform).split(' ')[0]}</span>
              </div>
              <span className="text-muted-foreground">{count}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

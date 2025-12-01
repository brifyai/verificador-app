'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi, WifiOff, AlertTriangle, PauseCircle } from 'lucide-react';

interface RadioStatusIndicatorsProps {
  totalRadios: number;
  totalActive: number;
  totalInactive: number;
  totalOnline: number;
  totalOffline: number;
  totalActiveUnverified: number;
}

export function RadioStatusIndicators({
  totalRadios,
  totalActive,
  totalInactive,
  totalOnline,
  totalOffline,
  totalActiveUnverified,
}: RadioStatusIndicatorsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* Online - Verde */}
      <Card className="bg-gray-800 border-green-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-300">Online</CardTitle>
          <Wifi className="h-5 w-5 text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-400">{totalOnline}</div>
        </CardContent>
      </Card>

      {/* Offline - Rojo */}
      <Card className="bg-gray-800 border-red-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-300">Offline</CardTitle>
          <WifiOff className="h-5 w-5 text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-400">{totalOffline}</div>
        </CardContent>
      </Card>

      {/* Activo sin verificar - Amarillo/Naranja */}
      <Card className="bg-gray-800 border-yellow-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-yellow-300">Activo sin verificar</CardTitle>
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-yellow-400">{totalActiveUnverified}</div>
        </CardContent>
      </Card>

      {/* Inactivo - Gris */}
      <Card className="bg-gray-800 border-gray-600">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">Inactivo</CardTitle>
          <PauseCircle className="h-5 w-5 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-400">{totalInactive}</div>
        </CardContent>
      </Card>
    </div>
  );
}
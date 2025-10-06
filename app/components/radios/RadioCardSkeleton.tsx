'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function RadioCardSkeleton() {
  return (
    <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center space-x-2">
              {/* Status indicator skeleton */}
              <div className="w-3 h-3 rounded-full bg-gray-700 animate-pulse"></div>
              {/* Title skeleton */}
              <div className="h-5 bg-gray-700 rounded animate-pulse w-3/4"></div>
            </div>
            {/* Subtitle skeleton */}
            <div className="h-4 bg-gray-700 rounded animate-pulse w-1/2"></div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Switch skeleton */}
            <div className="w-10 h-6 bg-gray-700 rounded-full animate-pulse"></div>
            {/* Badge skeleton */}
            <div className="h-6 w-16 bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Información básica - 2 columns */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-700/30 rounded-lg px-3 py-2 h-10 animate-pulse"></div>
          <div className="bg-gray-700/30 rounded-lg px-3 py-2 h-10 animate-pulse"></div>
        </div>
        
        {/* Género y plataforma */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-7 w-20 bg-gray-700 rounded animate-pulse"></div>
            <div className="h-7 w-24 bg-gray-700/50 rounded-lg animate-pulse"></div>
          </div>
          <div className="w-8 h-8 bg-gray-700/50 rounded-lg animate-pulse"></div>
        </div>
        
        {/* Último monitoreo */}
        <div className="bg-gray-700/20 rounded-lg px-3 py-2 h-8 animate-pulse"></div>
        
        <Separator className="bg-gray-600" />
        
        {/* Botones de acción */}
        <div className="flex items-center justify-between">
          <div className="h-9 w-28 bg-gray-700 rounded animate-pulse"></div>
          <div className="flex items-center space-x-2">
            <div className="h-9 w-20 bg-gray-700 rounded animate-pulse"></div>
            <div className="h-9 w-10 bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
        
        {/* Stream URL */}
        <div className="bg-gray-700/20 rounded-lg p-3 space-y-2">
          <div className="h-3 bg-gray-700 rounded animate-pulse w-24"></div>
          <div className="h-4 bg-gray-800/50 rounded animate-pulse w-full"></div>
        </div>
        
        {/* Capacidades de monitoreo */}
        <div className="flex flex-wrap gap-2">
          <div className="h-6 w-16 bg-gray-700/30 rounded-lg animate-pulse"></div>
          <div className="h-6 w-12 bg-gray-700/30 rounded-lg animate-pulse"></div>
          <div className="h-6 w-20 bg-gray-700/30 rounded-lg animate-pulse"></div>
        </div>
      </CardContent>
    </Card>
  );
}

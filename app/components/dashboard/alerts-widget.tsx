'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  count?: number;
}

interface AlertsWidgetProps {
  unverifiedHighConfidence: number;
}

export function AlertsWidget({ unverifiedHighConfidence }: AlertsWidgetProps) {
  const alerts: Alert[] = [];

  // Agregar alerta de detecciones sin verificar
  if (unverifiedHighConfidence > 0) {
    alerts.push({
      id: 'unverified',
      type: 'warning',
      title: 'Detecciones sin verificar',
      message: `Hay ${unverifiedHighConfidence} detección${unverifiedHighConfidence > 1 ? 'es' : ''} con alta confianza pendiente${unverifiedHighConfidence > 1 ? 's' : ''} de verificación`,
      count: unverifiedHighConfidence
    });
  }

  // Si no hay alertas, mostrar mensaje de éxito
  if (alerts.length === 0) {
    alerts.push({
      id: 'all-good',
      type: 'success',
      title: 'Todo en orden',
      message: 'No hay alertas pendientes. El sistema funciona correctamente.'
    });
  }

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error': return <XCircle className="h-5 w-5 text-red-400" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'info': return <Info className="h-5 w-5 text-blue-400" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-400" />;
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'error': return 'border-red-500/50 bg-red-500/10';
      case 'warning': return 'border-yellow-500/50 bg-yellow-500/10';
      case 'info': return 'border-blue-500/50 bg-blue-500/10';
      case 'success': return 'border-green-500/50 bg-green-500/10';
    }
  };

  const getBadgeVariant = (type: Alert['type']) => {
    switch (type) {
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'info': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'success': return 'bg-green-500/20 text-green-400 border-green-500/50';
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-400" />
          Alertas y Notificaciones
        </CardTitle>
        <CardDescription className="text-slate-400">
          Avisos importantes del sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div 
              key={alert.id}
              className={`p-4 rounded-lg border ${getAlertColor(alert.type)} transition-colors`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-white text-sm">{alert.title}</p>
                    {alert.count && (
                      <Badge className={getBadgeVariant(alert.type)}>
                        {alert.count}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-300">{alert.message}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Agregar más alertas estáticas de ejemplo */}
          <div className="p-4 rounded-lg border border-blue-500/50 bg-blue-500/10 transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Info className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">Sistema actualizado</p>
                <p className="text-sm text-slate-300">
                  Nueva versión del sistema de detección instalada correctamente
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

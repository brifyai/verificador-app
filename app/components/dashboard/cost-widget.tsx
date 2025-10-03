'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface CostWidgetProps {
  currentMonthCost: number;
  previousMonthCost?: number;
}

export function CostWidget({ currentMonthCost, previousMonthCost }: CostWidgetProps) {
  const trend = previousMonthCost 
    ? ((currentMonthCost - previousMonthCost) / previousMonthCost) * 100
    : 0;

  const isPositiveTrend = trend > 0;

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-emerald-400" />
          Costos del Mes
        </CardTitle>
        <CardDescription className="text-slate-400">
          Gasto acumulado del mes actual
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-4xl font-bold text-white">
              ${currentMonthCost.toFixed(2)}
            </p>
            {previousMonthCost !== undefined && (
              <div className="flex items-center gap-2 mt-2">
                {isPositiveTrend ? (
                  <TrendingUp className="h-4 w-4 text-red-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-400" />
                )}
                <span className={`text-sm font-medium ${isPositiveTrend ? 'text-red-400' : 'text-green-400'}`}>
                  {isPositiveTrend ? '+' : ''}{trend.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-500">vs. mes anterior</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Transcripciones</span>
              <span className="text-white font-medium">${(currentMonthCost * 0.7).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Almacenamiento</span>
              <span className="text-white font-medium">${(currentMonthCost * 0.2).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Otros servicios</span>
              <span className="text-white font-medium">${(currentMonthCost * 0.1).toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Proyección fin de mes</span>
              <span className="text-lg font-bold text-emerald-400">
                ${(currentMonthCost * 1.3).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

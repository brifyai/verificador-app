'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MessageSquare, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TopPhrase {
  id: string;
  phrase: string | null;
  brand: string | null;
  detectionCount: number;
}

interface TopPhrasesWidgetProps {
  phrases: TopPhrase[];
}

export function TopPhrasesWidget({ phrases }: TopPhrasesWidgetProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-green-400" />
          Top 5 Frases/Marcas
        </CardTitle>
        <CardDescription className="text-slate-400">
          Frases más detectadas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {phrases.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No hay datos disponibles
          </div>
        ) : (
          phrases.map((phrase, index) => (
            <div 
              key={phrase.id} 
              className="flex items-start justify-between p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`flex-shrink-0 mt-1 ${
                  index === 0 ? 'text-yellow-400' :
                  index === 1 ? 'text-slate-400' :
                  index === 2 ? 'text-orange-400' :
                  'text-slate-500'
                }`}>
                  <Flame className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm">
                    {phrase.brand ? (
                      <Badge variant="outline" className="mr-2 border-blue-500 text-blue-400">
                        {phrase.brand}
                      </Badge>
                    ) : null}
                  </p>
                  <p className="text-sm text-slate-300 line-clamp-2 mt-1">
                    "{phrase.phrase || 'Sin frase'}"
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0 ml-4">
                <div className="text-right">
                  <p className="text-lg font-bold text-white">{phrase.detectionCount}</p>
                  <p className="text-xs text-slate-400">detecciones</p>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

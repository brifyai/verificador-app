'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Zap, Radio } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface RecentDetection {
  id: string;
  timestamp: string;
  confidence: number;
  detectedText: string;
  radio: {
    name: string;
    region: string | null;
  };
  phrase: {
    phrase: string;
    brand: string;
  };
}

interface RecentDetectionsWidgetProps {
  detections: RecentDetection[];
}

export function RecentDetectionsWidget({ detections }: RecentDetectionsWidgetProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-500/20 text-green-400 border-green-500/50';
    if (confidence >= 0.7) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    return 'bg-red-500/20 text-red-400 border-red-500/50';
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-400" />
          Últimas Detecciones
        </CardTitle>
        <CardDescription className="text-slate-400">
          Feed en tiempo real de detecciones
        </CardDescription>
      </CardHeader>
      <CardContent>
        {detections.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No hay detecciones recientes
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {detections.map((detection) => (
              <div 
                key={detection.id}
                className="p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors border border-slate-600/50"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-blue-400 flex-shrink-0" />
                    <span className="font-semibold text-white text-sm">{detection.radio.name}</span>
                  </div>
                  <Badge className={getConfidenceColor(detection.confidence)}>
                    {(detection.confidence * 100).toFixed(0)}%
                  </Badge>
                </div>
                
                <div className="mb-2">
                  <Badge variant="outline" className="border-purple-500 text-purple-400 text-xs">
                    {detection.phrase.brand}
                  </Badge>
                </div>

                <p className="text-sm text-slate-300 line-clamp-2 mb-2">
                  "{detection.detectedText}"
                </p>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{detection.radio.region || 'Sin región'}</span>
                  <span>
                    {formatDistanceToNow(new Date(detection.timestamp), {
                      addSuffix: true,
                      locale: es
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

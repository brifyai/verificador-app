'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, Radio, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ActiveSession {
  id: string;
  status: string;
  startTime: string;
  radio: {
    id: string;
    name: string;
    region: string | null;
  };
  totalCaptures: number;
  totalDetections: number;
}

interface ActiveSessionsWidgetProps {
  sessions: ActiveSession[];
}

export function ActiveSessionsWidget({ sessions }: ActiveSessionsWidgetProps) {
  const getTimeSince = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins}m`;
    }
    return `${diffMins}m`;
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-cyan-400" />
          Sesiones Activas
        </CardTitle>
        <CardDescription className="text-slate-400">
          {sessions.length} sesion{sessions.length !== 1 ? 'es' : ''} en monitoreo
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No hay sesiones activas
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sessions.map((session) => (
              <div 
                key={session.id}
                className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors border border-slate-600/50"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <Radio className="h-5 w-5 text-cyan-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{session.radio.name}</p>
                    <p className="text-xs text-slate-400">{session.radio.region || 'Sin región'}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getTimeSince(session.startTime)}
                      </span>
                      <span className="text-xs text-green-400">{session.totalCaptures} capturas</span>
                      <span className="text-xs text-blue-400">{session.totalDetections} detecciones</span>
                    </div>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                  <span className="animate-pulse mr-1">●</span>
                  Activa
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

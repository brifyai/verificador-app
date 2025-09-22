
'use client';

import { useState } from 'react';
import { CheckCircle, Play, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockVerificationItems, VerificationItem } from '@/lib/mock-data';

export default function Verificacion() {
  const [items, setItems] = useState<VerificationItem[]>(mockVerificationItems);

  const handleVerify = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Verificación</h1>
          <p className="text-slate-400 mt-1">
            Revisar y verificar detecciones pendientes
          </p>
        </div>
        <div className="flex items-center space-x-3 text-sm">
          <div className="flex items-center space-x-2 text-slate-400">
            <Clock className="w-4 h-4" />
            <span>{items.length} pendientes</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white">Pendientes Hoy</h3>
          <p className="text-3xl font-bold text-yellow-400 mt-2">{items.length}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white">Verificadas Hoy</h3>
          <p className="text-3xl font-bold text-green-400 mt-2">12</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white">Tiempo Promedio</h3>
          <p className="text-3xl font-bold text-blue-400 mt-2">2.5m</p>
        </div>
      </div>

      {/* Verification items */}
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:bg-slate-800/70 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-white">
                    Nueva detección para verificar
                  </h3>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
                  <p className="text-white font-medium mb-2">Frase detectada:</p>
                  <p className="text-lg text-blue-400 italic">"{item.phrase}"</p>
                </div>

                <div className="flex items-center space-x-6 text-sm text-slate-400">
                  <span>Marca: <span className="text-slate-300 font-medium">{item.marca}</span></span>
                  <span>Campaña: <span className="text-slate-300 font-medium">{item.campaña}</span></span>
                  <span>Detectado: <span className="text-slate-300 font-medium">{item.uploaded} 14:30</span></span>
                </div>
              </div>
              
              <div className="flex flex-col space-y-3">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                  onClick={() => handleVerify(item.id)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verificar
                </Button>
                <Button variant="outline" className="min-w-[120px]">
                  <Play className="w-4 h-4 mr-2" />
                  Reproducir
                </Button>
              </div>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="bg-slate-800/50 rounded-xl p-12 border border-slate-700 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              ¡Todo verificado!
            </h3>
            <p className="text-slate-400">
              No hay elementos pendientes de verificación en este momento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

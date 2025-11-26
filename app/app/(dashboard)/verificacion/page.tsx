
'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Play, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AudioPlayer } from '@/components/audio-player';

// Interfaz para los elementos de verificación basada en la estructura real
interface VerificationItem {
  id: string;
  phrase: string;
  marca: string;
  campaña: string;
  uploaded: string;
  time: string;
  radioName: string;
  audioPath?: string;
  confidence: number;
}

export default function Verificacion() {
  const [items, setItems] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifiedToday, setVerifiedToday] = useState(0);
  const { toast } = useToast();

  // Cargar los elementos de verificación al montar el componente
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch("/api/verificacion-direct");
        if (!response.ok) {
          throw new Error("Error al cargar los elementos de verificación");
        }
        const data = await response.json();
        
        // Transformar los datos de la API al formato que necesita la interfaz
        const formattedItems = data.map((item: any) => ({
          id: item.id,
          phrase: item.detectedText || item.phrase?.text || "Sin texto detectado",
          marca: item.phrase?.brand || "No especificada",
          campaña: item.phrase?.campaign || "No especificada",
          uploaded: new Date(item.timestamp).toLocaleDateString(),
          time: new Date(item.timestamp).toLocaleTimeString(),
          audioPath: item.capture?.audioUrl || null,
          radioName: item.radio?.name || "Radio desconocida",
          confidence: item.confidence || 0.75, // Valor por defecto si no existe
        }));
        
        setItems(formattedItems);
        
        // Obtener el número de verificaciones de hoy
        const todayVerified = await fetch("/api/verificacion-direct/stats");
        if (todayVerified.ok) {
          const stats = await todayVerified.json();
          setVerifiedToday(stats.verifiedToday || 0);
        }
      } catch (error) {
        console.error("Error fetching verification items:", error);
        toast.error("No se pudieron cargar los elementos de verificación");
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const handleVerify = async (id: string, isValid: boolean = true) => {
    try {
      const response = await fetch('/api/verificacion-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          falsePositive: !isValid
        }),
      });

      if (!response.ok) {
        throw new Error('Error al verificar el elemento');
      }

      // Eliminar el elemento verificado de la lista
      setItems(items.filter(item => item.id !== id));
      
      // Incrementar contador de verificaciones si es válida
      if (isValid) {
        setVerifiedToday(prev => prev + 1);
      }
      
      toast({
        title: isValid ? 'Verificación exitosa' : 'Marcada como falso positivo',
        description: isValid 
          ? 'Elemento verificado correctamente' 
          : 'Se ha marcado como falso positivo',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'No se pudo verificar el elemento',
        variant: 'destructive',
      });
    }
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
          <p className="text-3xl font-bold text-green-400 mt-2">{verifiedToday}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white">Tiempo Promedio</h3>
          <p className="text-3xl font-bold text-blue-400 mt-2">2.5m</p>
        </div>
      </div>

      {/* Verification items */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-slate-800/50 rounded-xl p-12 border border-slate-700 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Cargando...
            </h3>
            <p className="text-slate-400">
              Obteniendo elementos de verificación
            </p>
          </div>
        ) : (
          <>
            {items.map((item) => (
              <div key={item.id} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:bg-slate-800/70 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 mr-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-white">
                        Nueva detección para verificar
                      </h3>
                      <span className="text-sm text-slate-400">
                        Radio: <span className="text-slate-300 font-medium">{item.radioName}</span>
                      </span>
                    </div>
                    
                    <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
                      <p className="text-white font-medium mb-2">Frase detectada:</p>
                      <p className="text-lg text-blue-400 italic">"{item.phrase}"</p>
                      <div className="mt-2 flex items-center">
                        <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${item.confidence * 100}%` }}></div>
                        <span className="ml-2 text-sm text-slate-400">Confianza: {Math.round(item.confidence * 100)}%</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-sm text-slate-400">
                      <span>Marca: <span className="text-slate-300 font-medium">{item.marca}</span></span>
                      <span>Campaña: <span className="text-slate-300 font-medium">{item.campaña}</span></span>
                      <span>Detectado: <span className="text-slate-300 font-medium">{item.uploaded} {item.time}</span></span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-3">
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                      onClick={() => handleVerify(item.id, true)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verificar
                    </Button>
                    <Button 
                      variant="outline" 
                      className="min-w-[120px]"
                      onClick={() => handleVerify(item.id, false)}
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Falso positivo
                    </Button>
                    {item.audioPath && (
                      <Button variant="outline" className="min-w-[120px]">
                        <Play className="w-4 h-4 mr-2" />
                        Reproducir
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {!loading && items.length === 0 && (
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
          </>
        )}
      </div>
    </div>
  );
}

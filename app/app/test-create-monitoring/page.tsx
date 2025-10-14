'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestCreateMonitoring() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const createTestMonitoring = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('🧪 Creando monitoreo de prueba...');

      const testData = {
        userId: 'user123',
        radioIds: ['radio_cooperativa'],
        phraseId: 'test-phrase-id',
        days: [1, 2, 3, 4, 5], // Lunes a Viernes
        startTime: '09:00',
        endTime: '17:00',
        aiModel: 'estandar',
        description: 'Monitoreo de prueba desde test page'
      };

      console.log('📤 Enviando datos:', testData);

      const response = await fetch('/api/monitoring/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const data = await response.json();
      console.log('📥 Respuesta recibida:', data);

      setResult({
        success: response.ok,
        status: response.status,
        data: data
      });

    } catch (error: any) {
      console.error('❌ Error:', error);
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const checkSessions = async () => {
    try {
      const response = await fetch('/api/list-sessions');
      const data = await response.json();
      console.log('📊 Sesiones actuales:', data);
      alert(`Total de sesiones: ${data.total}\nActivas: ${data.summary.active}`);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Prueba de Creación de Monitoreo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={createTestMonitoring} 
              disabled={loading}
            >
              {loading ? 'Creando...' : '🚀 Crear Monitoreo de Prueba'}
            </Button>

            <Button 
              onClick={checkSessions}
              variant="outline"
            >
              📊 Ver Sesiones Actuales
            </Button>
          </div>

          {result && (
            <div className="mt-4 p-4 bg-slate-100 rounded-lg">
              <h3 className="font-bold mb-2">
                {result.success ? '✅ Resultado' : '❌ Error'}
              </h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-bold mb-2">📋 Instrucciones:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Haz clic en "Crear Monitoreo de Prueba"</li>
              <li>Abre la consola del navegador (F12)</li>
              <li>Revisa los logs del servidor en el terminal</li>
              <li>Busca las líneas que dicen "CHECKPOINT" y "RESULTADO"</li>
              <li>Haz clic en "Ver Sesiones Actuales" para confirmar</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

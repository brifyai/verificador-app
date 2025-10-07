import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Configuración de la VPS
const VPS_CONFIG = {
  host: process.env.VPS_HOST || '173.249.26.38',
  port: process.env.VPS_PORT || '3000',
  endpoint: '/api/schedule'
};

export async function GET() {
  try {
    console.log('🔍 Verificando estado de la VPS...');
    
    const healthUrl = `http://${VPS_CONFIG.host}:${VPS_CONFIG.port}/`;
    const startTime = Date.now();
    
    try {
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(10000) // 10 segundos timeout
      });
      
      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok;
      
      let vpsInfo = null;
      if (isHealthy) {
        try {
          vpsInfo = await response.json();
        } catch (e) {
          vpsInfo = { message: 'VPS responde pero no devuelve JSON válido' };
        }
      }
      
      return NextResponse.json({
        vps: {
          host: VPS_CONFIG.host,
          port: VPS_CONFIG.port,
          endpoint: VPS_CONFIG.endpoint,
          url: healthUrl,
          status: isHealthy ? 'online' : 'offline',
          responseTime: `${responseTime}ms`,
          httpStatus: response.status,
          info: vpsInfo
        },
        timestamp: new Date().toISOString(),
        healthy: isHealthy
      });
      
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      return NextResponse.json({
        vps: {
          host: VPS_CONFIG.host,
          port: VPS_CONFIG.port,
          endpoint: VPS_CONFIG.endpoint,
          url: healthUrl,
          status: 'offline',
          responseTime: `${responseTime}ms (timeout)`,
          error: error.message,
          errorType: error.name
        },
        timestamp: new Date().toISOString(),
        healthy: false,
        troubleshooting: {
          possibleCauses: [
            'El servidor VPS no está corriendo',
            'Problemas de red o conectividad',
            'Firewall bloqueando el puerto 3000',
            'La IP de la VPS ha cambiado',
            'El proceso Node.js se detuvo en la VPS'
          ],
          solutions: [
            'Conectarse por SSH y verificar: ps aux | grep node',
            'Reiniciar el servidor: cd /root/radio-api && npm start',
            'Verificar firewall: ufw status',
            'Verificar conectividad: ping 173.249.26.38'
          ]
        }
      }, { status: 503 });
    }
    
  } catch (error: any) {
    console.error('❌ Error verificando VPS:', error);
    
    return NextResponse.json({
      error: 'Error interno al verificar VPS',
      details: error.message,
      timestamp: new Date().toISOString(),
      healthy: false
    }, { status: 500 });
  }
}

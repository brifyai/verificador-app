import { NextRequest, NextResponse } from 'next/server';
import { supabaseDirect } from '@/lib/supabase-direct';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Usando cliente directo de Supabase API...');
    
    // Probar conexión
    const connectionTest = await supabaseDirect.testConnection();
    if (!connectionTest.success) {
      console.error('❌ Error de conexión:', connectionTest.message);
      return NextResponse.json(
        { error: 'Error conectando a Supabase API', details: connectionTest.message },
        { status: 500 }
      );
    }

    console.log('✅ Conexión exitosa, obteniendo estadísticas...');
    
    // Obtener estadísticas del dashboard
    const stats = await supabaseDirect.getDashboardStats();
    
    console.log('✅ Estadísticas obtenidas exitosamente');
    
    return NextResponse.json(stats);
    
  } catch (error) {
    console.error('❌ Error en dashboard/stats-direct:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
        fallback: {
          overview: {
            totalDetections: 0,
            todayDetections: 0,
            weekDetections: 0,
            monthDetections: 0,
            totalRadios: 0,
            totalPhrases: 0,
          },
          activity: {
            hourlyData: [],
            recentDetections: [],
          },
          rankings: {
            topPhrases: [],
            topRadios: [],
            regionData: [],
          },
          costs: {
            totalCosts: 0,
            detectionCosts: 0,
            captureCosts: 0,
            costPerDetection: 0,
          },
          verification: {
            verifiedDetections: 0,
            unverifiedHighConfidence: 0,
            verificationRate: 0,
          },
        }
      },
      { status: 500 }
    );
  }
}
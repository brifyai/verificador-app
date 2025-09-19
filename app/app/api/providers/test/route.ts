
import { NextRequest, NextResponse } from 'next/server';

interface TestResult {
  success: boolean;
  provider: string;
  model: string;
  responseTime: number;
  error?: string;
  sampleTranscription?: string;
  cost: number;
  accuracy?: number;
}

// Simulador de prueba de API
async function testProvider(providerId: string, modelId: string, apiKey?: string): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Simular diferentes tiempos de respuesta según el proveedor
    const responseTime = Math.random() * 3000 + 500; // 0.5-3.5 segundos
    await new Promise(resolve => setTimeout(resolve, Math.min(responseTime, 2000)));
    
    const endTime = Date.now();
    const actualResponseTime = endTime - startTime;
    
    // Simular resultados basados en el proveedor
    const mockResults: Record<string, Partial<TestResult>> = {
      'abacus-ai': {
        success: true,
        sampleTranscription: 'Esta es una prueba de transcripción usando Abacus AI. La precisión es muy alta para español chileno.',
        accuracy: Math.random() * 5 + 95, // 95-100%
        cost: 0.05
      },
      'groq-api': {
        success: true,
        sampleTranscription: 'Transcripción ultra-rápida con Groq API. Ideal para procesamiento en tiempo real.',
        accuracy: Math.random() * 3 + 92, // 92-95%
        cost: 0.01
      },
      'openai': {
        success: true,
        sampleTranscription: 'OpenAI Whisper transcripción. Soporte multiidioma excelente.',
        accuracy: Math.random() * 4 + 91, // 91-95%
        cost: 0.006
      },
      'assemblyai': {
        success: true,
        sampleTranscription: 'AssemblyAI transcription test. Good accuracy and speed.',
        accuracy: Math.random() * 7 + 88, // 88-95%
        cost: 0.00037
      }
    };
    
    // Simular fallo ocasional (5% probabilidad)
    if (Math.random() < 0.05) {
      return {
        success: false,
        provider: providerId,
        model: modelId,
        responseTime: actualResponseTime,
        error: 'API key inválida o servicio temporalmente no disponible',
        cost: 0
      };
    }
    
    const result = mockResults[providerId] || {
      success: true,
      sampleTranscription: 'Transcripción de prueba generada exitosamente.',
      accuracy: Math.random() * 10 + 85,
      cost: 0.02
    };
    
    return {
      ...result,
      provider: providerId,
      model: modelId,
      responseTime: actualResponseTime
    } as TestResult;
    
  } catch (error) {
    return {
      success: false,
      provider: providerId,
      model: modelId,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Error desconocido',
      cost: 0
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { providerId, modelId, apiKey, testAudio } = await request.json();
    
    if (!providerId || !modelId) {
      return NextResponse.json(
        { error: 'Se requiere providerId y modelId' },
        { status: 400 }
      );
    }
    
    console.log(`🧪 Probando API: ${providerId} - ${modelId}`);
    
    const result = await testProvider(providerId, modelId, apiKey);
    
    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error probando API:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// GET - Probar múltiples proveedores simultáneamente
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const providers = url.searchParams.get('providers')?.split(',') || [];
    
    if (providers.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere al menos un proveedor' },
        { status: 400 }
      );
    }
    
    console.log(`🧪 Probando múltiples APIs: ${providers.join(', ')}`);
    
    const testPromises = providers.map(async (providerId) => {
      try {
        return await testProvider(providerId, 'default', '');
      } catch (error) {
        return {
          success: false,
          provider: providerId,
          model: 'default',
          responseTime: 0,
          error: error instanceof Error ? error.message : 'Error de conexión',
          cost: 0
        };
      }
    });
    
    const results = await Promise.all(testPromises);
    
    // Calcular estadísticas
    const stats = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      averageResponseTime: results.reduce((sum, r) => sum + r.responseTime, 0) / results.length,
      totalCost: results.reduce((sum, r) => sum + r.cost, 0),
      averageAccuracy: results
        .filter(r => r.success && r.accuracy)
        .reduce((sum, r, _, arr) => sum + (r.accuracy! / arr.length), 0)
    };
    
    return NextResponse.json({
      success: true,
      results,
      stats,
      timestamp: new Date().toISOString(),
      recommendation: stats.successful > 0 ? 
        results
          .filter(r => r.success)
          .sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0))[0].provider
        : null
    });
    
  } catch (error) {
    console.error('Error en prueba múltiple:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

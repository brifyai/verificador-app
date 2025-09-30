
import { NextRequest, NextResponse } from 'next/server';
import LocalAudioService from '@/lib/local-audio-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const radioId = searchParams.get('radioId');
    const phrase = searchParams.get('phrase');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const audioService = new LocalAudioService();
    
    // Obtener lista de audios con filtros
    const result = await audioService.getAudioFiles({
      radioId: radioId || undefined,
      phrase: phrase || undefined,
      page,
      limit
    });

    return NextResponse.json({
      success: true,
      audios: result.files,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    console.error('Error obteniendo lista de audios:', error);
    
    // En caso de error, retornar lista vacía
    return NextResponse.json({
      success: true,
      audios: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      }
    });
  }
}

// Función helper para extraer el nombre de la radio del nombre del archivo
function extractRadioName(filename: string): string {
  const parts = filename.split('_');
  return parts.length > 1 ? parts[1].replace(/[-_]/g, ' ') : 'Radio Desconocida';
}

// Función helper para extraer la frase del nombre del archivo
function extractPhrase(filename: string): string {
  const parts = filename.split('_');
  return parts.length > 2 ? parts[2] : 'Frase no identificada';
}

// Función helper para estimar la duración basada en el tamaño del archivo
function estimateDuration(sizeInBytes: number): number {
  // Estimación aproximada: 1MB ≈ 60 segundos de audio MP3 a 128kbps
  const sizeInMB = sizeInBytes / (1024 * 1024);
  return Math.round(sizeInMB * 60);
}

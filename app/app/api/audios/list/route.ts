
import { NextRequest, NextResponse } from 'next/server';
import { GoogleDriveService, getDriveConfig } from '@/lib/google-drive';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const radioId = searchParams.get('radioId') || undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const phrase = searchParams.get('phrase') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;

    const driveConfig = getDriveConfig();
    const driveService = new GoogleDriveService(driveConfig);

    // Buscar audios con filtros
    const audioFiles = await driveService.searchAudios({
      radioId,
      startDate,
      endDate,
      phrase,
      limit
    });

    // Formatear respuesta para el frontend
    const audios = audioFiles.map(file => ({
      id: file.id,
      name: file.name,
      radioName: extractRadioName(file.name),
      phrase: extractPhrase(file.name),
      timestamp: file.createdTime,
      duration: estimateDuration(file.size),
      size: file.size,
      audioUrl: `https://drive.google.com/uc?export=download&id=${file.id}`,
      downloadUrl: file.webContentLink,
      transcription: undefined // Se puede obtener desde la BD si está disponible
    }));

    return NextResponse.json({
      success: true,
      audios,
      total: audios.length
    });
  } catch (error) {
    console.error('Error obteniendo lista de audios:', error);
    return NextResponse.json({
      success: false,
      error: 'Error obteniendo audios',
      audios: []
    }, { status: 500 });
  }
}

// Funciones helper para extraer información del nombre del archivo
function extractRadioName(fileName: string): string {
  // Formato: 2024-09-07T14-30-25_radio_cooperativa_coca_cola_det123.wav
  const parts = fileName.split('_');
  if (parts.length >= 3) {
    return parts[1].replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  return 'Radio Desconocida';
}

function extractPhrase(fileName: string): string {
  // Extraer la parte de la frase del nombre del archivo
  const parts = fileName.split('_');
  if (parts.length >= 4) {
    const phrasesParts = parts.slice(2, -1); // Omitir timestamp, radio y detectionId
    return phrasesParts.join(' ').replace(/[_-]/g, ' ');
  }
  return 'Frase no identificada';
}

function estimateDuration(sizeBytes: number): number {
  // Estimar duración basada en el tamaño del archivo
  // Asumiendo audio WAV de calidad estándar: ~1MB por minuto
  const estimatedMinutes = sizeBytes / (1024 * 1024);
  return Math.max(30, Math.min(180, estimatedMinutes * 60)); // Entre 30 seg y 3 min
}

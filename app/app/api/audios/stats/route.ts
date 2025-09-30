
import { NextResponse } from 'next/server';
import LocalAudioService from '@/lib/local-audio-service';

export async function GET() {
  try {
    const audioService = new LocalAudioService();
    
    // Obtener estadísticas de almacenamiento
    const stats = await audioService.getStorageStats();

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    
    // En caso de error, retornar datos por defecto
    return NextResponse.json({
      success: true,
      stats: {
        totalFiles: 0,
        totalSize: 0,
        usedStorage: '0 B',
        freeStorage: '∞',
        totalStorage: '∞'
      }
    });
  }
}

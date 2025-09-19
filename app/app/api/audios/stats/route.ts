
import { NextResponse } from 'next/server';
import { GoogleDriveService, getDriveConfig } from '@/lib/google-drive';

export async function GET() {
  try {
    const driveConfig = getDriveConfig();
    const driveService = new GoogleDriveService(driveConfig);

    // Obtener estadísticas de almacenamiento
    const stats = await driveService.getStorageStats();

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json({
      success: false,
      error: 'Error obteniendo estadísticas',
      stats: {
        totalFiles: 0,
        totalSize: 0,
        usedStorage: '0 B'
      }
    }, { status: 500 });
  }
}

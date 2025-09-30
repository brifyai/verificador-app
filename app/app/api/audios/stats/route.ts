
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Estadísticas de demostración
    return NextResponse.json({
      success: true,
      stats: {
        totalFiles: 4,
        totalSize: 15 * 1024 * 1024, // 15 MB en bytes
        usedStorage: '15 MB'
      }
    });
  } catch (error) {
    console.error('❌ Error generando estadísticas de demostración:', error);
    return NextResponse.json({
      success: true,
      stats: {
        totalFiles: 0,
        totalSize: 0,
        usedStorage: '0 MB'
      },
      error: 'Error generando estadísticas de demostración'
    });
  }
}

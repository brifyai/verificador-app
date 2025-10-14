import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

interface PhraseDetection {
  phrase: string;
  brand: string;
  campaign?: string;
  matches: Array<{
    matchedText: string;
    confidence: number;
    position: number;
    wordPosition: number;
    context: string;
  }>;
}

interface DetectionFile {
  folderName: string;
  timestamp: string;
  totalMatches: number;
  detections: PhraseDetection[];
}

interface DetectionResult {
  folderName: string;
  folderPath: string;
  timestamp: string;
  totalMatches: number;
  detections: PhraseDetection[];
  recordingDate: string;
}

/**
 * GET /api/phrases/detections
 * Lee los archivos phrase-detections.json de las carpetas de grabaciones
 * 
 * Query params:
 * - recordingsDir: Directorio de grabaciones (opcional)
 * - dateFrom: Fecha desde (opcional)
 * - dateTo: Fecha hasta (opcional)
 * - limit: Límite de resultados (opcional, default: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recordingsDir = searchParams.get('recordingsDir') || './recordings';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = parseInt(searchParams.get('limit') || '100');

    console.log('📥 Obteniendo detecciones automáticas...');

    // Verificar que el directorio existe
    if (!fs.existsSync(recordingsDir)) {
      return NextResponse.json({
        success: false,
        error: 'Directorio de grabaciones no encontrado',
      }, { status: 404 });
    }

    const detections: DetectionResult[] = [];
    const folders = findRecordingFolders(recordingsDir);

    // Filtros de fecha
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;

    for (const folder of folders) {
      const detectionsPath = path.join(folder.path, 'phrase-detections.json');

      if (fs.existsSync(detectionsPath)) {
        try {
          const fileContent = fs.readFileSync(detectionsPath, 'utf8');
          const detectionData: DetectionFile = JSON.parse(fileContent);

          // Extraer fecha de la grabación del nombre de carpeta
          const recordingDate = extractTimestampFromFolderName(folder.name);
          const recordingDateTime = new Date(recordingDate);

          // Aplicar filtros de fecha
          if (fromDate && recordingDateTime < fromDate) continue;
          if (toDate && recordingDateTime > toDate) continue;

          detections.push({
            folderName: folder.name,
            folderPath: folder.path,
            timestamp: detectionData.timestamp,
            totalMatches: detectionData.totalMatches,
            detections: detectionData.detections,
            recordingDate: recordingDate,
          });
        } catch (error) {
          console.error(`Error leyendo ${detectionsPath}:`, error);
        }
      }
    }

    // Ordenar por fecha de grabación (más recientes primero)
    detections.sort((a, b) => 
      new Date(b.recordingDate).getTime() - new Date(a.recordingDate).getTime()
    );

    // Aplicar límite
    const limitedDetections = detections.slice(0, limit);

    // Calcular estadísticas
    const totalMatches = detections.reduce((sum, d) => sum + d.totalMatches, 0);
    const phraseStats = calculatePhraseStats(detections);

    return NextResponse.json({
      success: true,
      data: {
        total: detections.length,
        returned: limitedDetections.length,
        totalMatches: totalMatches,
        phraseStats: phraseStats,
        detections: limitedDetections,
      },
      message: `${limitedDetections.length} detecciones encontradas con ${totalMatches} coincidencias totales`,
    });

  } catch (error: any) {
    console.error('❌ Error obteniendo detecciones:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener detecciones',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/phrases/detections
 * Elimina archivos de detecciones (útil para reprocesar)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recordingsDir = searchParams.get('recordingsDir') || './recordings';
    const folderName = searchParams.get('folderName');

    if (folderName) {
      // Eliminar detección específica
      const folderPath = path.join(recordingsDir, folderName);
      const detectionsPath = path.join(folderPath, 'phrase-detections.json');

      if (fs.existsSync(detectionsPath)) {
        fs.unlinkSync(detectionsPath);
        return NextResponse.json({
          success: true,
          message: `Detección eliminada: ${folderName}`,
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Archivo de detección no encontrado',
        }, { status: 404 });
      }
    } else {
      // Eliminar todas las detecciones
      const folders = findRecordingFolders(recordingsDir);
      let deleted = 0;

      for (const folder of folders) {
        const detectionsPath = path.join(folder.path, 'phrase-detections.json');
        if (fs.existsSync(detectionsPath)) {
          fs.unlinkSync(detectionsPath);
          deleted++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `${deleted} archivos de detección eliminados`,
        deleted: deleted,
      });
    }
  } catch (error: any) {
    console.error('❌ Error eliminando detecciones:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al eliminar detecciones',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Encuentra carpetas de grabaciones
 */
function findRecordingFolders(recordingsDir: string): Array<{ name: string; path: string; created: Date }> {
  const folders: Array<{ name: string; path: string; created: Date }> = [];

  if (!fs.existsSync(recordingsDir)) {
    return folders;
  }

  const items = fs.readdirSync(recordingsDir);

  for (const item of items) {
    const itemPath = path.join(recordingsDir, item);
    try {
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        folders.push({
          name: item,
          path: itemPath,
          created: stat.birthtime,
        });
      }
    } catch (error) {
      // Ignorar errores
    }
  }

  return folders.sort((a, b) => b.created.getTime() - a.created.getTime());
}

/**
 * Extrae timestamp del nombre de carpeta
 */
function extractTimestampFromFolderName(folderName: string): string {
  const parts = folderName.split('_');
  
  if (parts.length >= 3) {
    const date = parts[parts.length - 2]; // YYYY-MM-DD
    const time = parts[parts.length - 1].replace(/-/g, ':'); // HH:MM:SS
    return `${date} ${time}`;
  }

  return 'Unknown';
}

/**
 * Calcula estadísticas por frase
 */
function calculatePhraseStats(detections: DetectionResult[]) {
  const phraseMap = new Map<string, { phrase: string; brand: string; count: number }>();

  for (const detection of detections) {
    for (const phraseDetection of detection.detections) {
      const key = `${phraseDetection.phrase}|${phraseDetection.brand}`;
      
      if (phraseMap.has(key)) {
        const stat = phraseMap.get(key)!;
        stat.count += phraseDetection.matches.length;
      } else {
        phraseMap.set(key, {
          phrase: phraseDetection.phrase,
          brand: phraseDetection.brand,
          count: phraseDetection.matches.length,
        });
      }
    }
  }

  return Array.from(phraseMap.values())
    .sort((a, b) => b.count - a.count);
}

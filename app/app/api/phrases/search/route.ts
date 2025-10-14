import { NextRequest, NextResponse } from 'next/server';
import { phraseSearchService } from '@/lib/phrase-search-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutos para búsquedas largas

/**
 * GET /api/phrases/search
 * Busca frases en transcripciones de audio
 * 
 * Query params:
 * - phraseIds: IDs de frases específicas (opcional, separados por coma)
 * - recordingsDir: Directorio de grabaciones (opcional, por defecto './recordings')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phraseIdsParam = searchParams.get('phraseIds');
    const recordingsDir = searchParams.get('recordingsDir');

    console.log('🔍 Iniciando búsqueda de frases en transcripciones...');

    // Configurar directorio de grabaciones si se proporciona
    if (recordingsDir) {
      phraseSearchService.setRecordingsDir(recordingsDir);
    }

    let results;

    if (phraseIdsParam) {
      // Buscar frases específicas
      const phraseIds = phraseIdsParam.split(',').map(id => id.trim()).filter(id => id);
      console.log(`📝 Buscando ${phraseIds.length} frases específicas`);
      results = await phraseSearchService.searchSpecificPhrases(phraseIds);
    } else {
      // Buscar todas las frases activas
      console.log('📝 Buscando todas las frases activas');
      results = await phraseSearchService.searchAllTranscriptions();
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `Búsqueda completada: ${results.totalMatches} coincidencias encontradas en ${results.foldersWithMatches} grabaciones`,
    });

  } catch (error: any) {
    console.error('❌ Error en búsqueda de frases:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al buscar frases en transcripciones',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/phrases/search
 * Busca frases en transcripciones con configuración avanzada
 * 
 * Body:
 * {
 *   phraseIds?: string[],
 *   recordingsDir?: string,
 *   dateFrom?: string,
 *   dateTo?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phraseIds, recordingsDir, dateFrom, dateTo } = body;

    console.log('🔍 Búsqueda avanzada de frases en transcripciones...');

    // Configurar directorio de grabaciones
    if (recordingsDir) {
      phraseSearchService.setRecordingsDir(recordingsDir);
    }

    let results;

    if (phraseIds && Array.isArray(phraseIds) && phraseIds.length > 0) {
      results = await phraseSearchService.searchSpecificPhrases(phraseIds);
    } else {
      results = await phraseSearchService.searchAllTranscriptions();
    }

    // Filtrar por fechas si se proporcionan
    if (dateFrom || dateTo) {
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;

      results.results = results.results.filter(result => {
        const resultDate = new Date(result.timestamp);
        
        if (fromDate && resultDate < fromDate) return false;
        if (toDate && resultDate > toDate) return false;
        
        return true;
      });

      // Recalcular estadísticas
      results.foldersWithMatches = results.results.length;
      results.totalMatches = results.results.reduce((sum, r) => sum + r.matches.length, 0);
      
      // Recalcular estadísticas de frases
      const phraseCounts = new Map<string, number>();
      results.results.forEach(result => {
        result.matches.forEach(match => {
          phraseCounts.set(
            match.phraseId,
            (phraseCounts.get(match.phraseId) || 0) + 1
          );
        });
      });

      results.phraseStats = results.phraseStats.map(stat => ({
        ...stat,
        matchCount: phraseCounts.get(stat.phraseId) || 0,
      })).filter(stat => stat.matchCount > 0);
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `Búsqueda completada: ${results.totalMatches} coincidencias encontradas en ${results.foldersWithMatches} grabaciones`,
      filters: {
        phraseIds: phraseIds || 'all',
        dateFrom: dateFrom || 'none',
        dateTo: dateTo || 'none',
      },
    });

  } catch (error: any) {
    console.error('❌ Error en búsqueda avanzada de frases:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al buscar frases en transcripciones',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

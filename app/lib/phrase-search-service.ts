/**
 * Servicio para buscar frases clave en transcripciones de audio
 * Busca en los archivos de transcripción y reporta el timestamp donde se encontró
 */

import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/db';

export interface PhraseMatch {
  phraseId: string;
  phrase: string;
  brand: string;
  campaign?: string;
  matchedText: string;
  confidence: number;
  position: number; // Posición del carácter en el texto
  wordPosition: number; // Posición de la palabra en el texto
  context: string; // Contexto alrededor de la coincidencia
}

export interface TranscriptionSearchResult {
  folderName: string;
  folderPath: string;
  audioFile: string;
  transcriptionFile: string;
  transcriptionLength: number;
  wordCount: number;
  matches: PhraseMatch[];
  timestamp: string; // Timestamp de la grabación
}

export interface SearchSummary {
  totalFolders: number;
  foldersWithMatches: number;
  totalMatches: number;
  phraseStats: {
    phraseId: string;
    phrase: string;
    brand: string;
    matchCount: number;
  }[];
  results: TranscriptionSearchResult[];
}

class PhraseSearchService {
  private recordingsDir: string;

  constructor(recordingsDir: string = './recordings') {
    this.recordingsDir = recordingsDir;
  }

  /**
   * Busca todas las frases activas en todas las transcripciones disponibles
   */
  async searchAllTranscriptions(): Promise<SearchSummary> {
    console.log('🔍 Iniciando búsqueda de frases en transcripciones...');

    // Obtener todas las frases activas de la BD
    const activePhrases = await prisma.phrase.findMany({
      where: { active: true },
      select: {
        id: true,
        phrase: true,
        brand: true,
        campaign: true,
        confidence: true,
      },
    });

    if (activePhrases.length === 0) {
      console.log('⚠️ No hay frases activas para buscar');
      return {
        totalFolders: 0,
        foldersWithMatches: 0,
        totalMatches: 0,
        phraseStats: [],
        results: [],
      };
    }

    console.log(`📝 Buscando ${activePhrases.length} frases activas...`);

    // Buscar carpetas de grabaciones
    const recordingFolders = this.findRecordingFolders();
    console.log(`📁 Encontradas ${recordingFolders.length} carpetas de grabaciones`);

    const results: TranscriptionSearchResult[] = [];
    const phraseMatchCounts = new Map<string, number>();

    // Inicializar contadores
    activePhrases.forEach((phrase) => {
      phraseMatchCounts.set(phrase.id, 0);
    });

    // Procesar cada carpeta
    for (const folder of recordingFolders) {
      const transcriptionPath = path.join(folder.path, 'transcription.txt');
      const metadataPath = path.join(folder.path, 'transcription.json');

      // Verificar si existe transcripción
      if (!fs.existsSync(transcriptionPath)) {
        continue;
      }

      try {
        // Leer transcripción
        const transcriptionText = fs.readFileSync(transcriptionPath, 'utf8');
        
        // Leer metadata si existe
        let metadata: any = {};
        if (fs.existsSync(metadataPath)) {
          metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        }

        // Buscar todas las frases en esta transcripción
        const matches: PhraseMatch[] = [];

        for (const phrase of activePhrases) {
          const phraseMatches = this.findPhraseInText(
            transcriptionText,
            phrase.phrase,
            phrase.id,
            phrase.brand,
            phrase.campaign || undefined,
            phrase.confidence
          );

          matches.push(...phraseMatches);
          phraseMatchCounts.set(
            phrase.id,
            (phraseMatchCounts.get(phrase.id) || 0) + phraseMatches.length
          );
        }

        // Si hay coincidencias, agregar a resultados
        if (matches.length > 0) {
          results.push({
            folderName: folder.name,
            folderPath: folder.path,
            audioFile: metadata.audioFile || 'unknown',
            transcriptionFile: transcriptionPath,
            transcriptionLength: transcriptionText.length,
            wordCount: transcriptionText.split(/\s+/).length,
            matches,
            timestamp: this.extractTimestampFromFolderName(folder.name),
          });
        }
      } catch (error) {
        console.error(`❌ Error procesando ${folder.name}:`, error);
      }
    }

    // Calcular estadísticas
    const phraseStats = activePhrases.map((phrase) => ({
      phraseId: phrase.id,
      phrase: phrase.phrase,
      brand: phrase.brand,
      matchCount: phraseMatchCounts.get(phrase.id) || 0,
    }));

    const summary: SearchSummary = {
      totalFolders: recordingFolders.length,
      foldersWithMatches: results.length,
      totalMatches: results.reduce((sum, r) => sum + r.matches.length, 0),
      phraseStats: phraseStats.filter((p) => p.matchCount > 0),
      results,
    };

    console.log(`✅ Búsqueda completada: ${summary.totalMatches} coincidencias en ${summary.foldersWithMatches} grabaciones`);

    return summary;
  }

  /**
   * Busca frases específicas en transcripciones
   */
  async searchSpecificPhrases(phraseIds: string[]): Promise<SearchSummary> {
    console.log(`🔍 Buscando frases específicas: ${phraseIds.length} frases`);

    const phrases = await prisma.phrase.findMany({
      where: {
        id: { in: phraseIds },
        active: true,
      },
      select: {
        id: true,
        phrase: true,
        brand: true,
        campaign: true,
        confidence: true,
      },
    });

    if (phrases.length === 0) {
      return {
        totalFolders: 0,
        foldersWithMatches: 0,
        totalMatches: 0,
        phraseStats: [],
        results: [],
      };
    }

    const recordingFolders = this.findRecordingFolders();
    const results: TranscriptionSearchResult[] = [];
    const phraseMatchCounts = new Map<string, number>();

    phrases.forEach((phrase) => {
      phraseMatchCounts.set(phrase.id, 0);
    });

    for (const folder of recordingFolders) {
      const transcriptionPath = path.join(folder.path, 'transcription.txt');
      const metadataPath = path.join(folder.path, 'transcription.json');

      if (!fs.existsSync(transcriptionPath)) {
        continue;
      }

      try {
        const transcriptionText = fs.readFileSync(transcriptionPath, 'utf8');
        let metadata: any = {};
        if (fs.existsSync(metadataPath)) {
          metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        }

        const matches: PhraseMatch[] = [];

        for (const phrase of phrases) {
          const phraseMatches = this.findPhraseInText(
            transcriptionText,
            phrase.phrase,
            phrase.id,
            phrase.brand,
            phrase.campaign || undefined,
            phrase.confidence
          );

          matches.push(...phraseMatches);
          phraseMatchCounts.set(
            phrase.id,
            (phraseMatchCounts.get(phrase.id) || 0) + phraseMatches.length
          );
        }

        if (matches.length > 0) {
          results.push({
            folderName: folder.name,
            folderPath: folder.path,
            audioFile: metadata.audioFile || 'unknown',
            transcriptionFile: transcriptionPath,
            transcriptionLength: transcriptionText.length,
            wordCount: transcriptionText.split(/\s+/).length,
            matches,
            timestamp: this.extractTimestampFromFolderName(folder.name),
          });
        }
      } catch (error) {
        console.error(`❌ Error procesando ${folder.name}:`, error);
      }
    }

    const phraseStats = phrases.map((phrase) => ({
      phraseId: phrase.id,
      phrase: phrase.phrase,
      brand: phrase.brand,
      matchCount: phraseMatchCounts.get(phrase.id) || 0,
    }));

    return {
      totalFolders: recordingFolders.length,
      foldersWithMatches: results.length,
      totalMatches: results.reduce((sum, r) => sum + r.matches.length, 0),
      phraseStats: phraseStats.filter((p) => p.matchCount > 0),
      results,
    };
  }

  /**
   * Busca una frase en un texto y devuelve todas las coincidencias
   */
  private findPhraseInText(
    text: string,
    phrase: string,
    phraseId: string,
    brand: string,
    campaign?: string,
    minConfidence: number = 0.85
  ): PhraseMatch[] {
    const matches: PhraseMatch[] = [];
    const normalizedText = text.toLowerCase();
    const normalizedPhrase = phrase.toLowerCase();

    // Buscar coincidencias exactas
    let position = 0;
    while ((position = normalizedText.indexOf(normalizedPhrase, position)) !== -1) {
      const matchedText = text.substring(position, position + phrase.length);
      const wordsBefore = text.substring(0, position).split(/\s+/).length;
      
      // Extraer contexto (50 caracteres antes y después)
      const contextStart = Math.max(0, position - 50);
      const contextEnd = Math.min(text.length, position + phrase.length + 50);
      const context = text.substring(contextStart, contextEnd);

      matches.push({
        phraseId,
        phrase,
        brand,
        campaign,
        matchedText,
        confidence: 1.0, // Coincidencia exacta
        position,
        wordPosition: wordsBefore,
        context: `...${context}...`,
      });

      position += phrase.length;
    }

    // Buscar coincidencias difusas (palabras similares)
    if (matches.length === 0 && minConfidence < 1.0) {
      const fuzzyMatches = this.findFuzzyMatches(text, phrase, phraseId, brand, campaign, minConfidence);
      matches.push(...fuzzyMatches);
    }

    return matches;
  }

  /**
   * Busca coincidencias difusas usando similitud de palabras
   */
  private findFuzzyMatches(
    text: string,
    phrase: string,
    phraseId: string,
    brand: string,
    campaign?: string,
    minConfidence: number = 0.85
  ): PhraseMatch[] {
    const matches: PhraseMatch[] = [];
    const phraseWords = phrase.toLowerCase().split(/\s+/);
    const textWords = text.split(/\s+/);

    // Buscar secuencias de palabras similares
    for (let i = 0; i <= textWords.length - phraseWords.length; i++) {
      const windowWords = textWords.slice(i, i + phraseWords.length);
      const similarity = this.calculateSimilarity(
        phraseWords.join(' '),
        windowWords.join(' ').toLowerCase()
      );

      if (similarity >= minConfidence) {
        const matchedText = windowWords.join(' ');
        const position = text.indexOf(matchedText);
        
        if (position !== -1) {
          const contextStart = Math.max(0, position - 50);
          const contextEnd = Math.min(text.length, position + matchedText.length + 50);
          const context = text.substring(contextStart, contextEnd);

          matches.push({
            phraseId,
            phrase,
            brand,
            campaign,
            matchedText,
            confidence: similarity,
            position,
            wordPosition: i,
            context: `...${context}...`,
          });
        }
      }
    }

    return matches;
  }

  /**
   * Calcula similitud entre dos textos (Levenshtein simplificado)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calcula distancia de Levenshtein entre dos strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Encuentra carpetas de grabaciones
   */
  private findRecordingFolders(): Array<{ name: string; path: string; created: Date }> {
    const folders: Array<{ name: string; path: string; created: Date }> = [];

    if (!fs.existsSync(this.recordingsDir)) {
      console.log('⚠️ Directorio de grabaciones no existe:', this.recordingsDir);
      return folders;
    }

    const items = fs.readdirSync(this.recordingsDir);

    for (const item of items) {
      const itemPath = path.join(this.recordingsDir, item);
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
        console.error(`Error leyendo ${itemPath}:`, error);
      }
    }

    return folders.sort((a, b) => b.created.getTime() - a.created.getTime());
  }

  /**
   * Extrae timestamp del nombre de carpeta
   * Formato esperado: RadioName_YYYY-MM-DD_HH-MM-SS
   */
  private extractTimestampFromFolderName(folderName: string): string {
    const parts = folderName.split('_');
    
    if (parts.length >= 3) {
      const date = parts[parts.length - 2]; // YYYY-MM-DD
      const time = parts[parts.length - 1].replace(/-/g, ':'); // HH:MM:SS
      return `${date} ${time}`;
    }

    return 'Unknown';
  }

  /**
   * Establece el directorio de grabaciones
   */
  setRecordingsDir(dir: string): void {
    this.recordingsDir = dir;
  }
}

// Exportar instancia singleton
export const phraseSearchService = new PhraseSearchService();

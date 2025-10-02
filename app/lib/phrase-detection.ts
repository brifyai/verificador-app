
import { prisma } from './db';
import similarity from 'string-similarity';
import Fuse from 'fuse.js';
import natural from 'natural';

export interface PhraseMatch {
  phraseId: string;
  phrase: string;
  brand: string;
  campaign?: string;
  detectedText: string;
  confidence: number;
  similarity: number;
  position: {
    start: number;
    end: number;
  };
  context: {
    before: string;
    after: string;
  };
}

export interface DetectionResult {
  success: boolean;
  matches: PhraseMatch[];
  totalMatches: number;
  processingTime: number;
  text: string;
  error?: string;
}

export class PhraseDetectionService {
  private phrases: Array<{
    id: string;
    phrase: string;
    brand: string;
    campaign?: string;
    category: string;
    confidence: number;
    priority: number;
    active: boolean;
    variants: string[];
  }> = [];

  private fuse: Fuse<any> | null = null;
  private lastUpdate: Date | null = null;

  constructor() {
    this.loadPhrasesFromDatabase();
  }

  /**
   * Carga las frases activas desde la base de datos
   */
  async loadPhrasesFromDatabase(): Promise<void> {
    try {
      console.log('📝 Loading phrases from database...');
      
      const phrases = await prisma.phrase.findMany({
        where: { active: true },
        include: {
          variants: true
        },
        orderBy: [
          { priority: 'asc' },
          { confidence: 'desc' }
        ]
      });

      this.phrases = phrases.map(phrase => ({
        id: phrase.id,
        phrase: phrase.phrase,
        brand: phrase.brand,
        campaign: phrase.campaign || undefined,
        category: phrase.category,
        confidence: phrase.confidence,
        priority: phrase.priority,
        active: phrase.active,
        variants: phrase.variants.map(v => v.variant)
      }));

      // Configurar Fuse.js para búsqueda difusa
      this.fuse = new Fuse(this.phrases, {
        keys: ['phrase', 'brand', 'variants'],
        threshold: 0.4, // Más estricto para evitar falsos positivos
        distance: 100,
        minMatchCharLength: 3,
        includeScore: true,
        includeMatches: true
      });

      this.lastUpdate = new Date();
      console.log(`✅ Loaded ${phrases.length} active phrases for detection`);
    } catch (error) {
      console.error('❌ Error loading phrases from database:', error);
      this.phrases = [];
      this.fuse = null;
    }
  }

  /**
   * Detecta frases publicitarias en un texto transcrito
   */
  async detectPhrases(text: string, captureId?: string): Promise<DetectionResult> {
    const startTime = Date.now();
    
    try {
      if (!text || text.trim().length === 0) {
        return {
          success: false,
          matches: [],
          totalMatches: 0,
          processingTime: Date.now() - startTime,
          text: '',
          error: 'Texto vacío o inválido'
        };
      }

      // Recargar frases si han pasado más de 5 minutos
      if (!this.lastUpdate || Date.now() - this.lastUpdate.getTime() > 5 * 60 * 1000) {
        await this.loadPhrasesFromDatabase();
      }

      if (!this.fuse || this.phrases.length === 0) {
        return {
          success: true,
          matches: [],
          totalMatches: 0,
          processingTime: Date.now() - startTime,
          text,
          error: 'No hay frases configuradas para detección'
        };
      }

      console.log(`🔍 Detecting phrases in text: "${text.substring(0, 100)}..."`);

      const matches: PhraseMatch[] = [];
      const normalizedText = this.normalizeText(text);

      // Método 1: Búsqueda exacta y por similitud
      for (const phrase of this.phrases) {
        const phraseMatches = this.findPhraseMatches(phrase, normalizedText, text);
        matches.push(...phraseMatches);
      }

      // Método 2: Búsqueda difusa con Fuse.js (para casos más complejos)
      const fuseResults = this.fuse.search(normalizedText);
      for (const result of fuseResults.slice(0, 10)) { // Limitar a top 10
        if (result.score && result.score < 0.6) { // Score menor = mejor match
          const phrase = result.item;
          const fuzzyMatches = this.findFuzzyMatches(phrase, normalizedText, text, result);
          matches.push(...fuzzyMatches);
        }
      }

      // Eliminar duplicados y ordenar por confianza
      const uniqueMatches = this.removeDuplicateMatches(matches);
      const sortedMatches = uniqueMatches.sort((a, b) => b.confidence - a.confidence);

      console.log(`🎯 Found ${sortedMatches.length} phrase matches`);

      return {
        success: true,
        matches: sortedMatches,
        totalMatches: sortedMatches.length,
        processingTime: Date.now() - startTime,
        text: text
      };

    } catch (error: any) {
      console.error('❌ Error in phrase detection:', error);
      return {
        success: false,
        matches: [],
        totalMatches: 0,
        processingTime: Date.now() - startTime,
        text: text,
        error: error.message
      };
    }
  }

  /**
   * Busca coincidencias exactas y por similitud de una frase específica
   */
  private findPhraseMatches(phrase: any, normalizedText: string, originalText: string): PhraseMatch[] {
    const matches: PhraseMatch[] = [];
    const searchTerms = [phrase.phrase, ...phrase.variants];

    for (const term of searchTerms) {
      const normalizedTerm = this.normalizeText(term);
      
      // Búsqueda exacta
      const exactMatches = this.findExactMatches(normalizedTerm, normalizedText, originalText, phrase);
      matches.push(...exactMatches);

      // Búsqueda por similitud de palabras clave
      const similarMatches = this.findSimilarMatches(normalizedTerm, normalizedText, originalText, phrase);
      matches.push(...similarMatches);
    }

    return matches;
  }

  /**
   * Busca coincidencias exactas
   */
  private findExactMatches(term: string, normalizedText: string, originalText: string, phrase: any): PhraseMatch[] {
    const matches: PhraseMatch[] = [];
    const regex = new RegExp(this.escapeRegex(term), 'gi');
    let match;

    while ((match = regex.exec(normalizedText)) !== null) {
      const position = {
        start: match.index,
        end: match.index + match[0].length
      };

      const context = this.getContext(originalText, position.start, position.end);

      matches.push({
        phraseId: phrase.id,
        phrase: phrase.phrase,
        brand: phrase.brand,
        campaign: phrase.campaign,
        detectedText: match[0],
        confidence: 0.95, // Alta confianza para matches exactos
        similarity: 1.0,
        position,
        context
      });
    }

    return matches;
  }

  /**
   * Busca coincidencias por similitud
   */
  private findSimilarMatches(term: string, normalizedText: string, originalText: string, phrase: any): PhraseMatch[] {
    const matches: PhraseMatch[] = [];
    const words = term.split(' ');
    
    // Buscar por ventana deslizante
    const textWords = normalizedText.split(' ');
    const windowSize = Math.max(words.length, 3);

    for (let i = 0; i <= textWords.length - windowSize; i++) {
      const window = textWords.slice(i, i + windowSize).join(' ');
      const similarityScore = similarity.compareTwoStrings(term, window);

      if (similarityScore >= 0.7) { // Umbral de similitud
        const startPos = normalizedText.indexOf(window);
        const endPos = startPos + window.length;
        
        const context = this.getContext(originalText, startPos, endPos);

        matches.push({
          phraseId: phrase.id,
          phrase: phrase.phrase,
          brand: phrase.brand,
          campaign: phrase.campaign,
          detectedText: window,
          confidence: Math.min(similarityScore * 0.9, phrase.confidence), // Ajustar por confianza de la frase
          similarity: similarityScore,
          position: { start: startPos, end: endPos },
          context
        });
      }
    }

    return matches;
  }

  /**
   * Busca coincidencias difusas usando Fuse.js results
   */
  private findFuzzyMatches(phrase: any, normalizedText: string, originalText: string, fuseResult: any): PhraseMatch[] {
    const matches: PhraseMatch[] = [];
    
    if (fuseResult.matches) {
      for (const match of fuseResult.matches) {
        if (match.indices && match.indices.length > 0) {
          const [start, end] = match.indices[0];
          const detectedText = normalizedText.substring(start, end + 1);
          const context = this.getContext(originalText, start, end + 1);
          
          const confidence = (1 - fuseResult.score!) * phrase.confidence;

          matches.push({
            phraseId: phrase.id,
            phrase: phrase.phrase,
            brand: phrase.brand,
            campaign: phrase.campaign,
            detectedText,
            confidence,
            similarity: 1 - fuseResult.score!,
            position: { start, end: end + 1 },
            context
          });
        }
      }
    }

    return matches;
  }

  /**
   * Normaliza texto para búsqueda (minúsculas, sin acentos, etc.)
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[^\w\s]/g, ' ') // Quitar puntuación
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim();
  }

  /**
   * Escapa caracteres especiales para regex
   */
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Obtiene el contexto alrededor de una coincidencia
   */
  private getContext(text: string, start: number, end: number): { before: string; after: string } {
    const contextLength = 50;
    
    const before = text.substring(Math.max(0, start - contextLength), start).trim();
    const after = text.substring(end, Math.min(text.length, end + contextLength)).trim();

    return { before, after };
  }

  /**
   * Elimina coincidencias duplicadas
   */
  private removeDuplicateMatches(matches: PhraseMatch[]): PhraseMatch[] {
    const unique: PhraseMatch[] = [];
    const seen = new Set<string>();

    for (const match of matches) {
      const key = `${match.phraseId}_${match.position.start}_${match.position.end}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(match);
      } else {
        // Si ya existe, mantener el de mayor confianza
        const existingIndex = unique.findIndex(
          m => m.phraseId === match.phraseId && 
               m.position.start === match.position.start && 
               m.position.end === match.position.end
        );
        
        if (existingIndex >= 0 && unique[existingIndex].confidence < match.confidence) {
          unique[existingIndex] = match;
        }
      }
    }

    return unique;
  }

  /**
   * Guarda las detecciones en la base de datos
   */
  async saveDetections(
    matches: PhraseMatch[],
    sessionId: string,
    captureId: string,
    radioId: string,
    originalText: string
  ): Promise<void> {
    try {
      const detections = matches.map(match => ({
        sessionId,
        captureId,
        radioId,
        phraseId: match.phraseId,
        detectedText: match.detectedText,
        originalText,
        confidence: match.confidence,
        similarity: match.similarity,
        audioTimestamp: null, // TODO: Implementar si se necesita
        metadata: {
          position: match.position,
          context: match.context,
          brand: match.brand,
          campaign: match.campaign
        }
      }));

      if (detections.length > 0) {
        await prisma.detection.createMany({
          data: detections
        });

        console.log(`💾 Saved ${detections.length} detections to database`);
      }
    } catch (error) {
      console.error('❌ Error saving detections:', error);
    }
  }

  /**
   * Obtiene estadísticas de detección
   */
  async getDetectionStats(timeRange: 'day' | 'week' | 'month' = 'day'): Promise<any> {
    try {
      const now = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      const detections = await prisma.detection.findMany({
        where: {
          timestamp: {
            gte: startDate
          }
        },
        include: {
          phrase: true,
          radio: true
        }
      });

      return {
        total: detections.length,
        byBrand: this.groupBy(detections, d => d.phrase.brand),
        byRadio: this.groupBy(detections, d => d.radio.name),
        byHour: this.groupByHour(detections),
        averageConfidence: detections.length > 0 
          ? detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length 
          : 0,
        topPhrases: this.getTopPhrases(detections)
      };
    } catch (error) {
      console.error('❌ Error getting detection stats:', error);
      return null;
    }
  }

  /**
   * Agrupa elementos por una función de agrupación
   */
  private groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, number> {
    return items.reduce((acc, item) => {
      const key = keyFn(item);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Agrupa detecciones por hora
   */
  private groupByHour(detections: any[]): Record<string, number> {
    return detections.reduce((acc, detection) => {
      const hour = new Date(detection.timestamp).getHours();
      const key = `${hour}:00`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Obtiene las frases más detectadas
   */
  private getTopPhrases(detections: any[]): Array<{ phrase: string; brand: string; count: number }> {
    const counts = this.groupBy(detections, d => `${d.phrase.phrase}|${d.phrase.brand}`);
    
    return Object.entries(counts)
      .map(([key, count]) => {
        const [phrase, brand] = key.split('|');
        return { phrase, brand, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Recarga las frases desde la base de datos
   */
  async reloadPhrases(): Promise<void> {
    await this.loadPhrasesFromDatabase();
  }

  /**
   * Obtiene el número de frases activas cargadas
   */
  getActivePhraseCount(): number {
    return this.phrases.length;
  }
}

// Instancia singleton
export const phraseDetectionService = new PhraseDetectionService();

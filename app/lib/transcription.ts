
import { readFileSync, unlinkSync } from 'fs';
import path from 'path';

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  duration?: number;
  error?: string;
  confidence?: number;
  processingTime?: number;
  provider?: string;
  cost?: number;
  metadata?: any;
}

export interface AdvertisementAnalysis {
  isAdvertisement: boolean;
  confidence: number;
  advertisementType?: 'product' | 'service' | 'event' | 'political' | 'psa' | 'other';
  detectedPhrases: string[];
  brandMentions: string[];
  summary: string;
  timestamp: Date;
}

export class TranscriptionService {
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.ABACUSAI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('ABACUSAI_API_KEY no está configurada');
    }
  }

  /**
   * Transcribir audio usando Whisper a través de la API
   */
  async transcribeAudio(audioFilePath: string): Promise<TranscriptionResult> {
    try {
      console.log(`🎙️  Iniciando transcripción: ${audioFilePath}`);

      // Leer archivo de audio y convertir a base64
      const audioBuffer = readFileSync(audioFilePath);
      const base64Audio = audioBuffer.toString('base64');
      
      // Usar formato simplificado para evitar errores de formato
      const messages = [
        {
          role: 'user',
          content: `Por favor transcribe este archivo de audio de radio chilena. 

ARCHIVO: ${path.basename(audioFilePath)}
AUDIO_DATA: data:audio/wav;base64,${base64Audio}

IMPORTANTE: 
- Transcribe TODO el contenido de audio que escuches
- Mantén acentos y modismos chilenos  
- Indica si hay música de fondo con [MÚSICA]
- Indica pausas largas con [PAUSA]
- Si hay múltiples voces, indica [VOZ1], [VOZ2], etc.
- Responde solo con la transcripción, sin explicaciones adicionales`
        }
      ];

      const requestBody = {
        model: 'gpt-4.1-mini',
        messages: messages.map(msg => ({
          role: String(msg.role),
          content: String(msg.content).trim()
        })),
        max_tokens: 2000,
        temperature: 0.1
      };

      const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const result = await response.json();
      const transcribedText = result.choices?.[0]?.message?.content || '';

      if (!transcribedText.trim()) {
        throw new Error('No se pudo transcribir el audio');
      }

      console.log(`✅ Transcripción completada (${transcribedText.length} caracteres)`);

      return {
        success: true,
        text: transcribedText.trim(),
        confidence: 0.95, // Estimado para GPT-4
        duration: audioBuffer.length / 16000 // Estimado basado en sample rate
      };

    } catch (error) {
      console.error('❌ Error en transcripción:', error);
      return {
        success: false,
        error: `Transcription error: ${error}`
      };
    }
  }

  /**
   * Analizar texto transcrito para detectar publicidad usando GPT-4
   */
  async analyzeAdvertisement(
    transcribedText: string, 
    radioName: string,
    targetPhrases: string[] = []
  ): Promise<AdvertisementAnalysis> {
    try {
      console.log(`🔍 Analizando publicidad para: ${radioName}`);

      const prompt = `Analiza este texto transcrito de radio chilena para detectar PUBLICIDAD/ANUNCIOS.

TEXTO A ANALIZAR:
"""
${transcribedText}
"""

RADIO: ${radioName}
FRASES OBJETIVO: ${targetPhrases.join(', ') || 'Ninguna específica'}

INSTRUCCIONES:
1. Determina si contiene publicidad/anuncios comerciales
2. Identifica el tipo de publicidad
3. Extrae frases publicitarias clave
4. Detecta menciones de marcas/productos/servicios
5. Proporciona resumen del contenido publicitario

CONTEXTO CHILENO:
- Considera modismos chilenos
- Reconoce marcas y empresas chilenas comunes
- Identifica publicidad local vs nacional
- Detecta promociones típicas de radio (descuentos, eventos, etc.)

Responde en JSON con esta estructura exacta:
{
  "isAdvertisement": true/false,
  "confidence": 0.0-1.0,
  "advertisementType": "product/service/event/political/psa/other",
  "detectedPhrases": ["frase1", "frase2"],
  "brandMentions": ["marca1", "marca2"],
  "summary": "Resumen del contenido publicitario"
}

Responde con JSON puro, sin código ni markdown.`;

      const requestBody = {
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'user',
            content: String(prompt).trim()
          }
        ],
        max_tokens: 1500,
        temperature: 0.1,
        response_format: { type: "json_object" }
      };

      const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const result = await response.json();
      const analysisText = result.choices?.[0]?.message?.content || '{}';
      
      const analysis = JSON.parse(analysisText);

      // Validar estructura de respuesta
      const validatedAnalysis: AdvertisementAnalysis = {
        isAdvertisement: analysis.isAdvertisement || false,
        confidence: Math.min(Math.max(analysis.confidence || 0, 0), 1),
        advertisementType: analysis.advertisementType || 'other',
        detectedPhrases: Array.isArray(analysis.detectedPhrases) ? analysis.detectedPhrases : [],
        brandMentions: Array.isArray(analysis.brandMentions) ? analysis.brandMentions : [],
        summary: analysis.summary || 'No hay resumen disponible',
        timestamp: new Date()
      };

      console.log(`✅ Análisis completado - Publicidad: ${validatedAnalysis.isAdvertisement} (${Math.round(validatedAnalysis.confidence * 100)}%)`);

      return validatedAnalysis;

    } catch (error) {
      console.error('❌ Error en análisis:', error);
      return {
        isAdvertisement: false,
        confidence: 0,
        detectedPhrases: [],
        brandMentions: [],
        summary: `Error en análisis: ${error}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Proceso completo: Transcripción + Análisis
   */
  async processAudioFile(
    audioFilePath: string, 
    radioName: string,
    targetPhrases: string[] = [],
    deleteAfterProcessing: boolean = true
  ): Promise<{
    transcription: TranscriptionResult;
    analysis: AdvertisementAnalysis;
  }> {
    try {
      console.log(`🚀 Procesando archivo completo: ${audioFilePath}`);

      // Paso 1: Transcribir
      const transcription = await this.transcribeAudio(audioFilePath);
      
      if (!transcription.success || !transcription.text) {
        return {
          transcription,
          analysis: {
            isAdvertisement: false,
            confidence: 0,
            detectedPhrases: [],
            brandMentions: [],
            summary: 'No se pudo transcribir el audio',
            timestamp: new Date()
          }
        };
      }

      // Paso 2: Analizar
      const analysis = await this.analyzeAdvertisement(
        transcription.text, 
        radioName, 
        targetPhrases
      );

      // Paso 3: Limpiar archivo si es necesario
      if (deleteAfterProcessing) {
        try {
          unlinkSync(audioFilePath);
          console.log(`🗑️  Archivo eliminado: ${audioFilePath}`);
        } catch (error) {
          console.warn(`⚠️  No se pudo eliminar: ${audioFilePath}`);
        }
      }

      return { transcription, analysis };

    } catch (error) {
      console.error('❌ Error en procesamiento completo:', error);
      return {
        transcription: {
          success: false,
          error: `Processing error: ${error}`
        },
        analysis: {
          isAdvertisement: false,
          confidence: 0,
          detectedPhrases: [],
          brandMentions: [],
          summary: `Error en procesamiento: ${error}`,
          timestamp: new Date()
        }
      };
    }
  }
}

// Instancia singleton
export const transcriptionService = new TranscriptionService();

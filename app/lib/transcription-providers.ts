
import { TranscriptionResult } from './transcription';
import { supabaseDirect } from './supabase-direct';
import OpenAI from 'openai';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

export interface ProviderConfig {
  id: string;
  provider: string;
  apiKey?: string;
  model?: string;
  enabled: boolean;
  priority: number;
  costPerUnit: number;
  rateLimit?: number;
  metadata?: any;
}

export class MultiProviderTranscriptionService {
  private providers: Map<string, ProviderConfig> = new Map();
  private rateLimits: Map<string, number[]> = new Map();
  private requestCounts: Map<string, number> = new Map();

  constructor() {
    this.loadProvidersFromDatabase();
  }

  /**
   * Carga la configuración de proveedores desde la base de datos
   */
  async loadProvidersFromDatabase(): Promise<void> {
    try {
      const configs = await supabaseDirect.request(
        'api_configurations?select=*&enabled=eq.true&order=priority.asc'
      );

      this.providers.clear();
      for (const config of configs) {
        this.providers.set(config.provider, {
          id: config.id,
          provider: config.provider,
          apiKey: config.api_key || undefined,
          model: config.model || undefined,
          enabled: config.enabled,
          priority: config.priority,
          costPerUnit: config.cost_per_unit,
          rateLimit: config.rate_limit || undefined,
          metadata: config.metadata
        });
      }

      console.log(`🔧 Loaded ${configs.length} transcription providers from database`);
    } catch (error) {
      console.error('❌ Error loading providers from database:', error);
      this.loadDefaultProviders();
    }
  }

  /**
   * Configuración por defecto si no se puede cargar desde DB
   */
  private loadDefaultProviders(): void {
    // Providers configurados pero deshabilitados por defecto
    const defaultProviders = [
      {
        id: 'default_abacus',
        provider: 'abacus',
        enabled: false,
        priority: 1,
        costPerUnit: 0.03,
        rateLimit: 60,
        model: 'gpt-4o',
        metadata: { baseUrl: 'https://api.abacus.ai/v1' }
      },
      {
        id: 'default_groq',
        provider: 'groq',
        enabled: false,
        priority: 2,
        costPerUnit: 0.006,
        rateLimit: 30,
        model: 'whisper-large-v3',
        metadata: { baseUrl: 'https://api.groq.com/openai/v1' }
      },
      {
        id: 'default_openai',
        provider: 'openai',
        enabled: false,
        priority: 3,
        costPerUnit: 0.012,
        rateLimit: 50,
        model: 'whisper-1',
        metadata: { baseUrl: 'https://api.openai.com/v1' }
      }
    ];

    for (const provider of defaultProviders) {
      this.providers.set(provider.provider, provider);
    }

    console.log('🔧 Using default provider configuration');
  }

  /**
   * Transcribe audio usando el mejor proveedor disponible
   */
  async transcribe(audioPath: string, language: string = 'es'): Promise<TranscriptionResult> {
    const startTime = Date.now();
    
    // Obtener proveedores habilitados, ordenados por prioridad
    const enabledProviders = Array.from(this.providers.values())
      .filter(p => p.enabled && p.apiKey)
      .sort((a, b) => a.priority - b.priority);

    if (enabledProviders.length === 0) {
      return {
        success: false,
        error: 'No hay proveedores de transcripción configurados',
        text: '',
        confidence: 0,
        processingTime: Date.now() - startTime,
        provider: 'none',
        cost: 0
      };
    }

    console.log(`🎯 Attempting transcription with ${enabledProviders.length} providers`);

    // Intentar con cada proveedor hasta que uno funcione
    for (const provider of enabledProviders) {
      try {
        // Verificar rate limit
        if (!this.checkRateLimit(provider.provider, provider.rateLimit)) {
          console.log(`⏳ Rate limit exceeded for ${provider.provider}, skipping`);
          continue;
        }

        console.log(`🔄 Trying transcription with ${provider.provider}...`);

        const result = await this.transcribeWithProvider(provider, audioPath, language);
        
        if (result.success) {
          console.log(`✅ Transcription successful with ${provider.provider}`);
          this.updateRequestCount(provider.provider);
          return result;
        } else {
          console.log(`❌ ${provider.provider} failed: ${result.error}`);
        }
      } catch (error: any) {
        console.error(`❌ Error with ${provider.provider}:`, error.message);
      }
    }

    return {
      success: false,
      error: 'Todos los proveedores de transcripción fallaron',
      text: '',
      confidence: 0,
      processingTime: Date.now() - startTime,
      provider: 'none',
      cost: 0
    };
  }

  /**
   * Transcribe con un proveedor específico
   */
  private async transcribeWithProvider(
    provider: ProviderConfig,
    audioPath: string,
    language: string
  ): Promise<TranscriptionResult> {
    const startTime = Date.now();

    try {
      switch (provider.provider) {
        case 'abacus':
          return await this.transcribeWithAbacus(provider, audioPath, language);
        case 'groq':
          return await this.transcribeWithGroq(provider, audioPath, language);
        case 'openai':
          return await this.transcribeWithOpenAI(provider, audioPath, language);
        case 'deepgram':
          return await this.transcribeWithDeepgram(provider, audioPath, language);
        case 'assemblyai':
          return await this.transcribeWithAssemblyAI(provider, audioPath, language);
        default:
          return {
            success: false,
            error: `Proveedor no soportado: ${provider.provider}`,
            text: '',
            confidence: 0,
            processingTime: Date.now() - startTime,
            provider: provider.provider,
            cost: 0
          };
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Error en ${provider.provider}: ${error.message}`,
        text: '',
        confidence: 0,
        processingTime: Date.now() - startTime,
        provider: provider.provider,
        cost: 0
      };
    }
  }

  /**
   * Transcripción con Abacus AI
   */
  private async transcribeWithAbacus(
    provider: ProviderConfig,
    audioPath: string,
    language: string
  ): Promise<TranscriptionResult> {
    const startTime = Date.now();

    try {
      const client = new OpenAI({
        apiKey: provider.apiKey!,
        baseURL: provider.metadata?.baseUrl || 'https://api.abacus.ai/v1'
      });

      const audioFile = fs.createReadStream(audioPath);
      
      const response = await client.audio.transcriptions.create({
        file: audioFile,
        model: provider.model || 'gpt-4o',
        language: language,
        response_format: 'json'
      });

      const processingTime = Date.now() - startTime;
      const estimatedCost = this.calculateCost(audioPath, provider.costPerUnit);

      return {
        success: true,
        text: response.text || '',
        confidence: 0.9, // Abacus generalmente tiene alta confianza
        processingTime,
        provider: 'abacus',
        cost: estimatedCost,
        metadata: {
          model: provider.model,
          language: language
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Abacus AI error: ${error.message}`,
        text: '',
        confidence: 0,
        processingTime: Date.now() - startTime,
        provider: 'abacus',
        cost: 0
      };
    }
  }

  /**
   * Transcripción con Groq
   */
  private async transcribeWithGroq(
    provider: ProviderConfig,
    audioPath: string,
    language: string
  ): Promise<TranscriptionResult> {
    const startTime = Date.now();

    try {
      const client = new OpenAI({
        apiKey: provider.apiKey!,
        baseURL: provider.metadata?.baseUrl || 'https://api.groq.com/openai/v1'
      });

      const audioFile = fs.createReadStream(audioPath);
      
      const response = await client.audio.transcriptions.create({
        file: audioFile,
        model: provider.model || 'whisper-large-v3',
        language: language,
        response_format: 'json'
      });

      const processingTime = Date.now() - startTime;
      const estimatedCost = this.calculateCost(audioPath, provider.costPerUnit);

      return {
        success: true,
        text: response.text || '',
        confidence: 0.85,
        processingTime,
        provider: 'groq',
        cost: estimatedCost,
        metadata: {
          model: provider.model,
          language: language
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Groq error: ${error.message}`,
        text: '',
        confidence: 0,
        processingTime: Date.now() - startTime,
        provider: 'groq',
        cost: 0
      };
    }
  }

  /**
   * Transcripción con OpenAI
   */
  private async transcribeWithOpenAI(
    provider: ProviderConfig,
    audioPath: string,
    language: string
  ): Promise<TranscriptionResult> {
    const startTime = Date.now();

    try {
      const client = new OpenAI({
        apiKey: provider.apiKey!
      });

      const audioFile = fs.createReadStream(audioPath);
      
      const response = await client.audio.transcriptions.create({
        file: audioFile,
        model: provider.model || 'whisper-1',
        language: language,
        response_format: 'json'
      });

      const processingTime = Date.now() - startTime;
      const estimatedCost = this.calculateCost(audioPath, provider.costPerUnit);

      return {
        success: true,
        text: response.text || '',
        confidence: 0.88,
        processingTime,
        provider: 'openai',
        cost: estimatedCost,
        metadata: {
          model: provider.model,
          language: language
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `OpenAI error: ${error.message}`,
        text: '',
        confidence: 0,
        processingTime: Date.now() - startTime,
        provider: 'openai',
        cost: 0
      };
    }
  }

  /**
   * Transcripción con Deepgram
   */
  private async transcribeWithDeepgram(
    provider: ProviderConfig,
    audioPath: string,
    language: string
  ): Promise<TranscriptionResult> {
    const startTime = Date.now();

    try {
      const audioBuffer = fs.readFileSync(audioPath);
      
      const response = await axios.post(
        `${provider.metadata?.baseUrl || 'https://api.deepgram.com/v1'}/listen`,
        audioBuffer,
        {
          headers: {
            'Authorization': `Token ${provider.apiKey}`,
            'Content-Type': 'audio/mpeg',
          },
          params: {
            model: provider.model || 'nova-2-general',
            language: language === 'es' ? 'es' : 'en',
            punctuate: true,
            diarize: false
          }
        }
      );

      const transcript = response.data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
      const confidence = response.data?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;

      const processingTime = Date.now() - startTime;
      const estimatedCost = this.calculateCost(audioPath, provider.costPerUnit);

      return {
        success: true,
        text: transcript,
        confidence: confidence,
        processingTime,
        provider: 'deepgram',
        cost: estimatedCost,
        metadata: {
          model: provider.model,
          language: language
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Deepgram error: ${error.response?.data?.message || error.message}`,
        text: '',
        confidence: 0,
        processingTime: Date.now() - startTime,
        provider: 'deepgram',
        cost: 0
      };
    }
  }

  /**
   * Transcripción con AssemblyAI
   */
  private async transcribeWithAssemblyAI(
    provider: ProviderConfig,
    audioPath: string,
    language: string
  ): Promise<TranscriptionResult> {
    const startTime = Date.now();

    try {
      // 1. Subir archivo
      const audioBuffer = fs.readFileSync(audioPath);
      
      const uploadResponse = await axios.post(
        'https://api.assemblyai.com/v2/upload',
        audioBuffer,
        {
          headers: {
            'authorization': provider.apiKey!,
            'content-type': 'application/octet-stream'
          }
        }
      );

      const audioUrl = uploadResponse.data.upload_url;

      // 2. Crear transcripción
      const transcriptResponse = await axios.post(
        'https://api.assemblyai.com/v2/transcript',
        {
          audio_url: audioUrl,
          language_code: language === 'es' ? 'es' : 'en',
          punctuate: true,
          format_text: true
        },
        {
          headers: {
            'authorization': provider.apiKey!,
            'content-type': 'application/json'
          }
        }
      );

      const transcriptId = transcriptResponse.data.id;

      // 3. Esperar resultado (polling)
      let result;
      do {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const statusResponse = await axios.get(
          `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
          {
            headers: { 'authorization': provider.apiKey! }
          }
        );
        result = statusResponse.data;
      } while (result.status === 'processing' || result.status === 'queued');

      const processingTime = Date.now() - startTime;
      const estimatedCost = this.calculateCost(audioPath, provider.costPerUnit);

      if (result.status === 'completed') {
        return {
          success: true,
          text: result.text || '',
          confidence: result.confidence || 0.8,
          processingTime,
          provider: 'assemblyai',
          cost: estimatedCost,
          metadata: {
            id: transcriptId,
            language: language
          }
        };
      } else {
        return {
          success: false,
          error: `AssemblyAI failed: ${result.error}`,
          text: '',
          confidence: 0,
          processingTime,
          provider: 'assemblyai',
          cost: 0
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: `AssemblyAI error: ${error.response?.data?.error || error.message}`,
        text: '',
        confidence: 0,
        processingTime: Date.now() - startTime,
        provider: 'assemblyai',
        cost: 0
      };
    }
  }

  /**
   * Verifica el rate limit de un proveedor
   */
  private checkRateLimit(provider: string, limit?: number): boolean {
    if (!limit) return true;

    const now = Date.now();
    const window = 60 * 1000; // 1 minuto
    
    if (!this.rateLimits.has(provider)) {
      this.rateLimits.set(provider, []);
    }

    const requests = this.rateLimits.get(provider)!;
    
    // Limpiar requests antiguos
    const validRequests = requests.filter(time => now - time < window);
    this.rateLimits.set(provider, validRequests);

    return validRequests.length < limit;
  }

  /**
   * Actualiza el contador de requests
   */
  private updateRequestCount(provider: string): void {
    const now = Date.now();
    
    if (!this.rateLimits.has(provider)) {
      this.rateLimits.set(provider, []);
    }
    
    this.rateLimits.get(provider)!.push(now);
    
    // Actualizar contador general
    const current = this.requestCounts.get(provider) || 0;
    this.requestCounts.set(provider, current + 1);
  }

  /**
   * Calcula el costo estimado basado en duración del audio
   */
  private calculateCost(audioPath: string, costPerUnit: number): number {
    try {
      const stats = fs.statSync(audioPath);
      const fileSizeMB = stats.size / (1024 * 1024);
      
      // Estimación muy aproximada: 1MB ≈ 1 minuto de audio comprimido
      const estimatedMinutes = Math.max(fileSizeMB, 0.1);
      
      return estimatedMinutes * costPerUnit;
    } catch (error) {
      return costPerUnit; // Costo mínimo si no se puede calcular
    }
  }

  /**
   * Obtiene estadísticas de uso de proveedores
   */
  getProviderStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [provider, config] of this.providers.entries()) {
      stats[provider] = {
        enabled: config.enabled,
        priority: config.priority,
        requestCount: this.requestCounts.get(provider) || 0,
        costPerUnit: config.costPerUnit,
        rateLimit: config.rateLimit,
        hasApiKey: !!config.apiKey
      };
    }
    
    return stats;
  }

  /**
   * Recarga la configuración desde la base de datos
   */
  async reloadConfiguration(): Promise<void> {
    await this.loadProvidersFromDatabase();
  }
}

// Instancia singleton
export const multiProviderTranscriptionService = new MultiProviderTranscriptionService();

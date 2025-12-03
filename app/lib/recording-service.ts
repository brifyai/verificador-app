/**
 * SERVICIO DE GRABACIÓN CON AUTENTICACIÓN
 * 
 * Este servicio maneja la comunicación con el VPS para grabaciones,
 * incluyendo la autenticación requerida y el manejo de errores.
 */

export interface RecordingRequest {
  radio_id: string | number;
  stream_url: string;
  duration?: number;
}

export interface RecordingResponse {
  success: boolean;
  message: string;
  recording_id?: string;
  data?: any;
  error?: string;
}

export interface ActiveRecording {
  id: string;
  radio_id: string;
  stream_url: string;
  start_time: string;
  status: 'recording' | 'completed' | 'error';
}

export interface ActiveRecordingsResponse {
  active_recordings: Record<string, ActiveRecording>;
  count: number;
  status: string;
  message?: string; // Agregado para compatibilidad
}

export interface RecordingState {
  id: string;
  recording_id: string;
  radio_id: string;
  stream_url: string;
  start_time: string;
  status: 'recording' | 'completed' | 'error';
  duration?: number;
}

/**
 * Servicio de grabación con autenticación VPS
 */
export class RecordingService {
  private static instance: RecordingService;
  private readonly baseUrl: string;
  private authToken: string;

  private constructor() {
    // Detectar contexto y usar URL apropiada
    this.baseUrl = this.getBaseUrl();
    // Obtener token de las cookies (el middleware lo maneja automáticamente)
    this.authToken = this.getAuthToken();
  }

  /**
   * Obtener URL base según el contexto (cliente/servidor)
   */
  private getBaseUrl(): string {
    // Detectar contexto de manera más robusta
    const isClient = typeof window !== 'undefined' && typeof document !== 'undefined';
    
    console.log('🔍 [RecordingService] Contexto detectado:', {
      isClient,
      hasWindow: typeof window !== 'undefined',
      hasDocument: typeof document !== 'undefined',
      nodeEnv: process.env.NODE_ENV
    });
    
    // En el cliente, usar URL relativa
    if (isClient) {
      return '';
    }
    
    // En el servidor, usar URL absoluta
    // Intentar obtener el host desde variables de entorno o usar localhost por defecto
    const host = process.env.NEXT_PUBLIC_BASE_URL || 
                 process.env.VERCEL_URL || 
                 'localhost:3000';
    
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;
    
    console.log('🔍 [RecordingService] URL base del servidor:', baseUrl);
    return baseUrl;
  }

  /**
   * Obtener token de autenticación del usuario desde cookies
   */
  private getAuthToken(): string {
    try {
      // El middleware maneja la autenticación automáticamente
      // No necesitamos enviar el token manualmente en los headers
      return 'bearer-automatic'; // Placeholder para el servicio
    } catch (error) {
      console.warn('⚠️ [RecordingService] No se pudo obtener token de autenticación:', error);
      return 'bearer-automatic';
    }
  }


  static getInstance(): RecordingService {
    if (!RecordingService.instance) {
      RecordingService.instance = new RecordingService();
    }
    return RecordingService.instance;
  }

  /**
   * Iniciar grabación de una radio
   */
  async startRecording(request: RecordingRequest): Promise<RecordingResponse> {
    try {
      console.log('🎙️ [RecordingService] Iniciando grabación:', request);

      // Validar datos
      if (!request.radio_id || !request.stream_url) {
        throw new Error('Faltan datos requeridos: radio_id y stream_url son obligatorios');
      }

      // Preparar payload
      const payload = {
        radio_id: request.radio_id,
        stream_url: request.stream_url,
        duration: request.duration || 3600 // 1 hora por defecto
      };

      console.log('📤 [RecordingService] Enviando petición:', payload);

      // Realizar petición al VPS con SOLUCIÓN DEFINITIVA para el bug
      const response = await fetch('/api/recording-vps-fixed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // El middleware maneja la autenticación automáticamente mediante cookies
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      console.log(`📥 [RecordingService] Respuesta: ${response.status} ${response.statusText}`);

      // Leer respuesta
      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = { message: await response.text() };
      }

      console.log('📄 [RecordingService] Datos de respuesta:', data);

      // Manejar errores específicos
      if (!response.ok) {
        let errorMessage = 'Error al iniciar grabación';

        if (response.status === 401) {
          errorMessage = 'Autenticación fallida con el VPS';
        } else if (response.status === 404) {
          errorMessage = 'Radio no encontrada en el VPS';
        } else if (response.status === 400) {
          errorMessage = 'Datos inválidos para la grabación';
        } else if (response.status >= 500) {
          errorMessage = 'Error interno del servidor VPS';
        }

        return {
          success: false,
          message: errorMessage,
          error: data.error || errorMessage,
          data: data
        };
      }

      // Éxito
      return {
        success: true,
        message: 'Grabación iniciada exitosamente',
        recording_id: data.recording_id,
        data: data
      };

    } catch (error) {
      console.error('💥 [RecordingService] Error en grabación:', error);
      
      return {
        success: false,
        message: 'Error de conexión al iniciar grabación',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener grabaciones activas
   */
  async getActiveRecordings(): Promise<ActiveRecordingsResponse> {
    try {
      // Verificar si estamos en contexto SSR - si es así, no hacer nada
      const isClient = typeof window !== 'undefined' && typeof document !== 'undefined';
      
      if (!isClient) {
        console.log('🚫 [RecordingService] Evitando ejecución en contexto SSR');
        return {
          active_recordings: {},
          count: 0,
          status: 'error',
          message: 'Ejecución evitada en contexto SSR'
        };
      }

      console.log('📊 [RecordingService] Obteniendo grabaciones activas');

      // En el cliente, usar URL relativa con solución definitiva
      const url = '/api/recording-vps-fixed';
      
      console.log('🔍 [RecordingService] URL completa para obtener grabaciones:', url);

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
        // El middleware maneja la autenticación automáticamente mediante cookies
      });

      if (!response.ok) {
        console.error(`❌ [RecordingService] Error al obtener grabaciones activas: ${response.status}`);
        return {
          active_recordings: {},
          count: 0,
          status: 'error'
        };
      }

      const data = await response.json();
      console.log(`✅ [RecordingService] Grabaciones activas obtenidas: ${data.count || 0}`);
      
      return data;

    } catch (error) {
      console.error('💥 [RecordingService] Error al obtener grabaciones activas:', error);
      return {
        active_recordings: {},
        count: 0,
        status: 'error'
      };
    }
  }

  /**
   * Detener grabación específica
   */
  async stopRecording(recordingId: string): Promise<RecordingResponse> {
    try {
      console.log(`🛑 [RecordingService] Deteniendo grabación: ${recordingId}`);

      // Usar el nuevo endpoint DELETE para detener y limpiar grabación temporal
      const response = await fetch('/api/recording-vps-fixed', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ radio_id: recordingId })
      });

      if (!response.ok) {
        console.error(`❌ Error al detener grabación: ${response.status}`);
        return {
          success: false,
          message: `Error al detener grabación: HTTP ${response.status}`,
          recording_id: recordingId
        };
      }

      const data = await response.json();
      console.log(`✅ Grabación detenida exitosamente:`, data);

      return {
        success: true,
        message: data.message || 'Grabación detenida exitosamente',
        recording_id: recordingId,
        data: data
      };

    } catch (error) {
      console.error('💥 [RecordingService] Error al detener grabación:', error);
      return {
        success: false,
        message: 'Error al detener grabación',
        error: error instanceof Error ? error.message : 'Error desconocido',
        recording_id: recordingId
      };
    }
  }

  /**
   * Verificar si una radio está siendo grabada
   */
  async isRecording(radioId: string): Promise<boolean> {
    try {
      const activeRecordings = await this.getActiveRecordings();
      return Object.values(activeRecordings.active_recordings).some(
        recording => recording.radio_id === radioId
      );
    } catch (error) {
      console.error('💥 [RecordingService] Error al verificar estado de grabación:', error);
      return false;
    }
  }

  /**
   * Obtener información de una grabación específica
   */
  async getRecordingInfo(recordingId: string): Promise<ActiveRecording | null> {
    try {
      const activeRecordings = await this.getActiveRecordings();
      return activeRecordings.active_recordings[recordingId] || null;
    } catch (error) {
      console.error('💥 [RecordingService] Error al obtener información de grabación:', error);
      return null;
    }
  }
}

// Exportar instancia única
export const recordingService = RecordingService.getInstance();
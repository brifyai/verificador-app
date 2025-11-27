// Servicio de grabación para conectar con la VPS de grabación
// Basado en radio-api-clientV2.js adaptado para Next.js

export interface RecordingState {
  recording_id?: string;
  status: 'recording' | 'paused' | 'stopped';
  startTime?: Date;
  radioName?: string;
}

export interface RecordingResult {
  status: 'success' | 'error';
  message?: string;
  recording_id?: string;
  radio_name?: string;
  [key: string]: any;
}

export interface RecordingFile {
  filename: string;
  size: number;
  created_at: string;
}

export interface RadioRecording {
  radioId: string;
  radioName: string;
  recordingId?: string;
  status: 'recording' | 'paused' | 'stopped';
  startTime?: Date;
}

class RecordingService {
  private API_BASE: string;
  private currentRecordings: Map<string, RecordingState>;

  constructor(baseURL: string = 'http://213.199.39.147:5000/api') {
    this.API_BASE = baseURL;
    this.currentRecordings = new Map();
  }

  // Función auxiliar para hacer requests
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error en la solicitud:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Error de conexión con el servidor de grabación'
      };
    }
  }

  // Obtener todas las radios disponibles desde Supabase
  async getAvailableRadios() {
    console.log('📻 Obteniendo radios disponibles desde:', `${this.API_BASE}/radios`);
    const result = await this.makeRequest('/radios');
    console.log('📻 Radios obtenidas:', result);
    return result;
  }

  // Iniciar grabación de una radio específica
  async startRecording(radioId: string, radioName: string = ''): Promise<RecordingResult> {
    console.log('🔴 Iniciando grabación:', { radioId, radioName, url: `${this.API_BASE}/start-recording` });
    
    const result = await this.makeRequest('/start-recording', {
      method: 'POST',
      body: JSON.stringify({
        radio_id: radioId,
        radio_name: radioName
      })
    });

    console.log('🔴 Resultado de iniciar grabación:', result);

    if (result.status === 'success') {
      // SOLUCIÓN: Usar fecha actual del servidor para evitar problemas de zona horaria
      const currentTime = new Date();
      const maxFutureTime = 5000; // 5 segundos de tolerancia
      
      // Si el servidor remoto devolvió un tiempo, validarlo
      let finalStartTime = currentTime;
      if (result.start_time) {
        const serverTime = new Date(result.start_time);
        const timeDiff = serverTime.getTime() - currentTime.getTime();
        
        if (timeDiff > maxFutureTime) {
          console.warn('⚠️ Tiempo del servidor está demasiado en el futuro, usando tiempo local');
          finalStartTime = currentTime;
        } else if (timeDiff < -maxFutureTime) {
          console.warn('⚠️ Tiempo del servidor está demasiado en el pasado, usando tiempo local');
          finalStartTime = currentTime;
        } else {
          finalStartTime = serverTime;
          console.log('✅ Usando tiempo del servidor:', finalStartTime.toISOString());
        }
      } else {
        console.log('✅ Usando tiempo local:', finalStartTime.toISOString());
      }
      
      this.currentRecordings.set(radioId, {
        recording_id: result.recording_id,
        status: 'recording',
        startTime: finalStartTime,
        radioName: result.radio_name || radioName
      });
      console.log('✅ Grabación iniciada exitosamente para:', radioId);
    } else {
      console.log('❌ Error al iniciar grabación:', result.message);
    }

    return result;
  }

  // Pausar grabación en curso
  async pauseRecording(radioId: string): Promise<RecordingResult> {
    const result = await this.makeRequest('/pause-recording', {
      method: 'POST',
      body: JSON.stringify({ radio_id: radioId })
    });

    if (result.status === 'success' && this.currentRecordings.has(radioId)) {
      const recording = this.currentRecordings.get(radioId)!;
      recording.status = 'paused';
    }

    return result;
  }

  // Reanudar grabación pausada
  async resumeRecording(radioId: string): Promise<RecordingResult> {
    const result = await this.makeRequest('/resume-recording', {
      method: 'POST',
      body: JSON.stringify({ radio_id: radioId })
    });

    if (result.status === 'success' && this.currentRecordings.has(radioId)) {
      const recording = this.currentRecordings.get(radioId)!;
      recording.status = 'recording';
    }

    return result;
  }

  // Obtener grabaciones activas actuales
  async getActiveRecordings(): Promise<any> {
    console.log('🔍 Obteniendo grabaciones activas desde:', `${this.API_BASE}/active-recordings`);
    const result = await this.makeRequest('/active-recordings');
    console.log('🔍 Grabaciones activas obtenidas:', result);
    
    // Sincronizar nuestro estado local
    if (result.status === 'success') {
      console.log('📊 Sincronizando estado local con grabaciones activas:', result.active_recordings);
      this.currentRecordings.clear();
      
      // Manejar el formato correcto del servidor
      const activeRecordings = result.active_recordings || {};
      Object.entries(activeRecordings).forEach(([radioId, data]: [string, any]) => {
        console.log(`📍 Procesando grabación para radio ${radioId}:`, data);
        if (data && data.start_time) {
          this.currentRecordings.set(radioId, {
            recording_id: data.recording_id,
            status: data.status?.toLowerCase() || 'recording',
            startTime: new Date(data.start_time),
            radioName: data.radio_name || radioId
          });
          console.log(`✅ Grabación procesada para ${radioId}:`, this.currentRecordings.get(radioId));
        } else {
          console.log(`⚠️ Datos inválidos para radio ${radioId}:`, data);
        }
      });
      console.log('✅ Estado local sincronizado. Grabaciones actuales:', this.currentRecordings);
    } else {
      console.log('⚠️ No se pudieron obtener grabaciones activas:', result);
    }

    return result;
  }

  // Detener grabación completamente
  async stopRecording(radioId: string): Promise<RecordingResult> {
    const result = await this.makeRequest('/stop-recording', {
      method: 'POST',
      body: JSON.stringify({ radio_id: radioId })
    });

    if (result.status === 'success') {
      this.currentRecordings.delete(radioId);
    }

    return result;
  }


  // Obtener lista de archivos grabados disponibles
  async getRecordingsList(): Promise<{ status: string; recordings?: RecordingFile[]; message?: string }> {
    return await this.makeRequest('/recordings');
  }

  // Descargar un archivo específico
  async downloadRecording(filename: string): Promise<{ status: string; message: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/download/${filename}`);
      
      if (!response.ok) {
        throw new Error('Error descargando archivo');
      }

      // Crear enlace de descarga
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { status: 'success', message: 'Descarga iniciada' };
    } catch (error) {
      console.error('Error descargando:', error);
      return { status: 'error', message: 'Error en la descarga' };
    }
  }

  // Verificar estado del servidor
  async getServerStatus(): Promise<any> {
    return await this.makeRequest('/status');
  }

  // Obtener estado local de las grabaciones
  getLocalRecordingState(radioId?: string): RecordingState | Record<string, RecordingState> | null {
    if (radioId) {
      return this.currentRecordings.get(radioId) || null;
    }
    return Object.fromEntries(this.currentRecordings);
  }

  // Verificar si una radio específica está grabando
  isRecording(radioId: string): boolean {
    const recording = this.currentRecordings.get(radioId);
    return recording ? recording.status === 'recording' : false;
  }

  // Verificar si una radio específica está pausada
  isPaused(radioId: string): boolean {
    const recording = this.currentRecordings.get(radioId);
    return recording ? recording.status === 'paused' : false;
  }

  // Obtener el estado actual de grabación de una radio
  getRecordingStatus(radioId: string): RecordingState | null {
    return this.currentRecordings.get(radioId) || null;
  }
}

// Crear instancia global para uso fácil
export const recordingService = new RecordingService();

export default RecordingService;
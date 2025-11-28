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

  constructor(baseURL?: string) {
    // Usar variable de entorno si está disponible, o el parámetro, o el valor por defecto
    this.API_BASE = baseURL || process.env.VPS_API_URL || 'http://213.199.39.147:5000/api';
    this.currentRecordings = new Map();
    
    console.log('🎙️ RecordingService inicializado con API_BASE:', this.API_BASE);
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
    try {
      // ✅ CAMBIO: Usar endpoint API local para evitar problemas de CORS y normalizar formato
      console.log('📥 Obteniendo lista de grabaciones desde /api/recordings');
      const response = await fetch('/api/recordings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('📥 Grabaciones obtenidas desde API local:', result);

      // Normalizar el formato de las grabaciones si es necesario
      if (result.status === 'success' && result.recordings) {
        const normalizedRecordings = result.recordings.map((recording: any) => ({
          filename: recording.filename,
          size: recording.size,
          created_at: recording.created_at || recording.created, // Asegurar campo created_at
          path: recording.path,
        }));
        
        return {
          status: 'success',
          recordings: normalizedRecordings,
        };
      }

      return result;
    } catch (error) {
      console.error('Error obteniendo grabaciones desde API local:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Error obteniendo grabaciones',
      };
    }
  }

  // Descargar un archivo específico - VERSIÓN DEFINITIVA CON REDIRECCIÓN
  async downloadRecording(filename: string): Promise<{ status: string; message: string }> {
    try {
      console.log('🔍 Iniciando descarga de archivo:', filename);
      
      // ✅ SOLUCIÓN DEFINITIVA: Usar endpoint de descarga directa del VPS
      // El VPS debe ser configurado para servir archivos estáticos desde /recordings
      const directFileUrl = `http://213.199.39.147:5000/recordings/${encodeURIComponent(filename)}`;
      
      // Intentar primero con el path directo (archivos en root)
      const directUrl = `${this.API_BASE}/download/${encodeURIComponent(filename)}`;
      
      // ✅ MÉTODO 1: Intentar descarga con fetch
      try {
        const response = await fetch(directUrl, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache'
        });
        
        if (response.ok) {
          // Éxito - procesar descarga
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }, 100);
          
          console.log('✅ Descarga iniciada exitosamente:', filename);
          return { status: 'success', message: '📥 Descarga iniciada' };
        } else if (response.status === 404) {
          // Si no se encuentra, intentar con path completo
          console.warn('⚠️ Archivo no encontrado en path directo, intentando con path completo...');
          
          // Construir path basado en la fecha del archivo
          // Formato: radio-1_20251128_191557_ceecb92b-eaad-4837-8f01-28a093705f83.mp3
          const match = filename.match(/_(\d{4})(\d{2})(\d{2})_(\d{2})/);
          if (match) {
            const [, year, month, day, hour] = match;
            const fullPathUrl = `${this.API_BASE}/download/${encodeURIComponent(`/${year}-${month}-${day}/${hour}/${filename}`)}`;
            console.log('🔍 Intentando con path completo:', fullPathUrl);
            
            const altResponse = await fetch(fullPathUrl, {
              method: 'GET',
              mode: 'cors',
              cache: 'no-cache'
            });
            
            if (altResponse.ok) {
              const blob = await altResponse.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = filename;
              a.style.display = 'none';
              document.body.appendChild(a);
              a.click();
              
              setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              }, 100);
              
              console.log('✅ Descarga iniciada exitosamente con path completo:', filename);
              return { status: 'success', message: '📥 Descarga iniciada (modo path completo)' };
            }
          }
        }
        
        // Si llegamos aquí, ningún método funcionó
        throw new Error(`HTTP ${response.status}: Archivo no encontrado`);
        
      } catch (fetchError) {
        console.error('❌ Error en fetch:', fetchError);
        
        // ✅ MÉTODO 2: Último fallback - redirigir al endpoint del VPS
        // Esto abrirá el archivo en una nueva pestaña si el VPS lo sirve correctamente
        const redirectUrl = `${this.API_BASE}/download/${encodeURIComponent(filename)}`;
        console.log('🔍 Redirigiendo a:', redirectUrl);
        
        // Abrir en nueva pestaña como último recurso
        window.open(redirectUrl, '_blank');
        
        return { status: 'success', message: '📥 Redirigiendo a descarga...' };
      }
      
    } catch (error) {
      console.error('❌ Error detallado en descarga:', error);
      
      // Mensajes de error específicos
      let errorMessage = 'Error en la descarga';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = '❌ Error de conexión: No se pudo conectar con el servidor VPS. Verifica que el servidor esté corriendo.';
      } else if (error instanceof Error) {
        if (error.message.includes('404')) {
          errorMessage = `❌ Archivo no encontrado: ${filename}. El archivo puede estar en un subdirectorio o haber sido movido.`;
        } else if (error.message.includes('CORS')) {
          errorMessage = '❌ Error CORS: El servidor VPS no está configurado para permitir descargas. Contacta al administrador.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = '❌ Error de red: No se pudo conectar con el VPS. Verifica la conexión y el firewall.';
        } else {
          errorMessage = `❌ Error: ${error.message}`;
        }
      }
      
      return { status: 'error', message: errorMessage };
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
import { recordingStateManager } from './recording-state-manager';

const API_BASE = process.env.NEXT_PUBLIC_VPS_API_URL || 'http://213.199.39.147:5000/api';

interface RecordingFile {
  filename: string;
  path: string; // Ruta relativa: 2025-12-01/radio_id/archivo.mp3
  size: number;
  created: string;
  radio_id: string;
  radio_name: string;
  radio_region: string;
  radio_city: string;
  radio_programadora: string;
  display_name: string;
}

class RecordingService {
  private API_BASE: string;

  constructor() {
    this.API_BASE = API_BASE;
    console.log('🎙️ RecordingService inicializado con API:', this.API_BASE);
  }

  // Manejar errores de fetch centralizado
  private async handleFetchResponse(response: Response, endpoint: string) {
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error en ${endpoint}: ${response.status} - ${errorText}`);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
    return response.json();
  }

  // Obtener lista de grabaciones (con nueva estructura de rutas)
  async getRecordingsList(): Promise<{ status: string; recordings?: RecordingFile[]; message?: string }> {
    try {
      console.log('📥 Obteniendo lista de grabaciones desde /api/recordings');
      
      // Usar API local como proxy para evitar problemas de CORS
      const response = await fetch('/api/recordings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        cache: 'no-store'
      });

      const result = await this.handleFetchResponse(response, '/api/recordings');
      console.log(`✅ Grabaciones obtenidas: ${result.recordings?.length || 0} archivos`);

      // Normalizar el formato de las grabaciones
      if (result.status === 'success' && result.recordings) {
        const normalizedRecordings = result.recordings.map((recording: any) => ({
          filename: recording.filename,
          path: recording.path || recording.filename, // Usar path si existe, sino filename
          size: recording.size,
          created: recording.created || recording.created_at,
          radio_id: recording.radio_id,
          radio_name: recording.radio_name,
          radio_region: recording.radio_region,
          radio_city: recording.radio_city,
          radio_programadora: recording.radio_programadora,
          display_name: recording.display_name
        }));

        console.log('📋 Ejemplo de grabación normalizada:', normalizedRecordings[0]);

        return {
          status: 'success',
          recordings: normalizedRecordings,
        };
      }

      return {
        status: 'error',
        message: result.message || 'Formato de respuesta inválido',
      };

    } catch (error) {
      console.error('❌ Error obteniendo grabaciones:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Error desconocido obteniendo grabaciones',
      };
    }
  }

  // Descargar grabación usando la ruta completa
  async downloadRecording(path: string): Promise<{ status: string; message?: string }> {
    try {
      console.log(`📥 Iniciando descarga de: ${path}`);
      
      // El path ya viene con formato: 2025-12-01/radio_id/archivo.mp3
      const downloadUrl = `${this.API_BASE}/download/${encodeURIComponent(path)}`;
      
      console.log(`🌐 URL de descarga: ${downloadUrl}`);
      
      // Usar fetch para obtener el archivo como blob
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Accept': 'audio/mpeg',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      // Obtener el blob del archivo
      const blob = await response.blob();
      
      // Crear URL temporal para descarga
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Usar el nombre del archivo original
      const filename = path.split('/').pop() || 'grabacion.mp3';
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      
      // Limpiar
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ Descarga iniciada correctamente');
      return { status: 'success' };

    } catch (error) {
      console.error('❌ Error en descarga:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Error al descargar grabación',
      };
    }
  }

  // Obtener grabaciones activas actuales
  async getActiveRecordings(): Promise<any> {
    console.log('🔍 Obteniendo grabaciones activas desde:', `${this.API_BASE}/active-recordings`);
    
    try {
      const response = await fetch(`${this.API_BASE}/active-recordings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });

      const result = await this.handleFetchResponse(response, '/active-recordings');
      
      if (result.status === 'success') {
        console.log('📊 Sincronizando estado local con grabaciones activas:', result.active_recordings);
        
        // El RecordingStateManager se actualiza automáticamente cada 10 segundos
        // No necesita sincronización manual desde aquí
        
        return result;
      } else {
        console.log('⚠️ No se pudieron obtener grabaciones activas:', result);
        return { status: 'error', message: result.message };
      }

    } catch (error) {
      console.error('❌ Error obteniendo grabaciones activas:', error);
      return { status: 'error', message: error instanceof Error ? error.message : 'Error de conexión' };
    }
  }

  // Iniciar grabación
  async startRecording(radioId: string): Promise<{ status: string; message?: string; recording_id?: string }> {
    try {
      console.log(`🎙️ Iniciando grabación para radio: ${radioId}`);
      
      const response = await fetch(`${this.API_BASE}/start-recording`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ radio_id: radioId })
      });

      const result = await this.handleFetchResponse(response, '/start-recording');
      console.log('✅ Grabación iniciada:', result);
      
      // Forzar actualización del estado
      await recordingStateManager.forceUpdate();
      
      return result;

    } catch (error) {
      console.error('❌ Error iniciando grabación:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Error al iniciar grabación',
      };
    }
  }

  // Detener grabación
  async stopRecording(radioId: string): Promise<{ status: string; message?: string }> {
    try {
      console.log(`⏹️ Deteniendo grabación para radio: ${radioId}`);
      
      const response = await fetch(`${this.API_BASE}/stop-recording`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ radio_id: radioId })
      });

      const result = await this.handleFetchResponse(response, '/stop-recording');
      console.log('✅ Grabación detenida:', result);
      
      // Forzar actualización del estado
      await recordingStateManager.forceUpdate();
      
      return result;

    } catch (error) {
      console.error('❌ Error deteniendo grabación:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Error al detener grabación',
      };
    }
  }

  // Obtener estadísticas de grabaciones
  async getRecordingStats(): Promise<{ status: string; stats?: any; message?: string }> {
    try {
      console.log('📊 Obteniendo estadísticas de grabaciones');
      
      const response = await fetch(`${this.API_BASE}/recordings/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });

      const result = await this.handleFetchResponse(response, '/recordings/stats');
      console.log('✅ Estadísticas obtenidas:', result.stats);
      
      return result;

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Error al obtener estadísticas',
      };
    }
  }
}

// Exportar instancia singleton
export const recordingService = new RecordingService();
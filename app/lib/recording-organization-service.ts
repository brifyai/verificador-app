/**
 * SERVICIO DE ORGANIZACIÓN AUTOMÁTICA DE GRABACIONES
 * 
 * Este servicio maneja la organización automática de grabaciones en la estructura:
 * grabaciones/YYYY-MM-DD/radio_id/grabacion.mp3
 * 
 * Y sincroniza automáticamente con la base de datos.
 */

import { supabaseDirect } from '@/lib/supabase-direct';

export interface RecordingOrganizationConfig {
  basePath: string;
  autoOrganize: boolean;
  syncToDatabase: boolean;
}

export interface OrganizedRecording {
  id: string;
  filename: string;
  originalPath: string;
  organizedPath: string;
  radioId: string;
  radioName: string;
  date: string;
  time: string;
  size: number;
  duration: number;
  createdAt: string;
}

export interface OrganizationResult {
  success: boolean;
  organized: OrganizedRecording[];
  errors: string[];
  stats: {
    total: number;
    organized: number;
    errors: number;
    skipped: number;
  };
}

class RecordingOrganizationService {
  private config: RecordingOrganizationConfig;
  private isOrganizing = false;

  constructor(config: RecordingOrganizationConfig = {
    basePath: '/recordings',
    autoOrganize: true,
    syncToDatabase: true
  }) {
    this.config = config;
  }

  /**
   * Organiza una grabación recién creada
   */
  async organizeNewRecording(recordingData: {
    filename: string;
    radioId: string;
    radioName: string;
    filePath?: string;
    fileSize?: number;
    duration?: number;
    recordedAt?: string;
  }): Promise<{ success: boolean; organizedPath?: string; error?: string }> {
    try {
      console.log(`📁 Organizando nueva grabación: ${recordingData.filename}`);

      // Extraer fecha del filename o usar fecha actual
      const date = this.extractDateFromFilename(recordingData.filename) || 
                   this.formatDate(recordingData.recordedAt || new Date());
      
      // Crear estructura de carpetas
      const organizedPath = `${this.config.basePath}/${date}/${recordingData.radioId}/${recordingData.filename}`;
      
      console.log(`📂 Ruta organizada: ${organizedPath}`);

      // Sincronizar con base de datos si está habilitado
      if (this.config.syncToDatabase) {
        const dbResult = await this.syncToDatabase({
          ...recordingData,
          organizedPath,
          date
        });

        if (!dbResult.success) {
          console.warn(`⚠️ Error sincronizando con base de datos: ${dbResult.error}`);
        }
      }

      return {
        success: true,
        organizedPath
      };

    } catch (error) {
      console.error(`❌ Error organizando grabación:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Organiza todas las grabaciones existentes
   */
  async organizeExistingRecordings(): Promise<OrganizationResult> {
    if (this.isOrganizing) {
      return {
        success: false,
        organized: [],
        errors: ['Ya hay una organización en progreso'],
        stats: { total: 0, organized: 0, errors: 0, skipped: 0 }
      };
    }

    this.isOrganizing = true;
    console.log('🔄 Iniciando organización de grabaciones existentes...');

    try {
      // Obtener grabaciones del VPS
      const vpsRecordings = await this.getVPSRecordings();
      console.log(`📊 Encontradas ${vpsRecordings.length} grabaciones en VPS`);

      const organized: OrganizedRecording[] = [];
      const errors: string[] = [];
      let organizedCount = 0;
      let errorCount = 0;
      let skippedCount = 0;

      for (const recording of vpsRecordings) {
        try {
          // Extraer información de la grabación
          const radioId = this.extractRadioIdFromFilename(recording.filename);
          if (!radioId) {
            console.warn(`⚠️ No se pudo extraer radio_id de: ${recording.filename}`);
            skippedCount++;
            continue;
          }

          // Obtener información de la radio desde la base de datos
          const radioInfo = await this.getRadioInfo(radioId);
          if (!radioInfo) {
            console.warn(`⚠️ Radio ${radioId} no encontrada en base de datos`);
            skippedCount++;
            continue;
          }

          // Extraer fecha del filename
          const date = this.extractDateFromFilename(recording.filename);
          if (!date) {
            console.warn(`⚠️ No se pudo extraer fecha de: ${recording.filename}`);
            skippedCount++;
            continue;
          }

          // Crear estructura organizada
          const organizedRecording: OrganizedRecording = {
            id: recording.filename,
            filename: recording.filename,
            originalPath: recording.file_path || recording.filename,
            organizedPath: `${this.config.basePath}/${date}/${radioId}/${recording.filename}`,
            radioId,
            radioName: radioInfo.name,
            date,
            time: this.extractTimeFromFilename(recording.filename) || '00:00:00',
            size: recording.file_size || 0,
            duration: recording.duration_seconds || 0,
            createdAt: recording.recorded_at || recording.created || new Date().toISOString()
          };

          // Sincronizar con base de datos
          const dbResult = await this.syncToDatabase({
            filename: recording.filename,
            radioId,
            radioName: radioInfo.name,
            organizedPath: organizedRecording.organizedPath,
            date,
            fileSize: recording.file_size || 0,
            duration: recording.duration_seconds || 0,
            recordedAt: recording.recorded_at || recording.created
          });

          if (dbResult.success) {
            organized.push(organizedRecording);
            organizedCount++;
            console.log(`✅ Organizada: ${recording.filename}`);
          } else {
            errors.push(`Error sincronizando ${recording.filename}: ${dbResult.error}`);
            errorCount++;
          }

        } catch (error) {
          console.error(`❌ Error procesando ${recording.filename}:`, error);
          errors.push(error instanceof Error ? error.message : 'Error desconocido');
          errorCount++;
        }
      }

      const result: OrganizationResult = {
        success: true,
        organized,
        errors,
        stats: {
          total: vpsRecordings.length,
          organized: organizedCount,
          errors: errorCount,
          skipped: skippedCount
        }
      };

      console.log(`✅ Organización completada:`, result.stats);
      return result;

    } catch (error) {
      console.error('❌ Error en organización general:', error);
      return {
        success: false,
        organized: [],
        errors: [error instanceof Error ? error.message : 'Error desconocido'],
        stats: { total: 0, organized: 0, errors: 1, skipped: 0 }
      };
    } finally {
      this.isOrganizing = false;
    }
  }

  /**
   * Obtiene grabaciones del VPS
   */
  private async getVPSRecordings(): Promise<any[]> {
    try {
      const response = await fetch('http://213.199.39.147:5000/api/recordings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Error del VPS: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.recordings || [];
    } catch (error) {
      console.error('❌ Error obteniendo grabaciones del VPS:', error);
      return [];
    }
  }

  /**
   * Obtiene información de una radio desde la base de datos
   */
  private async getRadioInfo(radioId: string): Promise<any> {
    try {
      // Buscar por vps_id primero, luego por id
      const radioResponse = await supabaseDirect.request(
        `radios?select=id,name,region,description,platform,status,vps_id&vps_id=eq.${encodeURIComponent(radioId)}`
      );

      if (radioResponse && radioResponse.length > 0) {
        return radioResponse[0];
      }

      // Si no se encuentra por vps_id, buscar por id
      const idResponse = await supabaseDirect.request(
        `radios?select=id,name,region,description,platform,status,vps_id&id=eq.${encodeURIComponent(radioId)}`
      );

      if (idResponse && idResponse.length > 0) {
        return idResponse[0];
      }

      return null;
    } catch (error) {
      console.error(`❌ Error obteniendo información de radio ${radioId}:`, error);
      return null;
    }
  }

  /**
   * Sincroniza una grabación con la base de datos
   */
  private async syncToDatabase(recordingData: {
    filename: string;
    radioId: string;
    radioName: string;
    organizedPath: string;
    date: string;
    fileSize?: number;
    duration?: number;
    recordedAt?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Obtener información completa de la radio
      const radioInfo = await this.getRadioInfo(recordingData.radioId);
      if (!radioInfo) {
        return { success: false, error: 'Radio no encontrada en base de datos' };
      }

      // Preparar datos para la base de datos
      const dbRecordingData = {
        radio_id: radioInfo.id, // ID numérico para la clave foránea
        radio_name: radioInfo.name,
        radio_region: radioInfo.region || 'Región no especificada',
        radio_city: radioInfo.description || 'Ciudad no especificada',
        filename: recordingData.filename,
        file_path: `http://213.199.39.147:5000${recordingData.organizedPath}`,
        file_size: recordingData.fileSize || 0,
        duration_seconds: recordingData.duration || 0,
        recorded_at: recordingData.recordedAt || new Date().toISOString(),
        metadata: {
          source: 'vps_organized_auto',
          organization_date: new Date().toISOString(),
          original_radio_id: recordingData.radioId,
          organization_structure: `${recordingData.date}/${recordingData.radioId}/`,
          enrichment_source: 'radio_table'
        }
      };

      // Verificar si ya existe
      const existingRecording = await supabaseDirect.request(
        `recordings?select=id&filename=eq.${encodeURIComponent(recordingData.filename)}`
      );

      if (existingRecording && existingRecording.length > 0) {
        // Actualizar existente
        await supabaseDirect.request(`recordings?id=eq.${existingRecording[0].id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            ...dbRecordingData,
            metadata: {
              ...dbRecordingData.metadata,
              updated_at: new Date().toISOString(),
              last_sync: new Date().toISOString()
            }
          })
        });
      } else {
        // Crear nueva
        await supabaseDirect.request('recordings', {
          method: 'POST',
          body: JSON.stringify(dbRecordingData)
        });
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error sincronizando con base de datos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Extrae radio_id del filename
   */
  private extractRadioIdFromFilename(filename: string): string | null {
    const match = filename.match(/^radio_([^_]+)_/);
    return match ? match[1] : null;
  }

  /**
   * Extrae fecha del filename
   */
  private extractDateFromFilename(filename: string): string | null {
    const match = filename.match(/_(\d{8})_\d{6}_/);
    if (match) {
      const dateStr = match[1]; // YYYYMMDD
      return `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`;
    }
    return null;
  }

  /**
   * Extrae hora del filename
   */
  private extractTimeFromFilename(filename: string): string | null {
    const match = filename.match(/_(\d{8})_(\d{6})_/);
    if (match) {
      const timeStr = match[2]; // HHMMSS
      return `${timeStr.substring(0,2)}:${timeStr.substring(2,4)}:${timeStr.substring(4,6)}`;
    }
    return null;
  }

  /**
   * Formatea fecha a YYYY-MM-DD
   */
  private formatDate(date: string | Date): string {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /**
   * Actualiza la configuración del servicio
   */
  updateConfig(newConfig: Partial<RecordingOrganizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Obtiene el estado actual del servicio
   */
  getStatus(): { isOrganizing: boolean; config: RecordingOrganizationConfig } {
    return {
      isOrganizing: this.isOrganizing,
      config: this.config
    };
  }
}

// Instancia singleton del servicio
export const recordingOrganizationService = new RecordingOrganizationService();

export default RecordingOrganizationService;
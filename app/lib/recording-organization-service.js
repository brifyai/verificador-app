/**
 * SERVICIO DE ORGANIZACIÓN AUTOMÁTICA DE GRABACIONES (JavaScript)
 * 
 * Este servicio maneja la organización automática de grabaciones en la estructura:
 * grabaciones/YYYY-MM-DD/radio_id/grabacion.mp3
 * 
 * Y sincroniza automáticamente con la base de datos.
 */

// Configuración del servicio
const RecordingOrganizationConfig = {
  basePath: '/recordings',
  autoOrganize: true,
  syncToDatabase: true
};

class RecordingOrganizationService {
  constructor(config = RecordingOrganizationConfig) {
    this.config = { ...RecordingOrganizationConfig, ...config };
    this.isOrganizing = false;
  }

  /**
   * Organiza una grabación recién creada
   */
  async organizeNewRecording(recordingData) {
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
        error: error.message || 'Error desconocido'
      };
    }
  }

  /**
   * Organiza todas las grabaciones existentes
   */
  async organizeExistingRecordings() {
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

      const organized = [];
      const errors = [];
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
          const organizedRecording = {
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
          errors.push(error.message || 'Error desconocido');
          errorCount++;
        }
      }

      const result = {
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
        errors: [error.message || 'Error desconocido'],
        stats: { total: 0, organized: 0, errors: 1, skipped: 0 }
      };
    } finally {
      this.isOrganizing = false;
    }
  }

  /**
   * Obtiene grabaciones del VPS
   */
  async getVPSRecordings() {
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
  async getRadioInfo(radioId) {
    try {
      // Usar la API existente para obtener radios
      const response = await fetch('http://localhost:3000/api/radios-direct');
      
      if (!response.ok) {
        throw new Error(`Error obteniendo radios: ${response.status}`);
      }

      const radiosData = await response.json();
      const radios = radiosData.data || [];

      // Buscar la radio por vps_id o id
      const radio = radios.find(r => 
        r.vps_id === radioId || r.id_radio === radioId || r.id === radioId
      );

      return radio || null;
    } catch (error) {
      console.error(`❌ Error obteniendo información de radio ${radioId}:`, error);
      return null;
    }
  }

  /**
   * Sincroniza una grabación con la base de datos
   */
  async syncToDatabase(recordingData) {
    try {
      // Obtener información completa de la radio
      const radioInfo = await this.getRadioInfo(recordingData.radioId);
      if (!radioInfo) {
        return { success: false, error: 'Radio no encontrada en base de datos' };
      }

      // Preparar datos para la base de datos
      const dbRecordingData = {
        radio_id: radioInfo.id || radioInfo.id_radio, // ID numérico para la clave foránea
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

      // Usar la API existente para guardar la grabación
      const response = await fetch('http://localhost:3000/api/recordings-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordings: [dbRecordingData]
        })
      });

      if (!response.ok) {
        throw new Error(`Error guardando grabación: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        return { success: true };
      } else {
        return { success: false, error: result.message || 'Error desconocido' };
      }

    } catch (error) {
      console.error('❌ Error sincronizando con base de datos:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido'
      };
    }
  }

  /**
   * Extrae radio_id del filename
   */
  extractRadioIdFromFilename(filename) {
    const match = filename.match(/^radio_([^_]+)_/);
    return match ? match[1] : null;
  }

  /**
   * Extrae fecha del filename
   */
  extractDateFromFilename(filename) {
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
  extractTimeFromFilename(filename) {
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
  formatDate(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /**
   * Actualiza la configuración del servicio
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Obtiene el estado actual del servicio
   */
  getStatus() {
    return {
      isOrganizing: this.isOrganizing,
      config: this.config
    };
  }
}

// Instancia singleton del servicio
const recordingOrganizationService = new RecordingOrganizationService();

module.exports = {
  RecordingOrganizationService,
  recordingOrganizationService,
  RecordingOrganizationConfig
};

import { google } from 'googleapis';

interface DriveConfig {
  apiKey?: string;
  serviceAccountCredentials?: string;
  folderId?: string;
}

interface AudioUploadData {
  radioId: string;
  radioName: string;
  detectionId: string;
  phrase: string;
  timestamp: Date;
  audioBuffer: Buffer;
  duration: number;
  transcription?: string;
}

interface AudioFile {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink: string;
  driveId: string;
  size: number;
  createdTime: string;
  modifiedTime: string;
  mimeType: string;
}

class GoogleDriveService {
  private drive: any;
  private config: DriveConfig;

  constructor(config: DriveConfig) {
    this.config = config;
    this.initializeDrive();
  }

  private initializeDrive() {
    try {
      let auth;
      
      if (this.config.serviceAccountCredentials) {
        // Autenticación con Service Account (recomendado para servidor)
        const credentials = JSON.parse(this.config.serviceAccountCredentials);
        auth = new google.auth.GoogleAuth({
          credentials,
          scopes: [
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/drive.readonly'
          ],
        });
      } else if (this.config.apiKey) {
        // Autenticación con API Key (limitado)
        auth = this.config.apiKey;
      } else {
        throw new Error('No se proporcionaron credenciales de Google Drive');
      }

      this.drive = google.drive({ version: 'v3', auth });
    } catch (error) {
      console.error('Error inicializando Google Drive:', error);
      throw error;
    }
  }

  // Crear estructura de carpetas organizada
  async createFolderStructure(radioName: string, date: Date): Promise<string> {
    try {
      const year = date.getFullYear();
      const month = date.toLocaleDateString('es-CL', { month: 'long' });
      const day = date.toLocaleDateString('es-CL', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });

      // Crear carpeta año
      const yearFolder = await this.findOrCreateFolder(
        year.toString(), 
        this.config.folderId
      );

      // Crear carpeta mes
      const monthFolder = await this.findOrCreateFolder(
        month, 
        yearFolder
      );

      // Crear carpeta día
      const dayFolder = await this.findOrCreateFolder(
        day, 
        monthFolder
      );

      // Crear carpeta radio
      const radioFolder = await this.findOrCreateFolder(
        radioName.replace(/[^a-zA-Z0-9]/g, '_'), 
        dayFolder
      );

      return radioFolder;
    } catch (error) {
      console.error('Error creando estructura de carpetas:', error);
      throw error;
    }
  }

  private async findOrCreateFolder(name: string, parentId?: string): Promise<string> {
    try {
      // Buscar carpeta existente
      const query = `name='${name}' and mimeType='application/vnd.google-apps.folder'${parentId ? ` and '${parentId}' in parents` : ''}`;
      
      const searchResult = await this.drive.files.list({
        q: query,
        spaces: 'drive',
      });

      if (searchResult.data.files && searchResult.data.files.length > 0) {
        return searchResult.data.files[0].id;
      }

      // Crear carpeta nueva
      const folderMetadata = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : undefined,
      };

      const folder = await this.drive.files.create({
        requestBody: folderMetadata,
        fields: 'id',
      });

      return folder.data.id;
    } catch (error) {
      console.error('Error en findOrCreateFolder:', error);
      throw error;
    }
  }

  // Subir audio a Google Drive
  async uploadAudio(data: AudioUploadData): Promise<AudioFile> {
    try {
      // Crear estructura de carpetas
      const folderId = await this.createFolderStructure(
        data.radioName, 
        data.timestamp
      );

      // Generar nombre de archivo descriptivo
      const fileName = this.generateFileName(data);

      // Metadatos del archivo
      const fileMetadata = {
        name: fileName,
        parents: [folderId],
        description: `Detección publicitaria - ${data.phrase} - ${data.radioName} - ${data.timestamp.toLocaleString('es-CL')}`,
        properties: {
          radioId: data.radioId,
          radioName: data.radioName,
          detectionId: data.detectionId,
          phrase: data.phrase,
          timestamp: data.timestamp.toISOString(),
          transcription: data.transcription || '',
          duration: data.duration.toString(),
          type: 'audio_detection'
        }
      };

      // Subir archivo
      const media = {
        mimeType: 'audio/wav',
        body: data.audioBuffer,
      };

      const uploadResult = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id,name,webViewLink,webContentLink,size,createdTime,modifiedTime,mimeType',
      });

      // Hacer el archivo accesible (permiso de lectura para cualquiera con el enlace)
      await this.drive.permissions.create({
        fileId: uploadResult.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      return {
        id: uploadResult.data.id,
        name: uploadResult.data.name,
        webViewLink: uploadResult.data.webViewLink,
        webContentLink: uploadResult.data.webContentLink,
        driveId: uploadResult.data.id,
        size: parseInt(uploadResult.data.size),
        createdTime: uploadResult.data.createdTime,
        modifiedTime: uploadResult.data.modifiedTime,
        mimeType: uploadResult.data.mimeType,
      };
    } catch (error) {
      console.error('Error subiendo audio:', error);
      throw error;
    }
  }

  private generateFileName(data: AudioUploadData): string {
    const timestamp = data.timestamp.toISOString()
      .replace(/:/g, '-')
      .replace(/\./g, '-')
      .substring(0, 19);
    
    const phraseSlug = data.phrase
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30);

    const radioSlug = data.radioName
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_');

    return `${timestamp}_${radioSlug}_${phraseSlug}_${data.detectionId}.wav`;
  }

  // Buscar audios por filtros
  async searchAudios(filters: {
    radioId?: string;
    startDate?: Date;
    endDate?: Date;
    phrase?: string;
    limit?: number;
  }): Promise<AudioFile[]> {
    try {
      let query = "mimeType='audio/wav'";

      // Agregar filtros a la query
      if (filters.radioId) {
        query += ` and properties has {key='radioId' and value='${filters.radioId}'}`;
      }

      if (filters.phrase) {
        query += ` and (name contains '${filters.phrase}' or properties has {key='phrase' and value contains '${filters.phrase}'})`;
      }

      const searchResult = await this.drive.files.list({
        q: query,
        fields: 'files(id,name,webViewLink,webContentLink,size,createdTime,modifiedTime,mimeType,properties)',
        orderBy: 'createdTime desc',
        pageSize: filters.limit || 100,
      });

      const files = searchResult.data.files || [];
      
      return files.map((file: any) => ({
        id: file.id,
        name: file.name,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        driveId: file.id,
        size: parseInt(file.size),
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        mimeType: file.mimeType,
      }));
    } catch (error) {
      console.error('Error buscando audios:', error);
      throw error;
    }
  }

  // Obtener información de un archivo específico
  async getAudioInfo(fileId: string): Promise<AudioFile | null> {
    try {
      const result = await this.drive.files.get({
        fileId,
        fields: 'id,name,webViewLink,webContentLink,size,createdTime,modifiedTime,mimeType,properties',
      });

      return {
        id: result.data.id,
        name: result.data.name,
        webViewLink: result.data.webViewLink,
        webContentLink: result.data.webContentLink,
        driveId: result.data.id,
        size: parseInt(result.data.size),
        createdTime: result.data.createdTime,
        modifiedTime: result.data.modifiedTime,
        mimeType: result.data.mimeType,
      };
    } catch (error) {
      console.error('Error obteniendo info de audio:', error);
      return null;
    }
  }

  // Obtener estadísticas de uso
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    usedStorage: string;
  }> {
    try {
      const query = "mimeType='audio/wav' and properties has {key='type' and value='audio_detection'}";
      
      const searchResult = await this.drive.files.list({
        q: query,
        fields: 'files(size)',
        pageSize: 1000,
      });

      const files = searchResult.data.files || [];
      const totalFiles = files.length;
      const totalSize = files.reduce((sum: number, file: any) => sum + parseInt(file.size || '0'), 0);
      
      const usedStorage = this.formatBytes(totalSize);

      return {
        totalFiles,
        totalSize,
        usedStorage,
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        usedStorage: '0 B',
      };
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Test de conexión
  async testConnection(): Promise<boolean> {
    try {
      await this.drive.files.list({
        pageSize: 1,
      });
      return true;
    } catch (error) {
      console.error('Error en test de conexión:', error);
      return false;
    }
  }
}

// Función helper para obtener configuración desde variables de entorno
export function getDriveConfig(): DriveConfig {
  return {
    serviceAccountCredentials: process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS,
    apiKey: process.env.GOOGLE_DRIVE_API_KEY,
    folderId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
  };
}

export { GoogleDriveService };
export type { AudioUploadData, AudioFile, DriveConfig };

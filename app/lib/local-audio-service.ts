import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const access = promisify(fs.access);

interface AudioFile {
  id: string;
  name: string;
  radioName: string;
  phrase: string;
  timestamp: string;
  duration: number;
  size: number;
  audioUrl: string;
  downloadUrl: string;
  filePath: string;
}

interface AudioStats {
  totalFiles: number;
  totalSize: number;
  usedStorage: string;
  freeStorage: string;
  totalStorage: string;
}

interface SearchOptions {
  radioId?: string;
  startDate?: Date;
  endDate?: Date;
  phrase?: string;
  limit?: number;
  page?: number;
}

interface PaginatedResult {
  files: AudioFile[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class LocalAudioService {
  private capturesPath: string;
  private vpsIp?: string;
  private vpsPort: string = '3001'; // Puerto por defecto para el servidor de audios

  constructor() {
    // Configurar la ruta de capturas
    this.capturesPath = process.env.CAPTURES_PATH || 
      path.join(process.cwd(), 'captures');
    
    // Configurar IP del VPS si está disponible
    this.vpsIp = process.env.VPS_IP;
    
    // Crear directorio de capturas si no existe
    this.ensureCapturesDirectory();
  }

  private async ensureCapturesDirectory(): Promise<void> {
    try {
      await access(this.capturesPath);
    } catch {
      // El directorio no existe, crearlo
      fs.mkdirSync(this.capturesPath, { recursive: true });
    }
  }

  private isVpsMode(): boolean {
    return !!this.vpsIp;
  }

  private getBaseUrl(): string {
    if (this.isVpsMode()) {
      return `http://${this.vpsIp}:${this.vpsPort}`;
    }
    return `http://localhost:3000`;
  }

  // Extraer información del nombre del archivo
  private parseFileName(fileName: string): { radioName: string; phrase: string; timestamp: string } {
    // Formato esperado: Radio_Cooperativa_Coca-Cola_2024-01-15_14-30-00.mp3
    const parts = fileName.replace(/\.(mp3|wav|m4a)$/i, '').split('_');
    
    if (parts.length >= 5) {
      const radioName = parts[1].replace(/[-_]/g, ' ');
      const phrase = parts[2].replace(/[-_]/g, ' ');
      const datePart = parts[3];
      const timePart = parts[4];
      const timestamp = `${datePart}T${timePart.replace(/-/g, ':')}:00Z`;
      
      return { radioName, phrase, timestamp };
    }
    
    // Fallback para nombres no estándar
    return {
      radioName: 'Radio Desconocida',
      phrase: 'Frase no identificada',
      timestamp: new Date().toISOString()
    };
  }

  // Estimar duración basada en el tamaño del archivo
  private estimateDuration(sizeInBytes: number): number {
    // Estimación aproximada: 1MB ≈ 60 segundos de audio MP3 a 128kbps
    const sizeInMB = sizeInBytes / (1024 * 1024);
    return Math.round(sizeInMB * 60);
  }

  // Formatear tamaño de archivo
  private formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Buscar archivos de audio localmente
  private async searchLocalAudioFiles(options: SearchOptions = {}): Promise<AudioFile[]> {
    try {
      await this.ensureCapturesDirectory();
      
      const files = await readdir(this.capturesPath);
      const audioFiles: AudioFile[] = [];
      
      for (const fileName of files) {
        // Filtrar solo archivos de audio
        if (!/\.(mp3|wav|m4a)$/i.test(fileName)) continue;
        
        const filePath = path.join(this.capturesPath, fileName);
        const stats = await stat(filePath);
        
        if (!stats.isFile()) continue;
        
        const { radioName, phrase, timestamp } = this.parseFileName(fileName);
        
        // Aplicar filtros
        if (options.radioId && !radioName.toLowerCase().includes(options.radioId.toLowerCase())) {
          continue;
        }
        
        if (options.phrase && !phrase.toLowerCase().includes(options.phrase.toLowerCase())) {
          continue;
        }
        
        const fileDate = new Date(timestamp);
        if (options.startDate && fileDate < options.startDate) continue;
        if (options.endDate && fileDate > options.endDate) continue;
        
        const audioFile: AudioFile = {
          id: fileName,
          name: fileName,
          radioName,
          phrase,
          timestamp,
          duration: this.estimateDuration(stats.size),
          size: stats.size,
          audioUrl: `${this.getBaseUrl()}/api/audios/stream/${encodeURIComponent(fileName)}`,
          downloadUrl: `${this.getBaseUrl()}/api/audios/download/${encodeURIComponent(fileName)}`,
          filePath
        };
        
        audioFiles.push(audioFile);
      }
      
      // Ordenar por timestamp descendente (más recientes primero)
      audioFiles.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Aplicar límite
      if (options.limit) {
        return audioFiles.slice(0, options.limit);
      }
      
      return audioFiles;
    } catch (error) {
      console.error('Error buscando archivos de audio locales:', error);
      return [];
    }
  }

  // Buscar archivos de audio desde VPS
  private async searchVpsAudioFiles(options: SearchOptions = {}): Promise<AudioFile[]> {
    try {
      const params = new URLSearchParams();
      if (options.radioId) params.append('radioId', options.radioId);
      if (options.startDate) params.append('startDate', options.startDate.toISOString());
      if (options.endDate) params.append('endDate', options.endDate.toISOString());
      if (options.phrase) params.append('phrase', options.phrase);
      if (options.limit) params.append('limit', options.limit.toString());
      
      const response = await fetch(`${this.getBaseUrl()}/api/audios/list?${params}`);
      
      if (!response.ok) {
        throw new Error(`Error del VPS: ${response.status}`);
      }
      
      const data = await response.json();
      return data.audios || [];
    } catch (error) {
      console.error('Error obteniendo archivos del VPS:', error);
      // Fallback a archivos locales si el VPS no está disponible
      return this.searchLocalAudioFiles(options);
    }
  }

  // Método principal para buscar archivos de audio
  async searchAudioFiles(options: SearchOptions = {}): Promise<AudioFile[]> {
    if (this.isVpsMode()) {
      return this.searchVpsAudioFiles(options);
    } else {
      return this.searchLocalAudioFiles(options);
    }
  }

  // Obtener estadísticas de almacenamiento
  async getStorageStats(): Promise<AudioStats> {
    if (this.isVpsMode()) {
      try {
        const response = await fetch(`${this.getBaseUrl()}/api/audios/stats`);
        if (response.ok) {
          const data = await response.json();
          return data.stats;
        }
      } catch (error) {
        console.error('Error obteniendo estadísticas del VPS:', error);
      }
    }
    
    // Estadísticas locales
    try {
      await this.ensureCapturesDirectory();
      const files = await readdir(this.capturesPath);
      let totalFiles = 0;
      let totalSize = 0;
      
      for (const fileName of files) {
        if (!/\.(mp3|wav|m4a)$/i.test(fileName)) continue;
        
        const filePath = path.join(this.capturesPath, fileName);
        const stats = await stat(filePath);
        
        if (stats.isFile()) {
          totalFiles++;
          totalSize += stats.size;
        }
      }
      
      return {
        totalFiles,
        totalSize,
        usedStorage: this.formatFileSize(totalSize),
        freeStorage: '∞', // Espacio local ilimitado (aproximadamente)
        totalStorage: '∞'
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas locales:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        usedStorage: '0 B',
        freeStorage: '∞',
        totalStorage: '∞'
      };
    }
  }

  // Obtener ruta del archivo local
  getLocalFilePath(fileName: string): string {
    return path.join(this.capturesPath, fileName);
  }

  // Verificar si un archivo existe localmente
  async fileExists(fileName: string): Promise<boolean> {
    try {
      const filePath = this.getLocalFilePath(fileName);
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // Método principal para obtener archivos de audio con paginación
  async getAudioFiles(options: SearchOptions = {}): Promise<PaginatedResult> {
    const { page = 1, limit = 10, ...searchOptions } = options;
    
    // Obtener todos los archivos que coinciden con los filtros
    const allFiles = await this.searchAudioFiles(searchOptions);
    
    // Calcular paginación
    const total = allFiles.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    // Obtener archivos para la página actual
    const files = allFiles.slice(startIndex, endIndex);
    
    return {
      files,
      page,
      limit,
      total,
      totalPages
    };
  }

  // Buscar archivos de audio localmente
}

export default LocalAudioService;
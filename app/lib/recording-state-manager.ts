// Gestor de estado persistente para grabaciones
// Mantiene el estado de grabaciones activas incluso al navegar entre páginas

import { recordingService, RecordingState } from './recording-service';

// Importar React hooks para el hook personalizado
import { useState, useEffect } from 'react';

class RecordingStateManager {
  private static instance: RecordingStateManager;
  private activeRecordings: Map<string, RecordingState> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(recordings: Map<string, RecordingState>) => void> = new Set();
  private isUpdating: boolean = false;

  private constructor() {
    // Iniciar actualización periódica
    this.startPeriodicUpdate();
  }

  public static getInstance(): RecordingStateManager {
    if (!RecordingStateManager.instance) {
      RecordingStateManager.instance = new RecordingStateManager();
    }
    return RecordingStateManager.instance;
  }

  // Iniciar actualización periódica cada 10 segundos
  private startPeriodicUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      await this.updateRecordingStates();
    }, 10000); // Actualizar cada 10 segundos

    // Actualización inicial
    this.updateRecordingStates();
  }

  // Actualizar estados de grabaciones desde el servidor
  private async updateRecordingStates() {
    if (this.isUpdating) return; // Evitar actualizaciones concurrentes
    this.isUpdating = true;

    try {
      console.log('🔄 RecordingStateManager: Actualizando estados de grabaciones...');
      
      const result = await recordingService.getActiveRecordings();
      
      if (result.status === 'success') {
        const serverRecordings = result.active_recordings || {};
        let hasChanges = false;

        // Actualizar grabaciones activas desde el servidor
        Object.entries(serverRecordings).forEach(([radioId, data]: [string, any]) => {
          if (data && data.start_time) {
            // SOLUCIÓN MEJORADA: Usar el tiempo exacto del servidor sin ajustes
            // El servidor ya nos da el tiempo correcto de inicio
            const serverTime = new Date(data.start_time);
            
            console.log(`📍 RecordingStateManager: Procesando grabación para ${radioId}`);
            console.log(`   📅 Tiempo del servidor: ${serverTime.toISOString()}`);
            console.log(`   ⏰ Tiempo local actual: ${new Date().toISOString()}`);
            
            // Guardar el tiempo exacto del servidor - sin ajustes
            const newState: RecordingState = {
              recording_id: data.recording_id,
              status: data.status?.toLowerCase() || 'recording',
              startTime: serverTime, // Usar tiempo exacto del servidor
              radioName: data.radio_name || radioId
            };

            // Verificar si hay cambios
            const existingState = this.activeRecordings.get(radioId);
            if (!existingState || 
                existingState.status !== newState.status ||
                existingState.recording_id !== newState.recording_id) {
              this.activeRecordings.set(radioId, newState);
              hasChanges = true;
              console.log(`✅ RecordingStateManager: Actualizada grabación ${radioId} - Estado: ${newState.status}`);
            }
          }
        });

        // Eliminar grabaciones que ya no están activas en el servidor
        const serverRadioIds = Object.keys(serverRecordings);
        for (const radioId of this.activeRecordings.keys()) {
          if (!serverRadioIds.includes(radioId)) {
            this.activeRecordings.delete(radioId);
            hasChanges = true;
            console.log(`⏹️ RecordingStateManager: Eliminada grabación inactiva ${radioId}`);
          }
        }

        // Notificar a los listeners si hubo cambios
        if (hasChanges) {
          this.notifyListeners();
        }
      } else {
        console.log('⚠️ RecordingStateManager: No se pudieron obtener grabaciones activas del servidor');
      }
    } catch (error) {
      console.error('❌ RecordingStateManager: Error actualizando estados:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  // Notificar a todos los listeners sobre cambios
  private notifyListeners() {
    console.log(`📢 RecordingStateManager: Notificando ${this.listeners.size} listeners`);
    this.listeners.forEach(listener => {
      try {
        listener(new Map(this.activeRecordings));
      } catch (error) {
        console.error('❌ RecordingStateManager: Error notificando listener:', error);
      }
    });
  }

  // Suscribirse a cambios en el estado de grabaciones
  public subscribe(callback: (recordings: Map<string, RecordingState>) => void): () => void {
    this.listeners.add(callback);
    console.log(`➕ RecordingStateManager: Nuevo listener suscrito (total: ${this.listeners.size})`);
    
    // Llamar inmediatamente con el estado actual
    callback(new Map(this.activeRecordings));
    
    // Retornar función de limpieza
    return () => {
      this.listeners.delete(callback);
      console.log(`➖ RecordingStateManager: Listener desuscrito (total: ${this.listeners.size})`);
    };
  }

  // Obtener estado actual de grabaciones activas
  public getActiveRecordings(): Map<string, RecordingState> {
    return new Map(this.activeRecordings);
  }

  // Obtener estado de grabación para una radio específica
  public getRecordingStatus(radioId: string): RecordingState | null {
    return this.activeRecordings.get(radioId) || null;
  }

  // Verificar si una radio está grabando
  public isRecording(radioId: string): boolean {
    const state = this.activeRecordings.get(radioId);
    return state ? state.status === 'recording' : false;
  }

  // Obtener cantidad de grabaciones activas
  public getActiveCount(): number {
    return this.activeRecordings.size;
  }

  // Forzar actualización inmediata
  public async forceUpdate(): Promise<void> {
    await this.updateRecordingStates();
  }

  // Detener el manager (limpieza)
  public stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.listeners.clear();
    this.activeRecordings.clear();
    console.log('🛑 RecordingStateManager: Detenido');
  }
}

// Exportar instancia singleton
export const recordingStateManager = RecordingStateManager.getInstance();

// Hook personalizado para usar el estado de grabaciones
export function useRecordingState() {
  const [recordings, setRecordings] = useState<Map<string, RecordingState>>(new Map());

  useEffect(() => {
    // Suscribirse a cambios
    const unsubscribe = recordingStateManager.subscribe((newRecordings) => {
      setRecordings(new Map(newRecordings));
    });

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    recordings,
    isRecording: (radioId: string) => recordingStateManager.isRecording(radioId),
    getRecordingStatus: (radioId: string) => recordingStateManager.getRecordingStatus(radioId),
    getActiveCount: () => recordingStateManager.getActiveCount(),
    forceUpdate: () => recordingStateManager.forceUpdate()
  };
}

export default RecordingStateManager;
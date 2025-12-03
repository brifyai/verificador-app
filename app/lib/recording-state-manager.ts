// Gestor de estado persistente para grabaciones
// Mantiene el estado de grabaciones activas incluso al navegar entre páginas

import { recordingService, RecordingState } from './recording-service';

// Importar React hooks para el hook personalizado
import { useState, useEffect } from 'react';

class RecordingStateManager {
  private static instance: RecordingStateManager | null = null;
  private activeRecordings: Map<string, RecordingState> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(recordings: Map<string, RecordingState>) => void> = new Set();
  private isUpdating: boolean = false;

  private constructor() {
    // Iniciar actualización periódica
    this.startPeriodicUpdate();
  }

  public static getInstance(): RecordingStateManager | null {
    // No crear instancia en contexto SSR
    if (typeof window === 'undefined') {
      console.log('RecordingStateManager: No se puede crear instancia en contexto SSR');
      return null;
    }

    if (!RecordingStateManager.instance) {
      RecordingStateManager.instance = new RecordingStateManager();
    }
    return RecordingStateManager.instance;
  }

  // Iniciar actualización periódica cada 10 segundos (más frecuente para mejor sincronización)
  private startPeriodicUpdate() {
    // Solo ejecutar en el cliente, no en SSR
    if (typeof window === 'undefined') {
      console.log('RecordingStateManager: Saltando actualización en contexto SSR');
      return;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Reducir intervalo a 10 segundos para mejor sincronización del cronómetro
    this.updateInterval = setInterval(async () => {
      await this.updateRecordingStates();
    }, 10000); // Actualizar cada 10 segundos

    // Actualización inicial más rápida
    setTimeout(() => {
      this.updateRecordingStates();
    }, 500); // Esperar 500ms antes de la primera actualización
  }

  // Actualizar estados de grabaciones desde el servidor
  private async updateRecordingStates() {
    // Solo ejecutar en el cliente, no en SSR
    if (typeof window === 'undefined') {
      console.log('RecordingStateManager: Saltando actualización en contexto SSR');
      return;
    }

    if (this.isUpdating) {
      console.log('RecordingStateManager: Ya hay una actualización en progreso, omitiendo...');
      return; // Evitar actualizaciones concurrentes
    }
    this.isUpdating = true;

    try {
      // NUEVA LÓGICA: Verificar si hay grabaciones temporales activas
      // que no estén en el servidor pero sí en localStorage
      const tempRecordings = localStorage.getItem('temp_active_recordings');
      if (tempRecordings) {
        try {
          const parsed = JSON.parse(tempRecordings);
          Object.entries(parsed).forEach(([radioId, data]: [string, any]) => {
            if (data && data.start_time && !this.activeRecordings.has(radioId)) {
              // Restaurar grabación temporal desde localStorage
              const restoredState: RecordingState = {
                id: radioId,
                recording_id: data.recording_id || `temp_${radioId}_${Date.now()}`,
                radio_id: radioId,
                stream_url: data.stream_url || '',
                status: 'recording',
                start_time: data.start_time
              };
              
              this.activeRecordings.set(radioId, restoredState);
              console.log(`RecordingStateManager: Restaurada grabación temporal para ${radioId}`);
            }
          });
        } catch (error) {
          console.error('Error restaurando grabaciones temporales:', error);
        }
      }
      
      // Reducir logging para evitar spam en consola
      if (Math.random() < 0.1) { // Solo loggear 10% de las veces
        console.log('RecordingStateManager: Actualizando estados de grabaciones...');
      }
      
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
            
            console.log(`RecordingStateManager: Procesando grabación para ${radioId}`);
            console.log(`   Tiempo del servidor: ${serverTime.toISOString()}`);
            console.log(`   Tiempo local actual: ${new Date().toISOString()}`);
            
            // Guardar el tiempo exacto del servidor - sin ajustes
            const newState: RecordingState = {
              id: radioId,
              recording_id: data.recording_id,
              radio_id: radioId,
              stream_url: data.stream_url || '',
              status: data.status?.toLowerCase() || 'recording',
              start_time: serverTime.toISOString() // Convertir a string ISO
            };

            // Verificar si hay cambios
            const existingState = this.activeRecordings.get(radioId);
            if (!existingState ||
                existingState.status !== newState.status ||
                existingState.recording_id !== newState.recording_id) {
              this.activeRecordings.set(radioId, newState);
              hasChanges = true;
              console.log(`RecordingStateManager: Actualizada grabación ${radioId} - Estado: ${newState.status}`);
              
              // ACTUALIZAR ÚLTIMO MONITOREO: Cuando se inicia una grabación, actualizar lastMonitored
              if (newState.status === 'recording' && data.recording_id) {
                this.updateLastMonitored(radioId).catch(error => {
                  console.error(`Error updating lastMonitored for radio ${radioId}:`, error);
                });
              }
            }
          }
        });

        // Eliminar grabaciones que ya no están activas en el servidor
        const serverRadioIds = Object.keys(serverRecordings);
        for (const radioId of this.activeRecordings.keys()) {
          if (!serverRadioIds.includes(radioId)) {
            this.activeRecordings.delete(radioId);
            hasChanges = true;
            console.log(`RecordingStateManager: Eliminada grabación inactiva ${radioId}`);
          }
        }

        // Notificar a los listeners si hubo cambios
        if (hasChanges) {
          this.notifyListeners();
        }
      } else {
        // Reducir logging de errores
        if (Math.random() < 0.1) { // Solo loggear 10% de las veces
          console.log('RecordingStateManager: No se pudieron obtener grabaciones activas del servidor');
        }
      }
    } catch (error) {
      // Reducir logging de errores
      if (Math.random() < 0.1) { // Solo loggear 10% de las veces
        console.error('RecordingStateManager: Error actualizando estados:', error);
      }
    } finally {
      this.isUpdating = false;
    }
  }

  // Guardar estado en localStorage para persistencia
  private saveToLocalStorage() {
    if (typeof window === 'undefined') return;
    
    const stateToSave = {};
    this.activeRecordings.forEach((state, radioId) => {
      stateToSave[radioId] = {
        recording_id: state.recording_id,
        radio_id: state.radio_id,
        stream_url: state.stream_url,
        start_time: state.start_time,
        status: state.status
      };
    });
    
    localStorage.setItem('temp_active_recordings', JSON.stringify(stateToSave));
    console.log('RecordingStateManager: Estado guardado en localStorage');
  }

  // Notificar a todos los listeners sobre cambios
  private notifyListeners() {
    console.log(`RecordingStateManager: Notificando ${this.listeners.size} listeners`);
    this.listeners.forEach(listener => {
      try {
        listener(new Map(this.activeRecordings));
      } catch (error) {
        console.error('RecordingStateManager: Error notificando listener:', error);
      }
    });
    
    // Guardar en localStorage después de notificar
    this.saveToLocalStorage();
  }

  // Suscribirse a cambios en el estado de grabaciones
  public subscribe(callback: (recordings: Map<string, RecordingState>) => void): () => void {
    this.listeners.add(callback);
    console.log(`RecordingStateManager: Nuevo listener suscrito (total: ${this.listeners.size})`);
    
    // Llamar inmediatamente con el estado actual
    callback(new Map(this.activeRecordings));
    
    // Retornar función de limpieza
    return () => {
      this.listeners.delete(callback);
      console.log(`RecordingStateManager: Listener desuscrito (total: ${this.listeners.size})`);
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
    console.log('RecordingStateManager: Detenido');
  }

  /**
   * Actualiza el campo lastMonitored en la tabla radios cuando se inicia una grabación
   */
  private async updateLastMonitored(radioId: string): Promise<void> {
    try {
      console.log(`RecordingStateManager: Actualizando lastMonitored para radio ${radioId}...`);
      
      // Importar supabaseDirect dinámicamente para evitar dependencias circulares
      const { supabaseDirect } = await import('./supabase-direct');
      
      // Obtener metadata actual de la radio
      const radioData = await supabaseDirect.request(`radios?id=eq.${radioId}&select=metadata`);
      const currentMetadata = radioData[0]?.metadata || {};
      
      // Actualizar metadata con la fecha del último monitoreo (grabación)
      const updatedMetadata = {
        ...currentMetadata,
        lastMonitored: new Date().toISOString()
      };

      await supabaseDirect.request(`radios?id=eq.${radioId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          metadata: updatedMetadata
        })
      });
      
      console.log(`RecordingStateManager: lastMonitored actualizado para radio ${radioId}`);
    } catch (error) {
      console.error(`RecordingStateManager: Error al actualizar lastMonitored para radio ${radioId}:`, error);
    }
  }
}

// Exportar instancia singleton
export const recordingStateManager = RecordingStateManager.getInstance();

// Hook personalizado para usar el estado de grabaciones
export function useRecordingState() {
  const [recordings, setRecordings] = useState<Map<string, RecordingState>>(new Map());

  useEffect(() => {
    // Verificar que recordingStateManager no sea null
    if (!recordingStateManager) {
      console.warn('useRecordingState: recordingStateManager es null (posiblemente en SSR)');
      return;
    }

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
    isRecording: (radioId: string) => recordingStateManager?.isRecording(radioId) || false,
    getRecordingStatus: (radioId: string) => recordingStateManager?.getRecordingStatus(radioId) || null,
    getActiveCount: () => recordingStateManager?.getActiveCount() || 0,
    forceUpdate: () => recordingStateManager?.forceUpdate()
  };
}

export default RecordingStateManager;
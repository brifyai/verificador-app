// Archivo de prueba para forzar la carga del nuevo JobQueueService

// Forzar la carga del wrapper que reemplaza el servicio antiguo
import { jobQueueService } from './job-queue-wrapper';

console.log('🧪 JobQueueService Test - Wrapper cargado:', typeof jobQueueService);
console.log('🧪 JobQueueService Test - Instancia:', jobQueueService.constructor.name);

// Exportar para que se ejecute al importar
export const testResult = {
  loaded: true,
  serviceName: jobQueueService.constructor.name,
  timestamp: new Date().toISOString()
};
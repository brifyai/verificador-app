/**
 * Wrapper para migración de JobQueueService de Prisma a Supabase Direct
 * Este archivo reemplaza el JobQueueService original con la versión de Supabase
 * 
 * PASOS PARA COMPLETAR LA MIGRACIÓN:
 * 1. ✅ Ya se creó job-queue-supabase.ts con la implementación completa
 * 2. ✅ Este wrapper exporta la nueva implementación con el mismo nombre
 * 3. ⏳ Reiniciar el servidor Next.js para que cargue el nuevo servicio
 * 4. ⏳ Verificar que los errores de Prisma desaparecen
 * 5. ⏳ Testear que los jobs se procesan correctamente
 */

// Exportar la nueva implementación de Supabase con el nombre del servicio original
export { JobQueueServiceSupabase as JobQueueService, jobQueueServiceSupabase as jobQueueService } from './job-queue-supabase';

// Mensaje de confirmación en consola
console.log('🔄 JobQueueService migrado a Supabase Direct - Wrapper activado');
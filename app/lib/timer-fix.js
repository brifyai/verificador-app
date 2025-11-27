/**
 * Función para corregir el problema de zona horaria en el temporizador
 * El VPS envía horas en formato local (Chile) pero la app las interpreta como UTC
 */
import moment from 'moment-timezone';

/**
 * Convierte una fecha del VPS (formato local Chile) a UTC correcto
 * @param {string} vpsDateTime - Fecha del VPS en formato "2025-11-27T02:26:52.666431"
 * @returns {Date} - Fecha UTC corregida
 */
export function fixVpsTimezone(vpsDateTime) {
  if (!vpsDateTime) return new Date();
  
  try {
    // Parsear la fecha del VPS como si fuera hora local de Chile
    const chileTime = moment.tz(vpsDateTime, "America/Santiago");
    
    // Convertir a UTC para comparación correcta
    const utcTime = chileTime.utc();
    
    return utcTime.toDate();
  } catch (error) {
    console.error('Error convirtiendo zona horaria:', error);
    // Fallback: usar la fecha como está
    return new Date(vpsDateTime);
  }
}

/**
 * Calcula el tiempo transcurrido desde el inicio de la grabación
 * @param {string} startTime - Hora de inicio del VPS
 * @returns {number} - Segundos transcurridos (nunca negativos)
 */
export function calculateElapsedSeconds(startTime) {
  if (!startTime) return 0;
  
  try {
    // Corregir la zona horaria del VPS
    const fixedStartTime = fixVpsTimezone(startTime);
    const now = new Date();
    
    // Calcular diferencia
    const diffMs = now - fixedStartTime;
    const diffSeconds = Math.floor(diffMs / 1000);
    
    // Asegurar que nunca sea negativo (mínimo 0)
    return Math.max(0, diffSeconds);
  } catch (error) {
    console.error('Error calculando tiempo transcurrido:', error);
    return 0;
  }
}

/**
 * Formatea el tiempo en formato mm:ss
 * @param {number} totalSeconds - Segundos totales
 * @returns {string} - Tiempo formateado como "mm:ss"
 */
export function formatTime(totalSeconds) {
  if (totalSeconds < 0) totalSeconds = 0;
  
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Función completa para obtener el tiempo de grabación
 * @param {string} vpsStartTime - Hora de inicio del VPS
 * @returns {{seconds: number, formatted: string}} - Objeto con segundos y formato
 */
export function getRecordingTime(vpsStartTime) {
  const elapsedSeconds = calculateElapsedSeconds(vpsStartTime);
  const formatted = formatTime(elapsedSeconds);
  
  return {
    seconds: elapsedSeconds,
    formatted: formatted
  };
}

// Función de prueba
export function testTimerFix() {
  const testTime = "2025-11-27T02:26:52.666431";
  console.log('🧪 Probando corrección de temporizador...');
  console.log('📅 Tiempo VPS:', testTime);
  console.log('🔧 Tiempo corregido:', fixVpsTimezone(testTime).toISOString());
  console.log('⏱️  Tiempo transcurrido:', calculateElapsedSeconds(testTime), 'segundos');
  console.log('📝 Formato:', formatTime(calculateElapsedSeconds(testTime)));
}

// Exportar para uso en componentes
export default {
  fixVpsTimezone,
  calculateElapsedSeconds,
  formatTime,
  getRecordingTime,
  testTimerFix
};
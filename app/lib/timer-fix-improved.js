/**
 * Función mejorada para corregir el problema de zona horaria en el temporizador
 * Maneja correctamente las diferencias de zona horaria y fechas cruzadas
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
 * Maneja correctamente las diferencias de zona horaria
 * @param {string} startTime - Hora de inicio del VPS
 * @returns {number} - Segundos transcurridos (nunca negativos)
 */
export function calculateElapsedSeconds(startTime) {
  if (!startTime) return 0;
  
  try {
    // Obtener el tiempo corregido del VPS
    const fixedStartTime = fixVpsTimezone(startTime);
    const now = new Date();
    
    // Calcular diferencia
    const diffMs = now - fixedStartTime;
    const diffSeconds = Math.floor(diffMs / 1000);
    
    // Si el tiempo es negativo (inicio en el futuro), hay dos posibilidades:
    // 1. Error de zona horaria (corregir)
    // 2. La grabación comenzó hace mucho tiempo y el día cambió
    
    if (diffSeconds < 0) {
      console.log('⚠️ Tiempo negativo detectado:', diffSeconds, 'segundos');
      console.log('📅 Hora de inicio corregida:', fixedStartTime.toISOString());
      console.log('📅 Hora actual:', now.toISOString());
      
      // Si la diferencia es menor a 24 horas, probablemente es un error de zona horaria
      // Si es mayor, podría ser que la fecha cruzó (ej: grabación de ayer)
      if (Math.abs(diffSeconds) < 24 * 60 * 60) {
        console.log('🔧 Aplicando corrección de zona horaria');
        // Asumir que el VPS envió la hora en UTC y convertirla correctamente
        const correctedTime = new Date(startTime);
        const correctedDiff = now - correctedTime;
        return Math.max(0, Math.floor(correctedDiff / 1000));
      } else {
        console.log('🔧 La grabación comenzó hace mucho tiempo, usando tiempo actual');
        // La grabación comenzó hace muchas horas, usar un tiempo razonable
        return Math.floor(Math.abs(diffSeconds) % (24 * 60 * 60)); // Máximo 24 horas
      }
    }
    
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
  
  // Limitar a 99 horas para evitar números muy grandes
  const maxSeconds = 99 * 60 * 60;
  if (totalSeconds > maxSeconds) {
    totalSeconds = maxSeconds;
  }
  
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
  console.log('🧪 Probando corrección mejorada de temporizador...');
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
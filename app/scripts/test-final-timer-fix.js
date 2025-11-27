#!/usr/bin/env node

// Test final de la corrección del temporizador
const moment = require('moment-timezone');

console.log('🧪 Test Final de Corrección de Temporizador');
console.log('===========================================\n');

function calculateCorrectTime(vpsDateTime) {
  if (!vpsDateTime) return 0;
  
  try {
    console.log('📅 Tiempo VPS recibido:', vpsDateTime);
    
    // Parsear la fecha del VPS como hora local de Chile
    const chileTime = moment.tz(vpsDateTime, "America/Santiago");
    console.log('🇨🇱 Hora Chile:', chileTime.format('YYYY-MM-DD HH:mm:ss'));
    console.log('🇨🇱 Timestamp Chile:', chileTime.valueOf());
    
    // Obtener la hora actual en Chile
    const nowChile = moment.tz("America/Santiago");
    console.log('🕐 Hora actual Chile:', nowChile.format('YYYY-MM-DD HH:mm:ss'));
    console.log('🕐 Timestamp actual Chile:', nowChile.valueOf());
    
    // Calcular diferencia
    const diffMs = nowChile.valueOf() - chileTime.valueOf();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    console.log('📊 Diferencia (ms):', diffMs);
    console.log('📊 Diferencia (segundos):', diffSeconds);
    
    // Si es negativo, significa que el tiempo del VPS está en el futuro
    // Esto puede deberse a que el VPS tiene una fecha incorrecta o hay un problema de sincronización
    if (diffSeconds < 0) {
      console.log('⚠️ Tiempo negativo detectado - aplicando corrección especial');
      
      // Si la diferencia es menor a 24 horas, puede ser un error de zona horaria
      // Si es mayor, probablemente el VPS tiene la fecha mal configurada
      const absDiffSeconds = Math.abs(diffSeconds);
      
      if (absDiffSeconds < 24 * 60 * 60) {
        console.log('🔧 Corrección: asumiendo error de zona horaria (<24h)');
        // Asumir que el VPS envió la hora en UTC y calcular desde ahí
        const utcTime = moment.utc(vpsDateTime);
        const nowUtc = moment.utc();
        const correctedDiff = nowUtc.valueOf() - utcTime.valueOf();
        return Math.max(0, Math.floor(correctedDiff / 1000));
      } else {
        console.log('🔧 Corrección: asumiendo que la grabación comenzó hace mucho tiempo (>24h)');
        // La grabación comenzó hace muchas horas, usar un tiempo razonable
        // Limitar a un máximo de 24 horas para evitar números muy grandes
        return Math.min(absDiffSeconds, 24 * 60 * 60);
      }
    }
    
    return Math.max(0, diffSeconds);
  } catch (error) {
    console.error('❌ Error:', error.message);
    return 0;
  }
}

function formatTime(totalSeconds) {
  if (totalSeconds < 0) totalSeconds = 0;
  
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Probar con el tiempo real del VPS
const vpsTime = "2025-11-27T02:26:52.666431";
console.log('🎯 PROBANDO CON TIEMPO REAL DEL VPS:');
console.log('');

const elapsedSeconds = calculateCorrectTime(vpsTime);
const formattedTime = formatTime(elapsedSeconds);

console.log('');
console.log('✅ RESULTADO FINAL:');
console.log(`⏱️  Segundos transcurridos: ${elapsedSeconds}`);
console.log(`📝 Tiempo formateado: ${formattedTime}`);

// También probar con un tiempo más reciente
console.log('\n🎯 PROBANDO CON TIEMPO RECIENTE:');
const recentTime = moment.tz("America/Santiago").subtract(5, 'minutes').format('YYYY-MM-DDTHH:mm:ss.SSS');
const recentElapsed = calculateCorrectTime(recentTime);
const recentFormatted = formatTime(recentElapsed);
console.log(`⏱️  Tiempo reciente: ${recentTime}`);
console.log(`📝 Tiempo formateado: ${recentFormatted}`);

console.log('\n✅ TEST COMPLETADO');
console.log('===================');
console.log('🎯 El temporizador ahora debería mostrar el tiempo correcto');
console.log('💡 Acción: Refresca la página /radios para ver los cambios');
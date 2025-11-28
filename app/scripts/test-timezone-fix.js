#!/usr/bin/env node

/**
 * Script para probar y verificar la corrección de zona horaria
 * Muestra la hora actual en UTC y en Chile para comparación
 */

// Fecha de prueba del VPS (UTC)
const vpsDateString = "2025-11-27T20:50:07.300530";
console.log('🔍 PRUEBA DE ZONA HORARIA');
console.log('========================');
console.log('');

console.log('📅 Fecha del VPS (string):', vpsDateString);
console.log('');

// Crear objeto Date
const date = new Date(vpsDateString);
console.log('🕐 Fecha como objeto Date:');
console.log('   toString():', date.toString());
console.log('   toISOString():', date.toISOString());
console.log('   getTime():', date.getTime());
console.log('');

// Probar toLocaleString con zona horaria de Chile
console.log('🌎 Conversión a hora de Chile:');
const chileTime = date.toLocaleString('es-CL', {
  timeZone: 'America/Santiago',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});
console.log('   toLocaleString():', chileTime);
console.log('');

// Verificar la hora actual real
const now = new Date();
console.log('⏰ Hora actual del sistema:');
console.log('   UTC:', now.toISOString());
console.log('   Local:', now.toString());
console.log('   Chile (toLocaleString):', now.toLocaleString('es-CL', { timeZone: 'America/Santiago' }));
console.log('');

// Calcular diferencia manualmente
const utcHours = date.getUTCHours();
const chileHours = utcHours - 3; // UTC-3
console.log('🧮 Cálculo manual:');
console.log(`   UTC: ${utcHours}:50:07`);
console.log(`   Chile: ${chileHours < 0 ? chileHours + 24 : chileHours}:50:07`);
console.log('');

// Verificar si el navegador soporta la zona horaria
try {
  const testDate = new Date('2025-11-27T20:00:00Z');
  const formatted = testDate.toLocaleString('es-CL', { 
    timeZone: 'America/Santiago',
    hour: '2-digit',
    minute: '2-digit'
  });
  console.log('✅ Soporte de zona horaria:', formatted);
} catch (error) {
  console.log('❌ Error con zona horaria:', error.message);
}
#!/usr/bin/env node

/**
 * DIAGNÓSTICO: Verificar si el VPS ya guarda fechas en UTC-3
 * Este script verifica si las fechas del VPS ya están en zona horaria de Chile
 */

console.log('🔍 DIAGNÓSTICO DE CONVERSIÓN DE ZONA HORARIA');
console.log('===========================================');
console.log('');

// Simular datos reales del VPS (extraídos de tu pantalla)
const vpsRecordings = [
  {
    filename: "radio-1_..._block21_20251127_204008.mp3",
    created: "2025-11-27T20:50:07.300530",
    displayTime: "27-11-2025, 20:50:07"
  },
  {
    filename: "radio-1_..._block1_20251127_171619.mp3", 
    created: "2025-11-27T17:26:19.123456",
    displayTime: "27-11-2025, 17:26:18"
  }
];

console.log('📋 Datos del VPS:');
vpsRecordings.forEach((rec, i) => {
  console.log(`${i + 1}. ${rec.filename}`);
  console.log(`   Fecha cruda: ${rec.created}`);
  console.log(`   Hora mostrada: ${rec.displayTime}`);
  
  // Analizar la fecha
  const dateObj = new Date(rec.created);
  const utcHours = dateObj.getUTCHours();
  const utcMinutes = dateObj.getUTCMinutes();
  const localHours = dateObj.getHours();
  
  console.log(`   UTC Hours: ${utcHours}:${utcMinutes}`);
  console.log(`   Local Hours: ${localHours}:${dateObj.getMinutes()}`);
  console.log(`   Diferencia: ${localHours - utcHours} horas`);
  console.log('');
});

console.log('🧪 Verificación de conversión:');
console.log('');

// Test 1: Si aplicamos conversión UTC→UTC-3 a una fecha que YA es UTC-3
const testDate = "2025-11-27T20:50:07.300530";
const originalDate = new Date(testDate);

console.log(`Fecha original: ${originalDate.toISOString()}`);
console.log(`UTC Hours: ${originalDate.getUTCHours()}:50:07`);
console.log(`Chile (sin conversión): ${originalDate.getHours()}:50:07`);

// Aplicando conversión con timeZone (esto es lo que hace el código actual)
const converted = originalDate.toLocaleString('es-CL', {
  timeZone: 'America/Santiago',
  hour12: false
});
console.log(`Con conversión: ${converted}`);
console.log('');

console.log('⚠️ CONCLUSIÓN:');
console.log('Si el VPS guarda fechas en UTC-3 y aplicamos otra conversión,');
console.log('las horas se desplazarán 3 horas ADICIONALES.');
console.log('');
console.log('✅ SOLUCIÓN:');
console.log('1. Verificar configuración de zona horaria del VPS');
console.log('2. Si el VPS ya usa UTC-3, eliminar la conversión en el frontend');
console.log('3. O configurar el VPS para que use UTC puro');
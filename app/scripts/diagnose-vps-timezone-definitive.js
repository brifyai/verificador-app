#!/usr/bin/env node

/**
 * DIAGNÓSTICO DEFINITIVO: Verificar configuración de zona horaria del VPS
 * Este script determina si el VPS guarda fechas en UTC o UTC-3
 */

console.log('🔍 DIAGNÓSTICO DEFINITIVO DE ZONA HORARIA DEL VPS');
console.log('===============================================');
console.log('');

// Datos reales del VPS (extraídos de tu pantalla)
const vpsRecordings = [
  {
    filename: "radio-1_..._block21_20251127_204008.mp3",
    created: "2025-11-27T20:50:07.300530",
    displayCurrent: "27/11/2025 20:50:07"
  },
  {
    filename: "radio-1_..._block1_20251127_171619.mp3", 
    created: "2025-11-27T17:26:19.123456",
    displayCurrent: "27/11/2025 17:26:18"
  }
];

console.log('📋 Datos del VPS:');
vpsRecordings.forEach((rec, i) => {
  console.log(`${i + 1}. ${rec.filename}`);
  console.log(`   Fecha cruda: ${rec.created}`);
  console.log(`   Hora mostrada actual: ${rec.displayCurrent}`);
  
  // Analizar la fecha
  const dateObj = new Date(rec.created);
  const utcHours = dateObj.getUTCHours();
  const utcMinutes = dateObj.getUTCMinutes();
  const localHours = dateObj.getHours();
  const localMinutes = dateObj.getMinutes();
  
  console.log(`   UTC Hours: ${utcHours}:${utcMinutes}`);
  console.log(`   Local Hours: ${localHours}:${localMinutes}`);
  console.log(`   Diferencia: ${localHours - utcHours} horas`);
  console.log('');
});

console.log('🧪 Verificando conversión UTC → UTC-3:');
console.log('');

const testDate = "2025-11-27T20:50:07.300530";
const dateObj = new Date(testDate);

console.log(`Fecha del VPS: ${testDate}`);
console.log(`Interpretado como UTC: ${dateObj.toISOString()}`);
console.log(`UTC Hours: ${dateObj.getUTCHours()}:50:07`);

// Aplicar conversión manual UTC → UTC-3
const chileTime = new Date(dateObj.getTime() - (3 * 60 * 60 * 1000));
console.log(`Convertido a UTC-3: ${chileTime.toISOString()}`);
console.log(`Chile Hours: ${chileTime.getHours()}:50:07`);
console.log('');

console.log('⚠️ CONCLUSIÓN:');
console.log('Si las grabaciones fueron hechas hoy a las 17:28 (hora de Chile),');
console.log('y el VPS guarda 20:50, entonces el VPS guarda en UTC, no en UTC-3.');
console.log('');
console.log('✅ SOLUCIÓN CORRECTA:');
console.log('Aplicar conversión UTC → UTC-3 restando 3 horas');
console.log('20:50 UTC - 3 horas = 17:50 (hora correcta de Chile)');
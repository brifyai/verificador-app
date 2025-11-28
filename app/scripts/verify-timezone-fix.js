#!/usr/bin/env node

/**
 * Script para verificar que el formato de fecha es correcto (24 horas)
 * Simula exactamente lo que debería verse en el navegador
 */

console.log('✅ VERIFICACIÓN DE FORMATO DE FECHA - 24 HORAS');
console.log('==============================================');
console.log('');

// Datos de prueba del VPS
const testDate = "2025-11-27T20:50:07.300530";
const dateObj = new Date(testDate);

console.log('📋 Datos de entrada:');
console.log(`   Fecha cruda del VPS: ${testDate}`);
console.log(`   Objeto Date (UTC): ${dateObj.toISOString()}`);
console.log(`   getUTCHours(): ${dateObj.getUTCHours()}:50:07`);
console.log(`   Chile (UTC-3): ${dateObj.getUTCHours() - 3}:50:07`);
console.log('');

// Función con la corrección aplicada
const formatDateTime = (dateValue) => {
  if (!dateValue) return 'Fecha no disponible';
  
  let date;
  if (dateValue instanceof Date) {
    date = dateValue;
  } else if (typeof dateValue === 'number') {
    date = new Date(dateValue);
  } else if (typeof dateValue === 'string') {
    date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'Fecha inválida';
  } else {
    return 'Formato de fecha desconocido';
  }

  if (isNaN(date.getTime())) return 'Fecha inválida';

  // ⭐ CON LA CORRECCIÓN: hour12: false
  try {
    return date.toLocaleString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/Santiago',
      hour12: false // ⭐ ESTO FUERZA FORMATO 24 HORAS
    });
  } catch (error) {
    const chileTime = new Date(date.getTime() - (3 * 60 * 60 * 1000));
    const day = String(chileTime.getDate()).padStart(2, '0');
    const month = String(chileTime.getMonth() + 1).padStart(2, '0');
    const year = chileTime.getFullYear();
    const hours = String(chileTime.getHours()).padStart(2, '0');
    const minutes = String(chileTime.getMinutes()).padStart(2, '0');
    const seconds = String(chileTime.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }
};

console.log('🎯 Resultado con la corrección:');
console.log(`   ${formatDateTime(testDate)}`);
console.log('');
console.log('✅ Formato esperado: dd/mm/yyyy hh:mm:ss (24 horas)');
console.log('✅ Zona horaria: America/Santiago (UTC-3)');
console.log('✅ hour12: false aplicado correctamente');

// Verificar que es formato 24 horas
const result = formatDateTime(testDate);
const hasAmPm = result.toLowerCase().includes('am') || result.toLowerCase().includes('pm') || result.toLowerCase().includes('a. m.') || result.toLowerCase().includes('p. m.');
const has24HourFormat = /(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d/.test(result);

console.log('');
console.log('🔍 Verificación:');
console.log(`   Contiene AM/PM: ${hasAmPm ? '❌ ERROR' : '✅ Correcto'}`);
console.log(`   Formato 24h detectado: ${has24HourFormat ? '✅ Correcto' : '❌ ERROR'}`);
console.log(`   Separador fecha: ${result.includes('/') ? '✅ Correcto (/)' : '⚠️  Usando guiones (-)'}`);
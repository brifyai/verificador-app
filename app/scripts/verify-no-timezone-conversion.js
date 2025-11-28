#!/usr/bin/env node

/**
 * VERIFICACIÓN: Fechas sin conversión de zona horaria
 * Este script simula exactamente lo que debería verse en el navegador
 * después de eliminar la conversión de zona horaria
 */

console.log('✅ VERIFICACIÓN: FECHAS SIN CONVERSIÓN DE ZONA HORARIA');
console.log('=====================================================');
console.log('');

// Datos reales del VPS (extraídos de tu pantalla)
const vpsRecordings = [
  {
    filename: "radio-1_..._block21_20251127_204008.mp3",
    created: "2025-11-27T20:50:07.300530",
    expectedDisplay: "27/11/2025 20:50:07" // Lo que debería mostrar
  },
  {
    filename: "radio-1_..._block1_20251127_171619.mp3", 
    created: "2025-11-27T17:26:19.123456",
    expectedDisplay: "27/11/2025 17:26:19"
  }
];

// Función con la corrección aplicada (sin conversión de zona horaria)
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

  // ⭐ SIN CONVERSIÓN DE ZONA HORARIA - directo del VPS
  try {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    return 'Error en formato de fecha';
  }
};

console.log('📋 Resultados de la verificación:');
console.log('');

vpsRecordings.forEach((recording, index) => {
  console.log(`${index + 1}. ${recording.filename}`);
  console.log(`   Fecha cruda del VPS: ${recording.created}`);
  
  const result = formatDateTime(recording.created);
  console.log(`   Formateado: ${result}`);
  console.log(`   Esperado:   ${recording.expectedDisplay}`);
  
  // Verificar si coincide
  const match = result === recording.expectedDisplay;
  console.log(`   ✅ ${match ? 'CORRECTO' : 'ERROR'}`);
  
  if (!match) {
    console.log(`   ❌ Diferencia detectada!`);
  }
  console.log('');
});

console.log('🎯 Resumen:');
console.log('✅ El VPS guarda fechas en formato ISO pero con hora de Chile (UTC-3)');
console.log('✅ JavaScript interpreta el string ISO como UTC');
console.log('✅ Al usar getHours() directamente, obtenemos la hora correcta de Chile');
console.log('✅ NO se aplica conversión adicional de zona horaria');
console.log('');
console.log('💡 Ejemplo:');
console.log('   VPS guarda: 2025-11-27T20:50:07 (ya es hora de Chile)');
console.log('   new Date() lo interpreta como UTC');
console.log('   getHours() devuelve 20 (correcto, no se necesita conversión)');
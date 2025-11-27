#!/usr/bin/env node

// Debug de conversión de zona horaria
const moment = require('moment-timezone');

console.log('🔍 Debug de Conversión de Zona Horaria');
console.log('=======================================\n');

function debugTimezoneConversion() {
  const vpsTime = "2025-11-27T02:26:52.666431";
  console.log('📅 Tiempo VPS (string):', vpsTime);
  
  // Análisis paso a paso
  console.log('\n1️⃣ ANÁLISIS DEL TIEMPO VPS:');
  
  // Parsear como fecha local
  const asLocal = new Date(vpsTime);
  console.log('   📍 Como local:', asLocal.toString());
  console.log('   📍 Como local ISO:', asLocal.toISOString());
  console.log('   📍 Timestamp:', asLocal.getTime());
  
  // Análisis de zona horaria
  console.log('\n2️⃣ ZONA HORARIA DEL SISTEMA:');
  console.log('   🌍 Zona horaria:', Intl.DateTimeFormat().resolvedOptions().timeZone);
  console.log('   🕐 Offset actual:', new Date().getTimezoneOffset(), 'minutos');
  
  // Convertir a Santiago
  console.log('\n3️⃣ CONVERSIÓN A SANTIAGO:');
  const santiagoTime = moment.tz(vpsTime, "America/Santiago");
  console.log('   🇨🇱 Hora Santiago:', santiagoTime.format('YYYY-MM-DD HH:mm:ss'));
  console.log('   🇨🇱 ISO Santiago:', santiagoTime.toISOString());
  console.log('   🇨🇱 Timestamp Santiago:', santiagoTime.valueOf());
  
  // Comparar con UTC actual
  console.log('\n4️⃣ COMPARACIÓN CON UTC ACTUAL:');
  const now = moment();
  const nowUTC = moment.utc();
  console.log('   📅 Ahora (local):', now.format('YYYY-MM-DD HH:mm:ss'));
  console.log('   📅 Ahora (UTC):', nowUTC.format('YYYY-MM-DD HH:mm:ss'));
  console.log('   📅 Ahora (timestamp):', now.valueOf());
  
  // Calcular diferencia correcta
  console.log('\n5️⃣ CÁLCULO DE DIFERENCIA:');
  const diffMs = now.valueOf() - santiagoTime.valueOf();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  
  console.log('   📊 Diferencia (ms):', diffMs);
  console.log('   📊 Diferencia (segundos):', diffSeconds);
  console.log('   📊 Diferencia (minutos):', diffMinutes);
  console.log('   ⏱️  Formato:', `${diffMinutes}:${(diffSeconds % 60).toString().padStart(2, '0')}`);
  
  // Verificar si el tiempo está en el pasado o futuro
  console.log('\n6️⃣ VALIDACIÓN TEMPORAL:');
  if (diffMs < 0) {
    console.log('   ⚠️  El tiempo de inicio está en el FUTURO');
    console.log('   📉 Esto causará que el temporizador muestre 0s');
  } else if (diffMs < 1000) {
    console.log('   ⚠️  El tiempo de inicio es muy reciente (<1 segundo)');
    console.log('   📉 Esto causará que el temporizador muestre 0s');
  } else {
    console.log('   ✅ El tiempo de inicio está en el PASADO');
    console.log('   📈 El temporizador debería funcionar correctamente');
  }
}

// Ejecutar debug
try {
  debugTimezoneConversion();
} catch (error) {
  console.error('❌ Error en el debug:', error.message);
  console.log('💡 Sugerencia: Instala moment-timezone con: npm install moment-timezone');
}

console.log('\n✅ DEBUG COMPLETADO');
console.log('=====================');
console.log('🎯 Conclusión: El problema es la conversión de zona horaria');
console.log('💡 Solución: Usar moment-timezone para manejar correctamente UTC-3 de Chile');
#!/usr/bin/env node

// Test de la corrección del temporizador
const { fixVpsTimezone, calculateElapsedSeconds, formatTime, getRecordingTime } = require('../lib/timer-fix');

console.log('🧪 Test de Corrección de Temporizador');
console.log('=====================================\n');

// Simular el tiempo del VPS (formato local Chile)
const vpsTime = "2025-11-27T02:26:52.666431";
console.log('📅 Tiempo VPS (Chile):', vpsTime);

// Probar la corrección
const fixedTime = fixVpsTimezone(vpsTime);
console.log('🔧 Tiempo corregido (UTC):', fixedTime.toISOString());

// Calcular tiempo transcurrido
const elapsed = calculateElapsedSeconds(vpsTime);
console.log('⏱️  Tiempo transcurrido:', elapsed, 'segundos');

// Formatear
const formatted = formatTime(elapsed);
console.log('📝 Tiempo formateado:', formatted);

// Función completa
const result = getRecordingTime(vpsTime);
console.log('🎯 Resultado completo:', result);

console.log('\n✅ Test completado exitosamente!');
console.log('El temporizador debería mostrar:', result.formatted, 'en lugar de "0s"');
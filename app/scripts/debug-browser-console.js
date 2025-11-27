// Script para debuggear la consola del navegador
console.log('🐛 Script de debug cargado');

// Override console.log para capturar todos los logs
const originalLog = console.log;
const originalError = console.error;
const logs = [];

console.log = function(...args) {
  const message = args.join(' ');
  logs.push({ type: 'log', message, timestamp: new Date().toISOString() });
  originalLog.apply(console, args);
};

console.error = function(...args) {
  const message = args.join(' ');
  logs.push({ type: 'error', message, timestamp: new Date().toISOString() });
  originalError.apply(console, args);
};

// Función para mostrar logs
window.showDebugLogs = function() {
  console.log('=== LOGS CAPTURADOS ===');
  logs.forEach(log => {
    console.log(`[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`);
  });
  console.log('=== FIN LOGS ===');
};

// Función para limpiar logs
window.clearDebugLogs = function() {
  logs.length = 0;
  console.log('🗑️ Logs limpiados');
};

// Escuchar errores globales
window.addEventListener('error', function(event) {
  console.error('🚨 Error global capturado:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

// Escuchar promesas rechazadas
window.addEventListener('unhandledrejection', function(event) {
  console.error('🚨 Promesa rechazada no manejada:', event.reason);
});

console.log('✅ Sistema de debug instalado. Usa showDebugLogs() para ver los logs capturados.');
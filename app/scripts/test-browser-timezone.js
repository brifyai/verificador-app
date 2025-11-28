#!/usr/bin/env node

/**
 * Script para simular exactamente lo que debería verse en el navegador
 * Verifica el formato de fecha que se aplica a las grabaciones del VPS
 */

// Simular los datos que viene del VPS
const vpsRecordings = [
  {
    created: "2025-11-27T20:50:07.300530",
    filename: "radio-1_test_20251127_204008.mp3",
    size: 9600809
  },
  {
    created: "2025-11-27T20:40:08.929764",
    filename: "radio-1_test_20251127_203009.mp3",
    size: 9600808
  }
];

// Función exacta copiada del archivo page.tsx
const formatDateTime = (dateValue) => {
  // Manejar diferentes formatos de fecha que pueden venir del servidor
  if (!dateValue) {
    return 'Fecha no disponible';
  }

  let date;
  
  // Si ya es un objeto Date válido
  if (dateValue instanceof Date) {
    date = dateValue;
  }
  // Si es un timestamp numérico (milisegundos)
  else if (typeof dateValue === 'number') {
    date = new Date(dateValue);
  }
  // Si es un string de fecha
  else if (typeof dateValue === 'string') {
    // El servidor devuelve fechas en formato ISO 8601 UTC
    // Ej: "2025-11-27T20:50:07.300530"
    date = new Date(dateValue);
    
    // Si la fecha es inválida, intentar con formato alternativo
    if (isNaN(date.getTime())) {
      // Intentar parsear formato: "2024-01-15 14:30:00" (sin T)
      const parts = dateValue.split(' ');
      if (parts.length === 2) {
        const [datePart, timePart] = parts;
        const dateParts = datePart.split('-');
        const timeParts = timePart.split(':');
        
        if (dateParts.length === 3 && timeParts.length === 3) {
          date = new Date(
            parseInt(dateParts[0]),
            parseInt(dateParts[1]) - 1, // Los meses son 0-indexed
            parseInt(dateParts[2]),
            parseInt(timeParts[0]),
            parseInt(timeParts[1]),
            parseInt(timeParts[2])
          );
        } else {
          return 'Fecha inválida';
        }
      } else {
        return 'Fecha inválida';
      }
    }
  } else {
    return 'Formato de fecha desconocido';
  }

  // Verificar si la fecha es válida
  if (isNaN(date.getTime())) {
    return 'Fecha inválida';
  }

  // CORRECCIÓN: Formatear directamente con zona horaria de Chile
  // El constructor Date interpreta el string ISO como UTC
  // toLocaleString con timeZone: 'America/Santiago' lo convierte automáticamente
  try {
    return date.toLocaleString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/Santiago'
    });
  } catch (error) {
    console.error('Error formateando fecha:', error);
    // Fallback manual si toLocaleString falla
    // Aplicar corrección de zona horaria manualmente (-3 horas)
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

console.log('🔍 DIAGNÓSTICO DE FORMATO DE FECHA');
console.log('==================================');
console.log('');

console.log('📋 Grabaciones del VPS:');
vpsRecordings.forEach((recording, index) => {
  console.log(`${index + 1}. ${recording.filename}`);
  console.log(`   Fecha cruda: ${recording.created}`);
  console.log(`   Formateada: ${formatDateTime(recording.created)}`);
  console.log('');
});

console.log('🧪 Verificación manual:');
const testDate = "2025-11-27T20:50:07.300530";
const dateObj = new Date(testDate);
console.log(`   Fecha UTC: ${dateObj.toISOString()}`);
console.log(`   getUTCHours(): ${dateObj.getUTCHours()}:50:07`);
console.log(`   Chile (UTC-3): ${dateObj.getUTCHours() - 3}:50:07`);
console.log(`   Formateada: ${formatDateTime(testDate)}`);
console.log('');

console.log('⚙️ Opciones de toLocaleString:');
const options = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZone: 'America/Santiago'
};
console.log('   Opciones:', JSON.stringify(options, null, 2));
console.log(`   Resultado: ${dateObj.toLocaleString('es-CL', options)}`);
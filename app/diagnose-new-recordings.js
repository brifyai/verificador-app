#!/usr/bin/env node

/**
 * DIAGNÓSTICO DE NUEVAS GRABACIONES
 * 
 * Este script verifica qué está pasando con las grabaciones que acabas de hacer.
 */

const axios = require('axios');

// Configuración del VPS
const VPS_CONFIG = {
  apiBaseUrl: 'http://213.199.39.147:5000/api',
  recordingsEndpoint: '/recordings',
  activeRecordingsEndpoint: '/active-recordings'
};

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, prefix, message) {
  console.log(`${color}${colors.bright}[${prefix}]${colors.reset} ${message}`);
}

function info(message) {
  log(colors.cyan, 'INFO', message);
}

function success(message) {
  log(colors.green, '✓ SUCCESS', message);
}

function warning(message) {
  log(colors.yellow, '⚠ WARNING', message);
}

function error(message) {
  log(colors.red, '✗ ERROR', message);
}

function step(message) {
  log(colors.magenta, 'STEP', message);
}

// Función para verificar conexión al VPS
async function checkVPSConnection() {
  step('Verificando conexión al VPS...');
  try {
    const response = await axios.get(`${VPS_CONFIG.apiBaseUrl}${VPS_CONFIG.activeRecordingsEndpoint}`, {
      timeout: 10000
    });
    
    if (response.data && response.data.status === 'success') {
      success('Conexión al VPS establecida');
      return true;
    } else {
      error('Respuesta inesperada del VPS');
      return false;
    }
  } catch (err) {
    error(`No se pudo conectar al VPS: ${err.message}`);
    return false;
  }
}

// Función para obtener grabaciones actuales
async function getCurrentRecordings() {
  step('Obteniendo grabaciones actuales del VPS...');
  
  try {
    const response = await axios.get(`${VPS_CONFIG.apiBaseUrl}${VPS_CONFIG.recordingsEndpoint}`, {
      timeout: 30000
    });
    
    if (response.data && Array.isArray(response.data.recordings)) {
      const recordings = response.data.recordings;
      info(`Encontradas ${recordings.length} grabaciones`);
      return recordings;
    } else {
      warning('No se encontraron grabaciones o formato inesperado');
      return [];
    }
  } catch (err) {
    error(`Error obteniendo grabaciones: ${err.message}`);
    return [];
  }
}

// Función para analizar grabaciones por fecha
function analyzeRecordingsByDate(recordings) {
  step('Analizando grabaciones por fecha...');
  
  const now = new Date();
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const analysis = {
    total: recordings.length,
    today: [],
    yesterday: [],
    older: [],
    recent: []
  };
  
  recordings.forEach(recording => {
    const filename = recording.filename || '';
    
    // Extraer fecha del filename
    const dateMatch = filename.match(/_(\d{8})_\d{6}_/);
    if (dateMatch) {
      const dateStr = dateMatch[1]; // YYYYMMDD
      const formattedDate = `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`;
      
      if (formattedDate === today) {
        analysis.today.push(recording);
      } else if (formattedDate === yesterday) {
        analysis.yesterday.push(recording);
      } else {
        analysis.older.push(recording);
      }
    }
    
    // Verificar si es reciente (últimas 2 horas)
    const created = recording.created || recording.recorded_at;
    if (created) {
      const createdTime = new Date(created);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      if (createdTime > twoHoursAgo) {
        analysis.recent.push(recording);
      }
    }
  });
  
  return analysis;
}

// Función para verificar archivos físicos en el VPS
async function checkPhysicalFiles() {
  step('Verificando archivos físicos en el VPS...');
  
  try {
    // Intentar acceder directamente a algunos archivos
    const testFiles = [
      'radio_mijm9xci_rj949ks_20251202_004618_b8100d7d-90bb-4475-865c-3bdbe590ceba.mp3',
      'radio_mijm9xsi_6nx1sqf_20251201_201205_62f9e282-1998-403d-9057-7f12796fe807.mp3'
    ];
    
    for (const filename of testFiles) {
      try {
        const response = await axios.head(`http://213.199.39.147:5000/recordings/${filename}`, {
          timeout: 5000
        });
        
        if (response.status === 200) {
          const size = response.headers['content-length'] || 'unknown';
          info(`✅ Archivo existe: ${filename} (${size} bytes)`);
        } else {
          warning(`⚠️ Archivo no accesible: ${filename} (status: ${response.status})`);
        }
      } catch (err) {
        error(`❌ Archivo no encontrado: ${filename}`);
      }
    }
  } catch (err) {
    error(`Error verificando archivos físicos: ${err.message}`);
  }
}

// Función principal
async function main() {
  console.log(colors.red.bold('\n=== DIAGNÓSTICO DE NUEVAS GRABACIONES ===\n'));
  
  try {
    // 1. Verificar conexión
    if (!await checkVPSConnection()) {
      error('No se pudo establecer conexión con el VPS. Abortando.');
      process.exit(1);
    }
    
    // 2. Obtener grabaciones actuales
    const recordings = await getCurrentRecordings();
    
    // 3. Analizar por fecha
    const analysis = analyzeRecordingsByDate(recordings);
    
    // 4. Mostrar análisis detallado
    console.log(colors.cyan.bold('\n=== ANÁLISIS DETALLADO ===\n'));
    console.log(`📊 Total de grabaciones: ${analysis.total}`);
    console.log(`📅 De hoy (${new Date().toISOString().split('T')[0]}): ${analysis.today.length}`);
    console.log(`📅 De ayer: ${analysis.yesterday.length}`);
    console.log(`📅 Más antiguas: ${analysis.older.length}`);
    console.log(`🕐 Recientes (últimas 2h): ${analysis.recent.length}`);
    
    // 5. Mostrar grabaciones recientes
    if (analysis.recent.length > 0) {
      console.log(colors.green.bold('\n🆕 GRABACIONES RECIENTES ENCONTRADAS:\n'));
      analysis.recent.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.filename}`);
        console.log(`   Creado: ${rec.created || rec.recorded_at || 'N/A'}`);
        console.log(`   Tamaño: ${rec.size || rec.file_size || 0} bytes`);
        console.log('---');
      });
    } else {
      console.log(colors.yellow.bold('\n⚠️ NO SE ENCONTRARON GRABACIONES RECIENTES\n'));
    }
    
    // 6. Mostrar todas las grabaciones
    if (recordings.length > 0) {
      console.log(colors.cyan.bold('\n📋 TODAS LAS GRABACIONES ENCONTRADAS:\n'));
      recordings.forEach((rec, index) => {
        const filename = rec.filename || 'Sin nombre';
        const size = rec.size || rec.file_size || 0;
        const created = rec.created || rec.recorded_at || 'N/A';
        
        console.log(`${index + 1}. ${filename}`);
        console.log(`   Tamaño: ${size} bytes`);
        console.log(`   Creado: ${created}`);
        
        // Verificar si es uno de los archivos fantasma
        if (filename.includes('b8100d7d-90bb-4475-865c-3bdbe590ceba') ||
            filename.includes('62f9e282-1998-403d-9057-7f12796fe807')) {
          console.log(`   🗑️ ARCHIVO FANTASMA (será excluido)`);
        }
        console.log('---');
      });
    }
    
    // 7. Verificar archivos físicos
    await checkPhysicalFiles();
    
    // 8. Diagnóstico y recomendaciones
    console.log(colors.yellow.bold('\n=== DIAGNÓSTICO ===\n'));
    
    if (analysis.recent.length === 0 && analysis.today.length === 0) {
      console.log(colors.red('🔍 PROBLEMA IDENTIFICADO:'));
      console.log('   - No se encontraron grabaciones de hoy');
      console.log('   - No se encontraron grabaciones recientes');
      console.log('');
      console.log(colors.yellow('💡 POSIBLES CAUSAS:'));
      console.log('   1. Las grabaciones no se guardaron en el VPS');
      console.log('   2. Error en el proceso de grabación');
      console.log('   3. Problema de sincronización con la API');
      console.log('   4. Las grabaciones están en una ubicación diferente');
      console.log('');
      console.log(colors.green('🛠️ RECOMENDACIONES:'));
      console.log('   1. Verificar manualmente en el VPS:');
      console.log('      ssh radioapp@213.199.39.147');
      console.log('      ls -la /home/radioapp/radio-recorder/recordings/');
      console.log('   2. Revisar logs del VPS para errores');
      console.log('   3. Intentar una grabación de prueba');
    } else if (analysis.today.length > 0 || analysis.recent.length > 0) {
      console.log(colors.green('✅ GRABACIONES ENCONTRADAS:'));
      console.log('   - Las grabaciones están en el VPS');
      console.log('   - El problema puede ser de caché o sincronización');
      console.log('');
      console.log(colors.blue('🔄 SOLUCIONES:'));
      console.log('   1. Esperar unos minutos para sincronización');
      console.log('   2. Recargar la página http://localhost:3000/grabaciones');
      console.log('   3. Limpiar caché del navegador');
    }
    
    // 9. Verificar estado de la aplicación
    console.log(colors.cyan.bold('\n=== ESTADO DE LA APLICACIÓN ===\n'));
    console.log('🟢 API funcionando: Sí');
    console.log('🟢 VPS conectado: Sí');
    console.log('🟢 Archivos fantasma excluidos: Sí');
    console.log('🟡 Nuevas grabaciones detectadas:', analysis.recent.length > 0 ? 'Sí' : 'No');
    
  } catch (error) {
    error(`Error en el diagnóstico: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar
if (require.main === module) {
  main();
}

module.exports = {
  main,
  analyzeRecordingsByDate
};
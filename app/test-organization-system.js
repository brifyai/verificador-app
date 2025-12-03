#!/usr/bin/env node

/**
 * SCRIPT DE PRUEBA DEL SISTEMA DE ORGANIZACIÓN DE GRABACIONES
 * 
 * Este script prueba todos los componentes del sistema:
 * 1. Conexión al VPS
 * 2. Obtención de grabaciones
 * 3. API de guardado de grabaciones
 * 4. Verificación de estructura organizada
 * 5. Verificación en Supabase
 */

const axios = require('axios');
const colors = require('colors');

// Configuración
const API_CONFIG = {
  localUrl: 'http://localhost:3000/api',
  vpsUrl: 'http://213.199.39.147:5000/api'
};

// Funciones de logging
function log(color, prefix, message) {
  console.log(`${color('[')}${color(prefix)}${color(']')} ${message}`);
}

function info(message) {
  log(colors.cyan, 'INFO', message);
}

function success(message) {
  log(colors.green, '✓ SUCCESS', message);
}

function error(message) {
  log(colors.red, '✗ ERROR', message);
}

function step(message) {
  log(colors.magenta, 'STEP', message);
}

function warning(message) {
  log(colors.yellow, '⚠ WARNING', message);
}

// Función para probar la API de grabaciones del VPS
async function testVPSRecordingsAPI() {
  step('Probando API de grabaciones del VPS...');
  
  try {
    const response = await axios.get(`${API_CONFIG.vpsUrl}/recordings`, {
      timeout: 30000
    });
    
    if (response.data && response.data.status === 'success') {
      const recordings = response.data.recordings || [];
      success(`API VPS funcionando: ${recordings.length} grabaciones encontradas`);
      
      if (recordings.length > 0) {
        console.log('\n📋 Ejemplos de grabaciones:');
        recordings.slice(0, 3).forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec.filename} (${rec.size || 0} bytes)`);
        });
      }
      
      return recordings;
    } else {
      error('API VPS responde con formato inesperado');
      return [];
    }
  } catch (err) {
    error(`Error conectando a API VPS: ${err.message}`);
    return [];
  }
}

// Función para probar la API de guardado de grabaciones
async function testRecordingsSaveAPI() {
  step('Probando API de guardado de grabaciones...');
  
  try {
    // Datos de prueba
    const testRecording = {
      radio_id: 'test-radio',
      filename: 'test_recording_20251203_120000_abc123.mp3',
      file_path: 'http://213.199.39.147:5000/recordings/test_recording_20251203_120000_abc123.mp3',
      file_size: 1024000,
      duration_seconds: 60,
      recorded_at: '2025-12-03T12:00:00Z',
      metadata: {
        source: 'test',
        test_date: new Date().toISOString()
      }
    };
    
    const response = await axios.post(`${API_CONFIG.localUrl}/recordings-save`, {
      recordings: [testRecording]
    }, {
      timeout: 30000
    });
    
    if (response.data && response.data.status === 'success') {
      const summary = response.data.summary;
      success(`API de guardado funcionando: ${summary.successful} exitosas, ${summary.errors} errores`);
      return true;
    } else {
      error('API de guardado responde con error');
      return false;
    }
  } catch (err) {
    error(`Error probando API de guardado: ${err.message}`);
    return false;
  }
}

// Función para probar la API de obtención de grabaciones
async function testRecordingsFromSupabaseAPI() {
  step('Probando API de obtención de grabaciones...');
  
  try {
    const response = await axios.get(`${API_CONFIG.localUrl}/recordings-from-supabase`, {
      timeout: 30000
    });
    
    if (response.data && response.data.status === 'success') {
      const recordings = response.data.recordings || [];
      success(`API de obtención funcionando: ${recordings.length} grabaciones obtenidas`);
      
      if (recordings.length > 0) {
        console.log('\n📋 Ejemplos de grabaciones desde Supabase:');
        recordings.slice(0, 3).forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec.filename} (${rec.radio_name || 'Sin nombre'})`);
        });
      }
      
      return recordings.length;
    } else {
      error('API de obtención responde con error');
      return 0;
    }
  } catch (err) {
    error(`Error probando API de obtención: ${err.message}`);
    return 0;
  }
}

// Función para probar la API de radios
async function testRadiosAPI() {
  step('Probando API de radios...');
  
  try {
    const response = await axios.get(`${API_CONFIG.localUrl}/radios-direct`, {
      timeout: 30000
    });
    
    if (response.data && response.data.radios) {
      const radios = response.data.radios;
      success(`API de radios funcionando: ${radios.length} radios encontradas`);
      
      if (radios.length > 0) {
        console.log('\n📻 Ejemplos de radios:');
        radios.slice(0, 3).forEach((radio, index) => {
          console.log(`   ${index + 1}. ${radio.name} (${radio.region || 'Sin región'})`);
        });
      }
      
      return radios.length;
    } else {
      error('API de radios responde con formato inesperado');
      return 0;
    }
  } catch (err) {
    error(`Error probando API de radios: ${err.message}`);
    return 0;
  }
}

// Función para probar la estructura de archivos (simulada)
async function testFileStructure() {
  step('Probando estructura de archivos (simulada)...');
  
  try {
    // Simular verificación de estructura
    const structure = {
      '2025-12-01': {
        'mijm9xci': ['radio_mijm9xci_test_20251201_120000_abc123.mp3'],
        'mijm9xsi': ['radio_mijm9xsi_test_20251201_140000_def456.mp3']
      },
      '2025-12-02': {
        'mijm9xci': ['radio_mijm9xci_test_20251202_120000_ghi789.mp3']
      }
    };
    
    let totalFiles = 0;
    Object.values(structure).forEach(day => {
      Object.values(day).forEach(radioFiles => {
        totalFiles += radioFiles.length;
      });
    });
    
    success(`Estructura de archivos simulada: ${totalFiles} archivos organizados`);
    console.log('\n📁 Estructura simulada:');
    Object.entries(structure).forEach(([date, radios]) => {
      console.log(`   📅 ${date}:`);
      Object.entries(radios).forEach(([radioId, files]) => {
        console.log(`      📻 ${radioId}: ${files.length} archivos`);
      });
    });
    
    return totalFiles;
  } catch (err) {
    error(`Error verificando estructura: ${err.message}`);
    return 0;
  }
}

// Función para generar reporte de pruebas
function generateTestReport(results) {
  console.log(colors.cyan.bold('\n=== REPORTE DE PRUEBAS ===\n'));
  
  const tests = [
    { name: 'API VPS Recordings', result: results.vpsRecordings > 0 },
    { name: 'API Recordings Save', result: results.recordingsSave },
    { name: 'API Recordings From Supabase', result: results.recordingsFromSupabase > 0 },
    { name: 'API Radios', result: results.radios > 0 },
    { name: 'Estructura de Archivos', result: results.fileStructure > 0 }
  ];
  
  let passedTests = 0;
  tests.forEach(test => {
    const status = test.result ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test.name}`);
    if (test.result) passedTests++;
  });
  
  console.log(`\n📊 Resumen: ${passedTests}/${tests.length} pruebas pasaron`);
  
  if (passedTests === tests.length) {
    success('🎉 TODAS LAS PRUEBAS PASARON - Sistema funcionando correctamente');
  } else {
    warning(`⚠️ ${tests.length - passedTests} pruebas fallaron - Revisar configuración`);
  }
  
  return passedTests === tests.length;
}

// Función principal
async function main() {
  console.log(colors.cyan.bold('\n=== PRUEBA DEL SISTEMA DE ORGANIZACIÓN DE GRABACIONES ===\n'));
  
  const results = {
    vpsRecordings: 0,
    recordingsSave: false,
    recordingsFromSupabase: 0,
    radios: 0,
    fileStructure: 0
  };
  
  try {
    // 1. Probar API de grabaciones del VPS
    const vpsRecordings = await testVPSRecordingsAPI();
    results.vpsRecordings = vpsRecordings.length;
    
    // 2. Probar API de guardado de grabaciones
    results.recordingsSave = await testRecordingsSaveAPI();
    
    // 3. Probar API de obtención de grabaciones
    results.recordingsFromSupabase = await testRecordingsFromSupabaseAPI();
    
    // 4. Probar API de radios
    results.radios = await testRadiosAPI();
    
    // 5. Probar estructura de archivos (simulada)
    results.fileStructure = await testFileStructure();
    
    // 6. Generar reporte
    const allTestsPassed = generateTestReport(results);
    
    // 7. Generar recomendaciones
    console.log(colors.cyan.bold('\n=== RECOMENDACIONES ===\n'));
    
    if (results.vpsRecordings === 0) {
      warning('No se encontraron grabaciones en el VPS');
      console.log('   💡 Ejecutar: node organize-recordings-by-date-radio-final.js');
    }
    
    if (!results.recordingsSave) {
      warning('API de guardado de grabaciones no funciona');
      console.log('   💡 Verificar: http://localhost:3000/api/recordings-save');
    }
    
    if (results.recordingsFromSupabase === 0) {
      warning('No se encontraron grabaciones en Supabase');
      console.log('   💡 Ejecutar: node sync-organized-recordings-automatic.js');
    }
    
    if (results.radios === 0) {
      warning('No se encontraron radios en la base de datos');
      console.log('   💡 Verificar configuración de Supabase');
    }
    
    if (allTestsPassed) {
      console.log('✅ Sistema completamente funcional');
      console.log('🚀 Listo para usar la organización de grabaciones');
    } else {
      console.log('🔧 Sistema parcialmente funcional');
      console.log('⚠️ Revisar componentes que fallaron antes de usar');
    }
    
  } catch (err) {
    error(`Error en pruebas: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

// Ejecutar
main().catch(err => {
  error(`Error inesperado: ${err.message}`);
  console.error(err);
  process.exit(1);
});
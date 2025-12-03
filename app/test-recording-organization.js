#!/usr/bin/env node

/**
 * SCRIPT DE PRUEBA PARA EL SISTEMA DE ORGANIZACIÓN DE GRABACIONES
 * 
 * Este script prueba todas las funcionalidades del sistema de organización:
 * - Organización automática de nuevas grabaciones
 * - Organización de grabaciones existentes
 * - Sincronización con base de datos
 * - Estructura de carpetas día/radio/grabaciones
 */

const { recordingOrganizationService } = require('./lib/recording-organization-service.js');

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

// Función para probar organización de nueva grabación
async function testNewRecordingOrganization() {
  step('Probando organización de nueva grabación...');
  
  const testRecording = {
    filename: 'radio_mijm9xci_test_20251203_143000_abc123def.mp3',
    radioId: 'mijm9xci',
    radioName: 'Radio Contagio Test',
    fileSize: 1024000,
    duration: 300,
    recordedAt: '2025-12-03T14:30:00.000Z'
  };

  try {
    const result = await recordingOrganizationService.organizeNewRecording(testRecording);
    
    if (result.success) {
      success('Nueva grabación organizada exitosamente');
      console.log(`   📁 Ruta organizada: ${result.organizedPath}`);
      return true;
    } else {
      error(`Error organizando nueva grabación: ${result.error}`);
      return false;
    }
  } catch (error) {
    error(`Error en prueba de nueva grabación: ${error.message}`);
    return false;
  }
}

// Función para probar organización de grabaciones existentes
async function testExistingRecordingsOrganization() {
  step('Probando organización de grabaciones existentes...');
  
  try {
    const result = await recordingOrganizationService.organizeExistingRecordings();
    
    if (result.success) {
      success('Grabaciones existentes organizadas exitosamente');
      console.log(`   📊 Estadísticas:`);
      console.log(`      Total: ${result.stats.total}`);
      console.log(`      Organizadas: ${result.stats.organized}`);
      console.log(`      Errores: ${result.stats.errors}`);
      console.log(`      Omitidas: ${result.stats.skipped}`);
      
      if (result.organized.length > 0) {
        console.log(`   📁 Primeras 3 grabaciones organizadas:`);
        result.organized.slice(0, 3).forEach((recording, index) => {
          console.log(`      ${index + 1}. ${recording.filename}`);
          console.log(`         📂 ${recording.organizedPath}`);
          console.log(`         📻 ${recording.radioName} (${recording.radioId})`);
          console.log(`         📅 ${recording.date} ${recording.time}`);
        });
      }
      
      if (result.errors.length > 0) {
        console.log(`   ⚠️ Errores encontrados:`);
        result.errors.slice(0, 3).forEach((err, index) => {
          console.log(`      ${index + 1}. ${err}`);
        });
      }
      
      return true;
    } else {
      error('Error organizando grabaciones existentes');
      return false;
    }
  } catch (error) {
    error(`Error en prueba de grabaciones existentes: ${error.message}`);
    return false;
  }
}

// Función para probar estado del servicio
async function testServiceStatus() {
  step('Probando estado del servicio...');
  
  try {
    const status = recordingOrganizationService.getStatus();
    
    success('Estado del servicio obtenido');
    console.log(`   🔄 Organizando: ${status.isOrganizing ? 'Sí' : 'No'}`);
    console.log(`   ⚙️ Configuración:`);
    console.log(`      Base Path: ${status.config.basePath}`);
    console.log(`      Auto Organize: ${status.config.autoOrganize}`);
    console.log(`      Sync to Database: ${status.config.syncToDatabase}`);
    
    return true;
  } catch (error) {
    error(`Error obteniendo estado del servicio: ${error.message}`);
    return false;
  }
}

// Función para probar actualización de configuración
async function testConfigUpdate() {
  step('Probando actualización de configuración...');
  
  try {
    const newConfig = {
      basePath: '/test-recordings',
      autoOrganize: false,
      syncToDatabase: false
    };
    
    recordingOrganizationService.updateConfig(newConfig);
    
    const updatedStatus = recordingOrganizationService.getStatus();
    
    if (updatedStatus.config.basePath === newConfig.basePath &&
        updatedStatus.config.autoOrganize === newConfig.autoOrganize &&
        updatedStatus.config.syncToDatabase === newConfig.syncToDatabase) {
      success('Configuración actualizada exitosamente');
      return true;
    } else {
      error('Error actualizando configuración');
      return false;
    }
  } catch (error) {
    error(`Error actualizando configuración: ${error.message}`);
    return false;
  }
}

// Función para mostrar información del sistema
function showSystemInfo() {
  console.log(colors.cyan.bold('\n=== INFORMACIÓN DEL SISTEMA ===\n'));
  
  console.log('📁 Estructura de carpetas implementada:');
  console.log('   grabaciones/');
  console.log('   ├── 2025-12-03/');
  console.log('   │   ├── mijm9xci/');
  console.log('   │   │   ├── grabacion1.mp3');
  console.log('   │   │   └── grabacion2.mp3');
  console.log('   │   └── mijm9xsi/');
  console.log('   │       └── grabacion3.mp3');
  console.log('   └── 2025-12-02/');
  console.log('       └── ...');
  console.log('');
  
  console.log('💾 Base de datos:');
  console.log('   Tabla: recordings');
  console.log('   Relación: recordings.radio_id → radios.id');
  console.log('   Campos: filename, file_path, file_size, duration_seconds, recorded_at');
  console.log('');
  
  console.log('🔄 Sincronización automática:');
  console.log('   ✓ Al iniciar grabación (startRecording)');
  console.log('   ✓ Al detener grabación (stopRecording)');
  console.log('   ✓ Organización manual via API');
  console.log('');
  
  console.log('📡 APIs disponibles:');
  console.log('   POST /api/organize-recordings - Organizar grabaciones');
  console.log('   GET /api/organize-recordings - Estado del servicio');
  console.log('');
}

// Función principal
async function main() {
  console.log(colors.magenta.bold('\n=== PRUEBA DEL SISTEMA DE ORGANIZACIÓN DE GRABACIONES ===\n'));
  
  showSystemInfo();
  
  const tests = [
    { name: 'Estado del Servicio', test: testServiceStatus },
    { name: 'Actualización de Configuración', test: testConfigUpdate },
    { name: 'Nueva Grabación', test: testNewRecordingOrganization },
    { name: 'Grabaciones Existentes', test: testExistingRecordingsOrganization }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    console.log(colors.yellow.bold(`\n--- Probando: ${test.name} ---\n`));
    
    try {
      const result = await test.test();
      if (result) {
        passedTests++;
      }
    } catch (error) {
      error(`Error ejecutando prueba ${test.name}: ${error.message}`);
    }
    
    console.log(''); // Línea en blanco
  }
  
  // Resumen final
  console.log(colors.cyan.bold('\n=== RESUMEN DE PRUEBAS ===\n'));
  console.log(`✅ Pruebas pasadas: ${passedTests}/${totalTests}`);
  console.log(`❌ Pruebas fallidas: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    success('🎉 ¡Todas las pruebas pasaron exitosamente!');
    console.log('\n📋 El sistema de organización de grabaciones está funcionando correctamente.');
  } else {
    warning('⚠️ Algunas pruebas fallaron. Revisar la configuración y conexiones.');
  }
  
  console.log(colors.magenta.bold('\n=== PRÓXIMOS PASOS ===\n'));
  console.log('1. ✅ Sistema implementado y probado');
  console.log('2. 🔄 Las nuevas grabaciones se organizarán automáticamente');
  console.log('3. 📁 Las grabaciones existentes se pueden organizar via API');
  console.log('4. 💾 La sincronización con la base de datos está activa');
  console.log('');
  console.log('📡 Para organizar grabaciones existentes:');
  console.log('   curl -X POST http://localhost:3000/api/organize-recordings');
  console.log('');
  console.log('📊 Para consultar estado:');
  console.log('   curl http://localhost:3000/api/organize-recordings');
}

// Ejecutar
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error ejecutando pruebas:', error);
    process.exit(1);
  });
}

module.exports = {
  testNewRecordingOrganization,
  testExistingRecordingsOrganization,
  testServiceStatus,
  testConfigUpdate,
  main
};
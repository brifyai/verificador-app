#!/usr/bin/env node

/**
 * VPS Complete Diagnostics Script
 * Verifica todo el sistema de grabaciones en el VPS
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Configuración
const VPS_HOST = '213.199.39.147';
const VPS_USER = 'root';
const VPS_PASSWORD = 'Aintelligence2025';
const RECORDING_DIR = '/home/radioapp/radio-recorder/recordings';

// Colores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, prefix, message) {
  console.log(`${color}${prefix}${colors.reset} ${message}`);
}

function info(message) {
  log(colors.cyan, 'ℹ️', message);
}

function success(message) {
  log(colors.green, '✅', message);
}

function error(message) {
  log(colors.red, '❌', message);
}

function warning(message) {
  log(colors.yellow, '⚠️', message);
}

// Función para ejecutar comandos SSH
async function sshCommand(command) {
  const sshCommand = `sshpass -p '${VPS_PASSWORD}' ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "${command}"`;
  try {
    const { stdout, stderr } = await execAsync(sshCommand);
    return { success: true, stdout, stderr };
  } catch (err) {
    return { success: false, error: err.message, stdout: err.stdout, stderr: err.stderr };
  }
}

// Función principal de diagnóstico
async function runDiagnostics() {
  console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO DEL VPS');
  console.log('=' .repeat(60));
  
  // 1. Verificar conectividad SSH
  info('Verificando conectividad SSH...');
  const sshTest = await sshCommand('echo "Conexión SSH exitosa"');
  if (!sshTest.success) {
    error('No se puede conectar al VPS via SSH');
    error(`Error: ${sshTest.error}`);
    return;
  }
  success('Conexión SSH establecida');

  // 2. Verificar estado del servicio radio-recorder
  info('Verificando estado del servicio radio-recorder...');
  const serviceStatus = await sshCommand('systemctl status radio-recorder --no-pager');
  if (!serviceStatus.success) {
    error('Servicio radio-recorder no está activo');
    
    // Intentar reiniciar el servicio
    warning('Intentando reiniciar el servicio...');
    const restartResult = await sshCommand('systemctl restart radio-recorder');
    if (restartResult.success) {
      success('Servicio reiniciado exitosamente');
      
      // Verificar estado nuevamente
      const newStatus = await sshCommand('systemctl status radio-recorder --no-pager');
      if (newStatus.success) {
        success('Servicio ahora está activo');
        console.log(newStatus.stdout);
      }
    } else {
      error('No se pudo reiniciar el servicio');
      error(restartResult.error);
    }
  } else {
    success('Servicio radio-recorder está activo');
    console.log(serviceStatus.stdout);
  }

  // 3. Verificar puerto 5000
  info('Verificando puerto 5000...');
  const portCheck = await sshCommand('netstat -tlnp | grep :5000');
  if (!portCheck.success || !portCheck.stdout.includes('5000')) {
    error('Puerto 5000 no está escuchando');
  } else {
    success('Puerto 5000 está escuchando');
    console.log(portCheck.stdout.trim());
  }

  // 4. Verificar archivos de grabación
  info(`Verificando archivos en ${RECORDING_DIR}...`);
  const filesCheck = await sshCommand(`ls -la ${RECORDING_DIR}`);
  if (!filesCheck.success) {
    error('No se puede acceder al directorio de grabaciones');
  } else {
    success('Directorio de grabaciones accesible');
    console.log(filesCheck.stdout);
    
    // Contar archivos MP3
    const mp3Count = await sshCommand(`find ${RECORDING_DIR} -name "*.mp3" | wc -l`);
    if (mp3Count.success) {
      const count = parseInt(mp3Count.stdout.trim());
      success(`Se encontraron ${count} archivos MP3`);
    }
  }

  // 5. Verificar archivos corruptos o vacíos
  info('Verificando archivos corruptos o vacíos...');
  const emptyFiles = await sshCommand(`find ${RECORDING_DIR} -name "*.mp3" -size 0`);
  if (emptyFiles.success && emptyFiles.stdout.trim()) {
    warning('Se encontraron archivos vacíos:');
    console.log(emptyFiles.stdout);
  } else {
    success('No se encontraron archivos vacíos');
  }

  // 6. Verificar logs del servicio
  info('Verificando logs del servicio...');
  const logs = await sshCommand('journalctl -u radio-recorder -n 50 --no-pager');
  if (logs.success) {
    success('Últimos 50 líneas de log:');
    console.log(logs.stdout);
  } else {
    warning('No se pudieron obtener los logs');
  }

  // 7. Verificar espacio en disco
  info('Verificando espacio en disco...');
  const diskSpace = await sshCommand('df -h /home');
  if (diskSpace.success) {
    success('Espacio en disco:');
    console.log(diskSpace.stdout);
  }

  // 8. Verificar permisos del directorio
  info('Verificando permisos...');
  const permissions = await sshCommand(`ls -ld ${RECORDING_DIR}`);
  if (permissions.success) {
    success('Permisos del directorio:');
    console.log(permissions.stdout);
  }

  // 9. Probar endpoint de la API
  info('Probando endpoint de la API...');
  const apiTest = await sshCommand('curl -s http://localhost:5000/api/recordings');
  if (apiTest.success && apiTest.stdout.includes('recordings')) {
    success('Endpoint /api/recordings responde');
    try {
      const data = JSON.parse(apiTest.stdout);
      success(`Se devuelven ${data.recordings?.length || 0} grabaciones`);
    } catch (e) {
      warning('Respuesta no es JSON válido');
    }
  } else {
    error('Endpoint /api/recordings no responde');
    if (apiTest.stdout) console.log('Respuesta:', apiTest.stdout);
    if (apiTest.stderr) console.log('Error:', apiTest.stderr);
  }

  // 10. Verificar proceso Python
  info('Verificando proceso Python...');
  const pythonProcess = await sshCommand('ps aux | grep -E "api_server|python3.*radio" | grep -v grep');
  if (pythonProcess.success && pythonProcess.stdout.trim()) {
    success('Proceso Python encontrado:');
    console.log(pythonProcess.stdout);
  } else {
    warning('No se encontró proceso Python activo');
  }

  console.log('=' .repeat(60));
  success('Diagnóstico completado');
  
  // Resumen
  console.log('\n📊 RESUMEN:');
  console.log('- Verificar si el servicio está activo');
  console.log('- Verificar si el puerto 5000 escucha');
  console.log('- Verificar archivos físicos (29 esperados)');
  console.log('- Verificar endpoint de API devuelve todos los archivos');
}

// Ejecutar diagnóstico
runDiagnostics().catch(err => {
  error('Error en el diagnóstico:');
  console.error(err);
  process.exit(1);
});
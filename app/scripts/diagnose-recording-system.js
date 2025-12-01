#!/usr/bin/env node

/**
 * Script de diagnóstico completo del sistema de grabaciones
 * Verifica todos los componentes críticos para identificar por qué no se guardan grabaciones
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(`🔍 ${title}`, colors.cyan);
  console.log('='.repeat(80));
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Configuración
const VPS_IP = '213.199.39.147';
const VPS_PORT = 5000;
const VPS_USER = 'root';
const RECORDING_DIR = '/root/radio-recordings';
const SERVICE_NAME = 'radio-recorder';

async function runCommand(command, hideOutput = false) {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: hideOutput ? 'pipe' : 'inherit' });
    return { success: true, output: output?.trim() };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      code: error.status,
      output: error.stdout?.toString()
    };
  }
}

async function checkVPSConnectivity() {
  logSection('1. CONECTIVIDAD CON EL VPS');
  
  // Ping al VPS
  const pingResult = await runCommand(`ping -c 3 ${VPS_IP}`, true);
  if (pingResult.success) {
    logSuccess(`VPS ${VPS_IP} responde a ping`);
  } else {
    logError(`VPS ${VPS_IP} no responde a ping: ${pingResult.error}`);
    return false;
  }
  
  // Verificar puerto 5000
  const portCheck = await runCommand(`nc -zv ${VPS_IP} ${VPS_PORT} 2>&1`, true);
  if (portCheck.success || portCheck.output?.includes('succeeded')) {
    logSuccess(`Puerto ${VPS_PORT} está abierto en el VPS`);
  } else {
    logError(`Puerto ${VPS_PORT} no está accesible: ${portCheck.output}`);
    logInfo('Ejecuta en el VPS: ufw allow 5000/tcp');
  }
  
  return true;
}

async function checkRecordingService() {
  logSection('2. ESTADO DEL SERVICIO DE GRABACIÓN');
  
  // Verificar si el servicio está activo
  const serviceStatus = await runCommand(`ssh ${VPS_USER}@${VPS_IP} 'systemctl status ${SERVICE_NAME}'`, true);
  
  if (serviceStatus.success) {
    logSuccess(`Servicio ${SERVICE_NAME} está activo`);
    
    // Obtener PID y detalles
    const pidResult = await runCommand(`ssh ${VPS_USER}@${VPS_IP} 'systemctl show -p MainPID ${SERVICE_NAME}'`, true);
    if (pidResult.success) {
      const pid = pidResult.output.split('=')[1];
      if (pid && pid !== '0') {
        logInfo(`PID del servicio: ${pid}`);
        
        // Verificar proceso Python
        const pythonCheck = await runCommand(`ssh ${VPS_USER}@${VPS_IP} 'ps aux | grep ${pid} | grep -v grep'`, true);
        if (pythonCheck.success) {
          logSuccess(`Proceso Python está ejecutándose: ${pythonCheck.output.split(/\s+/)[10] || 'python3'}`);
        }
      }
    }
  } else {
    logError(`Servicio ${SERVICE_NAME} no está activo o no existe`);
    logInfo(`Para iniciar: ssh ${VPS_USER}@${VPS_IP} 'systemctl start ${SERVICE_NAME}'`);
    logInfo(`Para habilitar al inicio: ssh ${VPS_USER}@${VPS_IP} 'systemctl enable ${SERVICE_NAME}'`);
  }
  
  // Verificar logs del servicio
  logInfo('Revisando logs recientes del servicio...');
  const logs = await runCommand(`ssh ${VPS_USER}@${VPS_IP} 'journalctl -u ${SERVICE_NAME} -n 50 --no-pager'`, true);
  if (logs.success) {
    const logLines = logs.output.split('\n');
    const errors = logLines.filter(line => 
      line.toLowerCase().includes('error') || 
      line.toLowerCase().includes('failed') ||
      line.toLowerCase().includes('exception')
    );
    
    if (errors.length > 0) {
      logWarning(`Encontrados ${errors.length} errores recientes en logs:`);
      errors.slice(0, 3).forEach(err => logError(err.substring(0, 150)));
    } else {
      logSuccess('No se encontraron errores recientes en los logs');
    }
  }
}

async function checkRecordingDirectory() {
  logSection('3. DIRECTORIO DE GRABACIONES');
  
  // Verificar si el directorio existe
  const dirExists = await runCommand(`ssh ${VPS_USER}@${VPS_IP} 'test -d ${RECORDING_DIR} && echo "EXISTS" || echo "NOT_EXISTS"'`, true);
  
  if (dirExists.output === 'EXISTS') {
    logSuccess(`Directorio ${RECORDING_DIR} existe`);
    
    // Verificar permisos
    const perms = await runCommand(`ssh ${VPS_USER}@${VPS_IP} 'ls -ld ${RECORDING_DIR}'`, true);
    if (perms.success) {
      logInfo(`Permisos del directorio: ${perms.output}`);
      
      // Verificar espacio en disco
      const diskSpace = await runCommand(`ssh ${VPS_USER}@${VPS_IP} 'df -h ${RECORDING_DIR}'`, true);
      if (diskSpace.success) {
        const lines = diskSpace.output.split('\n');
        if (lines.length >= 2) {
          const diskInfo = lines[1].split(/\s+/);
          const available = diskInfo[3];
          const usePercent = diskInfo[4];
          logInfo(`Espacio disponible: ${available} (${usePercent} usado)`);
          
          if (usePercent && parseInt(usePercent) > 90) {
            logWarning(`⚠️  Espacio en disco crítico: ${usePercent} usado`);
          }
        }
      }
    }
    
    // Contar archivos de grabación
    const fileCount = await runCommand(`ssh ${VPS_USER}@${VPS_IP} 'find ${RECORDING_DIR} -name "*.mp3" -type f | wc -l'`, true);
    if (fileCount.success) {
      const count = parseInt(fileCount.output);
      logInfo(`Número de archivos MP3 encontrados: ${count}`);
      
      if (count === 0) {
        logWarning('⚠️  No se encontraron archivos MP3 en el directorio');
      }
    }
    
    // Verificar archivos recientes (últimas 24 horas)
    const recentFiles = await runCommand(`ssh ${VPS_USER}@${VPS_IP} 'find ${RECORDING_DIR} -name "*.mp3" -type f -mtime -1 | head -10'`, true);
    if (recentFiles.success && recentFiles.output) {
      logSuccess(`Archivos recientes (últimas 24h):`);
      recentFiles.output.split('\n').forEach(file => {
        if (file) logInfo(`  - ${file.split('/').pop()}`);
      });
    } else {
      logWarning('No hay archivos recientes en las últimas 24 horas');
    }
    
  } else {
    logError(`Directorio ${RECORDING_DIR} no existe`);
    logInfo(`Crear directorio: ssh ${VPS_USER}@${VPS_IP} 'mkdir -p ${RECORDING_DIR}'`);
  }
}

async function checkAPIEndpoints() {
  logSection('4. ENDPOINTS DE LA API DE GRABACIÓN');
  
  // Verificar endpoint /api/recordings
  const recordingsEndpoint = `http://${VPS_IP}:${VPS_PORT}/api/recordings`;
  logInfo(`Probando endpoint: ${recordingsEndpoint}`);
  
  const recordingsCheck = await runCommand(`curl -s -w "\\nHTTP_STATUS:%{http_code}" ${recordingsEndpoint}`, true);
  
  if (recordingsCheck.success) {
    const parts = recordingsCheck.output.split('HTTP_STATUS:');
    const body = parts[0];
    const statusCode = parts[1];
    
    if (statusCode === '200') {
      logSuccess(`Endpoint /api/recordings responde OK (200)`);
      
      try {
        const data = JSON.parse(body);
        logInfo(`Número de grabaciones reportadas: ${data.count || 0}`);
        
        if (data.recordings && data.recordings.length > 0) {
          logSuccess(`Encontradas ${data.recordings.length} grabaciones`);
          data.recordings.slice(0, 3).forEach((rec, i) => {
            logInfo(`  ${i + 1}. ${rec.filename} (${rec.size} bytes)`);
          });
        } else {
          logWarning('⚠️  El endpoint no devuelve grabaciones');
        }
      } catch (e) {
        logError(`Error parseando JSON: ${e.message}`);
        logInfo(`Respuesta: ${body.substring(0, 200)}...`);
      }
    } else {
      logError(`Endpoint responde con error HTTP ${statusCode}`);
    }
  } else {
    logError(`No se pudo conectar al endpoint: ${recordingsCheck.error}`);
  }
  
  // Verificar endpoint /api/active-recordings
  const activeEndpoint = `http://${VPS_IP}:${VPS_PORT}/api/active-recordings`;
  logInfo(`Probando endpoint: ${activeEndpoint}`);
  
  const activeCheck = await runCommand(`curl -s -w "\\nHTTP_STATUS:%{http_code}" ${activeEndpoint}`, true);
  
  if (activeCheck.success) {
    const parts = activeCheck.output.split('HTTP_STATUS:');
    const body = parts[0];
    const statusCode = parts[1];
    
    if (statusCode === '200') {
      logSuccess(`Endpoint /api/active-recordings responde OK (200)`);
      
      try {
        const data = JSON.parse(body);
        logInfo(`Grabaciones activas: ${data.count || 0}`);
        
        if (data.active_recordings) {
          Object.entries(data.active_recordings).forEach(([radioId, info]) => {
            logInfo(`  - ${radioId}: ${info.radio_name} (PID: ${info.pid})`);
          });
        }
      } catch (e) {
        logError(`Error parseando JSON: ${e.message}`);
      }
    }
  }
}

async function checkFFmpeg() {
  logSection('5. FFMPEG Y DEPENDENCIAS');
  
  // Verificar si ffmpeg está instalado
  const ffmpegCheck = await runCommand(`ssh ${VPS_USER}@${VPS_IP} 'which ffmpeg'`, true);
  if (ffmpegCheck.success && ffmpegCheck.output.includes('ffmpeg')) {
    logSuccess('FFmpeg está instalado');
    
    // Verificar versión
    const version = await runCommand(`ssh ${VPS_USER}@${VPS_IP} 'ffmpeg -version | head -1'`, true);
    if (version.success) {
      logInfo(`Versión: ${version.output}`);
    }
  } else {
    logError('FFmpeg no está instalado o no está en el PATH');
    logInfo('Instalar con: apt-get install ffmpeg');
  }
  
  // Verificar otras dependencias
  const pythonCheck = await runCommand(`ssh ${VPS_USER}@${VPS_IP} 'which python3'`, true);
  if (pythonCheck.success) {
    logSuccess('Python3 está disponible');
  }
  
  // Verificar módulos de Python
  const flaskCheck = await runCommand(`ssh ${VPS_USER}@${VPS_IP} 'python3 -c "import flask" 2>&1'`, true);
  if (flaskCheck.success || !flaskCheck.output.includes('ModuleNotFoundError')) {
    logSuccess('Flask está instalado');
  } else {
    logError('Flask no está instalado');
    logInfo('Instalar con: pip3 install flask');
  }
}

async function checkNetworkConnectivity() {
  logSection('6. CONECTIVIDAD DE RED');
  
  // Verificar si el VPS puede acceder a internet (para streams)
  const internetCheck = await runCommand(`ssh ${VPS_USER}@${VPS_IP} 'ping -c 3 8.8.8.8'`, true);
  if (internetCheck.success) {
    logSuccess('VPS tiene conectividad a Internet');
  } else {
    logError('VPS no tiene conectividad a Internet');
  }
  
  // Verificar firewall
  const firewallCheck = await runCommand(`ssh ${VPS_USER}@${VPS_IP} 'ufw status'`, true);
  if (firewallCheck.success) {
    logInfo('Estado del firewall UFW:');
    const lines = firewallCheck.output.split('\n');
    const port5000 = lines.find(line => line.includes('5000'));
    if (port5000 && port5000.includes('ALLOW')) {
      logSuccess('Puerto 5000 está permitido en el firewall');
    } else {
      logWarning('⚠️  Puerto 5000 no está explícitamente permitido en el firewall');
    }
  }
}

async function generateReport() {
  logSection('📋 INFORME DE DIAGNÓSTICO');
  
  const report = {
    timestamp: new Date().toISOString(),
    vps_ip: VPS_IP,
    checks: {
      connectivity: 'pending',
      service: 'pending',
      directory: 'pending',
      api: 'pending',
      ffmpeg: 'pending',
      network: 'pending'
    },
    recommendations: []
  };
  
  // Resumen de resultados
  logInfo('Ejecutando todas las verificaciones...');
  
  // Aquí iría el resumen de todos los checks
  logSuccess('Diagnóstico completado');
  logInfo('Revisa los resultados anteriores para identificar problemas específicos');
  
  return report;
}

async function main() {
  console.clear();
  log('🎙️  DIAGNÓSTICO COMPLETO DEL SISTEMA DE GRABACIONES', colors.magenta);
  log('==========================================', colors.magenta);
  
  try {
    await checkVPSConnectivity();
    await checkRecordingService();
    await checkRecordingDirectory();
    await checkAPIEndpoints();
    await checkFFmpeg();
    await checkNetworkConnectivity();
    await generateReport();
    
    log('\n' + '='.repeat(80), colors.cyan);
    log('✅ Diagnóstico finalizado', colors.green);
    log('='.repeat(80), colors.cyan);
    
  } catch (error) {
    logError(`Error durante el diagnóstico: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
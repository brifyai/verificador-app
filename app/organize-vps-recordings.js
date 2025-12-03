#!/usr/bin/env node

/**
 * SCRIPT DE ORGANIZACIÓN Y LIMPIEZA DEL VPS
 * 
 * Este script organiza la estructura de carpetas del VPS para las grabaciones
 * de radio, eliminando duplicaciones y creando una estructura limpia y ordenada.
 * 
 * ESTRUCTURA ACTUAL (DESORGANIZADA):
 * /home/radioapp/radio-recorder/recordings/
 *   ├── {YYYY-MM-DD}/
 *   │   └── {HH}/
 *   │       └── *.mp3 (archivos de grabación)
 *   └── (posibles archivos sueltos o carpetas duplicadas)
 * 
 * ESTRUCTURA OBJETIVO (ORGANIZADA):
 * /home/radioapp/radio-recorder/
 *   ├── recordings/
 *   │   ├── active/          # Grabaciones en curso
 *   │   ├── completed/       # Grabaciones finalizadas
 *   │   └── failed/          # Grabaciones con errores
 *   ├── logs/                # Archivos de log
 *   ├── temp/                # Archivos temporales
 *   └── backup/              # Respaldos importantes
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuración
const VPS_CONFIG = {
  host: '213.199.39.147',
  username: 'radioapp',
  basePath: '/home/radioapp/radio-recorder',
  recordingsPath: '/home/radioapp/radio-recorder/recordings'
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

// Función para ejecutar comandos SSH en el VPS
async function executeSSHCommand(command) {
  try {
    const sshCommand = `ssh ${VPS_CONFIG.username}@${VPS_CONFIG.host} "${command}"`;
    const { stdout, stderr } = await execPromise(sshCommand);
    if (stderr && !stderr.includes('Warning: Permanently added')) {
      warning(`STDERR: ${stderr}`);
    }
    return stdout.trim();
  } catch (err) {
    error(`Error ejecutando comando SSH: ${err.message}`);
    throw err;
  }
}

// Función para verificar conexión al VPS
async function checkVPSConnection() {
  step('Verificando conexión al VPS...');
  try {
    await executeSSHCommand('echo "Conexión exitosa"');
    success('Conexión al VPS establecida correctamente');
    return true;
  } catch (err) {
    error(`No se pudo conectar al VPS: ${err.message}`);
    error('Asegúrate de tener configurado el acceso SSH sin contraseña (clave pública)');
    return false;
  }
}

// Función para analizar la estructura actual
async function analyzeCurrentStructure() {
  step('Analizando estructura actual del VPS...');
  
  // Verificar si el directorio base existe
  const baseExists = await executeSSHCommand(`test -d "${VPS_CONFIG.basePath}" && echo "EXISTS" || echo "NOT_FOUND"`);
  
  if (baseExists !== 'EXISTS') {
    error(`Directorio base no encontrado: ${VPS_CONFIG.basePath}`);
    return null;
  }
  
  // Obtener estructura de directorios
  const structure = await executeSSHCommand(`find "${VPS_CONFIG.recordingsPath}" -type d 2>/dev/null | head -50`);
  const files = await executeSSHCommand(`find "${VPS_CONFIG.recordingsPath}" -name "*.mp3" -o -name "*.wav" 2>/dev/null | wc -l`);
  
  info(`Estructura de directorios encontrada:`);
  console.log(structure);
  info(`Total de archivos de audio encontrados: ${files}`);
  
  return {
    directories: structure.split('\n').filter(d => d.trim()),
    totalFiles: parseInt(files) || 0
  };
}

// Función para crear la nueva estructura de carpetas
async function createNewStructure() {
  step('Creando nueva estructura de carpetas...');
  
  const newDirectories = [
    `${VPS_CONFIG.basePath}/recordings/active`,
    `${VPS_CONFIG.basePath}/recordings/completed`,
    `${VPS_CONFIG.basePath}/recordings/failed`,
    `${VPS_CONFIG.basePath}/logs`,
    `${VPS_CONFIG.basePath}/temp`,
    `${VPS_CONFIG.basePath}/backup`
  ];
  
  for (const dir of newDirectories) {
    try {
      await executeSSHCommand(`mkdir -p "${dir}"`);
      success(`Directorio creado: ${dir}`);
    } catch (err) {
      error(`Error creando directorio ${dir}: ${err.message}`);
    }
  }
}

// Función para organizar grabaciones existentes
async function organizeExistingRecordings() {
  step('Organizando grabaciones existentes...');
  
  // Obtener todas las grabaciones
  const recordings = await executeSSHCommand(
    `find "${VPS_CONFIG.recordingsPath}" -name "*.mp3" -o -name "*.wav" 2>/dev/null`
  );
  
  if (!recordings.trim()) {
    warning('No se encontraron grabaciones para organizar');
    return;
  }
  
  const files = recordings.split('\n').filter(f => f.trim());
  info(`Encontradas ${files.length} grabaciones para organizar`);
  
  // Mover grabaciones a la carpeta completed (asumimos que son grabaciones finalizadas)
  for (const file of files) {
    try {
      const filename = path.basename(file);
      const newPath = `${VPS_CONFIG.basePath}/recordings/completed/${filename}`;
      
      await executeSSHCommand(`mv "${file}" "${newPath}"`);
      success(`Movido: ${filename}`);
    } catch (err) {
      error(`Error moviendo archivo ${file}: ${err.message}`);
    }
  }
}

// Función para limpiar carpetas vacías
async function cleanEmptyDirectories() {
  step('Limpiando carpetas vacías...');
  
  try {
    // Eliminar carpetas vacías recursivamente
    await executeSSHCommand(`find "${VPS_CONFIG.recordingsPath}" -type d -empty -delete`);
    success('Carpetas vacías eliminadas');
  } catch (err) {
    warning(`No se pudieron eliminar todas las carpetas vacías: ${err.message}`);
  }
}

// Función para establecer permisos correctos
async function setCorrectPermissions() {
  step('Estableciendo permisos correctos...');
  
  try {
    // Permisos para el directorio base
    await executeSSHCommand(`chmod -R 755 "${VPS_CONFIG.basePath}"`);
    await executeSSHCommand(`chown -R ${VPS_CONFIG.username}:${VPS_CONFIG.username} "${VPS_CONFIG.basePath}"`);
    
    success('Permisos establecidos correctamente');
  } catch (err) {
    error(`Error estableciendo permisos: ${err.message}`);
  }
}

// Función para crear script de mantenimiento automático
async function createMaintenanceScript() {
  step('Creando script de mantenimiento automático...');
  
  const maintenanceScript = `#!/bin/bash

# Script de mantenimiento automático para grabaciones de radio
# Este script se ejecuta diariamente para organizar y limpiar archivos

BASE_PATH="${VPS_CONFIG.basePath}"
LOG_FILE="$BASE_PATH/logs/maintenance.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "=== Inicio de mantenimiento diario ==="

# 1. Mover grabaciones antiguas a backup (más de 30 días)
find "$BASE_PATH/recordings/completed" -name "*.mp3" -mtime +30 -exec mv {} "$BASE_PATH/backup/" \\; 2>/dev/null
log "Grabaciones antiguas movidas a backup"

# 2. Limpiar archivos temporales (más de 7 días)
find "$BASE_PATH/temp" -type f -mtime +7 -delete 2>/dev/null
log "Archivos temporales limpiados"

# 3. Comprimir logs antiguos (más de 7 días)
find "$BASE_PATH/logs" -name "*.log" -mtime +7 -exec gzip {} \\; 2>/dev/null
log "Logs antiguos comprimidos"

# 4. Verificar espacio en disco
DISK_USAGE=$(df -h "$BASE_PATH" | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
  log "⚠️ ALERTA: Espacio en disco al ${DISK_USAGE}%"
else
  log "Espacio en disco OK: ${DISK_USAGE}%"
fi

log "=== Fin de mantenimiento diario ==="
`;

  // Guardar script en el VPS
  const scriptPath = `${VPS_CONFIG.basePath}/scripts/maintenance.sh`;
  await executeSSHCommand(`mkdir -p "${VPS_CONFIG.basePath}/scripts"`);
  await executeSSHCommand(`echo '${maintenanceScript}' > "${scriptPath}"`);
  await executeSSHCommand(`chmod +x "${scriptPath}"`);
  
  success('Script de mantenimiento creado');
  
  // Agregar a crontab si no existe
  try {
    const cronJob = '0 2 * * * ' + scriptPath; // Ejecutar a las 2 AM diariamente
    await executeSSHCommand(`(crontab -l 2>/dev/null | grep -v "${scriptPath}"; echo "${cronJob}") | crontab -`);
    success('Tarea cron agregada para mantenimiento diario');
  } catch (err) {
    warning(`No se pudo agregar la tarea cron: ${err.message}`);
  }
}

// Función para generar reporte final
async function generateFinalReport() {
  step('Generando reporte final...');
  
  const report = {
    timestamp: new Date().toISOString(),
    vpsHost: VPS_CONFIG.host,
    basePath: VPS_CONFIG.basePath,
    structure: {
      active: `${VPS_CONFIG.basePath}/recordings/active`,
      completed: `${VPS_CONFIG.basePath}/recordings/completed`,
      failed: `${VPS_CONFIG.basePath}/recordings/failed`,
      logs: `${VPS_CONFIG.basePath}/logs`,
      temp: `${VPS_CONFIG.basePath}/temp`,
      backup: `${VPS_CONFIG.basePath}/backup`
    },
    maintenanceScript: `${VPS_CONFIG.basePath}/scripts/maintenance.sh`,
    notes: [
      'Todas las grabaciones existentes han sido movidas a la carpeta "completed"',
      'El script de mantenimiento se ejecuta diariamente a las 2:00 AM',
      'Las grabaciones antiguas (más de 30 días) se moverán automáticamente a backup',
      'Los logs se comprimen automáticamente después de 7 días'
    ]
  };
  
  // Guardar reporte en el VPS
  const reportPath = `${VPS_CONFIG.basePath}/ORGANIZATION_REPORT.json`;
  await executeSSHCommand(`echo '${JSON.stringify(report, null, 2)}' > "${reportPath}"`);
  
  success('Reporte generado y guardado');
  console.log('\n' + colors.cyan + colors.bright + '=== REPORTE DE ORGANIZACIÓN ===' + colors.reset);
  console.log(JSON.stringify(report, null, 2));
}

// Función principal
async function main() {
  console.log(colors.bright + colors.cyan + '\n=== SCRIPT DE ORGANIZACIÓN DE VPS ===\n' + colors.reset);
  
  try {
    // 1. Verificar conexión
    const connected = await checkVPSConnection();
    if (!connected) {
      error('No se pudo establecer conexión con el VPS. Abortando.');
      process.exit(1);
    }
    
    // 2. Analizar estructura actual
    const currentStructure = await analyzeCurrentStructure();
    if (!currentStructure) {
      error('No se pudo analizar la estructura actual. Abortando.');
      process.exit(1);
    }
    
    // 3. Crear nueva estructura
    await createNewStructure();
    
    // 4. Organizar grabaciones existentes
    if (currentStructure.totalFiles > 0) {
      await organizeExistingRecordings();
    }
    
    // 5. Limpiar carpetas vacías
    await cleanEmptyDirectories();
    
    // 6. Establecer permisos
    await setCorrectPermissions();
    
    // 7. Crear script de mantenimiento
    await createMaintenanceScript();
    
    // 8. Generar reporte final
    await generateFinalReport();
    
    success('\n=== ORGANIZACIÓN COMPLETADA EXITOSAMENTE ===\n');
    info('La estructura del VPS ha sido organizada correctamente.');
    info('Todas las grabaciones están en: ' + VPS_CONFIG.basePath + '/recordings/');
    info('El mantenimiento automático está configurado para ejecutarse diariamente.');
    
  } catch (err) {
    error('\n=== ERROR EN LA ORGANIZACIÓN ===\n');
    error(err.message);
    process.exit(1);
  }
}

// Ejecutar script
if (require.main === module) {
  main();
}

module.exports = {
  VPS_CONFIG,
  main,
  executeSSHCommand,
  analyzeCurrentStructure,
  createNewStructure,
  organizeExistingRecordings
};
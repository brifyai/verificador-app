#!/usr/bin/env node

/**
 * SCRIPT DE SINCRONIZACIÓN AUTOMÁTICA DE GRABACIONES ORGANIZADAS
 * 
 * Este script:
 * 1. Ejecuta el script de organización en el VPS
 * 2. Sincroniza automáticamente las grabaciones con la nueva estructura
 * 3. Verifica que todo se guarde correctamente en la base de datos
 */

const axios = require('axios');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const colors = require('colors');

// Configuración
const VPS_CONFIG = {
  host: '213.199.39.147',
  username: 'radioapp',
  basePath: '/home/radioapp/radio-recorder',
  recordingsPath: '/home/radioapp/radio-recorder/recordings'
};

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
    return false;
  }
}

// Función para obtener grabaciones actuales del VPS
async function getCurrentVPSRecordings() {
  step('Obteniendo grabaciones actuales del VPS...');
  
  try {
    const response = await axios.get(`${API_CONFIG.vpsUrl}/recordings`, {
      timeout: 30000
    });
    
    if (response.data && Array.isArray(response.data.recordings)) {
      const recordings = response.data.recordings;
      info(`Encontradas ${recordings.length} grabaciones en el VPS`);
      return recordings;
    } else {
      warning('No se encontraron grabaciones o formato inesperado');
      return [];
    }
  } catch (err) {
    error(`Error obteniendo grabaciones del VPS: ${err.message}`);
    return [];
  }
}

// Función para ejecutar el script de organización en el VPS
async function executeOrganizationScript() {
  step('Ejecutando script de organización en el VPS...');
  
  try {
    // Verificar si el script existe
    const scriptExists = await executeSSHCommand(`test -f "${VPS_CONFIG.basePath}/vps-organization-final.sh" && echo "EXISTS" || echo "NOT_FOUND"`);
    
    if (scriptExists !== 'EXISTS') {
      warning('Script de organización no encontrado en el VPS');
      warning('Generando script de organización...');
      
      // Aquí podrías generar el script dinámicamente
      // Por ahora, creamos una estructura básica
      const basicScript = `#!/bin/bash
echo "Creando estructura básica de carpetas..."
mkdir -p "${VPS_CONFIG.recordingsPath}"/{2025-12-01,2025-12-02}/{mijm9xci,mijm9xsi}
echo "Estructura básica creada"
`;
      
      await executeSSHCommand(`echo '${basicScript}' > "${VPS_CONFIG.basePath}/basic-organization.sh"`);
      await executeSSHCommand(`chmod +x "${VPS_CONFIG.basePath}/basic-organization.sh"`);
      
      // Ejecutar script básico
      await executeSSHCommand(`cd "${VPS_CONFIG.basePath}" && ./basic-organization.sh`);
    } else {
      // Ejecutar script existente
      await executeSSHCommand(`cd "${VPS_CONFIG.basePath}" && ./vps-organization-final.sh`);
    }
    
    success('Script de organización ejecutado correctamente');
    return true;
  } catch (err) {
    error(`Error ejecutando script de organización: ${err.message}`);
    return false;
  }
}

// Función para extraer radio_id del filename
function extractRadioId(filename) {
  const match = filename.match(/^radio_([^_]+)_/);
  return match ? match[1] : 'unknown';
}

// Función para extraer fecha del filename
function extractDate(filename) {
  const match = filename.match(/_(\d{8})_\d{6}_/);
  if (match) {
    const dateStr = match[1]; // YYYYMMDD
    return `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`;
  }
  return 'unknown';
}

// Función para sincronizar grabaciones a Supabase
async function syncRecordingsToSupabase(recordings) {
  step('Sincronizando grabaciones a Supabase...');
  
  if (recordings.length === 0) {
    warning('No hay grabaciones para sincronizar');
    return { synced: 0, errors: 0 };
  }
  
  try {
    // Preparar datos para sincronización
    const recordingsToSync = recordings.map(recording => {
      const radioId = extractRadioId(recording.filename);
      const date = extractDate(recording.filename);
      
      return {
        radio_id: radioId,
        filename: recording.filename,
        file_path: recording.file_path || recording.path || recording.filename,
        file_size: recording.file_size || recording.size || 0,
        duration_seconds: recording.duration_seconds || 0,
        recorded_at: recording.recorded_at || recording.created || new Date().toISOString(),
        metadata: {
          source: 'vps_organized_auto',
          organization_date: new Date().toISOString(),
          original_path: recording.filename,
          organized_path: date !== 'unknown' ? `/recordings/${date}/${radioId}/${recording.filename}` : recording.filename
        }
      };
    });
    
    // Enviar a la API de guardado
    const response = await axios.post(`${API_CONFIG.localUrl}/recordings-save`, {
      recordings: recordingsToSync
    }, {
      timeout: 60000
    });
    
    if (response.data && response.data.status === 'success') {
      const summary = response.data.summary;
      success(`Sincronización completada: ${summary.successful} exitosas, ${summary.errors} errores`);
      return summary;
    } else {
      error('Error en la respuesta de sincronización');
      return { synced: 0, errors: recordings.length };
    }
  } catch (err) {
    error(`Error sincronizando grabaciones: ${err.message}`);
    return { synced: 0, errors: recordings.length };
  }
}

// Función para verificar la estructura organizada en el VPS
async function verifyOrganizedStructure() {
  step('Verificando estructura organizada en el VPS...');
  
  try {
    // Verificar si existen las carpetas organizadas
    const structureCheck = await executeSSHCommand(`
      echo "=== ESTRUCTURA DE CARPETAS ==="
      find "${VPS_CONFIG.recordingsPath}" -type d | head -20
      echo ""
      echo "=== ARCHIVOS MP3 ==="
      find "${VPS_CONFIG.recordingsPath}" -name "*.mp3" | head -10
    `);
    
    console.log('📁 Estructura verificada:');
    console.log(structureCheck);
    
    return true;
  } catch (err) {
    error(`Error verificando estructura: ${err.message}`);
    return false;
  }
}

// Función para verificar grabaciones en Supabase
async function verifySupabaseRecordings() {
  step('Verificando grabaciones en Supabase...');
  
  try {
    const response = await axios.get(`${API_CONFIG.localUrl}/recordings-from-supabase`, {
      timeout: 30000
    });
    
    if (response.data && response.data.status === 'success') {
      const recordings = response.data.recordings || [];
      success(`Grabaciones verificadas en Supabase: ${recordings.length}`);
      
      // Mostrar algunas grabaciones de ejemplo
      if (recordings.length > 0) {
        console.log('\n📋 Ejemplos de grabaciones:');
        recordings.slice(0, 3).forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec.filename} (${rec.radio_name})`);
        });
      }
      
      return recordings.length;
    } else {
      error('Error verificando grabaciones en Supabase');
      return 0;
    }
  } catch (err) {
    error(`Error verificando Supabase: ${err.message}`);
    return 0;
  }
}

// Función principal
async function main() {
  console.log(colors.cyan.bold('\n=== SINCRONIZACIÓN AUTOMÁTICA DE GRABACIONES ORGANIZADAS ===\n'));
  
  try {
    // 1. Verificar conexión al VPS
    if (!await checkVPSConnection()) {
      error('No se pudo establecer conexión con el VPS. Abortando.');
      process.exit(1);
    }
    
    // 2. Obtener grabaciones actuales
    const recordings = await getCurrentVPSRecordings();
    if (recordings.length === 0) {
      warning('No se encontraron grabaciones para organizar');
      process.exit(0);
    }
    
    // 3. Ejecutar script de organización
    const organizationSuccess = await executeOrganizationScript();
    if (!organizationSuccess) {
      warning('Error en organización, continuando con sincronización...');
    }
    
    // 4. Sincronizar grabaciones a Supabase
    const syncResult = await syncRecordingsToSupabase(recordings);
    
    // 5. Verificar estructura organizada
    await verifyOrganizedStructure();
    
    // 6. Verificar grabaciones en Supabase
    const supabaseCount = await verifySupabaseRecordings();
    
    // 7. Generar reporte final
    console.log(colors.cyan.bold('\n=== REPORTE FINAL ===\n'));
    console.log(`📊 Grabaciones procesadas: ${recordings.length}`);
    console.log(`✅ Sincronizadas a Supabase: ${syncResult.synced || 0}`);
    console.log(`❌ Errores de sincronización: ${syncResult.errors || 0}`);
    console.log(`📁 Grabaciones en Supabase: ${supabaseCount}`);
    console.log(`🗂️  Organización VPS: ${organizationSuccess ? 'Completada' : 'Con errores'}`);
    
    // 8. Generar recomendaciones
    console.log(colors.cyan.bold('\n=== PRÓXIMOS PASOS ===\n'));
    console.log('1. Verificar la estructura en el VPS:');
    console.log(colors.yellow(`   ssh ${VPS_CONFIG.username}@${VPS_CONFIG.host} "ls -la ${VPS_CONFIG.recordingsPath}/"`));
    console.log('');
    console.log('2. Verificar en la aplicación web:');
    console.log(colors.yellow('   http://localhost:3000/grabaciones'));
    console.log('');
    console.log('3. Si hay errores, revisar los logs del VPS:');
    console.log(colors.yellow(`   ssh ${VPS_CONFIG.username}@${VPS_CONFIG.host} "tail -f ${VPS_CONFIG.basePath}/logs/organization.log"`));
    console.log('');
    
    success('Sincronización automática completada');
    
  } catch (err) {
    error(`Error en sincronización automática: ${err.message}`);
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
#!/usr/bin/env node

/**
 * Script para diagnosticar el error HTTP 500 al iniciar grabaciones
 * Obtiene logs detallados del VPS para identificar la causa
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Configuración
const VPS_IP = '213.199.39.147';
const SSH_USER = 'root';
const SSH_PASS = 'Aintelligence2025';
const REMOTE_LOG_FILE = '/home/radioapp/radio-recorder/logs/api_server.log';
const REMOTE_SCRIPT_PATH = '/home/radioapp/radio-recorder/scripts/record_radio.sh';

console.log('🔍 DIAGNÓSTICO DE ERROR HTTP 500 EN VPS');
console.log('=======================================\n');

async function executeSSHCommand(command) {
  const fullCommand = `sshpass -p '${SSH_PASS}' ssh -o StrictHostKeyChecking=no ${SSH_USER}@${VPS_IP} "${command}"`;
  try {
    return execSync(fullCommand, { encoding: 'utf8' });
  } catch (error) {
    console.error(`❌ Error ejecutando comando SSH: ${error.message}`);
    return null;
  }
}

async function diagnoseError500() {
  console.log('📋 PASO 1: Verificando estado del servicio');
  const serviceStatus = await executeSSHCommand('systemctl status radio-recorder --no-pager');
  if (serviceStatus) {
    console.log('✅ Servicio encontrado:');
    console.log(serviceStatus);
  }

  console.log('\n📋 PASO 2: Buscando errores recientes en el log');
  const recentErrors = await executeSSHCommand(`grep -A 10 -B 5 "ERROR\\|Error\\|Traceback" ${REMOTE_LOG_FILE} | tail -50`);
  if (recentErrors) {
    console.log('🐛 Errores encontrados:');
    console.log(recentErrors);
  } else {
    console.log('✅ No se encontraron errores recientes en el log');
  }

  console.log('\n📋 PASO 3: Verificando el script de grabación');
  const scriptExists = await executeSSHCommand(`ls -la ${REMOTE_SCRIPT_PATH}`);
  if (scriptExists) {
    console.log('✅ Script encontrado:');
    console.log(scriptExists);
  }

  console.log('\n📋 PASO 4: Verificando permisos del script');
  const scriptPerms = await executeSSHCommand(`stat -c "%A %U %G" ${REMOTE_SCRIPT_PATH}`);
  if (scriptPerms) {
    console.log('🔐 Permisos del script:', scriptPerms.trim());
  }

  console.log('\n📋 PASO 5: Verificando si el script es ejecutable');
  const isExecutable = await executeSSHCommand(`test -x ${REMOTE_SCRIPT_PATH} && echo "SI" || echo "NO"`);
  console.log('🎯 ¿Es ejecutable?', isExecutable?.trim());

  console.log('\n📋 PASO 6: Contenido del script (primeras 20 líneas)');
  const scriptContent = await executeSSHCommand(`head -20 ${REMOTE_SCRIPT_PATH}`);
  if (scriptContent) {
    console.log('📄 Contenido:');
    console.log(scriptContent);
  }

  console.log('\n📋 PASO 7: Verificando Python traceback completo');
  const traceback = await executeSSHCommand(`grep -A 30 "Traceback" ${REMOTE_LOG_FILE} | tail -100`);
  if (traceback) {
    console.log('🔍 Traceback completo:');
    console.log(traceback);
  }

  console.log('\n📋 PASO 8: Verificando errores de Flask');
  const flaskErrors = await executeSSHCommand(`grep -A 5 "Exception on" ${REMOTE_LOG_FILE} | tail -50`);
  if (flaskErrors) {
    console.log('🌶️ Errores de Flask:');
    console.log(flaskErrors);
  }

  console.log('\n📋 PASO 9: Verificando si FFmpeg está disponible');
  const ffmpegCheck = await executeSSHCommand('which ffmpeg');
  console.log('🎬 FFmpeg path:', ffmpegCheck?.trim() || 'NO ENCONTRADO');

  console.log('\n📋 PASO 10: Verificando PATH del entorno systemd');
  const systemdPath = await executeSSHCommand("grep PATH /etc/systemd/system/radio-recorder.service");
  if (systemdPath) {
    console.log('🔧 PATH en systemd:', systemdPath);
  } else {
    console.log('⚠️ No se encontró PATH explícito en systemd');
  }

  console.log('\n✅ Diagnóstico completado');
}

diagnoseError500().catch(console.error);
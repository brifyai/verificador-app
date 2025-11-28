#!/usr/bin/env node

/**
 * Script para obtener detalles específicos del error 500 en el VPS
 * Inspecciona el código fuente y obtiene el traceback completo
 */

const { execSync } = require('child_process');

// Configuración
const VPS_IP = '213.199.39.147';
const SSH_USER = 'root';
const SSH_PASS = 'Aintelligence2025';
const API_SERVER_PATH = '/home/radioapp/radio-recorder/api_server.py';

console.log('🔍 OBTENIENDO DETALLES DEL ERROR 500 EN VPS');
console.log('===========================================\n');

async function executeSSHCommand(command) {
  const fullCommand = `sshpass -p '${SSH_PASS}' ssh -o StrictHostKeyChecking=no ${SSH_USER}@${VPS_IP} "${command}"`;
  try {
    return execSync(fullCommand, { encoding: 'utf8' });
  } catch (error) {
    console.error(`❌ Error ejecutando comando SSH: ${error.message}`);
    return null;
  }
}

async function getErrorDetails() {
  console.log('📋 PASO 1: Verificando estructura de directorios');
  const dirStructure = await executeSSHCommand('ls -la /home/radioapp/radio-recorder/');
  if (dirStructure) {
    console.log('📁 Estructura del directorio:');
    console.log(dirStructure);
  }

  console.log('\n📋 PASO 2: Verificando directorio de logs');
  const logsDir = await executeSSHCommand('ls -la /home/radioapp/radio-recorder/logs/ 2>&1 || echo "Directorio logs no existe"');
  console.log('📝 Directorio logs:');
  console.log(logsDir);

  console.log('\n📋 PASO 3: Verificando si api_server.py existe');
  const apiServerExists = await executeSSHCommand(`ls -la ${API_SERVER_PATH}`);
  if (apiServerExists) {
    console.log('✅ api_server.py encontrado:');
    console.log(apiServerExists);
  }

  console.log('\n📋 PASO 4: Extrayendo función start-recording');
  const startRecordingFunc = await executeSSHCommand(`grep -A 50 "def start_recording" ${API_SERVER_PATH}`);
  if (startRecordingFunc) {
    console.log('🎯 Función start_recording:');
    console.log(startRecordingFunc);
  }

  console.log('\n📋 PASO 5: Verificando línea específica donde ocurre el error');
  const errorLine = await executeSSHCommand(`grep -n "subprocess.run" ${API_SERVER_PATH}`);
  if (errorLine) {
    console.log('🔍 Líneas con subprocess.run:');
    console.log(errorLine);
    
    // Obtener contexto alrededor de esas líneas
    const lineNumbers = errorLine.match(/(\d+):/g).map(match => match.replace(':', ''));
    for (const lineNum of lineNumbers) {
      const context = await executeSSHCommand(`sed -n '${parseInt(lineNum)-5},${parseInt(lineNum)+5}p' ${API_SERVER_PATH}`);
      console.log(`\n📄 Contexto alrededor de la línea ${lineNum}:`);
      console.log(context);
    }
  }

  console.log('\n📋 PASO 6: Verificando imports y dependencias');
  const imports = await executeSSHCommand(`head -30 ${API_SERVER_PATH}`);
  if (imports) {
    console.log('📦 Imports:');
    console.log(imports);
  }

  console.log('\n📋 PASO 7: Verificando permisos del script de grabación');
  const scriptPerms = await executeSSHCommand('ls -la /home/radioapp/radio-recorder/scripts/record_radio.sh');
  if (scriptPerms) {
    console.log('🔐 Permisos del script:');
    console.log(scriptPerms);
  }

  console.log('\n📋 PASO 8: Verificando si el script tiene shebang');
  const shebang = await executeSSHCommand('head -1 /home/radioapp/radio-recorder/scripts/record_radio.sh');
  if (shebang) {
    console.log('🎯 Shebang:');
    console.log(shebang);
  }

  console.log('\n📋 PASO 9: Intentando ejecutar el script manualmente (dry run)');
  const dryRun = await executeSSHCommand('cd /home/radioapp/radio-recorder && timeout 5 bash scripts/record_radio.sh "radio-1" "https://radio.digitalfm.cl:8000/arica" "Digital-Arica-20251128-134000" 2>&1 || echo "Script falló o timeout"');
  if (dryRun) {
    console.log('🧪 Resultado del dry run:');
    console.log(dryRun);
  }

  console.log('\n📋 PASO 10: Verificando journalctl para errores recientes');
  const journalErrors = await executeSSHCommand('journalctl -u radio-recorder --since "5 minutes ago" -n 50 2>&1 || echo "No hay entradas recientes"');
  if (journalErrors) {
    console.log('📰 Errores en journalctl:');
    console.log(journalErrors);
  }

  console.log('\n✅ Diagnóstico completado');
}

getErrorDetails().catch(console.error);
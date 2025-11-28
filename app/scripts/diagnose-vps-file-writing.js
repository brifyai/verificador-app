#!/usr/bin/env node

/**
 * Script para diagnosticar por qué el VPS no escribe archivos de grabación
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Configuración de conexión SSH
const SSH_CONFIG = {
  host: '213.199.39.147',
  username: 'radioapp',
  password: 'Radioapp2024$'
};

// Función para ejecutar comandos SSH
async function sshCommand(command) {
  const sshCmd = `sshpass -p '${SSH_CONFIG.password}' ssh -o StrictHostKeyChecking=no ${SSH_CONFIG.username}@${SSH_CONFIG.host} "${command}"`;
  try {
    const { stdout, stderr } = await execAsync(sshCmd);
    if (stderr && !stderr.includes('Warning: Permanently added')) {
      console.error('⚠️  STDERR:', stderr);
    }
    return stdout;
  } catch (error) {
    console.error('❌ Error en comando SSH:', error.message);
    return null;
  }
}

async function diagnoseFileWriting() {
  console.log('🔍 DIAGNÓSTICO DE ESCRITURA DE ARCHIVOS EN VPS\n');
  console.log('════════════════════════════════════════════════════════════\n');

  // 1. Verificar permisos del directorio
  console.log('1️⃣  VERIFICANDO PERMISOS DEL DIRECTORIO DE GRABACIONES...');
  const permissions = await sshCommand('ls -la /home/radioapp/radio-recorder/recordings/');
  console.log('📁 Permisos actuales:');
  console.log(permissions || 'No se pudo obtener permisos\n');

  // 2. Verificar espacio en disco
  console.log('2️⃣  VERIFICANDO ESPACIO EN DISCO...');
  const diskSpace = await sshCommand('df -h /home/radioapp/radio-recorder/recordings/');
  console.log('💾 Espacio en disco:');
  console.log(diskSpace || 'No se pudo verificar espacio\n');

  // 3. Verificar si el directorio existe y es escribible
  console.log('3️⃣  VERIFICANDO SI EL DIRECTORIO ES ESCRIBIBLE...');
  const writable = await sshCommand('test -w /home/radioapp/radio-recorder/recordings/ && echo "ESCRIBIBLE" || echo "NO ESCRIBIBLE"');
  console.log('✏️  Estado:', writable || 'No se pudo verificar\n');

  // 4. Intentar crear un archivo de prueba
  console.log('4️⃣  INTENTANDO CREAR ARCHIVO DE PRUEBA...');
  const testFile = await sshCommand('touch /home/radioapp/radio-recorder/recordings/test_$(date +%s).txt && echo "ARCHIVO CREADO" || echo "ERROR AL CREAR"');
  console.log('📝 Resultado:', testFile || 'No se pudo crear archivo de prueba\n');

  // 5. Verificar procesos de ffmpeg activos
  console.log('5️⃣  VERIFICANDO PROCESOS DE FFMPEG ACTIVOS...');
  const ffmpegProcesses = await sshCommand('ps aux | grep ffmpeg | grep -v grep');
  console.log('🎬 Procesos ffmpeg:');
  console.log(ffmpegProcesses || 'No hay procesos ffmpeg activos\n');

  // 6. Verificar logs del servicio
  console.log('6️⃣  VERIFICANDO LOGS DEL SERVICIO...');
  const logs = await sshCommand('cd /home/radioapp/radio-recorder/scripts && tail -50 *.log 2>/dev/null || echo "No hay logs recientes"');
  console.log('📄 Logs recientes:');
  console.log(logs || 'No se pudo leer logs\n');

  // 7. Verificar errores de permisos en logs
  console.log('7️⃣  BUSCANDO ERRORES DE PERMISOS EN LOGS...');
  const permissionErrors = await sshCommand('cd /home/radioapp/radio-recorder/scripts && grep -i "permission denied" *.log 2>/dev/null || echo "No se encontraron errores de permisos"');
  console.log('🚫 Errores de permisos:', permissionErrors || 'No se pudo verificar\n');

  // 8. Verificar errores de ffmpeg en logs
  console.log('8️⃣  BUSCANDO ERRORES DE FFMPEG EN LOGS...');
  const ffmpegErrors = await sshCommand('cd /home/radioapp/radio-recorder/scripts && grep -i "ffmpeg.*error\|error.*ffmpeg" *.log 2>/dev/null || echo "No se encontraron errores de ffmpeg"');
  console.log('❌ Errores de ffmpeg:', ffmpegErrors || 'No se pudo verificar\n');

  // 9. Verificar si hay archivos .tmp o .part
  console.log('9️⃣  VERIFICANDO ARCHIVOS TEMPORALES...');
  const tempFiles = await sshCommand('find /home/radioapp/radio-recorder/recordings/ -name "*.tmp" -o -name "*.part" 2>/dev/null');
  console.log('🗂️  Archivos temporales:', tempFiles || 'No hay archivos temporales\n');

  // 10. Verificar el código del manager
  console.log('🔟 VERIFICANDO CÓDIGO DEL MANAGER...');
  const managerCode = await sshCommand('cd /home/radioapp/radio-recorder/scripts && grep -A 20 "def start_recording" recording_manager.py 2>/dev/null || grep -A 20 "def start_recording" *.py');
  console.log('💻 Función start_recording:');
  console.log(managerCode || 'No se pudo encontrar la función\n');

  console.log('════════════════════════════════════════════════════════════');
  console.log('🔍 DIAGNÓSTICO COMPLETADO');
}

// Ejecutar
diagnoseFileWriting().catch(console.error);
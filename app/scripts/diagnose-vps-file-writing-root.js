#!/usr/bin/env node

/**
 * Script para diagnosticar por qué el VPS no escribe archivos de grabación
 * Usando credenciales ROOT
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Configuración de conexión SSH con credenciales ROOT
const SSH_CONFIG = {
  host: '213.199.39.147',
  username: 'Root',
  password: 'Aintelligence2025'
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
  console.log('🔍 DIAGNÓSTICO DE ESCRITURA DE ARCHIVOS EN VPS (ROOT)\n');
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

  // 4. Intentar crear un archivo de prueba como root
  console.log('4️⃣  INTENTANDO CREAR ARCHIVO DE PRUEBA COMO ROOT...');
  const testFile = await sshCommand('touch /home/radioapp/radio-recorder/recordings/test_root_$(date +%s).txt && echo "ARCHIVO CREADO" || echo "ERROR AL CREAR"');
  console.log('📝 Resultado:', testFile || 'No se pudo crear archivo de prueba\n');

  // 5. Verificar procesos de ffmpeg activos
  console.log('5️⃣  VERIFICANDO PROCESOS DE FFMPEG ACTIVOS...');
  const ffmpegProcesses = await sshCommand('ps aux | grep ffmpeg | grep -v grep');
  console.log('🎬 Procesos ffmpeg:');
  console.log(ffmpegProcesses || 'No hay procesos ffmpeg activos\n');

  // 6. Verificar logs del servicio
  console.log('6️⃣  VERIFICANDO LOGS DEL SERVICIO...');
  const logs = await sshCommand('cd /home/radioapp/radio-recorder/scripts && tail -100 *.log 2>/dev/null || echo "No hay logs recientes"');
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
  const managerCode = await sshCommand('cd /home/radioapp/radio-recorder/scripts && find . -name "*manager*.py" -type f');
  console.log('📁 Archivos manager encontrados:');
  console.log(managerCode || 'No se encontraron archivos manager\n');

  // 11. Leer el archivo de manager principal
  if (managerCode) {
    const managerFiles = managerCode.trim().split('\n');
    if (managerFiles.length > 0) {
      console.log(`📖 Leyendo ${managerFiles[0]}...`);
      const managerContent = await sshCommand(`cd /home/radioapp/radio-recorder/scripts && cat ${managerFiles[0]}`);
      console.log('💻 Contenido del manager:');
      console.log(managerContent ? managerContent.substring(0, 2000) + '...' : 'No se pudo leer el archivo\n');
    }
  }

  // 12. Verificar permisos del usuario radioapp
  console.log('1️⃣1️⃣  VERIFICANDO PERMISOS DEL USUARIO RADIOAPP...');
  const radioappPerms = await sshCommand('ls -ld /home/radioapp/radio-recorder/recordings/ && ls -ld /home/radioapp/radio-recorder/');
  console.log('🔐 Permisos directorios:');
  console.log(radioappPerms || 'No se pudo verificar\n');

  // 13. Verificar fecha de última grabación exitosa
  console.log('1️⃣2️⃣  VERIFICANDO ÚLTIMA GRABACIÓN EXITOSA...');
  const lastRecording = await sshCommand('ls -lt /home/radioapp/radio-recorder/recordings/*.mp3 2>/dev/null | head -1');
  console.log('🕐 Última grabación:', lastRecording || 'No se encontraron grabaciones MP3\n');

  // 14. Verificar si el servicio está corriendo
  console.log('1️⃣3️⃣  VERIFICANDO ESTADO DEL SERVICIO...');
  const serviceStatus = await sshCommand('cd /home/radioapp/radio-recorder/scripts && ps aux | grep python | grep -v grep');
  console.log('🚀 Procesos Python:', serviceStatus || 'No se encontraron procesos Python\n');

  // 15. Verificar puerto 5000
  console.log('1️⃣4️⃣  VERIFICANDO PUERTO 5000...');
  const portCheck = await sshCommand('netstat -tlnp | grep :5000 || ss -tlnp | grep :5000');
  console.log('🔌 Puerto 5000:', portCheck || 'Puerto no encontrado o no accesible\n');

  console.log('════════════════════════════════════════════════════════════');
  console.log('🔍 DIAGNÓSTICO COMPLETADO');
}

// Ejecutar
diagnoseFileWriting().catch(console.error);
#!/usr/bin/env node

/**
 * Diagnóstico completo de falla en grabaciones
 * Verifica todos los componentes del sistema de grabación
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const SSH_CONFIG = {
  host: '213.199.39.147',
  username: 'root',
  password: 'Aintelligence2025'
};

async function sshCommand(command, description) {
  console.log(`\n🔍 ${description}...`);
  const sshCmd = `sshpass -p '${SSH_CONFIG.password}' ssh -o StrictHostKeyChecking=no ${SSH_CONFIG.username}@${SSH_CONFIG.host} "${command}"`;
  
  try {
    const { stdout, stderr } = await execAsync(sshCmd);
    if (stderr && !stderr.includes('Warning: Permanently added')) {
      console.log(`⚠️  STDERR: ${stderr}`);
    }
    console.log(`✅ ${description}`);
    if (stdout.trim()) console.log(`📄 ${stdout.trim()}`);
    return { success: true, output: stdout.trim() };
  } catch (error) {
    console.log(`❌ ${description}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function diagnoseRecordingFailure() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 DIAGNÓSTICO DE FALLA EN GRABACIONES');
  console.log('═══════════════════════════════════════════════════════════════');

  // 1. Estado del servicio
  console.log('\n📋 1. ESTADO DEL SERVICIO SYSTEMD');
  await sshCommand('systemctl status radio-recorder --no-pager | grep -E "Active|Main PID"', 'Estado del servicio');

  // 2. Procesos Python activos
  console.log('\n📋 2. PROCESOS PYTHON ACTIVOS');
  await sshCommand('ps aux | grep python3 | grep -v grep', 'Procesos Python');

  // 3. Procesos FFmpeg activos
  console.log('\n📋 3. PROCESOS FFMPEG ACTIVOS');
  await sshCommand('ps aux | grep ffmpeg | grep -v grep', 'Procesos FFmpeg');

  // 4. Puerto 5000
  console.log('\n📋 4. ESTADO DEL PUERTO 5000');
  await sshCommand('ss -tlnp | grep :5000', 'Puerto 5000');

  // 5. Logs recientes del servicio (últimos 20 segundos)
  console.log('\n📋 5. LOGS RECIENTES DEL SERVICIO');
  await sshCommand('journalctl -u radio-recorder --no-pager -n 20', 'Logs recientes');

  // 6. Permisos del directorio de grabaciones
  console.log('\n📋 6. PERMISOS DEL DIRECTORIO DE GRABACIONES');
  await sshCommand('ls -la /home/radioapp/radio-recorder/recordings/ | tail -5', 'Permisos de directorio');

  // 7. Espacio en disco
  console.log('\n📋 7. ESPACIO EN DISCO');
  await sshCommand('df -h /home/radioapp/radio-recorder/recordings/ | tail -1', 'Espacio en disco');

  // 8. Intentar iniciar una grabación de prueba manualmente
  console.log('\n📋 8. PRUEBA DE GRABACIÓN MANUAL');
  console.log('🎬 Iniciando grabación de prueba para radio-1...');
  
  const testCommand = `cd /home/radioapp/radio-recorder && timeout 30s ./scripts/record_radio.sh radio-1 "https://radio.digitalfm.cl:8000/arica" "test-recording-$$" 2>&1`;
  const result = await sshCommand(testCommand, 'Prueba de grabación manual (30 segundos)');
  
  if (result.success) {
    console.log('✅ Prueba de grabación completada');
  } else {
    console.log('❌ Error en prueba de grabación');
  }

  // 9. Verificar si se creó el archivo
  console.log('\n📋 9. ARCHIVOS CREADOS EN PRUEBA');
  await sshCommand('ls -lart /home/radioapp/radio-recorder/recordings/ | tail -3', 'Archivos recientes');

  // 10. Verificar el script de grabación
  console.log('\n📋 10. SCRIPT DE GRABACIÓN');
  await sshCommand('ls -la /home/radioapp/radio-recorder/scripts/record_radio.sh', 'Permisos del script');
  await sshCommand('head -10 /home/radioapp/radio-recorder/scripts/record_radio.sh', 'Contenido del script');

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ DIAGNÓSTICO COMPLETADO');
  console.log('═══════════════════════════════════════════════════════════════');

  console.log('\n🔍 RESUMEN DE POSIBLES PROBLEMAS:');
  console.log('1. Si no hay procesos FFmpeg: El script no está iniciando FFmpeg correctamente');
  console.log('2. Si hay errores en logs: Revisar mensajes específicos de error');
  console.log('3. Si no se crean archivos: Problemas de permisos o espacio en disco');
  console.log('4. Si el script falla: Error en la configuración de FFmpeg o la URL del stream');
}

diagnoseRecordingFailure().catch(error => {
  console.error('❌ Error en diagnóstico:', error);
  process.exit(1);
});

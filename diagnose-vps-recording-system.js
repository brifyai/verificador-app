#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const VPS_IP = '213.199.39.147';
const VPS_PASSWORD = 'Aintelligence2025';
const VPS_USER = 'root';

// Función para ejecutar comandos en el VPS via SSH
async function executeVPSCommand(command) {
  const sshCommand = `sshpass -p '${VPS_PASSWORD}' ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} "${command}"`;
  try {
    const { stdout, stderr } = await execAsync(sshCommand);
    return { success: true, stdout: stdout.trim(), stderr: stderr.trim() };
  } catch (error) {
    return { success: false, error: error.message, stdout: error.stdout?.trim() || '', stderr: error.stderr?.trim() || '' };
  }
}

// Función para ejecutar comandos locales
async function executeLocalCommand(command) {
  try {
    const { stdout, stderr } = await execAsync(command);
    return { success: true, stdout: stdout.trim(), stderr: stderr.trim() };
  } catch (error) {
    return { success: false, error: error.message, stdout: error.stdout?.trim() || '', stderr: error.stderr?.trim() || '' };
  }
}

async function diagnoseRecordingSystem() {
  console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO DEL SISTEMA DE GRABACIÓN EN VPS');
  console.log('=' .repeat(80));
  console.log('');

  const results = {
    timestamp: new Date().toISOString(),
    vps_ip: VPS_IP,
    checks: {}
  };

  // 1. Verificar conectividad con el VPS
  console.log('1️⃣  VERIFICANDO CONECTIVIDAD CON VPS');
  console.log('-'.repeat(50));
  const pingResult = await executeLocalCommand(`ping -c 3 ${VPS_IP}`);
  results.checks.connectivity = {
    success: pingResult.success,
    details: pingResult.stdout || pingResult.error
  };
  console.log(pingResult.success ? '✅ Conectividad OK' : '❌ Error de conectividad');
  console.log('');

  // 2. Verificar si el servicio Flask está corriendo
  console.log('2️⃣  VERIFICANDO SERVICIO FLASK');
  console.log('-'.repeat(50));
  const flaskService = await executeVPSCommand('systemctl status radio-recorder');
  results.checks.flask_service = {
    success: flaskService.success,
    is_active: flaskService.stdout.includes('active (running)'),
    details: flaskService.stdout || flaskService.error
  };
  console.log(flaskService.stdout.includes('active (running)') ? '✅ Servicio Flask activo' : '❌ Servicio Flask inactivo');
  if (flaskService.stdout) console.log(flaskService.stdout.substring(0, 300) + '...');
  console.log('');

  // 3. Verificar puerto 5000
  console.log('3️⃣  VERIFICANDO PUERTO 5000');
  console.log('-'.repeat(50));
  const portCheck = await executeVPSCommand('netstat -tuln | grep :5000');
  results.checks.port_5000 = {
    success: portCheck.success && portCheck.stdout.includes(':5000'),
    details: portCheck.stdout || portCheck.error
  };
  console.log(portCheck.success && portCheck.stdout.includes(':5000') ? '✅ Puerto 5000 escuchando' : '❌ Puerto 5000 no escuchando');
  console.log('');

  // 4. Verificar proceso FFmpeg
  console.log('4️⃣  VERIFICANDO PROCESO FFMPEG');
  console.log('-'.repeat(50));
  const ffmpegProcess = await executeVPSCommand('ps aux | grep -v grep | grep ffmpeg');
  results.checks.ffmpeg_process = {
    success: ffmpegProcess.success && ffmpegProcess.stdout.includes('ffmpeg'),
    details: ffmpegProcess.stdout || 'No se encontró proceso FFmpeg'
  };
  console.log(ffmpegProcess.success && ffmpegProcess.stdout.includes('ffmpeg') ? '✅ FFmpeg está corriendo' : '❌ FFmpeg NO está corriendo');
  if (ffmpegProcess.stdout) console.log(ffmpegProcess.stdout);
  console.log('');

  // 5. Verificar instalación de FFmpeg
  console.log('5️⃣  VERIFICANDO INSTALACIÓN DE FFMPEG');
  console.log('-'.repeat(50));
  const ffmpegVersion = await executeVPSCommand('which ffmpeg && ffmpeg -version');
  results.checks.ffmpeg_installation = {
    success: ffmpegVersion.success,
    path: ffmpegVersion.stdout.split('\n')[0] || '',
    version: ffmpegVersion.stdout.split('\n')[1] || '',
    details: ffmpegVersion.stdout || ffmpegVersion.error
  };
  console.log(ffmpegVersion.success ? '✅ FFmpeg instalado' : '❌ FFmpeg no instalado');
  if (ffmpegVersion.stdout) console.log(ffmpegVersion.stdout.substring(0, 200) + '...');
  console.log('');

  // 6. Verificar script de grabación
  console.log('6️⃣  VERIFICANDO SCRIPT DE GRABACIÓN');
  console.log('-'.repeat(50));
  const scriptContent = await executeVPSCommand('cat /home/radioapp/radio-recorder/scripts/record_radio.sh');
  results.checks.recording_script = {
    success: scriptContent.success,
    has_shebang: scriptContent.stdout.startsWith('#!/bin/bash'),
    line_count: scriptContent.stdout.split('\n').length,
    content_preview: scriptContent.stdout.substring(0, 500),
    full_content: scriptContent.stdout,
    details: scriptContent.stdout || scriptContent.error
  };
  console.log(scriptContent.success ? '✅ Script de grabación accesible' : '❌ Script de grabación no accesible');
  console.log(`Shebang correcto: ${scriptContent.stdout.startsWith('#!/bin/bash') ? '✅' : '❌'}`);
  console.log(`Líneas: ${scriptContent.stdout.split('\n').length}`);
  console.log('');

  // 7. Verificar permisos del script
  console.log('7️⃣  VERIFICANDO PERMISOS DEL SCRIPT');
  console.log('-'.repeat(50));
  const scriptPermissions = await executeVPSCommand('ls -la /home/radioapp/radio-recorder/scripts/record_radio.sh');
  results.checks.script_permissions = {
    success: scriptPermissions.success,
    permissions: scriptPermissions.stdout.split(' ')[0] || '',
    owner: scriptPermissions.stdout.split(' ')[2] || '',
    group: scriptPermissions.stdout.split(' ')[3] || '',
    details: scriptPermissions.stdout || scriptPermissions.error
  };
  console.log(scriptPermissions.success ? '✅ Permisos verificados' : '❌ Error al verificar permisos');
  if (scriptPermissions.stdout) console.log(scriptPermissions.stdout);
  console.log('');

  // 8. Verificar directorio de grabaciones
  console.log('8️⃣  VERIFICANDO DIRECTORIO DE GRABACIONES');
  console.log('-'.repeat(50));
  const recordingsDir = await executeVPSCommand('ls -la /home/radioapp/radio-recorder/recordings/');
  results.checks.recordings_directory = {
    success: recordingsDir.success,
    exists: recordingsDir.success,
    content: recordingsDir.stdout || recordingsDir.error,
    details: recordingsDir.stdout || recordingsDir.error
  };
  console.log(recordingsDir.success ? '✅ Directorio de grabaciones accesible' : '❌ Directorio no accesible');
  if (recordingsDir.stdout) console.log(recordingsDir.stdout.substring(0, 300) + '...');
  console.log('');

  // 9. Verificar archivos MP3 recientes
  console.log('9️⃣  VERIFICANDO ARCHIVOS MP3 RECIENTES');
  console.log('-'.repeat(50));
  const recentFiles = await executeVPSCommand('find /home/radioapp/radio-recorder/recordings/ -name "*.mp3" -mmin -60 -ls');
  results.checks.recent_mp3_files = {
    success: recentFiles.success,
    file_count: recentFiles.stdout.split('\n').filter(line => line.trim()).length,
    files: recentFiles.stdout.split('\n').filter(line => line.trim()),
    details: recentFiles.stdout || 'No se encontraron archivos MP3 recientes'
  };
  console.log(recentFiles.success && recentFiles.stdout.trim() ? '✅ Archivos MP3 encontrados' : '❌ No hay archivos MP3 recientes');
  if (recentFiles.stdout) console.log(recentFiles.stdout);
  console.log('');

  // 10. Verificar espacio en disco
  console.log('🔟 VERIFICANDO ESPACIO EN DISCO');
  console.log('-'.repeat(50));
  const diskSpace = await executeVPSCommand('df -h /home/radioapp/radio-recorder/');
  results.checks.disk_space = {
    success: diskSpace.success,
    details: diskSpace.stdout || diskSpace.error
  };
  console.log(diskSpace.success ? '✅ Espacio en disco verificado' : '❌ Error al verificar espacio');
  if (diskSpace.stdout) console.log(diskSpace.stdout);
  console.log('');

  // 11. Verificar logs de grabación
  console.log('1️⃣1️⃣  VERIFICANDO LOGS DE GRABACIÓN');
  console.log('-'.repeat(50));
  const logsDir = await executeVPSCommand('ls -la /home/radioapp/radio-recorder/logs/');
  results.checks.logs_directory = {
    success: logsDir.success,
    content: logsDir.stdout || logsDir.error,
    details: logsDir.stdout || logsDir.error
  };
  console.log(logsDir.success ? '✅ Directorio de logs accesible' : '❌ Directorio de logs no accesible');
  if (logsDir.stdout) console.log(logsDir.stdout.substring(0, 300) + '...');
  console.log('');

  // 12. Verificar últimos logs de error
  console.log('1️⃣2️⃣  VERIFICANDO ÚLTIMOS LOGS DE ERROR');
  console.log('-'.repeat(50));
  const recentLogs = await executeVPSCommand('find /home/radioapp/radio-recorder/logs/ -name "*.log" -mmin -60 -exec tail -n 20 {} \\;');
  results.checks.recent_error_logs = {
    success: recentLogs.success,
    has_errors: recentLogs.stdout.toLowerCase().includes('error') || recentLogs.stdout.toLowerCase().includes('failed'),
    content: recentLogs.stdout || 'No hay logs recientes',
    details: recentLogs.stdout || recentLogs.error
  };
  console.log(recentLogs.success && recentLogs.stdout.trim() ? '✅ Logs encontrados' : '❌ No hay logs recientes');
  if (recentLogs.stdout) console.log(recentLogs.stdout.substring(0, 500) + '...');
  console.log('');

  // 13. Verificar logs del sistema (journalctl)
  console.log('1️⃣3️⃣  VERIFICANDO LOGS DEL SISTEMA');
  console.log('-'.repeat(50));
  const systemLogs = await executeVPSCommand('journalctl -u radio-recorder --no-pager -n 50');
  results.checks.system_logs = {
    success: systemLogs.success,
    has_errors: systemLogs.stdout.toLowerCase().includes('error') || systemLogs.stdout.toLowerCase().includes('failed'),
    content: systemLogs.stdout || systemLogs.error,
    details: systemLogs.stdout || systemLogs.error
  };
  console.log(systemLogs.success ? '✅ Logs del sistema obtenidos' : '❌ Error al obtener logs del sistema');
  if (systemLogs.stdout) {
    const errorLines = systemLogs.stdout.split('\n').filter(line => 
      line.toLowerCase().includes('error') || line.toLowerCase().includes('failed')
    );
    if (errorLines.length > 0) {
      console.log('🚨 ERRORES ENCONTRADOS:');
      errorLines.forEach(line => console.log(line));
    }
  }
  console.log('');

  // 14. Probar conectividad del stream
  console.log('1️⃣4️⃣  PROBANDO CONECTIVIDAD DEL STREAM');
  console.log('-'.repeat(50));
  const streamTest = await executeVPSCommand('timeout 10 ffmpeg -i "https://radio.digitalfm.cl:8000/arica" -t 1 -f null -');
  results.checks.stream_connectivity = {
    success: streamTest.success || streamTest.stderr.includes('Stream mapping:'),
    details: streamTest.stderr || streamTest.error
  };
  console.log(streamTest.success || streamTest.stderr.includes('Stream mapping:') ? '✅ Stream accesible' : '❌ Stream no accesible');
  if (streamTest.stderr) console.log(streamTest.stderr.substring(0, 300) + '...');
  console.log('');

  // 15. Verificar variables de entorno del servicio
  console.log('1️⃣5️⃣  VERIFICANDO VARIABLES DE ENTORNO');
  console.log('-'.repeat(50));
  const envVars = await executeVPSCommand('cat /etc/systemd/system/radio-recorder.service | grep -E "Environment|ExecStart"');
  results.checks.service_environment = {
    success: envVars.success,
    details: envVars.stdout || envVars.error
  };
  console.log(envVars.success ? '✅ Variables de entorno verificadas' : '❌ Error al verificar variables');
  if (envVars.stdout) console.log(envVars.stdout);
  console.log('');

  // 16. Verificar Python y dependencias
  console.log('1️⃣6️⃣  VERIFICANDO PYTHON Y DEPENDENCIAS');
  console.log('-'.repeat(50));
  const pythonCheck = await executeVPSCommand('python3 --version && pip3 list | grep -E "flask|requests|subprocess"');
  results.checks.python_environment = {
    success: pythonCheck.success,
    details: pythonCheck.stdout || pythonCheck.error
  };
  console.log(pythonCheck.success ? '✅ Python y dependencias verificadas' : '❌ Error al verificar Python');
  if (pythonCheck.stdout) console.log(pythonCheck.stdout.substring(0, 200) + '...');
  console.log('');

  // 17. Verificar si hay procesos zombie
  console.log('1️⃣7️⃣  VERIFICANDO PROCESOS ZOMBIE');
  console.log('-'.repeat(50));
  const zombieProcesses = await executeVPSCommand('ps aux | grep -E "Z|defunct" | grep -v grep');
  results.checks.zombie_processes = {
    success: zombieProcesses.success,
    has_zombies: zombieProcesses.stdout.trim().length > 0,
    details: zombieProcesses.stdout || 'No se encontraron procesos zombie'
  };
  console.log(zombieProcesses.success && !zombieProcesses.stdout.trim() ? '✅ No hay procesos zombie' : '⚠️  Procesos zombie encontrados');
  if (zombieProcesses.stdout) console.log(zombieProcesses.stdout);
  console.log('');

  // 18. Verificar límites del sistema
  console.log('1️⃣8️⃣  VERIFICANDO LÍMITES DEL SISTEMA');
  console.log('-'.repeat(50));
  const systemLimits = await executeVPSCommand('ulimit -a');
  results.checks.system_limits = {
    success: systemLimits.success,
    details: systemLimits.stdout || systemLimits.error
  };
  console.log(systemLimits.success ? '✅ Límites del sistema verificados' : '❌ Error al verificar límites');
  if (systemLimits.stdout) console.log(systemLimits.stdout.substring(0, 300) + '...');
  console.log('');

  // 19. Verificar archivo de bloqueo
  console.log('1️⃣9️⃣  VERIFICANDO ARCHIVOS DE BLOQUEO');
  console.log('-'.repeat(50));
  const lockFiles = await executeVPSCommand('find /home/radioapp/radio-recorder/ -name "*.lock" -o -name "*.pid"');
  results.checks.lock_files = {
    success: lockFiles.success,
    has_locks: lockFiles.stdout.trim().length > 0,
    files: lockFiles.stdout.split('\n').filter(line => line.trim()),
    details: lockFiles.stdout || 'No se encontraron archivos de bloqueo'
  };
  console.log(lockFiles.success && !lockFiles.stdout.trim() ? '✅ No hay archivos de bloqueo' : '⚠️  Archivos de bloqueo encontrados');
  if (lockFiles.stdout) console.log(lockFiles.stdout);
  console.log('');

  // 20. Resumen final
  console.log('📊 RESUMEN FINAL DEL DIAGNÓSTICO');
  console.log('='.repeat(80));
  
  const allChecks = Object.values(results.checks);
  const passedChecks = allChecks.filter(check => check.success).length;
  const totalChecks = allChecks.length;
  
  console.log(`✅ Checks exitosos: ${passedChecks}/${totalChecks}`);
  console.log('');
  
  // Identificar problemas críticos
  const criticalIssues = [];
  
  if (!results.checks.ffmpeg_process.success) {
    criticalIssues.push('❌ CRÍTICO: FFmpeg no está corriendo');
  }
  if (!results.checks.recent_mp3_files.success || results.checks.recent_mp3_files.file_count === 0) {
    criticalIssues.push('❌ CRÍTICO: No se están creando archivos MP3');
  }
  if (results.checks.system_logs.has_errors) {
    criticalIssues.push('❌ CRÍTICO: Errores en logs del sistema');
  }
  if (results.checks.recent_error_logs.has_errors) {
    criticalIssues.push('❌ CRÍTICO: Errores en logs de grabación');
  }
  if (!results.checks.stream_connectivity.success) {
    criticalIssues.push('❌ CRÍTICO: Stream no es accesible');
  }
  if (results.checks.lock_files.has_locks) {
    criticalIssues.push('⚠️  Archivos de bloqueo presentes');
  }
  if (results.checks.zombie_processes.has_zombies) {
    criticalIssues.push('⚠️  Procesos zombie presentes');
  }
  
  if (criticalIssues.length > 0) {
    console.log('🚨 PROBLEMAS CRÍTICOS ENCONTRADOS:');
    criticalIssues.forEach(issue => console.log(issue));
  } else {
    console.log('✅ No se encontraron problemas críticos');
  }
  
  console.log('');
  console.log('📄 Guardando reporte completo en diagnose-vps-recording-system-report.json');
  
  // Guardar reporte completo
  const fs = require('fs');
  fs.writeFileSync('diagnose-vps-recording-system-report.json', JSON.stringify(results, null, 2));
  
  console.log('');
  console.log('🔍 DIAGNÓSTICO COMPLETADO');
  console.log('='.repeat(80));
}

// Ejecutar diagnóstico
diagnoseRecordingSystem().catch(console.error);
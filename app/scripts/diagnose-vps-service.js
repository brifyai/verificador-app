#!/usr/bin/env node

/**
 * Script para diagnosticar el problema del servicio de grabación
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
    console.log(`✅ ${description} - COMPLETADO`);
    if (stdout.trim()) console.log(`📄 Resultado:\n${stdout.trim()}`);
    return stdout;
  } catch (error) {
    console.log(`❌ ${description} - ERROR: ${error.message}`);
    return null;
  }
}

async function diagnoseService() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 DIAGNÓSTICO PROFUNDO DEL SERVICIO DE GRABACIÓN');
  console.log('═══════════════════════════════════════════════════════════════');

  // 1. Verificar estado detallado del servicio
  console.log('\n📋 ESTADO DETALLADO DEL SERVICIO:');
  await sshCommand('systemctl status radio-recorder --no-pager -l', 'Estado completo del servicio');
  
  // 2. Verificar logs de systemd
  console.log('\n📋 LOGS DE SYSTEMD:');
  await sshCommand('journalctl -u radio-recorder --no-pager -n 100', 'Logs del servicio');
  
  // 3. Verificar si el proceso está escuchando
  console.log('\n📋 PROCESOS PYTHON:');
  await sshCommand('ps aux | grep python3 | grep -v grep', 'Procesos Python activos');
  
  // 4. Verificar puerto 5000
  console.log('\n📋 PUERTO 5000:');
  await sshCommand('ss -tlnp | grep :5000', 'Verificar puerto 5000');
  
  // 5. Intentar iniciar el servicio manualmente y ver errores
  console.log('\n📋 INICIO MANUAL DEL SERVICIO:');
  await sshCommand('cd /home/radioapp/radio-recorder && /home/radioapp/radio-recorder/venv/bin/python3 scripts/api_server.py 2>&1 & sleep 3 && echo "Servicio iniciado" && ps aux | grep api_server', 'Iniciar servicio manualmente');
  
  // 6. Verificar si hay errores de importación
  console.log('\n📋 VERIFICAR IMPORTACIONES:');
  await sshCommand('cd /home/radioapp/radio-recorder && /home/radioapp/radio-recorder/venv/bin/python3 -c "import sys; print(sys.path)"', 'Python path');
  
  // 7. Verificar archivos del proyecto
  console.log('\n📋 ARCHIVOS DEL PROYECTO:');
  await sshCommand('ls -la /home/radioapp/radio-recorder/scripts/', 'Archivos en scripts/');

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ DIAGNÓSTICO COMPLETADO');
  console.log('═══════════════════════════════════════════════════════════════');
}

diagnoseService().catch(error => {
  console.error('❌ Error en el diagnóstico:', error);
  process.exit(1);
});

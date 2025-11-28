#!/usr/bin/env node

/**
 * Script para verificar logs de error detallados en el VPS
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

async function checkErrorLogs() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 VERIFICANDO LOGS DE ERROR DETALLADOS');
  console.log('═══════════════════════════════════════════════════════════════');

  // 1. Verificar logs del servicio systemd
  console.log('\n📋 LOGS DEL SERVICIO SYSTEMD:');
  await sshCommand('journalctl -u radio-recorder --no-pager -n 50', 'Últimas 50 líneas del servicio');
  
  // 2. Verificar logs de la aplicación
  console.log('\n📋 LOGS DE LA APLICACIÓN:');
  await sshCommand('tail -100 /home/radioapp/radio-recorder/server.log', 'Últimas 100 líneas del log');
  
  // 3. Verificar si hay errores de Python
  console.log('\n📋 ERRORES DE PYTHON:');
  await sshCommand('grep -i "error\\|exception\\|traceback" /home/radioapp/radio-recorder/server.log | tail -20', 'Errores en el log');
  
  // 4. Verificar estado del servicio en tiempo real
  console.log('\n📋 ESTADO ACTUAL DEL SERVICIO:');
  await sshCommand('systemctl status radio-recorder', 'Estado completo del servicio');
  
  // 5. Verificar si el script de API tiene errores de importación
  console.log('\n📋 VERIFICANDO SCRIPT DE API:');
  await sshCommand('cd /home/radioapp/radio-recorder && /home/radioapp/radio-recorder/venv/bin/python3 -c "import scripts.api_server; print(\'Importación exitosa\')"', 'Verificar importación del script');

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ VERIFICACIÓN COMPLETADA');
  console.log('═══════════════════════════════════════════════════════════════');
}

checkErrorLogs().catch(error => {
  console.error('❌ Error en la verificación:', error);
  process.exit(1);
});

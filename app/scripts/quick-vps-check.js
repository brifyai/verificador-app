#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const SSH_CONFIG = {
  host: '213.199.39.147',
  username: 'root',
  password: 'Aintelligence2025'
};

async function sshCommand(command) {
  const sshCmd = `sshpass -p '${SSH_CONFIG.password}' ssh -o StrictHostKeyChecking=no ${SSH_CONFIG.username}@${SSH_CONFIG.host} "${command}"`;
  try {
    const { stdout } = await execAsync(sshCmd);
    return stdout;
  } catch (error) {
    return `ERROR: ${error.message}`;
  }
}

async function quickCheck() {
  console.log('🔍 DIAGNÓSTICO RÁPIDO VPS - SISTEMA DE GRABACIÓN\n');
  
  console.log('1️⃣ Verificando directorio de grabaciones...');
  const dirCheck = await sshCommand('ls -la /home/radioapp/radio-recorder/recordings/ 2>&1 | head -20');
  console.log(dirCheck);
  
  console.log('\n2️⃣ Verificando espacio en disco...');
  const diskSpace = await sshCommand('df -h /home/radioapp/ 2>&1');
  console.log(diskSpace);
  
  console.log('\n3️⃣ Verificando procesos de grabación...');
  const processes = await sshCommand('ps aux | grep -E "(ffmpeg|python|flask)" | grep -v grep');
  console.log(processes || 'No hay procesos de grabación activos');
  
  console.log('\n4️⃣ Verificando puerto 5000...');
  const portCheck = await sshCommand('netstat -tlnp 2>&1 | grep :5000 || ss -tlnp 2>&1 | grep :5000');
  console.log(portCheck || 'Puerto 5000 no está en uso');
  
  console.log('\n5️⃣ Verificando últimas grabaciones...');
  const lastFiles = await sshCommand('ls -lt /home/radioapp/radio-recorder/recordings/*.mp3 2>&1 | head -5');
  console.log(lastFiles || 'No se encontraron archivos MP3');
  
  console.log('\n6️⃣ Verificando logs de error...');
  const logs = await sshCommand('find /home/radioapp/radio-recorder/ -name "*.log" -type f -exec ls -la {} \\; 2>&1');
  console.log(logs || 'No se encontraron archivos de log');
  
  if (logs && logs.includes('.log')) {
    console.log('\n7️⃣ Últimas líneas de log...');
    const lastLog = await sshCommand('tail -20 /home/radioapp/radio-recorder/scripts/*.log 2>&1');
    console.log(lastLog);
  }
  
  console.log('\n✅ Diagnóstico completado');
}

quickCheck().catch(console.error);

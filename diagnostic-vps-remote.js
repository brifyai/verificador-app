#!/usr/bin/env node

/**
 * Script de diagnóstico remoto para VPS
 * Se conecta via SSH y verifica el estado del sistema de grabaciones
 */

const { exec } = require('child_process');
const fs = require('fs');

console.log('🔍 INICIANDO DIAGNÓSTICO REMOTO DEL VPS');
console.log('=====================================\n');

// Configuración de conexión SSH
const SSH_HOST = '213.199.39.147';
const SSH_USER = 'root';
const SSH_PASS = 'Aintelligence2025';

// Comandos a ejecutar en el VPS remoto
const commands = [
  {
    name: 'Verificar conectividad SSH',
    cmd: `sshpass -p '${SSH_PASS}' ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SSH_HOST} "echo 'Conexión SSH exitosa'"`
  },
  {
    name: 'Verificar ffmpeg instalado en VPS',
    cmd: `sshpass -p '${SSH_PASS}' ssh ${SSH_USER}@${SSH_HOST} "which ffmpeg"`
  },
  {
    name: 'Verificar versión de ffmpeg en VPS',
    cmd: `sshpass -p '${SSH_PASS}' ssh ${SSH_USER}@${SSH_HOST} "ffmpeg -version | head -1"`
  },
  {
    name: 'Listar directorio de grabaciones en VPS',
    cmd: `sshpass -p '${SSH_PASS}' ssh ${SSH_USER}@${SSH_HOST} "ls -la /home/radioapp/radio-recorder/recordings/ 2>&1"`
  },
  {
    name: 'Contar archivos MP3 en VPS',
    cmd: `sshpass -p '${SSH_PASS}' ssh ${SSH_USER}@${SSH_HOST} "find /home/radioapp/radio-recorder/recordings/ -name '*.mp3' | wc -l"`
  },
  {
    name: 'Verificar archivos MP3 recientes (últimos 30 min)',
    cmd: `sshpass -p '${SSH_PASS}' ssh ${SSH_USER}@${SSH_HOST} "find /home/radioapp/radio-recorder/recordings/ -name '*.mp3' -mmin -30 2>&1"`
  },
  {
    name: 'Verificar espacio en disco del VPS',
    cmd: `sshpass -p '${SSH_PASS}' ssh ${SSH_USER}@${SSH_HOST} "df -h /home"`
  },
  {
    name: 'Verificar si el proceso de grabación está activo',
    cmd: `sshpass -p '${SSH_PASS}' ssh ${SSH_USER}@${SSH_HOST} "ps aux | grep -E '(ffmpeg|record_radio)' | grep -v grep"`
  },
  {
    name: 'Verificar puerto 5000 (API Flask)',
    cmd: `sshpass -p '${SSH_PASS}' ssh ${SSH_USER}@${SSH_HOST} "netstat -tuln | grep :5000 || ss -tuln | grep :5000"`
  },
  {
    name: 'Verificar servicio radio-recorder',
    cmd: `sshpass -p '${SSH_PASS}' ssh ${SSH_USER}@${SSH_HOST} "systemctl status radio-recorder --no-pager"`
  },
  {
    name: 'Verificar logs del servicio',
    cmd: `sshpass -p '${SSH_PASS}' ssh ${SSH_USER}@${SSH_HOST} "journalctl -u radio-recorder -n 50 --no-pager"`
  },
  {
    name: 'Verificar script de grabación',
    cmd: `sshpass -p '${SSH_PASS}' ssh ${SSH_USER}@${SSH_HOST} "ls -la /home/radioapp/radio-recorder/scripts/record_radio.sh"`
  },
  {
    name: 'Verificar permisos del script',
    cmd: `sshpass -p '${SSH_PASS}' ssh ${SSH_USER}@${SSH_HOST} "stat -c '%a %U:%G' /home/radioapp/radio-recorder/scripts/record_radio.sh"`
  },
  {
    name: 'Verificar contenido del script (primeras 20 líneas)',
    cmd: `sshpass -p '${SSH_PASS}' ssh ${SSH_USER}@${SSH_HOST} "head -20 /home/radioapp/radio-recorder/scripts/record_radio.sh"`
  },
  {
    name: 'Verificar variables de entorno',
    cmd: `sshpass -p '${SSH_PASS}' ssh ${SSH_USER}@${SSH_HOST} "cat /home/radioapp/radio-recorder/.env"`
  },
  {
    name: 'Verificar API Flask responde',
    cmd: `sshpass -p '${SSH_PASS}' ssh ${SSH_USER}@${SSH_HOST} "curl -s http://localhost:5000/api/active-recordings | head -5"`
  }
];

let currentCommand = 0;

function runNextCommand() {
  if (currentCommand >= commands.length) {
    console.log('\n✅ Diagnóstico remoto completado');
    process.exit(0);
    return;
  }

  const diagnostic = commands[currentCommand];
  console.log(`\n${currentCommand + 1}. ${diagnostic.name}:`);
  console.log(`   Comando: ${diagnostic.cmd.substring(0, 100)}...`);
  
  exec(diagnostic.cmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      if (stderr) {
        console.log(`   ⚠️  Stderr: ${stderr.trim().substring(0, 200)}`);
      }
    } else if (stderr && !stdout) {
      console.log(`   ⚠️  Stderr: ${stderr.trim().substring(0, 200)}`);
    } else {
      const output = stdout.trim();
      if (output) {
        console.log(`   ✅ Resultado:\n${output.split('\n').map(line => `      ${line}`).join('\n')}`);
      } else {
        console.log(`   ✅ Comando ejecutado (sin salida)`);
      }
    }
    
    currentCommand++;
    setTimeout(runNextCommand, 200);
  });
}

// Verificar si sshpass está instalado
exec('which sshpass', (error) => {
  if (error) {
    console.error('❌ sshpass no está instalado. Por favor instálalo primero:');
    console.error('   Ubuntu/Debian: sudo apt-get install sshpass');
    console.error('   macOS: brew install hudochenkov/sshpass/sshpass');
    process.exit(1);
  } else {
    console.log('🚀 Ejecutando diagnóstico remoto...');
    runNextCommand();
  }
});
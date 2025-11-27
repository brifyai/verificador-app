#!/usr/bin/env node

/**
 * Script de diagnóstico para VPS
 * Verifica el estado de ffmpeg, directorios y grabaciones
 */

const { exec } = require('child_process');

console.log('🔍 INICIANDO DIAGNÓSTICO DEL VPS');
console.log('=====================================\n');

// Comandos a ejecutar
const commands = [
  {
    name: 'Verificar ffmpeg instalado',
    cmd: 'which ffmpeg'
  },
  {
    name: 'Verificar versión de ffmpeg',
    cmd: 'ffmpeg -version | head -1'
  },
  {
    name: 'Listar directorio de grabaciones',
    cmd: 'ls -la /root/vps/recordings/ 2>&1'
  },
  {
    name: 'Verificar espacio en disco',
    cmd: 'df -h /root'
  },
  {
    name: 'Verificar si el proceso de grabación sigue activo',
    cmd: 'ps aux | grep ffmpeg | grep -v grep'
  },
  {
    name: 'Verificar logs del VPS',
    cmd: 'cat /root/vps/server.log 2>&1 || echo "No hay archivo de log"'
  }
];

let currentCommand = 0;

function runNextCommand() {
  if (currentCommand >= commands.length) {
    console.log('\n✅ Diagnóstico completado');
    process.exit(0);
    return;
  }

  const diagnostic = commands[currentCommand];
  console.log(`\n${currentCommand + 1}. ${diagnostic.name}:`);
  console.log(`   Comando: ${diagnostic.cmd}`);
  
  exec(diagnostic.cmd, (error, stdout, stderr) => {
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else if (stderr && !stdout) {
      console.log(`   ⚠️  Stderr: ${stderr.trim()}`);
    } else {
      console.log(`   ✅ Resultado:\n${stdout.trim().split('\n').map(line => `      ${line}`).join('\n')}`);
    }
    
    currentCommand++;
    setTimeout(runNextCommand, 100);
  });
}

console.log('🚀 Ejecutando diagnóstico...');
runNextCommand();
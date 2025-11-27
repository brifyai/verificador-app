#!/usr/bin/env node

/**
 * Script de actualización remota simplificado para VPS
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración
const VPS_IP = '213.199.39.147';
const VPS_PASSWORD = 'Aintelligence2025$';
const LOCAL_FILE = path.join(__dirname, 'app', 'vps', 'server.js');
const REMOTE_PATH = '/root/vps/server.js';

console.log('🚀 Iniciando actualización del VPS...');
console.log(`📁 Archivo local: ${LOCAL_FILE}`);

// Verificar archivo local
if (!fs.existsSync(LOCAL_FILE)) {
  console.error('❌ Error: No se encontró el archivo server.js local');
  process.exit(1);
}

// Comando SSH con contraseña usando sshpass
const command = `
  sshpass -p "${VPS_PASSWORD}" scp -o StrictHostKeyChecking=no ${LOCAL_FILE} root@${VPS_IP}:${REMOTE_PATH} &&
  sshpass -p "${VPS_PASSWORD}" ssh -o StrictHostKeyChecking=no root@${VPS_IP} "cd /root/vps && pm2 restart server"
`;

console.log('📤 Subiendo archivo y reiniciando servicio...');

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error durante la actualización:');
    console.error(error.message);
    process.exit(1);
  }
  
  if (stderr) {
    console.log('⚠️  Mensajes del servidor:', stderr);
  }
  
  console.log('✅ Salida:', stdout);
  console.log('🎉 ¡Actualización completada exitosamente!');
  console.log('✅ Los endpoints /api/recordings y /api/download ya están activos');
});
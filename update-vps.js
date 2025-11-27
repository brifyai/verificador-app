#!/usr/bin/env node

/**
 * Script de actualización remota para VPS
 * Sube el archivo server.js modificado y reinicia el servicio
 */

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuración del VPS
const VPS_CONFIG = {
  host: '213.199.39.147',
  port: 22,
  username: 'root',
  password: 'Aintelligence2025$' // Contraseña proporcionada
};

// Ruta del archivo local a subir
const LOCAL_FILE = path.join(__dirname, 'app', 'vps', 'server.js');
// Ruta del archivo remoto en el VPS
const REMOTE_FILE = '/root/vps/server.js';
// Comando para reiniciar el servicio
const RESTART_COMMAND = 'pm2 restart server';

// Crear interfaz para leer contraseña
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Función para obtener contraseña (de archivo o directa)
function getPassword() {
  // Si ya está en la configuración, usarla directamente
  if (VPS_CONFIG.password) {
    return Promise.resolve(VPS_CONFIG.password);
  }
  
  // Si no, solicitarla interactivamente
  return new Promise((resolve) => {
    rl.question('🔐 Contraseña del VPS: ', (password) => {
      resolve(password);
    });
  });
}

// Función para conectar al VPS y realizar la actualización
async function updateVPS() {
  console.log('🚀 Iniciando actualización del VPS...');
  console.log(`📁 Archivo local: ${LOCAL_FILE}`);
  console.log(`📁 Archivo remoto: ${REMOTE_FILE}`);
  
  // Verificar que el archivo local existe
  if (!fs.existsSync(LOCAL_FILE)) {
    console.error('❌ Error: No se encontró el archivo server.js local');
    process.exit(1);
  }
  
  // Leer el contenido del archivo
  const fileContent = fs.readFileSync(LOCAL_FILE, 'utf8');
  console.log(`📄 Tamaño del archivo: ${fileContent.length} bytes`);
  
  // Obtener contraseña
  const password = await getPassword();
  if (!VPS_CONFIG.password) {
    rl.close();
  }
  
  // Crear conexión SSH
  const conn = new Client();
  
  conn.on('ready', () => {
    console.log('✅ Conectado al VPS');
    
    // Subir archivo
    conn.sftp((err, sftp) => {
      if (err) {
        console.error('❌ Error iniciando SFTP:', err);
        conn.end();
        process.exit(1);
      }
      
      console.log('📤 Subiendo archivo...');
      
      // Crear stream de escritura remota
      const writeStream = sftp.createWriteStream(REMOTE_FILE);
      
      writeStream.on('close', () => {
        console.log('✅ Archivo subido correctamente');
        
        // Ejecutar comando de reinicio
        console.log('🔄 Reiniciando servicio...');
        
        conn.exec(RESTART_COMMAND, (err, stream) => {
          if (err) {
            console.error('❌ Error ejecutando comando:', err);
            conn.end();
            process.exit(1);
          }
          
          let output = '';
          stream.on('close', (code, signal) => {
            console.log(`✅ Servicio reiniciado (código: ${code})`);
            console.log('📋 Salida:', output);
            console.log('🎉 ¡Actualización completada exitosamente!');
            conn.end();
          });
          
          stream.on('data', (data) => {
            output += data.toString();
          });
          
          stream.stderr.on('data', (data) => {
            console.error('⚠️ Error:', data.toString());
          });
        });
      });
      
      writeStream.on('error', (err) => {
        console.error('❌ Error subiendo archivo:', err);
        conn.end();
        process.exit(1);
      });
      
      // Escribir contenido al archivo remoto
      writeStream.write(fileContent);
      writeStream.end();
    });
  });
  
  conn.on('error', (err) => {
    console.error('❌ Error de conexión:', err);
    process.exit(1);
  });
  
  // Conectar
  console.log('🔗 Conectando al VPS...');
  conn.connect({
    ...VPS_CONFIG,
    password: password
  });
}

// Ejecutar
console.log('🚀 Iniciando actualización automática del VPS...');
updateVPS().catch((err) => {
  console.error('❌ Error inesperado:', err);
  process.exit(1);
});
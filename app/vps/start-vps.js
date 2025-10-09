#!/usr/bin/env node

/**
 * Script de inicio para el servidor VPS con scheduler automático
 * 
 * Este script:
 * 1. Verifica dependencias requeridas
 * 2. Crea directorios necesarios
 * 3. Inicia el servidor principal con scheduler integrado
 * 4. Maneja logs y errores
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🚀 Iniciando Radio Monitoring VPS Server...');
console.log('=' .repeat(50));

// Verificar Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 14) {
  console.error('❌ Node.js 14+ es requerido. Versión actual:', nodeVersion);
  process.exit(1);
}

console.log('✅ Node.js version:', nodeVersion);

// Verificar dependencias críticas
const requiredDeps = ['express', 'cors', 'node-cron'];
const missingDeps = [];

requiredDeps.forEach(dep => {
  try {
    require.resolve(dep);
    console.log(`✅ Dependencia encontrada: ${dep}`);
  } catch (error) {
    missingDeps.push(dep);
    console.log(`❌ Dependencia faltante: ${dep}`);
  }
});

if (missingDeps.length > 0) {
  console.error('\n❌ Dependencias faltantes:', missingDeps.join(', '));
  console.log('\n📦 Para instalar las dependencias:');
  console.log(`npm install ${missingDeps.join(' ')}`);
  process.exit(1);
}

// Verificar FFmpeg
function checkFFmpeg() {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log('✅ FFmpeg encontrado');
        resolve(true);
      } else {
        console.log('⚠️  FFmpeg no encontrado - las grabaciones no funcionarán');
        console.log('   Instalar: https://ffmpeg.org/download.html');
        resolve(false);
      }
    });
    
    ffmpeg.on('error', () => {
      console.log('⚠️  FFmpeg no encontrado - las grabaciones no funcionarán');
      resolve(false);
    });
  });
}

// Crear directorios necesarios
function createDirectories() {
  const dirs = ['./config', './recordings', './logs'];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Directorio creado: ${dir}`);
    } else {
      console.log(`📁 Directorio existe: ${dir}`);
    }
  });
}

// Configurar logging
function setupLogging() {
  const logDir = './logs';
  const logFile = path.join(logDir, `vps-${new Date().toISOString().split('T')[0]}.log`);
  
  // Redirigir console.log a archivo también
  const originalLog = console.log;
  const originalError = console.error;
  
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  
  console.log = (...args) => {
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] ${args.join(' ')}\n`;
    
    originalLog(...args);
    logStream.write(message);
  };
  
  console.error = (...args) => {
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] ERROR: ${args.join(' ')}\n`;
    
    originalError(...args);
    logStream.write(message);
  };
  
  console.log(`📝 Logs guardándose en: ${logFile}`);
  
  return logStream;
}

// Función principal
async function main() {
  try {
    // Verificar FFmpeg
    await checkFFmpeg();
    
    // Crear directorios
    createDirectories();
    
    // Configurar logging
    const logStream = setupLogging();
    
    console.log('\n🎯 Configuración completada');
    console.log('=' .repeat(50));
    
    // Iniciar servidor principal
    console.log('🚀 Iniciando servidor principal...\n');
    
    require('./main-server');
    
    // Manejo de señales
    process.on('SIGTERM', () => {
      console.log('\n🛑 Recibida señal SIGTERM');
      logStream.end();
      process.exit(0);
    });
    
    process.on('SIGINT', () => {
      console.log('\n🛑 Recibida señal SIGINT');
      logStream.end();
      process.exit(0);
    });
    
    process.on('uncaughtException', (error) => {
      console.error('❌ Error no capturado:', error);
      logStream.end();
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Promesa rechazada no manejada:', reason);
      logStream.end();
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

// Mostrar información del sistema
console.log('💻 Información del sistema:');
console.log(`   OS: ${process.platform} ${process.arch}`);
console.log(`   Node.js: ${process.version}`);
console.log(`   PID: ${process.pid}`);
console.log(`   Memoria: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);
console.log(`   Directorio: ${process.cwd()}`);
console.log('');

// Ejecutar
main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

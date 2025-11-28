#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Configuración SSH
const SSH_CONFIG = {
  host: '213.199.39.147',
  username: 'root',
  password: 'Aintelligence2025'
};

// Función para ejecutar comandos SSH
async function sshCommand(command, description) {
  const sshCommand = `sshpass -p '${SSH_CONFIG.password}' ssh -o StrictHostKeyChecking=no ${SSH_CONFIG.username}@${SSH_CONFIG.host} "${command}"`;
  
  try {
    console.log(`🔍 ${description}...`);
    const { stdout, stderr } = await execAsync(sshCommand);
    if (stderr && !stderr.includes('Warning: Permanently added')) {
      console.error(`⚠️  Error: ${stderr}`);
    }
    return stdout.trim();
  } catch (error) {
    console.error(`❌ Error ejecutando comando: ${error.message}`);
    return null;
  }
}

async function checkRecordingFile() {
  console.log('📡 VERIFICANDO ARCHIVO DE GRABACIÓN EN VPS\n');
  
  // 1. Verificar proceso FFmpeg
  console.log('1️⃣  PROCESO FFMPEG:');
  const ffmpegProcess = await sshCommand(
    'ps aux | grep ffmpeg | grep -v grep',
    'Buscando proceso FFmpeg'
  );
  
  if (ffmpegProcess) {
    console.log('✅ Proceso FFmpeg encontrado:');
    console.log(ffmpegProcess);
    
    // Extraer PID y archivo de salida
    const pidMatch = ffmpegProcess.match(/root\s+(\d+)/);
    const fileMatch = ffmpegProcess.match(/(\/home\/radioapp\/radio-recorder\/recordings\/[^ ]+\.mp3)/);
    
    if (pidMatch) {
      console.log(`   📌 PID: ${pidMatch[1]}`);
    }
    if (fileMatch) {
      console.log(`   📁 Archivo: ${fileMatch[1]}`);
    }
  } else {
    console.log('❌ No se encontró proceso FFmpeg activo');
  }
  
  console.log('\n2️⃣  ARCHIVOS MP3 RECIENTES:');
  const recentFiles = await sshCommand(
    'find /home/radioapp/radio-recorder/recordings/ -name "*.mp3" -mmin -10 -ls',
    'Buscando archivos MP3 creados en últimos 10 minutos'
  );
  
  if (recentFiles) {
    console.log('✅ Archivos MP3 recientes encontrados:');
    console.log(recentFiles);
  } else {
    console.log('ℹ️  No hay archivos MP3 creados en los últimos 10 minutos');
  }
  
  console.log('\n3️⃣  TODOS LOS ARCHIVOS MP3 (ordenados por fecha):');
  const allFiles = await sshCommand(
    'ls -laht /home/radioapp/radio-recorder/recordings/*.mp3 2>/dev/null | head -10',
    'Listando todos los archivos MP3'
  );
  
  if (allFiles) {
    console.log(allFiles);
  } else {
    console.log('❌ No se encontraron archivos MP3');
  }
  
  console.log('\n4️⃣  DETALLES DEL ARCHIVO ACTUAL (si existe):');
  if (ffmpegProcess) {
    const fileMatch = ffmpegProcess.match(/(\/home\/radioapp\/radio-recorder\/recordings\/[^ ]+\.mp3)/);
    if (fileMatch) {
      const fileDetails = await sshCommand(
        `ls -lah ${fileMatch[1]}`,
        'Verificando detalles del archivo actual'
      );
      
      if (fileDetails) {
        console.log(fileDetails);
        
        // Verificar tamaño
        const sizeMatch = fileDetails.match(/(\S+)\s+\S+\s+\S+\s+\S+\s+(\S+)/);
        if (sizeMatch) {
          console.log(`   💾 Tamaño actual: ${sizeMatch[2]}`);
        }
      }
    }
  }
  
  console.log('\n5️⃣  ESTADO DEL SERVICIO:');
  const serviceStatus = await sshCommand(
    'systemctl status radio-recorder',
    'Verificando estado del servicio'
  );
  console.log(serviceStatus);
  
  console.log('\n✅ Verificación completada');
}

// Ejecutar verificación
checkRecordingFile().catch(console.error);
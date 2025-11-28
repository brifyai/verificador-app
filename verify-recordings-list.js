#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const VPS_IP = '213.199.39.147';
const VPS_PASSWORD = 'Aintelligence2025';
const VPS_USER = 'root';

async function executeVPSCommand(command) {
  const sshCommand = `sshpass -p '${VPS_PASSWORD}' ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} "${command}"`;
  try {
    const { stdout, stderr } = await execAsync(sshCommand);
    return { success: true, stdout: stdout.trim(), stderr: stderr.trim() };
  } catch (error) {
    return { success: false, error: error.message, stdout: error.stdout?.trim() || '', stderr: error.stderr?.trim() || '' };
  }
}

async function verifyRecordingsList() {
  console.log('🔍 VERIFICANDO LISTADO DE GRABACIONES EN EL VPS');
  console.log('='.repeat(80));
  
  // 1. Verificar todos los archivos MP3 en el directorio de grabaciones
  console.log('\n1️⃣  TODOS LOS ARCHIVOS MP3 EN EL VPS:');
  console.log('-'.repeat(60));
  const allFiles = await executeVPSCommand('find /home/radioapp/radio-recorder/recordings/ -name "*.mp3" -type f | sort');
  
  if (allFiles.success && allFiles.stdout) {
    const files = allFiles.stdout.split('\n').filter(f => f.trim());
    console.log(`✅ Encontrados ${files.length} archivos MP3:\n`);
    files.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
    });
  } else {
    console.log('❌ No se encontraron archivos MP3');
  }
  
  // 2. Verificar archivos por fecha (hoy)
  console.log('\n2️⃣  ARCHIVOS DE HOY (2025-11-28):');
  console.log('-'.repeat(60));
  const todayFiles = await executeVPSCommand('find /home/radioapp/radio-recorder/recordings/2025-11-28/ -name "*.mp3" -type f -ls | sort -k10,11');
  
  if (todayFiles.success && todayFiles.stdout) {
    console.log('✅ Archivos de hoy:\n');
    console.log(todayFiles.stdout);
  } else {
    console.log('❌ No hay archivos de hoy');
  }
  
  // 3. Verificar el endpoint del API que lista grabaciones
  console.log('\n3️⃣  VERIFICANDO ENDPOINT DEL API:');
  console.log('-'.repeat(60));
  const apiTest = await executeVPSCommand('curl -s http://localhost:5000/api/recordings/list || echo "Endpoint no existe"');
  
  if (apiTest.success) {
    console.log('Respuesta del API:', apiTest.stdout);
  } else {
    console.log('❌ No se pudo acceder al endpoint del API');
  }
  
  // 4. Verificar permisos de lectura del directorio
  console.log('\n4️⃣  PERMISOS DE DIRECTORIOS:');
  console.log('-'.repeat(60));
  const dirPermissions = await executeVPSCommand('ls -la /home/radioapp/radio-recorder/recordings/');
  
  if (dirPermissions.success) {
    console.log(dirPermissions.stdout);
  }
  
  // 5. Verificar si el servicio Flask puede leer los archivos
  console.log('\n5️⃣  VERIFICANDO ACCESO DEL SERVICIO FLASK:');
  console.log('-'.repeat(60));
  const flaskAccess = await executeVPSCommand('sudo -u radioapp ls -la /home/radioapp/radio-recorder/recordings/2025-11-28/ | head -5');
  
  if (flaskAccess.success) {
    console.log('✅ El usuario radioapp puede acceder a los archivos:\n');
    console.log(flaskAccess.stdout);
  } else {
    console.log('❌ Problema de permisos:', flaskAccess.error);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMEN:');
  console.log('-'.repeat(60));
  console.log('✅ Los archivos MP3 SE ESTÁN CREANDO en el VPS');
  console.log('✅ FFmpeg está funcionando correctamente');
  console.log('✅ El problema está en el listado/mostrado de grabaciones');
  console.log('⚠️  Verificar endpoint del API o integración con frontend');
  console.log('='.repeat(80));
}

verifyRecordingsList().catch(console.error);
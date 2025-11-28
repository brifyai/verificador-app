#!/usr/bin/env node

/**
 * Monitorea en tiempo real qué sucede cuando se inicia una grabación
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
    console.log(`✅ ${description}`);
    if (stdout.trim()) console.log(`📄 ${stdout.trim()}`);
    return { success: true, output: stdout.trim() };
  } catch (error) {
    console.log(`❌ ${description}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function monitorRecordingStart() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 MONITOREO DE INICIO DE GRABACIÓN');
  console.log('═══════════════════════════════════════════════════════════════');

  console.log('\n📋 INSTRUCCIONES:');
  console.log('1. Ve a la interfaz web en http://localhost:3000');
  console.log('2. Navega a "Verificaciones"');
  console.log('3. Haz clic en "Grabar" para cualquier radio');
  console.log('4. Este script monitoreará lo que sucede en el VPS');
  console.log('5. Presiona Ctrl+C cuando hayas intentado grabar\n');

  // Monitorear logs en tiempo real
  console.log('📡 Monitoreando logs del servicio de grabación...');
  console.log('🔄 Actualización cada 2 segundos (durante 60 segundos)...\n');
  
  const startTime = Date.now();
  const duration = 60000; // 60 segundos
  
  while (Date.now() - startTime < duration) {
    const timestamp = new Date().toISOString();
    console.log(`\n⏰ ${timestamp} - Verificando estado...`);
    
    // 1. Verificar procesos FFmpeg
    await sshCommand('ps aux | grep ffmpeg | grep -v grep', 'Procesos FFmpeg activos');
    
    // 2. Ver archivos recientes (últimos 2 minutos)
    await sshCommand('find /home/radioapp/radio-recorder/recordings/ -name "*.mp3" -mmin -2 2>/dev/null', 'Archivos MP3 recientes (2 min)');
    
    // 3. Ver logs recientes del API
    await sshCommand('journalctl -u radio-recorder --no-pager -n 5 2>/dev/null | tail -5', 'Últimos logs del API');
    
    // 4. Verificar si hay errores en el sistema
    await sshCommand('dmesg | tail -3 2>/dev/null', 'Mensajes del kernel');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ MONITOREO COMPLETADO');
  console.log('═══════════════════════════════════════════════════════════════');
  
  console.log('\n📋 RESUMEN:');
  console.log('Si no viste procesos FFmpeg aparecer durante el monitoreo,');
  console.log('significa que la API no está ejecutando el script de grabación.');
  console.log('\n🔍 PRÓXIMO PASO: Verificar el código del API server');
  console.log('y el endpoint que maneja el inicio de grabaciones.');
}

monitorRecordingStart().catch(error => {
  console.error('❌ Error en monitoreo:', error);
  process.exit(1);
});

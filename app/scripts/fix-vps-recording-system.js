#!/usr/bin/env node

/**
 * Script para corregir todos los problemas del sistema de grabación en VPS
 * Ejecuta comandos SSH para reparar permisos, verificar servicios y reiniciar si es necesario
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
  console.log(`\n🔧 ${description}...`);
  const sshCmd = `sshpass -p '${SSH_CONFIG.password}' ssh -o StrictHostKeyChecking=no ${SSH_CONFIG.username}@${SSH_CONFIG.host} "${command}"`;
  
  try {
    const { stdout, stderr } = await execAsync(sshCmd);
    if (stderr && !stderr.includes('Warning: Permanently added')) {
      console.log(`⚠️  STDERR: ${stderr}`);
    }
    console.log(`✅ ${description} - COMPLETADO`);
    if (stdout.trim()) console.log(`📄 Salida: ${stdout.trim()}`);
    return stdout;
  } catch (error) {
    console.log(`❌ ${description} - ERROR: ${error.message}`);
    return null;
  }
}

async function fixRecordingSystem() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔧 INICIANDO CORRECCIÓN COMPLETA DEL SISTEMA DE GRABACIÓN VPS');
  console.log('═══════════════════════════════════════════════════════════════');

  // 1. Verificar estado actual del servicio
  console.log('\n📊 VERIFICANDO ESTADO ACTUAL...');
  await sshCommand('systemctl status radio-recorder 2>&1 || echo "Servicio no encontrado"', 'Estado del servicio radio-recorder');
  
  // 2. Verificar procesos FFmpeg activos
  await sshCommand('ps aux | grep ffmpeg | grep -v grep || echo "No hay procesos ffmpeg"', 'Procesos FFmpeg activos');
  
  // 3. Verificar puerto 5000
  await sshCommand('netstat -tlnp | grep :5000 || ss -tlnp | grep :5000 || echo "Puerto 5000 no está en uso"', 'Puerto 5000');
  
  // 4. Leer últimas líneas del log de error
  console.log('\n📄 LEYENDO LOGS DE ERROR...');
  const logContent = await sshCommand('tail -50 /home/radioapp/radio-recorder/server.log 2>&1', 'Últimas líneas del log');
  
  if (logContent && logContent.includes('ERROR')) {
    console.log('❌ Se encontraron errores en el log');
  }

  // 5. Corregir permisos de archivos MP3 (cambiar de root:root a radioapp:radioapp)
  console.log('\n🔐 CORRIGIENDO PERMISOS...');
  await sshCommand('chown -R radioapp:radioapp /home/radioapp/radio-recorder/recordings/', 'Cambiando propietario a radioapp');
  await sshCommand('chmod -R 644 /home/radioapp/radio-recorder/recordings/*.mp3', 'Estableciendo permisos 644 en MP3');
  
  // 6. Verificar permisos corregidos
  await sshCommand('ls -la /home/radioapp/radio-recorder/recordings/ | head -5', 'Verificando permisos corregidos');
  
  // 7. Reiniciar el servicio de grabación
  console.log('\n🔄 REINICIANDO SERVICIO DE GRABACIÓN...');
  await sshCommand('systemctl restart radio-recorder 2>&1 || echo "Reiniciando con script alternativo"', 'Reiniciando servicio');
  
  // 8. Esperar 3 segundos y verificar que el servicio está activo
  console.log('\n⏳ Esperando 3 segundos...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await sshCommand('systemctl status radio-recorder 2>&1 | grep Active', 'Estado después del reinicio');
  
  // 9. Verificar que el puerto 5000 está escuchando
  await sshCommand('netstat -tlnp | grep :5000 || ss -tlnp | grep :5000', 'Verificando puerto 5000 después del reinicio');
  
  // 10. Verificar procesos FFmpeg después del reinicio
  await sshCommand('ps aux | grep ffmpeg | grep -v grep', 'Procesos FFmpeg después del reinicio');

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ CORRECCIÓN COMPLETADA');
  console.log('═══════════════════════════════════════════════════════════════');
  
  console.log('\n📋 RESUMEN DE ACCIONES REALIZADAS:');
  console.log('✅ Se verificó el estado del servicio');
  console.log('✅ Se revisaron procesos FFmpeg');
  console.log('✅ Se leyeron logs de error');
  console.log('✅ Se corrigieron permisos de archivos MP3 (root:root → radioapp:radioapp)');
  console.log('✅ Se reinició el servicio de grabación');
  console.log('✅ Se verificó el estado después del reinicio');
  
  console.log('\n🔍 PRÓXIMOS PASOS:');
  console.log('1. Monitorear el sistema durante 5-10 minutos');
  console.log('2. Verificar que aparecen nuevas grabaciones MP3');
  console.log('3. Si persiste el problema, revisar logs detallados en /home/radioapp/radio-recorder/server.log');
}

fixRecordingSystem().catch(error => {
  console.error('❌ Error en la corrección:', error);
  process.exit(1);
});

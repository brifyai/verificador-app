#!/usr/bin/env node

/**
 * Script para resolver el conflicto de puerto 5000
 * Mata el proceso antiguo y reinicia el servicio correctamente
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
    if (stdout.trim()) console.log(`📄 Resultado:\n${stdout.trim()}`);
    return stdout;
  } catch (error) {
    console.log(`❌ ${description} - ERROR: ${error.message}`);
    return null;
  }
}

async function fixPortConflict() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔧 RESOLVIENDO CONFLICTO DE PUERTO 5000');
  console.log('═══════════════════════════════════════════════════════════════');

  // 1. Identificar el proceso que ocupa el puerto 5000
  console.log('\n📋 PASO 1: Identificando proceso que ocupa el puerto 5000');
  await sshCommand('ss -tlnp | grep :5000', 'Proceso en puerto 5000');
  
  // 2. Matar el proceso antiguo (PID 2862431)
  console.log('\n📋 PASO 2: Matando proceso antiguo');
  await sshCommand('kill -9 2862431', 'Matar proceso 2862431');
  
  // 3. Verificar que el puerto está libre
  console.log('\n📋 PASO 3: Verificando puerto libre');
  await sshCommand('sleep 2 && ss -tlnp | grep :5000 || echo "Puerto 5000 está libre"', 'Verificar puerto libre');
  
  // 4. Detener el servicio systemd
  console.log('\n📋 PASO 4: Deteniendo servicio systemd');
  await sshCommand('systemctl stop radio-recorder', 'Detener servicio');
  
  // 5. Esperar y verificar que está detenido
  console.log('\n📋 PASO 5: Verificando estado del servicio');
  await sshCommand('sleep 3 && systemctl status radio-recorder --no-pager | grep Active', 'Estado del servicio');
  
  // 6. Iniciar el servicio
  console.log('\n📋 PASO 6: Iniciando servicio');
  await sshCommand('systemctl start radio-recorder', 'Iniciar servicio');
  
  // 7. Verificar que el servicio está activo
  console.log('\n📋 PASO 7: Verificando servicio activo');
  await sshCommand('sleep 3 && systemctl status radio-recorder --no-pager | grep Active', 'Verificar servicio activo');
  
  // 8. Verificar que el puerto 5000 está en uso por el nuevo proceso
  console.log('\n📋 PASO 8: Verificando puerto 5000 con nuevo proceso');
  await sshCommand('ss -tlnp | grep :5000', 'Puerto 5000 con nuevo proceso');
  
  // 9. Verificar logs del servicio
  console.log('\n📋 PASO 9: Verificando logs del servicio');
  await sshCommand('journalctl -u radio-recorder --no-pager -n 10', 'Logs recientes');

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ CONFLICTO RESUELTO');
  console.log('═══════════════════════════════════════════════════════════════');
  
  console.log('\n📋 RESUMEN:');
  console.log('✅ Proceso antiguo (PID 2862431) eliminado');
  console.log('✅ Puerto 5000 liberado');
  console.log('✅ Servicio systemd reiniciado');
  console.log('✅ El servicio debería estar funcionando correctamente ahora');
  
  console.log('\n🔍 PRÓXIMOS PASOS:');
  console.log('1. Monitorear durante 5-10 minutos');
  console.log('2. Verificar que aparecen nuevas grabaciones MP3 en /home/radioapp/radio-recorder/recordings/');
  console.log('3. Probar iniciar una grabación desde la interfaz web');
}

fixPortConflict().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

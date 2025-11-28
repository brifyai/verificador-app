#!/usr/bin/env node

/**
 * Inspecciona el API server en el VPS para ver endpoints y código
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
    if (stdout.trim()) {
      console.log(`📄 Resultado:\n${stdout.trim()}`);
      return { success: true, output: stdout.trim() };
    }
    return { success: true, output: '' };
  } catch (error) {
    console.log(`❌ ${description}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function inspectApiServer() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 INSPECCIÓN DEL API SERVER EN VPS');
  console.log('═══════════════════════════════════════════════════════════════');

  // 1. Verificar dónde está el API server
  console.log('\n📍 1. Buscando el archivo api_server.py...');
  await sshCommand('find /home/radioapp -name "api_server.py" -type f 2>/dev/null', 'Buscando api_server.py');
  
  // 2. Ver el contenido del API server
  console.log('\n📍 2. Contenido del API server (primeras 100 líneas)...');
  await sshCommand('head -100 /home/radioapp/radio-recorder/api_server.py', 'Primeras 100 líneas del API');
  
  // 3. Buscar endpoints relacionados con grabación
  console.log('\n📍 3. Buscando endpoints de grabación...');
  await sshCommand('grep -n "@app.route" /home/radioapp/radio-recorder/api_server.py', 'Endpoints del API');
  
  // 4. Buscar función start-recording específicamente
  console.log('\n📍 4. Buscando función start-recording...');
  await sshCommand('grep -n -A 20 "start-recording\\|start_recording" /home/radioapp/radio-recorder/api_server.py', 'Función start-recording');
  
  // 5. Ver el script de grabación
  console.log('\n📍 5. Contenido del script record_radio.sh...');
  await sshCommand('cat /home/radioapp/radio-recorder/scripts/record_radio.sh', 'Script de grabación');
  
  // 6. Verificar permisos y existencia
  console.log('\n📍 6. Verificando permisos de archivos...');
  await sshCommand('ls -la /home/radioapp/radio-recorder/api_server.py', 'Permisos de api_server.py');
  await sshCommand('ls -la /home/radioapp/radio-recorder/scripts/record_radio.sh', 'Permisos de record_radio.sh');
  
  // 7. Probar manualmente el endpoint de inicio
  console.log('\n📍 7. Probando endpoint de inicio manualmente...');
  console.log('📝 Usa este curl para probar:');
  console.log('curl -X POST http://213.199.39.147:5000/api/start-recording \\\n  -H "Content-Type: application/json" \\\n  -d \'{"radio_id": "radio-1", "radio_url": "https://radio.digitalfm.cl:8000/arica", "duration": 30}\'');
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ INSPECCIÓN COMPLETADA');
  console.log('═══════════════════════════════════════════════════════════════');
}

inspectApiServer().catch(error => {
  console.error('❌ Error en inspección:', error);
  process.exit(1);
});

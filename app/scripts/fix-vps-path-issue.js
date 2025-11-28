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

async function fixPathIssue() {
  console.log('🔧 CORRIGIENDO PROBLEMA DE PATH EN VPS\n');
  
  // 1. Verificar rutas de comandos
  console.log('1️⃣  VERIFICANDO RUTAS DE COMANDOS:');
  const datePath = await sshCommand('which date', 'Ruta de date');
  const timeoutPath = await sshCommand('which timeout', 'Ruta de timeout');
  const catPath = await sshCommand('which cat', 'Ruta de cat');
  const ffmpegPath = await sshCommand('which ffmpeg', 'Ruta de ffmpeg');
  
  console.log(`   📍 date: ${datePath || 'NO ENCONTRADO'}`);
  console.log(`   📍 timeout: ${timeoutPath || 'NO ENCONTRADO'}`);
  console.log(`   📍 cat: ${catPath || 'NO ENCONTRADO'}`);
  console.log(`   📍 ffmpeg: ${ffmpegPath || 'NO ENCONTRADO'}`);
  
  // 2. Verificar PATH del servicio
  console.log('\n2️⃣  VERIFICANDO ENTORNO DEL SERVICIO:');
  const servicePath = await sshCommand(
    'systemctl show -p Environment radio-recorder',
    'Entorno del servicio'
  );
  console.log(`   📊 ${servicePath || 'No definido'}`);
  
  // 3. Corregir script de grabación
  console.log('\n3️⃣  CORRIGIENDO SCRIPT DE GRABACIÓN:');
  
  // Hacer backup del script original
  await sshCommand(
    'cp /home/radioapp/radio-recorder/scripts/record_radio.sh /home/radioapp/radio-recorder/scripts/record_radio.sh.backup',
    'Creando backup del script'
  );
  
  // Agregar PATH al inicio del script
  const pathFix = `sed -i '1i export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin' /home/radioapp/radio-recorder/scripts/record_radio.sh`;
  await sshCommand(pathFix, 'Agregando PATH al script');
  
  // Verificar la corrección
  const scriptHead = await sshCommand(
    'head -5 /home/radioapp/radio-recorder/scripts/record_radio.sh',
    'Verificando script corregido'
  );
  console.log('   ✅ Script corregido:');
  console.log(scriptHead.split('\n').map(line => `      ${line}`).join('\n'));
  
  // 4. Reiniciar servicio
  console.log('\n4️⃣  REINICIANDO SERVICIO:');
  await sshCommand('systemctl restart radio-recorder', 'Reiniciando servicio');
  await sshCommand('sleep 2', 'Esperando...');
  
  const status = await sshCommand(
    'systemctl status radio-recorder --no-pager',
    'Verificando estado'
  );
  console.log(status);
  
  console.log('\n✅ Corrección completada');
  console.log('\n📝 INSTRUCCIONES:');
  console.log('   1. Detén la grabación actual desde el frontend');
  console.log('   2. Inicia una nueva grabación');
  console.log('   3. Los archivos MP3 deberían generarse correctamente');
}

// Ejecutar corrección
fixPathIssue().catch(console.error);
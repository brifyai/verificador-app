#!/usr/bin/env node

/**
 * Diagnóstico completo del sistema de grabaciones
 * Verifica todos los componentes: VPS, servicio Flask, FFmpeg, directorios y permisos
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuración
const VPS_IP = '213.199.39.147';
const VPS_USER = 'radioapp';
const VPS_PASSWORD = 'Aintelligence2025';
const VPS_DIR = '/home/radioapp/radio-recorder';
const RECORDINGS_DIR = `${VPS_DIR}/recordings`;

async function sshCommand(command, description = '') {
  const fullCommand = `sshpass -p '${VPS_PASSWORD}' ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} '${command}'`;
  
  try {
    if (description) {
      console.log(`   Ejecutando: ${description}`);
    }
    const { stdout, stderr } = await execPromise(fullCommand);
    if (stderr && !stderr.includes('Warning')) {
      console.log(`   ⚠️  Stderr: ${stderr.trim()}`);
    }
    return stdout.trim();
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function checkVPSSystem() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DEL SISTEMA DE GRABACIONES');
  console.log('=' .repeat(60));
  
  // 1. Verificar conectividad con VPS
  console.log('\n1️⃣  VERIFICANDO CONECTIVIDAD CON VPS');
  const pingResult = await sshCommand('echo "Conexión exitosa"', 'Test de conexión');
  if (pingResult && pingResult.includes('Conexión exitosa')) {
    console.log('   ✅ VPS accesible');
  } else {
    console.log('   ❌ VPS no accesible');
    return false;
  }

  // 2. Verificar si el servicio Flask está corriendo
  console.log('\n2️⃣  VERIFICANDO SERVICIO FLASK');
  const flaskProcess = await sshCommand(`ps aux | grep -v grep | grep "python.*api_server.py"`, 'Buscando proceso Flask');
  if (flaskProcess) {
    console.log('   ✅ Servicio Flask está corriendo');
    console.log(`   📋 PID: ${flaskProcess.split(/\s+/)[1]}`);
  } else {
    console.log('   ❌ Servicio Flask NO está corriendo');
  }

  // 3. Verificar puerto 5000
  console.log('\n3️⃣  VERIFICANDO PUERTO 5000');
  const portCheck = await sshCommand('netstat -tuln | grep :5000', 'Verificando puerto 5000');
  if (portCheck) {
    console.log('   ✅ Puerto 5000 está escuchando');
  } else {
    console.log('   ❌ Puerto 5000 NO está escuchando');
  }

  // 4. Verificar directorio de grabaciones
  console.log('\n4️⃣  VERIFICANDO DIRECTORIO DE GRABACIONES');
  const dirExists = await sshCommand(`test -d ${RECORDINGS_DIR} && echo "EXISTS" || echo "NOT_FOUND"`, 'Verificando directorio');
  if (dirExists === 'EXISTS') {
    console.log('   ✅ Directorio de grabaciones existe');
    
    // Verificar permisos
    const permissions = await sshCommand(`ls -ld ${RECORDINGS_DIR}`, 'Verificando permisos');
    console.log(`   📋 Permisos: ${permissions}`);
    
    // Verificar espacio en disco
    const diskSpace = await sshCommand(`df -h ${RECORDINGS_DIR} | tail -1`, 'Espacio en disco');
    console.log(`   💾 Espacio: ${diskSpace}`);
  } else {
    console.log('   ❌ Directorio de grabaciones NO existe');
  }

  // 5. Verificar archivos de grabación existentes
  console.log('\n5️⃣  VERIFICANDO ARCHIVOS DE GRABACIÓN');
  const recordings = await sshCommand(`ls -lah ${RECORDINGS_DIR}/ | grep mp3`, 'Listando grabaciones MP3');
  if (recordings) {
    const recordingList = recordings.split('\n').filter(line => line.trim());
    console.log(`   ✅ Encontrados ${recordingList.length} archivos MP3`);
    console.log('   📋 Archivos:');
    recordingList.slice(0, 5).forEach((file, i) => {
      if (i < 5) console.log(`      ${file.split(/\s+/).slice(-1)[0]}`);
    });
    if (recordingList.length > 5) {
      console.log(`      ... y ${recordingList.length - 5} más`);
    }
  } else {
    console.log('   ❌ No se encontraron archivos MP3');
  }

  // 6. Verificar proceso FFmpeg
  console.log('\n6️⃣  VERIFICANDO PROCESO FFMPEG');
  const ffmpegProcess = await sshCommand('ps aux | grep -v grep | grep ffmpeg', 'Buscando procesos FFmpeg');
  if (ffmpegProcess) {
    console.log('   ✅ Proceso FFmpeg activo encontrado');
    const ffmpegLines = ffmpegProcess.split('\n').filter(line => line.trim());
    console.log(`   📋 ${ffmpegLines.length} proceso(s) activo(s)`);
  } else {
    console.log('   ℹ️  No hay procesos FFmpeg activos (esto es normal si no hay grabaciones en curso)');
  }

  // 7. Verificar instalación FFmpeg
  console.log('\n7️⃣  VERIFICANDO INSTALACIÓN FFMPEG');
  const ffmpegVersion = await sshCommand('ffmpeg -version | head -1', 'Verificando FFmpeg');
  if (ffmpegVersion) {
    console.log(`   ✅ FFmpeg instalado: ${ffmpegVersion}`);
  } else {
    console.log('   ❌ FFmpeg NO instalado');
  }

  // 8. Verificar archivo de logs
  console.log('\n8️⃣  VERIFICANDO LOGS DEL SERVICIO');
  const logFile = await sshCommand(`ls -lh ${VPS_DIR}/server.log 2>/dev/null`, 'Verificando archivo de log');
  if (logFile) {
    console.log(`   ✅ Archivo de log existe: ${logFile}`);
    
    // Mostrar últimas líneas del log
    const lastLogs = await sshCommand(`tail -20 ${VPS_DIR}/server.log`, 'Últimas líneas del log');
    if (lastLogs) {
      console.log('   📋 Últimas entradas del log:');
      lastLogs.split('\n').slice(-10).forEach(line => {
        if (line.trim()) console.log(`      ${line}`);
      });
    }
  } else {
    console.log('   ⚠️  Archivo de log no encontrado');
  }

  // 9. Probar endpoint de grabaciones
  console.log('\n9️⃣  PROBANDO ENDPOINT /api/recordings');
  const recordingsEndpoint = await sshCommand(`curl -s http://localhost:5000/api/recordings`, 'Test endpoint recordings');
  if (recordingsEndpoint) {
    try {
      const data = JSON.parse(recordingsEndpoint);
      if (data.status === 'success') {
        console.log(`   ✅ Endpoint funciona, encontradas ${data.count || 0} grabaciones`);
      } else {
        console.log(`   ❌ Endpoint responde con error: ${data.message}`);
      }
    } catch (e) {
      console.log('   ❌ Respuesta inválida del endpoint');
    }
  } else {
    console.log('   ❌ Endpoint no responde');
  }

  // 10. Probar endpoint de grabaciones activas
  console.log('\n🔟 PROBANDO ENDPOINT /api/active-recordings');
  const activeEndpoint = await sshCommand(`curl -s http://localhost:5000/api/active-recordings`, 'Test endpoint active recordings');
  if (activeEndpoint) {
    try {
      const data = JSON.parse(activeEndpoint);
      if (data.status === 'success') {
        const activeCount = Object.keys(data.active_recordings || {}).length;
        console.log(`   ✅ Endpoint funciona, ${activeCount} grabaciones activas`);
        
        if (activeCount > 0) {
          console.log('   📋 Grabaciones activas:');
          Object.entries(data.active_recordings).forEach(([id, rec]) => {
            console.log(`      ${id}: ${rec.radio_name}`);
          });
        }
      } else {
        console.log(`   ❌ Endpoint responde con error: ${data.message}`);
      }
    } catch (e) {
      console.log('   ❌ Respuesta inválida del endpoint');
    }
  } else {
    console.log('   ❌ Endpoint no responde');
  }

  // 11. Verificar permisos de escritura
  console.log('\n1️⃣1️⃣  VERIFICANDO PERMISOS DE ESCRITURA');
  const writeTest = await sshCommand(`touch ${RECORDINGS_DIR}/test_write_$(date +%s).tmp && echo "SUCCESS" || echo "FAILED"`, 'Test de escritura');
  if (writeTest === 'SUCCESS') {
    console.log('   ✅ Directorio es escribible');
    // Limpiar archivo de prueba
    await sshCommand(`rm -f ${RECORDINGS_DIR}/test_write_*.tmp`, 'Limpiando archivos de prueba');
  } else {
    console.log('   ❌ Directorio NO es escribible');
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 RESUMEN DEL DIAGNÓSTICO');
  console.log('='.repeat(60));
  
  console.log('\n🔍 Si el sistema muestra:');
  console.log('   ✅ Servicio Flask corriendo');
  console.log('   ✅ Puerto 5000 escuchando');
  console.log('   ✅ Directorio de grabaciones existe y es escribible');
  console.log('   ✅ FFmpeg instalado');
  console.log('   ✅ Endpoints responden correctamente');
  console.log('\n   Entonces el problema puede ser en el frontend o en la comunicación.');
  
  console.log('\n🔧 Si encuentras problemas en el VPS:');
  console.log('   1. Reinicia el servicio Flask:');
  console.log(`      cd ${VPS_DIR} && pkill -f api_server.py; nohup python api_server.py > server.log 2>&1 &`);
  console.log('   2. Verifica permisos:');
  console.log(`      chmod -R 755 ${RECORDINGS_DIR}`);
  console.log('   3. Verifica logs:');
  console.log(`      tail -f ${VPS_DIR}/server.log`);
  
  return true;
}

// Ejecutar diagnóstico
checkVPSSystem()
  .then(success => {
    if (success) {
      console.log('\n✅ Diagnóstico completado');
      process.exit(0);
    } else {
      console.log('\n❌ Diagnóstico fallido');
      process.exit(1);
    }
  })
  .catch(error => {
    console.log('\n💥 Error inesperado:', error.message);
    process.exit(1);
  });
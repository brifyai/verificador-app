#!/usr/bin/env node

// Script para investigar el servicio de grabación en el VPS
// Accede directamente al código fuente para encontrar el problema

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const VPS_IP = '213.199.39.147';
const VPS_PASSWORD = 'Aintelligence2025';
const SSH_COMMAND = `sshpass -p "${VPS_PASSWORD}" ssh -o StrictHostKeyChecking=no root@${VPS_IP}`;

async function executeRemoteCommand(command) {
  try {
    const fullCommand = `${SSH_COMMAND} "${command}"`;
    const { stdout, stderr } = await execPromise(fullCommand);
    return { success: true, stdout, stderr };
  } catch (error) {
    return { success: false, error: error.message, stdout: error.stdout, stderr: error.stderr };
  }
}

async function investigateRecordingService() {
  console.log('🔍 INVESTIGACIÓN PROFUNDA DEL SERVICIO DE GRABACIÓN\n');
  console.log('═'.repeat(60));

  // 1. Encontrar el proceso que escucha en el puerto 5000
  console.log('\n1️⃣  ENCONTRANDO PROCESO DEL PUERTO 5000...');
  const netstatResult = await executeRemoteCommand('ss -tlnp | grep :5000');
  
  if (netstatResult.success && netstatResult.stdout) {
    console.log('✅ Proceso encontrado:');
    console.log(netstatResult.stdout);
    
    // Extraer PID del proceso
    const pidMatch = netstatResult.stdout.match(/users:\(\("([^"]+)",pid=(\d+)/);
    if (pidMatch) {
      const processName = pidMatch[1];
      const pid = pidMatch[2];
      console.log(`\n📊 PID: ${pid}`);
      console.log(`📝 Nombre: ${processName}`);
      
      // 2. Encontrar la ruta del ejecutable
      console.log('\n2️⃣  RUTA DEL EJECUTABLE...');
      const whichResult = await executeRemoteCommand(`which ${processName}`);
      if (whichResult.success) {
        console.log(`✅ Ruta: ${whichResult.stdout.trim()}`);
      }
      
      // 3. Ver directorio de trabajo del proceso
      console.log('\n3️⃣  DIRECTORIO DE TRABAJO DEL PROCESO...');
      const cwdResult = await executeRemoteCommand(`pwdx ${pid}`);
      if (cwdResult.success) {
        console.log(`✅ Directorio: ${cwdResult.stdout.trim()}`);
        const cwd = cwdResult.stdout.split(':')[1].trim();
        
        // 4. Buscar archivos de código fuente
        console.log('\n4️⃣  BUSCANDO CÓDIGO FUENTE...');
        const findResult = await executeRemoteCommand(
          `cd ${cwd} && find . -name "*.py" -o -name "*.js" -o -name "*.ts" | head -20`
        );
        if (findResult.success) {
          console.log('📁 Archivos encontrados:');
          console.log(findResult.stdout);
        }
        
        // 5. Buscar archivos de log
        console.log('\n5️⃣  BUSCANDO ARCHIVOS DE LOG...');
        const logResult = await executeRemoteCommand(
          `cd ${cwd} && find . -name "*.log" -o -name "*log*"`
        );
        if (logResult.success && logResult.stdout.trim()) {
          console.log('📄 Logs encontrados:');
          console.log(logResult.stdout);
          
          // 6. Leer el log más reciente
          const logFiles = logResult.stdout.trim().split('\n');
          if (logFiles.length > 0) {
            console.log(`\n6️⃣  CONTENIDO DEL LOG: ${logFiles[0]}...`);
            const logContent = await executeRemoteCommand(`tail -50 ${cwd}/${logFiles[0]}`);
            if (logContent.success) {
              console.log(logContent.stdout);
            }
          }
        }
        
        // 7. Buscar el código de la API
        console.log('\n7️⃣  BUSCANDO CÓDIGO DE LA API...');
        const apiResult = await executeRemoteCommand(
          `cd ${cwd} && grep -r "start-recording" . --include="*.py" --include="*.js" --include="*.ts" -l`
        );
        if (apiResult.success && apiResult.stdout.trim()) {
          console.log('🔍 Archivos con endpoint start-recording:');
          console.log(apiResult.stdout);
          
          // 8. Leer el código del endpoint
          const apiFiles = apiResult.stdout.trim().split('\n');
          if (apiFiles.length > 0) {
            console.log(`\n8️⃣  CÓDIGO DEL ENDPOINT: ${apiFiles[0]}...`);
            const codeResult = await executeRemoteCommand(
              `cd ${cwd} && cat ${apiFiles[0]} | grep -A 50 "start-recording"`
            );
            if (codeResult.success) {
              console.log('```javascript');
              console.log(codeResult.stdout);
              console.log('```');
            }
          }
        }
        
        // 9. Verificar permisos del directorio de grabaciones
        console.log('\n9️⃣  PERMISOS DEL DIRECTORIO DE GRABACIONES...');
        const permsResult = await executeRemoteCommand(
          'ls -la /home/radioapp/radio-recorder/recordings/'
        );
        if (permsResult.success) {
          console.log('📂 Permisos:');
          console.log(permsResult.stdout);
        }
        
        // 10. Verificar espacio en disco
        console.log('\n🔟 ESPACIO EN DISCO...');
        const diskResult = await executeRemoteCommand('df -h /home/radioapp');
        if (diskResult.success) {
          console.log('💾 Espacio en disco:');
          console.log(diskResult.stdout);
        }
      }
    }
  } else {
    console.log('❌ No se pudo encontrar el proceso en el puerto 5000');
  }

  console.log('\n' + '═'.repeat(60));
  console.log('🔍 INVESTIGACIÓN COMPLETADA');
}

// Ejecutar investigación
investigateRecordingService().catch(console.error);
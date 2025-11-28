#!/usr/bin/env node

/**
 * Script para leer el código fuente del servicio de grabación en el VPS
 * y diagnosticar por qué no se están creando nuevas grabaciones
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Configuración de conexión SSH
const SSH_CONFIG = {
  host: '213.199.39.147',
  username: 'radioapp',
  password: 'Radioapp2024$'
};

// Función para ejecutar comandos SSH
async function sshCommand(command) {
  const sshCmd = `sshpass -p '${SSH_CONFIG.password}' ssh -o StrictHostKeyChecking=no ${SSH_CONFIG.username}@${SSH_CONFIG.host} "${command}"`;
  try {
    const { stdout, stderr } = await execAsync(sshCmd);
    if (stderr && !stderr.includes('Warning: Permanently added')) {
      console.error('⚠️  STDERR:', stderr);
    }
    return stdout;
  } catch (error) {
    console.error('❌ Error en comando SSH:', error.message);
    return null;
  }
}

async function readSourceCode() {
  console.log('📖 LEYENDO CÓDIGO FUENTE DEL SERVICIO DE GRABACIÓN\n');
  console.log('════════════════════════════════════════════════════════════\n');

  // 1. Leer api_server.py
  console.log('1️⃣  LEYENDO api_server.py...');
  const apiServerCode = await sshCommand('cd /home/radioapp/radio-recorder/scripts && cat api_server.py');
  
  if (apiServerCode) {
    console.log('✅ Código de api_server.py:');
    console.log('```python');
    // Mostrar solo las partes relevantes
    const lines = apiServerCode.split('\n');
    let inRecordingEndpoint = false;
    let indentLevel = 0;
    
    for (const line of lines) {
      if (line.includes('@app.route') && line.includes('start-recording')) {
        inRecordingEndpoint = true;
      }
      
      if (inRecordingEndpoint) {
        console.log(line);
        if (line.trim() && !line.trim().startsWith('#')) {
          if (line.includes('def ') && !line.includes('@app.route')) {
            indentLevel = line.search(/\S/);
          }
          if (line.trim().startsWith('return ') && line.search(/\S/) === indentLevel) {
            inRecordingEndpoint = false;
          }
        }
      }
    }
    console.log('```\n');
  } else {
    console.log('❌ No se pudo leer api_server.py\n');
  }

  // 2. Buscar el archivo manager
  console.log('2️⃣  BUSCANDO ARCHIVO manager...');
  const managerFiles = await sshCommand('cd /home/radioapp/radio-recorder/scripts && find . -name "*manager*" -type f');
  
  if (managerFiles) {
    console.log('📁 Archivos manager encontrados:');
    console.log(managerFiles);
    
    // Leer el archivo manager
    const managerFile = managerFiles.trim().split('\n')[0];
    if (managerFile) {
      console.log(`\n📖 Leyendo ${managerFile}...`);
      const managerCode = await sshCommand(`cd /home/radioapp/radio-recorder/scripts && cat ${managerFile}`);
      
      if (managerCode) {
        console.log('✅ Código del manager:');
        console.log('```python');
        
        // Buscar la función start_recording
        const lines = managerCode.split('\n');
        let inStartRecording = false;
        let braceCount = 0;
        
        for (const line of lines) {
          if (line.includes('def start_recording')) {
            inStartRecording = true;
            braceCount = 0;
          }
          
          if (inStartRecording) {
            console.log(line);
            
            // Contar llaves para saber cuándo termina la función
            braceCount += (line.match(/\(/g) || []).length;
            braceCount -= (line.match(/\)/g) || []).length;
            
            if (line.trim() && !line.trim().startsWith('#') && !line.trim().startsWith('"""') && braceCount === 0 && line.trim().startsWith('return ')) {
              inStartRecording = false;
            }
          }
        }
        console.log('```\n');
      }
    }
  } else {
    console.log('❌ No se encontraron archivos manager\n');
  }

  // 3. Buscar archivos de grabación
  console.log('3️⃣  BUSCANDO ARCHIVOS DE GRABACIÓN...');
  const recordingFiles = await sshCommand('cd /home/radioapp/radio-recorder/scripts && find . -name "*recording*" -type f');
  
  if (recordingFiles) {
    console.log('📁 Archivos de grabación encontrados:');
    console.log(recordingFiles);
    
    // Leer el archivo de grabación
    const recordingFile = recordingFiles.trim().split('\n')[0];
    if (recordingFile && recordingFile.includes('.py')) {
      console.log(`\n📖 Leyendo ${recordingFile}...`);
      const recordingCode = await sshCommand(`cd /home/radioapp/radio-recorder/scripts && cat ${recordingFile}`);
      
      if (recordingCode) {
        console.log('✅ Código de grabación:');
        console.log('```python');
        console.log(recordingCode.substring(0, 2000)); // Mostrar primeros 2000 caracteres
        console.log('```\n');
      }
    }
  } else {
    console.log('❌ No se encontraron archivos de grabación\n');
  }

  // 4. Verificar logs recientes
  console.log('4️⃣  VERIFICANDO LOGS RECIENTES...');
  const recentLogs = await sshCommand('cd /home/radioapp/radio-recorder/scripts && find . -name "*.log" -type f -exec ls -la {} \\;');
  
  if (recentLogs) {
    console.log('📁 Logs encontrados:');
    console.log(recentLogs);
    
    // Ver el log más reciente
    const logFiles = recentLogs.split('\n').filter(line => line.includes('.log'));
    if (logFiles.length > 0) {
      const logFile = logFiles[0].split(' ').pop();
      console.log(`\n📖 Leyendo ${logFile}...`);
      const logContent = await sshCommand(`cd /home/radioapp/radio-recorder/scripts && tail -50 ${logFile}`);
      
      if (logContent) {
        console.log('✅ Últimas 50 líneas del log:');
        console.log('```');
        console.log(logContent);
        console.log('```\n');
      }
    }
  } else {
    console.log('❌ No se encontraron logs\n');
  }

  // 5. Verificar si hay errores de permisos
  console.log('5️⃣  VERIFICANDO ERRORES DE PERMISOS...');
  const permissionErrors = await sshCommand('cd /home/radioapp/radio-recorder/scripts && grep -r "Permission denied" *.log 2>/dev/null || echo "No hay errores de permisos"');
  console.log('🔍 Resultado:', permissionErrors || 'No se pudo verificar\n');

  // 6. Verificar si hay errores de ffmpeg
  console.log('6️⃣  VERIFICANDO ERRORES DE FFMPEG...');
  const ffmpegErrors = await sshCommand('cd /home/radioapp/radio-recorder/scripts && grep -r "ffmpeg" *.log 2>/dev/null | tail -20 || echo "No hay errores de ffmpeg recientes"');
  console.log('🔍 Resultado:', ffmpegErrors || 'No se pudo verificar\n');

  console.log('════════════════════════════════════════════════════════════');
  console.log('📖 LECTURA DE CÓDIGO FUENTE COMPLETADA');
}

// Ejecutar
readSourceCode().catch(console.error);
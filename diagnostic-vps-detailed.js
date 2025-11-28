#!/usr/bin/env node

/**
 * Script de diagnóstico detallado para VPS
 * Verifica permisos, prueba endpoints y revisa logs
 */

const { exec } = require('child_process');
const http = require('http');

console.log('🔍 INICIANDO DIAGNÓSTICO DETALLADO DEL VPS');
console.log('===========================================\n');

// Configuración
const SSH_HOST = '213.199.39.147';
const SSH_USER = 'root';
const SSH_PASS = 'Aintelligence2025';
const API_URL = 'http://213.199.39.147:5000';

// Datos de prueba para el endpoint
const testData = {
  radio_url: 'https://radio.digitalfm.cl:8000/arica',
  radio_id: 'radio-1',
  radio_name: 'Digital Arica',
  recording_id: 'test-recording-' + Date.now()
};

let currentStep = 0;
const totalSteps = 7;

function runCommand(description, command, callback) {
  currentStep++;
  console.log(`\n[${currentStep}/${totalSteps}] ${description}`);
  console.log(`   Comando: ${command.substring(0, 120)}...`);
  
  exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      if (stderr) console.log(`   ⚠️  Stderr: ${stderr.trim().substring(0, 200)}`);
    } else if (stderr && !stdout) {
      console.log(`   ⚠️  Stderr: ${stderr.trim().substring(0, 200)}`);
    } else {
      const output = stdout.trim();
      if (output) {
        console.log(`   ✅ Resultado:\n${output.split('\n').map(line => `      ${line}`).join('\n')}`);
      } else {
        console.log(`   ✅ Comando ejecutado exitosamente`);
      }
    }
    callback();
  });
}

function testApiEndpoint(callback) {
  currentStep++;
  console.log(`\n[${currentStep}/${totalSteps}] Probando endpoint POST /api/start-recording`);
  console.log(`   Datos: ${JSON.stringify(testData, null, 2).split('\n').map(line => `   ${line}`).join('\n')}`);
  
  const postData = JSON.stringify(testData);
  const options = {
    hostname: '213.199.39.147',
    port: 5000,
    path: '/api/start-recording',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`   ✅ Status Code: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log(`   ✅ Respuesta:\n${JSON.stringify(response, null, 2).split('\n').map(line => `      ${line}`).join('\n')}`);
      } catch (e) {
        console.log(`   ✅ Respuesta (texto): ${data.substring(0, 500)}`);
      }
      callback();
    });
  });

  req.on('error', (error) => {
    console.log(`   ❌ Error en la petición: ${error.message}`);
    callback();
  });

  req.write(postData);
  req.end();
}

function checkFfmpegPath(callback) {
  currentStep++;
  console.log(`\n[${currentStep}/${totalSteps}] Verificando FFmpeg en el PATH del usuario radioapp`);
  
  const command = `sshpass -p '${SSH_PASS}' ssh ${SSH_USER}@${SSH_HOST} "sudo -u radioapp which ffmpeg && sudo -u radioapp ffmpeg -version | head -1"`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.log(`   ❌ FFmpeg no encontrado en PATH de radioapp: ${error.message}`);
      if (stderr) console.log(`   ⚠️  Stderr: ${stderr.trim()}`);
    } else {
      console.log(`   ✅ FFmpeg encontrado:\n${stdout.trim().split('\n').map(line => `      ${line}`).join('\n')}`);
    }
    callback();
  });
}

// Verificar si sshpass está instalado
exec('which sshpass', (error) => {
  if (error) {
    console.error('❌ sshpass no está instalado. Por favor instálalo primero:');
    console.error('   Ubuntu/Debian: sudo apt-get install sshpass');
    console.error('   macOS: brew install hudochenkov/sshpass/sshpass');
    process.exit(1);
  } else {
    console.log('✅ sshpass está instalado\n');
    
    // Ejecutar pasos secuenciales
    runCommand(
      'Verificando permisos del script record_radio.sh',
      `sshpass -p '${SSH_PASS}' ssh ${SSH_USER}@${SSH_HOST} "ls -la /home/radioapp/radio-recorder/scripts/record_radio.sh && stat -c '%a %U:%G' /home/radioapp/radio-recorder/scripts/record_radio.sh"`,
      () => {
        runCommand(
          'Verificando si el script es ejecutable',
          `sshpass -p '${SSH_PASS}' ssh ${SSH_USER}@${SSH_HOST} "test -x /home/radioapp/radio-recorder/scripts/record_radio.sh && echo 'SI es ejecutable' || echo 'NO es ejecutable'"`,
          () => {
            runCommand(
              'Verificando contenido del script (primeras 30 líneas)',
              `sshpass -p '${SSH_PASS}' ssh ${SSH_USER}@${SSH_HOST} "head -30 /home/radioapp/radio-recorder/scripts/record_radio.sh"`,
              () => {
                runCommand(
                  'Verificando FFmpeg instalado en el sistema',
                  `sshpass -p '${SSH_PASS}' ssh ${SSH_USER}@${SSH_HOST} "which ffmpeg && ffmpeg -version | head -2"`,
                  () => {
                    checkFfmpegPath(() => {
                      testApiEndpoint(() => {
                        runCommand(
                          'Buscando errores recientes en logs del servicio',
                          `sshpass -p '${SSH_PASS}' ssh ${SSH_USER}@${SSH_HOST} "journalctl -u radio-recorder -n 100 --no-pager | grep -E '(ERROR|error|Error|fail|Fail|FAIL)' | tail -20"`,
                          () => {
                            runCommand(
                              'Verificando directorio de logs de grabaciones',
                              `sshpass -p '${SSH_PASS}' ssh ${SSH_USER}@${SSH_HOST} "ls -la /home/radioapp/radio-recorder/logs/ 2>&1 || echo 'Directorio de logs no existe'"`,
                              () => {
                                console.log('\n✅ Diagnóstico detallado completado');
                                process.exit(0);
                              }
                            );
                          }
                        );
                      });
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  }
});
const { exec } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue('🔍 INICIANDO DIAGNÓSTICO COMPLETO DE SISTEMA DE GRABACIONES\n'));

// Función para ejecutar comandos SSH
function sshCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(chalk.yellow(`📋 ${description}...`));
    const fullCommand = `sshpass -p 'Aintelligence2025' ssh root@213.199.39.147 "${command}"`;
    
    exec(fullCommand, (error, stdout, stderr) => {
      if (error) {
        console.log(chalk.red(`❌ Error: ${error.message}`));
        resolve({ success: false, error: error.message });
      } else {
        console.log(chalk.green(`✅ ${description} - OK`));
        if (stdout.trim()) console.log(chalk.gray(`   Output: ${stdout.trim()}`));
        resolve({ success: true, output: stdout });
      }
    });
  });
}

async function runDiagnosis() {
  console.log(chalk.cyan.bold('=== 1. VERIFICANDO SERVICIO DE GRABACIÓN ===\n'));
  
  // Verificar si el servicio está corriendo
  await sshCommand(
    "systemctl is-active radio-recorder",
    "Estado del servicio radio-recorder"
  );
  
  // Verificar logs recientes
  await sshCommand(
    "journalctl -u radio-recorder -n 20 --no-pager",
    "Últimos 20 logs del servicio"
  );
  
  console.log(chalk.cyan.bold('\n=== 2. VERIFICANDO DIRECTORIO DE GRABACIONES ===\n'));
  
  // Verificar directorio de grabaciones
  await sshCommand(
    "ls -lah /home/radioapp/radio-recorder/recordings/ | head -20",
    "Archivos en directorio de grabaciones"
  );
  
  // Verificar espacio en disco
  await sshCommand(
    "df -h /home/radioapp/radio-recorder/recordings/",
    "Espacio en disco disponible"
  );
  
  // Verificar permisos
  await sshCommand(
    "ls -ld /home/radioapp/radio-recorder/recordings/",
    "Permisos del directorio"
  );
  
  console.log(chalk.cyan.bold('\n=== 3. VERIFICANDO PROCESOS DE GRABACIÓN ===\n'));
  
  // Verificar procesos FFmpeg activos
  await sshCommand(
    "ps aux | grep ffmpeg | grep -v grep",
    "Procesos FFmpeg activos"
  );
  
  // Verificar puerto 5000
  await sshCommand(
    "netstat -tuln | grep :5000",
    "Puerto 5000 en escucha"
  );
  
  console.log(chalk.cyan.bold('\n=== 4. VERIFICANDO API SERVER ===\n'));
  
  // Verificar si el API server está corriendo
  await sshCommand(
    "ps aux | grep api_server.py | grep -v grep",
    "Proceso API Server"
  );
  
  // Verificar configuración
  await sshCommand(
    "cat /home/radioapp/radio-recorder/config/radio_streams.json",
    "Configuración de radios"
  );
  
  console.log(chalk.cyan.bold('\n=== 5. PROBANDO ENDPOINT DE GRABACIÓN ===\n'));
  
  // Probar el endpoint
  console.log(chalk.yellow('📋 Probando endpoint /api/start-recording...'));
  
  const testData = {
    radio_id: 'test-radio',
    radio_name: 'Radio Test',
    stream_url: 'https://radio.digitalfm.cl:8000/arica',
    duration: 10
  };
  
  exec(`curl -X POST http://213.199.39.147:5000/api/start-recording \
    -H "Content-Type: application/json" \
    -d '${JSON.stringify(testData)}'`, (error, stdout, stderr) => {
    
    if (error) {
      console.log(chalk.red(`❌ Error en petición: ${error.message}`));
    } else {
      console.log(chalk.green('✅ Respuesta del endpoint:'));
      console.log(chalk.gray(stdout));
      
      // Verificar si se creó el archivo
      setTimeout(() => {
        console.log(chalk.cyan.bold('\n=== 6. VERIFICANDO ARCHIVO CREADO ===\n'));
        
        sshCommand(
          "find /home/radioapp/radio-recorder/recordings/ -name '*.mp3' -mmin -1",
          "Archivos MP3 creados en último minuto"
        ).then(() => {
          console.log(chalk.green.bold('\n✅ DIAGNÓSTICO COMPLETADO'));
        });
      }, 5000);
    }
  });
}

runDiagnosis().catch(console.error);

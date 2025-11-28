const { exec } = require('child_process');

console.log('🧪 PROBANDO ENDPOINT CON ID CORRECTO: radio-1\n');

const testData = {
  radio_id: 'radio-1',
  radio_name: 'Digital Arica',
  stream_url: 'https://radio.digitalfm.cl:8000/arica',
  duration: 10
};

const curlCommand = `curl -v -X POST http://213.199.39.147:5000/api/start-recording \
  -H "Content-Type: application/json" \
  -d '${JSON.stringify(testData)}'`;

console.log('📡 Enviando petición POST...');
console.log('📋 Datos:', JSON.stringify(testData, null, 2));
console.log('');

exec(curlCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ ERROR EN PETICIÓN:');
    console.error('Código:', error.code);
    console.error('Mensaje:', error.message);
    console.error('');
  }
  
  if (stderr) {
    console.log('📨 STDERR (detalles de conexión):');
    console.log(stderr);
    console.log('');
  }
  
  if (stdout) {
    console.log('📤 RESPUESTA DEL SERVIDOR:');
    console.log(stdout);
    console.log('');
  }
  
  // Verificar si se creó el proceso después de 5 segundos
  setTimeout(() => {
    console.log('🔍 VERIFICANDO PROCESOS DESPUÉS DE 5 SEGUNDOS...');
    const checkCommand = "sshpass -p 'Aintelligence2025' ssh root@213.199.39.147 'ps aux | grep ffmpeg | grep -v grep'";
    
    exec(checkCommand, (checkError, checkStdout) => {
      if (checkError) {
        console.error('❌ Error verificando procesos:', checkError.message);
      } else if (checkStdout.trim()) {
        console.log('✅ PROCESO FFMPEG ENCONTRADO:');
        console.log(checkStdout);
      } else {
        console.log('⚠️  NO HAY PROCESO FFMPEG ACTIVO');
      }
      
      // Verificar archivos recientes
      console.log('\n📁 VERIFICANDO ARCHIVOS MP3 RECIENTES...');
      const filesCommand = "sshpass -p 'Aintelligence2025' ssh root@213.199.39.147 'find /home/radioapp/radio-recorder/recordings/ -name \"*.mp3\" -mmin -2 -ls'";
      
      exec(filesCommand, (filesError, filesStdout) => {
        if (filesError) {
          console.error('❌ Error verificando archivos:', filesError.message);
        } else if (filesStdout.trim()) {
          console.log('✅ ARCHIVOS CREADOS RECIENTEMENTE:');
          console.log(filesStdout);
        } else {
          console.log('⚠️  No se crearon archivos nuevos en los últimos 2 minutos');
        }
        
        // Verificar logs de error
        console.log('\n📄 VERIFICANDO LOGS DE ERROR DEL SCRIPT...');
        const logCommand = "sshpass -p 'Aintelligence2025' ssh root@213.199.39.147 'cat /home/radioapp/radio-recorder/logs/recording_radio-1_*.log 2>/dev/null | tail -20'";
        
        exec(logCommand, (logError, logStdout) => {
          if (logError) {
            console.log('⚠️  No se encontraron logs de error específicos');
          } else if (logStdout.trim()) {
            console.log('📋 ULTIMOS LOGS:');
            console.log(logStdout);
          }
        });
      });
    });
  }, 5000);
});

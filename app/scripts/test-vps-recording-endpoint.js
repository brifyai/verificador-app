const { exec } = require('child_process');

console.log('🧪 PROBANDO ENDPOINT /api/start-recording MANUALMENTE...\n');

const testData = {
  radio_id: 'test-radio-123',
  radio_name: 'Radio Test Debug',
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
  
  // Verificar si se creó el proceso después de 3 segundos
  setTimeout(() => {
    console.log('🔍 VERIFICANDO PROCESOS DESPUÉS DE 3 SEGUNDOS...');
    const checkCommand = "sshpass -p 'Aintelligence2025' ssh root@213.199.39.147 'ps aux | grep -E \"(ffmpeg|python)\" | grep -v grep'";
    
    exec(checkCommand, (checkError, checkStdout) => {
      if (checkError) {
        console.error('❌ Error verificando procesos:', checkError.message);
      } else {
        console.log('✅ PROCESOS ACTIVOS:');
        console.log(checkStdout || '   No hay procesos de grabación activos');
      }
      
      // Verificar archivos recientes
      console.log('\n📁 VERIFICANDO ARCHIVOS MP3 RECIENTES...');
      const filesCommand = "sshpass -p 'Aintelligence2025' ssh root@213.199.39.147 'find /home/radioapp/radio-recorder/recordings/ -name \"*.mp3\" -mmin -2'";
      
      exec(filesCommand, (filesError, filesStdout) => {
        if (filesError) {
          console.error('❌ Error verificando archivos:', filesError.message);
        } else if (filesStdout.trim()) {
          console.log('✅ ARCHIVOS CREADOS RECIENTEMENTE:');
          console.log(filesStdout);
        } else {
          console.log('⚠️  No se crearon archivos nuevos en los últimos 2 minutos');
        }
      });
    });
  }, 3000);
});

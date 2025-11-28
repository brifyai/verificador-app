const { exec } = require('child_process');

console.log('📄 OBTENIENDO LOGS DEL API FLASK EN EL VPS...\n');

const logCommand = "sshpass -p 'Aintelligence2025' ssh root@213.199.39.147 'journalctl -u radio-recorder -n 50 --no-pager'";

exec(logCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ ERROR obteniendo logs:', error.message);
    console.log('\nIntentando con archivo de log directo...');
    
    // Intentar con archivo de log directo
    const altCommand = "sshpass -p 'Aintelligence2025' ssh root@213.199.39.147 'cat /home/radioapp/radio-recorder/logs/api_server.log 2>/dev/null || cat /home/radioapp/radio-recorder/api_server.log 2>/dev/null || ls -la /home/radioapp/radio-recorder/logs/'";
    
    exec(altCommand, (altError, altStdout) => {
      if (altError) {
        console.error('❌ Error alternativo:', altError.message);
      } else {
        console.log('📋 LOGS ALTERNATIVOS:');
        console.log(altStdout || 'No hay logs disponibles');
      }
    });
    return;
  }
  
  if (stderr) {
    console.log('⚠️  STDERR:', stderr);
  }
  
  if (stdout.trim()) {
    console.log('📋 ULTIMOS 50 LOGS DEL SERVICIO:');
    console.log(stdout);
    
    // Buscar errores específicos
    const errorLines = stdout.split('\n').filter(line => 
      line.toLowerCase().includes('error') || 
      line.toLowerCase().includes('exception') ||
      line.toLowerCase().includes('traceback')
    );
    
    if (errorLines.length > 0) {
      console.log('\n🚨 LINEAS CON ERRORES ENCONTRADAS:');
      errorLines.forEach(line => console.log(line));
    }
  } else {
    console.log('⚠️  No se encontraron logs en journalctl');
  }
});

const { exec } = require('child_process');

console.log('🚨 BUSCANDO LOGS DE ERROR DEL API FLASK...\n');

// Buscar en todos los logs posibles
const commands = [
  "sshpass -p 'Aintelligence2025' ssh root@213.199.39.147 'cat /home/radioapp/radio-recorder/logs/api_server.err 2>/dev/null'",
  "sshpass -p 'Aintelligence2025' ssh root@213.199.39.147 'cat /home/radioapp/radio-recorder/logs/api_server.log 2>/dev/null | grep -i error'",
  "sshpass -p 'Aintelligence2025' ssh root@213.199.147 'find /home/radioapp/radio-recorder/logs/ -name \"*.log\" -exec tail -20 {} \\;'",
  "sshpass -p 'Aintelligence2025' ssh root@213.199.39.147 'journalctl -u radio-recorder -n 100 --no-pager | grep -A 10 -B 10 \"POST /api/start-recording\"'",
  "sshpass -p 'Aintelligence2025' ssh root@213.199.39.147 'journalctl -u radio-recorder -n 100 --no-pager | grep -A 20 -B 5 \"500 INTERNAL\"'"
];

function runCommand(index) {
  if (index >= commands.length) {
    console.log('\n✅ Búsqueda de logs completada');
    return;
  }
  
  console.log(`\n🔍 Intentando comando ${index + 1}...`);
  exec(commands[index], (error, stdout, stderr) => {
    if (error) {
      console.log(`❌ Comando ${index + 1} falló:`, error.message.substring(0, 100));
    } else if (stdout.trim()) {
      console.log(`\n✅ RESULTADO COMANDO ${index + 1}:`);
      console.log(stdout);
      // Si encontramos algo útil, detener
      if (stdout.toLowerCase().includes('error') || stdout.toLowerCase().includes('exception')) {
        console.log('\n🎯 ERROR ENCONTRADO EN COMANDO', index + 1);
        return;
      }
    }
    
    // Continuar con el siguiente comando
    setTimeout(() => runCommand(index + 1), 100);
  });
}

runCommand(0);

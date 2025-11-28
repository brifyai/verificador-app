const { exec } = require('child_process');

console.log('🔍 VERIFICACIÓN SIMPLIFICADA DEL SERVICIO VPS...\n');

// Verificar solo el estado del servicio
const command = "sshpass -p 'Aintelligence2025' ssh root@213.199.39.147 'systemctl status radio-recorder --no-pager'";

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error al verificar servicio:', error.message);
    console.log('📝 Código de salida:', error.code);
    return;
  }
  
  console.log('✅ ESTADO DEL SERVICIO:');
  console.log(stdout);
  
  if (stderr) {
    console.error('⚠️  STDERR:', stderr);
  }
});

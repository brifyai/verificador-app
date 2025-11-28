const { exec } = require('child_process');

console.log('🔍 VERIFICANDO ESTADO DEL SERVICIO DE GRABACIÓN VPS...\n');

// Comando para verificar todo en una sola ejecución (sin netstat)
const command = `
sshpass -p 'Aintelligence2025' ssh root@213.199.39.147 "
echo '=== ESTADO DEL SERVICIO ===' &&
systemctl status radio-recorder --no-pager -n 20 &&
echo '' &&
echo '=== PROCESOS PYTHON/FFMPEG ACTIVOS ===' &&
ps aux | grep -E '(python|ffmpeg)' | grep -v grep &&
echo '' &&
echo '=== PUERTO 5000 (usando ss) ===' &&
ss -tuln | grep :5000 || echo 'Puerto 5000 no está en escucha' &&
echo '' &&
echo '=== ÚLTIMOS LOGS DE ERROR ===' &&
journalctl -u radio-recorder -n 30 --no-pager | grep -i error
"
`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  console.log(stdout);
  
  if (stderr) {
    console.error('⚠️  STDERR:', stderr);
  }
});

const { exec } = require('child_process');

console.log('📝 CONSULTANDO LOGS DEL SERVICIO VPS...\n');

const command = `
sshpass -p 'Aintelligence2025' ssh root@213.199.39.147 "
echo '=== ULTIMOS 50 LOGS DEL SERVICIO ===' &&
journalctl -u radio-recorder.service -n 50 --no-pager
"
`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error ejecutando comando:', error.message);
    return;
  }
  
  if (stderr) {
    console.error('⚠️  STDERR:', stderr);
  }
  
  console.log(stdout);
});

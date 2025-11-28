const { exec } = require('child_process');

console.log('🔍 VERIFICANDO CÓDIGO DEL ENDPOINT /api/start-recording...\n');

const command = `
sshpass -p 'Aintelligence2025' ssh root@213.199.39.147 "
echo '=== BUSCANDO FUNCION start-recording ===' &&
grep -n 'def start' /home/radioapp/radio-recorder/scripts/api_server.py
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

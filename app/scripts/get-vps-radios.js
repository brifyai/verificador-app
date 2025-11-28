const { exec } = require('child_process');

console.log('📡 OBTENIENDO LISTA DE RADIOS CONFIGURADAS EN EL VPS...\n');

const curlCommand = "curl -s http://213.199.39.147:5000/api/radios";

exec(curlCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ ERROR:', error.message);
    return;
  }
  
  if (stderr) {
    console.log('⚠️  Advertencia:', stderr);
  }
  
  try {
    const data = JSON.parse(stdout);
    console.log('✅ RADIOS CONFIGURADAS EN EL VPS:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.radios && data.radios.length > 0) {
      console.log('\n📋 RESUMEN:');
      data.radios.forEach((radio, index) => {
        console.log(`${index + 1}. ID: ${radio.id} | Nombre: ${radio.name} | URL: ${radio.url}`);
      });
      console.log('\n💡 USAR UNO DE ESTOS IDs PARA LA PRUEBA');
    } else {
      console.log('\n⚠️  No hay radios configuradas en el VPS');
    }
  } catch (e) {
    console.log('📄 RESPUESTA CRUDA:');
    console.log(stdout);
  }
});

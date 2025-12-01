const { verifyStreamStatus } = require('./lib/stream-verifier-enhanced');

async function testDigitalFMArica() {
  console.log('🧪 Probando Digital FM Arica con el verificador actualizado...\n');
  
  const digitalFMAricaUrl = 'https://radio.digitalfm.cl:8000/arica';
  
  try {
    console.log(`📻 Verificando: ${digitalFMAricaUrl}`);
    console.log('⏳ Esto puede tomar hasta 20 segundos...\n');
    
    const result = await verifyStreamStatus(digitalFMAricaUrl);
    
    console.log('✅ Verificación completada!');
    console.log('\n📊 Resultados:');
    console.log(`- Estado: ${result.status}`);
    console.log(`- Detalles: ${result.details}`);
    console.log(`- Tipo de stream: ${result.streamType}`);
    console.log(`- Método usado: ${result.method}`);
    console.log(`- Código de respuesta: ${result.responseCode}`);
    console.log(`- Tiempo de respuesta: ${result.responseTime}ms`);
    console.log(`- Timestamp: ${result.timestamp}`);
    
    if (result.status === 'ONLINE') {
      console.log('\n🎉 ¡ÉXITO! Digital FM Arica está ONLINE');
      console.log('✅ El problema del certificado SSL ha sido resuelto');
    } else {
      console.log('\n❌ La radio sigue apareciendo como OFFLINE');
      console.log('🔍 Razón:', result.details);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error al verificar Digital FM Arica:', error.message);
    return null;
  }
}

// Ejecutar prueba
if (require.main === module) {
  testDigitalFMArica()
    .then(result => {
      if (result) {
        console.log('\n📋 RESUMEN DE LA PRUEBA:');
        console.log(`- URL probada: ${digitalFMAricaUrl}`);
        console.log(`- Estado final: ${result.status}`);
        console.log(`- Método de verificación: ${result.method}`);
        console.log(`- SSL ignorado: Sí (rejectUnauthorized: false)`);
      }
    })
    .catch(error => {
      console.error('❌ Error en la prueba:', error);
    });
}

module.exports = { testDigitalFMArica };
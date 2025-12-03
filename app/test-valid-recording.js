#!/usr/bin/env node

/**
 * PRUEBA DE GRABACIÓN CON ID VÁLIDO
 */

async function testValidRecording() {
  console.log('=== PRUEBA CON ID VÁLIDO ===');
  
  try {
    // Usar un ID válido del VPS
    const testRecording = {
      radio_id: 80, // Radio Contagio (ID válido del VPS)
      duration: 5, // 5 segundos para prueba
      format: 'mp3'
    };
    
    console.log('1. Iniciando grabación con ID válido...');
    console.log('   Radio ID:', testRecording.radio_id);
    console.log('   Duración:', testRecording.duration + 's');
    
    const response = await fetch('http://213.199.39.147:5000/api/start-recording', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testRecording)
    });
    
    const result = await response.json();
    console.log('   Respuesta:', result);
    
    if (response.ok && result.status === 'success') {
      console.log('\n2. Esperando 6 segundos...');
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      console.log('\n3. Verificando grabaciones...');
      const checkResponse = await fetch('http://213.199.39.147:5000/api/recordings');
      const checkData = await checkResponse.json();
      console.log('   Grabaciones:', checkData);
      
      if (checkData.count > 0) {
        console.log('\n✅ ¡GRABACIÓN EXITOSA!');
        console.log('La grabación se guardó correctamente en el VPS.');
        console.log('Ahora debe aparecer en la aplicación web.');
        
        console.log('\n📁 Archivos guardados:');
        checkData.recordings.forEach((rec, i) => {
          console.log(`   ${i + 1}. ${rec.filename}`);
          console.log(`      Tamaño: ${rec.file_size || 'N/A'} bytes`);
          console.log(`      Fecha: ${rec.recorded_at || rec.created || 'N/A'}`);
        });
      } else {
        console.log('\n❌ PROBLEMA: La grabación no se guardó.');
      }
    } else {
      console.log('\n❌ Error iniciando grabación');
      console.log('Respuesta:', result);
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testValidRecording();
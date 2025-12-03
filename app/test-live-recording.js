#!/usr/bin/env node

/**
 * PRUEBA DE GRABACIÓN EN VIVO
 */

async function testRecording() {
  console.log('=== PRUEBA DE GRABACIÓN ===');
  
  try {
    console.log('1. Iniciando grabación de prueba...');
    
    const response = await fetch('http://213.199.39.147:5000/api/start-recording', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        radio_id: 'mijm9xci', // Radio Contagio
        duration: 5, // 5 segundos para prueba
        format: 'mp3'
      })
    });
    
    const result = await response.json();
    console.log('   Respuesta:', result);
    
    if (response.ok) {
      console.log('\n2. Esperando 6 segundos...');
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      console.log('\n3. Verificando grabaciones...');
      const checkResponse = await fetch('http://213.199.39.147:5000/api/recordings');
      const checkData = await checkResponse.json();
      console.log('   Grabaciones:', checkData);
      
      if (checkData.count > 0) {
        console.log('\n✅ ¡GRABACIÓN EXITOSA!');
        console.log('Tu nueva grabación se guardó correctamente.');
      } else {
        console.log('\n❌ PROBLEMA: La grabación no se guardó.');
        console.log('Revisa el proceso de grabación en el VPS.');
      }
    } else {
      console.log('\n❌ Error iniciando grabación');
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testRecording();
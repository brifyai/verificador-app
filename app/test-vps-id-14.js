#!/usr/bin/env node

/**
 * PRUEBA CON ID 14 (Desierto) - QUE SÍ EXISTE EN VPS
 */

async function testVPSId14() {
  console.log('=== PRUEBA CON ID 14 (Desierto) ===');
  
  try {
    const testRecording = {
      radio_id: 14, // Radio Desierto (ID que existe en VPS)
      duration: 5,
      format: 'mp3'
    };
    
    console.log('1. Iniciando grabación con ID 14 (Desierto)...');
    console.log('   Radio ID:', testRecording.radio_id);
    
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
      console.log('\n✅ ¡GRABACIÓN EXITOSA CON ID 14!');
      console.log('El problema era el ID, no el formato del request.');
      
      console.log('\n2. Esperando 6 segundos...');
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      console.log('\n3. Verificando grabaciones...');
      const checkResponse = await fetch('http://213.199.39.147:5000/api/recordings');
      const checkData = await checkResponse.json();
      console.log('   Grabaciones:', checkData);
      
      if (checkData.count > 0) {
        console.log('\n🎉 ¡SISTEMA FUNCIONANDO!');
        console.log('Tu nueva grabación debe aparecer en http://localhost:3000/grabaciones');
      }
    } else {
      console.log('\n❌ Error con ID 14:', result.message);
      
      // Probar con otros IDs que sabemos que existen
      console.log('\n🔍 Probando con otros IDs del VPS...');
      const testIds = [3, 16, 17, 18]; // IDs que vimos en la lista del VPS
      
      for (const testId of testIds) {
        console.log(`\nProbando ID ${testId}...`);
        try {
          const testResponse = await fetch('http://213.199.39.147:5000/api/start-recording', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              radio_id: testId,
              duration: 3,
              format: 'mp3'
            })
          });
          
          const testResult = await testResponse.json();
          console.log(`   ID ${testId}:`, testResult.status, testResult.message || 'OK');
          
          if (testResult.status === 'success') {
            console.log(`\n✅ ¡ID ${testId} FUNCIONA!`);
            break;
          }
        } catch (err) {
          console.log(`   ID ${testId}: Error - ${err.message}`);
        }
      }
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testVPSId14();
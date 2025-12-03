// Script para probar la solución definitiva del proxy público de grabación
require('dotenv').config({ path: '.env' });

async function testRecordingProxyPublic() {
  console.log('🧪 Probando solución definitiva del proxy público de grabación...\n');

  const baseUrl = 'http://localhost:3000';

  // Radio de prueba
  const testRadio = {
    radio_id: 2,
    stream_url: 'https://radio.digitalfm.cl:8000/arica',
    radio_name: 'Digital'
  };

  try {
    // 1. Probar inicio de grabación
    console.log('🎙️ 1. Probando inicio de grabación...');
    console.log(`   Radio ID: ${testRadio.radio_id}`);
    console.log(`   Stream: ${testRadio.stream_url}`);
    console.log(`   Nombre: ${testRadio.radio_name}\n`);

    const startResponse = await fetch(`${baseUrl}/api/recording-proxy-public`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRadio)
    });

    const startData = await startResponse.json();
    console.log(`   Status: ${startResponse.status} ${startResponse.statusText}`);
    console.log(`   Response: ${JSON.stringify(startData, null, 2)}\n`);

    if (startData.success) {
      console.log('✅ Grabación iniciada correctamente');

      // 2. Verificar estado de grabaciones
      console.log('📊 2. Verificando estado de grabaciones...');
      const statusResponse = await fetch(`${baseUrl}/api/recording-proxy-public`);
      const statusData = await statusResponse.json();
      
      console.log(`   Status: ${statusResponse.status} ${statusResponse.statusText}`);
      console.log(`   Grabaciones activas: ${statusData.count}`);
      console.log(`   Grabaciones locales: ${statusData.local_count}`);
      console.log(`   Grabaciones VPS: ${statusData.vps_count}\n`);

      if (statusData.count > 0) {
        console.log('✅ Estado de grabaciones funcionando');

        // 3. Esperar un momento y detener la grabación
        console.log('⏳ 3. Esperando 2 segundos antes de detener...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('🛑 4. Deteniendo grabación...');
        const stopResponse = await fetch(`${baseUrl}/api/recording-proxy-public?radio_id=${testRadio.radio_id}`, {
          method: 'DELETE'
        });

        const stopData = await stopResponse.json();
        console.log(`   Status: ${stopResponse.status} ${stopResponse.statusText}`);
        console.log(`   Response: ${JSON.stringify(stopData, null, 2)}\n`);

        if (stopData.success) {
          console.log('✅ Grabación detenida correctamente');

          // 4. Verificar estado final
          console.log('📊 5. Verificando estado final...');
          const finalStatusResponse = await fetch(`${baseUrl}/api/recording-proxy-public`);
          const finalStatusData = await finalStatusResponse.json();
          
          console.log(`   Status: ${finalStatusResponse.status} ${finalStatusResponse.statusText}`);
          console.log(`   Grabaciones activas finales: ${finalStatusData.count}\n`);

          if (finalStatusData.count === 0) {
            console.log('✅ Sistema funcionando perfectamente');
          } else {
            console.log('⚠️ Quedaron grabaciones activas');
          }
        } else {
          console.log('❌ Error al detener grabación');
        }
      } else {
        console.log('❌ No se encontraron grabaciones activas después de iniciar');
      }
    } else {
      console.log('❌ Error al iniciar grabación');
    }

    // 5. Probar múltiples escenarios
    console.log('🧪 6. Probando escenarios adicionales...\n');

    const testCases = [
      {
        name: 'Radio inexistente',
        payload: { radio_id: 9999, stream_url: 'http://test.com', radio_name: 'Test' }
      },
      {
        name: 'Datos incompletos',
        payload: { radio_id: 3 }
      },
      {
        name: 'Sin radio_id',
        payload: { stream_url: 'http://test.com', radio_name: 'Test' }
      }
    ];

    for (const testCase of testCases) {
      console.log(`📋 Probando: ${testCase.name}`);
      console.log(`   Payload: ${JSON.stringify(testCase.payload)}`);
      
      try {
        const response = await fetch(`${baseUrl}/api/recording-proxy-public`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testCase.payload)
        });

        const data = await response.json();
        console.log(`   Status: ${response.status}`);
        console.log(`   Result: ${data.success ? '✅' : '❌'} - ${data.message}\n`);
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
      }
    }

    console.log('🎯 Prueba completada');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Ejecutar prueba
testRecordingProxyPublic().catch(error => {
  console.error('❌ Error fatal:', error);
});
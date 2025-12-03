// Script simple para probar directamente el endpoint del VPS sin dependencias
require('dotenv').config({ path: '.env' });

const VPS_API_URL = process.env.VPS_API_URL || 'http://213.199.39.147:5000/api';

async function testVPSDirect() {
  console.log('🔍 Probando endpoint del VPS directamente...\n');

  // Radio de prueba basada en los datos que conocemos
  const testRadio = {
    id: 2,
    name: 'Digital',
    stream_url: 'https://radio.digitalfm.cl:8000/arica',
    region: 'Arica y Parinacota',
    city: 'Arica',
    frequency: '92.1 FM'
  };

  console.log('📡 Radio de prueba:');
  console.log(`   ID: ${testRadio.id}`);
  console.log(`   Nombre: ${testRadio.name}`);
  console.log(`   Stream: ${testRadio.stream_url}\n`);

  // 1. Verificar que el VPS está accesible
  console.log('🌐 Verificando conexión con VPS...');
  try {
    const healthResponse = await fetch(`${VPS_API_URL}/radios`, {
      method: 'GET',
      timeout: 10000
    });
    
    if (healthResponse.ok) {
      const responseText = await healthResponse.text();
      console.log(`✅ VPS accesible - Response length: ${responseText.length}`);
      
      let radios;
      try {
        radios = JSON.parse(responseText);
        console.log(`✅ Respuesta parseada como JSON`);
        
        if (Array.isArray(radios)) {
          console.log(`✅ Encontradas ${radios.length} radios`);
          
          // Verificar si nuestra radio de prueba existe
          const radioExists = radios.find(r => r.id === testRadio.id);
          if (radioExists) {
            console.log(`✅ Radio ${testRadio.name} (ID: ${testRadio.id}) encontrada en VPS`);
            console.log(`   Stream VPS: ${radioExists.stream_url}`);
          } else {
            console.log(`❌ Radio ${testRadio.name} (ID: ${testRadio.id}) NO encontrada en VPS`);
          }
        } else {
          console.log(`⚠️ La respuesta no es un array: ${typeof radios}`);
          console.log(`   Contenido: ${JSON.stringify(radios).substring(0, 200)}...`);
        }
      } catch (parseError) {
        console.log(`❌ Error parseando JSON: ${parseError.message}`);
        console.log(`   Response preview: ${responseText.substring(0, 200)}...`);
      }
    } else {
      console.log(`❌ Error al conectar con VPS: ${healthResponse.status}`);
      return;
    }
  } catch (error) {
    console.log(`❌ Error de conexión con VPS: ${error.message}`);
    return;
  }

  console.log('\n🧪 Probando endpoint /api/start-recording con diferentes payloads...\n');

  const testCases = [
    {
      name: 'Payload 1: id_radio + stream_url + radio_name',
      payload: {
        id_radio: testRadio.id,
        stream_url: testRadio.stream_url,
        radio_name: testRadio.name
      }
    },
    {
      name: 'Payload 2: radio_id + stream_url + radio_name',
      payload: {
        radio_id: testRadio.id,
        stream_url: testRadio.stream_url,
        radio_name: testRadio.name
      }
    },
    {
      name: 'Payload 3: Solo id_radio',
      payload: {
        id_radio: testRadio.id
      }
    },
    {
      name: 'Payload 4: Solo radio_id',
      payload: {
        radio_id: testRadio.id
      }
    },
    {
      name: 'Payload 5: Todos los campos',
      payload: {
        id_radio: testRadio.id,
        stream_url: testRadio.stream_url,
        radio_name: testRadio.name,
        region: testRadio.region,
        city: testRadio.city,
        frequency: testRadio.frequency
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`📋 ${testCase.name}:`);
    console.log(`   Payload: ${JSON.stringify(testCase.payload)}`);
    
    try {
      const response = await fetch(`${VPS_API_URL}/start-recording`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.payload)
      });

      const responseText = await response.text();
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);

      if (response.ok) {
        console.log('   ✅ Éxito - Grabación iniciada');
        
        // Si fue exitoso, intentar detenerla
        console.log('   🛑 Intentando detener grabación...');
        try {
          const stopResponse = await fetch(`${VPS_API_URL}/stop-recording`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id_radio: testRadio.id })
          });
          console.log(`   Stop Status: ${stopResponse.status} ${stopResponse.statusText}`);
        } catch (stopError) {
          console.log(`   ⚠️ Error al detener: ${stopError.message}`);
        }
      } else {
        console.log('   ❌ Error - Analizando respuesta...');
        
        // Intentar parsear como JSON
        try {
          const errorData = JSON.parse(responseText);
          console.log(`   Error Type: ${errorData.error || 'Unknown'}`);
          console.log(`   Error Message: ${errorData.message || 'No message'}`);
          if (errorData.details) {
            console.log(`   Details: ${JSON.stringify(errorData.details)}`);
          }
        } catch (e) {
          console.log(`   Response no es JSON válido`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Excepción: ${error.message}`);
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo entre pruebas
  }

  // 2. Probar endpoint de estado
  console.log('📊 Verificando endpoint de estado...');
  try {
    const statusResponse = await fetch(`${VPS_API_URL}/active-recordings`);
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log(`✅ Grabaciones activas: ${JSON.stringify(status)}`);
    } else {
      console.log(`❌ Error al obtener estado: ${statusResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Error al verificar estado: ${error.message}`);
  }

  console.log('\n🎯 Prueba completada');
}

// Ejecutar prueba
testVPSDirect().catch(error => {
  console.error('❌ Error fatal:', error);
});
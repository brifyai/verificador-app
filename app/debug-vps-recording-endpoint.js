// Script para diagnosticar específicamente el problema del endpoint de grabación del VPS
const { supabaseDirect } = require('./lib/supabase-direct');
require('dotenv').config({ path: '.env' });

const VPS_API_URL = process.env.VPS_API_URL || 'http://213.199.39.147:5000/api';

async function testVPSRecordingEndpoint() {
  console.log('🔍 Diagnosticando endpoint de grabación del VPS...\n');

  try {
    // 1. Obtener una radio específica para pruebas
    console.log('📡 Obteniendo radio de prueba...');
    const localRadios = await supabaseDirect.getRadios();
    const testRadio = localRadios.find(r => r.id === 2); // Radio Digital
    
    if (!testRadio) {
      console.log('❌ No se encontró la radio de prueba (ID: 2)');
      return;
    }

    console.log(`✅ Radio de prueba encontrada: ${testRadio.name} (ID: ${testRadio.id})`);
    console.log(`📡 Stream URL: ${testRadio.stream_url}\n`);

    // 2. Verificar que la radio existe en el VPS
    console.log('🔍 Verificando que la radio existe en el VPS...');
    const vpsRadiosResponse = await fetch(`${VPS_API_URL}/radios`);
    const vpsRadios = await vpsRadiosResponse.json();
    
    const vpsRadio = vpsRadios.find(r => r.id === testRadio.id);
    if (!vpsRadio) {
      console.log('❌ La radio no existe en el VPS');
      return;
    }

    console.log(`✅ Radio encontrada en VPS: ${vpsRadio.name}`);
    console.log(`📡 Stream URL VPS: ${vpsRadio.stream_url}\n`);

    // 3. Probar el endpoint de inicio de grabación con diferentes formatos
    console.log('🧪 Probando endpoint /api/start-recording...\n');

    const testCases = [
      {
        name: 'Caso 1: Formato original (id_radio)',
        payload: {
          id_radio: testRadio.id,
          stream_url: testRadio.stream_url,
          radio_name: testRadio.name
        }
      },
      {
        name: 'Caso 2: Formato alternativo (radio_id)',
        payload: {
          radio_id: testRadio.id,
          stream_url: testRadio.stream_url,
          radio_name: testRadio.name
        }
      },
      {
        name: 'Caso 3: Formato mínimo',
        payload: {
          id_radio: testRadio.id
        }
      },
      {
        name: 'Caso 4: Con todos los campos posibles',
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
        console.log(`   Status: ${response.status}`);
        console.log(`   Response: ${responseText}`);

        if (response.ok) {
          console.log('   ✅ Éxito');
        } else {
          console.log('   ❌ Error');
          
          // Intentar parsear como JSON para obtener más detalles
          try {
            const errorData = JSON.parse(responseText);
            console.log(`   Error details:`, errorData);
          } catch (e) {
            // No es JSON, mostrar texto plano
          }
        }
      } catch (error) {
        console.log(`   ❌ Excepción: ${error.message}`);
      }
      
      console.log('');
    }

    // 4. Probar el endpoint de verificación de radio
    console.log('🔍 Probando endpoint de verificación de radio...\n');
    
    try {
      const verifyResponse = await fetch(`${VPS_API_URL}/radios/${testRadio.id}`);
      console.log(`Status: ${verifyResponse.status}`);
      
      if (verifyResponse.ok) {
        const radioData = await verifyResponse.json();
        console.log('✅ Radio verificada en VPS:');
        console.log(JSON.stringify(radioData, null, 2));
      } else {
        const errorText = await verifyResponse.text();
        console.log(`❌ Error al verificar radio: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Excepción al verificar radio: ${error.message}`);
    }

    // 5. Listar todos los endpoints disponibles
    console.log('\n📋 Verificando endpoints disponibles en el VPS...');
    
    const endpoints = [
      '/radios',
      '/radios/' + testRadio.id,
      '/start-recording',
      '/stop-recording',
      '/active-recordings',
      '/recordings',
      '/status'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${VPS_API_URL}${endpoint}`, {
          method: 'GET'
        });
        console.log(`${endpoint}: ${response.status} ${response.statusText}`);
      } catch (error) {
        console.log(`${endpoint}: ❌ Error - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error en el diagnóstico:', error.message);
  }
}

// Ejecutar el diagnóstico
testVPSRecordingEndpoint().then(() => {
  console.log('\n🎯 Diagnóstico completado');
}).catch(error => {
  console.error('❌ Error fatal:', error);
});
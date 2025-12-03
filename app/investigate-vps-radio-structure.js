// Script para investigar la estructura exacta de datos del VPS
require('dotenv').config({ path: '.env' });

const VPS_API_URL = process.env.VPS_API_URL || 'http://213.199.39.147:5000/api';

async function investigateVPSRadioStructure() {
  console.log('🔍 Investigando estructura de radios en el VPS...\n');

  try {
    // 1. Obtener todas las radios del VPS
    console.log('📡 Obteniendo todas las radios del VPS...');
    const response = await fetch(`${VPS_API_URL}/radios`);
    
    if (!response.ok) {
      console.log(`❌ Error al obtener radios: ${response.status}`);
      return;
    }

    const data = await response.json();
    console.log(`✅ Respuesta obtenida: ${JSON.stringify(data).substring(0, 200)}...`);
    
    if (!data.radios || !Array.isArray(data.radios)) {
      console.log('❌ La respuesta no contiene un array de radios');
      return;
    }

    const radios = data.radios;
    console.log(`✅ Encontradas ${radios.length} radios en el VPS\n`);

    // 2. Buscar nuestra radio de prueba (ID: 2)
    console.log('🔍 Buscando radio Digital (ID: 2)...');
    const targetRadio = radios.find(r => r.id_radio === 2 || r.radio_id === 2 || r.id === 2);
    
    if (targetRadio) {
      console.log('✅ Radio encontrada:');
      console.log(JSON.stringify(targetRadio, null, 2));
    } else {
      console.log('❌ Radio ID 2 no encontrada');
      
      // Buscar radios con nombres similares
      console.log('\n🔍 Buscando radios con nombres similares...');
      const similarRadios = radios.filter(r => 
        r.name && r.name.toLowerCase().includes('digital') ||
        r.radio_name && r.radio_name.toLowerCase().includes('digital')
      );
      
      if (similarRadios.length > 0) {
        console.log(`✅ Encontradas ${similarRadios.length} radios similares:`);
        similarRadios.forEach((radio, index) => {
          console.log(`\n${index + 1}. ${JSON.stringify(radio, null, 2)}`);
        });
      } else {
        console.log('❌ No se encontraron radios similares');
        
        // Mostrar primeras 5 radios para entender la estructura
        console.log('\n📋 Primeras 5 radios del VPS:');
        radios.slice(0, 5).forEach((radio, index) => {
          console.log(`\n${index + 1}. ${JSON.stringify(radio, null, 2)}`);
        });
      }
    }

    // 3. Analizar la estructura de IDs
    console.log('\n🔍 Analizando estructura de IDs...');
    const idFields = new Set();
    radios.slice(0, 10).forEach(radio => {
      Object.keys(radio).forEach(key => {
        if (key.includes('id')) {
          idFields.add(key);
        }
      });
    });
    
    console.log('✅ Campos de ID encontrados:');
    Array.from(idFields).forEach(field => console.log(`   - ${field}`));

    // 4. Probar diferentes IDs para la radio Digital
    console.log('\n🧪 Probando diferentes IDs para grabación...');
    
    const testCases = [
      { field: 'id_radio', value: 2 },
      { field: 'radio_id', value: 2 },
      { field: 'id', value: 2 }
    ];

    for (const testCase of testCases) {
      console.log(`\n📋 Probando con ${testCase.field}: ${testCase.value}`);
      
      try {
        const response = await fetch(`${VPS_API_URL}/start-recording`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ [testCase.field]: testCase.value })
        });

        const responseText = await response.text();
        console.log(`   Status: ${response.status}`);
        console.log(`   Response: ${responseText}`);

        if (response.ok && !responseText.includes('Radio no encontrada')) {
          console.log('   ✅ Éxito posible - Deteniendo grabación...');
          
          // Intentar detener
          try {
            const stopResponse = await fetch(`${VPS_API_URL}/stop-recording`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ [testCase.field]: testCase.value })
            });
            console.log(`   Stop Status: ${stopResponse.status}`);
          } catch (stopError) {
            console.log(`   Stop Error: ${stopError.message}`);
          }
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    // 5. Buscar el ID correcto para la radio Digital
    console.log('\n🔍 Buscando el ID correcto para la radio Digital...');
    const digitalRadios = radios.filter(r => 
      (r.name && r.name.toLowerCase().includes('digital')) ||
      (r.radio_name && r.radio_name.toLowerCase().includes('digital'))
    );

    if (digitalRadios.length > 0) {
      console.log(`✅ Encontradas ${digitalRadios.length} radios Digital:`);
      digitalRadios.forEach((radio, index) => {
        console.log(`\n${index + 1}. ID: ${radio.id_radio || radio.radio_id || radio.id || 'N/A'}`);
        console.log(`   Nombre: ${radio.name || radio.radio_name || 'N/A'}`);
        console.log(`   Stream: ${radio.stream_url || radio.url || 'N/A'}`);
        
        // Probar grabación con el ID encontrado
        const testId = radio.id_radio || radio.radio_id || radio.id;
        if (testId) {
          console.log(`   🧪 Probando grabación con ID ${testId}...`);
          
          fetch(`${VPS_API_URL}/start-recording`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ radio_id: testId })
          })
          .then(resp => resp.text())
          .then(respText => {
            console.log(`      Resultado: ${respText.substring(0, 100)}...`);
          })
          .catch(err => {
            console.log(`      Error: ${err.message}`);
          });
        }
      });
    }

  } catch (error) {
    console.error('❌ Error en la investigación:', error.message);
  }
}

// Ejecutar investigación
investigateVPSRadioStructure().then(() => {
  console.log('\n🎯 Investigación completada');
}).catch(error => {
  console.error('❌ Error fatal:', error);
});
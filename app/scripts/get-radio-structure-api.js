// Script para obtener la estructura real de radios usando el API existente
const fetch = require('node-fetch');

async function getRadioStructure() {
  console.log('🔍 Obteniendo estructura de radios mediante API...\n');

  try {
    // 1. Intentar obtener la lista de radios
    console.log('1. Obteniendo lista de radios...');
    
    const response = await fetch('http://localhost:3000/api/radios', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      console.log(`❌ Error al obtener radios: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();
    
    if (!data.success || !data.data || data.data.length === 0) {
      console.log('❌ No se encontraron radios para analizar');
      console.log('   Respuesta del servidor:', JSON.stringify(data, null, 2));
      return;
    }

    const radio = data.data[0];
    console.log('✅ Radio encontrada para análisis');
    console.log(`   ID: ${radio.id}`);
    console.log(`   Nombre: ${radio.name}`);
    console.log('');

    // 2. Analizar la estructura completa
    console.log('2. Estructura completa de la respuesta del API:');
    console.log('   Campos disponibles:');
    
    Object.keys(radio).forEach(key => {
      const value = radio[key];
      const type = value === null ? 'null' : typeof value;
      const preview = value !== null && typeof value === 'string' && value.length > 50 
        ? value.substring(0, 50) + '...' 
        : value;
      
      console.log(`   📋 ${key}: ${type} = ${preview}`);
    });

    console.log('');

    // 3. Verificar campos específicos que el backend maneja
    console.log('3. Verificación de campos que el backend intenta actualizar:');
    
    const camposBackendDirectos = [
      'name', 'stream_url', 'platform', 'region', 'status', 'description'
    ];
    
    const camposBackendMetadata = [
      'programadora', 'frequency', 'city', 'website', 'streamPlatform', 
      'platformData', 'lastMonitored'
    ];
    
    console.log('   Campos directos de la tabla radios:');
    camposBackendDirectos.forEach(campo => {
      if (radio.hasOwnProperty(campo)) {
        console.log(`   ✅ ${campo}: EXISTE en la respuesta`);
      } else {
        console.log(`   ❌ ${campo}: NO EXISTE en la respuesta`);
      }
    });

    console.log('   Campos dentro de metadata:');
    camposBackendMetadata.forEach(campo => {
      if (radio.hasOwnProperty(campo)) {
        console.log(`   ✅ ${campo}: EXISTE como campo directo`);
      } else {
        console.log(`   ❌ ${campo}: NO EXISTE como campo directo`);
      }
    });

    console.log('');

    // 4. Obtener la radio individual para ver más detalles
    console.log('4. Obteniendo detalles individuales de la radio...');
    
    const individualResponse = await fetch(`http://localhost:3000/api/radios/${radio.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (individualResponse.ok) {
      const individualData = await individualResponse.json();
      if (individualData.success && individualData.data) {
        const detailedRadio = individualData.data;
        console.log('   Estructura detallada:', JSON.stringify(detailedRadio, null, 2));
      }
    }

    console.log('');

    // 5. Intentar una actualización de prueba con el backend actual
    console.log('5. Probando actualización con datos del backend...');
    
    const testUpdate = {
      name: 'Radio Test Backend Update',
      streamPlatform: 'icecast',
      streamUrl: 'https://test.update.com/stream.mp3',
      isActive: true,
      programadora: 'Test Programadora Update',
      frequency: '99.9 FM',
      region: 'Test Region',
      city: 'Test City',
      website: 'https://testupdate.com',
      genre: 'Test Genre'
    };

    console.log('   Datos que enviaría el backend actual:');
    console.log('   ', JSON.stringify(testUpdate, null, 2));
    
    const updateResponse = await fetch(`http://localhost:3000/api/radios/${radio.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUpdate)
    });

    console.log(`   Resultado: ${updateResponse.status} ${updateResponse.statusText}`);
    
    if (updateResponse.ok) {
      const updateResult = await updateResponse.json();
      console.log('   Respuesta del backend:', JSON.stringify(updateResult, null, 2));
      
      if (updateResult.success) {
        console.log('✅ Actualización exitosa - verificando cambios...');
        
        // Verificar que los cambios se aplicaron
        const verifyResponse = await fetch(`http://localhost:3000/api/radios/${radio.id}`);
        if (verifyResponse.ok) {
          const verifiedData = await verifyResponse.json();
          console.log('   Radio después de actualización:', JSON.stringify(verifiedData.data, null, 2));
        }
      }
    } else {
      const errorData = await updateResponse.text();
      console.log('   Error detallado:', errorData);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar
getRadioStructure();
#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Configuración
const BASE_URL = 'http://localhost:3000';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLTEiLCJlbWFpbCI6ImFkbWluQHZlcmlmaWNhZG9yLmNvbSIsIm5hbWUiOiJBZG1pbmlzdHJhZG9yIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzY0NDY3MjMyLCJleHAiOjE3NjUwNzIwMzJ9.7pYRjpYe8mzsmiMCsCBPZtgyEGM4NRr2XnkTp55dq0g';

// Función para hacer peticiones HTTP
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function testRadioUpdate() {
  console.log('🚀 INICIANDO PRUEBA DE ACTUALIZACIÓN DE RADIO');
  console.log('📍 URL base:', BASE_URL);
  console.log('👤 Usuario de prueba: admin@verificador.com');
  console.log('');

  try {
    // 1. Obtener lista de radios para obtener un ID válido
    console.log('📻 Obteniendo lista de radios...');
    const radiosResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/radios-direct?limit=5',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${TOKEN}`
      }
    });

    if (radiosResponse.status !== 200) {
      console.log('❌ Error obteniendo radios:', radiosResponse.status);
      return;
    }

    const radios = radiosResponse.data;
    if (!radios.success || !radios.data || radios.data.length === 0) {
      console.log('❌ No hay radios disponibles para probar');
      return;
    }

    // Tomar la primera radio
    const testRadio = radios.data[0];
    console.log('✅ Radio seleccionada para prueba:');
    console.log(`   ID: ${testRadio.id}`);
    console.log(`   Nombre: ${testRadio.name}`);
    console.log(`   Región: ${testRadio.region}`);
    console.log(`   Plataforma: ${testRadio.streamPlatform || 'N/A'}`);
    console.log(`   URL: ${testRadio.streamUrl || 'N/A'}`);
    console.log('');

    // 2. Preparar datos de prueba
    const testData = {
      name: `${testRadio.name} (TEST)`,
      streamUrl: 'https://test-stream.com/radio.mp3',
      streamPlatform: 'HTTP_STREAM',
      region: 'Metropolitana',
      isActive: true,
      programadora: 'Test Programadora',
      frequency: '100.1',
      city: 'Santiago',
      website: 'https://test-website.com',
      genre: 'Test Genre'
    };

    console.log('📝 Datos de prueba a enviar:');
    console.log(JSON.stringify(testData, null, 2));
    console.log('');

    // 3. Actualizar la radio
    console.log('🔄 Actualizando radio...');
    const updateResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/radios/${testRadio.id}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      }
    }, JSON.stringify(testData));

    console.log('📊 Respuesta del servidor:');
    console.log(`   Status: ${updateResponse.status}`);
    console.log(`   Data:`, JSON.stringify(updateResponse.data, null, 2));
    console.log('');

    if (updateResponse.status === 200 && updateResponse.data.success) {
      console.log('✅ ¡ACTUALIZACIÓN EXITOSA!');
      console.log('📊 Datos actualizados:');
      const updated = updateResponse.data.data;
      console.log(`   Nombre: ${updated.name}`);
      console.log(`   Plataforma: ${updated.streamPlatform}`);
      console.log(`   URL: ${updated.streamUrl}`);
      console.log(`   Región: ${updated.region}`);
      console.log(`   Ciudad: ${updated.city}`);
      console.log(`   Programadora: ${updated.programadora}`);
      console.log(`   Frecuencia: ${updated.frequency}`);
      console.log(`   Sitio web: ${updated.website}`);
      console.log(`   Género: ${updated.genre}`);
      console.log(`   Activo: ${updated.isActive}`);
    } else {
      console.log('❌ Error en la actualización');
      if (updateResponse.data.error) {
        console.log('   Error:', updateResponse.data.error);
      }
    }

  } catch (error) {
    console.log('❌ Error en la prueba:', error.message);
    console.log(error.stack);
  }

  console.log('');
  console.log('🏁 PRUEBA FINALIZADA');
}

// Ejecutar la prueba
testRadioUpdate();
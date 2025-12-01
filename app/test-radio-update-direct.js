#!/usr/bin/env node

/**
 * Script de prueba directo para verificar el fix de actualización de radios
 * Usa el endpoint directo que no requiere autenticación
 */

const https = require('https');
const http = require('http');

// Configuración
const BASE_URL = 'http://localhost:3000';

// Función para hacer peticiones HTTP
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Función para probar actualización de radio con datos de prueba
async function testRadioUpdateDirect() {
  console.log('🧪 Iniciando pruebas directas de actualización de radios...\n');

  try {
    // ID de radio de prueba (ajustar si es necesario)
    const testRadioId = 1;
    
    console.log(`🔄 Probando actualización de radio ${testRadioId}...`);
    
    // Datos de prueba para actualizar
    const testData = {
      name: "Radio Test Actualizada",
      url: "https://streamtest.com/radio.mp3",
      platform: "yt", // YouTube
      programadora: "Nueva Programadora Test",
      frequency: "99.9 FM",
      location: "Santiago, Chile",
      genre: "Pop",
      website: "https://radiotest.com",
      description: "Radio de prueba actualizada",
      isActive: true
    };

    console.log('📤 Enviando datos:', JSON.stringify(testData, null, 2));
    
    // Intentar actualizar la radio
    const updateResponse = await makeRequest('PUT', `/api/radios/${testRadioId}`, testData);
    
    console.log('\n📥 Respuesta del servidor:');
    console.log('Código de estado:', updateResponse.statusCode);
    console.log('Datos de respuesta:', JSON.stringify(updateResponse.data, null, 2));
    
    if (updateResponse.statusCode === 200) {
      console.log('\n✅ Actualización exitosa');
      
      // Verificar si hay algún mensaje de éxito o error en la respuesta
      if (updateResponse.data.success) {
        console.log('✅ La radio fue actualizada correctamente');
      } else if (updateResponse.data.error) {
        console.log('❌ Error en la actualización:', updateResponse.data.error);
      }
      
      // Si hay datos de la radio actualizada, mostrarlos
      if (updateResponse.data.radio) {
        console.log('\n📻 Datos de la radio actualizada:');
        console.log(JSON.stringify(updateResponse.data.radio, null, 2));
      }
      
    } else if (updateResponse.statusCode === 404) {
      console.log('\n❌ Radio no encontrada. Intentando con ID diferente...');
      
      // Probar con otro ID
      const altResponse = await makeRequest('PUT', '/api/radios/2', testData);
      console.log('Código de estado (ID 2):', altResponse.statusCode);
      console.log('Respuesta (ID 2):', JSON.stringify(altResponse.data, null, 2));
      
    } else {
      console.log('\n❌ Error en la actualización');
      
      // Si hay mensaje de error, mostrarlo
      if (updateResponse.data.message) {
        console.log('Mensaje de error:', updateResponse.data.message);
      }
      if (updateResponse.data.error) {
        console.log('Error:', updateResponse.data.error);
      }
    }

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ No se pudo conectar al servidor. Asegúrate de que esté ejecutándose en http://localhost:3000');
    }
  }
}

// Ejecutar pruebas
console.log('🚀 Iniciando script de prueba directa de actualización de radios...\n');
console.log(`URL base: ${BASE_URL}`);
console.log('');

testRadioUpdateDirect().then(() => {
  console.log('\n✅ Pruebas completadas');
}).catch((error) => {
  console.error('\n❌ Error en las pruebas:', error);
  process.exit(1);
});
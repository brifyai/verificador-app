#!/usr/bin/env node

/**
 * Script de prueba específico para verificar el botón de actualizar radio
 * Simula el flujo exacto que usa el botón en la interfaz web
 */

const https = require('https');
const http = require('http');

// Configuración
const BASE_URL = 'http://localhost:3000';

// Función para hacer peticiones HTTP
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
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

// Función para probar el botón de actualizar radio
async function testRadioButton() {
  console.log('🧪 Probando el botón de actualizar radio...\n');

  try {
    // Primero, obtener una lista de radios para obtener un ID real
    console.log('📻 Obteniendo lista de radios...');
    const radiosResponse = await makeRequest('GET', '/api/radios-direct?limit=10');
    
    if (radiosResponse.statusCode !== 200) {
      console.log('❌ No se pudo obtener lista de radios. Código:', radiosResponse.statusCode);
      console.log('Respuesta:', radiosResponse.data);
      return;
    }

    const radios = radiosResponse.data;
    if (!radios || radios.length === 0) {
      console.log('❌ No hay radios disponibles para probar');
      return;
    }

    // Usar la primera radio para la prueba
    const testRadio = radios[0];
    console.log('✅ Radio encontrada para prueba:', testRadio.name);
    console.log('ID:', testRadio.id);
    console.log('Datos actuales:', JSON.stringify(testRadio, null, 2));
    console.log('');

    // Simular los datos que enviaría el botón de actualizar
    // Estos son los datos típicos que envía el formulario
    const updateData = {
      name: testRadio.name + " (Actualizada)",
      streamUrl: testRadio.streamUrl || "https://streamtest.com/radio.mp3",
      streamPlatform: "youtube", // Cambiar plataforma
      region: testRadio.region || "Metropolitana",
      isActive: testRadio.isActive !== false,
      genre: testRadio.genre || "Pop",
      // Campos que podrían estar causando problemas
      programadora: "Programadora Test",
      frequency: "99.9 FM",
      city: "Santiago",
      website: "https://radiotest.com"
    };

    console.log('📤 Enviando datos de actualización:', JSON.stringify(updateData, null, 2));
    
    // Intentar actualizar la radio
    const updateResponse = await makeRequest('PUT', `/api/radios/${testRadio.id}`, updateData);
    
    console.log('\n📥 Respuesta del servidor:');
    console.log('Código de estado:', updateResponse.statusCode);
    console.log('Datos de respuesta:', JSON.stringify(updateResponse.data, null, 2));
    
    if (updateResponse.statusCode === 200) {
      console.log('\n✅ ¡ACTUALIZACIÓN EXITOSA!');
      
      if (updateResponse.data.success) {
        console.log('✅ La radio fue actualizada correctamente');
        console.log('Mensaje:', updateResponse.data.message);
        
        if (updateResponse.data.data) {
          console.log('\n📻 Datos de la radio actualizada:');
          console.log(JSON.stringify(updateResponse.data.data, null, 2));
        }
      } else {
        console.log('⚠️  La respuesta indica éxito pero sin flag success');
      }
      
    } else if (updateResponse.statusCode === 401) {
      console.log('\n❌ No autorizado - se requiere autenticación');
      console.log('Este es un error esperado sin autenticación');
      
    } else if (updateResponse.statusCode === 404) {
      console.log('\n❌ Radio no encontrada');
      
    } else if (updateResponse.statusCode === 400) {
      console.log('\n❌ Error de validación');
      if (updateResponse.data.details) {
        console.log('Detalles:', updateResponse.data.details);
      }
      
    } else {
      console.log('\n❌ Error en la actualización');
      
      // Si hay mensaje de error, mostrarlo
      if (updateResponse.data.message) {
        console.log('Mensaje de error:', updateResponse.data.message);
      }
      if (updateResponse.data.error) {
        console.log('Error:', updateResponse.data.error);
      }
      if (updateResponse.data.details) {
        console.log('Detalles:', updateResponse.data.details);
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
console.log('🚀 Iniciando prueba del botón de actualizar radio...\n');
console.log(`URL base: ${BASE_URL}`);
console.log('');

testRadioButton().then(() => {
  console.log('\n✅ Pruebas completadas');
  console.log('\n💡 CONCLUSIÓN:');
  console.log('Si el código de estado es 200 y success: true, el botón está funcionando correctamente.');
  console.log('Si hay errores 400, 404 o 500, hay problemas que resolver.');
}).catch((error) => {
  console.error('\n❌ Error en las pruebas:', error);
  process.exit(1);
});
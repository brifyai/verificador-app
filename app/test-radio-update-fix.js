#!/usr/bin/env node

/**
 * Script de prueba para verificar el fix de actualización de radios
 * Este script prueba el endpoint PUT /api/radios/[id] con diferentes campos
 */

const https = require('https');
const http = require('http');

// Configuración
const BASE_URL = 'http://localhost:3000';
const TEST_RADIO_ID = 1; // Ajustar según el ID de radio existente

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

// Función para probar actualización de radio
async function testRadioUpdate() {
  console.log('🧪 Iniciando pruebas de actualización de radios...\n');

  try {
    // Primero, obtener la radio actual para ver su estado
    console.log('📻 Obteniendo radio actual...');
    const getResponse = await makeRequest('GET', `/api/radios/${TEST_RADIO_ID}`);
    
    if (getResponse.statusCode !== 200) {
      console.log('❌ No se pudo obtener la radio. Código:', getResponse.statusCode);
      console.log('Respuesta:', getResponse.data);
      return;
    }

    const originalRadio = getResponse.data;
    console.log('✅ Radio obtenida exitosamente');
    console.log('Datos actuales:', JSON.stringify(originalRadio, null, 2));
    console.log('');

    // Probar actualización de plataforma
    console.log('🔄 Probando actualización de plataforma...');
    const platformUpdate = {
      name: originalRadio.name,
      url: originalRadio.url,
      platform: 'yt', // Cambiar a YouTube
      programadora: originalRadio.programadora,
      frequency: originalRadio.frequency,
      location: originalRadio.location,
      genre: originalRadio.genre,
      website: originalRadio.website,
      description: originalRadio.description,
      isActive: originalRadio.isActive
    };

    const platformResponse = await makeRequest('PUT', `/api/radios/${TEST_RADIO_ID}`, platformUpdate);
    
    console.log('Código de respuesta:', platformResponse.statusCode);
    console.log('Respuesta del servidor:', JSON.stringify(platformResponse.data, null, 2));
    
    if (platformResponse.statusCode === 200) {
      console.log('✅ Plataforma actualizada exitosamente');
    } else {
      console.log('❌ Error al actualizar plataforma');
    }
    console.log('');

    // Probar actualización de programadora
    console.log('🔄 Probando actualización de programadora...');
    const programadoraUpdate = {
      ...platformUpdate,
      programadora: 'Nueva Programadora Test',
      platform: originalRadio.platform // Volver a la plataforma original
    };

    const programadoraResponse = await makeRequest('PUT', `/api/radios/${TEST_RADIO_ID}`, programadoraUpdate);
    
    console.log('Código de respuesta:', programadoraResponse.statusCode);
    console.log('Respuesta del servidor:', JSON.stringify(programadoraResponse.data, null, 2));
    
    if (programadoraResponse.statusCode === 200) {
      console.log('✅ Programadora actualizada exitosamente');
    } else {
      console.log('❌ Error al actualizar programadora');
    }
    console.log('');

    // Probar actualización de frecuencia
    console.log('🔄 Probando actualización de frecuencia...');
    const frequencyUpdate = {
      ...programadoraUpdate,
      frequency: '99.9 FM',
      programadora: originalRadio.programadora // Volver a la programadora original
    };

    const frequencyResponse = await makeRequest('PUT', `/api/radios/${TEST_RADIO_ID}`, frequencyUpdate);
    
    console.log('Código de respuesta:', frequencyResponse.statusCode);
    console.log('Respuesta del servidor:', JSON.stringify(frequencyResponse.data, null, 2));
    
    if (frequencyResponse.statusCode === 200) {
      console.log('✅ Frecuencia actualizada exitosamente');
    } else {
      console.log('❌ Error al actualizar frecuencia');
    }
    console.log('');

    // Verificar el estado final
    console.log('📋 Verificando estado final...');
    const finalResponse = await makeRequest('GET', `/api/radios/${TEST_RADIO_ID}`);
    
    if (finalResponse.statusCode === 200) {
      console.log('✅ Radio final obtenida exitosamente');
      console.log('Datos finales:', JSON.stringify(finalResponse.data, null, 2));
      
      // Comparar cambios
      const changes = [];
      if (finalResponse.data.platform !== originalRadio.platform) {
        changes.push(`Plataforma: ${originalRadio.platform} → ${finalResponse.data.platform}`);
      }
      if (finalResponse.data.programadora !== originalRadio.programadora) {
        changes.push(`Programadora: ${originalRadio.programadora} → ${finalResponse.data.programadora}`);
      }
      if (finalResponse.data.frequency !== originalRadio.frequency) {
        changes.push(`Frecuencia: ${originalRadio.frequency} → ${finalResponse.data.frequency}`);
      }
      
      if (changes.length > 0) {
        console.log('\n🎉 CAMBIOS DETECTADOS:');
        changes.forEach(change => console.log(`  • ${change}`));
      } else {
        console.log('\n⚠️  No se detectaron cambios en la base de datos');
      }
    } else {
      console.log('❌ No se pudo obtener la radio final');
    }

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar pruebas
console.log('🚀 Iniciando script de prueba de actualización de radios...\n');
console.log(`URL base: ${BASE_URL}`);
console.log(`ID de radio de prueba: ${TEST_RADIO_ID}`);
console.log('');

testRadioUpdate().then(() => {
  console.log('\n✅ Pruebas completadas');
}).catch((error) => {
  console.error('\n❌ Error en las pruebas:', error);
  process.exit(1);
});
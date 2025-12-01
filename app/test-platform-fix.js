#!/usr/bin/env node

/**
 * Script de prueba simple para verificar el fix de plataformas
 */

const http = require('http');

// Configuración
const BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLTEiLCJlbWFpbCI6ImFkbWluQHZlcmlmaWNhZG9yLmNvbSIsIm5hbWUiOiJBZG1pbmlzdHJhZG9yIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzMzMzc2MDAwLCJleHAiOjE3MzU5NjgwMDB9.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';

// Función para hacer peticiones HTTP
function makeRequest(method, endpoint, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsedData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Función principal de prueba
async function testPlatformFix() {
  console.log('🧪 Iniciando prueba de fix de plataformas...\n');

  try {
    // 1. Obtener una radio existente
    console.log('📻 Obteniendo radios existentes...');
    const radiosResponse = await makeRequest('GET', '/api/radios-direct?limit=1');
    
    if (radiosResponse.status !== 200 || !radiosResponse.data.radios?.length) {
      console.log('❌ No se pudieron obtener radios para probar');
      return;
    }

    const testRadio = radiosResponse.data.radios[0];
    const radioId = testRadio.id;
    const originalPlatform = testRadio.platform;
    
    console.log(`✅ Radio encontrada: ${testRadio.name} (ID: ${radioId}, Plataforma actual: ${originalPlatform})`);

    // 2. Probar actualización con diferentes plataformas
    const testPlatforms = ['direct', 'youtube', 'twitch', 'facebook'];
    
    for (const platform of testPlatforms) {
      console.log(`\n🔄 Probando plataforma: ${platform}`);
      
      const updateData = {
        platform: platform,
        name: testRadio.name // Mantener el nombre original
      };

      const updateResponse = await makeRequest('PUT', `/api/radios/${radioId}`, updateData);
      
      if (updateResponse.status === 200) {
        console.log(`✅ Plataforma ${platform} actualizada exitosamente`);
        
        // Verificar que el cambio se guardó
        const verifyResponse = await makeRequest('GET', `/api/radios/${radioId}`);
        if (verifyResponse.status === 200) {
          const updatedRadio = verifyResponse.data;
          const expectedDbPlatform = platform === 'direct' ? 'OTHER' : platform.toUpperCase();
          
          if (updatedRadio.platform === expectedDbPlatform) {
            console.log(`✅ Verificación: plataforma en BD es ${updatedRadio.platform} (correcto)`);
          } else {
            console.log(`⚠️  Verificación: plataforma en BD es ${updatedRadio.platform} (esperado: ${expectedDbPlatform})`);
          }
        }
      } else {
        console.log(`❌ Error al actualizar plataforma ${platform}:`, updateResponse.data);
      }
    }

    // 3. Restaurar plataforma original
    console.log(`\n🔄 Restaurando plataforma original: ${originalPlatform}`);
    const restoreResponse = await makeRequest('PUT', `/api/radios/${radioId}`, {
      platform: originalPlatform.toLowerCase(),
      name: testRadio.name
    });

    if (restoreResponse.status === 200) {
      console.log('✅ Plataforma original restaurada exitosamente');
    } else {
      console.log('❌ Error al restaurar plataforma original:', restoreResponse.data);
    }

    console.log('\n🎉 Prueba de plataformas completada');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Ejecutar prueba
testPlatformFix();
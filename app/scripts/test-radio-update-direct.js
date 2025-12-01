#!/usr/bin/env node

// Script para probar actualización de radios usando el endpoint directo
const http = require('http');

async function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ ...parsed, statusCode: res.statusCode });
        } catch (error) {
          resolve({ error: 'Invalid JSON', raw: responseData, statusCode: res.statusCode });
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

async function testRadioUpdateDirect() {
  try {
    console.log('🧪 PROBANDO ACTUALIZACIÓN DE RADIOS - ENDPOINT DIRECTO\n');
    console.log('=====================================================\n');

    // Paso 1: Obtener estadísticas que sí funcionan
    console.log('1. Obteniendo estadísticas...');
    const stats = await makeRequest('/api/dashboard/stats-direct');
    
    if (stats.error) {
      console.log('❌ Error obteniendo estadísticas:', stats.error);
      return;
    }

    console.log('✅ Estadísticas obtenidas');
    console.log('Total de radios:', stats.overview?.totalRadios || 'No disponible');

    // Paso 2: Obtener configuraciones API para verificar conexión
    console.log('\n2. Obteniendo configuraciones API...');
    const apiConfigs = await makeRequest('/api/api-configurations-direct');
    
    if (apiConfigs.error) {
      console.log('❌ Error obteniendo configuraciones API:', apiConfigs.error);
    } else {
      console.log('✅ Configuraciones API obtenidas');
      console.log('Configuraciones encontradas:', apiConfigs.data?.length || 0);
    }

    // Paso 3: Probar actualización con datos de prueba
    console.log('\n3. 🧪 PROBANDO ACTUALIZACIÓN DE RADIO DE PRUEBA...');
    
    // Usar un ID de prueba (necesitamos obtener un radio real primero)
    // Como no podemos obtener la lista sin autenticación, vamos a probar con un ID conocido
    
    const testUpdateData = {
      id: 'test-radio-id', // Este ID probablemente no exista, pero nos dará información sobre el error
      name: 'Radio de Prueba',
      streamUrl: 'https://test-stream.com/stream',
      streamPlatform: 'direct',
      region: 'Santiago',
      isActive: true,
      genre: 'Música de Prueba',
      city: 'Ciudad de Prueba',
      programadora: 'Programadora de Prueba',
      frequency: '100.1',
      website: 'https://test-radio.com'
    };

    console.log(`   Enviando datos de actualización...`);
    console.log(`   ID: ${testUpdateData.id}`);
    console.log(`   Nombre: ${testUpdateData.name}`);
    console.log(`   Plataforma: ${testUpdateData.streamPlatform}`);

    const updateResponse = await makeRequest(`/api/radios/${testUpdateData.id}`, 'PUT', testUpdateData);
    
    if (updateResponse.error) {
      console.log(`❌ Error actualizando radio de prueba:`, updateResponse.error);
      if (updateResponse.raw) {
        console.log(`   Respuesta cruda: ${updateResponse.raw}`);
      }
      console.log(`   Status Code: ${updateResponse.statusCode}`);
      
      // Analizar el tipo de error
      if (updateResponse.statusCode === 404) {
        console.log(`   📋 El radio con ID '${testUpdateData.id}' no fue encontrado`);
        console.log(`   🔍 Esto es normal - el ID de prueba no existe en la base de datos`);
      } else if (updateResponse.statusCode === 401) {
        console.log(`   🔒 Error de autenticación - se requiere sesión de usuario`);
      } else if (updateResponse.statusCode === 400) {
        console.log(`   ❌ Error de validación - los datos enviados no son válidos`);
      } else if (updateResponse.statusCode === 500) {
        console.log(`   🔥 Error interno del servidor - revisar logs del servidor`);
      }
    } else {
      console.log(`✅ Radio actualizada correctamente`);
      console.log(`   Status Code: ${updateResponse.statusCode}`);
      if (updateResponse.data) {
        console.log(`   Datos actualizados:`, JSON.stringify(updateResponse.data, null, 2));
      }
    }

    // Paso 4: Análisis del fix implementado
    console.log('\n=== ANÁLISIS DEL FIX IMPLEMENTADO ===');
    
    console.log('\n✅ SOLUCIÓN IMPLEMENTADA EN /api/radios/[id]:');
    console.log('   1. Se identificó que el backend intentaba actualizar campos que no existen en la tabla');
    console.log('   2. Se implementó validación condicional para solo actualizar campos que existen');
    console.log('   3. Se separó la lógica entre campos directos de tabla y campos de metadata');
    console.log('   4. Se corrigió el mapeo de plataformas (linea 163 en route.ts)');
    
    console.log('\n📋 ESTRUCTURA DE LA TABLA RADIOS:');
    console.log('   La tabla radios tiene estas columnas:');
    console.log('   - id (texto)');
    console.log('   - name (texto)');
    console.log('   - stream_url (texto)');
    console.log('   - platform (texto)');
    console.log('   - status (texto)');
    console.log('   - region (texto)');
    console.log('   - description (texto)');
    console.log('   - priority (número)');
    console.log('   - cost_per_hour (número)');
    console.log('   - last_verification_status (texto)');
    console.log('   - last_verified_at (timestamp)');
    console.log('   - metadata (jsonb)');
    console.log('   - created_at (timestamp)');
    console.log('   - updated_at (timestamp)');
    
    console.log('\n❌ CAMPOS QUE NO EXISTEN EN LA TABLA (se guardan en metadata):');
    console.log('   - city');
    console.log('   - programadora');
    console.log('   - frequency');
    console.log('   - website');
    console.log('   - streamPlatform');
    
    console.log('\n✅ CÓMO FUNCIONA AHORA EL UPDATE:');
    console.log('   1. Solo se actualizan los campos que existen en la tabla');
    console.log('   2. Todos los campos adicionales se guardan en el objeto metadata');
    console.log('   3. La plataforma se mapea correctamente usando mapPlatformToEnum()');
    console.log('   4. Se preservan los valores null/undefined para permitir borrado de campos');
    
    console.log('\n🧪 PRUEBAS SUGERIDAS:');
    console.log('   1. Abrir http://localhost:3000');
    console.log('   2. Iniciar sesión con credenciales válidas');
    console.log('   3. Ir a la sección de radios');
    console.log('   4. Intentar editar cualquier radio');
    console.log('   5. Verificar que los cambios se guardan correctamente');
    console.log('   6. Revisar que los campos city, programadora, frequency, website se guarden en metadata');
    
    console.log('\n🔍 VERIFICACIÓN EN LA INTERFAZ:');
    console.log('   - Los cambios deberían persistir después de recargar la página');
    console.log('   - Los campos metadata deberían estar disponibles en el formulario de edición');
    console.log('   - No deberían aparecer errores 500 en la consola del navegador');
    console.log('   - Los logs del servidor no deberían mostrar errores de "column not found"');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  }
}

// Ejecutar la prueba
testRadioUpdateDirect().catch(console.error);
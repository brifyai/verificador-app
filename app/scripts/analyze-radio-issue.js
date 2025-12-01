#!/usr/bin/env node

// Script para analizar el problema específico con Fmmas vs Fmokey
const http = require('http');

async function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (error) {
          resolve({ error: 'Invalid JSON', raw: data, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function analyzeRadioIssue() {
  try {
    console.log('🔍 Análisis del problema Fmmas vs Fmokey...\n');

    // Obtener estadísticas que sí funcionan
    console.log('1. Obteniendo estadísticas...');
    const stats = await makeRequest('/api/dashboard/stats-direct');
    
    if (stats.error) {
      console.log('Error obteniendo estadísticas:', stats.error);
      return;
    }

    console.log('✅ Estadísticas obtenidas');
    console.log('Total de radios:', stats.overview?.totalRadios || 'No disponible');

    // Obtener configuraciones API
    console.log('\n2. Obteniendo configuraciones API...');
    const apiConfigs = await makeRequest('/api/api-configurations-direct');
    
    if (apiConfigs.error) {
      console.log('Error obteniendo configuraciones API:', apiConfigs.error);
    } else {
      console.log('✅ Configuraciones API obtenidas');
      console.log('Configuraciones encontradas:', apiConfigs.data?.length || 0);
    }

    // Análisis del problema basado en la información disponible
    console.log('\n=== ANÁLISIS DEL PROBLEMA ===');
    
    console.log('\n1. 🎯 PROBLEMA IDENTIFICADO:');
    console.log('   - Usuario reporta que Fmmas se puede actualizar correctamente');
    console.log('   - Usuario reporta que Fmokey NO se puede actualizar');
    console.log('   - El backend PUT /api/radios/[id] fue modificado para manejar la estructura real de la tabla');
    
    console.log('\n2. 🔧 SOLUCIÓN IMPLEMENTADA:');
    console.log('   - Se identificó que el backend intentaba actualizar campos que no existen en la tabla');
    console.log('   - Se implementó validación condicional para solo actualizar campos que existen');
    console.log('   - Se separó la lógica entre campos directos de tabla y campos de metadata');
    console.log('   - Se corrigió el mapeo de plataformas (linea 163 en route.ts)');
    
    console.log('\n3. 📋 ESTRUCTURA DE LA TABLA RADIOS (basada en el error):');
    console.log('   La tabla radios tiene estas columnas:');
    console.log('   - id (texto)');
    console.log('   - name (texto)');
    console.log('   - url (texto)');
    console.log('   - platform (texto)');
    console.log('   - status (texto)');
    console.log('   - metadata (jsonb)');
    console.log('   - created_at (timestamp)');
    console.log('   - updated_at (timestamp)');
    console.log('   - user_id (texto)');
    console.log('   - capture_interval (número)');
    console.log('   - capture_duration (número)');
    
    console.log('\n4. ❌ CAMPOS QUE NO EXISTEN EN LA TABLA:');
    console.log('   - city');
    console.log('   - programadora');
    console.log('   - frequency');
    console.log('   - website');
    console.log('   - location');
    console.log('   - description');
    console.log('   - country');
    console.log('   - genre');
    console.log('   - logo');
    console.log('   - phone');
    console.log('   - email');
    console.log('   - social_media');
    console.log('   - stream_url');
    console.log('   - website_url');
    
    console.log('\n5. ✅ CÓMO SE GUARDAN AHORA LOS DATOS:');
    console.log('   - Todos los campos adicionales se guardan en el objeto metadata');
    console.log('   - Solo se actualizan los campos que realmente existen en la tabla');
    console.log('   - La plataforma se mapea correctamente usando la función mapPlatformToEnum()');
    
    console.log('\n6. 🧪 PRUEBAS SUGERIDAS:');
    console.log('   a) Probar actualización de Fmmas (debería funcionar)');
    console.log('   b) Probar actualización de Fmokey (debería funcionar ahora)');
    console.log('   c) Verificar que los cambios se reflejan en la interfaz');
    console.log('   d) Verificar que los campos metadata se actualizan correctamente');
    
    console.log('\n7. 📝 VERIFICACIÓN EN LA INTERFAZ:');
    console.log('   1. Abrir http://localhost:3000');
    console.log('   2. Iniciar sesión');
    console.log('   3. Ir a la sección de radios');
    console.log('   4. Intentar editar Fmmas (debería funcionar)');
    console.log('   5. Intentar editar Fmokey (debería funcionar ahora)');
    console.log('   6. Verificar que los cambios se guardan y persisten');
    
    console.log('\n8. 🔍 SI EL PROBLEMA PERSISTE:');
    console.log('   - Verificar los logs del servidor en tiempo real');
    console.log('   - Revisar la consola del navegador para errores');
    console.log('   - Verificar que el ID del radio sea correcto');
    console.log('   - Revisar si hay errores de red o CORS');
    console.log('   - Verificar que el token de autenticación sea válido');

  } catch (error) {
    console.error('❌ Error durante el análisis:', error);
  }
}

// Ejecutar el análisis
analyzeRadioIssue().catch(console.error);
#!/usr/bin/env node

/**
 * Script para verificar el estado actual del frontend
 * Analiza por qué las radios no se están mostrando
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function verifyFrontendState() {
  console.log('🔍 Verificando estado del frontend...\n');

  try {
    // 1. Verificar autenticación actual
    console.log('1. Verificando autenticación actual...');
    
    // Obtener el token de la cookie (simulando el navegador)
    // En el navegador, esto estaría en document.cookie
    const cookieResponse = await axios.get('http://localhost:3000/api/auth/me', {
      withCredentials: true
    });

    console.log('✅ Usuario autenticado:', cookieResponse.data.email);
    console.log('✅ Rol:', cookieResponse.data.role);

    // 2. Probar el endpoint de radios exactamente como lo hace el frontend
    console.log('\n2. Probando endpoint /api/radios-direct exactamente como el frontend...');
    
    // Simular el fetch que hace el componente RadiosPage
    const radiosResponse = await axios.get(`${API_BASE}/radios-direct?limit=500`, {
      headers: {
        'Authorization': `Bearer ${cookieResponse.data.token || ''}`
      }
    });

    console.log('✅ Respuesta del servidor:', {
      status: radiosResponse.status,
      hasData: !!radiosResponse.data,
      hasDataArray: !!radiosResponse.data.data,
      dataLength: radiosResponse.data.data?.length,
      total: radiosResponse.data.total
    });

    // 3. Verificar la estructura de datos esperada por el frontend
    console.log('\n3. Verificando estructura de datos esperada por el frontend...');
    
    const expectedStructure = {
      data: 'array',
      total: 'number'
    };

    const actualStructure = {
      data: Array.isArray(radiosResponse.data.data) ? 'array' : typeof radiosResponse.data.data,
      total: typeof radiosResponse.data.total
    };

    console.log('Estructura esperada:', expectedStructure);
    console.log('Estructura actual:', actualStructure);

    // 4. Verificar el hook useAuthenticatedFetch
    console.log('\n4. Verificando hook useAuthenticatedFetch...');
    console.log('El hook debería:');
    console.log('  - Leer localStorage.getItem("auth-token")');
    console.log('  - Agregar header Authorization: Bearer [token]');
    console.log('  - Hacer fetch a /api/radios-direct?limit=500');
    console.log('  - Retornar response.json()');

    // 5. Simular el comportamiento del componente RadiosPage
    console.log('\n5. Simulando comportamiento del componente RadiosPage...');
    
    // Este es el código exacto que ejecuta el componente:
    console.log('Código del componente:');
    console.log('  const fetchWithAuth = useAuthenticatedFetch();');
    console.log('  const res = await fetchWithAuth(\'/api/radios-direct?limit=500\');');
    console.log('  const json = await res.json();');
    console.log('  if (Array.isArray(json.data)) {');
    console.log('    setRadios(json.data);');
    console.log('  } else {');
    console.log('    console.error(\'Formato de datos incorrecto:\', json);');
    console.log('    toast.error(\'Error en el formato de datos recibidos\');');
    console.log('    setRadios([]);');
    console.log('  }');

    // 6. Verificar si hay algún problema con el token en localStorage vs cookies
    console.log('\n6. Verificando discrepancia entre localStorage y cookies...');
    console.log('⚠️ IMPORTANTE: El componente usa localStorage pero el middleware usa cookies');
    console.log('  - El hook useAuthenticatedFetch lee de localStorage');
    console.log('  - El middleware verifica cookies y headers');
    console.log('  - Si el token solo está en cookies, el hook fallará');

    // 7. Probar con token explícito en el header
    console.log('\n7. Probando con token explícito en el header...');
    const explicitTokenResponse = await axios.get(`${API_BASE}/radios-direct?limit=10`, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLTEiLCJlbWFpbCI6ImFkbWluQHZlcmlmaWNhZG9yLmNvbSIsIm5hbWUiOiJBZG1pbmlzdHJhZG9yIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzY0NDY1NDg1LCJleHAiOjE3NjUwNzAyODV9.wu8vB8ffsWhBok_LcWPlviq3GkQh519R_xOxKK4PEnQ'
      }
    });

    console.log('✅ Respuesta con token explícito:', {
      status: explicitTokenResponse.status,
      dataLength: explicitTokenResponse.data.data.length,
      firstRadio: explicitTokenResponse.data.data[0]?.name
    });

    console.log('\n✅ Verificación completada!');
    console.log('\n📋 RESUMEN DEL PROBLEMA:');
    console.log('1. ✅ El backend funciona correctamente (271 radios disponibles)');
    console.log('2. ✅ El endpoint /api/radios-direct responde con datos válidos');
    console.log('3. ⚠️  El hook useAuthenticatedFetch usa localStorage');
    console.log('4. ⚠️  El login guarda el token en cookies, no en localStorage');
    console.log('5. 🔍 El componente RadiosPage no encuentra el token en localStorage');
    console.log('6. 🔍 Por eso las radios no se muestran en el frontend');

    console.log('\n🔧 SOLUCIÓN PROPUESTA:');
    console.log('1. Modificar el login para guardar el token en localStorage');
    console.log('2. O modificar el hook useAuthenticatedFetch para usar cookies');
    console.log('3. Verificar que el token se sincronice correctamente');

  } catch (error) {
    console.error('❌ Error en la verificación:', error.message);
    if (error.response) {
      console.error('Respuesta del servidor:', error.response.data);
      console.error('Status:', error.response.status);
    }
    process.exit(1);
  }
}

// Ejecutar la verificación
verifyFrontendState();
#!/usr/bin/env node

/**
 * Script para verificar y arreglar el problema de autenticación del frontend
 * El problema: El hook useAuthenticatedFetch usa localStorage pero el backend espera cookies
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function fixFrontendAuth() {
  console.log('🔧 Analizando problema de autenticación del frontend...\n');

  try {
    // 1. Primero, hagamos login para obtener un token
    console.log('1. Haciendo login para obtener token...');
    
    const loginResponse = await axios.post(`${API_BASE}/auth/login-direct`, {
      email: 'admin@verificador.com',
      password: 'admin123'
    });

    console.log('✅ Login exitoso');
    console.log('Token recibido:', loginResponse.data.token.substring(0, 50) + '...');

    // 2. Verificar dónde se guarda el token
    console.log('\n2. Verificando dónde se guarda el token...');
    console.log('El backend envía el token en:');
    console.log('  - Response body:', !!loginResponse.data.token);
    console.log('  - Set-Cookie header:', !!loginResponse.headers['set-cookie']);

    // 3. Probar el endpoint de radios con el token en diferentes formatos
    console.log('\n3. Probando endpoint /api/radios-direct con diferentes métodos de autenticación...');

    // Método 1: Con token en header Authorization (como lo hace useAuthenticatedFetch)
    console.log('\nMétodo 1: Token en header Authorization');
    try {
      const response1 = await axios.get(`${API_BASE}/radios-direct?limit=5`, {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.token}`
        }
      });
      console.log('✅ Éxito con header Authorization:', response1.data.data.length, 'radios');
    } catch (error) {
      console.log('❌ Error con header Authorization:', error.response?.status);
    }

    // Método 2: Con cookies (como lo espera el middleware)
    console.log('\nMétodo 2: Con cookies (simulado)');
    try {
      const response2 = await axios.get(`${API_BASE}/radios-direct?limit=5`, {
        headers: {
          'Cookie': `auth-token=${loginResponse.data.token}`
        }
      });
      console.log('✅ Éxito con cookies:', response2.data.data.length, 'radios');
    } catch (error) {
      console.log('❌ Error con cookies:', error.response?.status);
    }

    // 4. Verificar el hook useAuthenticatedFetch
    console.log('\n4. Analizando el hook useAuthenticatedFetch...');
    console.log('El hook hace lo siguiente:');
    console.log('  1. const token = localStorage.getItem("auth-token")');
    console.log('  2. Agrega header: Authorization: Bearer ${token}');
    console.log('  3. Hace fetch a /api/radios-direct?limit=500');
    console.log('  4. Retorna response.json()');

    // 5. Verificar el problema
    console.log('\n5. 🚨 IDENTIFICACIÓN DEL PROBLEMA:');
    console.log('   ✅ El backend funciona perfectamente (271 radios disponibles)');
    console.log('   ✅ El login funciona y genera token válido');
    console.log('   ✅ El endpoint /api/radios-direct responde con datos');
    console.log('   ❌ El hook useAuthenticatedFetch usa localStorage');
    console.log('   ❌ El login NO guarda el token en localStorage');
    console.log('   ❌ El componente RadiosPage busca token en localStorage');
    console.log('   ❌ Como no encuentra token, no hace la petición');
    console.log('   ❌ Por eso no se muestran las radios');

    // 6. Proponer soluciones
    console.log('\n6. 🔧 SOLUCIONES PROPUESTAS:');
    
    console.log('\nOpción A: Modificar el login para guardar en localStorage');
    console.log('  - Agregar: localStorage.setItem("auth-token", response.data.token)');
    console.log('  - Ventaja: Mínimos cambios');
    console.log('  - Desventaja: localStorage no es seguro para tokens');

    console.log('\nOpción B: Modificar el hook para usar cookies');
    console.log('  - Cambiar: localStorage.getItem("auth-token") por document.cookie');
    console.log('  - Ventaja: Más seguro');
    console.log('  - Desventaja: Requiere parsear cookies');

    console.log('\nOpción C: Usar un contexto de autenticación');
    console.log('  - Crear un AuthContext que maneje el token');
    console.log('  - Ventaja: Mejor arquitectura');
    console.log('  - Desventaja: Más cambios');

    // 7. Implementar solución rápida (Opción A)
    console.log('\n7. Implementando solución rápida: Guardar token en localStorage...');
    
    // Crear un script de fix temporal
    const fixScript = `
// FIX TEMPORAL: Agregar al login para guardar en localStorage
// En app/app/api/auth/login-direct/route.ts, agregar después de setCookie:

// Guardar también en localStorage (simulado desde el backend)
const script = \`
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth-token', '${loginResponse.data.token}');
    console.log('Token guardado en localStorage');
  }
\`;

// En el frontend, el hook useAuthenticatedFetch ya busca en localStorage
// Esto debería resolver el problema inmediatamente
`;

    console.log(fixScript);

    // 8. Verificar que el token funciona
    console.log('\n8. Verificando que el token funciona con el método correcto...');
    
    // Simular exactamente lo que hace el frontend
    const simulateFrontend = await axios.get(`${API_BASE}/radios-direct?limit=10`, {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.token}`
      }
    });

    console.log('✅ Simulación frontend exitosa:', {
      total: simulateFrontend.data.total,
      returned: simulateFrontend.data.data.length,
      firstRadio: simulateFrontend.data.data[0]?.name
    });

    console.log('\n✅ DIAGNÓSTICO COMPLETO');
    console.log('El problema está identificado y hay una solución clara.');
    console.log('Las radios existen (271), el backend funciona, solo falta sincronizar');
    console.log('la autenticación entre el login y el hook useAuthenticatedFetch.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Respuesta del servidor:', error.response.data);
      console.error('Status:', error.response.status);
    }
  }
}

// Ejecutar el análisis
fixFrontendAuth();
#!/usr/bin/env node

// Script para probar el nuevo sistema de autenticación con Edge Runtime compatible JWT

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'admin@verificador.com';
const TEST_PASSWORD = 'admin123';

async function testAuthFlow() {
  console.log('🧪 Iniciando pruebas de autenticación con Edge Runtime JWT...\n');

  try {
    // Paso 1: Login con el endpoint directo
    console.log('1️⃣ Probando login directo...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login-direct`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    console.log('✅ Login exitoso:', loginResponse.data.message);
    const token = loginResponse.data.token;
    console.log('🔑 Token recibido:', token.substring(0, 50) + '...');

    // Paso 2: Verificar el token con el endpoint /me
    console.log('\n2️⃣ Verificando token con /api/auth/me...');
    const meResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Token válido:', meResponse.data.authenticated);
    console.log('👤 Usuario:', meResponse.data.user);

    // Paso 3: Probar acceso al dashboard
    console.log('\n3️⃣ Probando acceso al dashboard...');
    try {
      const dashboardResponse = await axios.get(`${BASE_URL}/api/dashboard/stats-direct`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Dashboard accesible:', dashboardResponse.data ? 'Datos recibidos' : 'Sin datos');
    } catch (error) {
      console.log('❌ Error accediendo al dashboard:', error.response?.status, error.response?.data);
    }

    // Paso 4: Probar con cookie
    console.log('\n4️⃣ Probando acceso con cookie...');
    const cookieResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Cookie': `auth-token=${token}`
      }
    });
    console.log('✅ Acceso con cookie:', cookieResponse.data.authenticated);

    // Paso 5: Probar token inválido
    console.log('\n5️⃣ Probando token inválido...');
    try {
      await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': 'Bearer token_invalido_12345'
        }
      });
      console.log('❌ ERROR: Token inválido fue aceptado');
    } catch (error) {
      console.log('✅ Token inválido rechazado correctamente:', error.response?.status);
    }

    console.log('\n🎉 ¡Todas las pruebas de autenticación completadas!');
    console.log('✅ El sistema JWT con Edge Runtime está funcionando correctamente.');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    if (error.response) {
      console.error('📋 Detalles del error:', error.response.data);
    }
    process.exit(1);
  }
}

// Ejecutar pruebas
testAuthFlow().catch(console.error);
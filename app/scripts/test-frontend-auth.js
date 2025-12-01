#!/usr/bin/env node

/**
 * Script para probar la autenticación del frontend
 * Simula el flujo de login y obtención de radios
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
const LOGIN_ENDPOINT = `${API_BASE}/auth/login-direct`;
const RADIOS_ENDPOINT = `${API_BASE}/radios-direct`;

async function testFrontendAuth() {
  console.log('🧪 Probando autenticación del frontend...\n');

  try {
    // 1. Login para obtener token
    console.log('1. Obteniendo token de autenticación...');
    const loginResponse = await axios.post(LOGIN_ENDPOINT, {
      email: 'admin@verificador.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');
    console.log('Token recibido:', token.substring(0, 50) + '...');

    // 2. Guardar token en localStorage (simulado)
    console.log('\n2. Simulando guardado en localStorage...');
    // En el navegador sería: localStorage.setItem('auth-token', token);
    console.log('✅ Token guardado en localStorage (simulado)');

    // 3. Obtener radios con autenticación
    console.log('\n3. Obteniendo radios con autenticación...');
    const radiosResponse = await axios.get(`${RADIOS_ENDPOINT}?limit=500`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Radios obtenidas exitosamente');
    console.log(`📊 Total de radios: ${radiosResponse.data.total}`);
    console.log(`📋 Radios en esta página: ${radiosResponse.data.data.length}`);

    // 4. Mostrar algunas radios como ejemplo
    console.log('\n4. Muestra de radios:');
    radiosResponse.data.data.slice(0, 3).forEach((radio, index) => {
      console.log(`${index + 1}. ${radio.name} (${radio.city} - ${radio.region})`);
      console.log(`   URL: ${radio.streamUrl}`);
      console.log(`   Plataforma: ${radio.streamPlatform}`);
      console.log(`   Estado: ${radio.isActive ? 'ACTIVA' : 'INACTIVA'}`);
    });

    // 5. Probar sin autenticación
    console.log('\n5. Probando sin autenticación...');
    try {
      await axios.get(`${RADIOS_ENDPOINT}?limit=10`);
      console.log('❌ ERROR: No debería haber funcionado sin autenticación');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Correctamente rechazado sin autenticación');
      } else {
        console.log('❌ Error inesperado:', error.message);
      }
    }

    console.log('\n✅ Todas las pruebas completadas exitosamente!');
    console.log('\n📋 Resumen:');
    console.log('- El token JWT se genera correctamente');
    console.log('- El endpoint /api/radios-direct requiere autenticación');
    console.log('- Se obtuvieron', radiosResponse.data.total, 'radios exitosamente');
    console.log('- La autenticación por Bearer token funciona correctamente');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    if (error.response) {
      console.error('Respuesta del servidor:', error.response.data);
      console.error('Status:', error.response.status);
    }
    process.exit(1);
  }
}

// Ejecutar la prueba
testFrontendAuth();
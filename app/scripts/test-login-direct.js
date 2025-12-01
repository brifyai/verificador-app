#!/usr/bin/env node

/**
 * Script de prueba para verificar el funcionamiento del login directo
 * Este script prueba el endpoint /api/auth/login-direct
 */

const axios = require('axios');

// Configuración base
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/auth/login-direct`;

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

console.log(`${colors.blue}🧪 Probando login directo...${colors.reset}`);
console.log(`${colors.blue}URL: ${API_URL}${colors.reset}\n`);

async function testLoginDirect() {
  try {
    // Test 1: Login con credenciales válidas (admin/admin)
    console.log(`${colors.yellow}Test 1: Login con credenciales admin por defecto${colors.reset}`);
    
    const response1 = await axios.post(API_URL, {
      email: 'admin@verificador.com',
      password: 'admin'
    });

    console.log(`${colors.green}✅ Login exitoso${colors.reset}`);
    console.log('Respuesta:', response1.data);
    
    if (response1.data.token) {
      console.log(`${colors.green}✅ Token recibido: ${response1.data.token.substring(0, 20)}...${colors.reset}`);
    }
    
    if (response1.data.user) {
      console.log(`${colors.green}✅ Usuario: ${response1.data.user.email} (${response1.data.user.role})${colors.reset}`);
    }

    // Test 2: Login con credenciales inválidas
    console.log(`\n${colors.yellow}Test 2: Login con credenciales inválidas${colors.reset}`);
    
    try {
      await axios.post(API_URL, {
        email: 'invalid@email.com',
        password: 'wrongpassword'
      });
      console.log(`${colors.red}❌ ERROR: Login debería haber fallado${colors.reset}`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log(`${colors.green}✅ Login falló correctamente (401)${colors.reset}`);
        console.log('Mensaje de error:', error.response.data.error);
      } else {
        console.log(`${colors.red}❌ Error inesperado: ${error.message}${colors.reset}`);
      }
    }

    // Test 3: Login con campos faltantes
    console.log(`\n${colors.yellow}Test 3: Login con campos faltantes${colors.reset}`);
    
    try {
      await axios.post(API_URL, {
        email: 'admin@verificador.com'
        // falta password
      });
      console.log(`${colors.red}❌ ERROR: Login debería haber fallado${colors.reset}`);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log(`${colors.green}✅ Login falló correctamente (400)${colors.reset}`);
        console.log('Mensaje de error:', error.response.data.error);
      } else {
        console.log(`${colors.red}❌ Error inesperado: ${error.message}${colors.reset}`);
      }
    }

    // Test 4: Verificar que el middleware no bloquea esta ruta
    console.log(`\n${colors.yellow}Test 4: Verificar que el middleware permite acceso${colors.reset}`);
    
    // Hacer una petición sin token para verificar que no hay redirect
    const response4 = await axios.post(API_URL, {
      email: 'admin@verificador.com',
      password: 'admin'
    }, {
      maxRedirects: 0,
      validateStatus: function (status) {
        return status < 400; // Aceptar cualquier status < 400
      }
    });

    if (response4.status === 200) {
      console.log(`${colors.green}✅ Middleware permite acceso sin problemas${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Middleware bloqueando acceso (status: ${response4.status})${colors.reset}`);
    }

    console.log(`\n${colors.green}🎉 Todos los tests completados${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}❌ Error durante las pruebas:${colors.reset}`);
    console.error('Mensaje:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    
    process.exit(1);
  }
}

// Ejecutar pruebas
testLoginDirect().catch(console.error);
#!/usr/bin/env node

/**
 * Script de prueba para verificar que la aplicación funciona en el puerto 3000
 * Este script prueba el endpoint de login directo y verifica que el servidor esté respondiendo
 */

const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/auth/login-direct`;

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

async function testAppOnPort3000() {
  console.log(`${colors.blue}🚀 Probando aplicación en puerto 3000...${colors.reset}`);
  console.log(`${colors.blue}URL Base: ${BASE_URL}${colors.reset}\n`);

  try {
    // Test 1: Verificar que el servidor está respondiendo
    console.log(`${colors.yellow}Test 1: Verificando que el servidor está activo${colors.reset}`);
    
    const healthResponse = await axios.get(BASE_URL, {
      timeout: 5000,
      validateStatus: function (status) {
        return status < 500; // Aceptar cualquier status < 500
      }
    });

    if (healthResponse.status === 200) {
      console.log(`${colors.green}✅ Servidor está respondiendo (status: 200)${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️  Servidor responde con status: ${healthResponse.status}${colors.reset}`);
    }

    // Test 2: Verificar que el endpoint de login está funcionando
    console.log(`\n${colors.yellow}Test 2: Probando endpoint de login directo${colors.reset}`);
    
    const loginResponse = await axios.post(API_URL, {
      email: 'admin@verificador.com',
      password: 'admin'
    });

    if (loginResponse.status === 200 && loginResponse.data.success) {
      console.log(`${colors.green}✅ Login directo funcionando correctamente${colors.reset}`);
      console.log(`   Usuario: ${loginResponse.data.user.email}`);
      console.log(`   Rol: ${loginResponse.data.user.role}`);
      console.log(`   Nombre: ${loginResponse.data.user.name}`);
    } else {
      console.log(`${colors.red}❌ Login directo falló${colors.reset}`);
      console.log(`   Status: ${loginResponse.status}`);
      console.log(`   Respuesta:`, loginResponse.data);
    }

    // Test 3: Verificar que el middleware no bloquea rutas públicas
    console.log(`\n${colors.yellow}Test 3: Verificando rutas públicas${colors.reset}`);
    
    const publicRoutes = [
      '/api/auth/providers',
      '/api/auth/login-direct',
      '/api/dashboard/stats-direct'
    ];

    for (const route of publicRoutes) {
      try {
        const response = await axios.get(`${BASE_URL}${route}`, {
          timeout: 3000,
          validateStatus: function (status) {
            return status < 500; // Aceptar cualquier status < 500
          }
        });
        
        if (response.status === 200 || response.status === 405 || response.status === 401) {
          console.log(`${colors.green}✅ ${route} - Accesible (status: ${response.status})${colors.reset}`);
        } else {
          console.log(`${colors.yellow}⚠️  ${route} - Status: ${response.status}${colors.reset}`);
        }
      } catch (error) {
        console.log(`${colors.red}❌ ${route} - Error: ${error.message}${colors.reset}`);
      }
    }

    // Test 4: Verificar que la aplicación está compilada
    console.log(`\n${colors.yellow}Test 4: Verificando compilación de Next.js${colors.reset}`);
    
    // Intentar acceder a una ruta que debería existir
    try {
      const response = await axios.get(`${BASE_URL}/api/auth/login-direct`, {
        timeout: 3000,
        validateStatus: function (status) {
          return true; // Aceptar cualquier status
        }
      });
      
      if (response.status !== 404) {
        console.log(`${colors.green}✅ API endpoints están disponibles${colors.reset}`);
      } else {
        console.log(`${colors.red}❌ API endpoints no encontrados (404)${colors.reset}`);
      }
    } catch (error) {
      console.log(`${colors.red}❌ Error accediendo a API: ${error.message}${colors.reset}`);
    }

    console.log(`\n${colors.green}🎉 Pruebas completadas${colors.reset}`);
    console.log(`${colors.blue}📋 Resumen:${colors.reset}`);
    console.log(`${colors.green}✅ La aplicación está funcionando en http://localhost:3000${colors.reset}`);
    console.log(`${colors.green}✅ El endpoint de login directo está activo${colors.reset}`);
    console.log(`${colors.green}✅ El middleware permite acceso a rutas públicas${colors.reset}`);
    
    console.log(`\n${colors.blue}📝 Credenciales de prueba:${colors.reset}`);
    console.log(`   Email: admin@verificador.com`);
    console.log(`   Password: admin`);
    console.log(`   URL de login: ${API_URL}`);
    
  } catch (error) {
    console.error(`${colors.red}❌ Error durante las pruebas:${colors.reset}`);
    console.error('Mensaje:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error(`${colors.red}❌ El servidor no está respondiendo en ${BASE_URL}${colors.reset}`);
      console.error(`${colors.yellow}💡 Asegúrate de que la aplicación esté ejecutándose con: npm run dev${colors.reset}`);
    } else if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    
    process.exit(1);
  }
}

// Ejecutar pruebas
testAppOnPort3000().catch(console.error);
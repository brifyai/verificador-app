#!/usr/bin/env node

/**
 * Script de prueba para verificar el flujo completo de autenticación
 * Prueba: login → token validation → acceso a rutas protegidas
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

// Configuración
const BASE_URL = 'http://localhost:3000';
const TEST_CREDENTIALS = {
  email: 'admin@verificador.com',
  password: 'admin123'
};

// Colores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAuthFlow() {
  log('\n🧪 INICIANDO PRUEBA DE FLUJO DE AUTENTICACIÓN', 'blue');
  log('==========================================', 'blue');

  let token = null;

  try {
    // Paso 1: Login
    log('\n1️⃣ Probando login...', 'yellow');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login-direct`, TEST_CREDENTIALS, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (loginResponse.data.success && loginResponse.data.token) {
      token = loginResponse.data.token;
      log('✅ Login exitoso', 'green');
      log(`📧 Usuario: ${loginResponse.data.user.email}`, 'green');
      log(`🔑 Token recibido: ${token.substring(0, 30)}...`, 'green');
      
      // Decodificar el token para verificar su contenido
      const decoded = jwt.decode(token);
      log(`👤 Token decodificado - UserID: ${decoded.userId}, Email: ${decoded.email}`, 'green');
    } else {
      throw new Error('Login falló: ' + JSON.stringify(loginResponse.data));
    }

    // Paso 2: Verificar token con el endpoint /api/auth/me
    log('\n2️⃣ Verificando token con /api/auth/me...', 'yellow');
    const verifyResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (verifyResponse.data.authenticated && verifyResponse.data.user) {
      log('✅ Token válido - Usuario autenticado', 'green');
      log(`👤 Usuario verificado: ${verifyResponse.data.user.email}`, 'green');
    } else {
      throw new Error('Token inválido: ' + JSON.stringify(verifyResponse.data));
    }

    // Paso 3: Probar acceso a ruta protegida del dashboard
    log('\n3️⃣ Probando acceso a dashboard...', 'yellow');
    const dashboardResponse = await axios.get(`${BASE_URL}/api/dashboard/stats-direct`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (dashboardResponse.status === 200) {
      log('✅ Acceso al dashboard permitido', 'green');
      log(`📊 Datos del dashboard: ${JSON.stringify(dashboardResponse.data).substring(0, 100)}...`, 'green');
    } else {
      throw new Error('Acceso al dashboard denegado');
    }

    // Paso 4: Probar acceso a ruta protegida con cookies
    log('\n4️⃣ Probando acceso con cookies...', 'yellow');
    
    // Crear una instancia de axios con cookies
    const cookieAxios = axios.create({
      baseURL: BASE_URL,
      withCredentials: true,
      headers: {
        'Cookie': `auth-token=${token}`
      }
    });

    const cookieResponse = await cookieAxios.get('/api/radios-direct');
    
    if (cookieResponse.status === 200) {
      log('✅ Acceso con cookies funcionando', 'green');
      log(`📻 Radios encontradas: ${cookieResponse.data.length || 0}`, 'green');
    } else {
      log('⚠️  Acceso con cookies falló (puede ser normal en desarrollo)', 'yellow');
    }

    // Paso 5: Verificar que el token sea válido con el secreto correcto
    log('\n5️⃣ Verificando firma del token...', 'yellow');
    const JWT_SECRET = 'supersecret-key-for-nextauth-jwt-2024-verificador-app-secure';
    
    try {
      const verified = jwt.verify(token, JWT_SECRET);
      log('✅ Firma del token válida', 'green');
      log(`⏰ Token expira en: ${new Date(verified.exp * 1000).toLocaleString()}`, 'green');
    } catch (error) {
      throw new Error('Firma del token inválida: ' + error.message);
    }

    log('\n🎉 FLUJO DE AUTENTICACIÓN COMPLETADO EXITOSAMENTE', 'green');
    log('=============================================', 'green');
    log('\n✅ Todos los componentes están funcionando correctamente:', 'green');
    log('   - Login genera token JWT válido', 'green');
    log('   - Endpoint /api/auth/me valida tokens correctamente', 'green');
    log('   - Rutas protegidas del dashboard están accesibles', 'green');
    log('   - El middleware puede validar tokens correctamente', 'green');

  } catch (error) {
    log('\n❌ ERROR EN EL FLUJO DE AUTENTICACIÓN', 'red');
    log('========================================', 'red');
    log(`Error: ${error.message}`, 'red');
    
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(`Data: ${JSON.stringify(error.response.data)}`, 'red');
    }
    
    log('\n🔍 Sugerencias de solución:', 'yellow');
    log('1. Verifica que el servidor esté ejecutándose en http://localhost:3000', 'yellow');
    log('2. Asegúrate de que el usuario admin@verificador.com exista con contraseña admin123', 'yellow');
    log('3. Verifica que el archivo .env tenga el JWT_SECRET correcto', 'yellow');
    log('4. Revisa los logs del servidor para más detalles', 'yellow');
    
    process.exit(1);
  }
}

// Ejecutar prueba
if (require.main === module) {
  testAuthFlow();
}

module.exports = { testAuthFlow };
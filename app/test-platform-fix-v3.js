#!/usr/bin/env node

/**
 * Script de prueba mejorado para verificar el fix de plataformas
 * Usa el endpoint /api/radios/[id] que sabemos que funciona
 */

const https = require('https');
const http = require('http');

// Configuración
const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@verificador.com';
const ADMIN_PASSWORD = 'admin123';

// Variables globales
let authToken = null;
let testResults = [];

// Función para hacer peticiones HTTP
async function makeRequest(url, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    if (authToken) {
      reqOptions.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const req = client.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
          });
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

// Función para autenticarse
async function authenticate() {
  console.log('🔐 Autenticando con el servidor...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/auth/login-direct`, {
      method: 'POST'
    }, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (response.status === 200 && response.data.token) {
      authToken = response.data.token;
      console.log('✅ Autenticación exitosa');
      return true;
    } else {
      console.log('❌ Error de autenticación:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error al autenticar:', error.message);
    return false;
  }
}

// Función para obtener radios
async function getRadios() {
  console.log('📻 Obteniendo radios...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/radios-direct?limit=10`);
    
    if (response.status === 200 && (response.data.radios || response.data.data)) {
      const radios = response.data.radios || response.data.data;
      console.log(`✅ Encontradas ${radios.length} radios`);
      return radios;
    } else {
      console.log('❌ Error obteniendo radios:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Error al obtener radios:', error.message);
    return null;
  }
}

// Función para actualizar una radio con nueva plataforma
async function updateRadioPlatform(radioId, newPlatform) {
  console.log(`🔄 Actualizando radio ${radioId} con plataforma: ${newPlatform}`);
  
  try {
    // Usar el endpoint /api/radios/[id] que sabemos que funciona
    const updateResponse = await makeRequest(`${BASE_URL}/api/radios/${radioId}`, {
      method: 'PUT'
    }, {
      platform: newPlatform
    });

    if (updateResponse.status === 200) {
      console.log(`✅ Radio actualizada exitosamente con plataforma: ${newPlatform}`);
      return true;
    } else {
      console.log('❌ Error actualizando radio:', updateResponse.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error al actualizar radio:', error.message);
    return false;
  }
}

// Función principal de prueba
async function runPlatformFixTest() {
  console.log('🧪 Iniciando prueba de fix de plataformas...\n');

  // 1. Autenticarse
  const authSuccess = await authenticate();
  if (!authSuccess) {
    console.log('❌ No se pudo autenticar. Saliendo...');
    return;
  }

  console.log('');

  // 2. Obtener radios
  const radios = await getRadios();
  if (!radios || radios.length === 0) {
    console.log('❌ No hay radios para probar. Saliendo...');
    return;
  }

  console.log('');

  // 3. Probar diferentes plataformas
  const platformsToTest = ['direct', 'youtube', 'twitch'];
  const testRadio = radios[0]; // Usar la primera radio para pruebas

  console.log(`📍 Usando radio de prueba: ${testRadio.name} (ID: ${testRadio.id})`);
  console.log(`📍 Plataforma actual: ${testRadio.platform || 'no definida'}`);
  console.log('');

  for (const platform of platformsToTest) {
    console.log(`🧪 Probando plataforma: ${platform}`);
    const success = await updateRadioPlatform(testRadio.id, platform);
    
    testResults.push({
      platform: platform,
      success: success,
      timestamp: new Date().toISOString()
    });

    console.log(success ? '✅ ÉXITO' : '❌ FALLÓ');
    console.log('---\n');
    
    // Pequeña pausa entre pruebas
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 4. Mostrar resumen
  console.log('📊 RESUMEN DE PRUEBAS:');
  console.log('====================');
  testResults.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} Plataforma ${result.platform}: ${result.success ? 'EXITOSO' : 'FALLIDO'}`);
  });

  const totalSuccess = testResults.filter(r => r.success).length;
  const totalTests = testResults.length;
  
  console.log(`\n📈 Resultados: ${totalSuccess}/${totalTests} pruebas exitosas`);
  
  if (totalSuccess === totalTests) {
    console.log('🎉 ¡Todas las plataformas se actualizaron correctamente!');
    console.log('✅ El fix de plataformas está funcionando perfectamente.');
  } else {
    console.log('⚠️  Algunas plataformas fallaron. Revisa los logs anteriores.');
  }
}

// Ejecutar la prueba
runPlatformFixTest().catch(console.error);
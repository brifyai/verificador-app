// Script de prueba mejorado que maneja cookies correctamente
const fetch = require('node-fetch');
const tough = require('tough-cookie');

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testEmail: 'admin@verificador.com',
  testPassword: 'admin',
  endpoints: {
    login: '/api/auth/login-direct',
    radios: '/api/radios-direct?limit=500',
    recordings: '/api/recordings'
  }
};

class CookieAwareTester {
  constructor() {
    this.cookieJar = new tough.CookieJar();
  }

  // Fetch con soporte de cookies
  async fetchWithCookies(url, options = {}) {
    const cookieString = await this.cookieJar.getCookieString(url);
    
    const headers = {
      ...options.headers,
      ...(cookieString && { 'Cookie': cookieString }),
    };

    console.log(`🔍 Fetching: ${url}`);
    console.log(`🍪 Cookies: ${cookieString || 'Ninguna'}`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Guardar cookies de la respuesta
    const setCookieHeaders = response.headers.raw()['set-cookie'] || [];
    for (const setCookie of setCookieHeaders) {
      await this.cookieJar.setCookie(setCookie, url);
      console.log(`🍪 Cookie guardada: ${setCookie.split('=')[0]}`);
    }

    console.log(`📊 Response: ${response.status} ${response.statusText}`);
    return response;
  }

  // Login
  async login() {
    console.log('🚀 Iniciando login...');
    
    try {
      const response = await this.fetchWithCookies(
        `${TEST_CONFIG.baseUrl}${TEST_CONFIG.endpoints.login}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: TEST_CONFIG.testEmail,
            password: TEST_CONFIG.testPassword
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Login failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Login exitoso');
      console.log('📦 Token recibido:', data.token ? '✅ Sí' : '❌ No');
      
      return true;

    } catch (error) {
      console.error('❌ Error en login:', error);
      return false;
    }
  }

  // Probar endpoint de radios
  async testRadiosEndpoint() {
    console.log('\n📻 Probando endpoint de radios...');
    
    try {
      const response = await this.fetchWithCookies(
        `${TEST_CONFIG.baseUrl}${TEST_CONFIG.endpoints.radios}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Radios endpoint funcionando');
        console.log('📊 Datos recibidos:', {
          success: data.success,
          dataCount: data.data?.length,
          total: data.pagination?.total
        });
        return true;
      } else {
        const errorData = await response.text();
        console.log('❌ Error en radios:', errorData);
        return false;
      }

    } catch (error) {
      console.error('❌ Error probando radios:', error);
      return false;
    }
  }

  // Probar endpoint de recordings
  async testRecordingsEndpoint() {
    console.log('\n🎙️ Probando endpoint de recordings...');
    
    try {
      const response = await this.fetchWithCookies(
        `${TEST_CONFIG.baseUrl}${TEST_CONFIG.endpoints.recordings}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Recordings endpoint funcionando');
        console.log('📊 Cantidad de grabaciones:', data.length);
        return true;
      } else {
        console.log('❌ Error en recordings:', response.status);
        return false;
      }

    } catch (error) {
      console.error('❌ Error probando recordings:', error);
      return false;
    }
  }

  // Verificar estado de cookies
  async checkCookieStatus() {
    const cookies = await this.cookieJar.getCookies(TEST_CONFIG.baseUrl);
    console.log('\n🔍 Estado de cookies:');
    console.log(`📊 Total cookies: ${cookies.length}`);
    
    cookies.forEach(cookie => {
      console.log(`🍪 ${cookie.key}: ${cookie.value.substring(0, 20)}...`);
    });
    
    const authToken = cookies.find(c => c.key === 'auth-token');
    return {
      hasAuthToken: !!authToken,
      authTokenPreview: authToken ? authToken.value.substring(0, 50) + '...' : null
    };
  }

  // Ejecutar todas las pruebas
  async runFullTest() {
    console.log('🧪 INICIANDO PRUEBA CON MANEJO DE COOKIES\n');

    // Login
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.log('❌ Login falló, abortando prueba');
      return false;
    }

    // Verificar estado de cookies después del login
    const cookieStatus = await this.checkCookieStatus();
    if (!cookieStatus.hasAuthToken) {
      console.log('❌ No se encontró auth-token en cookies después del login');
      return false;
    }

    // Probar endpoints
    const radiosSuccess = await this.testRadiosEndpoint();
    const recordingsSuccess = await this.testRecordingsEndpoint();

    // Resumen
    console.log('\n📊 RESUMEN DE PRUEBAS:');
    console.log(`🔐 Login: ✅ OK`);
    console.log(`🍪 Cookie auth-token: ${cookieStatus.hasAuthToken ? '✅ Presente' : '❌ Ausente'}`);
    console.log(`📻 Radios endpoint: ${radiosSuccess ? '✅ OK' : '❌ FALLÓ'}`);
    console.log(`🎙️ Recordings endpoint: ${recordingsSuccess ? '✅ OK' : '❌ FALLÓ'}`);
    
    const allSuccess = radiosSuccess && recordingsSuccess;
    console.log(`\n🎯 RESULTADO FINAL: ${allSuccess ? '✅ TODAS LAS PRUEBAS PASARON' : '❌ ALGUNAS PRUEBAS FALLARON'}`);
    
    return allSuccess;
  }
}

// Ejecutar la prueba
async function runTest() {
  console.log('🚀 INICIANDO PRUEBA DE AUTENTICACIÓN CON COOKIES');
  console.log('📍 URL base:', TEST_CONFIG.baseUrl);
  console.log('👤 Usuario de prueba:', TEST_CONFIG.testEmail);
  console.log('');

  const tester = new CookieAwareTester();
  const success = await tester.runFullTest();
  
  console.log('\n🏁 PRUEBA FINALIZADA');
  return success;
}

// Ejecutar si se corre directamente
if (require.main === module) {
  runTest().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { CookieAwareTester, runTest };
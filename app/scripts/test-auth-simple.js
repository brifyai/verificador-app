// Script de prueba simple usando http nativo de Node.js
const http = require('http');
const https = require('https');
const url = require('url');

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

class SimpleAuthTester {
  constructor() {
    this.cookies = {};
  }

  // Función simple para hacer peticiones HTTP
  async makeRequest(options) {
    return new Promise((resolve, reject) => {
      const parsedUrl = url.parse(options.url);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      const requestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.path,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      };

      // Agregar cookies si existen
      const cookieString = Object.entries(this.cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
      
      if (cookieString) {
        requestOptions.headers['Cookie'] = cookieString;
      }

      console.log(`🔍 ${options.method || 'GET'} ${options.url}`);
      if (cookieString) {
        console.log(`🍪 Cookies: ${cookieString}`);
      }

      const req = client.request(requestOptions, (res) => {
        let data = '';

        // Guardar cookies de la respuesta
        const setCookieHeaders = res.headers['set-cookie'] || [];
        setCookieHeaders.forEach(cookieHeader => {
          const cookieParts = cookieHeader.split(';')[0].split('=');
          if (cookieParts.length === 2) {
            this.cookies[cookieParts[0]] = cookieParts[1];
            console.log(`🍪 Cookie guardada: ${cookieParts[0]}`);
          }
        });

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          console.log(`📊 Response: ${res.statusCode} ${res.statusMessage}`);
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: res.headers,
            data: data ? JSON.parse(data) : null
          });
        });
      });

      req.on('error', (error) => {
        console.error('❌ Error en request:', error);
        reject(error);
      });

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }

  // Login
  async login() {
    console.log('🚀 Iniciando login...');
    
    try {
      const response = await this.makeRequest({
        url: `${TEST_CONFIG.baseUrl}${TEST_CONFIG.endpoints.login}`,
        method: 'POST',
        body: {
          email: TEST_CONFIG.testEmail,
          password: TEST_CONFIG.testPassword
        }
      });

      if (response.status !== 200) {
        throw new Error(`Login failed: ${response.status}`);
      }

      console.log('✅ Login exitoso');
      console.log('📦 Token en respuesta:', response.data.token ? '✅ Sí' : '❌ No');
      
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
      const response = await this.makeRequest({
        url: `${TEST_CONFIG.baseUrl}${TEST_CONFIG.endpoints.radios}`,
        method: 'GET'
      });

      if (response.status === 200) {
        console.log('✅ Radios endpoint funcionando');
        console.log('📊 Datos recibidos:', {
          success: response.data.success,
          dataCount: response.data.data?.length,
          total: response.data.pagination?.total
        });
        return true;
      } else {
        console.log('❌ Error en radios:', response.status, response.data);
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
      const response = await this.makeRequest({
        url: `${TEST_CONFIG.baseUrl}${TEST_CONFIG.endpoints.recordings}`,
        method: 'GET'
      });

      if (response.status === 200) {
        console.log('✅ Recordings endpoint funcionando');
        console.log('📊 Cantidad de grabaciones:', response.data.length);
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
  checkCookieStatus() {
    console.log('\n🔍 Estado de cookies:');
    const cookieKeys = Object.keys(this.cookies);
    console.log(`📊 Total cookies: ${cookieKeys.length}`);
    
    cookieKeys.forEach(key => {
      const value = this.cookies[key];
      console.log(`🍪 ${key}: ${value.substring(0, 30)}...`);
    });
    
    const hasAuthToken = !!this.cookies['auth-token'];
    return {
      hasAuthToken,
      authTokenPreview: hasAuthToken ? this.cookies['auth-token'].substring(0, 50) + '...' : null
    };
  }

  // Ejecutar todas las pruebas
  async runFullTest() {
    console.log('🧪 INICIANDO PRUEBA SIMPLE DE AUTENTICACIÓN\n');

    // Login
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.log('❌ Login falló, abortando prueba');
      return false;
    }

    // Verificar estado de cookies después del login
    const cookieStatus = this.checkCookieStatus();
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
  console.log('🚀 INICIANDO PRUEBA DE AUTENTICACIÓN SIMPLE');
  console.log('📍 URL base:', TEST_CONFIG.baseUrl);
  console.log('👤 Usuario de prueba:', TEST_CONFIG.testEmail);
  console.log('');

  const tester = new SimpleAuthTester();
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

module.exports = { SimpleAuthTester, runTest };
// Script de prueba para verificar el flujo de autenticación en el navegador
// Este script simula el comportamiento del frontend

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

class BrowserAuthTester {
  constructor() {
    this.token = null;
    this.cookies = {};
  }

  // Simula el comportamiento del hook useAuthenticatedFetch
  async authenticatedFetch(url, options = {}) {
    // Intentar obtener el token de localStorage primero (como hace el hook)
    let token = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('auth-token') || this.getCookie('auth-token');
    }

    const headers = {
      ...options.headers,
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    console.log(`🔍 Fetching: ${url}`);
    console.log(`📋 Headers:`, headers);

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    console.log(`📊 Response: ${response.status} ${response.statusText}`);
    return response;
  }

  // Función auxiliar para obtener cookies (simulada)
  getCookie(name) {
    return this.cookies[name] || null;
  }

  // Login
  async login() {
    console.log('🚀 Iniciando prueba de autenticación...');
    
    try {
      console.log(`🔐 Intentando login con ${TEST_CONFIG.testEmail}...`);
      
      const response = await fetch(`${TEST_CONFIG.baseUrl}${TEST_CONFIG.endpoints.login}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_CONFIG.testEmail,
          password: TEST_CONFIG.testPassword
        }),
        credentials: 'include'
      });

      console.log(`📊 Login response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        throw new Error(`Login failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Login data:', data);

      if (data.token) {
        this.token = data.token;
        // Guardar en localStorage (como hace el frontend)
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth-token', data.token);
        }
        console.log('✅ Login exitoso, token guardado');
        return true;
      } else {
        console.log('❌ No se recibió token del login');
        return false;
      }

    } catch (error) {
      console.error('❌ Error en login:', error);
      return false;
    }
  }

  // Probar endpoint de radios
  async testRadiosEndpoint() {
    console.log('\n📻 Probando endpoint de radios...');
    
    try {
      const response = await this.authenticatedFetch(
        `${TEST_CONFIG.baseUrl}${TEST_CONFIG.endpoints.radios}`
      );

      console.log(`📊 Radios response: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Radios data:', {
          success: data.success,
          dataCount: data.data?.length,
          total: data.pagination?.total,
          sample: data.data?.slice(0, 2) // Muestra las primeras 2 radios
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

  // Probar endpoint de recordings (debería funcionar sin auth)
  async testRecordingsEndpoint() {
    console.log('\n🎙️ Probando endpoint de recordings (sin auth)...');
    
    try {
      const response = await fetch(
        `${TEST_CONFIG.baseUrl}${TEST_CONFIG.endpoints.recordings}`,
        { credentials: 'include' }
      );

      console.log(`📊 Recordings response: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Recordings data count:', data.length);
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

  // Verificar estado de autenticación
  async checkAuthStatus() {
    console.log('\n🔍 Verificando estado de autenticación...');
    
    // Verificar localStorage
    const localStorageToken = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
    console.log(`📋 localStorage token: ${localStorageToken ? '✅ Presente' : '❌ No encontrado'}`);
    
    // Verificar cookies (simulado)
    console.log(`🍪 Cookies: ${Object.keys(this.cookies).length > 0 ? '✅ Presentes' : '❌ No encontradas'}`);
    
    return {
      hasLocalStorageToken: !!localStorageToken,
      hasCookies: Object.keys(this.cookies).length > 0,
      hasToken: !!(localStorageToken || Object.keys(this.cookies).length > 0)
    };
  }

  // Ejecutar todas las pruebas
  async runFullTest() {
    console.log('🧪 INICIANDO PRUEBA COMPLETA DE AUTENTICACIÓN\n');
    
    // Verificar estado inicial
    const initialAuth = await this.checkAuthStatus();
    
    if (!initialAuth.hasToken) {
      console.log('🔐 No hay token, intentando login...');
      const loginSuccess = await this.login();
      if (!loginSuccess) {
        console.log('❌ Login falló, abortando prueba');
        return false;
      }
    } else {
      console.log('✅ Token encontrado, continuando con la prueba');
    }

    // Probar endpoints
    const radiosSuccess = await this.testRadiosEndpoint();
    const recordingsSuccess = await this.testRecordingsEndpoint();

    // Resumen
    console.log('\n📊 RESUMEN DE PRUEBAS:');
    console.log(`✅ Login: ${initialAuth.hasToken ? 'Token existente' : 'Nuevo login'}`);
    console.log(`📻 Radios endpoint: ${radiosSuccess ? '✅ OK' : '❌ FALLÓ'}`);
    console.log(`🎙️ Recordings endpoint: ${recordingsSuccess ? '✅ OK' : '❌ FALLÓ'}`);
    
    const allSuccess = radiosSuccess && recordingsSuccess;
    console.log(`\n🎯 RESULTADO FINAL: ${allSuccess ? '✅ TODAS LAS PRUEBAS PASARON' : '❌ ALGUNAS PRUEBAS FALLARON'}`);
    
    return allSuccess;
  }
}

// Ejecutar la prueba
async function runTest() {
  console.log('🚀 INICIANDO SCRIPT DE PRUEBA DE AUTENTICACIÓN');
  console.log('📍 URL base:', TEST_CONFIG.baseUrl);
  console.log('👤 Usuario de prueba:', TEST_CONFIG.testEmail);
  console.log('');

  const tester = new BrowserAuthTester();
  const success = await tester.runFullTest();
  
  console.log('\n🏁 PRUEBA FINALIZADA');
  return success;
}

// Exportar para uso en navegador
if (typeof window !== 'undefined') {
  window.runAuthTest = runTest;
  console.log('🧪 Función runAuthTest() disponible en consola');
}

// Ejecutar automáticamente si se corre directamente
if (typeof module !== 'undefined' && module.exports) {
  runTest().then(success => {
    process.exit(success ? 0 : 1);
  });
}
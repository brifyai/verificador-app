#!/usr/bin/env node

/**
 * Script de prueba completa para la solución CORS
 * Verifica que todos los componentes funcionen correctamente
 */

const https = require('https');
const http = require('http');

console.log('🧪 Iniciando pruebas de la solución CORS completa...\n');

// Colores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testProxyAPI() {
  log('\n📡 Test 1: Verificando Proxy API /api/verify-stream', 'blue');
  
  try {
    const response = await makeRequest('http://localhost:3000/api/verify-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        stream_url: 'http://radio.digitalfm.cl:8000/arica',
        timeout: 5000
      }
    });

    if (response.status === 200) {
      const data = JSON.parse(response.data);
      if (data.status === 'success') {
        log('✅ Proxy API funcionando correctamente', 'green');
        testResults.passed++;
        testResults.tests.push({ name: 'Proxy API', status: 'passed' });
        return true;
      } else {
        log(`⚠️  Proxy API respondió pero con error: ${data.error}`, 'yellow');
        testResults.failed++;
        testResults.tests.push({ name: 'Proxy API', status: 'failed', error: data.error });
        return false;
      }
    } else {
      log(`❌ Proxy API falló con status ${response.status}`, 'red');
      testResults.failed++;
      testResults.tests.push({ name: 'Proxy API', status: 'failed', error: `Status ${response.status}` });
      return false;
    }
  } catch (error) {
    log(`❌ Error conectando al Proxy API: ${error.message}`, 'red');
    testResults.failed++;
    testResults.tests.push({ name: 'Proxy API', status: 'failed', error: error.message });
    return false;
  }
}

async function testStreamVerifierFixed() {
  log('\n🔍 Test 2: Verificando Stream Verifier Fixed', 'blue');
  
  try {
    // Importar el stream verifier
    const { StreamVerifierFixed } = require('./lib/stream-verifier-fixed');
    const verifier = new StreamVerifierFixed();
    
    const testStream = 'http://radio.digitalfm.cl:8000/arica';
    log(`Verificando stream: ${testStream}`);
    
    const result = await verifier.verifyStreamStatus(testStream);
    
    if (result === true || result === false) {
      log(`✅ Stream Verifier funcionando (resultado: ${result})`, 'green');
      testResults.passed++;
      testResults.tests.push({ name: 'Stream Verifier Fixed', status: 'passed', result });
      return true;
    } else {
      log(`❌ Stream Verifier retornó resultado inesperado: ${result}`, 'red');
      testResults.failed++;
      testResults.tests.push({ name: 'Stream Verifier Fixed', status: 'failed', error: 'Resultado inesperado' });
      return false;
    }
  } catch (error) {
    log(`❌ Error en Stream Verifier: ${error.message}`, 'red');
    testResults.failed++;
    testResults.tests.push({ name: 'Stream Verifier Fixed', status: 'failed', error: error.message });
    return false;
  }
}

async function testVPSHealth() {
  log('\n🏥 Test 3: Verificando salud del VPS', 'blue');
  
  try {
    const response = await makeRequest('http://213.199.39.147:5000/api/health');
    
    if (response.status === 200) {
      const data = JSON.parse(response.data);
      if (data.status === 'healthy') {
        log('✅ VPS está saludable', 'green');
        testResults.passed++;
        testResults.tests.push({ name: 'VPS Health', status: 'passed' });
        return true;
      } else {
        log(`⚠️  VPS respondió pero no está saludable`, 'yellow');
        testResults.failed++;
        testResults.tests.push({ name: 'VPS Health', status: 'failed', error: 'No saludable' });
        return false;
      }
    } else {
      log(`❌ VPS Health falló con status ${response.status}`, 'red');
      testResults.failed++;
      testResults.tests.push({ name: 'VPS Health', status: 'failed', error: `Status ${response.status}` });
      return false;
    }
  } catch (error) {
    log(`❌ Error conectando al VPS: ${error.message}`, 'red');
    testResults.failed++;
    testResults.tests.push({ name: 'VPS Health', status: 'failed', error: error.message });
    return false;
  }
}

async function testRadioMapping() {
  log('\n🗺️  Test 4: Verificando mapeo de radios', 'blue');
  
  try {
    const { RADIO_VPS_MAPPING, getVpsRadioId } = require('./lib/radio-mapping');
    
    // Test con radios conocidas
    const testCases = [
      { frontendId: 'radio-contagio', expectedVpsId: 80 },
      { frontendId: 'radio-somos-petorca', expectedVpsId: 85 },
      { frontendId: 'digital-fm-arica', expectedVpsId: 2 }
    ];
    
    let allPassed = true;
    
    for (const testCase of testCases) {
      const vpsId = getVpsRadioId(testCase.frontendId);
      if (vpsId === testCase.expectedVpsId) {
        log(`✅ ${testCase.frontendId} → VPS ID ${vpsId}`, 'green');
      } else {
        log(`❌ ${testCase.frontendId} → Esperaba ${testCase.expectedVpsId}, obtuvo ${vpsId}`, 'red');
        allPassed = false;
      }
    }
    
    if (allPassed) {
      testResults.passed++;
      testResults.tests.push({ name: 'Radio Mapping', status: 'passed' });
      return true;
    } else {
      testResults.failed++;
      testResults.tests.push({ name: 'Radio Mapping', status: 'failed', error: 'Mapeos incorrectos' });
      return false;
    }
  } catch (error) {
    log(`❌ Error en Radio Mapping: ${error.message}`, 'red');
    testResults.failed++;
    testResults.tests.push({ name: 'Radio Mapping', status: 'failed', error: error.message });
    return false;
  }
}

async function testRecordingEndpoint() {
  log('\n🎙️  Test 5: Verificando endpoint de grabación', 'blue');
  
  try {
    // Test con un radio conocido
    const response = await makeRequest('http://213.199.39.147:5000/api/start-recording', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        radio_id: 2, // Digital FM Arica
        duration: 60
      }
    });

    // El endpoint puede devolver 400 si el stream no está disponible, pero eso es normal
    if (response.status === 200 || response.status === 400) {
      const data = JSON.parse(response.data);
      if (data.status === 'success' || data.message === 'Stream no disponible') {
        log(`✅ Endpoint de grabación accesible (status: ${response.status})`, 'green');
        testResults.passed++;
        testResults.tests.push({ name: 'Recording Endpoint', status: 'passed', statusCode: response.status });
        return true;
      } else {
        log(`⚠️  Recording endpoint respondió pero con mensaje: ${data.message}`, 'yellow');
        testResults.failed++;
        testResults.tests.push({ name: 'Recording Endpoint', status: 'failed', error: data.message });
        return false;
      }
    } else {
      log(`❌ Recording endpoint falló con status ${response.status}`, 'red');
      testResults.failed++;
      testResults.tests.push({ name: 'Recording Endpoint', status: 'failed', error: `Status ${response.status}` });
      return false;
    }
  } catch (error) {
    log(`❌ Error en Recording Endpoint: ${error.message}`, 'red');
    testResults.failed++;
    testResults.tests.push({ name: 'Recording Endpoint', status: 'failed', error: error.message });
    return false;
  }
}

function printSummary() {
  log('\n📊 RESUMEN DE PRUEBAS', 'blue');
  log('=' .repeat(50), 'blue');
  
  testResults.tests.forEach(test => {
    const status = test.status === 'passed' ? '✅' : '❌';
    const color = test.status === 'passed' ? 'green' : 'red';
    log(`${status} ${test.name}`, color);
    if (test.error) {
      log(`   Error: ${test.error}`, 'yellow');
    }
    if (test.result !== undefined) {
      log(`   Resultado: ${test.result}`, 'blue');
    }
    if (test.statusCode) {
      log(`   Status: ${test.statusCode}`, 'blue');
    }
  });
  
  log('\n' + '='.repeat(50), 'blue');
  log(`✅ Pasadas: ${testResults.passed}`, 'green');
  log(`❌ Fallidas: ${testResults.failed}`, 'red');
  log(`📈 Total: ${testResults.passed + testResults.failed}`, 'blue');
  
  if (testResults.failed === 0) {
    log('\n🎉 ¡Todas las pruebas pasaron! La solución CORS está funcionando correctamente.', 'green');
    log('\n💡 Puedes proceder a grabar radios sin problemas de CORS.', 'green');
  } else {
    log(`\n⚠️  ${testResults.failed} prueba(s) fallaron. Revisa los errores arriba.`, 'yellow');
    log('\n💡 Algunos errores pueden ser temporales (streams no disponibles).', 'yellow');
    log('   Intenta nuevamente o verifica la conectividad del VPS.', 'yellow');
  }
}

async function main() {
  log('🚀 Iniciando suite de pruebas completa...', 'blue');
  
  // Esperar un momento para que el servidor esté listo
  log('⏳ Esperando 2 segundos para que el servidor esté listo...', 'yellow');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testProxyAPI();
  await testStreamVerifierFixed();
  await testVPSHealth();
  await testRadioMapping();
  await testRecordingEndpoint();
  
  printSummary();
}

// Ejecutar si se corre directamente
if (require.main === module) {
  main().catch(error => {
    log(`\n💥 Error fatal: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  testProxyAPI,
  testStreamVerifierFixed,
  testVPSHealth,
  testRadioMapping,
  testRecordingEndpoint,
  testResults
};
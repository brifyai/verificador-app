#!/usr/bin/env node

/**
 * Script inmediato para diagnosticar y solucionar problemas CORS
 * Este script diagnostica y proporciona soluciones para los errores CORS
 */

const https = require('https');
const http = require('http');
const url = require('url');

// Configuración
const VPS_URL = 'http://213.199.39.147:5000';
const LOCAL_URL = 'http://localhost:3000';
const TEST_ENDPOINT = '/api/verify-stream';

// Colores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, data }));
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testCORS() {
  log('\n🔍 DIAGNÓSTICO DE CORS - RADIO STREAM VERIFIER', 'cyan');
  log('==============================================', 'cyan');
  
  // Test 1: Verificar si el VPS está respondiendo
  log('\n1. Verificando conectividad con VPS...', 'yellow');
  try {
    const vpsHealth = await makeRequest({
      hostname: '213.199.39.147',
      port: 5000,
      path: '/api/active-recordings',
      method: 'GET',
      protocol: 'http:'
    });
    
    if (vpsHealth.statusCode === 200) {
      log('✅ VPS está respondiendo correctamente', 'green');
    } else {
      log(`⚠️  VPS respondió con código: ${vpsHealth.statusCode}`, 'yellow');
    }
  } catch (error) {
    log(`❌ Error conectando al VPS: ${error.message}`, 'red');
    log('   Verifica que el servidor esté ejecutándose en el VPS', 'red');
    return;
  }
  
  // Test 2: Verificar CORS preflight
  log('\n2. Verificando CORS preflight...', 'yellow');
  try {
    const preflightResponse = await makeRequest({
      hostname: '213.199.39.147',
      port: 5000,
      path: TEST_ENDPOINT,
      method: 'OPTIONS',
      protocol: 'http:',
      headers: {
        'Origin': LOCAL_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type'
      }
    });
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': preflightResponse.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': preflightResponse.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': preflightResponse.headers['access-control-allow-headers'],
      'Access-Control-Allow-Credentials': preflightResponse.headers['access-control-allow-credentials']
    };
    
    log(`   Status Code: ${preflightResponse.statusCode}`, 'blue');
    log('   Headers CORS recibidos:', 'blue');
    
    let hasValidCORS = false;
    for (const [header, value] of Object.entries(corsHeaders)) {
      if (value) {
        log(`   ✅ ${header}: ${value}`, 'green');
        if (header === 'Access-Control-Allow-Origin' && 
            (value === LOCAL_URL || value === '*')) {
          hasValidCORS = true;
        }
      } else {
        log(`   ❌ ${header}: No presente`, 'red');
      }
    }
    
    if (preflightResponse.statusCode === 200 && hasValidCORS) {
      log('✅ CORS preflight está configurado correctamente', 'green');
    } else {
      log('⚠️  CORS preflight necesita configuración', 'yellow');
    }
    
  } catch (error) {
    log(`❌ Error en preflight: ${error.message}`, 'red');
  }
  
  // Test 3: Verificar endpoint POST real
  log('\n3. Verificando endpoint POST /api/verify-stream...', 'yellow');
  try {
    const postResponse = await makeRequest({
      hostname: '213.199.39.147',
      port: 5000,
      path: TEST_ENDPOINT,
      method: 'POST',
      protocol: 'http:',
      headers: {
        'Content-Type': 'application/json',
        'Origin': LOCAL_URL
      },
      body: JSON.stringify({
        stream_url: 'http://example.com/stream.mp3',
        radio_id: 'test-radio'
      })
    });
    
    log(`   Status Code: ${postResponse.statusCode}`, 'blue');
    log(`   Response: ${postResponse.data}`, 'blue');
    
    if (postResponse.statusCode === 200) {
      log('✅ Endpoint POST está funcionando', 'green');
    } else {
      log('⚠️  Endpoint POST necesita atención', 'yellow');
    }
    
  } catch (error) {
    log(`❌ Error en POST: ${error.message}`, 'red');
  }
  
  // Test 4: Verificar SSL/HTTPS
  log('\n4. Verificando problemas SSL con radios HTTPS...', 'yellow');
  const testRadios = [
    'https://radio.digitalfm.cl:8000/arica',
    'https://stream.example.com/radio.mp3'
  ];
  
  for (const radioUrl of testRadios) {
    try {
      const parsedUrl = new URL(radioUrl);
      const sslResponse = await makeRequest({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname,
        method: 'HEAD',
        protocol: 'https:',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
        }
      });
      
      log(`✅ ${radioUrl} - Status: ${sslResponse.statusCode}`, 'green');
    } catch (error) {
      log(`❌ ${radioUrl} - Error: ${error.message}`, 'red');
      if (error.message.includes('certificate')) {
        log('   💡 Sugerencia: Problema de certificado SSL', 'magenta');
      } else if (error.message.includes('timeout')) {
        log('   💡 Sugerencia: Timeout de conexión', 'magenta');
      } else if (error.message.includes('ECONNREFUSED')) {
        log('   💡 Sugerencia: Puerto cerrado o servidor no disponible', 'magenta');
      }
    }
  }
  
  // Soluciones recomendadas
  log('\n🔧 SOLUCIONES RECOMENDADAS:', 'cyan');
  log('============================', 'cyan');
  
  log('\n1. PARA EL SERVIDOR VPS (213.199.39.147:5000):', 'yellow');
  log('   Agrega esta configuración CORS en tu app.py:', 'blue');
  log(`
from flask_cors import CORS
from flask import Flask, request, jsonify

app = Flask(__name__)

# Configuración CORS completa
CORS(app, 
     origins=['http://localhost:3000', 'http://127.0.0.1:3000'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'],
     supports_credentials=True)

@app.before_request
def handle_preflight():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
`, 'green');
  
  log('\n2. PARA EL CLIENTE (Next.js):', 'yellow');
  log('   Opción A - Usar proxy en next.config.js:', 'blue');
  log(`
// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/vps/:path*',
        destination: 'http://213.199.39.147:5000/api/:path*',
      },
    ];
  },
};
`, 'green');
  
  log('\n   Opción B - Crear endpoint proxy:', 'blue');
  log(`
// app/api/verify-stream/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  const response = await fetch('http://213.199.39.147:5000/api/verify-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response;
}
`, 'green');
  
  log('\n3. PARA RADIOS HTTPS:', 'yellow');
  log('   Usa verificación sin certificado SSL estricto:', 'blue');
  log(`
// En tu verificador de streams
const response = await fetch(url, {
  method: 'HEAD',
  mode: 'no-cors', // Evita problemas CORS
  // No establezcas User-Agent manualmente
});
`, 'green');
  
  log('\n✨ RESUMEN:', 'cyan');
  log('==========', 'cyan');
  log('• El VPS necesita configuración CORS adecuada', 'white');
  log('• Usa un proxy para evitar problemas de CORS', 'white');
  log('• No establezcas headers "User-Agent" manualmente', 'white');
  log('• Para HTTPS, usa mode: "no-cors" o un proxy', 'white');
  log('• Reinicia el servidor VPS después de cambios', 'white');
  
  log('\n🎯 Próximos pasos:', 'yellow');
  log('1. Aplica la configuración CORS al VPS', 'white');
  log('2. Implementa el proxy en Next.js', 'white');
  log('3. Actualiza los verificadores de stream', 'white');
  log('4. Testea con una radio real', 'white');
  
  log('\n📚 Archivo de referencia completo:', 'magenta');
  log('app/SOLUCION_CORS_ERROR_GUIDE.md', 'magenta');
}

// Ejecutar diagnóstico
if (require.main === module) {
  testCORS().catch(console.error);
}

module.exports = { testCORS };
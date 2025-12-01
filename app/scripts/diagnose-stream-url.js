#!/usr/bin/env node

/**
 * Herramienta de diagnóstico para verificar por qué una URL de streaming aparece como offline
 * cuando está online
 */

const https = require('https');
const http = require('http');
const url = require('url');

// URL a diagnosticar
const STREAM_URL = 'https://radio.digitalfm.cl:8000/arica';

function detectStreamType(streamUrl) {
  const u = streamUrl.toLowerCase();
  if (u.includes('.m3u8') || u.includes('/hls/')) return 'HLS';
  if (u.includes('.mpd')) return 'DASH';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'YOUTUBE';
  if (u.includes('twitch.tv')) return 'TWITCH';
  if (u.includes('facebook.com')) return 'FACEBOOK';
  if (u.includes('shoutcast') || u.includes(':8080')) return 'SHOUTCAST';
  if (u.includes('icecast') || u.includes(':8000')) return 'ICECAST';
  if (u.startsWith('http://') || u.startsWith('https://')) return 'DIRECT';
  return 'OTHER';
}

function makeRequest(requestUrl, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(requestUrl);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.path,
      method: options.method || 'GET',
      timeout: options.timeout || 10000,
      headers: options.headers || {}
    };

    console.log(`\n📡 Intentando: ${options.method || 'GET'} ${requestUrl}`);
    console.log(`   Headers:`, JSON.stringify(requestOptions.headers, null, 2));

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          data: data.substring(0, 500), // Primeros 500 caracteres
          size: data.length
        });
      });
    });

    req.on('error', (error) => {
      reject({
        error: error.message,
        code: error.code,
        syscall: error.syscall
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        error: 'Timeout',
        message: `Request timeout after ${requestOptions.timeout}ms`
      });
    });

    req.end();
  });
}

async function diagnoseStream(streamUrl) {
  console.log('🔍 INICIANDO DIAGNÓSTICO DE STREAM');
  console.log('=====================================');
  console.log(`URL: ${streamUrl}`);
  console.log(`Tipo detectado: ${detectStreamType(streamUrl)}`);
  console.log('');

  const results = {
    head: null,
    getRange: null,
    getFull: null,
    browserSimulation: null
  };

  // 1. Intentar HEAD request (método principal del sistema)
  try {
    console.log('1️⃣  PRUEBA HEAD REQUEST');
    results.head = await makeRequest(streamUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'OndaVerificada-StreamVerifier/1.0',
        'Icy-MetaData': '1'
      },
      timeout: 8000
    });
    console.log('✅ HEAD exitoso:', results.head.status, results.head.statusText);
    console.log('   Headers:', JSON.stringify(results.head.headers, null, 2));
  } catch (error) {
    console.log('❌ HEAD falló:', error.error);
    if (error.code) console.log('   Código:', error.code);
    results.head = { error: error.error, code: error.code };
  }

  // 2. Intentar GET con Range (método fallback del sistema)
  try {
    console.log('\n2️⃣  PRUEBA GET CON RANGE');
    results.getRange = await makeRequest(streamUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'OndaVerificada-StreamVerifier/1.0',
        'Icy-MetaData': '1',
        'Range': 'bytes=0-0',
        'Accept': 'audio/*, */*'
      },
      timeout: 12000
    });
    console.log('✅ GET Range exitoso:', results.getRange.status, results.getRange.statusText);
    console.log('   Content-Type:', results.getRange.headers['content-type']);
    console.log('   Tamaño datos:', results.getRange.size);
  } catch (error) {
    console.log('❌ GET Range falló:', error.error);
    if (error.code) console.log('   Código:', error.code);
    results.getRange = { error: error.error, code: error.code };
  }

  // 3. Intentar GET completo (simulando navegador)
  try {
    console.log('\n3️⃣  PRUEBA GET COMPLETO (Simulación Navegador)');
    results.getFull = await makeRequest(streamUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'audio/*, */*',
        'Accept-Language': 'es-ES,es;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive'
      },
      timeout: 5000 // Solo 5 segundos para no descargar mucho
    });
    console.log('✅ GET completo exitoso:', results.getFull.status, results.getFull.statusText);
    console.log('   Content-Type:', results.getFull.headers['content-type']);
    console.log('   Primeros 100 chars:', results.getFull.data.substring(0, 100));
  } catch (error) {
    console.log('❌ GET completo falló:', error.error);
    if (error.code) console.log('   Código:', error.code);
    results.getFull = { error: error.error, code: error.code };
  }

  // 4. Análisis de CORS (simulado)
  console.log('\n4️⃣  ANÁLISIS DE CORS');
  console.log('   El sistema actual no puede verificar CORS desde Node.js');
  console.log('   pero los errores comunes son:');
  console.log('   - blocked by CORS policy');
  console.log('   - No Access-Control-Allow-Origin header');
  console.log('   - Connection refused');
  console.log('');

  return results;
}

// Ejecutar diagnóstico
diagnoseStream(STREAM_URL)
  .then(results => {
    console.log('\n📊 RESUMEN DE RESULTADOS');
    console.log('========================');
    
    console.log('\n🔍 ANÁLISIS DEL PROBLEMA:');
    
    if (results.head && results.head.status === 200) {
      console.log('✅ HEAD funciona - El sistema debería detectar como ONLINE');
    } else if (results.getRange && results.getRange.status === 200) {
      console.log('✅ GET Range funciona - El sistema debería detectar como ONLINE');
    } else if (results.getFull && results.getFull.status === 200) {
      console.log('⚠️  Solo GET completo funciona - El sistema tiene problemas con HEAD/Range');
    } else {
      console.log('❌ Ningún método funciona - El stream está realmente inaccesible');
    }

    console.log('\n💡 POSIBLES SOLUCIONES:');
    console.log('1. Verificar si el servidor bloquea HEAD requests');
    console.log('2. Verificar si el servidor tiene problemas con Range requests');
    console.log('3. Verificar firewall o restricciones de IP');
    console.log('4. Verificar configuración de CORS del servidor de streaming');
    console.log('5. Considerar usar un proxy o User-Agent diferente');
    
    console.log('\n📋 RESULTADOS COMPLETOS:');
    console.log(JSON.stringify(results, null, 2));
  })
  .catch(error => {
    console.error('Error en el diagnóstico:', error);
  });
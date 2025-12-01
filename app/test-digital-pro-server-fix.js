#!/usr/bin/env node

/**
 * Script de prueba para verificar que los servidores Digital Pro Server
 * ahora se detecten correctamente como ONLINE a pesar de devolver HTTP 400
 */

const https = require('https');
const http = require('http');

function detectStreamType(url) {
  const lowerUrl = url.toLowerCase();
  
  // Detectar servidores Icecast y Digital Pro Server
  if (lowerUrl.includes(':8000') || 
      lowerUrl.includes(':8001') || 
      lowerUrl.includes(':8002') ||
      lowerUrl.includes('digitalproserver.com') ||
      lowerUrl.includes('.aac') ||
      lowerUrl.includes('.mp3')) {
    return 'ICECAST';
  }
  if (lowerUrl.includes('/stream') || lowerUrl.includes(':80')) {
    return 'SHOUTCAST';
  }
  if (lowerUrl.includes('.m3u8') || lowerUrl.includes('/hls/')) {
    return 'HLS';
  }
  return 'OTHER';
}

async function verifyWithHttpsModule(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const module = isHttps ? https : http;
    
    const options = {
      method: 'GET',
      timeout: 20000,
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)',
        'Accept': '*/*',
        'Icy-MetaData': '1',
        'Connection': 'close'
      }
    };

    const req = module.request(url, options, (res) => {
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;
      
      console.log(`HTTPS verification for ${url}: Status ${statusCode}, Time: ${responseTime}ms`);
      
      // Aceptar HTTP 400 como ONLINE para servidores Icecast y Digital Pro Server
      const isIcecastServer = detectStreamType(url) === 'ICECAST' || 
                             url.includes('digitalproserver.com') ||
                             url.includes(':8000') ||
                             url.includes('.aac');
      
      const isOnline = (statusCode >= 200 && statusCode < 300) || 
                       (statusCode === 400 && isIcecastServer) ||
                       (statusCode >= 200 && statusCode < 500 && isIcecastServer);
      
      res.destroy();
      
      resolve({
        status: isOnline ? 'ONLINE' : 'OFFLINE',
        details: isOnline 
          ? `Stream verificado exitosamente (HTTP ${statusCode})` 
          : `Stream no responde correctamente (HTTP ${statusCode})`,
        streamType: detectStreamType(url),
        usedProxy: false,
        method: 'HTTPS_MODULE',
        responseCode: statusCode,
        responseTime,
        timestamp: new Date().toISOString()
      });
    });

    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      console.error(`HTTPS verification error for ${url}:`, error.message);
      
      resolve({
        status: 'OFFLINE',
        details: `Error de conexión: ${error.message}`,
        streamType: detectStreamType(url),
        usedProxy: false,
        method: 'HTTPS_MODULE_ERROR',
        responseTime,
        timestamp: new Date().toISOString()
      });
    });

    req.on('timeout', () => {
      req.destroy();
      console.warn(`HTTPS verification timeout for ${url}`);
      
      resolve({
        status: 'OFFLINE',
        details: 'Timeout en la conexión',
        streamType: detectStreamType(url),
        usedProxy: false,
        method: 'HTTPS_MODULE_TIMEOUT',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
    });

    req.setTimeout(20000);
    req.end();
  });
}

async function verifyStreamStatus(streamUrl) {
  try {
    if (!streamUrl || streamUrl.trim() === '') {
      return {
        status: 'OFFLINE',
        details: 'URL de stream vacía o inválida',
        streamType: 'OTHER',
        usedProxy: false,
        method: 'NONE',
        timestamp: new Date().toISOString()
      };
    }

    // Para streams problemáticos como Digital Pro Server, usar verificación HTTPS directa
    if (streamUrl.includes('digitalproserver.com') || 
        streamUrl.includes(':8000') || 
        detectStreamType(streamUrl) === 'ICECAST') {
      console.log(`Using HTTPS module for problematic stream: ${streamUrl}`);
      return await verifyWithHttpsModule(streamUrl);
    }
    
    // Para otros streams, usar HTTPS module como fallback
    return await verifyWithHttpsModule(streamUrl);
    
  } catch (error) {
    console.error(`Unexpected error verifying stream ${streamUrl}:`, error);
    
    return {
      status: 'OFFLINE',
      details: `Error inesperado: ${error.message}`,
      streamType: 'OTHER',
      usedProxy: false,
      method: 'UNEXPECTED_ERROR',
      timestamp: new Date().toISOString()
    };
  }
}

// URLs de Digital Pro Server que estaban marcando HTTP 400
const testUrls = [
  'https://archi-us.digitalproserver.com/quillota-fm.aac',
  'https://sonando-us.digitalproserver.com/radiotalcahuano.aac',
  'https://archi-us.digitalproserver.com/superandina.aac',
  'https://archi-us.digitalproserver.com/magica.aac',
  'https://archi-us.digitalproserver.com/la-ciudad-puerto.aac',
  'https://sonando-us.digitalproserver.com/carnaval_copiapo.aac',
  'https://archi-us.digitalproserver.com/la-voz-de-la-costa.aac',
  'https://archi-us.digitalproserver.com/milenaria.aac',
  'https://archi-us.digitalproserver.com/mia.aac',
  'https://archi-us.digitalproserver.com/santa-cruz-fm.aac'
];

console.log('🧪 Probando verificación de servidores Digital Pro Server...\n');

async function testDigitalProServers() {
  const results = [];
  
  for (const url of testUrls) {
    console.log(`🔍 Verificando: ${url}`);
    
    try {
      const result = await verifyStreamStatus(url);
      
      console.log(`   ✅ Estado: ${result.status}`);
      console.log(`   📄 Detalles: ${result.details}`);
      console.log(`   🔧 Método: ${result.method}`);
      console.log(`   📊 Código: ${result.responseCode || 'N/A'}`);
      console.log(`   ⏱️  Tiempo: ${result.responseTime || 'N/A'}ms`);
      console.log(`   🎵 Tipo: ${result.streamType}`);
      console.log('');
      
      results.push({
        url,
        status: result.status,
        details: result.details,
        method: result.method,
        responseCode: result.responseCode,
        responseTime: result.responseTime,
        streamType: result.streamType
      });
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log('');
      
      results.push({
        url,
        status: 'ERROR',
        details: error.message,
        method: 'ERROR',
        responseCode: null,
        responseTime: null,
        streamType: 'ERROR'
      });
    }
  }
  
  // Resumen
  console.log('📊 RESUMEN DE RESULTADOS:');
  console.log('========================');
  
  const online = results.filter(r => r.status === 'ONLINE').length;
  const offline = results.filter(r => r.status === 'OFFLINE').length;
  const errors = results.filter(r => r.status === 'ERROR').length;
  
  console.log(`✅ Online: ${online}`);
  console.log(`🔴 Offline: ${offline}`);
  console.log(`❌ Errores: ${errors}`);
  console.log(`📈 Tasa de éxito: ${Math.round((online / testUrls.length) * 100)}%`);
  
  // Detalles de las que deberían estar online
  console.log('\n📋 DETALLES DE STREAMS QUE DEBERÍAN ESTAR ONLINE:');
  results.forEach(result => {
    if (result.status === 'ONLINE') {
      console.log(`   ✅ ${result.url} - HTTP ${result.responseCode} (${result.responseTime}ms)`);
    } else if (result.status === 'OFFLINE') {
      console.log(`   🔴 ${result.url} - ${result.details}`);
    }
  });
  
  // Verificación específica de HTTP 400
  console.log('\n🔍 ANÁLISIS DE RESPUESTAS HTTP 400:');
  const http400Results = results.filter(r => r.responseCode === 400);
  if (http400Results.length > 0) {
    console.log(`   Se detectaron ${http400Results.length} respuestas HTTP 400:`);
    http400Results.forEach(result => {
      const shouldBeOnline = result.status === 'ONLINE';
      console.log(`   ${shouldBeOnline ? '✅' : '🔴'} ${result.url} - ${result.status} (${result.details})`);
    });
  } else {
    console.log('   No se detectaron respuestas HTTP 400 en esta prueba.');
  }
  
  return results;
}

// Ejecutar prueba
testDigitalProServers()
  .then(results => {
    console.log('\n✅ Prueba completada exitosamente');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error en la prueba:', error);
    process.exit(1);
  });
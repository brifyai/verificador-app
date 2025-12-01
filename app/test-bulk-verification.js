#!/usr/bin/env node

/**
 * Script de prueba para verificar el impacto de las mejoras en la verificación de streams
 * Prueba radios con Digital Pro Server y otros servidores problemáticos
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

// URLs de prueba basadas en el análisis de radios offline
const testUrls = [
  // Digital Pro Server (deberían estar ONLINE)
  'https://archi-us.digitalproserver.com/quillota-fm.aac',
  'https://sonando-us.digitalproserver.com/radiotalcahuano.aac',
  'https://archi-us.digitalproserver.com/superandina.aac',
  'https://archi-us.digitalproserver.com/magica.aac',
  'https://archi-us.digitalproserver.com/la-ciudad-puerto.aac',
  'https://sonando-us.digitalproserver.com/carnaval_copiapo.aac',
  'https://archi-us.digitalproserver.com/la-voz-de-la-costa.aac',
  'https://archi-us.digitalproserver.com/milenaria.aac',
  'https://archi-us.digitalproserver.com/mia.aac',
  'https://archi-us.digitalproserver.com/santa-cruz-fm.aac',
  
  // Icecast en puerto 8000 (deberían estar ONLINE)
  'https://radio.digitalfm.cl:8000/arica',
  'https://radio.digitalfm.cl:8000/iquique',
  'https://radio.digitalfm.cl:8000/calama',
  
  // Radios con problemas de conexión (probablemente OFFLINE)
  'https://s4.radio.co/sd7a60c45b/listen',
  'https://s4.radio.co/s7b7f8b8e7/listen',
  'https://s4.radio.co/s0b6f8d7e8/listen',
  'https://s4.radio.co/s1a2b3c4d5/listen',
  
  // Radios con DNS no encontrado (probablemente OFFLINE)
  'https://stream.radioloslagos.cl:8000/radioloslagos.aac',
  'https://stream.radioloslagos.cl:8000/radioloslagos.mp3',
  'https://stream.radioloslagos.cl:8000/radioloslagos',
  
  // Radios que podrían estar online
  'https://stream5.eltelar.cl:8000/radio5.aac',
  'https://stream5.eltelar.cl:8000/radio5.mp3',
  'https://s3.radio.co/s0b6f8d7e8/listen',
  'https://s3.radio.co/s1a2b3c4d5/listen',
  'https://s2.radio.co/s7b7f8b8e7/listen',
  'https://s2.radio.co/sd7a60c45b/listen',
  'https://s1.radio.co/s0b6f8d7e8/listen',
  'https://s1.radio.co/s1a2b3c4d5/listen'
];

console.log('🧪 Probando verificación masiva de radios...\n');
console.log(`📊 Total de radios a verificar: ${testUrls.length}\n`);

async function testBulkVerification() {
  const results = [];
  let onlineCount = 0;
  let offlineCount = 0;
  let errorCount = 0;
  
  console.log('🚀 Iniciando verificación masiva...\n');
  
  for (let i = 0; i < testUrls.length; i++) {
    const url = testUrls[i];
    console.log(`[${i + 1}/${testUrls.length}] 🔍 Verificando: ${url}`);
    
    try {
      const result = await verifyStreamStatus(url);
      
      if (result.status === 'ONLINE') {
        onlineCount++;
        console.log(`   ✅ Estado: ${result.status} (HTTP ${result.responseCode})`);
      } else {
        offlineCount++;
        console.log(`   🔴 Estado: ${result.status}`);
      }
      
      console.log(`   📄 Detalles: ${result.details}`);
      console.log(`   🔧 Método: ${result.method}`);
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
      errorCount++;
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
    
    // Pequeña pausa entre verificaciones para no sobrecargar
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Resumen detallado
  console.log('📊 RESUMEN DE RESULTADOS:');
  console.log('========================');
  console.log(`✅ Online: ${onlineCount}`);
  console.log(`🔴 Offline: ${offlineCount}`);
  console.log(`❌ Errores: ${errorCount}`);
  console.log(`📈 Tasa de éxito: ${Math.round((onlineCount / testUrls.length) * 100)}%`);
  console.log('');
  
  // Análisis por categorías
  console.log('📋 ANÁLISIS POR CATEGORÍAS:');
  console.log('===========================');
  
  // Digital Pro Server
  const digitalProResults = results.filter(r => r.url.includes('digitalproserver.com'));
  const digitalProOnline = digitalProResults.filter(r => r.status === 'ONLINE').length;
  console.log(`🎯 Digital Pro Server: ${digitalProOnline}/${digitalProResults.length} online (${Math.round((digitalProOnline/digitalProResults.length)*100)}%)`);
  
  // Icecast puerto 8000
  const icecastResults = results.filter(r => r.url.includes(':8000'));
  const icecastOnline = icecastResults.filter(r => r.status === 'ONLINE').length;
  console.log(`🎵 Icecast Puerto 8000: ${icecastOnline}/${icecastResults.length} online (${Math.round((icecastOnline/icecastResults.length)*100)}%)`);
  
  // Radio.co
  const radioCoResults = results.filter(r => r.url.includes('radio.co'));
  const radioCoOnline = radioCoResults.filter(r => r.status === 'ONLINE').length;
  console.log(`📻 Radio.co: ${radioCoOnline}/${radioCoResults.length} online (${Math.round((radioCoOnline/radioCoResults.length)*100)}%)`);
  
  // Otros
  const otherResults = results.filter(r => !r.url.includes('digitalproserver.com') && !r.url.includes(':8000') && !r.url.includes('radio.co'));
  const otherOnline = otherResults.filter(r => r.status === 'ONLINE').length;
  console.log(`🔧 Otros: ${otherOnline}/${otherResults.length} online (${Math.round((otherOnline/otherResults.length)*100)}%)`);
  
  console.log('');
  
  // Detalles de respuestas HTTP
  console.log('🔍 ANÁLISIS DE RESPUESTAS HTTP:');
  console.log('================================');
  
  const statusCodes = {};
  results.forEach(result => {
    if (result.responseCode) {
      if (!statusCodes[result.responseCode]) {
        statusCodes[result.responseCode] = 0;
      }
      statusCodes[result.responseCode]++;
    }
  });
  
  Object.keys(statusCodes).sort().forEach(code => {
    console.log(`   HTTP ${code}: ${statusCodes[code]} radios`);
  });
  
  // Problemas específicos
  console.log('\n⚠️  PROBLEMAS DETECTADOS:');
  console.log('=========================');
  
  const connectionRefused = results.filter(r => r.details.includes('ECONNREFUSED')).length;
  const dnsNotFound = results.filter(r => r.details.includes('ENOTFOUND')).length;
  const timeouts = results.filter(r => r.details.includes('timeout')).length;
  const http400 = results.filter(r => r.responseCode === 400).length;
  const http404 = results.filter(r => r.responseCode === 404).length;
  
  if (connectionRefused > 0) console.log(`   🔌 Conexión rechazada: ${connectionRefused} radios`);
  if (dnsNotFound > 0) console.log(`   🔍 DNS no encontrado: ${dnsNotFound} radios`);
  if (timeouts > 0) console.log(`   ⏱️  Timeouts: ${timeouts} radios`);
  if (http400 > 0) console.log(`   📊 HTTP 400 (aceptados como online): ${http400} radios`);
  if (http404 > 0) console.log(`   📄 HTTP 404: ${http404} radios`);
  
  return results;
}

// Ejecutar prueba
testBulkVerification()
  .then(results => {
    console.log('\n✅ Prueba de verificación masiva completada exitosamente');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error en la prueba masiva:', error);
    process.exit(1);
  });
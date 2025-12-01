#!/usr/bin/env node

/**
 * Herramienta de prueba para verificar el nuevo sistema de verificación SSL
 */

// Importar axios directamente para la prueba
const axios = require('axios');
const https = require('https');

// Función simplificada de verificación SSL para pruebas
async function verifyStreamWithSSLFix(url) {
  console.log(`\n🔍 Verificando stream: ${url}`);
  
  try {
    // Primero intentar con axios normal
    const response = await axios({
      method: 'HEAD',
      url,
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RadioMonitor/1.0)',
        'Accept': '*/*',
        'Icy-MetaData': '1'
      },
      validateStatus: (status) => status < 500,
      maxRedirects: 5
    });

    console.log(`✅ Stream ONLINE - Status: ${response.status}`);
    console.log(`📊 Response Time: ${response.headers['date']}`);
    console.log(`🎵 Content Type: ${response.headers['content-type']}`);
    console.log(`🔧 Server: ${response.headers['server']}`);
    
    return {
      isOnline: true,
      status: 'online',
      statusCode: response.status,
      contentType: response.headers['content-type'],
      server: response.headers['server']
    };
  } catch (error) {
    console.log(`❌ Error normal: ${error.code || error.message}`);
    
    // Si es un error SSL, intentar con https.request con rejectUnauthorized: false
    const sslErrorCodes = [
      'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
      'CERT_HAS_EXPIRED',
      'DEPTH_ZERO_SELF_SIGNED_CERT',
      'SELF_SIGNED_CERT_IN_CHAIN',
      'UNABLE_TO_GET_ISSUER_CERT',
      'UNABLE_TO_GET_CRL',
      'CERT_NOT_YET_VALID',
      'CERT_REVOKED',
      'INVALID_CERT',
      'TLS_HANDSHAKE_TIMEOUT'
    ];
    
    if (error.code && (sslErrorCodes.includes(error.code) || error.code.includes('CERT') || error.code.includes('SSL') || error.code.includes('TLS'))) {
      console.log(`🔧 Intentando con SSL deshabilitado...`);
      
      return new Promise((resolve) => {
        const urlObj = new URL(url);
        
        const options = {
          hostname: urlObj.hostname,
          port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
          path: urlObj.pathname + urlObj.search,
          method: 'HEAD',
          timeout: 15000,
          rejectUnauthorized: false, // Deshabilitar verificación SSL
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; RadioMonitor/1.0)',
            'Accept': '*/*',
            'Icy-MetaData': '1'
          }
        };

        const req = https.request(options, (res) => {
          console.log(`✅ Stream ONLINE con SSL fix - Status: ${res.statusCode}`);
          console.log(`📊 Headers:`, res.headers);
          
          resolve({
            isOnline: true,
            status: 'ssl_error_fixed',
            statusCode: res.statusCode,
            contentType: res.headers['content-type'],
            server: res.headers['server'],
            sslError: error.message
          });
        });

        req.on('error', (sslError) => {
          console.log(`❌ Error SSL incluso con fix: ${sslError.message}`);
          resolve({
            isOnline: false,
            status: 'ssl_error_failed',
            error: sslError.message
          });
        });

        req.on('timeout', () => {
          req.destroy();
          console.log(`⏰ Timeout con SSL fix`);
          resolve({
            isOnline: false,
            status: 'timeout',
            error: 'Timeout'
          });
        });

        req.end();
      });
    }
    
    return {
      isOnline: false,
      status: 'error',
      error: error.message
    };
  }
}

// URL de Digital FM Arica que tiene problemas SSL
const PROBLEMATIC_URL = 'https://radio.digitalfm.cl:8000/arica';

async function testSslVerification() {
  console.log('🔍 PROBANDO NUEVO SISTEMA DE VERIFICACIÓN SSL');
  console.log('==============================================');
  console.log(`URL: ${PROBLEMATIC_URL}`);
  console.log('');

  try {
    console.log('⏳ Iniciando verificación con el nuevo sistema...');
    const result = await verifyStreamWithSSLFix(PROBLEMATIC_URL);
    
    console.log('\n📊 RESULTADO DE VERIFICACIÓN:');
    console.log('=============================');
    console.log(`Estado: ${result.status}`);
    console.log(`¿Está Online?: ${result.isOnline ? 'SÍ' : 'NO'}`);
    
    if (result.statusCode) {
      console.log(`HTTP Status: ${result.statusCode}`);
    }
    if (result.contentType) {
      console.log(`Content-Type: ${result.contentType}`);
    }
    if (result.server) {
      console.log(`Server: ${result.server}`);
    }
    if (result.sslError) {
      console.log(`Error SSL Original: ${result.sslError}`);
    }
    if (result.error) {
      console.log(`Error: ${result.error}`);
    }
    
    console.log('\n✅ ANÁLISIS:');
    if (result.isOnline) {
      console.log('✅ ¡ÉXITO! El stream está ONLINE con el nuevo sistema');
      console.log('✅ El problema de certificado SSL ha sido resuelto');
      if (result.status === 'ssl_error_fixed') {
        console.log('⚠️  Se detectó un error SSL pero fue manejado correctamente');
        console.log('⚠️  El stream debería marcarse como ONLINE en la base de datos');
      }
    } else {
      console.log('❌ El stream sigue apareciendo como OFFLINE');
      console.log('❌ Puede haber otros problemas además del SSL');
    }

  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

// Ejecutar la prueba
testSslVerification().catch(console.error);
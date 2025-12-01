#!/usr/bin/env node

/**
 * Test detallado para Digital FM Arica con logging completo
 */

const https = require('https');

async function testDetailed() {
  console.log('🔍 Test detallado Digital FM Arica');
  console.log('=' .repeat(50));
  
  const url = 'https://radio.digitalfm.cl:8000/arica';
  
  // Test 1: Fetch básico con Node.js
  console.log('\n1️⃣ Test fetch básico:');
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'OndaVerificada-StreamVerifier/1.0',
        'Icy-MetaData': '1'
      },
      signal: AbortSignal.timeout(5000)
    });
    console.log(`✅ Fetch exitoso: ${response.status}`);
  } catch (error) {
    console.log(`❌ Fetch error: ${error.message}`);
    console.log(`   Tipo: ${error.constructor.name}`);
    console.log(`   Código: ${error.code || 'N/A'}`);
  }
  
  // Test 2: HTTPS con agente personalizado
  console.log('\n2️⃣ Test HTTPS con agente personalizado:');
  try {
    const https = require('https');
    const options = {
      hostname: 'radio.digitalfm.cl',
      port: 8000,
      path: '/arica',
      method: 'HEAD',
      headers: {
        'User-Agent': 'OndaVerificada-StreamVerifier/1.0',
        'Icy-MetaData': '1'
      },
      rejectUnauthorized: false,
      secureOptions: require('crypto').constants.SSL_OP_LEGACY_SERVER_CONNECT,
      timeout: 5000
    };
    
    const req = https.request(options, (res) => {
      console.log(`✅ HTTPS request exitoso: ${res.statusCode}`);
      console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);
    });
    
    req.on('error', (error) => {
      console.log(`❌ HTTPS request error: ${error.message}`);
      console.log(`   Código: ${error.code || 'N/A'}`);
    });
    
    req.on('timeout', () => {
      console.log('⏰ HTTPS request timeout');
      req.destroy();
    });
    
    req.end();
    
    // Esperar un poco para que termine la request
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.log(`❌ Error configurando HTTPS: ${error.message}`);
  }
  
  // Test 3: Verificar si el puerto está abierto
  console.log('\n3️⃣ Test conexión puerto 8000:');
  try {
    const net = require('net');
    const socket = new net.Socket();
    
    socket.setTimeout(3000);
    
    socket.on('connect', () => {
      console.log('✅ Puerto 8000 está abierto');
      socket.destroy();
    });
    
    socket.on('error', (error) => {
      console.log(`❌ Error conectando al puerto 8000: ${error.message}`);
    });
    
    socket.on('timeout', () => {
      console.log('⏰ Timeout conectando al puerto 8000');
      socket.destroy();
    });
    
    socket.connect(8000, 'radio.digitalfm.cl');
    
    // Esperar un poco
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.log(`❌ Error test puerto: ${error.message}`);
  }
}

testDetailed().catch(console.error);
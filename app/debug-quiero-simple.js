// Script simple para debuggear FM Quiero
const https = require('https');
const http = require('http');

async function debugFMQuiero() {
  console.log('🔍 Debuggeando FM Quiero...\n');
  
  const quieroUrl = 'streaming-secure.conectaapp.cl';
  const quieroPath = '/fmquiero.cl?token=f2dbfd16fa2ed744b3039c1f8df4986d5682498b74e00ef19d59391d41cfc5fa';
  
  console.log('📻 URL completa:', `https://${quieroUrl}${quieroPath}`);
  
  // Test 1: HEAD request con headers normales
  console.log('\n--- Test 1: HEAD con headers normales ---');
  await testHEADRequest(quieroUrl, quieroPath, {
    'User-Agent': 'OndaVerificada-StreamVerifier/1.0',
    'Accept': 'audio/*, */*'
  });
  
  // Test 2: HEAD request con headers de navegador
  console.log('\n--- Test 2: HEAD con headers de navegador ---');
  await testHEADRequest(quieroUrl, quieroPath, {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0'
  });
  
  // Test 3: GET request con Range header
  console.log('\n--- Test 3: GET con Range header ---');
  await testGETRangeRequest(quieroUrl, quieroPath, {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Range': 'bytes=0-0',
    'Accept': 'audio/*, */*',
    'Icy-MetaData': '1'
  });
}

function testHEADRequest(hostname, path, headers) {
  return new Promise((resolve) => {
    const options = {
      hostname,
      port: 443,
      path,
      method: 'HEAD',
      headers,
      timeout: 15000
    };
    
    const req = https.request(options, (res) => {
      console.log('✅ HEAD Response:');
      console.log('- Status:', res.statusCode);
      console.log('- Status Text:', res.statusMessage);
      console.log('- Headers:', JSON.stringify(res.headers, null, 2));
      
      // Detectar Cloudflare
      const cfRay = res.headers['cf-ray'];
      const server = res.headers['server'];
      const isCloudflare = cfRay || (server && server.toLowerCase().includes('cloudflare'));
      
      if (isCloudflare) {
        console.log('🔒 Cloudflare detectado!');
        console.log('- CF-Ray:', cfRay);
        console.log('- Server:', server);
      }
      
      res.on('data', () => {}); // Consumir datos
      res.on('end', resolve);
    });
    
    req.on('error', (err) => {
      console.log('❌ HEAD Error:', err.message);
      resolve();
    });
    
    req.on('timeout', () => {
      console.log('⏰ HEAD Timeout');
      req.destroy();
      resolve();
    });
    
    req.end();
  });
}

function testGETRangeRequest(hostname, path, headers) {
  return new Promise((resolve) => {
    const options = {
      hostname,
      port: 443,
      path,
      method: 'GET',
      headers,
      timeout: 15000
    };
    
    const req = https.request(options, (res) => {
      console.log('✅ GET Range Response:');
      console.log('- Status:', res.statusCode);
      console.log('- Status Text:', res.statusMessage);
      console.log('- Headers:', JSON.stringify(res.headers, null, 2));
      
      // Detectar Cloudflare
      const cfRay = res.headers['cf-ray'];
      const server = res.headers['server'];
      const isCloudflare = cfRay || (server && server.toLowerCase().includes('cloudflare'));
      
      if (isCloudflare) {
        console.log('🔒 Cloudflare detectado!');
        console.log('- CF-Ray:', cfRay);
        console.log('- Server:', server);
      }
      
      res.on('data', (chunk) => {
        console.log('- Data chunk length:', chunk.length);
      });
      
      res.on('end', resolve);
    });
    
    req.on('error', (err) => {
      console.log('❌ GET Range Error:', err.message);
      resolve();
    });
    
    req.on('timeout', () => {
      console.log('⏰ GET Range Timeout');
      req.destroy();
      resolve();
    });
    
    req.end();
  });
}

// Ejecutar el debug
debugFMQuiero().catch(console.error);
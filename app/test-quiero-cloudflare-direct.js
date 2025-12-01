const https = require('https');

// Función simplificada para probar FM Quiero directamente
async function testFMQuieroDirect() {
  const url = 'https://streaming-secure.conectaapp.cl/fmquiero.cl?token=f2dbfd16fa2ed744b3039c1f8df4986d5682498b74e00ef19d59391d41cfc5fa';
  
  console.log('🧪 Probando FM Quiero directamente...\n');
  
  const options = {
    hostname: 'streaming-secure.conectaapp.cl',
    port: 443,
    path: '/fmquiero.cl?token=f2dbfd16fa2ed744b3039c1f8df4986d5682498b74e00ef19d59391d41cfc5fa',
    method: 'HEAD',
    headers: {
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
    },
    timeout: 10000,
    rejectUnauthorized: false
  };
  
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      console.log(`📊 Status: ${res.statusCode}`);
      console.log(`📋 Headers:`);
      Object.entries(res.headers).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
      
      // Detectar Cloudflare
      const isCloudflare = res.headers.server?.toLowerCase().includes('cloudflare') ||
                          res.headers['cf-ray'] ||
                          res.headers['CF-RAY'];
      
      console.log(`\n🔒 Cloudflare detectado: ${!!isCloudflare}`);
      if (isCloudflare) {
        console.log(`☁️ CF-Ray: ${res.headers['cf-ray'] || res.headers['CF-RAY'] || 'No disponible'}`);
      }
      
      resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        cloudflare: !!isCloudflare
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Error: ${error.message}`);
      resolve({
        statusCode: 0,
        error: error.message,
        cloudflare: false
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.log(`⏰ Timeout`);
      resolve({
        statusCode: 0,
        error: 'Timeout',
        cloudflare: false
      });
    });
    
    req.end();
  });
}

// Ejecutar prueba
testFMQuieroDirect().catch(console.error);
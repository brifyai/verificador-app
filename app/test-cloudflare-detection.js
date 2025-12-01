const https = require('https');
const http = require('http');

// Función para detectar Cloudflare
function detectCloudflare(response) {
  const headers = response.headers;
  
  // Headers característicos de Cloudflare
  const cloudflareHeaders = [
    'cf-ray',
    'cf-cache-status',
    'cf-connecting-ip',
    'cf-visitor',
    'cf-warp-tag'
  ];
  
  // Server header con Cloudflare
  const serverHeader = headers.server || headers['x-server'] || '';
  
  // Verificar headers de Cloudflare
  const hasCloudflareHeaders = cloudflareHeaders.some(header => 
    headers[header] || headers[header.toLowerCase()]
  );
  
  // Verificar si el server es Cloudflare
  const isCloudflareServer = serverHeader.toLowerCase().includes('cloudflare');
  
  // Verificar el contenido del error 403
  const isCloudflare403 = response.statusCode === 403 && (
    headers['content-type']?.includes('text/html') ||
    headers['content-type']?.includes('text/plain')
  );
  
  return {
    isCloudflare: hasCloudflareHeaders || isCloudflareServer,
    hasCloudflareHeaders,
    isCloudflareServer,
    isCloudflare403,
    cfRay: headers['cf-ray'] || headers['CF-RAY'],
    server: serverHeader
  };
}

// Función para verificar stream con detección de Cloudflare
async function verifyStreamWithCloudflareDetection(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'HEAD',
      headers: {
        'User-Agent': 'OndaVerificada-StreamVerifier/1.0',
        'Accept': 'audio/*, */*',
        'Connection': 'close'
      },
      timeout: 10000,
      rejectUnauthorized: false
    };
    
    const req = protocol.request(options, (res) => {
      const cfDetection = detectCloudflare(res);
      
      console.log(`🔍 Verificando: ${url}`);
      console.log(`📊 Status: ${res.statusCode}`);
      console.log(`🔒 Cloudflare detectado: ${cfDetection.isCloudflare}`);
      
      if (cfDetection.isCloudflare) {
        console.log(`☁️ CF-Ray: ${cfDetection.cfRay || 'No disponible'}`);
        console.log(`🖥️ Server: ${cfDetection.server}`);
      }
      
      console.log(`📋 Headers completos:`);
      Object.entries(res.headers).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
      
      resolve({
        statusCode: res.statusCode,
        contentType: res.headers['content-type'],
        cloudflare: cfDetection,
        headers: res.headers
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Error: ${error.message}`);
      resolve({
        statusCode: 0,
        error: error.message,
        cloudflare: { isCloudflare: false }
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.log(`⏰ Timeout después de 10 segundos`);
      resolve({
        statusCode: 0,
        error: 'Timeout',
        cloudflare: { isCloudflare: false }
      });
    });
    
    req.end();
  });
}

// Función para probar con headers de navegador
async function verifyWithBrowserHeaders(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
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
    
    const req = protocol.request(options, (res) => {
      const cfDetection = detectCloudflare(res);
      
      console.log(`\n🔍 Verificando con headers de navegador: ${url}`);
      console.log(`📊 Status: ${res.statusCode}`);
      console.log(`🔒 Cloudflare detectado: ${cfDetection.isCloudflare}`);
      
      if (cfDetection.isCloudflare) {
        console.log(`☁️ CF-Ray: ${cfDetection.cfRay || 'No disponible'}`);
        console.log(`🖥️ Server: ${cfDetection.server}`);
      }
      
      resolve({
        statusCode: res.statusCode,
        contentType: res.headers['content-type'],
        cloudflare: cfDetection,
        headers: res.headers,
        method: 'Browser Headers'
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Error con headers de navegador: ${error.message}`);
      resolve({
        statusCode: 0,
        error: error.message,
        cloudflare: { isCloudflare: false },
        method: 'Browser Headers'
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.log(`⏰ Timeout con headers de navegador`);
      resolve({
        statusCode: 0,
        error: 'Timeout',
        cloudflare: { isCloudflare: false },
        method: 'Browser Headers'
      });
    });
    
    req.end();
  });
}

// Función principal de prueba
async function testCloudflareDetection() {
  const testUrls = [
    'https://streaming-secure.conectaapp.cl/fmquiero.cl?token=f2dbfd16fa2ed744b3039c1f8df4986d5682498b74e00ef19d59391d41cfc5fa',
    'https://radio.digitalfm.cl:8000/arica',
    'https://cast.tunzilla.com/http://sonic.portalfoxmix.club:8106/stream'
  ];
  
  console.log('🧪 Iniciando pruebas de detección de Cloudflare...\n');
  
  for (const url of testUrls) {
    console.log('='.repeat(80));
    
    // Prueba con headers normales
    const normalResult = await verifyStreamWithCloudflareDetection(url);
    
    // Prueba con headers de navegador
    const browserResult = await verifyWithBrowserHeaders(url);
    
    console.log(`\n📊 RESUMEN:`);
    console.log(`URL: ${url}`);
    console.log(`Normal: ${normalResult.statusCode} - Cloudflare: ${normalResult.cloudflare.isCloudflare}`);
    console.log(`Navegador: ${browserResult.statusCode} - Cloudflare: ${browserResult.cloudflare.isCloudflare}`);
    
    if (normalResult.cloudflare.isCloudflare || browserResult.cloudflare.isCloudflare) {
      console.log(`💡 RECOMENDACIÓN: Esta URL está protegida por Cloudflare`);
      if (browserResult.statusCode === 200 && normalResult.statusCode === 403) {
        console.log(`✅ Los headers de navegador funcionan - se puede implementar esta estrategia`);
      }
    }
    
    console.log('\n');
  }
}

// Ejecutar pruebas
testCloudflareDetection().catch(console.error);